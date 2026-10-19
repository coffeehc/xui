import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {Container} from '@coffeehc/xui-react/layout';
import {resolveDefaultPages} from '@coffeehc/xui-runtime/config';
import {BusinessLogExplorer,type BusinessLogRenderer,type BusinessLogListPresentation,type BusinessLogLabels} from '@coffeehc/xui-react/business-log';
import {createBusinessLogViewController} from '@coffeehc/xui-runtime/component-views';
import {businessLogDefaultLabels} from '@coffeehc/xui-runtime/business-log';
import {Button} from '@coffeehc/xui-react/button';
import chineseLabels from '../shared/business-log-labels.json';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import {createBusinessLogExample} from '../shared/business-log-model';
import '@coffeehc/xui-theme/critical.css';
const query=new URLSearchParams(location.search),configured=query.has('defaults'),application=bootstrapBrowserExample(configured?{pages:{businessLog:{title:'公共业务日志',pageSize:3}}}:{}),pages=resolveDefaultPages(application.config);
const example=createBusinessLogExample(location.href,configured?pages.businessLog.options:undefined),root=createRoot(document.getElementById('root')!);
if(configured)Object.assign(window,{defaultPagesDemo:{config:application.config,pages}});
const renderers:BusinessLogRenderer<React.ReactNode>[]=[{eventType:'order.approved',schemaVersion:1,render:detail=><p>{example.renderApproved(detail)}</p>},{eventType:'demo.renderer.fail',schemaVersion:1,render:()=>{throw Error('FAKE_PRIVATE_RENDER_ERROR');}}];
const activityList=(locale='zh-CN'):BusinessLogListPresentation=>({
 columns:['actor','occurredAt','summary','result','detail'],
 formatActor:actor=>actor.display_name??actor.id,
 formatAction:action=>({approve:'审核通过',reindex:'重建索引',update:'更新',revoke:'撤销',refund:'退款',run:'执行'}[action]??action),
 // The example host owns locale/time zone; the library keeps the original ISO fact.
 formatOccurredAt:iso=>new Intl.DateTimeFormat(locale,{timeZone:query.get('time-zone')??undefined,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(iso)),
});
// Labels are presentation inputs. The same service/view, draft and snapshot survive locale changes.
const owner=query.get('owner'),viewController=owner==='view'?createBusinessLogViewController({service:example.controller}):undefined;
let updateList:(next:BusinessLogListPresentation|undefined)=>void=()=>{},updateLabels:(next:Partial<BusinessLogLabels>|undefined)=>void=()=>{},updateOptionsLabels:(next:Partial<BusinessLogLabels>|undefined)=>void=()=>{};
function App(){
 const [list,setList]=React.useState<BusinessLogListPresentation|undefined>(()=>query.has('activity')?activityList(query.get('locale')??'zh-CN'):undefined);
 const [labels,setLabels]=React.useState<Partial<BusinessLogLabels>>(),[optionsLabels,setOptionsLabels]=React.useState<Partial<BusinessLogLabels>|undefined>(example.controller.labels);
 React.useLayoutEffect(()=>{updateList=setList;updateLabels=setLabels;updateOptionsLabels=setOptionsLabels;return()=>{updateList=()=>{};updateLabels=()=>{};updateOptionsLabels=()=>{};};},[]);
 React.useEffect(()=>{if(owner!=='options')void example.controller.refresh();return()=>example.controller.cancel();},[]);
 const source=owner==='options'?{options:{...example.controller.options,labels:optionsLabels}}:viewController?{viewController}:{controller:example.controller};
 return <MenuLayout title="xui" label="管理导航" items={[{id:'business-log',label:'业务日志',icon:'folder',href:location.pathname}]} activeId="business-log"><Container><BusinessLogExplorer {...source} renderers={renderers} list={list} labels={labels} headerActions={query.has('labels')?<><Button variant="outline" onClick={()=>setLabels(chineseLabels)}>中文</Button><Button variant="outline" onClick={()=>setLabels(businessLogDefaultLabels)}>English</Button></>:undefined}/></Container></MenuLayout>;
}
root.render(<React.StrictMode><App/></React.StrictMode>);
Object.assign(window,{businessLogDemo:{...example,viewController,activityList,setList:(next:BusinessLogListPresentation|undefined)=>updateList(next),setLabels:(next:Partial<BusinessLogLabels>|undefined)=>updateLabels(next),setOptionsLabels:(next:Partial<BusinessLogLabels>|undefined)=>updateOptionsLabels(next),setLocale:(locale:string)=>updateLabels(locale==='zh-CN'?chineseLabels:businessLogDefaultLabels),destroy(){root.unmount();viewController?.destroy();example.destroy();}}});
window.addEventListener('pagehide',()=>{viewController?.destroy();example.destroy();},{once:true});
