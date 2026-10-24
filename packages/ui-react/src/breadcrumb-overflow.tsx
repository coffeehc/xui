import * as React from 'react';
import {Button} from './button.js';
import {Menu} from './menu.js';
import type {BreadcrumbItem} from './breadcrumbs.js';

/** Only collapsed paths load the optional menu implementation. */
export default function BreadcrumbOverflow({items,disabled,label,triggerRef,content,onNavigate,children}:{
 items:readonly BreadcrumbItem[];disabled:boolean;label:string;triggerRef:React.Ref<HTMLButtonElement>;
 content:(item:BreadcrumbItem)=>React.ReactNode;onNavigate:(item:BreadcrumbItem,event:React.MouseEvent<HTMLAnchorElement>)=>void;children:React.ReactNode;
}){
 return <Menu.Root><Menu.Trigger render={<Button ref={triggerRef} variant="text" size="sm" disabled={disabled} aria-label={label}/>}>{children}</Menu.Trigger><Menu.Content>{items.map(item=>disabled||item.disabled||!item.href?<Menu.Item key={item.id} disabled>{content(item)}</Menu.Item>:<Menu.LinkItem key={item.id} {...item.linkProps} render={item.render} href={item.href} onClick={event=>onNavigate(item,event)}>{content(item)}</Menu.LinkItem>)}</Menu.Content></Menu.Root>;
}
