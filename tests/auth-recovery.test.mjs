import test from 'node:test';
import assert from 'node:assert/strict';
import {createHttpClient} from '../packages/runtime/dist/http.js';
import {createAuthClient} from '../packages/runtime/dist/auth.js';
const user={id:'42',username:'demo',display_name:null};
const issued={schema_version:2,user,access_token:'bs-v1-sha256-access-'+'A'.repeat(43),token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()};
const response=(payload=issued,status=200)=>new Response(JSON.stringify({success:status===200,message:'',payload:status===200?payload:null,request_id:'test:recovery',code:status===200?200:status*100+1}),{status,headers:{'Content-Type':'application/json'}});
const store=()=>{const data=new Map();return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};};
const owner=(storage,fetch,scope='session-a',origin='https://auth.example')=>{const http=createHttpClient({baseURL:origin,fetch});const auth=createAuthClient({http,recovery:{scope,storage}});return {auth,destroy(){auth.destroy();http.destroy();}};};
test('unknown refresh survives a new document owner; only explicit successful login clears its non-secret fence',async()=>{
 const storage=store();let sends=0;const a=owner(storage,async()=>{sends++;throw Error('unknown');});await assert.rejects(a.auth.currentUser());assert.equal(sends,1);a.destroy();
 const b=owner(storage,async()=>{sends++;return response();});assert.equal(b.auth.getState().reauthenticationRequired,true);await assert.rejects(b.auth.currentUser());await assert.rejects(b.auth.refresh());assert.equal(sends,1);
 const saved=JSON.stringify([...storage.data]);assert(!/password|access_token|Bearer|demo/.test(saved));b.auth.expire();await assert.rejects(b.auth.currentUser());assert.equal(sends,1);
 await b.auth.login({username:'demo',password:'FAKE_PASSWORD'});assert.equal(storage.data.size,0);assert.equal(b.auth.getState().reauthenticationRequired,false);b.destroy();
});
test('storage failure is fail-closed before every cookie mutation dispatch',async()=>{
 for(const mode of ['read','write','verify']){
  let sends=0;const storage={getItem(){if(mode==='read')throw Error('denied');return null;},setItem(){if(mode==='write')throw Error('quota');},removeItem(){}};
  const a=owner(storage,async()=>{sends++;return response();});await assert.rejects(a.auth.refresh());await assert.rejects(a.auth.login({username:'demo',password:'FAKE'}));await assert.rejects(a.auth.logout());assert.equal(sends,0);assert.equal(a.auth.getState().reauthenticationRequired,true);a.destroy();
 }
});
test('scope and server isolation; denied login retains previous uncertainty; authoritative logout clears it',async()=>{
 const storage=store(),a=owner(storage,async()=>{throw Error('unknown');});await assert.rejects(a.auth.refresh());a.destroy();
 for(const [scope,origin] of [['session-b','https://auth.example'],['session-a','https://other.example']]){const b=owner(storage,async()=>response(),scope,origin);assert.equal(b.auth.getState().reauthenticationRequired,false);await b.auth.refresh();b.destroy();}
 const before=[...storage.data],b=owner(storage,async()=>response(null,401));await assert.rejects(b.auth.login({username:'demo',password:'FAKE'}));assert.deepEqual([...storage.data],before);assert.equal(b.auth.getState().reauthenticationRequired,true);b.destroy();
 const c=owner(storage,async()=>response(null));await c.auth.logout();assert.equal(storage.data.size,0);c.destroy();
});
test('a stale response cannot clear a newer attempt, and destruction retains pending dispatch',async()=>{
 const storage=store();let release;const a=owner(storage,()=>new Promise(resolve=>release=resolve));const pending=a.auth.refresh();while(!release)await new Promise(resolve=>setImmediate(resolve));const [key]=storage.data.keys();storage.setItem(key,'newer-attempt');release(response());await assert.rejects(pending);assert.equal(storage.getItem(key),'newer-attempt');a.destroy();
 const fresh=store();let send;const b=owner(fresh,()=>new Promise(resolve=>send=resolve));const held=b.auth.refresh();while(!send)await new Promise(resolve=>setImmediate(resolve));b.destroy();send(response());await assert.rejects(held);assert.equal(fresh.data.size,1);const c=owner(fresh,async()=>{throw Error('must not send');});assert.equal(c.auth.getState().reauthenticationRequired,true);c.destroy();
});
test('successful refresh and authoritative absent-session response settle only their own pending fence',async()=>{
 for(const status of [200,401]){const storage=store(),a=owner(storage,async()=>response(issued,status));await a.auth.refresh();assert.equal(storage.data.size,0);a.destroy();}
});
test('reentrant invalidation before dispatch restores only its own pending fence',async()=>{
 const storage=store();let a,sends=0;const set=storage.setItem;storage.setItem=(key,value)=>{set(key,value);a.auth.expire();};
 a=owner(storage,async()=>{sends++;return response();});await assert.rejects(a.auth.refresh());assert.equal(sends,0);assert.equal(storage.data.size,0);a.destroy();
});
test('durable fences work without secure-context randomUUID on HTTP intranet hosts',async()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto'),crypto=globalThis.crypto;
 Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:crypto.getRandomValues.bind(crypto)}});
 try{const storage=store(),a=owner(storage,async()=>response(),'intranet-session','http://intranet.example');await a.auth.refresh();assert.equal(storage.data.size,0);a.destroy();}finally{Object.defineProperty(globalThis,'crypto',descriptor);}
});
