import * as React from 'react';
import {useSelection,type WithController,type SelectionController} from './interaction-hooks.js';
import {Select as Base} from '@base-ui/react/select';
import {assertControllerProps} from './controller.js';
import {SelectTrigger,SelectItem,SelectList,SelectGroupLabel,SelectContent} from './select-parts.js';
export const Select={...Base,Root,Trigger:SelectTrigger,Item:SelectItem,List:SelectList,GroupLabel:SelectGroupLabel,Content:SelectContent};

type Selected<V,M extends boolean|undefined>=(M extends true?V[]:V)|(M extends true?never:null);
export type SelectRootProps<V,M extends boolean|undefined=false>=WithController<React.ComponentProps<typeof Base.Root<V,M>>,'value'|'defaultValue'|'onValueChange'|'open'|'defaultOpen'|'onOpenChange',SelectionController<Selected<V,M>>>;
function Root<V,M extends boolean|undefined=false>({controller,value,defaultValue,onValueChange,open,defaultOpen,onOpenChange,...props}:SelectRootProps<V,M>){
 assertControllerProps(controller,{defaultValue},['defaultValue']);
 const state=useSelection<Selected<V,M>,Base.Root.ChangeEventDetails>({controller,value:value as Selected<V,M>|undefined,defaultValue:(defaultValue??(props.multiple?[]:null)) as Selected<V,M>,onValueChange,onOpenChange,open,defaultOpen});
 return <Base.Root<V,M> {...props} value={state.state.value} open={state.state.open} onValueChange={state.onValueChange} onOpenChange={state.onOpenChange}/>;
}
