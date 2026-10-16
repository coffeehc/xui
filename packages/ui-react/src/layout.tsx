import * as React from 'react';
import {createPortal} from 'react-dom';
import { Dialog } from './dialog.js';
import { Button } from './button.js';
import {Icon} from './display.js';
import {SimpleSelect} from './forms.js';
import { cx,hasContent } from './shared.js';
import {ThemeModeButton} from './theme.js';
import type {ThemeController} from '@coffeehc/xui-runtime/theme';
import {isHeaderLocaleEnabled,type HeaderLocaleOptions} from '@coffeehc/xui-runtime/header-controls';
import type {ThemeModeLabels} from '@coffeehc/xui-runtime/theme-control';
export type {HeaderLocaleOptions,HeaderLocaleOption} from '@coffeehc/xui-runtime/header-controls';
export type ShellScrollMode='document'|'viewport'|'workspace';
export type ShellContentInset='standard'|'edge';
export type SidebarTogglePlacement='top'|'bottom';
import {ShellNavigationContext} from './shell-context.js';

export function Container({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-container',className)}/>;}
export function Stack({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-stack',className)}/>;}
export function Grid({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-grid',className)}/>;}
/** A form's own width determines one or at most two columns; it never changes field order or state. */
export type FormGridProps=React.ComponentProps<'div'>&{columns?:1|2};
/** Full-span content stays in DOM reading order and spans only this form grid. */
export type FormGridItemProps=React.ComponentProps<'div'>&{span?:'full'};
function FormGridRoot({columns=2,className,...props}:FormGridProps){return <div {...props} data-columns={columns} className={cx('xui-form-grid',className)}/>;}
function FormGridItem({span,className,...props}:FormGridItemProps){return <div {...props} data-span={span} className={cx('xui-form-item',className)}/>;}
/** Use Item span="full" for long content and confirmations; Field still owns labels and errors. */
export const FormGrid=Object.assign(FormGridRoot,{Item:FormGridItem});
/** Secondary actions precede the primary group in DOM order; both groups wrap without stretching buttons. */
export type FormActionsProps=React.ComponentProps<'div'>&{secondary?:React.ReactNode};
export function FormActions({secondary,children,className,...props}:FormActionsProps){return <div {...props} className={cx('xui-form-actions',className)}>{hasContent(secondary)&&<div className="xui-form-actions-secondary">{secondary}</div>}{hasContent(children)&&<div className="xui-form-actions-primary">{children}</div>}</div>;}
export function Toolbar({className,...props}:React.ComponentProps<'div'>){return <div role="group" {...props} className={cx('xui-toolbar',className)}/>;}
export type PageHeaderProps=Omit<React.ComponentProps<'header'>,'title'> & {title:React.ReactNode;description?:React.ReactNode;actions?:React.ReactNode;meta?:React.ReactNode};
export function PageHeader({title,description,actions,meta,className,...props}:PageHeaderProps){return <header {...props} className={cx('xui-page-header',className)}><div className="xui-page-header-main"><h1>{title}</h1>{hasContent(description)&&<p>{description}</p>}{hasContent(meta)&&<div className="xui-page-header-meta">{meta}</div>}</div>{hasContent(actions)&&<div className="xui-toolbar">{actions}</div>}</header>;}
export type SectionProps=Omit<React.ComponentProps<'section'>,'title'> & {title?:React.ReactNode;actions?:React.ReactNode};
export function Section({title,actions,children,className,...props}:SectionProps){const id=React.useId();return <section aria-labelledby={hasContent(title)?id:undefined} {...props} className={cx('xui-section',className)}>{(hasContent(title)||hasContent(actions))&&<header className="xui-section-header">{hasContent(title)&&<h2 id={id}>{title}</h2>}{hasContent(actions)&&<div className="xui-toolbar">{actions}</div>}</header>}{children}</section>;}

function HeaderLocaleSelect({locale}:{locale:HeaderLocaleOptions}){
 const mount=React.useRef<HTMLSpanElement>(null);
 React.useLayoutEffect(()=>{const node=mount.current!;return()=>{const active=node.ownerDocument.activeElement,popupId=node.querySelector('[role=combobox]')?.getAttribute('aria-controls');if(node.contains(active)||popupId&&node.ownerDocument.getElementById(popupId)?.contains(active))node.closest('.xui-app-header-controls')?.querySelector<HTMLButtonElement>('.xui-theme-mode-toggle')?.focus();};},[]);
 const known=locale.options.some(item=>item.value===locale.value);
 return <span className="xui-select-host" data-xui-header-locale="" ref={mount}><SimpleSelect className="xui-header-locale" aria-label={locale.label??'语言'} value={locale.value} disabled={locale.disabled} onChange={event=>{const value=event.currentTarget.value;if(locale.enabled&&!locale.disabled&&value!==locale.value&&locale.options.some(item=>item.value===value&&!item.disabled))locale.onValueChange(value);}}>{!known&&<option value={locale.value} hidden disabled/>}{locale.options.map(item=><option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>)}</SimpleSelect></span>;
}

/** Product identity content; its region tracks the shell rail automatically. */
export function HeaderBrand({logo,children,className,...props}:React.ComponentProps<'span'>&{logo?:React.ReactNode}){
  return <span {...props} className={cx('xui-header-brand',className)}>{logo&&<span className="xui-header-brand-logo" aria-hidden="true">{logo}</span>}<span className="xui-header-brand-name">{children}</span></span>;
}

export interface AppHeaderSlots {
  leading?:React.ReactNode;brand?:React.ReactNode;breadcrumb?:React.ReactNode;status?:React.ReactNode;actions?:React.ReactNode;auxiliary?:React.ReactNode;context?:React.ReactNode;account?:React.ReactNode;
}
export type AppHeaderProps=React.ComponentProps<'div'> & AppHeaderSlots & {navigation?:React.ReactNode;theme?:ThemeController;themeLabels?:Partial<ThemeModeLabels>;locale?:HeaderLocaleOptions};
/** Role-based layout only. The host supplies names, breadcrumb semantics and actions. */
function AppHeaderFrame({legacyPrimary,leading,brand,breadcrumb,status,actions,auxiliary,context,account,navigation,theme,themeLabels,locale,children,className,...props}:AppHeaderProps&{legacyPrimary?:React.ReactNode}){
  const present=hasContent;
  return <div {...props} className={cx('xui-app-header',className)}>
    <div className="xui-app-header-primary">{(present(leading)||present(brand))&&<div className="xui-app-header-identity">{present(leading)&&<div className="xui-app-header-leading">{leading}</div>}{present(brand)&&<div className="xui-app-header-brand">{brand}</div>}</div>}
      {present(navigation)&&<div className="xui-app-header-navigation">{navigation}</div>}
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
/** Natural-width footer groups share a line when they fit and wrap without truncation. */
export function SidebarFooterRow({className,...props}:React.ComponentProps<'div'>){
  return <div {...props} className={cx('xui-sidebar-footer-row',className)}/>;
}
/** The action glyph changes without replacing the shell's owned trigger. */
function ShellNavigationIcon({drawer}:{drawer:boolean}){
  return <Icon><svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" strokeLinecap="round" strokeLinejoin="round">
    {drawer?<path d="M3 5h14M3 10h14M3 15h14"/>:<><path d="M4 2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM7 2v16"/><path className="xui-shell-toggle-arrow" d="m14 7-4 3 4 3"/></>}
  </svg></Icon>;
}
export interface AppShellProps extends Omit<React.ComponentProps<'div'>,'children'> {
  /** Workspace content spacing; defaults to standard and is retained in other scroll modes. */
  contentInset?:ShellContentInset;
  /** Desktop only: top (default) is the sidebar's first row, aligned to its end; bottom follows the menu and optional sidebarFooter. */
  sidebarTogglePlacement?:SidebarTogglePlacement;
  theme?:ThemeController;themeLabels?:Partial<ThemeModeLabels>;locale?:HeaderLocaleOptions;scrollMode?:ShellScrollMode;sidebar:React.ReactNode;sidebarHeader?:React.ReactNode;sidebarFooter?:React.ReactNode;pageHeader?:React.ReactNode;pageToolbar?:React.ReactNode;pageFooter?:React.ReactNode;header?:React.ReactNode;headerSlots?:AppHeaderSlots;children:React.ReactNode;
  collapsed?:boolean;defaultCollapsed?:boolean;onCollapsedChange?:(collapsed:boolean)=>void;compactLabel?:string;expandLabel?:string;
  restoreSidebarFocus?:boolean;navigationLabel?:string;skipLabel?:string;closeLabel?:string;
  sidebarOpen?:boolean;defaultSidebarOpen?:boolean;onSidebarOpenChange?:(open:boolean)=>void;
}
/** One sidebar tree; routing, navigation selection and data remain with the host. */
export function AppShell({theme,themeLabels,locale,restoreSidebarFocus=true,scrollMode='document',contentInset='standard',sidebarTogglePlacement='top',sidebar,sidebarHeader,sidebarFooter,pageHeader,pageToolbar,pageFooter,collapsed:controlledCollapsed,defaultCollapsed=false,onCollapsedChange,compactLabel='Compact navigation',expandLabel='Expand navigation',header,headerSlots,children,navigationLabel='Navigation',skipLabel='Skip to content',closeLabel='Close navigation',sidebarOpen,defaultSidebarOpen=false,onSidebarOpenChange,className,...props}:AppShellProps){
  const [internal,setInternal]=React.useState(defaultSidebarOpen),[narrow,setNarrow]=React.useState(false);
  const [internalCollapsed,setInternalCollapsed]=React.useState(defaultCollapsed);const collapsed=controlledCollapsed??internalCollapsed,sidebarId=React.useId(),drawerId=React.useId();
  const requestCollapsed=(next:boolean)=>{if(controlledCollapsed===undefined)setInternalCollapsed(next);onCollapsedChange?.(next);};
  const hasFooter=hasContent(sidebarFooter),hasHeader=hasContent(sidebarHeader),hasSections=hasHeader||hasFooter||sidebarTogglePlacement==='bottom';
  const [sidebarElement,setSidebarElement]=React.useState<HTMLElement|null>(null),[navigationControl,setNavigationControl]=React.useState<HTMLDivElement|null>(null);
  const desktopSlot=React.useRef<HTMLDivElement>(null),drawerSlot=React.useRef<HTMLDivElement>(null),headerElement=React.useRef<HTMLElement>(null),headerToggleSlot=React.useRef<HTMLSpanElement>(null),controlHadFocus=React.useRef(false);
  // A constant portal target moves between the desktop grid and the existing drawer.
  // The content tree survives responsive changes and repeated open/close cycles.
  React.useLayoutEffect(()=>{const element=document.createElement('aside'),control=document.createElement('div');element.className='xui-shell-sidebar';element.id=sidebarId;control.className='xui-shell-navigation-control';setSidebarElement(element);setNavigationControl(control);return()=>{control.remove();element.remove();};},[sidebarId]);
  // Reparenting may blur to body before the layout effect. Only a new focus
  // target or pointer intent ends the control's previous focus ownership.
  React.useLayoutEffect(()=>{if(!navigationControl)return;const focus=(event:FocusEvent)=>{if(event.target!==document.body&&!navigationControl.contains(event.target as Node))controlHadFocus.current=false;},pointer=(event:PointerEvent)=>{if(!navigationControl.contains(event.target as Node))controlHadFocus.current=false;};document.addEventListener('focusin',focus,true);document.addEventListener('pointerdown',pointer,true);return()=>{document.removeEventListener('focusin',focus,true);document.removeEventListener('pointerdown',pointer,true);};},[navigationControl]);
  React.useLayoutEffect(()=>{if(!sidebarElement)return;sidebarElement.classList.toggle('xui-shell-sidebar-with-footer',hasSections);if(!hasSections)sidebarElement.style.blockSize='';const target=narrow?drawerSlot.current:desktopSlot.current;if(target&&sidebarElement.parentNode!==target)target.append(sidebarElement);sidebarElement.setAttribute('aria-label',navigationLabel);},[hasSections,sidebarElement,narrow,navigationLabel]);
  // One owned control moves with the responsive frame, preserving its DOM and focus.
  React.useLayoutEffect(()=>{if(!sidebarElement||!navigationControl)return;const target=narrow?headerToggleSlot.current:sidebarElement,atEnd=narrow||sidebarTogglePlacement==='bottom';if(!target||navigationControl.parentNode===target&&(atEnd?target.lastElementChild:target.firstElementChild)===navigationControl)return;const active=document.activeElement,focused=!!active&&navigationControl.contains(active)||controlHadFocus.current&&active===document.body;atEnd?target.append(navigationControl):target.prepend(navigationControl);if(focused)navigationControl.querySelector<HTMLButtonElement>('button')?.focus();else controlHadFocus.current=false;},[sidebarElement,navigationControl,narrow,sidebarTogglePlacement,hasHeader,hasFooter]);
  React.useLayoutEffect(()=>{if(!hasSections||!sidebarElement||!headerElement.current)return;const headerNode=headerElement.current;const measure=()=>{sidebarElement.style.blockSize=!narrow&&scrollMode==='document'?`max(var(--nav-sidebar-min-height), calc(100dvh - ${headerNode.getBoundingClientRect().height}px))`:'';};measure();const observer=new ResizeObserver(measure);observer.observe(headerNode);return()=>observer.disconnect();},[hasSections,sidebarElement,narrow,scrollMode]);
  // The owned control must occupy its final space before locating the active row.
  React.useLayoutEffect(()=>{sidebarElement?.querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'nearest'});},[hasSections,sidebarElement,navigationControl,narrow,navigationLabel,scrollMode]);
  const open=sidebarOpen??internal;const trigger=React.useRef<HTMLButtonElement>(null),main=React.useRef<HTMLElement>(null),drawer=React.useRef<HTMLDivElement>(null);const id=React.useId();
  const request=React.useCallback((next:boolean)=>{if(sidebarOpen===undefined)setInternal(next);onSidebarOpenChange?.(next);},[sidebarOpen,onSidebarOpenChange]);
  const toggleLabel=narrow?navigationLabel:collapsed?expandLabel:compactLabel;
  const navigationToggle=<Dialog.Trigger ref={trigger} render={<Button className="xui-shell-toggle" variant="ghost" data-icon="true" data-xui-menu-toggle=""/>} aria-label={toggleLabel} title={toggleLabel} aria-expanded={narrow?open:!collapsed} aria-haspopup={narrow?'dialog':undefined} aria-controls={narrow?drawerId:sidebarId} data-collapsed={!narrow&&collapsed} onFocus={()=>{controlHadFocus.current=true;}} onClick={event=>{if(!narrow){event.preventBaseUIHandler();requestCollapsed(!collapsed);}}}><ShellNavigationIcon drawer={narrow}/></Dialog.Trigger>;
  React.useEffect(()=>{const media=window.matchMedia('(max-width: 47.999rem)');let wasNarrow=media.matches;setNarrow(wasNarrow);const update=()=>{setNarrow(media.matches);if(wasNarrow&&!media.matches)request(false);wasNarrow=media.matches;};media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[request]);
  const navigationSidebar=<ShellNavigationContext.Provider value={{collapsed,onCollapsedChange:requestCollapsed,fallbackFocus:()=>drawer.current?.hasAttribute('data-open')?drawer.current.querySelector<HTMLElement>('.xui-dialog-footer button')??drawer.current:trigger.current}}>{sidebar}</ShellNavigationContext.Provider>;
  return <Dialog.Root open={narrow&&open} onOpenChange={next=>request(next)}><div {...props} data-collapsed={collapsed} data-scroll-mode={scrollMode} data-content-inset={contentInset} data-sidebar-toggle-placement={sidebarTogglePlacement} className={cx('xui-shell',className)}>
    <a className="xui-skip-link" href={`#${id}`}>{skipLabel}</a>
    <header ref={headerElement} className="xui-shell-header"><AppHeaderFrame {...headerSlots} legacyPrimary={headerSlots?undefined:header} navigation={<span className="xui-shell-toggle-slot" ref={headerToggleSlot}/>} theme={theme} themeLabels={themeLabels} locale={locale}>{headerSlots?header:undefined}</AppHeaderFrame></header>
    {<div ref={desktopSlot} className="xui-shell-sidebar-host"/>}
    {typeof document==='undefined'&&<aside id={sidebarId} className={cx('xui-shell-sidebar',hasSections?'xui-shell-sidebar-with-footer':undefined)} aria-label={navigationLabel}>{sidebarTogglePlacement==='top'&&<div className="xui-shell-navigation-control">{navigationToggle}</div>}{hasHeader&&<div className="xui-shell-sidebar-header">{sidebarHeader}</div>}{hasSections?<div className="xui-shell-sidebar-menu">{navigationSidebar}</div>:navigationSidebar}{hasFooter&&<div className="xui-shell-sidebar-footer">{sidebarFooter}</div>}{sidebarTogglePlacement==='bottom'&&<div className="xui-shell-navigation-control">{navigationToggle}</div>}</aside>}
    {navigationControl&&createPortal(navigationToggle,navigationControl)}
    {sidebarElement&&createPortal(<>{hasHeader&&<div className="xui-shell-sidebar-header">{sidebarHeader}</div>}<div className={hasSections?"xui-shell-sidebar-menu":undefined}>{navigationSidebar}</div>{hasFooter&&<div className="xui-shell-sidebar-footer">{sidebarFooter}</div>}</>,sidebarElement)}
    <main className="xui-shell-main" id={id} ref={main} tabIndex={-1}>{hasContent(pageHeader)&&<div className="xui-shell-page-header">{pageHeader}</div>}{hasContent(pageToolbar)&&<div className="xui-shell-page-toolbar">{pageToolbar}</div>}<div className="xui-shell-content">{children}</div>{hasContent(pageFooter)&&<footer className="xui-shell-page-footer">{pageFooter}</footer>}</main>
  </div>{<Dialog.Content id={drawerId} keepMounted ref={drawer} className="xui-shell-drawer" finalFocus={()=>{const active=document.activeElement;if(!restoreSidebarFocus||active&&active!==document.body&&active!==trigger.current&&active.isConnected&&!drawer.current?.contains(active))return false;return window.matchMedia('(max-width: 47.999rem)').matches?trigger.current:main.current;}}><Dialog.Title>{navigationLabel}</Dialog.Title><Dialog.Body ref={node=>{drawerSlot.current=node;if(node&&narrow&&sidebarElement&&sidebarElement.parentNode!==node)node.append(sidebarElement);}} className={hasSections?'xui-shell-sidebar-body':undefined}></Dialog.Body><Dialog.Footer><Dialog.Close render={<Button variant="outline"/>}>{closeLabel}</Dialog.Close></Dialog.Footer></Dialog.Content>}</Dialog.Root>;
}
