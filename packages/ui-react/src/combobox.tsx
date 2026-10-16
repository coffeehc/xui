import {useSelection,type WithController,type SelectionController} from './interaction-hooks.js';
import * as React from 'react';
import { Combobox as Base } from '@base-ui/react/combobox';
import {branded} from './shared.js';
import {assertControllerProps} from './controller.js';

import {KeyboardPhase,ControlledComboboxRoot} from './combobox-context.js';
const navigationKeys = new Set(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End']);

export const Combobox = {
 ...Base,
 Root: function Root<Value,Multiple extends boolean|undefined=false>({controller,onItemHighlighted,onOpenChange,onValueChange,onInputValueChange,value,defaultValue,open,defaultOpen,inputValue,defaultInputValue,...props}:ComboboxRootProps<Value,Multiple>){
  assertControllerProps(controller,{defaultValue},['defaultValue']);
  const model=useSelection<Selected<Value,Multiple>,Base.Root.ChangeEventDetails>({controller,value:value as Selected<Value,Multiple>|undefined,defaultValue:(defaultValue??(props.multiple?[]:null)) as Selected<Value,Multiple>,open,defaultOpen,inputValue:inputValue===undefined?undefined:String(inputValue),defaultInputValue:defaultInputValue===undefined?undefined:String(defaultInputValue),onOpenChange,onValueChange,onInputValueChange});
  const active=model.state.keyboardActive,setActive=React.useCallback((value:React.SetStateAction<boolean>)=>model.controller.setKeyboardActive(typeof value==='function'?value(model.controller.getState().keyboardActive):value),[model.controller]),phase=React.useMemo(()=>({active,setActive}),[active,setActive]);
  React.useLayoutEffect(()=>{if(!props.inline&&!model.state.open||props.disabled)model.controller.setKeyboardActive(false);},[props.inline,model.state.open,props.disabled,model.controller]);
  return <ControlledComboboxRoot<Value,Multiple> phase={phase} {...props} value={model.state.value} inputValue={model.state.inputValue} open={model.state.open} onValueChange={model.onValueChange} onInputValueChange={model.onInputValueChange} onItemHighlighted={(value,details)=>{model.controller.recordHighlight(value??null,details.reason==='keyboard');onItemHighlighted?.(value,details);}} onOpenChange={model.onOpenChange}/>;
 },
 Input: function Input({className,onKeyDownCapture,onPointerMoveCapture,onPointerDownCapture,onBlurCapture,...props}:React.ComponentProps<typeof Base.Input>){
  const phase=React.useContext(KeyboardPhase);
  return <Base.Input {...props} className={branded('xui-input',className)} onKeyDownCapture={event=>{onKeyDownCapture?.(event);if(!event.defaultPrevented&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&!event.metaKey&&!event.nativeEvent.isComposing&&(event.key==='ArrowDown'||event.key==='ArrowUp'))phase?.setActive(true);}} onPointerMoveCapture={event=>{phase?.setActive(false);onPointerMoveCapture?.(event);}} onPointerDownCapture={event=>{phase?.setActive(false);onPointerDownCapture?.(event);}} onBlurCapture={event=>{phase?.setActive(false);onBlurCapture?.(event);}}/>;
 },
 Item: function Item({className,...props}:React.ComponentProps<typeof Base.Item>){const phase=React.useContext(KeyboardPhase);return <Base.Item {...props} data-keyboard-active={phase?.active?'':undefined} className={branded('xui-menu-item xui-combobox-item',className)}/>;},
 List: function List({className,onKeyDownCapture,onPointerMoveCapture,onPointerDownCapture,onBlurCapture,...props}:React.ComponentProps<typeof Base.List>){
  const phase=React.useContext(KeyboardPhase);
  return <Base.List {...props} className={branded('xui-option-list',className)} onKeyDownCapture={event=>{onKeyDownCapture?.(event);if(!event.defaultPrevented&&navigationKeys.has(event.key))phase?.setActive(true);}} onPointerMoveCapture={event=>{phase?.setActive(false);onPointerMoveCapture?.(event);}} onPointerDownCapture={event=>{phase?.setActive(false);onPointerDownCapture?.(event);}} onBlurCapture={event=>{phase?.setActive(false);onBlurCapture?.(event);}}/>;
 },
 Empty: function Empty({className,...props}:React.ComponentProps<typeof Base.Empty>){return <Base.Empty {...props} className={branded('xui-state',className)}/>;},
 InputGroup: function InputGroup({className,...props}:React.ComponentProps<typeof Base.InputGroup>){return <Base.InputGroup {...props} className={branded('xui-toolbar',className)}/>;},
 Content: function Content({className,positionerProps,...props}:React.ComponentProps<typeof Base.Popup> & {positionerProps?:React.ComponentProps<typeof Base.Positioner>}){return <Base.Portal><Base.Positioner side="bottom" align="start" {...positionerProps} className={branded('xui-positioner',positionerProps?.className)}><Base.Popup {...props} className={branded('xui-layer xui-floating xui-combobox-popup',className)}/></Base.Positioner></Base.Portal>;},
};

type Selected<V,M extends boolean|undefined>=(M extends true?V[]:V)|(M extends true?never:null);
export type ComboboxRootProps<V,M extends boolean|undefined=false>=WithController<React.ComponentProps<typeof Base.Root<V,M>>,'value'|'defaultValue'|'onValueChange'|'open'|'defaultOpen'|'onOpenChange'|'inputValue'|'defaultInputValue'|'onInputValueChange',SelectionController<Selected<V,M>>>;
