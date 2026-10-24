import * as React from 'react';
import {useRender} from '@base-ui/react/use-render';
import {Button} from './button.js';
import {Icon} from './display.js';
import {cx} from './shared.js';
const Overflow=/* @__PURE__ */React.lazy(()=>import('./breadcrumb-overflow.js'));

export interface BreadcrumbItem {
 id:string;label:string;href?:string;icon?:React.ReactNode;disabled?:boolean;
 /** Optional router link element. href remains the canonical URI; the host owns routing. */
 render?:React.ReactElement<React.ComponentProps<'a'>>;
 linkProps?:Omit<React.ComponentProps<'a'>,'href'|'children'|'aria-current'>;
}
export type BreadcrumbLinkProps=React.ComponentProps<'a'>&{disabled?:boolean;render?:BreadcrumbItem['render']};
function Link({disabled=false,render,ref,className,onClickCapture,onAuxClickCapture,onKeyDownCapture,href,...props}:BreadcrumbLinkProps){
 const element=useRender({defaultTagName:'a',render,ref,state:{disabled},props:{...props,href:disabled?undefined:href,className:cx('xui-breadcrumb-link',className),'aria-disabled':disabled||undefined,tabIndex:disabled?-1:props.tabIndex,
  onClickCapture:(event:React.MouseEvent<HTMLAnchorElement>)=>{if(disabled){event.preventDefault();event.stopPropagation();}onClickCapture?.(event);},
  onAuxClickCapture:(event:React.MouseEvent<HTMLAnchorElement>)=>{if(disabled){event.preventDefault();event.stopPropagation();}onAuxClickCapture?.(event);},
  onKeyDownCapture:(event:React.KeyboardEvent<HTMLAnchorElement>)=>{if(disabled&&event.key==='Enter'){event.preventDefault();event.stopPropagation();}onKeyDownCapture?.(event);},
 }}) as React.ReactElement<React.ComponentProps<'a'>>;
 return disabled?React.cloneElement(element,{href:undefined,tabIndex:-1,'aria-disabled':true}):element;
}
function Item({className,...props}:React.ComponentProps<'li'>){return <li {...props} className={cx('xui-breadcrumb-item',className)}/>;}
function Current({className,...props}:React.ComponentProps<'span'>){return <span {...props} aria-current="page" className={cx('xui-breadcrumb-current',className)}/>;}
function Separator({className,children='/',...props}:React.ComponentProps<'span'>){return <span {...props} aria-hidden="true" className={cx('xui-breadcrumb-separator',className)}>{children}</span>;}
type Presentation=Omit<React.ComponentProps<'nav'>,'children'>&{
 disabled?:boolean;separator?:React.ReactNode;overflowLabel?:string;overflowContent?:React.ReactNode;
 onNavigate?:(item:Readonly<BreadcrumbItem>,event:React.MouseEvent<HTMLAnchorElement>)=>void;
};
export type BreadcrumbsProps=Presentation&({items:readonly BreadcrumbItem[];children?:never;maxItems?:number}|{items?:undefined;children?:React.ReactNode;maxItems?:never});
function Root({items,children,maxItems,disabled=false,separator,overflowLabel='Show parent locations',overflowContent='…',onNavigate,className,ref,onFocusCapture,onBlurCapture,...props}:BreadcrumbsProps){
 const root=React.useRef<HTMLElement>(null),more=React.useRef<HTMLButtonElement>(null),focused=React.useRef<HTMLElement|null>(null);
 React.useImperativeHandle(ref,()=>root.current!);
 if(items!==undefined&&children!==undefined)throw new TypeError('Breadcrumbs accepts items or composition children, not both');
 if(maxItems!==undefined&&(!Number.isSafeInteger(maxItems)||maxItems<3))throw new TypeError('Breadcrumbs maxItems must be at least 3');
 if(items&&(new Set(items.map(item=>item.id)).size!==items.length||items.some(item=>!item.id?.trim()||!item.label?.trim())))throw new TypeError('Breadcrumbs needs unique ids and nonempty labels');
 React.useLayoutEffect(()=>{const old=focused.current,doc=root.current?.ownerDocument;if(old&&!old.isConnected&&doc&&doc.activeElement===doc.body){(more.current??root.current?.querySelector<HTMLAnchorElement>('.xui-breadcrumb-link:not([aria-disabled="true"])'))?.focus();focused.current=null;}});
 const activate=(item:BreadcrumbItem,event:React.MouseEvent<HTMLAnchorElement>)=>{item.linkProps?.onClick?.(event);if(!event.defaultPrevented&&event.button===0&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.currentTarget.hasAttribute('download')&&(!event.currentTarget.target||event.currentTarget.target==='_self'))onNavigate?.(item,event);};
 const content=(item:BreadcrumbItem)=><>{item.icon&&<Icon color="currentColor">{item.icon}</Icon>}<span className="xui-breadcrumb-label">{item.label}</span></>;
 const tail=items&&maxItems!==undefined&&items.length>maxItems?items.length-(maxItems-2):1;
 const hidden=items&&tail>1?items.slice(1,tail):[];
 if(items?.length===0)return null;
 const renderItem=(item:BreadcrumbItem,index:number)=>{
  const current=index===items!.length-1,blocked=disabled||item.disabled;
  return <Item key={item.id}>{index>0&&<Separator>{separator??'/'}</Separator>}{current?<Current>{content(item)}</Current>:blocked||!item.href?<span className="xui-breadcrumb-label" aria-disabled={blocked||undefined}>{content(item)}</span>:<Link {...item.linkProps} render={item.render} href={item.href} data-breadcrumb-id={item.id} onClick={event=>activate(item,event)}>{content(item)}</Link>}</Item>;
 };
 return <nav aria-label="Breadcrumbs" {...props} ref={root} className={cx('xui-breadcrumbs',className)} onFocusCapture={event=>{focused.current=event.target as HTMLElement;onFocusCapture?.(event);}} onBlurCapture={event=>{if(event.relatedTarget&&!root.current?.contains(event.relatedTarget as Node))focused.current=null;onBlurCapture?.(event);}}><ol className="xui-breadcrumb-list">{items?<>{renderItem(items[0],0)}{hidden.length>0&&<Item><Separator>{separator??'/'}</Separator><React.Suspense fallback={<Button variant="text" size="sm" disabled aria-busy="true" aria-label={overflowLabel}>{overflowContent}</Button>}><Overflow items={hidden} disabled={disabled} label={overflowLabel} triggerRef={more} content={content} onNavigate={activate}>{overflowContent}</Overflow></React.Suspense></Item>}{items.slice(tail).map((item,index)=>renderItem(item,tail+index))}</>:children}</ol></nav>;
}
/** items owns the complete list; named parts retain the existing children composition. */
export const Breadcrumbs=/* @__PURE__ */Object.assign(Root,{Root,Item,Link,Current,Separator});
