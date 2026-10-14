import test from 'node:test';
import assert from 'node:assert/strict';
import {createApiKeyHttpAdapter,parseApiKeyConfiguration,parseApiKeyWireMetadata} from '../packages/runtime/dist/api-key-http.js';
import {createHttpClient} from '../packages/runtime/dist/http.js';

const metadata=(id='9007199254740993',version='19',extra={})=>({id,name:'Synthetic key',prefix:'FAKE',permission_ids:['read'],created_at:null,expires_at:null,last_used_at:null,status:'active',version,enabled:true,capabilities:{update:true,revoke:true,delete_record:true},...extra});
const configuration=()=>({schema_version:2,can_create:true,permissions:[{id:'read',label:'Read',description:null,disabled:false,required:true},{id:'write',label:'Write',description:'Write access',disabled:false,required:false}],expiry_options:[{id:'30d',label:'30 days'}],default_expiry_id:'30d',default_permission_ids:[],confirmation_label:'Confirm permissions'});
const json=(payload,status=200)=>new Response(JSON.stringify({success:status===200,message:'',payload:status===200?payload:null,request_id:'fixture',code:status===200?1:50301}),{status,headers:{'Content-Type':'application/json'}});
const signal=new AbortController().signal;
const client=fetch=>createHttpClient({baseURL:'https://fixture.invalid/prefix/',fetch});

test('API key v2 parsers enforce schema versions, allowlisted fields, capabilities and declared permissions',async()=>{
 const config=parseApiKeyConfiguration(configuration());assert.equal(config.canCreate,true);assert.deepEqual(config.defaultPermissionIds,[]);assert.equal(config.permissions[0].required,true);assert(Object.isFrozen(config.permissions));
 for(const invalid of [{...configuration(),schema_version:1},{...configuration(),unknown:true},{...configuration(),permissions:[{...configuration().permissions[0],required:'true'}]},{...configuration(),default_expiry_id:'missing'},{...configuration(),default_permission_ids:['missing']}])assert.throws(()=>parseApiKeyConfiguration(invalid),TypeError);
 const row=parseApiKeyWireMetadata(metadata());assert.equal(row.id,'9007199254740993');assert.equal(row.version,'19');assert(Object.isFrozen(row));assert(Object.isFrozen(row.permissionIds));
 for(const invalid of [metadata('01'),metadata('0'),metadata('1',{version:'0'}),metadata('1','01'),metadata('1','1',{enabled:'true'}),metadata('1','1',{extra:'private'}),metadata('1','1',{capabilities:{revoke:true,delete_record:true}})])assert.throws(()=>parseApiKeyWireMetadata(invalid),TypeError);
});

test('HTTP writes use ordinary routes and DTOs without operation headers or descriptors',async()=>{
 const requests=[],current=metadata(),transport=client(async(input,init)=>{
  const url=new URL(input),body=init.body===undefined?undefined:JSON.parse(init.body);requests.push({path:url.pathname,method:init.method,query:Object.fromEntries(url.searchParams),headers:new Headers(init.headers),body});
  if(url.pathname.endsWith('/capabilities'))return json(configuration());
  if(init.method==='GET')return json({list:[current],total:1});
  if(init.method==='POST'&&url.pathname==='/api/v1/api-keys')return json({schema_version:2,metadata:current,secret:'FAKE_ONE_TIME_VALUE'});
  if(init.method==='PUT')return json({schema_version:2,id:current.id,operation:'update',completed:true,metadata:{...current,name:body.name,permission_ids:body.permission_ids,enabled:body.enabled,version:'20'}});
  if(url.pathname.endsWith('/revoke'))return json({schema_version:2,id:current.id,operation:'revoke',completed:true});
  if(url.pathname.endsWith('/record'))return json({schema_version:2,id:current.id,operation:'delete_record',completed:true});
  throw new Error(`Unexpected ${init.method} ${url.pathname}`);
 }),adapter=createApiKeyHttpAdapter({http:transport,pageSize:20});
 const config=await adapter.getConfiguration({signal});assert.equal(config.canCreate,true);const rows=await adapter.list({signal});assert.equal(rows[0].id,current.id);
 const created=await adapter.create({name:'New key',permissionIds:['read'],expiryId:'30d',confirmed:true},{signal});assert.equal(created.secret,'FAKE_ONE_TIME_VALUE');assert.equal(created.metadata.id,current.id);
 const updated=await adapter.update(rows[0],{name:'Updated',permissionIds:['read'],enabled:false},{signal});assert.equal(updated.version,'20');await adapter.revoke(rows[0],{signal});await adapter.deleteRecord({...rows[0],status:'revoked'},{signal});
 assert.deepEqual(requests.map(({method,path})=>[method,path]),[['GET','/api/v1/api-keys/capabilities'],['GET','/api/v1/api-keys'],['POST','/api/v1/api-keys'],['PUT','/api/v1/api-keys/9007199254740993'],['POST','/api/v1/api-keys/9007199254740993/revoke'],['DELETE','/api/v1/api-keys/9007199254740993/record']]);
 assert.deepEqual(requests[2].body,{name:'New key',permission_ids:['read'],expiry_id:'30d',confirmed:true});assert.deepEqual(requests[3].body,{expected_version:'19',name:'Updated',permission_ids:['read'],enabled:false});assert.deepEqual(requests[4].body,{});assert.equal(requests[5].body,undefined);
 for(const request of requests){assert.equal(request.headers.get('accept'),'application/json');assert.equal(request.headers.has('x-api-key-operation-id'),false);assert.equal(request.headers.has('x-api-key-request-fingerprint'),false);assert(!JSON.stringify(request.body??{}).includes('operation_id'));assert(!JSON.stringify(request.body??{}).includes('fingerprint'));assert(!JSON.stringify(request.body??{}).includes('FAKE_ONE_TIME_VALUE'));}
 transport.destroy();
});

test('HTTP acknowledgements require strict v2 and matching records, and secrets never enter metadata',async()=>{
 const malformed=[{schema_version:1,metadata:metadata(),secret:'FAKE'},{schema_version:2,metadata:{...metadata(),secret:'FAKE'},secret:'FAKE'},{schema_version:2,metadata:metadata(),secret:'',operation_id:'legacy'},{schema_version:2,metadata:metadata(),secret:'FAKE',fingerprint:'legacy'}];
 for(const payload of malformed){const http=client(async()=>json(payload));const adapter=createApiKeyHttpAdapter({http});await assert.rejects(adapter.create({name:'Demo',permissionIds:['read'],expiryId:'30d'},{signal}),error=>error.kind==='parse');http.destroy();}
 const badConfig=client(async()=>json({...configuration(),schema_version:3})),invalid=createApiKeyHttpAdapter({http:badConfig});await assert.rejects(invalid.getConfiguration({signal}),error=>error.kind==='parse');badConfig.destroy();
});
