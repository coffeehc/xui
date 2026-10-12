import {createMenuLayout} from '@coffeehc/xui-runtime/menu-layout';
import {createPopoverController,createContextMenuController,createSubmenuController} from '@coffeehc/xui-runtime/dom';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';
import {copy,fixtureOptions} from '../shared/layout-typography-model';

const config=fixtureOptions(location.search),root=document.getElementById('root');
const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;};
const button=text=>{const node=element('button','xui-button',text);node.type='button';node.dataset.variant='outline';return node;};
// These are the documented public HTML parts. There is no fixture CSS or private
// selector override, and no React or peer import in this consumer.
const content=element('div','xui-stack');
content.innerHTML=`<header class="xui-page-header"><div><h1>布局与文字验收</h1><p>合成数据；所有布局和字体来自正式 xui 包。</p></div></header>
<section class="xui-section"><header class="xui-section-header"><h2>操作与表单</h2></header><div class="xui-toolbar" data-testid="menu-triggers"></div>
<div class="xui-field" data-testid="field"><label class="xui-label" for="fixture-draft">项目名称 <span aria-hidden="true">*</span></label><input class="xui-input" id="fixture-draft" required aria-invalid="true" aria-describedby="fixture-draft-help fixture-draft-error"><p class="xui-help" id="fixture-draft-help">名称用于识别当前项目。</p><p class="xui-error" id="fixture-draft-error">请确认名称后再保存。</p></div>
<fieldset class="xui-fieldset"><legend class="xui-label">通知与权限</legend><label class="xui-choice-label"><input type="checkbox" class="xui-choice"><span data-testid="checkbox-label-text">接收项目更新通知</span></label><label class="xui-choice-label"><input type="radio" name="visibility" class="xui-choice"><span data-testid="radio-label-text">仅团队成员可见</span></label><label class="xui-choice-label"><input type="checkbox" role="switch" class="xui-choice"><span data-testid="switch-label-text">启用协作提醒</span></label></fieldset><p data-testid="action-count" role="status">已执行 0 次操作</p></section>`;
content.querySelector('#fixture-draft').value=copy.draft;
const records=element('section','xui-section');records.append(element('h2',null,'独立内容滚动'));for(let index=0;index<50;index++)records.append(element('p',null,`第 ${index+1} 条合成记录：输入、导航与头部更新不会重新挂载当前工作区。`));content.append(records);
const brand=element('strong',null,copy.brand);brand.dataset.testid='header-brand';brand.title=copy.brand;
const breadcrumb=element('nav','xui-breadcrumbs');breadcrumb.setAttribute('aria-label','当前位置');const crumbs=element('ol');const first=element('li'),link=element('a',null,copy.breadcrumb[0]);link.href='#team';link.title=copy.breadcrumb[0];first.append(link);const current=element('li',null,copy.breadcrumb[1]);current.setAttribute('aria-current','page');crumbs.append(first,current);breadcrumb.append(crumbs);
const status=element('span',null,copy.status);status.setAttribute('role','status');status.dataset.testid='header-status';
const actions=element('div','xui-toolbar');let actionCount=0;for(const label of copy.actions){const action=button(label);action.onclick=()=>{content.querySelector('[data-testid="action-count"]').textContent=`已执行 ${++actionCount} 次操作`;};actions.append(action);}
const legacy=element('span',null,'原有自定义头部仍可使用');legacy.dataset.testid='legacy-header';
function slots(kind){status.textContent=kind==='updated'?copy.updatedStatus:copy.status;return {...(kind==='fallback'?{}:{brand:kind==='empty-brand'?null:brand}),breadcrumb,status,actions:kind==='no-actions'?null:actions};}
let owner;
function updateHeader(kind){owner.update({header:kind==='legacy'?legacy:undefined,headerSlots:kind==='legacy'?undefined:slots(kind)});}
owner=createMenuLayout(root,{items:config.items,activeId:config.activeId,defaultCollapsed:config.collapsed,title:'后备品牌标题',header:config.header==='legacy'?legacy:undefined,headerSlots:config.header==='legacy'?undefined:slots(config.header),content,label:'工作导航',compactLabel:'紧凑导航',expandLabel:'展开导航',closeLabel:'关闭导航',scrollMode:config.scrollMode,navigation:{navigate:request=>owner.update({activeId:request.id})}});

const symbol=illustration=>{const wrapper=element('span',illustration?null:'xui-menu-icon');wrapper.innerHTML=`<svg class="lucide lucide-folder ${illustration?'xui-illustration-icon':''}" ${illustration?'data-illustration':'data-menu-symbol'} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="var(--icon-stroke-width)" aria-hidden="true"><path d="M3 7h7l2 2h9v11H3Z"/><path d="M3 7V4h6l3 3"/></svg>`;return wrapper;};
const popup=id=>{const node=element('div','xui-layer xui-floating xui-native-popup xui-menu-popup');node.dataset.testid=id;return node;};
const item=(label,id,role='menuitem',illustration=false,tag='button')=>{const node=element(tag,'xui-menu-item');if(tag==='button')node.type='button';node.setAttribute('role',role);node.dataset.testid=id;node.append(symbol(illustration),document.createTextNode(label));return node;};
const controllers=[];
function makeMenu(trigger,context=false){
  const prefix=context?'context-':'',menu=popup(context?'context-popup':'ordinary-popup');
  const ordinary=item(context?'上下文菜单项':'普通菜单项',context?'context-item':'ordinary-item');
  const check=item(context?'上下文复选项':'复选菜单项',`${prefix}checkbox-item`,'menuitemcheckbox');check.setAttribute('aria-checked','true');check.onclick=()=>check.setAttribute('aria-checked',String(check.getAttribute('aria-checked')!=='true'));
  const radio=item(context?'上下文单选项':'单选菜单项',`${prefix}radio-item`,'menuitemradio');radio.setAttribute('aria-checked','true');
  const other=item('另一单选菜单项',`${prefix}other-radio-item`,'menuitemradio');other.setAttribute('aria-checked','false');for(const option of [radio,other])option.onclick=()=>{for(const candidate of [radio,other])candidate.setAttribute('aria-checked',String(candidate===option));};
  const more=item(context?'更多上下文操作':'更多项目操作',`${prefix}submenu-trigger`),sub=popup(`${prefix}submenu-popup`);sub.append(item(context?'上下文子菜单操作':'子菜单操作',`${prefix}submenu-item`));
  menu.append(ordinary);if(!context){const link=item('链接菜单项','link-item','menuitem',false,'a');link.href='#menu-link';menu.append(link);}menu.append(check,radio,other,more,sub);if(!context)menu.append(item('嵌套插图保持尺寸','illustration-item','menuitem',true));document.body.append(menu);
  controllers.push(context?createContextMenuController(trigger,menu):createPopoverController(trigger,menu,{menu:true}),createSubmenuController(more,sub));
}
const trigger=button('打开操作菜单'),context=element('div','xui-context-trigger','记录上下文操作区域');context.tabIndex=0;context.setAttribute('aria-label','记录上下文操作区域');context.dataset.testid='context-trigger';content.querySelector('[data-testid="menu-triggers"]').append(trigger,context);makeMenu(trigger);makeMenu(context,true);
function useFragments(){
  const actionFragment=document.createDocumentFragment(),legacyFragment=document.createDocumentFragment();
  for(const label of ['片段操作一','片段操作二'])actionFragment.append(button(label));
  const legacyText=element('span',null,'DocumentFragment 扩展头部');legacyText.dataset.testid='legacy-fragment';legacyFragment.append(legacyText,button('片段扩展操作'));
  owner.update({headerSlots:{brand,breadcrumb,status,actions:actionFragment},header:legacyFragment});
}
window.layoutTypography={updateHeader,useFragments,navigate:id=>owner.update({activeId:id}),setMode:mode=>window.xuiTheme.setMode(mode)};
