import {isHttpError} from './http.js';

export type JSONValue=null|boolean|number|string|readonly JSONValue[]|{readonly [key:string]:JSONValue};
export type BusinessLogActorKind='user'|'agent'|'service';
export type BusinessLogOutcome='succeeded'|'failed'|'denied'|'unknown';
export interface BusinessLogActor {kind:BusinessLogActorKind;id:string;display_name:string|null}
export interface BusinessLogObject {kind:string;id:string;display_name:string|null}
/** schema_version versions the payload of this event_type; these common fields are fixed. */
export interface BusinessLogEvent {id:string;event_type:string;schema_version:number;occurred_at:string;recorded_at:string;actor:Readonly<BusinessLogActor>;object:Readonly<BusinessLogObject>|null;action:string;result:BusinessLogOutcome;summary:string;correlation_id:string|null;request_id:string|null}
export type BusinessLogPageInfo={next_cursor:string|null;snapshot_id?:string|null}|{page_index:number;page_size:number;total:number|null};
export interface BusinessLogPage {list:readonly Readonly<BusinessLogEvent>[];page:Readonly<BusinessLogPageInfo>}
export interface BusinessLogDetail {event:Readonly<BusinessLogEvent>;state:'available'|'expired'|'unavailable';payload:JSONValue}
export interface BusinessLogFilter {since?:string|null;until?:string|null;actor?:{kind:BusinessLogActorKind;id:string}|null;object?:{kind:string;id:string}|null;event_type?:string|null;action?:string|null;result?:BusinessLogOutcome|null;correlation_id?:string|null;request_id?:string|null}
export interface BusinessLogQuery {filter:Readonly<BusinessLogFilter>;page:{size:number;cursor:string|null;index?:number}}
/** Host implements transport, authentication, scope and server-side redaction. No route is assumed. */
export interface BusinessLogLoader {
  /** Native webfacade uses offset pages; a domain cursor loader explicitly declares cursor. */
  pagination?:'offset'|'cursor';
  list:(query:BusinessLogQuery,context:{signal:AbortSignal})=>Promise<BusinessLogPage>;
  detail:(eventId:string,context:{signal:AbortSignal})=>Promise<BusinessLogDetail>;
}
/** Only application code registers renderers. The payload never supplies executable code. */
export interface BusinessLogRenderer<T> {eventType:string;schemaVersion:number;render:(detail:Readonly<BusinessLogDetail>)=>T}
export function findBusinessLogRenderer<T>(renderers:readonly BusinessLogRenderer<T>[],detail:Readonly<BusinessLogDetail>){return renderers.find(item=>item.eventType===detail.event.event_type&&item.schemaVersion===detail.event.schema_version);}
export class BusinessLogContractError extends TypeError {constructor(){super('Invalid business log contract');this.name='BusinessLogContractError';}}
const invalid=()=>new BusinessLogContractError(),bytes=(value:string)=>new TextEncoder().encode(value).length;
const object=(value:unknown)=>{if(!value||typeof value!=='object'||Array.isArray(value))throw invalid();const proto=Object.getPrototypeOf(value);if(proto!==Object.prototype&&proto!==null||Object.values(Object.getOwnPropertyDescriptors(value)).some(item=>!('value' in item)))throw invalid();return value as Record<string,unknown>;};
const text=(value:unknown,max=1024)=>{if(typeof value!=='string'||!value||bytes(value)>max)throw invalid();return value;};
const nullable=(value:unknown)=>value===null?null:text(value);
function timestamp(value:unknown):string {const result=text(value,64),match=/^(\d{4}-\d\d-\d\d)T(\d\d:\d\d:\d\d)(?:\.(\d{1,9}))?(Z|([+-])(\d\d):(\d\d))$/.exec(result);if(!match||result.startsWith('0000-')||Number(match[6]??0)>23||Number(match[7]??0)>59)throw invalid();const base=match[1]+'T'+match[2],date=new Date(base+'Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,19)!==base)throw invalid();return result;}
function nanos(value:string){const result=timestamp(value),match=/^(.*?)(?:\.(\d{1,9}))?(Z|[+-]\d\d:\d\d)$/.exec(result)!;return BigInt(Date.parse(match[1]+match[3]))*1000000n+BigInt((match[2]??'').padEnd(9,'0'));}
export function compareBusinessLogTimestamps(left:string,right:string):number {const difference=nanos(left)-nanos(right);return difference<0n?-1:difference>0n?1:0;}
const actorKinds:readonly string[]=['user','agent','service'],outcomes:readonly string[]=['succeeded','failed','denied','unknown'];
function subject(value:unknown):Readonly<BusinessLogObject>{const item=object(value);return Object.freeze({kind:text(item.kind,256),id:text(item.id,256),display_name:nullable(item.display_name)});}
export function parseBusinessLogEvent(value:unknown):Readonly<BusinessLogEvent>{const item=object(value),actor=subject(item.actor);if(!actorKinds.includes(actor.kind)||!outcomes.includes(item.result as string)||!Number.isSafeInteger(item.schema_version)||Number(item.schema_version)<1)throw invalid();return Object.freeze({id:text(item.id,256),event_type:text(item.event_type,256),schema_version:item.schema_version as number,occurred_at:timestamp(item.occurred_at),recorded_at:timestamp(item.recorded_at),actor:actor as Readonly<BusinessLogActor>,object:item.object===null?null:subject(item.object),action:text(item.action,256),result:item.result as BusinessLogOutcome,summary:text(item.summary,4096),correlation_id:nullable(item.correlation_id),request_id:nullable(item.request_id)});}
/** Immutable JSON only: no getters, custom prototypes, cycles, bigint or unsafe integer coercion. */
export function parseBusinessLogPayload(value:unknown):JSONValue {
  let nodes=0;const seen=new Set<object>();
  const visit=(item:unknown,depth:number):JSONValue=>{if(++nodes>4096||depth>16)throw invalid();if(item===null||typeof item==='boolean')return item;if(typeof item==='string'){if(bytes(item)>65536)throw invalid();return item;}if(typeof item==='number'){if(!Number.isFinite(item)||Number.isInteger(item)&&!Number.isSafeInteger(item))throw invalid();return item;}if(typeof item!=='object'||!item||seen.has(item))throw invalid();seen.add(item);let result:JSONValue;
    if(Array.isArray(item)){if(item.length>4096)throw invalid();const list:JSONValue[]=[];for(let i=0;i<item.length;i++){const descriptor=Object.getOwnPropertyDescriptor(item,String(i));if(!descriptor||!('value' in descriptor))throw invalid();list.push(visit(descriptor.value,depth+1));}result=Object.freeze(list);}
    else{const raw=object(item),record:Record<string,JSONValue>=Object.create(null);for(const [key,entry] of Object.entries(raw)){if(bytes(key)>1024)throw invalid();record[key]=visit(entry,depth+1);}result=Object.freeze(record);}seen.delete(item);return result;};
  const parsed=visit(value,0);if(bytes(JSON.stringify(parsed))>65536)throw invalid();return parsed;
}
export function parseBusinessLogPage(value:unknown):Readonly<BusinessLogPage>{const item=object(value);if(!Array.isArray(item.list)||item.list.length>200)throw invalid();const list=item.list.map(parseBusinessLogEvent),page=object(item.page);if(new Set(list.map(row=>row.id)).size!==list.length)throw invalid();let pagination:Readonly<BusinessLogPageInfo>;
  if(Object.hasOwn(page,'page_index')){if(Object.hasOwn(page,'next_cursor')||!Number.isSafeInteger(page.page_index)||Number(page.page_index)<0||!Number.isSafeInteger(page.page_size)||Number(page.page_size)<1||Number(page.page_size)>200||page.total!==null&&(!Number.isSafeInteger(page.total)||Number(page.total)<0))throw invalid();pagination=Object.freeze({page_index:page.page_index as number,page_size:page.page_size as number,total:page.total as number|null});}
  else{const cursor=page.next_cursor===null?null:text(page.next_cursor,4096),snapshot=page.snapshot_id==null?null:text(page.snapshot_id,4096);pagination=Object.freeze({next_cursor:cursor,...(snapshot===null?{}:{snapshot_id:snapshot})});}
  return Object.freeze({list:Object.freeze(list),page:pagination});}
export function getBusinessLogSnapshot(page:Readonly<BusinessLogPage>|null):string|null{return page&&'next_cursor'in page.page?page.page.snapshot_id??null:null;}
const hasNext=(page:Readonly<BusinessLogPage>)=>'next_cursor'in page.page?!!page.page.next_cursor:page.page.total===null?page.list.length===page.page.page_size:(page.page.page_index+1)*page.page.page_size<page.page.total;
export function parseBusinessLogDetail(value:unknown):Readonly<BusinessLogDetail>{const item=object(value);if(!['available','expired','unavailable'].includes(item.state as string))throw invalid();if(item.state!=='available'&&item.payload!==null)throw invalid();return Object.freeze({event:parseBusinessLogEvent(item.event),state:item.state as BusinessLogDetail['state'],payload:parseBusinessLogPayload(item.payload)});}
export function validateBusinessLogFilter(value:BusinessLogFilter={}):Readonly<BusinessLogFilter>{const raw=object(value),allowed=['since','until','actor','object','event_type','action','result','correlation_id','request_id'];if(Object.keys(raw).some(key=>!allowed.includes(key)))throw invalid();const result:BusinessLogFilter={since:value.since==null?null:timestamp(value.since),until:value.until==null?null:timestamp(value.until)};if(result.since&&result.until&&nanos(result.since)>=nanos(result.until))throw invalid();
  for(const key of ['event_type','action','correlation_id','request_id'] as const)result[key]=value[key]===undefined?null:nullable(value[key]);result.result=value.result==null?null:value.result;if(result.result!==null&&!outcomes.includes(result.result))throw invalid();
  for(const key of ['actor','object'] as const){const raw=value[key];if(raw==null){result[key]=null;continue;}const pair=object(raw);if(Object.keys(pair).some(name=>!['kind','id'].includes(name)))throw invalid();const kind=text(pair.kind,256),id=text(pair.id,256);if(key==='actor'&&!actorKinds.includes(kind))throw invalid();(result as Record<string,unknown>)[key]=Object.freeze({kind,id});}return Object.freeze(result);}
export const businessLogDefaultLabels={title:'Business logs',refresh:'Refresh logs',filters:'Log filters',apply:'Apply filters',clear:'Clear filters',since:'Event since (inclusive)',until:'Event until (exclusive)',actorKind:'Actor kind',actorId:'Actor ID',objectKind:'Object kind',objectId:'Object ID',eventType:'Event type',action:'Action',result:'Result',correlationId:'Correlation ID',requestId:'Request ID',all:'All',user:'User',agent:'Agent',service:'Service',succeeded:'Succeeded',failed:'Failed',denied:'Denied',unknown:'Unknown',occurredAt:'Event time',recordedAt:'Recorded time',actor:'Actor',object:'Business object',summary:'Summary',detail:'View log detail',detailTitle:'Business log detail',eventId:'Event ID',schemaVersion:'Payload schema version',payload:'Business payload',empty:'No log events',loading:'Loading log…',readError:'Could not read log events.',contractError:'The log adapter returned an invalid contract.',invalidFilter:'Invalid log filter or interval.',forbidden:'Log detail permission denied.',notFound:'Log event not found in this scope.',expired:'Log payload retention has ended.',unavailable:'Log payload is unavailable.',rendererError:'The registered renderer failed. Showing JSON.',previous:'Previous',next:'Next',page:'Visited page',snapshot:'Snapshot',retry:'Retry read',cancel:'Cancel read',close:'Close'} as const;
export type BusinessLogLabels={ [Key in keyof typeof businessLogDefaultLabels]:string };
const businessLogListColumns=['summary','result','actor','action','occurredAt','object','detail'] as const;
/** Stable presentation keys; these never rename event fields or filter keys. */
export type BusinessLogListColumnId=typeof businessLogListColumns[number];
/** Pure list presentation, independent of the service/query owner and raw detail facts. */
export interface BusinessLogListPresentation {
 /** Selected columns in display order. Omit for the existing seven columns.
  * Nonempty and unique; detail is appended if omitted so full facts remain reachable. */
 columns?:readonly BusinessLogListColumnId[];
 /** Return plain display text. The original immutable actor/event remain unchanged. */
 formatActor?:(actor:Readonly<BusinessLogActor>,event:Readonly<BusinessLogEvent>)=>string;
 /** Localize the action code for display only; filters/details retain the original code. */
 formatAction?:(action:string,event:Readonly<BusinessLogEvent>)=>string;
 /** Host chooses locale/time zone explicitly (or its own local policy); default is raw ISO. */
 formatOccurredAt?:(iso:string,event:Readonly<BusinessLogEvent>)=>string;
}
function businessLogListValue(column:Exclude<BusinessLogListColumnId,'detail'>,event:Readonly<BusinessLogEvent>,labels:Readonly<BusinessLogLabels>,presentation:BusinessLogListPresentation):string {
 let value:string;
 switch(column){
  case 'summary':value=event.summary;break;
  case 'result':value=labels[event.result];break;
  case 'actor':value=presentation.formatActor?presentation.formatActor(event.actor,event):`${labels[event.actor.kind]} · ${event.actor.display_name?event.actor.display_name+' · ':''}${event.actor.id}`;break;
  case 'action':value=presentation.formatAction?presentation.formatAction(event.action,event):event.action;break;
  case 'occurredAt':value=presentation.formatOccurredAt?presentation.formatOccurredAt(event.occurred_at,event):event.occurred_at;break;
  case 'object':value=event.object?`${event.object.kind}: ${event.object.id}${event.object.display_name?' · '+event.object.display_name:''}`:labels.unknown;break;
 }
 if(typeof value!=='string')throw new TypeError('Business log formatters must return text');
 return value;
}
/** Selected list text only. Existing headers/cells remain compatible when presentation is omitted.
 * columnIds includes the detail action; row.cells contains only non-detail values in that order.
 * Formatters run only for selected columns; errors propagate to the host render boundary. */
export function getBusinessLogTable(state:Readonly<BusinessLogState>,labels:Readonly<BusinessLogLabels>,presentation:BusinessLogListPresentation={}){
 const selected=presentation.columns===undefined?businessLogListColumns:presentation.columns;
 if(!Array.isArray(selected)||!selected.length||new Set(selected).size!==selected.length||selected.some(id=>!businessLogListColumns.includes(id)))throw new TypeError('Invalid business log columns');
 for(const key of ['formatActor','formatAction','formatOccurredAt'] as const)if(presentation[key]!==undefined&&typeof presentation[key]!=='function')throw new TypeError('Business log formatters must be functions');
 const columnIds:readonly BusinessLogListColumnId[]=Object.freeze(selected.includes('detail')?[...selected]:[...selected,'detail']);
 const values=columnIds.filter(id=>id!=='detail');
 return {columnIds,headers:columnIds.map(id=>labels[id]),rows:state.data?.list.map(event=>({id:event.id,cells:values.map(id=>businessLogListValue(id,event,labels,presentation))}))??[]};
}
export function getBusinessLogFacts(event:Readonly<BusinessLogEvent>,labels:Readonly<BusinessLogLabels>){return [[labels.eventId,event.id],[labels.eventType,event.event_type],[labels.schemaVersion,String(event.schema_version)],[labels.occurredAt,event.occurred_at],[labels.recordedAt,event.recorded_at],[labels.actor,`${labels[event.actor.kind]} · ${event.actor.id}${event.actor.display_name?' · '+event.actor.display_name:''}`],[labels.action,event.action],[labels.result,labels[event.result]],[labels.correlationId,event.correlation_id??labels.unknown],[labels.requestId,event.request_id??labels.unknown]];}
export interface BusinessLogOptions {loader:BusinessLogLoader;pageSize?:number;filter?:BusinessLogFilter;labels?:Partial<BusinessLogLabels>;resolveObject?:(object:Readonly<BusinessLogObject>)=>string|null;baseURL?:string;referenceOrigins?:readonly string[]}
export interface BusinessLogState {filter:Readonly<BusinessLogFilter>;filterError:string|null;data:Readonly<BusinessLogPage>|null;busy:boolean;error:string|null;pageIndex:number;canNext:boolean;canPrevious:boolean;detailOpen:boolean;detailId:string|null;detailBusy:boolean;detail:Readonly<BusinessLogDetail>|null;detailError:string|null;detailState:'idle'|'available'|'expired'|'unavailable'|'forbidden'|'not_found'|'error'}
export interface BusinessLogController {readonly options:Readonly<BusinessLogOptions>;readonly labels:Readonly<BusinessLogLabels>;getState:()=>Readonly<BusinessLogState>;subscribe:(listener:()=>void)=>()=>void;refresh:()=>Promise<void>;retry:()=>Promise<void>;setFilter:(filter:BusinessLogFilter)=>Promise<void>;next:()=>Promise<void>;previous:()=>void;cancel:()=>void;openDetail:(id:string)=>Promise<void>;retryDetail:()=>Promise<void>;closeDetail:()=>void;resolveObject:(object:Readonly<BusinessLogObject>)=>string|null;destroy:()=>void}
export function createBusinessLogController(input:BusinessLogOptions):BusinessLogController {
  const size=input.pageSize??50;if(!Number.isSafeInteger(size)||size<1||size>200||!input.loader||typeof input.loader.list!=='function'||typeof input.loader.detail!=='function'||input.resolveObject&&!input.baseURL)throw invalid();
  if(input.loader.pagination!==undefined&&!['offset','cursor'].includes(input.loader.pagination))throw invalid();
  const labels=Object.freeze(Object.fromEntries(Object.entries(businessLogDefaultLabels).map(([key,value])=>{const override=input.labels?.[key as keyof BusinessLogLabels];if(override!==undefined&&typeof override!=='string')throw invalid();return [key,override??value];}))) as Readonly<BusinessLogLabels>,options=Object.freeze({...input,loader:Object.freeze({pagination:input.loader.pagination??'cursor',list:input.loader.list,detail:input.loader.detail}),pageSize:size,referenceOrigins:Object.freeze([...(input.referenceOrigins??[])])});
  let state:Readonly<BusinessLogState>=Object.freeze({filter:validateBusinessLogFilter(input.filter),filterError:null,data:null,busy:false,error:null,pageIndex:0,canNext:false,canPrevious:false,detailOpen:false,detailId:null,detailBusy:false,detail:null,detailError:null,detailState:'idle'}),dead=false,generation=0,detailGeneration=0,active:AbortController|undefined,detailActive:AbortController|undefined,pendingIndex=0,snapshot:string|null=null,history:(string|null)[]=[null];
  const listeners=new Set<()=>void>(),visited=new Map<number,Readonly<BusinessLogPage>>();
  const emit=(patch:Partial<BusinessLogState>)=>{state=Object.freeze({...state,...patch});for(const listener of Array.from(listeners))if(listeners.has(listener))try{listener();}catch{}};
  const wait=async<T>(producer:()=>Promise<T>,controller:AbortController)=>{let abort=()=>{};const stopped=new Promise<never>((_,reject)=>{abort=()=>reject(new DOMException('Cancelled','AbortError'));controller.signal.addEventListener('abort',abort,{once:true});});try{return await Promise.race([Promise.resolve().then(()=>{if(controller.signal.aborted)throw new DOMException('Cancelled','AbortError');return producer();}),stopped]);}finally{controller.signal.removeEventListener('abort',abort);}};
  const classify=(error:unknown)=>isHttpError(error)&&error.status===403?'forbidden':isHttpError(error)&&error.status===404?'not_found':'error';
  const feedback=(error:unknown)=>classify(error)==='forbidden'?labels.forbidden:classify(error)==='not_found'?labels.notFound:error instanceof BusinessLogContractError?labels.contractError:labels.readError;
  const detailPatch={detailOpen:false,detailId:null,detailBusy:false,detail:null,detailError:null,detailState:'idle'} as const;
  const closeDetail=()=>{if(dead)return;const current=++detailGeneration,previous=detailActive;detailActive=undefined;previous?.abort();if(!dead&&current===detailGeneration)emit(detailPatch);};
  const reset=(patch:Partial<BusinessLogState>)=>{const current=++generation,currentDetail=++detailGeneration;const previous=active,previousDetail=detailActive;active=detailActive=undefined;history=[null];visited.clear();snapshot=null;previous?.abort();previousDetail?.abort();if(!dead&&current===generation)emit({...currentDetail===detailGeneration?detailPatch:{},canNext:false,canPrevious:false,busy:false,filterError:null,error:null,...patch});return current;};
  async function load(index=state.pageIndex){if(dead)return;const current=++generation;pendingIndex=index;const previous=active,controller=new AbortController();active=controller;previous?.abort();if(dead||current!==generation)return;emit({busy:true,error:null,filterError:null});if(dead||current!==generation)return;
    const query:BusinessLogQuery={filter:state.filter,page:options.loader.pagination==='offset'?{size,cursor:null,index}:{size,cursor:history[index]??null}};
    try{const raw=await wait(()=>options.loader.list(query,{signal:controller.signal}),controller);if(dead||current!==generation)return;const parsed=parseBusinessLogPage(raw);if(parsed.list.length>size)throw invalid();
      if(options.loader.pagination==='offset'){if(!('page_index'in parsed.page)||parsed.page.page_index!==index||parsed.page.page_size!==size)throw invalid();}
      else{if(!('next_cursor'in parsed.page)||index>0&&snapshot!==null&&getBusinessLogSnapshot(parsed)!==null&&getBusinessLogSnapshot(parsed)!==snapshot||parsed.page.next_cursor&&history.slice(0,index+1).includes(parsed.page.next_cursor))throw invalid();snapshot=getBusinessLogSnapshot(parsed)??snapshot;}
      visited.set(index,parsed);active=undefined;emit({data:parsed,busy:false,error:null,pageIndex:index,canNext:hasNext(parsed),canPrevious:visited.has(index-1)});}
    catch(error){if(!dead&&current===generation){active=undefined;emit({busy:false,error:feedback(error)});}}
  }
  const refresh=()=>{if(dead)return Promise.resolve();const current=reset({});return dead||current!==generation?Promise.resolve():load(0);};
  async function openDetail(eventId:string){if(dead)return;const selected=text(eventId,256),current=++detailGeneration,controller=new AbortController(),previous=detailActive;detailActive=controller;previous?.abort();if(dead||current!==detailGeneration)return;emit({detailOpen:true,detailId:selected,detailBusy:true,detail:null,detailError:null,detailState:'idle'});if(dead||current!==detailGeneration)return;
    try{const raw=await wait(()=>options.loader.detail(selected,{signal:controller.signal}),controller);if(dead||current!==detailGeneration)return;const detail=parseBusinessLogDetail(raw);if(detail.event.id!==selected)throw invalid();detailActive=undefined;emit({detailBusy:false,detail,detailState:detail.state});}
    catch(error){if(!dead&&current===detailGeneration){detailActive=undefined;emit({detailBusy:false,detailError:feedback(error),detailState:classify(error)});}}
  }
  return {options,labels,getState:()=>state,subscribe(listener){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},refresh,retry:()=>state.filterError?Promise.resolve():load(pendingIndex),
    setFilter(filter){if(dead)return Promise.resolve();let parsed:Readonly<BusinessLogFilter>;try{parsed=validateBusinessLogFilter(filter);}catch{const current=++generation,previous=active;active=undefined;previous?.abort();if(!dead&&current===generation)emit({busy:false,filterError:labels.invalidFilter,error:null});return Promise.resolve();}const current=reset({filter:parsed,pageIndex:0,data:null});return dead||current!==generation?Promise.resolve():load(0);},
    next(){if(dead||state.busy||state.error||state.filterError||!state.canNext||!state.data)return Promise.resolve();if('next_cursor'in state.data.page){if(!state.data.page.next_cursor)return Promise.resolve();history=history.slice(0,state.pageIndex+1);history.push(state.data.page.next_cursor);}return load(state.pageIndex+1);},
    previous(){if(dead||state.busy||state.error||state.filterError||!state.canPrevious)return;const index=state.pageIndex-1,page=visited.get(index);if(page){pendingIndex=index;emit({data:page,pageIndex:index,canPrevious:visited.has(index-1),canNext:hasNext(page)});}},
    cancel(){if(dead)return;const current=++generation,previous=active;active=undefined;previous?.abort();if(!dead&&current===generation)emit({busy:false,error:null});},openDetail,retryDetail:()=>state.detailId?openDetail(state.detailId):Promise.resolve(),closeDetail,
    resolveObject(value){if(dead||!options.resolveObject||!options.baseURL)return null;try{const target=options.resolveObject(subject(value));if(!target)return null;const base=new URL(options.baseURL),url=new URL(target,base);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password&&(url.origin===base.origin||options.referenceOrigins.includes(url.origin))?url.href:null;}catch{return null;}},
    destroy(){if(dead)return;dead=true;generation++;detailGeneration++;const previous=active,previousDetail=detailActive;active=detailActive=undefined;visited.clear();history=[null];snapshot=null;previous?.abort();previousDetail?.abort();emit({...detailPatch,filter:validateBusinessLogFilter({}),filterError:null,data:null,busy:false,error:null,pageIndex:0,canNext:false,canPrevious:false});listeners.clear();},
  };
}
