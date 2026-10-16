import * as React from 'react';import{createRoot}from'react-dom/client';
import{Tabs}from'@coffeehc/xui-react/tabs';
import{Field,Input}from'@coffeehc/xui-react/forms';import{Container,Stack,PageHeader}from'@coffeehc/xui-react/layout';import{ScrollArea}from'@coffeehc/xui-react/scroll-area';
import{createValueController}from'@coffeehc/xui-runtime/interaction';import{ThemeService}from'@coffeehc/xui-runtime/theme';import'@coffeehc/xui-theme/style.css';
ThemeService.getState();const parameters=new URLSearchParams(location.search),events:{name:string;value:unknown;reason?:string}[]=[],controller=createValueController<string|number|null>({defaultValue:'current',onValueChange:value=>events.push({name:'selection',value})}),root=createRoot(document.getElementById('root')!);
const demo={events,controller,setLabel(_text:string){},destroy(){root.unmount();controller.destroy();}};Object.assign(window,{tabsOverlayDemo:demo});
const ranges=[['current','当前会话'],['team','团队协作'],['archive','已归档会话']] as const;
function TabsExample(){
 const[value,setValue]=React.useState<string|number|null>('current');
 const[name,setName]=React.useState(parameters.has('long')?'当前会话与需要继续处理的长中文交流入口':'当前会话');
 React.useLayoutEffect(()=>{demo.setLabel=setName;return()=>{demo.setLabel=()=>{};};},[]);
 const selection=parameters.has('injected')?{controller}:parameters.has('controlled')?{value,onValueChange:(next:string|number|null)=>{events.push({name:'selection',value:next});setValue(next);}}:{defaultValue:'current'};
 return <Tabs.Root {...selection} orientation={parameters.has('vertical')?'vertical':'horizontal'}>
  <Tabs.List aria-label="会话范围" variant={parameters.has('segmented')?'segmented':'line'} layout={parameters.has('equal')?'equal':'content'} activateOnFocus={!parameters.has('manual')}>
   <Tabs.Tab value="current" disabled={parameters.has('disabled-first')}><Tabs.Icon>◇</Tabs.Icon>{name}</Tabs.Tab>
   <Tabs.Tab value="disabled" disabled>不可用范围</Tabs.Tab>
   <Tabs.Tab value="team"><Tabs.Label text="团队协作"/></Tabs.Tab>
   <Tabs.Tab value="archive">已归档会话</Tabs.Tab>
  </Tabs.List>
  {ranges.map(([id,label])=><Tabs.Panel key={id} value={id} keepMounted><Field label={`${label}草稿`}><Input defaultValue={`保留${label}草稿`}/></Field><ScrollArea.Viewport aria-label={`${label}阅读区`} style={{maxBlockSize:'var(--layout-scroll-area-height)'}}><p data-cursor={id}>合成游标：{id}-opaque，不因切换内容重置。</p>{Array.from({length:24},(_,index)=><p key={index}>{label}合成记录 {index+1}</p>)}</ScrollArea.Viewport></Tabs.Panel>)}
 </Tabs.Root>;
}
root.render(<React.StrictMode><Container><Stack><PageHeader title="会话内容范围"/><TabsExample/></Stack></Container></React.StrictMode>);
