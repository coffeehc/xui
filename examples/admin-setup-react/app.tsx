import * as React from 'react';
import {hydrateRoot,createRoot} from 'react-dom/client';
import {AdminSetupPage,type AdminSetupState,type AdminSetupResult,type AdminSetupCheckResult} from '@coffeehc/xui-react/admin-setup';
import {resolveDefaultPages} from '@coffeehc/xui-runtime/config';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/style.css';
const passwordLabels={showPassword:'显示密码',hidePassword:'隐藏密码'};
const application=(new URLSearchParams(location.search).has('defaults')||new URLSearchParams(location.search).has('embed'))?bootstrapBrowserExample({app:{name:'Example'},pages:{adminSetup:{title:'创建管理员'}}}):undefined,pages=application?resolveDefaultPages(application.config):undefined,config=pages?.adminSetup.config??{productName:'Example',title:'创建管理员'};
if(application)Object.assign(window,{defaultPagesDemo:{config:application.config,pages}});
const labels=new URLSearchParams(location.search).has('long')?{rejected:'暂时无法创建管理员。请检查输入的用户名，然后再试。'.repeat(8)}:undefined;
let checks=0,settleCheck:(result:AdminSetupCheckResult|'error')=>void=()=>{};
let calls=0,settle:(result:AdminSetupResult)=>void=()=>{},setState:(state:AdminSetupState)=>void=()=>{},rerender:()=>void=()=>{};
function App(){const [state,update]=React.useState<AdminSetupState>({status:'idle'}),[revision,redraw]=React.useState(0);setState=update;rerender=()=>redraw(v=>v+1);return <AdminSetupPage passwordLabels={passwordLabels} labels={labels} config={{...config}} state={{...state}} onCheck={new URLSearchParams(location.search).has('check')?()=>{checks++;return new Promise((resolve,reject)=>{settleCheck=result=>result==='error'?reject(new Error('Synthetic read failed')):resolve(result);});}:undefined} onSubmit={()=>{calls++;if(new URLSearchParams(location.search).has('embed'))return 'complete';return new Promise(resolve=>{settle=resolve;});}}/>;}
const element=document.getElementById('root')!,app=<React.StrictMode><App/></React.StrictMode>;
const root=element.querySelector('form')?hydrateRoot(element,app):createRoot(element);if(!element.querySelector('form'))root.render(app);
Object.assign(window,{adminSetupDemo:{getChecks:()=>checks,settleCheck:(result:AdminSetupCheckResult|'error')=>settleCheck(result),getCalls:()=>calls,settle:(result:AdminSetupResult)=>settle(result),state:setState,update:(state:AdminSetupState)=>setState(state),rerender:()=>rerender(),destroy:()=>root.unmount()}});
