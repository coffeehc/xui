import test from 'node:test';
import assert from 'node:assert/strict';
import {createHttpClient,HttpError} from '../packages/runtime/dist/http.js';
import {createAuthClient,authEndpoints,parseAuthSession,resolveLoginReturnTo,resolveLoginPageConfig} from '../packages/runtime/dist/auth.js';
const user={id:'42',username:'demo',display_name:'示例用户'},session={schema_version:2,user};
const token=(id='A')=>'bs-v1-sha256-access-'+id.repeat(42)+'A';
const issued=(id='A',extra={})=>({...session,access_token:token(id),token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString(),...extra});
const wire=(payload=null,extra={})=>({success:true,message:'',payload,request_id:'demo:request',code:200,...extra});
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const reject=(status,code=status*100+1)=>json(wire(null,{success:false,code,message:'FAKE_PRIVATE'}),status);
const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};
const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
const owner=(fetch,options={},authOptions={})=>{const http=createHttpClient({baseURL:'https://auth.example/custom/',fetch,...options});return {http,auth:createAuthClient({http,timeoutMs:1000,protectedPaths:['/api/business/'],...authOptions})};};
const route=url=>new URL(url).pathname.split('/').at(-1);
const normal=async url=>json(wire(route(url)==='session'?session:route(url)==='logout'?null:issued()));
const cleanup=({auth,http})=>{auth.destroy();http.destroy();};

test('versioned access credentials accept configured prefix shapes and reject other algorithms or purposes',async()=>{
 for(const prefix of ['bs','xagent','xapi','a','a'.repeat(32)]){
  const access_token=`${prefix}-v1-sha256-access-`+'A'.repeat(43);
  const client=owner(async()=>json(wire(issued('A',{access_token}))));
  assert.deepEqual(await client.auth.login({username:'demo',password:'FAKE_PASSWORD'}),user);
  assert(!JSON.stringify(client.auth.getState()).includes(access_token));cleanup(client);
 }
 for(const access_token of [
  'bss_'+'A'.repeat(43),
  ...['refresh','keyh','keyr'].map(kind=>`bs-v1-sha256-${kind}-`+'A'.repeat(43)),
  'bs-v2-sha256-access-'+'A'.repeat(43),'bs-v1-none-access-'+'A'.repeat(43),
  'bs-v1-bcrypt-access-'+'A'.repeat(43),'bs-v1-sha512-access-'+'A'.repeat(43),
  ...['','1a','A','a-b','a_b','中文','a'.repeat(33)].map(prefix=>`${prefix}-v1-sha256-access-`+'A'.repeat(43)),
  token().slice(0,-1)+'B',token()+'=',token()+'\n',token().slice(0,-1)
 ]){
  const client=owner(async()=>json(wire(issued('A',{access_token}))));
  await assert.rejects(client.auth.login({username:'demo',password:'FAKE_PASSWORD'}),error=>error.kind==='parse');
  assert.equal(client.auth.getState().user,null);assert.equal(client.auth.getState().reauthenticationRequired,true);cleanup(client);
 }
});

test('strict session v2 has only safe identity; issued secrets and aliases are rejected',()=>{
 const parsed=parseAuthSession(session);assert.deepEqual(parsed,session);assert(Object.isFrozen(parsed.user));
 for(const value of [null,user,{...session,schema_version:1},issued(),{...session,user:{...user,role:'admin'}},{...session,user:{...user,id:'042'}},{...session,user:{...user,id:'9223372036854775808'}},{...session,user:{id:'42',username:'demo'}}])assert.throws(()=>parseAuthSession(value));
 let invoked=false;assert.throws(()=>parseAuthSession({schema_version:2,get user(){invoked=true;return user;}}));assert.equal(invoked,false);
});
test('strict issued DTO rejects invalid purpose format, canonical encoding, expiry and token extras without exposing values',async()=>{
 for(const extra of [{schema_version:1},{token_type:'bearer'},{access_token:'bs_'+'A'.repeat(43)},{access_token:token().slice(0,-1)+'B'},{access_token:token()+'='},{expires_at:'2099-02-30T00:00:00Z'},{expires_at:'2000-01-01T00:00:00Z'},{expires_at:'2099-01-01T00:00:00+00:00'},{refresh_token:'FAKE_PRIVATE'}]){
  const client=owner(async()=>json(wire(issued('A',extra))));await assert.rejects(client.auth.login({username:'demo',password:'FAKE_PASSWORD'}),error=>error.kind==='parse');assert.equal(client.auth.getState().reauthenticationRequired,true);assert(!JSON.stringify(client.auth.getState()).includes('bs-v1-sha256-access-'));cleanup(client);
 }
});
test('one owner supplies exact auth endpoint credential modes, fixed headers, Bearer isolation and safe public snapshots',async()=>{
 const requests=[],client=owner(async(url,init)=>{requests.push({url,init});return normal(url);},{credentials:'include',headers:{Accept:'application/x-protobuf','Content-Type':'application/x-www-form-urlencoded'},getHeaders:()=>({'X-CSRF-Token':'FAKE_CSRF'})});
 assert.deepEqual(await client.auth.login({username:' demo ',password:' FAKE_PASSWORD '}),user);assert.equal(await client.auth.currentUser(),client.auth.getState().user);
 await client.http.request('/api/business/item',{method:'POST',json:{value:1}});await client.auth.refresh();await client.auth.logout();
 assert.deepEqual(requests.map(x=>[route(x.url),x.init.method]),[['login','POST'],['session','GET'],['item','POST'],['refresh','POST'],['logout','POST']]);
 for(const {url,init} of requests){const cookie=['login','refresh','logout'].includes(route(url));assert.equal(init.credentials,cookie?'same-origin':'omit');assert.equal(init.redirect,'error');assert.equal(init.headers.get('Authorization'),cookie?null:`Bearer ${token()}`);assert.equal(init.headers.get('X-CSRF-Token'),'FAKE_CSRF');}
 assert.deepEqual(JSON.parse(requests[0].init.body),{username:'demo',password:' FAKE_PASSWORD '});assert.equal(requests[1].init.body,undefined);assert.equal(requests.at(-1).init.body,'{}');assert(!JSON.stringify(client.auth.getState()).includes('bs-v1-sha256-access-'));assert.equal(client.auth.getState().status,'anonymous');cleanup(client);
});
test('fresh owner restores cookie once before session; absent recovery becomes anonymous without looping',async()=>{
 const requests=[],client=owner(async url=>{requests.push(route(url));return normal(url);});assert.deepEqual(await client.auth.currentUser(),user);assert.deepEqual(requests,['refresh','session']);cleanup(client);
 let sends=0;const absent=owner(async()=>{sends++;return reject(401);});assert.equal(await absent.auth.currentUser(),null);assert.equal(await absent.auth.currentUser(),null);assert.equal(sends,1);assert.equal(absent.auth.getState().status,'anonymous');cleanup(absent);
});
test('concurrent protected 401 coalesces one refresh and never replays the failed writes',async()=>{
 const held=deferred(),requests=[];let refreshes=0;
 const client=owner(async(url,init)=>{const op=route(url);requests.push({op,method:init.method,authorization:init.headers.get('Authorization')});if(op==='login')return json(wire(issued()));if(op==='refresh'){refreshes++;await held.promise;return json(wire(issued('E')));}return reject(401);});
 await client.auth.login({username:'demo',password:'FAKE'});
 const writes=Promise.allSettled([client.http.request('/api/business/a',{method:'POST',json:{}}),client.http.request('/api/business/b',{method:'DELETE'})]);await writes;await flush();assert.equal(refreshes,1);assert.equal(requests.filter(x=>['a','b'].includes(x.op)).length,2);
 held.resolve();await flush();assert.equal(client.auth.getState().status,'authenticated');assert.equal(requests.filter(x=>['a','b'].includes(x.op)).length,2);cleanup(client);
});
test('late old-generation 401 cannot expire a newer login and 403 never refreshes',async()=>{
 const old=deferred();let refreshes=0,denied=false;const client=owner(async url=>{const op=route(url);if(op==='login')return json(wire(issued()));if(op==='refresh'){refreshes++;return json(wire(issued('E')));}if(denied)return reject(403);return old.promise;});
 await client.auth.login({username:'demo',password:'FAKE'});const request=client.http.request('/api/business/old');await flush();await client.auth.login({username:'demo',password:'FAKE'});old.resolve(reject(401));await assert.rejects(request,error=>error.status===401);assert.equal(client.auth.getState().status,'authenticated');assert.equal(refreshes,0);
 denied=true;await assert.rejects(client.http.request('/api/business/denied'),error=>error.status===403);assert.equal(refreshes,0);assert.equal(client.auth.getState().status,'authenticated');cleanup(client);
});
test('one refresh/session waiter abort detaches while other callers get the single successful result',async()=>{
 const held=deferred();let refreshes=0,sessions=0;const client=owner(async url=>{if(route(url)==='refresh'){refreshes++;await held.promise;return json(wire(issued()));}sessions++;return json(wire(session));});
 const controller=new AbortController(),first=client.auth.currentUser({signal:controller.signal}),second=client.auth.currentUser();await flush();controller.abort();await assert.rejects(first,error=>error.kind==='cancel');held.resolve();assert.deepEqual(await second,user);assert.equal(refreshes,1);assert.equal(sessions,1);assert.equal(client.auth.getState().reauthenticationRequired,false);cleanup(client);
});
test('logout waits for an in-flight refresh cookie mutation and drops its late local identity',async()=>{
 const held=deferred(),order=[];const client=owner(async url=>{const op=route(url);order.push(op);if(op==='refresh'){await held.promise;return json(wire(issued()));}return json(wire(null));});
 const refresh=client.auth.refresh(),failure=assert.rejects(refresh,error=>error.kind==='cancel');await flush();const logout=client.auth.logout();await flush();assert.deepEqual(order,['refresh']);held.resolve();await logout;await failure;assert.deepEqual(order,['refresh','logout']);assert.equal(client.auth.getState().status,'anonymous');assert(!JSON.stringify(client.auth.getState()).includes('bs-v1-sha256-access-'));cleanup(client);
});
test('refresh conflicts and unknown/committed/lost results block automatic retry without logout or cookie cleanup',async()=>{
 for(const failure of [()=>reject(409,40901),()=>reject(503,50301),()=>reject(503,50302),()=>{throw new Error('FAKE_PRIVATE');}]){
  let requests=0;const client=owner(async()=>{requests++;return failure();});await assert.rejects(client.auth.currentUser(),HttpError);assert.equal(client.auth.getState().status,'unknown');assert.equal(client.auth.getState().reauthenticationRequired,true);
  await assert.rejects(client.auth.currentUser(),HttpError);await assert.rejects(client.auth.refresh(),HttpError);await assert.rejects(client.http.request('/api/business/item'),HttpError);assert.equal(requests,1);assert(!JSON.stringify(client.auth.getState()).includes('FAKE_PRIVATE'));cleanup(client);
 }
});
test('invalid login preserves confirmed prior session; uncertain logout never says anonymous',async()=>{
 let mode='ok';const client=owner(async url=>mode==='ok'?normal(url):reject(mode==='denied'?401:503,mode==='denied'?40101:50301));await client.auth.login({username:'demo',password:'FAKE'});const before=client.auth.getState().user;
 mode='denied';await assert.rejects(client.auth.login({username:'demo',password:'FAKE'}),error=>error.status===401);assert.equal(client.auth.getState().user,before);mode='unknown';await assert.rejects(client.auth.logout(),HttpError);assert.equal(client.auth.getState().status,'unknown');assert.equal(client.auth.getState().reauthenticationRequired,true);cleanup(client);
});
test('protected targets reject external origins, ambiguous paths, manual credentials and redirect/cookie/retry overrides before sending',async()=>{
 let calls=0;const client=owner(async url=>{calls++;return normal(url);});await client.auth.login({username:'demo',password:'FAKE'});const baseline=calls;
 for(const [path,options] of [['https://evil.example/api/business/a',{}],['/api/business/%2fother',{}],['/api/business/a',{headers:{Authorization:'Bearer FAKE'}}],['/api/business/a',{headers:{Cookie:'FAKE'}}],['/api/business/a',{credentials:'include'}],['/api/business/a',{redirect:'follow'}],['/api/business/a',{retry:{idempotentRead:true,maxAttempts:2}}],[authEndpoints.login,{}],['/api/v1/auth/%6cogin',{}],['/api/v1/auth/LOGIN/',{}]])await assert.rejects(client.http.request(path,options));
 assert.equal(calls,baseline);cleanup(client);
 for(const path of ['https://evil.example','//evil','/api/../private','/api?x=1','/api/%2f']){const http=createHttpClient({baseURL:'https://auth.example',fetch:normal});assert.throws(()=>createAuthClient({http,protectedPaths:[path]}));http.destroy();}
});
test('protected subtree boundary and unprotected public calls do not receive the access token',async()=>{
 const requests=[],client=owner(async(url,init)=>{requests.push({path:new URL(url).pathname,header:init.headers.get('Authorization')});return normal(url);});await client.auth.login({username:'demo',password:'FAKE'});
 await client.http.request('/api/business-other/item');await client.http.request('/public');assert.deepEqual(requests.slice(-2).map(x=>x.header),[null,null]);cleanup(client);
});
test('untrusted final response origin is rejected and never accepted as a signed-in user',async()=>{
 const client=owner(async()=>{const response=json(wire(issued()));Object.defineProperty(response,'url',{value:'https://evil.example/login'});return response;});await assert.rejects(client.auth.login({username:'demo',password:'FAKE'}),error=>error.kind==='network');assert.equal(client.auth.getState().status,'unknown');cleanup(client);
});
test('destroy clears secrets, cancels late results and keeps managed routes fail-closed',async()=>{
 const held=deferred();let calls=0;const client=owner(async()=>{calls++;return held.promise;});const request=client.auth.refresh(),failure=assert.rejects(request,error=>error.kind==='cancel');await flush();client.auth.destroy();await failure;held.resolve(json(wire(issued())));await flush();assert.equal(client.auth.getState().user,null);await assert.rejects(client.http.request('/api/business/a'),error=>error.kind==='cancel');assert.equal(calls,1);client.http.destroy();
});
test('owner cancellation and timeout leave an unconfirmed state; late token never enters state',async()=>{
 const held=deferred(),client=owner(async()=>held.promise,{}, {timeoutMs:20});const pending=client.auth.login({username:'demo',password:'FAKE'});await assert.rejects(pending,error=>error.kind==='timeout');assert.equal(client.auth.getState().reauthenticationRequired,true);held.resolve(json(wire(issued())));await flush();assert.equal(client.auth.getState().user,null);cleanup(client);
 const second=owner(async()=>new Promise(()=>{}));const refreshing=second.auth.refresh(),failure=assert.rejects(refreshing,error=>error.kind==='cancel');await flush();second.auth.cancel();await failure;assert.equal(second.auth.getState().reauthenticationRequired,true);cleanup(second);
});
test('auth subscriptions may expire or destroy during completion without returning stale identity',async()=>{
 for(const action of ['expire','destroy']){const client=owner(normal);client.auth.subscribe(()=>{if(client.auth.getState().status==='authenticated')client.auth[action]();});await assert.rejects(client.auth.login({username:'demo',password:'FAKE'}),error=>error.kind==='cancel');assert.equal(client.auth.getState().user,null);cleanup(client);}
});
test('safe login navigation and presentation retain existing behavior',()=>{
 for(const value of ['https://auth.example/app','//evil.example','/\\evil.example','/a/..//evil.example/path','/%252e%252e//evil.example/path','/%255cevil.example','/%0d%0aLocation:evil','/login','/%6cogin','/%ZZ',' /app'])assert.equal(resolveLoginReturnTo(value,'/safe'),'/safe',value);
 assert.equal(resolveLoginReturnTo('/app?tab=one&password=FAKE&access_token=FAKE&refresh_token=FAKE&code=FAKE&API_KEY=FAKE#FAKE'),'/app?tab=one');
 assert.equal(resolveLoginPageConfig({productName:'产品'}).layout,'card');assert.equal(resolveLoginPageConfig({productName:'产品',layout:'fullscreen'}).layout,'fullscreen');for(const layout of ['wide','',1,{}])assert.throws(()=>resolveLoginPageConfig({productName:'产品',layout}));
});

test('shared baseservice emitted-wire fixture roundtrips without unsafe int64 conversion',async()=>{
 const {readFile}=await import('node:fs/promises'),fixture=JSON.parse(await readFile(new URL('./fixtures/contracts/auth.v2.json',import.meta.url),'utf8'));
 const client=owner(async url=>json(fixture[route(url)==='session'?'session':route(url)==='logout'?'logout':'issued']));
 assert.equal((await client.auth.login({username:'fixture',password:'FAKE'})).id,'9007199254740993');assert.equal((await client.auth.currentUser()).id,'9007199254740993');await client.auth.refresh();await client.auth.logout();cleanup(client);
 for(const {http_status,response} of fixture.errors){const rejected=owner(async()=>json(response,http_status));await assert.rejects(rejected.auth.login({username:'fixture',password:'FAKE'}),error=>error.status===http_status&&error.code===response.code);assert.equal(rejected.auth.getState().error.business,undefined);cleanup(rejected);}
});
test('late old-generation 401 cannot notify external onUnauthorized after a new accepted login',async()=>{
 const held=deferred();let notifications=0;const client=owner(async url=>route(url)==='login'?json(wire(issued())):held.promise,{onUnauthorized:()=>notifications++});await client.auth.login({username:'demo',password:'FAKE'});
 const pending=client.http.request('/api/business/old');await flush();await client.auth.login({username:'demo',password:'FAKE'});held.resolve(reject(401));await assert.rejects(pending);assert.equal(notifications,0);assert.equal(client.auth.getState().status,'authenticated');cleanup(client);
});


test('late session responses cannot clear a newer refreshed access generation',async()=>{
 for(const status of [200,401]){const held=deferred();let sessions=0;const client=owner(async url=>{if(route(url)==='login')return json(wire(issued()));if(route(url)==='refresh')return json(wire(issued('E')));sessions++;return held.promise;});
 await client.auth.login({username:'demo',password:'FAKE'});const checking=client.auth.currentUser(),failure=assert.rejects(checking,error=>error.kind==='cancel');await flush();await client.auth.refresh();held.resolve(status===200?json(wire(session)):reject(401));await failure;assert.equal(sessions,1);assert.equal(client.auth.getState().status,'authenticated');assert.equal(client.auth.getState().reauthenticationRequired,false);cleanup(client);}
});

test('local missing-access rejection never fabricates an HTTP 401 notification',async()=>{
 let notifications=0,errors=0,calls=0;const client=owner(async()=>{calls++;return reject(401);},{onUnauthorized:()=>notifications++,onError:()=>errors++});assert.equal(await client.auth.currentUser(),null);const before=errors;await assert.rejects(client.http.request('/api/business/a'),error=>error.status===401&&error.metadata.attempts===0);assert.equal(calls,1);assert.equal(notifications,0);assert.equal(errors,before+1);cleanup(client);
});

test('a request bootstrapping its access uses the accepted credential epoch for actual HTTP 401 feedback',async()=>{
 let notifications=0;const client=owner(async url=>route(url)==='refresh'?json(wire(issued())):reject(401),{onUnauthorized:()=>notifications++});await assert.rejects(client.http.request('/api/business/a'),error=>error.status===401);assert.equal(notifications,1);cleanup(client);
});

test('a reentrant refresh cannot turn a successful login return into null or overwrite the newer refresh state',async()=>{
 const client=owner(normal);let started=false,refreshing;
 client.auth.subscribe(()=>{if(!started&&client.auth.getState().status==='authenticated'){started=true;refreshing=client.auth.refresh();}});
 await assert.rejects(client.auth.login({username:'demo',password:'FAKE'}),error=>error.kind==='cancel');assert.deepEqual(await refreshing,user);assert.equal(client.auth.getState().status,'authenticated');assert.equal(client.auth.getState().reauthenticationRequired,false);cleanup(client);
});
