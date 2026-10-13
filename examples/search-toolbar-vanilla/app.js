import {createSearchToolbar} from '@coffeehc/xui-runtime/search-toolbar-dom';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';
function node(tag,className='',text){const result=document.createElement(tag);result.className=className;if(text!==undefined)result.textContent=text;return result;}
function input(label,value='',multiline=false){const result=node(multiline?'textarea':'input',multiline?'xui-textarea':'xui-input');result.setAttribute('aria-label',label);result.value=value;return result;}
function button(text,run,size='default'){const result=node('button','xui-button',text);result.type='button';result.dataset.size=size;result.onclick=run;return result;}
function fragment(...nodes){const result=document.createDocumentFragment();result.append(...nodes);return result;}
let revision=0,requests=0,actionCount=0,accept=false;
const root=document.getElementById('root'),container=node('main','xui-container'),stack=node('div','xui-stack');container.style.padding='var(--layout-content-inset)';container.append(stack);root.append(container);
const title=node('header','xui-page-header');title.append(node('h1','','SearchToolbar'));stack.append(title);
const counts=node('p','xui-text');counts.dataset.testid='counts';const sync=()=>{counts.textContent=`requests:${requests};actions:${actionCount};revision:${revision}`;};
function fields(prefix){const grid=node('div','xui-grid');for(const [name,value,multiline] of [['owner','Ada',false],['notes','Keep this draft',true]]){const field=node('div','xui-field'),control=input(`${prefix} ${name}`,value,multiline),label=node('label','xui-label',`${prefix} ${name}`);control.id=`${prefix}-${name}`;label.htmlFor=control.id;field.append(label,control);if(multiline)field.append(node('p','xui-help','高级条件较长的说明'.repeat(12)));grid.append(field);}const save=button('保存这一组高级条件'.repeat(12),()=>{actionCount++;sync();});save.dataset.variant='outline';grid.append(save);return grid;}
function mount(id,options,surface=false){const host=node('div',surface?'xui-surface':'');stack.append(host);const view=createSearchToolbar(host,options);view.getElement().dataset.testid=id;return view;}
const search=input('Search records');search.type='search';const first=button('搜索',()=>{actionCount++;sync();},'xs'),second=button('新增记录',()=>{actionCount++;sync();},'lg');second.dataset.variant='outline';
mount('default-toolbar',{label:'记录搜索与操作',search,actions:fragment(first,second),advanced:fields('Default'),advancedLabel:'高级筛选'},true);
const controlledSearch=input('Controlled search'),controlledFields=fields('Controlled');let controlled;
const updateButton=button('更新内容 0',()=>update());const actionFragment=fragment(updateButton);
controlled=mount('controlled-toolbar',{label:'Controlled search',search:controlledSearch,actions:actionFragment,advanced:controlledFields,advancedLabel:'Controlled filters 0',expanded:false,onExpandedChange(next){requests++;if(accept)controlled.update({expanded:next});sync();}},true);
function update(){revision++;updateButton.textContent=`更新内容 ${revision}`;controlled.update({search:controlledSearch,actions:actionFragment,advancedLabel:`Controlled filters ${revision}`});sync();}
window.searchToolbarExample={update,setExpanded:value=>controlled.update({expanded:value}),setAdvanced:value=>controlled.update({advanced:value?controlledFields:null}),setAccept:value=>{accept=value;}};
const controls=node('div','xui-toolbar');controls.append(button('程序展开',()=>controlled.update({expanded:true})),button('程序收起',()=>controlled.update({expanded:false})),button('切换受控接受',()=>{accept=!accept;}),button('更新槽内容',update));stack.append(controls,counts);sync();
mount('initial-open',{defaultExpanded:true,advancedLabel:'Initially expanded',advanced:input('Initially visible','Retained')});
mount('search-only',{search:input('Only search')});mount('actions-only',{actions:button('Only action')});mount('advanced-only',{advancedLabel:'Only advanced',advanced:input('Only advanced content')});mount('empty-toolbar',{search:fragment(),actions:fragment(),advanced:fragment()});

mount('search-actions',{search:input('Search with actions'),actions:button('Paired action')});
mount('search-advanced',{search:input('Search with advanced'),advancedLabel:'Paired search filters',advanced:input('Search paired advanced')});
mount('actions-advanced',{actions:button('Action with advanced'),advancedLabel:'Paired action filters',advanced:input('Action paired advanced')});
