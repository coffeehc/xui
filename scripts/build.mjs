import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { generate } from './tokens.mjs';
await generate();
for (const name of ['runtime','ui-react']) {
  await build({ entryPoints:[`packages/${name}/src/index.${name === 'runtime' ? 'ts' : 'tsx'}`], outfile:`packages/${name}/dist/index.js`, format:'esm', platform:'browser', target:'es2022', bundle:true, packages:'external', jsx:'automatic' });
  execFileSync('node',['node_modules/typescript/bin/tsc',`packages/${name}/src/index.${name === 'runtime' ? 'ts' : 'tsx'}`,'--declaration','--emitDeclarationOnly','--outDir',`packages/${name}/dist`,'--jsx','react-jsx','--moduleResolution','bundler','--module','esnext','--target','es2022','--strict','--skipLibCheck'],{stdio:'inherit'});
}
await build({entryPoints:['packages/runtime/src/init.ts'],outfile:'packages/runtime/dist/init.js',format:'iife',bundle:true,minify:true,target:'es2022'});
console.log('Built CSS, ESM, declarations and synchronous theme initializer.');
