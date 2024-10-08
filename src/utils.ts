const flat = (obj: object, concat = '.'): Record<string, string> =>
   Object.keys(obj).reduce((acc, key) => {
      if (typeof obj[key] !== 'object' || !obj[key]) {
         return {
            ...acc,
            [key]: obj[key]
         };
      }

      const flattenedChild = flat(obj[key], concat);

      return {
         ...acc,
         ...Object.keys(flattenedChild).reduce(
            (childAcc, childKey) => ({ ...childAcc, [`${key}${concat}${childKey}`]: flattenedChild[childKey] }),
            {}
         )
      };
   }, {});

const get = (obj: object, path: string, concat = '.') =>
   (path || '').split(concat).reduce((acc, partial) => (acc && acc[partial] !== null && acc[partial] !== undefined ? acc[partial] : null), obj);

const set = (obj: object, path: string, value: unknown, concat = '.'): number => {
   // If obj is not an object, abort
   if (typeof obj !== 'object') {
      return -1;
   }

   // Get first node
   const [key, ...rest] = path.split(concat);
   // Create node if it is new
   obj[key] = obj[key] || {};

   // If there are more nodes, iterate recursively otherwise set it
   if (rest.length) {
      return set(obj[key], rest.join(concat), value, concat);
   } else {
      obj[key] = value;
      return 0;
   }
};

const sort = (obj) => {
   if (typeof obj !== 'object' || obj instanceof Array) {
      return obj;
   }
   const keys = Object.keys(obj).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
   const newObj = {};
   keys.forEach((key) => {
      newObj[key] = sort(obj[key]);
   });
   return newObj;
};

const titleCase = (str) => {
   if (typeof str !== 'string') {
      return;
   }
   return str
      .split('')
      .map((item, index) => (index ? item : item.toUpperCase()))
      .join('');
};

export { flat, get, set, sort, titleCase };
