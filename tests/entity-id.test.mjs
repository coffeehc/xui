import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseEntityId} from '../packages/runtime/dist/entity-id.js';
import {createHttpClient} from '../packages/runtime/dist/http.js';
import {createAuthClient,parseAuthSession} from '../packages/runtime/dist/auth.js';
import {createApiKeyHttpAdapter,parseApiKeyWireMetadata} from './helpers/api-key-v2.mjs';

const read=async name=>JSON.parse(await readFile(new URL(`./fixtures/contracts/${name}`,import.meta.url),'utf8'));
const fixture=await read('identity-encodings.v1.json'),authFixture=await read('auth.v2.hex.json'),keyFixture=await read('page-contracts.v1.hex.json');
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const signal=new AbortController().signal;
const http=fetch=>createHttpClient({baseURL:'https://identity-fixture.invalid',fetch});
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
 let calls=0;const client=http(async()=>{calls++;throw Error('不得发请求');});
 assert.throws(()=>createAuthClient({http:client,idEncoding:'auto'}),TypeError);
 assert.throws(()=>createApiKeyHttpAdapter({http:client,idEncoding:'auto'}),TypeError);
 const auth=createAuthClient({http:client});assert.equal(calls,0);auth.destroy();client.destroy();
});

test('共享 hex wire 经 login/refresh/session/logout，保留原凭据隔离',async()=>{
 const seen=[],client=http(async(url,init)=>{const operation=new URL(url).pathname.split('/').at(-1);seen.push({operation,init});return json(authFixture[operation==='session'?'session':operation==='logout'?'logout':'issued']);});
 const auth=createAuthClient({http:client,idEncoding:'hex'});
 assert.equal((await auth.login(credentials)).id,'20000000000001');assert.equal((await auth.currentUser()).id,'20000000000001');assert.equal((await auth.refresh()).id,'20000000000001');await auth.logout();
 for(const {operation,init} of seen){assert.equal(init.credentials,operation==='session'?'omit':'same-origin');assert.equal(init.redirect,'error');assert.equal(init.headers.has('Authorization'),operation==='session');}
 assert(!JSON.stringify(auth.getState()).includes('bs-v1-sha256-access-'));auth.destroy();client.destroy();
});

test('hex 认证各端点拒绝非法身份，未知写入关闭后不重放',async()=>{
 for(const operation of ['login','refresh','session'])for(const id of ['0','01','A','8000000000000000','9223372036854775807']){
  let calls=0;const client=http(async url=>{calls++;const current=new URL(url).pathname.split('/').at(-1),source=authFixture[current==='session'?'session':'issued'];return json({...source,payload:{...source.payload,user:{...source.payload.user,...(current===operation?{id}:{})}}});});
  const auth=createAuthClient({http:client,idEncoding:'hex'});
  if(operation==='session')await auth.login(credentials);
  await assert.rejects(operation==='login'?auth.login(credentials):operation==='refresh'?auth.refresh():auth.currentUser(),error=>error.kind==='parse');
  assert.equal(auth.getState().user,null);assert(!JSON.stringify(auth.getState()).includes('bs-v1-sha256-access-'));
  if(operation!=='session'){assert.equal(auth.getState().reauthenticationRequired,true);const before=calls;await assert.rejects(auth.refresh());assert.equal(calls,before);}
  auth.destroy();client.destroy();
 }
});

test('归档 hex fixture 显式升级 v2 后保留列表、路径和 body 覆盖',async()=>{
 const pending=Object.values(keyFixture.cases),client=http(async(input,init)=>{
  const expected=pending.shift(),url=new URL(input);assert(expected);assert.equal(init.method,expected.request.method);assert.equal(url.pathname,expected.request.path);assert.deepEqual(Object.fromEntries(url.searchParams),expected.request.query??{});assert.deepEqual(init.body===undefined?undefined:JSON.parse(init.body),expected.request.body);return json(expected.response.body,expected.response.status);
 });
 const adapter=createApiKeyHttpAdapter({http:client,idEncoding:'hex'});await adapter.getConfiguration({signal});const rows=await adapter.list({signal});assert.equal(rows[0].id,'20000000000001');const created=await adapter.create(draft,{signal});assert.equal(created.metadata.id,rows[0].id);await adapter.revoke(rows[0],{signal});await adapter.deleteRecord({...rows[0],status:'revoked'},{signal});await assert.rejects(adapter.create(draft,{signal}),error=>error.status===503&&error.code===50301);assert.equal(pending.length,0);client.destroy();
});

test('Key 非法目标在发送前拒绝，响应非规范 ID 不成为成功',async()=>{
 for(const {encoding,invalid} of fixture.groups){
  let calls=0;const client=http(async()=>{calls++;return json(keyFixture.cases.api_key_create.response.body);}),adapter=createApiKeyHttpAdapter({http:client,idEncoding:encoding});
  for(const id of invalid){await assert.rejects(adapter.revoke({...metadata,id},{signal}),TypeError);await assert.rejects(adapter.deleteRecord({...metadata,id,status:'revoked'},{signal}),TypeError);}assert.equal(calls,0);client.destroy();
  for(const operation of ['list','create','revoke','delete']){
   const client=http(async()=>json({success:true,message:'',request_id:'',code:1,payload:operation==='list'?{list:[{...metadata,id:'01'}],total:1}:operation==='create'?{schema_version:1,metadata:{...metadata,id:'01'},secret:'FAKE'}:{schema_version:1,id:'01',operation:operation==='delete'?'delete_record':'revoke',completed:true}})),adapter=createApiKeyHttpAdapter({http:client,idEncoding:encoding});
   await assert.rejects(operation==='list'?adapter.list({signal}):operation==='create'?adapter.create(draft,{signal}):operation==='revoke'?adapter.revoke({...metadata,id:'1'},{signal}):adapter.deleteRecord({...metadata,id:'1',status:'revoked'},{signal}),error=>error.kind==='parse');client.destroy();
  }
 }
});
