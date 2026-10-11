import * as React from 'react';
import { Combobox as Base } from '@base-ui/react/combobox';
import {branded} from './shared.js';
export const Combobox = {
 ...Base,
 Input: function Input({className,...props}:React.ComponentProps<typeof Base.Input>){return <Base.Input {...props} className={branded('xui-input',className)}/>;},
 Item: function Item({className,...props}:React.ComponentProps<typeof Base.Item>){return <Base.Item {...props} className={branded('xui-menu-item',className)}/>;},
 List: function List({className,...props}:React.ComponentProps<typeof Base.List>){return <Base.List {...props} className={branded('xui-option-list',className)}/>;},
 Empty: function Empty({className,...props}:React.ComponentProps<typeof Base.Empty>){return <Base.Empty {...props} className={branded('xui-state',className)}/>;},
 InputGroup: function InputGroup({className,...props}:React.ComponentProps<typeof Base.InputGroup>){return <Base.InputGroup {...props} className={branded('xui-toolbar',className)}/>;},
 Content: function Content({className,positionerProps,...props}:React.ComponentProps<typeof Base.Popup> & {positionerProps?:React.ComponentProps<typeof Base.Positioner>}){return <Base.Portal><Base.Positioner side="bottom" align="start" {...positionerProps} className={branded('xui-positioner',positionerProps?.className)}><Base.Popup {...props} className={branded('xui-layer xui-floating xui-combobox-popup',className)}/></Base.Positioner></Base.Portal>;},
};
