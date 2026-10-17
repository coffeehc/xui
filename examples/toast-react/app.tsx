import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Toast,type ToastController} from '@coffeehc/xui-react/toast';
import {setInterfaceScale} from '@coffeehc/xui-runtime/theme';
import {createToastController} from '@coffeehc/xui-runtime/toast';
import {Button} from '@coffeehc/xui-react/button';
import {PageHeader,Section,Stack,Toolbar} from '@coffeehc/xui-react/layout';
import {Input} from '@coffeehc/xui-react/forms';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/style.css';
bootstrapBrowserExample();
const events:string[]=[],a:ToastController=createToastController({timeout:-1,limit:3}),b:ToastController=createToastController({timeout:-1,limit:3});
a.add({id:'prebound',title:'绑定前的通知',description:'借用的队列由宿主拥有。'});
let resolvePending:((value:string)=>void)|undefined;
const demo={a,b,events,current:a,add:(options:Parameters<ToastController['add']>[0])=>demo.current.add(options),resolve:()=>resolvePending?.('已完成'),swap:(_mode:'A'|'B'|'default')=>{},setMounted:(_value:boolean)=>{},setLabel:(_value:boolean)=>{},setPortal:(_value:boolean)=>{},setScale:setInterfaceScale};
(window as unknown as {toastDemo:typeof demo}).toastDemo=demo;
function Notifications({standard,customLabel,container}:{standard:boolean;customLabel:boolean;container?:React.RefObject<HTMLDivElement|null>}){
 const manager=Toast.useToastManager();React.useLayoutEffect(()=>{demo.current=manager;},[manager]);
 if(standard)return <Toast.View container={container}/>;
 const root=(item:(typeof manager.toasts)[number])=>item.data?.ungrouped?<Toast.Root key={item.id} toast={item}><Toast.Title/><Toast.Description/><Toast.Action/><Toast.Close aria-label="关闭通知"/></Toast.Root>:<Toast.Root key={item.id} toast={item}><Toast.Content>{item.data?.hideLabels!==true&&<Toast.Title render={item.data?.renderLabels?<h2>来自render的标题</h2>:undefined} id={customLabel?'toast-custom-title':undefined}/>}
{item.data?.hideLabels!==true&&<Toast.Description render={item.data?.renderLabels?<p>来自render的说明</p>:undefined}/>}
<Toast.Actions><Toast.Action render={item.data?.renderLabels?<button>来自render的动作</button>:undefined}>{item.data?.templateAction as React.ReactNode}</Toast.Action><Toast.Close disabled={item.data?.disableClose===true} onClick={event=>{if(item.data?.preventClose)event.preventDefault();}} render={<Button size="sm" variant="outline"/>} aria-label="关闭通知">关闭</Toast.Close></Toast.Actions></Toast.Content></Toast.Root>;
 return <><Toast.Portal container={container}><Toast.Viewport aria-label="通知">{manager.toasts.filter(item=>!item.positionerProps).map(root)}</Toast.Viewport></Toast.Portal>{manager.toasts.filter(item=>item.positionerProps).map(item=><Toast.Portal key={item.id} container={container}><Toast.Positioner toast={item}>{root(item)}<Toast.Arrow/></Toast.Positioner></Toast.Portal>)}</>;
}
function App(){
 const [standard,setStandard]=React.useState(false),[mode,setMode]=React.useState<'A'|'B'|'default'>('A'),[mounted,setMounted]=React.useState(true),[customLabel,setLabel]=React.useState(false),[localPortal,setPortal]=React.useState(false),portal=React.useRef<HTMLDivElement>(null),anchor=React.useRef<HTMLButtonElement>(null);
 React.useLayoutEffect(()=>{demo.swap=setMode;demo.setMounted=setMounted;demo.setLabel=setLabel;demo.setPortal=setPortal;},[]);
 const provider=mode==='default'?{}:{controller:mode==='A'?a:b};
 return <main className="xui xui-stack"><PageHeader title="通知"/><Section><Stack><Toolbar><Button variant="outline" onClick={()=>setStandard(value=>!value)}>{standard?'切换部件组合':'切换标准通知'}</Button><Button variant="outline" onClick={()=>{for(let i=0;i<2;i++)demo.add({title:'无法连接到 xAgent API，请确认后端服务或代理可用。',type:'error',timeout:-1});}}>连接失败示例</Button><Button onClick={()=>demo.add({title:'已保存',description:'更改已保存。',timeout:-1,onClose:()=>events.push('close'),onRemove:()=>events.push('remove')})}>显示通知</Button><Button ref={anchor} variant="outline" onClick={()=>demo.add({title:'定位通知',timeout:-1,positionerProps:{anchor,side:'bottom',align:'start'}})}>定位通知</Button><Button variant="outline" onClick={()=>{void demo.current.promise(new Promise<string>(resolve=>resolvePending=resolve),{loading:{id:'pending',title:'处理中'},success:value=>({title:value}),error:'失败'});}}>开始异步通知</Button><Button variant="outline" onClick={()=>demo.current.close()}>清空通知</Button><Button variant="outline" onClick={()=>setMode(mode==='A'?'B':'A')}>切换队列</Button><Button variant="outline" onClick={()=>setMode('default')}>默认队列</Button><Button variant="outline" onClick={()=>setMounted(!mounted)}>切换视图</Button></Toolbar><Input aria-label="操作草稿" defaultValue="保留焦点和草稿"/></Stack></Section>{mounted&&<Toast.Provider {...provider}><Notifications standard={standard} customLabel={customLabel} container={localPortal?portal:undefined}/></Toast.Provider>}<div id="notification-portal-host" ref={portal}/></main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
