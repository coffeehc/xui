import {createDataTable} from '@coffeehc/xui-runtime/data-table-dom';
import '@coffeehc/xui-theme/style.css';
const root=document.getElementById('root');
root.innerHTML='<main class="xui-stack" style="padding:var(--space-section-gap)"><h1>共享目录行事件</h1><div class="xui-toolbar">'+['排序','更新数据','刷新状态','禁用状态','空数据'].map((name,i)=>'<button type="button" class="xui-button" id="action-'+i+'">'+name+'</button>').join('')+'</div><output aria-label="事件结果"></output><div style="block-size:var(--layout-table-viewport-height);min-block-size:0"><div id="table"></div></div></main>';
let data=Array.from({length:6},(_,i)=>({id:'row-'+(i+1),name:'共享目录 '+(i+1)+' '+'长中文目录名称完整保留'.repeat(2),revision:1})),page=0,reverse=false,refresh=false,disabled=false,empty=false,double=0,cellCalls=0,clicks=0,keys=0,contextCalls=0,last='';
const show=()=>root.querySelector('output').textContent='double '+double+' cell '+cellCalls+' clicks '+clicks+' keys '+keys+' context '+contextCalls+' | '+last;
const open=row=>{cellCalls++;last=row.id+' r'+row.revision;show();};
const columns=[
 {id:'name',header:'名称',sticky:'start',width:'8rem',cell:()=>{
  const element=document.createElement('button');element.type='button';element.className='xui-button';element.dataset.variant='link';
  return {element,update(row,context){element.textContent=row.name;element.setAttribute('aria-label','打开 '+row.id);element.disabled=context.disabled;element.onclick=()=>open(row);},destroy(){element.onclick=null;}};
 }},
 {id:'details',header:'路径',width:'30rem',cell:row=>{const span=document.createElement('span');span.tabIndex=0;span.setAttribute('aria-label','读取 '+row.id);span.textContent='/共享目录/'+row.id+'/详情 '+'可读取长中文事实，行双击仅作为快捷入口。'.repeat(3);return span;}},
 {id:'actions',header:'独立动作',width:'14rem',cell:()=>{
  const element=document.createElement('div');element.className='xui-table-actions';const button=document.createElement('button'),link=document.createElement('a'),label=document.createElement('label'),input=document.createElement('input');
  button.className=link.className='xui-button';button.type='button';button.textContent='按钮';link.dataset.variant='link';link.textContent='链接';label.className='xui-choice-label';input.className='xui-choice';input.type='checkbox';label.append(input,document.createTextNode("勾选"));element.append(button,link,label);
  return {element,update(row,context){button.setAttribute('aria-label','按钮 '+row.id);button.disabled=input.disabled=context.disabled;button.onclick=()=>open(row);link.href='#'+row.id;link.setAttribute('aria-label','链接 '+row.id);link.onclick=event=>event.preventDefault();input.setAttribute('aria-label','勾选 '+row.id);},destroy(){button.onclick=link.onclick=null;}};
 }}
];
const options=()=>{const ordered=reverse?[...data].reverse():data;return {label:'共享目录',layout:'workspace',rows:empty?[]:ordered.slice(page*3,page*3+3),columns,rowKey:row=>row.id,striped:true,status:refresh?'refreshing':'ready',disabled,rowState:row=>({selected:row.id==='row-1',expanded:row.id==='row-2'}),rowEvents:{
 onDoubleClick:(row,context)=>{double++;last=row.id+' r'+row.revision+' index '+context.rowIndex+' key '+context.rowKey;show();},onClick:()=>{clicks++;show();},onContextMenu:(row,context,event)=>{event.preventDefault();contextCalls++;show();},onKeyDown:(row,context,event)=>{if(event.key==='Enter'){event.preventDefault();keys++;last=row.id+" r"+row.revision+" index "+context.rowIndex+" key "+context.rowKey;show();}}
 },pagination:{mode:'cursor',pageSize:3,total:null,nextCursor:page===0?'page-2':null,hasPrevious:page>0,onNext:()=>{page=1;table.update(options());},onPrevious:()=>{page=0;table.update(options());}}};};
const table=createDataTable(document.getElementById('table'),options());
const actions=[()=>reverse=!reverse,()=>data=data.map(row=>({...row,revision:row.revision+1})),()=>refresh=!refresh,()=>disabled=!disabled,()=>empty=!empty];
actions.forEach((action,index)=>document.getElementById('action-'+index).onclick=()=>{action();table.update(options());});show();
window.addEventListener('pagehide',()=>table.destroy(),{once:true});
