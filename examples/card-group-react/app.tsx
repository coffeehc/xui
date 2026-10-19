import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {CardGroup,type CardGroupContext} from '@coffeehc/xui-react/card-group';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {PageHeader} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Icon,OverflowText} from '@coffeehc/xui-react/display';
import {Input,Field,Switch} from '@coffeehc/xui-react/forms';
import {SearchToolbar} from '@coffeehc/xui-react/search-toolbar';
import {createResource} from '@coffeehc/xui-runtime/loading';
import {setInterfaceScale} from '@coffeehc/xui-runtime/theme';
import type {CollectionStatus} from '@coffeehc/xui-runtime/collection-view';
import '@coffeehc/xui-theme/critical.css';

type RecordItem={id:string;name:string;revision:number};
const params=new URLSearchParams(location.search),layout=(params.get('layout')??'workspace') as 'natural'|'workspace'|'document';
const summaries=['核对已确认的来源。','核对来源、范围与当前研究条件，完整说明保留在详情。','本段合成摘要包含较长中文，以比较网格由真实内容计算共同高度、内容伸展与卡尾对齐，不裁掉正文或操作。'];
function ResourceGlyph(){return <Icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h6"/></svg></Icon>;}
const footerEvents:string[]=[];
let revision=1,fail=false,delay=100;
const resource=createResource<readonly RecordItem[]>({timeoutMs:3000,loader:async(_key,signal)=>{
  await new Promise<void>((resolve,reject)=>{const timer=setTimeout(resolve,delay);signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));},{once:true});});
  if(fail)throw Error('Synthetic refresh failure');
  return Array.from({length:18},(_,index)=>({id:'record-'+(index+1),name:'研究任务 '+(index+1)+'：跨区域长中文来源与需要人工核对的研究对象',revision}));
}});
const labels={loading:'正在读取任务',refreshing:'正在更新当前任务',idle:'等待读取任务',empty:'暂无任务',noMatches:'没有匹配任务',error:'任务更新失败，保留上次结果',retry:'重试',pageSize:'每页任务数',pagination:'任务翻页',previous:'上一页',next:'下一页',count:({rowCount,total}:{rowCount:number;total:number|null})=>total===null?`本页 ${rowCount} 条`:`本页 ${rowCount} 条，共 ${total} 条`};
function Draft({id}:{id:string}){const [value,setValue]=React.useState('');return <Field label="研究备注"><Input aria-label={'备注 '+id} value={value} onChange={event=>setValue(event.target.value)}/></Field>;}
function FooterControls({id,disabled,onAction}:{id:string;disabled:boolean;onAction:(value:string)=>void}){const [enabled,setEnabled]=React.useState(false);return <><Switch label={null} aria-label={'启用 '+id} checked={enabled} disabled={disabled} onChange={event=>{setEnabled(event.target.checked);onAction('switch '+id);}}/><Button variant="text" size="xs" aria-label={'详情 '+id} disabled={disabled} onClick={()=>onAction('detail '+id)}>详情</Button><Button variant="text" tone="danger" size="xs" aria-label={'删除 '+id} disabled={disabled} onClick={()=>onAction('delete '+id)}>删除</Button></>;}
function App(){
  const snapshot=React.useSyncExternalStore(resource.subscribe,resource.getState,resource.getState);
  const [query,setQuery]=React.useState(''),[reverse,setReverse]=React.useState(false),[disabled,setDisabled]=React.useState(false),[pageIndex,setPageIndex]=React.useState(0),[pageSize,setPageSize]=React.useState(params.has('document-host')?12:6),[cursor,setCursor]=React.useState(false),[events,setEvents]=React.useState('');
  const [cardSizing,setCardSizing]=React.useState<'natural'|'equal'>(params.get('sizing')==='natural'?'natural':'equal');
  const all=(snapshot.value??[]).filter(row=>row.name.includes(query));if(reverse)all.reverse();
  const rows=all.slice(pageIndex*pageSize,(pageIndex+1)*pageSize),status:CollectionStatus=snapshot.busy?snapshot.hasValue?'refreshing':'loading':snapshot.status==='error'?'error':snapshot.status==='idle'?'idle':'ready';
  const refresh=()=>{revision++;void resource.load('tasks');};
  const pagination=cursor?{mode:'cursor' as const,pageSize,total:null,nextCursor:(pageIndex+1)*pageSize<all.length?'page-'+(pageIndex+1):null,hasPrevious:pageIndex>0,pageSizeOptions:[6,12],onNext:()=>setPageIndex(n=>n+1),onPrevious:()=>setPageIndex(n=>n-1),onPageSizeChange:(size:number)=>{setPageSize(size);setPageIndex(0);}}:{pageIndex,pageIndexOffset:0,pageSize,pageSizeOptions:[6,12],total:snapshot.hasValue?all.length:null,onPageChange:setPageIndex,onPageSizeChange:(size:number)=>{setPageSize(size);setPageIndex(0);}};
  const toolbar=<SearchToolbar search={<Field label="搜索任务"><Input type="search" aria-label="搜索任务" placeholder="任务名称" value={query} onChange={event=>{setQuery(event.target.value);setPageIndex(0);}}/></Field>} actions={<><Button variant="outline" onClick={()=>setReverse(value=>!value)}>排序</Button><Button variant="outline" onClick={()=>setDisabled(value=>!value)}>切换禁用</Button><Button variant="outline" onClick={()=>{setCursor(value=>!value);setPageIndex(0);}}>切换游标</Button>{params.has('sizing')&&<Button variant="outline" aria-pressed={cardSizing==='equal'} onClick={()=>setCardSizing(value=>value==='equal'?'natural':'equal')}>等高卡片</Button>}</>}/>;
  const renderCard=(row:RecordItem,context:CardGroupContext)=>({title:params.has('footer-meta')?'公共资源 '+row.id:row.name,headingLevel:3 as const,icon:params.has('accent')?<ResourceGlyph/>:undefined,badge:{label:'待复核',color:params.has('accent')?'var(--action-primary)':undefined},description:params.has('varied')?summaries[Number(row.id.split('-')[1])%summaries.length]:'核对来源、范围与当前研究条件。',children:!params.has('footer-meta')||params.has('draft')?<Draft id={row.id}/>:undefined,footerVariant:params.get('footer')==='plain'?'plain' as const:'band' as const,footerMeta:params.has('footer-meta')?params.has('actions-only')?undefined:params.has('plain-meta')?'v2 · 只读 · standard-skills':<OverflowText text={Number(row.id.split('-')[1])%2?'v2 · 只读 · standard-skills':'v2'}/>:<span>{row.id} · 修订 {row.revision}</span>,footerActions:params.has('footer-meta')?params.has('meta-only')?undefined:<FooterControls id={row.id} disabled={context.disabled} onAction={value=>{footerEvents.push(value);setEvents(value);}}/>:<Button variant="link" size="xs" disabled={context.disabled} onClick={()=>setEvents(`${row.id} revision ${row.revision} index ${context.rowIndex} key ${context.rowKey}`)}>打开 {row.id}</Button>});
  return <MenuLayout title="研究任务" label="工作导航" items={[{id:'tasks',label:'研究任务',href:'#tasks'}]} activeId="tasks" scrollMode={layout==='document'||params.has('document-host')?'document':'workspace'} pageHeader={<PageHeader title="研究任务" actions={<Button disabled={snapshot.busy} aria-busy={snapshot.busy} onClick={refresh}>刷新任务</Button>}/>} pageToolbar={params.has('external')?toolbar:undefined}>
    <CardGroup label="任务集合" layout={layout} cardSizing={cardSizing} rows={rows} rowKey={row=>row.id} renderCard={renderCard} status={status} disabled={disabled} filtered={!!query} toolbar={params.has('external')?undefined:toolbar} labels={labels} onRetry={()=>{fail=false;void resource.retry();}} pagination={pagination} footer={<output hidden aria-label="操作结果">{events}</output>}/>
  </MenuLayout>;
}
const root=createRoot(document.getElementById('root')!);root.render(<React.StrictMode><App/></React.StrictMode>);void resource.load('tasks');
Object.assign(window,{cardGroupDemo:{resource,getFooterEvents:()=>[...footerEvents],setScale:setInterfaceScale,plan:(options:{fail?:boolean;delay?:number;revision?:number})=>{fail=options.fail??false;delay=options.delay??100;revision=options.revision??revision;}}});
window.addEventListener('pagehide',()=>{root.unmount();resource.destroy();},{once:true});
