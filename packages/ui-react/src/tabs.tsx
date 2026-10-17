import {useValue,type WithController,type ValueController} from './interaction-hooks.js';
import * as React from 'react';
import { cx, branded } from './shared.js';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { DirectionContext } from '@base-ui/react/internals/direction-context';
import {Icon as DisplayIcon,type IconProps,OverflowText,type OverflowTextProps} from './display.js';
import {assertControllerProps} from './controller.js';
export type TabsListProps=React.ComponentProps<typeof BaseTabs.List>&{
  /** Content follows its labels; equal distributes width up to the shared per-tab maximum. */
  layout?:'content'|'equal';
  /** Defaults to line; segmented explicitly selects the inset surface. State and keyboard are shared. */
  variant?:'segmented'|'line';
};
function TabsList({className,onKeyDown,loopFocus=true,layout='content',variant='line',...props}:TabsListProps) {
  const direction=React.useContext(DirectionContext)?.direction;
  return <BaseTabs.List {...props} data-layout={layout} data-variant={variant} loopFocus={loopFocus} className={branded('xui-tabs-list',className)} onKeyDown={event => {
    onKeyDown?.(event);
    // Base UI separates browser preventDefault from preventBaseUIHandler.
    if (event.baseUIHandlerPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const list=event.currentTarget;
    const tabs=Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')).filter(tab=>tab.closest('[role="tablist"]') === list);
    const current=tabs.indexOf(list.ownerDocument.activeElement as HTMLElement);
    if (current < 0) return;
    const vertical=list.getAttribute('data-orientation') === 'vertical';
    const rtl=(direction ?? list.ownerDocument.defaultView?.getComputedStyle(list).direction) === 'rtl';
    const previous=vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const next=vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    if (![previous,next,'Home','End'].includes(event.key)) return;
    // Base UI 1.7 permits focus on disabled tabs. The family contract requires
    // skipping them. Only keyboard focus navigation is adapted; activation,
    // values, panel relationships and pointer behavior stay with the peer.
    event.preventDefault(); event.preventBaseUIHandler(); event.stopPropagation();
    const enabled=(tab: HTMLElement)=>tab.getAttribute('aria-disabled') !== 'true' && !tab.hasAttribute('disabled');
    if (event.key === 'Home') { tabs.find(enabled)?.focus();return; }
    if (event.key === 'End') { tabs.slice().reverse().find(enabled)?.focus();return; }
    const step=event.key === next ? 1 : -1;
    for(let distance=1;distance<=tabs.length;distance++) {
      const target=current+distance*step;
      if (!loopFocus && (target < 0 || target >= tabs.length)) return;
      const tab=tabs[(target+tabs.length)%tabs.length];
      if (enabled(tab)) {tab.focus();return;}
    }
  }} />;
}

const SelectionRegistry=React.createContext<{register:(node:HTMLElement,value:BaseTabs.Tab.Value|undefined)=>void;remove:(node:HTMLElement)=>void;reconcile:()=>void}|null>(null);
const TabSurface=React.createContext<React.RefObject<HTMLElement|null>|undefined>(undefined);
/** Text slot for composed tab labels. Icons, badges and other metadata stay outside this slot. */
export type TabsLabelProps=Omit<OverflowTextProps,'interactionRef'>;
function TabLabel({className,...props}:TabsLabelProps){
 const surface=React.useContext(TabSurface);
 return <OverflowText {...props} interactionRef={surface} className={cx('xui-tab-label',className)}/>;
}
function Tab({className,ref,value,children,...props}:React.ComponentProps<typeof BaseTabs.Tab>){
 const registry=React.useContext(SelectionRegistry),node=React.useRef<HTMLElement|null>(null);
 React.useImperativeHandle(ref,()=>node.current as HTMLButtonElement);
 React.useLayoutEffect(()=>{const element=node.current;if(!registry||!element)return;registry.register(element,value);queueMicrotask(()=>registry.reconcile());return()=>{registry.remove(element);queueMicrotask(()=>registry.reconcile());};},[registry,value,props.disabled]);
 // Only primitive label nodes are automatic. Composed content uses the public
 // Label slot so icons/counts never become part of the moving text track.
 return <TabSurface.Provider value={node}><BaseTabs.Tab {...props} value={value} ref={element=>{node.current=element;}} className={branded('xui-tab',className)}>{React.Children.map(children,child=>typeof child==='string'||typeof child==='number'?<TabLabel text={String(child)}/>:child)}</BaseTabs.Tab></TabSurface.Provider>;
}

// Reuse peer primitives for keyboard, relationships, portal and focus lifecycle.
export const Tabs = {
  Root,
  List: TabsList,
  Tab,
  Label: TabLabel,
  /** Decorative only: the surrounding Tab's text supplies its accessible name. */
  Icon: function Icon({className,...props}:Omit<IconProps,'aria-label'|'aria-labelledby'|'aria-hidden'>&{'aria-label'?:never;'aria-labelledby'?:never;'aria-hidden'?:never}) {return <DisplayIcon {...props} aria-hidden="true" className={cx('xui-tab-icon',className)}/>;},
  Panel: function Panel({className,...props}: React.ComponentProps<typeof BaseTabs.Panel>) { return <BaseTabs.Panel {...props} className={branded('xui-tab-panel',className)} />; },
};

export type TabsRootProps=WithController<React.ComponentProps<typeof BaseTabs.Root>,'value'|'defaultValue'|'onValueChange',ValueController<BaseTabs.Tab.Value>>;
function Root({controller,value,defaultValue,onValueChange,ref,className,...props}:TabsRootProps){
 assertControllerProps(controller,{defaultValue},['defaultValue']);
 const state=useValue({controller,value,defaultValue:defaultValue===undefined?0:defaultValue,onValueChange}),root=React.useRef<HTMLDivElement>(null),nodes=React.useRef(new Map<HTMLElement,BaseTabs.Tab.Value|undefined>()),previousIndex=React.useRef(0),initial=React.useRef(true),latest=React.useRef({controller,value,defaultValue,state});latest.current={controller,value,defaultValue,state};
 const lastFallback=React.useRef<{controller:ValueController<BaseTabs.Tab.Value>;value:BaseTabs.Tab.Value;fallback:BaseTabs.Tab.Value;items:readonly {node:HTMLElement;value:BaseTabs.Tab.Value;enabled:boolean}[]}|null>(null);
 React.useImperativeHandle(ref,()=>root.current!);
 const registry=React.useMemo(()=>({register:(node:HTMLElement,value:BaseTabs.Tab.Value|undefined)=>{nodes.current.set(node,value);},remove:(node:HTMLElement)=>{nodes.current.delete(node);},reconcile:()=>{
  const current=latest.current;if(!root.current)return;if(current.value!==undefined){lastFallback.current=null;return;}
  const tabs=Array.from(root.current.querySelectorAll<HTMLElement>('[role="tab"]')).filter(node=>nodes.current.has(node)),items=tabs.map((node,index)=>({node,value:nodes.current.get(node)??index})),selected=items.findIndex(item=>Object.is(item.value,current.state.controller.getState().value));
  const enabled=(node:HTMLElement)=>!node.matches(':disabled,[aria-disabled="true"]');
  if(selected>=0&&(enabled(items[selected].node)||initial.current&&current.defaultValue!==undefined)){lastFallback.current=null;previousIndex.current=selected;initial.current=false;return;}
  const candidates=items.filter(item=>enabled(item.node)),fallback=candidates[Math.min(previousIndex.current,candidates.length-1)]?.value??null,reason=initial.current?'initial':selected>=0?'disabled':'missing';initial.current=false;
  if(Object.is(fallback,current.state.controller.getState().value))return;
  // A host may cancel and rerender while recording the request. Notify again
  // only when the selected value or the actual tab registry changes.
  const confirmed=current.state.controller.getState().value,prior=lastFallback.current;
  if(prior&&prior.controller===current.state.controller&&Object.is(prior.value,confirmed)&&Object.is(prior.fallback,fallback)&&prior.items.length===items.length&&prior.items.every((item,index)=>item.node===items[index].node&&Object.is(item.value,items[index].value)&&item.enabled===enabled(items[index].node)))return;
  lastFallback.current={controller:current.state.controller,value:confirmed,fallback,items:items.map(item=>({...item,enabled:enabled(item.node)}))};
  const details:BaseTabs.Root.ChangeEventDetails={reason,event:new Event('xui-tabs-reconcile'),cancel(){this.isCanceled=true;},allowPropagation(){this.isPropagationAllowed=true;},isCanceled:false,isPropagationAllowed:false,trigger:undefined,activationDirection:'none'};
  current.state.onValueChange(fallback,details);
 }}),[]);
 React.useLayoutEffect(()=>{registry.reconcile();});
 return <SelectionRegistry.Provider value={registry}><BaseTabs.Root {...props} className={branded('xui-tabs',className)} ref={root} value={state.value} onValueChange={state.onValueChange}/></SelectionRegistry.Provider>;
}
