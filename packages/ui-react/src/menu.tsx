import * as React from 'react';
import { Menu as Base } from '@base-ui/react/menu';
import {branded,cx} from './shared.js';
export const Menu = {
 ...Base,
 /** Decorative icon slot. Its direct SVG child follows the shared control icon size. */
 Icon: function Icon({className,...props}:React.ComponentProps<'span'>){return <span aria-hidden="true" {...props} className={cx('xui-menu-icon',className)}/>;},
 SubmenuTrigger:function SubmenuTrigger({className,...props}:React.ComponentProps<typeof Base.SubmenuTrigger>){return <Base.SubmenuTrigger {...props} className={branded('xui-menu-item',className)}/>;},
 Item: function Item({className,...props}:React.ComponentProps<typeof Base.Item>){return <Base.Item {...props} className={branded('xui-menu-item',className)}/>;},
 LinkItem: function LinkItem({className,...props}:React.ComponentProps<typeof Base.LinkItem>){return <Base.LinkItem {...props} className={branded('xui-menu-item',className)}/>;},
 CheckboxItem: function CheckboxItem({className,...props}:React.ComponentProps<typeof Base.CheckboxItem>){return <Base.CheckboxItem {...props} className={branded('xui-menu-item',className)}/>;},
 RadioItem: function RadioItem({className,...props}:React.ComponentProps<typeof Base.RadioItem>){return <Base.RadioItem {...props} className={branded('xui-menu-item',className)}/>;},
 GroupLabel: function GroupLabel({className,...props}:React.ComponentProps<typeof Base.GroupLabel>){return <Base.GroupLabel {...props} className={branded('xui-help',className)}/>;},
 Content: function Content({className,positionerProps,...props}:React.ComponentProps<typeof Base.Popup> & {positionerProps?:React.ComponentProps<typeof Base.Positioner>}){return <Base.Portal><Base.Positioner side="bottom" align="start" {...positionerProps} className={branded('xui-positioner',positionerProps?.className)}><Base.Popup {...props} className={branded('xui-layer xui-floating xui-menu-popup',className)}/></Base.Positioner></Base.Portal>;},
};
