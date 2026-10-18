import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {Container} from '@coffeehc/xui-react/layout';
import {resolveDefaultPages} from '@coffeehc/xui-runtime/config';
import {BusinessLogExplorer,type BusinessLogRenderer} from '@coffeehc/xui-react/business-log';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import {createBusinessLogExample} from '../shared/business-log-model';
import '@coffeehc/xui-theme/critical.css';
const configured=new URLSearchParams(location.search).has('defaults'),application=bootstrapBrowserExample(configured?{pages:{businessLog:{title:'公共业务日志',pageSize:3}}}:{}),pages=resolveDefaultPages(application.config);
const example=createBusinessLogExample(location.href,configured?pages.businessLog.options:undefined),root=createRoot(document.getElementById('root')!);
if(configured)Object.assign(window,{defaultPagesDemo:{config:application.config,pages}});
const renderers:BusinessLogRenderer<React.ReactNode>[]=[{eventType:'order.approved',schemaVersion:1,render:detail=><p>{example.renderApproved(detail)}</p>},{eventType:'demo.renderer.fail',schemaVersion:1,render:()=>{throw Error('FAKE_PRIVATE_RENDER_ERROR');}}];
function App(){React.useEffect(()=>{void example.controller.refresh();return()=>example.controller.cancel();},[]);return <MenuLayout title="xui" label="管理导航" items={[{id:'business-log',label:'业务日志',icon:'folder',href:location.pathname}]} activeId="business-log"><Container><BusinessLogExplorer controller={example.controller} renderers={renderers}/></Container></MenuLayout>;}
root.render(<React.StrictMode><App/></React.StrictMode>);Object.assign(window,{businessLogDemo:{...example,destroy(){root.unmount();example.destroy();}}});window.addEventListener('pagehide',()=>example.destroy(),{once:true});
