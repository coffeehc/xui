import {isHttpError} from './http.js';
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
export interface ApiKeyWriteContext {signal:AbortSignal}
export interface ApiKeyAdapter {
  list:(context:{signal:AbortSignal})=>Promise<readonly ApiKeyMetadata[]>;
  create:(draft:Readonly<ApiKeyDraft>,context:ApiKeyWriteContext)=>Promise<CreatedApiKey>;
  revoke:(key:Readonly<ApiKeyMetadata>,context:ApiKeyWriteContext)=>Promise<void>;
  update?:(key:Readonly<ApiKeyMetadata>,draft:Readonly<ApiKeyUpdateDraft>,context:ApiKeyWriteContext)=>Promise<Readonly<ApiKeyMetadata>>;
  /** Deletes an already revoked management record; it does not revoke a credential or delete business data. */
  deleteRecord?:(key:Readonly<ApiKeyMetadata>,context:ApiKeyWriteContext)=>Promise<void>;

}
export interface ApiKeyManagerOptions {
  adapter:ApiKeyAdapter;permissions:readonly ApiKeyPermission[];expiryOptions:readonly ApiKeyExpiry[];
  defaultExpiryId:string;defaultPermissionIds?:readonly string[];canCreate?:boolean;
  canUpdate?:(key:Readonly<ApiKeyMetadata>)=>boolean;
  validateUpdate?:(draft:Readonly<ApiKeyUpdateDraft>,key:Readonly<ApiKeyMetadata>)=>ApiKeyFieldErrors|void;
  canRevoke?:(key:Readonly<ApiKeyMetadata>)=>boolean;
  canDeleteRecord?:(key:Readonly<ApiKeyMetadata>)=>boolean;confirmationLabel?:string;
  validateCreate?:(draft:Readonly<ApiKeyDraft>)=>ApiKeyFieldErrors|void;
  labels?:Partial<ApiKeyLabels>;
}
export const apiKeyDefaultLabels={
  updateWarning:'Changing permissions or disabling this key may stop existing clients. Revoked keys cannot be restored.',edit:'Edit',updateTitle:'Edit API key',enabled:'Enabled',save:'Save changes',saving:'Saving changes…',updateError:'The update result is unconfirmed. Check the list before saving again.',updateRejected:'The key update was rejected.',updatePending:'Closing cancels local waiting. The server may still update this key.',disabled:'Disabled',
  lastUsedAtPending:'Pending persistence',
  title:'API keys',create:'Create key',refresh:'Refresh keys',empty:'No keys',loading:'Loading keys…',listError:'Could not load keys.',retry:'Retry loading',
  name:'Name',prefix:'Key prefix',permissions:'Permissions',expiry:'Expiry',createdAt:'Created',lastUsedAt:'Last used',status:'Status',unknown:'Unknown',
  active:'Active',revoked:'Revoked',expired:'Expired',revoke:'Revoke',createTitle:'Create API key',nameRequired:'Enter a name.',permissionsInvalid:'Choose available permissions.',expiryInvalid:'Choose an available expiry.',
  submit:'Create key',cancel:'Cancel',close:'Close',creating:'Creating key…',createError:'The creation result is unconfirmed. Check the list before creating another key.',
  creationPending:'Closing cancels local waiting. The server may still create the key; its one-time value may be lost.',
  resultTitle:'Key created',oneTime:'This value is shown once. Save it securely before closing.',secret:'One-time key value',copy:'Copy key',copying:'Copying…',copied:'Copied',copyError:'Copy failed. Select and copy the value manually.',
  revokeTitle:'Revoke API key',revokeWarning:'Revoking this key prevents its future use. Existing clients may stop working.',confirmRevoke:'Confirm revocation',revoking:'Revoking key…',revokeError:'The revocation result is unconfirmed. Check the list before trying again.',revokePending:'Closing cancels local waiting. The server may still revoke this key.',
  createRejected:'The key creation was rejected.',revokeRejected:'The key revocation was rejected.',deleteRejected:'The record deletion was rejected.',actions:'Actions',confirmation:'Authorization confirmation',confirmationRequired:'Confirm the declared permissions before creating the key.',deleteRecord:'Delete record',deleteTitle:'Delete revoked key record',deleteWarning:'This permanently removes the revoked key management record. Existing business records are retained.',confirmDelete:'Confirm record deletion',deleting:'Deleting record…',deleteError:'The deletion result is unconfirmed. Check the list before trying again.',deletePending:'Closing cancels local waiting. The server may still delete this management record.',
} as const;
export type ApiKeyLabels={ [Key in keyof typeof apiKeyDefaultLabels]:string };
export interface ApiKeyManagerState {
  rows:readonly Readonly<ApiKeyMetadata>[];listBusy:boolean;hasLoaded:boolean;listError:string|null;
  phase:'closed'|'create'|'result'|'revoke'|'delete'|'update';updateDraft:Readonly<ApiKeyUpdateDraft>;updateTarget:Readonly<ApiKeyMetadata>|null;draft:Readonly<ApiKeyDraft>;fieldErrors:Readonly<ApiKeyFieldErrors>;
  actionBusy:boolean;actionError:string|null;resultMetadata:Readonly<ApiKeyMetadata>|null;revokeTarget:Readonly<ApiKeyMetadata>|null;
  copyStatus:'idle'|'copying'|'copied'|'error';
}
export interface ApiKeyManagerController {
  readonly options:Readonly<ApiKeyManagerOptions>;readonly labels:Readonly<ApiKeyLabels>;
  getState:()=>Readonly<ApiKeyManagerState>;subscribe:(listener:()=>void)=>()=>void;
  refresh:()=>Promise<void>;cancelList:()=>void;openCreate:()=>void;setDraft:(draft:Partial<ApiKeyDraft>)=>void;
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
/** One owner for metadata, inflight actions and a transient one-time result. */
export function createApiKeyManagerController(input:ApiKeyManagerOptions):ApiKeyManagerController {
  const ids=(items:readonly {id:string;label:string}[])=>{const seen=new Set<string>();for(const item of items){if(typeof item.id!=='string'||!item.id||seen.has(item.id)||typeof item.label!=='string')throw new TypeError('Invalid or duplicate API key option');seen.add(item.id);}return seen;};
  const permissions=Object.freeze(input.permissions.map(item=>{if(item.required&&item.disabled)throw new TypeError('A required permission cannot be unavailable');return Object.freeze({id:item.id,label:item.label,description:item.description,disabled:item.disabled,required:item.required});})),expiryOptions=Object.freeze(input.expiryOptions.map(item=>Object.freeze({id:item.id,label:item.label})));
  const permissionIds=ids(permissions),expiryIds=ids(expiryOptions);
  if(!expiryIds.has(input.defaultExpiryId))throw new TypeError('Declare a default expiry from the host options');
  if(new Set(input.defaultPermissionIds??[]).size!==(input.defaultPermissionIds??[]).length||(input.defaultPermissionIds??[]).some(id=>!permissionIds.has(id)||permissions.find(item=>item.id===id)?.disabled))throw new TypeError('Invalid default permission');
  if(!input.adapter||['list','create','revoke'].some(key=>typeof input.adapter[key as keyof ApiKeyAdapter]!=='function'))throw new TypeError('Declare list, create and revoke callbacks');
  for(const key of ['update','deleteRecord'] as const)if(input.adapter[key]!==undefined&&typeof input.adapter[key]!=='function')throw new TypeError('Invalid API key adapter callback');
  const labels=Object.freeze(Object.fromEntries(Object.entries(apiKeyDefaultLabels).map(([key,value])=>{const override=input.labels?.[key as keyof ApiKeyLabels];if(override!==undefined&&typeof override!=='string')throw new TypeError('Labels must be strings');return [key,override??value];}))) as Readonly<ApiKeyLabels>;
  if(input.confirmationLabel!==undefined&&(typeof input.confirmationLabel!=='string'||!input.confirmationLabel.trim()))throw new TypeError('Declare a confirmation label');
  const options=Object.freeze({adapter:Object.freeze({list:input.adapter.list,create:input.adapter.create,revoke:input.adapter.revoke,update:input.adapter.update,deleteRecord:input.adapter.deleteRecord}),permissions,expiryOptions,defaultExpiryId:input.defaultExpiryId,defaultPermissionIds:Object.freeze([...new Set([...(input.defaultPermissionIds??[]),...permissions.filter(item=>item.required).map(item=>item.id)])]),canCreate:input.canCreate,canUpdate:input.canUpdate,validateUpdate:input.validateUpdate,canRevoke:input.canRevoke,canDeleteRecord:input.canDeleteRecord,confirmationLabel:input.confirmationLabel,validateCreate:input.validateCreate,labels});
  const freshDraft=()=>Object.freeze({name:'',permissionIds:options.defaultPermissionIds,expiryId:options.defaultExpiryId,...(options.confirmationLabel?{confirmed:false}:{})});
  const freshUpdate=()=>Object.freeze({name:'',permissionIds:Object.freeze([]) as readonly string[],enabled:false});
  let state:Readonly<ApiKeyManagerState>=Object.freeze({rows:Object.freeze([]),listBusy:false,hasLoaded:false,listError:null,phase:'closed',updateDraft:freshUpdate(),updateTarget:null,draft:freshDraft(),fieldErrors:Object.freeze({}),actionBusy:false,actionError:null,resultMetadata:null,revokeTarget:null,copyStatus:'idle'});
  let dead=false,secret:string|null=null,listGeneration=0,actionGeneration=0,copyGeneration=0,listAbort:AbortController|undefined,actionAbort:AbortController|undefined,verificationAbort:AbortController|undefined;
  const listeners=new Set<()=>void>();
  const emit=(patch:Partial<ApiKeyManagerState>)=>{state=Object.freeze({...state,...patch});for(const listener of Array.from(listeners))if(listeners.has(listener))try{listener();}catch{/* View failures cannot replay a write. */}};
  const stopList=()=>{const generation=++listGeneration,previous=listAbort;listAbort=undefined;previous?.abort();return generation;};
  const cancelList=()=>{if(dead)return;const generation=stopList();if(!dead&&generation===listGeneration)emit({listBusy:false,listError:null});};
  const closeAction=(patch:Partial<ApiKeyManagerState>={})=>{if(dead)return;const generation=++actionGeneration;copyGeneration++;secret=null;const previous=actionAbort;actionAbort=undefined;previous?.abort();if(verificationAbort&&listAbort===verificationAbort)stopList();verificationAbort=undefined;if(dead||generation!==actionGeneration)return;emit({phase:'closed',updateDraft:freshUpdate(),updateTarget:null,draft:freshDraft(),fieldErrors:Object.freeze({}),actionBusy:false,actionError:null,...(listAbort?{}:{listBusy:false}),resultMetadata:null,revokeTarget:null,copyStatus:'idle',...patch});};
  const close=()=>closeAction();
  const wait=async<T>(operation:()=>Promise<T>,controller:AbortController)=>{
    if(controller.signal.aborted)throw new DOMException('Cancelled','AbortError');
    let abort=()=>{};const cancelled=new Promise<never>((_,reject)=>{abort=()=>reject(new DOMException('Cancelled','AbortError'));controller.signal.addEventListener('abort',abort,{once:true});});
    try{return await Promise.race([Promise.resolve().then(()=>{if(controller.signal.aborted)throw new DOMException('Cancelled','AbortError');return operation();}),cancelled]);}
    finally{controller.signal.removeEventListener('abort',abort);}
  };
  const parseRows=(rows:unknown)=>{if(!Array.isArray(rows))throw new TypeError('Expected API key metadata list');const parsed=rows.map(parseApiKeyMetadata);if(new Set(parsed.map(row=>row.id)).size!==parsed.length)throw new TypeError('Duplicate API key id');return Object.freeze(parsed);};
  const rowPatch=(rows:readonly Readonly<ApiKeyMetadata>[]):Partial<ApiKeyManagerState>=>({rows,hasLoaded:true,...(state.phase==='update'&&state.updateTarget?{updateTarget:rows.find(row=>row.id===state.updateTarget!.id)??null}:{}),...(state.phase==='revoke'||state.phase==='delete'?{revokeTarget:rows.find(row=>row.id===state.revokeTarget?.id)??null}:{})});
  async function refresh(){
    if(dead)return;const generation=stopList();if(dead||generation!==listGeneration)return;const controller=new AbortController();listAbort=controller;emit({listBusy:true,listError:null});
    if(dead||generation!==listGeneration)return;
    try{const rows=parseRows(await wait(()=>options.adapter.list({signal:controller.signal}),controller));if(dead||generation!==listGeneration)return;listAbort=undefined;emit({...rowPatch(rows),listBusy:false});}
    catch{if(!dead&&generation===listGeneration){listAbort=undefined;emit({listBusy:false,listError:labels.listError});}}
  }
  const canUpdate=(key:Readonly<ApiKeyMetadata>)=>{const session=actionGeneration;if(dead||state.actionBusy||key.status==='revoked'||!options.adapter.update||key.capabilities?.update===false||typeof key.enabled!=='boolean')return false;try{const allowed=options.canUpdate?.(key)??key.capabilities?.update??false;return !dead&&session===actionGeneration&&!state.actionBusy&&allowed;}catch{return false;}};
  const canRevoke=(key:Readonly<ApiKeyMetadata>)=>{const session=actionGeneration;if(dead||state.actionBusy||key.status==='revoked'||key.capabilities?.revoke===false)return false;try{const allowed=options.canRevoke?.(key)??key.capabilities?.revoke??false;return !dead&&session===actionGeneration&&!state.actionBusy&&allowed;}catch{return false;}};
  const canDeleteRecord=(key:Readonly<ApiKeyMetadata>)=>{const session=actionGeneration;if(dead||state.actionBusy||key.status!=='revoked'||!options.adapter.deleteRecord||key.capabilities?.deleteRecord===false)return false;try{const allowed=options.canDeleteRecord?.(key)??key.capabilities?.deleteRecord??false;return !dead&&session===actionGeneration&&!state.actionBusy&&allowed;}catch{return false;}};
  const uncertain=(error:unknown)=>!isHttpError(error)||error.code===API_KEY_WRITE_OUTCOME_UNKNOWN||error.code===API_KEY_WRITE_COMMITTED_FOLLOWUP_FAILED||error.status===409||!(error.kind==='business'||error.kind==='http'&&error.status!==undefined&&error.status>=400&&error.status<500);
  async function verifyList(generation:number,action:AbortController){
    // One ordinary list read presents current records. It never authorizes an automatic replay.
    const listSession=stopList();if(dead||generation!==actionGeneration||action.signal.aborted||listSession!==listGeneration)return;const controller=new AbortController(),abort=()=>controller.abort();verificationAbort=controller;listAbort=controller;action.signal.addEventListener('abort',abort,{once:true});if(action.signal.aborted)controller.abort();
    emit({listBusy:true,listError:null});
    try{const rows=parseRows(await wait(()=>options.adapter.list({signal:controller.signal}),controller));if(!dead&&generation===actionGeneration&&listSession===listGeneration)emit({...rowPatch(rows),listBusy:false});}
    catch{if(!dead&&generation===actionGeneration&&listSession===listGeneration)emit({listBusy:false,listError:labels.listError});}
    finally{action.signal.removeEventListener('abort',abort);if(listAbort===controller)listAbort=undefined;if(verificationAbort===controller)verificationAbort=undefined;}
  }
  async function write<T>(send:(context:ApiKeyWriteContext)=>Promise<T>,success:(result:T,current:()=>boolean)=>void|Promise<void>,errorLabel:string,rejectedLabel:string,patch:Partial<ApiKeyManagerState>={}){
    const generation=++actionGeneration,controller=new AbortController(),current=()=>!dead&&generation===actionGeneration&&!controller.signal.aborted;actionAbort=controller;stopList();if(!current())return;emit({...patch,...(listAbort?{}:{listBusy:false}),actionBusy:true,fieldErrors:Object.freeze({}),actionError:null});
    if(!current())return;
    try{const result=await wait(()=>send({signal:controller.signal}),controller);if(!current())return;stopList();if(!current())return;await success(result,current);if(current())actionAbort=undefined;}
    catch(error){if(!current())return;secret=null;const unknown=uncertain(error);if(unknown)await verifyList(generation,controller);if(!current())return;actionAbort=undefined;emit({actionBusy:false,actionError:unknown?errorLabel:rejectedLabel});}
  }
  const permissionError=(draft:Readonly<ApiKeyDraft>|Readonly<ApiKeyUpdateDraft>)=>new Set(draft.permissionIds).size!==draft.permissionIds.length||draft.permissionIds.some(id=>!permissionIds.has(id)||permissions.find(item=>item.id===id)?.disabled)||permissions.some(item=>item.required&&!draft.permissionIds.includes(item.id));
  async function submitCreate(){
    if(dead||state.phase!=='create'||state.actionBusy||options.canCreate!==true)return;
    const session=actionGeneration,original=state.draft,current=()=>!dead&&session===actionGeneration&&state.phase==='create'&&state.draft===original&&!state.actionBusy;
    const draft=Object.freeze({...original,name:original.name.trim(),permissionIds:Object.freeze([...original.permissionIds])});
    let errors:ApiKeyFieldErrors={};if(!draft.name)errors.name=labels.nameRequired;if(permissionError(draft))errors.permissions=labels.permissionsInvalid;if(!expiryIds.has(draft.expiryId))errors.expiry=labels.expiryInvalid;if(options.confirmationLabel&&draft.confirmed!==true)errors.confirmation=labels.confirmationRequired;
    try{const host=options.validateCreate?.(draft),safe:ApiKeyFieldErrors={};for(const key of ['name','permissions','expiry','confirmation'] as const){const message=host?.[key];if(message!==undefined&&typeof message!=='string')throw new TypeError('Field errors must be display-safe strings');if(message)safe[key]=message;}errors={...safe,...errors};}catch{if(current())emit({actionError:labels.createRejected});return;}
    if(!current())return;if(Object.values(errors).some(Boolean)){emit({fieldErrors:Object.freeze(errors),actionError:null});return;}
    await write(context=>options.adapter.create(draft,context),(result,current)=>{const metadata=parseApiKeyMetadata(result.metadata),value=result.secret;if(typeof value!=='string'||!value)throw new TypeError('Expected a one-time value');if(!current())return;secret=value;emit({phase:'result',listBusy:!!listAbort,actionBusy:false,resultMetadata:metadata,copyStatus:'idle',rows:Object.freeze([...state.rows.filter(row=>row.id!==metadata.id),metadata])});},labels.createError,labels.createRejected,{draft});
  }
  async function submitUpdate(){
    const target=state.updateTarget,session=actionGeneration,original=state.updateDraft;
    if(dead||state.phase!=='update'||state.actionBusy||!target||!canUpdate(target))return;
    const current=()=>!dead&&session===actionGeneration&&state.phase==='update'&&state.updateTarget===target&&state.updateDraft===original&&!state.actionBusy;
    const draft=Object.freeze({name:original.name.trim(),permissionIds:Object.freeze([...original.permissionIds]),enabled:original.enabled});
    let errors:ApiKeyFieldErrors={};if(!draft.name)errors.name=labels.nameRequired;if(permissionError(draft))errors.permissions=labels.permissionsInvalid;if(typeof draft.enabled!=='boolean'){if(current())emit({actionError:labels.updateRejected});return;}
    try{const host=options.validateUpdate?.(draft,target),safe:ApiKeyFieldErrors={};for(const key of ['name','permissions'] as const){const message=host?.[key];if(message!==undefined&&typeof message!=='string')throw new TypeError('Invalid field error');if(message)safe[key]=message;}errors={...safe,...errors};}catch{if(current())emit({actionError:labels.updateRejected});return;}
    if(!current())return;if(Object.values(errors).some(Boolean)){emit({fieldErrors:Object.freeze(errors),actionError:null});return;}
    await write(context=>options.adapter.update!(target,draft,context),(result,current)=>{const metadata=parseApiKeyMetadata(result);if(metadata.id!==target.id)throw new TypeError('Mismatched API key update');if(!current())return;closeAction({rows:Object.freeze(state.rows.map(row=>row.id===target.id?metadata:row)),listBusy:!!listAbort});},labels.updateError,labels.updateRejected,{updateDraft:draft});
  }
  async function confirmAction(operation:'revoke'|'delete'){
    const target=state.revokeTarget,session=actionGeneration;if(dead||state.phase!==operation||state.actionBusy||!target)return;
    const permitted=operation==='revoke'?canRevoke(target):canDeleteRecord(target);if(!permitted||dead||session!==actionGeneration||state.phase!==operation||state.revokeTarget!==target||state.actionBusy)return;
    await write(context=>operation==='revoke'?options.adapter.revoke(target,context):options.adapter.deleteRecord!(target,context),async(result,current)=>{
      if(result!==undefined)throw new TypeError('A successful management callback returns void');
      if(operation==='delete'){closeAction({rows:Object.freeze(state.rows.filter(row=>row.id!==target.id)),listBusy:false});return;}
      // A confirmed revoke changes status, but cannot grant deletion permission.
      // Refresh authority once through the existing ordinary list owner; read
      // failure keeps the known revoked row locked and exposes list retry.
      emit({rows:Object.freeze(state.rows.map(row=>row.id===target.id?Object.freeze({...row,status:'revoked' as const,capabilities:Object.freeze({...row.capabilities,revoke:false,deleteRecord:false})}):row))});
      if(!current())return;await verifyList(actionGeneration,actionAbort!);
      if(current())closeAction({listBusy:!!listAbort});
    },operation==='revoke'?labels.revokeError:labels.deleteError,operation==='revoke'?labels.revokeRejected:labels.deleteRejected);
  }
  async function copySecret(writeText:(value:string)=>Promise<void>){
    if(dead||state.phase!=='result'||secret===null||state.copyStatus==='copying')return;const generation=++copyGeneration;emit({copyStatus:'copying'});
    if(dead||state.phase!=='result'||generation!==copyGeneration||secret===null)return;
    try{await writeText(secret);if(!dead&&generation===copyGeneration)emit({copyStatus:'copied'});}catch{if(!dead&&generation===copyGeneration)emit({copyStatus:'error'});}
  }
  function destroy(){if(dead)return;dead=true;actionGeneration++;copyGeneration++;secret=null;actionAbort?.abort();actionAbort=undefined;verificationAbort=undefined;stopList();emit({phase:'closed',updateDraft:freshUpdate(),updateTarget:null,rows:Object.freeze([]),hasLoaded:false,listBusy:false,listError:null,draft:freshDraft(),fieldErrors:Object.freeze({}),actionBusy:false,actionError:null,resultMetadata:null,revokeTarget:null,copyStatus:'idle'});listeners.clear();}
  return {options,labels,getState:()=>state,subscribe(listener){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},refresh,cancelList,
    openCreate(){if(dead||state.actionBusy||state.phase!=='closed'||options.canCreate!==true)return;emit({phase:'create',draft:freshDraft(),fieldErrors:Object.freeze({}),actionError:null});},
    setDraft(patch){if(dead||state.phase!=='create'||state.actionBusy)return;const draft={...state.draft,...patch};emit({draft:Object.freeze({name:draft.name,expiryId:draft.expiryId,permissionIds:Object.freeze([...draft.permissionIds]),...(options.confirmationLabel?{confirmed:draft.confirmed===true}:{})}),fieldErrors:Object.freeze({}),actionError:null});},
    canUpdate,submitUpdate,openUpdate(id){if(dead||state.phase!=='closed')return;const target=state.rows.find(row=>row.id===id);if(target&&canUpdate(target))emit({phase:'update',updateTarget:target,updateDraft:Object.freeze({name:target.name,permissionIds:Object.freeze([...target.permissionIds]),enabled:target.enabled!}),fieldErrors:Object.freeze({}),actionError:null});},
    setUpdateDraft(patch){if(dead||state.phase!=='update'||state.actionBusy)return;const draft={...state.updateDraft,...patch};emit({updateDraft:Object.freeze({name:draft.name,permissionIds:Object.freeze([...draft.permissionIds]),enabled:draft.enabled}),fieldErrors:Object.freeze({}),actionError:null});},
    submitCreate,openRevoke(id){if(dead||state.phase!=='closed')return;const target=state.rows.find(row=>row.id===id);if(target&&canRevoke(target))emit({phase:'revoke',revokeTarget:target,actionError:null});},confirmRevoke:()=>confirmAction('revoke'),canRevoke,
    openDeleteRecord(id){if(dead||state.phase!=='closed')return;const target=state.rows.find(row=>row.id===id);if(target&&canDeleteRecord(target))emit({phase:'delete',revokeTarget:target,actionError:null});},confirmDeleteRecord:()=>confirmAction('delete'),canDeleteRecord,
    readSecret:()=>!dead&&state.phase==='result'?secret:null,copySecret,close,destroy,
  };
}
