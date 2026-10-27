import {currentAccessRequest} from './http-auth-internal.js';
import {createAjaxResponseAdapter,ajaxErrorResponseAdapter,parseAjaxResponse,HttpError,type HttpClient} from './http.js';
import {parseApiKeyMetadata,type ApiKeyAdapter,type ApiKeyManagerOptions,type ApiKeyMetadata,type ApiKeyDraft,type ApiKeyUpdateDraft,type ApiKeyWriteContext} from './api-key.js';
import {apiBoolean,apiObject,apiSegment,apiString} from './native-api.js';
import {parseEntityId,type EntityIdEncoding} from './entity-id.js';
/** Closed wire DTOs keep obsolete receipts and secret-bearing extensions out of public results. */
const apiFields=(value:unknown,required:readonly string[],optional:readonly string[]=[])=>{const row=apiObject(value),keys=Reflect.ownKeys(row);if(required.some(key=>!Object.hasOwn(row,key))||keys.some(key=>typeof key!=='string'||!required.includes(key)&&!optional.includes(key)))throw new TypeError('Invalid API key fields');return row;};
export type ApiKeySchemaVersion=2|3;
const apiVersion=(value:unknown,fields:readonly string[],schemaVersion:ApiKeySchemaVersion=2)=>{const row=apiFields(value,['schema_version',...fields]);if(row.schema_version!==schemaVersion)throw new TypeError('Unexpected API key facade version');return row;};
export const apiKeyEndpoints=Object.freeze({capabilities:'/api/v1/api-keys/capabilities',list:'/api/v1/api-keys',create:'/api/v1/api-keys'});
export interface ApiKeyWireMetadata {id:string;name:string;prefix:string|null;permission_ids:readonly string[];created_at:string|null;expires_at:string|null;last_used_at:string|null;last_used_at_pending?:boolean;status:ApiKeyMetadata['status'];version:string;enabled:boolean;capabilities:{revoke:boolean;delete_record:boolean;update:boolean}}
export interface ApiKeySecretAccessWire {authorized:boolean;recoverable:boolean;can_copy:boolean}
export interface ApiKeyWireMetadataV3 extends ApiKeyWireMetadata {secret_access:ApiKeySecretAccessWire}
export interface ApiKeySecretReader {
  canCopy:(record:Readonly<ApiKeyMetadata>)=>boolean;
  readValue:(record:Readonly<ApiKeyMetadata>,context:{signal:AbortSignal})=>Promise<string>;
}
export interface ApiKeyCapabilitiesWire {schema_version:ApiKeySchemaVersion;can_create:boolean;permissions:readonly {id:string;label:string;description:string|null;disabled:boolean;required:boolean}[];expiry_options:readonly {id:string;label:string}[];default_expiry_id:string;default_permission_ids:readonly string[];confirmation_label:string|null}
export type ApiKeyConfiguration=Pick<ApiKeyManagerOptions,'permissions'|'expiryOptions'|'defaultExpiryId'|'defaultPermissionIds'|'canCreate'|'confirmationLabel'>;
export interface ApiKeyHttpOptions {http:HttpClient;timeoutMs?:number;pageSize?:number;maxRecords?:number;idEncoding?:EntityIdEncoding;schemaVersion?:ApiKeySchemaVersion}
export interface ApiKeyHttpAdapter extends ApiKeyAdapter {readonly keyCopy?:Readonly<ApiKeySecretReader>;getConfiguration:(context?:{signal?:AbortSignal})=>Promise<Readonly<ApiKeyConfiguration>>}
export function parseApiKeyWireMetadata(value:unknown,idEncoding:EntityIdEncoding='decimal',schemaVersion:ApiKeySchemaVersion=2):Readonly<ApiKeyMetadata>{
  if(schemaVersion!==2&&schemaVersion!==3)throw new TypeError('Unsupported API key schema');
  const row=apiFields(value,['id','name','prefix','permission_ids','created_at','expires_at','last_used_at','status','capabilities','version','enabled',...(schemaVersion===3?['secret_access']:[])],['last_used_at_pending']),capabilities=apiFields(row.capabilities,['update','revoke','delete_record']);
  const access=schemaVersion===3?apiFields(row.secret_access,['authorized','recoverable','can_copy']):undefined;
  return parseApiKeyMetadata({...(access?{secretAccess:{authorized:apiBoolean(access.authorized),recoverable:apiBoolean(access.recoverable),canCopy:apiBoolean(access.can_copy)}}:{}),version:parseEntityId(row.version),enabled:apiBoolean(row.enabled),id:parseEntityId(row.id,idEncoding),name:apiString(row.name,1024),prefix:row.prefix,permissionIds:row.permission_ids,createdAt:row.created_at,expiresAt:row.expires_at,lastUsedAt:row.last_used_at,...(row.last_used_at_pending===undefined?{}:{lastUsedAtPending:apiBoolean(row.last_used_at_pending)}),status:row.status,capabilities:{update:apiBoolean(capabilities.update),revoke:apiBoolean(capabilities.revoke),deleteRecord:apiBoolean(capabilities.delete_record)}});
}
export function parseApiKeyConfiguration(value:unknown,schemaVersion:ApiKeySchemaVersion=2):Readonly<ApiKeyConfiguration>{
  if(schemaVersion!==2&&schemaVersion!==3)throw new TypeError('Unsupported API key schema');
  const wire=apiVersion(value,['can_create','permissions','expiry_options','default_expiry_id','default_permission_ids','confirmation_label'],schemaVersion);if(!Array.isArray(wire.permissions)||!Array.isArray(wire.expiry_options)||!Array.isArray(wire.default_permission_ids)||wire.permissions.length>200||wire.expiry_options.length<1||wire.expiry_options.length>100)throw new TypeError('Invalid API key configuration');
  const permissions=Object.freeze(wire.permissions.map(value=>{const item=apiFields(value,['id','label','description','disabled','required']);if(item.description!==null&&typeof item.description!=='string')throw new TypeError('Invalid permission description');return Object.freeze({id:apiString(item.id,256),label:apiString(item.label,1024),description:item.description===null?undefined:item.description as string,disabled:apiBoolean(item.disabled),required:apiBoolean(item.required)});})),expiryOptions=Object.freeze(wire.expiry_options.map(value=>{const item=apiFields(value,['id','label']);return Object.freeze({id:apiString(item.id,256),label:apiString(item.label,1024)});}));
  const defaultPermissionIds=Object.freeze(wire.default_permission_ids.map(value=>apiString(value,256))),defaultExpiryId=apiString(wire.default_expiry_id,256);
  if(new Set(permissions.map(item=>item.id)).size!==permissions.length||new Set(expiryOptions.map(item=>item.id)).size!==expiryOptions.length||!expiryOptions.some(item=>item.id===defaultExpiryId)||new Set(defaultPermissionIds).size!==defaultPermissionIds.length||defaultPermissionIds.some(id=>!permissions.some(item=>item.id===id&&!item.disabled))||permissions.some(item=>item.required&&item.disabled)||wire.confirmation_label!==null&&(typeof wire.confirmation_label!=='string'||!wire.confirmation_label.trim()||wire.confirmation_label.length>2048))throw new TypeError('Invalid API key configuration');
  return Object.freeze({permissions,expiryOptions,defaultPermissionIds,defaultExpiryId,canCreate:apiBoolean(wire.can_create),confirmationLabel:wire.confirmation_label===null?undefined:wire.confirmation_label as string});
}
/** Default xui page facade over webfacade AjaxResponse, counted ListData and explicit page query. */
export function createApiKeyHttpAdapter({http,timeoutMs=30000,pageSize=100,maxRecords=5000,idEncoding='decimal',schemaVersion=2}:ApiKeyHttpOptions):ApiKeyHttpAdapter{
  parseEntityId('1',idEncoding);
  if(schemaVersion!==2&&schemaVersion!==3)throw new TypeError('Unsupported API key schema');
  const parseMetadata=(value:unknown)=>parseApiKeyWireMetadata(value,idEncoding,schemaVersion);
  const versioned=(value:unknown,fields:readonly string[])=>apiVersion(value,fields,schemaVersion);
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>2147483647||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>200||!Number.isSafeInteger(maxRecords)||maxRecords<pageSize||maxRecords>100000)throw new TypeError('Invalid API key HTTP budget');
  const ajax=createAjaxResponseAdapter();
  const request=async<T>(path:string,parse:(value:unknown)=>T,signal:AbortSignal|undefined,method='GET',json?:unknown)=>{const result=await http.request<T>(path,{method,headers:{Accept:'application/json',...(json===undefined?{}:{'Content-Type':'application/json'})},...(json===undefined?{}:{json}),signal,timeoutMs,response:'ajax',errorAdapter:ajaxErrorResponseAdapter,adapter:(value,context)=>{const response=ajax(value,context);return {...response,payload:parse(response.payload)};},endpointId:method==='GET'?'apiKeys.read':'apiKeys.write',cache:'no-store',redirect:'error'});return result.payload;};
  const acknowledge=(operation:'revoke'|'delete_record',id:string)=>(value:unknown)=>{const wire=versioned(value,['id','operation','completed']);if(parseEntityId(wire.id,idEncoding)!==id||wire.operation!==operation||wire.completed!==true)throw new TypeError('Unconfirmed API key operation');return undefined;};
  type WriteIntent={operation:'create';draft:Readonly<ApiKeyDraft>}|{operation:'update';key:Readonly<ApiKeyMetadata>;draft:Readonly<ApiKeyUpdateDraft>}|{operation:'revoke'|'delete';key:Readonly<ApiKeyMetadata>};
  const mutate=<T>(intent:WriteIntent,context:ApiKeyWriteContext,parse:(value:unknown)=>T):Promise<T>=>{
    if(context.signal.aborted)return Promise.reject(new DOMException('Cancelled','AbortError'));
    if(intent.operation==='create')return request(apiKeyEndpoints.create,parse,context.signal,'POST',{name:intent.draft.name,permission_ids:intent.draft.permissionIds,expiry_id:intent.draft.expiryId,confirmed:intent.draft.confirmed===true});
    const target=parseEntityId(intent.key.id,idEncoding),path=`${apiKeyEndpoints.list}/${apiSegment(target)}`;
    if(intent.operation==='update'){if(intent.key.status==='revoked'||typeof intent.draft.enabled!=='boolean')throw new TypeError('Invalid API key update');return request(path,parse,context.signal,'PUT',{expected_version:parseEntityId(intent.key.version),name:intent.draft.name,permission_ids:intent.draft.permissionIds,enabled:intent.draft.enabled});}
    if(intent.operation==='delete'&&intent.key.status!=='revoked')throw new TypeError('Only revoked records can be deleted');
    return request(path+(intent.operation==='revoke'?'/revoke':'/record'),parse,context.signal,intent.operation==='revoke'?'POST':'DELETE',intent.operation==='revoke'?{}:undefined);
  };
  const canCopy=(record:Readonly<ApiKeyMetadata>)=>{try{parseEntityId(record.id,idEncoding);parseEntityId(record.version);return schemaVersion===3&&record.secretAccess?.authorized===true&&record.secretAccess.recoverable===true&&record.secretAccess.canCopy===true;}catch{return false;}};
  const readValue=async(record:Readonly<ApiKeyMetadata>,{signal}:{signal:AbortSignal})=>{
    if(signal.aborted)throw new HttpError('cancel',{attempts:0,endpointId:'apiKeys.readSecret'});
    if(!canCopy(record))throw new TypeError('API key secret is unavailable');
    const id=parseEntityId(record.id,idEncoding),version=parseEntityId(record.version);
    const result=await currentAccessRequest<string>(http,`${apiKeyEndpoints.list}/${apiSegment(id)}/secret`,{
      method:'POST',json:{expected_version:version},headers:{Accept:'application/json','Content-Type':'application/json'},signal,timeoutMs,response:'json',cache:'no-store',redirect:'error',endpointId:'apiKeys.readSecret',
      errorAdapter:value=>{const wire=parseAjaxResponse(value);return {code:wire.code,message:'',requestId:wire.request_id};},
      adapter:(value,context)=>{const wire=parseAjaxResponse(value);if(!wire.success)throw new HttpError('business',{...context,code:wire.code,bodyRequestId:wire.request_id});
        const payload=versioned(wire.payload,['id','version','secret']);if(parseEntityId(payload.id,idEncoding)!==id||parseEntityId(payload.version)!==version)throw new TypeError('Mismatched API key secret target');
        const secret=apiString(payload.secret,16384);if(new TextEncoder().encode(secret).length>16384||!secret.trim()||/[\r\n\u0000]/.test(secret)||secret===record.prefix||secret==='******')throw new TypeError('Invalid API key secret');
        return {payload:secret,code:wire.code,bodyRequestId:wire.request_id};},
    });
    return result.payload;
  };
  return {
    ...(schemaVersion===3?{keyCopy:Object.freeze({canCopy,readValue})}:{}),
    getConfiguration:(context={})=>request(apiKeyEndpoints.capabilities,value=>parseApiKeyConfiguration(value,schemaVersion),context.signal),
    async list({signal}){const controller=new AbortController(),external=()=>controller.abort();if(signal.aborted)controller.abort();else signal.addEventListener('abort',external,{once:true});let timedOut=false;const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
      try{const rows:Readonly<ApiKeyMetadata>[]=[],ids=new Set<string>();let total:number|null=null;
        for(let index=0;index<=Math.ceil(maxRecords/pageSize);index++){const query=new URLSearchParams({page_index:String(index),page_size:String(pageSize),return_total:'true',sort:'id',sort_id:'asc'});
          const page=await request(`${apiKeyEndpoints.list}?${query}`,value=>{const wire=schemaVersion===3?versioned(value,['list','total']):apiObject(value);if(wire.list!==null&&!Array.isArray(wire.list)||!Number.isSafeInteger(wire.total)||Number(wire.total)<0||Number(wire.total)>maxRecords)throw new TypeError('Invalid native ListData');const list=(wire.list??[]) as unknown[];if(list.length>pageSize)throw new TypeError('Invalid native page size');return {list:list.map(parseMetadata),total:wire.total as number};},controller.signal);
          if(total!==null&&total!==page.total)throw new TypeError('API key collection changed; refresh');total=page.total;
          for(const row of page.list){if(ids.has(row.id))throw new TypeError('Duplicate API key record');ids.add(row.id);rows.push(row);}
          if(rows.length===total)return Object.freeze(rows);if(!page.list.length||rows.length>total||rows.length>maxRecords)throw new TypeError('Incomplete API key collection');
        }throw new TypeError('API key page budget exhausted');
      }catch(error){if(timedOut)throw new HttpError('timeout',{attempts:0,endpointId:'apiKeys.list'});throw error;}finally{clearTimeout(timer);signal.removeEventListener('abort',external);}}
    ,create:(draft,context)=>mutate({operation:'create',draft},context,value=>{const wire=versioned(value,['metadata','secret']);return Object.freeze({metadata:parseMetadata(wire.metadata),secret:apiString(wire.secret,16384)});}),
    update:(key,draft,context)=>mutate({operation:'update',key,draft},context,value=>{const wire=versioned(value,['id','operation','completed','metadata']);if(parseEntityId(wire.id,idEncoding)!==key.id||wire.operation!=='update'||wire.completed!==true)throw new TypeError('Unconfirmed update');const metadata=parseMetadata(wire.metadata);if(metadata.id!==key.id)throw new TypeError('Mismatched update metadata');return metadata;}),
    revoke:(key,context)=>mutate({operation:'revoke',key},context,acknowledge('revoke',key.id)),
    deleteRecord:(key,context)=>mutate({operation:'delete',key},context,acknowledge('delete_record',key.id)),
  };
}
