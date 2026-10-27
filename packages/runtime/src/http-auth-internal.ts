// Package-private capability bridge. No secret-bearing hook is exported by a public entrypoint.
import type {HttpClient, HttpRequestOptions} from './http.js';
export type AuthOperation = 'login' | 'refresh' | 'session' | 'logout' | 'password';
export interface AccessLease {value:string;generation:number}
export interface HttpAuthBinding {
  mode:(path:string,method:string,operation:AuthOperation|undefined)=>'cookie'|'bearer'|undefined;
  acquire:(signal:AbortSignal,operation?:AuthOperation,currentOnly?:boolean)=>Promise<AccessLease>;
  unauthorized:(generation:number,currentOnly?:boolean)=>void;
  current:(generation:number)=>boolean;
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
export async function authRequest<T>(http:HttpClient,operation:AuthOperation,path:string,options:HttpRequestOptions<T>){operations.set(options,operation);return http.request<T>(path,options);}
export function authOperation(options:object){return operations.get(options);}

const currentAccessOnly=new WeakSet<object>();
/** Sensitive reads borrow only current access; they never initiate recovery or replay. */
export function currentAccessRequest<T>(http:HttpClient,path:string,options:HttpRequestOptions<T>){currentAccessOnly.add(options);return http.request<T>(path,options);}
export function requiresCurrentAccess(options:object){return currentAccessOnly.has(options);}
