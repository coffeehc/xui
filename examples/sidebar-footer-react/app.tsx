import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {MenuLayout,NavigationMenu} from '@coffeehc/xui-react/menu-layout';
import {AppShell,SidebarFooterContent,Stack,Section,Toolbar} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input} from '@coffeehc/xui-react/forms';
import {Dialog} from '@coffeehc/xui-react/dialog';
import type {NavigationMenuOptions} from '@coffeehc/xui-runtime/navigation';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';
import {copy,fixtureOptions,shortItems,longItems,createActionModel,type ActionModel,type FixtureOwner,type FooterKind,type HostFocus} from '../shared/sidebar-footer-model';

declare global {interface Window {sidebarFooterDemo:FixtureOwner}}
const config=fixtureOptions(location.search),model=createActionModel();
function Symbol(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" aria-hidden="true"><path d="M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6Z"/><path d="m8 12 3 3 5-6"/></svg>;}
function cycleTheme(){const modes=['light','dark','system'] as const;const current=window.xuiTheme!.getState().mode;window.xuiTheme!.setMode(modes[(modes.indexOf(current)+1)%modes.length]);}
function Footer({owner,versionRef}:{owner:ActionModel;versionRef:React.Ref<HTMLSpanElement>}){
  const state=React.useSyncExternalStore(owner.subscribe,owner.getState,owner.getState);
  return <>
    <Button variant="ghost" disabled={state.disabled||state.busy} aria-busy={state.busy} data-testid="footer-action" onClick={()=>owner.invoke()}><SidebarFooterContent icon={<Symbol/>}>{copy.action}</SidebarFooterContent></Button>
    <Button variant="ghost" data-testid="footer-theme" onClick={cycleTheme}><SidebarFooterContent icon={<Symbol/>}>{copy.theme}</SidebarFooterContent></Button>
    <SidebarFooterContent ref={versionRef} icon={<span>v1</span>} data-testid="footer-version">{copy.version}</SidebarFooterContent>
  </>;
}
function App(){
  const [options,setOptions]=React.useState<NavigationMenuOptions>({items:config.items,activeId:config.activeId,location:location.href}),[collapsed,setCollapsed]=React.useState(config.collapsed),[open,setOpen]=React.useState(false),[footerKind,setFooter]=React.useState<FooterKind>('original'),[draft,setDraft]=React.useState(copy.draft),[modal,setModal]=React.useState(false);
  const [repeat,setRepeat]=React.useState(0),hostFocus=React.useRef<HostFocus>('trigger'),heading=React.useRef<HTMLHeadingElement>(null),modalAction=React.useRef<HTMLButtonElement>(null),versionRef=React.useRef<HTMLSpanElement>(null);
  const state=React.useSyncExternalStore(model.subscribe,model.getState,model.getState);
  const original=React.useMemo(()=><Footer owner={model} versionRef={versionRef}/>,[]);
  const update=(next:Partial<NavigationMenuOptions>)=>setOptions(current=>({...current,...next}));
  window.sidebarFooterDemo={update,setList:long=>update({items:long?longItems:shortItems,activeId:long?'record-79':'overview'}),setFooter,repeatFooter:()=>setRepeat(value=>value+1),setActionState:model.setState,finish:model.finish,snapshot:model.getState,setMode:mode=>window.xuiTheme!.setMode(mode),setHostFocus:target=>{hostFocus.current=target;},setOpen,getVersionNode:()=>versionRef.current};
  const navigate:NonNullable<NavigationMenuOptions['navigation']>['navigate']=request=>{
    if(!request.sameLocation)history.pushState(null,'',request.url);
    // The host may move focus to its new page or modal after the drawer closes.
    flushSync(()=>{setOpen(false);update({activeId:request.id,location:request.url});if(hostFocus.current==='dialog')setModal(true);});
    if(hostFocus.current==='main')heading.current?.focus();
    if(hostFocus.current==='dialog')modalAction.current?.focus();
  };
  React.useEffect(()=>{const pop=()=>update({location:location.href,activeId:new URL(location.href).searchParams.get('page')??'overview'});window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[]);
  const content=<Stack data-repeat={repeat}>
    <header className="xui-page-header"><div><h1 ref={heading} tabIndex={-1} data-testid="page-heading">{copy.title}</h1><p>合成数据；没有产品后端、授权判断或真实许可证操作。</p></div></header>
    <Section title="宿主业务状态"><Field label="草稿" controlId="footer-draft"><Input value={draft} onChange={event=>setDraft(event.currentTarget.value)}/></Field>
      <p role="status" data-testid="action-count">已执行 {state.calls} 次合成操作</p><p data-testid="current-route">{options.activeId}</p>
      <Toolbar><Button variant="outline" onClick={()=>model.finish()}>完成合成请求</Button><Button variant="outline" onClick={()=>model.setState({disabled:!state.disabled})}>切换禁用状态</Button></Toolbar>
    </Section>
    <Section title="独立正文滚动">{Array.from({length:50},(_,index)=><p key={index}>第 {index+1} 条合成记录：导航更新保留草稿、底部动作与主内容。</p>)}</Section>
  </Stack>;
  const sidebarFooter=footerKind==='none'?null:footerKind==='plain'?<SidebarFooterContent data-testid="footer-plain">{copy.plain}</SidebarFooterContent>:footerKind==='replacement'?<SidebarFooterContent icon={<Symbol/>} data-testid="footer-replacement">{copy.replacement}</SidebarFooterContent>:original;
  const shellProps={sidebarFooter,headerSlots:{brand:<strong>{copy.title}</strong>},scrollMode:config.scrollMode,sidebarOpen:open,onSidebarOpenChange:setOpen,closeLabel:'关闭导航'};
  return <>{config.composition==='shell'
    ?<AppShell {...shellProps} navigationLabel="工作导航" collapsed={collapsed} onCollapsedChange={setCollapsed} compactLabel="紧凑导航" expandLabel="展开导航" sidebar={<NavigationMenu {...options} label="工作导航" compactLabel="紧凑导航" expandLabel="展开导航" navigation={{navigate}}/>}>{content}</AppShell>
    :<MenuLayout {...options} {...shellProps} collapsed={collapsed} onCollapsedChange={setCollapsed} title={copy.title} label="工作导航" compactLabel="紧凑导航" expandLabel="展开导航" navigation={{navigate}}>{content}</MenuLayout>}
    <Dialog.Root open={modal} onOpenChange={setModal}><Dialog.Content initialFocus={modalAction} data-testid="host-dialog"><Dialog.Title>宿主新操作面板</Dialog.Title><Dialog.Description>导航后新表层应持有自己的焦点。</Dialog.Description><Dialog.Body><Button ref={modalAction} data-testid="host-dialog-action">新表层操作</Button></Dialog.Body><Dialog.Footer><Dialog.Close render={<Button variant="outline"/>}>关闭新面板</Dialog.Close></Dialog.Footer></Dialog.Content></Dialog.Root>
  </>;
}
createRoot(document.getElementById('root')!).render(<App/>);
