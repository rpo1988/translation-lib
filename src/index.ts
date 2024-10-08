import { translate } from '@vitalets/google-translate-api';
import * as colors from 'colors/safe';
import { readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { usage } from 'yargs';

import { flat, get, set, sort, titleCase } from './utils';

enum Alias {
   VERSION = 'v',
   HELP = 'h',
   INPUT = 'i',
   SOURCE = 's',
   OUTPUT = 'o',
   TARGET = 't',
   REPLACE = 'r',
   FORMAT_INDENTATION = 'fi'
}

function isValidText(text: string): boolean {
   return typeof text === 'string' && !!text.trim();
}

async function getLangFile(langPath: string, skipError?: boolean): Promise<object> {
   try {
      const inputStr = await readFile(langPath, 'utf8');
      return JSON.parse(inputStr);
   } catch (error) {
      if (skipError) {
         return null;
      }
      throw new Error(`Error reading file ${colors.bold(langPath)} => ` + error);
   }
}

async function init(): Promise<void> {
   try {
      let version;
      try {
         const packageJsonStr = await readFile(resolve('package.json'), { encoding: 'utf8' });
         version = JSON.parse(packageJsonStr).version;
      } catch (error) {
         throw new Error('Error reading package version => ' + error);
      }

      const cli = usage('Extract strings from files for translation.\nUsage: $0 [options]')
         .version(version)
         .alias('version', Alias.VERSION)
         .help('help')
         .alias('help', Alias.HELP)
         .options({
            'input': {
               alias: Alias.INPUT,
               describe: 'Source path from where the texts will be obtained to be translated',
               type: 'string',
               required: true
            },
            'source-language': {
               alias: Alias.SOURCE,
               describe: 'Language code in which the source text is',
               type: 'string',
               required: true
            },
            'output': {
               alias: Alias.OUTPUT,
               describe: 'Target path where the translated texts will be added',
               type: 'string',
               required: true
            },
            'target-languages': {
               alias: Alias.TARGET,
               describe: 'Language code list to be translated',
               type: 'array',
               required: true
            },
            'replace': {
               alias: Alias.REPLACE,
               describe: 'Language code list to be translated',
               type: 'boolean',
               required: false,
               default: false
            },
            'format-indentation': {
               alias: Alias.FORMAT_INDENTATION,
               describe: 'Spacer to build the JSON output',
               type: 'string',
               required: false,
               default: '   '
            }
         })
         .exitProcess(true)
         .parse(process.argv);

      const sourceData: object = await getLangFile(resolve(cli[Alias.INPUT]));
      const sourceTexts: Record<string, string> = flat(sourceData);

      for (const targetLang of cli[Alias.TARGET]) {
         const sourceLang = cli[Alias.SOURCE];
         const targetData: object | null = await getLangFile(join(resolve(cli[Alias.OUTPUT]), `${targetLang}.json`), true);
         const sourceVariableRegex = '{{[^{}]*}}';
         const targetVariableValue = '101101';
         const sourceNewLineRegex = '\n';
         const targetNewLineValue = '010010';

         // Extract texts to be translated
         const sourceTextsToBeTranslated: Record<string, string> = Object.keys(sourceTexts).reduce((acc, key) => {
            if (!isValidText(sourceTexts[key]) || (typeof targetData === 'object' && !cli[Alias.REPLACE] && get(targetData, key))) {
               return acc;
            }
            return { ...acc, [key]: sourceTexts[key] };
         }, {});

         const maxCharacters = 5000;
         const splittedByLimit: string[] = Object.values(sourceTextsToBeTranslated).reduce((acc, text) => {
            const accLimit = acc[acc.length - 1];
            const escapedText = text
               .replace(new RegExp(sourceVariableRegex, 'g'), targetVariableValue)
               .replace(new RegExp(sourceNewLineRegex, 'g'), targetNewLineValue);
            const newAccLimit = `${accLimit}\n${escapedText}`;
            if (!accLimit) {
               acc.push(escapedText);
            } else if (newAccLimit.length > maxCharacters) {
               acc.push(escapedText);
            } else {
               acc.splice(-1, 1, newAccLimit);
            }
            return acc;
         }, []);

         if (!splittedByLimit.length) {
            console.log(colors.cyan(`Nothing to translate into ${colors.bold(targetLang)} lang.`));

            try {
               await writeFile(
                  join(resolve(cli[Alias.OUTPUT]), `${targetLang}.json`),
                  JSON.stringify(sort(targetData), null, cli[Alias.FORMAT_INDENTATION])
               );
            } catch (error) {
               throw new Error(`Error sorting ${colors.bold(targetLang)} lang => ` + error);
            }

            continue;
         }

         // Translate texts by limits
         const requests$ = splittedByLimit.map((texts) => translate(texts, { from: sourceLang, to: targetLang }));
         let responses;
         try {
            responses = await Promise.all(requests$);
         } catch (error) {
            throw new Error(`Error translating ${colors.bold(targetLang)} lang => ` + error);
         }

         // Parse and clean translations
         const textsTranlated: string[] = responses.reduce(
            (acc, res) =>
               acc.concat(
                  ...res.text
                     .split('\n')
                     .map((item) => item.trim())
                     .filter((item) => item)
               ),
            []
         );
         // Build output file
         const outputData = Object.keys(sourceTextsToBeTranslated).reduce(
            (acc, key, index) => {
               let newValue;
               const sourceVariables = sourceTexts[key].match(new RegExp(sourceVariableRegex, 'g'));
               if (sourceVariables) {
                  let variableIndex = 0;
                  newValue = textsTranlated[index].replace(new RegExp(`(?<=[\\s]*)${targetVariableValue}(?=[\\s]*)`, 'g'), () => {
                     return sourceVariables[variableIndex++];
                  });
               } else {
                  newValue = textsTranlated[index];
               }
               const status = set(acc, key, newValue.replace(new RegExp(targetNewLineValue, 'g'), sourceNewLineRegex));

               if (status !== 0) {
                  console.log(colors.yellow(`There was a conflict adding the key ${colors.bold(key)}.`));
               }

               return acc;
            },
            { ...sourceData, ...(cli[Alias.REPLACE] ? {} : targetData) }
         );

         // Create or update output file
         try {
            await writeFile(
               join(resolve(cli[Alias.OUTPUT]), `${targetLang}.json`),
               JSON.stringify(sort(outputData), null, cli[Alias.FORMAT_INDENTATION])
            );
         } catch (error) {
            throw new Error(`Error writing ${colors.bold(targetLang)} lang => ` + error);
         }

         console.log(colors.green(`${colors.bold(titleCase(targetLang))} lang translated successfully.`));
      }
   } catch (error) {
      console.error(colors.red(`Sorry, an error has ocurred\n\n ${error}.`));
   }
}

init();
