import {useDialogLayoutRef} from './dialog-layout.js';
import * as React from 'react';
import {AlertDialog as Base} from '@base-ui/react/alert-dialog';
import {Dialog} from './dialog.js';
import {branded} from './shared.js';
/** Requires a response; the host decides the action. Closing never executes the destructive operation. */
export const AlertDialog={...Base,Title:Dialog.Title,Description:Dialog.Description,Body:Dialog.Body,Footer:Dialog.Footer,
  Content:function Content({className,ref,...props}:React.ComponentProps<typeof Base.Popup>){const layoutRef=useDialogLayoutRef(ref);return <Base.Portal><Base.Backdrop className="xui-backdrop"/><Base.Popup {...props} ref={layoutRef} className={branded('xui-layer xui-dialog xui-alert-dialog',className)}/></Base.Portal>;},
};
