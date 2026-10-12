import {createResource} from '@coffeehc/xui-runtime/loading';
import {parseListData,toListPage,serializeWebfacadeQuery,queryCodecs,type WebfacadeQuery} from '@coffeehc/xui-runtime/query';
import type {DataTableStatus} from '@coffeehc/xui-runtime/data-table';
export interface ExampleRow {id:string;name:string;kind:string;scope:string;source:string}
const records=Array.from({length:125},(_,index)=>({id:String(index+1),name:`记录 ${index+1}：很长的中文名称与内容用于验证换行、横向滚动和列对齐`,kind:index%2?'会话':'记忆',scope:index%3?'个人':'共享',source:index%2?'导入':'手动'}));
export const tableLabels={loading:'正在加载…',refreshing:'正在刷新…',idle:'等待加载',empty:'还没有记录',noMatches:'没有匹配记录',error:'加载失败，原有记录仍保留',retry:'重试',pageSize:'每页条数',pagination:'记录分页',previous:'上一页',next:'下一页',count:({rowCount,total}:{rowCount:number;total:number|null})=>total===null?`已加载 ${rowCount} 条`:`显示 ${rowCount} 条，共 ${total} 条`};
export interface DataTableExampleOptions {pageSize?:number;unknown?:boolean;empty?:boolean;offset?:number;local?:boolean}
/** Synchronous host-owned slicing. DataTable still receives only the current page. */
export function createLocalDataTableExample(options:DataTableExampleOptions={}) {
  const offset=options.offset??0,listeners=new Set<()=>void>();
  let dead=false,empty=!!options.empty,pageIndex=offset,pageSize=options.pageSize??20,filters:Record<string,string>={},status:DataTableStatus='idle';
  let snapshot={rows:[] as readonly ExampleRow[],total:null as number|null,pageIndex,pageSize,pageIndexOffset:offset,filters,filtered:false,status:status as DataTableStatus,busy:false,requests:0};
  const publish=(nextStatus:DataTableStatus='ready')=>{
    if(dead)return;status=nextStatus;
    const filtered=empty?[]:records.filter(row=>Object.entries(filters).every(([key,value])=>!value||(key==='search'?row.name.includes(value):row[key as keyof ExampleRow]===value)));
    const start=(pageIndex-offset)*pageSize;
    snapshot={rows:nextStatus==='error'?snapshot.rows:filtered.slice(start,start+pageSize),total:options.unknown?null:filtered.length,pageIndex,pageSize,pageIndexOffset:offset,filters,filtered:Object.values(filters).some(Boolean),status,busy:false,requests:0};
    for(const listener of listeners)listener();
  };
  return {
    getState:()=>snapshot,subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},
    load:()=>publish(),retry:()=>publish(),refresh:(fail=false)=>publish(fail?'error':'ready'),
    page:(value:number)=>{pageIndex=value;publish();},pageSize:(value:number)=>{pageSize=value;pageIndex=offset;publish();},
    filter:(field:string,value:string)=>{filters={...filters,[field]:value};pageIndex=offset;publish();},clear:()=>{filters={};pageIndex=offset;publish();},
    cancel:()=>{},setEmpty:(value:boolean)=>{empty=value;pageIndex=offset;publish();},
    // Local reads are synchronous; delayed plans belong only to the server example.
    planNext:(_plan:{delayMs?:number;ignoreAbort?:boolean;fail?:boolean})=>{},getRequests:():string[]=>[],destroy(){dead=true;listeners.clear();},
  };
}
export function createDataTableExample(options:DataTableExampleOptions={}) {
  if(options.local)return createLocalDataTableExample(options);
  const offset=options.offset??0;
  let desired:WebfacadeQuery={page_index:offset,page_size:options.pageSize??20,return_total:!options.unknown,filters:{}},committed:{rows:readonly ExampleRow[];total:number|null;query:WebfacadeQuery}|undefined,fail=false,dead=false,empty=!!options.empty;
  let nextPlan:{delayMs?:number;ignoreAbort?:boolean;fail?:boolean}|undefined;
  const listeners=new Set<()=>void>(),requests:string[]=[];
  const resource=createResource({loader:async(key,signal)=>{
    const query=JSON.parse(key) as WebfacadeQuery,plan=nextPlan??{},shouldFail=plan.fail??fail,isEmpty=empty;nextPlan=undefined;fail=false;serializeWebfacadeQuery(query,{pageIndexOffset:offset,maxPageSize:100,filterFields:{search:queryCodecs.string,kind:queryCodecs.string,scope:queryCodecs.string,source:queryCodecs.string}});
    // Synthetic read only. A real product supplies its own existing transport/resource.
    requests.push(key);await new Promise<void>((resolve,reject)=>{const timer=setTimeout(resolve,plan.delayMs??120);if(!plan.ignoreAbort)signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));},{once:true});});
    if(shouldFail)throw Error('Synthetic refresh failed');
    const filtered=isEmpty?[]:records.filter(row=>Object.entries(query.filters??{}).every(([key,value])=>!value||(key==='search'?row.name.includes(String(value)):row[key as keyof ExampleRow]===value)));
    const start=(query.page_index-offset)*query.page_size;
    const wire=parseListData<ExampleRow>({list:filtered.slice(start,start+query.page_size),total:query.return_total?filtered.length:0});
    const page=toListPage(wire,{returnTotal:query.return_total});return {rows:page.list,total:page.total,query};
  }});
  let snapshot:ReturnType<typeof getSnapshot>;
  function getSnapshot(){const resourceState=resource.getState();const query=committed?.query??desired;let status:DataTableStatus=resourceState.busy?(committed?'refreshing':'loading'):resourceState.status==='error'?'error':committed?'ready':'idle';return {rows:committed?.rows??[],total:committed?.total??null,pageIndex:query.page_index,pageSize:query.page_size,pageIndexOffset:offset,filters:desired.filters??{},filtered:Object.values(desired.filters??{}).some(Boolean),status,busy:resourceState.busy,requests:requests.length};}
  snapshot=getSnapshot();
  const emit=()=>{snapshot=getSnapshot();for(const listener of listeners)listener();};
  const off=resource.subscribe(()=>{const state=resource.getState();if(state.value&&(state.status==='ready'||state.status==='empty'))committed=state.value;emit();});
  const load=(query=desired)=>{if(dead)return;desired=query;void resource.load(JSON.stringify(query));};
  return {
    getState:()=>snapshot,subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},
    load:()=>load(),retry:()=>{if(!resource.getState().busy)void resource.retry();},
    refresh:(shouldFail=false)=>{if(resource.getState().busy)return;fail=shouldFail;load();},
    page:(pageIndex:number)=>{if(!resource.getState().busy)load({...desired,page_index:pageIndex});},
    pageSize:(pageSize:number)=>{if(!resource.getState().busy)load({...desired,page_index:offset,page_size:pageSize});},
    filter:(field:string,value:string)=>load({...desired,page_index:offset,filters:{...desired.filters,[field]:value}}),
    clear:()=>load({...desired,page_index:offset,filters:{}}),cancel:()=>{if(dead)return;resource.cancel();desired=committed?.query??desired;emit();},
    setEmpty:(value:boolean)=>{if(dead)return;empty=value;load({...desired,page_index:offset});},
    planNext:(plan:{delayMs?:number;ignoreAbort?:boolean;fail?:boolean})=>{if(dead)return;if(plan.delayMs!==undefined&&(!Number.isFinite(plan.delayMs)||plan.delayMs<0))throw new TypeError('Invalid synthetic delay');nextPlan=plan;},
    getRequests:()=>[...requests],destroy(){if(dead)return;dead=true;off();resource.destroy();listeners.clear();},
  };
}
