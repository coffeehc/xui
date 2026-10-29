import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {gzipSync} from 'node:zlib';

/** Measure the installed public forms, including a single-file host that cannot split imports. */
export async function measurePasswordStrength(cwd,{verify=true}={}){
 const contents=`import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {AdminSetupForm} from '@coffeehc/xui-react/admin-setup';
import {PasswordChangeForm} from '@coffeehc/xui-react/password';
import {PasswordInput} from '@coffeehc/xui-react/text-inputs';
window.passwordViews={AdminSetupForm,PasswordChangeForm};
createRoot(document.getElementById('app')).render(React.createElement(PasswordInput,{"aria-label":"Login password"}));`;
 const results={};
 for(const splitting of [false,true]){
  const result=await build({stdin:{contents,resolveDir:cwd,sourcefile:'password-entry.tsx',loader:'tsx'},outdir:resolve(cwd,'password-measure'),bundle:true,splitting,write:false,preserveSymlinks:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',minify:true,metafile:true,define:{'process.env.NODE_ENV':'"production"'}});
  const outputs=new Map(Object.entries(result.metafile.outputs).map(([path,meta])=>[resolve(path),meta]));
  const entry=[...outputs].find(([,meta])=>meta.entryPoint?.endsWith('password-entry.tsx'));assert(entry);
  const initial=new Set(),visit=path=>{if(initial.has(path))return;initial.add(path);for(const dep of outputs.get(path).imports)if(!dep.external&&dep.kind!=='dynamic-import')visit(resolve(dep.path));};visit(entry[0]);
  const measure=files=>result.outputFiles.filter(file=>files.has(file.path)).reduce((total,file)=>({raw:total.raw+file.contents.length,gzip:total.gzip+gzipSync(file.contents).length}),{raw:0,gzip:0});
  const heavy=[...initial].flatMap(path=>Object.entries(outputs.get(path).inputs).filter(([input,value])=>value.bytesInOutput>0&&/password-strength-worker[^/]*\.js|\/@zxcvbn-ts\//.test(input)).map(([input,value])=>({input:input.replace(cwd+'/',''),bytes:value.bytesInOutput})));
  results[splitting?'split':'singleFile']={initial:measure(initial),async:measure(new Set([...outputs.keys()].filter(path=>!initial.has(path)))),heavyInitial:heavy};
  if(verify){assert.deepEqual(heavy,[],'Strength resources entered the initial graph');assert(results[splitting?'split':'singleFile'].initial.gzip<160000,'The public password forms exceeded their initial JS budget');}
 }
 const asset=resolve(cwd,'node_modules/@coffeehc/xui-runtime/dist/password-strength.worker.js');
 const bytes=await readFile(asset).catch(error=>{if(error.code!=='ENOENT')throw error;return null;});
 results.workerAsset=bytes?{raw:bytes.length,gzip:gzipSync(bytes).length}:null;
 if(verify){
  assert.equal(bytes,null,'The obsolete password dictionary worker must not be shipped');
  assert(!(await readdir(resolve(cwd,'node_modules/@coffeehc/xui-runtime/dist'))).some(file=>file.startsWith('password-strength-worker')), 'A removed dictionary worker remains in the tarball');
 }
 return results;
}

if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname){
 const target=process.argv[2]??'.artifacts/password-strength-4.2.46/bundle.json';
 const result=await measurePasswordStrength(resolve('.consumers/current/react'),{verify:!process.argv.includes('--before')});
 await mkdir(dirname(target),{recursive:true});await writeFile(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}
