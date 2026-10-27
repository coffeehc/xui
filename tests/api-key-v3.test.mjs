import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createApiKeyHttpAdapter,parseApiKeyWireMetadata,parseApiKeyConfiguration} from '../packages/runtime/dist/api-key-http.js';
import {parseApiKeyMetadata,createApiKeyManagerController} from '../packages/runtime/dist/api-key.js';
import {isolatedHttp,isolatedAuth,disposeServices} from './helpers/runtime-services.mjs';
const fixtures=await Promise.all(['api-key-contracts.v3.json','api-key-contracts.v3.hex.json'].map(async name=>JSON.parse(await readFile(new URL('./fixtures/'+name,import.meta.url),'utf8'))));
const signal=new AbortController().signal,baseURL='https://keys.example';
const wire=(payload,success=true)=>({success,message:success?'':'FAKE_PRIVATE_ERROR',payload,code:success?1:40301,request_id:'fixture'});
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const row=()=>parseApiKeyWireMetadata(fixtures[0].cases.api_key_list_recoverable.response.body.payload.list[0],'decimal',3);
const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {resolve,promise};};
const user={id:'42',username:'fixture',display_name:null},session={schema_version:2,user};
const issued=()=>({...session,access_token:'bs-v1-sha256-access-'+'A'.repeat(43),token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()});
const login=auth=>auth.login({username:'fixture',password:'FAKE_PASSWORD'});

for(const [index,fixture] of fixtures.entries())test(`v3 official shared ${index?'hex':'decimal'} fixtures match exact requests, CRUD and all secret outcomes`,async()=>{
 const idEncoding=index?'hex':'decimal',cases=fixture.cases;assert.equal(Object.keys(cases).length,21);
 let expected,reads=0;const http=isolatedHttp({baseURL,fetch:async(input,init)=>{assert(expected);const url=new URL(input);assert.equal(init.method,expected.request.method);assert.equal(url.pathname,expected.request.path);assert.deepEqual(Object.fromEntries(url.searchParams),expected.request.query??{});assert.equal(init.body??'',expected.request.body_text);assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');reads++;return json(expected.response.body,expected.response.status);}}),api=createApiKeyHttpAdapter({http,schemaVersion:3,idEncoding});
 try{
  expected=cases.api_key_capabilities;const config=await api.getConfiguration();assert.equal(config.canCreate,true);
  for(const name of ['api_key_list','api_key_list_recoverable','api_key_list_read_denied']){expected=cases[name];const records=await api.list({signal});assert.equal(api.keyCopy.canCopy(records[0]),name==='api_key_list_recoverable');assert(Object.isFrozen(records[0].secretAccess));}
  const key=parseApiKeyWireMetadata(cases.api_key_list_recoverable.response.body.payload.list[0],idEncoding,3);
  expected=cases.api_key_create;const created=await api.create({name:'Synthetic key',permissionIds:['read'],expiryId:'30d',confirmed:true},{signal});assert.equal(created.secret,expected.response.body.payload.secret);
  expected=cases.api_key_update;await api.update(key,{name:'研究密钥',permissionIds:['read','write'],enabled:false},{signal});
  expected=cases.api_key_revoke;await api.revoke(key,{signal});expected=cases.api_key_delete_record;await api.deleteRecord({...key,status:'revoked'},{signal});
  for(const name of Object.keys(cases).filter(name=>name.startsWith('api_key_secret_')&&name!=='api_key_secret_duplicate_version')){expected=cases[name];const count=reads;if(expected.response.status===200)assert.equal(await api.keyCopy.readValue({...key,status:name.endsWith('revoked')?'revoked':name.endsWith('expired')?'expired':name.endsWith('disabled')?'disabled':'active'},{signal}),expected.response.body.payload.secret);else await assert.rejects(api.keyCopy.readValue(key,{signal}),e=>e.status===expected.response.status&&e.metadata.code===expected.response.body.code);assert.equal(reads,count+1);}
  // Invalid duplicate raw JSON belongs to the server fixture; the typed client emits exactly one field.
  assert.equal(cases.api_key_secret_duplicate_version.response.status,400);
  expected=cases.api_key_write_outcome_unknown;await assert.rejects(api.create({name:'Synthetic key',permissionIds:['read'],expiryId:'30d',confirmed:true},{signal}),e=>e.status===503);
 }finally{disposeServices(http);}
});

test('schema is explicit, v2 unchanged, v3 requires consistent exact secret access facts',()=>{
 const v3=fixtures[0].cases.api_key_list_recoverable.response.body.payload.list[0],config=fixtures[0].cases.api_key_capabilities.response.body.payload;
 assert.throws(()=>parseApiKeyWireMetadata(v3),TypeError);assert.throws(()=>parseApiKeyConfiguration(config),TypeError);
 const {secret_access,...v2}=v3;assert.throws(()=>parseApiKeyWireMetadata(v2,'decimal',3),TypeError);assert.equal(parseApiKeyWireMetadata(v2).secretAccess,undefined);
 for(const access of [null,{}, {...secret_access,can_copy:'true'},{...secret_access,can_copy:false},{...secret_access,extra:true}])assert.throws(()=>parseApiKeyWireMetadata({...v3,secret_access:access},'decimal',3),TypeError);
 for(const access of [null,{authorized:true,recoverable:true,canCopy:false},{authorized:true,recoverable:true,canCopy:true,secret:'FAKE'}])assert.throws(()=>parseApiKeyMetadata({...row(),secretAccess:access}),TypeError);
 const http=isolatedHttp({baseURL,fetch:async()=>{throw Error('no IO');}});assert.equal(createApiKeyHttpAdapter({http}).keyCopy,undefined);assert.throws(()=>createApiKeyHttpAdapter({http,schemaVersion:4}),TypeError);disposeServices(http);
});

test('official reader refuses unknown/denied/hash or invalid IDs/versions before IO, and preserves controller facts without secrets',async()=>{
 let calls=0;const http=isolatedHttp({baseURL,fetch:async()=>{calls++;return json(wire({schema_version:3,list:[fixtures[0].cases.api_key_list_recoverable.response.body.payload.list[0]],total:1}));}}),api=createApiKeyHttpAdapter({http,schemaVersion:3}),key=row();
 for(const record of [{...key,secretAccess:undefined},{...key,secretAccess:{authorized:false,recoverable:true,canCopy:false}},{...key,secretAccess:{authorized:true,recoverable:false,canCopy:false}},{...key,id:'01'},{...key,version:'0'},{...key,version:undefined}]){assert.equal(api.keyCopy.canCopy(record),false);await assert.rejects(api.keyCopy.readValue(record,{signal}));}assert.equal(calls,0);
 const abort=new AbortController();abort.abort();await assert.rejects(api.keyCopy.readValue(key,{signal:abort.signal}),e=>e.kind==='cancel');assert.equal(calls,0);
 const controller=createApiKeyManagerController({adapter:api,permissions:[{id:'read',label:'Read'}],expiryOptions:[{id:'30d',label:'30 days'}],defaultExpiryId:'30d'});await controller.refresh();assert.deepEqual(controller.getState().rows[0].secretAccess,key.secretAccess);assert(Object.isFrozen(controller.getState().rows[0].secretAccess));assert.equal(calls,1);controller.destroy();disposeServices(http);
});

test('secret payload binds schema, ID and version; malformed values and raw errors never escape',async()=>{
 const good=fixtures[0].cases.api_key_secret_read.response.body.payload,key=row();
 for(const payload of [{...good,schema_version:2},{...good,id:'1'},{...good,version:'20'},{...good,version:19},{...good,extra:'FAKE'},{...good,secret:''},{...good,secret:'******'},{...good,secret:key.prefix},{...good,secret:'BAD\nVALUE'},{...good,secret:'密'.repeat(6000)}]){
  const http=isolatedHttp({baseURL,fetch:async()=>json(wire(payload))}),api=createApiKeyHttpAdapter({http,schemaVersion:3});await assert.rejects(api.keyCopy.readValue(key,{signal}),e=>e.kind==='parse'&&(!payload.secret||!JSON.stringify(e).includes(payload.secret)));disposeServices(http);
 }
 for(const status of [200,403]){let observed;const http=isolatedHttp({baseURL,onError:e=>{observed=e;},fetch:async()=>json(wire(null,false),status)}),api=createApiKeyHttpAdapter({http,schemaVersion:3});await assert.rejects(api.keyCopy.readValue(key,{signal}),e=>!String(e).includes('FAKE_PRIVATE')&&!e.business?.message);assert(!JSON.stringify(observed).includes('FAKE_PRIVATE'));disposeServices(http);}
});

test('cancel and timeout settle without retry; a late secret is never returned',async()=>{
 for(const mode of ['cancel','timeout']){const held=deferred(),started=deferred();let calls=0;const http=isolatedHttp({baseURL,fetch:async()=>{calls++;started.resolve();return held.promise;}}),api=createApiKeyHttpAdapter({http,schemaVersion:3,timeoutMs:30}),abort=new AbortController();
  const operation=api.keyCopy.readValue(row(),{signal:abort.signal});await started.promise;if(mode==='cancel')abort.abort();await assert.rejects(operation,e=>e.kind===mode);held.resolve(json(fixtures[0].cases.api_key_secret_read.response.body));await Promise.resolve();assert.equal(calls,1);disposeServices(http);
 }
});

test('secret reads use only the current Auth owner; no bootstrap recovery, 401 refresh or replay',async()=>{
 const calls=[];const {http,auth}=isolatedAuth({baseURL,fetch:async(input,init)=>{const path=new URL(input).pathname;calls.push({path,init});if(path.endsWith('/login'))return json(wire(issued()));if(path.endsWith('/session'))return json(wire(session));if(path.endsWith('/secret'))return json(wire(null,false),401);throw Error('must not recover');}},{protectedPaths:['/api/v1/api-keys/']});const api=createApiKeyHttpAdapter({http,schemaVersion:3});
 await assert.rejects(api.keyCopy.readValue(row(),{signal}),e=>e.status===401);assert.equal(calls.length,0);
 await login(auth);const before=calls.length;await assert.rejects(api.keyCopy.readValue(row(),{signal}),e=>e.status===401);assert.equal(calls.length,before+1);assert.equal(calls.at(-1).init.credentials,'omit');assert(calls.at(-1).init.headers.get('Authorization').startsWith('Bearer '));assert.equal(auth.getState().status,'anonymous');assert.equal(calls.filter(c=>c.path.endsWith('/refresh')).length,0);disposeServices(http,auth);
});

test('a pending secret cannot survive auth generation change, expiration or owner destruction',async()=>{
 for(const change of ['expire','login','destroy']){const held=deferred(),started=deferred(),calls=[];const {http,auth}=isolatedAuth({baseURL,fetch:async(input)=>{const path=new URL(input).pathname;calls.push(path);if(path.endsWith('/secret')){started.resolve();return held.promise;}return json(wire(path.endsWith('/session')?session:issued()));}},{protectedPaths:['/api/v1/api-keys/']});await login(auth);const api=createApiKeyHttpAdapter({http,schemaVersion:3}),operation=api.keyCopy.readValue(row(),{signal});await started.promise;if(change==='login')await login(auth);else auth[change]();held.resolve(json(fixtures[0].cases.api_key_secret_read.response.body));await assert.rejects(operation,e=>e.kind==='cancel');assert.equal(calls.filter(path=>path.endsWith('/secret')).length,1);assert(!calls.some(path=>path.endsWith('/refresh')));disposeServices(http,auth);}
});
