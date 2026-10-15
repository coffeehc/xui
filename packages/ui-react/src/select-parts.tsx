import * as React from 'react';
import {Select as Base} from '@base-ui/react/select';
import {branded} from './shared.js';
export function SelectTrigger({className,...props}:React.ComponentProps<typeof Base.Trigger>){return <Base.Trigger {...props} className={branded('xui-select',className)}/>;}
export function SelectItem({className,...props}:React.ComponentProps<typeof Base.Item>){return <Base.Item {...props} className={branded('xui-menu-item',className)}/>;}
export function SelectList({className,...props}:React.ComponentProps<typeof Base.List>){return <Base.List {...props} className={branded('xui-option-list',className)}/>;}
export function SelectGroupLabel({className,...props}:React.ComponentProps<typeof Base.GroupLabel>){return <Base.GroupLabel {...props} className={branded('xui-help',className)}/>;}
export function SelectContent({className,positionerProps,...props}:React.ComponentProps<typeof Base.Popup> & {positionerProps?:React.ComponentProps<typeof Base.Positioner>}){return <Base.Portal><Base.Positioner side="bottom" align="start" alignItemWithTrigger={false} {...positionerProps} className={branded('xui-positioner',positionerProps?.className)}><Base.Popup {...props} className={branded('xui-layer xui-floating xui-select-popup',className)}/></Base.Positioner></Base.Portal>;}
