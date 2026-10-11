/** JSON contract of coffeehc/httpx/httpxcommons. No data/msg aliases. */
export interface AjaxResponse<T=unknown>{success:boolean;message:string;payload:T;request_id:string;code:number;redirect?:string}
export type HttpErrorKind='cancel'|'network'|'timeout'|'http'|'parse'|'business';
export interface HttpMetadata{
  status?:number;code?:number;requestId?:string;bodyRequestId?:string;headerRequestId?:string;
  endpointId?:string;attempts:number;retryAfterMs?:number;readFailure?:'timeout'|'network'|'parse';
}
const messages:Record<HttpErrorKind,string>={cancel:'The request was cancelled.',network:'The service could not be reached.',timeout:'The request exceeded its time budget.',http:'The request failed.',parse:'The response did not match the expected contract.',business:'The operation was rejected.'};
/** Safe feedback/diagnostics: deliberately contains no URL, raw body, headers or cause. */
export class HttpError extends Error{
  readonly kind:HttpErrorKind;readonly metadata:Readonly<HttpMetadata>;
  constructor(kind:HttpErrorKind,metadata:HttpMetadata={attempts:1}){
    super(kind==='http'&&metadata.status===401?'Authentication is required.':kind==='http'&&metadata.status===403?'Permission was denied.':messages[kind]);
    this.name='HttpError';this.kind=kind;const {status,code,bodyRequestId,headerRequestId,endpointId,attempts,retryAfterMs,readFailure}=metadata;
    this.metadata=Object.freeze({status,code,bodyRequestId,headerRequestId,endpointId,attempts,retryAfterMs,readFailure,requestId:bodyRequestId||headerRequestId||metadata.requestId});
  }
  get status(){return this.metadata.status;}get code(){return this.metadata.code;}get requestId(){return this.metadata.requestId;}
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
export function createAjaxResponseAdapter<T=unknown>({successCode=1}:{successCode?:number}={}):ResponseAdapter<T>{
  if(!Number.isSafeInteger(successCode))throw new TypeError('successCode must be a safe integer');
  return (value,context)=>{const wire=parseAjaxResponse<T>(value);const metadata={...context,code:wire.code,bodyRequestId:wire.request_id};
    if(!wire.success||wire.code!==successCode)throw new HttpError('business',metadata);
    return {payload:wire.payload,code:wire.code,bodyRequestId:wire.request_id,redirect:wire.redirect};};
}
export const ajaxResponseAdapter=createAjaxResponseAdapter();
export type ResponseMode='ajax'|'json'|'text'|'blob'|'empty';
export interface ReadRetry{ idempotentRead:true;maxAttempts:number;delayMs?:number;maxDelayMs?:number;statuses?:readonly number[] }
export interface HttpRequestOptions<T=unknown>{
  method?:string;headers?:HeadersInit;body?:BodyInit|null;json?:unknown;signal?:AbortSignal;
  timeoutMs?:number;response?:ResponseMode;adapter?:ResponseAdapter<T>;endpointId?:string;
  retry?:ReadRetry;detectAjaxErrors?:boolean;credentials?:RequestCredentials;cache?:RequestCache;redirect?:RequestRedirect;
}
export interface HttpClientOptions{
  baseURL:string;fetch?:typeof globalThis.fetch;headers?:HeadersInit;getHeaders?:()=>HeadersInit|Promise<HeadersInit>;
  response?:ResponseMode;adapter?:ResponseAdapter<unknown>;timeoutMs?:number;credentials?:RequestCredentials;
  onUnauthorized?:(error:HttpError)=>void|Promise<void>;onError?:(error:HttpError)=>void|Promise<void>;
}
export interface HttpResponse<T>{payload:T;status:number;code?:number;requestId?:string;bodyRequestId?:string;headerRequestId?:string;redirect?:string}
export interface HttpClient{request:<T=unknown>(path:string,options?:HttpRequestOptions<T>)=>Promise<HttpResponse<T>>;resetUnauthorized:()=>void;destroy:()=>void}
const validMs=(value:number,name:string)=>{if(!Number.isFinite(value)||value<=0||value>2147483647)throw new RangeError(`${name} must be positive and fit a browser timer`);};
const looksLikeAjax=(value:unknown)=>!!value&&typeof value==='object'&&['success','message','payload','request_id','code'].every(key=>Object.hasOwn(value,key));
function retryAfter(value:string|null):number|undefined{
  if(!value)return;const ms=/^\d+$/.test(value)?Number(value)*1000:Date.parse(value)-Date.now();return Number.isFinite(ms)?Math.max(0,ms):undefined;
}

/** One client per host transport/auth boundary. No cache, palette, credentials store or router. */
export function createHttpClient(options:HttpClientOptions):HttpClient{
  let base:URL;try{base=new URL(options.baseURL);}catch{throw new TypeError('An absolute HTTP baseURL is required');}
  if(!['http:','https:'].includes(base.protocol)||base.username||base.password)throw new TypeError('An absolute HTTP baseURL without URL credentials is required');
  if(options.timeoutMs!==undefined)validMs(options.timeoutMs,'timeoutMs');
  const send=options.fetch??globalThis.fetch;let dead=false,authEpoch=0,unauthorized=false;const active=new Set<()=>void>();
  const notifyUnauthorized=(error:HttpError,epoch:number)=>{if(dead||epoch!==authEpoch||unauthorized)return;unauthorized=true;try{Promise.resolve(options.onUnauthorized?.(error)).catch(()=>{});}catch{/* Host feedback cannot replace an HTTP fact. */}};
  async function request<T=unknown>(path:string,init:HttpRequestOptions<T>={}):Promise<HttpResponse<T>>{
    if(dead)throw new HttpError('cancel');
    let url:URL;try{url=new URL(path,base);}catch{throw new TypeError('Invalid request path');}
    if(url.origin!==base.origin||url.username||url.password)throw new TypeError('Requests must use the configured origin without URL credentials');
    const method=(init.method??'GET').toUpperCase(),mode=init.response??options.response??'ajax',retry=init.retry,timeout=init.timeoutMs??options.timeoutMs;
    if(!['ajax','json','text','blob','empty'].includes(mode))throw new TypeError('Unsupported response mode');
    if(init.endpointId!==undefined&&!/^[A-Za-z0-9._:-]{1,120}$/.test(init.endpointId))throw new TypeError('endpointId must be an opaque identifier, not a URL');
    if(timeout!==undefined)validMs(timeout,'timeoutMs');
    if(init.adapter&&['empty'].includes(mode))throw new TypeError('Empty mode does not use an adapter');
    if('json' in init&&init.body!==undefined)throw new TypeError('Choose json or body');
    if(retry){if(retry.idempotentRead!==true||!['GET','HEAD'].includes(method)||init.body!==undefined||'json' in init)throw new TypeError('Retry requires an explicitly idempotent GET/HEAD without a body');
      if(!Number.isSafeInteger(retry.maxAttempts)||retry.maxAttempts<1||retry.maxAttempts>5)throw new RangeError('maxAttempts must be 1 through 5');
      if(retry.delayMs!==undefined)validMs(retry.delayMs,'delayMs');if(retry.maxDelayMs!==undefined)validMs(retry.maxDelayMs,'maxDelayMs');
      if(retry.statuses?.some(status=>!Number.isInteger(status)||status<400||status>599))throw new TypeError('Invalid retry statuses');}
    let body=init.body;if('json' in init){try{body=JSON.stringify(init.json);}catch{throw new TypeError('JSON body must be serializable');}if(body===undefined)throw new TypeError('JSON body must be serializable');}
    const controller=new AbortController(),epoch=authEpoch;let stopKind:'cancel'|'timeout'='cancel',timer:ReturnType<typeof setTimeout>|undefined;
    let metadata:HttpMetadata={attempts:0,endpointId:init.endpointId};
    const stopped=()=>{const knownFailure=stopKind==='timeout'&&(metadata.status??0)>=400;return new HttpError(knownFailure?'http':stopKind,{...metadata,...(knownFailure?{readFailure:'timeout' as const}:{})});};
    const stop=(kind:'cancel'|'timeout')=>{if(controller.signal.aborted)return;stopKind=kind;controller.abort();};
    const check=()=>{if(controller.signal.aborted)throw stopped();};
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
          if(!headers.has('accept')&&['ajax','json'].includes(mode))headers.set('accept','application/json');if('json' in init&&!headers.has('content-type'))headers.set('content-type','application/json');
          const response=await send(url.href,{method,headers,body,signal:controller.signal,credentials:init.credentials??options.credentials??'same-origin',cache:init.cache,redirect:init.redirect});check();
          metadata={...metadata,status:response.status,headerRequestId:response.headers.get('X-Request-ID')??undefined,retryAfterMs:retryAfter(response.headers.get('Retry-After'))};
          if(response.status===401)notifyUnauthorized(new HttpError('http',metadata),epoch);
          const context:HttpResponseContext={status:response.status,headerRequestId:metadata.headerRequestId,endpointId:init.endpointId,attempts:attempt};
          const adapter=init.adapter??(init.response===undefined||mode===(options.response??'ajax')?options.adapter:undefined)??(mode==='ajax'?ajaxResponseAdapter:undefined);let adapted:AdaptedResponse<unknown>;
          if(!response.ok){
            let value:unknown;try{const text=await response.text();check();try{value=JSON.parse(text);}catch{metadata={...metadata,readFailure:'parse'};}
              if(looksLikeAjax(value)){try{const wire=parseAjaxResponse(value);metadata={...metadata,code:wire.code,bodyRequestId:wire.request_id};}catch{metadata={...metadata,readFailure:'parse'};}}
            }catch(error){if(controller.signal.aborted)throw stopped();metadata={...metadata,readFailure:'network'};}
            throw new HttpError('http',metadata);
          }
          try{
            if(mode==='empty'){if(response.body)await read(()=>response.body!.cancel());adapted={payload:undefined};}
            else if(mode==='blob'){
              const payload=await read(()=>response.blob());check();adapted={payload};
              if(init.detectAjaxErrors&&response.headers.get('content-type')?.includes('json')){let value:unknown;try{value=JSON.parse(await payload.text());}catch{}check();if(looksLikeAjax(value)){const wire=parseAjaxResponse(value);if(!wire.success||wire.code!==1)throw new HttpError('business',{...context,code:wire.code,bodyRequestId:wire.request_id});}}
              if(adapter)adapted=adapter(payload,context);
            }else{
              const text=await read(()=>response.text());check();const value=mode==='text'?text:JSON.parse(text);if(mode==='ajax'&&looksLikeAjax(value)){const wire=parseAjaxResponse(value);metadata={...metadata,code:wire.code,bodyRequestId:wire.request_id};}adapted=adapter?adapter(value,context):{payload:value};
            }
          }catch(error){if(controller.signal.aborted)throw stopped();if(isHttpError(error))throw error;throw new HttpError('parse',metadata);}
          check();if(!adapted||typeof adapted!=='object'||!Object.hasOwn(adapted,'payload')||adapted.code!==undefined&&!Number.isSafeInteger(adapted.code)||adapted.bodyRequestId!==undefined&&typeof adapted.bodyRequestId!=='string'||adapted.redirect!==undefined&&typeof adapted.redirect!=='string')throw new HttpError('parse',metadata);
          const result={payload:adapted.payload,code:adapted.code,bodyRequestId:adapted.bodyRequestId,redirect:adapted.redirect,status:response.status,headerRequestId:metadata.headerRequestId,requestId:adapted.bodyRequestId||metadata.headerRequestId} as HttpResponse<T>;return Object.freeze(result);
        }catch(caught){const error=normalize(caught),maxDelay=retry?.maxDelayMs??30000;
          const eligible=retry&&attempt<retry.maxAttempts&&error.kind!=='cancel'&&error.kind!=='timeout'&&error.status!==401&&error.status!==403&&(error.kind==='network'||error.kind==='http'&&(retry.statuses??[429,502,503,504]).includes(error.status!));
          const wait=error.metadata.retryAfterMs??Math.min(maxDelay,(retry?.delayMs??250)*2**(attempt-1));
          if(!eligible||wait>maxDelay)throw error;await delay(wait);check();
        }
      }throw new HttpError('network',metadata);
    };
    try{return await Promise.race([run(),aborted]);}
    catch(caught){const error=normalize(caught);if(error.status===401&&error.kind!=='cancel')notifyUnauthorized(error,epoch);if(!dead&&error.kind!=='cancel'&&!(error.status===401&&options.onUnauthorized))try{Promise.resolve(options.onError?.(error)).catch(()=>{});}catch{}throw error;}
    finally{if(timer!==undefined)clearTimeout(timer);controller.signal.removeEventListener('abort',abort);init.signal?.removeEventListener('abort',external);active.delete(dispose);}
  }
  return {request,resetUnauthorized(){if(!dead){authEpoch++;unauthorized=false;}},destroy(){if(dead)return;dead=true;for(const stop of active)stop();active.clear();}};
}
