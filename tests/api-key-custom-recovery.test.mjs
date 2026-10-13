import test from 'node:test';
import assert from 'node:assert/strict';
import {createApiKeyManagerController,createApiKeyWriteGuard,parseApiKeyCustomOperationDescriptor} from '../packages/runtime/dist/api-key.js';
import {parseApiKeyOperationDescriptor} from '../packages/runtime/dist/api-key-write.js';
import {testOperationStore} from './helpers/operation-store.mjs';
const defer=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
let sequence=0;
const identity=(extra={})=>({schema_version:2,operation_id:`00000000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`,operation:'create',intent_target_id:'',action:'key-rotate',target_id:'a1',expected_version:'0',fingerprint:'a'.repeat(64),...extra});
const row={id:'a1',name:'Synthetic',prefix:null,permissionIds:[],createdAt:null,expiresAt:null,lastUsedAt:null,status:'active',version:'0'};
const storage=()=>{const values=new Map();return {values,load:scope=>values.get(scope)??null,save:(scope,value)=>value===null?values.delete(scope):values.set(scope,structuredClone(value))};};
const setup=(store=storage(),extra={},guardExtra={})=>{
 const writeGuard=createApiKeyWriteGuard({scopeId:'verified-server:actor:account',isCurrentScope:()=>true,storage:store,operationStore:testOperationStore(store),...guardExtra});
 const adapter={writeGuard,list:async()=>[row],prepareWrite:async()=>identity(),create:async()=>{throw Error('unknown');},revoke:async()=>{},reconcileWrite:async write=>({descriptor:write.descriptor,resolution:'applied'}),...extra};
 const manager=createApiKeyManagerController({adapter,canCreate:true,permissions:[],expiryOptions:[{id:'never',label:'Never'}],defaultExpiryId:'never'});return {store,writeGuard,adapter,manager};
};
const start=manager=>{manager.openCreate();manager.setDraft({name:'Private draft never persisted'});return manager.submitCreate();};

test('custom schema is closed, bounded and separates UI create from domain rotation/version zero',()=>{
 const descriptor=identity();assert.deepEqual(parseApiKeyCustomOperationDescriptor(descriptor),descriptor);assert(Object.isFrozen(parseApiKeyCustomOperationDescriptor(descriptor)));assert.throws(()=>parseApiKeyOperationDescriptor(descriptor));
 for(const patch of [{secret:'private'},{body:{}},{schema_version:3},{action:'x'.repeat(65)},{target_id:'a'.repeat(257)},{expected_version:'v'.repeat(129)},{target_id:'/api/keys?secret=private'},{intent_target_id:'a1'},{fingerprint:'bad'},{operation_id:'bad'},{operation:'rotate'}])assert.throws(()=>parseApiKeyCustomOperationDescriptor({...descriptor,...patch}));
 assert.throws(()=>parseApiKeyCustomOperationDescriptor({...descriptor,[Symbol('secret')]:'private'}));
 let read=false;const getter={...descriptor};Object.defineProperty(getter,'action',{get(){read=true;return 'key-create';}});assert.throws(()=>parseApiKeyCustomOperationDescriptor(getter));assert.equal(read,false);
 assert.equal(parseApiKeyCustomOperationDescriptor(identity({action:'key-create',target_id:'/api/v1/accounts/a1/projects/b2/keys',expected_version:''})).action,'key-create');
 const base={operation_id:descriptor.operation_id,operation:'create',target_id:'',expected_version:'',fingerprint:descriptor.fingerprint};assert.deepEqual(parseApiKeyOperationDescriptor(base),base);assert.throws(()=>parseApiKeyOperationDescriptor({...base,target_id:'a1'}));assert.throws(()=>parseApiKeyOperationDescriptor({...base,operation:'update',target_id:'1',expected_version:'0'}));
});

test('reload retains full custom identity without a process-local map; only explicit matching receipt releases it',async()=>{
 const first=setup();await start(first.manager);const saved=first.writeGuard.getState().descriptor;first.manager.destroy();
 for(const receipt of ['applied','not-applied',{descriptor:{...saved,action:'key-create'},resolution:'applied'},{descriptor:{...saved,expected_version:'1'},resolution:'not-applied'},{descriptor:{...saved,target_id:'other'},resolution:'applied'}]){
  const next=setup(first.store,{reconcileWrite:async()=>receipt});await next.writeGuard.ready();assert.deepEqual(next.writeGuard.getState().descriptor,saved);assert.equal(next.writeGuard.getState().targetId,null);await next.manager.recoverUncertainWrite();assert(next.writeGuard.getState());next.manager.destroy();
 }
 const next=setup(first.store);await next.writeGuard.ready();await next.manager.recoverUncertainWrite();assert.equal(next.writeGuard.getState(),null);assert.equal(testOperationStore(first.store).values.size,0);assert.equal(first.store.values.size,0);assert.equal(next.manager.readSecret(),null);
});

test('two tabs racing distinct custom operations dispatch once and preserve unknown across reload',async()=>{
 const store=storage(),both=defer(),release=defer();let prepared=0,sends=0;
 const extra={prepareWrite:async()=>{const d=identity();if(++prepared===2)both.resolve();await release.promise;return d;},create:async()=>{sends++;throw Error('unknown');}};
 const a=setup(store,extra),b=setup(store,extra),pending=[start(a.manager),start(b.manager)];await both.promise;release.resolve();await Promise.all(pending);assert.equal(sends,1);assert.deepEqual(a.writeGuard.getState().descriptor,b.writeGuard.getState().descriptor);
 a.manager.destroy();b.manager.destroy();const restored=setup(store,extra);await restored.writeGuard.ready();await start(restored.manager);assert.equal(sends,1);assert(!JSON.stringify([...testOperationStore(store).values.values()]).includes('Private draft'));
});

test('successful ordinary custom creates allow multiple keys in the same collection',async()=>{
 let sends=0;const x=setup(undefined,{prepareWrite:async()=>identity({action:'key-create',target_id:'/api/v1/accounts/a1/keys',expected_version:''}),create:async()=>{sends++;return {metadata:{...row,id:String(sends)},secret:'SYNTHETIC_ONCE'};}});
 for(let i=0;i<3;i++){await start(x.manager);assert.equal(x.writeGuard.getState(),null);x.manager.close();}assert.equal(sends,3);assert.equal(x.store.values.size,0);
});

test('storage or atomic store failures fail closed before custom dispatch',async()=>{
 for(const kind of ['read','reserve','mirror']){const store=storage(),atomic=testOperationStore(store);let sends=0;
  if(kind==='read')atomic.read=async()=>{throw Error('unavailable');};if(kind==='reserve')atomic.compareExchange=async()=>{throw Error('unavailable');};if(kind==='mirror')store.save=()=>{throw Error('unavailable');};
  const x=setup(store,{create:async()=>{sends++;return {metadata:row,secret:'SYNTHETIC'};}});await x.writeGuard.ready().catch(()=>{});await start(x.manager);assert.equal(sends,0);assert(x.manager.getState().actionError);x.manager.destroy();
 }
});

test('cancelled or actor-switched late custom receipts never clear unknown identity',async()=>{
 for(const change of ['close','actor']){let active=true;const entered=defer(),held=defer(),x=setup(undefined,{reconcileWrite:async write=>{entered.resolve();await held.promise;return {descriptor:write.descriptor,resolution:'applied'};}},{isCurrentScope:()=>active});
  await start(x.manager);x.manager.close();const pending=x.manager.recoverUncertainWrite();await entered.promise;if(change==='close')x.manager.close();else active=false;held.resolve();await pending;assert.equal(testOperationStore(x.store).values.size,1);if(change==='actor')assert.equal(x.writeGuard.getState(),null);else assert(x.writeGuard.getState());
 }
});

test('late custom receipt cannot clear a newer cross-tab identity',async()=>{
 const entered=defer(),held=defer(),x=setup(undefined,{reconcileWrite:async write=>{entered.resolve();await held.promise;return {descriptor:write.descriptor,resolution:'applied'};}});await start(x.manager);x.manager.close();const pending=x.manager.recoverUncertainWrite();await entered.promise;
 const atomic=testOperationStore(x.store),[scope,raw]=[...atomic.values][0],newer=identity({action:'key-create',expected_version:''}),snapshot={schema_version:2,scope_id:'verified-server:actor:account',descriptor:newer};await atomic.compareExchange(scope,raw,JSON.stringify(snapshot));x.store.save(snapshot.scope_id,snapshot);held.resolve();await pending;assert.deepEqual(JSON.parse(atomic.values.get(scope)).descriptor,newer);assert.deepEqual(x.store.values.get(snapshot.scope_id).descriptor,newer);
});

test('unknown future schemas remain untouched and block dispatch',async()=>{
 const store=storage(),atomic=testOperationStore(store),raw=JSON.stringify({schema_version:99,scope_id:'verified-server:actor:account',descriptor:identity()});atomic.values.set('xui.api-key.v1:verified-server:actor:account',raw);let sends=0;const x=setup(store,{create:async()=>{sends++;}});await assert.rejects(x.writeGuard.ready());await start(x.manager);assert.equal(sends,0);assert.equal([...atomic.values.values()][0],raw);
});

test('actor changes during preparation prevent sends; after dispatch late success hides the secret and preserves recovery',async()=>{
 for(const stage of ['prepare','dispatch']){const entered=defer(),held=defer();let active=true,sends=0;
  const x=setup(undefined,{prepareWrite:async()=>{if(stage==='prepare'){entered.resolve();await held.promise;}return identity();},create:async()=>{sends++;entered.resolve();await held.promise;return {metadata:row,secret:'FORBIDDEN_OLD_ACTOR_VALUE'};}},{isCurrentScope:()=>active});
  const pending=start(x.manager);await entered.promise;active=false;held.resolve();await pending;assert.equal(sends,stage==='prepare'?0:1);assert.equal(x.manager.readSecret(),null);assert.equal(x.writeGuard.getState(),null);assert.equal(testOperationStore(x.store).values.size,stage==='prepare'?0:1);
  const other=setup(x.store,{}, {scopeId:'verified-server:different-actor:account'});await other.writeGuard.ready();assert.equal(other.writeGuard.getState(),null);assert.equal(testOperationStore(x.store).values.size,stage==='prepare'?0:1);
 }
});
