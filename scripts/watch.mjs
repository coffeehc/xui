import {watch,readdirSync,statSync} from 'node:fs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const packagesOnly=process.argv.includes('--packages-only');let pending=false,running=false,timer,stopped=false,activeChild;
await mkdir('.artifacts',{recursive:true});
async function rebuild(){
  if(stopped)return;if(running){pending=true;return;}running=true;
  await writeFile('.artifacts/watch-status.json',JSON.stringify({state:'building'}));
  try{await new Promise((resolve,reject)=>{activeChild=spawn(process.execPath,['scripts/dev-build.mjs',...(packagesOnly?['--packages-only']:[])],{stdio:'inherit'});activeChild.once('error',reject);activeChild.once('exit',code=>{activeChild=undefined;code===0?resolve():reject(Error(`Development build exited with code ${code}`));});});const result=JSON.parse(await readFile('.artifacts/dev-build-result.json','utf8'));await writeFile('.artifacts/watch-status.json',JSON.stringify({state:'success',...result}));console.log(`BUILD_SUCCESS ${result.sourceSha256}`);}
  catch(error){await writeFile('.artifacts/watch-status.json',JSON.stringify({state:'error',message:error.message}));console.error(`BUILD_ERROR ${error.message}`);}
  finally{running=false;if(pending){pending=false;await rebuild();}}
}
const request=()=>{clearTimeout(timer);timer=setTimeout(()=>{void rebuild();},80);};
// Watch directory inodes only: Node recursive file watchers can lose atomic saves.
const watchers=[],directories=new Map();
function registerTree(path){
  let entries,ino;try{ino=statSync(path).ino;entries=readdirSync(path,{withFileTypes:true});}catch{directories.get(path)?.watcher.close();directories.delete(path);return;}
  if(directories.get(path)?.ino!==ino){directories.get(path)?.watcher.close();const watcher=watch(path,(event)=>{request();if(event==='rename')registerTree(path);});directories.set(path,{ino,watcher});watchers.push(watcher);}
  for(const entry of entries)if(entry.isDirectory())registerTree(`${path}/${entry.name}`);
}
const treeRoots=['docs','packages/runtime/src','packages/ui-react/src','packages/theme/src','examples','scripts'];treeRoots.forEach(registerTree);
const rootFiles=new Set(['tsconfig.json','package.json','pnpm-lock.yaml']);
watchers.push(watch('.',(_event,name)=>{const path=String(name);if(rootFiles.has(path))request();else if(['docs','examples','scripts'].includes(path)){registerTree(path);request();}}));
for(const name of ['theme','runtime','ui-react'])watchers.push(watch(`packages/${name}`,(_event,file)=>{if(String(file)==='package.json')request();else if(String(file)==='src'){registerTree(`packages/${name}/src`);request();}}));
const shutdown=()=>{stopped=true;clearTimeout(timer);watchers.forEach(watcher=>watcher.close());activeChild?.kill('SIGTERM');};process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
await rebuild();
