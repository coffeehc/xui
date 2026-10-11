import {createHttpClient,ajaxResponseAdapter,type HttpResponseContext} from '@coffeehc/xui-runtime/http';
import {createResource} from '@coffeehc/xui-runtime/loading';
import {queryCodecs,serializeWebfacadeQuery,parseListData,toListPage,type WebfacadeContract,type WebfacadeQuery,type ListData} from '@coffeehc/xui-runtime/query';
export interface ExampleRecord{id:string;name:string;created:string}
export const contract:WebfacadeContract={pageIndexOffset:0,maxPageSize:50,filterFields:{name:queryCodecs.string},sortFields:['name','created']};
export const initialQuery:WebfacadeQuery={page_index:0,page_size:2,return_total:true,sort:[{field:'name',order:'asc'}]};
function decodeRecord(value:unknown):ExampleRecord{if(!value||typeof value!=='object')throw new TypeError('Invalid example record');const record=value as ExampleRecord;if(typeof record.id!=='string'||typeof record.name!=='string'||typeof record.created!=='string')throw new TypeError('Invalid example record');return record;}
// Endpoint-specific decoding is declared once, outside both rendering hosts.
function recordsAdapter(value:unknown,context:HttpResponseContext){const reply=ajaxResponseAdapter(value,context);return {...reply,payload:parseListData(reply.payload,decodeRecord)};}
export function createExampleHttpOwner(options:{baseURL:string;onUnauthorized:()=>void}){
  const client=createHttpClient({baseURL:options.baseURL,timeoutMs:2000,onUnauthorized:options.onUnauthorized});
  const resource=createResource<{list:readonly ExampleRecord[];total:number|null}>({isEmpty:page=>page.list.length===0,loader:async(key,signal)=>{
    const query=JSON.parse(key) as WebfacadeQuery,params=serializeWebfacadeQuery(query,contract);
    const reply=await client.request<ListData<ExampleRecord>>('records?'+params,{signal,adapter:recordsAdapter,endpointId:'example.records:list'});
    return toListPage(reply.payload,{returnTotal:query.return_total});
  }});
  return {client,resource,load:(query:WebfacadeQuery)=>resource.load(JSON.stringify(query)),destroy(){resource.destroy();client.destroy();}};
}
