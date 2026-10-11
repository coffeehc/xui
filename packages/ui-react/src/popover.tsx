import * as React from 'react';
import { Popover as Base } from '@base-ui/react/popover';
import {branded} from './shared.js';
export const Popover = {
 ...Base,
 Title: function Title({className,...props}:React.ComponentProps<typeof Base.Title>){return <Base.Title {...props} className={branded('xui-dialog-title',className)}/>;},
 Description: function Description({className,...props}:React.ComponentProps<typeof Base.Description>){return <Base.Description {...props} className={branded('xui-dialog-description',className)}/>;},
 Content: function Content({className,positionerProps,...props}:React.ComponentProps<typeof Base.Popup> & {positionerProps?:React.ComponentProps<typeof Base.Positioner>}){return <Base.Portal><Base.Positioner side="bottom" align="center" {...positionerProps} className={branded('xui-positioner',positionerProps?.className)}><Base.Popup {...props} className={branded('xui-layer xui-floating xui-popover-popup',className)}/></Base.Positioner></Base.Portal>;},
};
