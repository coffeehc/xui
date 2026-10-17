import {assertControllerProps} from './controller.js';
import {useOverlay,type WithController,type OverlayController} from './interaction-hooks.js';
import {useOwnedController,type ControllerProps} from './controller.js';
import {createPaginationController,type PaginationController,type PaginationOptions} from '@coffeehc/xui-runtime/interaction';
import type {NavigationTone,NavigationVariant} from '@coffeehc/xui-runtime/navigation';
export type {NavigationTone,NavigationVariant} from '@coffeehc/xui-runtime/navigation';
import * as React from 'react';
import { useRender } from '@base-ui/react/use-render';
import { cx, branded } from './shared.js';
export function Nav({className,...props}: React.ComponentProps<'nav'>) { return <nav {...props} className={cx('xui-nav',className)} />; }
export type NavItemState = { selected:boolean; disabled:boolean; collapsed:boolean;tone?:NavigationTone;variant?:NavigationVariant };
export type NavItemProps = useRender.ComponentProps<'a',NavItemState,React.ComponentPropsWithRef<'a'>> & { selected?: boolean; disabled?: boolean; collapsed?: boolean;
  /** Warning changes local text/icon/indicator semantics and keeps the surface transparent. */
  tone?:NavigationTone;
  /** Text is transparent in default/hover/pressed/selected/disabled states. */
  variant?:NavigationVariant };
export function NavItem({selected,'aria-current':ariaCurrent,disabled,collapsed,tone='default',variant='default',className,render,ref,...props}: NavItemProps) {
  const renderCurrent=React.isValidElement<React.ComponentProps<'a'>>(render)?render.props['aria-current']:undefined;
  const current=selected === undefined ? ariaCurrent ?? renderCurrent : selected ? 'page' : undefined;
  const state={selected:current==='page',disabled:!!disabled,collapsed:!!collapsed,tone,variant};
  const element=useRender({defaultTagName:'a',render,ref,state,props:{...props,className:cx('xui-nav-item',className),'aria-current':current,'aria-disabled':disabled || undefined,'data-collapsed':collapsed,'data-tone':tone,'data-variant':variant}}) as React.ReactElement<React.ComponentProps<'a'> & {'data-collapsed'?:boolean;'data-tone'?:NavigationTone;'data-variant'?:NavigationVariant}>;
  const merged=element.props as React.ComponentProps<'a'>;
  // Capture guards run before a composed link's router handler. Enabled links
  // retain the browser's normal modifiers, target and download behavior.
  return React.cloneElement(element,{
    'aria-current':current,'aria-disabled':disabled || undefined,'data-collapsed':collapsed,'data-tone':tone,'data-variant':variant,
    href:disabled?undefined:merged.href,tabIndex:disabled?-1:merged.tabIndex,
    onClickCapture:(event:React.MouseEvent<HTMLAnchorElement>)=>{if(disabled){event.preventDefault();event.stopPropagation();}merged.onClickCapture?.(event);},
    onAuxClickCapture:(event:React.MouseEvent<HTMLAnchorElement>)=>{if(disabled){event.preventDefault();event.stopPropagation();}merged.onAuxClickCapture?.(event);},
    onKeyDownCapture:(event:React.KeyboardEvent<HTMLAnchorElement>)=>{if(disabled&&event.key==='Enter'){event.preventDefault();event.stopPropagation();}merged.onKeyDownCapture?.(event);},
  });
}

export function Breadcrumbs({className,children,...props}:React.ComponentProps<'nav'>){return <nav aria-label="Breadcrumbs" {...props} className={cx('xui-breadcrumbs',className)}><ol>{children}</ol></nav>;}
export type PaginationProps=Omit<React.ComponentProps<'nav'>,'onChange'> & ControllerProps<PaginationController,PaginationOptions> & {previousLabel?:string;nextLabel?:string};
export function Pagination(allProps:PaginationProps){const {controller:injected,page,defaultPage=1,pageCount,onPageChange,disabled,previousLabel='Previous page',nextLabel='Next page',className,...props}=allProps;assertControllerProps(injected,allProps,['page','defaultPage','pageCount','onPageChange','disabled']);
  const latest=React.useRef(onPageChange);latest.current=onPageChange;
  const controller=useOwnedController(injected,()=>createPaginationController({page,defaultPage,pageCount:pageCount!,disabled,onPageChange:next=>latest.current?.(next)}));
  const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),count=state.pageCount,current=state.page;
  React.useLayoutEffect(()=>{if(!injected)controller.update({page,pageCount,disabled});},[controller,injected,page,pageCount,disabled]);
  const change=controller.setPage;
  return <nav aria-label="Pagination" {...props} className={cx('xui-pagination',className)}><button className="xui-button" type="button" disabled={state.disabled||current===1} onClick={()=>change(current-1)}>{previousLabel}</button><span aria-live="polite">{current} / {count}</span><button className="xui-button" type="button" disabled={state.disabled||current===count} onClick={()=>change(current+1)}>{nextLabel}</button></nav>;
}
export interface DisclosureIndicatorProps {open:boolean;className?:string}
/** Decorative default indicator; the trigger owns the accessible name/state. */
export function DisclosureIndicator({open,className}:DisclosureIndicatorProps){return <svg className={cx('xui-disclosure-indicator',className)} data-open={open} aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)"><path d="m5 7 5 5 5-5"/></svg>;}
export type DisclosureProps=Omit<React.ComponentProps<'div'>,'onChange'|'title'> & {title:React.ReactNode;disabled?:boolean;
  /** Defaults to text; default explicitly retains the legacy shaded trigger. State and focus ownership are unchanged. */
  variant?:'default'|'text'}&ControllerProps<OverlayController,{open?:boolean;defaultOpen?:boolean;onOpenChange?:(open:boolean)=>void}>;
export function Disclosure({title,controller,open,defaultOpen,onOpenChange,disabled,variant='text',children,className,...props}:DisclosureProps){
  const state=useOverlay({controller,open,defaultOpen,onOpenChange}),expanded=state.open,id=React.useId(),trigger=React.useRef<HTMLButtonElement>(null),panel=React.useRef<HTMLDivElement>(null),focusWithin=React.useRef(false);
  React.useLayoutEffect(()=>{
    if(expanded)return;
    const body=panel.current,active=body?.ownerDocument.activeElement;
    // Applying hidden can blur a descendant before layout effects run. Keep that
    // ownership, but never override a focus target the host has chosen outside.
    if(body&&(body.contains(active??null)||focusWithin.current&&active===body.ownerDocument.body))trigger.current?.focus();
    focusWithin.current=false;
  },[expanded]);
  return <div {...props} className={cx('xui-disclosure',className)}><button ref={trigger} type="button" className="xui-disclosure-trigger" data-variant={variant} aria-expanded={expanded} aria-controls={id} disabled={disabled} onClick={()=>state.onOpenChange(!expanded,{reason:'trigger-press'})}><span className="xui-disclosure-label">{title}</span><DisclosureIndicator open={expanded}/></button><div ref={panel} id={id} hidden={!expanded} className="xui-disclosure-body" onFocusCapture={()=>{focusWithin.current=true;}} onBlurCapture={event=>{if(!event.currentTarget.hidden)focusWithin.current=event.currentTarget.contains(event.relatedTarget);}}>{children}</div></div>;
}
