import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {AppShell,Section,PageHeader} from '@coffeehc/xui-react/layout';
import {NavigationMenu,type NavigationItem,type NavigationMenuOptions} from '@coffeehc/xui-react/menu-layout';
import {Disclosure} from '@coffeehc/xui-react/navigation';
import {Input} from '@coffeehc/xui-react/forms';
import {Button} from '@coffeehc/xui-react/button';
import {ContextMenu} from '@coffeehc/xui-react/context-menu';
import {Spinner} from '@coffeehc/xui-react/feedback';
import {Typography} from '@coffeehc/xui-react/display';
import {createRichNavigationExample,navigationDetail,resolveRichNavigationIcon,richNavigationCopy as copy,type RichNavigationGroup} from '../shared/rich-navigation-model';
import '@coffeehc/xui-theme/style.css';

const owner=createRichNavigationExample();
function SettingsIcon(){return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)"><path d="M3 5h14M3 10h14M3 15h14M7 3v4M13 8v4M8 13v4"/></svg>;}
function Actions({item}:{item:NavigationItem}){const state=React.useSyncExternalStore(owner.subscribe,owner.getState,owner.getState);return <ContextMenu.Content><ContextMenu.Item disabled={!!item.disabled||state.busyActions.includes(item.id)||!state.actionsEnabled} onClick={()=>owner.configure(item.id)}>配置 {item.label}</ContextMenu.Item><ContextMenu.Item disabled>删除（示例未授权）</ContextMenu.Item></ContextMenu.Content>;}
// The custom components forward the merged props/ref and preserve library children.
// ContextMenu supplies the trigger behavior; it does not wrap an interactive label.
const ContextLink=React.forwardRef<HTMLAnchorElement,React.ComponentPropsWithoutRef<'a'>&{item:NavigationItem}>(({item,...props},ref)=><ContextMenu.Root disabled={props['aria-disabled']===true||props['aria-disabled']==='true'}><ContextMenu.Trigger render={<a {...props} ref={ref}/>}/><Actions item={item}/></ContextMenu.Root>);
const ContextBranch=React.forwardRef<HTMLButtonElement,React.ComponentPropsWithoutRef<'button'>&{item:NavigationItem}>(({item,...props},ref)=><ContextMenu.Root disabled={props.disabled||props['aria-disabled']===true||props['aria-disabled']==='true'}><ContextMenu.Trigger render={<button {...props} ref={ref}/>}/><Actions item={item}/></ContextMenu.Root>);
const renderLink=(item:NavigationItem)=><ContextLink item={item}/>;
const renderButton=(item:NavigationItem)=><ContextBranch item={item}/>;
const renderLabel=(item:NavigationItem)=><span data-rich-label={item.id}><NavigationMenu.Label><strong>{item.label}</strong></NavigationMenu.Label><small>{navigationDetail(item)}</small></span>;
// Only this host-owned row lays out domain content. The public name part moves;
// the passive status stays at the logical end without becoming an action button.
function StatusLabel({item,running}:{item:NavigationItem;running:boolean}){
  const busy=running&&!item.disabled;
  return <span data-rich-label={item.id} style={{display:'block'}}><span data-name-line="" style={{display:'flex',alignItems:'flex-start',gap:'var(--space-control-gap)'}}><span style={{flex:1,minInlineSize:0}}><NavigationMenu.Label>{item.label}</NavigationMenu.Label></span>{busy&&<span data-navigation-status="" aria-hidden="true" style={{display:'inline-flex',flex:'none',alignItems:'center',minBlockSize:'var(--line-height-body-sm)'}}><Spinner/></span>}</span><Typography.Text tone="muted">{busy?'执行中':navigationDetail(item)}</Typography.Text></span>;
}
const root=createRoot(document.getElementById('root')!);
type BranchLabels=Pick<NavigationMenuOptions,'expandBranchLabel'|'collapseBranchLabel'|'expandedIds'|'onExpandedChange'|'labelOverflow'|'actionAlignment'>&{projectItems?:readonly NavigationItem[]};
function App(){
  const state=React.useSyncExternalStore(owner.subscribe,owner.getState,owner.getState),[sidebarOpen,setSidebarOpen]=React.useState(false),[collapsed,setCollapsed]=React.useState(false);
  const [branchLabels,setBranchLabels]=React.useState<BranchLabels>({labelOverflow:'marquee',actionAlignment:'start'});
  const [running,setRunning]=React.useState(true),statusExample=new URLSearchParams(location.search).has('status');
  React.useEffect(()=>{Object.assign(window,{navigationStatusDemo:{setRunning,setCollapsed,setSidebarOpen}});return()=>{delete (window as Window&{navigationStatusDemo?:unknown}).navigationStatusDemo;};},[]);
  React.useEffect(()=>{Object.assign(window,{navigationLabelsDemo:{update:(next:Partial<BranchLabels>)=>setBranchLabels(current=>({...current,...next}))}});return()=>{delete (window as Window&{navigationLabelsDemo?:unknown}).navigationLabelsDemo;};},[]);
  const rail=collapsed&&!sidebarOpen;
  const navigation={navigate:({id}:{id:string})=>{owner.navigate(id);setSidebarOpen(false);}};
  const renderAction=(item:NavigationItem)=>state.actionsEnabled?<button aria-label={`配置 ${item.label}`} aria-busy={state.busyActions.includes(item.id)} disabled={state.busyActions.includes(item.id)} onClick={()=>owner.configure(item.id)}><SettingsIcon/></button>:null;
  const menu=(key:RichNavigationGroup)=>{const {projectItems,...labels}=branchLabels;return <NavigationMenu items={key==='projects'?(projectItems??state.groups[key].items):state.groups[key].items} label={`${copy[key]}导航`} activeId={state.activeId} navigation={navigation} emptyLabel={state.groups[key].busy?'正在读取':'没有匹配结果'} resolveIcon={resolveRichNavigationIcon} renderLink={renderLink} renderButton={renderButton} renderLabel={statusExample?item=><StatusLabel item={item} running={running}/>:renderLabel} renderAction={renderAction} showCollapseToggle={false} {...labels}/>;};
  const more=(key:RichNavigationGroup)=><Button hidden={rail} variant="outline" disabled={state.groups[key].busy||!state.groups[key].hasMore} aria-busy={state.groups[key].busy} onClick={()=>owner.loadMore(key)}>{state.groups[key].hasMore?`加载更多${copy[key]}`:`${copy[key]}已全部加载`}</Button>;
  const sidebar=<div className="xui-stack"><Input hidden={rail} aria-label={copy.search} placeholder="统一查询，两路独立游标" value={state.query} onChange={event=>owner.setQuery(event.target.value)}/><Section title={rail?undefined:copy.projects}>{menu('projects')}{more('projects')}</Section><Disclosure hidden={rail} title={copy.members} open={state.membersOpen} onOpenChange={owner.setMembersOpen}>{menu('members')}{more('members')}</Disclosure></div>;
  return <AppShell scrollMode="viewport" headerSlots={{brand:<strong>{copy.title}</strong>}} navigationLabel="工作导航" compactLabel="紧凑导航" expandLabel="展开导航" closeLabel="关闭导航" sidebar={sidebar} sidebarOpen={sidebarOpen} onSidebarOpenChange={setSidebarOpen} collapsed={collapsed} onCollapsedChange={setCollapsed}><div className="xui-stack"><PageHeader title={copy.title} description="合成数据。导航、分组、配置动作分别组合；总量未知，不展示伪造总数。"/><Section title="宿主业务状态"><p role="status" aria-label="导航操作状态">{`当前：${state.activeId??'未选择'}；导航 ${state.navigations} 次；配置 ${state.actions} 次；最近配置：${state.lastAction??'无'}`}</p><Input aria-label="正文草稿" defaultValue="导航与配置更新都保留这份草稿"/><div className="xui-toolbar"><Button onClick={()=>setBranchLabels(current=>({...current,labelOverflow:current.labelOverflow==='marquee'?'wrap':'marquee'}))}>切换名称滚动</Button><Button onClick={()=>setBranchLabels(current=>({...current,actionAlignment:current.actionAlignment==='start'?'center':'start'}))}>切换行尾对齐</Button><Button onClick={owner.finishActions}>完成配置请求</Button><Button onClick={()=>owner.setActionsEnabled(!state.actionsEnabled)}>切换配置动作</Button><Button onClick={()=>owner.setMembersOpen(false)}>外部收起成员</Button><Button onClick={()=>setBranchLabels(current=>({...current,expandBranchLabel:item=>`展开 ${item.label}`,collapseBranchLabel:item=>`收起 ${item.label}`}))}>中文分支文案</Button><Button onClick={()=>setBranchLabels(current=>({...current,expandBranchLabel:item=>`Expand ${item.label}`,collapseBranchLabel:item=>`Collapse ${item.label}`}))}>English branch names</Button></div><p>同一个查询驱动两个资源；成员折叠时取消并暂停读取，迟到应答被丢弃。行尾配置及右键菜单不会导航。</p></Section></div></AppShell>;
}
root.render(<App/>);
Object.assign(window,{richNavigationDemo:{owner,destroy(){root.unmount();owner.destroy();}}});
window.addEventListener('pagehide',()=>{root.unmount();owner.destroy();},{once:true});
