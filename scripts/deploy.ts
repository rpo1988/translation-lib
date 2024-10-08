import { execSync } from 'child_process';
import * as colors from 'colors/safe';
import { readFileSync, writeFileSync } from 'fs';
import * as readline from 'readline';

enum ErrorCode {
   EOTP = 'code EOTP'
}

function runCommand(command: string): string {
   const output = execSync(command);
   return output.toString().trim();
}

function askQuestion(query: string): Promise<string> {
   const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
   });

   return new Promise((resolve) =>
      rl.question(query, (answer: string) => {
         rl.close();
         resolve(answer);
      })
   );
}

function checkGitDirectory(): void {
   console.log(colors.cyan('Checking git directory...'));
   const status = runCommand('git status --porcelain');
   if (status !== '') {
      console.log(colors.yellow('Git directory is not clean. Please, commit or discard changes to continue.'));
      process.exit(1); // Salir del script
   }
   console.log(colors.cyan('Done'));
}

function version(answer: string): string {
   console.log(colors.cyan('Versioning...'));
   const newVersion = runCommand(`npm version ${answer}`);
   console.log(colors.cyan('Done'));
   return newVersion;
}

function updatePackageVersion(newVersion: string) {
   console.log(colors.cyan('Updating built package.json...'));
   const libPackage = 'lib/package.json';
   const packageJsonStr: string = readFileSync(libPackage, {
      encoding: 'utf8'
   });
   const packageJson: object = JSON.parse(packageJsonStr);
   packageJson['version'] = newVersion.slice(1); // Remove v from v1.0.1
   writeFileSync(libPackage, JSON.stringify(packageJson, null, '  '), {
      encoding: 'utf8'
   });
   console.log(colors.cyan('Done'));
}

function push(newVersion: string): void {
   console.log(colors.cyan('Pushing changes to Git repository...'));
   runCommand('git push origin master');
   runCommand(`git push origin ${newVersion}`);
   console.log(colors.cyan('Done'));
}

function deploy(otp?: string): void {
   console.log(colors.cyan('Deploying package...'));
   runCommand(`npm publish ./lib --access public${otp ? ` --otp ${otp}` : ''}`);
   console.log(colors.cyan('Done'));
}

function processError(error): void {
   console.error(colors.red(error));
   process.exit(1);
}

async function init(otp?: string): Promise<void> {
   try {
      checkGitDirectory();

      const versionAnswer = await askQuestion('Enter a valid npm version:');

      const newVersion = version(versionAnswer);
      updatePackageVersion(newVersion);
      push(newVersion);

      deploy(otp);
   } catch (error) {
      if (error.stderr.includes(ErrorCode.EOTP)) {
         const otpAnswer = await askQuestion('Enter the OTP code:');
         try {
            deploy(otpAnswer);
         } catch (otpError) {
            processError(otpError);
         }
         return;
      }
      processError(error);
   }
}

init();
