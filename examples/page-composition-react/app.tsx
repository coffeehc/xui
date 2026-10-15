import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {PageHeader,FormGrid,FormActions,Stack} from '@coffeehc/xui-react/layout';
import {Field,Fieldset,Input,Textarea,SimpleSelect,Checkbox} from '@coffeehc/xui-react/forms';
import {Button} from '@coffeehc/xui-react/button';
import {Typography} from '@coffeehc/xui-react/display';
import {Badge,DataRegion,ErrorState,Spinner,EmptyState} from '@coffeehc/xui-react/feedback';
import {DataTable,type DataTableColumn} from '@coffeehc/xui-react/data-table';
import {SearchToolbar} from '@coffeehc/xui-react/search-toolbar';
import {Disclosure} from '@coffeehc/xui-react/navigation';
import {Sheet} from '@coffeehc/xui-react/sheet';
import {createPageCompositionExample,initialStudyDraft,studyLabels,studyStatus,validateStudyDraft,type StudyDraft,type StudyTask} from '../shared/page-composition-model';
import '@coffeehc/xui-theme/style.css';

const owner=createPageCompositionExample(),long=new URLSearchParams(location.search).has('long');
const taskName=(row:StudyTask)=>row.name+(long?'：核对跨区域研究范围与长中文来源名称，完整内容可在详情中阅读':'');
const tone=(row:StudyTask)=>row.status==='blocked'?'warning':row.status==='done'?'success':'info';
function StudyForm({onCreated}:{onCreated:()=>void}){
  const state=React.useSyncExternalStore(owner.subscribe,owner.getState,owner.getState),[draft,setDraft]=React.useState(initialStudyDraft),[errors,setErrors]=React.useState<ReturnType<typeof validateStudyDraft>>({}),[error,setError]=React.useState('');
  const limit=React.useRef<HTMLInputElement>(null),days=React.useRef<HTMLInputElement>(null),alive=React.useRef(true);
  React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const change=<K extends keyof StudyDraft>(key:K,value:StudyDraft[K])=>setDraft(current=>({...current,[key]:value}));
  const submit=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();if(owner.getState().saving)return;
    const invalid=validateStudyDraft(draft);setErrors(invalid);setError('');
    if(Object.keys(invalid).length){(invalid.candidateLimit?limit:days).current?.focus();return;}
    try{await owner.create(draft);if(alive.current)onCreated();}catch(cause){if(alive.current&&!(cause instanceof DOMException&&cause.name==='AbortError'))setError('创建未完成，请保留当前输入并重试。');}
  };
  return <form id="research-form" noValidate onSubmit={submit} aria-busy={state.saving}>
    <DataRegion feedbackLayout="flow" feedback={error?<ErrorState title={error}/>:null}>
      <Stack>
        <Fieldset legend="研究范围" layout="stack" disabled={state.saving}>
          <FormGrid>
            <FormGrid.Item><Field label="冻结模板" required><SimpleSelect value={draft.template} disabled={state.saving} onChange={event=>change('template',event.target.value)}><option>公开账户 BUY 行为研究</option></SimpleSelect></Field></FormGrid.Item>
            <FormGrid.Item><Field label="研究范围" required><SimpleSelect value={draft.scope} disabled={state.saving} onChange={event=>change('scope',event.target.value)}><option>通用</option></SimpleSelect></Field></FormGrid.Item>
            <FormGrid.Item><Field label="候选账户上限" required error={errors.candidateLimit}><Input ref={limit} type="number" min="1" value={draft.candidateLimit} disabled={state.saving} onChange={event=>change('candidateLimit',event.target.value)}/></Field></FormGrid.Item>
            <FormGrid.Item><Field label="回看天数" required error={errors.lookbackDays}><Input ref={days} type="number" min="1" value={draft.lookbackDays} disabled={state.saving} onChange={event=>change('lookbackDays',event.target.value)}/></Field></FormGrid.Item>
            <FormGrid.Item span="full"><Checkbox label="允许未分类成交进入通用分析（不依据榜单分类推断交易范围）" checked={draft.allowUnclassified} disabled={state.saving} onChange={event=>change('allowUnclassified',event.target.checked)}/></FormGrid.Item>
          </FormGrid>
        </Fieldset>
        <Disclosure title="研究说明">
          <FormGrid columns={1}><FormGrid.Item span="full"><Field label={long?'补充研究范围、来源说明与需要人工复核的完整中文信息':'补充说明'} help="记录需要人工复核的研究条件。"><Textarea value={draft.notes} disabled={state.saving} onChange={event=>change('notes',event.target.value)}/></Field></FormGrid.Item></FormGrid>
        </Disclosure>
      </Stack>
    </DataRegion>
  </form>;
}

function App(){
  const state=React.useSyncExternalStore(owner.subscribe,owner.getState,owner.getState),[createOpen,setCreateOpen]=React.useState(false),[detailOpen,setDetailOpen]=React.useState(false),detailReturn=React.useRef<HTMLButtonElement|null>(null),createReturn=React.useRef<HTMLButtonElement>(null);
  const columns=React.useMemo<readonly DataTableColumn<StudyTask>[]>(()=>[
    {id:'id',header:'编号',width:'7rem',cell:row=><Typography.Code value={row.id}/>},
    {id:'name',header:'研究任务',width:'18rem',cell:row=><Button variant="link" onClick={event=>{detailReturn.current=event.currentTarget;owner.select(row.id);setDetailOpen(true);}}>{taskName(row)}</Button>},
    {id:'status',header:'状态',width:'8rem',cell:row=><Badge tone={tone(row)}>{studyStatus[row.status]}</Badge>},
    {id:'reason',header:'待办事项',width:'20rem',cell:row=>row.reason||'—'},
  ],[]);
  const actions=<><Button variant="outline" disabled={state.busy} aria-busy={state.busy} onClick={()=>owner.refresh()}>{state.busy&&<Spinner/>}刷新任务</Button><Button ref={createReturn} aria-haspopup="dialog" aria-expanded={createOpen} onClick={()=>setCreateOpen(true)}>创建研究任务</Button></>;
  const toolbar=<SearchToolbar search={<Field label="搜索任务"><Input type="search" placeholder="名称或编号" value={state.query} onChange={event=>owner.setQuery(event.target.value)}/></Field>} actions={<><Field label="状态"><SimpleSelect value={state.filter} onChange={event=>owner.setFilter(event.target.value)}><option value="all">全部状态</option>{Object.entries(studyStatus).map(([value,label])=><option key={value} value={value}>{label}</option>)}</SimpleSelect></Field>{state.filtered&&(state.rows.length>0||state.status==='error')&&<Button variant="outline" onClick={owner.clear}>清空筛选</Button>}</>}/>;
  return <><Sheet.Root open={createOpen} onOpenChange={(open,details)=>{if(owner.getState().saving){details.cancel();return;}setCreateOpen(open);}}>
    <MenuLayout title="研究工作区" label="工作导航" compactLabel="收起导航" expandLabel="展开导航" closeLabel="关闭导航" items={[{id:'research',label:'研究任务',href:'#research',icon:'folder'}]} activeId="research" scrollMode="workspace" style={{'--layout-workspace-content-min-block-size':'var(--data-table-min-block-size)'} as React.CSSProperties} pageHeader={<PageHeader title="研究任务" actions={actions}/>}>
      <DataTable label="研究任务列表" rows={state.rows} columns={columns} rowKey={row=>row.id} rowState={row=>({selected:row.id===state.selectedId})} toolbar={toolbar} status={state.status} filtered={state.filtered} labels={studyLabels} onRetry={()=>owner.retry()} emptyState={<EmptyState title={state.filtered?'没有匹配的任务':'还没有研究任务'} action={state.filtered?<Button variant="outline" onClick={owner.clear}>清空筛选</Button>:<Button onClick={()=>setCreateOpen(true)}>创建研究任务</Button>}/>} pagination={{pageIndex:state.pageIndex,pageIndexOffset:0,pageSize:state.pageSize,pageSizeOptions:[5,10,20],total:state.total,onPageChange:owner.page,onPageSizeChange:owner.pageSize}}/>
    </MenuLayout>
    <Sheet.Content aria-label="创建研究任务" finalFocus={()=>createReturn.current??false}><Sheet.Header closeButtonProps={{disabled:state.saving,'aria-label':'关闭创建研究任务'}}><Sheet.Title>创建研究任务</Sheet.Title></Sheet.Header><Sheet.Body><StudyForm onCreated={()=>setCreateOpen(false)}/></Sheet.Body><Sheet.Footer><FormActions secondary={<Sheet.Close render={<Button variant="outline" disabled={state.saving}/>}>取消</Sheet.Close>}><Button form="research-form" type="submit" disabled={state.saving} aria-busy={state.saving}>{state.saving?'正在创建…':'创建任务'}</Button></FormActions></Sheet.Footer></Sheet.Content>
  </Sheet.Root>
    <Sheet.Root open={detailOpen} onOpenChange={setDetailOpen}><Sheet.Content aria-label="研究任务详情" finalFocus={()=>detailReturn.current??false}><Sheet.Header><Sheet.Title>{state.selected?taskName(state.selected):'研究任务详情'}</Sheet.Title></Sheet.Header><Sheet.Body>{state.selected&&<Stack><Badge tone={tone(state.selected)}>{studyStatus[state.selected.status]}</Badge>{state.selected.reason&&<p>{state.selected.reason}</p>}<dl className="xui-details"><dt>编号</dt><dd>{state.selected.id}</dd><dt>冻结模板</dt><dd>{state.selected.template}</dd><dt>研究范围</dt><dd>{state.selected.scope}</dd><dt>候选账户上限</dt><dd>{state.selected.candidateLimit}</dd><dt>回看天数</dt><dd>{state.selected.lookbackDays}</dd></dl>{state.selected.notes&&<p>{state.selected.notes}</p>}</Stack>}</Sheet.Body><Sheet.Footer><FormActions><Sheet.Close render={<Button variant="outline"/>}>关闭详情</Sheet.Close></FormActions></Sheet.Footer></Sheet.Content></Sheet.Root>
  </>;
}
const root=createRoot(document.getElementById('root')!);root.render(<App/>);void owner.load();
Object.assign(window,{pageCompositionDemo:{owner}});
window.addEventListener('pagehide',()=>{root.unmount();owner.destroy();},{once:true});
