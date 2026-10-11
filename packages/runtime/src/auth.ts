import {HttpError,createAjaxResponseAdapter,isHttpError,type HttpClient} from './http.js';

/** The xui v1 cookie-session facade. Product backends adapt to these routes and DTOs. */
export const authEndpoints=Object.freeze({login:'/api/v1/auth/login',logout:'/api/v1/auth/logout',session:'/api/v1/auth/session'});
export interface AuthUser {id:string;username:string;display_name:string|null}
export interface AuthSession {schema_version:1;user:Readonly<AuthUser>}
export interface LoginCredentials {username:string;password:string}
export interface AuthRequestOptions {signal?:AbortSignal}
export interface AuthState {
  status:'unknown'|'anonymous'|'authenticated';user:Readonly<AuthUser>|null;
  busy:'session'|'login'|'logout'|null;error:HttpError|null;
}
export interface AuthClientOptions {http:HttpClient;timeoutMs?:number}
export interface AuthClient {
  getState:()=>Readonly<AuthState>;subscribe:(listener:()=>void)=>()=>void;
  currentUser:(options?:AuthRequestOptions)=>Promise<Readonly<AuthUser>|null>;
  login:(credentials:LoginCredentials,options?:AuthRequestOptions)=>Promise<Readonly<AuthUser>>;
  logout:(options?:AuthRequestOptions)=>Promise<void>;
  cancel:()=>void;expire:()=>void;destroy:()=>void;
}
function object(value:unknown,keys:readonly string[]):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value)))throw new TypeError('Invalid auth contract');
  const descriptors=Object.getOwnPropertyDescriptors(value);
  if(Object.keys(descriptors).length!==keys.length||keys.some(key=>!descriptors[key]||!('value'in descriptors[key])))throw new TypeError('Invalid auth contract');
  return value as Record<string,unknown>;
}
export function parseAuthSession(value:unknown):Readonly<AuthSession>{
  const session=object(value,['schema_version','user']),user=object(session.user,['id','username','display_name']);
  if(session.schema_version!==1||typeof user.id!=='string'||!user.id||user.id.length>256||typeof user.username!=='string'||!user.username||user.username.length>128||user.display_name!==null&&(typeof user.display_name!=='string'||user.display_name.length>256))throw new TypeError('Invalid auth contract');
  return Object.freeze({schema_version:1,user:Object.freeze({id:user.id,username:user.username,display_name:user.display_name as string|null})});
}

/** Root-relative same-origin navigation only. Validate again after URL normalization. */
export function resolveLoginReturnTo(value:string|null|undefined,fallback='/'):string{
  const origin='https://xui.invalid';
  const safe=(input:unknown):string|null=>{
    if(typeof input!=='string'||input.length>2048||!input.startsWith('/')||input.startsWith('//')||/[\\\u0000-\u0020\u007f]/.test(input))return null;
    let url:URL;try{url=new URL(input,origin);}catch{return null;}
    if(url.origin!==origin||url.pathname.startsWith('//'))return null;
    let decoded=url.pathname;
    for(let i=0;i<8;i++){
      if(!decoded.startsWith('/')||decoded.startsWith('//')||/[\\\u0000-\u0020\u007f]/.test(decoded)||/^\/login\/?$/i.test(decoded))return null;
      const normalized=new URL(decoded,origin);if(normalized.origin!==origin||normalized.pathname.startsWith('//'))return null;
      let next:string;try{next=decodeURIComponent(decoded);}catch{return null;}
      if(next===decoded){
        const keys:string[]=[];url.searchParams.forEach((_,key)=>keys.push(key));for(const key of keys)if(/^(?:password|access_token|refresh_token|token|auth_token|authorization|code|api_key|client_secret|secret)$/i.test(key))url.searchParams.delete(key);
        return url.pathname+url.search;
      }
      decoded=next;
    }
    return null;
  };
  return safe(value)??safe(fallback)??'/';
}

/** One session-state owner atop the host's one HTTP owner; no token/cookie/storage access. */
export function createAuthClient({http,timeoutMs=15000}:AuthClientOptions):AuthClient{
  if(!http||typeof http.request!=='function'||typeof http.resetUnauthorized!=='function')throw new TypeError('Provide the shared HTTP client');
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>2147483647)throw new RangeError('Invalid auth timeout');
  const envelope=createAjaxResponseAdapter(),sessionAdapter=(value:unknown,context:Parameters<typeof envelope>[1])=>{const result=envelope(value,context);return {...result,payload:parseAuthSession(result.payload)};};
  const logoutAdapter=(value:unknown,context:Parameters<typeof envelope>[1])=>{const result=envelope(value,context);if(result.payload!==null)throw new TypeError('Invalid logout contract');return {...result,payload:null};};
  let state:Readonly<AuthState>=Object.freeze({status:'unknown',user:null,busy:null,error:null}),dead=false,version=0;
  type Ticket={version:number;operation:NonNullable<AuthState['busy']>;controller:AbortController;prior:Readonly<AuthState>;dispose:()=>void};
  let active:Ticket|undefined;const listeners=new Set<()=>void>();
  const emit=(patch:Partial<AuthState>)=>{state=Object.freeze({...state,...patch});for(const listener of Array.from(listeners))if(listeners.has(listener))try{listener();}catch{/* A view cannot replay credentials. */}};
  const current=(ticket:Ticket)=>!dead&&ticket.version===version;
  const stop=(status?:AuthState['status'])=>{
    const ticket=active,revision=++version;active=undefined;ticket?.dispose();ticket?.controller.abort();
    if(dead||revision!==version)return;
    if(status)emit({status,user:null,busy:null,error:null});
    else if(ticket)emit({status:ticket.operation==='session'?ticket.prior.status:'unknown',user:ticket.operation==='session'?ticket.prior.user:null,busy:null,error:new HttpError('cancel',{attempts:0,endpointId:`auth.${ticket.operation}`})});
  };
  const begin=(operation:Ticket['operation'],options:AuthRequestOptions):Ticket=>{
    if(dead||state.busy==='login'||state.busy==='logout')throw new HttpError('cancel');
    const revision=++version,previous=active;active=undefined;previous?.dispose();previous?.controller.abort();
    if(dead||revision!==version)throw new HttpError('cancel');
    const controller=new AbortController(),prior=state,ticket:Ticket={version:revision,operation,controller,prior,dispose:()=>{}};
    const external=()=>{if(current(ticket))stop();};ticket.dispose=()=>options.signal?.removeEventListener('abort',external);
    active=ticket;
    if(options.signal?.aborted){stop();throw new HttpError('cancel');}
    options.signal?.addEventListener('abort',external,{once:true});
    emit({busy:operation,error:null,...(operation==='logout'?{status:'unknown' as const,user:null}:{})});
    if(!current(ticket))throw new HttpError('cancel');return ticket;
  };
  const finish=(ticket:Ticket,patch:Partial<AuthState>)=>{if(!current(ticket))throw new HttpError('cancel');active=undefined;ticket.dispose();emit({...patch,busy:null});};
  const send=async(operation:Ticket['operation'],json:unknown,options:AuthRequestOptions)=>{
    const ticket=begin(operation,options);
    try{
      const response=await http.request<AuthSession|null>(authEndpoints[operation],{method:operation==='session'?'GET':'POST',...(operation==='session'?{}:{json}),signal:ticket.controller.signal,timeoutMs,response:'ajax',adapter:operation==='logout'?logoutAdapter:sessionAdapter,endpointId:`auth.${operation}`,cache:'no-store',redirect:'error',unauthorized:'ignore'});
      if(!current(ticket))throw new HttpError('cancel');
      const user=operation==='logout'?null:(response.payload as AuthSession).user;
      http.resetUnauthorized();finish(ticket,{status:user?'authenticated':'anonymous',user,error:null});if(!current(ticket))throw new HttpError('cancel');return user;
    }catch(value){
      const error=isHttpError(value)?value:new HttpError('parse',{attempts:1,endpointId:`auth.${operation}`});
      if(!current(ticket))throw new HttpError('cancel');
      if(error.status===401&&operation!=='login'){http.resetUnauthorized();finish(ticket,{status:'anonymous',user:null,error:null});if(!current(ticket))throw new HttpError('cancel');return null;}
      // Wrong credentials do not expire a previously confirmed cookie session.
      const known=operation==='login'&&error.status!==undefined&&error.status>=400&&error.status<500;
      finish(ticket,{status:known?ticket.prior.status:'unknown',user:known?ticket.prior.user:null,error});throw error;
    }
  };
  return {
    getState:()=>state,subscribe(listener){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
    currentUser:options=>send('session',undefined,options??{}),
    async login(credentials,options={}){
      if(!credentials||typeof credentials.username!=='string'||!credentials.username.trim()||credentials.username.trim().length>128||typeof credentials.password!=='string'||!credentials.password||credentials.password.length>4096)throw new HttpError('parse',{attempts:0,endpointId:'auth.login'});
      return (await send('login',{username:credentials.username.trim(),password:credentials.password},options))!;
    },
    async logout(options={}){await send('logout',{},options);},cancel:()=>stop(),expire:()=>stop('anonymous'),
    destroy(){if(dead)return;dead=true;version++;const previous=active;active=undefined;previous?.dispose();previous?.controller.abort();emit({status:'unknown',user:null,busy:null,error:null});listeners.clear();},
  };
}

export const loginPageDefaultLabels={username:'Username',password:'Password',submit:'Sign in',cancel:'Cancel request',checking:'Checking session…',signingIn:'Signing in…',signingOut:'Signing out…',continue:'Continue',logout:'Sign out',theme:'Appearance',light:'Light',dark:'Dark',system:'System',usernameRequired:'Enter your username.',passwordRequired:'Enter your password.',credentialsError:'The username or password is incorrect.',forbidden:'Sign in is not allowed.',rateLimited:'Too many attempts. Try again later.',timeout:'The result is unconfirmed. Check the session before trying again.',network:'The service could not be reached. Check the session before trying again.',error:'Sign in could not be completed.',cancelled:'Waiting cancelled. The server may have completed the request.',signedIn:'Signed in',checkSession:'Check session'} as const;
export type LoginPageLabels={ [Key in keyof typeof loginPageDefaultLabels]:string };
export interface LoginPageConfig {productName:string;title?:string;description?:string;logo?:{src:string;alt?:string};returnTo?:string;fallbackReturnTo?:string;labels?:Partial<LoginPageLabels>}
export function resolveLoginPageConfig(input:LoginPageConfig){
  const string=(value:unknown,limit:number)=>{if(typeof value!=='string'||!value||value.length>limit)throw new TypeError('Invalid login page text');return value;};
  const labels=Object.freeze(Object.fromEntries(Object.entries(loginPageDefaultLabels).map(([key,value])=>[key,input.labels?.[key as keyof LoginPageLabels]===undefined?value:string(input.labels[key as keyof LoginPageLabels],300)]))) as Readonly<LoginPageLabels>;
  let logo:Readonly<{src:string;alt:string}>|undefined;
  if(input.logo){let url:URL;try{url=new URL(input.logo.src,'https://xui.invalid');}catch{throw new TypeError('Invalid login logo');}if(!['http:','https:'].includes(url.protocol)||url.username||url.password||input.logo.src.length>2048)throw new TypeError('Invalid login logo');logo=Object.freeze({src:input.logo.src,alt:input.logo.alt??input.productName});}
  return Object.freeze({productName:string(input.productName,128),title:string(input.title??labels.submit,200),description:input.description===undefined?undefined:string(input.description,600),logo,returnTo:resolveLoginReturnTo(input.returnTo,input.fallbackReturnTo),labels});
}
export function getLoginPageError(error:HttpError,labels:Readonly<LoginPageLabels>):string{
  return error.kind==='cancel'?labels.cancelled:error.status===401?labels.credentialsError:error.status===403?labels.forbidden:error.status===429?labels.rateLimited:error.kind==='timeout'?labels.timeout:error.kind==='network'?labels.network:labels.error;
}
