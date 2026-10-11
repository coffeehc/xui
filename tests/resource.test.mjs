import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createResource,loadStylesheet} from '../packages/runtime/dist/loading.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const tick=()=>Promise.resolve();
test('abort and empty callbacks cannot overwrite a replacement or destroyed owner',async()=>{
 const calls=[];let resource,third;
 resource=createResource({loader:(key,signal)=>{calls.push({key,signal});if(key==='A')signal.addEventListener('abort',()=>{third=resource.load('C');});return new Promise(()=>{});}});
 const first=resource.load('A');await tick();await resource.load('B');await tick();assert.equal(resource.getState().key,'C');assert.deepEqual(calls.map(call=>call.key),['A','C']);resource.cancel();await Promise.all([first,third]);assert.equal(calls[1].signal.aborted,true);assert.equal(resource.getState().busy,false);
 let emptyOwner;emptyOwner=createResource({loader:async()=>42,isEmpty:()=>{emptyOwner.destroy();return false;}});await emptyOwner.load('key');assert.equal(emptyOwner.getState().status,'idle');assert.equal(emptyOwner.getState().hasValue,false);
});
function fixture(options={}){const calls=[];const resource=createResource({...options,loader:(key,signal)=>{const next=deferred();calls.push({key,signal,...next});return next.promise;}});return {resource,calls};}

test('initial error, explicit retry, empty and same-key refresh preserve distinct facts',async()=>{
  const {resource,calls}=fixture({isEmpty:value=>value.length===0});const first=resource.load('A');assert.equal(resource.getState().status,'loading');await tick();calls[0].reject(Error('first failure'));await first;assert.equal(resource.getState().status,'error');assert.equal(resource.getState().hasValue,false);
  const retry=resource.retry();assert.equal(resource.getState().status,'retrying');await tick();calls[1].resolve([]);await retry;assert.equal(resource.getState().status,'empty');assert.equal(calls[1].signal.aborted,false);
  const refresh=resource.load('A');assert.equal(resource.getState().status,'refreshing');assert.deepEqual(resource.getState().value,[]);await tick();calls[2].reject(Error('refresh failure'));await refresh;assert.equal(resource.getState().status,'error');assert.equal(resource.getState().hasValue,true);assert.deepEqual(resource.getState().value,[]);resource.cancel();assert.equal(resource.getState().status,'empty');resource.destroy();
});
test('A slow/B fast, key change and uncooperative Abort never allow old writes',async()=>{
  const {resource,calls}=fixture();const a=resource.load('A');await tick();const b=resource.load('B');await tick();assert(calls[0].signal.aborted);assert.equal(resource.getState().key,'B');assert.equal(resource.getState().hasValue,false);calls[1].resolve('new B');await b;await a;calls[0].resolve('late A');await tick();assert.equal(resource.getState().value,'new B');assert.equal(resource.getState().status,'ready');
  const stale=resource.load('B');await tick();const newer=resource.load('B');await tick();calls[3].resolve('newest B');await newer;calls[2].reject(Error('late stale failure'));await stale;assert.equal(resource.getState().value,'newest B');assert.equal(resource.getState().error,null);resource.destroy();
});
test('cancel and destroy settle local waits while an underlying Promise keeps running',async()=>{
  const {resource,calls}=fixture();let notices=0;const off=resource.subscribe(()=>notices++);const pending=resource.load('A');await tick();resource.cancel();await pending;assert.equal(resource.getState().status,'idle');assert.equal(resource.getState().busy,false);calls[0].resolve('cancelled result');await tick();assert.equal(resource.getState().hasValue,false);
  const second=resource.load('A');await tick();resource.destroy();await second;const count=notices;calls[1].resolve('unmounted result');await tick();assert.equal(notices,count);assert.equal(resource.getState().busy,false);assert.equal(resource.getState().hasValue,false);off();resource.destroy();await resource.retry();assert.equal(notices,count);
});
test('host timeout ends local busy, does not declare service cancellation or auto retry',async()=>{
  const {resource,calls}=fixture({timeoutMs:15});await resource.load('A');assert.equal(calls.length,1);assert.equal(resource.getState().status,'error');assert.equal(resource.getState().error.name,'TimeoutError');assert.equal(resource.getState().busy,false);calls[0].resolve('late service result');await tick();assert.equal(resource.getState().hasValue,false);resource.destroy();
});
test('subscriber failure cannot become a data error; values remain immutable',async()=>{
  const resource=createResource({loader:async()=>42});let calls=0;const off=resource.subscribe(()=>{throw Error('view failed');});resource.subscribe(()=>calls++);await resource.load('A');assert.equal(resource.getState().status,'ready');assert.equal(resource.getState().value,42);assert(Object.isFrozen(resource.getState()));assert.equal(calls,2);off();resource.destroy();
});
test('stylesheet rejection/cancellation removes owned links and import stays SSR safe',async()=>{
  await assert.rejects(loadStylesheet('/optional.css'),/document is required/);
  const links=[];const doc={createElement(){return {remove(){this.removed=true;}};},head:{append(link){links.push(link);}}};
  const failed=loadStylesheet('/failed.css',{document:doc});links[0].onerror();await assert.rejects(failed,/failed/);assert.equal(links[0].removed,true);
  const signal=new AbortController();const cancelled=loadStylesheet('/cancel.css',{document:doc,signal:signal.signal});signal.abort();await assert.rejects(cancelled,{name:'AbortError'});assert.equal(links[1].removed,true);
  const ready=loadStylesheet('/ready.css',{document:doc});links[2].onload();assert.equal(await ready,links[2]);assert.equal(links[2].onload,null);
});
