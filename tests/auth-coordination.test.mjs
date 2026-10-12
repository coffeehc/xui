import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuthCoordination} from '../packages/runtime/dist/auth-coordination.js';
const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function browser(t){
 const storage=new Map(),channels=[],messages=[];let tail=Promise.resolve();
 const globals={window:{localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}},navigator:{locks:{request(_name,task){const next=tail.catch(()=>{}).then(task);tail=next;return next;}}},BroadcastChannel:class {constructor(){channels.push(this);}postMessage(data){messages.push({sender:this,data:structuredClone(data)});}close(){this.closed=true;}}};
 for(const [name,value] of Object.entries(globals)){const original=Object.getOwnPropertyDescriptor(globalThis,name);Object.defineProperty(globalThis,name,{configurable:true,value});t.after(()=>{if(original)Object.defineProperty(globalThis,name,original);else delete globalThis[name];});}
 return {storage,messages,deliver(message,recipient){const event=messages[message];channels[recipient].onmessage({data:event.data});}};
}
test('cross-tab mutations serialize through Web Locks and channels/storage contain only safe epoch metadata',async t=>{
 const harness=browser(t),a=createAuthCoordination('https://auth.example',()=>{}),b=createAuthCoordination('https://auth.example',()=>{}),held=deferred(),order=[];
 const first=a.run(async()=>{order.push('a');await held.promise;a.publish('login');}),second=b.run(async()=>{order.push('b');b.publish('refresh');});await flush();assert.deepEqual(order,['a']);held.resolve();await Promise.all([first,second]);assert.deepEqual(order,['a','b']);
 for(const {data} of harness.messages)assert.deepEqual(Object.keys(data).sort(),['epoch','kind']);for(const value of harness.storage.values())assert.deepEqual(Object.keys(JSON.parse(value)).sort(),['epoch','identityEpoch','kind']);a.close();b.close();
});
test('late old login/logout messages never invalidate a newer login; a refresh still carries missed identity invalidation',async t=>{
 const harness=browser(t),eventsA=[],eventsB=[],eventsC=[],a=createAuthCoordination('https://auth.example',event=>eventsA.push(event)),b=createAuthCoordination('https://auth.example',event=>eventsB.push(event)),c=createAuthCoordination('https://auth.example',event=>eventsC.push(event));
 await a.run(async()=>a.publish('logout'));await b.run(async()=>b.publish('login'));await b.run(async()=>b.publish('refresh'));
 harness.deliver(0,1);assert.deepEqual(eventsB,[]);harness.deliver(2,0);assert.equal(eventsA[0].kind,'login');harness.deliver(0,0);assert.equal(eventsA.length,1);
 harness.deliver(2,2);assert.equal(eventsC[0].kind,'login');harness.deliver(1,2);assert.equal(eventsC.length,1);a.close();b.close();c.close();
});
