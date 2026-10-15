import {createMenuLayout} from '@coffeehc/xui-runtime/menu-layout';
import {createDataTable,createDataTableFilter} from '@coffeehc/xui-runtime/data-table-dom';
import {createSearchToolbar} from '@coffeehc/xui-runtime/search-toolbar-dom';
import {createSheetController,createDisclosureController,bindSelectControl,bindPressFeedback} from '@coffeehc/xui-runtime/dom';
import {createPageCompositionExample,initialStudyDraft,studyLabels,studyStatus,validateStudyDraft} from '../shared/page-composition-model';
import '@coffeehc/xui-theme/style.css';

const doc=document,root=doc.getElementById('root'),owner=createPageCompositionExample(),long=new URLSearchParams(location.search).has('long');
const el=(tag,text,className)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
const button=(text,action,variant)=>{const node=el('button',text,'xui-button');node.type='button';node.onclick=action;if(variant)node.dataset.variant=variant;return node;};
const taskName=row=>row.name+(long?'：核对跨区域研究范围与长中文来源名称，完整内容可在详情中阅读':'');
const tone=row=>row.status==='blocked'?'warning':row.status==='done'?'success':'info';
const badge=row=>{const node=el('span',studyStatus[row.status],'xui-badge');node.dataset.tone=tone(row);return node;};
const bindings=[],cleanups=[],controls={};let dead=false,detailReturn=null;
root.style.setProperty('--layout-workspace-content-min-block-size','var(--data-table-min-block-size)');

// Stable host-owned slots; updates reuse their public controllers and never query internal DOM.
const search=el('input',undefined,'xui-input');search.type='search';search.placeholder='名称或编号';search.oninput=()=>owner.setQuery(search.value);
const filter=el('select',undefined,'xui-select');for(const [value,text] of [['all','全部状态'],...Object.entries(studyStatus)]){const option=el('option',text);option.value=value;filter.append(option);}filter.onchange=()=>owner.setFilter(filter.value);
const filterBinding=bindSelectControl(filter);bindings.push(filterBinding);
const toolbarRoot=el('div'),clear=button('清空筛选',owner.clear,'outline');
const filterActions=doc.createDocumentFragment();filterActions.append(createDataTableFilter(doc,{label:'状态',control:filter}),clear);
const toolbar=createSearchToolbar(toolbarRoot,{search:createDataTableFilter(doc,{label:'搜索任务',control:search,grow:true}),actions:filterActions});
const header=el('header',undefined,'xui-page-header'),heading=el('div'),actions=el('div',undefined,'xui-toolbar');heading.append(el('h1','研究任务'));
const spinner=el('span',undefined,'xui-spinner');spinner.setAttribute('aria-hidden','true');
const refresh=button('刷新任务',()=>owner.refresh(),'outline'),create=button('创建研究任务');actions.append(refresh,create);header.append(heading,actions);

function sheet(id,title,trigger,options={}){
  const dialog=el('dialog',undefined,'xui-native-dialog xui-layer');dialog.id=id;dialog.setAttribute('aria-labelledby',`${id}-title`);
  const header=el('header',undefined,'xui-dialog-header'),heading=el('div',undefined,'xui-dialog-heading'),h=el('h2',title,'xui-dialog-title'),close=button('关闭',null,'outline');close.setAttribute('aria-label',`关闭${title}`);close.setAttribute('data-xui-close','');heading.append(h);header.append(heading,close);
  h.id=`${id}-title`;const body=el('div',undefined,'xui-dialog-body'),footer=el('footer',undefined,'xui-dialog-footer');dialog.append(header,body,footer);root.append(dialog);
  const controller=createSheetController(dialog,trigger,options);return {dialog,h,close,body,footer,controller};
}
const creation=sheet('create-study','创建研究任务',create,{onOpenChange(open,details){if(owner.getState().saving){details.cancel();return;}if(!open)resetForm();}});
const form=el('form');form.id='research-form';form.noValidate=true;
const region=el('section',undefined,'xui-data-region'),stack=el('div',undefined,'xui-stack'),feedback=el('div',undefined,'xui-feedback-slot');feedback.dataset.layout='flow';region.append(stack,feedback);form.append(region);creation.body.append(form);
const fieldset=el('fieldset',undefined,'xui-fieldset');fieldset.dataset.layout='stack';fieldset.append(el('legend','研究范围','xui-label'));
const grid=el('div',undefined,'xui-form-grid');grid.dataset.columns='2';fieldset.append(grid);stack.append(fieldset);
function item(parent,control,{key,label,required=false,full=false,help}={}){
  const wrapper=el('div',undefined,'xui-form-item');if(full)wrapper.dataset.span='full';
  const field=el('div',undefined,'xui-field'),caption=el('label',label+(required?' *':''),'xui-label');control.id=`study-${key}`;caption.htmlFor=control.id;control.required=required;field.append(caption,control);
  const error=el('p',undefined,'xui-error');error.id=`${control.id}-error`;error.hidden=true;field.append(error);control.setAttribute('aria-describedby',error.id);
  if(help){const description=el('p',help,'xui-help');description.id=`${control.id}-help`;field.append(description);control.setAttribute('aria-describedby',`${description.id} ${error.id}`);}
  wrapper.append(field);parent.append(wrapper);controls[key]={control,error};return wrapper;
}
for(const [key,label,values] of [['template','冻结模板',['公开账户 BUY 行为研究']],['scope','研究范围',['通用']]]){
  const control=el('select',undefined,'xui-select');for(const text of values){const option=el('option',text);control.append(option);}item(grid,control,{key,label,required:true});bindings.push(bindSelectControl(control));
}
for(const [key,label] of [['candidateLimit','候选账户上限'],['lookbackDays','回看天数']]){const control=el('input',undefined,'xui-input');control.type='number';control.min='1';item(grid,control,{key,label,required:true});}
const choiceItem=el('div',undefined,'xui-form-item');choiceItem.dataset.span='full';const choice=el('label',undefined,'xui-choice-label'),checkbox=el('input',undefined,'xui-choice');checkbox.type='checkbox';choice.append(checkbox,doc.createTextNode('允许未分类成交进入通用分析（不依据榜单分类推断交易范围）'));choiceItem.append(choice);grid.append(choiceItem);
const disclosureRoot=el('section',undefined,'xui-disclosure'),disclosureTrigger=button('研究说明',null,'ghost');disclosureTrigger.classList.add('xui-disclosure-trigger');const disclosureBody=el('div',undefined,'xui-disclosure-content'),notesGrid=el('div',undefined,'xui-form-grid');notesGrid.dataset.columns='1';disclosureBody.append(notesGrid);disclosureRoot.append(disclosureTrigger,disclosureBody);stack.append(disclosureRoot);
item(notesGrid,el('textarea',undefined,'xui-textarea'),{key:'notes',label:long?'补充研究范围、来源说明与需要人工复核的完整中文信息':'补充说明',full:true,help:'记录需要人工复核的研究条件。'});
const disclosure=createDisclosureController(disclosureTrigger,disclosureBody);
const formActions=el('div',undefined,'xui-form-actions'),secondary=el('div',undefined,'xui-form-actions-secondary'),primary=el('div',undefined,'xui-form-actions-primary'),cancel=button('取消',()=>creation.controller.close(),'outline'),submit=button('创建任务');submit.type='submit';submit.setAttribute('form',form.id);secondary.append(cancel);primary.append(submit);formActions.append(secondary,primary);creation.footer.append(formActions);
function resetForm(){const draft=initialStudyDraft();for(const [key,{control,error}] of Object.entries(controls)){control.value=draft[key];control.removeAttribute('aria-invalid');error.hidden=true;error.textContent='';}checkbox.checked=false;feedback.replaceChildren();disclosure.syncOpen(false);bindings.forEach(binding=>binding.update());}
form.onsubmit=async event=>{
  event.preventDefault();if(owner.getState().saving)return;
  const draft={...initialStudyDraft(),...Object.fromEntries(Object.entries(controls).map(([key,{control}])=>[key,control.value])),allowUnclassified:checkbox.checked},errors=validateStudyDraft(draft);feedback.replaceChildren();
  for(const [key,{control,error}] of Object.entries(controls)){error.textContent=errors[key]??'';error.hidden=!errors[key];if(errors[key])control.setAttribute('aria-invalid','true');else control.removeAttribute('aria-invalid');}
  const invalid=Object.keys(errors)[0];if(invalid){controls[invalid].control.focus();return;}
  try{await owner.create(draft);if(!dead)creation.controller.close();}catch(cause){if(!dead&&cause.name!=='AbortError'){const error=el('div',undefined,'xui-state xui-state-error');error.setAttribute('role','alert');error.append(el('strong','创建未完成，请保留当前输入并重试。','xui-strong'));feedback.replaceChildren(error);}}
};
// A separate native sheet returns focus to the actual name action used to open it.
const detailTrigger=button('研究任务详情');detailTrigger.hidden=true;root.append(detailTrigger);
const detail=sheet('study-detail','研究任务详情',detailTrigger,{finalFocus:()=>detailReturn});
const detailActions=el('div',undefined,'xui-form-actions'),detailPrimary=el('div',undefined,'xui-form-actions-primary'),detailClose=button('关闭详情',()=>detail.controller.close(),'outline');detailPrimary.append(detailClose);detailActions.append(detailPrimary);detail.footer.append(detailActions);
function inspect(row,action){owner.select(row.id);detailReturn=action;detail.controller.syncOpen(true);render();}
const columns=[
  {id:'id',header:'编号',width:'7rem',cell:row=>el('code',row.id,'xui-code')},
  {id:'name',header:'研究任务',width:'18rem',cell:row=>{let current=row;const action=button(taskName(row),()=>inspect(current,action),'link');return {element:action,update(next){current=next;action.textContent=taskName(next);},destroy(){action.onclick=null;}};}},
  {id:'status',header:'状态',width:'8rem',cell:row=>{const node=badge(row);return {element:node,update(next){node.textContent=studyStatus[next.status];node.dataset.tone=tone(next);}};}},
  {id:'reason',header:'待办事项',width:'20rem',cell:row=>row.reason||'—'},
];
const tableRoot=el('section'),empty=el('div',undefined,'xui-state'),emptyTitle=el('strong',undefined,'xui-strong'),emptyAction=button('创建研究任务',()=>creation.controller.syncOpen(true),'outline');empty.append(emptyTitle,emptyAction);
const rowKey=row=>row.id,rowState=row=>({selected:row.id===owner.getState().selectedId});
const tableOptions=()=>{const state=owner.getState();return {label:'研究任务列表',rows:state.rows,columns,rowKey,rowState,toolbar:toolbarRoot,status:state.status,filtered:state.filtered,labels:studyLabels,onRetry:()=>owner.retry(),emptyState:empty,pagination:{pageIndex:state.pageIndex,pageIndexOffset:0,pageSize:state.pageSize,pageSizeOptions:[5,10,20],total:state.total,onPageChange:owner.page,onPageSizeChange:owner.pageSize}};};
const table=createDataTable(tableRoot,tableOptions());
// createMenuLayout owns only this shell root, so modal siblings remain outside its content slot.
const shellRoot=el('div');root.prepend(shellRoot);const shell=createMenuLayout(shellRoot,{items:[{id:'research',label:'研究任务',href:'#research',icon:'folder'}],activeId:'research',label:'工作导航',compactLabel:'收起导航',expandLabel:'展开导航',closeLabel:'关闭导航',scrollMode:'workspace',headerSlots:{brand:el('strong','研究工作区')},pageHeader:header,content:tableRoot});
function render(){
  const state=owner.getState();if(search.value!==state.query)search.value=state.query;if(filter.value!==state.filter)filter.value=state.filter;filterBinding.update();
  clear.hidden=!state.filtered||(!state.rows.length&&state.status!=='error');refresh.disabled=state.busy;refresh.setAttribute('aria-busy',String(state.busy));if(state.busy&&!spinner.isConnected)refresh.prepend(spinner);if(!state.busy)spinner.remove();
  fieldset.disabled=submit.disabled=cancel.disabled=creation.close.disabled=state.saving;form.setAttribute('aria-busy',String(state.saving));submit.setAttribute('aria-busy',String(state.saving));submit.textContent=state.saving?'正在创建…':'创建任务';for(const {control} of Object.values(controls))control.disabled=state.saving;bindings.forEach(binding=>binding.update());
  emptyTitle.textContent=state.filtered?'没有匹配的任务':'还没有研究任务';emptyAction.textContent=state.filtered?'清空筛选':'创建研究任务';emptyAction.onclick=state.filtered?owner.clear:()=>creation.controller.syncOpen(true);table.update(tableOptions());
  if(state.selected&&detail.dialog.open){detail.h.textContent=taskName(state.selected);const facts=el('dl',undefined,'xui-details');for(const [label,value] of [['编号',state.selected.id],['冻结模板',state.selected.template],['研究范围',state.selected.scope],['候选账户上限',state.selected.candidateLimit],['回看天数',state.selected.lookbackDays]])facts.append(el('dt',label),el('dd',String(value)));const stack=el('div',undefined,'xui-stack');stack.append(badge(state.selected));if(state.selected.reason)stack.append(el('p',state.selected.reason));stack.append(facts);if(state.selected.notes)stack.append(el('p',state.selected.notes));detail.body.replaceChildren(stack);}
}
// Opening the detail sheet is a view action; read refreshes do not close it or reset form inputs.
detail.dialog.addEventListener('xui:change',event=>{if(event.detail.value)queueMicrotask(render);});
const unsubscribe=owner.subscribe(render);cleanups.push(bindPressFeedback(creation.dialog),bindPressFeedback(detail.dialog));resetForm();render();void owner.load();
function destroy(){if(dead)return;dead=true;unsubscribe();owner.destroy();bindings.forEach(binding=>binding.destroy());cleanups.forEach(cleanup=>cleanup());toolbar.destroy();disclosure.destroy();table.destroy();creation.controller.destroy();detail.controller.destroy();shell.destroy();form.onsubmit=null;for(const node of [refresh,create,cancel,submit,clear,emptyAction,detailClose])node.onclick=null;search.oninput=filter.onchange=null;root.replaceChildren();root.style.removeProperty('--layout-workspace-content-min-block-size');}
window.pageCompositionDemo={owner,destroy};window.addEventListener('pagehide',destroy,{once:true});
