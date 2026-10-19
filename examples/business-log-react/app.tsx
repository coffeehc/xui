import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {Container} from '@coffeehc/xui-react/layout';
import {resolveDefaultPages} from '@coffeehc/xui-runtime/config';
import {BusinessLogExplorer,type BusinessLogRenderer,type BusinessLogExplorerListPresentation,type BusinessLogLabels} from '@coffeehc/xui-react/business-log';
import {createBusinessLogViewController} from '@coffeehc/xui-runtime/component-views';
import {businessLogDefaultLabels} from '@coffeehc/xui-runtime/business-log';
import {Button} from '@coffeehc/xui-react/button';
import {OverflowText} from '@coffeehc/xui-react/display';
import {Badge} from '@coffeehc/xui-react/feedback';
import {QueryField} from '@coffeehc/xui-react/search-toolbar';
import {SimpleSelect} from '@coffeehc/xui-react/forms';
import {ClipboardService} from '@coffeehc/xui-runtime/clipboard';
import {createToastController} from '@coffeehc/xui-runtime/toast';
import {Toast,type ToastPayload} from '@coffeehc/xui-react/toast';
import chineseLabels from '../shared/business-log-labels.json';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import {createBusinessLogExample} from '../shared/business-log-model';
import '@coffeehc/xui-theme/critical.css';
const query=new URLSearchParams(location.search),configured=query.has('defaults'),application=bootstrapBrowserExample(configured?{pages:{businessLog:{title:'公共业务日志',pageSize:3}}}:{}),pages=resolveDefaultPages(application.config);
const example=createBusinessLogExample(location.href,configured?pages.businessLog.options:undefined),root=createRoot(document.getElementById('root')!);
if(configured)Object.assign(window,{defaultPagesDemo:{config:application.config,pages}});
const renderers:BusinessLogRenderer<React.ReactNode>[]=[{eventType:'order.approved',schemaVersion:1,render:detail=><p>{example.renderApproved(detail)}</p>},{eventType:'demo.renderer.fail',schemaVersion:1,render:()=>{throw Error('FAKE_PRIVATE_RENDER_ERROR');}}];
const notifications=createToastController<ToastPayload>();
const activityList=(locale='zh-CN',labels:BusinessLogLabels=chineseLabels):BusinessLogExplorerListPresentation=>({
 columns:[
  {id:'actor',header:labels.actor,cell:({event})=>event.actor.display_name??event.actor.id},
  // The host owns locale/time zone; the library keeps the original ISO fact.
  {id:'occurred_at',header:labels.occurredAt,cell:({value})=>new Intl.DateTimeFormat(locale,{timeZone:query.get('time-zone')??undefined,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(String(value)))},
  {id:'summary',header:labels.summary},{id:'result',header:labels.result,cell:({event})=>labels[event.result]},
  {id:'detail',header:labels.detail},
 ],
});
function SessionCell({id,name}:{id:string;name:string}){
 const action=React.useRef<HTMLButtonElement>(null);
 return <Button ref={action} variant="ghost" size="xs" aria-label={`复制会话 ID ${id}`} onClick={()=>{void ClipboardService.writeText(id).then(()=>notifications.add({title:'已复制会话 ID',type:'success'}),()=>notifications.add({title:'复制失败，请重试',type:'error'}));}}><OverflowText interactionRef={action} text={`${name} (${id})`}/></Button>;
}
const cellsList=(locale='zh-CN',labels:BusinessLogLabels=chineseLabels):BusinessLogExplorerListPresentation=>({
 columns:[
  {id:'owner_name',header:'所属用户',width:'10rem'},
  {id:'session',header:'所属会话',width:'20rem',overflow:'ellipsis',cell:({value})=>{
   if(!value||typeof value!=='object'||Array.isArray(value)||!('id'in value)||typeof value.id!=='string')return null;
   return <SessionCell id={value.id} name={'name'in value&&typeof value.name==='string'?value.name:value.id}/>;
  }},
  {id:'occurred_at',header:labels.occurredAt,width:'13rem',cell:activityList(locale,labels).columns![1].cell},
  {id:'summary',header:labels.summary,width:'18rem',overflow:'wrap'},
  {id:'result',header:labels.result,width:'8rem',cell:({event})=><Badge>{labels[event.result]}</Badge>},
  {id:'detail',header:labels.detail,width:'10rem'},
 ],
});
// Labels are presentation inputs. The same service/view, draft and snapshot survive locale changes.
const owner=query.get('owner'),viewController=owner==='view'?createBusinessLogViewController({service:example.controller}):undefined;
let updateResource:(next:string)=>void=()=>{};
let updateList:(next:BusinessLogExplorerListPresentation|undefined)=>void=()=>{},updateLabels:(next:Partial<BusinessLogLabels>|undefined)=>void=()=>{},updateOptionsLabels:(next:Partial<BusinessLogLabels>|undefined)=>void=()=>{};
function changeLocale(locale:string){const labels=locale==='zh-CN'?chineseLabels:businessLogDefaultLabels;updateLabels(labels);if(query.has('cells'))updateList(cellsList(locale,labels));else if(query.has('activity'))updateList(activityList(locale,labels));}
function App(){
 const [scope,setScope]=React.useState('');
 const changeResource=React.useCallback((next:string)=>{setScope(next);example.setScope(next);void example.controller.setFilter(example.controller.getState().filter);},[]);
 const [list,setList]=React.useState<BusinessLogExplorerListPresentation|undefined>(()=>query.has('cells')?cellsList():query.has('activity')?activityList(query.get('locale')??'zh-CN'):undefined);
 const [labels,setLabels]=React.useState<Partial<BusinessLogLabels>>(),[optionsLabels,setOptionsLabels]=React.useState<Partial<BusinessLogLabels>|undefined>(example.controller.labels);
 React.useLayoutEffect(()=>{updateResource=changeResource;updateList=setList;updateLabels=setLabels;updateOptionsLabels=setOptionsLabels;return()=>{updateResource=()=>{};updateList=()=>{};updateLabels=()=>{};updateOptionsLabels=()=>{};};},[changeResource]);
 React.useEffect(()=>{if(owner!=='options')void example.controller.refresh();return()=>example.controller.cancel();},[]);
 const source=owner==='options'?{options:{...example.controller.options,labels:optionsLabels}}:viewController?{viewController}:{controller:example.controller};
 return <Toast.Provider controller={notifications}><Toast.View/><MenuLayout title="xui" label="管理导航" items={[{id:'business-log',label:'业务日志',icon:'folder',href:location.pathname}]} activeId="business-log"><Container><BusinessLogExplorer {...source} renderers={renderers} list={list} labels={labels} queryFields={query.has('cells')?<QueryField label="资源范围" width="standard"><SimpleSelect value={scope} onChange={event=>changeResource(event.target.value)}><option value="">全部资源</option><option value="order">订单</option><option value="knowledge">知识库</option></SimpleSelect></QueryField>:undefined} querySummary={query.has('cells')?<span>已生效范围：{scope||'全部资源'}</span>:undefined} headerActions={query.has('labels')?<><Button variant="outline" onClick={()=>changeLocale('zh-CN')}>中文</Button><Button variant="outline" onClick={()=>changeLocale('en')}>English</Button></>:undefined}/></Container></MenuLayout></Toast.Provider>;
}
root.render(<React.StrictMode><App/></React.StrictMode>);
Object.assign(window,{businessLogDemo:{...example,viewController,activityList,cellsList,setResource:(next:string)=>updateResource(next),setList:(next:BusinessLogExplorerListPresentation|undefined)=>updateList(next),setLabels:(next:Partial<BusinessLogLabels>|undefined)=>updateLabels(next),setOptionsLabels:(next:Partial<BusinessLogLabels>|undefined)=>updateOptionsLabels(next),setLocale:changeLocale,destroy(){root.unmount();viewController?.destroy();example.destroy();notifications.destroy();}}});
window.addEventListener('pagehide',()=>{viewController?.destroy();example.destroy();},{once:true});
