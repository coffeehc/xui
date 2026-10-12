import * as React from 'react';
import {indexNavigation,getNavigationActiveId,resolveNavigationIcon,navigateNavigationItem,createNavigationKeyboard,type NavigationItem,type NavigationMenuOptions,type NavigationMenuState,type NavigationIconResolver} from '@coffeehc/xui-runtime/navigation';
import {NavItem} from './navigation.js';
import {AppShell,type AppHeaderSlots} from './layout.js';
import {Button} from './button.js';
import {cx} from './shared.js';
export type {NavigationItem,NavigationMenuOptions,NavigationMenuState,NavigationIconResolver} from '@coffeehc/xui-runtime/navigation';

export interface NavigationMenuProps extends NavigationMenuOptions {
  className?:string;renderLink?:(item:NavigationItem)=>React.ReactElement;
  renderLabel?:(item:NavigationItem)=>React.ReactNode;
}
function Icon({name,resolver}:{name?:string;resolver?:NavigationIconResolver}){const icon=resolveNavigationIcon(name,resolver);return <svg aria-hidden="true" viewBox={icon.viewBox??'0 0 20 20'} fill="none" stroke="currentColor" strokeWidth="1.5">{icon.paths.map((d,index)=><path key={index} d={d}/>)}</svg>;}
export function NavigationMenu({items,className,renderLink,renderLabel,...options}:NavigationMenuProps){
  const nodes=React.useMemo(()=>indexNavigation(items),[items]),active=getNavigationActiveId(nodes,options);
  const [internalCollapsed,setInternalCollapsed]=React.useState(options.defaultCollapsed??false),[internalExpanded,setInternalExpanded]=React.useState<readonly string[]>(()=>[...(options.defaultExpandedIds??[]),...(nodes.get(active??'')?.ancestors??[])]);
  const collapsed=options.collapsed??internalCollapsed,expanded=options.expandedIds??internalExpanded;
  const root=React.useRef<HTMLElement>(null),keyboard=React.useRef<ReturnType<typeof createNavigationKeyboard>|null>(null);
  const prefix=React.useId(),signature=JSON.stringify([active,nodes.get(active??'')?.ancestors]);
  React.useEffect(()=>{if(options.expandedIds===undefined)setInternalExpanded(current=>[...new Set([...current,...(nodes.get(active??'')?.ancestors??[])])]);},[signature,options.expandedIds]);
  const setExpanded=(id:string,open:boolean)=>{if(nodes.get(id)?.disabled)return;const next=new Set(expanded);open?next.add(id):next.delete(id);if(options.expandedIds===undefined)setInternalExpanded([...next]);options.onExpandedChange?.([...next]);};
  const latest=React.useRef({nodes,active,expanded,setExpanded});latest.current={nodes,active,expanded,setExpanded};
  React.useLayoutEffect(()=>{keyboard.current=createNavigationKeyboard(root.current!,{activeId:()=>latest.current.active,node:id=>latest.current.nodes.get(id),expanded:id=>latest.current.expanded.includes(id),setExpanded:(id,open)=>latest.current.setExpanded(id,open),listen:false});return()=>{keyboard.current?.destroy();keyboard.current=null;};},[]);
  React.useLayoutEffect(()=>{keyboard.current?.refresh();if(root.current?.closest('[data-scroll-mode="viewport"]'))root.current?.querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'nearest'});},[items,active,expanded,collapsed]);
  const compact=()=>{const next=!collapsed;if(options.collapsed===undefined)setInternalCollapsed(next);options.onCollapsedChange?.(next);};
  const renderItems=(entries:readonly NavigationItem[]):React.ReactNode=>entries.map(item=>{
    const node=nodes.get(item.id)!,hasChildren=!!item.children?.length,open=!!item.group||expanded.includes(item.id),childId=prefix+'-'+encodeURIComponent(item.id);
    const content=<>{(item.icon||collapsed)&&<Icon name={item.icon} resolver={options.resolveIcon}/>}<span className="xui-menu-label">{renderLabel?.(item)??item.label}</span></>;
    return <li key={item.id} className="xui-menu-entry" data-menu-entry={item.id}><div className="xui-menu-row">
      {item.group?<h2 className="xui-menu-group-title">{content}</h2>:item.href?<NavItem render={renderLink?.(item)} href={item.href} target={item.target} rel={item.rel} download={item.download} selected={active===item.id} disabled={node.disabled} collapsed={collapsed} title={item.label} data-menu-id={item.id} data-menu-control="primary" onClick={event=>navigateNavigationItem(item,event,{...options,items,location:options.location??window.location.href,baseURL:options.baseURL??window.location.href})}>{content}</NavItem>:
        <button type="button" className="xui-nav-item" disabled={node.disabled||!hasChildren} aria-expanded={open} aria-controls={childId} data-menu-id={item.id} data-menu-control="primary" data-collapsed={collapsed} title={item.label} onClick={()=>setExpanded(item.id,!open)}>{content}<span aria-hidden="true" className="xui-menu-chevron">⌄</span></button>}
      {!!item.href&&hasChildren&&<Button className="xui-menu-branch-toggle" variant="ghost" disabled={node.disabled} aria-label={`${open?'Collapse':'Expand'} ${item.label}`} aria-expanded={open} aria-controls={childId} data-menu-id={item.id} data-menu-control="toggle" onClick={()=>setExpanded(item.id,!open)}><span aria-hidden="true" className="xui-menu-chevron">⌄</span></Button>}
    </div><ul className="xui-menu-children" id={childId} hidden={!open}>{renderItems(item.children??[])}</ul></li>;
  });
  return <nav ref={root} className={cx('xui-navigation-menu xui-layer',className)} aria-label={options.label??'Navigation'} data-collapsed={collapsed}
    onKeyDown={event=>keyboard.current?.key(event.nativeEvent)} onKeyUp={()=>keyboard.current?.released()} onBlur={()=>keyboard.current?.released()} onFocus={event=>keyboard.current?.focused(event.nativeEvent)}>
    <Button className="xui-menu-compact-toggle" variant="ghost" aria-label={collapsed?options.expandLabel??'Expand navigation':options.compactLabel??'Compact navigation'} aria-pressed={collapsed} onClick={compact}>{collapsed?'›':'‹'}</Button>
    <ul className="xui-menu-list">{renderItems(items)}</ul>{items.length===0&&<p className="xui-menu-empty">{options.emptyLabel??'No navigation items'}</p>}
  </nav>;
}

export interface MenuLayoutProps extends NavigationMenuProps {
  restoreSidebarFocus?:boolean;style?:React.CSSProperties;scrollMode?:'document'|'viewport';children:React.ReactNode;title?:string;header?:React.ReactNode;headerSlots?:AppHeaderSlots;
  sidebarOpen?:boolean;defaultSidebarOpen?:boolean;onSidebarOpenChange?:(open:boolean)=>void;
  skipLabel?:string;closeLabel?:string;
}
/** Owns the default menu and shell; no route key is applied to either. */
export function MenuLayout({restoreSidebarFocus=true,style,scrollMode,children,title,header,headerSlots,sidebarOpen,defaultSidebarOpen=false,onSidebarOpenChange,skipLabel,closeLabel,collapsed:controlledCollapsed,defaultCollapsed=false,onCollapsedChange,className,...menu}:MenuLayoutProps){
  const [internalOpen,setInternalOpen]=React.useState(defaultSidebarOpen),[internalCollapsed,setInternalCollapsed]=React.useState(defaultCollapsed);
  const nodes=React.useMemo(()=>indexNavigation(menu.items),[menu.items]),active=getNavigationActiveId(nodes,menu),signature=JSON.stringify([active,nodes.get(active??'')?.ancestors]);
  const [internalExpanded,setInternalExpanded]=React.useState<readonly string[]>(()=>[...new Set([...(menu.defaultExpandedIds??[]),...(nodes.get(active??'')?.ancestors??[])])]);
  React.useEffect(()=>{if(menu.expandedIds===undefined)setInternalExpanded(current=>[...new Set([...current,...(nodes.get(active??'')?.ancestors??[])])]);},[signature,menu.expandedIds]);
  const open=sidebarOpen??internalOpen,collapsed=controlledCollapsed??internalCollapsed;
  const requestOpen=React.useCallback((next:boolean)=>{if(sidebarOpen===undefined)setInternalOpen(next);onSidebarOpenChange?.(next);},[sidebarOpen,onSidebarOpenChange]);
  const requestCollapsed=(next:boolean)=>{if(controlledCollapsed===undefined)setInternalCollapsed(next);onCollapsedChange?.(next);};
  const requestExpanded=(next:readonly string[])=>{if(menu.expandedIds===undefined)setInternalExpanded(next);menu.onExpandedChange?.(next);};
  const navigation=menu.navigation?{canNavigate:menu.navigation.canNavigate,navigate:(request:Parameters<NonNullable<NavigationMenuOptions['navigation']>['navigate']>[0])=>{requestOpen(false);menu.navigation!.navigate(request);}}:undefined;
  return <AppShell restoreSidebarFocus={restoreSidebarFocus} style={style} scrollMode={scrollMode} className={cx('xui xui-menu-layout',className)} data-collapsed={collapsed} navigationLabel={menu.label} skipLabel={skipLabel} closeLabel={closeLabel} sidebarOpen={open} onSidebarOpenChange={requestOpen} header={header} headerSlots={{...headerSlots,brand:headerSlots?.brand===undefined?(title?<strong title={title}>{title}</strong>:undefined):headerSlots.brand}}
    sidebar={<NavigationMenu {...menu} navigation={navigation} collapsed={collapsed} onCollapsedChange={requestCollapsed} expandedIds={menu.expandedIds??internalExpanded} onExpandedChange={requestExpanded}/>}>{children}</AppShell>;
}
