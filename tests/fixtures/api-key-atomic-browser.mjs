import {createApiKeyWriteGuard,createApiKeyManagerController} from '../../packages/runtime/dist/api-key.js';
import {createApiKeyHttpAdapter} from '../../packages/runtime/dist/api-key-http.js';
import {createHttpClient} from '../../packages/runtime/dist/http.js';
import {createIndexedDBOperationStore} from '../../packages/runtime/dist/operation-store.js';
export {createIndexedDBOperationStore};
export async function install(scope,{barrier=false,success=false}={}){
 let receipt='pending';const store=createIndexedDBOperationStore(),storage={load:scope=>{const value=localStorage.getItem('fixture:'+scope);return value?JSON.parse(value):null;},save:(scope,value)=>value===null?localStorage.removeItem('fixture:'+scope):localStorage.setItem('fixture:'+scope,JSON.stringify(value))};
 const guard=createApiKeyWriteGuard({scopeId:scope,isCurrentScope:()=>true,storage});await guard.ready();
 const json=payload=>new Response(JSON.stringify({success:true,code:1,message:'',request_id:'synthetic',payload}),{headers:{'Content-Type':'application/json'}});
 const http=createHttpClient({baseURL:location.origin,fetch:async(url,init)=>{
  const path=new URL(url).pathname;
  if(path.includes('/operations/'))return json({schema_version:2,operation_id:path.split('/').at(-1),...Object.fromEntries(new URL(url).searchParams),resolution:receipt});
  if(init.method==='GET')return json({list:[],total:0});
  await window.keyDispatch({operation_id:init.headers.get('X-API-Key-Operation-ID'),fingerprint:init.headers.get('X-API-Key-Request-Fingerprint'),method:init.method});
  if(success)return json({schema_version:2,operation_id:init.headers.get('X-API-Key-Operation-ID'),fingerprint:init.headers.get('X-API-Key-Request-Fingerprint'),secret:'FAKE_TRANSIENT_VALUE',metadata:{id:'1',name:'Synthetic',prefix:null,permission_ids:[],created_at:null,expires_at:null,last_used_at:null,status:'active',version:'1',enabled:true,capabilities:{update:true,revoke:true,delete_record:true}}});
  throw Error('Synthetic lost acknowledgement');
 }}),base=createApiKeyHttpAdapter({http,writeGuard:guard}),adapter={...base,prepareWrite:async(...args)=>{const descriptor=await base.prepareWrite(...args);if(barrier)await window.keyPrepared(descriptor);return descriptor;}},manager=createApiKeyManagerController({adapter,canCreate:true,permissions:[],expiryOptions:[{id:'never',label:'Never'}],defaultExpiryId:'never'});
 return {manager,guard,start:()=>{manager.openCreate();manager.setDraft({name:'Private draft never persisted'});return manager.submitCreate();},read:()=>store.read('xui.api-key.v1:'+scope),setReceipt:value=>{receipt=value;}};
}

import {apiKeyOperationId} from '../../packages/runtime/dist/api-key-fingerprint.js';
export async function installCustom(scope,{barrier=false,success=false}={}){
 let receipt='pending';const store=createIndexedDBOperationStore(),storage={load:scope=>{const value=localStorage.getItem('fixture:'+scope);return value?JSON.parse(value):null;},save:(scope,value)=>value===null?localStorage.removeItem('fixture:'+scope):localStorage.setItem('fixture:'+scope,JSON.stringify(value))};
 const guard=createApiKeyWriteGuard({scopeId:scope,isCurrentScope:()=>true,storage});await guard.ready();
 const adapter={writeGuard:guard,list:async()=>[],prepareWrite:async()=>{const descriptor={schema_version:2,operation_id:apiKeyOperationId(),operation:'create',intent_target_id:'',action:success?'key-create':'key-rotate',target_id:success?'/api/v1/accounts/a1/keys':'a1',expected_version:success?'':'0',fingerprint:'a'.repeat(64)};if(barrier)await window.keyPrepared(descriptor);return descriptor;},create:async(_draft,{write})=>{await window.keyDispatch(write.descriptor);if(!success)throw Error('Synthetic lost acknowledgement');return {metadata:{id:'1',name:'Synthetic',prefix:null,permissionIds:[],createdAt:null,expiresAt:null,lastUsedAt:null,status:'active'},secret:'FAKE_TRANSIENT_VALUE'};},revoke:async()=>{},reconcileWrite:async write=>({descriptor:write.descriptor,resolution:receipt})};
 const manager=createApiKeyManagerController({adapter,canCreate:true,permissions:[],expiryOptions:[{id:'never',label:'Never'}],defaultExpiryId:'never'});
 return {guard,manager,start:()=>{manager.openCreate();manager.setDraft({name:'Private draft never persisted'});return manager.submitCreate();},read:()=>store.read('xui.api-key.v1:'+scope),setReceipt:value=>{receipt=value;}};
}
