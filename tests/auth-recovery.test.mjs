import test from 'node:test';
import assert from 'node:assert/strict';
import {createHttpClient} from '../packages/runtime/dist/http.js';
import {createAuthClient} from '../packages/runtime/dist/auth.js';
const user={id:'42',username:'demo',display_name:null};
const issued={schema_version:2,user,access_token:'bs-v1-sha256-access-'+'A'.repeat(43),token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()};
const response=(payload=issued,status=200)=>new Response(JSON.stringify({success:status===200,message:'',payload:status===200?payload:null,request_id:'test:recovery',code:status===200?200:status*100+1}),{status,headers:{'Content-Type':'application/json'}});
const store=()=>{const data=new Map();return {data,async read(key){return data.get(key)??null;},async compareExchange(key,expected,next){const current=data.get(key)??null;if(current!==expected)return {exchanged:false,current};if(next===null)data.delete(key);else data.set(key,next);return {exchanged:true,current:next};}};};
const owner=(store,fetch,scope='session-a',origin='https://auth.example',storage)=>{const http=createHttpClient({baseURL:origin,fetch});const auth=createAuthClient({http,recovery:{scope,store,storage}});return {auth,destroy(){auth.destroy();http.destroy();}};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('unknown refresh survives a new document and cannot be overwritten by login or logout without a server fence',async()=>{
 const storage=store();let sends=0;const a=owner(storage,async()=>{sends++;throw Error('unknown');});await assert.rejects(a.auth.currentUser());a.destroy();
 const b=owner(storage,async()=>{sends++;return response();});await tick();assert.equal(b.auth.getState().reauthenticationRequired,true);assert.equal(b.auth.getState().error,null);
 for(const run of [()=>b.auth.currentUser(),()=>b.auth.refresh(),()=>b.auth.login({username:'demo',password:'FAKE_PASSWORD'}),()=>b.auth.logout()])await assert.rejects(run());assert.equal(sends,1);
 assert(!/password|access_token|Bearer|demo/.test(JSON.stringify([...storage.data])));b.auth.expire();await assert.rejects(b.auth.currentUser());assert.equal(storage.data.size,1);b.destroy();
});
test('atomic store failure is fail-closed before cookie mutation dispatch',async()=>{
 for(const mode of ['read','write','verify']){
  let sends=0;const storage={async read(){if(mode==='read')throw Error('denied');return null;},async compareExchange(){if(mode==='write')throw Error('quota');return {exchanged:false,current:null};}};
  const a=owner(storage,async()=>{sends++;return response();});await assert.rejects(a.auth.refresh());await assert.rejects(a.auth.login({username:'demo',password:'FAKE'}));await assert.rejects(a.auth.logout());assert.equal(sends,0);assert.equal(a.auth.getState().reauthenticationRequired,true);a.destroy();
 }
});
test('server and session scopes isolate pending facts; fresh denied login settles its own record',async()=>{
 const storage=store(),a=owner(storage,async()=>{throw Error('unknown');});await assert.rejects(a.auth.refresh());a.destroy();
 for(const [scope,origin] of [['session-b','https://auth.example'],['session-a','https://other.example']]){const b=owner(storage,async()=>response(),scope,origin);await b.auth.refresh();b.destroy();}assert.equal(storage.data.size,1);
 const fresh=store(),b=owner(fresh,async()=>response(null,401));await assert.rejects(b.auth.login({username:'demo',password:'FAKE'}));assert.equal(fresh.data.size,0);b.destroy();
});
test('a stale response cannot clear a newer record, and destruction retains dispatched pending',async()=>{
 const storage=store();let release;const a=owner(storage,()=>new Promise(resolve=>release=resolve));const pending=a.auth.refresh();while(!release)await tick();const [key]=storage.data.keys();storage.data.set(key,'newer-attempt');release(response());await assert.rejects(pending);assert.equal(storage.data.get(key),'newer-attempt');a.destroy();
 const fresh=store();let send;const b=owner(fresh,()=>new Promise(resolve=>send=resolve));const held=b.auth.refresh();while(!send)await tick();b.destroy();send(response());await assert.rejects(held);assert.equal(fresh.data.size,1);
});
test('successful first HTTP login, refresh, logout and authoritative absent-session settle only their own pending',async()=>{
 for(const operation of ['login','refresh','logout','absent']){const storage=store(),a=owner(storage,async()=>response(operation==='logout'?null:issued,operation==='absent'?401:200),'intranet','http://intranet.example');if(operation==='login')await a.auth.login({username:'demo',password:'FAKE'});else if(operation==='logout')await a.auth.logout();else await a.auth.refresh();assert.equal(storage.data.size,0);a.destroy();}
});
test('invalidation while reservation awaits commits clears only a proven unsent own attempt',async()=>{
 const storage=store();let a,sends=0;const cas=storage.compareExchange;storage.compareExchange=async(...args)=>{const result=await cas(...args);if(args[2]!==null)a.auth.expire();return result;};
 a=owner(storage,async()=>{sends++;return response();});await assert.rejects(a.auth.refresh());await tick();assert.equal(sends,0);assert.equal(storage.data.size,0);a.destroy();
});
test('two owners without Web Locks cannot overwrite a sent unknown login, even after its fetch promise ends',async()=>{
 const storage=store();let reject,sends=0;const a=owner(storage,()=>{sends++;return new Promise((_,no)=>reject=no);}),b=owner(storage,async()=>{sends++;return response();});
 const first=a.auth.login({username:'demo',password:'FAKE'});while(!reject)await tick();const original=[...storage.data];await assert.rejects(b.auth.login({username:'demo',password:'FAKE'}));reject(Error('unknown'));await assert.rejects(first);
 await assert.rejects(b.auth.login({username:'demo',password:'FAKE'}));assert.equal(sends,1);assert.deepEqual([...storage.data],original);a.destroy();b.destroy();const c=owner(storage,async()=>{sends++;return response();});await assert.rejects(c.auth.currentUser());assert.equal(sends,1);c.destroy();
});
test('legacy uncertainty imports into an empty atomic store and is never treated as a free slot',async()=>{
 const storage=store(),old=new Map(),key='xui.auth.recovery.v1:'+JSON.stringify(['https://auth.example','/api/v1/auth/','session-a']);old.set(key,JSON.stringify({version:1,attempt:'a'.repeat(32),operation:'refresh'}));let sends=0;
 const a=owner(storage,async()=>{sends++;return response();},'session-a','https://auth.example',{getItem:key=>old.get(key)??null,setItem(){},removeItem(){}});await assert.rejects(a.auth.login({username:'demo',password:'FAKE'}));assert.equal(sends,0);assert.equal(storage.data.get(key),old.get(key));assert.equal(old.size,1);a.destroy();
});
