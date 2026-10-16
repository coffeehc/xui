import {useOwnedController,type ControllerProps,assertControllerProps} from './controller.js';
import * as React from 'react';
import {Input,InputGroup} from './forms.js';
import {createNumberInputController,parseNumberDraft,type NumberInputOptions,type NumberInputController} from '@coffeehc/xui-runtime/number-input';
import {createPasswordInputController,type PasswordInputController,type PasswordInputOptions} from '@coffeehc/xui-runtime/display';
type ControlledInput=Omit<React.ComponentProps<'input'>,'type'|'value'|'defaultValue'|'onChange'> & {value:string;onValueChange:(value:string)=>void};
/** Mirror controlled defaults and run after native reset, without a change callback. */
function useTextReset(input:React.RefObject<HTMLInputElement|null>,value:string,onReset?:((value:string)=>void),prepareDefaultOnReset=false){
 const current=React.useRef({value,onReset});current.current={value,onReset};
 React.useLayoutEffect(()=>{if(input.current)input.current.defaultValue=value;});
 React.useEffect(()=>{const doc=input.current?.ownerDocument;let timer:ReturnType<typeof setTimeout>|undefined;const reset=(event:Event)=>{if(event.target!==input.current?.form)return;
 // React restores a controlled input's defaultValue from its draft after input/change
 // events, later than layout effects. NumberInput must prepare the confirmed reset
 // default here, before the browser's synchronous reset algorithm and FormData.
 if(prepareDefaultOnReset&&input.current)input.current.defaultValue=current.current.value;
 clearTimeout(timer);timer=setTimeout(()=>{if(input.current&&!event.defaultPrevented){input.current.value=current.current.value;current.current.onReset?.(current.current.value);}},0);};
 // Input after reset supersedes its deferred draft reconciliation.
 const edit=(event:Event)=>{if(event.target===input.current)clearTimeout(timer);};
 doc?.addEventListener('reset',reset,true);doc?.addEventListener('input',edit,true);return()=>{clearTimeout(timer);doc?.removeEventListener('reset',reset,true);doc?.removeEventListener('input',edit,true);};},[]);
 return current;
}
export type SearchInputProps=Omit<ControlledInput,'onSubmit'> & {onSubmit?:(value:string)=>void;onClear?:()=>void;clearLabel?:string;clearOnEscape?:boolean};
export function SearchInput({value,onValueChange,onSubmit,onClear,clearLabel='Clear search',clearOnEscape=false,disabled,readOnly,ref,onKeyDown,onCompositionStart,onCompositionEnd,...props}:SearchInputProps){
 const input=React.useRef<HTMLInputElement>(null),composing=React.useRef(false);React.useImperativeHandle(ref,()=>input.current!);
 useTextReset(input,value);
 const clear=()=>{if(disabled||readOnly)return;onValueChange('');onClear?.();input.current?.focus();};
 return <InputGroup.Root><Input {...props} ref={input} type="search" value={value} disabled={disabled} readOnly={readOnly} onChange={event=>onValueChange(event.target.value)} onCompositionStart={event=>{composing.current=true;onCompositionStart?.(event);}} onCompositionEnd={event=>{composing.current=false;onCompositionEnd?.(event);}} onKeyDown={event=>{onKeyDown?.(event);if(event.defaultPrevented)return;if(composing.current||event.nativeEvent.isComposing||event.keyCode===229){if(event.key==='Enter')event.preventDefault();return;}if(event.key==='Enter'&&onSubmit&&!disabled){event.preventDefault();onSubmit(value);}if(event.key==='Escape'&&clearOnEscape&&value&&!readOnly&&!disabled){event.preventDefault();clear();}}}/><InputGroup.Button aria-label={clearLabel} hidden={!value} disabled={disabled||readOnly} onClick={clear}>×</InputGroup.Button></InputGroup.Root>;
}
/** Clears are observable so controlled hosts can also release their own copy. */
export type PasswordClearReason='clear'|'reset'|'pagehide'|'unmount';
/** Explicit clearing keeps the same native input and resets visibility. */
export interface PasswordInputHandle {clear():void}
type PasswordValue={value:string;onValueChange:(value:string)=>void}|{value?:never;onValueChange?:(value:string)=>void};
/** Omit value to keep the secret solely in the native input; defaultValue is deliberately unsupported. */
export type PasswordInputPresentationProps=Omit<React.ComponentProps<'input'>,'type'|'value'|'defaultValue'|'onChange'|'prefix'> & PasswordValue & {prefix?:React.ReactNode;suffix?:React.ReactNode;controlRef?:React.Ref<PasswordInputHandle>;showLabel?:string;hideLabel?:string;onClear?:(reason:PasswordClearReason)=>void};
export type PasswordInputProps=PasswordInputPresentationProps&ControllerProps<PasswordInputController,PasswordInputOptions>;
/** InputGroup owns the only boundary; this control owns visibility and secret erasure. */
export function PasswordInput(props:PasswordInputProps){
 const {value,onValueChange,onClear,controlRef,prefix,suffix,showLabel='Show password',hideLabel='Hide password',disabled,readOnly,ref,onInput}=props;
 const injected='controller'in props?props.controller:undefined,defaultVisible='defaultVisible'in props?props.defaultVisible:undefined,onVisibleChange='onVisibleChange'in props?props.onVisibleChange:undefined;
 assertControllerProps(injected,props,['defaultVisible','onVisibleChange']);
 const input=React.useRef<HTMLInputElement>(null),generation=React.useRef(0),clearedValue=React.useRef(false),previousValue=React.useRef(value),latest=React.useRef({onValueChange,onClear,value,onVisibleChange});latest.current={onValueChange,onClear,value,onVisibleChange};
 const controller=useOwnedController(injected,()=>createPasswordInputController({defaultVisible,onVisibleChange:visible=>latest.current.onVisibleChange?.(visible)}));
 const {visible,cleared}=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState);
 React.useImperativeHandle(ref,()=>input.current!,[]);
 const erase=(node:HTMLInputElement|null)=>{if(node){node.value='';node.defaultValue='';node.removeAttribute('value');node.type='password';}};
 const clear=(reason:PasswordClearReason)=>{clearedValue.current=true;erase(input.current);controller.markCleared();try{latest.current.onValueChange?.('');latest.current.onClear?.(reason);}finally{erase(input.current);}};
 React.useImperativeHandle(controlRef,()=>({clear:()=>clear('clear')}),[controller]);
 React.useLayoutEffect(()=>{if(clearedValue.current&&!cleared)controller.markCleared();if(input.current&&value!==undefined)input.current.defaultValue=cleared||clearedValue.current?'':value;},[controller,cleared,value]);
 React.useEffect(()=>{if(Object.is(previousValue.current,value))return;previousValue.current=value;if(clearedValue.current&&(value===undefined||value===''))return;clearedValue.current=false;controller.markEdited();},[controller,value]);
 React.useEffect(()=>{const version=++generation.current,node=input.current,doc=node?.ownerDocument,window=doc?.defaultView;let timer:ReturnType<typeof setTimeout>|undefined;
  const hide=()=>clear('pagehide'),reset=(event:Event)=>{if(event.target!==node?.form)return;clearTimeout(timer);timer=setTimeout(()=>{if(event.defaultPrevented)return;controller.hide();if(latest.current.value===undefined)clear('reset');else if(node){node.value=clearedValue.current?'':latest.current.value;node.type='password';}},0);};
  window?.addEventListener('pagehide',hide);doc?.addEventListener('reset',reset,true);
  return()=>{clearTimeout(timer);window?.removeEventListener('pagehide',hide);doc?.removeEventListener('reset',reset,true);queueMicrotask(()=>{if(generation.current===version){controller.markCleared();erase(node);latest.current.onValueChange?.('');latest.current.onClear?.('unmount');}});};
 },[controller]);
 React.useLayoutEffect(()=>{if(!injected)controller.update({defaultVisible,onVisibleChange:visible=>latest.current.onVisibleChange?.(visible)});},[controller,injected,defaultVisible,onVisibleChange]);
 const {value:_value,onValueChange:_onValueChange,onClear:_onClear,controlRef:_controlRef,prefix:_prefix,suffix:_suffix,showLabel:_showLabel,hideLabel:_hideLabel,disabled:_disabled,readOnly:_readOnly,ref:_ref,onInput:_onInput,defaultVisible:_defaultVisible,onVisibleChange:_onVisibleChange,controller:_controller,...inputProps}=props as PasswordInputProps&PasswordInputOptions&{controller?:PasswordInputController};
 return <InputGroup.Root>{prefix!=null&&<InputGroup.Addon>{prefix}</InputGroup.Addon>}<Input {...inputProps} ref={input} type={visible?'text':'password'} {...(value===undefined?{}:{value:cleared||clearedValue.current?'':value})} disabled={disabled} readOnly={readOnly} onInput={event=>{if(!event.currentTarget.value)controller.hide();onInput?.(event);}} onChange={event=>{clearedValue.current=false;controller.markEdited();onValueChange?.(event.target.value);}}/>{suffix!=null&&<InputGroup.Addon>{suffix}</InputGroup.Addon>}<InputGroup.Button className="xui-password-toggle" aria-label={visible?hideLabel:showLabel} aria-pressed={visible} disabled={disabled} onMouseDown={event=>event.preventDefault()} onClick={()=>{const node=input.current,start=node?.selectionStart,end=node?.selectionEnd;controller.setVisible(!visible);queueMicrotask(()=>{if(node&&start!==null&&end!==null)node.setSelectionRange(start??0,end??0);});}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{visible?<><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.7 10.7 0 0 1 12 5c5 0 9 7 9 7a20.5 20.5 0 0 1-3.1 3.9M6.1 6.1A23.6 23.6 0 0 0 3 12s4 7 9 7a10.4 10.4 0 0 0 5.1-1.4"/></>:<><path d="M3 12s4-7 9-7 9 7 9 7-4 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="3"/></>}</svg></InputGroup.Button></InputGroup.Root>;
}
export type NumberInputProps=Omit<React.ComponentProps<'input'>,'type'|'value'|'defaultValue'|'onChange'|'min'|'max'|'step'|'disabled'|'readOnly'>&ControllerProps<NumberInputController,NumberInputOptions>&{incrementLabel?:string;decrementLabel?:string};
export function NumberInput(allProps:NumberInputProps){const {controller:injected,value,onValueChange,onDraftChange,onInvalidDraft,min,max,step,incrementLabel='Increase value',decrementLabel='Decrease value',disabled,readOnly,ref,onBlur,onKeyDown,onCompositionStart,onCompositionEnd,...props}=allProps;assertControllerProps(injected,allProps,['value','onValueChange','onDraftChange','onInvalidDraft','min','max','step','disabled','readOnly']);
 const callbacks=React.useRef({onValueChange,onDraftChange,onInvalidDraft});callbacks.current={onValueChange,onDraftChange,onInvalidDraft};
 const controller=useOwnedController(injected,()=>createNumberInputController({value:value!,min,max,step,disabled,readOnly,onValueChange:next=>callbacks.current.onValueChange?.(next),onDraftChange:next=>callbacks.current.onDraftChange?.(next),onInvalidDraft:(next,error)=>callbacks.current.onInvalidDraft?.(next,error)}));
 const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),input=React.useRef<HTMLInputElement>(null),composing=React.useRef(false);React.useImperativeHandle(ref,()=>input.current!);
 React.useLayoutEffect(()=>{if(!injected)controller.update({value,min,max,step,disabled,readOnly});},[controller,injected,value,min,max,step,disabled,readOnly]);
 useTextReset(input,state.value===null?'':String(state.value),()=>controller.resetDraft(),true);
 React.useLayoutEffect(()=>input.current?.setCustomValidity(state.error??''),[state.error]);
 const move=(direction:1|-1)=>{controller.step(direction);input.current?.focus();};
 return <InputGroup.Root><Input {...props} ref={input} type="text" inputMode="decimal" role="spinbutton" aria-valuemin={state.min} aria-valuemax={state.max} aria-valuenow={state.value??undefined} value={state.draft} disabled={state.disabled} readOnly={state.readOnly} onChange={event=>controller.edit(event.target.value)} onCompositionStart={event=>{composing.current=true;onCompositionStart?.(event);}} onCompositionEnd={event=>{composing.current=false;onCompositionEnd?.(event);}} onBlur={event=>{onBlur?.(event);if(!event.defaultPrevented&&!composing.current)controller.commit();}} onKeyDown={event=>{onKeyDown?.(event);if(event.defaultPrevented)return;if(composing.current||event.nativeEvent.isComposing||event.keyCode===229){if(event.key==='Enter')event.preventDefault();return;}if(event.key==='Enter'){event.preventDefault();controller.commit();}else if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();move(event.key==='ArrowUp'?1:-1);}}}/><InputGroup.Button aria-label={decrementLabel} disabled={state.disabled||state.readOnly} onMouseDown={event=>event.preventDefault()} onClick={()=>move(-1)}>−</InputGroup.Button><InputGroup.Button aria-label={incrementLabel} disabled={state.disabled||state.readOnly} onMouseDown={event=>event.preventDefault()} onClick={()=>move(1)}>+</InputGroup.Button></InputGroup.Root>;
}
export {createNumberInputController} from '@coffeehc/xui-runtime/number-input';
export type {NumberInputController,NumberInputState,NumberInputOptions} from '@coffeehc/xui-runtime/number-input';
