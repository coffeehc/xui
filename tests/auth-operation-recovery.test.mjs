import test from 'node:test';
import assert from 'node:assert/strict';
import {createHttpClient} from '../packages/runtime/dist/http.js';
import {createAuthClient} from '../packages/runtime/dist/auth.js';
import {memoryOperationStore} from './helpers/operation-store.mjs';
const user={id:'42',username:'fixture',display_name:null},issued=()=>({schema_version:2,user,access_token:'bs-v1-sha256-access-'+'A'.repeat(43),token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()});
const wire=(payload,status=200,headers={})=>new Response(JSON.stringify({success:status===200,payload:status===200?payload:null,message:'',code:status*100+1,request_id:'fixture'}),{status,headers:{'Content-Type':'application/json',...headers}});
function server(){let scope=null,epoch='1',mode='ok',records=new Map(),requests=[];return {requests,records,setMode:value=>mode=value,setScope:value=>scope=value,fetch:async(url,init)=>{
 const path=new URL(url).pathname,h=new Headers(init.headers);requests.push({path,method:init.method,headers:Object.fromEntries(h)});
 if(path.endsWith('/recovery-session')){if(init.method==='POST'){scope='7';if(mode==='bootstrap-unknown')throw Error('lost bootstrap');}return scope?wire({schema_version:1,scope_id:scope,epoch}):wire(null,401);}
 if(path.includes('/operations/')){const id=path.split('/')[5],original=h.get('X-Auth-Epoch');let receipt=records.get(id)??{schema_version:1,scope_id:scope,epoch:original,operation_id:id,operation:h.get('X-Auth-Operation'),status:'pending',next_epoch:null};if(init.method==='POST'&&receipt.status==='pending'){epoch=String(BigInt(epoch)+1n);receipt={...receipt,status:'not_applied',next_epoch:String(BigInt(original)+1n)};records.set(id,receipt);}if(mode==='extra-receipt')return wire({...receipt,secret:'must reject'});return wire(receipt);}
 const operation=path.split('/').at(-1),id=h.get('X-Auth-Operation-ID'),original=h.get('X-Auth-Epoch');assert.match(id,/^[a-f0-9]{32}$/);assert.equal(h.get('X-Auth-Scope-ID'),scope);
 const status=mode==='denied'?'not_applied':mode==='pending'?'pending':'applied',next=status==='pending'?null:String(BigInt(original)+1n),receipt={schema_version:1,scope_id:scope,epoch:original,operation_id:id,operation,status,next_epoch:next};records.set(id,receipt);if(next)epoch=next;
 if(mode==='unknown'||mode==='pending')throw Error('lost response');const headers={'X-Auth-Scope-ID':scope,'X-Auth-Epoch':original,'X-Auth-Operation-ID':id,'X-Auth-Operation':operation,'X-Auth-Status':status,'X-Auth-Next-Epoch':next};if(mode==='wrong-receipt')headers['X-Auth-Operation-ID']='b'.repeat(32);if(mode==='duplicate-header')headers['X-Auth-Epoch']=original+', '+original;
 return wire(operation==='logout'?null:issued(),mode==='denied'?401:200,headers);
 }};}
const owner=(backend,store)=>{const http=createHttpClient({baseURL:'http://auth.example',fetch:backend.fetch});const auth=createAuthClient({http,recovery:{scope:'test',store,protocol:'operation-v1'}});return {auth,destroy(){auth.destroy();http.destroy();}};};
const login=auth=>auth.login({username:'fixture',password:'FAKE_PASSWORD'});
test('explicit operation protocol bootstraps then confirms scope before the first login and exact terminal clear',async()=>{
 const backend=server(),store=memoryOperationStore(),a=owner(backend,store);await login(a.auth);assert.deepEqual(backend.requests.map(r=>[r.method,r.path]),[['GET','/api/v1/auth/recovery-session'],['POST','/api/v1/auth/recovery-session'],['GET','/api/v1/auth/recovery-session'],['POST','/api/v1/auth/login']]);assert.equal(store.values.size,0);assert.equal(a.auth.getState().status,'authenticated');a.destroy();
});
test('unknown applied operation survives reload and GET authority settles without replaying credentials',async()=>{
 const backend=server(),store=memoryOperationStore();backend.setMode('unknown');const a=owner(backend,store);await assert.rejects(login(a.auth));a.destroy();const before=backend.requests.length,b=owner(backend,store);await assert.rejects(login(b.auth));assert.equal(backend.requests.length,before);backend.setMode('ok');assert.equal(await b.auth.inspectRecovery(),true);assert.equal(store.values.size,0);assert.equal(b.auth.getState().status,'anonymous');assert.equal(b.auth.getState().user,null);await login(b.auth);assert.equal(b.auth.getState().status,'authenticated');b.destroy();
});
test('GET pending never resolves; explicit Resolve is bound to the confirmed original ID',async()=>{
 const backend=server(),store=memoryOperationStore(),a=owner(backend,store);backend.setMode('pending');await assert.rejects(login(a.auth));const id=a.auth.getState().recovery.operationId;assert.equal(await a.auth.inspectRecovery(),false);const n=backend.requests.length;await assert.rejects(a.auth.resolveRecovery('b'.repeat(32)));assert.equal(backend.requests.length,n);assert.equal(store.values.size,1);assert.equal(await a.auth.resolveRecovery(id),true);assert.equal(store.values.size,0);assert.equal(backend.requests.filter(r=>r.path.endsWith('/resolve')).length,1);a.destroy();
});
test('known rejection requires exact not-applied headers; wrong or repeated headers never clear',async()=>{
 for(const mode of ['denied','wrong-receipt','duplicate-header']){const backend=server(),store=memoryOperationStore(),a=owner(backend,store);backend.setMode(mode);await assert.rejects(login(a.auth));assert.equal(store.values.size,mode==='denied'?0:1);a.destroy();}
});
test('bootstrap unknown is retained without pretending Resolve is available',async()=>{
 const backend=server(),store=memoryOperationStore(),a=owner(backend,store);backend.setMode('bootstrap-unknown');await assert.rejects(login(a.auth));assert.equal(a.auth.getState().recovery.reason,'bootstrap');assert.equal(a.auth.getState().recovery.canResolve,false);const n=backend.requests.length;await assert.rejects(a.auth.inspectRecovery());await assert.rejects(a.auth.resolveRecovery(a.auth.getState().recovery.operationId));await assert.rejects(login(a.auth));assert.equal(backend.requests.length,n);assert.equal(store.values.size,1);a.destroy();
});
test('receipt unknown fields or changed current cookie scope cannot clear the original gate',async()=>{
 for(const mode of ['extra-receipt','scope']){const backend=server(),store=memoryOperationStore(),a=owner(backend,store);backend.setMode('unknown');await assert.rejects(login(a.auth));const before=[...store.values];if(mode==='scope')backend.setScope('8');else backend.setMode(mode);await assert.rejects(a.auth.inspectRecovery());assert.deepEqual([...store.values],before);a.destroy();}
});

test('cancellation after durable reservation but before auth dispatch clears only the proven unsent attempt',async()=>{
 const backend=server();backend.setScope('7');const store=memoryOperationStore(),cas=store.compareExchange;let a;store.compareExchange=async(key,before,after)=>{const result=await cas(key,before,after);if(after&&JSON.parse(after).phase==='pending')a.auth.cancel();return result;};a=owner(backend,store);await assert.rejects(login(a.auth));await new Promise(resolve=>setImmediate(resolve));assert.equal(backend.requests.filter(item=>item.path.endsWith('/login')).length,0);assert.equal(store.values.size,0);a.destroy();
});
test('legacy unknown cannot acquire a new server scope or become an operation-v1 receipt',async()=>{
 const backend=server(),store=memoryOperationStore(),key='xui.auth.recovery.v1:'+JSON.stringify(['http://auth.example','/api/v1/auth/','test']);store.values.set(key,JSON.stringify({version:1,attempt:'a'.repeat(32),operation:'refresh'}));const a=owner(backend,store);await assert.rejects(login(a.auth));await assert.rejects(a.auth.inspectRecovery());assert.equal(backend.requests.length,0);assert.equal(store.values.size,1);assert.equal(a.auth.getState().recovery.reason,'legacy');a.destroy();
});
test('operation receipts never enter ordinary public HTTP responses, errors or auth state',async()=>{
 const backend=server(),store=memoryOperationStore(),a=owner(backend,store);backend.setMode('wrong-receipt');let error;try{await login(a.auth);}catch(value){error=value;}const visible=JSON.stringify({error,state:a.auth.getState()});assert(!visible.includes('FAKE_PASSWORD'));assert(!visible.includes('access_token'));assert(!visible.includes('X-Auth'));a.destroy();
});

test('shared BaseService seven-field fixture preserves scope and epoch beyond Number precision',async()=>{
 const {readFile}=await import('node:fs/promises'),fixture=JSON.parse(await readFile(new URL('./fixtures/auth-recovery.v1.json',import.meta.url),'utf8'));
 for(const status of ['pending','applied','not_applied']){
  const store=memoryOperationStore(),key='xui.auth.recovery.v1:'+JSON.stringify(['http://auth.example','/api/v1/auth/','test']),record={version:2,attempt:fixture.pending.operation_id,operation:'refresh',phase:'pending',scope_id:fixture.pending.scope_id,epoch:fixture.pending.epoch};store.values.set(key,JSON.stringify(record));
  const http=createHttpClient({baseURL:'http://auth.example',fetch:async(url,init)=>{assert.equal(init.method,'GET');if(url.endsWith('/recovery-session'))return wire({...fixture.recovery_session,epoch:status==='pending'?fixture.pending.epoch:fixture[status].next_epoch});const headers=new Headers(init.headers);assert.equal(headers.get('X-Auth-Scope-ID'),fixture.pending.scope_id);assert.equal(headers.get('X-Auth-Epoch'),fixture.pending.epoch);return wire(fixture[status]);}}),auth=createAuthClient({http,recovery:{scope:'test',store,protocol:'operation-v1'}});
  assert.equal(await auth.inspectRecovery(),status!=='pending');assert.equal(store.values.size,status==='pending'?1:0);auth.destroy();http.destroy();
 }
});
