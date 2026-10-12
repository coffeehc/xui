import * as React from 'react';
import {createPortal} from 'react-dom';
import { Dialog } from './dialog.js';
import { Button } from './button.js';
import { cx } from './shared.js';
import {ThemeModeButton} from './theme.js';
import type {ThemeController} from '@coffeehc/xui-runtime/theme';
import {isHeaderLocaleEnabled,type HeaderLocaleOptions} from '@coffeehc/xui-runtime/header-controls';
import type {ThemeModeLabels} from '@coffeehc/xui-runtime/theme-control';
export type {HeaderLocaleOptions,HeaderLocaleOption} from '@coffeehc/xui-runtime/header-controls';
import type {ShellScrollMode} from '@coffeehc/xui-runtime/menu-layout';
export type {ShellScrollMode} from '@coffeehc/xui-runtime/menu-layout';
import {ShellNavigationContext} from './shell-context.js';

export function Container({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-container',className)}/>;}
export function Stack({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-stack',className)}/>;}
export function Grid({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-grid',className)}/>;}
export function Toolbar({className,...props}:React.ComponentProps<'div'>){return <div role="group" {...props} className={cx('xui-toolbar',className)}/>;}
export type PageHeaderProps=Omit<React.ComponentProps<'header'>,'title'> & {title:React.ReactNode;description?:React.ReactNode;actions?:React.ReactNode;meta?:React.ReactNode};
export function PageHeader({title,description,actions,meta,className,...props}:PageHeaderProps){return <header {...props} className={cx('xui-page-header',className)}><div><h1>{title}</h1>{description&&<p>{description}</p>}{meta}</div>{actions&&<div className="xui-toolbar">{actions}</div>}</header>;}
export type SectionProps=Omit<React.ComponentProps<'section'>,'title'> & {title?:React.ReactNode;actions?:React.ReactNode};
export function Section({title,actions,children,className,...props}:SectionProps){const id=React.useId();return <section aria-labelledby={title?id:undefined} {...props} className={cx('xui-section',className)}>{(title||actions)&&<header className="xui-section-header">{title&&<h2 id={id}>{title}</h2>}{actions&&<div className="xui-toolbar">{actions}</div>}</header>}{children}</section>;}

function HeaderLocaleSelect({locale}:{locale:HeaderLocaleOptions}){
  const select=React.useRef<HTMLSelectElement>(null);
  React.useLayoutEffect(()=>{const node=select.current;return ()=>{if(node&&node.ownerDocument.activeElement===node)node.parentElement?.querySelector<HTMLButtonElement>('.xui-theme-mode-toggle')?.focus();};},[]);
  return <select ref={select} className="xui-select xui-header-locale" aria-label={locale.label??'语言'} value={locale.value} disabled={locale.disabled} onChange={event=>{const value=event.currentTarget.value;if(!locale.disabled&&value!==locale.value&&locale.options.some(item=>item.value===value&&!item.disabled))locale.onValueChange(value);}}>
    {!locale.options.some(item=>item.value===locale.value)&&<option value={locale.value} disabled/>}
    {locale.options.map(item=><option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>)}
  </select>;
}
const hasContent=(value:React.ReactNode):boolean=>{
  if(value===undefined||value===null||typeof value==='boolean')return false;
  if(typeof value==='string')return value.length>0;
  if(Array.isArray(value))return value.some(hasContent);
  if(React.isValidElement<{children?:React.ReactNode}>(value)&&value.type===React.Fragment)return hasContent(value.props.children);
  return true;
};

export interface AppHeaderSlots {
  leading?:React.ReactNode;brand?:React.ReactNode;breadcrumb?:React.ReactNode;status?:React.ReactNode;actions?:React.ReactNode;auxiliary?:React.ReactNode;context?:React.ReactNode;account?:React.ReactNode;
}
export type AppHeaderProps=React.ComponentProps<'div'> & AppHeaderSlots & {navigation?:React.ReactNode;theme?:ThemeController;themeLabels?:Partial<ThemeModeLabels>;locale?:HeaderLocaleOptions};
/** Role-based layout only. The host supplies names, breadcrumb semantics and actions. */
function AppHeaderFrame({legacyPrimary,leading,brand,breadcrumb,status,actions,auxiliary,context,account,navigation,theme,themeLabels,locale,children,className,...props}:AppHeaderProps&{legacyPrimary?:React.ReactNode}){
  const present=hasContent;
  return <div {...props} className={cx('xui-app-header',className)}>
    <div className="xui-app-header-primary">{present(leading)&&<div className="xui-app-header-leading">{leading}</div>}{present(navigation)&&<div className="xui-app-header-navigation">{navigation}</div>}
      {present(brand)&&<div className="xui-app-header-brand">{brand}</div>}
      {present(breadcrumb)&&<div className="xui-app-header-breadcrumb">{breadcrumb}</div>}
      {present(context)&&<div className="xui-app-header-context">{context}</div>}
      {present(legacyPrimary)&&<div className="xui-app-header-legacy">{legacyPrimary}</div>}
    </div>
    {<div className="xui-app-header-secondary">
      {present(status)&&<div className="xui-app-header-status">{status}</div>}
      {present(actions)&&<div className="xui-app-header-actions">{actions}</div>}
      {present(children)&&<div className="xui-app-header-legacy">{children}</div>}
      <div className="xui-app-header-controls">
        {present(auxiliary)&&<div className="xui-app-header-auxiliary">{auxiliary}</div>}
        {isHeaderLocaleEnabled(locale)&&<HeaderLocaleSelect locale={locale}/>}
        <div className="xui-app-header-theme"><ThemeModeButton theme={theme} labels={themeLabels}/></div>
      </div>
      {present(account)&&<div className="xui-app-header-account">{account}</div>}
    </div>}
  </div>;
}
/** Content only: button/link/status semantics and business callbacks stay with the host. */
export function AppHeader(props:AppHeaderProps){return <AppHeaderFrame {...props}/>;}

export type SidebarFooterContentProps=Omit<React.ComponentProps<'span'>,'children'> & {icon?:React.ReactNode;children:React.ReactNode};
export function SidebarFooterContent({icon,children,className,...props}:SidebarFooterContentProps){
  return <span {...props} className={cx('xui-sidebar-footer-content',className)}>
    {icon!==undefined&&icon!==null&&typeof icon!=='boolean'&&<span className="xui-sidebar-footer-icon" aria-hidden="true">{icon}</span>}
    <span className="xui-sidebar-footer-label">{children}</span>
  </span>;
}
export interface AppShellProps extends Omit<React.ComponentProps<'div'>,'children'> {
  theme?:ThemeController;themeLabels?:Partial<ThemeModeLabels>;locale?:HeaderLocaleOptions;scrollMode?:ShellScrollMode;sidebar:React.ReactNode;sidebarHeader?:React.ReactNode;sidebarFooter?:React.ReactNode;pageHeader?:React.ReactNode;pageToolbar?:React.ReactNode;pageFooter?:React.ReactNode;header?:React.ReactNode;headerSlots?:AppHeaderSlots;children:React.ReactNode;
  collapsed?:boolean;defaultCollapsed?:boolean;onCollapsedChange?:(collapsed:boolean)=>void;compactLabel?:string;expandLabel?:string;
  restoreSidebarFocus?:boolean;navigationLabel?:string;skipLabel?:string;closeLabel?:string;
  sidebarOpen?:boolean;defaultSidebarOpen?:boolean;onSidebarOpenChange?:(open:boolean)=>void;
}
/** One sidebar tree; routing, navigation selection and data remain with the host. */
export function AppShell({theme,themeLabels,locale,restoreSidebarFocus=true,scrollMode='document',sidebar,sidebarHeader,sidebarFooter,pageHeader,pageToolbar,pageFooter,collapsed:controlledCollapsed,defaultCollapsed=false,onCollapsedChange,compactLabel='Compact navigation',expandLabel='Expand navigation',header,headerSlots,children,navigationLabel='Navigation',skipLabel='Skip to content',closeLabel='Close navigation',sidebarOpen,defaultSidebarOpen=false,onSidebarOpenChange,className,...props}:AppShellProps){
  const [internal,setInternal]=React.useState(defaultSidebarOpen),[narrow,setNarrow]=React.useState(false);
  const [internalCollapsed,setInternalCollapsed]=React.useState(defaultCollapsed);const collapsed=controlledCollapsed??internalCollapsed,sidebarId=React.useId(),drawerId=React.useId();
  const requestCollapsed=(next:boolean)=>{if(controlledCollapsed===undefined)setInternalCollapsed(next);onCollapsedChange?.(next);};
  const hasFooter=hasContent(sidebarFooter),hasHeader=hasContent(sidebarHeader),hasSections=hasHeader||hasFooter;
  const [sidebarElement,setSidebarElement]=React.useState<HTMLElement|null>(null);
  const desktopSlot=React.useRef<HTMLDivElement>(null),drawerSlot=React.useRef<HTMLDivElement>(null),headerElement=React.useRef<HTMLElement>(null);
  // A constant portal target moves between the desktop grid and the existing drawer.
  // The content tree survives responsive changes and repeated open/close cycles.
  React.useLayoutEffect(()=>{const element=document.createElement('aside');element.className='xui-shell-sidebar';element.id=sidebarId;setSidebarElement(element);return()=>{element.remove();};},[sidebarId]);
  React.useLayoutEffect(()=>{if(!sidebarElement)return;sidebarElement.classList.toggle('xui-shell-sidebar-with-footer',hasSections);if(!hasSections)sidebarElement.style.blockSize='';const target=narrow?drawerSlot.current:desktopSlot.current;if(target&&sidebarElement.parentNode!==target)target.append(sidebarElement);sidebarElement.setAttribute('aria-label',navigationLabel);sidebarElement.querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'nearest'});},[hasSections,sidebarElement,narrow,navigationLabel]);
  React.useLayoutEffect(()=>{if(!hasSections||!sidebarElement||!headerElement.current)return;const headerNode=headerElement.current;const measure=()=>{sidebarElement.style.blockSize=!narrow&&scrollMode==='document'?`max(var(--nav-sidebar-min-height), calc(100dvh - ${headerNode.getBoundingClientRect().height}px))`:'';};measure();const observer=new ResizeObserver(measure);observer.observe(headerNode);return()=>observer.disconnect();},[hasSections,sidebarElement,narrow,scrollMode]);
  const open=sidebarOpen??internal;const trigger=React.useRef<HTMLButtonElement>(null),main=React.useRef<HTMLElement>(null),drawer=React.useRef<HTMLDivElement>(null);const id=React.useId();
  const request=React.useCallback((next:boolean)=>{if(sidebarOpen===undefined)setInternal(next);onSidebarOpenChange?.(next);},[sidebarOpen,onSidebarOpenChange]);
  const navigationToggle=<Dialog.Trigger ref={trigger} render={<Button className="xui-shell-toggle" variant="ghost" data-icon="true" data-xui-menu-toggle=""/>} aria-label={narrow?navigationLabel:collapsed?expandLabel:compactLabel} aria-expanded={narrow?open:!collapsed} aria-haspopup={narrow?'dialog':undefined} aria-controls={narrow?drawerId:sidebarId} data-collapsed={!narrow&&collapsed} onClick={event=>{if(!narrow){event.preventBaseUIHandler();requestCollapsed(!collapsed);}}}><svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="var(--nav-icon-stroke-width)"><path d="M3 4h14v12H3zM7 4v12"/><path className="xui-shell-toggle-arrow" d="m13 8-2 2 2 2"/></svg></Dialog.Trigger>;
  React.useEffect(()=>{const media=window.matchMedia('(max-width: 47.999rem)');let wasNarrow=media.matches;setNarrow(wasNarrow);const update=()=>{setNarrow(media.matches);if(wasNarrow&&!media.matches)request(false);wasNarrow=media.matches;};media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[request]);
  const navigationSidebar=<ShellNavigationContext.Provider value={{collapsed,onCollapsedChange:requestCollapsed,fallbackFocus:()=>drawer.current?.hasAttribute('data-open')?drawer.current.querySelector<HTMLElement>('.xui-dialog-footer button')??drawer.current:trigger.current}}>{sidebar}</ShellNavigationContext.Provider>;
  return <Dialog.Root open={narrow&&open} onOpenChange={next=>request(next)}><div {...props} data-collapsed={collapsed} data-scroll-mode={scrollMode} className={cx('xui-shell',className)}>
    <a className="xui-skip-link" href={`#${id}`}>{skipLabel}</a>
    <header ref={headerElement} className="xui-shell-header"><AppHeaderFrame {...headerSlots} legacyPrimary={headerSlots?undefined:header} navigation={navigationToggle} theme={theme} themeLabels={themeLabels} locale={locale}>{headerSlots?header:undefined}</AppHeaderFrame></header>
    {<div ref={desktopSlot} className="xui-shell-sidebar-host"/>}
    {typeof document==='undefined'&&<aside id={sidebarId} className="xui-shell-sidebar" aria-label={navigationLabel}>{navigationSidebar}</aside>}
    {sidebarElement&&createPortal(<>{hasHeader&&<div className="xui-shell-sidebar-header">{sidebarHeader}</div>}<div className={hasSections?"xui-shell-sidebar-menu":undefined}>{navigationSidebar}</div>{hasFooter&&<div className="xui-shell-sidebar-footer">{sidebarFooter}</div>}</>,sidebarElement)}
    <main className="xui-shell-main" id={id} ref={main} tabIndex={-1}>{hasContent(pageHeader)&&<div className="xui-shell-page-header">{pageHeader}</div>}{hasContent(pageToolbar)&&<div className="xui-shell-page-toolbar">{pageToolbar}</div>}<div className="xui-shell-content">{children}</div>{hasContent(pageFooter)&&<footer className="xui-shell-page-footer">{pageFooter}</footer>}</main>
  </div>{<Dialog.Content id={drawerId} keepMounted ref={drawer} className="xui-shell-drawer" finalFocus={()=>{const active=document.activeElement;if(!restoreSidebarFocus||active&&active!==document.body&&active!==trigger.current&&active.isConnected&&!drawer.current?.contains(active))return false;return window.matchMedia('(max-width: 47.999rem)').matches?trigger.current:main.current;}}><Dialog.Title>{navigationLabel}</Dialog.Title><Dialog.Body ref={node=>{drawerSlot.current=node;if(node&&narrow&&sidebarElement&&sidebarElement.parentNode!==node)node.append(sidebarElement);}} className={hasSections?'xui-shell-sidebar-body':undefined}></Dialog.Body><Dialog.Footer><Dialog.Close render={<Button variant="outline"/>}>{closeLabel}</Dialog.Close></Dialog.Footer></Dialog.Content>}</Dialog.Root>;
}
