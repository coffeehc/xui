import {HttpError} from './http.js';
/** Non-secret durable mutation fence. Never store credentials or user identity here. */
export interface AuthRecoveryOptions {
  /** Host-declared cookie/session namespace; additionally bound to the trusted HTTP origin. */
  scope:string;
  /** Browser default: localStorage. SSR hosts must inject durable storage explicitly. */
  storage?:Pick<Storage,'getItem'|'setItem'|'removeItem'>;
}
type Operation='login'|'refresh'|'logout';
type RecordValue={version:1;attempt:string;operation:Operation};
export function createAuthRecovery(origin:string,options:AuthRecoveryOptions|undefined){
  if(!options)return undefined;
  if(typeof options.scope!=='string'||!options.scope.trim()||options.scope.length>256||/[\u0000-\u001f\u007f]/.test(options.scope))throw new TypeError('Declare an auth recovery session scope');
  const suppliedStorage=options.storage;
  const key=`xui.auth.recovery.v1:${JSON.stringify([origin,'/api/v1/auth/',options.scope])}`;
  const failure=()=>new HttpError('http',{attempts:0,status:409,code:'AUTH_REAUTHENTICATION_REQUIRED'});
  const storage=()=>{try{const value=suppliedStorage??(typeof window!=='undefined'?window.localStorage:undefined);if(!value)throw failure();return value;}catch{throw failure();}};
  const read=():string|null=>{try{return storage().getItem(key);}catch{throw failure();}};
  const write=(value:string|null)=>{try{const store=storage();if(value===null)store.removeItem(key);else store.setItem(key,value);if(store.getItem(key)!==value)throw failure();}catch{throw failure();}};
  return {
    blocked(){try{return read()!==null;}catch{return true;}},
    /** Called inside the existing cookie-mutation Web Lock, before dispatch. */
    begin(operation:Operation){
      const prior=read();if(operation==='refresh'&&prior!==null)throw failure();
      let attempt:string;try{const bytes=new Uint8Array(16);globalThis.crypto.getRandomValues(bytes);attempt=Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');}catch{throw failure();}
      const record:RecordValue={version:1,attempt,operation};const value=JSON.stringify(record);write(value);
      return {
        /** Clear only this attempt; never remove a newer tab's fence. */
        complete(){if(read()!==value)throw failure();write(null);},
        /** A denied login provably did not mutate the cookie; preserve prior uncertainty. */
        denied(){if(read()!==value)throw failure();write(prior);},
      };
    },
  };
}
