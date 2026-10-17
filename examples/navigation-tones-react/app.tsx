import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout,NavigationMenu,type NavigationItem,type NavigationVariant} from '@coffeehc/xui-react/menu-layout';
import {Nav,NavItem} from '@coffeehc/xui-react/navigation';
import {Stack,PageHeader,Toolbar} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input} from '@coffeehc/xui-react/forms';
import {Icon} from '@coffeehc/xui-react/display';
import {ContextMenu} from '@coffeehc/xui-react/context-menu';
import {createNavigationPresentationController} from '@coffeehc/xui-runtime/interaction';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/style.css';
const query=new URLSearchParams(location.search),theme=bootstrapBrowserExample().services.getThemeService();
theme.setMode(query.get('mode')==='dark'?'dark':query.get('mode')==='system'?'system':'light');
theme.setPreset((['violet','ember','forest','crimson','cobalt','precision'] as const).find(value=>value===query.get('preset'))??'violet');
if(query.get('dir')==='rtl')document.documentElement.dir='rtl';
const longName='跨区域研发团队与会话名称完整可读且操作保持独立',controller=createNavigationPresentationController({defaultCollapsed:query.has('compact'),defaultExpandedIds:['team','branch'],onCollapsedChange:()=>counts.collapse++});
const counts={navigation:0,configuration:0,context:0,collapse:0,standalone:0};
function AlertGlyph(){return <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="var(--icon-stroke-width)"><path d="m12 3 10 18H2ZM12 9v5m0 3v1"/></svg>;}
function SessionLink({ref,...props}:React.ComponentPropsWithRef<'a'>){return <ContextMenu.Root><ContextMenu.Trigger render={<a {...props} ref={ref}/>}/><ContextMenu.Content><ContextMenu.Item onClick={()=>counts.context++}>独立右键动作</ContextMenu.Item></ContextMenu.Content></ContextMenu.Root>;}
function App(){
 const [active,setActive]=React.useState('team'),[warning,setWarning]=React.useState(true),[disabled,setDisabled]=React.useState(false),[variant,setVariant]=React.useState<NavigationVariant>(query.get('variant')==='default'?'default':'text');
 const items:readonly NavigationItem[]=[{id:'group',label:'项目分组',group:true,tone:'warning',children:[{id:'team',label:longName,href:'?page=team',icon:'folder',tone:warning?'warning':'default',disabled,children:[{id:'manager',label:'团队经理',href:'?page=manager',icon:'document'}]},{id:'normal',label:'普通会话',href:'?page=normal',icon:'document'},{id:'branch',label:'可折叠标题',icon:'folder',tone:'warning',children:[{id:'child',label:'普通下级',href:'?page=child',icon:'document'}]},{id:'disabled',label:'禁用警告项',href:'?page=disabled',icon:'folder',tone:'warning',disabled:true},{id:'legacy',label:'保留默认导航外观',href:'?page=legacy',icon:'document',variant:'default'}]}];
 Object.assign(window,{navigationTonesDemo:{controller,counts,setActive,setWarning,setDisabled,setVariant}});
 return <MenuLayout controller={controller} title="导航语义" label="工作导航" items={items} activeId={active} variant={variant} labelOverflow={query.get('overflow')==='wrap'?'wrap':'marquee'} actionAlignment="start" expandLabel="展开导航" compactLabel="收起导航" closeLabel="关闭导航" expandBranchLabel={item=>`展开 ${item.label}`} collapseBranchLabel={item=>`收起 ${item.label}`} navigation={{navigate:request=>{counts.navigation++;setActive(request.id);}}} renderLink={item=><SessionLink aria-label={item.label+(item.tone==='warning'?'，需要人工确认':'')}/>} renderLabel={item=><><NavigationMenu.Label>{item.label}</NavigationMenu.Label>{item.tone==='warning'&&!item.group&&<Icon><AlertGlyph/></Icon>}</>} renderAction={item=>item.id==='team'?<button aria-label="配置研发团队" onClick={()=>counts.configuration++}>⚙</button>:null} scrollMode="workspace"><Stack><PageHeader title="公开透明导航与警告前景"/><Field label="保留工作草稿"><Input aria-label="保留工作草稿" defaultValue="同一节点保留的草稿"/></Field><Nav aria-label="独立组合"><NavItem data-testid="standalone" href="?page=standalone" tone="warning" variant="text" selected onClick={event=>{event.preventDefault();counts.standalone++;}}><Icon><AlertGlyph/></Icon>独立警告链接</NavItem><NavItem data-testid="button-item" render={<button type="button"/>} tone="warning" variant="text" onClick={()=>counts.standalone++}>原生按钮组合</NavItem></Nav><Toolbar><Button variant="outline" onClick={()=>setWarning(value=>!value)}>切换警告</Button><Button variant="outline" onClick={()=>setDisabled(value=>!value)}>切换禁用</Button></Toolbar></Stack></MenuLayout>;
}
createRoot(document.getElementById('root')!).render(<App/>);
