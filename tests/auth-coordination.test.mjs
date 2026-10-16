import test from 'node:test';
import assert from 'node:assert/strict';
import {isolatedAuth} from './helpers/runtime-services.mjs';
import {createAuthCoordination} from '../packages/runtime/dist/auth-coordination.js';

const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function browser(t){
 const channels=[],messages=[];let tail=Promise.resolve();
 const globals={window:{},navigator:{locks:{request(_name,task){const next=tail.catch(()=>{}).then(task);tail=next;return next;}}},BroadcastChannel:class {constructor(){channels.push(this);}postMessage(data){messages.push({sender:this,data:structuredClone(data)});}close(){this.closed=true;}}};
 for(const [name,value] of Object.entries(globals)){const original=Object.getOwnPropertyDescriptor(globalThis,name);Object.defineProperty(globalThis,name,{configurable:true,value});t.after(()=>{if(original)Object.defineProperty(globalThis,name,original);else delete globalThis[name];});}
 return {messages,deliver(message,recipient){const event=messages[message];channels[recipient].onmessage({data:event.data});}};
}

test('cross-tab auth mutations serialize through Web Locks and broadcasts contain only safe epochs',async t=>{
 const harness=browser(t),a=createAuthCoordination('https://auth.example',()=>{}),b=createAuthCoordination('https://auth.example',()=>{}),held=deferred(),order=[];
 const first=a.run(async()=>{order.push('a');await held.promise;a.publish('login');}),second=b.run(async()=>{order.push('b');b.publish('refresh');});await flush();assert.deepEqual(order,['a']);held.resolve();await Promise.all([first,second]);assert.deepEqual(order,['a','b']);
 for(const {data} of harness.messages){assert.deepEqual(Object.keys(data).sort(),['epoch','kind']);assert(['login','logout','refresh'].includes(data.kind));assert.match(data.epoch,/^\d+$/);assert(!JSON.stringify(data).match(/password|token|fixture/i));}a.close();b.close();
});

test('a delayed older identity notification cannot invalidate a newer login',async t=>{
 const harness=browser(t),events=[],sender=createAuthCoordination('https://auth.example',()=>{}),receiver=createAuthCoordination('https://auth.example',event=>events.push(event));
 sender.publish('logout');sender.publish('login');harness.deliver(1,1);harness.deliver(0,1);assert.deepEqual(events.map(event=>event.kind),['login']);sender.close();receiver.close();
});

test('refresh notifications do not synthesize identity events that a tab did not receive',async t=>{
 const harness=browser(t),events=[],sender=createAuthCoordination('https://auth.example',()=>{}),receiver=createAuthCoordination('https://auth.example',event=>events.push(event));
 sender.publish('logout');sender.publish('login');sender.publish('refresh');harness.deliver(2,1);assert.deepEqual(events.map(event=>event.kind),['refresh']);
 harness.deliver(1,1);assert.deepEqual(events.map(event=>event.kind),['refresh','login']);sender.close();receiver.close();
});

test('a login notification invalidates a sibling auth owner without browser storage',async t=>{
 const harness=browser(t),user={id:'42',username:'fixture',display_name:null},token='bs-v1-sha256-access-'+'A'.repeat(43);
 const response=()=>new Response(JSON.stringify({success:true,message:'',payload:{schema_version:2,user,access_token:token,token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()},request_id:'',code:200}),{headers:{'Content-Type':'application/json'}});
 const ownerA=isolatedAuth({baseURL:'https://auth.example',fetch:async()=>response()},{}),ownerB=isolatedAuth({baseURL:'https://auth.example',fetch:async()=>response()},{}),{http:httpA,auth:a}=ownerA,{http:httpB,auth:b}=ownerB;
 t.after(()=>{ownerA.services.dispose();ownerB.services.dispose();});
 await a.login({username:'fixture',password:'FAKE_PASSWORD'});assert.equal(a.getState().status,'authenticated');assert.equal(harness.messages.length,1);harness.deliver(0,1);assert.equal(b.getState().status,'unknown');assert.equal(typeof globalThis.window.localStorage,'undefined');
 a.destroy();b.destroy();
});
