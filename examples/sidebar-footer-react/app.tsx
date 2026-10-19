import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {MenuLayout,NavigationMenu} from '@coffeehc/xui-react/menu-layout';
import {AppShell,HeaderBrand,SidebarFooterContent,SidebarFooterRow,Stack,Section,Toolbar,PageHeader,type SidebarTogglePlacement} from '@coffeehc/xui-react/layout';
import {Button,IconButton} from '@coffeehc/xui-react/button';
import {Field,Input} from '@coffeehc/xui-react/forms';
import {Tabs} from '@coffeehc/xui-react/tabs';
import {Dialog} from '@coffeehc/xui-react/dialog';
import type {NavigationMenuOptions} from '@coffeehc/xui-runtime/navigation';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';
import {copy,fixtureOptions,shortItems,longItems,createActionModel,type ActionModel,type FixtureOwner,type FooterKind,type HostFocus} from '../shared/sidebar-footer-model';

declare global {interface Window {sidebarFooterDemo:FixtureOwner}}
const config=fixtureOptions(location.search),model=createActionModel();
const theme=bootstrapBrowserExample().services.getThemeService();
function Symbol(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" aria-hidden="true"><path d="M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6Z"/><path d="m8 12 3 3 5-6"/></svg>;}
function cycleTheme(){const modes=['light','dark','system'] as const;const current=theme.getState().mode;theme.setMode(modes[(modes.indexOf(current)+1)%modes.length]);}
function Footer({owner,versionRef}:{owner:ActionModel;versionRef:React.Ref<HTMLSpanElement>}){
  const state=React.useSyncExternalStore(owner.subscribe,owner.getState,owner.getState);
  return <>
    <Button variant="ghost" disabled={state.disabled||state.busy} aria-busy={state.busy} data-testid="footer-action" onClick={()=>owner.invoke()}><SidebarFooterContent icon={<Symbol/>}>{copy.action}</SidebarFooterContent></Button>
    <Button variant="ghost" data-testid="footer-theme" onClick={cycleTheme}><SidebarFooterContent icon={<Symbol/>}>{copy.theme}</SidebarFooterContent></Button>
    <SidebarFooterContent ref={versionRef} icon={<span>v1</span>} data-testid="footer-version">{copy.version}</SidebarFooterContent>
  </>;
}
function FooterRow({owner,versionRef,onReturn}:{owner:ActionModel;versionRef:React.Ref<HTMLSpanElement>;onReturn:()=>void}){
 const state=React.useSyncExternalStore(owner.subscribe,owner.getState,owner.getState);
 return <SidebarFooterRow data-testid="footer-row">
  <Button variant="ghost" data-testid="footer-return" onClick={onReturn}><SidebarFooterContent icon={<Symbol/>}>返回会话</SidebarFooterContent></Button>
  <Toolbar><SidebarFooterContent ref={versionRef} data-testid="footer-version" icon={<Symbol/>}>{config.longFooter?'企业版 · 具有完整授权来源与长中文版本说明的构建 v0.0.1.20261015':'企业版 · v0.0.1'}</SidebarFooterContent>
   <Button variant="ghost" data-icon="true" aria-label="检查更新" data-testid="footer-action" aria-busy={state.busy} disabled={state.disabled||state.busy} onClick={()=>owner.invoke()}><Symbol/></Button>
  </Toolbar>
 </SidebarFooterRow>;
}
function App(){
  const [options,setOptions]=React.useState<NavigationMenuOptions>({items:config.items,activeId:config.activeId,location:location.href}),[placement,setPlacement]=React.useState<SidebarTogglePlacement>(config.togglePlacement),[collapsed,setCollapsed]=React.useState(config.collapsed),[open,setOpen]=React.useState(false),[footerKind,setFooter]=React.useState<FooterKind>('original'),[draft,setDraft]=React.useState(copy.draft),[modal,setModal]=React.useState(false);
  const [tab,setTab]=React.useState('active');
  const [collapseBlocked,setCollapseBlocked]=React.useState(false),collapseRequests=React.useRef(0);
  const requestCollapsed=(next:boolean)=>{collapseRequests.current++;if(!collapseBlocked)setCollapsed(next);};
  const [repeat,setRepeat]=React.useState(0),hostFocus=React.useRef<HostFocus>('trigger'),heading=React.useRef<HTMLSpanElement>(null),modalAction=React.useRef<HTMLButtonElement>(null),versionRef=React.useRef<HTMLSpanElement>(null);
  const state=React.useSyncExternalStore(model.subscribe,model.getState,model.getState);
  const original=React.useMemo(()=>config.footerRow?<FooterRow owner={model} versionRef={versionRef} onReturn={()=>{heading.current?.focus();}}/>:<Footer owner={model} versionRef={versionRef}/>,[]);
  const update=(next:Partial<NavigationMenuOptions>)=>setOptions(current=>({...current,...next}));
  window.sidebarFooterDemo={update,setPlacement,setCollapsed,setCollapseBlocked,getCollapseRequests:()=>collapseRequests.current,setList:long=>update({items:long?longItems:shortItems,activeId:long?'record-79':'overview'}),setFooter,repeatFooter:()=>setRepeat(value=>value+1),setActionState:model.setState,finish:model.finish,snapshot:model.getState,setMode:mode=>theme.setMode(mode),setHostFocus:target=>{hostFocus.current=target;},setOpen,getVersionNode:()=>versionRef.current};
  const navigate:NonNullable<NavigationMenuOptions['navigation']>['navigate']=request=>{
    if(!request.sameLocation)history.pushState(null,'',request.url);
    // The host may move focus to its new page or modal after the drawer closes.
    flushSync(()=>{setOpen(false);update({activeId:request.id,location:request.url});if(hostFocus.current==='dialog')setModal(true);});
    if(hostFocus.current==='main')heading.current?.focus();
    if(hostFocus.current==='dialog')modalAction.current?.focus();
  };
  React.useEffect(()=>{const pop=()=>update({location:location.href,activeId:new URL(location.href).searchParams.get('page')??'overview'});window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[]);
  const content=<Stack data-repeat={repeat}>
    <PageHeader title={<span ref={heading} tabIndex={-1} data-testid="page-heading">{copy.title}</span>} description="合成数据；没有产品后端、授权判断或真实许可证操作。"/>
    <Section title="宿主业务状态"><Field label="草稿" controlId="footer-draft"><Input value={draft} onChange={event=>setDraft(event.currentTarget.value)}/></Field>
      <p role="status" data-testid="action-count">已执行 {state.calls} 次合成操作</p><p data-testid="current-route">{options.activeId}</p>
      <Toolbar><Button variant="outline" onClick={()=>model.finish()}>完成合成请求</Button><Button variant="outline" onClick={()=>model.setState({disabled:!state.disabled})}>切换禁用状态</Button></Toolbar>
    </Section>
    <Section title="独立正文滚动">{Array.from({length:50},(_,index)=><p key={index}>第 {index+1} 条合成记录：导航更新保留草稿、底部动作与主内容。</p>)}</Section>
  </Stack>;
  const iconFooter=<>{(['xs','sm','default','lg'] as const).map(size=><IconButton key={size} size={size} variant="outline" data-testid={'footer-icon-'+size} aria-label={'侧栏 '+size+' 编辑'}><Symbol/></IconButton>)}<Button variant="ghost" data-testid="footer-text-control"><SidebarFooterContent icon={<Symbol/>}>返回会话</SidebarFooterContent></Button></>;
  const sidebarFooter=new URLSearchParams(location.search).has('icon-actions')?iconFooter:footerKind==='none'?null:footerKind==='plain'?<SidebarFooterContent data-testid="footer-plain">{copy.plain}</SidebarFooterContent>:footerKind==='replacement'?<SidebarFooterContent icon={<Symbol/>} data-testid="footer-replacement">{copy.replacement}</SidebarFooterContent>:original;
  const headerKind=new URLSearchParams(location.search).get('header');
  const tabLayout=new URLSearchParams(location.search).get('tabLayout')==='equal'?'equal':'content';
  const headerButtons=<><Button size="sm" data-testid="header-session">{headerKind==='long'?'创建新的跨团队协作会话':'新会话'}</Button><Button size="sm" data-testid="header-team">{headerKind==='long'?'创建具有很长中文名称的研发团队':'新团队'}</Button><Button size="sm" data-icon="true" aria-label="刷新会话" data-testid="header-refresh"><Symbol/></Button></>;
  const headerActions=<Toolbar aria-label="会话快捷操作" data-testid="sidebar-header-tools">{headerButtons}</Toolbar>;
  let sidebarHeader:React.ReactNode;
  if(headerKind==='tabs')sidebarHeader=<>{headerActions}<Input type="search" aria-label="搜索会话" placeholder="搜索会话"/><Tabs.List layout={tabLayout} aria-label="会话范围"><Tabs.Tab value="active">当前</Tabs.Tab><Tabs.Tab value="archived">已归档</Tabs.Tab></Tabs.List></>;
  else if(headerKind==='business')sidebarHeader=<div role="group" aria-label="业务快捷操作" data-testid="sidebar-header-tools" style={{display:'flex',flexWrap:'wrap',gap:'var(--space-control-gap)'}}>{headerButtons}</div>;
  else if(headerKind==='direct'||headerKind==='full'||headerKind==='content')sidebarHeader=<Button size="sm" data-testid="header-direct" style={headerKind==='full'?{width:'100%'}:headerKind==='content'?{width:'max-content'}:undefined}>新会话</Button>;
  else if(headerKind)sidebarHeader=headerActions;
  const navigationMenu=<NavigationMenu {...options} label="工作导航" compactLabel="紧凑导航" expandLabel="展开导航" navigation={{navigate}}/>;
  const shellSidebar=headerKind==='tabs'?<><Tabs.Panel value="active" keepMounted>{navigationMenu}</Tabs.Panel><Tabs.Panel value="archived" keepMounted><NavigationMenu {...options} label="已归档工作导航" showCollapseToggle={false} navigation={{navigate}}/></Tabs.Panel></>:navigationMenu;
  const brand=new URLSearchParams(location.search).get('brand')==='long'?<HeaderBrand logo={<Symbol/>}>具有很长中文名称的研发协作与运营管理工作空间</HeaderBrand>:<strong>{copy.title}</strong>;
  const shellProps={sidebarRevealOnHover:!new URLSearchParams(location.search).has('no-reveal'),sidebarHeader,sidebarTogglePlacement:placement,sidebarFooter,headerSlots:{brand},scrollMode:config.scrollMode,sidebarOpen:open,onSidebarOpenChange:setOpen,closeLabel:'关闭导航'};
  const view=<>{config.composition==='shell'
    ?<AppShell {...shellProps} navigationLabel="工作导航" collapsed={collapsed} onCollapsedChange={requestCollapsed} compactLabel="紧凑导航" expandLabel="展开导航" sidebar={shellSidebar}>{content}</AppShell>
    :<MenuLayout {...options} {...shellProps} collapsed={collapsed} onCollapsedChange={requestCollapsed} title={copy.title} label="工作导航" compactLabel="紧凑导航" expandLabel="展开导航" navigation={{navigate}}>{content}</MenuLayout>}
    <Dialog.Root open={modal} onOpenChange={setModal}><Dialog.Content initialFocus={modalAction} data-testid="host-dialog"><Dialog.Title>宿主新操作面板</Dialog.Title><Dialog.Description>导航后新表层应持有自己的焦点。</Dialog.Description><Dialog.Body><Button ref={modalAction} data-testid="host-dialog-action">新表层操作</Button></Dialog.Body><Dialog.Footer><Dialog.Close render={<Button variant="outline"/>}>关闭新面板</Dialog.Close></Dialog.Footer></Dialog.Content></Dialog.Root>
  </>;
  return headerKind==='tabs'?<Tabs.Root value={tab} onValueChange={value=>setTab(String(value))}>{view}</Tabs.Root>:view;
}
createRoot(document.getElementById('root')!).render(<App/>);
