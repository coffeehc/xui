import * as React from 'react';
import {hydrateRoot,createRoot} from 'react-dom/client';
import {AdminSetupPage,type AdminSetupState,type AdminSetupResult} from '@coffeehc/xui-react/admin-setup';
import '@coffeehc/xui-theme/style.css';
const config={productName:'Example',title:'创建管理员'};
const labels=new URLSearchParams(location.search).has('long')?{rejected:'暂时无法创建管理员。请检查输入的用户名，然后再试。'.repeat(8)}:undefined;
let calls=0,settle:(result:AdminSetupResult)=>void=()=>{},setState:(state:AdminSetupState)=>void=()=>{},rerender:()=>void=()=>{};
function App(){const [state,update]=React.useState<AdminSetupState>({status:'idle'}),[revision,redraw]=React.useState(0);setState=update;rerender=()=>redraw(v=>v+1);return <AdminSetupPage labels={labels} config={{...config}} state={{...state}} onSubmit={()=>{calls++;return new Promise(resolve=>{settle=resolve;});}}/>;}
const element=document.getElementById('root')!,app=<React.StrictMode><App/></React.StrictMode>;
const root=element.querySelector('form')?hydrateRoot(element,app):createRoot(element);if(!element.querySelector('form'))root.render(app);
Object.assign(window,{adminSetupDemo:{getCalls:()=>calls,settle:(result:AdminSetupResult)=>settle(result),state:setState,update:(state:AdminSetupState)=>setState(state),rerender:()=>rerender(),destroy:()=>root.unmount()}});
