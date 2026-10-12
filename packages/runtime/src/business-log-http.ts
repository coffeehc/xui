import {createAjaxResponseAdapter,ajaxErrorResponseAdapter,type HttpClient} from './http.js';
import {parseListData,serializeWebfacadeQuery,queryCodecs,type WebfacadeContract} from './query.js';
import {parseBusinessLogEvent,parseBusinessLogPage,parseBusinessLogDetail,validateBusinessLogFilter,type BusinessLogLoader,type BusinessLogPage,type BusinessLogFilter} from './business-log.js';
import {apiSegment} from './native-api.js';
export const businessLogEndpoints=Object.freeze({list:'/api/v1/business-logs',detail:'/api/v1/business-logs'});
export const businessLogQueryContract:Readonly<WebfacadeContract>=Object.freeze({pageIndexOffset:0,maxPageSize:200,filterFields:Object.freeze(Object.fromEntries(['since','until','actor_kind','actor_id','object_kind','object_id','event_type','action','result','correlation_id','request_id'].map(name=>[name,queryCodecs.string]))),sortFields:Object.freeze(['recorded_at','id'])});
export interface BusinessLogHttpOptions {http:HttpClient;timeoutMs?:number}
function filters(input:BusinessLogFilter){const filter=validateBusinessLogFilter(input);return {since:filter.since,until:filter.until,actor_kind:filter.actor?.kind,actor_id:filter.actor?.id,object_kind:filter.object?.kind,object_id:filter.object?.id,event_type:filter.event_type,action:filter.action,result:filter.result,correlation_id:filter.correlation_id,request_id:filter.request_id};}
/** Native webfacade page query + httpx ListData/AjaxResponse. No cursor or snapshot is invented. */
export function createBusinessLogHttpLoader({http,timeoutMs=30000}:BusinessLogHttpOptions):BusinessLogLoader{
  const ajax=createAjaxResponseAdapter();if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>2147483647)throw new TypeError('Invalid business log HTTP budget');
  const request=async<T>(path:string,parse:(value:unknown)=>T,signal:AbortSignal,endpointId:string)=>{const response=await http.request<T>(path,{headers:{Accept:'application/json'},response:'ajax',errorAdapter:ajaxErrorResponseAdapter,adapter:(value,context)=>{const result=ajax(value,context);return {...result,payload:parse(result.payload)};},signal,timeoutMs,endpointId,cache:'no-store',redirect:'error'});return response.payload;};
  return Object.freeze({pagination:'offset' as const,
    list(query:Parameters<BusinessLogLoader['list']>[0],{signal}:Parameters<BusinessLogLoader['list']>[1]){if(query.page.cursor!==null)throw new TypeError('Native offset query does not accept a cursor');const index=query.page.index??0,size=query.page.size;const params=serializeWebfacadeQuery({page_index:index,page_size:size,return_total:true,filters:filters(query.filter),sort:[{field:'recorded_at',order:'desc'},{field:'id',order:'desc'}]},businessLogQueryContract);
      return request<Readonly<BusinessLogPage>>(`${businessLogEndpoints.list}?${params}`,value=>{const data=parseListData(value,parseBusinessLogEvent),list=data.list??[];if(list.length>size||list.length&&index*size+list.length>data.total)throw new TypeError('Invalid business log native page');return parseBusinessLogPage({list,page:{page_index:index,page_size:size,total:data.total}});},signal,'businessLogs.list');},
    detail(id:string,{signal}:Parameters<BusinessLogLoader['detail']>[1]){return request(`${businessLogEndpoints.detail}/${apiSegment(id)}`,parseBusinessLogDetail,signal,'businessLogs.detail');},
  });
}
