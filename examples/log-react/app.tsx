import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {Container} from '@coffeehc/xui-react/layout';
import {StructuredLogExplorer,createStructuredLogViewController} from '@coffeehc/xui-react/structured-log';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import {createStructuredLogExample} from '../shared/log-model';
import '@coffeehc/xui-theme/critical.css';
import '@coffeehc/xui-theme/floating.css';
bootstrapBrowserExample();
const example=createStructuredLogExample(location.href),params=new URLSearchParams(location.search),viewController=params.has('injected')?createStructuredLogViewController({service:example.controller}):undefined,root=createRoot(document.getElementById('root')!);
const initialList=params.get('initial-list');
if(initialList==='hold'||initialList==='error')example.setMode('groups',initialList);
if(initialList==='empty')example.setRows([]);
const PreviewShell=new URLSearchParams(location.search).has('embed')?(({children}:{children:React.ReactNode})=><>{children}</>):MenuLayout;
function App(){React.useEffect(()=>{void example.controller.refresh();return()=>example.controller.cancel();},[]);return <PreviewShell title="xui" label="管理导航" items={[{id:'logs',label:'结构化错误',icon:'folder',href:location.pathname}]} activeId="logs"><Container style={new URLSearchParams(location.search).has('embed')?{padding:'var(--layout-content-inset)'}:undefined}><StructuredLogExplorer {...(viewController?{viewController}:{controller:example.controller})} pageToolbar={params.has('slots')?<span data-host-scope>合成观察范围</span>:undefined}/></Container></PreviewShell>;}
root.render(<React.StrictMode><App/></React.StrictMode>);
Object.assign(window,{logDemo:{...example,viewController,destroy(){root.unmount();viewController?.destroy();example.destroy();}}});window.addEventListener('pagehide',()=>{viewController?.destroy();example.destroy();},{once:true});
