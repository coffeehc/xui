import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHttpClient} from '../packages/runtime/dist/http.js';
import {createApiKeyHttpAdapter,parseApiKeyWireMetadata} from '../packages/runtime/dist/api-key-http.js';
import {createApiKeyManagerController} from '../packages/runtime/dist/api-key.js';
import {createBusinessLogHttpLoader} from '../packages/runtime/dist/business-log-http.js';

// Copied byte-for-byte to baseservice/docs/contracts/page-contracts.v1.json.
// Both suites consume this JSON through their real HTTP boundary implementations.
const fixture=JSON.parse(await readFile(new URL('./fixtures/page-contracts.v1.json',import.meta.url),'utf8'));
const {cases}=fixture;
const response=({status,body})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const client=fetch=>createHttpClient({baseURL:'https://fixture.invalid/',fetch});
const signal=new AbortController().signal;
const draft={name:'Synthetic key',permissionIds:['read'],expiryId:'30d',confirmed:true};

test('shared Go/TypeScript fixtures pass through default page HTTP adapters with exact requests',async()=>{
 assert.equal(fixture.fixture_version,1);
 const pending=Object.values(cases),seen=[];
 const http=client(async(input,init)=>{
  const expected=pending.shift();assert(expected,'No unrecorded request is permitted');
  const url=new URL(input);assert.equal(init.method,expected.request.method);assert.equal(url.pathname,expected.request.path);
  assert.deepEqual(Object.fromEntries(url.searchParams),expected.request.query??{});
  assert.deepEqual(init.body===undefined?undefined:JSON.parse(init.body),expected.request.body);
  assert.equal(init.headers.get('accept'),'application/json');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
  seen.push(expected);return response(expected.response);
 });
 const keys=createApiKeyHttpAdapter({http});assert.equal(keys.reconcileWrite,undefined);
 const configuration=await keys.getConfiguration({signal});assert.equal(configuration.permissions[0].required,true);assert.equal(configuration.canCreate,true);
 const rows=await keys.list({signal});assert.deepEqual(rows,[parseApiKeyWireMetadata(cases.api_key_list.response.body.payload.list[0])]);assert.equal(Object.hasOwn(rows[0],'lastUsedAtPending'),false);
 const created=await keys.create(draft,{signal});assert.equal(created.secret,'FAKE_CONTRACT_ONE_TIME_VALUE');assert.deepEqual(created.metadata,rows[0]);
 await keys.revoke(rows[0],{signal});await keys.deleteRecord({...rows[0],status:'revoked'},{signal});
 await assert.rejects(keys.create(draft,{signal}),error=>error.kind==='http'&&error.status===503&&error.code===50301&&error.requestId==='fixture:request');
 const logs=createBusinessLogHttpLoader({http});
 const page=await logs.list({filter:{since:'2026-10-12T01:00:00.000000001Z',until:'2026-10-12T02:00:00.000000001Z',actor:{kind:'user',id:'fixture:user'}},page:{index:0,size:20,cursor:null}},{signal});
 assert.deepEqual(page.list,cases.business_log_list.response.body.payload.list);assert.deepEqual(page.page,{page_index:0,page_size:20,total:1});
 const detail=await logs.detail(cases.business_log_detail.response.body.payload.event.id,{signal});assert.deepEqual(JSON.parse(JSON.stringify(detail)),cases.business_log_detail.response.body.payload);assert.equal(detail.event.schema_version,3);
 assert.equal(pending.length,0);assert.equal(seen.length,8);assert(!JSON.stringify(rows).includes(created.secret));
});

test('explicit 50301 unknown writes stay blocked through business/4xx responses, recreation and fresh lists',async()=>{
 for(const status of [200,400,403,409,503])for(const operation of ['create','revoke','delete']){
  let writes=0;
  const row={...cases.api_key_list.response.body.payload.list[0],...(operation==='delete'?{status:'revoked',capabilities:{revoke:false,delete_record:true}}:{})};
  const adapter=createApiKeyHttpAdapter({http:client(async(_input,init)=>{
   if(init.method==='GET')return response({status:200,body:{...cases.api_key_list.response.body,payload:{list:[row],total:1}}});
   writes++;return response({...cases.api_key_write_outcome_unknown.response,status});
  })});
  const make=()=>createApiKeyManagerController({adapter,canCreate:true,permissions:[{id:'read',label:'Read',required:true}],expiryOptions:[{id:'30d',label:'30 days'}],defaultExpiryId:'30d'});
  const first=make();await first.refresh();
  if(operation==='create'){first.openCreate();first.setDraft(draft);await first.submitCreate();}
  else if(operation==='revoke'){first.openRevoke(row.id);await first.confirmRevoke();}
  else{first.openDeleteRecord(row.id);await first.confirmDeleteRecord();}
  assert.equal(writes,1);assert.equal(first.getState().writeBlock?.status,'uncertain',`${operation} HTTP ${status}`);assert.equal(first.readSecret(),null);
  first.close();await first.refresh();assert.equal(first.getState().actionUncertain,true);first.destroy();
  const second=make();assert.equal(second.getState().actionUncertain,true);await second.refresh();await second.recoverUncertainWrite();
  assert.equal(second.getState().writeBlock?.status,'uncertain');assert.equal(second.getState().recoveryError,second.labels.recoveryUnavailable);
  second.openCreate();second.setDraft(draft);await second.submitCreate();second.openRevoke(row.id);await second.confirmRevoke();second.openDeleteRecord(row.id);await second.confirmDeleteRecord();
  assert.equal(second.getState().phase,'closed');assert.equal(writes,1);assert.equal(second.readSecret(),null);second.destroy();
 }
});

test('ordinary definite native refusals release the guard without automatically replaying a write',async()=>{
 for(const status of [200,403,409]){
  let writes=0;
  const adapter=createApiKeyHttpAdapter({http:client(async()=>{writes++;return response({status,body:{...cases.api_key_write_outcome_unknown.response.body,code:40301,message:'Synthetic refusal'}});})});
  const make=()=>createApiKeyManagerController({adapter,canCreate:true,permissions:[{id:'read',label:'Read'}],expiryOptions:[{id:'30d',label:'30 days'}],defaultExpiryId:'30d'});
  const first=make();first.openCreate();first.setDraft(draft);await first.submitCreate();assert.equal(writes,1);assert.equal(first.getState().writeBlock,null);assert.equal(first.getState().actionUncertain,false);assert.equal(first.getState().actionError,first.labels.createRejected);first.destroy();
  const second=make();assert.equal(second.getState().writeBlock,null);second.openCreate();second.setDraft(draft);await second.submitCreate();assert.equal(writes,2);second.destroy();
 }
});
