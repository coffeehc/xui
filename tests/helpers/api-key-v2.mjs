// Test-only migration of archived v1 synthetic fixtures. This is NOT a product adapter
// and is not evidence that a v1 service satisfies the v2 recovery contract.
import {createApiKeyHttpAdapter as createV2,parseApiKeyWireMetadata as parseMetadata,parseApiKeyConfiguration as parseConfiguration} from '../../packages/runtime/dist/api-key-http.js';
import {createApiKeyWriteGuard} from '../../packages/runtime/dist/api-key.js';
export function persistentTestGuard(){let saved=null;return createApiKeyWriteGuard({isCurrentScope:()=>true,scopeId:'fixture:actor:namespace',storage:{load:()=>saved,save:(_scope,value)=>{saved=value;}}});}
export const upgradeMetadata=value=>value&&typeof value==='object'?{version:'1',enabled:true,...value,capabilities:{update:false,...value.capabilities}}:value;
export const upgradePayload=(payload,headers)=>{
 if(!payload||typeof payload!=='object')return payload;
 const result={...payload,...(payload.schema_version===1?{schema_version:2}:{})};
 if(Array.isArray(result.list))result.list=result.list.map(upgradeMetadata);
 if(result.metadata)result.metadata=upgradeMetadata(result.metadata);
 if(result.metadata||result.completed){result.operation_id??=headers.get('X-API-Key-Operation-ID');result.fingerprint??=headers.get('X-API-Key-Request-Fingerprint');}
 return result;
};
export function createApiKeyHttpAdapter({http,...options}){return createV2({...options,writeGuard:persistentTestGuard(),http:{...http,request:(path,init)=>http.request(path,{...init,adapter:(value,context)=>init.adapter({...value,payload:upgradePayload(value.payload,new Headers(init.headers))},context)})}});}
export const parseApiKeyWireMetadata=(value,encoding)=>parseMetadata(upgradeMetadata(value),encoding);
export const parseApiKeyConfiguration=value=>parseConfiguration({...value,schema_version:value.schema_version===1?2:value.schema_version});
