import type {GroupedComboboxGroup} from '@coffeehc/xui-runtime/grouped-combobox';
/** Synthetic host data, query, pagination and cancellation. None belongs to the UI library. */
export function createGroupedSearchExample(){
  type Key='normal'|'archive';
  const sources={normal:[{id:'n-1',label:'普通甲 共同'},{id:'n-2',label:'普通乙 共同'},{id:'n-3',label:'普通丙 共同'},{id:'n-4',label:'普通丁 共同'}],archive:[{id:'a-1',label:'归档甲 共同'},{id:'a-2',label:'归档乙 共同'},{id:'a-3',label:'归档丙 共同'},{id:'a-4',label:'归档丁 共同'}]};
  let query='',open=false,selected:string|null=null,selections=0,dead=false;
  const pages={normal:1,archive:1},reads={normal:0,archive:0},cancelled={normal:0,archive:0},generation={normal:0,archive:0},pending:Partial<Record<Key,AbortController>>={},data:Record<Key,typeof sources.normal>={normal:[],archive:[]},busy={normal:false,archive:false},listeners=new Set<()=>void>();
  const matches=(key:Key)=>sources[key].filter(item=>item.label.includes(query));
  const makeState=()=>({query,open,selected,selections,reads:{...reads},cancelled:{...cancelled},groups:(['normal','archive'] as Key[]).map(key=>({id:key,label:key==='normal'?'普通结果':'归档结果',items:data[key],...(key==='archive'?{open}:{}),busy:busy[key],emptyLabel:busy[key]?'正在读取':'没有结果',pagination:{page:pages[key],pageCount:Math.max(1,Math.ceil(matches(key).length/2)),disabled:busy[key]}})) satisfies GroupedComboboxGroup[]});
  let snapshot=makeState();const emit=()=>{snapshot=makeState();listeners.forEach(fn=>fn());};
  const cancel=(key:Key)=>{generation[key]++;if(pending[key]){pending[key]!.abort();delete pending[key];cancelled[key]++;}busy[key]=false;};
  const load=(key:Key)=>{
    cancel(key);if(dead||key==='archive'&&!open)return;
    const controller=new AbortController(),version=generation[key],result=matches(key).slice((pages[key]-1)*2,pages[key]*2);pending[key]=controller;busy[key]=true;data[key]=[];reads[key]++;emit();
    const timer=setTimeout(()=>{if(dead||controller.signal.aborted||version!==generation[key])return;delete pending[key];data[key]=result;busy[key]=false;emit();},key==='normal'?80:200);
    controller.signal.addEventListener('abort',()=>clearTimeout(timer),{once:true});
  };
  load('normal');
  return {getState:()=>snapshot,subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},setQuery(next:string){if(dead)return;query=next;pages.normal=pages.archive=1;cancel('archive');data.archive=[];load('normal');if(open)load('archive');},setOpen(id:string,next:boolean){if(dead||id!=='archive')return;open=next;if(open)load('archive');else{cancel('archive');emit();}},setPage(id:string,page:number){if(dead||id!=='normal'&&id!=='archive')return;if(id==='archive'&&!open)return;pages[id]=page;load(id);},select(value:string|null){if(dead)return;selected=value;selections++;emit();},destroy(){if(dead)return;dead=true;cancel('normal');cancel('archive');listeners.clear();}};
}
/** Disabled-position and live-update fixture shared by the two public renderers. */
export function disabledSearchGroups(itemDisabled=false,groupDisabled=false):GroupedComboboxGroup[]{return [{id:'normal',label:'第二组',disabled:groupDisabled,items:[{id:'locked-first',label:'首位禁用',disabled:true},{id:'n-1',label:'第二实例甲'},{id:'n-locked',label:'禁用候选',disabled:true},{id:'n-2',label:'第二实例乙',disabled:itemDisabled},{id:'locked-last',label:'末位禁用',disabled:true}]}];}
