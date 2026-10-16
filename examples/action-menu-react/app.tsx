import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Menu,type MenuActionEvent,type MenuConfig,type MenuController} from '@coffeehc/xui-react/menu';
import {createMenuController} from '@coffeehc/xui-runtime/menu';
import {Button} from '@coffeehc/xui-react/button';
import {PageHeader,Section,Stack,Toolbar} from '@coffeehc/xui-react/layout';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';

// This data can come from JSON; permission facts are projected by the host.
const menuData:MenuConfig=JSON.parse(JSON.stringify({items:[
 {kind:'group',id:'shortcuts',label:'快捷入口',items:[{kind:'item',id:'workspace',label:'研究工作区',actionId:'navigate.workspace',icon:'home'},{kind:'item',id:'long',label:'跨部门研究与运营协作的长期任务及完整消息记录',actionId:'navigate.history',icon:'folder'}]},
 {kind:'separator',id:'divider'},
 {kind:'item',id:'settings',label:'设置',actionId:'open.settings',icon:'settings'},
 {kind:'item',id:'admin',label:'管理员',actionId:'open.admin',hidden:true},
 {kind:'item',id:'unavailable',label:'暂不可用',actionId:'unavailable',disabled:true},
 {kind:'item',id:'logout',label:'退出登录',actionId:'logout',tone:'danger'},
]}));
const events:{actionId:string;source:string;owner:string}[]=[];
let external:MenuController;let subscribers=0,destroys=0,blocked=false;
const dispatch=(owner:string)=>(event:MenuActionEvent)=>{
 events.push({actionId:event.actionId,source:event.source,owner});
 if(event.actionId==='logout')event.preventDefault(); // Host would start its own confirmation here.
 // Transfer focus after the menu closes; an open modal correctly prevents an
 // immediate focus move to the background. Real navigation is host-owned too.
 if(event.actionId==='open.settings')queueMicrotask(()=>document.getElementById('host-destination')?.focus());
};
const model=createMenuController({config:menuData,onAction:dispatch('injected')});
// A host-supplied implementation replaces the full public contract. This example
// delegates storage to one model and customizes opening; it creates no second state.
external={...model,setOpen(open){if(!blocked||!open)model.setOpen(open);},subscribe(listener){subscribers++;const unsubscribe=model.subscribe(listener);return()=>{subscribers--;unsubscribe();};},destroy(){destroys++;model.destroy();}};
function App(){
 const [config,setConfig]=React.useState(menuData),[injected,setInjected]=React.useState(false),[mounted,setMounted]=React.useState(true);
 Object.assign(window,{actionMenuDemo:{controller:external,setInjected,setMounted,setConfig,setBlocked:(value:boolean)=>{blocked=value;},events,stats:()=>({subscribers,destroys,state:external.getState()})}});
 return <Section><Stack><PageHeader title="账户菜单"/><Toolbar><Button id="host-destination" variant="outline">宿主设置入口</Button>{mounted&&(injected?<Menu.View controller={external} trigger={<Button>账户操作</Button>}/>:<Menu.View config={config} onAction={dispatch('default')} trigger={<Button>账户操作</Button>}/>)}</Toolbar></Stack></Section>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
