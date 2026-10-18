import {createResource,type ResourceController} from '@coffeehc/xui-runtime/loading';
import type {CollectionLabels,CollectionStatus} from '@coffeehc/xui-runtime/collection-view';

/** Synthetic, in-memory example facts. This is not a product endpoint or DTO adapter. */
export interface QueryDraft {agent:string;status:string;start:string;end:string}
export interface MessageRecord {id:string;agent:string;status:'delivered'|'pending';subject:string;time:string}
export interface QueryResult {rows:readonly MessageRecord[];total:number;pageIndex:number;pageSize:number}
export interface QueryRequest extends QueryDraft {pageIndex:number;pageSize:number}
export const initialQuery:QueryDraft={agent:'',status:'all',start:'',end:''};
export const queryLabels:Partial<CollectionLabels>={idle:'输入 Agent ID 开始查询',loading:'正在查询消息…',refreshing:'正在刷新当前结果…',empty:'没有匹配的消息',noMatches:'没有匹配的消息',error:'查询未完成，请重试',retry:'重试查询',pageSize:'每页条数',pagination:'消息分页',previous:'上一页',next:'下一页',count:({rowCount,total})=>total===null?`本页 ${rowCount} 条`:`共 ${total} 条`};
export function queryStatus(state:ReturnType<ResourceController<QueryResult>['getState']>):CollectionStatus {
  return state.status==='empty'?'ready':state.status==='retrying'?state.hasValue?'refreshing':'loading':state.status;
}
export function validateQuery(draft:QueryDraft){return draft.agent.trim()?'':'请输入 Agent ID';}
export function queryKey(draft:QueryDraft,pageIndex=0,pageSize=5){return JSON.stringify({...draft,agent:draft.agent.trim(),pageIndex,pageSize});}
export function readQuery(key:string):QueryRequest{return JSON.parse(key);}

export function createQueryPageExample(){
  let delay=350,next:'success'|'empty'|'error'='success',requests=0;
  const resource=createResource<QueryResult>({isEmpty:result=>!result.rows.length,loader:async(key,signal)=>{
    const query=readQuery(key),outcome=next;next='success';requests++;
    await new Promise<void>((resolve,reject)=>{
      const abort=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};
      const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},delay);
      if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});
    });
    if(outcome==='error')throw new Error('Synthetic query failure');
    const all:MessageRecord[]=outcome==='empty'?[]:Array.from({length:13},(_,index)=>({id:`MSG-${String(index+1).padStart(3,'0')}`,agent:query.agent,status:index%3?'delivered':'pending',subject:['研究任务已完成，等待核对结果','新消息等待处理','跨区域资料同步完成'][index%3],time:`2026-10-18T09:${String(index*3).padStart(2,'0')}`}));
    const filtered=all.filter(row=>query.status==='all'||row.status===query.status).filter(row=>(!query.start||row.time>=query.start)&&(!query.end||row.time<=query.end));
    return {rows:filtered.slice(query.pageIndex*query.pageSize,(query.pageIndex+1)*query.pageSize),total:filtered.length,pageIndex:query.pageIndex,pageSize:query.pageSize};
  }});
  const submit=(draft:QueryDraft)=>{if(validateQuery(draft))return Promise.resolve();return resource.load(queryKey(draft));};
  const refresh=()=>{const key=resource.getState().key;return key===null?Promise.resolve():resource.load(key);};
  const page=(pageIndex:number,pageSize?:number)=>{const key=resource.getState().key;if(key===null)return Promise.resolve();const query=readQuery(key);return resource.load(queryKey(query,pageIndex,pageSize??query.pageSize));};
  return {resource,submit,refresh,page,destroy:resource.destroy,
    // Test-only controls are intentionally absent from the rendered application.
    fixture(options:{delay?:number;next?:typeof next}){if(options.delay!==undefined)delay=options.delay;if(options.next)next=options.next;},requestCount:()=>requests};
}
