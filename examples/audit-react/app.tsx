import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {Container} from '@coffeehc/xui-react/layout';
import {BusinessAuditExplorer,type BusinessAuditRenderer} from '@coffeehc/xui-react/business-audit';
import {createBusinessAuditExample} from '../shared/audit-model';
import '@coffeehc/xui-theme/critical.css';
const example=createBusinessAuditExample(location.href),root=createRoot(document.getElementById('root')!);
const renderers:BusinessAuditRenderer<React.ReactNode>[]=[{eventType:'order.approved',schemaVersion:1,render:detail=><p>{example.renderApproved(detail)}</p>},{eventType:'demo.renderer.fail',schemaVersion:1,render:()=>{throw Error('FAKE_PRIVATE_RENDER_ERROR');}}];
function App(){React.useEffect(()=>{void example.controller.refresh();return()=>example.controller.cancel();},[]);return <MenuLayout title="xui" label="管理导航" items={[{id:'audit',label:'业务审计',icon:'folder',href:location.pathname}]} activeId="audit"><Container><BusinessAuditExplorer controller={example.controller} renderers={renderers}/></Container></MenuLayout>;}
root.render(<React.StrictMode><App/></React.StrictMode>);Object.assign(window,{auditDemo:{...example,destroy(){root.unmount();example.destroy();}}});window.addEventListener('pagehide',()=>example.destroy(),{once:true});
