import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseEntityId} from '../packages/runtime/dist/entity-id.js';
import {parseAuthSession} from '../packages/runtime/dist/auth.js';
import {createApiKeyHttpAdapter,parseApiKeyWireMetadata} from '../packages/runtime/dist/api-key-http.js';
import {XuiServices} from '../packages/runtime/dist/services.js';
import {isolatedHttp,isolatedAuth,disposeServices} from './helpers/runtime-services.mjs';

const read=async name=>JSON.parse(await readFile(new URL(`./fixtures/contracts/${name}`,import.meta.url),'utf8'));
const fixture=await read('identity-encodings.v1.json'),authFixture=await read('auth.v2.hex.json'),keyFixture=JSON.parse(await readFile(new URL('./fixtures/api-key-contracts.v2.hex.json',import.meta.url),'utf8'));
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const signal=new AbortController().signal;
const http=fetch=>isolatedHttp({baseURL:'https://identity-fixture.invalid',fetch});
const credentials={username:'fixture',password:'FAKE_PASSWORD'};
const draft={name:'Synthetic key',permissionIds:['read'],expiryId:'30d',confirmed:true};
const metadata=keyFixture.cases.api_key_list.response.body.payload.list[0];

test('共享 decimal/hex 身份矩阵保留 int64 字符串精度，拒绝非规范及未知编码',()=>{
 assert.equal(fixture.groups.length,2);
 for(const group of fixture.groups){
  for(const {encoded} of group.valid){assert.equal(parseEntityId(encoded,group.encoding),encoded);assert.equal(parseAuthSession({schema_version:2,user:{id:encoded,username:'fixture',display_name:null}},group.encoding).user.id,encoded);assert.equal(parseApiKeyWireMetadata({...metadata,id:encoded},group.encoding).id,encoded);}
  for(const invalid of [...group.invalid,0,1,9007199254740993n,null,undefined,{},['1']]){
   assert.throws(()=>parseEntityId(invalid,group.encoding),TypeError);
   assert.throws(()=>parseAuthSession({schema_version:2,user:{id:invalid,username:'fixture',display_name:null}},group.encoding),TypeError);
   assert.throws(()=>parseApiKeyWireMetadata({...metadata,id:invalid},group.encoding),TypeError);
  }
 }
 assert.equal(parseEntityId('9223372036854775807'),'9223372036854775807');
 assert.equal(parseEntityId('10','decimal'),'10');assert.equal(parseEntityId('10','hex'),'10');
 for(const encoding of ['auto','HEX','16','',null])assert.throws(()=>parseEntityId('1',encoding),TypeError);
});

test('未知编码在任何 HTTP 或认证 owner 绑定之前拒绝',()=>{
 let calls=0;const services=new XuiServices({http:{options:{baseURL:'https://identity-fixture.invalid',fetch:async()=>{calls++;throw Error('不得发请求');}}},auth:{options:{idEncoding:'auto'}}});
 const client=services.getHttpService();
 assert.throws(()=>services.getAuthService(),TypeError);
 assert.throws(()=>createApiKeyHttpAdapter({http:client,idEncoding:'auto'}),TypeError);
 assert.equal(calls,0);services.dispose();
});

test('共享 hex wire 经 login/refresh/session/logout，保留原凭据隔离',async()=>{
 const seen=[],owner=isolatedAuth({baseURL:'https://identity-fixture.invalid',fetch:async(url,init)=>{const operation=new URL(url).pathname.split('/').at(-1);seen.push({operation,init});return json(authFixture[operation==='session'?'session':operation==='logout'?'logout':'issued']);}},{idEncoding:'hex'}),{http:client,auth}=owner;
 assert.equal((await auth.login(credentials)).id,'20000000000001');assert.equal((await auth.currentUser()).id,'20000000000001');assert.equal((await auth.refresh()).id,'20000000000001');await auth.logout();
 for(const {operation,init} of seen){assert.equal(init.credentials,operation==='session'?'omit':'same-origin');assert.equal(init.redirect,'error');assert.equal(init.headers.has('Authorization'),operation==='session');}
 assert(!JSON.stringify(auth.getState()).includes('bs-v1-sha256-access-'));disposeServices(auth,client);
});

test('hex v2 fixtures cover ordinary API key list/create/update/revoke/delete routes',async()=>{
 const names=['api_key_capabilities','api_key_list','api_key_create','api_key_update','api_key_revoke','api_key_delete_record'],pending=names.map(name=>keyFixture.cases[name]),client=http(async(input,init)=>{
  const expected=pending.shift(),url=new URL(input);assert(expected);assert.equal(init.method,expected.request.method);assert.equal(url.pathname,expected.request.path);assert.deepEqual(Object.fromEntries(url.searchParams),expected.request.query??{});assert.deepEqual(init.body===undefined?undefined:JSON.parse(init.body),expected.request.body);return json(expected.response.body,expected.response.status);
 });
 const adapter=createApiKeyHttpAdapter({http:client,idEncoding:'hex'});await adapter.getConfiguration({signal});const rows=await adapter.list({signal});assert.equal(rows[0].id,'20000000000001');const created=await adapter.create(draft,{signal});assert.equal(created.metadata.id,rows[0].id);const updated=await adapter.update(rows[0],{name:'研究密钥',permissionIds:['read','write'],enabled:false},{signal});assert.equal(updated.version,'20');await adapter.revoke(rows[0],{signal});await adapter.deleteRecord({...rows[0],status:'revoked'},{signal});assert.equal(pending.length,0);disposeServices(client);
});

test('Key 非法目标在发送前拒绝，响应非规范 ID 不成为成功',async()=>{
 for(const {encoding,invalid} of fixture.groups){
  let calls=0;const client=http(async()=>{calls++;return json(keyFixture.cases.api_key_create.response.body);}),adapter=createApiKeyHttpAdapter({http:client,idEncoding:encoding});
  for(const id of invalid){assert.throws(()=>adapter.revoke({...metadata,id},{signal}),TypeError);assert.throws(()=>adapter.deleteRecord({...metadata,id,status:'revoked'},{signal}),TypeError);}assert.equal(calls,0);disposeServices(client);
  for(const operation of ['list','create','revoke','delete']){
   const valid=operation==='create'?keyFixture.cases.api_key_create.response.body.payload:operation==='list'?{list:[metadata],total:1}:{schema_version:2,id:'20000000000001',operation:operation==='delete'?'delete_record':'revoke',completed:true};
   const payload=operation==='list'?{...valid,list:[{...metadata,id:'01'}]}:operation==='create'?{...valid,metadata:{...valid.metadata,id:'01'}}:{...valid,id:'01'};
   const client=http(async()=>json({success:true,message:'',request_id:'',code:1,payload})),adapter=createApiKeyHttpAdapter({http:client,idEncoding:encoding});
   await assert.rejects(operation==='list'?adapter.list({signal}):operation==='create'?adapter.create(draft,{signal}):operation==='revoke'?adapter.revoke({...metadata,id:'1'},{signal}):adapter.deleteRecord({...metadata,id:'1',status:'revoked'},{signal}),error=>error.kind==='parse');disposeServices(client);
  }
 }
});
