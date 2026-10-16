import {useOverlay,type WithController,type OverlayController} from './interaction-hooks.js';
import * as React from 'react';
import {ContextMenu as Base} from '@base-ui/react/context-menu';
import {Menu} from './menu.js';
import {branded} from './shared.js';
export type {MenuItemTone,MenuItemProps,MenuSeparatorProps} from './menu.js';
/** Context state/virtual anchor belong to the peer; keyboard activation uses its contextmenu path. */
export const ContextMenu={...Base,Root,Popup:Menu.Popup,Icon:Menu.Icon,Separator:Menu.Separator,Item:Menu.Item,LinkItem:Menu.LinkItem,CheckboxItem:Menu.CheckboxItem,RadioGroup:Menu.RadioGroup,RadioItem:Menu.RadioItem,GroupLabel:Menu.GroupLabel,SubmenuTrigger:Menu.SubmenuTrigger,
  Trigger:function Trigger({className,onKeyDown,onContextMenu,...props}:React.ComponentProps<typeof Base.Trigger>){return <Base.Trigger {...props} className={branded('xui-context-trigger',className)} onContextMenu={event=>{onContextMenu?.(event);if(event.defaultPrevented)event.preventBaseUIHandler();}} onKeyDown={event=>{
    onKeyDown?.(event);
    if(event.defaultPrevented||event.baseUIHandlerPrevented||event.repeat||event.nativeEvent.isComposing||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key!=='ContextMenu'&&!(event.key==='F10'&&event.shiftKey))return;
    const trigger=event.currentTarget,win=trigger.ownerDocument.defaultView,target=event.target;
    if(!win||!(target instanceof win.Element)||!trigger.contains(target)||target.closest('.xui-context-trigger')!==trigger||trigger.matches(':disabled,[aria-disabled="true"]'))return;
    // Some platforms omit Shift+F10's contextmenu event. Forward both standard
    // keys through the peer's existing path and suppress a native duplicate.
    event.preventDefault();event.stopPropagation();
    const box=trigger.getBoundingClientRect();
    target.dispatchEvent(new win.MouseEvent('contextmenu',{bubbles:true,cancelable:true,composed:true,view:win,button:2,clientX:box.left,clientY:box.bottom,shiftKey:event.shiftKey}));
  }}/>;},
  Content:function Content({positionerProps,...props}:React.ComponentProps<typeof Base.Popup>&{positionerProps?:React.ComponentProps<typeof Base.Positioner>}){return <Base.Portal><Base.Positioner side="right" align="start" {...positionerProps} className={branded('xui-positioner',positionerProps?.className)}><Menu.Popup {...props}/></Base.Positioner></Base.Portal>;},
};

export type ContextMenuRootProps=WithController<React.ComponentProps<typeof Base.Root>,'open'|'defaultOpen'|'onOpenChange',OverlayController>;
function Root(props:ContextMenuRootProps){
 const {controller,open,defaultOpen,onOpenChange,...rest}=props;
 const state=useOverlay({controller,open,defaultOpen,onOpenChange});
 return <Base.Root {...rest} open={state.open} onOpenChange={state.onOpenChange}/>;
}
