import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {AppShell,PageHeader,SidebarFooterRow,SidebarFooterContent,Toolbar,Stack,type AppShellProps} from '@coffeehc/xui-react/layout';
import {MenuLayout,NavigationMenu} from '@coffeehc/xui-react/menu-layout';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input} from '@coffeehc/xui-react/forms';
import {Icon} from '@coffeehc/xui-react/display';
import {Menu} from '@coffeehc/xui-react/menu';
import {Dialog} from '@coffeehc/xui-react/dialog';
import {createNavigationPresentationController} from '@coffeehc/xui-runtime/interaction';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/style.css';
const params=new URLSearchParams(location.search),theme=bootstrapBrowserExample().services.getThemeService();
theme.setMode(params.get('mode')==='dark'?'dark':params.get('mode')==='system'?'system':'light');
if(params.get('dir')==='rtl')document.documentElement.dir='rtl';
let collapseRequests=0,openRequests=0,calls=0;
const controller=createNavigationPresentationController({defaultCollapsed:params.get('collapsed')!=='false',defaultExpandedIds:['team'],onCollapsedChange:()=>collapseRequests++,onSidebarOpenChange:()=>openRequests++});
const labels=['智能体管理','云存储接入','文件外链策略','Agent角色配置','用户记忆','管理账号'];
const items=[...labels.map((label,index)=>({id:`item-${index}`,label,href:`?page=${index}`,icon:'settings'})),{id:'team',label:'研发团队与跨区域协作的完整长中文名称',href:'?page=team',icon:'folder',children:[{id:'member',label:'团队经理',href:'?page=member',icon:'document'}]},...Array.from({length:30},(_,index)=>({id:`record-${index}`,label:`历史研究记录 ${index}`,href:`?page=record-${index}`,icon:'document'}))];
function Glyph(){return <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="var(--icon-stroke-width)" aria-hidden="true"><path d="M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6Z"/></svg>;}
function Footer({interactive}:{interactive:boolean}){
 const status=<SidebarFooterContent icon={<Icon><Glyph/></Icon>}>企业版 · v0.0.1.20261017-具有很长中文名称的正式构建版本</SidebarFooterContent>;
 return <SidebarFooterRow>
  <Button variant="ghost" data-testid="return"><SidebarFooterContent icon={<Glyph/>}>返回会话</SidebarFooterContent></Button>
  <Toolbar>
   {interactive?<Button variant="ghost" data-testid="license" aria-label="检查版本" onClick={()=>calls++}>{status}</Button>:<span data-testid="license" title="企业版与版本">{status}</span>}
   {interactive?<Button variant="ghost" data-icon="true" aria-label="更新版本" data-testid="update" onClick={()=>calls++}><Icon><Glyph/></Icon></Button>:<span role="status" aria-label="有新版本" data-testid="update"><Icon><Glyph/></Icon></span>}
   <Menu.Root><Menu.Trigger render={<Button variant="ghost" data-icon="true"/>} aria-label="页脚菜单"><Icon><Glyph/></Icon></Menu.Trigger><Menu.Content><Menu.Item onClick={()=>calls++}>公开菜单动作</Menu.Item></Menu.Content></Menu.Root>
   <Dialog.Root><Dialog.Trigger render={<Button variant="ghost" data-icon="true"/>} aria-label="页脚详情"><Icon><Glyph/></Icon></Dialog.Trigger><Dialog.Content><Dialog.Title>页脚详情</Dialog.Title><Dialog.Body><Field label="详情草稿"><Input aria-label="详情草稿" defaultValue="弹层保留草稿"/></Field></Dialog.Body><Dialog.Footer><Dialog.Close render={<Button/>}>关闭详情</Dialog.Close></Dialog.Footer></Dialog.Content></Dialog.Root>
  </Toolbar>
 </SidebarFooterRow>;
}
function App(){
 const [interactive,setInteractive]=React.useState(params.get('passive')!=='true'),[activeId,setActiveId]=React.useState('item-0'),[draft,setDraft]=React.useState('同一正文草稿'),[headerDraft,setHeaderDraft]=React.useState('同一导航草稿'),[mounted,setMounted]=React.useState(true);
 Object.assign(window,{sidebarRevealDemo:{controller,setInteractive,unmount:()=>setMounted(false),get collapseRequests(){return collapseRequests;},get openRequests(){return openRequests;},get calls(){return calls;},setMode:theme.setMode}});
 if(!mounted)return <Button>导航已卸载</Button>;
 const navigation={navigate:(request:{id:string})=>setActiveId(request.id)},sidebarHeader=params.has('header')?<Field label="导航草稿"><Input aria-label="导航草稿" value={headerDraft} onChange={event=>setHeaderDraft(event.target.value)}/></Field>:undefined;
 const common={controller,sidebarRevealOnHover:params.get('reveal')!=='off',sidebarTogglePlacement:params.get('placement')==='bottom'?'bottom':'top',sidebarHeader,sidebarFooter:<Footer interactive={interactive}/>,scrollMode:'workspace',headerSlots:{brand:'公共导航'},closeLabel:'关闭导航',compactLabel:'收起导航',expandLabel:'展开导航'} satisfies Partial<AppShellProps>;
 const content=<Stack><PageHeader title="公共导航工作区"/><Field label="正文草稿"><Input aria-label="正文草稿" value={draft} onChange={event=>setDraft(event.target.value)}/></Field><Toolbar><Button variant="outline" onClick={()=>setInteractive(value=>!value)}>切换页脚权限</Button><Button variant="outline" data-testid="outside-action">正文独立操作</Button></Toolbar></Stack>;
 const menuProps={items,activeId,navigation,label:'工作导航',expandBranchLabel:(item:{label:string})=>`展开 ${item.label}`,collapseBranchLabel:(item:{label:string})=>`收起 ${item.label}`};
 return params.get('composition')==='shell'?<AppShell {...common} navigationLabel="工作导航" sidebar={<NavigationMenu {...menuProps}/>}>{content}</AppShell>:<MenuLayout {...common} {...menuProps}>{content}</MenuLayout>;
}
createRoot(document.getElementById('root')!).render(<App/>);
