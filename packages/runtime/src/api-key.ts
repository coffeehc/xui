import {isHttpError} from './http.js';
import {apiKeyWriteOwner,type ApiKeyWriteGuard,type ApiKeyPendingWrite,type ApiKeyWriteLease,type ApiKeyWriteResolution,type ApiKeyOperationDescriptor} from './api-key-write.js';
export {createApiKeyWriteGuard} from './api-key-write.js';
export type {ApiKeyWriteGuard,ApiKeyPendingWrite,ApiKeyWriteResolution,ApiKeyOperationDescriptor,ApiKeyWriteStorage,ApiKeyWriteSnapshot,ApiKeyWriteGuardOptions} from './api-key-write.js';
/** Native page-facade application code, shared with baseservice. Never a definite refusal. */
const API_KEY_WRITE_OUTCOME_UNKNOWN=50301;
/** The commit is known, but follow-up work/response is incomplete. Never replay the mutation. */
const API_KEY_WRITE_COMMITTED_FOLLOWUP_FAILED=50302;
/** Public metadata only. The host supplies a display-safe prefix, never the full key. */
export interface ApiKeyMetadata {
  id:string; name:string; prefix:string|null; permissionIds:readonly string[];
  createdAt:string|null; expiresAt:string|null; lastUsedAt:string|null;
  /** Only an explicit backend fact; absence does not imply persisted access metadata. */
  lastUsedAtPending?:boolean;
  version?:string; enabled?:boolean;
  status:'active'|'disabled'|'revoked'|'expired'|'unknown'|null;
  capabilities?:Readonly<{revoke:boolean;deleteRecord:boolean;update?:boolean}>;
}
export interface ApiKeyPermission {id:string;label:string;description?:string;disabled?:boolean;required?:boolean}
export interface ApiKeyExpiry {id:string;label:string}
export interface ApiKeyDraft {name:string;permissionIds:readonly string[];expiryId:string;confirmed?:boolean}
export interface ApiKeyUpdateDraft {name:string;permissionIds:readonly string[];enabled:boolean}
export interface CreatedApiKey {metadata:ApiKeyMetadata;secret:string}
export interface ApiKeyFieldErrors {name?:string;permissions?:string;expiry?:string;confirmation?:string}
export interface ApiKeyWriteContext {signal:AbortSignal;write?:Readonly<ApiKeyPendingWrite>}
export type ApiKeyWriteIntent={operation:'create';draft:Readonly<ApiKeyDraft>}|{operation:'update';key:Readonly<ApiKeyMetadata>;draft:Readonly<ApiKeyUpdateDraft>}|{operation:'revoke'|'delete';key:Readonly<ApiKeyMetadata>};
export interface ApiKeyAdapter {
  /** The v2 boundary owns one durable actor-scoped gate. Managers must use this exact owner. */
  writeGuard?:ApiKeyWriteGuard;
  prepareWrite?:(intent:ApiKeyWriteIntent,context:{signal:AbortSignal})=>Promise<Readonly<ApiKeyOperationDescriptor>>;
  /** Explicit mutation: may seal a never-applied request so a delayed request cannot execute. */
  resolveWrite?:(write:Readonly<ApiKeyPendingWrite>,context:{signal:AbortSignal})=>Promise<ApiKeyWriteResolution>;
  list:(context:{signal:AbortSignal})=>Promise<readonly ApiKeyMetadata[]>;
  create:(draft:Readonly<ApiKeyDraft>,context:ApiKeyWriteContext)=>Promise<CreatedApiKey>;
  revoke:(key:Readonly<ApiKeyMetadata>,context:ApiKeyWriteContext)=>Promise<void>;
  update?:(key:Readonly<ApiKeyMetadata>,draft:Readonly<ApiKeyUpdateDraft>,context:ApiKeyWriteContext)=>Promise<Readonly<ApiKeyMetadata>>;
  /** Deletes an already revoked management record; it does not revoke a credential or delete business data. */
  deleteRecord?:(key:Readonly<ApiKeyMetadata>,context:ApiKeyWriteContext)=>Promise<void>;
  /** Read-only authoritative reconciliation. A refreshed list alone never proves a write outcome. */
  reconcileWrite?:(write:Readonly<ApiKeyPendingWrite>,context:{rows:readonly Readonly<ApiKeyMetadata>[];signal:AbortSignal})=>Promise<ApiKeyWriteResolution>;
}
export interface ApiKeyManagerOptions {
  adapter:ApiKeyAdapter;writeGuard?:ApiKeyWriteGuard;permissions:readonly ApiKeyPermission[];expiryOptions:readonly ApiKeyExpiry[];
  defaultExpiryId:string;defaultPermissionIds?:readonly string[];canCreate?:boolean;
  canUpdate?:(key:Readonly<ApiKeyMetadata>)=>boolean;
  validateUpdate?:(draft:Readonly<ApiKeyUpdateDraft>,key:Readonly<ApiKeyMetadata>)=>ApiKeyFieldErrors|void;
  canRevoke?:(key:Readonly<ApiKeyMetadata>)=>boolean;
  canDeleteRecord?:(key:Readonly<ApiKeyMetadata>)=>boolean;confirmationLabel?:string;
  validateCreate?:(draft:Readonly<ApiKeyDraft>)=>ApiKeyFieldErrors|void;
  labels?:Partial<ApiKeyLabels>;
}
export const apiKeyDefaultLabels={
  persistenceError:'Could not read the protected write state. No request was sent. Restore storage access before trying again.',resolveWrite:'Terminate unexecuted request and check result',resolveWarning:'This permanently prevents this request from executing if it has not started. An already applied write is not undone.',confirmResolve:'Confirm termination and check',
  updateWarning:'Changing permissions or disabling this key may stop existing clients. Revoked keys cannot be restored.',edit:'Edit',updateTitle:'Edit API key',enabled:'Enabled',save:'Save changes',saving:'Saving changes…',updateError:'The update result is unconfirmed. Verify the write result before saving again.',updateRejected:'The key update was rejected.',updatePending:'Closing cancels local waiting. The server may still update this key.',disabled:'Disabled',
  lastUsedAtPending:'Pending persistence',writePending:'A key management write is in progress.',writeUncertain:'The write result is unconfirmed. Key management writes are blocked until its result is checked.',checkWrite:'Check write result',checkingWrite:'Checking write result…',recoveryError:'Could not verify the write result. Writes remain blocked.',recoveryPending:'The write result is still pending. Writes remain blocked.',recoveryUnavailable:'The list was refreshed, but the service has not provided write-result verification. Writes remain blocked.',
  title:'API keys',create:'Create key',refresh:'Refresh keys',empty:'No keys',loading:'Loading keys…',listError:'Could not load keys.',retry:'Retry loading',
  name:'Name',prefix:'Key prefix',permissions:'Permissions',expiry:'Expiry',createdAt:'Created',lastUsedAt:'Last used',status:'Status',unknown:'Unknown',
  active:'Active',revoked:'Revoked',expired:'Expired',revoke:'Revoke',createTitle:'Create API key',nameRequired:'Enter a name.',permissionsInvalid:'Choose available permissions.',expiryInvalid:'Choose an available expiry.',
  submit:'Create key',cancel:'Cancel',close:'Close',creating:'Creating key…',createError:'The creation result is unconfirmed. Verify the write result before submitting again.',
  creationPending:'Closing cancels local waiting. The server may still create the key; its one-time value may be lost.',
  resultTitle:'Key created',oneTime:'This value is shown once. Save it securely before closing.',secret:'One-time key value',copy:'Copy key',copying:'Copying…',copied:'Copied',copyError:'Copy failed. Select and copy the value manually.',
  revokeTitle:'Revoke API key',revokeWarning:'Revoking this key prevents its future use. Existing clients may stop working.',confirmRevoke:'Confirm revocation',revoking:'Revoking key…',revokeError:'The revocation result is unconfirmed. Verify the write result before confirming again.',revokePending:'Closing cancels local waiting. The server may still revoke this key.',
  createRejected:'The key creation was rejected.',revokeRejected:'The key revocation was rejected.',deleteRejected:'The record deletion was rejected.',actions:'Actions',confirmation:'Authorization confirmation',confirmationRequired:'Confirm the declared permissions before creating the key.',deleteRecord:'Delete record',deleteTitle:'Delete revoked key record',deleteWarning:'This permanently removes the revoked key management record. Existing business records are retained.',confirmDelete:'Confirm record deletion',deleting:'Deleting record…',deleteError:'The deletion result is unconfirmed. Verify the write result before confirming again.',deletePending:'Closing cancels local waiting. The server may still delete this management record.',
} as const;
export type ApiKeyLabels={ [Key in keyof typeof apiKeyDefaultLabels]:string };
export interface ApiKeyManagerState {
  rows:readonly Readonly<ApiKeyMetadata>[];listBusy:boolean;hasLoaded:boolean;listError:string|null;
  phase:'closed'|'create'|'result'|'revoke'|'delete'|'update'|'resolve';updateDraft:Readonly<ApiKeyUpdateDraft>;updateTarget:Readonly<ApiKeyMetadata>|null;draft:Readonly<ApiKeyDraft>;fieldErrors:Readonly<ApiKeyFieldErrors>;
  actionBusy:boolean;actionError:string|null;actionUncertain:boolean;resultMetadata:Readonly<ApiKeyMetadata>|null;revokeTarget:Readonly<ApiKeyMetadata>|null;
  writeBlock:Readonly<ApiKeyPendingWrite>|null;recoveryBusy:boolean;recoveryError:string|null;
  copyStatus:'idle'|'copying'|'copied'|'error';
}
export interface ApiKeyManagerController {
  readonly options:Readonly<ApiKeyManagerOptions>;readonly labels:Readonly<ApiKeyLabels>;
  getState:()=>Readonly<ApiKeyManagerState>;subscribe:(listener:()=>void)=>()=>void;
  openResolveWrite:()=>void;confirmResolveWrite:()=>Promise<void>;
  recoverUncertainWrite:()=>Promise<void>;refresh:()=>Promise<void>;cancelList:()=>void;openCreate:()=>void;setDraft:(draft:Partial<ApiKeyDraft>)=>void;
  openUpdate:(id:string)=>void;setUpdateDraft:(draft:Partial<ApiKeyUpdateDraft>)=>void;submitUpdate:()=>Promise<void>;canUpdate:(key:Readonly<ApiKeyMetadata>)=>boolean;
  submitCreate:()=>Promise<void>;openRevoke:(id:string)=>void;confirmRevoke:()=>Promise<void>;canRevoke:(key:Readonly<ApiKeyMetadata>)=>boolean;
  openDeleteRecord:(id:string)=>void;confirmDeleteRecord:()=>Promise<void>;canDeleteRecord:(key:Readonly<ApiKeyMetadata>)=>boolean;
  /** Only a transient view should read this; it is never included in a state snapshot. */
  readSecret:()=>string|null;copySecret:(writeText:(value:string)=>Promise<void>)=>Promise<void>;close:()=>void;destroy:()=>void;
}
export function parseApiKeyMetadata(value:unknown):Readonly<ApiKeyMetadata>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('Invalid API key metadata');
  const row=value as Record<string,unknown>;
  if(typeof row.id!=='string'||!row.id||typeof row.name!=='string'||!Array.isArray(row.permissionIds)||row.permissionIds.some(id=>typeof id!=='string')||![null,'active','disabled','revoked','expired','unknown'].includes(row.status as null))throw new TypeError('Invalid API key metadata');
  for(const key of ['prefix','createdAt','expiresAt','lastUsedAt'])if(row[key]!==null&&typeof row[key]!=='string')throw new TypeError('Invalid nullable API key metadata');
  if(row.lastUsedAtPending!==undefined&&typeof row.lastUsedAtPending!=='boolean')throw new TypeError('Invalid access persistence fact');
  if(row.version!==undefined&&(typeof row.version!=='string'||!row.version))throw new TypeError('Invalid API key version');
  if(row.enabled!==undefined&&typeof row.enabled!=='boolean')throw new TypeError('Invalid API key enabled fact');
  let capabilities:ApiKeyMetadata['capabilities'];if(row.capabilities!==undefined){const data=row.capabilities as Record<string,unknown>;if(!data||typeof data!=='object'||Object.values(Object.getOwnPropertyDescriptors(data)).some(field=>!('value'in field))||typeof data.revoke!=='boolean'||typeof data.deleteRecord!=='boolean'||data.update!==undefined&&typeof data.update!=='boolean')throw new TypeError('Invalid API key capabilities');capabilities=Object.freeze({revoke:data.revoke,deleteRecord:data.deleteRecord,...(data.update===undefined?{}:{update:data.update as boolean})});}
  return Object.freeze({...(row.version===undefined?{}:{version:row.version as string}),...(row.enabled===undefined?{}:{enabled:row.enabled as boolean}),id:row.id,name:row.name,prefix:row.prefix as string|null,permissionIds:Object.freeze([...row.permissionIds] as string[]),createdAt:row.createdAt as string|null,expiresAt:row.expiresAt as string|null,lastUsedAt:row.lastUsedAt as string|null,status:row.status as ApiKeyMetadata['status'],...(row.lastUsedAtPending===undefined?{}:{lastUsedAtPending:row.lastUsedAtPending as boolean}),...(capabilities?{capabilities}:{})});
}
class ApiKeyBeforeSendError extends Error {constructor(readonly cause:unknown){super('API key request was not sent');}}
/** One owner for metadata, writes and a transient result. No HTTP, credentials store or key generation. */
export function createApiKeyManagerController(input:ApiKeyManagerOptions):ApiKeyManagerController {
  const ids=(items:readonly {id:string;label:string}[])=>{const seen=new Set<string>();for(const item of items){if(typeof item.id!=='string'||!item.id||seen.has(item.id)||typeof item.label!=='string')throw new TypeError('Invalid or duplicate API key option');seen.add(item.id);}return seen;};
  const permissions=Object.freeze(input.permissions.map(item=>{if(item.required&&item.disabled)throw new TypeError('A required permission cannot be unavailable');return Object.freeze({id:item.id,label:item.label,description:item.description,disabled:item.disabled,required:item.required});})),expiryOptions=Object.freeze(input.expiryOptions.map(item=>Object.freeze({id:item.id,label:item.label})));
  const permissionIds=ids(permissions),expiryIds=ids(expiryOptions);
  if(!expiryIds.has(input.defaultExpiryId))throw new TypeError('Declare a default expiry from the host options');
  if(new Set(input.defaultPermissionIds??[]).size!==(input.defaultPermissionIds??[]).length||(input.defaultPermissionIds??[]).some(id=>!permissionIds.has(id)||permissions.find(item=>item.id===id)?.disabled))throw new TypeError('Invalid default permission');
  if(!input.adapter||['list','create','revoke'].some(key=>typeof input.adapter[key as keyof ApiKeyAdapter]!=='function'))throw new TypeError('Declare list, create and revoke callbacks');
  const labels=Object.freeze(Object.fromEntries(Object.entries(apiKeyDefaultLabels).map(([key,value])=>{const override=input.labels?.[key as keyof ApiKeyLabels];if(override!==undefined&&typeof override!=='string')throw new TypeError('Labels must be strings');return [key,override??value];}))) as Readonly<ApiKeyLabels>;
  if(input.confirmationLabel!==undefined&&(typeof input.confirmationLabel!=='string'||!input.confirmationLabel.trim()))throw new TypeError('Declare a confirmation label');if(input.adapter.deleteRecord!==undefined&&typeof input.adapter.deleteRecord!=='function')throw new TypeError('Invalid delete record callback');if(input.adapter.reconcileWrite!==undefined&&typeof input.adapter.reconcileWrite!=='function')throw new TypeError('Invalid reconciliation callback');
  if(input.adapter.writeGuard&&input.writeGuard&&input.adapter.writeGuard!==input.writeGuard)throw new TypeError('The manager must use the adapter write guard');
  for(const key of ['update','prepareWrite','resolveWrite'] as const)if(input.adapter[key]!==undefined&&typeof input.adapter[key]!=='function')throw new TypeError('Invalid API key adapter callback');
  const {guard,owner:writeOwner}=apiKeyWriteOwner(input.adapter,input.adapter.writeGuard??input.writeGuard);
  const options=Object.freeze({adapter:Object.freeze({writeGuard:input.adapter.writeGuard,prepareWrite:input.adapter.prepareWrite,resolveWrite:input.adapter.resolveWrite,list:input.adapter.list,create:input.adapter.create,revoke:input.adapter.revoke,update:input.adapter.update,deleteRecord:input.adapter.deleteRecord,reconcileWrite:input.adapter.reconcileWrite}),writeGuard:guard,permissions,expiryOptions,defaultExpiryId:input.defaultExpiryId,defaultPermissionIds:Object.freeze([...new Set([...(input.defaultPermissionIds??[]),...permissions.filter(item=>item.required).map(item=>item.id)])]),canCreate:input.canCreate,canUpdate:input.canUpdate,validateUpdate:input.validateUpdate,canRevoke:input.canRevoke,canDeleteRecord:input.canDeleteRecord,confirmationLabel:input.confirmationLabel,validateCreate:input.validateCreate,labels});
  const freshDraft=()=>Object.freeze({name:'',permissionIds:options.defaultPermissionIds,expiryId:options.defaultExpiryId,...(options.confirmationLabel?{confirmed:false}:{})});
  let state:Readonly<ApiKeyManagerState>=Object.freeze({rows:Object.freeze([]),listBusy:false,hasLoaded:false,listError:null,phase:'closed',updateDraft:Object.freeze({name:'',permissionIds:Object.freeze([]),enabled:false}),updateTarget:null,draft:freshDraft(),fieldErrors:Object.freeze({}),actionBusy:false,actionError:null,actionUncertain:guard.getState()?.status==='uncertain',writeBlock:guard.getState(),recoveryBusy:false,recoveryError:null,resultMetadata:null,revokeTarget:null,copyStatus:'idle'});
  let dead=false,secret:string|null=null,listGeneration=0,actionGeneration=0,copyGeneration=0,recoveryGeneration=0,listAbort:AbortController|undefined,actionAbort:AbortController|undefined,recoveryAbort:AbortController|undefined,actionWrite:ApiKeyWriteLease|undefined,recoveryWriteId:number|undefined,phaseWriteId:number|undefined;
  const listeners=new Set<()=>void>();
  const emit=(patch:Partial<ApiKeyManagerState>)=>{state=Object.freeze({...state,...patch});for(const listener of Array.from(listeners))if(listeners.has(listener))try{listener();}catch{/* View failures cannot replay a write. */}};
  const ensureScope=()=>{if(writeOwner.active())return true;destroy();return false;};
  const cancelList=()=>{if(dead)return;const generation=++listGeneration,previous=listAbort;listAbort=undefined;previous?.abort();if(!dead&&generation===listGeneration)emit({listBusy:false,listError:null});};
  const offGuard=guard.subscribe(()=>{if(!dead){let writeBlock=guard.getState();const superseded=state.recoveryBusy&&(writeBlock?.id!==recoveryWriteId||writeBlock?.status!=='uncertain');if(superseded)cancelRecovery();if(dead)return;writeBlock=guard.getState();emit({writeBlock,actionUncertain:writeBlock?.status==='uncertain',...(superseded?{recoveryBusy:false,recoveryError:null}:{})});}});
  const offResolved=writeOwner.subscribeResolved((id,resolution)=>{if(dead||phaseWriteId!==id)return;if(resolution==='applied'&&['create','update','revoke','delete'].includes(state.phase))close();else if(resolution==='not-applied')emit({actionError:null});});
  const abandonAction=()=>{const lease=actionWrite;actionWrite=undefined;if(lease)writeOwner.abandon(lease);};
  const cancelRecovery=()=>{recoveryGeneration++;const previous=recoveryAbort;recoveryAbort=undefined;recoveryWriteId=undefined;previous?.abort();};
  const close=()=>{if(dead)return;const generation=++actionGeneration;copyGeneration++;secret=null;phaseWriteId=undefined;const previous=actionAbort;actionAbort=undefined;const lease=actionWrite;actionWrite=undefined;previous?.abort();cancelRecovery();if(lease)writeOwner.abandon(lease);if(dead||generation!==actionGeneration)return;emit({phase:'closed',updateDraft:Object.freeze({name:'',permissionIds:Object.freeze([]),enabled:false}),updateTarget:null,draft:freshDraft(),fieldErrors:Object.freeze({}),actionBusy:false,actionError:null,writeBlock:guard.getState(),actionUncertain:guard.getState()?.status==='uncertain',recoveryBusy:false,recoveryError:null,resultMetadata:null,revokeTarget:null,copyStatus:'idle'});};
  const wait=async<T>(operation:()=>Promise<T>,controller:AbortController)=>{
    if(controller.signal.aborted)throw new DOMException('Cancelled','AbortError');
    let abort=()=>{};const cancelled=new Promise<never>((_,reject)=>{abort=()=>reject(new DOMException('Cancelled','AbortError'));controller.signal.addEventListener('abort',abort,{once:true});});
    try{return await Promise.race([Promise.resolve().then(()=>{if(controller.signal.aborted)throw new DOMException('Cancelled','AbortError');return operation();}),cancelled]);}
    finally{controller.signal.removeEventListener('abort',abort);}
  };
  async function refresh(){
    if(!ensureScope()||dead)return;const generation=++listGeneration,previous=listAbort;listAbort=undefined;previous?.abort();if(dead||generation!==listGeneration)return;const controller=new AbortController();listAbort=controller;emit({listBusy:true,listError:null});
    if(dead||generation!==listGeneration)return;
    try{const rows=await wait(()=>options.adapter.list({signal:controller.signal}),controller);if(!ensureScope()||dead||generation!==listGeneration)return;
      if(!Array.isArray(rows))throw new TypeError('Expected API key metadata list');const parsed=rows.map(parseApiKeyMetadata),unique=new Set(parsed.map(row=>row.id));if(unique.size!==parsed.length)throw new TypeError('Duplicate API key id');
      listAbort=undefined;emit({rows:Object.freeze(parsed),hasLoaded:true,listBusy:false});
    }catch{if(!dead&&generation===listGeneration){listAbort=undefined;emit({listBusy:false,listError:labels.listError});}}
  }
  const parseRows=(rows:unknown)=>{if(!Array.isArray(rows))throw new TypeError('Expected API key metadata list');const parsed=rows.map(parseApiKeyMetadata);if(new Set(parsed.map(row=>row.id)).size!==parsed.length)throw new TypeError('Duplicate API key id');return Object.freeze(parsed);};
  async function recoverWrite(resolve=false){
    const write=guard.getState();if(!ensureScope()||dead||state.recoveryBusy||write?.status!=='uncertain'||resolve&&(state.phase!=='resolve'||!options.adapter.resolveWrite))return;
    const generation=++recoveryGeneration,controller=new AbortController();recoveryAbort=controller;recoveryWriteId=write.id;
    const listSession=++listGeneration,previous=listAbort;listAbort=undefined;previous?.abort();
    const current=()=>ensureScope()&&!dead&&generation===recoveryGeneration&&guard.getState()?.id===write.id&&guard.getState()?.status==='uncertain';
    if(!current())return;if(listSession!==listGeneration){cancelRecovery();if(!dead)emit({recoveryBusy:false,recoveryError:labels.recoveryError});return;}
    emit({recoveryBusy:true,recoveryError:null,listBusy:false,listError:null});if(!current())return;
    try{
      if(listSession!==listGeneration)throw new TypeError('A newer metadata query superseded reconciliation');
      const rows=parseRows(await wait(()=>options.adapter.list({signal:controller.signal}),controller));if(!current())return;
      if(listSession!==listGeneration)throw new TypeError('A newer metadata query superseded reconciliation');
      emit({rows,hasLoaded:true});if(!current())return;
      if(!resolve&&!options.adapter.reconcileWrite){recoveryAbort=undefined;emit({recoveryBusy:false,recoveryError:labels.recoveryUnavailable});return;}
      const resolution=await wait(()=>resolve?options.adapter.resolveWrite!(write,{signal:controller.signal}):options.adapter.reconcileWrite!(write,{rows,signal:controller.signal}),controller);if(!current())return;
      if(listSession!==listGeneration)throw new TypeError('A newer metadata query superseded reconciliation');
      if(!['applied','not-applied','pending'].includes(resolution))throw new TypeError('Invalid write reconciliation');
      recoveryAbort=undefined;emit({recoveryBusy:false,recoveryError:resolution==='pending'?labels.recoveryPending:null,...(resolution==='pending'?{}:{actionError:null})});
      if(current()&&resolution!=='pending'){
        if(listSession!==listGeneration){emit({recoveryError:labels.recoveryError});return;}
        // The read has completed before releasing the gate. No write or one-time value is recovered.
        if(!writeOwner.resolve(write.id,resolution,()=>!dead&&listSession===listGeneration)&&!dead&&guard.getState()?.id===write.id)emit({recoveryError:labels.recoveryError});else if(resolve&&!dead&&state.phase==='resolve'&&!guard.getState())close();
      }
    }catch{if(current()){recoveryAbort=undefined;emit({recoveryBusy:false,recoveryError:labels.recoveryError});}}
  }
  const claimWrite=(operation:ApiKeyPendingWrite['operation'],targetId:string|null)=>{try{return writeOwner.claim(operation,targetId);}catch{actionAbort=undefined;if(!dead)emit({actionBusy:false,actionError:labels.persistenceError});return null;}};
  async function dispatch<T>(lease:ApiKeyWriteLease,intent:ApiKeyWriteIntent,controller:AbortController,generation:number,send:(context:ApiKeyWriteContext)=>Promise<T>):Promise<T>{
    try{
      if(!ensureScope())throw new TypeError('API key scope is not current');
      if(options.adapter.prepareWrite){
        const descriptor=await options.adapter.prepareWrite(intent,{signal:controller.signal});
        if(!ensureScope()||dead||generation!==actionGeneration||controller.signal.aborted||guard.getState()?.id!==lease.id)throw new DOMException('Cancelled','AbortError');
        writeOwner.describe(lease,descriptor);
      }
      if(!ensureScope()||dead||generation!==actionGeneration||controller.signal.aborted||!writeOwner.sent(lease))throw new DOMException('Cancelled','AbortError');
    }catch(error){
      // No adapter call occurred: this is proof of no POST, rather than an inferred HTTP outcome.
      if(guard.getState()?.status!=='uncertain')writeOwner.finish(lease);
      throw new ApiKeyBeforeSendError(error);
    }
    return send({signal:controller.signal,write:guard.getState()!});
  }
  const canUpdate=(key:Readonly<ApiKeyMetadata>)=>{const session=actionGeneration;if(!ensureScope()||dead||guard.getState()||key.status==='revoked'||!options.adapter.update||key.capabilities?.update===false||typeof key.enabled!=='boolean')return false;try{const allowed=options.canUpdate?.(key)??key.capabilities?.update??false;return !dead&&session===actionGeneration&&!guard.getState()&&allowed;}catch{return false;}};
  const canRevoke=(key:Readonly<ApiKeyMetadata>)=>{const session=actionGeneration;if(!ensureScope()||dead||guard.getState()||key.status==='revoked'||key.capabilities?.revoke===false)return false;try{const allowed=options.canRevoke?.(key)??key.capabilities?.revoke??false;return !dead&&session===actionGeneration&&!guard.getState()&&allowed;}catch{return false;}};
  const canDeleteRecord=(key:Readonly<ApiKeyMetadata>)=>{const session=actionGeneration;if(!ensureScope()||dead||guard.getState()||key.status!=='revoked'||!options.adapter.deleteRecord||key.capabilities?.deleteRecord===false)return false;try{const allowed=options.canDeleteRecord?.(key)??key.capabilities?.deleteRecord??false;return !dead&&session===actionGeneration&&!guard.getState()&&allowed;}catch{return false;}};
  const uncertain=(error:unknown)=>error instanceof ApiKeyBeforeSendError?guard.getState()?.status==='uncertain':!isHttpError(error)||error.code===API_KEY_WRITE_OUTCOME_UNKNOWN||error.code===API_KEY_WRITE_COMMITTED_FOLLOWUP_FAILED||error.status===409||!(error.kind==='business'||error.kind==='http'&&error.status!==undefined&&error.status>=400&&error.status<500);
  async function submitCreate(){
    if(!ensureScope()||dead||state.phase!=='create'||state.actionBusy||guard.getState()||options.canCreate!==true)return;
    const session=actionGeneration,originalDraft=state.draft;const current=()=>!dead&&actionGeneration===session&&state.phase==='create'&&state.draft===originalDraft&&!state.actionBusy&&!guard.getState();
    const draft=Object.freeze({...state.draft,name:state.draft.name.trim(),permissionIds:Object.freeze([...state.draft.permissionIds])});
    let fieldErrors:ApiKeyFieldErrors={};if(!draft.name)fieldErrors.name=labels.nameRequired;
    if(new Set(draft.permissionIds).size!==draft.permissionIds.length||draft.permissionIds.some(id=>!permissionIds.has(id)||permissions.find(item=>item.id===id)?.disabled)||permissions.some(item=>item.required&&!draft.permissionIds.includes(item.id)))fieldErrors.permissions=labels.permissionsInvalid;
    if(!expiryIds.has(draft.expiryId))fieldErrors.expiry=labels.expiryInvalid;
    if(options.confirmationLabel&&draft.confirmed!==true)fieldErrors.confirmation=labels.confirmationRequired;
    try{const hostErrors=options.validateCreate?.(draft),safeErrors:ApiKeyFieldErrors={};for(const key of ['name','permissions','expiry','confirmation'] as const){const message=hostErrors?.[key];if(message!==undefined&&typeof message!=='string')throw new TypeError('Field errors must be display-safe strings');if(message)safeErrors[key]=message;}fieldErrors={...safeErrors,...fieldErrors};}catch{if(current())emit({actionError:labels.createRejected});return;}
    if(!current())return;
    if(Object.values(fieldErrors).some(Boolean)){emit({fieldErrors:Object.freeze(fieldErrors),actionError:null});return;}
    const generation=++actionGeneration,controller=new AbortController();actionAbort=controller;const lease=claimWrite('create',null);
    if(!lease)return;if(dead||generation!==actionGeneration){writeOwner.abandon(lease);return;}actionWrite=lease;phaseWriteId=lease.id;emit({draft,actionBusy:true,fieldErrors:Object.freeze({}),actionError:null});
    if(dead||generation!==actionGeneration){writeOwner.abandon(lease);return;}
    try{const result=await wait(()=>dispatch(lease,{operation:'create',draft},controller,generation,context=>options.adapter.create(draft,context)),controller);if(!ensureScope()||dead||generation!==actionGeneration)return;
      const metadata=parseApiKeyMetadata(result.metadata);if(typeof result.secret!=='string'||!result.secret)throw new TypeError('Expected a one-time value');
      actionAbort=undefined;actionWrite=undefined;writeOwner.finish(lease);if(dead||generation!==actionGeneration)return;phaseWriteId=undefined;secret=result.secret;const listSession=++listGeneration,previous=listAbort;listAbort=undefined;previous?.abort();if(dead||generation!==actionGeneration)return;
      emit({phase:'result',actionBusy:false,resultMetadata:metadata,copyStatus:'idle',...(listSession===listGeneration?{listBusy:false}:{}),rows:Object.freeze([...state.rows.filter(row=>row.id!==metadata.id),metadata])});
    }catch(error){const unknown=uncertain(error);if(actionWrite===lease)actionWrite=undefined;if(unknown)writeOwner.abandon(lease);else writeOwner.finish(lease);if(!dead&&generation===actionGeneration){secret=null;actionAbort=undefined;emit({actionBusy:false,actionUncertain:unknown,actionError:unknown?labels.createError:labels.createRejected});}}
  }
  async function submitUpdate(){
    const target=state.updateTarget,session=actionGeneration,original=state.updateDraft;
    if(dead||state.phase!=='update'||state.actionBusy||guard.getState()||!target||!canUpdate(target))return;
    const current=()=>!dead&&session===actionGeneration&&state.phase==='update'&&state.updateTarget===target&&state.updateDraft===original&&!state.actionBusy&&!guard.getState();
    const draft=Object.freeze({name:original.name.trim(),permissionIds:Object.freeze([...original.permissionIds]),enabled:original.enabled});
    let errors:ApiKeyFieldErrors={};if(!draft.name)errors.name=labels.nameRequired;
    if(new Set(draft.permissionIds).size!==draft.permissionIds.length||draft.permissionIds.some(id=>!permissionIds.has(id)||permissions.find(item=>item.id===id)?.disabled)||permissions.some(item=>item.required&&!draft.permissionIds.includes(item.id)))errors.permissions=labels.permissionsInvalid;
    if(typeof draft.enabled!=='boolean'){if(current())emit({actionError:labels.updateRejected});return;}
    try{const host=options.validateUpdate?.(draft,target),safe:ApiKeyFieldErrors={};for(const key of ['name','permissions'] as const){const message=host?.[key];if(message!==undefined&&typeof message!=='string')throw new TypeError('Invalid field error');if(message)safe[key]=message;}errors={...safe,...errors};}catch{if(current())emit({actionError:labels.updateRejected});return;}
    if(!current())return;if(Object.values(errors).some(Boolean)){emit({fieldErrors:Object.freeze(errors),actionError:null});return;}
    const generation=++actionGeneration,controller=new AbortController();actionAbort=controller;const lease=claimWrite('update',target.id);if(!lease)return;if(dead||generation!==actionGeneration){writeOwner.abandon(lease);return;}actionWrite=lease;phaseWriteId=lease.id;emit({updateDraft:draft,actionBusy:true,fieldErrors:Object.freeze({}),actionError:null});
    if(dead||generation!==actionGeneration){writeOwner.abandon(lease);return;}
    try{const result=await wait(()=>dispatch(lease,{operation:'update',key:target,draft},controller,generation,context=>options.adapter.update!(target,draft,context)),controller);if(!ensureScope()||dead||generation!==actionGeneration)return;
      const metadata=parseApiKeyMetadata(result);if(metadata.id!==target.id)throw new TypeError('Mismatched API key update');
      actionAbort=undefined;actionWrite=undefined;writeOwner.finish(lease);if(dead||generation!==actionGeneration)return;
      const listSession=++listGeneration,previous=listAbort;listAbort=undefined;previous?.abort();if(dead||generation!==actionGeneration)return;emit({...(listSession===listGeneration?{listBusy:false}:{}),rows:Object.freeze(state.rows.map(row=>row.id===target.id?metadata:row))});if(!dead&&generation===actionGeneration)close();
    }catch(error){const unknown=uncertain(error);if(actionWrite===lease)actionWrite=undefined;if(unknown)writeOwner.abandon(lease);else writeOwner.finish(lease);if(!dead&&generation===actionGeneration){actionAbort=undefined;emit({actionBusy:false,actionUncertain:unknown,actionError:unknown?labels.updateError:labels.updateRejected});}}
  }
  async function confirmAction(operation:'revoke'|'delete'){
    const target=state.revokeTarget,session=actionGeneration;if(dead||state.phase!==operation||state.actionBusy||guard.getState()||!target)return;
    const permitted=operation==='revoke'?canRevoke(target):canDeleteRecord(target);if(!permitted||dead||session!==actionGeneration||state.phase!==operation||state.revokeTarget!==target||state.actionBusy||guard.getState())return;
    const generation=++actionGeneration,controller=new AbortController();actionAbort=controller;const lease=claimWrite(operation,target.id);if(!lease)return;if(dead||generation!==actionGeneration){writeOwner.abandon(lease);return;}actionWrite=lease;phaseWriteId=lease.id;emit({actionBusy:true,actionError:null});if(dead||generation!==actionGeneration){writeOwner.abandon(lease);return;}
    try{const result=await wait(()=>dispatch(lease,{operation,key:target},controller,generation,context=>operation==='revoke'?options.adapter.revoke(target,context):options.adapter.deleteRecord!(target,context)),controller);if(!ensureScope()||dead||generation!==actionGeneration)return;if(result!==undefined)throw new TypeError('A successful management callback returns void');
      actionAbort=undefined;actionWrite=undefined;writeOwner.finish(lease);if(dead||generation!==actionGeneration)return;const listSession=++listGeneration,previous=listAbort;listAbort=undefined;previous?.abort();if(dead||generation!==actionGeneration)return;emit({...(listSession===listGeneration?{listBusy:false}:{}),rows:Object.freeze(operation==='delete'?state.rows.filter(row=>row.id!==target.id):state.rows.map(row=>row.id===target.id?Object.freeze({...row,status:'revoked' as const,...(row.capabilities?{capabilities:Object.freeze({...row.capabilities,revoke:false})}:{})}):row))});if(!dead&&generation===actionGeneration)close();
    }catch(error){const unknown=uncertain(error);if(actionWrite===lease)actionWrite=undefined;if(unknown)writeOwner.abandon(lease);else writeOwner.finish(lease);if(!dead&&generation===actionGeneration){actionAbort=undefined;emit({actionBusy:false,actionUncertain:unknown,actionError:operation==='revoke'?(unknown?labels.revokeError:labels.revokeRejected):(unknown?labels.deleteError:labels.deleteRejected)});}}
  }
  async function copySecret(writeText:(value:string)=>Promise<void>){
    if(!ensureScope()||dead||state.phase!=='result'||secret===null||state.copyStatus==='copying')return;const generation=++copyGeneration;emit({copyStatus:'copying'});
    if(!ensureScope()||dead||state.phase!=='result'||generation!==copyGeneration||secret===null)return;
    try{await writeText(secret);if(!dead&&generation===copyGeneration)emit({copyStatus:'copied'});}
    catch{if(!dead&&generation===copyGeneration)emit({copyStatus:'error'});}
  }
  function destroy(){if(dead)return;dead=true;offGuard();offResolved();phaseWriteId=undefined;actionGeneration++;listGeneration++;copyGeneration++;secret=null;cancelRecovery();abandonAction();actionAbort?.abort();listAbort?.abort();actionAbort=undefined;listAbort=undefined;emit({phase:'closed',updateDraft:Object.freeze({name:'',permissionIds:Object.freeze([]),enabled:false}),updateTarget:null,rows:Object.freeze([]),hasLoaded:false,listBusy:false,listError:null,draft:freshDraft(),fieldErrors:Object.freeze({}),actionBusy:false,actionError:null,actionUncertain:writeOwner.active()&&guard.getState()?.status==='uncertain',writeBlock:writeOwner.active()?guard.getState():null,recoveryBusy:false,recoveryError:null,resultMetadata:null,revokeTarget:null,copyStatus:'idle'});listeners.clear();}
  return {options,labels,getState:()=>{ensureScope();return state;},subscribe(listener){if(!ensureScope()||dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},refresh,cancelList,recoverUncertainWrite:()=>recoverWrite(),openResolveWrite(){if(dead||state.phase!=='closed'||guard.getState()?.status!=='uncertain'||!options.adapter.resolveWrite)return;emit({phase:'resolve',recoveryError:null});},confirmResolveWrite:()=>recoverWrite(true),
    openCreate(){if(!ensureScope()||dead||guard.getState()||state.phase!=='closed'||options.canCreate!==true)return;emit({phase:'create',draft:freshDraft(),fieldErrors:Object.freeze({}),actionError:null});},
    setDraft(patch){if(dead||state.phase!=='create'||state.actionBusy||guard.getState())return;const draft={...state.draft,...patch};emit({draft:Object.freeze({name:draft.name,expiryId:draft.expiryId,permissionIds:Object.freeze([...draft.permissionIds]),...(options.confirmationLabel?{confirmed:draft.confirmed===true}:{})}),fieldErrors:Object.freeze({}),actionError:null});},
    canUpdate,submitUpdate,openUpdate(id){if(dead||state.phase!=='closed')return;const target=state.rows.find(row=>row.id===id);if(target&&canUpdate(target))emit({phase:'update',updateTarget:target,updateDraft:Object.freeze({name:target.name,permissionIds:Object.freeze([...target.permissionIds]),enabled:target.enabled!}),fieldErrors:Object.freeze({}),actionError:null});},
    setUpdateDraft(patch){if(dead||state.phase!=='update'||state.actionBusy||guard.getState())return;const draft={...state.updateDraft,...patch};emit({updateDraft:Object.freeze({name:draft.name,permissionIds:Object.freeze([...draft.permissionIds]),enabled:draft.enabled}),fieldErrors:Object.freeze({}),actionError:null});},
    submitCreate,openRevoke(id){if(dead||state.phase!=='closed')return;const target=state.rows.find(row=>row.id===id);if(target&&canRevoke(target))emit({phase:'revoke',revokeTarget:target,actionError:null});},confirmRevoke:()=>confirmAction('revoke'),canRevoke,
    openDeleteRecord(id){if(dead||state.phase!=='closed')return;const target=state.rows.find(row=>row.id===id);if(target&&canDeleteRecord(target))emit({phase:'delete',revokeTarget:target,actionError:null});},confirmDeleteRecord:()=>confirmAction('delete'),canDeleteRecord,
    readSecret:()=>ensureScope()&&!dead&&state.phase==='result'?secret:null,copySecret,close,destroy,
  };
}
