import {HttpError} from './http.js';
import {createIndexedDBOperationStore,type DurableOperationStore} from './operation-store.js';
/** Non-secret durable mutation fence. Never store credentials or user identity here. */
export interface AuthRecoveryOptions {
  /** Host-declared cookie/session namespace; additionally bound to the trusted HTTP origin. */
  scope:string;
  /** Explicit opt-in to the BaseService authoritative operation recovery protocol. */
  protocol?:'operation-v1';
  /** Atomic durable store. Browser default: IndexedDB, including HTTP intranet origins. */
  store?:DurableOperationStore;
  /** Legacy localStorage record source, imported before any mutation. Not an atomic store. */
  storage?:Pick<Storage,'getItem'|'setItem'|'removeItem'>;
}
type Operation='login'|'refresh'|'logout';
export function createAuthRecovery(origin:string,options:AuthRecoveryOptions|undefined){
  if(!options)return undefined;
  if(typeof options.scope!=='string'||!options.scope.trim()||options.scope.length>256||/[\u0000-\u001f\u007f]/.test(options.scope))throw new TypeError('Declare an auth recovery session scope');
  const key=`xui.auth.recovery.v1:${JSON.stringify([origin,'/api/v1/auth/',options.scope])}`;
  const store=options.store??createIndexedDBOperationStore(),suppliedStorage=options.storage;
  const failure=()=>new HttpError('http',{attempts:0,status:409,code:'AUTH_REAUTHENTICATION_REQUIRED'});
  const legacy=()=>suppliedStorage??(typeof window!=='undefined'?window.localStorage:undefined);
  let blocked=false;
  try{blocked=legacy()?.getItem(key)!=null;}catch{blocked=true;}
  const valid=(value:string|null)=>{if(value===null)return;let record;try{record=JSON.parse(value);}catch{throw failure();}if(!record||Object.keys(record).sort().join()!=="attempt,operation,version"||record.version!==1||typeof record.attempt!=="string"||!/^([a-f0-9]{32}|[a-f0-9-]{36})$/.test(record.attempt)||!["login","refresh","logout"].includes(record.operation))throw failure();};
  const read=async()=>{
    try{
      const old=legacy()?.getItem(key)??null;
      let current=await store.read(key);valid(old);valid(current);
      if(old!==null&&current===null){const result=await store.compareExchange(key,null,old);current=result.current;valid(current);}
      // Keep the legacy record until a server-authoritative recovery protocol exists.
      // An empty new database must never erase old uncertainty.
      blocked=old!==null||current!==null;return current;
    }catch{blocked=true;throw failure();}
  };
  return {
    blocked(){return blocked;},
    inspect:read,
    /** Atomic reservation is committed before dispatch; unknown owners never expire. */
    async begin(operation:Operation){
      if(await read()!==null||blocked)throw failure();
      let attempt:string;try{const bytes=new Uint8Array(16);globalThis.crypto.getRandomValues(bytes);attempt=Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');}catch{blocked=true;throw failure();}
      const value=JSON.stringify({version:1,attempt,operation});
      try{const result=await store.compareExchange(key,null,value);blocked=true;if(!result.exchanged||result.current!==value)throw failure();}catch{blocked=true;throw failure();}
      const settle=async(_result?:object)=>{
        try{const result=await store.compareExchange(key,value,null);if(!result.exchanged||result.current!==null)throw failure();blocked=false;}catch{blocked=true;throw failure();}
      };
      return {
        /** Only an authoritative terminal response can settle a dispatched attempt. */
        complete:settle,
        /** Proven not dispatched, or authoritative rejection with no mutation. */
        denied:settle,
      };
    },
  };
}
