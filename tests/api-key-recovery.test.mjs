import test from 'node:test';
import assert from 'node:assert/strict';
import {createApiKeyManagerController,createApiKeyWriteGuard,parseApiKeyMetadata} from '../packages/runtime/dist/api-key.js';
import {HttpError} from '../packages/runtime/dist/http.js';
const secret='FAKE_RECOVERY_ONE_TIME_VALUE';
const row=(extra={})=>({id:'key',name:'Synthetic',prefix:null,permissionIds:[],createdAt:null,expiresAt:null,lastUsedAt:null,status:'active',capabilities:{revoke:true,deleteRecord:true},...extra});
const defer=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
const make=(adapter,extra={})=>createApiKeyManagerController({adapter,canCreate:true,permissions:[],expiryOptions:[{id:'never',label:'Never'}],defaultExpiryId:'never',...extra});
const start=manager=>{manager.openCreate();manager.setDraft({name:'Explicit intent'});return manager.submitCreate();};
const base=(extra={})=>({list:async()=>[row()],create:async()=>({metadata:row(),secret}),revoke:async()=>{},deleteRecord:async()=>{},...extra});

test('access persistence is an explicit immutable boolean, independent of null timestamps',()=>{
 for(const lastUsedAt of [null,'2026-10-12T01:00:00Z'])for(const pending of [undefined,false,true]){const value=parseApiKeyMetadata(row({lastUsedAt,...(pending===undefined?{}:{lastUsedAtPending:pending})}));assert.equal(value.lastUsedAt,lastUsedAt);assert.equal(value.lastUsedAtPending,pending);assert.equal(Object.hasOwn(value,'lastUsedAtPending'),pending!==undefined);assert(Object.isFrozen(value));}
 for(const pending of [null,0,1,'true'])assert.throws(()=>parseApiKeyMetadata(row({lastUsedAtPending:pending})),TypeError);
});
test('a dispatched cancelled create remains guarded across close, destroy and controller recreation',async()=>{
 const held=defer();let sends=0,signal;const adapter=base({create:(_draft,context)=>{sends++;signal=context.signal;return held.promise;}});
 const first=make(adapter);const pending=start(first);await tick();first.close();await pending;assert(signal.aborted);assert.equal(first.readSecret(),null);assert.equal(first.getState().writeBlock.status,'uncertain');
 first.openCreate();await first.submitCreate();await first.refresh();assert.equal(first.getState().phase,'closed');assert.equal(sends,1);first.destroy();
 const second=make(adapter);assert.equal(second.getState().actionUncertain,true);await second.refresh();second.openCreate();await second.confirmRevoke();assert.equal(second.canRevoke(row()),false);assert.equal(second.canDeleteRecord(row({status:'revoked'})),false);assert.equal(sends,1);
 held.resolve({metadata:row(),secret});await tick();assert.equal(second.readSecret(),null);assert.equal(second.getState().actionUncertain,true);assert(!JSON.stringify(second.getState()).includes(secret));second.destroy();
});
test('a shared guard prevents parallel views and releases a cancellation before dispatch',async()=>{
 const guard=createApiKeyWriteGuard();let sends=0;
 const adapter=base({create:async()=>{sends++;return {metadata:row(),secret};}}),a=make(adapter,{writeGuard:guard}),b=make(base(),{writeGuard:guard});
 const off=guard.subscribe(()=>{if(guard.getState()?.status==='pending'){assert.equal(b.canRevoke(row()),false);b.openCreate();a.close();}});
 await start(a);assert.equal(sends,0);assert.equal(guard.getState(),null);assert.equal(a.getState().actionBusy,false);assert.equal(a.getState().phase,'closed');off();await start(b);assert.equal(b.readSecret(),secret);a.destroy();b.destroy();assert.equal(guard.getState(),null);
 assert.throws(()=>make(adapter,{writeGuard:{getState:()=>null,subscribe:()=>()=>{}}}),TypeError);
});
test('unknown create, revoke and delete outcomes need a fresh read and authoritative reconciliation',async()=>{
 for(const operation of ['create','revoke','delete']){
  let reads=0,writes=0;const calls=[];const adapter=base({list:async()=>{reads++;calls.push('list');return [row({status:operation==='delete'?'revoked':'active'})];},[operation==='delete'?'deleteRecord':operation]:async()=>{writes++;throw Error('FAKE_PRIVATE_RESPONSE');},reconcileWrite:async(write,{rows,signal})=>{calls.push('reconcile');assert.equal(write.operation,operation);assert.equal(write.targetId,operation==='create'?null:'key');assert.equal(rows.length,1);assert.equal(signal.aborted,false);assert(Object.isFrozen(write));assert(Object.isFrozen(rows));return 'not-applied';}});
  const manager=make(adapter);await manager.refresh();if(operation==='create')await start(manager);else{operation==='delete'?manager.openDeleteRecord('key'):manager.openRevoke('key');await (operation==='delete'?manager.confirmDeleteRecord():manager.confirmRevoke());}
  assert.equal(writes,1);manager.close();await manager.refresh();assert.equal(manager.getState().actionUncertain,true);const before=reads;await manager.recoverUncertainWrite();assert.equal(reads,before+1);assert.deepEqual(calls.slice(-2),['list','reconcile']);assert.equal(manager.getState().writeBlock,null);assert.equal(manager.readSecret(),null);assert.equal(writes,1);manager.destroy();
 }
});
test('missing, pending, invalid and failed reconciliation cannot unlock writes',async()=>{
 for(const result of [undefined,'pending','invalid',true,Error('FAKE_PRIVATE')]){
  let writes=0;const adapter=base({create:async()=>{writes++;throw Error('unconfirmed');},...(result===undefined?{}:{reconcileWrite:async()=>{if(result instanceof Error)throw result;return result;}})}),manager=make(adapter);await start(manager);manager.close();await manager.recoverUncertainWrite();assert.equal(manager.getState().actionUncertain,true);assert.equal(manager.getState().recoveryBusy,false);assert(manager.getState().recoveryError);manager.openCreate();await manager.submitCreate();assert.equal(writes,1);assert(!JSON.stringify(manager.getState()).includes('FAKE_PRIVATE'));manager.destroy();
 }
});
test('failed or superseded list queries cannot supply recovery evidence',async()=>{
 let fail=false,reconcile=0;const delayed=defer();const adapter=base({list:async()=>{if(fail)throw Error('FAKE_PRIVATE');return [row()];},create:async()=>{throw Error('unconfirmed');},reconcileWrite:()=>{reconcile++;return delayed.promise;}}),manager=make(adapter);await start(manager);manager.close();fail=true;await manager.recoverUncertainWrite();assert.equal(reconcile,0);assert.equal(manager.getState().actionUncertain,true);fail=false;const recovery=manager.recoverUncertainWrite();await tick();await tick();await manager.refresh();delayed.resolve('not-applied');await recovery;assert.equal(manager.getState().actionUncertain,true);assert(manager.getState().recoveryError);manager.destroy();
});
test('cancelled recovery ignores a late resolution and can be explicitly attempted again',async()=>{
 const delayed=defer();let reconciles=0,writes=0,signal;const manager=make(base({create:async()=>{writes++;throw Error('unconfirmed');},reconcileWrite:(_write,context)=>{signal=context.signal;return ++reconciles===1?delayed.promise:Promise.resolve('not-applied');}}));await start(manager);manager.close();const pending=manager.recoverUncertainWrite();await tick();await tick();await tick();manager.close();await pending;assert(signal.aborted);assert.equal(manager.getState().actionUncertain,true);delayed.resolve('not-applied');await tick();assert.equal(manager.getState().actionUncertain,true);await manager.recoverUncertainWrite();assert.equal(manager.getState().writeBlock,null);assert.equal(manager.readSecret(),null);assert.equal(writes,1);manager.destroy();
});
test('applied reconciliation does not recreate a result, one-time value or automatic write',async()=>{
 let writes=0;const manager=make(base({create:async()=>{writes++;throw Error('unconfirmed');},reconcileWrite:async()=> 'applied'}));await start(manager);assert.equal(manager.getState().phase,'create');await manager.recoverUncertainWrite();assert.equal(manager.getState().phase,'closed');assert.equal(manager.getState().writeBlock,null);assert.equal(manager.getState().rows.length,1);assert.equal(manager.readSecret(),null);assert.equal(writes,1);manager.destroy();
});
test('known rejections release the guard while transport, parse and server failures retain it',async()=>{
 for(const error of [new HttpError('business',{code:9}),new HttpError('http',{status:403}),new HttpError('network',{}),new HttpError('parse',{}),new HttpError('http',{status:500})]){
  let writes=0;const manager=make(base({create:async()=>{writes++;throw error;}}));await start(manager);const unknown=!(error.kind==='business'||error.kind==='http'&&error.status===403);assert.equal(manager.getState().actionUncertain,unknown);assert.equal(manager.getState().writeBlock!==null,unknown);manager.close();manager.openCreate();await start(manager);assert.equal(writes,unknown?1:2);manager.destroy();
 }
});
test('guard notification rebinding and recovery reentry never authorize another write',async()=>{
 const guard=createApiKeyWriteGuard();let count=0,off=()=>{},writes=0;const listener=()=>{count++;off();off=guard.subscribe(listener);};off=guard.subscribe(listener);
 const manager=make(base({create:async()=>{writes++;throw Error('unknown');},reconcileWrite:async()=> 'not-applied'}),{writeGuard:guard});await start(manager);assert.equal(count,2);manager.close();let changed=false;manager.subscribe(()=>{if(manager.getState().recoveryBusy&&!changed){changed=true;manager.close();}});await manager.recoverUncertainWrite();assert.equal(manager.getState().writeBlock.status,'uncertain');assert.equal(writes,1);assert(!JSON.stringify(guard.getState()).includes(secret));off();manager.destroy();
});

test('another owner resolving the shared write cancels stale recovery without leaving its busy state',async()=>{
 const held=defer(),entered=defer();let checks=0;
 const adapter=base({create:async()=>{throw Error('unknown');},reconcileWrite:async()=>{if(++checks===1){entered.resolve();return held.promise;}return 'not-applied';}}),a=make(adapter),b=make(adapter);
 await start(a);a.close();const pending=b.recoverUncertainWrite();await entered.promise;assert.equal(b.getState().recoveryBusy,true);await a.recoverUncertainWrite();await pending;assert.equal(b.getState().writeBlock,null);assert.equal(b.getState().recoveryBusy,false);
 await start(b);b.close();held.resolve('not-applied');await tick();assert.equal(b.getState().actionUncertain,true);assert.equal(b.getState().recoveryBusy,false);await b.recoverUncertainWrite();assert.equal(b.getState().writeBlock,null);a.destroy();b.destroy();
});

test('a query started by the final recovery notification retains the gate until fresh evidence',async()=>{
 let owner,changed=false,reads=0;const held=defer();const adapter=base({list:async()=>++reads===2?held.promise:[row()],create:async()=>{throw Error('unknown');},reconcileWrite:async()=> 'not-applied'});owner=make(adapter);await start(owner);owner.close();owner.subscribe(()=>{const state=owner.getState();if(!changed&&state.actionUncertain&&state.hasLoaded&&!state.recoveryBusy&&state.recoveryError===null){changed=true;void owner.refresh();}});await owner.recoverUncertainWrite();assert(changed);assert.equal(owner.getState().actionUncertain,true);assert.equal(owner.getState().listBusy,true);assert(owner.getState().recoveryError);held.resolve([row()]);await tick();await tick();await owner.recoverUncertainWrite();assert.equal(owner.getState().writeBlock,null);owner.destroy();
});
test('abort reentry preserves the newest list handle through cancel, replace and recovery startup',async()=>{
 for(const operation of ['cancelList','refresh','recoverUncertainWrite']){
  let owner,signals=[],reentered=false;const entered=defer();const adapter=base({list:({signal})=>{signals.push(signal);if(signals.length===1)signal.addEventListener('abort',()=>{if(!reentered){reentered=true;void owner.refresh();entered.resolve();}});return new Promise(()=>{});},create:async()=>{throw Error('unknown');},reconcileWrite:async()=> 'not-applied'});owner=make(adapter);if(operation==='recoverUncertainWrite'){await start(owner);owner.close();}void owner.refresh();await tick();void owner[operation]();await entered.promise;await tick();assert.equal(signals.length,2);assert.equal(signals[1].aborted,false);assert.equal(owner.getState().listBusy,true);owner.destroy();assert.equal(signals[1].aborted,true);assert.equal(owner.getState().phase,'closed');assert.equal(owner.getState().rows.length,0);
 }
});
test('write success cannot revive a destroyed owner or overwrite a new dialog from a list abort callback',async()=>{
 for(const operation of ['create','revoke','delete'])for(const outcome of ['destroy','new-dialog']){
  let owner,reads=0;const target=row({status:operation==='delete'?'revoked':'active'});
  const adapter=base({list:({signal})=>{if(operation!=='create'&&++reads===1)return Promise.resolve([target]);return new Promise(()=>{signal.addEventListener('abort',()=>{if(outcome==='destroy')owner.destroy();else{owner.close();owner.openCreate();owner.setDraft({name:'New intent'});}});});}});owner=make(adapter);
  if(operation!=='create')await owner.refresh();void owner.refresh();await tick();if(operation==='create')await start(owner);else{operation==='delete'?owner.openDeleteRecord('key'):owner.openRevoke('key');await (operation==='delete'?owner.confirmDeleteRecord():owner.confirmRevoke());}
  if(outcome==='destroy'){assert.equal(owner.getState().phase,'closed');assert.equal(owner.getState().rows.length,0);assert.equal(owner.getState().resultMetadata,null);}else{assert.equal(owner.getState().phase,'create');assert.equal(owner.getState().draft.name,'New intent');}
  assert.equal(owner.readSecret(),null);owner.destroy();
 }
});

test('reconciling another owner preserves an unrelated one-time result and closes only the applied originating dialog',async()=>{
 let sends=0;const adapter=base({create:async()=>{if(++sends===1)return {metadata:row(),secret};throw Error('unknown');},reconcileWrite:async()=> 'applied'}),a=make(adapter),b=make(adapter);
 await start(a);assert.equal(a.getState().phase,'result');assert.equal(a.readSecret(),secret);await start(b);assert.equal(b.getState().phase,'create');assert.equal(b.getState().actionUncertain,true);await a.recoverUncertainWrite();assert.equal(a.getState().phase,'result');assert.equal(a.readSecret(),secret);assert.equal(b.getState().phase,'closed');assert.equal(a.getState().writeBlock,null);assert.equal(b.getState().writeBlock,null);assert.equal(sends,2);assert(!JSON.stringify(a.getState()).includes(secret));a.destroy();b.destroy();
});
