import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,symlink,readFile,writeFile,rm,mkdir,rename} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('real watch rebuilds CSS, tokens, TSX, declarations and init; errors preserve the last generation and recover', {timeout:180000},async()=>{
 const fixture=await mkdtemp(resolve(tmpdir(),'xui-watch-'));let child,log='';
 try{
  for(const name of ['docs','scripts','examples','packages','package.json','pnpm-lock.yaml','tsconfig.json'])await cp(name,resolve(fixture,name),{recursive:true,filter:path=>!path.includes('/dist')&&!path.includes('/node_modules')});
  await symlink(resolve('node_modules'),resolve(fixture,'node_modules'),'dir');
  child=spawn(process.execPath,['scripts/watch.mjs'],{cwd:fixture,stdio:['ignore','pipe','pipe']});child.stdout.on('data',chunk=>log+=chunk);child.stderr.on('data',chunk=>log+=chunk);
  const status=async(predicate)=>{const end=Date.now()+30000;while(Date.now()<end){try{const state=JSON.parse(await readFile(resolve(fixture,'.artifacts/watch-status.json'),'utf8'));if(predicate(state))return state;}catch{}await sleep(100);}throw Error(`Watch timed out: ${log.slice(-4000)}`);};
  let current=await status(state=>state.state==='success');
  assert.match(await readFile(resolve(fixture,'dist/foundation-react/app.css'),'utf8'),/xui-shell/);
  assert.match(await readFile(resolve(fixture,'dist/vanilla/app.css'),'utf8'),/xui-nav/);
  for(const kind of ['react','vanilla']){assert.match(await readFile(resolve(fixture,`dist/login-${kind}/app.css`),'utf8'),/xui-login-card/);assert.match(await readFile(resolve(fixture,`dist/audit-${kind}/reference.html`),'utf8'),/html/);}
  const edit=async(path,transform)=>{const full=resolve(fixture,path);await writeFile(full,transform(await readFile(full,'utf8')));const prior=current.sourceSha256;current=await status(state=>state.state==='success'&&state.sourceSha256!==prior);for(const name of ['theme','runtime','ui-react'])assert.equal(JSON.parse(await readFile(resolve(fixture,`packages/${name}/dist/build.json`))).sourceSha256,current.sourceSha256);};
  await edit('docs/DESIGN.md',text=>text.replace('<!-- design-default-css:start -->','<!-- design-default-css:start -->').replace(':root {',':root {\n  /* watch-token-proof */'));
  assert.match(await readFile(resolve(fixture,'packages/theme/dist/tokens.css'),'utf8'),/watch-token-proof/);
  await edit('packages/theme/src/button.css',text=>text+'\n/* watch-css-proof */\n');
  assert.match(await readFile(resolve(fixture,'packages/theme/dist/button.css'),'utf8'),/watch-css-proof/);
  await edit('packages/runtime/src/theme.ts',text=>text.replace('ui.theme.mode','watch.theme.mode')+'\nexport const watchTypeProof: string = "changed";\n');
  assert.match(await readFile(resolve(fixture,'packages/runtime/dist/theme.d.ts'),'utf8'),/watchTypeProof/);
  assert.match(await readFile(resolve(fixture,'packages/runtime/dist/init.js'),'utf8'),/watch.theme.mode/);
  await edit('packages/ui-react/src/button.tsx',text=>text+'\nexport function WatchControlProof(){return <span>watch-control</span>;}\n');
  assert.match(await readFile(resolve(fixture,'packages/ui-react/dist/button.js'),'utf8'),/watch-control/);
  assert.match(await readFile(resolve(fixture,'packages/ui-react/dist/button.d.ts'),'utf8'),/WatchControlProof/);
  await edit('scripts/tokens.mjs',text=>text.replace('  await mkdir(outputDirectory', "  files['tokens.css'] += '\\n/* watch-script-proof */\\n';\n  await mkdir(outputDirectory"));
  assert.match(await readFile(resolve(fixture,'packages/theme/dist/tokens.css'),'utf8'),/watch-script-proof/);
  await edit('packages/ui-react/package.json',text=>text.replace('"version": "0.1.0"','"version": "0.1.1"'));
  const button=resolve(fixture,'packages/ui-react/src/button.tsx');
  await writeFile(button+'.next',(await readFile(button,'utf8'))+'\n// atomic TSX save\n');
  await rename(button+'.next',button);const beforeButton=current.sourceSha256;current=await status(state=>state.state==='success'&&state.sourceSha256!==beforeButton);
  await edit('packages/ui-react/src/button.tsx',text=>text.replace('watch-control','watch-control-after-atomic'));
  assert.match(await readFile(resolve(fixture,'packages/ui-react/dist/button.js'),'utf8'),/watch-control-after-atomic/);
  const manifest=resolve(fixture,'packages/ui-react/package.json');
  await writeFile(manifest+'.next',(await readFile(manifest,'utf8')).replace('"version": "0.1.1"','"version": "0.1.2"'));
  await rename(manifest+'.next',manifest);const beforeAtomic=current.sourceSha256;current=await status(state=>state.state==='success'&&state.sourceSha256!==beforeAtomic);
  await edit('packages/ui-react/package.json',text=>text.replace('"version": "0.1.2"','"version": "0.1.3"'));
  const good=await readFile(resolve(fixture,'packages/runtime/src/theme.ts'),'utf8'),sha=current.sourceSha256;
  await writeFile(resolve(fixture,'packages/runtime/src/theme.ts'),good+'\nconst failedTypeProof: string = 4;\n');
  await status(state=>state.state==='error');assert.equal(JSON.parse(await readFile(resolve(fixture,'.artifacts/latest-build.json'))).sourceSha256,sha);assert.equal(JSON.parse(await readFile(resolve(fixture,'packages/runtime/dist/build.json'))).sourceSha256,sha);
  await writeFile(resolve(fixture,'packages/runtime/src/theme.ts'),good+'\n// recovered generation\n');
  current=await status(state=>state.state==='success'&&state.sourceSha256!==sha);assert.match(log,/BUILD_ERROR/);assert.match(log,/BUILD_SUCCESS/);
 }finally{if(child){child.kill('SIGTERM');await Promise.race([new Promise(resolve=>child.once('exit',resolve)),sleep(2000)]);if(child.exitCode===null)child.kill('SIGKILL');}await rm(fixture,{recursive:true,force:true});}
});
