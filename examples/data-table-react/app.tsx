import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout,NavigationMenu} from '@coffeehc/xui-react/menu-layout';
import {AppShell,Grid,PageHeader} from '@coffeehc/xui-react/layout';
import {Disclosure} from '@coffeehc/xui-react/navigation';
import {Card} from '@coffeehc/xui-react/display';
import {Button} from '@coffeehc/xui-react/button';
import {Input,SimpleSelect} from '@coffeehc/xui-react/forms';
import {LoadingState,EmptyState,ErrorState} from '@coffeehc/xui-react/feedback';
import {ScrollArea} from '@coffeehc/xui-react/scroll-area';
import {DataTable,DataTableToolbar,DataTableFilter,type DataTableColumn} from '@coffeehc/xui-react/data-table';
import {createDataTableExample,tableLabels,type ExampleRow} from '../shared/data-table-model';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';

const query=new URLSearchParams(location.search);
// The synthetic twelve-row regression is an explicit supported page size.
const pageSizeOptions=query.get('size')==='12'?[12,20,50,100]:[20,50,100];
const owner=createDataTableExample({pageSize:Number(query.get('size')??20),offset:Number(query.get('offset')??0),empty:query.has('empty'),unknown:query.has('unknown')||query.has('cursor')&&!query.has('cursor-total'),local:query.has('local'),cursor:query.has('cursor')});
const root=createRoot(document.getElementById('root')!);
const cards=query.has('cards'),internal=query.has('internal')&&!cards;
const layout=query.get('layout')==='workspace'?'workspace':query.get('layout')==='document'?'document':undefined;
const noSearch=query.has('no-search'),noActions=query.has('no-actions');
const title=query.has('tall')?'超高页面标题与全部操作仍应可以通过滚动和键盘到达。'.repeat(60):query.has('long')?'合成记录：用于检查长中文标题、页内筛选与独立表体滚动的公共组合':'合成记录';
const items=[{id:'records',label:'合成记录',href:'#records',icon:'list' as const}];
const rowKey=(row:ExampleRow)=>row.id;
const filters=[{name:'kind',label:'类型',values:['记忆','会话']},{name:'scope',label:'范围',values:['个人','共享']},{name:'source',label:'来源',values:['手动','导入']}] as const;
const restore=()=>owner.setEmpty(false);
const actions:string[]=[];
type WidthMode='auto'|'mixed'|'sized';
let configureColumns:(mode:WidthMode,hidden?:string[])=>void=()=>{};
const widths={id:112,name:'clamp(12rem, 35%, 28rem)',kind:'calc(10% + 1rem)',source:'7rem',actions:120} as const;
let dead=false;
const destroy=()=>{if(dead)return;dead=true;root.unmount();owner.destroy();};
declare global {interface Window {dataTableDemo:{owner:ReturnType<typeof createDataTableExample>;restore:()=>void;destroy:()=>void;getActions:()=>string[];setColumnView:(mode:WidthMode,hidden?:string[])=>void}}}
window.dataTableDemo={owner,restore,destroy,getActions:()=>[...actions],setColumnView:(mode,hidden)=>configureColumns(mode,hidden)};

function App(){
  const state=React.useSyncExternalStore(owner.subscribe,owner.getState,owner.getState);
  const [columnView,setColumnView]=React.useState<{mode:WidthMode;hidden:string[]}>({mode:query.get('column-mode')==='sized'?'sized':query.has('widths')?'mixed':'auto',hidden:query.getAll('hide-column')});
  React.useLayoutEffect(()=>{configureColumns=(mode,hidden=[])=>setColumnView({mode,hidden});return()=>{configureColumns=()=>{};};},[]);
  const [inspected,setInspected]=React.useState('尚未查看');
  const inspect=React.useCallback((row:ExampleRow)=>{actions.push(row.id);setInspected(`已查看 ${row.id}`);},[]);
  // Stable callbacks and row keys preserve the action node across confirmed reads.
  // Inspecting a retained row is a local, read-only action and stays available during refresh.
  const columns=React.useMemo<readonly DataTableColumn<ExampleRow>[]>(()=>[
    {id:'id',header:'编号',cell:row=>row.id,sticky:'start'},
    {id:'name',header:'名称',cell:row=>row.name},
    {id:'kind',header:'类型',cell:row=>row.kind},
    {id:'scope',header:'范围',cell:row=>row.scope},
    {id:'source',header:'来源',cell:row=>row.source},
    {id:'actions',header:'操作',sticky:'end',cell:row=><Button variant="link" aria-label={`查看记录 ${row.id}`} data-row-id={row.id} onClick={()=>inspect(row)}>查看</Button>},
  ],[inspect]);
  const visibleColumns=React.useMemo(()=>columns.filter(column=>!columnView.hidden.includes(column.id)&&(!noActions||column.id!=='actions')).map(column=>({...column,width:columnView.mode==='auto'?undefined:column.id==='scope'?(columnView.mode==='sized'||query.has('fluid-content')?160:undefined):column.id==='name'&&columnView.mode==='mixed'&&query.has('fluid-content')?undefined:widths[column.id as keyof typeof widths]})),[columns,columnView]);
  const toolbar=noSearch?undefined:<DataTableToolbar aria-label="记录筛选" data-testid="record-filters">
    <DataTableFilter label="搜索记录" grow><Input type="search" value={String(state.filters.search??'')} onChange={event=>owner.filter('search',event.currentTarget.value)}/></DataTableFilter>
    {filters.map(filter=><DataTableFilter label={filter.label} key={filter.name}><SimpleSelect value={String(state.filters[filter.name]??'')} onChange={event=>owner.filter(filter.name,event.currentTarget.value)}><option value="">全部{filter.label}</option>{filter.values.map(value=><option key={value} value={value}>{value}</option>)}</SimpleSelect></DataTableFilter>)}
    <Button variant="outline" onClick={owner.clear}>清空筛选</Button>
  </DataTableToolbar>;
  const pageHeader=<PageHeader data-testid="record-header" title={title}
    meta={<p>125 条合成记录；不连接业务服务。<output aria-label="查看结果">{inspected}</output></p>}
    actions={noActions?undefined:<><Button onClick={()=>owner.refresh()} disabled={state.busy}>刷新</Button><Button variant="outline" onClick={()=>owner.refresh(true)} disabled={state.busy}>模拟失败</Button><Button variant="outline" onClick={restore} disabled={state.busy}>恢复记录</Button><Button variant="outline" onClick={owner.cancel} disabled={!state.busy}>取消请求</Button></>}/>;
  const table=<DataTable id="records-table" label="合成记录表格" layout={layout} rows={state.rows} columns={visibleColumns} rowKey={rowKey}
    status={state.status} filtered={state.filtered} labels={{...tableLabels,...(query.has('long-error')?{error:tableLabels.error.repeat(30)}:{}),...(query.has('no-count')?{count:()=>''}:{})}} onRetry={owner.retry} striped
    toolbar={internal?toolbar:undefined}
    feedback={query.has('disclosure-feedback')?<div><p>合成读取说明：现有记录仍保留。</p><Disclosure title="查看完整说明"><p>{'完整合成详情，无任何用户数据。'.repeat(40)}</p><Input aria-label="详情备注" defaultValue="保留值"/></Disclosure></div>:query.has('nested-feedback')?<table aria-label="辅助表格"><tbody><tr><td>嵌套反馈</td></tr></tbody></table>:undefined}
    pagination={query.has('no-pagination')?undefined:query.has('cursor')?{mode:'cursor',nextCursor:state.nextCursor,hasPrevious:state.hasPrevious,pageSize:state.pageSize,total:state.total,pageSizeOptions,onNext:owner.next,onPrevious:owner.previous,onPageSizeChange:query.has('fixed-page-size')?undefined:owner.pageSize}:{pageIndex:state.pageIndex,pageIndexOffset:state.pageIndexOffset,pageSize:state.pageSize,total:state.total,pageSizeOptions,onPageChange:owner.page,onPageSizeChange:query.has('fixed-page-size')?undefined:owner.pageSize}}/>;
  // The existing public ScrollArea root takes the same allocated workspace height.
  // Grid/Card provide the public card layout and skin; no private table/shell CSS is copied.
  const cardView=<ScrollArea.Root style={{blockSize:'100%'}} data-testid="record-cards"><ScrollArea.Viewport aria-label="合成记录卡片"><ScrollArea.Content>
    {state.busy&&<LoadingState layout={state.rows.length?'inline':'block'}>{state.rows.length?tableLabels.refreshing:tableLabels.loading}</LoadingState>}
    {state.status==='error'&&<ErrorState title={tableLabels.error} onRetry={owner.retry} retryLabel={tableLabels.retry}/>}
    {!state.busy&&state.status==='ready'&&!state.rows.length&&<EmptyState title={state.filtered?tableLabels.noMatches:tableLabels.empty}/>}
    <Grid>{state.rows.map(row=><Card key={row.id} title={row.name} headingLevel={2} aria-label={`记录卡片 ${row.id}`} badge={{label:row.kind}} description={row.scope} footerMeta={row.source} footerActions={<Button variant="link" aria-label={`查看记录 ${row.id}`} data-row-id={row.id} onClick={()=>inspect(row)}>查看</Button>}/>)}</Grid>
  </ScrollArea.Content></ScrollArea.Viewport></ScrollArea.Root>;
  const common={style:{'--layout-workspace-content-min-block-size':'var(--data-table-min-block-size)'} as React.CSSProperties,scrollMode:query.has('unbounded')?'document' as const:'workspace' as const,headerSlots:{brand:<strong>公共列表组合</strong>},pageHeader,pageToolbar:internal?undefined:toolbar};
  // A known-size host tests composition as a column-flex item, not just a block child.
  const content=cards?cardView:query.has('flex-host')?<div style={{display:'flex',flexDirection:'column',blockSize:'100%',minBlockSize:0}}>{table}</div>:table;
  return query.has('direct')?<AppShell {...common} sidebar={<NavigationMenu items={items} activeId="records" label="示例导航"/>}>{content}</AppShell>:<MenuLayout {...common} items={items} activeId="records" label="示例导航">{content}</MenuLayout>;
}
root.render(<App/>);
if(!query.has('manual'))owner.load();
window.addEventListener('pagehide',destroy,{once:true});
