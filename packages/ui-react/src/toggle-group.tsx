import * as React from 'react';
import {ToggleGroup as BaseGroup} from '@base-ui/react/toggle-group';
import {Toggle as BaseToggle} from '@base-ui/react/toggle';
import {branded} from './shared.js';
export type ToggleGroupProps<Value extends string=string>=BaseGroup.Props<Value>&React.RefAttributes<HTMLDivElement>&{allowEmpty?:boolean};
function Root<Value extends string>({allowEmpty=true,className,onValueChange,value,defaultValue,...props}:ToggleGroupProps<Value>){
 const [internal,setInternal]=React.useState<readonly Value[]>(defaultValue??[]);
 return <BaseGroup {...props} className={branded('xui-toggle-group',className)} value={value??internal} onValueChange={(next,details)=>{if(!allowEmpty&&!next.length){details.cancel();return;}onValueChange?.(next,details);if(!details.isCanceled&&value===undefined)setInternal(next);}}/>;
}
function Item<Value extends string>({className,...props}:BaseToggle.Props<Value>&React.RefAttributes<HTMLButtonElement>){return <BaseToggle {...props} className={branded('xui-button xui-toggle-item',className)}/>;}
export const ToggleGroup={Root,Item};
