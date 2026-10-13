import * as React from 'react';
import {choiceGroupState,selectAllChoices,toggleChoice,type ChoiceGroupOption} from '@coffeehc/xui-runtime/choice-group';
import {Checkbox,Radio,Fieldset,type FieldsetProps} from './forms.js';
export type {ChoiceGroupOption};
type Common=Omit<FieldsetProps,'children'|'onChange'> & {options:readonly ChoiceGroupOption[];name?:string;readOnly?:boolean;required?:boolean};
export type CheckboxGroupProps=Common & {value:readonly string[];onValueChange:(value:string[])=>void;selectAll?:string};
export type RadioGroupProps=Common & {value:string|null;onValueChange:(value:string)=>void};
function useGroupFocus(root:React.RefObject<HTMLFieldSetElement|null>){const focused=React.useRef<HTMLInputElement|null>(null);React.useLayoutEffect(()=>{if(focused.current&&!focused.current.isConnected){const doc=root.current?.ownerDocument;if(doc?.activeElement===doc?.body)root.current?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus();focused.current=null;}});return (event:React.FocusEvent<HTMLFieldSetElement>)=>{if(event.target.tagName==='INPUT')focused.current=event.target as unknown as HTMLInputElement;};}
function useControlledReset(root:React.RefObject<HTMLFieldSetElement|null>,value:readonly string[],options:readonly ChoiceGroupOption[]){
 const current=React.useRef({value,options});current.current={value,options};
 React.useEffect(()=>{const doc=root.current?.ownerDocument;let alive=true;const reset=()=>queueMicrotask(()=>{if(alive)root.current?.querySelectorAll<HTMLInputElement>('input').forEach(input=>{const {value,options}=current.current;if(input.hasAttribute('data-select-all')){const state=choiceGroupState(options,value);input.checked=state.all;input.indeterminate=state.mixed;}else input.checked=value.includes(input.value);});});doc?.addEventListener('reset',reset,true);return()=>{alive=false;doc?.removeEventListener('reset',reset,true);};},[]);
}
export function CheckboxGroup({options,value,onValueChange,selectAll,name,readOnly,required,disabled,ref,...props}:CheckboxGroupProps){
 const root=React.useRef<HTMLFieldSetElement>(null),all=React.useRef<HTMLInputElement>(null),state=choiceGroupState(options,value),focus=useGroupFocus(root);
 useControlledReset(root,value,options);React.useImperativeHandle(ref,()=>root.current!);
 React.useLayoutEffect(()=>{if(all.current)all.current.indeterminate=state.mixed;const inputs=root.current?.querySelectorAll<HTMLInputElement>('input[data-option]');inputs?.forEach(input=>input.setCustomValidity(''));const first=Array.from(inputs??[]).find(input=>!input.disabled);first?.setCustomValidity(required&&!readOnly&&!state.hasSelection?'Select at least one option.':'');});
 return <Fieldset {...props} ref={root} disabled={disabled} aria-required={required||undefined} aria-readonly={readOnly||undefined} onFocusCapture={event=>{props.onFocusCapture?.(event);focus(event);}}>
 {selectAll!==undefined&&<Checkbox data-select-all="" ref={all} label={selectAll} checked={state.all} disabled={disabled||!state.editable.length} readOnly={readOnly} onChange={event=>onValueChange(selectAllChoices(options,value,event.target.checked))}/>}
 {options.map(option=><Checkbox key={option.key} data-option="" name={name} value={option.key} label={option.label} checked={value.includes(option.key)} disabled={disabled||option.disabled} readOnly={readOnly||option.readOnly} onChange={event=>onValueChange(toggleChoice(value,option.key,event.target.checked))}/>)}
 {state.unknown.length>0&&<p className="xui-help">Unknown selections: {state.unknown.join(', ')}</p>}
 </Fieldset>;
}
export function RadioGroup({options,value,onValueChange,name,readOnly,required,disabled,ref,...props}:RadioGroupProps){
 const generated=React.useId(),root=React.useRef<HTMLFieldSetElement>(null),focus=useGroupFocus(root),state=choiceGroupState(options,value===null?[]:[value]);useControlledReset(root,value===null?[]:[value],options);React.useImperativeHandle(ref,()=>root.current!);
 // A read-only selected radio must also be protected from another radio's native uncheck.
 const locked=readOnly||options.some(option=>option.key===value&&option.readOnly);
 return <Fieldset {...props} ref={root} disabled={disabled} aria-required={required||undefined} aria-readonly={locked||undefined} onFocusCapture={event=>{props.onFocusCapture?.(event);focus(event);}}>
 {options.map(option=><Radio key={option.key} name={name??generated} value={option.key} label={option.label} checked={value===option.key} required={required&&!locked} disabled={disabled||option.disabled} readOnly={locked||option.readOnly} onChange={()=>onValueChange(option.key)}/>)}
 {state.unknown.length>0&&<p className="xui-help">Unknown selection: {state.unknown[0]}</p>}
 </Fieldset>;
}
