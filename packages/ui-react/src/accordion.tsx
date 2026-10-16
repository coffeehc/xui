import {useValue,type WithController,type ValueController} from './interaction-hooks.js';
import * as React from 'react';
import {Accordion as Base} from '@base-ui/react/accordion';
import {branded} from './shared.js';
import {assertControllerProps} from './controller.js';
export const Accordion={...Base,Root,
 Item:function Item({className,...props}:React.ComponentProps<typeof Base.Item>){return <Base.Item {...props} className={branded('xui-accordion-item',className)}/>;},
 Header:function Header({className,...props}:React.ComponentProps<typeof Base.Header>){return <Base.Header {...props} className={branded('xui-accordion-header',className)}/>;},
 Trigger:function Trigger({className,...props}:React.ComponentProps<typeof Base.Trigger>){return <Base.Trigger {...props} className={branded('xui-button xui-accordion-trigger',className)}/>;},
 Panel:function Panel({className,...props}:React.ComponentProps<typeof Base.Panel>){return <Base.Panel {...props} className={branded('xui-accordion-panel',className)}/>;},
};

export type AccordionRootProps<Value=any>=WithController<React.ComponentProps<typeof Base.Root<Value>>,'value'|'defaultValue'|'onValueChange',ValueController<readonly Value[]>>;
function Root<Value=any>({controller,value,defaultValue,onValueChange,...props}:AccordionRootProps<Value>){assertControllerProps(controller,{defaultValue},['defaultValue']);const state=useValue<readonly Value[],Base.Root.ChangeEventDetails>({controller,value,defaultValue:defaultValue??[],onValueChange:onValueChange?(next,details)=>onValueChange([...next],details):undefined});return <Base.Root<Value> {...props} value={[...state.value]} onValueChange={state.onValueChange}/>;}
