import {useOverlay,type WithController,type OverlayController} from './interaction-hooks.js';
import {useDialogLayoutRef} from './dialog-layout.js';
import * as React from 'react';
import {AlertDialog as Base} from '@base-ui/react/alert-dialog';
import {Dialog} from './dialog.js';
import {branded} from './shared.js';
/** Requires a response; the host decides the action. Closing never executes the destructive operation. */
export const AlertDialog={...Base,Root,Title:Dialog.Title,Description:Dialog.Description,Body:Dialog.Body,Footer:Dialog.Footer,
  Content:function Content({className,ref,...props}:React.ComponentProps<typeof Base.Popup>){const layoutRef=useDialogLayoutRef(ref);return <Base.Portal><Base.Backdrop className="xui-backdrop"/><Base.Popup {...props} ref={layoutRef} className={branded('xui-layer xui-dialog xui-alert-dialog',className)}/></Base.Portal>;},
};

export type AlertDialogRootProps<Payload=unknown>=WithController<React.ComponentProps<typeof Base.Root<Payload>>,'open'|'defaultOpen'|'onOpenChange',OverlayController>;
function Root<Payload>(props:AlertDialogRootProps<Payload>){
 const {controller,open,defaultOpen,onOpenChange,...rest}=props;
 const state=useOverlay({controller,open,defaultOpen,onOpenChange});
 return <Base.Root<Payload> {...rest} open={state.open} onOpenChange={state.onOpenChange}/>;
}
