import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {buildPackages} from './build.mjs';
import {buildDevExamples} from './dev.mjs';
const result=await buildPackages();
if(!process.argv.includes('--packages-only')){
 execFileSync(process.execPath,['node_modules/typescript/bin/tsc','--noEmit'],{stdio:'inherit'});
 Object.assign(result,await buildDevExamples());
}
await writeFile('.artifacts/dev-build-result.json',JSON.stringify(result));
