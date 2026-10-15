import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,readdir,rename,rm,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {generate} from './tokens.mjs';

/** Validate all outputs before publishing dist. A failed watch never claims a fresh generation. */
export async function buildPackages(){
  await mkdir('.artifacts',{recursive:true});const stage=await mkdtemp(resolve('.artifacts/build-'));
  try{
    const sourceFiles=['docs/DESIGN.md','package.json','tsconfig.json',...(await readdir('scripts')).filter(name=>name.endsWith('.mjs')).map(name=>`scripts/${name}`),...(await readdir('packages/theme/src')).map(name=>`packages/theme/src/${name}`),'packages/theme/package.json'];
    for(const name of ['runtime','ui-react'])sourceFiles.push(...(await readdir(`packages/${name}/src`)).filter(file=>/\.tsx?$/.test(file)).map(file=>`packages/${name}/src/${file}`),`packages/${name}/package.json`);
    const sourceHash=async()=>{const hash=createHash('sha256');for(const file of sourceFiles.sort())hash.update(file).update(await readFile(file));return hash.digest('hex');};
    const sourceSha256=await sourceHash();
    await generate(false,`${stage}/theme`);
    for(const name of ['runtime','ui-react']){
      const files=(await readdir(`packages/${name}/src`)).filter(file=>/\.tsx?$/.test(file)).map(file=>`packages/${name}/src/${file}`);
      await build({entryPoints:files.filter(file=>!file.endsWith('/init.ts')),outdir:`${stage}/${name}`,format:'esm',platform:'browser',target:'es2022',bundle:false,jsx:'automatic'});
      const project={compilerOptions:{declaration:true,emitDeclarationOnly:true,rootDir:resolve(`packages/${name}/src`),outDir:`${stage}/${name}`,jsx:'react-jsx',moduleResolution:'bundler',module:'esnext',target:'es2022',strict:true,skipLibCheck:true,...(name==='ui-react'?{paths:{'@coffeehc/xui-runtime/internal/dialog-layout': [`${stage}/runtime/dialog-layout.d.ts`],'@coffeehc/xui-runtime/internal/navigation-presentation': [`${stage}/runtime/navigation-presentation.d.ts`],'@coffeehc/xui-runtime/internal/overflow-text': [`${stage}/runtime/overflow-text.d.ts`],'@coffeehc/xui-runtime': [`${stage}/runtime/index.d.ts`],'@coffeehc/xui-runtime/*': [`${stage}/runtime/*`]}}:{})},files:files.map(file=>resolve(file))};
      await writeFile(`${stage}/${name}.tsconfig.json`,JSON.stringify(project));
      execFileSync('node',['node_modules/typescript/bin/tsc','--project',`${stage}/${name}.tsconfig.json`],{stdio:'inherit'});
    }
    // Ship a fixed self-contained worker as a lazy data module. Host bundlers need no worker plugin.
    const strengthWorker=await build({entryPoints:['packages/runtime/src/password-strength-worker-entry.ts'],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true});
    await writeFile(`${stage}/runtime/password-strength-worker-source.js`,`export const passwordStrengthWorkerSource=${JSON.stringify(strengthWorker.outputFiles[0].text)};\n`);
    await build({entryPoints:['packages/runtime/src/init.ts'],outfile:`${stage}/runtime/init.js`,format:'iife',bundle:true,minify:true,target:'es2022'});
    if(await sourceHash()!==sourceSha256)throw new Error('Source changed during build; retry the complete generation');
    const published=[],previous=[];
    try{
    for(const name of ['theme','runtime','ui-react']){
      await mkdir(`packages/${name}`,{recursive:true});await writeFile(`${stage}/${name}/build.json`,JSON.stringify({sourceSha256},null,2)+'\n');
      try{await rename(`packages/${name}/dist`,`${stage}/previous-${name}`);previous.push(name);}catch(error){if(error.code!=='ENOENT')throw error;}
      await rename(`${stage}/${name}`,`packages/${name}/dist`);published.push(name);
    }
    await writeFile('.artifacts/latest-build.json',JSON.stringify({sourceSha256,sourceFiles},null,2)+'\n');
    }catch(error){
      for(const name of published)await rm(`packages/${name}/dist`,{recursive:true,force:true});
      for(const name of previous)await rename(`${stage}/previous-${name}`,`packages/${name}/dist`);
      throw error;
    }
    console.log(`Built CSS parts, ESM subentries, declarations and theme init: ${sourceSha256.slice(0,12)}`);return {sourceSha256};
  }finally{await rm(stage,{recursive:true,force:true});}
}
if(import.meta.url===pathToFileURL(process.argv[1]??'').href)await buildPackages();
