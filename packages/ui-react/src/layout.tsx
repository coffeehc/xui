import * as React from 'react';
import {createPortal} from 'react-dom';
import { Dialog } from './dialog.js';
import { Button } from './button.js';
import { cx } from './shared.js';
import {ShellNavigationContext} from './shell-context.js';

export function Container({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-container',className)}/>;}
export function Stack({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-stack',className)}/>;}
export function Grid({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-grid',className)}/>;}
export function Toolbar({className,...props}:React.ComponentProps<'div'>){return <div role="group" {...props} className={cx('xui-toolbar',className)}/>;}
export type PageHeaderProps=Omit<React.ComponentProps<'header'>,'title'> & {title:React.ReactNode;description?:React.ReactNode;actions?:React.ReactNode;meta?:React.ReactNode};
export function PageHeader({title,description,actions,meta,className,...props}:PageHeaderProps){return <header {...props} className={cx('xui-page-header',className)}><div><h1>{title}</h1>{description&&<p>{description}</p>}{meta}</div>{actions&&<div className="xui-toolbar">{actions}</div>}</header>;}
export type SectionProps=Omit<React.ComponentProps<'section'>,'title'> & {title?:React.ReactNode;actions?:React.ReactNode};
export function Section({title,actions,children,className,...props}:SectionProps){const id=React.useId();return <section aria-labelledby={title?id:undefined} {...props} className={cx('xui-section',className)}>{(title||actions)&&<header className="xui-section-header">{title&&<h2 id={id}>{title}</h2>}{actions&&<div className="xui-toolbar">{actions}</div>}</header>}{children}</section>;}

export interface AppHeaderSlots {
  brand?:React.ReactNode;breadcrumb?:React.ReactNode;status?:React.ReactNode;actions?:React.ReactNode;
}
export type AppHeaderProps=React.ComponentProps<'div'> & AppHeaderSlots & {navigation?:React.ReactNode};
/** Role-based layout only. The host supplies names, breadcrumb semantics and actions. */
export function AppHeader({brand,breadcrumb,status,actions,navigation,children,className,...props}:AppHeaderProps){
  const present=(value:React.ReactNode)=>value!==undefined&&value!==null&&value!==false;
  return <div {...props} className={cx('xui-app-header',className)}>
    <div className="xui-app-header-primary">{present(navigation)&&<div className="xui-app-header-navigation">{navigation}</div>}
      {present(brand)&&<div className="xui-app-header-brand">{brand}</div>}
      {present(breadcrumb)&&<div className="xui-app-header-breadcrumb">{breadcrumb}</div>}
    </div>
    {(present(status)||present(actions)||present(children))&&<div className="xui-app-header-secondary">
      {present(status)&&<div className="xui-app-header-status">{status}</div>}
      {present(actions)&&<div className="xui-app-header-actions">{actions}</div>}
      {present(children)&&<div className="xui-app-header-legacy">{children}</div>}
    </div>}
  </div>;
}
/** Content only: button/link/status semantics and business callbacks stay with the host. */
export type SidebarFooterContentProps=Omit<React.ComponentProps<'span'>,'children'> & {icon?:React.ReactNode;children:React.ReactNode};
export function SidebarFooterContent({icon,children,className,...props}:SidebarFooterContentProps){
  return <span {...props} className={cx('xui-sidebar-footer-content',className)}>
    {icon!==undefined&&icon!==null&&typeof icon!=='boolean'&&<span className="xui-sidebar-footer-icon" aria-hidden="true">{icon}</span>}
    <span className="xui-sidebar-footer-label">{children}</span>
  </span>;
}
export interface AppShellProps extends Omit<React.ComponentProps<'div'>,'children'> {
  scrollMode?:'document'|'viewport';sidebar:React.ReactNode;sidebarFooter?:React.ReactNode;header?:React.ReactNode;headerSlots?:AppHeaderSlots;children:React.ReactNode;
  collapsed?:boolean;defaultCollapsed?:boolean;onCollapsedChange?:(collapsed:boolean)=>void;compactLabel?:string;expandLabel?:string;
  restoreSidebarFocus?:boolean;navigationLabel?:string;skipLabel?:string;closeLabel?:string;
  sidebarOpen?:boolean;defaultSidebarOpen?:boolean;onSidebarOpenChange?:(open:boolean)=>void;
}
/** One sidebar tree; routing, navigation selection and data remain with the host. */
export function AppShell({restoreSidebarFocus=true,scrollMode='document',sidebar,sidebarFooter,collapsed:controlledCollapsed,defaultCollapsed=false,onCollapsedChange,compactLabel='Compact navigation',expandLabel='Expand navigation',header,headerSlots,children,navigationLabel='Navigation',skipLabel='Skip to content',closeLabel='Close navigation',sidebarOpen,defaultSidebarOpen=false,onSidebarOpenChange,className,...props}:AppShellProps){
  const [internal,setInternal]=React.useState(defaultSidebarOpen),[narrow,setNarrow]=React.useState(false);
  const [internalCollapsed,setInternalCollapsed]=React.useState(defaultCollapsed);const collapsed=controlledCollapsed??internalCollapsed,sidebarId=React.useId(),drawerId=React.useId();
  const requestCollapsed=(next:boolean)=>{if(controlledCollapsed===undefined)setInternalCollapsed(next);onCollapsedChange?.(next);};
  const hasFooter=sidebarFooter!==undefined&&sidebarFooter!==null&&sidebarFooter!==false;
  const [sidebarElement,setSidebarElement]=React.useState<HTMLElement|null>(null);
  const desktopSlot=React.useRef<HTMLDivElement>(null),drawerSlot=React.useRef<HTMLDivElement>(null),headerElement=React.useRef<HTMLElement>(null);
  // A constant portal target moves between the desktop grid and the existing drawer.
  // The content tree survives responsive changes and repeated open/close cycles.
  React.useLayoutEffect(()=>{const element=document.createElement('aside');element.className='xui-shell-sidebar xui-shell-sidebar-with-footer';element.id=sidebarId;setSidebarElement(element);return()=>{element.remove();};},[sidebarId]);
  React.useLayoutEffect(()=>{if(!sidebarElement)return;if(!hasFooter){sidebarElement.remove();return;}const target=narrow?drawerSlot.current:desktopSlot.current;if(target&&sidebarElement.parentNode!==target)target.append(sidebarElement);sidebarElement.setAttribute('aria-label',navigationLabel);sidebarElement.querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'nearest'});},[hasFooter,sidebarElement,narrow,navigationLabel]);
  React.useLayoutEffect(()=>{if(!hasFooter||!sidebarElement||!headerElement.current)return;const headerNode=headerElement.current;const measure=()=>{sidebarElement.style.blockSize=!narrow&&scrollMode==='document'?`max(calc(var(--nav-item-height) * 4), calc(100dvh - ${headerNode.getBoundingClientRect().height}px))`:'';};measure();const observer=new ResizeObserver(measure);observer.observe(headerNode);return()=>observer.disconnect();},[hasFooter,sidebarElement,narrow,scrollMode]);
  const open=sidebarOpen??internal;const trigger=React.useRef<HTMLButtonElement>(null),main=React.useRef<HTMLElement>(null),drawer=React.useRef<HTMLDivElement>(null);const id=React.useId();
  const request=React.useCallback((next:boolean)=>{if(sidebarOpen===undefined)setInternal(next);onSidebarOpenChange?.(next);},[sidebarOpen,onSidebarOpenChange]);
  const navigationToggle=<Dialog.Trigger ref={trigger} render={<Button className="xui-shell-toggle" variant="ghost" data-icon="true" data-xui-menu-toggle=""/>} aria-label={narrow?navigationLabel:collapsed?expandLabel:compactLabel} aria-expanded={narrow?open:!collapsed} aria-haspopup={narrow?'dialog':undefined} aria-controls={narrow?drawerId:sidebarId} data-collapsed={!narrow&&collapsed} onClick={event=>{if(!narrow){event.preventBaseUIHandler();requestCollapsed(!collapsed);}}}><svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4h14v12H3zM7 4v12"/><path className="xui-shell-toggle-arrow" d="m13 8-2 2 2 2"/></svg></Dialog.Trigger>;
  React.useEffect(()=>{const media=window.matchMedia('(max-width: 47.999rem)');let wasNarrow=media.matches;setNarrow(wasNarrow);const update=()=>{setNarrow(media.matches);if(wasNarrow&&!media.matches)request(false);wasNarrow=media.matches;};media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[request]);
  const navigationSidebar=<ShellNavigationContext.Provider value={{collapsed,onCollapsedChange:requestCollapsed,fallbackFocus:()=>drawer.current?.hasAttribute('data-open')?drawer.current.querySelector<HTMLElement>('.xui-dialog-footer button')??drawer.current:trigger.current}}>{sidebar}</ShellNavigationContext.Provider>;
  return <Dialog.Root open={narrow&&open} onOpenChange={next=>request(next)}><div {...props} data-collapsed={collapsed} data-scroll-mode={scrollMode} className={cx('xui-shell',className)}>
    <a className="xui-skip-link" href={`#${id}`}>{skipLabel}</a>
    <header ref={headerElement} className="xui-shell-header">{headerSlots?<AppHeader {...headerSlots} navigation={navigationToggle}>{header}</AppHeader>:<>{navigationToggle}{header}</>}</header>
    {hasFooter?<div ref={desktopSlot} className="xui-shell-sidebar-host"/>:!narrow&&<aside id={sidebarId} className="xui-shell-sidebar" aria-label={navigationLabel}>{navigationSidebar}</aside>}
    {hasFooter&&sidebarElement&&createPortal(<><div className="xui-shell-sidebar-menu">{navigationSidebar}</div><div className="xui-shell-sidebar-footer">{sidebarFooter}</div></>,sidebarElement)}
    <main className="xui-shell-main" id={id} ref={main} tabIndex={-1}>{children}</main>
  </div>{(narrow||hasFooter)&&<Dialog.Content id={drawerId} keepMounted={hasFooter} ref={drawer} className="xui-shell-drawer" finalFocus={()=>{const active=document.activeElement;if(!restoreSidebarFocus||active&&active!==document.body&&active!==trigger.current&&active.isConnected&&!drawer.current?.contains(active))return false;return window.matchMedia('(max-width: 47.999rem)').matches?trigger.current:main.current;}}><Dialog.Title>{navigationLabel}</Dialog.Title><Dialog.Body ref={node=>{drawerSlot.current=node;if(node&&hasFooter&&narrow&&sidebarElement&&sidebarElement.parentNode!==node)node.append(sidebarElement);}} className={hasFooter?'xui-shell-sidebar-body':undefined}>{!hasFooter&&navigationSidebar}</Dialog.Body><Dialog.Footer><Dialog.Close render={<Button variant="outline"/>}>{closeLabel}</Dialog.Close></Dialog.Footer></Dialog.Content>}</Dialog.Root>;
}
