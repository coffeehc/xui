import test from 'node:test';
import assert from 'node:assert/strict';
import {createHttpClient,HttpError} from '../packages/runtime/dist/http.js';
import {createAuthClient,authEndpoints,parseAuthSession,resolveLoginReturnTo,resolveLoginPageConfig} from '../packages/runtime/dist/auth.js';
const user={id:'demo:user',username:'demo',display_name:'示例用户'},session={schema_version:1,user};
const wire=(payload=null,extra={})=>({success:true,message:'',payload,request_id:'demo:request',code:1,...extra});
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
const owner=(fetch,options={})=>{const http=createHttpClient({baseURL:'https://auth.example/custom/',fetch,...options});return {http,auth:createAuthClient({http,timeoutMs:100})};};
test('auth v1 accepts only public identity, freezes it and rejects token aliases or unknown versions',()=>{
  const parsed=parseAuthSession(session);assert.deepEqual(parsed,session);assert(Object.isFrozen(parsed.user));assert.notEqual(parsed.user,user);
  for(const value of [null,user,{...session,schema_version:2},{...session,access_token:'FAKE_TOKEN'},{...session,user:{...user,role:'admin'}},{...session,user:{...user,id:''}},{...session,user:{id:'id',username:'demo'}}])assert.throws(()=>parseAuthSession(value));
  let invoked=false;assert.throws(()=>parseAuthSession({schema_version:1,get user(){invoked=true;return user;}}));assert.equal(invoked,false);
});
test('login returnTo rejects open redirects after normalization, nested decoding and unsafe fallbacks',()=>{
  for(const value of ['https://auth.example/app','//evil.example','/\\evil.example','/a/..//evil.example/path','/%2e%2e//evil.example/path','/%252e%252e//evil.example/path','/%2f%2fevil.example','/%255cevil.example','/%0d%0aLocation:evil','/login','/%6cogin','/%ZZ',' /app'])assert.equal(resolveLoginReturnTo(value,'/safe'),'/safe',value);
  assert.equal(resolveLoginReturnTo(null,'//evil.example'),'/');assert.equal(resolveLoginReturnTo('/app?tab=one&password=FAKE&access_token=FAKE&refresh_token=FAKE&code=FAKE&API_KEY=FAKE&client_secret=FAKE&secret=FAKE#FAKE'),'/app?tab=one');
  assert.equal(resolveLoginReturnTo('/a/../work?tab=one'),'/work?tab=one');assert.equal(resolveLoginReturnTo('/%E5%B7%A5%E4%BD%9C'),'/%E5%B7%A5%E4%BD%9C');
  const destination=resolveLoginReturnTo('/app?tab=one');assert.equal(new URL(destination,'https://product.example').origin,'https://product.example');
});
test('explicit ignored 401 does not consume the shared HTTP latch or suppress its own feedback',async()=>{
  let unauthorized=0,errors=0;const http=createHttpClient({baseURL:'https://auth.example',fetch:async()=>json(wire(null,{success:false}),401),onUnauthorized:()=>unauthorized++,onError:()=>errors++});
  for(let i=0;i<2;i++)await assert.rejects(http.request('/login',{unauthorized:'ignore'}),HttpError);assert.equal(unauthorized,0);assert.equal(errors,2);
  await assert.rejects(http.request('/protected'),HttpError);await assert.rejects(http.request('/protected-again'),HttpError);assert.equal(unauthorized,1);assert.equal(errors,2);
  await assert.rejects(http.request('/invalid',{unauthorized:'guessed'}),TypeError);
});
test('auth facade uses fixed paths, one HTTP owner, strict Go envelope and body-only credentials',async()=>{
  const requests=[],{auth,http}=owner(async(url,init)=>{requests.push({url,init});return json(wire(new URL(url).pathname===authEndpoints.logout?null:session));},{credentials:'include',headers:{Accept:'application/x-protobuf','Content-Type':'application/x-www-form-urlencoded'},getHeaders:()=>({'X-CSRF-Token':'FAKE_CSRF_HEADER'})});
  const signedIn=await auth.login({username:' demo ',password:' FAKE_PASSWORD '});assert.deepEqual(signedIn,user);assert.equal(auth.getState().status,'authenticated');assert.equal(JSON.stringify(auth.getState()).includes('FAKE_PASSWORD'),false);
  assert.equal(await auth.currentUser(),auth.getState().user);await auth.logout();assert.equal(auth.getState().status,'anonymous');assert.equal(auth.getState().user,null);
  assert.deepEqual(requests.map(({url,init})=>[url,init.method]),[[`https://auth.example${authEndpoints.login}`,'POST'],[`https://auth.example${authEndpoints.session}`,'GET'],[`https://auth.example${authEndpoints.logout}`,'POST']]);
  assert.deepEqual(JSON.parse(requests[0].init.body),{username:'demo',password:' FAKE_PASSWORD '});assert.equal(requests[1].init.body,undefined);assert.equal(requests[2].init.body,'{}');
  for(const {url,init} of requests){assert.equal(new URL(url).search,'');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert.equal(init.credentials,'include');assert.equal(init.headers.get('X-CSRF-Token'),'FAKE_CSRF_HEADER');assert.equal(init.headers.get('Accept'),'application/json');if(init.method==='POST')assert.equal(init.headers.get('Content-Type'),'application/json');}
  auth.destroy();http.destroy();
});
test('auth default adapters accept success=true for every valid success code without host configuration',async()=>{
  for(const code of [0,1,2]){
    const {auth,http}=owner(async url=>json(wire(new URL(url).pathname===authEndpoints.logout?null:session,{code})));
    assert.deepEqual(await auth.login({username:'demo',password:'FAKE_PASSWORD'}),user);assert.equal(auth.getState().status,'authenticated');
    assert.deepEqual(await auth.currentUser(),user);await auth.logout();assert.equal(auth.getState().status,'anonymous');auth.destroy();http.destroy();
  }
});
test('login 401 keeps confirmed user, session 401 clears it and logout uncertainty never claims success',async()=>{
  let status=200,route='login',unauthorized=0;const {auth}=owner(async(url)=>json(wire(new URL(url).pathname===authEndpoints.logout?null:session,{success:status===200}),status),{onUnauthorized:()=>unauthorized++});
  await auth.login({username:'demo',password:'FAKE_PASSWORD'});const before=auth.getState().user;status=401;await assert.rejects(auth.login({username:'demo',password:'FAKE_WRONG'}),error=>error.status===401);assert.equal(auth.getState().user,before);assert.equal(auth.getState().status,'authenticated');assert.equal(unauthorized,0);
  assert.equal(await auth.currentUser(),null);assert.equal(auth.getState().status,'anonymous');assert.equal(auth.getState().error,null);
  status=200;await auth.login({username:'demo',password:'FAKE_PASSWORD'});status=503;await assert.rejects(auth.logout(),HttpError);assert.equal(auth.getState().status,'unknown');assert.equal(auth.getState().user,null);
  status=401;await auth.logout();assert.equal(auth.getState().status,'anonymous');assert.equal(auth.getState().error,null);assert.equal(unauthorized,0);
});
test('auth does not guess legacy responses, replay writes or expose raw server feedback',async()=>{
  for(const body of [wire({access_token:'FAKE_PRIVATE_TOKEN'}),wire(session,{code:'0'}),wire(session,{success:false,message:'FAKE_PRIVATE_ERROR'}),{success:true,data:session}]){let sends=0;const {auth}=owner(async()=>{sends++;return json(body);});await assert.rejects(auth.login({username:'demo',password:'FAKE_PASSWORD'}),HttpError);assert.equal(sends,1);assert.equal(auth.getState().status,'unknown');assert.equal(JSON.stringify(auth.getState()).includes('FAKE_PRIVATE'),false);auth.destroy();}
});
test('auth duplicate writes, cancel and uncooperative late results retain the latest intent',async()=>{
  let calls=0;const late=deferred(),{auth}=owner(async()=>{calls++;return late.promise;});const pending=auth.login({username:'demo',password:'FAKE_PASSWORD'}),failure=assert.rejects(pending,error=>error.kind==='cancel');await flush();
  await assert.rejects(auth.login({username:'second',password:'FAKE_PASSWORD'}),error=>error.kind==='cancel');assert.equal(calls,1);auth.cancel();await failure;assert.equal(auth.getState().status,'unknown');assert.equal(auth.getState().busy,null);late.resolve(json(wire(session)));await flush();assert.equal(auth.getState().user,null);
  const old=deferred();let reads=0;const second=owner(async()=>++reads===1?old.promise:json(wire(session)));const first=second.auth.currentUser(),firstFailure=assert.rejects(first,error=>error.kind==='cancel');await flush();await second.auth.currentUser();old.resolve(json(wire(null,{success:false}),401));await firstFailure;assert.equal(second.auth.getState().status,'authenticated');second.auth.destroy();assert.equal(second.auth.getState().user,null);
});
test('auth whole request budget covers async headers and cancellation is prompt without cooperative fetch',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});const headers=deferred();let calls=0;const {auth}=owner(async()=>{calls++;return json(wire(session));},{getHeaders:()=>headers.promise});const pending=auth.login({username:'demo',password:'FAKE_PASSWORD'}),failure=assert.rejects(pending,error=>error.kind==='timeout');await flush();t.mock.timers.tick(100);await failure;assert.equal(auth.getState().status,'unknown');headers.resolve({});await flush();assert.equal(calls,0);
  const late=deferred(),abort=new AbortController(),other=owner(async()=>late.promise);const read=other.auth.currentUser({signal:abort.signal}),readFailure=assert.rejects(read,error=>error.kind==='cancel');await flush();abort.abort();await readFailure;late.resolve(json(wire(session)));await flush();assert.equal(other.auth.getState().user,null);assert.equal(other.auth.getState().busy,null);
});
test('auth subscriptions may expire or destroy during completion without returning stale identity',async()=>{
  for(const action of ['expire','destroy']){const {auth}=owner(async()=>json(wire(session)));auth.subscribe(()=>{if(auth.getState().status==='authenticated')auth[action]();});await assert.rejects(auth.login({username:'demo',password:'FAKE_PASSWORD'}),error=>error.kind==='cancel');assert.equal(auth.getState().user,null);assert.equal(auth.getState().busy,null);}
  const config=resolveLoginPageConfig({productName:'产品',returnTo:'//evil.example',fallbackReturnTo:'/safe',logo:{src:'/logo.svg'}});assert.equal(config.returnTo,'/safe');assert(Object.isFrozen(config.labels));assert.equal(config.logo.alt,'产品');for(const src of ['javascript:alert(1)','data:text/html,FAKE','https://name:password@example.com/a.svg'])assert.throws(()=>resolveLoginPageConfig({productName:'产品',logo:{src}}));
});
