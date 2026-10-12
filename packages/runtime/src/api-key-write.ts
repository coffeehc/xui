/** Memory-only facts: never drafts, prefixes, secrets, credentials or response bodies. */
export interface ApiKeyPendingWrite {
  readonly id:number;
  readonly operation:'create'|'revoke'|'delete';
  readonly targetId:string|null;
  readonly status:'pending'|'uncertain';
}
export type ApiKeyWriteResolution='applied'|'not-applied'|'pending';
/** Keep this owner outside views; only verified controller operations can release it. */
export interface ApiKeyWriteGuard {
  getState:()=>Readonly<ApiKeyPendingWrite>|null;
  subscribe:(listener:()=>void)=>()=>void;
}
interface Lease {readonly id:number;sent:boolean}
interface Owner {
  claim:(operation:ApiKeyPendingWrite['operation'],targetId:string|null)=>Lease|null;
  sent:(lease:Lease)=>boolean;
  finish:(lease:Lease)=>void;
  abandon:(lease:Lease)=>void;
  subscribeResolved:(listener:(id:number,resolution:Exclude<ApiKeyWriteResolution,'pending'>)=>void)=>()=>void;
  resolve:(id:number,resolution:Exclude<ApiKeyWriteResolution,'pending'>,valid:()=>boolean)=>boolean;
}
const owners=new WeakMap<ApiKeyWriteGuard,Owner>();
const defaults=new WeakMap<object,ApiKeyWriteGuard>();
let nextWriteId=0;
export function createApiKeyWriteGuard():ApiKeyWriteGuard {
  let state:Readonly<ApiKeyPendingWrite>|null=null;
  const listeners=new Set<()=>void>(),resolved=new Set<(id:number,resolution:Exclude<ApiKeyWriteResolution,'pending'>)=>void>();
  const publish=(next:Readonly<ApiKeyPendingWrite>|null)=>{state=next;for(const listener of Array.from(listeners))if(listeners.has(listener))try{listener();}catch{/* An observer cannot authorize another write. */}};
  const current=(id:number)=>state?.id===id;
  const guard=Object.freeze({getState:()=>state,subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}});
  owners.set(guard,{
    claim(operation,targetId){if(state)return null;const lease={id:++nextWriteId,sent:false};publish(Object.freeze({id:lease.id,operation,targetId,status:'pending'}));return lease;},
    sent(lease){if(!current(lease.id)||state?.status!=='pending')return false;lease.sent=true;return true;},
    finish(lease){if(current(lease.id))publish(null);},
    abandon(lease){if(!current(lease.id))return;if(lease.sent){if(state!.status!=='uncertain')publish(Object.freeze({...state!,status:'uncertain'}));}else publish(null);},
    subscribeResolved(listener){resolved.add(listener);return()=>{resolved.delete(listener);};},
    resolve(id,resolution,valid){if(!current(id)||state?.status!=='uncertain')return false;for(const listener of Array.from(resolved))if(resolved.has(listener))try{listener(id,resolution);}catch{/* A view cannot forge or replay an outcome. */}if(!current(id)||state?.status!=='uncertain'||!valid())return false;publish(null);return true;},
  });
  return guard;
}
export function apiKeyWriteOwner(adapter:object,explicit?:ApiKeyWriteGuard){
  let guard=explicit??defaults.get(adapter);
  if(!guard){guard=createApiKeyWriteGuard();defaults.set(adapter,guard);}
  const owner=owners.get(guard);if(!owner)throw new TypeError('Use createApiKeyWriteGuard for a shared write owner');
  return {guard,owner};
}
export type ApiKeyWriteLease=Lease;
