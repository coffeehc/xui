import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {PageHeader,FormGrid,Stack} from '@coffeehc/xui-react/layout';
import {QueryForm,QueryField} from '@coffeehc/xui-react/search-toolbar';
import {Input,SimpleSelect} from '@coffeehc/xui-react/forms';
import {Button} from '@coffeehc/xui-react/button';
import {Typography,Icon} from '@coffeehc/xui-react/display';
import {EmptyState,ErrorState,Badge,Spinner,useResource} from '@coffeehc/xui-react/feedback';
import {DataTable,type DataTableColumn} from '@coffeehc/xui-react/data-table';
import {DateTimePicker} from '@coffeehc/xui-react/date-time';
import {Sheet} from '@coffeehc/xui-react/sheet';
import {disposeXuiServices} from '@coffeehc/xui-runtime/bootstrap';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import {createQueryPageExample,initialQuery,validateQuery,queryStatus,queryLabels,readQuery,type MessageRecord} from '../shared/query-page-model';
import '@coffeehc/xui-theme/style.css';

bootstrapBrowserExample();
const owner=createQueryPageExample(),long=new URLSearchParams(location.search).has('long');
const searchIcon=<Icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg></Icon>;
function App(){
  const state=useResource(owner.resource),[draft,setDraft]=React.useState(initialQuery),[error,setError]=React.useState(''),[expanded,setExpanded]=React.useState(false),[detail,setDetail]=React.useState<MessageRecord|null>(null);
  const input=React.useRef<HTMLInputElement>(null),returnTo=React.useRef<HTMLButtonElement|null>(null);
  const applied=state.key?readQuery(state.key):null,value=state.value;
  const change=(key:keyof typeof draft,value:string)=>{setDraft(current=>({...current,[key]:value}));if(key==='agent')setError('');};
  const submit=(event:React.FormEvent)=>{event.preventDefault();if(owner.resource.getState().busy)return;const error=validateQuery(draft);setError(error);if(error){input.current?.focus();return;}void owner.submit(draft);};
  const columns=React.useMemo<readonly DataTableColumn<MessageRecord>[]>(()=>[
    {id:'id',header:'消息编号',width:'9rem',cell:row=><Typography.Code value={row.id}/>},
    {id:'subject',header:'消息摘要',width:'24rem',cell:row=><Button variant="link" onClick={event=>{returnTo.current=event.currentTarget;setDetail(row);}}>{row.subject}{long?'：来自研发团队跨区域信息整理与长期跟进任务的完整中文摘要':''}</Button>},
    {id:'agent',header:'Agent ID',width:'12rem',cell:row=><Typography.Code value={row.agent}/>},
    {id:'status',header:'状态',width:'8rem',cell:row=><Badge tone={row.status==='delivered'?'success':'warning'}>{row.status==='delivered'?'已送达':'待处理'}</Badge>},
    {id:'time',header:'发送时间',width:'13rem',cell:row=><Typography.Code value={row.time.replace('T',' ')}/>},
  ],[]);
  const query=<QueryForm label="消息查询条件" noValidate aria-busy={state.busy} onSubmit={submit} disclosure={{expanded,onExpandedChange:setExpanded}}
    fields={<><QueryField width="primary" label={long?'查询消息所属的发送方或接收方 Agent 唯一标识':'Agent ID'} required error={error||undefined} help={long?'保留完整标识；查询期间输入和焦点不会被替换或清空。':undefined}><Input ref={input} name="agent" placeholder="输入发送方或接收方 Agent ID" value={draft.agent} onChange={event=>change('agent',event.target.value)}/></QueryField><QueryField width="compact" label={long?'待核对的消息处理状态':'消息状态'}><SimpleSelect name="status" value={draft.status} onChange={event=>change('status',event.target.value)}><option value="all">全部状态</option><option value="delivered">已送达</option><option value="pending">待处理</option></SimpleSelect></QueryField></>}
    actions={<><Button type="submit" disabled={state.busy} aria-busy={state.busy}>{state.busy&&<Spinner/>}查询消息</Button><Button variant="outline" onClick={()=>{setDraft(initialQuery);setError('');input.current?.focus();}}>重置条件</Button></>}
    advancedLabel="按日期筛选" advanced={<FormGrid><DateTimePicker label="开始日期时间" value={draft.start||null} onValueChange={value=>change('start',value??'')}/><DateTimePicker label="结束日期时间" value={draft.end||null} onValueChange={value=>change('end',value??'')}/></FormGrid>}
    summary={applied?`已查询：${applied.agent} · ${applied.status==='all'?'全部状态':applied.status==='delivered'?'已送达':'待处理'}${applied.start||applied.end?` · ${applied.start||'不限起始'} 至 ${applied.end||'不限结束'}`:''}`:null}/>;
  return <><MenuLayout title="消息中心" label="工作导航" items={[{id:'messages',label:'消息查询',href:'/query-page-react/',icon:'document'}]} activeId="messages" compactLabel="收起导航" expandLabel="展开导航" closeLabel="关闭导航" skipLabel="跳至主内容" scrollMode="document" pageHeader={<PageHeader title="消息查询"/>} pageToolbar={query}>
    <DataTable label="消息查询结果" rows={value?.rows??[]} columns={columns} rowKey={row=>row.id} status={queryStatus(state)} hasValue={state.hasValue} labels={queryLabels} filtered={!!applied} onRetry={()=>void owner.resource.retry()}
      toolbar={applied?<QueryResultActions busy={state.busy} refresh={owner.refresh}/>:undefined}
      idleState={<EmptyState align="center" icon={searchIcon} title="输入 Agent ID 开始查询"/>}
      emptyState={<EmptyState align="center" icon={searchIcon} title="没有匹配的消息" action={<Button variant="outline" onClick={()=>input.current?.focus()}>修改查询条件</Button>}/>}
      errorState={<ErrorState title={state.hasValue?'刷新失败，保留上次查询结果':'查询未完成，请重试'} retryLabel="重试查询" onRetry={()=>void owner.resource.retry()} retryDisabled={state.busy}/>}
      pagination={value?{pageIndex:value.pageIndex,pageIndexOffset:0,pageSize:value.pageSize,total:value.total,pageSizeOptions:[5,10,20],onPageChange:page=>void owner.page(page),onPageSizeChange:size=>void owner.page(0,size)}:undefined}/>
  </MenuLayout><Sheet.Root open={!!detail} onOpenChange={open=>{if(!open)setDetail(null);}}><Sheet.Content aria-label="消息详情" finalFocus={()=>returnTo.current??false}><Sheet.Header><Sheet.Title>消息详情</Sheet.Title></Sheet.Header><Sheet.Body>{detail&&<Stack><Typography.Code value={detail.id}/><p>{detail.subject}</p><Typography.Code value={detail.agent}/></Stack>}</Sheet.Body></Sheet.Content></Sheet.Root></>;
}
function QueryResultActions({busy,refresh}:{busy:boolean;refresh:()=>Promise<void>}){return <Button variant="outline" disabled={busy} aria-busy={busy} onClick={()=>void refresh()}>{busy&&<Spinner/>}刷新当前结果</Button>;}
const root=createRoot(document.getElementById('root')!);root.render(<App/>);
Object.assign(window,{queryDemo:owner});window.addEventListener('pagehide',()=>{root.unmount();owner.destroy();disposeXuiServices();},{once:true});
