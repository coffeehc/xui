import * as React from 'react';
import {Accordion as Base} from '@base-ui/react/accordion';
import {branded} from './shared.js';
export const Accordion={...Base,
 Item:function Item({className,...props}:React.ComponentProps<typeof Base.Item>){return <Base.Item {...props} className={branded('xui-accordion-item',className)}/>;},
 Header:function Header({className,...props}:React.ComponentProps<typeof Base.Header>){return <Base.Header {...props} className={branded('xui-accordion-header',className)}/>;},
 Trigger:function Trigger({className,...props}:React.ComponentProps<typeof Base.Trigger>){return <Base.Trigger {...props} className={branded('xui-button xui-accordion-trigger',className)}/>;},
 Panel:function Panel({className,...props}:React.ComponentProps<typeof Base.Panel>){return <Base.Panel {...props} className={branded('xui-accordion-panel',className)}/>;},
};
