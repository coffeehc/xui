import {createResource} from '@coffeehc/xui-runtime/loading';
import type {DataTableStatus} from '@coffeehc/xui-runtime/data-table';

export type StudyStatus='running'|'blocked'|'done';
export interface StudyTask {id:string;name:string;template:string;scope:string;candidateLimit:number;lookbackDays:number;allowUnclassified:boolean;notes:string;status:StudyStatus;reason:string}
export interface StudyDraft {template:string;scope:string;candidateLimit:string;lookbackDays:string;allowUnclassified:boolean;notes:string}
export const initialStudyDraft=():StudyDraft=>({template:'公开账户 BUY 行为研究',scope:'通用',candidateLimit:'5',lookbackDays:'30',allowUnclassified:false,notes:''});
export const studyStatus={running:'进行中',blocked:'待确认',done:'已完成'} as const;
export const studyLabels={loading:'正在读取任务…',refreshing:'正在刷新…',idle:'等待读取任务',empty:'还没有研究任务',noMatches:'没有匹配的任务',error:'暂时无法更新任务，已有记录仍保留。',retry:'重试',pageSize:'每页条数',pagination:'任务分页',previous:'上一页',next:'下一页',count:({rowCount,total}:{rowCount:number;total:number|null})=>total===null?`显示 ${rowCount} 条`:`显示 ${rowCount} 条，共 ${total} 条`};
export function validateStudyDraft(draft:StudyDraft){
  const errors:Partial<Record<keyof StudyDraft,string>>={};
  for(const [key,label] of [['candidateLimit','候选账户上限'],['lookbackDays','回看天数']] as const){const value=Number(draft[key]);if(!draft[key].trim()||!Number.isSafeInteger(value)||value<1)errors[key]=`请输入大于零的${label}。`;}
  return errors;
}

/** Synthetic host data only: one complete bounded dataset, one resource and explicit local pagination. */
export function createPageCompositionExample(){
  let records:readonly StudyTask[]=Array.from({length:36},(_,index)=>({id:`R-${String(index+1).padStart(3,'0')}`,name:`公开账户行为研究 ${index+1}`,template:'公开账户 BUY 行为研究',scope:'通用',candidateLimit:5,lookbackDays:30,allowUnclassified:false,notes:'',status:index%5===1?'blocked':index%5===2?'done':'running',reason:index%5===1?'请核对研究范围后再继续。':''}));
  let query='',filter='all',pageIndex=0,pageSize=10,selectedId:string|null=null,dead=false,saving=false,revision=0,readCount=0,submitCount=0;
  let plan:{delayMs?:number;fail?:boolean}={},submitFails=false;
  const listeners=new Set<()=>void>(),submitControllers=new Set<AbortController>();
  const wait=(delay:number,signal:AbortSignal)=>new Promise<void>((resolve,reject)=>{
    const finish=()=>{signal.removeEventListener('abort',abort);resolve();};
    const timer=setTimeout(finish,delay),abort=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(new DOMException('Cancelled','AbortError'));};
    signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
  });
  const resource=createResource({loader:async(_key,signal)=>{
    const pending=plan;plan={};readCount++;
    // Capture the response data for this read; cancellation and late results belong to createResource.
    const value=records.map(row=>({...row}));await wait(pending.delayMs??240,signal);
    if(pending.fail)throw Error('Synthetic read failed');
    return {records:value,revision:++revision};
  }});
  function derive(){
    const value=resource.getState(),all=value.value?.records??[];
    const filtered=all.filter(row=>(!query||`${row.name} ${row.id}`.includes(query))&&(filter==='all'||row.status===filter));
    pageIndex=Math.min(pageIndex,Math.max(0,Math.ceil(filtered.length/pageSize)-1));
    const status:DataTableStatus=value.busy?(value.hasValue?'refreshing':'loading'):value.status==='error'?'error':value.hasValue?'ready':'idle';
    return {rows:filtered.slice(pageIndex*pageSize,(pageIndex+1)*pageSize),total:value.hasValue?filtered.length:null,status,busy:value.busy,saving,query,filter,pageIndex,pageSize,selectedId,selected:all.find(row=>row.id===selectedId)??null,filtered:!!query||filter!=='all',revision:value.value?.revision??0,readCount,submitCount};
  }
  let snapshot=derive();
  const publish=()=>{if(dead)return;snapshot=derive();for(const listener of listeners)listener();};
  const off=resource.subscribe(publish);
  const refresh=()=>{if(dead||resource.getState().busy)return;return resource.load('research-tasks');};
  return {
    getState:()=>snapshot,subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},
    load:refresh,refresh,retry:()=>{if(!dead&&!resource.getState().busy)return resource.retry();},
    setQuery(value:string){query=value;pageIndex=0;publish();},setFilter(value:string){filter=value;pageIndex=0;publish();},
    clear(){query='';filter='all';pageIndex=0;publish();},
    page(value:number){if(!snapshot.busy){pageIndex=value;publish();}},pageSize(value:number){if(!snapshot.busy){pageSize=value;pageIndex=0;publish();}},
    select(id:string|null){selectedId=id;publish();},
    planNext(value:{delayMs?:number;fail?:boolean}){plan=value;},failNextSubmit(){submitFails=true;},
    async create(draft:StudyDraft){
      if(dead)throw new DOMException('Destroyed','AbortError');
      if(saving)throw Error('Creation is already active');
      if(Object.keys(validateStudyDraft(draft)).length)throw new TypeError('Invalid example form');
      const controller=new AbortController();submitControllers.add(controller);const fails=submitFails;submitFails=false;saving=true;submitCount++;publish();
      try{
        await wait(240,controller.signal);if(fails)throw Error('Synthetic creation failed');
        const record:StudyTask={...draft,id:`R-${String(records.length+1).padStart(3,'0')}`,name:`公开账户行为研究 ${records.length+1}`,candidateLimit:Number(draft.candidateLimit),lookbackDays:Number(draft.lookbackDays),status:'running',reason:''};
        records=[record,...records];selectedId=record.id;pageIndex=0;await resource.load('research-tasks');return record;
      }finally{submitControllers.delete(controller);saving=false;publish();}
    },
    destroy(){if(dead)return;dead=true;off();resource.destroy();for(const controller of submitControllers)controller.abort();submitControllers.clear();listeners.clear();},
  };
}
