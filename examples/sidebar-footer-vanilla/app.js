import {createMenuLayout} from '@coffeehc/xui-runtime/menu-layout';
import {createDialogController} from '@coffeehc/xui-runtime/dom';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';
import {copy,fixtureOptions,shortItems,longItems,createActionModel} from '../shared/sidebar-footer-model';

const config=fixtureOptions(location.search),model=createActionModel(),root=document.getElementById('root');
const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;};
const button=(text,variant='outline')=>{const node=element('button','xui-button',text);node.type='button';node.dataset.variant=variant;return node;};
function symbol(){const node=document.createElementNS('http://www.w3.org/2000/svg','svg');node.setAttribute('width','24');node.setAttribute('height','24');node.setAttribute('viewBox','0 0 24 24');node.setAttribute('fill','none');node.setAttribute('stroke','currentColor');node.setAttribute('stroke-width','2');node.setAttribute('aria-hidden','true');for(const path of ['M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6Z','m8 12 3 3 5-6']){const child=document.createElementNS(node.namespaceURI,'path');child.setAttribute('d',path);node.append(child);}return node;}
// Documented public parts mirror SidebarFooterContent exactly. The consumer has
// no CSS: library layout owns pinning, width, compact labels and icon dimensions.
function footerContent(label,icon){const content=element('span','xui-sidebar-footer-content');if(icon){const part=element('span','xui-sidebar-footer-icon');part.setAttribute('aria-hidden','true');part.append(icon);content.append(part);}content.append(element('span','xui-sidebar-footer-label',label));return content;}
const action=button('', 'ghost');action.dataset.testid='footer-action';action.append(footerContent(copy.action,symbol()));action.onclick=()=>model.invoke();
const theme=button('', 'ghost');theme.dataset.testid='footer-theme';theme.append(footerContent(copy.theme,symbol()));theme.onclick=()=>{const modes=['light','dark','system'];window.xuiTheme.setMode(modes[(modes.indexOf(window.xuiTheme.getState().mode)+1)%modes.length]);};
const version=footerContent(copy.version,element('span',null,'v1'));version.dataset.testid='footer-version';
// Keep this consumed Fragment reference. Repeating it in update() must neither
// empty the already-mounted children nor disturb an existing focused action.
let originalFooter=document.createDocumentFragment();originalFooter.append(action,theme,version);
const replacement=footerContent(copy.replacement,symbol());replacement.dataset.testid='footer-replacement';const plain=footerContent(copy.plain);plain.dataset.testid='footer-plain';
let footerKind='original',hostFocus='trigger';
const content=element('div','xui-stack'),header=element('header','xui-page-header'),heading=element('h1',null,copy.title);heading.tabIndex=-1;heading.dataset.testid='page-heading';header.append(heading,element('p',null,'合成数据；没有产品后端、授权判断或真实许可证操作。'));
const section=element('section','xui-section');section.append(element('h2',null,'宿主业务状态'));
const field=element('div','xui-field'),label=element('label','xui-label','草稿'),draft=element('input','xui-input');label.htmlFor='footer-draft';draft.id='footer-draft';draft.value=copy.draft;field.append(label,draft);
const count=element('p');count.setAttribute('role','status');count.dataset.testid='action-count';const route=element('p',null,config.activeId);route.dataset.testid='current-route';
const toolbar=element('div','xui-toolbar'),finish=button('完成合成请求'),disable=button('切换禁用状态');finish.onclick=()=>model.finish();disable.onclick=()=>model.setState({disabled:!model.getState().disabled});toolbar.append(finish,disable);section.append(field,count,route,toolbar);
const records=element('section','xui-section');records.append(element('h2',null,'独立正文滚动'));for(let index=0;index<50;index++)records.append(element('p',null,`第 ${index+1} 条合成记录：导航更新保留草稿、底部动作与主内容。`));content.append(header,section,records);
const modal=element('dialog','xui-native-dialog xui-layer');modal.dataset.testid='host-dialog';const modalTitle=element('h2','xui-dialog-title','宿主新操作面板');modalTitle.id='footer-host-dialog-title';modal.setAttribute('aria-labelledby',modalTitle.id);const modalBody=element('div','xui-dialog-body'),modalAction=button('新表层操作');modalAction.dataset.testid='host-dialog-action';modalBody.append(modalAction);const modalFooter=element('div','xui-dialog-footer'),modalClose=button('关闭新面板');modalClose.dataset.xuiClose='';modalFooter.append(modalClose);modal.append(modalTitle,modalBody,modalFooter);document.body.append(modal);
// An unattached trigger is intentional: navigation opens this host-owned modal,
// rather than adding a competing navigation trigger or a second navigation tree.
const modalOwner=createDialogController(modal,button('合成宿主入口'),{initialFocus:modalAction,finalFocus:heading});
const syncAction=()=>{const state=model.getState();action.disabled=state.disabled||state.busy;action.setAttribute('aria-busy',String(state.busy));count.textContent=`已执行 ${state.calls} 次合成操作`;};const unsubscribe=model.subscribe(syncAction);syncAction();
let owner;
function update(next){owner.update(next);if('activeId' in next)route.textContent=next.activeId??'';}
owner=createMenuLayout(root,{items:config.items,activeId:config.activeId,location:location.href,defaultCollapsed:config.collapsed,scrollMode:config.scrollMode,title:copy.title,sidebarFooter:originalFooter,content,label:'工作导航',compactLabel:'紧凑导航',expandLabel:'展开导航',closeLabel:'关闭导航',navigation:{navigate:request=>{if(!request.sameLocation)history.pushState(null,'',request.url);update({activeId:request.id,location:request.url});if(hostFocus==='main')heading.focus();if(hostFocus==='dialog')modalOwner.open();}}});
const pop=()=>update({location:location.href,activeId:new URL(location.href).searchParams.get('page')??'overview'});window.addEventListener('popstate',pop);
window.sidebarFooterDemo={update,setList:long=>update({items:long?longItems:shortItems,activeId:long?'record-79':'overview'}),
  setFooter:kind=>{if(kind==='original'&&footerKind!=='original'){originalFooter=document.createDocumentFragment();originalFooter.append(action,theme,version);}footerKind=kind;owner.update({sidebarFooter:kind==='none'?null:kind==='plain'?plain:kind==='replacement'?replacement:originalFooter});},
  repeatFooter:()=>owner.update({sidebarFooter:footerKind==='none'?null:footerKind==='plain'?plain:footerKind==='replacement'?replacement:originalFooter}),
  setActionState:model.setState,finish:model.finish,snapshot:model.getState,setMode:mode=>window.xuiTheme.setMode(mode),setHostFocus:target=>{hostFocus=target;},setOpen:open=>owner.update({sidebarOpen:open}),getVersionNode:()=>version,
};
window.addEventListener('pagehide',()=>{unsubscribe();window.removeEventListener('popstate',pop);modalOwner.destroy();owner.destroy();},{once:true});
