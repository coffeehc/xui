import test from 'node:test';
import assert from 'node:assert/strict';
import {isolatedClipboard,disposeServices} from './helpers/runtime-services.mjs';

const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

test('clipboard service serializes actual writes and preserves FIFO order',async()=>{
 const first=deferred(),active=new Set(),writes=[];const service=isolatedClipboard({writeText:async(value)=>{assert.equal(active.size,0);active.add(value);writes.push(value);if(value==='first')await first.promise;active.delete(value);}});
 const a=service.writeText('first'),b=service.writeText('second');await tick();assert.deepEqual(writes,['first']);first.resolve();await Promise.all([a,b]);assert.deepEqual(writes,['first','second']);assert.equal(active.size,0);disposeServices(service);
});

test('clipboard cancellation removes queued writes and isolates late active completion',async()=>{
 const first=deferred(),late=deferred(),writes=[];const service=isolatedClipboard({writeText:value=>{writes.push(value);if(value==='active')return first.promise;if(value==='late')return late.promise;}}),activeAbort=new AbortController(),queuedAbort=new AbortController();
 const active=service.writeText('active',{signal:activeAbort.signal});await tick();const removed=service.writeText('removed',{signal:queuedAbort.signal}),next=service.writeText('next');queuedAbort.abort();await assert.rejects(removed,{name:'AbortError'});activeAbort.abort();await assert.rejects(active,{name:'AbortError'});await tick();assert.deepEqual(writes,['active']);
 first.resolve();await next;assert.deepEqual(writes,['active','next']);
 const abortLate=new AbortController(),latePromise=service.writeText('late',{signal:abortLate.signal});await tick();abortLate.abort();await assert.rejects(latePromise,{name:'AbortError'});const after=service.writeText('after');await tick();assert.deepEqual(writes,['active','next','late']);late.resolve();await after;assert.deepEqual(writes,['active','next','late','after']);disposeServices(service);
});

test('clipboard reports writer failures once and disposal never destroys an injected platform writer',async()=>{
 let attempts=0,destroys=0;const writer={async writeText(value){attempts++;if(value==='failure')throw new Error('denied');},destroy(){destroys++;}};
 const service=isolatedClipboard({writeText:(value,options)=>writer.writeText(value,options)});await assert.rejects(service.writeText('failure'),/denied/);await service.writeText('success');disposeServices(service);assert.equal(attempts,2);assert.equal(destroys,0);
});

test('clipboard cancellation before the scheduled writer call prevents platform IO',async()=>{
 let calls=0;const service=isolatedClipboard({writeText:()=>{calls++;}}),abort=new AbortController(),write=service.writeText('never-started',{signal:abort.signal});abort.abort();await assert.rejects(write,{name:'AbortError'});await tick();assert.equal(calls,0);disposeServices(service);
});
