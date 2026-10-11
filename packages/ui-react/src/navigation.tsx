import * as React from 'react';
import { useRender } from '@base-ui/react/use-render';
import { cx, branded } from './shared.js';
export function Nav({className,...props}: React.ComponentProps<'nav'>) { return <nav {...props} className={cx('xui-nav',className)} />; }
export type NavItemState = { selected:boolean; disabled:boolean; collapsed:boolean };
export type NavItemProps = useRender.ComponentProps<'a',NavItemState,React.ComponentPropsWithRef<'a'>> & { selected?: boolean; disabled?: boolean; collapsed?: boolean };
export function NavItem({selected,'aria-current':ariaCurrent,disabled,collapsed,className,render,ref,...props}: NavItemProps) {
  const renderCurrent=React.isValidElement<React.ComponentProps<'a'>>(render)?render.props['aria-current']:undefined;
  const current=selected === undefined ? ariaCurrent ?? renderCurrent : selected ? 'page' : undefined;
  const state={selected:current==='page',disabled:!!disabled,collapsed:!!collapsed};
  const element=useRender({defaultTagName:'a',render,ref,state,props:{...props,className:cx('xui-nav-item',className),'aria-current':current,'aria-disabled':disabled || undefined,'data-collapsed':collapsed}}) as React.ReactElement<React.ComponentProps<'a'> & {'data-collapsed'?:boolean}>;
  const merged=element.props as React.ComponentProps<'a'>;
  // Capture guards run before a composed link's router handler. Enabled links
  // retain the browser's normal modifiers, target and download behavior.
  return React.cloneElement(element,{
    'aria-current':current,'aria-disabled':disabled || undefined,'data-collapsed':collapsed,
    href:disabled?undefined:merged.href,tabIndex:disabled?-1:merged.tabIndex,
    onClickCapture:(event:React.MouseEvent<HTMLAnchorElement>)=>{if(disabled){event.preventDefault();event.stopPropagation();}merged.onClickCapture?.(event);},
    onAuxClickCapture:(event:React.MouseEvent<HTMLAnchorElement>)=>{if(disabled){event.preventDefault();event.stopPropagation();}merged.onAuxClickCapture?.(event);},
    onKeyDownCapture:(event:React.KeyboardEvent<HTMLAnchorElement>)=>{if(disabled&&event.key==='Enter'){event.preventDefault();event.stopPropagation();}merged.onKeyDownCapture?.(event);},
  });
}

export function Breadcrumbs({className,children,...props}:React.ComponentProps<'nav'>){return <nav aria-label="Breadcrumbs" {...props} className={cx('xui-breadcrumbs',className)}><ol>{children}</ol></nav>;}
export type PaginationProps=Omit<React.ComponentProps<'nav'>,'onChange'> & {page?:number;defaultPage?:number;pageCount:number;onPageChange?:(page:number)=>void;disabled?:boolean;previousLabel?:string;nextLabel?:string};
export function Pagination({page,defaultPage=1,pageCount,onPageChange,disabled,previousLabel='Previous page',nextLabel='Next page',className,...props}:PaginationProps){
  const [internal,setInternal]=React.useState(defaultPage);const count=Math.max(1,Math.floor(pageCount)||1),current=Math.min(count,Math.max(1,Math.floor(page??internal)||1));
  const change=(next:number)=>{if(disabled||next<1||next>count||next===current)return;if(page===undefined)setInternal(next);onPageChange?.(next);};
  return <nav aria-label="Pagination" {...props} className={cx('xui-pagination',className)}><button className="xui-button" type="button" disabled={disabled||current===1} onClick={()=>change(current-1)}>{previousLabel}</button><span aria-live="polite">{current} / {count}</span><button className="xui-button" type="button" disabled={disabled||current===count} onClick={()=>change(current+1)}>{nextLabel}</button></nav>;
}
export type DisclosureProps=Omit<React.ComponentProps<'div'>,'onChange'|'title'> & {title:React.ReactNode;open?:boolean;defaultOpen?:boolean;onOpenChange?:(open:boolean)=>void;disabled?:boolean};
export function Disclosure({title,open,defaultOpen=false,onOpenChange,disabled,children,className,...props}:DisclosureProps){const [internal,setInternal]=React.useState(defaultOpen);const expanded=open??internal;const id=React.useId();return <div {...props} className={cx('xui-disclosure',className)}><button type="button" className="xui-disclosure-trigger" aria-expanded={expanded} aria-controls={id} disabled={disabled} onClick={()=>{if(open===undefined)setInternal(!expanded);onOpenChange?.(!expanded);}}>{title}<span aria-hidden="true">{expanded?'−':'+'}</span></button><div id={id} hidden={!expanded} className="xui-disclosure-body">{children}</div></div>;}
