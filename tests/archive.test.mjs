import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cp,mkdir,mkdtemp,readFile,readdir,rm,symlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {createArchive,verifyArchive} from '../scripts/archive.mjs';
import {sourceGeneration} from '../scripts/source-generation.mjs';
import {collectPublicAPI} from '../scripts/public-api.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const readJSON=async file=>JSON.parse(await readFile(file,'utf8'));
const writeJSON=(file,value)=>writeFile(file,JSON.stringify(value,null,2)+'\n');
async function fixture({large=false}={}){
  const root=await mkdtemp(resolve(tmpdir(),'xui-archive-test-'));
  const write=async(path,text)=>{await mkdir(resolve(root,path,'..'),{recursive:true});await writeFile(resolve(root,path),text);};
  const peers={'react':'19.2.8','react-dom':'19.2.8','@base-ui/react':'1.7.0'};
  await write('package.json',JSON.stringify({private:true,devDependencies:peers}));await write('tsconfig.json','{}');
  await write('docs/DESIGN.md','规范版本：1.0.0。\n');await write('scripts/build.mjs','// source identity fixture\n');
  if(large)await write('docs/large-snapshot.txt','large-source-snapshot\n'.repeat(100000));
  await write('.gitignore','.artifacts/\n.consumers/\npackages/*/dist/\n');
  const manifests=[];
  for(const directory of ['theme','runtime','ui-react']){
    const name=`@coffeehc/xui-${directory==='ui-react'?'react':directory}`;
    const manifest={name,version:'1.0.0',private:true,files:['dist'],exports:directory==='theme'?{'./style.css':'./dist/style.css'}:{'.':{import:'./dist/index.js',types:'./dist/index.d.ts'}},...(directory==='ui-react'?{peerDependencies:{'@coffeehc/xui-runtime':'1.0.0',...peers}}:{})};
    manifests.push({directory,manifest});await write(`packages/${directory}/package.json`,JSON.stringify(manifest,null,2)+'\n');
    await write(`packages/${directory}/src/index.${directory==='theme'?'css':'ts'}`,directory==='theme'?':root{}':'export const value=1;');
  }
  const git=(...args)=>execFileSync('git',args,{cwd:root,stdio:'pipe'});
  git('init','-q');git('add','.');git('-c','user.name=Archive Test','-c','user.email=archive@users.noreply.github.com','commit','-qm','fixture');
  const generation=await sourceGeneration(root),packages=[];
  for(const {directory,manifest} of manifests){
    await write(`packages/${directory}/dist/build.json`,JSON.stringify({sourceSha256:generation.sourceSha256}));
    if(directory==='theme')await write(`packages/${directory}/dist/style.css`,':root{}');
    else {await write(`packages/${directory}/dist/index.js`,'export const value=1;');await write(`packages/${directory}/dist/index.d.ts`,'export declare const value: 1; export interface Options { name: string }');}
    const temporary=resolve(root,'.artifacts',`pack-${directory}`);await mkdir(temporary,{recursive:true});await cp(resolve(root,'packages',directory,'dist'),resolve(temporary,'package/dist'),{recursive:true});await cp(resolve(root,'packages',directory,'package.json'),resolve(temporary,'package/package.json'));
    const path=`coffeehc-xui-${directory==='ui-react'?'react':directory}-1.0.0.tgz`,target=resolve(root,'.artifacts',path);
    execFileSync('tar',['-czf',target,'-C',temporary,'package']);packages.push({name:manifest.name,version:'1.0.0',path,sha256:hash(await readFile(target))});
  }
  const api={entries:await collectPublicAPI({root})},consumer='.consumers/run/react';await writeJSON(resolve(root,'.artifacts/public-api.json'),api);
  await write('.artifacts/performance-baseline.json','{"fixture":true}\n');await write(`${consumer}/package.json`,'{}');
  const lock={packages:Object.fromEntries([...Object.entries(peers).map(([name,version])=>[`node_modules/${name}`,{version}]),...manifests.map(({manifest})=>[`node_modules/${manifest.name}`,{version:manifest.version}])])};
  await write(`${consumer}/package-lock.json`,JSON.stringify(lock,null,2)+'\n');
  const receipt={schemaVersion:1,sourceGeneration:generation.sourceSha256,packages,consumer,peers,publicApiSha256:hash(await readFile(resolve(root,'.artifacts/public-api.json'))),performanceSha256:hash(await readFile(resolve(root,'.artifacts/performance-baseline.json'))),packageJsonSha256:hash(await readFile(resolve(root,consumer,'package.json'))),packageLockSha256:hash(await readFile(resolve(root,consumer,'package-lock.json')))};
  await writeJSON(resolve(root,'.artifacts/consumer-validation.json'),receipt);await write('.artifacts/evidence/result.json','{"synthetic":true}\n');
  return {root,generation,receipt};
}

async function checksums(root){
  async function walk(path=''){
    const names=[];for(const item of await readdir(resolve(root,path),{withFileTypes:true})){const file=path?`${path}/${item.name}`:item.name;if(item.isDirectory())names.push(...await walk(file));else if(file!=='SHA256SUMS')names.push(file);}return names.sort();
  }
  const lines=[];for(const file of await walk())lines.push(`${hash(await readFile(resolve(root,file)))}  ${file}\n`);await writeFile(resolve(root,'SHA256SUMS'),lines.join(''));
}

test('archive derives complete API metadata, accepts large source snapshots, and verifies a copied directory',async()=>{
  const {root,generation}=await fixture({large:true});let copied;
  try{
    // A stale convenience file must never become the formal API inventory.
    await writeJSON(resolve(root,'.artifacts/public-api.json'),{entries:[]});
    assert.equal(generation.sourceFiles.length,10);assert.deepEqual(generation.sourceFiles,[...generation.sourceFiles].sort());
    const expected=createHash('sha256');for(const file of generation.sourceFiles)expected.update(file).update(await readFile(resolve(root,file)));
    assert.equal(generation.sourceSha256,expected.digest('hex'),'Keep the original build generation algorithm');
    const result=await createArchive({root,evidence:['.artifacts/evidence']});assert.equal(result.sourceGeneration,generation.sourceSha256);assert.equal(result.publicEntries,3);
    const manifest=await readJSON(resolve(result.directory,'manifest.json'));assert.equal(manifest.schemaVersion,1);assert.deepEqual(manifest.evidence,['validation/evidence/result.json']);
    const api=await readJSON(resolve(result.directory,'metadata/public-api.json'));assert.deepEqual(api.entries.find(entry=>entry.directory==='runtime').values,['value']);assert.deepEqual(api.entries.find(entry=>entry.directory==='runtime').symbols,['Options','value']);
    copied=await mkdtemp(resolve(tmpdir(),'xui-archive-copy-'));await cp(result.directory,copied,{recursive:true});
    await rm(resolve(root,'packages'),{recursive:true});await rm(resolve(root,'.consumers'),{recursive:true});assert.equal((await verifyArchive(copied)).sha256sums,result.sha256sums);
    await assert.rejects(createArchive({root}),/Commit tracked changes/);
  }finally{await rm(root,{recursive:true,force:true});if(copied)await rm(copied,{recursive:true,force:true});}
});

test('archive refuses existing destinations and unpublished/failed consumer generations without leaving partial output',async()=>{
  const {root,receipt}=await fixture();
  try{
    await writeJSON(resolve(root,'.artifacts/consumer-validation.json'),{...receipt,sourceGeneration:'0'.repeat(64)});
    await assert.rejects(createArchive({root}),/test:consumer/);assert(!(await readdir(resolve(root,'.artifacts'))).some(name=>name.startsWith('archive-')||/^public-[a-f0-9]{40}$/.test(name)));
    await writeJSON(resolve(root,'.artifacts/consumer-validation.json'),receipt);
    const result=await createArchive({root});const before=await readFile(resolve(result.directory,'SHA256SUMS'));
    await assert.rejects(createArchive({root}),/Archive already exists/);assert.deepEqual(await readFile(resolve(result.directory,'SHA256SUMS')),before);
  }finally{await rm(root,{recursive:true,force:true});}
});

test('checksum and semantic verification reject missing, extra, corrupt, mixed, and misleading metadata',async t=>{
  const {root}=await fixture();
  try{
    const result=await createArchive({root});
    const cases=[
      ['missing API',async dir=>rm(resolve(dir,'metadata/public-api.json')),false,/ENOENT/],
      ['unlisted file',async dir=>writeFile(resolve(dir,'extra'),'unexpected'),false,/cover every file/],
      ['corrupt tarball',async dir=>writeFile(resolve(dir,'tarballs/coffeehc-xui-runtime-1.0.0.tgz'),'corrupt'),false,/Checksum mismatch/],
      ['missing checksum row',async dir=>{const file=resolve(dir,'SHA256SUMS');await writeFile(file,(await readFile(file,'utf8')).split('\n').filter(line=>!line.endsWith('metadata/public-api.json')).join('\n'));},false,/cover every file/],
      ['lying API after rehash',async dir=>{await writeJSON(resolve(dir,'metadata/public-api.json'),{entries:[]});const manifest=await readJSON(resolve(dir,'manifest.json'));manifest.publicApi.sha256=hash(await readFile(resolve(dir,manifest.publicApi.path)));manifest.publicApi.entries=0;await writeJSON(resolve(dir,'manifest.json'),manifest);const receipt=await readJSON(resolve(dir,manifest.consumer.path));receipt.publicApiSha256=manifest.publicApi.sha256;await writeJSON(resolve(dir,manifest.consumer.path),receipt);manifest.consumer.sha256=hash(await readFile(resolve(dir,manifest.consumer.path)));await writeJSON(resolve(dir,'manifest.json'),manifest);},true,/API metadata differs/],
      ['mixed generation after rehash',async dir=>{const manifest=await readJSON(resolve(dir,'manifest.json'));manifest.sourceGeneration='0'.repeat(64);await writeJSON(resolve(dir,'manifest.json'),manifest);},true,/source generation mismatch/],
      ['different tested packages after rehash',async dir=>{const manifest=await readJSON(resolve(dir,'manifest.json')),receipt=await readJSON(resolve(dir,manifest.consumer.path));receipt.packages[0].sha256='0'.repeat(64);await writeJSON(resolve(dir,manifest.consumer.path),receipt);manifest.consumer.sha256=hash(await readFile(resolve(dir,manifest.consumer.path)));await writeJSON(resolve(dir,'manifest.json'),manifest);},true,/Consumer used different/],
      ['unsafe checksum path',async dir=>writeFile(resolve(dir,'SHA256SUMS'),`${'0'.repeat(64)}  ../outside\n`),false,/Unsafe archive path/]
    ];
    for(const [name,mutate,rehash,error] of cases)await t.test(name,async()=>{const copy=resolve(root,'.artifacts',`case-${name.replaceAll(' ','-')}`);await cp(result.directory,copy,{recursive:true});await mutate(copy);if(rehash)await checksums(copy);await assert.rejects(verifyArchive(copy),error);});
  }finally{await rm(root,{recursive:true,force:true});}
});

test('failed evidence or stale package checks clean their stage and can be retried',async()=>{
  const {root}=await fixture();
  try{
    await symlink(resolve(root,'package.json'),resolve(root,'.artifacts/evidence/link'));
    await assert.rejects(createArchive({root,evidence:['.artifacts/evidence']}),/rejects links/);
    assert(!(await readdir(resolve(root,'.artifacts'))).some(name=>name.startsWith('archive-')||/^public-[a-f0-9]{40}$/.test(name)));
    await rm(resolve(root,'.artifacts/evidence/link'));
    const file=resolve(root,'packages/runtime/dist/index.js'),before=await readFile(file);await writeFile(file,'changed after pack');
    await assert.rejects(createArchive({root}),/Stale packed file/);await writeFile(file,before);
    assert.equal((await createArchive({root})).version,'1.0.0');
  }finally{await rm(root,{recursive:true,force:true});}
});
