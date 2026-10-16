import * as React from 'react';
import {Popover as BasePopover} from '@base-ui/react/popover';
import {Select as BaseSelect} from '@base-ui/react/select';
import {createDateTimeModel,dateTimeDefaultLabels,type DateTimeOptions,type DateTimePickerLabels} from '@coffeehc/xui-runtime/date-time';
import type {DateTimeController} from '@coffeehc/xui-runtime/date-time';
import {Field,Input,InputGroup} from './forms.js';
import {Select} from './select.js';
import {Calendar} from './calendar.js';
import {Popover} from './popover.js';
import {Button} from './button.js';
import {Stack,Toolbar} from './layout.js';
import {useOwnedController,type ControllerProps,assertControllerProps} from './controller.js';

export type {DateTimeValue,DateTimeOptions,DateTimeParts,DateTimeError,DateTimePickerLabels,DateTimeController} from '@coffeehc/xui-runtime/date-time';
/** One labeled native text input plus a public date/time popover. ref points to the input.
 * Valid complete text requests a value immediately; invalid text is retained as draft.
 * Required/format errors use Field and native validity; host errors retain their own copy. */
type DateTimePickerPresentationProps = {
 label:string;id?:string;name?:string;form?:string;help?:React.ReactNode;error?:React.ReactNode;
 describedBy?:string;placeholder?:string;autoComplete?:string;className?:string;
 labels?:Partial<DateTimePickerLabels>;ref?:React.Ref<HTMLInputElement>;
};
export type DateTimePickerProps=DateTimePickerPresentationProps&ControllerProps<DateTimeController,DateTimeOptions>;
export function DateTimePicker(props:DateTimePickerProps){
 const {label,id,name,form,help,error,describedBy,placeholder='YYYY-MM-DDTHH:mm',autoComplete='off',className,labels:overrides,ref}=props;
 const injected='controller'in props?props.controller:undefined,options=props as DateTimeOptions;
 assertControllerProps(injected,props,['value','defaultValue','onValueChange','disabled','readOnly','required','locale','weekStartsOn','today']);
 const labels={...dateTimeDefaultLabels,...overrides},latest=React.useRef(options);latest.current=options;
 const model=useOwnedController(injected,()=>createDateTimeModel({...options,onValueChange:value=>latest.current.onValueChange?.(value)}));
 const state=React.useSyncExternalStore(model.subscribe,model.getState,model.getState);
 const input=React.useRef<HTMLInputElement>(null),trigger=React.useRef<HTMLButtonElement>(null),title=React.useRef<HTMLHeadingElement>(null),popup=React.useRef<HTMLDivElement>(null),resetRevision=React.useRef(0),generated=React.useId();
 const innerOpen=React.useRef(new Set<string>()),innerEscapes=React.useRef(new WeakSet<Event>());
 React.useLayoutEffect(()=>{if(!state.open)innerOpen.current.clear();},[state.open]);
 React.useImperativeHandle(ref,()=>input.current!,[]);
 React.useLayoutEffect(()=>{if(!injected)model.update({value:options.value,disabled:options.disabled,readOnly:options.readOnly,required:options.required,locale:options.locale,weekStartsOn:options.weekStartsOn,today:options.today});},[model,injected,options.value,options.disabled,options.readOnly,options.required,options.locale,options.weekStartsOn,options.today]);
 const message=error||(state.error?labels[state.error==='format'?'invalid':'required']:undefined);
 React.useLayoutEffect(()=>{
  if(!input.current)return;
  input.current.defaultValue=state.value??'';
  input.current.setCustomValidity(error?typeof error==='string'?error:labels.externalError:state.invalid?labels[state.invalid==='format'?'invalid':'required']:'');
 },[state,error,labels.invalid,labels.required,labels.externalError]);
 React.useEffect(()=>{
  let alive=true;
  const reset=(event:Event)=>{if(event.target!==input.current?.form)return;const revision=++resetRevision.current;queueMicrotask(()=>{if(alive&&!event.defaultPrevented&&revision===resetRevision.current)model.resetDraft();});};
  const doc=input.current!.ownerDocument;doc.addEventListener('reset',reset,true);
  return()=>{alive=false;resetRevision.current++;doc.removeEventListener('reset',reset,true);};
 },[model]);
 const blocked=state.disabled||state.readOnly;
 return <BasePopover.Root open={state.open} onOpenChange={(next,details)=>{
  // Public peer callbacks arbitrate nested dismissal; never inspect a child popup's DOM.
  if(!next&&details.reason==='escape-key'&&(innerOpen.current.size||innerEscapes.current.has(details.event))){details.cancel();return;}
  if(next)model.open();else{innerOpen.current.clear();model.close();}
 }}>
  <div className={['xui-field',className].filter(Boolean).join(' ')}><Field label={label} controlId={id??generated} required={state.required} help={help}>
   <InputGroup.Root>
    <Input ref={input} id={id??generated} name={name} form={form} type="text" value={state.draft} disabled={state.disabled} readOnly={state.readOnly} required={state.required} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={!!message} aria-describedby={[describedBy,message?(id??generated)+'-error':undefined].filter(Boolean).join(' ')||undefined}
     onChange={event=>{resetRevision.current++;model.edit(event.target.value);}} onBlur={()=>model.commit()} onInvalid={()=>model.commit()}
     onKeyDown={event=>{if(event.nativeEvent.isComposing)return;if(event.key==='Enter'){event.preventDefault();model.commit();}else if(event.key==='ArrowDown'&&event.altKey){event.preventDefault();model.open();}}}/>
    <Popover.Trigger render={<InputGroup.Button ref={trigger} disabled={blocked} aria-label={labels.open+' '+label}/>}>选择</Popover.Trigger>
    <InputGroup.Button hidden={!state.draft&&!state.value} disabled={blocked} aria-label={labels.clear+' '+label} onClick={()=>{input.current?.focus();model.clear();}}>×</InputGroup.Button>
   </InputGroup.Root>
  </Field><div className="xui-feedback-slot" hidden={!state.invalid&&!message} aria-live="polite" tabIndex={message?0:-1}>{message&&<p className="xui-error" id={(id??generated)+'-error'}>{message}</p>}</div></div>
  <Popover.Content ref={popup} initialFocus={title} finalFocus={()=>{
   const current=input.current,active=current?.ownerDocument.activeElement;
   if(!current||latest.current.disabled)return false;
   if(active&&active!==current.ownerDocument.body&&active!==trigger.current&&!popup.current?.contains(active))return false;
   return latest.current.readOnly?current:trigger.current;
  }}>
   <Stack>
    <Popover.Title ref={title} tabIndex={-1}>{labels.title}</Popover.Title>
    <Calendar label={labels.date} mode="single" month={state.month} value={state.date} today={options.today} locale={options.locale} weekStartsOn={options.weekStartsOn} disabled={blocked} onMonthChange={model.setMonth} onValueChange={value=>model.setDate(value as string|null)}/>
    <Toolbar>
     {(['hour','minute'] as const).map(part=><Field key={part} label={labels[part]} controlId={generated+'-'+part}><BaseSelect.Root value={state[part]} disabled={blocked} onOpenChange={(next,details)=>{if(next)innerOpen.current.add(part);else{if(details.reason==='escape-key')innerEscapes.current.add(details.event);innerOpen.current.delete(part);}}} onValueChange={value=>{if(value!==null)model.setTime(part,value);}}><Select.Trigger id={generated+'-'+part} aria-label={labels[part]}><Select.Value>{value=>String(value).padStart(2,'0')}</Select.Value></Select.Trigger><Select.Content><Select.List>{Array.from({length:part==='hour'?24:60},(_,i)=><Select.Item key={i} value={i}><Select.ItemText>{String(i).padStart(2,'0')}</Select.ItemText></Select.Item>)}</Select.List></Select.Content></BaseSelect.Root></Field>)}
    </Toolbar>
    <Toolbar><Button disabled={blocked||!state.date} onClick={()=>model.apply()}>{labels.apply}</Button><Button variant="outline" onClick={()=>model.close()}>{labels.cancel}</Button></Toolbar>
   </Stack>
  </Popover.Content>
 </BasePopover.Root>;
}
