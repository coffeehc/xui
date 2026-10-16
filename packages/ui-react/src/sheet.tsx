import {useOverlay,type WithController,type OverlayController} from './interaction-hooks.js';
import {useDialogLayoutRef} from './dialog-layout.js';
import * as React from 'react';
import {Dialog as Base} from '@base-ui/react/dialog';
import {Dialog} from './dialog.js';
import {branded} from './shared.js';
export type SheetSide='start'|'end'|'top'|'bottom';
export interface SheetContentProps extends React.ComponentProps<typeof Base.Popup>{side?:SheetSide}
/** Modal sheet composition; lifecycle/cancellation/focus remain the public Dialog peer contract. */
export const Sheet={...Base,Root,Header:Dialog.Header,CloseButton:Dialog.CloseButton,Title:Dialog.Title,Description:Dialog.Description,Body:Dialog.Body,Footer:Dialog.Footer,
  Content:function Content({side='end',className,ref,...props}:SheetContentProps){const layoutRef=useDialogLayoutRef(ref);return <Base.Portal><Base.Backdrop className="xui-backdrop"/><Base.Popup {...props} ref={layoutRef} data-side={side} className={branded('xui-layer xui-dialog xui-sheet',className)}/></Base.Portal>;},
};

export type SheetRootProps<Payload=unknown>=WithController<React.ComponentProps<typeof Base.Root<Payload>>,'open'|'defaultOpen'|'onOpenChange',OverlayController>;
function Root<Payload>(props:SheetRootProps<Payload>){
 const {controller,open,defaultOpen,onOpenChange,...rest}=props;
 const state=useOverlay({controller,open,defaultOpen,onOpenChange});
 return <Base.Root<Payload> {...rest} open={state.open} onOpenChange={state.onOpenChange}/>;
}
