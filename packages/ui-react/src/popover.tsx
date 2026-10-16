import {useOverlay,type WithController,type OverlayController} from './interaction-hooks.js';
import * as React from 'react';
import { Popover as Base } from '@base-ui/react/popover';
import {branded} from './shared.js';
/** Styled popup composition; open state, focus and positioning retain the public peer owners. */
export type PopoverContentProps = React.ComponentProps<typeof Base.Popup> & {
 /** Options for the single internal positioner; defaults to bottom/center. */
 positionerProps?:React.ComponentProps<typeof Base.Positioner>;
 /** Options for the single internal Portal. An explicit container defaults keepMounted to true; omitted uses the original portal target/unmount behavior. Content owns the children. */
 portalProps?:Omit<React.ComponentProps<typeof Base.Portal>,'children'>;
};
export const Popover = {
 ...Base,Root,
 Title: function Title({className,...props}:React.ComponentProps<typeof Base.Title>){return <Base.Title {...props} className={branded('xui-dialog-title',className)}/>;},
 Description: function Description({className,...props}:React.ComponentProps<typeof Base.Description>){return <Base.Description {...props} className={branded('xui-dialog-description',className)}/>;},
 Content: function Content({className,positionerProps,portalProps,...props}:PopoverContentProps){
  // Removing a focused nested portal races the modal peer's restore-focus frame.
  // Let the peer hide a stable subtree instead; no additional focus/state owner.
  const {keepMounted=portalProps?.container!=null,...portalOptions}=portalProps??{};
  return <Base.Portal {...portalOptions} keepMounted={keepMounted}><Base.Positioner side="bottom" align="center" {...positionerProps} className={branded('xui-positioner',positionerProps?.className)}><Base.Popup {...props} className={branded('xui-layer xui-floating xui-popover-popup',className)}/></Base.Positioner></Base.Portal>;
 },
};

export type PopoverRootProps<Payload=unknown>=WithController<React.ComponentProps<typeof Base.Root<Payload>>,'open'|'defaultOpen'|'onOpenChange',OverlayController>;
function Root<Payload>(props:PopoverRootProps<Payload>){
 const {controller,open,defaultOpen,onOpenChange,...rest}=props;
 const state=useOverlay({controller,open,defaultOpen,onOpenChange});
 return <Base.Root<Payload> {...rest} open={state.open} onOpenChange={state.onOpenChange}/>;
}
