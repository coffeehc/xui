import {createAuthRecovery,type AuthRecoveryOptions} from './auth-recovery.js';
export type {AuthRecoveryOptions} from './auth-recovery.js';
import {passwordPolicyEndpoint} from './password.js';
import {HttpError,createAjaxResponseAdapter,ajaxErrorResponseAdapter,isHttpError,type HttpClient} from './http.js';
import {authRequest,bindHttpAuth,inspectHttp,type AccessLease,type AuthOperation} from './http-auth-internal.js';
import {createAuthCoordination} from './auth-coordination.js';
import {parseEntityId,type EntityIdEncoding} from './entity-id.js';

/** First-party Bearer/session v2; these are not OAuth token endpoints. */
export const authEndpoints=Object.freeze({login:'/api/v1/auth/login',refresh:'/api/v1/auth/refresh',logout:'/api/v1/auth/logout',session:'/api/v1/auth/session'});
export const authErrorCodes=Object.freeze({invalidRequest:40001,required:40101,forbidden:40301,refreshConflict:40901,rateLimited:42901,unavailable:50300,outcomeUnknown:50301,committedFollowupFailed:50302});
export interface AuthUser {id:string;username:string;display_name:string|null}
export interface AuthSession {schema_version:2;user:Readonly<AuthUser>}
export interface LoginCredentials {username:string;password:string}
export interface AuthRequestOptions {signal?:AbortSignal}
export interface AuthState {
  status:'unknown'|'anonymous'|'authenticated';user:Readonly<AuthUser>|null;
  busy:'session'|'login'|'refresh'|'logout'|null;error:HttpError|null;
  /** A cookie mutation was unconfirmed; only a fresh login can establish a safe new session. */
  reauthenticationRequired:boolean;
}
export interface AuthClientOptions {
  http:HttpClient;timeoutMs?:number;
  /** Omitted: legacy memory-only fencing. Configure for reload-safe cookie mutations. */
  recovery?:AuthRecoveryOptions;
  /** 显式身份编码，默认 decimal；配置后不可自动接受另一种格式。 */
  idEncoding?:EntityIdEncoding;
  /** Explicit same-origin business routes: exact paths, or slash-terminated subtree prefixes. */
  protectedPaths?:readonly string[];
}
export interface AuthClient {
  getState:()=>Readonly<AuthState>;subscribe:(listener:()=>void)=>()=>void;
  currentUser:(options?:AuthRequestOptions)=>Promise<Readonly<AuthUser>|null>;
  refresh:(options?:AuthRequestOptions)=>Promise<Readonly<AuthUser>|null>;
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
function parseUser(value:unknown,idEncoding:EntityIdEncoding):Readonly<AuthUser>{
  const user=object(value,['id','username','display_name']);
  const id=parseEntityId(user.id,idEncoding);
  if(typeof user.username!=='string'||!user.username||user.username.length>128||user.display_name!==null&&(typeof user.display_name!=='string'||user.display_name.length>256))throw new TypeError('Invalid auth contract');
  return Object.freeze({id,username:user.username,display_name:user.display_name as string|null});
}
export function parseAuthSession(value:unknown,idEncoding:EntityIdEncoding='decimal'):Readonly<AuthSession>{
  const session=object(value,['schema_version','user']);if(session.schema_version!==2)throw new TypeError('Invalid auth contract');
  return Object.freeze({schema_version:2,user:parseUser(session.user,idEncoding)});
}
// This secret-bearing DTO deliberately has no public parser, return value, snapshot or cache entry.
// Match the absolute end: JavaScript $ also accepts a trailing line terminator.
function parseIssued(value:unknown,idEncoding:EntityIdEncoding){
  const issued=object(value,['schema_version','user','access_token','token_type','expires_at']);
  if(issued.schema_version!==2||issued.token_type!=='Bearer'||typeof issued.access_token!=='string'||!/^[a-z][a-z0-9]{0,31}-v1-sha256-access-[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048](?![\s\S])/.test(issued.access_token)||typeof issued.expires_at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(issued.expires_at))throw new TypeError('Invalid auth contract');
  const expiry=Date.parse(issued.expires_at);
  if(!Number.isFinite(expiry)||expiry<=Date.now()||new Date(expiry).toISOString().slice(0,19)!==issued.expires_at.slice(0,19))throw new TypeError('Invalid auth contract');
  return {user:parseUser(issued.user,idEncoding),value:issued.access_token,expiry};
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

/** One private access-token owner attached to the existing transport. No persistent token storage. */
export function createAuthClient({http,timeoutMs=15000,protectedPaths=[],idEncoding='decimal',recovery:recoveryOptions}:AuthClientOptions):AuthClient{
  parseEntityId('1',idEncoding);
  if(!http||!inspectHttp(http)||inspectHttp(http)!.binding)throw new TypeError('Provide one unbound shared xui HTTP client');
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>2147483647)throw new RangeError('Invalid auth timeout');
  const paths=protectedPaths.map(path=>{
    if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//')||/[\\?#%\u0000-\u0020\u007f]/.test(path)||new URL(path,'https://xui.invalid').pathname!==path)throw new TypeError('Declare normalized root-relative protected paths');
    return path;
  });
  const envelope=createAjaxResponseAdapter();
  const sessionAdapter=(value:unknown,context:Parameters<typeof envelope>[1])=>{const result=envelope(value,context);return {...result,payload:parseAuthSession(result.payload,idEncoding)};};
  const issuedAdapter=(value:unknown,context:Parameters<typeof envelope>[1])=>{const result=envelope(value,context);return {...result,payload:parseIssued(result.payload,idEncoding)};};
  const logoutAdapter=(value:unknown,context:Parameters<typeof envelope>[1])=>{const result=envelope(value,context);if(result.payload!==null)throw new TypeError('Invalid logout contract');return {...result,payload:null};};
  const recovery=createAuthRecovery(inspectHttp(http)!.origin,recoveryOptions);
  let state:Readonly<AuthState>=Object.freeze({status:'unknown',user:null,busy:null,error:null,reauthenticationRequired:recovery?.blocked()??false});
  let dead=false,version=0,generation=0,access:{value:string;expiry:number;generation:number}|undefined,bootstrapped=false;
  const listeners=new Set<()=>void>();
  let active:{operation:'login'|'logout';controller:AbortController;version:number}|undefined;
  let refreshFlight:Promise<Readonly<AuthUser>|null>|undefined,refreshController:AbortController|undefined;
  let sessionFlight:Promise<Readonly<AuthUser>|null>|undefined,sessionController:AbortController|undefined,sessionVersion:number|undefined;
  const errorFor=(kind:'cancel'|'http'='cancel',operation?:AuthOperation)=>new HttpError(kind,{attempts:0,endpointId:operation?`auth.${operation}`:undefined,...(kind==='http'?{status:401,code:'AUTH_REAUTHENTICATION_REQUIRED'}:{})});
  const normalize=(error:unknown,operation:AuthOperation)=>isHttpError(error)?new HttpError(error.kind,error.metadata):new HttpError('parse',{attempts:0,endpointId:`auth.${operation}`});
  const emit=(patch:Partial<AuthState>)=>{state=Object.freeze({...state,...patch});for(const listener of Array.from(listeners))if(listeners.has(listener))try{listener();}catch{/* Views cannot change credential handling. */}};
  const clear=()=>{access=undefined;generation++;};
  // IndexedDB restoration is asynchronous and never sends a cookie request.
  if(recovery)void recovery.inspect().then(()=>{if(!dead&&version===0&&!active&&!refreshFlight&&!sessionFlight&&recovery.blocked())emit({reauthenticationRequired:true});},()=>{if(!dead&&version===0&&!active&&!refreshFlight&&!sessionFlight)emit({reauthenticationRequired:true});});
  const current=(revision:number)=>!dead&&revision===version;
  const invalidate=(status:AuthState['status'],required=false,error:HttpError|null=null)=>{required=required||(recovery?.blocked()??false);version++;clear();sessionController?.abort();refreshController?.abort();active?.controller.abort();active=undefined;emit({status,user:null,busy:null,error,reauthenticationRequired:required});};
  const coordination=createAuthCoordination(inspectHttp(http)!.origin,event=>{
    if(dead||event.kind==='refresh')return; // Rotation preserves live sibling access tokens.
    invalidate(event.kind==='logout'?'anonymous':'unknown',recovery?.blocked()??false);bootstrapped=event.kind==='logout';
  });
  const wait=<T>(promise:Promise<T>,signal?:AbortSignal):Promise<T>=>{
    if(!signal)return promise;if(signal.aborted)return Promise.reject(errorFor());
    return new Promise((resolve,reject)=>{const abort=()=>{signal.removeEventListener('abort',abort);reject(errorFor());};signal.addEventListener('abort',abort,{once:true});promise.then(value=>{signal.removeEventListener('abort',abort);if(!signal.aborted)resolve(value);},error=>{signal.removeEventListener('abort',abort);if(!signal.aborted)reject(error);});});
  };
  const check=(revision:number,signal?:AbortSignal)=>{if(!current(revision)||signal?.aborted)throw errorFor();};
  const received=(issued:ReturnType<typeof parseIssued>,revision:number)=>{
    check(revision);const acceptedGeneration=++generation;access={value:issued.value,expiry:issued.expiry,generation:acceptedGeneration};bootstrapped=true;http.resetUnauthorized();
    // Issuing access during currentUser is not completion of its required session read.
    const checking=!!sessionFlight&&sessionVersion===revision&&!sessionController?.signal.aborted;
    emit({status:'authenticated',user:issued.user,busy:checking?'session':null,error:null,reauthenticationRequired:false});check(revision);if(access?.generation!==acceptedGeneration||state.user!==issued.user)throw errorFor();return issued.user;
  };
  const cookieRequest=(operation:'login'|'refresh'|'logout',json:unknown,signal:AbortSignal)=>authRequest(http,operation,authEndpoints[operation],{method:'POST',json,headers:{Accept:'application/json','Content-Type':'application/json'},signal,timeoutMs,response:'ajax',errorAdapter:ajaxErrorResponseAdapter,adapter:operation==='logout'?logoutAdapter:issuedAdapter,endpointId:`auth.${operation}`,cache:'no-store',credentials:'same-origin',redirect:'error',unauthorized:'ignore'});
  const coordinatedRequest=<T>(operation:'login'|'refresh'|'logout',json:unknown,controller:AbortController,revision:number,accept:(payload:unknown)=>T)=>{
    let timedOut=false;
    const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
    let stop:()=>void=()=>{};
    const cancelled=new Promise<never>((_,reject)=>{stop=()=>reject(timedOut?new HttpError('timeout',{attempts:0,endpointId:`auth.${operation}`}):errorFor('cancel',operation));if(controller.signal.aborted)stop();else controller.signal.addEventListener('abort',stop,{once:true});});
    const request=coordination.run(async()=>{
      check(revision,controller.signal);
      const attempt=await recovery?.begin(operation);
      // Reservation is asynchronous; recheck ownership before dispatch.
      // No dispatch has occurred, so this attempt can safely restore its prior fence.
      try{check(revision,controller.signal);}catch(error){await attempt?.denied();throw error;}
      let result;
      try{result=await cookieRequest(operation,json,controller.signal);}catch(error){
        check(revision,controller.signal);
        if(isHttpError(error)&&error.kind==='http'&&operation==='login'&&error.status!==undefined&&error.status>=400&&error.status<500&&error.status!==409)await attempt?.denied();
        else if(isHttpError(error)&&error.kind==='http'&&operation==='refresh'&&error.status===401)await attempt?.complete();
        throw error;
      }
      check(revision,controller.signal);await attempt?.complete();check(revision,controller.signal);
      const accepted=accept(result.payload);coordination.publish(operation);return accepted;
    });
    return Promise.race([request,cancelled]).finally(()=>{clearTimeout(timer);controller.signal.removeEventListener('abort',stop);});
  };
  const recover=():Promise<Readonly<AuthUser>|null>=>{
    if(dead||active)return Promise.reject(errorFor());
    if(state.reauthenticationRequired)return Promise.reject(state.error??errorFor('http','refresh'));
    if(refreshFlight)return refreshFlight;
    const revision=version,controller=new AbortController();refreshController=controller;bootstrapped=true;clear();
    const flight=Promise.resolve().then(async()=>{
      check(revision,controller.signal);
      return coordinatedRequest('refresh',{},controller,revision,payload=>received(payload as ReturnType<typeof parseIssued>,revision));
    }).catch(value=>{
      const error=normalize(value,'refresh');if(!current(revision))throw errorFor();clear();
      if(error.kind==='http'&&error.status===401&&!(recovery?.blocked()??false)){http.resetUnauthorized();emit({status:'anonymous',user:null,busy:null,error:null,reauthenticationRequired:false});return null;}
      // Never retry an unknown rotation or destroy the recovery family as cleanup.
      emit({status:'unknown',user:null,busy:null,error:error.code==='AUTH_REAUTHENTICATION_REQUIRED'?null:error,reauthenticationRequired:true});throw error;
    }).finally(()=>{if(refreshFlight===flight){refreshFlight=undefined;refreshController=undefined;}});
    refreshFlight=flight;emit({status:'unknown',user:null,busy:'refresh',error:null});return flight;
  };
  const acquire=async(signal:AbortSignal):Promise<AccessLease>=>{
    if(dead||active||signal.aborted)throw errorFor();
    if(!access||access.expiry<=Date.now()+1000){
      if(!access&&bootstrapped&&state.status==='anonymous')throw new HttpError('http',{attempts:0,status:401,code:authErrorCodes.required});
      await wait(recover(),signal);
    }
    if(dead||active||signal.aborted)throw errorFor();
    if(!access||access.expiry<=Date.now())throw new HttpError('http',{attempts:0,status:401,code:authErrorCodes.required});
    return {value:access.value,generation:access.generation};
  };
  bindHttpAuth(http,{
    mode(path,method,operation){
      let decoded:string;try{decoded=decodeURIComponent(path);}catch{throw new TypeError('Invalid authentication path');}
      const reserved=decoded.toLowerCase()==='/api/v1/auth'||decoded.toLowerCase().startsWith('/api/v1/auth/');
      if(operation){if(path!==authEndpoints[operation]||method!==(operation==='session'?'GET':'POST'))throw new TypeError('Invalid authentication endpoint');return operation==='session'?'bearer':'cookie';}
      // 仅公开策略的精确 GET 可在无会话时消费；其他认证端点继续仅由 owner 调用。
      if(path===passwordPolicyEndpoint&&method==='GET')return undefined;
      if(reserved)throw new TypeError('Use the auth owner for authentication endpoints');
      if(paths.some(prefix=>path===prefix||prefix.endsWith('/')&&path.startsWith(prefix))){if(/%(?:2f|5c|25)/i.test(path)||/[\\\u0000-\u0020\u007f]/.test(decoded))throw new TypeError('Ambiguous protected path');return 'bearer';}
      return undefined;
    },acquire,
    unauthorized(observed){if(dead||!access||access.generation!==observed||active)return;clear();void recover().catch(()=>{});},
    dispose(){client.destroy();},
  });
  const currentUser=(options:AuthRequestOptions={}):Promise<Readonly<AuthUser>|null>=>{
    if(dead||active)return Promise.reject(errorFor());
    if(sessionFlight)return wait(sessionFlight,options.signal);
    if(options.signal?.aborted)return Promise.reject(errorFor());
    if(state.reauthenticationRequired)return Promise.reject(state.error??errorFor('http','session'));
    if(!access&&bootstrapped&&state.status==='anonymous')return Promise.resolve(null);
    const revision=version,controller=new AbortController();let observedGeneration:number|undefined;sessionController=controller;sessionVersion=revision;
    const flight=Promise.resolve().then(async()=>{
      try{
        const lease=await acquire(controller.signal);observedGeneration=lease.generation;check(revision,controller.signal);emit({busy:'session',error:null});
        const result=await authRequest(http,'session',authEndpoints.session,{method:'GET',headers:{Accept:'application/json'},signal:controller.signal,timeoutMs,response:'ajax',adapter:sessionAdapter,errorAdapter:ajaxErrorResponseAdapter,endpointId:'auth.session',cache:'no-store',credentials:'omit',redirect:'error',unauthorized:'ignore'});
        check(revision,controller.signal);if(!access||access.generation!==lease.generation)throw errorFor();
        http.resetUnauthorized();emit({status:'authenticated',user:result.payload.user,busy:null,error:null,reauthenticationRequired:false});check(revision);return state.user;
      }catch(value){const error=normalize(value,'session');if(!current(revision)||observedGeneration!==undefined&&observedGeneration!==generation)throw errorFor();
        if(error.status===401&&!state.reauthenticationRequired){clear();emit({status:'anonymous',user:null,busy:null,error:null,reauthenticationRequired:false});return null;}
        if(!state.reauthenticationRequired){if(error.status!==403)clear();emit({status:'unknown',user:null,busy:null,error});}throw error;
      }
    }).finally(()=>{if(sessionFlight===flight){sessionFlight=undefined;sessionController=undefined;sessionVersion=undefined;
      // A newer refresh may keep valid access after rejecting an obsolete read.
      if(current(revision)&&access&&state.status==='authenticated'&&state.busy==='session')emit({busy:null});
    }});
    sessionFlight=flight;emit({busy:'session',error:null});return wait(flight,options.signal);
  };
  const mutate=async(operation:'login'|'logout',json:unknown,options:AuthRequestOptions)=>{
    if(dead||active||options.signal?.aborted)throw errorFor();
    const prior=state,priorAccess=access,revision=++version,controller=new AbortController();
    sessionController?.abort();clear();active={operation,controller,version:revision};
    const cancel=()=>controller.abort();options.signal?.addEventListener('abort',cancel,{once:true});
    emit({status:'unknown',user:null,busy:operation,error:null});
    try{
      return await coordinatedRequest(operation,json,controller,revision,payload=>{
        active=undefined;
        if(operation==='login')return received(payload as ReturnType<typeof parseIssued>,revision);
        bootstrapped=true;http.resetUnauthorized();emit({status:'anonymous',user:null,busy:null,error:null,reauthenticationRequired:false});check(revision);return null;
      });
    }catch(value){const error=normalize(value,operation);if(!current(revision)||active?.version!==revision)throw errorFor();active=undefined;
      const denied=operation==='login'&&error.kind==='http'&&error.status!==undefined&&error.status>=400&&error.status<500&&error.status!==409;
      if(denied){access=priorAccess;emit({...prior,busy:null,error});}
      else {clear();emit({status:'unknown',user:null,busy:null,error,reauthenticationRequired:true});}
      throw error;
    }finally{options.signal?.removeEventListener('abort',cancel);if(operation==='login')(json as LoginCredentials).password='';}
  };
  const client:AuthClient={
    getState:()=>state,subscribe(listener){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},currentUser,
    refresh:options=>options?.signal?.aborted?Promise.reject(errorFor()):wait(recover(),options?.signal),
    async login(credentials,options={}){
      if(!credentials||typeof credentials.username!=='string'||!credentials.username.trim()||credentials.username.trim().length>128||typeof credentials.password!=='string'||!credentials.password||credentials.password.length>4096)throw new HttpError('parse',{attempts:0,endpointId:'auth.login'});
      return (await mutate('login',{username:credentials.username.trim(),password:credentials.password},options))!;
    },
    async logout(options={}){await mutate('logout',{},options);},
    cancel(){if(dead)return;invalidate('unknown',true,errorFor());},
    expire(){if(dead)return;bootstrapped=true;invalidate('anonymous');},
    destroy(){if(dead)return;dead=true;invalidate('unknown');coordination.close();listeners.clear();},
  };
  return client;
}

export const loginPageDefaultLabels={username:'Username',password:'Password',submit:'Sign in',checking:'Checking your sign-in…',signingIn:'Signing in…',usernameRequired:'Enter your username.',passwordRequired:'Enter your password.',credentialsError:'The username or password is incorrect.',forbidden:'Sign in is not allowed.',rateLimited:'Too many attempts. Try again later.',timeout:'The request timed out. Please try again.',network:'Could not connect. Check your connection and try again.',error:'Sign in could not be completed.',cancelled:'Waiting cancelled. The server may have completed the request.',checkSession:'Retry connection',opening:'Opening app…',navigationError:'You are signed in, but the app could not be opened. Try again.',retryNavigation:'Try opening app again',reauthenticate:'The previous session operation is unconfirmed. Another submission is temporarily blocked.'} as const;
export type LoginPageLabels={ [Key in keyof typeof loginPageDefaultLabels]:string };
/** Both layouts are centered single columns; fullscreen omits the card surface. */
export type LoginPageLayout='fullscreen'|'card';
export interface LoginPageConfig {layout?:LoginPageLayout;productName:string;title?:string;description?:string;logo?:{src:string;alt?:string};returnTo?:string;fallbackReturnTo?:string;labels?:Partial<LoginPageLabels>}
/** Presentation only; domain forms and requests remain owned by the host. */
export type AuthPageConfig=Pick<LoginPageConfig,'layout'|'productName'|'description'|'logo'>&{title:string};
export function resolveLoginPageConfig(input:LoginPageConfig){
  const string=(value:unknown,limit:number)=>{if(typeof value!=='string'||!value||value.length>limit)throw new TypeError('Invalid login page text');return value;};
  const labels=Object.freeze(Object.fromEntries(Object.entries(loginPageDefaultLabels).map(([key,value])=>[key,input.labels?.[key as keyof LoginPageLabels]===undefined?value:string(input.labels[key as keyof LoginPageLabels],300)]))) as Readonly<LoginPageLabels>;
  let logo:Readonly<{src:string;alt:string}>|undefined;
  if(input.logo){let url:URL;try{url=new URL(input.logo.src,'https://xui.invalid');}catch{throw new TypeError('Invalid login logo');}if(!['http:','https:'].includes(url.protocol)||url.username||url.password||input.logo.src.length>2048)throw new TypeError('Invalid login logo');logo=Object.freeze({src:input.logo.src,alt:input.logo.alt??input.productName});}
  const layout=input.layout??'card';if(layout!=='fullscreen'&&layout!=='card')throw new TypeError('Invalid login layout');
  return Object.freeze({layout,productName:string(input.productName,128),title:string(input.title??labels.submit,200),description:input.description===undefined?undefined:string(input.description,600),logo,returnTo:resolveLoginReturnTo(input.returnTo,input.fallbackReturnTo),labels});
}
export function getLoginPageError(error:HttpError,labels:Readonly<LoginPageLabels>):string{
  return [authErrorCodes.refreshConflict,authErrorCodes.outcomeUnknown,authErrorCodes.committedFollowupFailed,'AUTH_REAUTHENTICATION_REQUIRED'].some(code=>code===error.code)?labels.reauthenticate:error.kind==='cancel'?labels.cancelled:error.status===401?labels.credentialsError:error.status===403?labels.forbidden:error.status===429?labels.rateLimited:error.kind==='timeout'?labels.timeout:error.kind==='network'?labels.network:labels.error;
}

/** Host-owned service/source validation and standards-based actions; no password in callbacks. */
export interface LoginExtensionContext {username:string;signal:AbortSignal}
export interface LoginPageAction {id:string;label:string;run:(context:LoginExtensionContext)=>void|Promise<void>;disabled?:boolean}
export interface LoginPageExtensions {beforeSubmit?:(context:LoginExtensionContext)=>void|Promise<void>;actions?:readonly LoginPageAction[];errorLabel?:string}
/** Promptly cancel local waiting even when a host extension does not cooperate. */
export function runLoginPageExtension(callback:(context:LoginExtensionContext)=>void|Promise<void>,context:LoginExtensionContext):Promise<void>{
 return new Promise((resolve,reject)=>{let settled=false;const done=(failed:boolean,error?:unknown)=>{if(settled)return;settled=true;context.signal.removeEventListener('abort',cancel);failed?reject(error):resolve();},cancel=()=>done(true,new HttpError('cancel'));if(context.signal.aborted){cancel();return;}context.signal.addEventListener('abort',cancel,{once:true});Promise.resolve().then(()=>{if(context.signal.aborted)throw new HttpError('cancel');return callback(context);}).then(()=>done(false),error=>done(true,error));});
}
