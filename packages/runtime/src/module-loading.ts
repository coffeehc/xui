import {createResource,loadStylesheet,type ResourceController,type ResourceLoadContext} from './resource.js';
export interface ModuleAssets {readonly moduleURL:string;readonly styles?:readonly string[]}
export interface ModuleStyleLease<T> {readonly module:T;release():void}
export interface ModuleStyleOptions<T> extends ModuleAssets {
 load:(url:string,signal:AbortSignal)=>Promise<T>;
 signal:AbortSignal;
 document?:Document;
}
type StylesheetEntry={users:number;abort:AbortController;promise:Promise<HTMLLinkElement>;link?:HTMLLinkElement};
// A Document owns shared CSS leases. ESM evaluation/cache stays with the host loader/JS engine.
const documents=new WeakMap<Document,Map<string,StylesheetEntry>>();
function stylesheet(doc:Document,url:string){
 const href=new URL(url,doc.baseURI).href;
 let cache=documents.get(doc);if(!cache){cache=new Map();documents.set(doc,cache);}
 let entry=cache.get(href);
 if(!entry){
  const abort=new AbortController();entry={users:0,abort,promise:loadStylesheet(href,{document:doc,signal:abort.signal})};cache.set(href,entry);
  const current=entry;
  void current.promise.then(link=>{current.link=link;if(!current.users)link.remove();},()=>{if(cache.get(href)===current)cache.delete(href);});
 }
 const current=entry;current.users++;let released=false;
 return {promise:current.promise,release(){if(released)return;released=true;if(--current.users===0){if(cache.get(href)===current)cache.delete(href);current.abort.abort();current.link?.remove();}}};
}
const cancelled=()=>new DOMException('Module loading cancelled','AbortError');
/** Assets must come from a trusted build map. No fetch/auth owner, auto retry or module unload. */
export async function loadModuleWithStyles<T>(options:ModuleStyleOptions<T>):Promise<ModuleStyleLease<T>>{
 const {signal}=options;if(signal.aborted)throw cancelled();
 const doc=options.document??(typeof document==='undefined'?undefined:document),urls=[...new Set(options.styles??[])];
 if(urls.length&&!doc)throw new Error('A document is required to load module CSS');
 const scope=new AbortController(),leases:ReturnType<typeof stylesheet>[]=[];let released=false,completed=false,abort=()=>{};
 const release=()=>{if(released)return;released=true;signal.removeEventListener('abort',abort);scope.abort();for(const lease of leases)lease.release();};
 try{
  for(const url of urls)leases.push(stylesheet(doc!,url));
  if(signal.aborted)throw cancelled();
  const aborted=new Promise<never>((_,reject)=>{abort=()=>{release();reject(cancelled());};signal.addEventListener('abort',abort,{once:true});});
  const loaded=await Promise.race([Promise.all([Promise.resolve().then(()=>{if(scope.signal.aborted)throw cancelled();return options.load(options.moduleURL,scope.signal);}),...leases.map(lease=>lease.promise)]),aborted]);
  if(signal.aborted)throw cancelled();
  completed=true;
  return Object.freeze({module:loaded[0] as T,release});
 }catch(error){release();throw error;}
 finally{if(!completed)signal.removeEventListener('abort',abort);}
}
export interface ModuleResourceOptions<T>{
 /** One finite end-to-end budget per explicit load/retry, including module and CSS. */
 timeoutMs:number;
 resolve:(key:string,context:ResourceLoadContext)=>ModuleAssets;
 load:(url:string,signal:AbortSignal)=>Promise<T>;
 document?:Document;
}
/** One existing Resource plus CSS lifetime. A retry resolver may choose a new trusted asset URL. */
export function createModuleResource<T>(options:ModuleResourceOptions<T>):ResourceController<ModuleStyleLease<T>>{
 if(!Number.isFinite(options.timeoutMs)||options.timeoutMs<=0)throw new RangeError('timeoutMs must be finite and positive');
 const resource=createResource<ModuleStyleLease<T>>({timeoutMs:options.timeoutMs,loader:(key,signal,context)=>loadModuleWithStyles({...options.resolve(key,context),load:options.load,document:options.document,signal})});
 let held:ModuleStyleLease<T>|undefined;
 const off=resource.subscribe(()=>{const state=resource.getState(),next=state.hasValue?state.value:undefined;if(held!==next){const old=held;held=next;old?.release();}});
 return {...resource,destroy(){off();resource.destroy();held?.release();held=undefined;}};
}
