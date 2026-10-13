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
export interface ApiKeyWriteGuardOptions {scopeId:string;isCurrentScope:()=>boolean;storage:ApiKeyWriteStorage}
export interface ApiKeyWriteGuard {getState:()=>Readonly<ApiKeyPendingWrite>|null;subscribe:(listener:()=>void)=>()=>void}
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
interface Lease {readonly id:number;sent:boolean}
interface Owner {
  persistent:boolean;active:()=>boolean;
  claim:(operation:ApiKeyPendingWrite['operation'],targetId:string|null)=>Lease|null;
  describe:(lease:Lease,descriptor:ApiKeyOperationDescriptor)=>void;
  sent:(lease:Lease)=>boolean;finish:(lease:Lease)=>boolean;abandon:(lease:Lease)=>void;
  subscribeResolved:(listener:(id:number,resolution:Exclude<ApiKeyWriteResolution,'pending'>)=>void)=>()=>void;
  resolve:(id:number,resolution:Exclude<ApiKeyWriteResolution,'pending'>,valid:()=>boolean)=>boolean;
}
const owners=new WeakMap<ApiKeyWriteGuard,Owner>(),defaults=new WeakMap<object,ApiKeyWriteGuard>();let nextWriteId=0;
/** Supply persistence for the v2 HTTP boundary. Reloaded operations always start uncertain. */
export function createApiKeyWriteGuard(options?:ApiKeyWriteGuardOptions):ApiKeyWriteGuard {
  if(options)options={scopeId:options.scopeId,isCurrentScope:options.isCurrentScope,storage:{load:options.storage?.load?.bind(options.storage),save:options.storage?.save?.bind(options.storage)}};
  let state:Readonly<ApiKeyPendingWrite>|null=null;
  if(options&&(typeof options.isCurrentScope!=='function'||typeof options.scopeId!=='string'||!options.scopeId||options.scopeId.length>256||!options.storage||typeof options.storage.load!=='function'||typeof options.storage.save!=='function'))throw new TypeError('Declare trusted scope and persistent storage');
  const active=()=>{try{return !options||options.isCurrentScope()===true;}catch{return false;}};
  if(!active())throw new TypeError('API key scope is not current');
  const read=()=>{
    if(!options)return null;const value=options.storage.load(options.scopeId);if(value===null||value===undefined)return null;
    if(typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new TypeError('Invalid write recovery snapshot');
    const fields=Object.getOwnPropertyDescriptors(value);if(Object.keys(fields).length!==3||['schema_version','scope_id','descriptor'].some(key=>!fields[key]||!('value'in fields[key]))||fields.schema_version.value!==1||fields.scope_id.value!==options.scopeId)throw new TypeError('Invalid write recovery scope');
    const descriptor=parseApiKeyOperationDescriptor(fields.descriptor.value);return Object.freeze({id:++nextWriteId,operation:descriptor.operation==='delete_record'?'delete' as const:descriptor.operation,targetId:descriptor.target_id||null,status:'uncertain' as const,descriptor});
  };
  state=read();
  const listeners=new Set<()=>void>(),resolved=new Set<(id:number,resolution:Exclude<ApiKeyWriteResolution,'pending'>)=>void>();
  const publish=(next:Readonly<ApiKeyPendingWrite>|null)=>{state=next;for(const listener of Array.from(listeners))if(listeners.has(listener))try{listener();}catch{/* Observers cannot authorize writes. */}};
  const current=(id:number)=>state?.id===id;
  const clear=()=>{if(!active())return false;try{if(options){const stored=read();if(stored&&(['operation_id','operation','target_id','expected_version','fingerprint'] as const).some(key=>stored.descriptor[key]!==state?.descriptor?.[key])){publish(stored);return false;}if(!active())return false;options.storage.save(options.scopeId,null);}}catch{if(state)publish(Object.freeze({...state,status:'uncertain'}));return false;}publish(null);return true;};
  const guard=Object.freeze({getState:()=>active()?state:null,subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}});
  owners.set(guard,{
    persistent:!!options,active,
    claim(operation,targetId){if(!active())throw new TypeError('API key scope is not current');if(state)return null;const stored=read();if(stored){publish(stored);return null;}const lease={id:++nextWriteId,sent:false};publish(Object.freeze({id:lease.id,operation,targetId,status:'pending'}));return lease;},
    describe(lease,value){if(!active())throw new TypeError('API key scope is not current');if(!current(lease.id)||lease.sent)throw new TypeError('Stale write preparation');const descriptor=parseApiKeyOperationDescriptor(value);if(descriptor.operation!==(state!.operation==='delete'?'delete_record':state!.operation)||descriptor.target_id!==(state!.targetId??''))throw new TypeError('Mismatched write preparation');if(!options)throw new TypeError('Durable write guard required');
      const stored=read();if(stored){publish(stored);throw new TypeError('Another saved write requires recovery');}
      if(!active())throw new TypeError('API key scope is not current');
      // Install the descriptor before storage: a storage failure may be a partial write, so retain the gate.
      state=Object.freeze({...state!,descriptor});try{options.storage.save(options.scopeId,Object.freeze({schema_version:1,scope_id:options.scopeId,descriptor}));}catch{publish(Object.freeze({...state,status:'uncertain'}));throw new TypeError('Write recovery storage failed');}publish(state);
    },
    sent(lease){if(!active()||!current(lease.id)||state?.status!=='pending')return false;lease.sent=true;return true;},
    finish(lease){return current(lease.id)?clear():false;},
    abandon(lease){if(!current(lease.id))return;if(!active()){publish(state?.descriptor?Object.freeze({...state,status:'uncertain'}):null);return;}if(lease.sent){if(state!.status!=='uncertain')publish(Object.freeze({...state!,status:'uncertain'}));}else if(state?.status!=='uncertain')clear();},
    subscribeResolved(listener){resolved.add(listener);return()=>{resolved.delete(listener);};},
    resolve(id,resolution,valid){if(!active()||!current(id)||state?.status!=='uncertain'||!valid())return false;for(const listener of Array.from(resolved))if(resolved.has(listener))try{listener(id,resolution);}catch{/* View failures cannot forge outcomes. */}if(!active()||!current(id)||state?.status!=='uncertain'||!valid())return false;return clear();},
  });return guard;
}
export function apiKeyWriteOwner(adapter:object,explicit?:ApiKeyWriteGuard){let guard=explicit??defaults.get(adapter);if(!guard){guard=createApiKeyWriteGuard();defaults.set(adapter,guard);}const owner=owners.get(guard);if(!owner)throw new TypeError('Use createApiKeyWriteGuard');return {guard,owner};}
export function isPersistentApiKeyWriteGuard(guard:ApiKeyWriteGuard){return owners.get(guard)?.persistent===true;}
export type ApiKeyWriteLease=Lease;
