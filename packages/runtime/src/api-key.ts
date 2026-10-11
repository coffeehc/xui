/** Public metadata only. The host supplies a display-safe prefix, never the full key. */
export interface ApiKeyMetadata {
  id:string; name:string; prefix:string|null; permissionIds:readonly string[];
  createdAt:string|null; expiresAt:string|null; lastUsedAt:string|null;
  status:'active'|'revoked'|'expired'|'unknown'|null;
}
export interface ApiKeyPermission {id:string;label:string;description?:string;disabled?:boolean}
export interface ApiKeyExpiry {id:string;label:string}
export interface ApiKeyDraft {name:string;permissionIds:readonly string[];expiryId:string}
export interface CreatedApiKey {metadata:ApiKeyMetadata;secret:string}
export interface ApiKeyFieldErrors {name?:string;permissions?:string;expiry?:string}
export interface ApiKeyAdapter {
  list:(context:{signal:AbortSignal})=>Promise<readonly ApiKeyMetadata[]>;
  create:(draft:Readonly<ApiKeyDraft>,context:{signal:AbortSignal})=>Promise<CreatedApiKey>;
  revoke:(key:Readonly<ApiKeyMetadata>,context:{signal:AbortSignal})=>Promise<void>;
}
export interface ApiKeyManagerOptions {
  adapter:ApiKeyAdapter;permissions:readonly ApiKeyPermission[];expiryOptions:readonly ApiKeyExpiry[];
  defaultExpiryId:string;defaultPermissionIds?:readonly string[];canCreate?:boolean;
  canRevoke?:(key:Readonly<ApiKeyMetadata>)=>boolean;
  validateCreate?:(draft:Readonly<ApiKeyDraft>)=>ApiKeyFieldErrors|void;
  labels?:Partial<ApiKeyLabels>;
}
export const apiKeyDefaultLabels={
  title:'API keys',create:'Create key',refresh:'Refresh keys',empty:'No keys',loading:'Loading keys…',listError:'Could not load keys.',retry:'Retry loading',
  name:'Name',prefix:'Key prefix',permissions:'Permissions',expiry:'Expiry',createdAt:'Created',lastUsedAt:'Last used',status:'Status',unknown:'Unknown',
  active:'Active',revoked:'Revoked',expired:'Expired',revoke:'Revoke',createTitle:'Create API key',nameRequired:'Enter a name.',permissionsInvalid:'Choose available permissions.',expiryInvalid:'Choose an available expiry.',
  submit:'Create key',cancel:'Cancel',close:'Close',creating:'Creating key…',createError:'The creation result is unconfirmed. Check the list before submitting again.',
  creationPending:'Closing cancels local waiting. The server may still create the key; its one-time value may be lost.',
  resultTitle:'Key created',oneTime:'This value is shown once. Save it securely before closing.',secret:'One-time key value',copy:'Copy key',copying:'Copying…',copied:'Copied',copyError:'Copy failed. Select and copy the value manually.',
  revokeTitle:'Revoke API key',revokeWarning:'Revoking this key prevents its future use. Existing clients may stop working.',confirmRevoke:'Confirm revocation',revoking:'Revoking key…',revokeError:'The revocation result is unconfirmed. Refresh the list before confirming again.',revokePending:'Closing cancels local waiting. The server may still revoke this key.',
} as const;
export type ApiKeyLabels={ [Key in keyof typeof apiKeyDefaultLabels]:string };
export interface ApiKeyManagerState {
  rows:readonly Readonly<ApiKeyMetadata>[];listBusy:boolean;hasLoaded:boolean;listError:string|null;
  phase:'closed'|'create'|'result'|'revoke';draft:Readonly<ApiKeyDraft>;fieldErrors:Readonly<ApiKeyFieldErrors>;
  actionBusy:boolean;actionError:string|null;resultMetadata:Readonly<ApiKeyMetadata>|null;revokeTarget:Readonly<ApiKeyMetadata>|null;
  copyStatus:'idle'|'copying'|'copied'|'error';
}
export interface ApiKeyManagerController {
  readonly options:Readonly<ApiKeyManagerOptions>;readonly labels:Readonly<ApiKeyLabels>;
  getState:()=>Readonly<ApiKeyManagerState>;subscribe:(listener:()=>void)=>()=>void;
  refresh:()=>Promise<void>;cancelList:()=>void;openCreate:()=>void;setDraft:(draft:Partial<ApiKeyDraft>)=>void;
  submitCreate:()=>Promise<void>;openRevoke:(id:string)=>void;confirmRevoke:()=>Promise<void>;canRevoke:(key:Readonly<ApiKeyMetadata>)=>boolean;
  /** Only a transient view should read this; it is never included in a state snapshot. */
  readSecret:()=>string|null;copySecret:(writeText:(value:string)=>Promise<void>)=>Promise<void>;close:()=>void;destroy:()=>void;
}
export function parseApiKeyMetadata(value:unknown):Readonly<ApiKeyMetadata>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('Invalid API key metadata');
  const row=value as Record<string,unknown>;
  if(typeof row.id!=='string'||!row.id||typeof row.name!=='string'||!Array.isArray(row.permissionIds)||row.permissionIds.some(id=>typeof id!=='string')||![null,'active','revoked','expired','unknown'].includes(row.status as null))throw new TypeError('Invalid API key metadata');
  for(const key of ['prefix','createdAt','expiresAt','lastUsedAt'])if(row[key]!==null&&typeof row[key]!=='string')throw new TypeError('Invalid nullable API key metadata');
  return Object.freeze({id:row.id,name:row.name,prefix:row.prefix as string|null,permissionIds:Object.freeze([...row.permissionIds] as string[]),createdAt:row.createdAt as string|null,expiresAt:row.expiresAt as string|null,lastUsedAt:row.lastUsedAt as string|null,status:row.status as ApiKeyMetadata['status']});
}
/** One owner for metadata, writes and a transient result. No HTTP, credentials store or key generation. */
export function createApiKeyManagerController(input:ApiKeyManagerOptions):ApiKeyManagerController {
  const ids=(items:readonly {id:string;label:string}[])=>{const seen=new Set<string>();for(const item of items){if(typeof item.id!=='string'||!item.id||seen.has(item.id)||typeof item.label!=='string')throw new TypeError('Invalid or duplicate API key option');seen.add(item.id);}return seen;};
  const permissions=Object.freeze(input.permissions.map(item=>Object.freeze({id:item.id,label:item.label,description:item.description,disabled:item.disabled}))),expiryOptions=Object.freeze(input.expiryOptions.map(item=>Object.freeze({id:item.id,label:item.label})));
  const permissionIds=ids(permissions),expiryIds=ids(expiryOptions);
  if(!expiryIds.has(input.defaultExpiryId))throw new TypeError('Declare a default expiry from the host options');
  if(new Set(input.defaultPermissionIds??[]).size!==(input.defaultPermissionIds??[]).length||(input.defaultPermissionIds??[]).some(id=>!permissionIds.has(id)||permissions.find(item=>item.id===id)?.disabled))throw new TypeError('Invalid default permission');
  if(!input.adapter||['list','create','revoke'].some(key=>typeof input.adapter[key as keyof ApiKeyAdapter]!=='function'))throw new TypeError('Declare list, create and revoke callbacks');
  const labels=Object.freeze(Object.fromEntries(Object.entries(apiKeyDefaultLabels).map(([key,value])=>{const override=input.labels?.[key as keyof ApiKeyLabels];if(override!==undefined&&typeof override!=='string')throw new TypeError('Labels must be strings');return [key,override??value];}))) as Readonly<ApiKeyLabels>;
  const options=Object.freeze({adapter:Object.freeze({list:input.adapter.list,create:input.adapter.create,revoke:input.adapter.revoke}),permissions,expiryOptions,defaultExpiryId:input.defaultExpiryId,defaultPermissionIds:Object.freeze([...(input.defaultPermissionIds??[])]),canCreate:input.canCreate,canRevoke:input.canRevoke,validateCreate:input.validateCreate,labels});
  const freshDraft=()=>Object.freeze({name:'',permissionIds:options.defaultPermissionIds,expiryId:options.defaultExpiryId});
  let state:Readonly<ApiKeyManagerState>=Object.freeze({rows:Object.freeze([]),listBusy:false,hasLoaded:false,listError:null,phase:'closed',draft:freshDraft(),fieldErrors:Object.freeze({}),actionBusy:false,actionError:null,resultMetadata:null,revokeTarget:null,copyStatus:'idle'});
  let dead=false,secret:string|null=null,listGeneration=0,actionGeneration=0,copyGeneration=0,listAbort:AbortController|undefined,actionAbort:AbortController|undefined;
  const listeners=new Set<()=>void>();
  const emit=(patch:Partial<ApiKeyManagerState>)=>{state=Object.freeze({...state,...patch});for(const listener of listeners)try{listener();}catch{/* View failures cannot replay a write. */}};
  const cancelList=()=>{if(dead)return;listGeneration++;listAbort?.abort();listAbort=undefined;emit({listBusy:false,listError:null});};
  const close=()=>{if(dead)return;actionGeneration++;copyGeneration++;secret=null;actionAbort?.abort();actionAbort=undefined;emit({phase:'closed',draft:freshDraft(),fieldErrors:Object.freeze({}),actionBusy:false,actionError:null,resultMetadata:null,revokeTarget:null,copyStatus:'idle'});};
  const wait=async<T>(operation:()=>Promise<T>,controller:AbortController)=>{
    if(controller.signal.aborted)throw new DOMException('Cancelled','AbortError');
    let abort=()=>{};const cancelled=new Promise<never>((_,reject)=>{abort=()=>reject(new DOMException('Cancelled','AbortError'));controller.signal.addEventListener('abort',abort,{once:true});});
    try{return await Promise.race([Promise.resolve().then(()=>{if(controller.signal.aborted)throw new DOMException('Cancelled','AbortError');return operation();}),cancelled]);}
    finally{controller.signal.removeEventListener('abort',abort);}
  };
  async function refresh(){
    if(dead)return;const generation=++listGeneration;listAbort?.abort();const controller=new AbortController();listAbort=controller;emit({listBusy:true,listError:null});
    if(dead||generation!==listGeneration)return;
    try{const rows=await wait(()=>options.adapter.list({signal:controller.signal}),controller);if(dead||generation!==listGeneration)return;
      if(!Array.isArray(rows))throw new TypeError('Expected API key metadata list');const parsed=rows.map(parseApiKeyMetadata),unique=new Set(parsed.map(row=>row.id));if(unique.size!==parsed.length)throw new TypeError('Duplicate API key id');
      listAbort=undefined;emit({rows:Object.freeze(parsed),hasLoaded:true,listBusy:false});
    }catch{if(!dead&&generation===listGeneration){listAbort=undefined;emit({listBusy:false,listError:labels.listError});}}
  }
  const canRevoke=(key:Readonly<ApiKeyMetadata>)=>{if(dead||key.status==='revoked'||key.status==='expired')return false;try{return options.canRevoke?.(key)??key.status==='active';}catch{return false;}};
  async function submitCreate(){
    if(dead||state.phase!=='create'||state.actionBusy||options.canCreate===false)return;
    const draft=Object.freeze({...state.draft,name:state.draft.name.trim(),permissionIds:Object.freeze([...state.draft.permissionIds])});
    let fieldErrors:ApiKeyFieldErrors={};if(!draft.name)fieldErrors.name=labels.nameRequired;
    if(new Set(draft.permissionIds).size!==draft.permissionIds.length||draft.permissionIds.some(id=>!permissionIds.has(id)||permissions.find(item=>item.id===id)?.disabled))fieldErrors.permissions=labels.permissionsInvalid;
    if(!expiryIds.has(draft.expiryId))fieldErrors.expiry=labels.expiryInvalid;
    try{const hostErrors=options.validateCreate?.(draft),safeErrors:ApiKeyFieldErrors={};for(const key of ['name','permissions','expiry'] as const){const message=hostErrors?.[key];if(message!==undefined&&typeof message!=='string')throw new TypeError('Field errors must be display-safe strings');if(message)safeErrors[key]=message;}fieldErrors={...safeErrors,...fieldErrors};}catch{emit({actionError:labels.createError});return;}
    if(Object.values(fieldErrors).some(Boolean)){emit({fieldErrors:Object.freeze(fieldErrors),actionError:null});return;}
    const generation=++actionGeneration,controller=new AbortController();actionAbort=controller;emit({draft,actionBusy:true,fieldErrors:Object.freeze({}),actionError:null});
    if(dead||generation!==actionGeneration)return;
    try{const result=await wait(()=>options.adapter.create(draft,{signal:controller.signal}),controller);if(dead||generation!==actionGeneration)return;
      const metadata=parseApiKeyMetadata(result.metadata);if(typeof result.secret!=='string'||!result.secret)throw new TypeError('Expected a one-time value');
      secret=result.secret;actionAbort=undefined;listGeneration++;listAbort?.abort();listAbort=undefined;
      emit({phase:'result',actionBusy:false,resultMetadata:metadata,copyStatus:'idle',listBusy:false,rows:Object.freeze([...state.rows.filter(row=>row.id!==metadata.id),metadata])});
    }catch{if(!dead&&generation===actionGeneration){secret=null;actionAbort=undefined;emit({actionBusy:false,actionError:labels.createError});}}
  }
  async function confirmRevoke(){
    const target=state.revokeTarget;if(dead||state.phase!=='revoke'||state.actionBusy||!target||!canRevoke(target))return;
    const generation=++actionGeneration,controller=new AbortController();actionAbort=controller;emit({actionBusy:true,actionError:null});if(dead||generation!==actionGeneration)return;
    try{const result=await wait(()=>options.adapter.revoke(target,{signal:controller.signal}),controller);if(dead||generation!==actionGeneration)return;if(result!==undefined)throw new TypeError('A successful revoke callback returns void');
      actionAbort=undefined;listGeneration++;listAbort?.abort();listAbort=undefined;emit({listBusy:false,rows:Object.freeze(state.rows.map(row=>row.id===target.id?Object.freeze({...row,status:'revoked' as const}):row))});close();
    }catch{if(!dead&&generation===actionGeneration){actionAbort=undefined;emit({actionBusy:false,actionError:labels.revokeError});}}
  }
  async function copySecret(writeText:(value:string)=>Promise<void>){
    if(dead||state.phase!=='result'||secret===null||state.copyStatus==='copying')return;const generation=++copyGeneration;emit({copyStatus:'copying'});
    if(dead||state.phase!=='result'||generation!==copyGeneration||secret===null)return;
    try{await writeText(secret);if(!dead&&generation===copyGeneration)emit({copyStatus:'copied'});}
    catch{if(!dead&&generation===copyGeneration)emit({copyStatus:'error'});}
  }
  return {options,labels,getState:()=>state,subscribe(listener){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},refresh,cancelList,
    openCreate(){if(dead||state.phase!=='closed'||options.canCreate===false)return;emit({phase:'create',draft:freshDraft(),fieldErrors:Object.freeze({}),actionError:null});},
    setDraft(patch){if(dead||state.phase!=='create'||state.actionBusy)return;const draft={...state.draft,...patch};emit({draft:Object.freeze({name:draft.name,expiryId:draft.expiryId,permissionIds:Object.freeze([...draft.permissionIds])}),fieldErrors:Object.freeze({}),actionError:null});},
    submitCreate,openRevoke(id){if(dead||state.phase!=='closed')return;const target=state.rows.find(row=>row.id===id);if(target&&canRevoke(target))emit({phase:'revoke',revokeTarget:target,actionError:null});},confirmRevoke,canRevoke,
    readSecret:()=>!dead&&state.phase==='result'?secret:null,copySecret,close,destroy(){if(dead)return;dead=true;actionGeneration++;listGeneration++;copyGeneration++;secret=null;actionAbort?.abort();listAbort?.abort();actionAbort=undefined;listAbort=undefined;emit({phase:'closed',rows:Object.freeze([]),hasLoaded:false,listBusy:false,listError:null,draft:freshDraft(),fieldErrors:Object.freeze({}),actionBusy:false,actionError:null,resultMetadata:null,revokeTarget:null,copyStatus:'idle'});listeners.clear();},
  };
}
