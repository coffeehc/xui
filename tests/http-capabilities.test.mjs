import test from 'node:test';
import assert from 'node:assert/strict';
import {createHttpClient,createJsonApiErrorAdapter,getHttpErrorMessage} from '../packages/runtime/dist/http.js';
import {requestDownload,resolveDownloadFileName} from '../packages/runtime/dist/download.js';
const wire=(payload=null,extra={})=>({success:true,code:1,message:'',payload,request_id:'demo:body',...extra});
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json',...headers}});
const owner=(fetch,options={})=>createHttpClient({baseURL:'https://fixture.invalid/',fetch,...options});
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
test('xLead exact non-2xx JSON API errors retain HTTP status and structured code without default message/body leakage',async()=>{
  const body={error:{code:'version_conflict',message:'FAKE_PRIVATE_MESSAGE',request_id:'demo:request'},token:'FAKE_PRIVATE_TOKEN'};
  const http=owner(async()=>json(body,412,{'X-Request-ID':'demo:header'}),{errorAdapter:createJsonApiErrorAdapter()});
  await assert.rejects(http.request('/records',{response:'json'}),error=>{assert.equal(error.kind,'http');assert.equal(error.status,412);assert.equal(error.code,'version_conflict');assert.equal(error.requestId,'demo:request');assert.equal(error.business.message,'FAKE_PRIVATE_MESSAGE');assert.equal(error.business.details,undefined);assert(Object.isFrozen(error.business));assert(!JSON.stringify(error).includes('FAKE_PRIVATE'));assert(!getHttpErrorMessage(error).includes('FAKE_PRIVATE'));assert.equal('token'in error.business,false);return true;});
  await assert.rejects(owner(async()=>json(body,412)).request('/records',{response:'json'}),error=>error.status===412&&error.business===undefined);
});
test('native httpx numeric business fields survive non-2xx and HTTP 200 business rejection',async()=>{
  for(const status of [422,200])await assert.rejects(owner(async()=>json(wire(null,{success:false,code:42201,message:'FAKE_SERVER_MESSAGE'}),status)).request('/records'),error=>error.status===status&&error.code===42201&&error.business.message==='FAKE_SERVER_MESSAGE'&&!JSON.stringify(error).includes('FAKE_SERVER_MESSAGE'));
});
test('details require explicit projection and are bounded immutable JSON; malformed projection retains HTTP fact',async()=>{
  const body={error:{code:'invalid_input',message:'Invalid',request_id:'r',details:{field:'name',secret:'FAKE_SECRET'}}};
  const http=owner(async()=>json(body,422),{errorAdapter:createJsonApiErrorAdapter({projectDetails:error=>({field:error.details.field})})});
  await assert.rejects(http.request('/record'),error=>{assert.deepEqual({...error.business.details},{field:'name'});assert(Object.isFrozen(error.business.details));assert(!JSON.stringify(error).includes('field'));return true;});
  for(const details of [()=>{},'x'.repeat(5000),new Date(),{get secret(){throw Error('must not access');}}])await assert.rejects(owner(async()=>json(body,422),{errorAdapter:createJsonApiErrorAdapter({projectDetails:()=>details})}).request('/record'),error=>error.kind==='http'&&error.status===422&&error.business===undefined&&error.metadata.readFailure==='parse');
});
test('headers expose only bounded download information; authorization, cookies and authentication challenges never escape',async()=>{
  const result=await owner(async()=>json(wire(null),200,{'Content-Disposition':'attachment; filename="demo.json"','Content-Length':'123','Authorization':'FAKE_AUTH','Set-Cookie':'FAKE_COOKIE','WWW-Authenticate':'FAKE_CHALLENGE'})).request('/record');
  assert.deepEqual(result.headers,{contentType:'application/json',contentDisposition:'attachment; filename="demo.json"',contentLength:'123'});assert(Object.isFrozen(result.headers));assert(!JSON.stringify(result).includes('FAKE_'));
});
test('filenames prefer UTF-8 extended values, handle quoted separators and reject ambiguous or unsafe path names',()=>{
  assert.equal(resolveDownloadFileName("attachment; filename=plain.csv; filename*=UTF-8''%E6%8A%A5%E5%91%8A.csv"),'报告.csv');
  assert.equal(resolveDownloadFileName('attachment; filename="a;b.csv"'),'a;b.csv');assert.equal(resolveDownloadFileName('attachment; filename="one.csv"; filename="two.csv"','fallback.csv'),'fallback.csv');
  assert.equal(resolveDownloadFileName("attachment; filename*=UTF-8''%FF; filename=plain.csv"),'plain.csv');assert.equal(resolveDownloadFileName('attachment; filename="../a\\\\b.csv"'),'.._a_b.csv');assert.equal(resolveDownloadFileName(null,'..'),'download');
});
test('download defaults retain JSON API failures while allowing explicitly attached JSON files',async()=>{
  const body=wire(null,{success:false,code:1234,message:'FAKE_PRIVATE_ERROR'});let accept;
  for(const mediaType of ['application/json','Application/JSON; charset=utf-8','application/problem+json'])await assert.rejects(requestDownload(owner(async(_,init)=>{accept=init.headers.get('accept');return json(body,200,{'Content-Type':mediaType});}),'/file'),error=>error.kind==='business'&&error.code===1234);assert.equal(accept,'application/json');
  const result=await requestDownload(owner(async()=>json(body,200,{'Content-Disposition':"attachment; filename*=UTF-8''%E6%95%B0%E6%8D%AE.json"})),'/file');assert.equal(result.fileName,'数据.json');assert.equal(await result.blob.text(),JSON.stringify(body));
});
test('download cancellation cannot expose a late file or turn a server error into success',async()=>{
  let release;const held=new Promise(resolve=>release=resolve),controller=new AbortController();const request=requestDownload(owner(()=>held),'/file',{signal:controller.signal}),failure=assert.rejects(request,error=>error.kind==='cancel');await flush();controller.abort();await failure;release(new Response('late'));await flush();
  await assert.rejects(requestDownload(owner(async()=>json({error:{code:'forbidden',message:'FAKE_PRIVATE',request_id:'r'}},403),{errorAdapter:createJsonApiErrorAdapter()}),'/file'),error=>error.kind==='http'&&error.status===403&&error.code==='forbidden');
});
test('DESIGN default budgets bound ordinary requests and downloads even with uncooperative fetch',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  for(const [download,budget] of [[false,30000],[true,120000]]){let release;const held=new Promise(resolve=>release=resolve),http=owner(()=>held),request=download?requestDownload(http,'/file'):http.request('/record'),failure=assert.rejects(request,error=>error.kind==='timeout');await flush();t.mock.timers.tick(budget);await failure;release(json(wire(null)));await flush();}
});
