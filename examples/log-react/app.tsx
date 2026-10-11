import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {Container} from '@coffeehc/xui-react/layout';
import {StructuredLogExplorer} from '@coffeehc/xui-react/structured-log';
import {createStructuredLogExample} from '../shared/log-model';
import '@coffeehc/xui-theme/critical.css';
const example=createStructuredLogExample(location.href),root=createRoot(document.getElementById('root')!);
function App(){React.useEffect(()=>{void example.controller.refresh();return()=>example.controller.cancel();},[]);return <MenuLayout title="xui" label="管理导航" items={[{id:'logs',label:'结构化错误',icon:'folder',href:location.pathname}]} activeId="logs"><Container><StructuredLogExplorer controller={example.controller}/></Container></MenuLayout>;}
root.render(<React.StrictMode><App/></React.StrictMode>);
Object.assign(window,{logDemo:{...example,destroy(){root.unmount();example.destroy();}}});window.addEventListener('pagehide',()=>example.destroy(),{once:true});
