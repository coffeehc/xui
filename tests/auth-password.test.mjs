import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {isolatedAuth} from './helpers/runtime-services.mjs';
const user={id:'42',username:'fixture',display_name:null},token='bs-v1-sha256-access-'+'A'.repeat(43);
const issued={schema_version:2,user,access_token:token,token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()};
const changed={schema_version:1,changed:true,reauthenticate:true},secret={current_password:'FAKE_CURRENT',new_password:'FAKE_NEW'};
const wire=payload=>({success:true,message:'',payload,request_id:'fixture',code:200});
const json=(payload,status=200,code=status===200?200:status*100+1)=>new Response(JSON.stringify({...wire(payload),success:status<400,code}),{status,headers:{'Content-Type':'application/json'}});
const deferred=()=>{let resolve;return {promise:new Promise(done=>resolve=done),resolve:value=>resolve(value)};};
const flush=async()=>{for(let i=0;i<60;i++)await Promise.resolve();};
const path=url=>new URL(url).pathname.split('/').at(-1);
async function owner(t,password,options={}){
 const calls=[],errors=[],client=isolatedAuth({baseURL:'https://auth.example',onError:error=>errors.push(error),fetch:async(url,init)=>{const operation=path(url);calls.push({operation,init});if(operation==='password')return password(url,init);return json(operation==='session'?{schema_version:2,user}:operation==='logout'?null:issued);}},{timeoutMs:1000,...options});
 t.after(()=>client.services.dispose());await client.auth.login({username:'fixture',password:'FAKE_LOGIN'});return {...client,calls,errors};
}
test('official password contract is one owner-only PUT and success clears access without issuing credentials',async t=>{
 const fixture=JSON.parse(await readFile('tests/fixtures/contracts/password-change.v1.json'));const c=await owner(t,async()=>json(fixture.response.payload));
 await c.auth.changePassword(secret);const sent=c.calls.filter(x=>x.operation==='password');assert.equal(sent.length,1);const {init}=sent[0];
 assert.equal(init.method,fixture.method);assert.equal(init.credentials,'omit');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert.equal(init.headers.get('Authorization'),`Bearer ${token}`);assert.equal(init.headers.get('Content-Type'),'application/json');assert.deepEqual(Object.keys(JSON.parse(init.body)).sort(),fixture.request_fields.toSorted());assert.deepEqual(JSON.parse(init.body),secret);
 assert.equal(c.auth.getState().status,'anonymous');assert.equal(await c.auth.currentUser(),null);assert.equal(c.calls.length,2);assert(!JSON.stringify(c.auth.getState()).includes(token));
 await assert.rejects(c.http.request(fixture.path,{method:'PUT',json:secret}),/auth owner/);assert.equal(c.calls.length,2);
});
test('closed confirmation rejects aliases, extras, wrong schema and false flags with no automatic recovery or replay',async t=>{
 for(const payload of [null,{changed:true},{...changed,schema_version:2},{...changed,changed:false},{...changed,reauthenticate:false},{...changed,access_token:'FAKE'},{...changed,extra:true}]){
  const c=await owner(t,async()=>json(payload));await assert.rejects(c.auth.changePassword(secret),error=>error.kind==='parse');assert.equal(c.auth.getState().status,'anonymous');assert.equal(c.calls.length,2);assert.equal(c.auth.getState().busy,null);
 }
});
test('invalid inputs and already cancelled calls send no password write and preserve the existing identity',async t=>{
 const c=await owner(t,async()=>json(changed));for(const input of [{current_password:'',new_password:'abcdef'},{current_password:'x'.repeat(129),new_password:'abcdef'},{current_password:'\ud800',new_password:'abcdef'},{...secret,new_password:'short'},{...secret,new_password:'\ud800abcdef'}])await assert.rejects(c.auth.changePassword(input),error=>error.kind==='parse');
 const abort=new AbortController();abort.abort();await assert.rejects(c.auth.changePassword(secret,{signal:abort.signal}),error=>error.kind==='cancel');assert.equal(c.calls.length,1);assert.equal(c.auth.getState().status,'authenticated');
});
test('official refusals keep editable state, 401/conflict expire locally, and follow-up failure never recovers or replays',async t=>{
 for(const [status,code]of [[400,40001],[403,40301],[429,42901],[501,50101],[401,40101],[409,40901],[503,50301],[503,50302],[503,50300]]){
  const c=await owner(t,async()=>json(null,status,code));await assert.rejects(c.auth.changePassword(secret),e=>e.status===status&&e.code===code);assert.equal(c.auth.getState().status,[400,403,429,501].includes(status)?'authenticated':'anonymous');assert.equal(c.auth.getState().busy,null);assert.equal(c.calls.length,2);assert.equal(c.auth.getState().error.business,undefined);
 }
});
test('password write blocks duplicate submissions and concurrent session/refresh without new requests',async t=>{
 const held=deferred(),c=await owner(t,()=>held.promise),pending=c.auth.changePassword(secret);await flush();assert.equal(c.auth.getState().busy,'password');
 await Promise.all([c.auth.changePassword(secret),c.auth.currentUser(),c.auth.refresh()].map(p=>assert.rejects(p,e=>e.kind==='cancel')));assert.equal(c.calls.length,2);held.resolve(json(changed));await pending;assert.equal(c.auth.getState().status,'anonymous');
});
test('timeout after a server commit remains unknown locally and a late acknowledgement cannot restore access',async t=>{
 const held=deferred();let committed=false;const c=await owner(t,()=>{committed=true;return held.promise;},{timeoutMs:20});
 await assert.rejects(c.auth.changePassword(secret),e=>e.kind==='timeout');assert(committed);assert.equal(c.calls.length,2);assert(c.calls[1].init.signal.aborted);assert.equal(c.auth.getState().status,'anonymous');held.resolve(json(changed));await flush();assert.equal(c.auth.getState().status,'anonymous');assert.equal(c.calls.length,2);
});
test('caller cancellation ends waiting and clears this credential generation without replaying an uncertain write',async t=>{
 const held=deferred(),c=await owner(t,()=>held.promise),abort=new AbortController(),pending=c.auth.changePassword(secret,{signal:abort.signal});await flush();abort.abort();await assert.rejects(pending,e=>e.kind==='cancel');assert.equal(c.auth.getState().status,'anonymous');assert(c.calls[1].init.signal.aborted);held.resolve(json(changed));await flush();assert.equal(c.calls.length,2);
});
test('late session replies cannot restore identity across a password generation',async t=>{
 const held=deferred(),c=await owner(t,async()=>json(changed));const original=c.calls;
 // A separate fixture controls a real in-flight session response.
 const d=isolatedAuth({baseURL:'https://race.example',fetch:async(url)=>path(url)==='session'?held.promise:json(path(url)==='password'?changed:issued)},{timeoutMs:1000});t.after(()=>d.services.dispose());await d.auth.login({username:'fixture',password:'FAKE'});
 const old=d.auth.currentUser(),rejected=assert.rejects(old,e=>e.kind==='cancel');await flush();await d.auth.changePassword(secret);held.resolve(json({schema_version:2,user}));await rejected;assert.equal(d.auth.getState().status,'anonymous');assert.equal(original.length,1);
});
test('password mutation waits for refresh, uses its current token, and old password replies cannot expire a newer login',async t=>{
 const refresh=deferred(),write=deferred(),calls=[];let next='login';const d=isolatedAuth({baseURL:'https://race.example',fetch:async(url,init)=>{calls.push({op:path(url),auth:init.headers.get('Authorization')});if(path(url)==='refresh')return refresh.promise;if(path(url)==='password')return write.promise;return json(issued);}},{timeoutMs:1000});t.after(()=>d.services.dispose());await d.auth.login({username:'fixture',password:'FAKE'});const restoring=d.auth.refresh();await flush();const changing=d.auth.changePassword(secret),cancelled=assert.rejects(changing,e=>e.kind==='cancel');await flush();assert.equal(calls.filter(x=>x.op==='password').length,0);refresh.resolve(json(issued));await restoring;await flush();assert.equal(calls.at(-1).op,'password');d.auth.cancel();await d.auth.login({username:'fixture',password:'FAKE'});write.resolve(json(changed));await cancelled;assert.equal(d.auth.getState().status,'authenticated');assert.equal(calls.filter(x=>x.op==='password').length,1);
});
test('untrusted error messages never reach auth state, caller errors or HTTP diagnostics',async t=>{
 const c=await owner(t,async()=>new Response(JSON.stringify({...wire(null),success:false,code:40001,message:secret.current_password+secret.new_password}),{status:400}));
 await assert.rejects(c.auth.changePassword(secret),error=>{assert.equal(error.business,undefined);assert(!String(error).includes('FAKE_'));return true;});assert(!JSON.stringify(c.errors).includes('FAKE_'));assert(c.errors.every(e=>!e.business?.message));assert(!JSON.stringify(c.auth.getState()).includes('FAKE_'));
});

test('preflight refresh and the write share one end-to-end timeout budget',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:Date.now()});const refresh=deferred(),write=deferred(),calls=[];
 const c=isolatedAuth({baseURL:'https://budget.example',fetch:async(url)=>{calls.push(path(url));return path(url)==='refresh'?refresh.promise:path(url)==='password'?write.promise:json(issued);}},{timeoutMs:40});t.after(()=>c.services.dispose());await c.auth.login({username:'fixture',password:'FAKE'});
 const restoring=c.auth.refresh(),changing=c.auth.changePassword(secret),failure=assert.rejects(changing,e=>e.kind==='timeout');await flush();t.mock.timers.tick(25);refresh.resolve(json(issued));await restoring;await flush();assert.equal(calls.at(-1),'password');t.mock.timers.tick(15);await failure;assert.equal(c.auth.getState().status,'anonymous');assert.equal(calls.filter(x=>x==='password').length,1);write.resolve(json(changed));await flush();assert.equal(c.auth.getState().status,'anonymous');
});

test('global cancel fences an in-flight password generation until an explicit new login',async t=>{
 const held=deferred(),c=await owner(t,()=>held.promise),pending=c.auth.changePassword(secret),failure=assert.rejects(pending,e=>e.kind==='cancel');await flush();c.auth.cancel();await failure;assert.equal(c.auth.getState().status,'anonymous');assert.equal(await c.auth.currentUser(),null);await assert.rejects(c.auth.refresh(),e=>e.status===401);c.auth.cancel();assert.equal(await c.auth.currentUser(),null);assert.equal(c.calls.length,2);await c.auth.login({username:'fixture',password:'FAKE'});held.resolve(json(changed));await flush();assert.equal(c.auth.getState().status,'authenticated');assert.equal(c.calls.length,3);
});
test('mismatched HTTP/business status and malformed official failures never authorize a retry',async t=>{
 for(const [success,code,payload]of [[false,50302,null],[true,40001,null],[false,40001,{changed:true}],[false,200,null]]){
  const c=await owner(t,async()=>new Response(JSON.stringify({...wire(payload),success,code}),{status:400}));await assert.rejects(c.auth.changePassword(secret),e=>e.metadata.readFailure==='parse');assert.equal(c.auth.getState().status,'anonymous');assert.equal(c.calls.length,2);
 }
});
