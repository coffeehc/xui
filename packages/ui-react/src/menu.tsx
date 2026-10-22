import {useOwnedController} from './controller.js';
import {Button} from './button.js';
import {assertControllerProps} from './controller.js';
import {useOverlay,useValue,type WithController,type OverlayController,type ValueController} from './interaction-hooks.js';
import * as React from 'react';
import { Menu as Base } from '@base-ui/react/menu';
import {bindMenuKeyboardFocus} from './menu-keyboard.js';
import {branded,cx} from './shared.js';
import {createMenuController,type MenuController,type MenuConfig,type MenuControllerOptions,type MenuNode,type MenuItemTone} from '@coffeehc/xui-runtime/menu';
import {resolveNavigationIcon,type NavigationIconResolver} from '@coffeehc/xui-runtime/navigation';
export type {MenuController,MenuConfig,MenuControllerOptions,MenuControllerState,MenuNode,MenuEntry,MenuActionItem,MenuGroup,MenuHeading,MenuSeparator,MenuActionEvent,MenuItemTone} from '@coffeehc/xui-runtime/menu';
/** Optional visual emphasis only; permissions, confirmation and execution remain with the host. */
export type MenuSeparatorProps=React.ComponentProps<typeof Base.Separator>;
/** Peer item props with the same render/ref/events and an optional public tone. */
export type MenuItemProps=React.ComponentProps<typeof Base.Item>&{
 /** Defaults to default; danger affects CSS only and never adds authorization or confirmation. */
 tone?:MenuItemTone;
};
function Popup({className,ref,...props}:React.ComponentProps<typeof Base.Popup>){
 const popup=React.useRef<HTMLDivElement>(null);
 React.useImperativeHandle(ref,()=>popup.current!);
 React.useLayoutEffect(()=>popup.current?bindMenuKeyboardFocus(popup.current):undefined,[]);
 return <Base.Popup {...props} ref={popup} className={branded('xui-layer xui-floating xui-menu-popup',className)}/>;
}
export const Menu = {
 ...Base,Root,RadioGroup,
 /** Uncomposed inline triggers use the shared text action; explicit render keeps its presentation. */
 Trigger:function Trigger({render,...props}:React.ComponentProps<typeof Base.Trigger>){return <Base.Trigger {...props} render={render??<Button variant="text"/>}/>;},
 Popup,
 /** Serializable menu composition with an owned default or fully replaced public controller. */
 View:MenuView,
 /** Standalone, noninteractive title. GroupLabel names an enclosing Group instead. */
 Heading:function Heading({className,...props}:React.ComponentProps<'div'>){return <div role="presentation" {...props} className={cx('xui-help',className)}/>;},
 Separator:function Separator({className,...props}:MenuSeparatorProps){return <Base.Separator {...props} className={branded('xui-menu-separator',className)}/>;},
 /** Decorative icon slot. Its direct SVG child follows the shared control icon size. */
 Icon: function Icon({className,...props}:React.ComponentProps<'span'>){return <span aria-hidden="true" {...props} className={cx('xui-icon-container xui-menu-icon',className)}/>;},
 SubmenuTrigger:function SubmenuTrigger({className,...props}:React.ComponentProps<typeof Base.SubmenuTrigger>){return <Base.SubmenuTrigger {...props} className={branded('xui-menu-item',className)}/>;},
 Item: function Item({className,tone='default',...props}:MenuItemProps){return <Base.Item {...props} data-tone={tone} className={branded('xui-menu-item',className)}/>;},
 LinkItem: function LinkItem({className,...props}:React.ComponentProps<typeof Base.LinkItem>){return <Base.LinkItem {...props} className={branded('xui-menu-item',className)}/>;},
 CheckboxItem: function CheckboxItem(allProps:MenuCheckboxItemProps){const {className,controller,checked,defaultChecked,onCheckedChange,...props}=allProps;assertControllerProps(controller,allProps,['checked','defaultChecked','onCheckedChange']);const state=useValue({controller,value:checked,defaultValue:defaultChecked??false,onValueChange:onCheckedChange});return <Base.CheckboxItem {...props} checked={state.value} onCheckedChange={state.onValueChange} className={branded('xui-menu-item',className)}/>;},
 RadioItem: function RadioItem({className,...props}:React.ComponentProps<typeof Base.RadioItem>){return <Base.RadioItem {...props} className={branded('xui-menu-item',className)}/>;},
 GroupLabel: function GroupLabel({className,...props}:React.ComponentProps<typeof Base.GroupLabel>){return <Base.GroupLabel {...props} className={branded('xui-help',className)}/>;},
 Content: function Content({positionerProps,...props}:React.ComponentProps<typeof Base.Popup> & {positionerProps?:React.ComponentProps<typeof Base.Positioner>}){return <Base.Portal><Base.Positioner side="bottom" align="start" {...positionerProps} className={branded('xui-positioner',positionerProps?.className)}><Popup {...props}/></Base.Positioner></Base.Portal>;},
};

interface MenuViewParts {
 trigger:React.ReactElement;
 resolveIcon?:NavigationIconResolver;
 contentProps?:Omit<React.ComponentProps<typeof Base.Popup>,'children'|'ref'>&{positionerProps?:React.ComponentProps<typeof Base.Positioner>};
}
/** Injection replaces the entire model. Config/action props belong only to an owned default. */
export type MenuViewProps=MenuViewParts&({controller:MenuController;config?:never;onAction?:never;defaultOpen?:never}|{controller?:undefined;config:MenuConfig;onAction?:MenuControllerOptions['onAction'];defaultOpen?:boolean});
function MenuView(props:MenuViewProps){
 assertControllerProps(props.controller,props,['config','onAction','defaultOpen']);
 const action=React.useRef(props.onAction);action.current=props.onAction;
 const controller=useOwnedController(props.controller,()=>createMenuController({config:props.config!,defaultOpen:props.defaultOpen,onAction:event=>action.current?.(event)}));
 React.useLayoutEffect(()=>{if(!props.controller)controller.setConfig(props.config!);},[controller,props.controller,props.config]);
 return <ConnectedMenu trigger={props.trigger} resolveIcon={props.resolveIcon} contentProps={props.contentProps} controller={controller}/>;
}
function ConnectedMenu({controller,trigger,resolveIcon,contentProps}:MenuViewParts&{controller:MenuController}){
 const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState);
 const refs=React.useRef(new Map<string,HTMLElement>()),popup=React.useRef<HTMLDivElement|null>(null),triggerRef=React.useRef<HTMLButtonElement|null>(null),consumed=React.useRef(0);
 React.useLayoutEffect(()=>{consumed.current=0;},[controller]);
 const applyFocus=()=>{const current=controller.getState(),request=current.focusRequest,node=request?refs.current.get(request.itemId):undefined;if(current.open&&request&&request.sequence!==consumed.current&&node?.isConnected&&!node.matches('[data-disabled],[aria-disabled="true"]')){consumed.current=request.sequence;node.focus();}};
 React.useLayoutEffect(applyFocus,[controller,state.open,state.focusRequest,state.config]);
 const finalFocus=()=>{const doc=triggerRef.current?.ownerDocument,active=doc?.activeElement;return !active||active===doc?.body||!!popup.current?.contains(active)||!!triggerRef.current?.contains(active);};
 const renderNodes=(nodes:readonly MenuNode[]):React.ReactNode=>{
  const visible=nodes.filter(node=>!node.hidden&&(node.kind!=='group'||node.items.some(item=>!item.hidden)));
  return visible.map((node,index)=>{
   if(node.kind==='separator')return index>0&&index<visible.length-1&&visible[index-1].kind!=='separator'?<Menu.Separator key={node.id}/>:null;
   if(node.kind==='heading')return <Menu.Heading key={node.id}>{node.label}</Menu.Heading>;
   if(node.kind==='group')return <Menu.Group key={node.id}>{node.label&&<Menu.GroupLabel>{node.label}</Menu.GroupLabel>}{renderNodes(node.items)}</Menu.Group>;
   const icon=node.icon?resolveNavigationIcon(node.icon,resolveIcon):undefined;
   return <Menu.Item key={node.id} ref={element=>{if(element)refs.current.set(node.id,element);else refs.current.delete(node.id);}} data-menu-action-id={node.id} disabled={node.disabled} tone={node.tone} closeOnClick={false}
    onFocus={()=>controller.recordFocus(node.id)} onClick={event=>{if(!event.defaultPrevented)controller.activate(node.id,{source:event.detail===0?'keyboard':'pointer',originalEvent:event.nativeEvent});}}>
    {icon&&<Menu.Icon><svg viewBox={icon.viewBox??'0 0 20 20'} fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)">{icon.paths.map((d,i)=><path key={i} d={d}/>)}</svg></Menu.Icon>}{node.label}
   </Menu.Item>;
  });
 };
 return <Base.Root open={state.open} disabled={state.destroyed||state.config.disabled} loopFocus={state.config.loopFocus} onOpenChange={open=>controller.setOpen(open)} onOpenChangeComplete={open=>{if(open)applyFocus();}}>
  <Menu.Trigger render={trigger} ref={triggerRef}/><Menu.Content {...contentProps} ref={node=>{if(node)popup.current=node;}} finalFocus={contentProps?.finalFocus??finalFocus}>{renderNodes(state.config.items)}</Menu.Content>
 </Base.Root>;
}

export type MenuRootProps<Payload=unknown>=WithController<React.ComponentProps<typeof Base.Root<Payload>>,'open'|'defaultOpen'|'onOpenChange',OverlayController>;
function Root<Payload>({controller,open,defaultOpen,onOpenChange,...props}:MenuRootProps<Payload>){const state=useOverlay({controller,open,defaultOpen,onOpenChange});return <Base.Root<Payload> {...props} open={state.open} onOpenChange={state.onOpenChange}/>;}
export type MenuCheckboxItemProps=WithController<React.ComponentProps<typeof Base.CheckboxItem>,'checked'|'defaultChecked'|'onCheckedChange',ValueController<boolean>>;
export type MenuRadioGroupProps=WithController<React.ComponentProps<typeof Base.RadioGroup>,'value'|'defaultValue'|'onValueChange',ValueController<any>>;
function RadioGroup(allProps:MenuRadioGroupProps){const {controller,value,defaultValue,onValueChange,...props}=allProps;assertControllerProps(controller,allProps,['value','defaultValue','onValueChange']);const state=useValue({controller,value,defaultValue:defaultValue??null,onValueChange});return <Base.RadioGroup {...props} value={state.value} onValueChange={state.onValueChange}/>;}
