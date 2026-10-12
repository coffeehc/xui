import * as React from 'react';
import { Dialog } from './dialog.js';
import { Button } from './button.js';
import { cx } from './shared.js';

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
export interface AppShellProps extends Omit<React.ComponentProps<'div'>,'children'> {
  scrollMode?:'document'|'viewport';sidebar:React.ReactNode;header?:React.ReactNode;headerSlots?:AppHeaderSlots;children:React.ReactNode;
  restoreSidebarFocus?:boolean;navigationLabel?:string;skipLabel?:string;closeLabel?:string;
  sidebarOpen?:boolean;defaultSidebarOpen?:boolean;onSidebarOpenChange?:(open:boolean)=>void;
}
/** One sidebar tree; routing, navigation selection and data remain with the host. */
export function AppShell({restoreSidebarFocus=true,scrollMode='document',sidebar,header,headerSlots,children,navigationLabel='Navigation',skipLabel='Skip to content',closeLabel='Close navigation',sidebarOpen,defaultSidebarOpen=false,onSidebarOpenChange,className,...props}:AppShellProps){
  const [internal,setInternal]=React.useState(defaultSidebarOpen),[narrow,setNarrow]=React.useState(false);
  const open=sidebarOpen??internal;const trigger=React.useRef<HTMLButtonElement>(null),main=React.useRef<HTMLElement>(null),drawer=React.useRef<HTMLDivElement>(null);const id=React.useId();
  const request=React.useCallback((next:boolean)=>{if(sidebarOpen===undefined)setInternal(next);onSidebarOpenChange?.(next);},[sidebarOpen,onSidebarOpenChange]);
  const navigationToggle=<Dialog.Trigger ref={trigger} render={<Button className="xui-shell-toggle" variant="ghost" aria-label={navigationLabel}/>}><span aria-hidden="true">☰</span></Dialog.Trigger>;
  React.useEffect(()=>{const media=window.matchMedia('(max-width: 47.999rem)');let wasNarrow=media.matches;setNarrow(wasNarrow);const update=()=>{setNarrow(media.matches);if(wasNarrow&&!media.matches)request(false);wasNarrow=media.matches;};media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[request]);
  return <Dialog.Root open={narrow&&open} onOpenChange={next=>request(next)}><div {...props} data-scroll-mode={scrollMode} className={cx('xui-shell',className)}>
    <a className="xui-skip-link" href={`#${id}`}>{skipLabel}</a>
    <header className="xui-shell-header">{headerSlots?<AppHeader {...headerSlots} navigation={navigationToggle}>{header}</AppHeader>:<>{navigationToggle}{header}</>}</header>
    {!narrow&&<aside className="xui-shell-sidebar" aria-label={navigationLabel}>{sidebar}</aside>}
    <main className="xui-shell-main" id={id} ref={main} tabIndex={-1}>{children}</main>
  </div>{narrow&&<Dialog.Content ref={drawer} className="xui-shell-drawer" finalFocus={()=>{const active=document.activeElement;if(!restoreSidebarFocus||active&&active!==document.body&&active!==trigger.current&&active.isConnected&&!drawer.current?.contains(active))return false;return window.matchMedia('(max-width: 47.999rem)').matches?trigger.current:main.current;}}><Dialog.Title>{navigationLabel}</Dialog.Title><Dialog.Body>{sidebar}</Dialog.Body><Dialog.Footer><Dialog.Close render={<Button variant="outline"/>}>{closeLabel}</Dialog.Close></Dialog.Footer></Dialog.Content>}</Dialog.Root>;
}
