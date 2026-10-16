import {createOverlayController,type OverlayController,type ObservableController} from './interaction.js';
import {createApiKeyManagerController,type ApiKeyManagerController,type ApiKeyManagerOptions} from './api-key.js';
import {createBusinessLogController,type BusinessLogController,type BusinessLogOptions,type BusinessLogFilter} from './business-log.js';
import {createStructuredLogController,type StructuredLogController,type StructuredLogOptions,type StructuredLogFilter} from './structured-log.js';
/** A service instance or its explicit dependencies. Never an implicit HTTP/auth/query owner. */
export type ServiceSource<C,O>={service:C;options?:never}|{service?:undefined;options:O};
export interface ApiKeyManagerPagination {defaultPageSize?:number;pageSizeOptions?:readonly number[]}
export interface ApiKeyManagerViewState {pageIndex:number;pageSize:number;pagination:boolean;pageSizeOptions:readonly number[]}
export interface ApiKeyManagerViewController extends ObservableController<ApiKeyManagerViewState> {
 readonly service:ApiKeyManagerController;
 start:()=>void;setPage:(index:number)=>void;setPageSize:(size:number)=>void;
 updatePagination:(options:ApiKeyManagerPagination|false|undefined)=>void;
}
export function createApiKeyManagerViewController(input:ServiceSource<ApiKeyManagerController,ApiKeyManagerOptions>&{pagination?:ApiKeyManagerPagination|false}):ApiKeyManagerViewController {
 const owned=!input.service,service=input.service??createApiKeyManagerController(input.options!);let dead=false,started=false,pageIndex=0,pageSize=10,enabled=true,choices:readonly number[]=Object.freeze([10,25,50]),state:Readonly<ApiKeyManagerViewState>,off:(()=>void)|undefined;
 const listeners=new Set<()=>void>();
 const valid=(size:number)=>{if(!Number.isSafeInteger(size)||size<1)throw new TypeError('Page size must be a positive integer');return size;};
 const reconcile=()=>{const next=Math.min(pageIndex,Math.max(0,Math.ceil(service.getState().rows.length/pageSize)-1));pageIndex=next;const previous=state;if(previous&&previous.pageIndex===pageIndex&&previous.pageSize===pageSize&&previous.pagination===enabled&&previous.pageSizeOptions===choices)return;state=Object.freeze({pageIndex,pageSize,pagination:enabled,pageSizeOptions:choices});};
 const emit=()=>{if(dead)return;const previous=state;reconcile();if(previous!==state)for(const listener of [...listeners])if(listeners.has(listener))listener();};
 const updatePagination=(options:ApiKeyManagerPagination|false|undefined)=>{if(dead)return;enabled=options!==false;const initial=options===false?10:valid(options?.defaultPageSize??10),next=options===false?[10]:options?.pageSizeOptions??(options?.defaultPageSize===undefined?[10,25,50]:[initial]);for(const size of next)valid(size);if(!state)pageSize=initial;if(!next.includes(pageSize))pageSize=initial;if(JSON.stringify(next)!==JSON.stringify(choices))choices=Object.freeze([...next]);emit();};
 updatePagination(input.pagination);reconcile();
 return {service,getState:()=>{reconcile();return state;},subscribe(listener){if(dead)return()=>{};listeners.add(listener);if(!off)off=service.subscribe(emit);return()=>{listeners.delete(listener);if(!listeners.size){off?.();off=undefined;}};},
  start(){if(dead||started||!owned)return;started=true;if(!service.getState().hasLoaded&&!service.getState().listBusy)void service.refresh();},
  setPage(index){if(dead||!Number.isSafeInteger(index)||index<0)return;pageIndex=index;emit();},setPageSize(size){if(dead)return;valid(size);if(!choices.includes(size))return;pageSize=size;pageIndex=0;emit();},updatePagination,
  destroy(){if(dead)return;dead=true;off?.();off=undefined;listeners.clear();if(owned)service.destroy();},
 };
}
export interface BusinessLogDraft {since:string;until:string;actorKind:string;actorId:string;objectKind:string;objectId:string;event_type:string;action:string;result:string;correlation_id:string;request_id:string}
export function businessLogFilterDraft(filter:BusinessLogFilter={}):Readonly<BusinessLogDraft>{return Object.freeze({since:filter.since??'',until:filter.until??'',actorKind:filter.actor?.kind??'user',actorId:filter.actor?.id??'',objectKind:filter.object?.kind??'',objectId:filter.object?.id??'',event_type:filter.event_type??'',action:filter.action??'',result:filter.result??'',correlation_id:filter.correlation_id??'',request_id:filter.request_id??''});}
export interface ExplorerViewController<C,D> extends ObservableController<{draft:Readonly<D>}> {
 readonly service:C;readonly filters:OverlayController;
 setDraft:(draft:D)=>void;
 /** Starts only a service created from explicit options. Borrowed services retain their existing loader owner. */
 start:()=>void;
}
export type BusinessLogViewController=ExplorerViewController<BusinessLogController,BusinessLogDraft>;
export type StructuredLogViewController=ExplorerViewController<StructuredLogController,StructuredLogFilter>;
function explorer<C extends {getState:()=>{filter:F};subscribe:(fn:()=>void)=>()=>void;refresh:()=>Promise<void>;destroy:()=>void},F,D extends object>(service:C,owned:boolean,toDraft:(filter:F)=>D):ExplorerViewController<C,D>{
 const filters=createOverlayController(),listeners=new Set<()=>void>();let dead=false,started=false,confirmed=service.getState().filter,state=Object.freeze({draft:Object.freeze(toDraft(confirmed))}),off:(()=>void)|undefined;
 const reconcile=()=>{const next=service.getState().filter;if(next===confirmed)return false;confirmed=next;state=Object.freeze({draft:Object.freeze(toDraft(next))});return true;};
 const emit=()=>{for(const listener of [...listeners])if(listeners.has(listener))listener();};
 return {service,filters,getState:()=>{reconcile();return state;},subscribe(listener){if(dead)return()=>{};listeners.add(listener);if(!off)off=service.subscribe(()=>{if(reconcile())emit();});return()=>{listeners.delete(listener);if(!listeners.size){off?.();off=undefined;}};},
  setDraft(draft){if(dead)return;state=Object.freeze({draft:Object.freeze({...draft})});emit();},start(){if(dead||started||!owned)return;started=true;void service.refresh();},destroy(){if(dead)return;dead=true;off?.();listeners.clear();filters.destroy();if(owned)service.destroy();},
 };
}
/** Draft/Disclosure state wraps exactly one existing service, without copying its query result. */
export function createBusinessLogViewController(input:ServiceSource<BusinessLogController,BusinessLogOptions>):BusinessLogViewController{return explorer(input.service??createBusinessLogController(input.options!),!input.service,businessLogFilterDraft);}
export function createStructuredLogViewController(input:ServiceSource<StructuredLogController,StructuredLogOptions>):StructuredLogViewController{return explorer(input.service??createStructuredLogController(input.options!),!input.service,(filter:StructuredLogFilter)=>({...filter}));}
