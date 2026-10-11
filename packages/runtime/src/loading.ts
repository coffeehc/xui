export type ResourceStatus='idle'|'loading'|'refreshing'|'ready'|'empty'|'error'|'retrying';
export interface ResourceState<T>{status:ResourceStatus;key:string|null;value:T|undefined;hasValue:boolean;error:unknown;busy:boolean;request:number}
export interface ResourceOptions<T>{loader:(key:string,signal:AbortSignal)=>Promise<T>;isEmpty?:(value:T)=>boolean;timeoutMs?:number}
export interface ResourceController<T>{getState:()=>Readonly<ResourceState<T>>;subscribe:(listener:()=>void)=>()=>void;load:(key:string)=>Promise<void>;retry:()=>Promise<void>;cancel:()=>void;destroy:()=>void}

/** No cache, requests, auth, automatic retry or write policy. Each owner supplies those. */
export function createResource<T>(options:ResourceOptions<T>):ResourceController<T>{
  let state:Readonly<ResourceState<T>>=Object.freeze({status:'idle',key:null,value:undefined,hasValue:false,error:null,busy:false,request:0});
  const listeners=new Set<()=>void>();let generation=0,active:AbortController|undefined,timer:ReturnType<typeof setTimeout>|undefined,destroyed=false,lastReady:'ready'|'empty'='ready';
  const emit=(next:ResourceState<T>)=>{state=Object.freeze(next);for(const listener of listeners)try{listener();}catch{/* Observer failures cannot turn a successful load into a data error. */}};
  const stop=(abort=true)=>{if(timer!==undefined)clearTimeout(timer);timer=undefined;const previous=active;active=undefined;if(abort)previous?.abort();};
  async function run(key:string,retrying=false){
    if(destroyed)return;
    const request=++generation;stop();if(destroyed||request!==generation)return;const controller=new AbortController();active=controller;
    const same=state.key===key;const value=same?state.value:undefined,hasValue=same&&state.hasValue;
    emit({status:retrying?'retrying':hasValue?'refreshing':'loading',key,value,hasValue,error:null,busy:true,request});
    // Subscribers may synchronously cancel, destroy or start a replacement load.
    if(destroyed||request!==generation||controller.signal.aborted)return;
    if(options.timeoutMs!==undefined){
      if(!Number.isFinite(options.timeoutMs)||options.timeoutMs<=0){active=undefined;emit({...state,status:'error',busy:false,error:new RangeError('timeoutMs must be finite and positive')});return;}
      timer=setTimeout(()=>{if(generation!==request||destroyed)return;const timeoutGeneration=++generation;stop();if(destroyed||generation!==timeoutGeneration)return;const error=new Error('Loading exceeded the host timeout budget');error.name='TimeoutError';emit({...state,status:'error',busy:false,error});},options.timeoutMs);
    }
    let abortListener=()=>{};
    try{
      const cancelled=new Promise<never>((_,reject)=>{abortListener=()=>reject(new DOMException('Loading cancelled','AbortError'));controller.signal.addEventListener('abort',abortListener,{once:true});});
      const loaded=await Promise.race([Promise.resolve().then(()=>options.loader(key,controller.signal)),cancelled]);
      if(destroyed||request!==generation)return;
      const empty=options.isEmpty?.(loaded)??false;
      if(destroyed||request!==generation)return;
      lastReady=empty?'empty':'ready';stop(false);emit({status:lastReady,key,value:loaded,hasValue:true,error:null,busy:false,request});
    }catch(error){
      if(destroyed||request!==generation)return;
      stop();if(destroyed||request!==generation)return;emit({...state,status:'error',error,busy:false});
    }finally{controller.signal.removeEventListener('abort',abortListener);}
  }
  return {
    getState:()=>state,subscribe(listener){if(destroyed)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
    load:key=>run(key),retry:()=>state.key===null?Promise.resolve():run(state.key,true),
    cancel(){if(destroyed)return;const cancelledGeneration=++generation;stop();if(destroyed||generation!==cancelledGeneration)return;emit({...state,status:state.hasValue?lastReady:'idle',busy:false,error:null});},
    destroy(){if(destroyed)return;destroyed=true;generation++;stop();listeners.clear();state=Object.freeze({...state,status:state.hasValue?lastReady:'idle',busy:false,error:null});},
  };
}

/** Optional styles are owned by this call. Failed/cancelled links are removed. */
export function loadStylesheet(url:string,options:{signal?:AbortSignal;document?:Document}={}):Promise<HTMLLinkElement>{
  return new Promise((resolve,reject)=>{
    const doc=options.document??(typeof document==='undefined'?undefined:document);
    if(!doc){reject(new Error('A document is required to load CSS'));return;}
    const link=doc.createElement('link');link.rel='stylesheet';link.href=url;
    const clean=()=>{link.onload=null;link.onerror=null;options.signal?.removeEventListener('abort',abort);};
    const abort=()=>{clean();link.remove();reject(new DOMException('Stylesheet loading cancelled','AbortError'));};
    link.onload=()=>{clean();resolve(link);};link.onerror=()=>{clean();link.remove();reject(new Error('Stylesheet loading failed'));};
    if(options.signal?.aborted){abort();return;}
    options.signal?.addEventListener('abort',abort,{once:true});doc.head.append(link);
  });
}
