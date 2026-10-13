import {HttpError,createAjaxResponseAdapter,ajaxErrorResponseAdapter,isHttpError,type HttpClient} from './http.js';
import {authRequest,authReceipt,type AuthOperation} from './http-auth-internal.js';
import {createIndexedDBOperationStore} from './operation-store.js';
import type {AuthRecoveryOptions} from './auth-recovery.js';
type Operation='login'|'refresh'|'logout';
export interface AuthRecoveryState {readonly operationId:string|null;readonly operation:Operation|null;readonly canResolve:boolean;readonly reason:'operation'|'bootstrap'|'legacy'|'storage'}
interface RecordValue {version:2;attempt:string;operation:Operation;phase:'preparing'|'bootstrap'|'pending';scope_id:string|null;epoch:string|null}
interface Session {schema_version:1;scope_id:string;epoch:string}
interface Receipt {schema_version:1;scope_id:string;epoch:string;operation_id:string;operation:Operation;status:'pending'|'applied'|'not_applied';next_epoch:string|null}
const failure=()=>new HttpError('http',{attempts:0,status:409,code:'AUTH_REAUTHENTICATION_REQUIRED'});
const decimal=(value:unknown):value is string=>typeof value==='string'&&/^[1-9][0-9]{0,18}$/.test(value)&&BigInt(value)<=9223372036854775807n;
const exact=(value:unknown,keys:string[])=>{if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value)))throw failure();const fields=Object.getOwnPropertyDescriptors(value);if(Object.keys(fields).sort().join()!==keys.sort().join()||Object.values(fields).some(field=>!('value'in field)))throw failure();return value as Record<string,unknown>;};
const session=(value:unknown):Session=>{const item=exact(value,['schema_version','scope_id','epoch']);if(item.schema_version!==1||!decimal(item.scope_id)||!decimal(item.epoch))throw failure();return item as unknown as Session;};
function receipt(value:unknown,record:RecordValue):Receipt{const item=exact(value,['schema_version','scope_id','epoch','operation_id','operation','status','next_epoch']);if(item.schema_version!==1||item.scope_id!==record.scope_id||item.epoch!==record.epoch||item.operation_id!==record.attempt||item.operation!==record.operation||!['pending','applied','not_applied'].includes(item.status as string)||item.status==='pending'&&item.next_epoch!==null||item.status!=='pending'&&(!decimal(item.next_epoch)||BigInt(item.next_epoch)!==BigInt(record.epoch!)+1n))throw failure();return item as unknown as Receipt;}
function headerReceipt(value:object,record:RecordValue){const headers=authReceipt(value);if(!headers)throw failure();return receipt({schema_version:1,scope_id:headers['X-Auth-Scope-ID'],epoch:headers['X-Auth-Epoch'],operation_id:headers['X-Auth-Operation-ID'],operation:headers['X-Auth-Operation'],status:headers['X-Auth-Status'],next_epoch:headers['X-Auth-Next-Epoch']},record);}
/** Explicit BaseService operation protocol. No fallback to status-only settlement. */
export function createAuthOperationRecovery(http:HttpClient,origin:string,options:AuthRecoveryOptions,timeoutMs:number){
 const scope=options.scope;if(typeof scope!=='string'||!scope.trim()||scope.length>256||/[\u0000-\u001f\u007f]/.test(scope))throw new TypeError('Declare an auth recovery session scope');
 const key=`xui.auth.recovery.v1:${JSON.stringify([origin,'/api/v1/auth/',scope])}`,store=options.store??createIndexedDBOperationStore(),suppliedStorage=options.storage;
 let state:AuthRecoveryState|null=null;
 const stopped=(signal?:AbortSignal)=>{if(signal?.aborted)throw new HttpError('cancel',{attempts:0});};
 const parse=(raw:string):RecordValue=>{const item=exact(JSON.parse(raw),['version','attempt','operation','phase','scope_id','epoch']);if(item.version!==2||typeof item.attempt!=='string'||!/^[a-f0-9]{32}$/.test(item.attempt)||!['login','refresh','logout'].includes(item.operation as string)||!['preparing','bootstrap','pending'].includes(item.phase as string)||item.phase==='pending'&&(!decimal(item.scope_id)||!decimal(item.epoch))||item.phase!=='pending'&&(item.scope_id!==null||item.epoch!==null))throw failure();return item as unknown as RecordValue;};
 const remember=(raw:string|null)=>{if(raw===null){state=null;return;}try{const record=parse(raw);state=Object.freeze({operationId:record.attempt,operation:record.operation,canResolve:record.phase==='pending',reason:record.phase==='pending'?'operation':'bootstrap'});}catch{state=Object.freeze({operationId:null,operation:null,canResolve:false,reason:'legacy'});}};
 const read=async()=>{try{const legacy=(suppliedStorage??(typeof window!=='undefined'?window.localStorage:undefined))?.getItem(key)??null;let raw=await store.read(key);if(legacy!==null){if(raw===null){const parsed=JSON.parse(legacy);exact(parsed,['version','attempt','operation']);if(parsed.version!==1||typeof parsed.attempt!=='string'||!/^([a-f0-9]{32}|[a-f0-9-]{36})$/.test(parsed.attempt)||!['login','refresh','logout'].includes(parsed.operation))throw failure();raw=(await store.compareExchange(key,null,legacy)).current;}remember(raw);state=Object.freeze({operationId:null,operation:null,canResolve:false,reason:'legacy'});return raw;}remember(raw);return raw;}catch{state=Object.freeze({operationId:null,operation:null,canResolve:false,reason:'storage'});throw failure();}};
 const replace=async(before:string|null,after:string|null)=>{try{const result=await store.compareExchange(key,before,after);remember(result.current);if(!result.exchanged||result.current!==after)throw failure();}catch{if(!state)state=Object.freeze({operationId:null,operation:null,canResolve:false,reason:'storage'});throw failure();}};
 const request=async(operation:AuthOperation,path:string,method:'GET'|'POST',signal?:AbortSignal,headers?:Record<string,string>)=>{stopped(signal);return authRequest(http,operation,path,{method,...(method==='POST'?{json:{}}:{}),headers:{Accept:'application/json',...headers},signal,timeoutMs,adapter:createAjaxResponseAdapter(),errorAdapter:ajaxErrorResponseAdapter,endpointId:`auth.${operation}`,cache:'no-store',credentials:'same-origin',redirect:'error',unauthorized:'ignore'});};
 const getSession=async(signal?:AbortSignal)=>session((await request('recovery-session-read','/api/v1/auth/recovery-session','GET',signal)).payload);
 const headers=(record:RecordValue)=>({'X-Auth-Operation-ID':record.attempt,'X-Auth-Scope-ID':record.scope_id!,'X-Auth-Epoch':record.epoch!,'X-Auth-Operation':record.operation});
 return {
  blocked:()=>state!==null,getState:()=>state,inspect:read,
  async begin(operation:Operation,signal?:AbortSignal){
   if(await read()!==null||state)throw failure();stopped(signal);const bytes=new Uint8Array(16);try{globalThis.crypto.getRandomValues(bytes);}catch{throw failure();}
   let record:RecordValue={version:2,attempt:Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join(''),operation,phase:'preparing',scope_id:null,epoch:null},raw=JSON.stringify(record);await replace(null,raw);
   let bootstrapSent=false;
   try{
    let identity:Session;
    try{identity=await getSession(signal);}catch(error){if(!isHttpError(error)||error.kind!=='http'||error.status!==401)throw error;stopped(signal);const before=raw;record={...record,phase:'bootstrap'};raw=JSON.stringify(record);await replace(before,raw);stopped(signal);bootstrapSent=true;const created=session((await request('recovery-session-create','/api/v1/auth/recovery-session','POST',signal)).payload);identity=await getSession(signal);if(identity.scope_id!==created.scope_id||identity.epoch!==created.epoch)throw failure();}
    stopped(signal);const before=raw;record={...record,phase:'pending',scope_id:identity.scope_id,epoch:identity.epoch};raw=JSON.stringify(record);await replace(before,raw);stopped(signal);
   }catch(error){if(record.phase!=='bootstrap'||!bootstrapSent)await replace(raw,null);throw error;}
   return {headers:headers(record),async complete(result?:object){if(!result||headerReceipt(result,record).status!=='applied')throw failure();await replace(raw,null);},async denied(){await replace(raw,null);},async rejection(error:object){const terminal=headerReceipt(error,record);if(terminal.status!=='not_applied')throw failure();await replace(raw,null);}};
  },
  async recover(resolve:boolean,operationId:string|undefined,signal?:AbortSignal){
   const raw=await read();if(raw===null||state?.reason==='legacy'||state?.reason==='storage')throw failure();const record=parse(raw);if(record.phase!=='pending'||resolve&&record.attempt!==operationId)throw failure();
   const before=await getSession(signal);if(before.scope_id!==record.scope_id||BigInt(before.epoch)<BigInt(record.epoch!))throw failure();stopped(signal);
   const result=await request(resolve?'recovery-resolve':'recovery-lookup',`/api/v1/auth/operations/${record.attempt}${resolve?'/resolve':''}`,resolve?'POST':'GET',signal,headers(record)),terminal=receipt(result.payload,record);
   if(terminal.status==='pending')return false;
   const current=await getSession(signal);if(current.scope_id!==record.scope_id||BigInt(current.epoch)<BigInt(terminal.next_epoch!))throw failure();stopped(signal);await replace(raw,null);return true;
  },
 };
}
