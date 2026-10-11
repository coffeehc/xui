import { mkdir, mkdtemp, readFile, writeFile, cp, copyFile, readdir, realpath } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { extract } from './tokens.mjs';
import {gzipSync} from 'node:zlib';
const root = process.cwd(), archives = resolve('.artifacts');
await mkdir(archives,{recursive:true});
const tarballs = [];
for (const pkg of ['theme','runtime','ui-react']) {
  const output = execFileSync('npm',['pack','--json','--pack-destination',archives],{cwd:`packages/${pkg}`,encoding:'utf8',env:{...process.env,npm_config_cache:'/tmp/xui-npm-cache'}});
  const info = JSON.parse(output)[0];
  assert(info.files.every(file => !file.path.startsWith('src/')), 'Packed source unexpectedly');
  tarballs.push(resolve(archives,info.filename));
}
const config = JSON.parse(await readFile('package.json','utf8'));
const performance={budgets:{buttonMinified:65536,buttonGzip:16384,criticalCssGzip:16384,reactInitialJsGzip:131072,vanillaInitialJsGzip:16384},button:[],consumers:[]};
await mkdir('.consumers',{recursive:true});
// A fresh directory prevents npm reusing an earlier tarball with the same version.
const runDirectory = await mkdtemp(resolve('.consumers/run-'));
await writeFile('.consumers/latest.json',JSON.stringify({runDirectory},null,2));
for (const kind of ['vanilla','react']) {
  const cwd = resolve(runDirectory,kind); await mkdir(cwd,{recursive:true});
  const dependencies = Object.fromEntries(tarballs.slice(0,kind === 'react' ? 3 : 2).map((file,index) => [['@coffeehc/xui-theme','@coffeehc/xui-runtime','@coffeehc/xui-react'][index],`file:${file}`]));
  if (kind === 'react') for (const name of ['react','react-dom','@base-ui/react','@types/react','@types/react-dom']) dependencies[name] = config.devDependencies[name];
  await writeFile(`${cwd}/package.json`,JSON.stringify({name:`xui-${kind}-consumer`,private:true,type:'module',dependencies},null,2));
  // npm installs real packed files in a standalone directory, never workspace aliases.
  execFileSync('npm',['install','--no-audit','--no-fund','--ignore-scripts','--cache','/tmp/xui-npm-cache'],{cwd,stdio:'inherit'});
  await cp(`examples/${kind}`,cwd,{recursive:true});
  await copyFile('examples/shared/layout.css',`${cwd}/layout.css`);
  await writeFile(`${cwd}/product.css`,extract(await readFile('docs/DESIGN.md','utf8'),'design-product-css'));
  const require = createRequire(`${cwd}/package.json`);
  assert(!String(await realpath(`${cwd}/node_modules/@coffeehc/xui-runtime`)).includes('/packages/'));
  for (const [name,entry] of [['runtime','index.js'],['theme','style.css'],...(kind === 'react' ? [['react','index.js']] : [])]) {
    const localName = name === 'react' ? 'ui-react' : name;
    assert.equal(await readFile(`${cwd}/node_modules/@coffeehc/xui-${name}/dist/${entry}`,'utf8'),await readFile(`packages/${localName}/dist/${entry}`,'utf8'),'Installed tarball is stale');
  }
  if (kind === 'vanilla') assert(!(await readdir(`${cwd}/node_modules`)).some(name => name === 'react' || name === 'react-dom'));
  await mkdir(`dist/${kind}`,{recursive:true});
  const result = await build({entryPoints:[`${cwd}/app.${kind === 'react' ? 'tsx' : 'js'}`],outfile:`dist/${kind}/app.js`,bundle:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',minify:true,metafile:true,define:{'process.env.NODE_ENV':'"production"'}});
  assert(Object.keys(result.metafile.inputs).every(file => !file.startsWith('packages/')), 'Build read monorepo package source');
  await copyFile(`${cwd}/index.html`,`dist/${kind}/index.html`);
  await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'),`dist/${kind}/theme-init.js`);
  const initializer = await build({stdin:{contents:"import '@coffeehc/xui-runtime/init.js';",resolveDir:cwd,sourcefile:'theme-init-consumer.js'},bundle:true,format:'iife',platform:'browser',target:'es2022',write:false,metafile:true});
  assert(Object.values(initializer.metafile.outputs).some(output => Object.entries(output.inputs).some(([path,data]) => path.endsWith('/@coffeehc/xui-runtime/dist/init.js') && data.bytesInOutput > 0)), 'Theme initializer was tree-shaken from the packed consumer');
  await writeFile(`${cwd}/types.ts`,"import { createThemeController, type ThemeMode } from '@coffeehc/xui-runtime';\nconst mode: ThemeMode = 'system'; createThemeController().setMode(mode);\n");
  execFileSync('node',[`${root}/node_modules/typescript/bin/tsc`,'--noEmit','--strict','--skipLibCheck','--target','es2022','--moduleResolution','bundler','--module','esnext','--jsx','react-jsx',kind === 'react' ? 'app.tsx' : 'types.ts'],{cwd,stdio:'inherit'});
  if (kind === 'react') {
    await copyFile('tests/fixtures/peer-contract.tsx',`${cwd}/peer-contract.tsx`);
    const fixture = await build({entryPoints:[`${cwd}/peer-contract.tsx`],outfile:'dist/react/peer-contract.js',bundle:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',metafile:true,define:{'process.env.NODE_ENV':'"production"'}});
    assert(Object.keys(fixture.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Peer fixture read outside the packed consumer');
    execFileSync('node',[`${root}/node_modules/typescript/bin/tsc`,'--noEmit','--strict','--skipLibCheck','--target','es2022','--moduleResolution','bundler','--module','esnext','--jsx','react-jsx','peer-contract.tsx'],{cwd,stdio:'inherit'});
    await writeFile('dist/react/peer-contract.html','<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><link rel="stylesheet" href="./peer-contract.css"></head><body><div id="root"></div><script type="module" src="./peer-contract.js"></script></body></html>');
    await copyFile('tests/fixtures/foundation-contract.tsx',`${cwd}/foundation-contract.tsx`);
    const foundationFixture=await build({entryPoints:[`${cwd}/foundation-contract.tsx`],outfile:'dist/react/foundation-contract.js',bundle:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',metafile:true,define:{'process.env.NODE_ENV':'"production"'}});
    assert(Object.keys(foundationFixture.metafile.inputs).every(file=>resolve(file).startsWith(`${cwd}/`)),'Foundation fixture read outside packed consumer');
    execFileSync('node',[`${root}/node_modules/typescript/bin/tsc`,'--noEmit','--strict','--skipLibCheck','--target','es2022','--moduleResolution','bundler','--module','esnext','--jsx','react-jsx','foundation-contract.tsx'],{cwd,stdio:'inherit'});
    await writeFile('dist/react/foundation-contract.html','<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><link rel="stylesheet" href="./foundation-contract.css"></head><body class="xui"><div id="root"></div><script type="module" src="./foundation-contract.js"></script></body></html>');
    await copyFile('tests/fixtures/nav-contract.tsx',`${cwd}/nav-contract.tsx`);
    const navFixture=await build({entryPoints:[`${cwd}/nav-contract.tsx`],outfile:'dist/react/nav-contract.js',bundle:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',metafile:true,define:{'process.env.NODE_ENV':'"production"'}});
    assert(Object.keys(navFixture.metafile.inputs).every(file=>resolve(file).startsWith(`${cwd}/`)),'Nav fixture read outside packed consumer');
    for(const [name,entry] of [['react','navigation.js'],['theme','navigation.css']])assert.equal(await readFile(`${cwd}/node_modules/@coffeehc/xui-${name}/dist/${entry}`,'utf8'),await readFile(`packages/${name==='react'?'ui-react':name}/dist/${entry}`,'utf8'),'Nav fixture installed stale output');
    execFileSync('node',[`${root}/node_modules/typescript/bin/tsc`,'--noEmit','--strict','--skipLibCheck','--target','es2022','--moduleResolution','bundler','--module','esnext','--jsx','react-jsx','nav-contract.tsx'],{cwd,stdio:'inherit'});
    await writeFile('dist/react/nav-contract.html','<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><link rel="stylesheet" href="./nav-contract.css"></head><body class="xui"><div id="root"></div><script type="module" src="./nav-contract.js"></script></body></html>');
    await writeFile('dist/react/nav-destination.html','<!doctype html><html><head><meta charset="utf-8"><title>Native link destination</title></head><body>Native link destination</body></html>');
  }
  await writeFile(`dist/${kind}/metafile.json`,JSON.stringify(result.metafile,null,2));
  const menu=resolve(cwd,'menu'),menuOutput=resolve(`dist/menu-${kind}`);
  await cp(`examples/menu-${kind}`,menu,{recursive:true});await mkdir(`${cwd}/shared`,{recursive:true});await copyFile('examples/shared/menu-data.json',`${cwd}/shared/menu-data.json`);
  const menuBuild=await build({entryPoints:[`${menu}/app.${kind==='react'?'tsx':'js'}`],outdir:menuOutput,bundle:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',minify:true,metafile:true,define:{'process.env.NODE_ENV':'"production"'}});
  assert(Object.keys(menuBuild.metafile.inputs).every(file=>resolve(file).startsWith(`${cwd}/`)),'Menu consumer escaped its standalone install');
  assert(!Object.keys(menuBuild.metafile.inputs).some(file=>file.endsWith('.css')&&!file.includes('/@coffeehc/xui-theme/')),'Menu consumer depends on private CSS');
  await copyFile(`${menu}/index.html`,`${menuOutput}/index.html`);await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'),`${menuOutput}/theme-init.js`);
  await copyFile('examples/shared/menu-destination.html',`${menuOutput}/destination.html`);
  await writeFile(`${menuOutput}/metafile.json`,JSON.stringify(menuBuild.metafile,null,2));
  await writeFile(`${menu}/types.ts`,"import {type NavigationItem, type NavigationMenuOptions} from '@coffeehc/xui-runtime/navigation';\nimport {createMenuLayout} from '@coffeehc/xui-runtime/menu-layout';\nconst items:NavigationItem[]=[{id:'page',label:'页面',href:'/'}];const options:NavigationMenuOptions={items};createMenuLayout(document.createElement('div'),options).update({activeId:null});\n");
  execFileSync('node',[`${root}/node_modules/typescript/bin/tsc`,'--noEmit','--strict','--skipLibCheck','--target','es2022','--moduleResolution','bundler','--module','esnext','--jsx','react-jsx','--resolveJsonModule',kind==='react'?'menu/app.tsx':'menu/types.ts'],{cwd,stdio:'inherit'});
  const http=resolve(cwd,'http'),httpOutput=resolve(`dist/http-${kind}`);await cp(`examples/http-${kind}`,http,{recursive:true});await copyFile('examples/shared/http-model.ts',`${cwd}/shared/http-model.ts`);
  const httpBuild=await build({entryPoints:[`${http}/app.${kind==='react'?'tsx':'js'}`],outdir:httpOutput,bundle:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',minify:true,metafile:true,define:{'process.env.NODE_ENV':'"production"'}});
  assert(Object.keys(httpBuild.metafile.inputs).every(file=>resolve(file).startsWith(`${cwd}/`)),'HTTP consumer escaped its standalone install');assert(!Object.keys(httpBuild.metafile.inputs).some(file=>file.endsWith('.css')&&!file.includes('/@coffeehc/xui-theme/')),'HTTP consumer depends on private CSS');
  await copyFile(`${http}/index.html`,`${httpOutput}/index.html`);await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'),`${httpOutput}/theme-init.js`);await writeFile(`${httpOutput}/metafile.json`,JSON.stringify(httpBuild.metafile,null,2));
  execFileSync('node',[`${root}/node_modules/typescript/bin/tsc`,'--noEmit','--strict','--skipLibCheck','--target','es2022','--moduleResolution','bundler','--module','esnext','--jsx','react-jsx',kind==='react'?'http/app.tsx':'shared/http-model.ts'],{cwd,stdio:'inherit'});
  const foundation=resolve(cwd,'foundation');await cp(`examples/foundation-${kind}`,foundation,{recursive:true});
  const output=resolve(`dist/foundation-${kind}`);
  const built=await build({entryPoints:{app:`${foundation}/app.${kind==='react'?'tsx':'js'}`,'heavy-panel':`${foundation}/heavy-panel.${kind==='react'?'tsx':'js'}`},outdir:output,chunkNames:'chunks/[name]-[hash]',bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',minify:true,metafile:true,define:{'process.env.NODE_ENV':'"production"'}});
  assert(Object.keys(built.metafile.inputs).every(file=>resolve(file).startsWith(`${cwd}/`)),'Foundation consumer escaped its standalone install');
  assert(!Object.keys(built.metafile.inputs).some(file=>file.endsWith('/layout.css')&&!file.includes('/@coffeehc/xui-theme/')),'Foundation depends on private demo layout CSS');
  await copyFile(`${foundation}/index.html`,`${output}/index.html`);await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'),`${output}/theme-init.js`);await copyFile(require.resolve('@coffeehc/xui-theme/floating.css'),`${output}/optional.css`);
  if(kind==='react')execFileSync('node',[`${root}/node_modules/typescript/bin/tsc`,'--noEmit','--strict','--skipLibCheck','--target','es2022','--moduleResolution','bundler','--module','esnext','--jsx','react-jsx','foundation/app.tsx','foundation/heavy-panel.tsx'],{cwd,stdio:'inherit'});
  const files=built.metafile.outputs;const initial=new Set();
  function visit(path){const normalized=resolve(path);if(initial.has(normalized))return;initial.add(normalized);for(const item of files[Object.keys(files).find(file=>resolve(file)===normalized)]?.imports??[])if(!item.external&&item.kind==='import-statement')visit(item.path);}
  visit(`${output}/app.js`);let initialJs=0,initialJsGzip=0;for(const file of initial){const bytes=await readFile(file);initialJs+=bytes.length;initialJsGzip+=gzipSync(bytes).length;}
  const initBytes=await readFile(`${output}/theme-init.js`);initialJs+=initBytes.length;initialJsGzip+=gzipSync(initBytes).length;
  const html=await readFile(`${output}/index.html`);const inline=[...html.toString().matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).filter(Boolean);const inlineJs=inline.reduce((sum,text)=>sum+Buffer.byteLength(text),0),inlineJsGzip=inline.reduce((sum,text)=>sum+gzipSync(text).length,0);initialJs+=inlineJs;initialJsGzip+=inlineJsGzip;
  const css=await readFile(`${output}/app.css`),cssGzip=gzipSync(css).length;
  assert(cssGzip<=performance.budgets.criticalCssGzip,'Critical CSS gzip budget');
  assert(initialJsGzip<=performance.budgets[kind==='react'?'reactInitialJsGzip':'vanillaInitialJsGzip'],'Initial JS gzip budget');
  assert(!initial.has(`${output}/heavy-panel.js`),'Optional panel included in initial graph');
  performance.consumers.push({kind,initialJs,initialJsGzip,inlineJs,inlineJsGzip,htmlGzip:gzipSync(html).length,criticalCss:css.length,criticalCssGzip:cssGzip,initialFiles:[...initial].map(file=>file.replace(output+'/','')).concat('theme-init.js'),optionalPanel:(await readFile(`${output}/heavy-panel.js`)).length});
  await writeFile(`${output}/metafile.json`,JSON.stringify(built.metafile,null,2));
  if(kind==='react')for(const entry of ['','/button']){
    const only=await build({stdin:{contents:`import {Button} from '@coffeehc/xui-react${entry}';window.xuiButton=Button;`,resolveDir:cwd,sourcefile:'button-only.js'},bundle:true,format:'esm',minify:true,write:false,metafile:true,platform:'browser',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
    const contributing=Object.values(only.metafile.outputs).flatMap(file=>Object.entries(file.inputs).filter(([,data])=>data.bytesInOutput>0).map(([path,data])=>({path,bytesInOutput:data.bytesInOutput})));
    assert(!contributing.some(file=>/\/(?:dialog|tabs|menu|popover|combobox|select|toast)\/|\/dist\/(?:dialog|tabs|menu|menu-layout|navigation|popover|combobox|select|toast)\.js/.test(file.path)),'Button-only includes unrelated component code');
    const bytes=only.outputFiles[0].contents,minified=bytes.length,gzip=gzipSync(bytes).length;assert(minified<=performance.budgets.buttonMinified&&gzip<=performance.budgets.buttonGzip,'Button-only size budget');
    performance.button.push({entry:entry||'root',minified,gzip,contributing:contributing.map(file=>({...file,path:file.path.replace(cwd+'/','')}))});
  }
  console.log(`${kind}: tarballs installed, built exports and types consumed; no source aliases.`);
}
await writeFile('.artifacts/performance-baseline.json',JSON.stringify(performance,null,2)+'\n');
console.log('Public layouts, dynamic panel entries, Button-only contribution and gzip gates passed.');
