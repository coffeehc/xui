import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Menu} from '@coffeehc/xui-react/menu';
import {ContextMenu} from '@coffeehc/xui-react/context-menu';
import {Button} from '@coffeehc/xui-react/button';
import {Stack,Toolbar} from '@coffeehc/xui-react/layout';
import '@coffeehc/xui-theme/style.css';
import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
bootstrap();
const long=new URLSearchParams(location.search).has('long');
const icon=<Menu.Icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/></svg></Menu.Icon>;
function App(){
 const [calls,setCalls]=React.useState(0);
 const items=<><Menu.Item>查看记录</Menu.Item><Menu.Item tone="danger" onClick={()=>setCalls(count=>count+1)}>{icon}{long?'删除这个名称很长但必须完整保留的目录及其所有共享配置':'删除记录'}</Menu.Item><Menu.Item tone="danger" disabled onClick={()=>setCalls(count=>count+100)}>禁止删除</Menu.Item>{long&&Array.from({length:35},(_,i)=><Menu.Item key={i}>其他操作 {i+1}</Menu.Item>)}</>;
 return <Stack style={{padding:'var(--space-section-gap)'}}><h1>菜单危险操作</h1><Toolbar>
  <Menu.Root><Menu.Trigger render={<Button/>}>打开菜单</Menu.Trigger><Menu.Content>{items}</Menu.Content></Menu.Root>
  <ContextMenu.Root><ContextMenu.Trigger render={<Button variant="outline"/>}>右键菜单</ContextMenu.Trigger><ContextMenu.Content>{items}</ContextMenu.Content></ContextMenu.Root>
 </Toolbar><output aria-label="执行次数">{calls}</output></Stack>;
}
createRoot(document.getElementById('root')!).render(<App/>);
