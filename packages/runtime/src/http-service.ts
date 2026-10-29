import {registerHttp,inspectHttp,authOperation,requiresCurrentAccess,type AccessLease} from './http-auth-internal.js';
import {consumeEvents,boundedStreamText,eventLimits,eventIdHeader,type ServerSentEvent,type SseReadOptions} from './http-sse.js';
/** JSON contract of coffeehc/httpx/httpxcommons. success is the business outcome; code remains required metadata. No data/msg aliases. */
export interface AjaxResponse<T=unknown>{success:boolean;message:string;payload:T;request_id:string;code:number;redirect?:string}
export type HttpErrorKind='cancel'|'network'|'timeout'|'http'|'parse'|'business';
export interface HttpMetadata{
  status?:number;code?:number|string;requestId?:string;bodyRequestId?:string;headerRequestId?:string;
  endpointId?:string;attempts:number;retryAfterMs?:number;readFailure?:'timeout'|'network'|'parse';
}
const messages:Record<HttpErrorKind,string>={cancel:'The request was cancelled.',network:'The service could not be reached.',timeout:'The request exceeded its time budget.',http:'The request failed.',parse:'The response did not match the expected contract.',business:'The operation was rejected.'};
export type HttpErrorDetails=null|boolean|number|string|readonly HttpErrorDetails[]|{readonly [key:string]:HttpErrorDetails};
export interface HttpBusinessError {code:number|string;message:string;requestId:string;details?:HttpErrorDetails}
/** Explicit contract projection; neither this data nor server messages enter default feedback/serialization. */
export type ErrorResponseAdapter=(value:unknown,context:HttpResponseContext)=>HttpBusinessError;
const businessErrors=new WeakMap<HttpError,Readonly<HttpBusinessError>>();
function freezeDetails(value:unknown):HttpErrorDetails{
  let count=0;const seen=new Set<object>();
  const visit=(item:unknown,depth:number):HttpErrorDetails=>{if(++count>512||depth>8)throw new TypeError('Invalid error details');if(item===null||typeof item==='boolean')return item;if(typeof item==='string'){if(item.length>4096)throw new TypeError('Invalid error details');return item;}if(typeof item==='number'&&Number.isFinite(item)&&(!Number.isInteger(item)||Number.isSafeInteger(item)))return item;if(typeof item!=='object'||!item||seen.has(item)||![null,Object.prototype,Array.prototype].includes(Object.getPrototypeOf(item)))throw new TypeError('Invalid error details');seen.add(item);let result:HttpErrorDetails;if(Array.isArray(item)){const output:HttpErrorDetails[]=[];for(let index=0;index<item.length;index++){const field=Object.getOwnPropertyDescriptor(item,String(index));if(!field||!('value'in field))throw new TypeError('Invalid error details');output.push(visit(field.value,depth+1));}result=Object.freeze(output);}else{const output:Record<string,HttpErrorDetails>=Object.create(null);for(const [key,field] of Object.entries(Object.getOwnPropertyDescriptors(item))){if(!('value'in field)||key.length>256)throw new TypeError('Invalid error details');output[key]=visit(field.value,depth+1);}result=Object.freeze(output);}seen.delete(item);return result;};
  const result=visit(value,0);if(new TextEncoder().encode(JSON.stringify(result)).length>16384)throw new TypeError('Invalid error details');return result;
}
function businessError(value:HttpBusinessError):Readonly<HttpBusinessError>{
  if(!value||typeof value!=='object'||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Object.values(Object.getOwnPropertyDescriptors(value)).some(field=>!('value'in field))||['code','message','requestId'].some(key=>!Object.hasOwn(value,key))||!(typeof value.code==='number'&&Number.isSafeInteger(value.code)||typeof value.code==='string'&&/^[A-Za-z0-9._:-]{1,128}$/.test(value.code))||typeof value.message!=='string'||value.message.length>2048||typeof value.requestId!=='string'||value.requestId.length>256||/[\u0000-\u001f\u007f]/.test(value.requestId))throw new TypeError('Invalid structured error');
  return Object.freeze({code:value.code,message:value.message,requestId:value.requestId,...(value.details===undefined?{}:{details:freezeDetails(value.details)})});
}
export const ajaxErrorResponseAdapter:ErrorResponseAdapter=value=>{const wire=parseAjaxResponse(value);return businessError({code:wire.code,message:wire.message,requestId:wire.request_id});};
/** xLead's exact {error:{code,message,request_id}} contract. Details need an explicit safe projector. */
export function createJsonApiErrorAdapter({projectDetails}:{projectDetails?:(error:Readonly<Record<string,unknown>>)=>unknown}={}):ErrorResponseAdapter{
  return value=>{if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('Invalid JSON API error');const field=Object.getOwnPropertyDescriptor(value,'error');if(!field||!('value'in field)||!field.value||typeof field.value!=='object'||Array.isArray(field.value)||Object.values(Object.getOwnPropertyDescriptors(field.value)).some(item=>!('value'in item)))throw new TypeError('Invalid JSON API error');const error=field.value as Record<string,unknown>;const details=projectDetails?.(error);return businessError({code:error.code as string,message:error.message as string,requestId:error.request_id as string,...(details===undefined?{}:{details:freezeDetails(details)})});};
}
/** Safe feedback/diagnostics: deliberately contains no URL, raw body, headers or cause. */
export class HttpError extends Error{
  readonly kind:HttpErrorKind;readonly metadata:Readonly<HttpMetadata>;
  constructor(kind:HttpErrorKind,metadata:HttpMetadata={attempts:1},business?:HttpBusinessError){
    super(kind==='http'&&metadata.status===401?'Authentication is required.':kind==='http'&&metadata.status===403?'Permission was denied.':messages[kind]);
    this.name='HttpError';this.kind=kind;const {status,code,bodyRequestId,headerRequestId,endpointId,attempts,retryAfterMs,readFailure}=metadata;
    this.metadata=Object.freeze({status,code,bodyRequestId,headerRequestId,endpointId,attempts,retryAfterMs,readFailure,requestId:bodyRequestId||headerRequestId||metadata.requestId});
    if(business)businessErrors.set(this,businessError(business));
  }
  get status(){return this.metadata.status;}get code(){return this.metadata.code;}get requestId(){return this.metadata.requestId;}
  get business(){return businessErrors.get(this);}
  toJSON(){return {name:this.name,kind:this.kind,message:this.message,...this.metadata};}
}
export function isHttpError(value:unknown):value is HttpError{return value instanceof HttpError;}
export function getHttpErrorMessage(value:unknown):string{return isHttpError(value)?value.message:messages.http;}
export function parseAjaxResponse<T=unknown>(value:unknown):AjaxResponse<T>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('Expected an AjaxResponse object');
  const object=value as Record<string,unknown>;
  if(typeof object.success!=='boolean'||typeof object.message!=='string'||!Object.hasOwn(object,'payload')||typeof object.request_id!=='string'||!Number.isSafeInteger(object.code)||object.redirect!==undefined&&typeof object.redirect!=='string')throw new TypeError('Invalid AjaxResponse fields');
  return value as AjaxResponse<T>;
}
export interface HttpResponseContext{status:number;headerRequestId?:string;endpointId?:string;attempts:number}
export interface AdaptedResponse<T>{payload:T;code?:number;bodyRequestId?:string;redirect?:string}
export type ResponseAdapter<T>=(value:unknown,context:HttpResponseContext)=>AdaptedResponse<T>;
/** Defaults to success=true for any valid code. successCode explicitly opts into an additional endpoint-specific code check. */
export function createAjaxResponseAdapter<T=unknown>({successCode}:{successCode?:number}={}):ResponseAdapter<T>{
  if(successCode!==undefined&&!Number.isSafeInteger(successCode))throw new TypeError('successCode must be a safe integer');
  return (value,context)=>{const wire=parseAjaxResponse<T>(value);const metadata={...context,code:wire.code,bodyRequestId:wire.request_id};
    if(!wire.success||successCode!==undefined&&wire.code!==successCode)throw new HttpError('business',metadata,ajaxErrorResponseAdapter(wire,context));
    return {payload:wire.payload,code:wire.code,bodyRequestId:wire.request_id,redirect:wire.redirect};};
}
export const ajaxResponseAdapter=createAjaxResponseAdapter();
export type ResponseMode='ajax'|'json'|'text'|'blob'|'empty';
export interface ReadRetry{ idempotentRead:true;maxAttempts:number;delayMs?:number;maxDelayMs?:number;statuses?:readonly number[] }
export interface HttpRequestOptions<T=unknown>{
  method?:string;headers?:HeadersInit;body?:BodyInit|null;json?:unknown;signal?:AbortSignal;
  timeoutMs?:number;response?:ResponseMode;adapter?:ResponseAdapter<T>;endpointId?:string;
  errorAdapter?:ErrorResponseAdapter;
  retry?:ReadRetry;detectAjaxErrors?:boolean;credentials?:RequestCredentials;cache?:RequestCache;redirect?:RequestRedirect;
  /** Login failures must not consume the shared session-expiry notification latch. */
  unauthorized?:'notify'|'ignore';
}
export interface HttpClientOptions{
  baseURL:string;fetch?:typeof globalThis.fetch;headers?:HeadersInit;getHeaders?:()=>HeadersInit|Promise<HeadersInit>;
  /** Explicit hierarchical application origin (for example wails://wails). Requires a native fetch bridge. */
  nativeOrigin?:string;
  response?:ResponseMode;adapter?:ResponseAdapter<unknown>;timeoutMs?:number;credentials?:RequestCredentials;
  errorAdapter?:ErrorResponseAdapter;
  onUnauthorized?:(error:HttpError)=>void|Promise<void>;onError?:(error:HttpError)=>void|Promise<void>;
}
export interface HttpResponseHeaders {contentType:string|null;contentDisposition:string|null;contentLength:string|null}
export interface HttpResponse<T>{payload:T;status:number;code?:number;requestId?:string;bodyRequestId?:string;headerRequestId?:string;redirect?:string;headers:Readonly<HttpResponseHeaders>}
export interface HttpClient{
  request:<T=unknown>(path:string,options?:HttpRequestOptions<T>)=>Promise<HttpResponse<T>>;
  /** Read one GET event stream until EOF; reject on cancellation/error. Session streams use current access only. */
  readEvents(path:string,options:SseReadOptions):Promise<void>;
  readEvents<T>(path:string,options:SseReadOptions<T>&{project:(event:Readonly<ServerSentEvent>)=>T}):Promise<void>;
  resetUnauthorized:()=>void;destroy:()=>void;
}
const validMs=(value:number,name:string)=>{if(!Number.isFinite(value)||value<=0||value>2147483647)throw new RangeError(`${name} must be positive and fit a browser timer`);};
const looksLikeAjax=(value:unknown)=>!!value&&typeof value==='object'&&['success','message','payload','request_id','code'].every(key=>Object.hasOwn(value,key));
function retryAfter(value:string|null):number|undefined{
  if(!value)return;const ms=/^\d+$/.test(value)?Number(value)*1000:Date.parse(value)-Date.now();return Number.isFinite(ms)?Math.max(0,ms):undefined;
}

/** One client per host transport/auth boundary. No cache, palette, credentials store or router. */
/** Internal factory; public consumers obtain the application service from services.ts. */
export function buildHttpClient(options:HttpClientOptions,beforeRequest?:()=>void):HttpClient{
  let base:URL;try{base=new URL(options.baseURL);}catch{throw new TypeError('An absolute HTTP baseURL is required');}
  let native:URL|undefined;
  if(options.nativeOrigin!==undefined){
    if(typeof options.nativeOrigin!=='string')throw new TypeError('Declare a native origin string');
    try{native=new URL(options.nativeOrigin);}catch{throw new TypeError('Declare a hierarchical native origin');}
    if(typeof options.fetch!=='function'||['http:','https:','data:','blob:','file:','javascript:','mailto:'].includes(native.protocol)||!native.hostname||native.username||native.password||native.search||native.hash||native.pathname&&native.pathname!=='/'||!options.nativeOrigin.slice(native.protocol.length).startsWith('//'))throw new TypeError('Declare an application origin and native fetch bridge');
  }
  const sameOrigin=(url:URL)=>native?url.protocol===native.protocol&&url.hostname.toLowerCase()===native.hostname.toLowerCase()&&url.port===native.port: url.origin===base.origin;
  if(base.username||base.password||(native?!sameOrigin(base):!['http:','https:'].includes(base.protocol)))throw new TypeError('An absolute configured baseURL without URL credentials is required');
  if(options.timeoutMs!==undefined)validMs(options.timeoutMs,'timeoutMs');
  const send=options.fetch??globalThis.fetch;let dead=false,authEpoch=0,unauthorized=false;const active=new Set<()=>void>();
  const notifyUnauthorized=(error:HttpError,epoch:number)=>{if(dead||epoch!==authEpoch||unauthorized)return;unauthorized=true;try{Promise.resolve(options.onUnauthorized?.(error)).catch(()=>{});}catch{/* Host feedback cannot replace an HTTP fact. */}};
  async function request<T=unknown>(path:string,init:HttpRequestOptions<T>={},events?:SseReadOptions<unknown>):Promise<HttpResponse<T>>{
    if(dead)throw new HttpError('cancel');
    let url:URL;try{url=new URL(path,base);}catch{throw new TypeError('Invalid request path');}
    if(!sameOrigin(url)||url.username||url.password)throw new TypeError('Requests must use the configured origin without URL credentials');
    if(native&&init.redirect!==undefined&&init.redirect!=='error')throw new TypeError('Native transports must reject automatic redirects');
    const method=(init.method??'GET').toUpperCase(),mode=init.response??options.response??'ajax',retry=init.retry,timeout=init.timeoutMs??options.timeoutMs??(mode==='blob'?120000:30000);
    const limits=events?eventLimits(events):undefined,idleTimeout=events?.idleTimeoutMs??60000,lastId=events?eventIdHeader(events.lastEventId):undefined;
    if(events){if(typeof events.onEvent!=='function'||events.project!==undefined&&typeof events.project!=='function'||events.onOpen!==undefined&&typeof events.onOpen!=='function')throw new TypeError('Invalid SSE callbacks');if(idleTimeout!==0)validMs(idleTimeout,'idleTimeoutMs');}
    if(!['ajax','json','text','blob','empty'].includes(mode))throw new TypeError('Unsupported response mode');
    if(init.unauthorized!==undefined&&!['notify','ignore'].includes(init.unauthorized))throw new TypeError('Unsupported unauthorized policy');
    const notify401=init.unauthorized!=='ignore';
    if(init.endpointId!==undefined&&!/^[A-Za-z0-9._:-]{1,120}$/.test(init.endpointId))throw new TypeError('endpointId must be an opaque identifier, not a URL');
    if(timeout!==undefined)validMs(timeout,'timeoutMs');
    if(init.adapter&&['empty'].includes(mode))throw new TypeError('Empty mode does not use an adapter');
    if('json' in init&&init.body!==undefined)throw new TypeError('Choose json or body');
    if(retry){if(retry.idempotentRead!==true||!['GET','HEAD'].includes(method)||init.body!==undefined||'json' in init)throw new TypeError('Retry requires an explicitly idempotent GET/HEAD without a body');
      if(!Number.isSafeInteger(retry.maxAttempts)||retry.maxAttempts<1||retry.maxAttempts>5)throw new RangeError('maxAttempts must be 1 through 5');
      if(retry.delayMs!==undefined)validMs(retry.delayMs,'delayMs');if(retry.maxDelayMs!==undefined)validMs(retry.maxDelayMs,'maxDelayMs');
      if(retry.statuses?.some(status=>!Number.isInteger(status)||status<400||status>599))throw new TypeError('Invalid retry statuses');}
    let body=init.body;if('json' in init){try{body=JSON.stringify(init.json);}catch{throw new TypeError('JSON body must be serializable');}if(body===undefined)throw new TypeError('JSON body must be serializable');}
    beforeRequest?.();
    const currentOnly=!!events||requiresCurrentAccess(init),binding=inspectHttp(client)?.binding,managed=binding?.mode(url.pathname,method,authOperation(init));
    if(events&&managed&&!notify401)throw new TypeError('Session SSE must notify its auth owner');
    if(managed&&(init.credentials!==undefined&&init.credentials!==(managed==='cookie'?'same-origin':'omit')||init.redirect!==undefined&&init.redirect!=='error'||retry))throw new TypeError('Managed authentication forbids credential overrides, redirects and generic retries');
    const controller=new AbortController();let epoch=authEpoch,lease:AccessLease|undefined;let stopKind:'cancel'|'timeout'='cancel',timer:ReturnType<typeof setTimeout>|undefined;
    let reader:ReadableStreamDefaultReader<Uint8Array>|undefined,unwatch:(()=>void)|undefined;
    let metadata:HttpMetadata={attempts:0,endpointId:init.endpointId};
    const stopped=()=>{const knownFailure=stopKind==='timeout'&&(metadata.status??0)>=400;return new HttpError(knownFailure?'http':stopKind,{...metadata,...(knownFailure?{readFailure:'timeout' as const}:{})});};
    const stop=(kind:'cancel'|'timeout')=>{if(controller.signal.aborted)return;stopKind=kind;controller.abort();if(reader)void reader.cancel().catch(()=>{});};
    const check=()=>{if(controller.signal.aborted)throw stopped();if(currentOnly&&lease&&metadata.status!==401&&!binding!.current(lease.generation))throw new HttpError('cancel',metadata);};
    let rejectAbort:(error:HttpError)=>void=()=>{};const aborted=new Promise<never>((_,reject)=>{rejectAbort=reject;});
    const abort=()=>rejectAbort(stopped()),external=()=>stop('cancel'),dispose=()=>stop('cancel');
    controller.signal.addEventListener('abort',abort,{once:true});active.add(dispose);
    if(init.signal?.aborted)external();else init.signal?.addEventListener('abort',external,{once:true});
    if(timeout!==undefined)timer=setTimeout(()=>stop('timeout'),timeout);
    const delay=(ms:number)=>new Promise<void>((resolve,reject)=>{if(controller.signal.aborted){reject(stopped());return;}const cancel=()=>{clearTimeout(wait);controller.signal.removeEventListener('abort',cancel);reject(stopped());};const wait=setTimeout(()=>{controller.signal.removeEventListener('abort',cancel);resolve();},ms);controller.signal.addEventListener('abort',cancel,{once:true});});
    const normalize=(error:unknown):HttpError=>{if(controller.signal.aborted)return stopped();if(isHttpError(error))return error;return new HttpError('network',metadata);};
    const read=async<V>(operation:()=>Promise<V>)=>{try{return await operation();}catch(error){if(controller.signal.aborted)throw stopped();throw new HttpError('network',metadata);}};
    const run=async()=>{
      for(let attempt=1;attempt<=(retry?.maxAttempts??1);attempt++){
        metadata={attempts:attempt,endpointId:init.endpointId};check();
        try{
          const headers=new Headers(options.headers);const provided=await options.getHeaders?.();check();if(provided)new Headers(provided).forEach((value,key)=>headers.set(key,value));if(init.headers)new Headers(init.headers).forEach((value,key)=>headers.set(key,value));
          if(managed){if(headers.has('authorization')||headers.has('cookie')||headers.has('x-api-key'))throw new HttpError('parse',{attempts:0,endpointId:init.endpointId});if(managed==='bearer'){lease=await binding!.acquire(controller.signal,authOperation(init),currentOnly);check();epoch=authEpoch;headers.set('Authorization',`Bearer ${lease.value}`);if(events)unwatch=binding!.watchAccess(lease.generation,()=>{if(metadata.status!==401)stop('cancel');});}}
          if(events){headers.set('accept','text/event-stream');if(lastId!==undefined)headers.set('last-event-id',lastId);}
          if(!headers.has('accept')&&(['ajax','json'].includes(mode)||mode==='blob'&&init.detectAjaxErrors))headers.set('accept','application/json');if('json' in init&&!headers.has('content-type'))headers.set('content-type','application/json');
          // Multipart boundaries must describe the platform's actual encoded body,
          // including when an application supplied a default JSON Content-Type.
          if(typeof FormData!=='undefined'&&body instanceof FormData)headers.delete('content-type');
          const response=await send(url.href,{method,headers,body,signal:controller.signal,credentials:managed?(managed==='cookie'?'same-origin':'omit'):init.credentials??options.credentials??'same-origin',cache:init.cache,redirect:native||managed?'error':init.redirect});
          if(events){if(controller.signal.aborted){void response.body?.cancel().catch(()=>{});check();}reader=response.body?.getReader();}check();
          if((native||managed||events)&&response.url){let final:URL;try{final=new URL(response.url);}catch{throw new HttpError('network',{...metadata,status:response.status});}if(!sameOrigin(final)||final.username||final.password)throw new HttpError('network',{...metadata,status:response.status});}
          metadata={...metadata,status:response.status,headerRequestId:response.headers.get('X-Request-ID')??undefined,retryAfterMs:retryAfter(response.headers.get('Retry-After'))};
          if(response.status===401&&notify401){if(lease)binding!.unauthorized(lease.generation,currentOnly);notifyUnauthorized(new HttpError('http',metadata),epoch);}
          const context:HttpResponseContext={status:response.status,headerRequestId:metadata.headerRequestId,endpointId:init.endpointId,attempts:attempt};
          const adapter=init.adapter??(init.response===undefined||mode===(options.response??'ajax')?options.adapter:undefined)??(mode==='ajax'?ajaxResponseAdapter:undefined);let adapted:AdaptedResponse<unknown>;
          if(!response.ok){
            let value:unknown,business:HttpBusinessError|undefined;try{const text=events?await boundedStreamText(async()=>{if(!reader)return {done:true,value:undefined};const chunk=await read(()=>reader!.read());check();return chunk;},65536):await response.text();check();try{if(new TextEncoder().encode(text).length>65536)throw new TypeError('Error response too large');value=JSON.parse(text);const project=init.errorAdapter??options.errorAdapter??(looksLikeAjax(value)?ajaxErrorResponseAdapter:undefined);if(project){business=businessError(project(value,context));metadata={...metadata,code:business.code,bodyRequestId:business.requestId};}}catch{metadata={...metadata,readFailure:'parse'};}
            }catch(error){if(controller.signal.aborted)throw stopped();metadata={...metadata,readFailure:events&&!(isHttpError(error)&&error.kind==='network')?'parse':'network'};}
            throw new HttpError('http',metadata,business);
          }
          try{
            if(events){
              if(response.status!==204){
                if(response.status!==200||!reader)throw new TypeError('Expected an event stream');
                if(!/^text\/event-stream(?:\s*;|\s*$)/i.test(response.headers.get('content-type')??'')){
                  if(/^application\/(?:[a-z0-9!#$&^_.+-]+\+)?json(?:\s*;|\s*$)/i.test(response.headers.get('content-type')??'')){
                    const text=await boundedStreamText(async()=>{const chunk=await read(()=>reader!.read());check();return chunk;},65536),value=JSON.parse(text);
                    if(looksLikeAjax(value))ajaxResponseAdapter(value,context);
                  }
                  throw new TypeError('Expected an event stream');
                }
                clearTimeout(timer);timer=undefined;
                const idle=()=>{clearTimeout(timer);if(idleTimeout)timer=setTimeout(()=>stop('timeout'),idleTimeout);};idle();
                await events.onOpen?.(Object.freeze(context),controller.signal);check();
                await consumeEvents(async()=>{const chunk=await read(()=>reader!.read());check();idle();return chunk;},limits!,events.lastEventId??'',async event=>{check();const value=events.project?events.project(event):event;check();await events.onEvent(value,controller.signal);check();});
              }
              adapted={payload:undefined};
            }
            else if(mode==='empty'){if(response.body)await read(()=>response.body!.cancel());adapted={payload:undefined};}
            else if(mode==='blob'){
              const payload=await read(()=>response.blob());check();adapted={payload};
              if(init.detectAjaxErrors&&/^application\/(?:[a-z0-9!#$&^_.+-]+\+)?json(?:\s*;|\s*$)/i.test(response.headers.get('content-type')??'')&&!/^\s*attachment\b/i.test(response.headers.get('content-disposition')??'')){let value:unknown;try{value=JSON.parse(await payload.text());}catch{}check();if(looksLikeAjax(value))adapted={...ajaxResponseAdapter(value,context),payload};}
              if(adapter)adapted=adapter(payload,context);
            }else{
              const text=await read(()=>response.text());check();const value=mode==='text'?text:JSON.parse(text);if(mode==='ajax'&&looksLikeAjax(value)){const wire=parseAjaxResponse(value);metadata={...metadata,code:wire.code,bodyRequestId:wire.request_id};}adapted=adapter?adapter(value,context):{payload:value};
            }
          }catch(error){if(controller.signal.aborted)throw stopped();if(isHttpError(error))throw error;throw new HttpError('parse',metadata);}
          check();if(!adapted||typeof adapted!=='object'||!Object.hasOwn(adapted,'payload')||adapted.code!==undefined&&!Number.isSafeInteger(adapted.code)||adapted.bodyRequestId!==undefined&&typeof adapted.bodyRequestId!=='string'||adapted.redirect!==undefined&&typeof adapted.redirect!=='string')throw new HttpError('parse',metadata);
          const header=(name:string,max:number)=>{const value=response.headers.get(name);return value&&value.length<=max&&!/[\u0000-\u001f\u007f]/.test(value)?value:null;};const length=header('content-length',20);
          const safeHeaders=Object.freeze({contentType:header('content-type',1024),contentDisposition:header('content-disposition',8192),contentLength:length&&/^\d+$/.test(length)?length:null});
          const result={payload:adapted.payload,code:adapted.code,bodyRequestId:adapted.bodyRequestId,redirect:adapted.redirect,status:response.status,headerRequestId:metadata.headerRequestId,requestId:adapted.bodyRequestId||metadata.headerRequestId,headers:safeHeaders} as HttpResponse<T>;return Object.freeze(result);
        }catch(caught){const error=normalize(caught),maxDelay=retry?.maxDelayMs??30000;
          const eligible=retry&&attempt<retry.maxAttempts&&error.kind!=='cancel'&&error.kind!=='timeout'&&error.status!==401&&error.status!==403&&(error.kind==='network'||error.kind==='http'&&(retry.statuses??[429,502,503,504]).includes(error.status!));
          const wait=error.metadata.retryAfterMs??Math.min(maxDelay,(retry?.delayMs??250)*2**(attempt-1));
          if(!eligible||wait>maxDelay)throw error;await delay(wait);check();
        }
      }throw new HttpError('network',metadata);
    };
    try{return await Promise.race([run(),aborted]);}
    catch(caught){const error=normalize(caught);if(metadata.status===401&&error.kind!=='cancel'&&notify401)notifyUnauthorized(error,epoch);if(!dead&&error.kind!=='cancel'&&!(metadata.status===401&&notify401&&options.onUnauthorized))try{Promise.resolve(options.onError?.(error)).catch(()=>{});}catch{}throw error;}
    finally{if(timer!==undefined)clearTimeout(timer);unwatch?.();if(events&&!controller.signal.aborted)controller.abort();if(reader){void reader.cancel().catch(()=>{});try{reader.releaseLock();}catch{}}controller.signal.removeEventListener('abort',abort);init.signal?.removeEventListener('abort',external);active.delete(dispose);}
  }
  const readEvents=async<T=ServerSentEvent>(path:string,events:SseReadOptions<T>)=>{
    if(!events||typeof events!=='object'||['method','body','json','retry','response','adapter','credentials','redirect'].some(key=>Object.hasOwn(events,key)))throw new TypeError('SSE requires explicit callbacks and one GET without transport overrides');
    const {headers,signal,endpointId,errorAdapter,connectTimeoutMs,unauthorized}=events;
    await request(path,{method:'GET',headers,signal,endpointId,errorAdapter,unauthorized,timeoutMs:connectTimeoutMs,response:'empty',cache:'no-store',credentials:'omit',redirect:'error'},events as SseReadOptions<unknown>);
  };
  const client:HttpClient={request,readEvents,resetUnauthorized(){if(!dead){authEpoch++;unauthorized=false;}},destroy(){if(dead)return;dead=true;inspectHttp(client)?.binding?.dispose();for(const stop of active)stop();active.clear();}};
  registerHttp(client,base.origin);return client;
}
