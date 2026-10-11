import { mkdir, mkdtemp, readFile, writeFile, cp, copyFile, readdir, realpath } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { extract } from './tokens.mjs';
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
  }
  await writeFile(`dist/${kind}/metafile.json`,JSON.stringify(result.metafile,null,2));
  console.log(`${kind}: tarballs installed, built exports and types consumed; no source aliases.`);
}
