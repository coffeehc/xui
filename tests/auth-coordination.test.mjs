import test from 'node:test';
import assert from 'node:assert/strict';
import {isolatedAuth} from './helpers/runtime-services.mjs';
import {createAuthCoordination} from '../packages/runtime/dist/auth-coordination.js';

const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function browser(t,failureDelay){
 const channels=[],messages=[];let tail=Promise.resolve();
 const storage=new Map();
 const globals={window:{localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}},navigator:{locks:{request(_name,task){const next=tail.catch(()=>{}).then(task);tail=next;return failureDelay?next.catch(async error=>{await failureDelay();throw error;}):next;}}},BroadcastChannel:class {constructor(){channels.push(this);}postMessage(data){messages.push({sender:this,data:structuredClone(data)});}close(){this.closed=true;}}};
 for(const [name,value] of Object.entries(globals)){const original=Object.getOwnPropertyDescriptor(globalThis,name);Object.defineProperty(globalThis,name,{configurable:true,value});t.after(()=>{if(original)Object.defineProperty(globalThis,name,original);else delete globalThis[name];});}
 return {messages,deliver(message,recipient){const event=messages[message];channels[recipient].onmessage({data:event.data});}};
}

test('same-millisecond sibling password events cannot fence a later explicit login',async t=>{
 const harness=browser(t),storage=new Map();window.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};t.mock.method(Date,'now',()=>1900000000000);
 const user={id:'42',username:'fixture',display_name:null},token='bs-v1-sha256-access-'+'A'.repeat(43),issued={schema_version:2,user,access_token:token,token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()};
 const response=payload=>new Response(JSON.stringify({success:true,message:'',payload,request_id:'',code:200}));
 const make=()=>isolatedAuth({baseURL:'https://auth.example',fetch:async url=>response(url.endsWith('/password')?{schema_version:1,changed:true,reauthenticate:true}:issued)},{});
 const a=make(),b=make();t.after(()=>{a.services.dispose();b.services.dispose();});
 await a.auth.login({username:'fixture',password:'FAKE'});await b.auth.login({username:'fixture',password:'FAKE'});await a.auth.changePassword({current_password:'FAKE_CURRENT',new_password:'FAKE_NEW'});const older=harness.messages.length-1;
 await b.auth.login({username:'fixture',password:'FAKE'});assert(BigInt(harness.messages.at(-1).data.epoch)>BigInt(harness.messages[older].data.epoch));harness.deliver(older,1);assert.equal(b.auth.getState().status,'authenticated');
 assert.equal(storage.size,1);assert.match([...storage.values()][0],/^\d+$/);assert(!JSON.stringify([...storage]).includes('FAKE'));
});

test('blocked coordination storage never blocks login and equal fallback identity epochs are ignored',async t=>{
 const harness=browser(t);Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});t.mock.method(Date,'now',()=>1900000000000);
 const events=[],a=createAuthCoordination('https://auth.example',()=>{}),b=createAuthCoordination('https://auth.example',e=>events.push(e));a.publish('password');b.publish('login');harness.deliver(0,1);assert.equal(events.length,0);a.close();b.close();
});

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

test('a login notification invalidates a sibling auth owner with metadata-only storage',async t=>{
 const harness=browser(t),user={id:'42',username:'fixture',display_name:null},token='bs-v1-sha256-access-'+'A'.repeat(43);
 const response=()=>new Response(JSON.stringify({success:true,message:'',payload:{schema_version:2,user,access_token:token,token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()},request_id:'',code:200}),{headers:{'Content-Type':'application/json'}});
 const ownerA=isolatedAuth({baseURL:'https://auth.example',fetch:async()=>response()},{}),ownerB=isolatedAuth({baseURL:'https://auth.example',fetch:async()=>response()},{}),{http:httpA,auth:a}=ownerA,{http:httpB,auth:b}=ownerB;
 t.after(()=>{ownerA.services.dispose();ownerB.services.dispose();});
 await a.login({username:'fixture',password:'FAKE_PASSWORD'});assert.equal(a.getState().status,'authenticated');assert.equal(harness.messages.length,1);harness.deliver(0,1);assert.equal(b.getState().status,'unknown');assert.match(window.localStorage.getItem('xui.auth.clock.v1:https://auth.example'),/^\d+$/);
 a.destroy();b.destroy();
});


test('confirmed password change expires sibling credentials through safe password epochs',async t=>{
 const harness=browser(t),user={id:'42',username:'fixture',display_name:null},token='bs-v1-sha256-access-'+'A'.repeat(43),issued={schema_version:2,user,access_token:token,token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()};
 const response=payload=>new Response(JSON.stringify({success:true,message:'',payload,request_id:'',code:200}));
 const make=()=>isolatedAuth({baseURL:'https://auth.example',fetch:async url=>response(url.endsWith('/password')?{schema_version:1,changed:true,reauthenticate:true}:issued)},{});
 const a=make(),b=make();t.after(()=>{a.services.dispose();b.services.dispose();});await a.auth.login({username:'fixture',password:'FAKE'});await b.auth.login({username:'fixture',password:'FAKE'});await a.auth.changePassword({current_password:'FAKE_CURRENT',new_password:'FAKE_NEW'});assert.equal(harness.messages.at(-1).data.kind,'password');harness.deliver(harness.messages.length-1,1);assert.equal(b.auth.getState().status,'anonymous');assert.equal(b.auth.getState().user,null);assert.deepEqual(Object.keys(harness.messages.at(-1).data).sort(),['epoch','kind']);assert(!JSON.stringify(harness.messages.map(e=>e.data)).includes('FAKE'));
});

test('global password cancellation immediately fences sibling sessions and ignores late acknowledgement',async t=>{
 const harness=browser(t),held=deferred(),user={id:'42',username:'fixture',display_name:null},token='bs-v1-sha256-access-'+'A'.repeat(43),issued={schema_version:2,user,access_token:token,token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()};
 const response=payload=>new Response(JSON.stringify({success:true,message:'',payload,request_id:'',code:200}));const make=()=>isolatedAuth({baseURL:'https://auth.example',fetch:async url=>url.endsWith('/password')?held.promise:response(issued)},{});const a=make(),b=make();t.after(()=>{a.services.dispose();b.services.dispose();});await a.auth.login({username:'fixture',password:'FAKE'});await b.auth.login({username:'fixture',password:'FAKE'});const pending=a.auth.changePassword({current_password:'FAKE_CURRENT',new_password:'FAKE_NEW'}),failed=assert.rejects(pending,e=>e.kind==='cancel');await flush();a.auth.cancel();await failed;const event=harness.messages.length-1;assert.equal(harness.messages[event].data.kind,'password');harness.deliver(event,1);assert.equal(await b.auth.currentUser(),null);await assert.rejects(b.auth.refresh(),e=>e.status===401);await a.auth.login({username:'fixture',password:'FAKE'});held.resolve(response({schema_version:1,changed:true,reauthenticate:true}));await flush();assert.equal(a.auth.getState().status,'authenticated');assert.equal(b.auth.getState().status,'anonymous');
});


test('a delayed password failure reuses its dispatch watermark after a sibling completes a new login',async t=>{
 const gate=deferred();let parked=false;const harness=browser(t,()=>{parked=true;return gate.promise;}),user={id:'42',username:'fixture',display_name:null},token='bs-v1-sha256-access-'+'A'.repeat(43),issued={schema_version:2,user,access_token:token,token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()};
 const response=payload=>new Response(JSON.stringify({success:true,message:'',payload,request_id:'',code:200}));const make=()=>isolatedAuth({baseURL:'https://auth.example',fetch:async url=>url.endsWith('/password')?new Response(JSON.stringify({success:false,message:'',payload:null,request_id:'',code:50300}),{status:503}):response(issued)},{});const a=make(),b=make();t.after(()=>{gate.resolve();a.services.dispose();b.services.dispose();});
 await a.auth.login({username:'fixture',password:'FAKE'});await b.auth.login({username:'fixture',password:'FAKE'});const pending=a.auth.changePassword({current_password:'FAKE_CURRENT',new_password:'FAKE_NEW'}),failure=assert.rejects(pending,e=>e.status===503);await flush();assert(parked);
 await b.auth.login({username:'fixture',password:'FAKE_NEW_LOGIN'});const loginEpoch=harness.messages.at(-1).data.epoch;gate.resolve();await failure;const old=harness.messages.length-1;assert.equal(harness.messages[old].data.kind,'password');assert(BigInt(harness.messages[old].data.epoch)<BigInt(loginEpoch));harness.deliver(old,1);assert.equal(b.auth.getState().status,'authenticated');
});
