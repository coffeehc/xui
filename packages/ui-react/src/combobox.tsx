import * as React from 'react';
import { Combobox as Base } from '@base-ui/react/combobox';
import {branded} from './shared.js';

// Base UI owns the active item and its restoration. This context only projects
// the keyboard phase, so pointer activity and blur never discard navigation state.
const KeyboardPhase = React.createContext<{active:boolean;setActive:React.Dispatch<React.SetStateAction<boolean>>}|null>(null);
const navigationKeys = new Set(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End']);

export const Combobox = {
 ...Base,
 Root: function Root<Value,Multiple extends boolean|undefined=false>({onItemHighlighted,onOpenChange,...props}:React.ComponentProps<typeof Base.Root<Value,Multiple>>){
  const [active,setActive]=React.useState(false),phase=React.useMemo(()=>({active,setActive}),[active]);
  React.useEffect(()=>{if(!props.inline&&props.open===false||props.disabled)setActive(false);},[props.inline,props.open,props.disabled]);
  return <KeyboardPhase.Provider value={phase}><Base.Root {...props} onItemHighlighted={(value,details)=>{if(details.reason!=='none')setActive(details.reason==='keyboard');onItemHighlighted?.(value,details);}} onOpenChange={(open,details)=>{onOpenChange?.(open,details);if(!open&&!props.inline&&props.open===undefined&&!details.isCanceled)setActive(false);}}/></KeyboardPhase.Provider>;
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
