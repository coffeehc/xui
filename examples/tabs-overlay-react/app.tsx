import * as React from 'react';import{createRoot}from'react-dom/client';
import{Tabs}from'@coffeehc/xui-react/tabs';import{Sheet}from'@coffeehc/xui-react/sheet';import{Dialog}from'@coffeehc/xui-react/dialog';import{Tooltip}from'@coffeehc/xui-react/tooltip';import{ContextMenu}from'@coffeehc/xui-react/context-menu';
import{Button}from'@coffeehc/xui-react/button';import{Field,Input}from'@coffeehc/xui-react/forms';import{AppShell,Container,Stack,Toolbar,PageHeader}from'@coffeehc/xui-react/layout';import{MenuLayout}from'@coffeehc/xui-react/menu-layout';import{ScrollArea}from'@coffeehc/xui-react/scroll-area';
import{createValueController}from'@coffeehc/xui-runtime/interaction';import{ThemeService}from'@coffeehc/xui-runtime/theme';import'@coffeehc/xui-theme/style.css';
ThemeService.getState();const parameters=new URLSearchParams(location.search),events:{name:string;value:unknown;reason?:string}[]=[],controller=createValueController<string|number|null>({defaultValue:'current',onValueChange:value=>events.push({name:'selection',value})}),root=createRoot(document.getElementById('root')!);
const demo={events,controller,setLabel(_text:string){},destroy(){root.unmount();controller.destroy();}};Object.assign(window,{tabsOverlayDemo:demo});
const ranges=parameters.has('sidebar')?[['current','普通会话'],['team','团队协作'],['plugins','插件会话'],['archive','已归档会话']] as const:[['current','当前会话'],['team','团队协作'],['archive','已归档会话']] as const;
function TabsExample(){
 const[value,setValue]=React.useState<string|number|null>('current');
 const sidebar=parameters.get('sidebar');
 const[name,setName]=React.useState(parameters.has('long')?'普通会话与需要继续处理的长中文交流入口':sidebar?'普通':'当前会话');
 React.useLayoutEffect(()=>{demo.setLabel=setName;return()=>{demo.setLabel=()=>{};};},[]);
 const selection=parameters.has('injected')?{controller}:parameters.has('controlled')?{value,onValueChange:(next:string|number|null)=>{events.push({name:'selection',value:next});setValue(next);}}:{defaultValue:'current'};
 const list=<Tabs.List aria-label="会话范围" variant={parameters.has('segmented')?'segmented':undefined} layout={parameters.has('equal')?'equal':'content'} activateOnFocus={!parameters.has('manual')}>
   <Tabs.Tab value="current" disabled={parameters.has('disabled-first')}>{!sidebar&&<Tabs.Icon>◇</Tabs.Icon>}{name}</Tabs.Tab>
   {!sidebar&&<Tabs.Tab value="disabled" disabled>不可用范围</Tabs.Tab>}
   <Tabs.Tab value="team"><Tabs.Label text={sidebar?'团队':'团队协作'}/></Tabs.Tab>
   {sidebar&&<Tabs.Tab value="plugins">插件</Tabs.Tab>}
   <Tabs.Tab value="archive">{sidebar?'已归档':'已归档会话'}</Tabs.Tab>
  </Tabs.List>;
 const panels=ranges.map(([id,label])=><Tabs.Panel key={id} value={id} keepMounted><Field label={`${label}草稿`}><Input defaultValue={`保留${label}草稿`}/></Field><ScrollArea.Viewport aria-label={`${label}阅读区`} style={{maxBlockSize:'var(--layout-scroll-area-height)'}}><p data-cursor={id}>合成游标：{id}-opaque，不因切换内容重置。</p>{Array.from({length:24},(_,index)=><p key={index}>{label}合成记录 {index+1}</p>)}</ScrollArea.Viewport></Tabs.Panel>);
 const docked=sidebar&&!parameters.has('legacy')&&!parameters.has('segmented');
 const header=<Stack><Toolbar><Button variant="ghost">新会话</Button><Button variant="ghost">新团队</Button></Toolbar><Input type="search" aria-label="搜索会话" placeholder="搜索会话"/>{!docked&&list}</Stack>;
 const slots=docked?{sidebarHeader:header,sidebarTabs:list}:{sidebarHeader:header};
 const shell=sidebar==='menu'?<MenuLayout items={[{id:'sessions',label:'会话导航',href:'?page=sessions'}]} {...slots} label="会话导航" headerSlots={{brand:'会话工作区'}} scrollMode="viewport">{panels}</MenuLayout>:<AppShell {...slots} navigationLabel="会话导航" headerSlots={{brand:'会话工作区'}} scrollMode="viewport" sidebar={panels}><PageHeader title="会话工作区"/></AppShell>;
 return <Tabs.Root {...selection} orientation={parameters.has('vertical')?'vertical':'horizontal'}>{sidebar?shell:<>{list}{panels}</>}</Tabs.Root>;
}
function OverlayExample(){const[parent,setParent]=React.useState(false),[child,setChild]=React.useState(false),trigger=React.useRef<HTMLButtonElement>(null),file=React.useRef<HTMLButtonElement>(null);const preview=child?<Dialog.Root open={child} onOpenChange={(next,d)=>{events.push({name:'preview',value:next,reason:d.reason});setChild(next);}}><Dialog.Content><Dialog.Title>文件预览</Dialog.Title><Dialog.Body><Button>阅读文件内容</Button></Dialog.Body></Dialog.Content></Dialog.Root>:null;
 const fileButton=<Button ref={file} onClick={()=>setChild(true)}>session-preview.md</Button>;
 return <><Button ref={trigger} onClick={()=>setParent(true)}>会话文件</Button><Sheet.Root open={parent} onOpenChange={(next,d)=>{events.push({name:'sheet',value:next,reason:d.reason});setParent(next);}}><Sheet.Content finalFocus={trigger}><Sheet.Header><Sheet.Title>会话文件</Sheet.Title></Sheet.Header><Sheet.Body>{<ContextMenu.Root><Tooltip.Root disabled={!parameters.has('tooltip')} onOpenChange={(next,d)=>events.push({name:'tooltip',value:next,reason:d.reason})}><ContextMenu.Trigger render={<Tooltip.Trigger render={fileButton}/>}>session-preview.md</ContextMenu.Trigger><Tooltip.Content>补充说明：文件的所属目录与更新时间。</Tooltip.Content></Tooltip.Root><ContextMenu.Content><ContextMenu.Item>复制名称</ContextMenu.Item></ContextMenu.Content></ContextMenu.Root>}{!parameters.has('sibling')&&preview}</Sheet.Body></Sheet.Content></Sheet.Root>{parameters.has('sibling')&&preview}</>}
root.render(<React.StrictMode>{parameters.has('sidebar')?<TabsExample/>:<Container><Stack><PageHeader title={parameters.has('overlay')?'嵌套弹层关闭顺序':'会话内容范围'}/>{parameters.has('overlay')?<OverlayExample/>:<TabsExample/>}</Stack></Container>}</React.StrictMode>);
