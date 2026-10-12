import * as React from 'react';
import {ContextMenu as Base} from '@base-ui/react/context-menu';
import {Menu} from './menu.js';
import {branded} from './shared.js';
/** Context trigger/virtual anchor belong to the peer; menu parts reuse the same public skin. */
export const ContextMenu={...Base,Item:Menu.Item,LinkItem:Menu.LinkItem,CheckboxItem:Menu.CheckboxItem,RadioItem:Menu.RadioItem,GroupLabel:Menu.GroupLabel,SubmenuTrigger:Menu.SubmenuTrigger,
  Trigger:function Trigger({className,...props}:React.ComponentProps<typeof Base.Trigger>){return <Base.Trigger {...props} className={branded('xui-context-trigger',className)}/>;},
  Content:function Content({className,positionerProps,...props}:React.ComponentProps<typeof Base.Popup>&{positionerProps?:React.ComponentProps<typeof Base.Positioner>}){return <Base.Portal><Base.Positioner side="right" align="start" {...positionerProps} className={branded('xui-positioner',positionerProps?.className)}><Base.Popup {...props} className={branded('xui-layer xui-floating xui-menu-popup',className)}/></Base.Positioner></Base.Portal>;},
};
