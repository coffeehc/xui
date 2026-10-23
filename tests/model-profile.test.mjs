import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createModelProfileController, modelProfileProviders, ModelProfileClient, parseModelProfileEditorData} from '../packages/runtime/dist/model-profile.js';
import {HttpError} from '../packages/runtime/dist/http.js';
const defaults = modelProfileProviders.map(p => ({provider_type:p.id,model_name:'',real_name:'',base_url:'https://models.example.test/v1',timeout_seconds:0,max_concurrency:6,disable_stream:p.kind!=='chat',capabilities:p.kind==='embedding'?{supports_embedding:true}:{supports_chat:true},default_policy:p.kind==='embedding'?null:{}}));
const data = (id='p1') => ({schema_version:1,profile_id:id,version:id?'1':null,config:{...defaults[1],model_name:'Example',real_name:'example-chat'},defaults,has_api_key:!!id,header_names:['X-Scope'],can_save:true});
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const setup=(overrides={},options={})=>{const calls=[];const service={read:async(id)=>data(id??null),catalog:async candidate=>{calls.push(candidate);return {schema_version:1,models:[{id:'a'}]};},test:async candidate=>{calls.push(candidate);return {schema_version:1,kind:'chat',passed:true,elapsed_ms:3,summary:'Passed'};},save:async candidate=>{calls.push(candidate);return {...data(),version:'2'};},...overrides};const controller=createModelProfileController({service,initial:data(),...options});return {controller,calls};};

test('Provider catalog includes six exact agentCore IDs and independent embedding protocol',()=>{
 assert.deepEqual(modelProfileProviders.map(p=>p.id),['openai_completions','openai_responses','openai_images','openai_embeddings','gemini','anthropic']);
 assert.equal(modelProfileProviders[3].kind,'embedding');assert.equal(modelProfileProviders[4].catalog,false);
});
test('read projection rejects secrets, unsupported providers, invalid embedding policy',()=>{
 assert.throws(()=>parseModelProfileEditorData({...data(),api_key:'synthetic'}));
 assert.throws(()=>parseModelProfileEditorData({...data(),config:{...data().config,headers:{}}}));
 assert.throws(()=>parseModelProfileEditorData({...data(),config:{...data().config,provider_type:'invented'}}));
 assert.throws(()=>parseModelProfileEditorData({...data(),config:{...defaults[3],default_policy:{temperature:1}}}));
 assert(Object.isFrozen(parseModelProfileEditorData(data()).config));
});
test('candidate is an explicit patch: no default merge, zero/false retained, stored-key marker retained',async()=>{
 const {controller,calls}=setup();controller.setField('timeout_seconds',0);controller.setField('disable_stream',false);
 await controller.catalog();assert.deepEqual(calls[0],{profile_id:'p1',expected_version:'1',config:{timeout_seconds:0,disable_stream:false,api_key:'******'}});
 controller.destroy();
});
test('catalog does not require model names and unsupported protocols do not issue requests',async()=>{
 const {controller,calls}=setup({}, {initial:{...data(null),config:defaults[1]}});await controller.catalog();assert.equal(calls.length,1);
 controller.setField('provider_type','anthropic');await controller.catalog();assert.equal(calls.length,1);
 await controller.test();assert.equal(controller.getState().errors.real_name,'required');controller.destroy();
});
test('DOM credential reader supplies one-operation key/header overrides without public state leakage',async()=>{
 const {controller,calls}=setup();controller.bindCredentials(()=>({api_key:'synthetic-test-value',headers:{'X-Scope':'fixture'}}));
 controller.setCredentialMode('api_key','replace');controller.setCredentialMode('headers','replace');await controller.catalog();
 assert.equal(calls[0].config.api_key,'synthetic-test-value');assert(!JSON.stringify(controller.getState()).includes('synthetic-test-value'));
 controller.setCredentialMode('api_key','clear');controller.setCredentialMode('headers','clear');await controller.catalog();assert.deepEqual(calls[1].config,{api_key:'',headers:{}});
 controller.destroy();
});
test('same-connection refresh retains directory; edits cancel/ignore stale directory responses',async()=>{
 let waiting;const {controller}=setup({catalog:async()=>waiting?waiting.promise:{schema_version:1,models:[{id:'first'}]}});
 await controller.catalog();waiting=defer();const old=controller.catalog();await Promise.resolve();assert.equal(controller.getState().catalog[0].id,'first');
 controller.setField('base_url','https://changed.example.test/v1');assert.equal(controller.getState().catalog,null);waiting.resolve({schema_version:1,models:[{id:'old'}]});await old;assert.equal(controller.getState().catalog,null);assert.equal(controller.getState().operation,null);controller.destroy();
});
test('embedding switches to backend-provided fields and sends typed test input without chat policy',async()=>{
 let captured;const {controller}=setup({test:async request=>{captured=request;return {schema_version:1,kind:'embedding',passed:true,elapsed_ms:4,summary:'Encoded',embedding:{count:1,dimensions:256}};}});
 controller.setField('provider_type','openai_embeddings');assert.equal(controller.getState().draft.default_policy,null);
 controller.setEmbeddingTest('Fixture text','256');await controller.test();assert.deepEqual(captured.embedding,{input:['Fixture text'],dimensions:256});assert.equal(captured.config.default_policy,null);
 assert.equal(controller.getState().testResult.embedding.dimensions,256);controller.destroy();
});
test('save deduplicates, uncertain results block replay until explicit reconciliation',async()=>{
 let calls=0;const waiting=defer();const {controller}=setup({save:async()=>{calls++;await waiting.promise;throw new HttpError('network');}});
 const first=controller.save();await Promise.resolve();await controller.save();assert.equal(calls,1);waiting.resolve();await first;
 assert.equal(controller.getState().error,'save_unknown');await controller.save();assert.equal(calls,1);
 controller.setField('model_name','Retained');await controller.save();assert.equal(calls,1);await controller.load();assert.equal(controller.getState().error,null);controller.destroy();
});
test('invalid JSON keeps draft text and blocks requests; reset restores confirmed fields',async()=>{
 const {controller,calls}=setup();controller.setPolicyText('{invalid');await controller.test();assert.equal(calls.length,0);assert.equal(controller.getState().errors.default_policy,'json');assert.equal(controller.getState().policyText,'{invalid');
 controller.reset();assert.equal(controller.getState().dirty,false);assert.equal(controller.getState().policyText,'{}');controller.destroy();
});
test('invalid Headers JSON does not misdiagnose a replacement key when the view reader cannot return',async()=>{
 const {controller,calls}=setup();controller.setCredentialMode('api_key','replace');controller.setCredentialMode('headers','replace');
 controller.bindCredentials(()=>{throw new SyntaxError('Invalid JSON');});await controller.test();
 assert.deepEqual(controller.getState().errors,{headers:'json'});assert.equal(calls.length,0);controller.destroy();
});
test('disabled and readonly block edits/IO; clear removes private scope and ignores late result',async()=>{
 const waiting=defer();const {controller,calls}=setup({test:async()=>waiting.promise});controller.update({readOnly:true});controller.setField('model_name','Forbidden');await controller.catalog();assert.equal(calls.length,0);assert.equal(controller.getState().draft.model_name,'Example');
 controller.update({readOnly:false});const job=controller.test();await Promise.resolve();controller.clear();waiting.resolve({schema_version:1,kind:'chat',passed:true,elapsed_ms:1,summary:'old'});await job;assert.equal(controller.getState().data,null);assert.equal(controller.getState().testResult,null);controller.destroy();
});
test('injected non-cooperative operation has bounded waiting and rejects its late result',async()=>{
 const waiting=defer();const {controller}=setup({catalog:async()=>waiting.promise},{timeoutMs:10});await controller.catalog();assert.equal(controller.getState().error,'catalog');assert.equal(controller.getState().operation,null);
 waiting.resolve({schema_version:1,models:[{id:'late'}]});await Promise.resolve();assert.equal(controller.getState().catalog,null);controller.destroy();
});
test('HTTP client uses official facade, no retry/secret URL, strict DTOs and a borrowed transport',async()=>{
 const requests=[];const client=new ModelProfileClient({http:{request:async(path,options)=>{requests.push({path,options});return {payload:options.adapter({success:true,message:'',payload:{schema_version:1,models:[]},request_id:'fixture',code:1},{status:200,attempts:1}).payload};}}});
 await client.catalog({profile_id:'p1',expected_version:'1',config:{api_key:'synthetic'}},{signal:new AbortController().signal});
 const {path,options}=requests[0];assert.equal(path,'/api/v1/model-profiles/actions/catalog');assert.equal(options.method,'POST');assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');assert.equal(options.retry,undefined);assert(!path.includes('synthetic'));
 assert.throws(()=>client.catalog({config:{is_test:true}},{signal:new AbortController().signal}));
});

test('cancel followed immediately by a new request cannot consume its task or publish the old result',async()=>{
 let count=0;const old=defer();const {controller}=setup({catalog:async()=>++count===1?old.promise:{schema_version:1,models:[{id:'new'}]}});
 const first=controller.catalog();await Promise.resolve();controller.cancel();const second=controller.catalog();await second;
 old.resolve({schema_version:1,models:[{id:'old'}]});await first;assert.equal(count,2);assert.equal(controller.getState().catalog[0].id,'new');controller.destroy();
});
test('mismatched read/save identity is rejected and uncertain saves cannot replay',async()=>{
 const {controller}=setup({read:async()=>data('wrong'),save:async()=>data('wrong')});await controller.save();assert.equal(controller.getState().error,'save_unknown');assert.equal(controller.getState().data.profile_id,'p1');
 await controller.load('requested');assert.equal(controller.getState().error,'load');assert.equal(controller.getState().data,null);controller.destroy();
});
test('invalid embedding sample and dimension each have field feedback; unknown edit fields are rejected',async()=>{
 const {controller,calls}=setup();controller.setField('provider_type','openai_embeddings');
 controller.setEmbeddingTest('x'.repeat(16385),'9007199254740992');await controller.test();assert.equal(calls.length,0);assert.equal(controller.getState().errors.embedding_input,'tooLong');assert.equal(controller.getState().errors.embedding_dimensions,'integer');
 assert.throws(()=>controller.setField('api_key','synthetic'));assert.throws(()=>controller.setField('description','removed'));assert.throws(()=>controller.setField('default_policy',{}));controller.destroy();
});

test('six-star key marker reuses only an existing credential; empty clears and new text replaces',async()=>{
 const {controller,calls}=setup();await controller.catalog();assert.equal(calls[0].config.api_key,'******');
 controller.setCredentialMode('api_key','clear');await controller.catalog();assert.equal(calls[1].config.api_key,'');
 controller.bindCredentials(()=>({api_key:'synthetic-new-key'}));controller.setCredentialMode('api_key','replace');await controller.catalog();assert.equal(calls[2].config.api_key,'synthetic-new-key');controller.destroy();
 const fresh=setup({}, {initial:{...data(null),config:defaults[1]}});fresh.controller.bindCredentials(()=>({api_key:'******'}));fresh.controller.setCredentialMode('api_key','replace');await fresh.controller.catalog();assert.equal(fresh.calls.length,0);assert.equal(fresh.controller.getState().errors.api_key,'credentials');fresh.controller.destroy();
 const client=new ModelProfileClient({http:{request:async()=>assert.fail('must not request')}});assert.throws(()=>client.catalog({config:{api_key:'******'}},{signal:new AbortController().signal}));
});

test('unknown create cannot be retried by reloading defaults; reconciliation needs an authoritative identity',async()=>{
 let reads=0,writes=0;const {controller}=setup({read:async id=>{reads++;return data(id??null);},save:async()=>{writes++;throw new HttpError('network');}}, {initial:{...data(null),config:{...defaults[1],model_name:'New',real_name:'example-chat'}}});
 await controller.save();assert.equal(controller.getState().error,'save_unknown');await controller.load();await controller.load(null);await controller.save();assert.equal(reads,0);assert.equal(writes,1);
 await controller.load('confirmed-created-id');assert.equal(reads,1);assert.equal(controller.getState().data.profile_id,'confirmed-created-id');controller.destroy();
});

// Exercise the real shared HTTP owner with synthetic responses, not a product DTO shim.
import {isolatedHttp} from './helpers/runtime-services.mjs';
const failure = (code, extra = {}) => ({outcome: code === 50310 ? 'unknown' : 'committed', operation_id: 'operation-safe', profile_id: 'p1', test_failed: code === 50312, completion_failed: code === 50311, ...(code === 50312 ? {editor: {...data(), version: '2'}} : {}), ...extra});
const envelope = (payload, code) => ({success: false, message: 'synthetic-private-upstream-detail', payload, request_id: 'request-safe', code});
function httpSetup(code, payload, options = {}) {
 let writes = 0, reads = [];
 const http = isolatedHttp({baseURL: 'https://fixture.example', fetch: async (url, init) => {
  if (init.method === 'GET') {const id = new URL(url).searchParams.get('profile_id'); reads.push(id);return Response.json({success:true,code:1,message:'',request_id:'read',payload:{...data(id),version:'2'}});}
  writes++;return Response.json(envelope(payload, code), {status:503});
 }});
 const controller = createModelProfileController({service: new ModelProfileClient({http}), initial:data(), ...options});
 return {controller, http, writes:()=>writes, reads};
}

test('confirmed test failure installs the saved version, clears credentials and blocks an unchanged replay',async()=>{
 const {controller,http,writes}=httpSetup(50312,failure(50312));
 controller.setField('model_name','Draft');controller.setCredentialMode('api_key','replace');controller.bindCredentials(()=>({api_key:'synthetic-private-secret'}));
 const before=controller.getState().credentialRevision,receipt=await controller.save(),s=controller.getState();
 assert.equal(receipt.status,'committed');assert.equal(receipt.test_failed,true);assert.equal(receipt.completion_failed,false);
 assert.equal(s.saveReceipt,receipt);assert.equal(s.error,null);assert.equal(s.dirty,false);assert.equal(s.data.version,'2');assert.equal(s.draft.model_name,'Example');
 assert.equal(s.apiKeyMode,'keep');assert(s.credentialRevision>before);assert.equal(s.testResult,null);assert(!JSON.stringify(s).includes('synthetic-private'));
 await controller.save();assert.equal(writes(),1);controller.setField('model_name','Corrected');assert.equal(controller.getState().dirty,true);
 controller.destroy();http.destroy();
});

test('committed create completion failure keeps its real ID; no editor means read-only until explicit read',async()=>{
 const {controller,http,writes,reads}=httpSetup(50311,failure(50311,{profile_id:'created-identity',test_failed:true}),{initial:data(null)});
 controller.setCredentialMode('api_key','replace');controller.bindCredentials(()=>({api_key:'synthetic-private-secret'}));
 const receipt=await controller.save();assert.equal(receipt.status,'committed');assert.equal(receipt.profile_id,'created-identity');assert.equal(receipt.test_failed,true);assert.equal(receipt.completion_failed,true);assert.equal(receipt.editor,undefined);
 const s=controller.getState();assert.equal(s.error,null);assert.equal(s.dirty,false);assert.equal(s.apiKeyMode,'clear');assert.equal(s.headersMode,'clear');
 controller.setField('model_name','Must not edit');assert.equal(controller.getState().draft.model_name,'Example');controller.reset();await controller.save();assert.equal(writes(),1);assert.equal(reads.length,0);await controller.load(null);assert.equal(reads.length,0);
 await controller.load();assert.deepEqual(reads,['created-identity']);assert.equal(controller.getState().data.profile_id,'created-identity');assert.equal(controller.getState().data.version,'2');assert.equal(controller.getState().saveReceipt,null);
 controller.destroy();http.destroy();
});

test('committed create without safe identity cannot reset into another create; host must reconcile operation ID',async()=>{
 const payload=failure(50311);delete payload.profile_id;
 const {controller,http,writes,reads}=httpSetup(50311,payload,{initial:data(null)});
 const receipt=await controller.save();assert.equal(receipt.profile_id,undefined);assert.equal(receipt.operation_id,'operation-safe');assert.equal(controller.getState().dirty,false);
 controller.reset();await controller.load();await controller.load(null);await controller.save();assert.equal(writes(),1);assert.equal(reads.length,0);
 await controller.load('confirmed-new');assert.deepEqual(reads,['confirmed-new']);assert.equal(controller.getState().data.profile_id,'confirmed-new');controller.destroy();http.destroy();
});

test('explicit unknown retains draft and does not claim committed; receipt identity permits only deliberate reconciliation',async()=>{
 const {controller,http,writes,reads}=httpSetup(50310,failure(50310));controller.setField('model_name','Uncertain');
 const receipt=await controller.save();assert.equal(receipt.status,'unknown');assert.equal(controller.getState().error,'save_unknown');assert.equal(controller.getState().dirty,true);
 controller.reset();await controller.save();assert.equal(writes(),1);assert.equal(reads.length,0);await controller.load();assert.equal(controller.getState().error,null);controller.destroy();http.destroy();
});

test('contradictory receipts, mismatched identities and secret-bearing projections never become confirmed saves',async()=>{
 const cases=[
  [50312,failure(50312,{outcome:'unknown'})], [50312,failure(50312,{completion_failed:true})],
  [50312,failure(50312,{editor:undefined})], [50312,failure(50312,{editor:{...data(),api_key:'synthetic-private-secret'}})],
  [50312,failure(50312,{editor:{...data(),version:' '}})], [50312,failure(50312,{profile_id:'different'})], [50311,failure(50311,{editor:data()})],
  [50311,failure(50311,{completion_failed:false})], [50310,failure(50310,{test_failed:true})],
  [50310,failure(50310,{editor:data()})], [50312,failure(50312,{operation_id:''})], [50312,failure(50312,{extra:'private'})],
 ];
 for(const [code,payload] of cases){const {controller,http,writes}=httpSetup(code,payload);await controller.save();assert.equal(controller.getState().error,'save_unknown');assert.notEqual(controller.getState().saveReceipt?.status,'committed');await controller.save();assert.equal(writes(),1);controller.destroy();http.destroy();}
});

test('cancel, identity exit and a later save isolate a delayed committed receipt',async()=>{
 const late=defer();let call=0,aborted=false;
 const {controller}=setup({save:async(_candidate,{signal})=>{signal.addEventListener('abort',()=>{aborted=true;},{once:true});return ++call===1?late.promise:{...data('next'),version:'2'};}});
 const old=controller.save();await Promise.resolve();controller.cancel();assert.equal(aborted,true);assert.equal(controller.getState().error,'save_unknown');
 controller.clear();await controller.load('next');const current=await controller.save();assert.equal(current.profile_id,'next');
 late.resolve({status:'committed',operation_id:'old-op',profile_id:'p1',editor:{...data(),version:'2'},test_failed:true,completion_failed:false});
 assert.equal(await old,undefined);assert.equal(controller.getState().saveReceipt,current);assert.equal(controller.getState().data.profile_id,'next');controller.destroy();
});


test('identity clear inside a commit observer cannot resurrect receipt or return an obsolete completion',async()=>{
 const {controller}=setup();let cleared=false;
 controller.subscribe(()=>{if(!cleared&&controller.getState().saveReceipt?.status==='committed'){cleared=true;controller.clear();}});
 assert.equal(await controller.save(),undefined);assert.equal(controller.getState().data,null);assert.equal(controller.getState().saveReceipt,null);controller.destroy();
});
