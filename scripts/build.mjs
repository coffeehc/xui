import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,readdir,rename,rm,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {generate} from './tokens.mjs';
import {sourceGeneration} from './source-generation.mjs';

/** Validate all outputs before publishing dist. A failed watch never claims a fresh generation. */
export async function buildPackages(){
  await mkdir('.artifacts',{recursive:true});const stage=await mkdtemp(resolve('.artifacts/build-'));
  try{
    const {sourceSha256,sourceFiles}=await sourceGeneration();
    await generate(false,`${stage}/theme`);
    for(const name of ['runtime','ui-react']){
      const files=(await readdir(`packages/${name}/src`)).filter(file=>/\.tsx?$/.test(file)).map(file=>`packages/${name}/src/${file}`);
      await build({entryPoints:files.filter(file=>!file.endsWith('/init.ts')),outdir:`${stage}/${name}`,format:'esm',platform:'browser',target:'es2022',bundle:false,jsx:'automatic'});
      const project={compilerOptions:{declaration:true,emitDeclarationOnly:true,rootDir:resolve(`packages/${name}/src`),outDir:`${stage}/${name}`,jsx:'react-jsx',moduleResolution:'bundler',module:'esnext',target:'es2022',strict:true,skipLibCheck:true,resolveJsonModule:true,...(name==='ui-react'?{paths:{'@coffeehc/xui-runtime': [`${stage}/runtime/index.d.ts`],'@coffeehc/xui-runtime/*': [`${stage}/runtime/*`]}}:{})},files:files.map(file=>resolve(file))};
      await writeFile(`${stage}/${name}.tsconfig.json`,JSON.stringify(project));
      execFileSync('node',['node_modules/typescript/bin/tsc','--project',`${stage}/${name}.tsconfig.json`],{stdio:'inherit'});
    }
    // JSON is both a reviewable public asset and the sole source of embedded defaults.
    // Consumers need no runtime JSON import support and bootstrap makes no hidden fetch.
    await build({entryPoints:['packages/runtime/src/config-defaults.ts'],outfile:`${stage}/runtime/config-defaults.js`,bundle:true,format:'esm',platform:'browser',target:'es2022'});
    await writeFile(`${stage}/runtime/config.json`,await readFile('packages/runtime/src/config.json'));
    await build({entryPoints:['packages/runtime/src/init.ts'],outfile:`${stage}/runtime/init.js`,format:'iife',bundle:true,minify:true,target:'es2022'});
    if((await sourceGeneration()).sourceSha256!==sourceSha256)throw new Error('Source changed during build; retry the complete generation');
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
