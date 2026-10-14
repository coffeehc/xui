import * as React from 'react';
import {countPasswordCodePoints,validateNewPassword,getNewPasswordErrorMessage,newPasswordLabels,createPasswordStrengthController,getPasswordStrengthSummary,type PasswordStrengthState,type NewPasswordLabels} from '@coffeehc/xui-runtime/password';
import {Field} from './forms.js';
import {Tooltip} from './tooltip.js';
import {PasswordInput,type PasswordInputProps,type PasswordInputHandle} from './text-inputs.js';

/** Adds one advisory meter to PasswordInput; scores never gate submission. */
export type PasswordStrengthInputProps=PasswordInputProps & {labels?:Partial<NewPasswordLabels>};
/** Reuses PasswordInput for the native input, addon lifecycle, visibility and all secret cleanup. */
export function PasswordStrengthInput(props:PasswordStrengthInputProps){
 const {labels:overrides,controlRef,ref,onInput,onClear,...inputProps}=props,labels={...newPasswordLabels,...overrides};
 const input=React.useRef<HTMLInputElement>(null),control=React.useRef<PasswordInputHandle>(null),owner=React.useRef<ReturnType<typeof createPasswordStrengthController>|null>(null),[strength,setStrength]=React.useState<PasswordStrengthState>({status:'idle'});
 React.useImperativeHandle(ref,()=>input.current!,[]);
 React.useImperativeHandle(controlRef,()=>({clear(){control.current?.clear();}}),[]);
 React.useLayoutEffect(()=>{const next=createPasswordStrengthController({readPassword:()=>{const value=input.current?.value??'';return countPasswordCodePoints(value)===null?null:value;},onChange:setStrength});owner.current=next;return()=>{next.destroy();if(owner.current===next)owner.current=null;};},[]);
 React.useLayoutEffect(()=>{owner.current?.refresh();},[props.value]);
 const summary=(labels.strengthSummary??getPasswordStrengthSummary)(strength),level=strength.status==='ready'?strength.score+1:undefined;
 return <div className="xui-password-strength-input"><PasswordInput {...inputProps} ref={input} controlRef={control} onInput={event=>{owner.current?.refresh();onInput?.(event);}} onClear={reason=>{owner.current?.clear();onClear?.(reason);}}/>
  <meter className="xui-password-strength-meter" data-xui-password-strength="" data-state={strength.status} data-level={strength.status==='ready'?strength.level:undefined} min={0} max={5} value={level??0} role="meter" aria-label={labels.strengthLabel??newPasswordLabels.strengthLabel} aria-valuemin={0} aria-valuemax={5} aria-valuenow={level} aria-valuetext={summary}/>
  <span className="xui-password-strength-status" data-xui-password-strength-status="" role="status" aria-live="polite">{summary}</span>
 </div>;
}
/** Reads a validated secret only at the host's submit boundary. */
export interface NewPasswordFieldsHandle {readValidatedPassword():string|null;clear():void}
/** Fixed password/confirmation composition; no remote policy or strength threshold is accepted. */
export interface NewPasswordFieldsProps {disabled?:boolean;labels?:Partial<NewPasswordLabels>;ref?:React.Ref<NewPasswordFieldsHandle>}
/** Tooltip owns visual positioning; Field retains the single accessible error description. */
function PasswordValidationTip({input,message,open,onClose}:{input:React.RefObject<HTMLInputElement|null>;message?:string;open:boolean;onClose:()=>void}){
 return <Tooltip.Root open={open&&!!message} onOpenChange={next=>{if(!next)onClose();}}><Tooltip.Content aria-hidden="true" positionerProps={{anchor:input,side:'bottom',align:'start'}}>{message}</Tooltip.Content></Tooltip.Root>;
}
/** Combines the public strength input and ordinary confirmation input without keeping secrets in React state. */
export function NewPasswordFields({disabled=false,labels:overrides,ref}:NewPasswordFieldsProps){
 const labels={...newPasswordLabels,...overrides},password=React.useRef<HTMLInputElement>(null),confirmation=React.useRef<HTMLInputElement>(null),passwordControl=React.useRef<PasswordInputHandle>(null),confirmationControl=React.useRef<PasswordInputHandle>(null),[error,setError]=React.useState<ReturnType<typeof validateNewPassword>>(null),[tipOpen,setTipOpen]=React.useState(false);
 const clearError=()=>{setError(null);setTipOpen(false);},clear=()=>{passwordControl.current?.clear();confirmationControl.current?.clear();clearError();};
 React.useImperativeHandle(ref,()=>({clear,readValidatedPassword(){if(disabled)return null;const value=password.current?.value??'',result=validateNewPassword(value,confirmation.current?.value??'');setError(result);setTipOpen(!!result);if(result){(result==='confirmation_mismatch'?confirmation:password).current?.focus();return null;}return value;}}),[disabled]);
 const message=getNewPasswordErrorMessage(error,labels,countPasswordCodePoints(password.current?.value??'')),passwordInvalid=error!==null&&error!=='confirmation_mismatch',confirmationInvalid=error==='confirmation_mismatch';
 const closeTip=()=>setTipOpen(false),key=(event:React.KeyboardEvent<HTMLInputElement>)=>{if(event.key==='Escape'&&tipOpen){event.preventDefault();closeTip();}};
 return <div className="xui-stack"><Field className="xui-password-validation-field" label={labels.password} required error={passwordInvalid?message:undefined}><PasswordStrengthInput ref={password} controlRef={passwordControl} autoComplete="new-password" disabled={disabled} labels={labels} onFocus={()=>{if(passwordInvalid)setTipOpen(true);}} onBlur={closeTip} onKeyDown={key} onInput={clearError} onClear={clearError}/><PasswordValidationTip input={password} message={passwordInvalid?message:undefined} open={passwordInvalid&&tipOpen} onClose={closeTip}/></Field>
  <Field className="xui-password-validation-field" label={labels.confirmation} required error={confirmationInvalid?message:undefined}><PasswordInput ref={confirmation} controlRef={confirmationControl} autoComplete="new-password" disabled={disabled} onFocus={()=>{if(confirmationInvalid)setTipOpen(true);}} onBlur={closeTip} onKeyDown={key} onInput={clearError} onClear={clearError}/><PasswordValidationTip input={confirmation} message={confirmationInvalid?message:undefined} open={confirmationInvalid&&tipOpen} onClose={closeTip}/></Field></div>;
}
