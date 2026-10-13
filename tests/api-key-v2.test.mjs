import test from 'node:test';
import {testOperationStore} from './helpers/operation-store.mjs';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {createApiKeyManagerController,createApiKeyWriteGuard,parseApiKeyMetadata} from '../packages/runtime/dist/api-key.js';
import {createApiKeyHttpAdapter,parseApiKeyWireMetadata} from '../packages/runtime/dist/api-key-http.js';
import {apiKeyFingerprint,apiKeyOperationId} from '../packages/runtime/dist/api-key-fingerprint.js';
import {createHttpClient} from '../packages/runtime/dist/http.js';
const signal=new AbortController().signal;
const metadata=(extra={})=>({id:'9007199254740993',name:'Before',prefix:'FAKE',permission_ids:['read'],created_at:null,expires_at:null,last_used_at:null,status:'active',version:'1',enabled:true,capabilities:{update:true,revoke:true,delete_record:true},...extra});
const row=extra=>parseApiKeyWireMetadata(metadata(extra));
const json=(payload,status=200,success=true,code=1)=>new Response(JSON.stringify({success,code,message:'Synthetic response',request_id:'fixture',payload}),{status,headers:{'Content-Type':'application/json'}});
const storage=()=>{const values=new Map();return {values,load:scope=>values.get(scope)??null,save:(scope,value)=>value===null?values.delete(scope):values.set(scope,structuredClone(value))};};
const guard=store=>createApiKeyWriteGuard({isCurrentScope:()=>true,scopeId:'authenticated-user:tenant-1',storage:store,operationStore:testOperationStore(store)});
const make=(adapter,extra={})=>createApiKeyManagerController({adapter,canCreate:true,permissions:[{id:'read',label:'Read'},{id:'write',label:'Write'},{id:'trade',label:'Trade'},{id:'admin',label:'Admin'}],expiryOptions:[{id:'30d',label:'30 days'}],defaultExpiryId:'30d',...extra});
const setup=(fetch,store=storage())=>{const writeGuard=guard(store),http=createHttpClient({baseURL:'http://intranet.invalid',fetch}),adapter=createApiKeyHttpAdapter({http,writeGuard});return {adapter,http,store,writeGuard,manager:make(adapter)};};
const wait=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
const acknowledgement=(init,rest)=>({schema_version:2,operation_id:init.headers.get('X-API-Key-Operation-ID'),fingerprint:init.headers.get('X-API-Key-Request-Fingerprint'),...rest});
const receipt=(url,init,resolution)=>({schema_version:2,operation_id:new URL(url).pathname.split('/').at(init.method==='POST'?-2:-1),...(init.method==='POST'?JSON.parse(init.body):Object.fromEntries(new URL(url).searchParams)),resolution});

test('SHA-256 uses published vectors and independent Node SHA-256 for UTF8 and multiblock exact bytes',()=>{
 assert.equal(apiKeyFingerprint(''),'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
 assert.equal(apiKeyFingerprint('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 assert.equal(apiKeyFingerprint('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),'248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
 for(const text of ['界🙂'.repeat(130),'a'.repeat(1000000),'PUT\n/api/v1/api-keys/9007199254740993\n'+JSON.stringify({expected_version:'1',name:'中文',permission_ids:['read','trade'],enabled:false})])assert.equal(apiKeyFingerprint(text),createHash('sha256').update(text,'utf8').digest('hex'));
 const previous=Object.getOwnPropertyDescriptor(globalThis,'crypto');Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:bytes=>webcrypto.getRandomValues(bytes)}});
 try{assert.match(apiKeyOperationId(),/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);Object.defineProperty(globalThis,'crypto',{configurable:true,value:{}});assert.throws(()=>apiKeyOperationId());}finally{Object.defineProperty(globalThis,'crypto',previous);}
});

test('v2 requires a persistent actor guard, strict metadata and known schema; generic metadata stays optional',()=>{
 const http=createHttpClient({baseURL:'https://fixture.invalid'});
 assert.throws(()=>createApiKeyHttpAdapter({http}),TypeError);assert.throws(()=>createApiKeyHttpAdapter({http,writeGuard:createApiKeyWriteGuard()}),TypeError);
 for(const extra of [{version:undefined},{version:'01'},{version:'9223372036854775808'},{enabled:undefined},{enabled:'true'},{capabilities:{revoke:true,delete_record:true}},{secret:'FORBIDDEN'}])assert.throws(()=>parseApiKeyWireMetadata(metadata(extra)),TypeError);
 assert.equal(parseApiKeyMetadata({id:'opaque',name:'Legacy custom',prefix:null,permissionIds:[],createdAt:null,expiresAt:null,lastUsedAt:null,status:'unknown'}).version,undefined);
});

test('edit preserves four service permissions and supports disabled/resume without revoke or secret',async()=>{
 let current=metadata(),calls=[];const {manager,store}=setup(async(url,init)=>{calls.push({url,init});if(init.method==='GET')return json({list:[current],total:1});assert.equal(init.method,'PUT');const body=JSON.parse(init.body);assert.equal(body.expected_version,current.version);assert.equal(init.headers.get('X-API-Key-Request-Fingerprint'),createHash('sha256').update(`PUT\n${new URL(url).pathname}\n${init.body}`).digest('hex'));assert.equal(store.values.size,1,'durable descriptor precedes dispatch');current={...current,name:body.name,permission_ids:body.permission_ids,enabled:body.enabled,status:body.enabled?'active':'disabled',version:String(BigInt(current.version)+1n)};return json(acknowledgement(init,{id:current.id,operation:'update',completed:true,metadata:current}));});
 await manager.refresh();manager.openUpdate(current.id);assert.equal(manager.getState().phase,'update');manager.setUpdateDraft({name:' Edited ',permissionIds:['read','write','trade','admin'],enabled:false});await manager.submitUpdate();assert.equal(manager.getState().phase,'closed');assert.equal(manager.getState().rows[0].status,'disabled');assert.deepEqual(manager.getState().rows[0].permissionIds,['read','write','trade','admin']);assert.equal(store.values.size,0);assert.equal(manager.readSecret(),null);
 manager.openUpdate(current.id);manager.setUpdateDraft({permissionIds:['read'],enabled:true});await manager.submitUpdate();assert.equal(current.version,'3');assert.equal(current.status,'active');assert.equal(calls.filter(({init})=>init.method==='PUT').length,2);
 assert.equal(manager.canUpdate(row({status:'revoked'})),false);assert.equal(manager.canUpdate(row({capabilities:{update:false,revoke:true,delete_record:true}})),false);
});

test('update validates names/permissions and host denial before dispatch; missing version is definite pre-send refusal',async()=>{
 let writes=0;const custom={list:async()=>[row()],create:async()=>{throw Error('unused');},revoke:async()=>{},update:async(_key,draft)=>{writes++;return {...row(),...draft};}};
 const manager=make(custom);await manager.refresh();manager.openUpdate(row().id);manager.setUpdateDraft({name:' ',permissionIds:['not-available']});await manager.submitUpdate();assert(manager.getState().fieldErrors.name);assert(manager.getState().fieldErrors.permissions);assert.equal(writes,0);
 const {adapter}=setup(async()=>{writes++;return json(null);});const owner=make({...adapter,list:async()=>[{...row(),version:undefined}]});await owner.refresh();owner.openUpdate(row().id);await owner.submitUpdate();assert.equal(writes,0);assert.equal(owner.getState().writeBlock,null);assert.equal(owner.getState().actionError,owner.labels.updateRejected);
});

test('unknown update survives close, unmount and full recreation; lookup is GET-only, exact receipt unlocks',async()=>{
 let writes=0,applied=false;const store=storage(),fetch=async(url,init)=>{if(new URL(url).pathname.includes('/operations/')){assert.equal(init.method,'GET');return json(receipt(url,init,applied?'applied':'pending'));}if(init.method==='GET')return json({list:[metadata()],total:1});writes++;throw Error('lost acknowledgement');};
 let {manager}=setup(fetch,store);await manager.refresh();manager.openUpdate(row().id);manager.setUpdateDraft({name:'changed'});await manager.submitUpdate();assert.equal(manager.getState().writeBlock.status,'uncertain');const saved=JSON.stringify([...store.values.values()]);for(const privateValue of ['changed','FAKE','permission_ids','secret','password','token'])assert(!saved.includes(privateValue));manager.close();manager.destroy();
 ({manager}=setup(fetch,store));assert.equal(manager.getState().writeBlock.operation,'update');await manager.refresh();await manager.recoverUncertainWrite();assert.equal(manager.getState().writeBlock.status,'uncertain');assert.equal(writes,1);applied=true;await manager.recoverUncertainWrite();assert.equal(manager.getState().writeBlock,null);assert.equal(manager.readSecret(),null);assert.equal(writes,1);assert.equal(store.values.size,0);
});

test('Lookup absent is pending; only explicit confirmed Resolve can seal; mismatched or unknown outcomes retain lock',async()=>{
 let writes=0,resolves=0,mode='pending';const {manager}=setup(async(url,init)=>{if(new URL(url).pathname.includes('/operations/')){if(init.method==='POST')resolves++;if(mode==='network')throw Error('unknown resolution');const result=receipt(url,init,mode==='mismatch'?'applied':init.method==='POST'?'not-applied':'pending');if(mode==='mismatch')result.fingerprint='0'.repeat(64);return json(result);}if(init.method==='GET')return json({list:[metadata()],total:1});writes++;throw Error('unknown');});
 manager.openCreate();manager.setDraft({name:'New'});await manager.submitCreate();manager.close();await manager.refresh();await manager.recoverUncertainWrite();assert.equal(resolves,0);assert(manager.getState().writeBlock);await manager.confirmResolveWrite();assert.equal(resolves,0,'confirmation phase required');manager.openResolveWrite();mode='network';await manager.confirmResolveWrite();assert(manager.getState().writeBlock);mode='mismatch';await manager.confirmResolveWrite();assert(manager.getState().writeBlock);mode='pending';await manager.confirmResolveWrite();assert.equal(manager.getState().writeBlock,null);assert.equal(manager.getState().phase,'closed');assert.equal(resolves,3);assert.equal(writes,1);
});

test('ordinary 409 and mismatched success never imply idempotent completion',async()=>{
 for(const mode of ['409','operation','fingerprint']){const {manager}=setup(async(url,init)=>{if(init.method==='GET')return json({list:[],total:0});if(mode==='409')return json(null,409,false,40901);const ack=acknowledgement(init,{metadata:metadata(),secret:'FAKE_ONE_TIME'});if(mode==='operation')ack.operation_id='00000000-0000-4000-8000-000000000000';else ack.fingerprint='0'.repeat(64);return json(ack);});manager.openCreate();manager.setDraft({name:'new'});await manager.submitCreate();assert.equal(manager.getState().writeBlock.status,'uncertain');assert.equal(manager.readSecret(),null);}
});

test('storage load/schema/scope failure refuses initialization; save failure sends nothing; clear failure keeps gate',async()=>{
 assert.throws(()=>guard({load:()=>{throw Error('unavailable');},save:()=>{}}));
 for(const value of [{schema_version:2,scope_id:'authenticated-user:tenant-1',descriptor:{}},{schema_version:1,scope_id:'other-user',descriptor:{}},{schema_version:1,scope_id:'authenticated-user:tenant-1',descriptor:{},secret:'NO'}])assert.throws(()=>guard({load:()=>value,save:()=>{}}));
 let calls=0;const store=storage();store.save=()=>{throw Error('storage full');};const {manager}=setup(async()=>{calls++;return json(null);},store);manager.openCreate();manager.setDraft({name:'new'});await manager.submitCreate();assert.equal(calls,0);assert.equal(manager.getState().writeBlock.status,'uncertain');
 const original=storage();let clearing=false;const save=original.save;original.save=(scope,value)=>{if(value===null&&clearing)throw Error('clear failed');save(scope,value);};const second=setup(async(_url,init)=>{clearing=true;return json(acknowledgement(init,{metadata:metadata(),secret:'FAKE_ONCE'}));},original).manager;second.openCreate();second.setDraft({name:'new'});await second.submitCreate();assert.equal(second.getState().writeBlock.status,'uncertain');assert.equal(second.readSecret(),'FAKE_ONCE');second.close();assert.equal(second.readSecret(),null);assert.equal(original.values.size,1);
});

test('cancel during async prepare has proof of no POST, while late dispatched completion never restores secret',async()=>{
 const prepared=deferred();let calls=0;const {adapter}=setup(async(_url,init)=>{calls++;return json(acknowledgement(init,{metadata:metadata(),secret:'FAKE_ONCE'}));});const manager=make({...adapter,prepareWrite:async(...args)=>{const descriptor=await adapter.prepareWrite(...args);await prepared.promise;return descriptor;}});manager.openCreate();manager.setDraft({name:'new'});const pending=manager.submitCreate();await wait();manager.close();await pending;prepared.resolve();await wait();assert.equal(calls,0);assert.equal(manager.getState().writeBlock,null);
 const held=deferred(),store=storage();const second=setup(async(_url,init)=>{await held.promise;return json(acknowledgement(init,{metadata:metadata(),secret:'LATE_FORBIDDEN'}));},store).manager;second.openCreate();second.setDraft({name:'new'});const active=second.submitCreate();await wait();second.close();await active;held.resolve();await wait();assert.equal(second.readSecret(),null);assert.equal(second.getState().writeBlock.status,'uncertain');assert.equal(guard(store).getState().status,'uncertain');
});

test('byte-identical Go v2 decimal/hex fixtures pass through the real adapter with exact UTF8 bytes and headers',async()=>{
 const {readFile}=await import('node:fs/promises');
 const previous=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:bytes=>{bytes.set(Buffer.from('12345678123442349234123456789abc','hex'));return bytes;}}});
 try{for(const encoding of ['decimal','hex']){
  const fixture=JSON.parse(await readFile(new URL(`./fixtures/api-key-contracts.v2${encoding==='hex'?'.hex':''}.json`,import.meta.url),'utf8'));assert.equal(fixture.fixture_version,2);const cases=fixture.cases;
  for(const name of ['api_key_capabilities','api_key_list','api_key_create','api_key_revoke','api_key_delete_record','api_key_update','api_key_write_outcome_unknown']){
   const item=cases[name];if(!item)throw Error(`Missing fixture ${name}`);let calls=0;const http=createHttpClient({baseURL:'http://fixture.invalid',fetch:async(url,init)=>{calls++;const actual=new URL(url);assert.equal(actual.pathname,item.request.path);assert.equal(init.method,item.request.method);assert.equal(init.body??'',item.request.body_text??'');assert.deepEqual(Object.fromEntries(actual.searchParams),item.request.query??{});for(const [key,value]of Object.entries(item.request.headers??{}))assert.equal(init.headers.get(key),value);return new Response(JSON.stringify(item.response.body),{status:item.response.status,headers:{'Content-Type':'application/json'}});}}),adapter=createApiKeyHttpAdapter({http,writeGuard:guard(storage()),idEncoding:encoding}),key=parseApiKeyWireMetadata(cases.api_key_list.response.body.payload.list[0],encoding),draft=cases.api_key_create.request.body;
   const call=()=>name==='api_key_capabilities'?adapter.getConfiguration():name==='api_key_list'?adapter.list({signal}):name==='api_key_revoke'?adapter.revoke(key,{signal}):name==='api_key_delete_record'?adapter.deleteRecord({...key,status:'revoked'},{signal}):name==='api_key_update'?adapter.update(key,{name:cases.api_key_update.request.body.name,permissionIds:cases.api_key_update.request.body.permission_ids,enabled:false},{signal}):adapter.create({name:draft.name,permissionIds:draft.permission_ids,expiryId:draft.expiry_id,confirmed:draft.confirmed},{signal});
   if(name==='api_key_write_outcome_unknown')await assert.rejects(call,error=>error.code===50301);else await call();assert.equal(calls,1);http.destroy();
  }
  const descriptor={operation_id:cases.api_key_operation_lookup.response.body.payload.operation_id,...cases.api_key_operation_lookup.request.query};const store=storage();store.save('authenticated-user:tenant-1',{schema_version:1,scope_id:'authenticated-user:tenant-1',descriptor});const writeGuard=guard(store),pending=[cases.api_key_operation_lookup,cases.api_key_operation_resolve],http=createHttpClient({baseURL:'http://fixture.invalid',fetch:async(url,init)=>{const item=pending.shift();assert.equal(new URL(url).pathname,item.request.path);assert.equal(init.method,item.request.method);assert.equal(init.body??'',item.request.body_text??'');assert.deepEqual(Object.fromEntries(new URL(url).searchParams),item.request.query??{});return new Response(JSON.stringify(item.response.body),{status:item.response.status,headers:{'Content-Type':'application/json'}});}}),adapter=createApiKeyHttpAdapter({http,writeGuard,idEncoding:encoding});assert.equal(await adapter.reconcileWrite(writeGuard.getState(),{rows:[],signal}),'pending');assert.equal(await adapter.resolveWrite(writeGuard.getState(),{signal}),'not-applied');assert.equal(pending.length,0);http.destroy();
 }
 }finally{Object.defineProperty(globalThis,'crypto',previous);}
 assert.equal(apiKeyFingerprint('PUT\n/api/v1/api-keys/9007199254740993\n{"expected_version":"19","name":"研究密钥","permission_ids":["read","write"],"enabled":false}'),'db71f4731195865832c20220959f06216b0016b8d296f1b5b5f18e68bbae7dcc');
});

test('a previously initialized guard re-reads another saved scope lock before a new write',async()=>{
 const store=storage();let writes=0;const fetch=async()=>{writes++;throw Error('lost');};const first=setup(fetch,store).manager,second=setup(fetch,store).manager;
 first.openCreate();first.setDraft({name:'first'});await first.submitCreate();second.openCreate();second.setDraft({name:'second'});await second.submitCreate();assert.equal(writes,1);assert.equal(second.getState().writeBlock.status,'uncertain');assert.equal(second.getState().writeBlock.descriptor.operation_id,first.getState().writeBlock.descriptor.operation_id);
 const other=createApiKeyWriteGuard({isCurrentScope:()=>true,scopeId:'different-verified-user:tenant-2',storage:store,operationStore:testOperationStore(store)});assert.equal(other.getState(),null);assert.equal(store.values.size,1);
});

test('a foreign saved lock discovered after preparation or before cleanup is retained, never overwritten',async()=>{
 const store=storage(),held=deferred();let sent=0;const {adapter}=setup(async(_url,init)=>{sent++;return json(acknowledgement(init,{metadata:metadata(),secret:'FAKE_ONCE'}));},store),foreign={operation_id:'00000000-0000-4000-8000-000000000000',operation:'create',target_id:'',expected_version:'',fingerprint:'a'.repeat(64)};
 const manager=make({...adapter,prepareWrite:async(...args)=>{const value=await adapter.prepareWrite(...args);await held.promise;return value;}});manager.openCreate();manager.setDraft({name:'new'});const pending=manager.submitCreate();await wait();store.save('authenticated-user:tenant-1',{schema_version:1,scope_id:'authenticated-user:tenant-1',descriptor:foreign});held.resolve();await pending;assert.equal(sent,0);assert.equal(manager.getState().writeBlock.descriptor.operation_id,foreign.operation_id);
 const secondStore=storage(),second=setup(async(_url,init)=>{secondStore.save('authenticated-user:tenant-1',{schema_version:1,scope_id:'authenticated-user:tenant-1',descriptor:foreign});return json(acknowledgement(init,{metadata:metadata(),secret:'FAKE_ONCE'}));},secondStore).manager;second.openCreate();second.setDraft({name:'new'});await second.submitCreate();assert.equal(second.getState().writeBlock.descriptor.operation_id,foreign.operation_id);assert.equal(secondStore.values.get('authenticated-user:tenant-1').descriptor.operation_id,foreign.operation_id);
});

test('cleanup compares all descriptor fields; before-prepare cancellation cannot erase another operation',async()=>{
 const store=storage(),{manager}=setup(async(_url,init)=>{const saved=store.values.get('authenticated-user:tenant-1');saved.descriptor.fingerprint='b'.repeat(64);store.save('authenticated-user:tenant-1',saved);return json(acknowledgement(init,{metadata:metadata(),secret:'FAKE_ONCE'}));},store);manager.openCreate();manager.setDraft({name:'new'});await manager.submitCreate();assert.equal(manager.getState().writeBlock.descriptor.fingerprint,'b'.repeat(64));assert.equal(store.values.size,1);
 const other=storage(),held=deferred(),{adapter}=setup(async()=>{throw Error('must not send');},other),second=make({...adapter,prepareWrite:async(...args)=>{await held.promise;return adapter.prepareWrite(...args);}});second.openCreate();second.setDraft({name:'new'});const active=second.submitCreate();await wait();const descriptor={operation_id:'00000000-0000-4000-8000-000000000000',operation:'create',target_id:'',expected_version:'',fingerprint:'c'.repeat(64)};other.save('authenticated-user:tenant-1',{schema_version:1,scope_id:'authenticated-user:tenant-1',descriptor});second.close();await active;held.resolve();await wait();assert.equal(second.getState().writeBlock.descriptor.operation_id,descriptor.operation_id);assert.equal(other.values.size,1);
});

test('storage read failure on an already initialized owner is a definite pre-send refusal',async()=>{
 const store=storage();let fail=false,sent=0;const load=store.load;store.load=scope=>{if(fail)throw Error('storage unavailable');return load(scope);};const {manager}=setup(async()=>{sent++;return json(null);},store);fail=true;manager.openCreate();manager.setDraft({name:'new'});await manager.submitCreate();assert.equal(sent,0);assert.equal(manager.getState().actionBusy,false);assert.equal(manager.getState().actionError,manager.labels.persistenceError);assert.equal(manager.getState().writeBlock,null);await manager.submitCreate();assert.equal(sent,0);
});

test('persistent guards require a live trusted scope callback; switching scope during prepare sends nothing',async()=>{
 const store=storage();assert.throws(()=>createApiKeyWriteGuard({scopeId:'scope',storage:store,operationStore:testOperationStore(store)}),TypeError);assert.throws(()=>createApiKeyWriteGuard({scopeId:'scope',storage:store,isCurrentScope:()=>{throw Error('auth unavailable');}}),TypeError);
 let current=true,sent=0;const writeGuard=createApiKeyWriteGuard({scopeId:'server:authenticated-principal:namespace',isCurrentScope:()=>current,storage:store,operationStore:testOperationStore(store)}),http=createHttpClient({baseURL:'http://fixture.invalid',fetch:async()=>{sent++;return json(null);}}),adapter=createApiKeyHttpAdapter({http,writeGuard}),held=deferred(),manager=make({...adapter,prepareWrite:async(...args)=>{const descriptor=await adapter.prepareWrite(...args);await held.promise;return descriptor;}});manager.openCreate();manager.setDraft({name:'old actor'});const pending=manager.submitCreate();await wait();current=false;held.resolve();await pending;assert.equal(sent,0);assert.equal(manager.getState().phase,'closed');assert.equal(manager.getState().writeBlock,null);assert.equal(store.values.size,0);
});

test('scope switch after dispatch hides old UI and retains recovery, including late success/receipt',async()=>{
 const store=storage(),held=deferred();let current=true;const scopeId='server:authenticated-principal:namespace',writeGuard=createApiKeyWriteGuard({scopeId,isCurrentScope:()=>current,storage:store,operationStore:testOperationStore(store)}),http=createHttpClient({baseURL:'http://fixture.invalid',fetch:async(_url,init)=>{await held.promise;return json(acknowledgement(init,{metadata:metadata(),secret:'FORBIDDEN_OLD_ACTOR_SECRET'}));}}),adapter=createApiKeyHttpAdapter({http,writeGuard}),manager=make(adapter);manager.openCreate();manager.setDraft({name:'old actor'});const pending=manager.submitCreate();await wait();assert.equal(store.values.size,1);current=false;held.resolve();await pending;assert.equal(manager.getState().phase,'closed');assert.equal(manager.getState().writeBlock,null);assert.equal(manager.readSecret(),null);assert.equal(store.values.size,1);
 current=true;const restored=createApiKeyWriteGuard({scopeId,isCurrentScope:()=>current,storage:store,operationStore:testOperationStore(store)}),receiptHeld=deferred(),recovery=createApiKeyHttpAdapter({writeGuard:restored,http:createHttpClient({baseURL:'http://fixture.invalid',fetch:async(url,init)=>{await receiptHeld.promise;return json(receipt(url,init,'applied'));}})});const query=recovery.reconcileWrite(restored.getState(),{rows:[],signal});await wait();current=false;receiptHeld.resolve();await assert.rejects(query);assert.equal(store.values.size,1);
});

test('Lookup and Resolve receipts reject extra secret or unknown fields without releasing the write guard',async()=>{
 for(const field of ['secret','unexpected'])for(const resolve of [false,true]){
  const {manager}=setup(async(url,init)=>{
   if(new URL(url).pathname.includes('/operations/'))return json({...receipt(url,init,'applied'),[field]:'FORBIDDEN_RECEIPT_VALUE'});
   if(init.method==='GET')return json({list:[metadata()],total:1});
   throw Error('lost acknowledgement');
  });
  manager.openCreate();manager.setDraft({name:'new'});await manager.submitCreate();const descriptor=manager.getState().writeBlock.descriptor;manager.close();
  if(resolve){manager.openResolveWrite();await manager.confirmResolveWrite();}else await manager.recoverUncertainWrite();
  assert.equal(manager.getState().writeBlock.status,'uncertain');assert.deepEqual(manager.getState().writeBlock.descriptor,descriptor);assert.equal(manager.getState().recoveryError,manager.labels.recoveryError);assert.equal(manager.readSecret(),null);assert(!JSON.stringify(manager.getState()).includes('FORBIDDEN_RECEIPT_VALUE'));
 }
});

test('two tabs preparing different IDs share one atomic descriptor through unknown outcome and full recreation',async()=>{
 for(const operation of ['create','update','revoke','delete']){
  const store=storage(),atomic=testOperationStore(store),bothPrepared=deferred(),releasePreparation=deferred(),releaseResponse=deferred();let prepared=0,writes=0;const descriptors=[];
  const fetch=async(_url,init)=>{if(init.method==='GET')return json({list:[metadata({status:operation==='delete'?'revoked':'active'})],total:1});writes++;await releaseResponse.promise;throw Error('unknown outcome');};
  const managers=[0,1].map(()=>{const {adapter}=setup(fetch,store);return make({...adapter,prepareWrite:async(...args)=>{const descriptor=await adapter.prepareWrite(...args);descriptors.push(descriptor);if(++prepared===2)bothPrepared.resolve();await releasePreparation.promise;return descriptor;}});});
  const start=async(manager,index)=>{if(operation==='create'){manager.openCreate();manager.setDraft({name:`Distinct private draft ${index}`});return manager.submitCreate();}await manager.refresh();if(operation==='update'){manager.openUpdate(row().id);manager.setUpdateDraft({name:`Distinct private edit ${index}`});return manager.submitUpdate();}if(operation==='revoke'){manager.openRevoke(row().id);return manager.confirmRevoke();}manager.openDeleteRecord(row().id);return manager.confirmDeleteRecord();};
  const attempts=managers.map(start);await bothPrepared.promise;assert.notEqual(descriptors[0].operation_id,descriptors[1].operation_id);assert.equal(atomic.values.size,0);releasePreparation.resolve();await wait();assert.equal(writes,1);const authoritative=JSON.parse([...atomic.values.values()][0]).descriptor;assert(descriptors.some(value=>value.operation_id===authoritative.operation_id));
  releaseResponse.resolve();await Promise.all(attempts);for(const manager of managers){assert.deepEqual(manager.getState().writeBlock.descriptor,authoritative);manager.close();manager.destroy();}
  const recreated=setup(fetch,store);await recreated.writeGuard.ready();assert.deepEqual(recreated.writeGuard.getState().descriptor,authoritative);recreated.manager.openCreate();recreated.manager.setDraft({name:'Unsafe duplicate'});await recreated.manager.submitCreate();assert.equal(writes,1);assert.deepEqual(JSON.parse([...atomic.values.values()][0]).descriptor,authoritative);
  for(const forbidden of ['Distinct private','Unsafe duplicate','secret','password','token'])assert(!JSON.stringify([...atomic.values.values()]).includes(forbidden));
 }
});

test('atomic protection is library-owned and fails closed when unavailable; ordinary custom adapters remain memory-only',async()=>{
 let writes=0;const store=storage(),writeGuard=createApiKeyWriteGuard({scopeId:'http-server:actor:namespace',isCurrentScope:()=>true,storage:store}),http=createHttpClient({baseURL:'http://fixture.invalid',fetch:async()=>{writes++;return json(null);}}),manager=make(createApiKeyHttpAdapter({http,writeGuard}));
 await assert.rejects(writeGuard.ready());manager.openCreate();manager.setDraft({name:'No IndexedDB in Node'});await manager.submitCreate();assert.equal(writes,0);assert.equal(manager.getState().actionError,manager.labels.persistenceError);await manager.submitCreate();assert.equal(writes,0);
 const custom=make({list:async()=>[],create:async()=>{writes++;return {metadata:row(),secret:'FAKE_CUSTOM'};},revoke:async()=>{}});custom.openCreate();custom.setDraft({name:'Explicit memory contract'});await custom.submitCreate();assert.equal(writes,1);assert.equal(custom.readSecret(),'FAKE_CUSTOM');custom.destroy();
});

test('partial atomic reserve failure retains its exact descriptor and never dispatches or replaces it',async()=>{
 const store=storage(),atomic=testOperationStore(store),exchange=atomic.compareExchange;let fail=true,writes=0;atomic.compareExchange=async(...args)=>{const result=await exchange(...args);if(fail&&args[1]===null){fail=false;throw Error('commit acknowledgement unavailable');}return result;};
 const {manager}=setup(async()=>{writes++;return json(null);},store);manager.openCreate();manager.setDraft({name:'Private never sent'});await manager.submitCreate();assert.equal(writes,0);assert.equal(manager.getState().writeBlock.status,'uncertain');const original=manager.getState().writeBlock.descriptor;assert.deepEqual(JSON.parse([...atomic.values.values()][0]).descriptor,original);manager.close();manager.destroy();
 const recreated=setup(async()=>{writes++;return json(null);},store);await recreated.writeGuard.ready();assert.deepEqual(recreated.writeGuard.getState().descriptor,original);recreated.manager.openCreate();await recreated.manager.submitCreate();assert.equal(writes,0);
});

test('legacy unknown descriptors are atomically imported; conflicting durable records are both preserved',async()=>{
 const original={operation_id:'00000000-0000-4000-8000-000000000001',operation:'update',target_id:row().id,expected_version:'19',fingerprint:'e'.repeat(64)},store=storage();store.save('authenticated-user:tenant-1',{schema_version:1,scope_id:'authenticated-user:tenant-1',descriptor:original});
 const restored=guard(store);await restored.ready();assert.deepEqual(restored.getState().descriptor,original);const atomic=testOperationStore(store);assert.deepEqual(JSON.parse([...atomic.values.values()][0]).descriptor,original);assert.deepEqual(store.values.get('authenticated-user:tenant-1').descriptor,original);
 const changed={...original,operation_id:'00000000-0000-4000-8000-000000000002'};store.save('authenticated-user:tenant-1',{schema_version:1,scope_id:'authenticated-user:tenant-1',descriptor:changed});const conflicting=guard(store);await assert.rejects(conflicting.ready());assert.deepEqual(JSON.parse([...atomic.values.values()][0]).descriptor,original);assert.deepEqual(store.values.get('authenticated-user:tenant-1').descriptor,changed);
});

test('late terminal cleanup compares the complete atomic record and cannot clear a newer tab operation',async()=>{
 const store=storage(),atomic=testOperationStore(store),exchange=atomic.compareExchange,clearEntered=deferred(),allowClear=deferred();let delay=true;
 atomic.compareExchange=async(scope,expected,next)=>{if(expected!==null&&next===null&&delay){delay=false;clearEntered.resolve();await allowClear.promise;}return exchange(scope,expected,next);};
 const {manager}=setup(async(_url,init)=>json(acknowledgement(init,{metadata:metadata(),secret:'FAKE_ONCE'})),store);manager.openCreate();manager.setDraft({name:'Original'});const original=manager.submitCreate();await clearEntered.promise;
 const [scope,raw]=[...atomic.values][0],descriptor={...JSON.parse(raw).descriptor,operation_id:'00000000-0000-4000-8000-000000000009',fingerprint:'f'.repeat(64)};await exchange(scope,raw,null);await exchange(scope,null,JSON.stringify({schema_version:1,scope_id:'authenticated-user:tenant-1',descriptor}));store.save('authenticated-user:tenant-1',{schema_version:1,scope_id:'authenticated-user:tenant-1',descriptor});allowClear.resolve();await original;
 assert.deepEqual(JSON.parse(atomic.values.get(scope)).descriptor,descriptor);assert.deepEqual(manager.getState().writeBlock.descriptor,descriptor);assert.deepEqual(store.values.get('authenticated-user:tenant-1').descriptor,descriptor);manager.close();
});
