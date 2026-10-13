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
