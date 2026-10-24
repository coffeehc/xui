import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout,NavigationMenu} from '@coffeehc/xui-react/menu-layout';
import {AppHeader,AppShell,PageHeader,Section,Stack,Toolbar,type AppHeaderSlots} from '@coffeehc/xui-react/layout';
import {Breadcrumbs} from '@coffeehc/xui-react/navigation';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input,Checkbox,Radio,Switch,Fieldset} from '@coffeehc/xui-react/forms';
import {Menu} from '@coffeehc/xui-react/menu';
import {ContextMenu} from '@coffeehc/xui-react/context-menu';
import type {ThemeMode} from '@coffeehc/xui-runtime/theme';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';
import {copy,fixtureOptions} from '../shared/layout-typography-model';

type FixtureOwner={updateHeader:(kind:string)=>void;navigate:(id:string)=>void;setMode:(mode:ThemeMode)=>void};
declare global {interface Window {layoutTypography:FixtureOwner}}
const config=fixtureOptions(location.search),revealOnHover=!new URLSearchParams(location.search).has('noReveal');
const theme=bootstrapBrowserExample().services.getThemeService();
function Symbol({illustration=false}:{illustration?:boolean}) {
  return <svg className={illustration?"lucide lucide-folder xui-illustration-icon":"lucide lucide-folder"} data-menu-symbol={!illustration||undefined} data-illustration={illustration||undefined} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" aria-hidden="true"><path d="M3 7h7l2 2h9v11H3Z"/><path d="M3 7V4h6l3 3"/></svg>;
}
function Dropdown(){
  return <Menu.Root><Menu.Trigger render={<Button variant="outline"/>}>打开操作菜单</Menu.Trigger><Menu.Content data-testid="ordinary-popup">
    <Menu.Group><Menu.GroupLabel>项目操作</Menu.GroupLabel>
      <Menu.Item data-testid="ordinary-item"><Menu.Icon><Symbol/></Menu.Icon>普通菜单项</Menu.Item>
      {/* Base UI 1.7 defaults LinkItem.closeOnClick to false; route-closing is an explicit host choice. */}
      <Menu.LinkItem data-testid="link-item" href="#menu-link" closeOnClick><Menu.Icon><Symbol/></Menu.Icon>链接菜单项</Menu.LinkItem>
      <Menu.LinkItem data-testid="link-default-item" href="#menu-link-default"><Menu.Icon><Symbol/></Menu.Icon>保留菜单的链接</Menu.LinkItem>
      <Menu.CheckboxItem data-testid="checkbox-item" defaultChecked><Menu.Icon><Symbol/></Menu.Icon>复选菜单项</Menu.CheckboxItem>
      <Menu.RadioGroup defaultValue="one"><Menu.RadioItem data-testid="radio-item" value="one"><Menu.Icon><Symbol/></Menu.Icon>单选菜单项</Menu.RadioItem><Menu.RadioItem value="two">另一单选菜单项</Menu.RadioItem></Menu.RadioGroup>
      <Menu.SubmenuRoot><Menu.SubmenuTrigger data-testid="submenu-trigger"><Menu.Icon><Symbol/></Menu.Icon>更多项目操作</Menu.SubmenuTrigger><Menu.Content data-testid="submenu-popup"><Menu.Item data-testid="submenu-item"><Menu.Icon><Symbol/></Menu.Icon>子菜单操作</Menu.Item></Menu.Content></Menu.SubmenuRoot>
      <Menu.Item data-testid="illustration-item"><span><Symbol illustration/></span>嵌套插图保持尺寸</Menu.Item>
    </Menu.Group>
  </Menu.Content></Menu.Root>;
}
function Context(){
  return <ContextMenu.Root><ContextMenu.Trigger tabIndex={0} data-testid="context-trigger" aria-label="记录上下文操作区域">记录上下文操作区域</ContextMenu.Trigger><ContextMenu.Content data-testid="context-popup">
    <ContextMenu.Item data-testid="context-item"><ContextMenu.Icon><Symbol/></ContextMenu.Icon>上下文菜单项</ContextMenu.Item>
    <ContextMenu.CheckboxItem data-testid="context-checkbox-item" defaultChecked><ContextMenu.Icon><Symbol/></ContextMenu.Icon>上下文复选项</ContextMenu.CheckboxItem>
    <ContextMenu.RadioGroup defaultValue="one"><ContextMenu.RadioItem data-testid="context-radio-item" value="one"><ContextMenu.Icon><Symbol/></ContextMenu.Icon>上下文单选项</ContextMenu.RadioItem></ContextMenu.RadioGroup>
    <ContextMenu.SubmenuRoot><ContextMenu.SubmenuTrigger data-testid="context-submenu-trigger"><ContextMenu.Icon><Symbol/></ContextMenu.Icon>更多上下文操作</ContextMenu.SubmenuTrigger><ContextMenu.Content data-testid="context-submenu-popup"><ContextMenu.Item data-testid="context-submenu-item"><ContextMenu.Icon><Symbol/></ContextMenu.Icon>上下文子菜单操作</ContextMenu.Item></ContextMenu.Content></ContextMenu.SubmenuRoot>
  </ContextMenu.Content></ContextMenu.Root>;
}
function App(){
  const [activeId,setActiveId]=React.useState(config.activeId),[headerKind,setHeaderKind]=React.useState(config.header),[draft,setDraft]=React.useState(copy.draft),[actions,setActions]=React.useState(0);
  window.layoutTypography={updateHeader:setHeaderKind,navigate:setActiveId,setMode:mode=>theme.setMode(mode)};
  const slots:AppHeaderSlots={
    ...(headerKind==='fallback'?{}:{brand:headerKind==='empty-brand'?null:<strong data-testid="header-brand" title={copy.brand}>{copy.brand}</strong>}),
    breadcrumb:<Breadcrumbs aria-label="当前位置"><li><a href="#team" title={copy.breadcrumb[0]}>{copy.breadcrumb[0]}</a></li><li aria-current="page">{copy.breadcrumb[1]}</li></Breadcrumbs>,
    status:<span role="status" data-testid="header-status">{headerKind==='updated'?copy.updatedStatus:copy.status}</span>,
    actions:headerKind==='no-actions'?undefined:copy.actions.map(action=><Button key={action} variant="outline" onClick={()=>setActions(count=>count+1)}>{action}</Button>),
  };
  const content=<Stack>
    <PageHeader title="布局与文字验收" description="合成数据；所有布局和字体来自正式 xui 包。"/>
    <Section title="操作与表单"><Toolbar><Dropdown/><Context/></Toolbar>
      <Field label="项目名称" help="名称用于识别当前项目。" error="请确认名称后再保存。" controlId="fixture-draft" required data-testid="field"><Input value={draft} onChange={event=>setDraft(event.currentTarget.value)}/></Field>
      <Fieldset legend="通知与权限"><Checkbox label={<span data-testid="checkbox-label-text">接收项目更新通知</span>}/><Radio name="visibility" label={<span data-testid="radio-label-text">仅团队成员可见</span>}/><Switch label={<span data-testid="switch-label-text">启用协作提醒</span>}/></Fieldset>
      <p data-testid="action-count" role="status">已执行 {actions} 次操作</p>
    </Section>
    <Section title="独立内容滚动">{Array.from({length:50},(_,index)=><p key={index}>第 {index+1} 条合成记录：输入、导航与头部更新不会重新挂载当前工作区。</p>)}</Section>
  </Stack>;
  const header=headerKind==='legacy'?<span data-testid="legacy-header">原有自定义头部仍可使用</span>:undefined;
  const headerSlots=headerKind==='legacy'?undefined:slots;
  if(config.composition==='header')return <><AppHeader {...slots} navigation={<Button aria-label="独立导航">☰</Button>}><span data-testid="legacy-header">组合扩展内容</span></AppHeader>{content}</>;
  if(config.composition==='shell')return <AppShell sidebarRevealOnHover={revealOnHover} headerSlots={headerSlots} header={header} navigationLabel="工作导航" sidebar={<NavigationMenu items={config.items} activeId={activeId}/>} scrollMode={config.scrollMode}>{content}</AppShell>;
  return <MenuLayout sidebarRevealOnHover={revealOnHover} items={config.items} activeId={activeId} defaultCollapsed={config.collapsed} title="后备品牌标题" headerSlots={headerSlots} header={header} label="工作导航" compactLabel="紧凑导航" expandLabel="展开导航" closeLabel="关闭导航" scrollMode={config.scrollMode} navigation={{navigate:request=>setActiveId(request.id)}}>{content}</MenuLayout>;
}
createRoot(document.getElementById('root')!).render(<App/>);
