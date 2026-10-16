import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HttpError,createAjaxResponseAdapter,ajaxResponseAdapter,parseAjaxResponse,getHttpErrorMessage} from '../packages/runtime/dist/http.js';
import {isolatedHttp,disposeServices} from './helpers/runtime-services.mjs';
const wire=(payload=null,extra={})=>({success:true,message:'',payload,request_id:'',code:1,...extra});
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json',...headers}});
const client=(fetch,options={})=>isolatedHttp({baseURL:'https://fixture.example/api/',fetch,...options});
const flush=async()=>{for(let n=0;n<16;n++)await Promise.resolve();};
const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
test('AjaxResponse preserves legal null, exact fields, body/header ids and safe generic errors',async()=>{
  let fetched;const http=client(async(url,init)=>{fetched={url,init};return json(wire(null,{request_id:'body-id',redirect:'/later'}),200,{'X-Request-ID':'header-id'});});
  const result=await http.request('records',{endpointId:'records:list'});assert.equal(result.payload,null);assert.equal(result.code,1);assert.equal(result.requestId,'body-id');assert.equal(result.bodyRequestId,'body-id');assert.equal(result.headerRequestId,'header-id');assert.equal(result.redirect,'/later');assert.equal(fetched.init.headers.get('accept'),'application/json');assert.equal(fetched.init.credentials,'same-origin');assert(Object.isFrozen(result));
  const emptyId=await client(async()=>json(wire(0),200,{'X-Request-ID':'header-id'})).request('zero');assert.equal(emptyId.payload,0);assert.equal(emptyId.requestId,'header-id');assert.equal(emptyId.bodyRequestId,'');
});
test('default AjaxResponse success depends only on success and preserves arbitrary safe integer codes',async()=>{
  const context={status:200,headerRequestId:'header-id',endpointId:'records:list',attempts:1};
  for(const code of [0,1,2,-1,Number.MIN_SAFE_INTEGER,Number.MAX_SAFE_INTEGER]){
    const value=wire(false,{code,request_id:'body-id',redirect:'/later'});
    for(const adapt of [ajaxResponseAdapter,createAjaxResponseAdapter(),createAjaxResponseAdapter({}),createAjaxResponseAdapter({successCode:undefined})])assert.deepEqual(adapt(value,context),{payload:false,code,bodyRequestId:'body-id',redirect:'/later'});
    const result=await client(async()=>json(value,200,{'X-Request-ID':'header-id'})).request('records');
    assert.equal(result.payload,false);assert.equal(result.code,code);assert.equal(result.requestId,'body-id');assert.equal(result.headerRequestId,'header-id');
    await assert.rejects(client(async()=>json({...value,success:false,message:'Business rejection'},200,{'X-Request-ID':'header-id'})).request('records'),error=>error.kind==='business'&&error.status===200&&error.code===code&&error.requestId==='body-id'&&error.metadata.headerRequestId==='header-id'&&error.business.code===code&&error.business.message==='Business rejection');
  }
});
test('strict Go envelope still requires exact fields and safe integer code metadata',async()=>{
  const invalid=[null,[],{success:true,code:1,data:[],message:'',request_id:''}];
  for(const field of ['success','message','payload','request_id','code']){const value=wire();delete value[field];invalid.push(value);}
  for(const code of ['1',null,1.5,9007199254740992])invalid.push(wire(null,{code}));
  for(const extra of [{success:'true'},{message:null},{request_id:1},{redirect:false}])invalid.push(wire(null,extra));
  for(const value of invalid){assert.throws(()=>parseAjaxResponse(value),TypeError);await assert.rejects(client(async()=>json(value)).request('records'),error=>error.kind==='parse');}
});
test('successCode is an explicit strict opt-in and never overrides success=false',async()=>{
  for(const successCode of [0,1,2]){
    const adapter=createAjaxResponseAdapter({successCode});
    for(const code of [0,1,2]){
      const http=client(async()=>json(wire(null,{code})),{adapter});
      if(code===successCode)assert.equal((await http.request('strict')).code,code);
      else await assert.rejects(http.request('strict'),error=>error.kind==='business'&&error.code===code);
    }
    await assert.rejects(client(async()=>json(wire(null,{success:false,code:successCode})),{adapter}).request('strict'),error=>error.kind==='business'&&error.code===successCode);
  }
  for(const successCode of [null,'1',NaN,Infinity,1.5,9007199254740992])assert.throws(()=>createAjaxResponseAdapter({successCode}),TypeError);
});
test('non-2xx remains an HTTP error regardless of success or code and preserves both request ids',async()=>{
  for(const response of ['ajax','blob'])for(const status of [400,401,403,500])for(const success of [true,false])for(const code of [0,1,2]){
    const value=wire(null,{success,code,request_id:'body-id',message:'Server detail'});
    await assert.rejects(client(async()=>json(value,status,{'X-Request-ID':'header-id'})).request('records',{response,detectAjaxErrors:true}),error=>error.kind==='http'&&error.status===status&&error.code===code&&error.requestId==='body-id'&&error.metadata.bodyRequestId==='body-id'&&error.metadata.headerRequestId==='header-id'&&error.business.message==='Server detail');
  }
});
test('blob AjaxResponse detection shares the default success contract without unwrapping the file',async()=>{
  for(const code of [0,1,2,-1]){
    const value=wire({file:true},{code,request_id:'body-id'});
    const result=await client(async()=>json(value,200,{'X-Request-ID':'header-id'})).request('file',{response:'blob',detectAjaxErrors:true});
    assert(result.payload instanceof Blob);assert.equal(await result.payload.text(),JSON.stringify(value));assert.equal(result.code,code);assert.equal(result.requestId,'body-id');assert.equal(result.headerRequestId,'header-id');
    await assert.rejects(client(async()=>json({...value,success:false},200,{'X-Request-ID':'header-id'})).request('file',{response:'blob',detectAjaxErrors:true}),error=>error.kind==='business'&&error.code===code&&error.requestId==='body-id'&&error.metadata.headerRequestId==='header-id');
  }
  for(const extra of [{code:'1'},{code:1.5},{code:9007199254740992},{success:'true'},{message:null},{request_id:1}])await assert.rejects(client(async()=>json(wire(null,extra))).request('file',{response:'blob',detectAjaxErrors:true}),error=>error.kind==='parse');
});
test('explicit raw JSON, text, empty, blob and alternate adapter do not guess aliases',async()=>{
  const raw=wire(null,{success:false,code:-1});assert.deepEqual((await client(async()=>json(raw)).request('raw',{response:'json'})).payload,raw);
  assert.equal((await client(async()=>new Response('plain')).request('text',{response:'text'})).payload,'plain');
  assert.equal((await client(async()=>new Response(null,{status:204})).request('empty',{response:'empty'})).payload,undefined);
  await assert.rejects(client(async()=>new Response(null,{status:204})).request('empty'),error=>error.kind==='parse');
  await assert.rejects(client(async()=>new Response('')).request('json',{response:'json'}),error=>error.kind==='parse');
  const custom=client(async()=>json(wire(null,{code:0})),{adapter:createAjaxResponseAdapter({successCode:0})});assert.equal((await custom.request('custom')).payload,null);assert.equal((await custom.request('raw',{response:'json'})).payload.code,0);
  const blob=(await client(async()=>json(raw)).request('file',{response:'blob'})).payload;assert.equal(await blob.text(),JSON.stringify(raw));
  await assert.rejects(client(async()=>json(raw)).request('file',{response:'blob',detectAjaxErrors:true}),error=>error.kind==='business');
  const legitimate=(await client(async()=>json({name:'JSON file'})).request('file',{response:'blob',detectAjaxErrors:true})).payload;assert.equal(await legitimate.text(),'{"name":"JSON file"}');
});
test('HTTP 401 owns one auth callback; HTTP 403 and HTTP 200 business 403001 do not',async()=>{
  let auth=0,feedback=0;const http=client(async()=>json(wire(null,{success:false,code:403001}),401),{onUnauthorized(){auth++;throw Error('host failure');},onError(){feedback++;}});
  const results=await Promise.allSettled([http.request('one'),http.request('two'),http.request('three')]);assert.equal(auth,1);assert.equal(feedback,0);assert(results.every(result=>result.status==='rejected'&&result.reason.kind==='http'&&result.reason.status===401));
  http.resetUnauthorized();await assert.rejects(http.request('new'),HttpError);assert.equal(auth,2);
  for(const status of [403,200]){let called=0;await assert.rejects(client(async()=>json(wire(null,{success:false,code:403001}),status),{onUnauthorized:()=>called++}).request('denied'),error=>error.status===status&&error.kind===(status===200?'business':'http'));assert.equal(called,0);}
});
test('old auth epoch cannot invalidate a newly confirmed session',async()=>{
  const pending=deferred();let calls=0,auth=0;const http=client(async()=>++calls===1?pending.promise:json(wire(null,{success:false}),401),{onUnauthorized:()=>auth++});
  const old=http.request('old');const oldFailure=assert.rejects(old,HttpError);await flush();http.resetUnauthorized();pending.resolve(json(wire(null,{success:false}),401));await oldFailure;assert.equal(auth,0);await assert.rejects(http.request('new'),HttpError);assert.equal(auth,1);
});
test('cancellation is prompt even if fetch ignores Abort and it never notifies errors',async()=>{
  let errors=0,count=0;const controller=new AbortController(),pending=deferred();const http=client(async()=>{count++;return pending.promise;},{onError:()=>errors++});
  const request=http.request('cancel',{signal:controller.signal}),failure=assert.rejects(request,error=>error.kind==='cancel');await flush();controller.abort(new Error('FAKE_PRIVATE_REASON'));await failure;assert.equal(errors,0);assert.equal(count,1);pending.resolve(json(wire('late')));await flush();assert.equal(errors,0);
  const aborted=new AbortController();aborted.abort();await assert.rejects(http.request('already',{signal:aborted.signal}),error=>error.kind==='cancel');assert.equal(count,1);
});
test('whole timeout includes headers provider and body; late producers do not issue requests',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});const pending=deferred();let count=0;const http=client(async()=>{count++;return json(wire('late'));},{getHeaders:()=>pending.promise});
  const request=http.request('slow-headers',{timeoutMs:20}),failure=assert.rejects(request,error=>error.kind==='timeout');await flush();t.mock.timers.tick(20);await failure;pending.resolve({});await flush();assert.equal(count,0);
  const body=client(async()=>({ok:true,status:200,headers:new Headers(),text:()=>new Promise(()=>{})}));const bodyRequest=body.request('slow-body',{timeoutMs:20}),bodyFailure=assert.rejects(bodyRequest,error=>error.kind==='timeout'&&error.status===200);await flush();t.mock.timers.tick(20);await bodyFailure;
});
test('401/403 header facts survive body timeout and malformed HTTP errors',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});for(const status of [401,403]){let auth=0;const http=client(async()=>({ok:false,status,headers:new Headers({'X-Request-ID':'header-id'}),text:()=>new Promise(()=>{})}),{onUnauthorized:()=>auth++});const request=http.request('denied',{timeoutMs:20}),failure=assert.rejects(request,error=>error.kind==='http'&&error.status===status&&error.metadata.readFailure==='timeout'&&error.requestId==='header-id');await flush();t.mock.timers.tick(20);await failure;assert.equal(auth,status===401?1:0);}
  await assert.rejects(client(async()=>new Response('<html>FAKE_PRIVATE</html>',{status:403})).request('denied'),error=>error.kind==='http'&&error.status===403&&error.metadata.readFailure==='parse'&&!JSON.stringify(error).includes('FAKE_PRIVATE'));
});
test('network, JSON parse and body transport failures are distinct and never expose sensitive URLs',async()=>{
  for(const [send,kind] of [[async()=>{throw new TypeError('https://fixture.example/?token=FAKE_SECRET');},'network'],[async()=>new Response('<html>FAKE_SECRET</html>'),'parse'],[async()=>({ok:true,status:200,headers:new Headers(),text:async()=>{throw new TypeError('https://fixture.example/?token=FAKE_SECRET');}}),'network']]){
    let notified;await assert.rejects(client(send,{onError:error=>notified=error}).request('records?token=FAKE_SECRET'),error=>error.kind===kind&&!JSON.stringify(error).includes('FAKE_SECRET')&&!JSON.stringify(error).includes('fixture.example')&&!('cause' in error));assert.equal(notified.kind,kind);
  }
  await assert.rejects(client(async()=>json(wire({private:'FAKE_SECRET'},{success:false,message:'FAKE_SECRET https://fixture.example/'}))).request('business'),error=>error.kind==='business'&&!JSON.stringify(error).includes('FAKE_SECRET'));
  assert.equal(getHttpErrorMessage(new Error('FAKE_SECRET')),'The request failed.');assert(!JSON.stringify(new HttpError('network',{attempts:1,url:'FAKE_SECRET',rawBody:{secret:'FAKE_SECRET'}})).includes('FAKE_SECRET'));
});
test('default never retries even GET; writes/one-shot bodies cannot opt into automatic replay',async()=>{
  let count=0;const http=client(async()=>{count++;return json(wire(null,{success:false}),503);});
  for(const method of ['GET','POST','PATCH','DELETE'])await assert.rejects(http.request('stateful',{method}),HttpError);assert.equal(count,4);
  for(const options of [{method:'POST'},{method:'PATCH'},{method:'DELETE'},{method:'GET',body:new ReadableStream()}])await assert.rejects(http.request('unsafe',{...options,retry:{idempotentRead:true,maxAttempts:2}}),TypeError);assert.equal(count,4);
});
test('opt-in read retry is finite, respects Retry-After and preserves final attempt diagnostics',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});let count=0;const http=client(async()=>++count===1?json(wire(null,{success:false}),429,{'Retry-After':'1'}):json(wire('ready')));
  const request=http.request('read',{retry:{idempotentRead:true,maxAttempts:2,delayMs:1,maxDelayMs:2000}});await flush();assert.equal(count,1);t.mock.timers.tick(999);await flush();assert.equal(count,1);t.mock.timers.tick(1);await flush();assert.equal((await request).payload,'ready');assert.equal(count,2);
  let attempts=0;const failures=client(async()=>{attempts++;throw Error('offline');});const failed=failures.request('read',{retry:{idempotentRead:true,maxAttempts:2,delayMs:1}}),asserted=assert.rejects(failed,error=>error.kind==='network'&&error.metadata.attempts===2);await flush();t.mock.timers.tick(1);await asserted;assert.equal(attempts,2);
});
test('retry backoff is canceled, auth is never retried and excessive Retry-After is not shortened',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});let count=0;const controller=new AbortController();const http=client(async()=>{count++;throw Error('offline');});const request=http.request('read',{signal:controller.signal,retry:{idempotentRead:true,maxAttempts:3,delayMs:1000}}),failure=assert.rejects(request,error=>error.kind==='cancel');await flush();controller.abort();await failure;t.mock.timers.tick(10000);await flush();assert.equal(count,1);
  for(const status of [401,403,429]){let tries=0;await assert.rejects(client(async()=>{tries++;return json(wire(null,{success:false}),status,{'Retry-After':'3600'});}).request('read',{retry:{idempotentRead:true,maxAttempts:3,statuses:[401,403,429],maxDelayMs:1000}}),HttpError);assert.equal(tries,1);}
});
test('destroy cancels active work, reentrant feedback cannot change facts, headers and JSON body are explicit',async()=>{
  let received;const http=client(async(url,init)=>{received={url,init};return json(wire('saved'));},{headers:{'X-Client':'default'},getHeaders:()=>({'X-Client':'provider'})});await http.request('write',{method:'POST',headers:{'X-Client':'endpoint'},json:null});assert.equal(received.url,'https://fixture.example/api/write');assert.equal(received.init.headers.get('X-Client'),'endpoint');assert.equal(received.init.headers.get('content-type'),'application/json');assert.equal(received.init.body,'null');
  const pending=client(async()=>new Promise(()=>{}));const request=pending.request('read'),failure=assert.rejects(request,error=>error.kind==='cancel');disposeServices(pending);disposeServices(pending);await failure;await assert.rejects(pending.request('after'),error=>error.kind==='cancel');
  await assert.rejects(client(async()=>json(wire(null,{success:false})),{onError(){throw Error('observer');}}).request('error'),error=>error.kind==='business');
  await assert.rejects(client(async()=>json(wire(null,{success:false})),{onError:async()=>{throw Error('async observer');}}).request('error'),error=>error.kind==='business');
});
test('invalid configuration and adapter shapes fail without guessed data or network requests',async()=>{
  assert.throws(()=>isolatedHttp({baseURL:'relative'}),TypeError);let count=0;const http=client(async()=>{count++;return json(wire(null));});for(const options of [{timeoutMs:0},{endpointId:'https://private.example/'},{json:undefined},{json:1,body:'both'}])await assert.rejects(http.request('invalid',options),error=>error instanceof TypeError||error instanceof RangeError);await assert.rejects(http.request('https://other.example/'),TypeError);assert.equal(count,0);
  await assert.rejects(http.request('invalid-adapter',{adapter:()=>({data:[]})}),error=>error.kind==='parse');disposeServices(http);
});
