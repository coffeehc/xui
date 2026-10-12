import * as React from 'react';
import {Dialog as Base} from '@base-ui/react/dialog';
import {Dialog} from './dialog.js';
import {branded} from './shared.js';
export type SheetSide='start'|'end'|'top'|'bottom';
export interface SheetContentProps extends React.ComponentProps<typeof Base.Popup>{side?:SheetSide}
/** Modal sheet composition; lifecycle/cancellation/focus remain the public Dialog peer contract. */
export const Sheet={...Base,Title:Dialog.Title,Description:Dialog.Description,Body:Dialog.Body,Footer:Dialog.Footer,
  Content:function Content({side='end',className,...props}:SheetContentProps){return <Base.Portal><Base.Backdrop className="xui-backdrop"/><Base.Popup {...props} data-side={side} className={branded('xui-layer xui-dialog xui-sheet',className)}/></Base.Portal>;},
};
