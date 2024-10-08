import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';

const libDir = 'lib';

function copyPackageJson(): void {
   const keysToBeCopied: string[] = [
      'name',
      'description',
      'version',
      'author',
      'license',
      'publishConfig',
      'main',
      'files',
      'bin',
      'keywords',
      'repository',
      'dependencies'
   ];
   const packageJsonStr: string = readFileSync('package.json', {
      encoding: 'utf8'
   });
   const packageJson: object = JSON.parse(packageJsonStr);
   const newPackageJson: object = keysToBeCopied.reduce((json, key) => {
      return { ...json, [key]: key === 'main' ? 'dist/index.js' : packageJson[key] };
   }, {});
   writeFileSync(`${libDir}/package.json`, JSON.stringify(newPackageJson, null, '  '), {
      encoding: 'utf8'
   });
}

function copyCliJs(): void {
   const target = `${libDir}/bin/cli.js`;
   copyFileSync('bin/cli.js', target);
   const cliJsStr: string = readFileSync(target, {
      encoding: 'utf8'
   });
   writeFileSync(target, cliJsStr.replace('/src/', '/'), {
      encoding: 'utf8'
   });
}

function build(): void {
   try {
      if (existsSync(libDir)) {
         console.log('Removing folders...');
         rmSync(libDir, { recursive: true, force: true });
         console.log('Done');
      }

      console.log('Creating folders...');
      mkdirSync(libDir);
      mkdirSync(`${libDir}/bin`);
      mkdirSync(`${libDir}/dist`);
      console.log('Done');

      console.log('Copying files...');
      copyPackageJson();
      copyCliJs();
      copyFileSync('dist/src/index.js', `${libDir}/dist/index.js`);
      copyFileSync('dist/src/utils.js', `${libDir}/dist/utils.js`);
      console.log('Done');

      console.log('Completed successfully');
   } catch (error) {
      console.log('Completed with error', error);
   }
}

build();
