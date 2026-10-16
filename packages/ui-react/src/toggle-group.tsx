import {assertControllerProps} from './controller.js';
import {createToggleGroupController,type ToggleGroupController} from '@coffeehc/xui-runtime/interaction';
import {useOwnedController} from './controller.js';
import {useValue,type WithController,type ValueController} from './interaction-hooks.js';
import * as React from 'react';
import {ToggleGroup as BaseGroup} from '@base-ui/react/toggle-group';
import {Toggle as BaseToggle} from '@base-ui/react/toggle';
import {branded} from './shared.js';
const Group=React.createContext(false);
export type ToggleGroupProps<Value extends string=string>=WithController<BaseGroup.Props<Value>&React.RefAttributes<HTMLDivElement>&{allowEmpty?:boolean},'value'|'defaultValue'|'onValueChange'|'multiple'|'allowEmpty',ToggleGroupController<Value>>;
function Root<Value extends string>(allProps:ToggleGroupProps<Value>){const {allowEmpty,className,controller:injected,onValueChange,value,defaultValue,multiple,...props}=allProps;assertControllerProps(injected,allProps,['allowEmpty','multiple','value','defaultValue','onValueChange']);
 const callback=React.useRef(onValueChange);callback.current=onValueChange;
 const controller=useOwnedController(injected,()=>createToggleGroupController<Value>({value,defaultValue,multiple,allowEmpty,onValueChange:(next,details)=>{if(details)callback.current?.([...next],details as BaseGroup.ChangeEventDetails);}}));
 const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState);
 React.useLayoutEffect(()=>{if(!injected)controller.update({value,multiple:multiple??false,allowEmpty:allowEmpty??true});},[controller,injected,value,multiple,allowEmpty]);
 return <Group.Provider value><BaseGroup {...props} className={branded('xui-toggle-group',className)} multiple={state.multiple} value={state.value} onValueChange={(next,details)=>{controller.setValue(next,details);}}/></Group.Provider>;
}
export type ToggleItemProps<V extends string>=WithController<BaseToggle.Props<V>&React.RefAttributes<HTMLButtonElement>,'pressed'|'defaultPressed'|'onPressedChange',ValueController<boolean>>;
function StandaloneItem<Value extends string>(allProps:ToggleItemProps<Value>){const {className,controller,pressed,defaultPressed,onPressedChange,...props}=allProps;assertControllerProps(controller,allProps,['pressed','defaultPressed','onPressedChange']);const state=useValue({controller,value:pressed,defaultValue:defaultPressed??false,onValueChange:onPressedChange});return <BaseToggle {...props} pressed={state.value} onPressedChange={state.onValueChange} className={branded('xui-button xui-toggle-item',className)}/>;}
function Item<Value extends string>(props:ToggleItemProps<Value>){const grouped=React.useContext(Group);if(grouped){if(props.controller)throw new TypeError('A grouped Toggle uses its Group controller');const {className,...rest}=props;return <BaseToggle {...rest} className={branded('xui-button xui-toggle-item',className)}/>;}return <StandaloneItem {...props}/>;}
export const ToggleGroup={Root,Item};

export {createToggleGroupController} from '@coffeehc/xui-runtime/interaction';
export type {ToggleGroupController,ToggleGroupOptions,ToggleGroupState} from '@coffeehc/xui-runtime/interaction';
