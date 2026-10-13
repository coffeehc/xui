import {createIndexedDBOperationStore,type DurableOperationStore} from './operation-store.js';
import {parseEntityId} from './entity-id.js';
/** Only non-secret operation identity. Never drafts, prefixes, credentials or response bodies. */
export interface ApiKeyOperationDescriptor {
  readonly operation_id:string;readonly operation:'create'|'update'|'revoke'|'delete_record';
  readonly target_id:string;readonly expected_version:string;readonly fingerprint:string;
}
export interface ApiKeyPendingWrite {
  readonly id:number;readonly operation:'create'|'update'|'revoke'|'delete';readonly targetId:string|null;
  readonly status:'pending'|'uncertain';readonly descriptor?:Readonly<ApiKeyOperationDescriptor>;
}
export type ApiKeyWriteResolution='applied'|'not-applied'|'pending';
export interface ApiKeyWriteStorage {
  /** A trusted actor/namespace scope supplied by the authenticated host, never an origin or request parameter. */
  load:(scopeId:string)=>unknown;
  /** Synchronous durable replace. Throw on any failure; null clears only this scope. */
  save:(scopeId:string,value:Readonly<ApiKeyWriteSnapshot>|null)=>void;
}
export interface ApiKeyWriteSnapshot {readonly schema_version:1;readonly scope_id:string;readonly descriptor:Readonly<ApiKeyOperationDescriptor>}
export interface ApiKeyWriteGuardOptions {
  scopeId:string;isCurrentScope:()=>boolean;storage:ApiKeyWriteStorage;
  /** Default: the library's IndexedDB atomic store, including on non-secure intranet HTTP. */
  operationStore?:DurableOperationStore;
}
export interface ApiKeyWriteGuard {
  getState:()=>Readonly<ApiKeyPendingWrite>|null;subscribe:(listener:()=>void)=>()=>void;
  /** Hydrate/import durable protection. Writes await this automatically. Rejection is fail-closed. */
  ready:()=>Promise<void>;
}
export function parseApiKeyOperationDescriptor(value:unknown):Readonly<ApiKeyOperationDescriptor>{
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new TypeError('Invalid operation descriptor');
  const fields=Object.getOwnPropertyDescriptors(value),keys=['operation_id','operation','target_id','expected_version','fingerprint'];
  if(Object.keys(fields).length!==keys.length||keys.some(key=>!fields[key]||!('value'in fields[key])))throw new TypeError('Invalid operation descriptor fields');
  const d=value as ApiKeyOperationDescriptor;
  if(typeof d.operation_id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(d.operation_id)||!['create','update','revoke','delete_record'].includes(d.operation)||typeof d.target_id!=='string'||d.target_id.length>32||typeof d.expected_version!=='string'||typeof d.fingerprint!=='string'||!/^[0-9a-f]{64}$/.test(d.fingerprint))throw new TypeError('Invalid operation descriptor');
  if(d.operation==='create'?d.target_id!=='':!d.target_id||!/^[1-9a-f][0-9a-f]{0,31}$/.test(d.target_id))throw new TypeError('Invalid operation target');
  if(d.target_id){try{parseEntityId(d.target_id);}catch{parseEntityId(d.target_id,'hex');}}
  if(d.operation==='update')parseEntityId(d.expected_version);else if(d.expected_version!=='')throw new TypeError('Unexpected operation version');
  return Object.freeze(Object.fromEntries(keys.map(key=>[key,fields[key].value]))) as unknown as Readonly<ApiKeyOperationDescriptor>;
}
interface Lease {readonly id:number;sent:boolean;closed:boolean;reserving:boolean;descriptor?:Readonly<ApiKeyOperationDescriptor>}
interface Owner {
  persistent:boolean;active:()=>boolean;
  claim:(operation:ApiKeyPendingWrite['operation'],targetId:string|null)=>Lease|null;
  acquire:(lease:Lease,signal:AbortSignal)=>Promise<void>;
  describe:(lease:Lease,descriptor:ApiKeyOperationDescriptor)=>Promise<void>;
  locked:(id:number)=>boolean;
  sent:(lease:Lease)=>boolean;finish:(lease:Lease)=>boolean|Promise<boolean>;abandon:(lease:Lease)=>void;
  recover:<T>(id:number,signal:AbortSignal,action:()=>Promise<T>)=>Promise<T>;
  subscribeResolved:(listener:(id:number,resolution:Exclude<ApiKeyWriteResolution,'pending'>)=>void)=>()=>void;
  resolve:(id:number,resolution:Exclude<ApiKeyWriteResolution,'pending'>,valid:()=>boolean,signal:AbortSignal)=>boolean|Promise<boolean>;
}
/** A protection failure proves no mutation was dispatched by this attempt. */
export class ApiKeyWriteProtectionError extends TypeError {constructor(){super('API key write protection unavailable');}}
const cancelled=()=>new DOMException('Cancelled','AbortError');
const sameDescriptor=(a:ApiKeyOperationDescriptor|undefined,b:ApiKeyOperationDescriptor|undefined)=>!!a&&!!b&&(['operation_id','operation','target_id','expected_version','fingerprint'] as const).every(key=>a[key]===b[key]);
const owners=new WeakMap<ApiKeyWriteGuard,Owner>(),defaults=new WeakMap<object,ApiKeyWriteGuard>();let nextWriteId=0;
/** Durable operation identity is the cross-tab gate. It never expires or grants another operation. */
export function createApiKeyWriteGuard(options?:ApiKeyWriteGuardOptions):ApiKeyWriteGuard {
  if(options)options={scopeId:options.scopeId,isCurrentScope:options.isCurrentScope,storage:{load:options.storage?.load?.bind(options.storage),save:options.storage?.save?.bind(options.storage)},...(options.operationStore===undefined?{}:{operationStore:{read:options.operationStore?.read?.bind(options.operationStore),compareExchange:options.operationStore?.compareExchange?.bind(options.operationStore)}})};
  let state:Readonly<ApiKeyPendingWrite>|null=null,liveLease:Lease|undefined;
  if(options&&(typeof options.isCurrentScope!=='function'||typeof options.scopeId!=='string'||!options.scopeId||options.scopeId.length>256||!options.storage||typeof options.storage.load!=='function'||typeof options.storage.save!=='function'||options.operationStore!==undefined&&(typeof options.operationStore.read!=='function'||typeof options.operationStore.compareExchange!=='function')))throw new TypeError('Declare trusted scope, persistent storage and atomic coordination');
  const active=()=>{try{return !options||options.isCurrentScope()===true;}catch{return false;}};
  if(!active())throw new TypeError('API key scope is not current');
  const parseSnapshot=(value:unknown)=>{
    if(value===null||value===undefined)return null;
    if(typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new TypeError('Invalid write recovery snapshot');
    const fields=Object.getOwnPropertyDescriptors(value);if(Object.keys(fields).length!==3||['schema_version','scope_id','descriptor'].some(key=>!fields[key]||!('value'in fields[key]))||fields.schema_version.value!==1||fields.scope_id.value!==options!.scopeId)throw new TypeError('Invalid write recovery scope');
    const descriptor=parseApiKeyOperationDescriptor(fields.descriptor.value);return Object.freeze({id:++nextWriteId,operation:descriptor.operation==='delete_record'?'delete' as const:descriptor.operation,targetId:descriptor.target_id||null,status:'uncertain' as const,descriptor});
  };
  const readLegacy=()=>options?parseSnapshot(options.storage.load(options.scopeId)):null;
  const parseStored=(value:string|null)=>value===null?null:parseSnapshot(JSON.parse(value));
  const snapshot=(descriptor:ApiKeyOperationDescriptor):Readonly<ApiKeyWriteSnapshot>=>Object.freeze({schema_version:1,scope_id:options!.scopeId,descriptor});
  const encoded=(descriptor:ApiKeyOperationDescriptor)=>JSON.stringify(snapshot(descriptor));
  const store=options?(options.operationStore??createIndexedDBOperationStore()):undefined,scope='xui.api-key.v1:'+options?.scopeId;
  state=readLegacy();
  const listeners=new Set<()=>void>(),resolved=new Set<(id:number,resolution:Exclude<ApiKeyWriteResolution,'pending'>)=>void>();
  const publish=(next:Readonly<ApiKeyPendingWrite>|null)=>{state=next;for(const listener of Array.from(listeners))if(listeners.has(listener))try{listener();}catch{/* Observers cannot authorize writes. */}};
  const current=(id:number)=>state?.id===id;
  const inherit=(stored:Readonly<ApiKeyPendingWrite>|null)=>{if(!sameDescriptor(state?.descriptor,stored?.descriptor))publish(stored);};
  const markUncertain=(id:number)=>{if(current(id)&&state?.status!=='uncertain')publish(Object.freeze({...state!,status:'uncertain'}));};
  const importLegacy=async()=>{
    if(!options)return null;
    if(!active())throw cancelled();
    const legacy=readLegacy();let value=await store!.read(scope);
    if(!active())throw cancelled();
    if(legacy){
      if(value===null)value=(await store!.compareExchange(scope,null,encoded(legacy.descriptor))).current;
      if(!sameDescriptor(parseStored(value)?.descriptor,legacy.descriptor))throw new ApiKeyWriteProtectionError();
    }
    return parseStored(value);
  };
  const hydration=options?Promise.resolve().then(async()=>{const stored=await importLegacy();if(active()&&stored)inherit(stored);}):Promise.resolve();
  // Hosts may await ready, while the normal manager automatically waits before any dispatch.
  void hydration.catch(()=>{});
  const clear=(id:number,descriptor?:Readonly<ApiKeyOperationDescriptor>):boolean|Promise<boolean>=>{
    if(!active())return false;
    if(!options){if(current(id))publish(null);return true;}
    if(!descriptor){
      try{const legacy=readLegacy();if(legacy){inherit(legacy);return false;}if(current(id))publish(null);return true;}
      catch{markUncertain(id);return false;}
    }
    return (async()=>{
      try{
        // The legacy mirror is never authoritative over the atomic gate. A conflicting old
        // record is preserved and refuses cleanup; all new clients use the atomic store.
        const legacy=readLegacy();if(legacy&&!sameDescriptor(legacy.descriptor,descriptor)){inherit(legacy);return false;}
        if(!active())return false;options.storage.save(options.scopeId,null);
        if(!active())return false;const result=await store!.compareExchange(scope,encoded(descriptor),null);
        if(!active())return false;
        const stored=parseStored(result.current);
        if(current(id)||sameDescriptor(state?.descriptor,descriptor))inherit(stored);
        return result.exchanged;
      }catch{markUncertain(id);return false;}
    })();
  };
  const checkRecovery=async(id:number)=>{
    await hydration;if(!active()||!current(id)||state?.status!=='uncertain')return false;
    if(options){const stored=parseStored(await store!.read(scope));if(!active()||!current(id))return false;if(!sameDescriptor(stored?.descriptor,state.descriptor)){inherit(stored);return false;}}
    return active()&&current(id)&&state?.status==='uncertain';
  };
  const notifyResolution=(id:number,resolution:Exclude<ApiKeyWriteResolution,'pending'>,valid:()=>boolean)=>{
    if(!active()||!current(id)||state?.status!=='uncertain'||!valid())return false;
    for(const listener of Array.from(resolved))if(resolved.has(listener))try{listener(id,resolution);}catch{/* View failures cannot forge outcomes. */}
    return active()&&current(id)&&state?.status==='uncertain'&&valid();
  };
  const guard=Object.freeze({ready:()=>hydration,getState:()=>active()?state:null,subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}});
  owners.set(guard,{
    persistent:!!options,active,
    claim(operation,targetId){if(!active())throw new TypeError('API key scope is not current');if(state)return null;const stored=readLegacy();if(stored){inherit(stored);return null;}const lease:Lease={id:++nextWriteId,sent:false,closed:false,reserving:false};liveLease=lease;publish(Object.freeze({id:lease.id,operation,targetId,status:'pending'}));return lease;},
    async acquire(lease,signal){
      if(!options)return;
      try{await hydration;const stored=await importLegacy();if(stored){inherit(stored);throw new TypeError('Another saved write requires recovery');}}
      catch(error){if(signal.aborted)throw cancelled();if(state?.status==='uncertain')throw error;throw new ApiKeyWriteProtectionError();}
      if(!active()||!current(lease.id)||lease.closed||signal.aborted)throw cancelled();
    },
    async describe(lease,value){
      if(!options||!active()||!current(lease.id)||lease.sent||lease.closed)throw new TypeError('Stale write preparation');
      const descriptor=parseApiKeyOperationDescriptor(value);if(descriptor.operation!==(state!.operation==='delete'?'delete_record':state!.operation)||descriptor.target_id!==(state!.targetId??''))throw new TypeError('Mismatched write preparation');
      lease.reserving=true;state=Object.freeze({...state!,descriptor});
      try{
        // This single committed transaction grants exactly one descriptor, even when tabs
        // simultaneously prepared distinct operation IDs after both observed empty storage.
        const result=await store!.compareExchange(scope,null,encoded(descriptor));lease.reserving=false;
        if(!result.exchanged){const stored=parseStored(result.current);if(!stored)throw new ApiKeyWriteProtectionError();if(active())inherit(stored);throw new TypeError('Another saved write requires recovery');}
        lease.descriptor=descriptor;
        if(!active())throw cancelled();
        if(lease.closed||!current(lease.id)){await clear(lease.id,descriptor);throw cancelled();}
        const legacy=readLegacy();if(legacy){inherit(legacy);throw new ApiKeyWriteProtectionError();}
        state=Object.freeze({...state!,descriptor});
        try{options.storage.save(options.scopeId,snapshot(descriptor));}catch{markUncertain(lease.id);throw new ApiKeyWriteProtectionError();}
        publish(state);
      }catch(error){lease.reserving=false;markUncertain(lease.id);throw error;}
    },
    locked(id){return !options||liveLease?.id===id&&!liveLease.closed&&!!liveLease.descriptor;},
    sent(lease){
      if(!active()||!current(lease.id)||lease.closed||state?.status!=='pending'||options&&!lease.descriptor)return false;
      if(options){try{const stored=readLegacy();if(!sameDescriptor(stored?.descriptor,state.descriptor)){inherit(stored??Object.freeze({...state,status:'uncertain'}));return false;}}catch{markUncertain(lease.id);return false;}}
      if(!active()||!current(lease.id)||lease.closed)return false;lease.sent=true;return true;
    },
    finish(lease){if(lease.closed)return false;lease.closed=true;if(liveLease===lease)liveLease=undefined;return current(lease.id)?clear(lease.id,lease.descriptor):false;},
    abandon(lease){
      if(lease.closed)return;lease.closed=true;if(liveLease===lease)liveLease=undefined;
      if(!current(lease.id))return;
      if(!active()){publish(state?.descriptor?Object.freeze({...state,status:'uncertain'}):null);return;}
      if(lease.sent){markUncertain(lease.id);return;}
      if(!lease.reserving&&state?.status!=='uncertain')void clear(lease.id,lease.descriptor);
    },
    async recover(id,signal,action){if(!await checkRecovery(id)||signal.aborted)throw cancelled();return action();},
    subscribeResolved(listener){resolved.add(listener);return()=>{resolved.delete(listener);};},
    resolve(id,resolution,valid,signal){
      if(!options)return notifyResolution(id,resolution,valid)?clear(id):false;
      return (async()=>{if(!await checkRecovery(id)||signal.aborted||!notifyResolution(id,resolution,valid))return false;return clear(id,state!.descriptor);})();
    },
  });return guard;
}
export function apiKeyWriteOwner(adapter:object,explicit?:ApiKeyWriteGuard){let guard=explicit??defaults.get(adapter);if(!guard){guard=createApiKeyWriteGuard();defaults.set(adapter,guard);}const owner=owners.get(guard);if(!owner)throw new TypeError('Use createApiKeyWriteGuard');return {guard,owner};}
export function isPersistentApiKeyWriteGuard(guard:ApiKeyWriteGuard){return owners.get(guard)?.persistent===true;}
export type ApiKeyWriteLease=Lease;
