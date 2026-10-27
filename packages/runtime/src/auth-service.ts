import {HttpError,parseAjaxResponse,createAjaxResponseAdapter,ajaxErrorResponseAdapter,isHttpError,type HttpClient} from './http-service.js';
import {authRequest,bindHttpAuth,inspectHttp,type AccessLease,type AuthOperation} from './http-auth-internal.js';
import {createAuthCoordination} from './auth-coordination.js';
import {passwordChangeErrorCodes,isPasswordChangeRejection} from './password-change-errors.js';
import {validatePassword,countPasswordCodePoints} from './password.js';
import {parseEntityId,type EntityIdEncoding} from './entity-id.js';

/** First-party Bearer/session v2; these are not OAuth token endpoints. */
export const authEndpoints=Object.freeze({login:'/api/v1/auth/login',refresh:'/api/v1/auth/refresh',logout:'/api/v1/auth/logout',session:'/api/v1/auth/session',password:'/api/v1/auth/password'});
export const authErrorCodes=Object.freeze({invalidRequest:40001,required:40101,forbidden:40301,refreshConflict:40901,rateLimited:42901,unavailable:50300});
export interface AuthUser {id:string;username:string;display_name:string|null}
export interface AuthSession {schema_version:2;user:Readonly<AuthUser>}
export interface LoginCredentials {username:string;password:string}
/** Exact official request fields. Secrets are copied only into the single submission scope. */
export interface PasswordChangeCredentials {current_password:string;new_password:string}
export interface AuthRequestOptions {signal?:AbortSignal}
export interface AuthState {
  status:'unknown'|'anonymous'|'authenticated';user:Readonly<AuthUser>|null;
  busy:'session'|'login'|'refresh'|'logout'|'password'|null;error:HttpError|null;
}
export interface AuthClientOptions {
  http:HttpClient;timeoutMs?:number;
  /** 显式身份编码，默认 decimal；配置后不可自动接受另一种格式。 */
  idEncoding?:EntityIdEncoding;
  /** Explicit same-origin business routes: exact paths, or slash-terminated subtree prefixes. */
  protectedPaths?:readonly string[];
}
export interface AuthClient {
  getState:()=>Readonly<AuthState>;subscribe:(listener:()=>void)=>()=>void;
  currentUser:(options?:AuthRequestOptions)=>Promise<Readonly<AuthUser>|null>;
  refresh:(options?:AuthRequestOptions)=>Promise<Readonly<AuthUser>|null>;
  /** Submit once; uncertain replies are checked through the existing refresh/session endpoints. */
  login:(credentials:LoginCredentials,options?:AuthRequestOptions)=>Promise<Readonly<AuthUser>>;
  logout:(options?:AuthRequestOptions)=>Promise<void>;
  /** One PUT; strict confirmation expires every local credential and requires login. Never replays. */
  changePassword:(credentials:PasswordChangeCredentials,options?:AuthRequestOptions)=>Promise<void>;
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
/** Internal factory; public consumers obtain the application service from services.ts. */
export function buildAuthClient({http,timeoutMs=15000,protectedPaths=[],idEncoding='decimal'}:AuthClientOptions):AuthClient{
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
  const passwordAdapter=(value:unknown,context:Parameters<typeof envelope>[1])=>{const wire=parseAjaxResponse(value),result={payload:wire.payload,code:wire.code,bodyRequestId:wire.request_id};if(!wire.success)throw new HttpError('business',{...context,code:wire.code,bodyRequestId:wire.request_id});const payload=object(result.payload,['schema_version','changed','reauthenticate']);if(payload.schema_version!==1||payload.changed!==true||payload.reauthenticate!==true)throw new TypeError('Invalid password change contract');return {...result,payload:null};};
  let state:Readonly<AuthState>=Object.freeze({status:'unknown',user:null,busy:null,error:null});
  let dead=false,requireLogin=false,version=0,generation=0,access:{value:string;expiry:number;generation:number}|undefined,bootstrapped=false;
  const listeners=new Set<()=>void>();
  let active:{operation:'login'|'logout'|'password';lease?:AccessLease;epoch?:string;controller:AbortController;version:number;candidate?:ReturnType<typeof parseIssued>&{generation:number}}|undefined;
  let refreshFlight:Promise<Readonly<AuthUser>|null>|undefined,refreshController:AbortController|undefined,refreshVersion:number|undefined;
  let sessionFlight:Promise<Readonly<AuthUser>|null>|undefined,sessionController:AbortController|undefined,sessionVersion:number|undefined;
  const errorFor=(operation?:AuthOperation)=>new HttpError('cancel',{attempts:0,endpointId:operation?`auth.${operation}`:undefined});
  const normalize=(error:unknown,operation:AuthOperation)=>isHttpError(error)?new HttpError(error.kind,error.metadata):new HttpError('parse',{attempts:0,endpointId:`auth.${operation}`});
  const emit=(patch:Partial<AuthState>)=>{state=Object.freeze({...state,...patch});for(const listener of Array.from(listeners))if(listeners.has(listener))try{listener();}catch{/* Views cannot change credential handling. */}};
  const clear=()=>{access=undefined;generation++;};
  const current=(revision:number)=>!dead&&revision===version;
  const invalidate=(status:AuthState['status'],error:HttpError|null=null)=>{version++;clear();sessionController?.abort();refreshController?.abort();active?.controller.abort();active=undefined;emit({status,user:null,busy:null,error});};
  const coordination=createAuthCoordination(inspectHttp(http)!.origin,event=>{
    if(dead||event.kind==='refresh')return; // Rotation preserves live sibling access tokens.
    if(event.kind==='password')requireLogin=true;else if(event.kind==='login')requireLogin=false;
    const anonymous=event.kind==='logout'||event.kind==='password';invalidate(anonymous?'anonymous':'unknown');bootstrapped=anonymous;
  });
  const wait=<T>(promise:Promise<T>,signal?:AbortSignal):Promise<T>=>{
    if(!signal)return promise;if(signal.aborted)return Promise.reject(errorFor());
    return new Promise((resolve,reject)=>{const abort=()=>{signal.removeEventListener('abort',abort);reject(errorFor());};signal.addEventListener('abort',abort,{once:true});promise.then(value=>{signal.removeEventListener('abort',abort);if(!signal.aborted)resolve(value);},error=>{signal.removeEventListener('abort',abort);if(!signal.aborted)reject(error);});});
  };
  const check=(revision:number,signal?:AbortSignal)=>{if(!current(revision)||signal?.aborted)throw errorFor();};
  const received=(issued:ReturnType<typeof parseIssued>,revision:number)=>{
    check(revision);requireLogin=false;const acceptedGeneration=++generation;access={value:issued.value,expiry:issued.expiry,generation:acceptedGeneration};bootstrapped=true;http.resetUnauthorized();
    // Issuing access during currentUser is not completion of its required session read.
    const checking=!!sessionFlight&&sessionVersion===revision&&!sessionController?.signal.aborted;
    emit({status:'authenticated',user:issued.user,busy:checking?'session':null,error:null});check(revision);if(access?.generation!==acceptedGeneration||state.user!==issued.user)throw errorFor();return issued.user;
  };
  const cookieRequest=(operation:'login'|'refresh'|'logout',json:unknown,signal:AbortSignal)=>authRequest(http,operation,authEndpoints[operation],{method:'POST',json,headers:{Accept:'application/json','Content-Type':'application/json'},signal,timeoutMs,response:'ajax',errorAdapter:ajaxErrorResponseAdapter,adapter:operation==='logout'?logoutAdapter:issuedAdapter,endpointId:`auth.${operation}`,cache:'no-store',credentials:'same-origin',redirect:'error',unauthorized:'ignore'});
  const sessionRequest=(signal:AbortSignal)=>authRequest(http,'session',authEndpoints.session,{method:'GET',headers:{Accept:'application/json'},signal,timeoutMs,response:'ajax',adapter:sessionAdapter,errorAdapter:ajaxErrorResponseAdapter,endpointId:'auth.session',cache:'no-store',credentials:'omit',redirect:'error',unauthorized:'ignore'});
  const passwordErrorAdapter=(value:unknown,context:Parameters<typeof envelope>[1])=>{const wire=parseAjaxResponse(value);if(wire.success||wire.payload!==null||!passwordChangeErrorCodes[context.status]?.includes(wire.code))throw new TypeError('Invalid password error contract');return {code:wire.code,message:'',requestId:wire.request_id};};
  const passwordRequest=(json:unknown,signal:AbortSignal)=>authRequest(http,'password',authEndpoints.password,{method:'PUT',json,headers:{Accept:'application/json','Content-Type':'application/json'},signal,timeoutMs,response:'ajax',adapter:passwordAdapter,errorAdapter:passwordErrorAdapter,endpointId:'auth.password',cache:'no-store',credentials:'omit',redirect:'error',unauthorized:'ignore'});
  const coordinatedRequest=<T>(operation:'login'|'refresh'|'logout'|'password',json:unknown,controller:AbortController,revision:number,accept:(payload:unknown)=>T,beforeSend?:()=>string,budgetMs=timeoutMs)=>{
    let timedOut=false;
    const timer=setTimeout(()=>{timedOut=true;controller.abort();},budgetMs);
    let stop:()=>void=()=>{};
    const cancelled=new Promise<never>((_,reject)=>{stop=()=>reject(timedOut?new HttpError('timeout',{attempts:0,endpointId:`auth.${operation}`}):errorFor(operation));if(controller.signal.aborted)stop();else controller.signal.addEventListener('abort',stop,{once:true});});
    const request=coordination.run(async()=>{
      check(revision,controller.signal);
      const epoch=beforeSend?.();
      const result=await (operation==='password'?passwordRequest(json,controller.signal):cookieRequest(operation,json,controller.signal));
      check(revision,controller.signal);
      const accepted=accept(result.payload);coordination.publish(operation,epoch);return accepted;
    });
    return Promise.race([request,cancelled]).finally(()=>{clearTimeout(timer);controller.signal.removeEventListener('abort',stop);});
  };
  const recover=():Promise<Readonly<AuthUser>|null>=>{
    if(dead||active)return Promise.reject(errorFor());
    if(requireLogin)return Promise.reject(new HttpError('http',{attempts:0,status:401,code:authErrorCodes.required,endpointId:'auth.refresh'}));
    if(refreshFlight&&refreshVersion===version&&!refreshController?.signal.aborted)return refreshFlight;
    const revision=version,controller=new AbortController();refreshController=controller;refreshVersion=revision;bootstrapped=true;clear();
    const flight=Promise.resolve().then(async()=>{
      check(revision,controller.signal);
      return coordinatedRequest('refresh',{},controller,revision,payload=>received(payload as ReturnType<typeof parseIssued>,revision));
    }).catch(value=>{
      const error=normalize(value,'refresh');if(!current(revision))throw errorFor();clear();
      if(error.kind==='http'&&error.status===401){http.resetUnauthorized();emit({status:'anonymous',user:null,busy:null,error:null});return null;}
      emit({status:'unknown',user:null,busy:null,error});throw error;
    }).finally(()=>{if(refreshFlight===flight){refreshFlight=undefined;refreshController=undefined;refreshVersion=undefined;}});
    refreshFlight=flight;emit({status:'unknown',user:null,busy:'refresh',error:null});return flight;
  };
  const acquire=async(signal:AbortSignal,operation?:AuthOperation,currentOnly=false):Promise<AccessLease>=>{
    if(dead||signal.aborted)throw errorFor();
    if(active){
      if(operation==='password'&&active.operation==='password'&&active.lease&&!active.controller.signal.aborted)return active.lease;
      // Only the auth owner's confirmation read may use an unconfirmed login credential.
      if(operation==='session'&&active.candidate&&!active.controller.signal.aborted&&active.candidate.expiry>Date.now())return active.candidate;
      throw errorFor();
    }
    if(currentOnly&&(!access||access.expiry<=Date.now()))throw new HttpError('http',{attempts:0,status:401,code:authErrorCodes.required});
    if(!currentOnly&&(!access||access.expiry<=Date.now()+1000)){
      if(!access&&bootstrapped&&state.status==='anonymous')throw new HttpError('http',{attempts:0,status:401,code:authErrorCodes.required});
      await wait(recover(),signal);
    }
    if(dead||active||signal.aborted)throw errorFor();
    if(!access||access.expiry<=Date.now())throw new HttpError('http',{attempts:0,status:401,code:authErrorCodes.required});
    return {value:access.value,generation:access.generation};
  };
  const unbind=bindHttpAuth(http,{
    mode(path,method,operation){
      let decoded:string;try{decoded=decodeURIComponent(path);}catch{throw new TypeError('Invalid authentication path');}
      const reserved=decoded.toLowerCase()==='/api/v1/auth'||decoded.toLowerCase().startsWith('/api/v1/auth/');
      if(operation){if(path!==authEndpoints[operation as keyof typeof authEndpoints]||method!==(operation==='session'?'GET':operation==='password'?'PUT':'POST'))throw new TypeError('Invalid authentication endpoint');return operation==='session'||operation==='password'?'bearer':'cookie';}
      // 仅公开策略的精确 GET 可在无会话时消费；其他认证端点继续仅由 owner 调用。
      if(reserved)throw new TypeError('Use the auth owner for authentication endpoints');
      if(paths.some(prefix=>path===prefix||prefix.endsWith('/')&&path.startsWith(prefix))){if(/%(?:2f|5c|25)/i.test(path)||/[\\\u0000-\u0020\u007f]/.test(decoded))throw new TypeError('Ambiguous protected path');return 'bearer';}
      return undefined;
    },acquire,
    current:observed=>!dead&&!active&&access?.generation===observed&&access.expiry>Date.now(),
    unauthorized(observed,currentOnly){if(dead||!access||access.generation!==observed||active)return;if(currentOnly){bootstrapped=true;invalidate('anonymous');return;}clear();void recover().catch(()=>{});},
    dispose(){client.destroy();},
  });
  const currentUser=(options:AuthRequestOptions={}):Promise<Readonly<AuthUser>|null>=>{
    if(dead||active)return Promise.reject(errorFor());
    if(sessionFlight&&sessionVersion===version&&!sessionController?.signal.aborted)return wait(sessionFlight,options.signal);
    if(options.signal?.aborted)return Promise.reject(errorFor());
    if(!access&&bootstrapped&&state.status==='anonymous')return Promise.resolve(null);
    const revision=version,controller=new AbortController();let observedGeneration:number|undefined;sessionController=controller;sessionVersion=revision;
    const flight=Promise.resolve().then(async()=>{
      try{
        const lease=await acquire(controller.signal);observedGeneration=lease.generation;check(revision,controller.signal);emit({busy:'session',error:null});
        const result=await sessionRequest(controller.signal);
        check(revision,controller.signal);if(!access||access.generation!==lease.generation)throw errorFor();
        http.resetUnauthorized();emit({status:'authenticated',user:result.payload.user,busy:null,error:null});check(revision);return state.user;
      }catch(value){const error=normalize(value,'session');if(!current(revision)||observedGeneration!==undefined&&observedGeneration!==generation)throw errorFor();
        if(error.status===401){clear();emit({status:'anonymous',user:null,busy:null,error:null});return null;}
        if(error.status!==403)clear();emit({status:'unknown',user:null,busy:null,error});throw error;
      }
    }).finally(()=>{if(sessionFlight===flight){sessionFlight=undefined;sessionController=undefined;sessionVersion=undefined;
      // A newer refresh may keep valid access after rejecting an obsolete read.
      if(current(revision)&&access&&state.status==='authenticated'&&state.busy==='session')emit({busy:null});
    }});
    sessionFlight=flight;emit({busy:'session',error:null});return wait(flight,options.signal);
  };
  const confirmMutation=async(intent:NonNullable<typeof active>)=>{
    const {version:revision,controller}=intent;
    const checkIntent=()=>{check(revision,controller.signal);if(active!==intent)throw errorFor();};
    try{
      await coordinatedRequest('refresh',{},controller,revision,payload=>{
        checkIntent();intent.candidate={...payload as ReturnType<typeof parseIssued>,generation:++generation};
      });
    }catch(error){checkIntent();if(isHttpError(error)&&error.kind==='http'&&error.status===401)return null;throw error;}
    checkIntent();const candidate=intent.candidate!;
    const result=await sessionRequest(controller.signal);checkIntent();
    if(generation!==candidate.generation||intent.candidate!==candidate||result.payload.user.id!==candidate.user.id)throw errorFor();
    return {...candidate,user:result.payload.user};
  };
  const mutate=async(operation:'login'|'logout',json:unknown,options:AuthRequestOptions)=>{
    if(dead||active||options.signal?.aborted)throw errorFor();
    const prior=state,priorAccess=access,revision=++version,controller=new AbortController();
    sessionController?.abort();clear();active={operation,controller,version:revision};
    const cancel=()=>{if(active?.version===revision)active.controller.abort();};options.signal?.addEventListener('abort',cancel,{once:true});
    emit({status:'unknown',user:null,busy:operation,error:null});
    try{
      return await coordinatedRequest(operation,json,controller,revision,payload=>{
        active=undefined;
        if(operation==='login')return received(payload as ReturnType<typeof parseIssued>,revision);
        bootstrapped=true;http.resetUnauthorized();emit({status:'anonymous',user:null,busy:null,error:null});check(revision);return null;
      });
    }catch(value){const error=normalize(value,operation);if(!current(revision)||active?.version!==revision)throw errorFor();
      const denied=operation==='login'&&error.kind==='http'&&error.status!==undefined&&error.status>=400&&error.status<500&&error.status!==409;
      if(denied){active=undefined;access=priorAccess;emit({...prior,busy:null,error});throw error;}
      clear();bootstrapped=false;
      // Keep the mutation intent until the ordinary read confirms its target identity.
      // Cancellation ends waiting and cannot undo a committed cookie change.
      if(error.kind!=='cancel'&&!options.signal?.aborted){
        const intent=active={operation,controller:new AbortController(),version:revision};
        emit({status:'unknown',user:null,busy:operation,error:null});
        try{
          const confirmed=await confirmMutation(intent);check(revision,options.signal);
          if(active!==intent)throw errorFor();
          if(operation==='login'&&confirmed&&confirmed.user.username===(json as LoginCredentials).username){
            active=undefined;return received(confirmed,revision);
          }
          if(operation==='logout'&&!confirmed){
            active=undefined;bootstrapped=true;http.resetUnauthorized();emit({status:'anonymous',user:null,busy:null,error:null});check(revision);return null;
          }
          // An absent or different account does not confirm this login submission.
          active=undefined;clear();bootstrapped=!confirmed;
          emit({status:confirmed?'unknown':'anonymous',user:null,busy:null,error});
        }catch{
          if(!current(revision)||active!==intent)throw errorFor();
          active=undefined;clear();
          if(options.signal?.aborted){const cancelled=errorFor(operation);emit({status:'unknown',user:null,busy:null,error:cancelled});throw cancelled;}
          emit({status:'unknown',user:null,busy:null,error});
        }
      }else {active=undefined;emit({status:'unknown',user:null,busy:null,error});}
      throw error;
    }finally{options.signal?.removeEventListener('abort',cancel);if(operation==='login')(json as LoginCredentials).password='';}
  };
  const changePassword=async(json:PasswordChangeCredentials,options:AuthRequestOptions)=>{
    let cancel:()=>void=()=>{};
    try{
      if(dead||active||options.signal?.aborted)throw errorFor('password');
      const before=version,started=Date.now(),waiting=new AbortController();let expired=false;
      const stopWaiting=()=>waiting.abort(),timer=setTimeout(()=>{expired=true;waiting.abort();},timeoutMs);
      options.signal?.addEventListener('abort',stopWaiting,{once:true});
      let lease:AccessLease;
      try{lease=await wait(acquire(waiting.signal),waiting.signal);}catch(error){if(expired)throw new HttpError('timeout',{attempts:0,endpointId:'auth.password'});throw error;}
      finally{clearTimeout(timer);options.signal?.removeEventListener('abort',stopWaiting);}
      check(before,options.signal);if(active)throw errorFor('password');
      const remaining=timeoutMs-(Date.now()-started);if(remaining<=0)throw new HttpError('timeout',{attempts:0,endpointId:'auth.password'});
      const prior=state,priorAccess=access,revision=++version,controller=new AbortController();let sent=false;
      sessionController?.abort();refreshController?.abort();clear();
      const intent=active={operation:'password' as const,lease,controller,version:revision,epoch:undefined as string|undefined};
      cancel=()=>controller.abort();options.signal?.addEventListener('abort',cancel,{once:true});
      emit({busy:'password',error:null});
      try{
        await coordinatedRequest('password',json,controller,revision,()=>{
          active=undefined;requireLogin=true;bootstrapped=true;http.resetUnauthorized();invalidate('anonymous');
        },()=>{intent.epoch=coordination.reserve();sent=true;return intent.epoch;},remaining);
      }catch(value){
        const error=normalize(value,'password');if(!current(revision)||active!==intent)throw errorFor('password');
        active=undefined;
        // Only a complete official rejection can preserve the prior identity.
        // A lost reply, conflict or 401 cannot authorize replay or token recovery.
        const rejected=isPasswordChangeRejection(error);
        if(!sent||rejected){access=priorAccess?{...priorAccess,generation:++generation}:undefined;emit({...prior,busy:null,error});}
        else {requireLogin=true;bootstrapped=true;http.resetUnauthorized();invalidate('anonymous',error);coordination.publish('password',intent.epoch);}
        throw error;
      }
    }finally{options.signal?.removeEventListener('abort',cancel);json.current_password='';json.new_password='';}
  };
  const client:AuthClient={
    getState:()=>state,subscribe(listener){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},currentUser,
    refresh:options=>options?.signal?.aborted?Promise.reject(errorFor()):wait(recover(),options?.signal),
    async login(credentials,options={}){
      if(!credentials||typeof credentials.username!=='string'||!credentials.username.trim()||credentials.username.trim().length>128||typeof credentials.password!=='string'||!credentials.password||credentials.password.length>4096)throw new HttpError('parse',{attempts:0,endpointId:'auth.login'});
      return (await mutate('login',{username:credentials.username.trim(),password:credentials.password},options))!;
    },
    async logout(options={}){await mutate('logout',{},options);},
    async changePassword(credentials,options={}){
      if(!credentials||typeof credentials.current_password!=='string'||!credentials.current_password||countPasswordCodePoints(credentials.current_password)===null||new TextEncoder().encode(credentials.current_password).length>128||typeof credentials.new_password!=='string'||validatePassword(credentials.new_password))throw new HttpError('parse',{attempts:0,endpointId:'auth.password'});
      await changePassword({current_password:credentials.current_password,new_password:credentials.new_password},options);
    },
    cancel(){if(dead)return;const changing=active?.operation==='password',epoch=active?.epoch;if(changing)requireLogin=true;bootstrapped=requireLogin;invalidate(requireLogin?'anonymous':'unknown',errorFor(changing?'password':undefined));if(changing&&epoch)coordination.publish('password',epoch);},
    expire(){if(dead)return;const changing=active?.operation==='password',epoch=active?.epoch;if(changing)requireLogin=true;bootstrapped=true;invalidate('anonymous');if(changing&&epoch)coordination.publish('password',epoch);},
    destroy(){if(dead)return;if(active?.operation==='password'&&active.epoch)coordination.publish('password',active.epoch);dead=true;invalidate('unknown');unbind();coordination.close();listeners.clear();},
  };
  return client;
}

export const loginPageDefaultLabels={username:'Username',password:'Password',showPassword:'Show password',hidePassword:'Hide password',submit:'Sign in',checking:'Checking your sign-in…',signingIn:'Signing in…',usernameRequired:'Enter your username.',passwordRequired:'Enter your password.',credentialsError:'The username or password is incorrect.',forbidden:'Sign in is not allowed.',rateLimited:'Too many attempts. Try again later.',timeout:'The request timed out. Please try again.',network:'Could not connect. Check your connection and try again.',error:'Sign in could not be completed.',cancelled:'Waiting cancelled. The server may have completed the request.',checkSession:'Retry connection',opening:'Opening app…',navigationError:'You are signed in, but the app could not be opened. Try again.',retryNavigation:'Try opening app again'} as const;
export type LoginPageLabels={ [Key in Exclude<keyof typeof loginPageDefaultLabels,'showPassword'|'hidePassword'>]:string } & {/** Full-page password toggle names; omitted fields retain English defaults. */showPassword?:string;hidePassword?:string};
/** Both layouts are centered single columns; fullscreen omits the card surface. */
export type LoginPageLayout='fullscreen'|'card';
export interface LoginPageConfig {layout?:LoginPageLayout;productName:string;title?:string;description?:string;logo?:{src:string;alt?:string};returnTo?:string;fallbackReturnTo?:string;labels?:Partial<LoginPageLabels>}
/** Presentation only; domain forms and requests remain owned by the host. */
export type AuthPageConfig=Pick<LoginPageConfig,'layout'|'productName'|'description'|'logo'>&{title:string};
export function resolveLoginPageConfig(input:LoginPageConfig){
  const string=(value:unknown,limit:number)=>{if(typeof value!=='string'||!value||value.length>limit)throw new TypeError('Invalid login page text');return value;};
  const labels=Object.freeze(Object.fromEntries(Object.entries(loginPageDefaultLabels).map(([key,value])=>[key,input.labels?.[key as keyof LoginPageLabels]===undefined?value:string(input.labels[key as keyof LoginPageLabels],300)]))) as Readonly<Required<LoginPageLabels>>;
  let logo:Readonly<{src:string;alt:string}>|undefined;
  if(input.logo){let url:URL;try{url=new URL(input.logo.src,'https://xui.invalid');}catch{throw new TypeError('Invalid login logo');}if(!['http:','https:'].includes(url.protocol)||url.username||url.password||input.logo.src.length>2048)throw new TypeError('Invalid login logo');logo=Object.freeze({src:input.logo.src,alt:input.logo.alt??input.productName});}
  const layout=input.layout??'card';if(layout!=='fullscreen'&&layout!=='card')throw new TypeError('Invalid login layout');
  return Object.freeze({layout,productName:string(input.productName,128),title:string(input.title??labels.submit,200),description:input.description===undefined?undefined:string(input.description,600),logo,returnTo:resolveLoginReturnTo(input.returnTo,input.fallbackReturnTo),labels});
}
export function getLoginPageError(error:HttpError,labels:Readonly<LoginPageLabels>):string{
  return error.kind==='cancel'?labels.cancelled:error.status===401?labels.credentialsError:error.status===403?labels.forbidden:error.status===429?labels.rateLimited:error.kind==='timeout'?labels.timeout:error.kind==='network'?labels.network:labels.error;
}

/** Host-owned service/source validation and standards-based actions; no password in callbacks. */
export interface LoginExtensionContext {username:string;signal:AbortSignal}
export interface LoginPageAction {id:string;label:string;run:(context:LoginExtensionContext)=>void|Promise<void>;disabled?:boolean}
export interface LoginPageExtensions {beforeSubmit?:(context:LoginExtensionContext)=>void|Promise<void>;actions?:readonly LoginPageAction[];errorLabel?:string}
/** Promptly cancel local waiting even when a host extension does not cooperate. */
export function runLoginPageExtension(callback:(context:LoginExtensionContext)=>void|Promise<void>,context:LoginExtensionContext):Promise<void>{
 return new Promise((resolve,reject)=>{let settled=false;const done=(failed:boolean,error?:unknown)=>{if(settled)return;settled=true;context.signal.removeEventListener('abort',cancel);failed?reject(error):resolve();},cancel=()=>done(true,new HttpError('cancel'));if(context.signal.aborted){cancel();return;}context.signal.addEventListener('abort',cancel,{once:true});Promise.resolve().then(()=>{if(context.signal.aborted)throw new HttpError('cancel');return callback(context);}).then(()=>done(false),error=>done(true,error));});
}
