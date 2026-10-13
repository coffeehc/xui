import {createMenuLayout} from '@coffeehc/xui-runtime/menu-layout';
import {createDisclosureController} from '@coffeehc/xui-runtime/dom';
import {createDataTable,createDataTableToolbar,createDataTableFilter} from '@coffeehc/xui-runtime/data-table-dom';
import {createDataTableExample,tableLabels} from '../shared/data-table-model';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';

const query=new URLSearchParams(location.search),doc=document,root=doc.getElementById('root');
const owner=createDataTableExample({pageSize:Number(query.get('size')??20),offset:Number(query.get('offset')??0),empty:query.has('empty'),unknown:query.has('unknown')||query.has('cursor')&&!query.has('cursor-total'),local:query.has('local'),cursor:query.has('cursor')});
const cards=query.has('cards'),internal=query.has('internal')&&!cards;
const layout=query.get('layout')==='workspace'?'workspace':query.get('layout')==='document'?'document':undefined;
const noSearch=query.has('no-search'),noActions=query.has('no-actions');
const title=query.has('tall')?'超高页面标题与全部操作仍应可以通过滚动和键盘到达。'.repeat(60):query.has('long')?'合成记录：用于检查长中文标题、页内筛选与独立表体滚动的公共组合':'合成记录';
const element=(tag,text,className)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
const button=(text,action,variant)=>{const node=element('button',text,'xui-button');node.type='button';if(variant)node.dataset.variant=variant;node.onclick=action;return node;};
// Explicit public shell sizing contract; no internal element lookup or private CSS.
const contentMinimum='--layout-workspace-content-min-block-size',oldMinimum=root.style.getPropertyValue(contentMinimum),oldPriority=root.style.getPropertyPriority(contentMinimum);
root.style.setProperty(contentMinimum,'var(--data-table-min-block-size)');
const actions=[];
const result=element('output','尚未查看');result.setAttribute('aria-label','查看结果');
const inspect=row=>{actions.push(row.id);result.textContent=`已查看 ${row.id}`;};
const restore=()=>owner.setEmpty(false);
const refresh=button('刷新',()=>owner.refresh()),fail=button('模拟失败',()=>owner.refresh(true),'outline'),restoreButton=button('恢复记录',restore,'outline'),cancel=button('取消请求',()=>owner.cancel(),'outline');
const pageHeader=element('header',undefined,'xui-page-header');pageHeader.dataset.testid='record-header';
const heading=element('div'),meta=element('p','125 条合成记录；不连接业务服务。'),headerActions=element('div',undefined,'xui-toolbar');
meta.append(result);heading.append(element('h1',title),meta);headerActions.append(refresh,fail,restoreButton,cancel);pageHeader.append(heading);if(!noActions)pageHeader.append(headerActions);
const controls={};
const search=element('input',undefined,'xui-input');search.type='search';search.oninput=()=>owner.filter('search',search.value);controls.search=search;
const filterFields=[createDataTableFilter(doc,{label:'搜索记录',control:search,grow:true})];
for(const {name,label,values} of [{name:'kind',label:'类型',values:['记忆','会话']},{name:'scope',label:'范围',values:['个人','共享']},{name:'source',label:'来源',values:['手动','导入']}]){
  const select=element('select',undefined,'xui-select');select.dataset.controlSize='default';
  for(const [value,text] of [['',`全部${label}`],...values.map(value=>[value,value])]){const option=element('option',text);option.value=value;select.append(option);}
  select.onchange=()=>owner.filter(name,select.value);controls[name]=select;filterFields.push(createDataTableFilter(doc,{label,control:select}));
}
const clear=button('清空筛选',()=>owner.clear(),'outline');
const toolbar=createDataTableToolbar(doc,[...filterFields,clear]);toolbar.setAttribute('aria-label','记录筛选');toolbar.dataset.testid='record-filters';
const rowKey=row=>row.id;
// Stable cell callbacks/keys and the public native slot lifecycle retain each action.
// A local inspection remains valid for retained rows while a read refresh is busy.
const columns=[
  {id:'id',header:'编号',cell:row=>row.id,sticky:'start'},
  {id:'name',header:'名称',cell:row=>row.name},
  {id:'kind',header:'类型',cell:row=>row.kind},
  {id:'scope',header:'范围',cell:row=>row.scope},
  {id:'source',header:'来源',cell:row=>row.source},
  {id:'actions',header:'操作',sticky:'end',cell:row=>{
    let current=row;
    const action=button('查看',()=>inspect(current),'link');
    return {element:action,update(next){current=next;action.dataset.rowId=next.id;action.setAttribute('aria-label',`查看记录 ${next.id}`);},destroy(){action.onclick=null;}};
  }},
];
let columnView={mode:query.get('column-mode')==='sized'?'sized':query.has('widths')?'mixed':'auto',hidden:query.getAll('hide-column')};
const widths={id:112,name:'clamp(12rem, 35%, 28rem)',kind:'calc(10% + 1rem)',source:'7rem',actions:120};
const visibleColumns=()=>columns.filter(column=>!columnView.hidden.includes(column.id)&&(!noActions||column.id!=='actions')).map(column=>({...column,width:columnView.mode==='auto'?undefined:column.id==='scope'?(columnView.mode==='sized'||query.has('fluid-content')?160:undefined):column.id==='name'&&columnView.mode==='mixed'&&query.has('fluid-content')?undefined:widths[column.id]}));
const feedbackTable=element('table'),feedbackBody=element('tbody'),feedbackRow=element('tr');feedbackTable.setAttribute('aria-label','辅助表格');feedbackRow.append(element('td','嵌套反馈'));feedbackBody.append(feedbackRow);feedbackTable.append(feedbackBody);
const disclosureFeedback=element('div'),disclosureSummary=element('p','合成读取说明：现有记录仍保留。'),disclosureButton=element('button','查看完整说明'),disclosurePanel=element('div'),disclosureInput=element('input');disclosureButton.className='xui-button';disclosureButton.type='button';disclosureInput.className='xui-input';disclosureInput.setAttribute('aria-label','详情备注');disclosureInput.value='保留值';disclosurePanel.append(element('p','完整合成详情，无任何用户数据。'.repeat(40)),disclosureInput);disclosureFeedback.append(disclosureSummary,disclosureButton,disclosurePanel);const disclosure=createDisclosureController(disclosureButton,disclosurePanel);
const tableRoot=element('section');tableRoot.id='records-table';
const tableOptions=()=>{const state=owner.getState();return {label:'合成记录表格',layout,rows:state.rows,columns:visibleColumns(),rowKey,status:state.status,filtered:state.filtered,labels:{...tableLabels,...(query.has('long-error')?{error:tableLabels.error.repeat(30)}:{}),...(query.has('no-count')?{count:()=>''}:{})},onRetry:owner.retry,striped:true,toolbar:internal&&!noSearch?toolbar:undefined,feedback:query.has('disclosure-feedback')?disclosureFeedback:query.has('nested-feedback')?feedbackTable:undefined,pagination:query.has('no-pagination')?undefined:query.has('cursor')?{mode:'cursor',nextCursor:state.nextCursor,hasPrevious:state.hasPrevious,pageSize:state.pageSize,total:state.total,pageSizeOptions:[20,50,100],onNext:owner.next,onPrevious:owner.previous,onPageSizeChange:query.has('fixed-page-size')?undefined:owner.pageSize}:{pageIndex:state.pageIndex,pageIndexOffset:state.pageIndexOffset,pageSize:state.pageSize,total:state.total,pageSizeOptions:[20,50,100],onPageChange:owner.page,onPageSizeChange:query.has('fixed-page-size')?undefined:owner.pageSize}};};
const table=cards?undefined:createDataTable(tableRoot,tableOptions());
// These classes are the documented public ScrollArea/Grid/Surface native structure.
const cardRoot=element('div',undefined,'xui-scroll-area');cardRoot.style.blockSize='100%';cardRoot.dataset.testid='record-cards';
const cardViewport=element('div',undefined,'xui-scroll-viewport');cardViewport.setAttribute('role','region');cardViewport.setAttribute('aria-label','合成记录卡片');cardViewport.tabIndex=0;
const cardContent=element('div',undefined,'xui-scroll-content'),cardFeedback=element('div'),cardGrid=element('div',undefined,'xui-grid');
cardContent.append(cardFeedback,cardGrid);cardViewport.append(cardContent);cardRoot.append(cardViewport);
const retainedCards=new Map();
function renderCards(state){
  cardRoot.setAttribute('aria-busy',String(state.busy));
  cardFeedback.replaceChildren();
  if(state.busy){const loading=element('div',state.rows.length?tableLabels.refreshing:tableLabels.loading,'xui-state');loading.role='status';cardFeedback.append(loading);}
  else if(state.status==='error'){const error=element('div',undefined,'xui-state xui-state-error');error.role='alert';error.append(element('strong',tableLabels.error,'xui-strong'),button(tableLabels.retry,()=>owner.retry(),'outline'));cardFeedback.append(error);}
  else if(state.status==='ready'&&!state.rows.length){const empty=element('div',undefined,'xui-state');empty.append(element('strong',state.filtered?tableLabels.noMatches:tableLabels.empty,'xui-strong'));cardFeedback.append(empty);}
  const keys=new Set(state.rows.map(rowKey));
  for(const [key,card] of retainedCards)if(!keys.has(key)){card.action.onclick=null;card.node.remove();retainedCards.delete(key);}
  state.rows.forEach((row,index)=>{
    let card=retainedCards.get(row.id);
    if(!card){const node=element('section',undefined,'xui-surface'),heading=element('h2'),meta=element('p'),action=button('查看',undefined,'link');card={node,heading,meta,action,row};action.onclick=()=>inspect(card.row);node.append(heading,meta,action);retainedCards.set(row.id,card);}
    card.row=row;card.node.setAttribute('aria-label',`记录卡片 ${row.id}`);card.heading.textContent=row.name;card.meta.textContent=`${row.kind} · ${row.scope} · ${row.source}`;card.action.dataset.rowId=row.id;card.action.setAttribute('aria-label',`查看记录 ${row.id}`);
    if(cardGrid.children[index]!==card.node)cardGrid.insertBefore(card.node,cardGrid.children[index]??null);
  });
}
function render(){
  const state=owner.getState();
  for(const [field,control] of Object.entries(controls)){const value=String(state.filters[field]??'');if(control.value!==value)control.value=value;}
  refresh.disabled=fail.disabled=restoreButton.disabled=state.busy;cancel.disabled=!state.busy;
  if(cards)renderCards(state);else table.update(tableOptions());
}
// A known-size host tests composition as a column-flex item, not just a block child.
const flexHost=element('div');flexHost.style.display='flex';flexHost.style.flexDirection='column';flexHost.style.blockSize='100%';flexHost.style.minBlockSize='0';
if(query.has('flex-host')&&!cards)flexHost.append(tableRoot);
const shell=createMenuLayout(root,{items:[{id:'records',label:'合成记录',href:'#records',icon:'list'}],activeId:'records',label:'示例导航',scrollMode:query.has('unbounded')?'document':'workspace',headerSlots:{brand:element('strong','公共列表组合')},pageHeader,pageToolbar:internal||noSearch?undefined:toolbar,content:cards?cardRoot:query.has('flex-host')?flexHost:tableRoot});
const unsubscribe=owner.subscribe(render);render();
let dead=false;
function destroy(){if(dead)return;dead=true;unsubscribe();owner.destroy();disclosure.destroy();table?.destroy();shell.destroy();if(oldMinimum)root.style.setProperty(contentMinimum,oldMinimum,oldPriority);else root.style.removeProperty(contentMinimum);for(const control of Object.values(controls)){control.oninput=null;control.onchange=null;}for(const control of [refresh,fail,restoreButton,cancel,clear])control.onclick=null;for(const card of retainedCards.values())card.action.onclick=null;retainedCards.clear();}
window.dataTableDemo={owner,restore,destroy,getActions:()=>[...actions],setColumnView:(mode,hidden=[])=>{columnView={mode,hidden};render();}};
if(!query.has('manual'))owner.load();
window.addEventListener('pagehide',destroy,{once:true});
