import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {isolatedHttp,disposeServices} from './helpers/runtime-services.mjs';
import {createBusinessLogHttpLoader} from '../packages/runtime/dist/business-log-http.js';

// Business-log cases remain useful as archived wire examples. API Key uses the current BaseService v2 contract.
const fixture=JSON.parse(await readFile(new URL('./fixtures/page-contracts.v1.json',import.meta.url),'utf8'));
const {cases}=fixture;
const response=({status,body})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const client=fetch=>isolatedHttp({baseURL:'https://fixture.invalid/',fetch});
const signal=new AbortController().signal;

test('archived business-log fixtures retain native route and query coverage',async()=>{
 assert.equal(fixture.fixture_version,1);
 const pending=[cases.business_log_list,cases.business_log_detail],seen=[];
 const http=client(async(input,init)=>{
  const expected=pending.shift();assert(expected,'No unrecorded request is permitted');
  const url=new URL(input);assert.equal(init.method,expected.request.method);assert.equal(url.pathname,expected.request.path);
  assert.deepEqual(Object.fromEntries(url.searchParams),expected.request.query??{});
  assert.deepEqual(init.body===undefined?undefined:JSON.parse(init.body),expected.request.body);
  assert.equal(init.headers.get('accept'),'application/json');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
  seen.push(expected);return response(expected.response);
 });
 const logs=createBusinessLogHttpLoader({http});
 const page=await logs.list({filter:{since:'2026-10-12T01:00:00.000000001Z',until:'2026-10-12T02:00:00.000000001Z',actor:{kind:'user',id:'fixture:user'}},page:{index:0,size:20,cursor:null}},{signal});
 assert.deepEqual(page.list,cases.business_log_list.response.body.payload.list);assert.deepEqual(page.page,{page_index:0,page_size:20,total:1});
 const detail=await logs.detail(cases.business_log_detail.response.body.payload.event.id,{signal});assert.deepEqual(JSON.parse(JSON.stringify(detail)),cases.business_log_detail.response.body.payload);assert.equal(detail.event.schema_version,3);
 assert.equal(pending.length,0);assert.equal(seen.length,2);
});

test('business-log HTTP adapter accepts native success independently of the fixture example code',async()=>{
 for(const code of [0,1,2]){
  const http=client(async(input,init)=>{
   const expected=Object.values(cases).find(item=>item.request.method===init.method&&item.request.path===new URL(input).pathname&&item.response.body.success);
   assert(expected,'Only a successful fixture endpoint is permitted');return response({...expected.response,body:{...expected.response.body,code}});
  });
  const logs=createBusinessLogHttpLoader({http});const page=await logs.list({filter:{},page:{index:0,size:20,cursor:null}},{signal});assert.equal(page.list.length,1);
  assert.deepEqual(JSON.parse(JSON.stringify(await logs.detail(page.list[0].id,{signal}))),cases.business_log_detail.response.body.payload);disposeServices(http);
 }
});
