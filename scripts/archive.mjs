import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {copyFile,lstat,mkdir,mkdtemp,open,readFile,readdir,realpath,rename,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename,dirname,isAbsolute,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {collectPublicAPI} from './public-api.mjs';
import {sourceGeneration} from './source-generation.mjs';

const directories=['theme','runtime','ui-react'];
const json=file=>readFile(file,'utf8').then(JSON.parse);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const digest=async file=>hash(await readFile(file));
const writeJSON=(file,value)=>writeFile(file,JSON.stringify(value,null,2)+'\n');
const git=(root,...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}).trim();

function safePath(path){
  assert(typeof path==='string'&&path.length>0&&!isAbsolute(path)&&!/[\\\r\n\t]/.test(path)&&!path.split('/').some(part=>part==='..'||part==='.'||part===''),'Unsafe archive path');
  return path;
}

async function files(root,prefix=''){
  const result=[];
  for(const name of await readdir(resolve(root,prefix))){
    const path=safePath(prefix?`${prefix}/${name}`:name),stat=await lstat(resolve(root,path));
    if(stat.isDirectory())result.push(...await files(root,path));
    else {assert(stat.isFile(),`Archive rejects links and special files: ${path}`);result.push(path);}
  }
  return result.sort();
}

// Validate before extraction; source and npm archives need only regular files/directories.
async function extract(archive,destination){
  const run=args=>execFileSync('tar',args,{encoding:'utf8',maxBuffer:32*1024*1024});
  const names=run(['-tf',archive]).trim().split('\n').map(name=>safePath(name.replace(/\/$/,'')));
  assert.equal(new Set(names).size,names.length,'Duplicate tar entry');
  assert(run(['-tvf',archive]).trim().split('\n').every(line=>/^[-d]/.test(line)),'Tar contains a link or unsupported entry');
  await mkdir(destination,{recursive:true});
  run(['-xf',archive,'--no-same-owner','-C',destination]);
}

async function metadata(root,path){return {path,sha256:await digest(resolve(root,path))};}

/** Verify a copied archive without relying on the current checkout, dist, or receipt. */
export async function verifyArchive(directory){
  const archive=resolve(directory),actual=await files(archive),lines=(await readFile(resolve(archive,'SHA256SUMS'),'utf8')).trim().split('\n'),listed=[];
  for(const line of lines){
    const match=/^([a-f0-9]{64})  (.+)$/.exec(line);assert(match,'Invalid SHA256SUMS line');
    const path=safePath(match[2]);assert.notEqual(path,'SHA256SUMS','Checksum list cannot hash itself');
    assert.equal(await digest(resolve(archive,path)),match[1],`Checksum mismatch: ${path}`);listed.push(path);
  }
  assert.deepEqual(listed,actual.filter(path=>path!=='SHA256SUMS'),'SHA256SUMS must cover every file exactly once in sorted order');
  await readFile(resolve(archive,'README.md'));
  const manifest=await json(resolve(archive,'manifest.json'));
  assert.equal(manifest.schemaVersion,1,'Unsupported archive schema');
  assert.match(manifest.commit,/^[a-f0-9]{40}$/);assert.match(manifest.sourceGeneration,/^[a-f0-9]{64}$/);
  assert.equal(manifest.source.path,'source/xui-source.tar');
  assert.equal(manifest.generation.path,'metadata/source-generation.json');
  assert.equal(manifest.publicApi.path,'metadata/public-api.json');
  assert.equal(manifest.consumer.path,'metadata/consumer-validation.json');
  assert.equal(manifest.performance.path,'metadata/performance-baseline.json');
  for(const item of [manifest.source,manifest.generation,manifest.publicApi,manifest.consumer,manifest.performance,...manifest.packages]){
    assert.equal(await digest(resolve(archive,safePath(item.path))),item.sha256,`Manifest digest mismatch: ${item.path}`);
  }
  const workspace=await mkdtemp(resolve(tmpdir(),'xui-archive-verify-'));
  try{
    const source=resolve(workspace,'source'),built=resolve(workspace,'built');
    const sourceTar=resolve(archive,manifest.source.path);
    // Git stops after the PAX header. A buffered stdin pipe can report EPIPE for
    // a large tar despite Git succeeding; a file descriptor has no pipe writer.
    const input=await open(sourceTar,'r');let commit;
    try{commit=execFileSync('git',['get-tar-commit-id'],{stdio:[input.fd,'pipe','pipe'],encoding:'utf8'}).trim();}
    finally{await input.close();}
    assert.equal(commit,manifest.commit,'Source tar commit mismatch');
    await extract(sourceTar,source);
    const generation=await sourceGeneration(source);
    assert.equal(generation.sourceSha256,manifest.sourceGeneration,'Archived source generation mismatch');
    assert.deepEqual(await json(resolve(archive,manifest.generation.path)),{sourceGeneration:generation.sourceSha256,sourceFiles:generation.sourceFiles});
    assert.equal(manifest.packages.length,directories.length,'Exactly three packages are required');
    const receipt=await json(resolve(archive,manifest.consumer.path));
    assert.equal(receipt.schemaVersion,1);assert.equal(receipt.sourceGeneration,manifest.sourceGeneration);
    assert.equal(receipt.publicApiSha256,manifest.publicApi.sha256);assert.equal(receipt.performanceSha256,manifest.performance.sha256);
    for(const [index,name] of directories.entries()){
      const item=manifest.packages[index],expectedName=`@coffeehc/xui-${name==='ui-react'?'react':name}`;
      assert.equal(item.name,expectedName);assert.equal(item.version,manifest.version);
      assert.equal(item.path,`tarballs/coffeehc-xui-${name==='ui-react'?'react':name}-${manifest.version}.tgz`);
      const temporary=resolve(workspace,`unpack-${name}`);await extract(resolve(archive,item.path),temporary);
      assert.deepEqual(await readdir(temporary),['package'],'Unexpected package archive root');
      await mkdir(resolve(built,'packages'),{recursive:true});await rename(resolve(temporary,'package'),resolve(built,'packages',name));
      const pkg=resolve(built,'packages',name),packed=await json(resolve(pkg,'package.json'));
      assert.equal(await readFile(resolve(pkg,'package.json'),'utf8'),await readFile(resolve(source,'packages',name,'package.json'),'utf8'),'Source/packed manifest drift');
      assert.equal(packed.name,item.name);assert.equal(packed.version,manifest.version);
      assert.equal((await json(resolve(pkg,'dist/build.json'))).sourceSha256,manifest.sourceGeneration,'Mixed package generations');
      assert(!(await files(pkg)).some(file=>file.startsWith('src/')),'Packed package contains sources');
      for(const value of Object.values(packed.exports))for(const target of typeof value==='string'?[value]:[value.import,value.types]){
        assert(target?.startsWith('./dist/'),'Unsupported public target');safePath(target.slice(2));await readFile(resolve(pkg,target));
      }
      const checked=receipt.packages.filter(entry=>entry.name===item.name);assert.equal(checked.length,1);
      assert.deepEqual(checked[0],{name:item.name,version:item.version,path:basename(item.path),sha256:item.sha256},'Consumer used different packages');
    }
    assert.equal(receipt.packages.length,3);
    const react=await json(resolve(built,'packages/ui-react/package.json'));
    assert.equal(react.peerDependencies['@coffeehc/xui-runtime'],manifest.version,'Runtime peer must match package version');
    const design=await readFile(resolve(source,'docs/DESIGN.md'),'utf8');assert(design.includes(`规范版本：${manifest.version}。`),'DESIGN/package version mismatch');
    const api={entries:await collectPublicAPI({root:built})};
    assert.deepEqual(await json(resolve(archive,manifest.publicApi.path)),api,'API metadata differs from actual packaged declarations');
    assert.equal(manifest.publicApi.entries,api.entries.length);
    const lock=await json(resolve(archive,'metadata/consumer/package-lock.json'));
    assert.equal(await digest(resolve(archive,'metadata/consumer/package.json')),receipt.packageJsonSha256);
    assert.equal(await digest(resolve(archive,'metadata/consumer/package-lock.json')),receipt.packageLockSha256);
    const config=await json(resolve(source,'package.json'));
    for(const name of ['react','react-dom','@base-ui/react']){
      assert.equal(receipt.peers[name],config.devDependencies[name]);
      const matches=Object.entries(lock.packages).filter(([path])=>path.endsWith(`node_modules/${name}`));
      assert.equal(matches.length,1,`${name} must remain a single consumer instance`);assert.equal(matches[0][1].version,receipt.peers[name]);
    }
    for(const item of manifest.packages)assert.equal(lock.packages[`node_modules/${item.name}`].version,manifest.version);
    const evidence=actual.filter(path=>path.startsWith('validation/'));
    assert.deepEqual(manifest.evidence,evidence,'Evidence inventory mismatch');
    return {directory:archive,commit:manifest.commit,version:manifest.version,sourceGeneration:manifest.sourceGeneration,publicEntries:api.entries.length,checksumEntries:listed.length,sha256sums:await digest(resolve(archive,'SHA256SUMS'))};
  }finally{await rm(workspace,{recursive:true,force:true});}
}

/** Publish one immutable, completely verified snapshot. Never repair an existing directory. */
export async function createArchive({root=process.cwd(),evidence=[]}={}){
  root=await realpath(root);assert.equal(git(root,'rev-parse','--show-toplevel'),root,'Run archive at the repository root');
  const clean=()=>assert.equal(git(root,'status','--porcelain','--untracked-files=no'),'','Commit tracked changes before archiving');
  clean();const commit=git(root,'rev-parse','HEAD'),destination=resolve(root,`.artifacts/public-${commit}`);
  await assert.rejects(lstat(destination),{code:'ENOENT'},'Archive already exists; use archive:verify, never overwrite');
  const generation=await sourceGeneration(root),receipt=await json(resolve(root,'.artifacts/consumer-validation.json'));
  assert.equal(receipt.sourceGeneration,generation.sourceSha256,'Run build and test:consumer for this source generation');
  await mkdir(resolve(root,'.artifacts'),{recursive:true});const stage=await mkdtemp(resolve(root,'.artifacts/archive-'));
  try{
    for(const dir of ['metadata/consumer','tarballs','source','validation'])await mkdir(resolve(stage,dir),{recursive:true});
    git(root,'archive','--format=tar',`--output=${resolve(stage,'source/xui-source.tar')}`,commit);
    const packages=[];
    for(const name of directories){
      const pkg=await json(resolve(root,'packages',name,'package.json')),filename=`coffeehc-xui-${name==='ui-react'?'react':name}-${pkg.version}.tgz`;
      await copyFile(resolve(root,'.artifacts',filename),resolve(stage,'tarballs',filename));
      packages.push({name:pkg.name,version:pkg.version,...await metadata(stage,`tarballs/${filename}`)});
    }
    await writeJSON(resolve(stage,'metadata/source-generation.json'),{sourceGeneration:generation.sourceSha256,sourceFiles:generation.sourceFiles});
    // Derive from the exact packed declarations, never copy a possibly stale global API file.
    const apiRoot=await mkdtemp(resolve(stage,'.api-'));
    try{
      for(const [index,name] of directories.entries()){
        const unpack=resolve(apiRoot,`unpack-${name}`);await extract(resolve(stage,packages[index].path),unpack);
        await mkdir(resolve(apiRoot,'packages'),{recursive:true});await rename(resolve(unpack,'package'),resolve(apiRoot,'packages',name));
        const local=resolve(root,'packages',name),packed=resolve(apiRoot,'packages',name);
        for(const file of ['package.json',...await files(resolve(packed,'dist')).then(names=>names.map(file=>`dist/${file}`))])assert.deepEqual(await readFile(resolve(packed,file)),await readFile(resolve(local,file)),`Stale packed file: ${name}/${file}`);
        assert.deepEqual(await files(resolve(packed,'dist')),await files(resolve(local,'dist')),'Packed dist inventory differs');
      }
      const api={entries:await collectPublicAPI({root:apiRoot})};await writeJSON(resolve(stage,'metadata/public-api.json'),api);
    }finally{await rm(apiRoot,{recursive:true,force:true});}
    await copyFile(resolve(root,'.artifacts/consumer-validation.json'),resolve(stage,'metadata/consumer-validation.json'));
    await copyFile(resolve(root,'.artifacts/performance-baseline.json'),resolve(stage,'metadata/performance-baseline.json'));
    safePath(receipt.consumer);assert(receipt.consumer.startsWith('.consumers/'),'Consumer receipt must point to a standalone install');
    for(const file of ['package.json','package-lock.json'])await copyFile(resolve(root,receipt.consumer,file),resolve(stage,'metadata/consumer',file));
    for(const input of evidence){
      const source=resolve(root,input),name=safePath(basename(source));assert(!relative(root,source).startsWith('..')&&source!==root,'Evidence must be inside xui');
      assert(!stage.startsWith(source+'/'),'Evidence cannot contain the archive staging directory');
      const target=resolve(stage,'validation',name);await assert.rejects(lstat(target),{code:'ENOENT'},'Duplicate evidence name');
      const stat=await lstat(source);assert(stat.isFile()||stat.isDirectory(),'Evidence must be regular files/directories');
      if(stat.isDirectory())for(const file of await files(source)){assert(!file.split('/').some(part=>['node_modules','.git'].includes(part)),'Do not archive dependency or Git stores');await mkdir(dirname(resolve(target,file)),{recursive:true});await copyFile(resolve(source,file),resolve(target,file));}
      else await copyFile(source,target);
    }
    const api=await json(resolve(stage,'metadata/public-api.json'));
    const manifest={schemaVersion:1,commit,version:packages[0].version,sourceGeneration:generation.sourceSha256,packages,
      source:await metadata(stage,'source/xui-source.tar'),generation:await metadata(stage,'metadata/source-generation.json'),
      publicApi:{...await metadata(stage,'metadata/public-api.json'),entries:api.entries.length},
      consumer:await metadata(stage,'metadata/consumer-validation.json'),performance:await metadata(stage,'metadata/performance-baseline.json'),
      evidence:(await files(stage)).filter(path=>path.startsWith('validation/'))};
    await writeJSON(resolve(stage,'manifest.json'),manifest);
    await writeFile(resolve(stage,'README.md'),`# XUI ${manifest.version} formal archive\n\nCommit: ${commit}\nSource generation: ${manifest.sourceGeneration}\n\nGenerated by pnpm archive. manifest.json (schemaVersion 1) binds three exact tested tarballs, source/xui-source.tar, metadata/source-generation.json and metadata/public-api.json (${api.entries.length} entries). The API file retains the {entries} format and is derived from packed declarations.\n\nAll SHA-256 digests hash complete file bytes. Source generation hashes each sorted UTF-8 sourceFiles path followed by its exact bytes, without separators, using the build algorithm. SHA256SUMS covers every regular file except itself; its own digest is printed by archive:verify.\n\nRun pnpm archive:verify <directory> from an installed xui checkout to verify a copied archive without depending on that checkout's source or dist. Existing archives are never overwritten. No npm publish, product upgrade or browser/backend acceptance is implied. metadata/consumer-validation.json records successful formal consumer validation; optional validation/ files preserve only the explicitly supplied evidence, without inventing test counts.\n`);
    const sums=[];for(const file of await files(stage))sums.push(`${await digest(resolve(stage,file))}  ${file}\n`);
    await writeFile(resolve(stage,'SHA256SUMS'),sums.join(''));
    const result=await verifyArchive(stage);
    assert.equal((await sourceGeneration(root)).sourceSha256,generation.sourceSha256,'Source changed during archive creation');clean();assert.equal(git(root,'rev-parse','HEAD'),commit,'HEAD changed during archive creation');
    await rename(stage,destination);return {...result,directory:destination};
  }finally{await rm(stage,{recursive:true,force:true});}
}

if(import.meta.url===pathToFileURL(process.argv[1]??'').href){
  try{
    const args=process.argv.slice(2);
    if(args[0]==='--verify'){
      assert.equal(args.length,2,'Usage: pnpm archive:verify <directory>');console.log(JSON.stringify(await verifyArchive(args[1]),null,2));
    }else{
      const evidence=[];for(let i=0;i<args.length;i+=2){assert.equal(args[i],'--evidence','Usage: pnpm archive [--evidence <file-or-directory>]');assert(args[i+1],'Missing evidence path');evidence.push(args[i+1]);}
      console.log(JSON.stringify(await createArchive({evidence}),null,2));
    }
  }catch(error){console.error(`Archive failed: ${error.message}`);process.exitCode=1;}
}
