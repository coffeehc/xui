// Package-private capability bridge. No secret-bearing hook is exported by a public entrypoint.
import type {HttpClient, HttpRequestOptions} from './http.js';
export type AuthOperation = 'login' | 'refresh' | 'session' | 'logout' | 'recovery-session-read' | 'recovery-session-create' | 'recovery-lookup' | 'recovery-resolve';
export interface AccessLease {value:string;generation:number}
export interface HttpAuthBinding {
  mode:(path:string,method:string,operation:AuthOperation|undefined)=>'cookie'|'bearer'|undefined;
  acquire:(signal:AbortSignal)=>Promise<AccessLease>;
  unauthorized:(generation:number)=>void;
  dispose:()=>void;
}
interface Registration {origin:string;binding?:HttpAuthBinding}
const registrations=new WeakMap<HttpClient,Registration>();
const operations=new WeakMap<object,AuthOperation>();
export function registerHttp(client:HttpClient,origin:string){registrations.set(client,{origin});}
export function inspectHttp(client:HttpClient){return registrations.get(client);}
export function bindHttpAuth(client:HttpClient,binding:HttpAuthBinding){
  const registration=registrations.get(client);
  if(!registration||registration.binding)throw new TypeError('Use one auth owner with an xui HTTP client');
  if(!/^https?:\/\//.test(registration.origin))throw new TypeError('Browser session authentication requires HTTP(S)');
  registration.binding=binding;
  return ()=>{if(registration.binding===binding)registration.binding=undefined;};
}
export async function authRequest<T>(http:HttpClient,operation:AuthOperation,path:string,options:HttpRequestOptions<T>){operations.set(options,operation);try{const result=await http.request<T>(path,options);const receipt=receipts.get(options);if(receipt)receipts.set(result,receipt);return result;}catch(error){const receipt=receipts.get(options);if(receipt&&error&&typeof error==='object')receipts.set(error,receipt);throw error;}}
export function authOperation(options:object){return operations.get(options);}

// Fixed non-secret operation receipt projection, retained only by the auth capability owner.
const receipts=new WeakMap<object,Readonly<Record<string,string|null>>>();
export function captureAuthReceipt(options:object,headers:Headers){
 if(!operations.has(options))return;
 const names=['X-Auth-Scope-ID','X-Auth-Epoch','X-Auth-Operation-ID','X-Auth-Operation','X-Auth-Status','X-Auth-Next-Epoch'];
 const value:Record<string,string|null>={};for(const name of names){const field=headers.get(name);value[name]=field!==null&&field.length<=128&&!/[\u0000-\u001f\u007f]/.test(field)?field:null;}receipts.set(options,Object.freeze(value));
}
export function authReceipt(value:object){return receipts.get(value);}
