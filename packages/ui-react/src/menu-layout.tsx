import {assertControllerProps} from './controller.js';
import {createNavigationPresentationController,type NavigationPresentationController,type NavigationPresentationOptions} from '@coffeehc/xui-runtime/interaction';
import {useOwnedController,type ControllerProps} from './controller.js';
import {createNavigationKeyboard} from './navigation-keyboard.js';
import * as React from 'react';
import {bindNavigationPresentation} from './navigation-presentation.js';
import {useRender} from '@base-ui/react/use-render';
import {indexNavigation,getNavigationActiveId,resolveNavigationIcon,navigateNavigationItem,type NavigationItem,type NavigationMenuOptions,type NavigationMenuState,type NavigationIconResolver} from '@coffeehc/xui-runtime/navigation';
import {NavItem} from './navigation.js';
import {AppShell,type AppHeaderSlots,type ShellScrollMode,type ShellContentInset,type SidebarTogglePlacement} from './layout.js';
export type {SidebarTogglePlacement} from './layout.js';
import {Button} from './button.js';
import {cx} from './shared.js';
import type {HeaderLocaleOptions} from '@coffeehc/xui-runtime/header-controls';
import type {ThemeModeLabels} from '@coffeehc/xui-runtime/theme-control';
import type {ThemeController} from '@coffeehc/xui-runtime/theme';
import {ShellNavigationContext} from './shell-context.js';
export type {NavigationItem,NavigationMenuOptions,NavigationMenuState,NavigationIconResolver} from '@coffeehc/xui-runtime/navigation';

interface NavigationMenuSlots extends Omit<NavigationMenuOptions,keyof NavigationPresentationOptions> {
  className?:string;renderLink?:(item:NavigationItem)=>React.ReactElement;
  /** Render one props/ref-forwarding button for a branch without href. */
  renderButton?:(item:NavigationItem)=>React.ReactElement;
  /** One auxiliary button, beside the primary control; never inside its label. */
  renderAction?:(item:NavigationItem)=>React.ReactElement|null;
  /** Non-interactive rich content in the full remaining primary-control width.
   * Keep only the name in NavigationMenu.Label; passive status may sit beside it. */
  renderLabel?:(item:NavigationItem)=>React.ReactNode;
}
export type NavigationMenuProps=NavigationMenuSlots&ControllerProps<NavigationPresentationController,Pick<NavigationPresentationOptions,'collapsed'|'defaultCollapsed'|'onCollapsedChange'|'expandedIds'|'defaultExpandedIds'|'onExpandedChange'>>;
function Icon({name,resolver}:{name?:string;resolver?:NavigationIconResolver}){const icon=resolveNavigationIcon(name,resolver);return <svg aria-hidden="true" viewBox={icon.viewBox??'0 0 20 20'} fill="none" stroke="currentColor" strokeWidth="var(--nav-icon-stroke-width)">{icon.paths.map((d,index)=><path key={index} d={d}/>)}</svg>;}
function BranchButton({render,disabled,ref,...props}:React.ComponentPropsWithRef<'button'>&{render?:React.ReactElement}){
  const element=useRender({defaultTagName:'button',render,ref,props:{...props,disabled}}) as React.ReactElement<React.ComponentProps<'button'>>;
  return React.cloneElement(element,{disabled,onClickCapture:event=>{if(disabled){event.preventDefault();event.stopPropagation();}element.props.onClickCapture?.(event);}});
}
function RowAction({item,disabled,render}:{item:NavigationItem;disabled:boolean;render:React.ReactElement}){
  if(typeof render.type==='string'&&render.type!=='button')throw new TypeError('A navigation action must be one button');
  const props=render.props as React.ComponentProps<'button'>,blocked=disabled||!!props.disabled||props['aria-disabled']===true||props['aria-disabled']==='true';
  return <Button render={render} className="xui-menu-row-action" variant="ghost" data-icon="true" type="button" disabled={blocked} aria-disabled={blocked||undefined} aria-label={props['aria-label']??`Actions for ${item.label}`} title={props.title??props['aria-label']??`Actions for ${item.label}`} data-menu-id={item.id} data-menu-control="action" onClickCapture={event=>{if(blocked){event.preventDefault();event.stopPropagation();}}}/>;
}
/** Non-interactive name only; keep descriptions and badges outside this part. */
export type NavigationMenuLabelProps=Pick<React.ComponentProps<'span'>,'children'|'className'|'title'|'lang'|'dir'>;
function NavigationMenuLabel({children,className,...props}:NavigationMenuLabelProps){return <span {...props} className={cx('xui-navigation-label',className)}><span className="xui-navigation-label-text">{children}</span></span>;}
function NavigationMenuRoot(allProps:NavigationMenuProps){const {controller:injected,items,className,renderLink,renderButton,renderAction,renderLabel,...options}=allProps;assertControllerProps(injected,allProps,['collapsed','defaultCollapsed','onCollapsedChange','expandedIds','defaultExpandedIds','onExpandedChange']);
  const shell=React.useContext(ShellNavigationContext);
  const nodes=React.useMemo(()=>indexNavigation(items),[items]),active=getNavigationActiveId(nodes,options);
  const latestOptions=React.useRef(options);latestOptions.current=options;
  const controller=useOwnedController(injected??shell?.controller,()=>createNavigationPresentationController({...options,defaultExpandedIds:[...(options.defaultExpandedIds??[]),...(nodes.get(active??'')?.ancestors??[])],onCollapsedChange:next=>latestOptions.current.onCollapsedChange?.(next),onExpandedChange:next=>latestOptions.current.onExpandedChange?.(next)}));
  const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),collapsed=state.collapsed,expanded=state.expandedIds;
  React.useLayoutEffect(()=>{if(!injected&&(!shell||shell.owned))controller.update({...(!shell?{collapsed:options.collapsed}:{}),expandedIds:options.expandedIds,...(shell?{onExpandedChange:(next:readonly string[])=>latestOptions.current.onExpandedChange?.(next)}:{})});},[controller,injected,shell?.owned,options.collapsed,options.expandedIds]);
  const root=React.useRef<HTMLElement>(null),keyboard=React.useRef<ReturnType<typeof createNavigationKeyboard>|null>(null),presentation=React.useRef<ReturnType<typeof bindNavigationPresentation>|null>(null);
  const prefix=React.useId(),signature=JSON.stringify([active,nodes.get(active??'')?.ancestors]);
  React.useLayoutEffect(()=>controller.revealAncestors(nodes.get(active??'')?.ancestors??[]),[controller,signature]);
  const setExpanded=(id:string,open:boolean)=>{if(nodes.get(id)?.disabled)return;const next=new Set(expanded);open?next.add(id):next.delete(id);controller.setExpandedIds([...next]);};
  const latest=React.useRef({nodes,active,expanded,setExpanded});latest.current={nodes,active,expanded,setExpanded};
  React.useLayoutEffect(()=>{presentation.current=bindNavigationPresentation(root.current!);keyboard.current=createNavigationKeyboard(root.current!,{activeId:()=>latest.current.active,node:id=>latest.current.nodes.get(id),expanded:id=>latest.current.expanded.includes(id),setExpanded:(id,open)=>latest.current.setExpanded(id,open),listen:false,fallbackFocus:()=>shell?.fallbackFocus()??null});return()=>{presentation.current?.destroy();presentation.current=null;keyboard.current?.destroy();keyboard.current=null;};},[]);
  React.useLayoutEffect(()=>{keyboard.current?.refresh();presentation.current?.refresh();});
  React.useLayoutEffect(()=>{if(root.current?.closest('[data-scroll-mode="viewport"],[data-scroll-mode="workspace"],.xui-shell-sidebar-with-footer'))root.current?.querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'nearest'});},[items,active,expanded,collapsed]);
  const compact=()=>controller.setCollapsed(!collapsed);
  const renderItems=(entries:readonly NavigationItem[]):React.ReactNode=>entries.map(item=>{
    const node=nodes.get(item.id)!,hasChildren=!!item.children?.length,open=!!item.group||expanded.includes(item.id),childId=prefix+'-'+encodeURIComponent(item.id);
    const action=renderAction?.(item);
    const content=<>{(item.icon||collapsed)&&<Icon name={item.icon} resolver={options.resolveIcon}/>}<span className="xui-menu-label">{renderLabel?.(item)??(options.labelOverflow==='marquee'?<NavigationMenuLabel>{item.label}</NavigationMenuLabel>:item.label)}</span></>;
    return <li key={item.id} className="xui-menu-entry" data-menu-entry={item.id}><div className="xui-menu-row">
      {item.group?<h2 className="xui-menu-group-title">{content}</h2>:item.href?<NavItem render={renderLink?.(item)} href={item.href} target={item.target} rel={item.rel} download={item.download} selected={active===item.id} disabled={node.disabled} collapsed={collapsed} title={item.label} data-menu-id={item.id} data-menu-control="primary" onClick={event=>navigateNavigationItem(item,event,{...options,items,location:options.location??window.location.href,baseURL:options.baseURL??window.location.href})}>{content}</NavItem>:
        <BranchButton render={renderButton?.(item)} type="button" className="xui-nav-item" disabled={node.disabled||!hasChildren} aria-expanded={open} aria-controls={childId} data-menu-id={item.id} data-menu-control="primary" data-collapsed={collapsed} title={item.label} onClick={()=>setExpanded(item.id,!open)}>{content}<span aria-hidden="true" className="xui-menu-chevron">⌄</span></BranchButton>}
      {!!item.href&&hasChildren&&<Button className="xui-menu-branch-toggle" variant="ghost" disabled={node.disabled} aria-label={(open?options.collapseBranchLabel:options.expandBranchLabel)?.(item)??`${open?'Collapse':'Expand'} ${item.label}`} aria-expanded={open} aria-controls={childId} data-menu-id={item.id} data-menu-control="toggle" onClick={()=>setExpanded(item.id,!open)}><span aria-hidden="true" className="xui-menu-chevron">⌄</span></Button>}
      {action&&<RowAction item={item} disabled={node.disabled} render={action}/>}
    </div><ul className="xui-menu-children" id={childId} hidden={!open}>{renderItems(item.children??[])}</ul></li>;
  });
  return <nav ref={root} className={cx('xui-navigation-menu xui-layer',className)} aria-label={options.label??'Navigation'} data-collapsed={collapsed} data-label-overflow={options.labelOverflow??'wrap'} data-action-alignment={options.actionAlignment??'center'}
    onKeyDown={event=>keyboard.current?.key(event.nativeEvent)} onKeyUp={()=>keyboard.current?.released()} onBlur={()=>keyboard.current?.released()} onFocus={event=>keyboard.current?.focused(event.nativeEvent)}>
    {!shell&&options.showCollapseToggle!==false&&<Button className="xui-menu-compact-toggle" variant="ghost" aria-label={collapsed?options.expandLabel??'Expand navigation':options.compactLabel??'Compact navigation'} aria-pressed={collapsed} onClick={compact}>{collapsed?'›':'‹'}</Button>}
    <ul className="xui-menu-list">{renderItems(items)}</ul>{items.length===0&&<p className="xui-menu-empty">{options.emptyLabel??'No navigation items'}</p>}
  </nav>;
}

export const NavigationMenu=Object.assign(NavigationMenuRoot,{Label:NavigationMenuLabel});

interface MenuLayoutSlots extends NavigationMenuSlots {
  /** Workspace content spacing; defaults to standard and is retained in other scroll modes. */
  contentInset?:ShellContentInset;
  /** Desktop control: top (default) in the global brand row, or bottom after the sidebar menu/footer. */
  sidebarTogglePlacement?:SidebarTogglePlacement;
  /** Stable shell-owned navigation button for explicit confirmation finalFocus. */
  navigationTriggerRef?:React.Ref<HTMLButtonElement>;
  theme?:ThemeController;themeLabels?:Partial<ThemeModeLabels>;locale?:HeaderLocaleOptions;restoreSidebarFocus?:boolean;style?:React.CSSProperties;scrollMode?:ShellScrollMode;children:React.ReactNode;title?:string;header?:React.ReactNode;headerSlots?:AppHeaderSlots;sidebarHeader?:React.ReactNode;sidebarFooter?:React.ReactNode;pageHeader?:React.ReactNode;pageToolbar?:React.ReactNode;pageFooter?:React.ReactNode;
  skipLabel?:string;closeLabel?:string;
}
export type MenuLayoutProps=MenuLayoutSlots&ControllerProps<NavigationPresentationController,NavigationPresentationOptions>;
/** Owns the default menu and shell; no route key is applied to either. */
export function MenuLayout(allProps:MenuLayoutProps){const {controller:injected,theme,themeLabels,locale,restoreSidebarFocus=true,navigationTriggerRef,style,scrollMode,contentInset,sidebarTogglePlacement,children,title,header,headerSlots,sidebarHeader,sidebarFooter,pageHeader,pageToolbar,pageFooter,sidebarOpen,defaultSidebarOpen=false,onSidebarOpenChange,skipLabel,closeLabel,collapsed:controlledCollapsed,defaultCollapsed=false,onCollapsedChange,className,...menu}=allProps;assertControllerProps(injected,allProps,['collapsed','defaultCollapsed','onCollapsedChange','sidebarOpen','defaultSidebarOpen','onSidebarOpenChange','expandedIds','defaultExpandedIds','onExpandedChange']);
  const latestOptions=React.useRef({onCollapsedChange,onSidebarOpenChange,onExpandedChange:menu.onExpandedChange});latestOptions.current={onCollapsedChange,onSidebarOpenChange,onExpandedChange:menu.onExpandedChange};
  const nodes=React.useMemo(()=>indexNavigation(menu.items),[menu.items]),active=getNavigationActiveId(nodes,menu),signature=JSON.stringify([active,nodes.get(active??'')?.ancestors]);
  const controller=useOwnedController(injected,()=>createNavigationPresentationController({collapsed:controlledCollapsed,defaultCollapsed,sidebarOpen,defaultSidebarOpen,expandedIds:menu.expandedIds,defaultExpandedIds:[...(menu.defaultExpandedIds??[]),...(nodes.get(active??'')?.ancestors??[])],onCollapsedChange:next=>latestOptions.current.onCollapsedChange?.(next),onSidebarOpenChange:next=>latestOptions.current.onSidebarOpenChange?.(next),onExpandedChange:next=>latestOptions.current.onExpandedChange?.(next)}));
  const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),collapsed=state.collapsed;
  React.useLayoutEffect(()=>{if(!injected)controller.update({collapsed:controlledCollapsed,sidebarOpen,expandedIds:menu.expandedIds});},[controller,injected,controlledCollapsed,sidebarOpen,menu.expandedIds]);
  React.useLayoutEffect(()=>controller.revealAncestors(nodes.get(active??'')?.ancestors??[]),[controller,signature]);
  const requestOpen=controller.setSidebarOpen;
  const navigation=menu.navigation?{canNavigate:menu.navigation.canNavigate,navigate:(request:Parameters<NonNullable<NavigationMenuOptions['navigation']>['navigate']>[0])=>{requestOpen(false);menu.navigation!.navigate(request);}}:undefined;
  return <AppShell theme={theme} themeLabels={themeLabels} locale={locale} controller={controller} compactLabel={menu.compactLabel} expandLabel={menu.expandLabel} restoreSidebarFocus={restoreSidebarFocus} navigationTriggerRef={navigationTriggerRef} style={style} scrollMode={scrollMode} contentInset={contentInset} sidebarTogglePlacement={sidebarTogglePlacement} className={cx('xui xui-menu-layout',className)} data-collapsed={collapsed} navigationLabel={menu.label} skipLabel={skipLabel} closeLabel={closeLabel} header={header} headerSlots={{...headerSlots,brand:headerSlots?.brand===undefined?(title?<strong title={title}>{title}</strong>:undefined):headerSlots.brand}}
    sidebarHeader={sidebarHeader} sidebarFooter={sidebarFooter} pageHeader={pageHeader} pageToolbar={pageToolbar} pageFooter={pageFooter} sidebar={<NavigationMenu {...menu} controller={controller} navigation={navigation} collapsed={undefined} defaultCollapsed={undefined} onCollapsedChange={undefined} expandedIds={undefined} defaultExpandedIds={undefined} onExpandedChange={undefined}/>}>{children}</AppShell>;
}
