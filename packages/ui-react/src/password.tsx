import * as React from 'react';
import {Tooltip as BaseTooltip} from '@base-ui/react/tooltip';
import {countPasswordCodePoints,validateNewPassword,getNewPasswordErrorMessage,newPasswordLabels,createPasswordStrengthController,createNewPasswordFieldsController,getPasswordStrengthSummary,type NewPasswordLabels,type PasswordStrengthController,type PasswordStrengthControllerOptions,type NewPasswordFieldsController,type NewPasswordFieldsControllerOptions,type PasswordStrengthState} from '@coffeehc/xui-runtime/password';
import {Field} from './forms.js';
import {Tooltip} from './tooltip.js';
import {PasswordInput,type PasswordInputHandle,type PasswordInputPresentationProps} from './text-inputs.js';
import {useOwnedController,type ControllerProps,assertControllerProps} from './controller.js';

type PasswordStrengthOptions=Pick<PasswordStrengthControllerOptions,'defaultVisible'|'onVisibleChange'|'evaluateStrength'|'evaluationTimeoutMs'>;
/** Adds one advisory meter to PasswordInput; scores never gate submission. */
export type PasswordStrengthInputProps=Omit<PasswordInputPresentationProps,'defaultVisible'|'onVisibleChange'|'evaluateStrength'|'evaluationTimeoutMs'> & {labels?:Partial<NewPasswordLabels>} & ControllerProps<PasswordStrengthController,PasswordStrengthOptions>;
/** The controller observes the DOM on demand; no secret enters React or model snapshots. */
export function PasswordStrengthInput(props:PasswordStrengthInputProps){
 const {labels:overrides,controlRef,ref,onInput,onClear,...inputProps}=props,options=props as PasswordStrengthOptions, injected='controller'in props?props.controller:undefined;
 assertControllerProps(injected,props,['defaultVisible','onVisibleChange','evaluateStrength','evaluationTimeoutMs']);
 const labels={...newPasswordLabels,...overrides},input=React.useRef<HTMLInputElement>(null),control=React.useRef<PasswordInputHandle>(null),latest=React.useRef(options);latest.current=options;
 const readPassword=()=>{const value=input.current?.value??'';return countPasswordCodePoints(value)===null?null:value;};
 React.useImperativeHandle(ref,()=>input.current!,[]);
 React.useImperativeHandle(controlRef,()=>({clear(){control.current?.clear();}}),[]);
 const controller=useOwnedController(injected,()=>createPasswordStrengthController({readPassword:()=>'',evaluateStrength:options.evaluateStrength,evaluationTimeoutMs:options.evaluationTimeoutMs,defaultVisible:options.defaultVisible,onVisibleChange:visible=>latest.current.onVisibleChange?.(visible)}));
 const strength=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState);
 React.useLayoutEffect(()=>{if(!injected)controller.update({evaluateStrength:options.evaluateStrength,evaluationTimeoutMs:options.evaluationTimeoutMs,defaultVisible:options.defaultVisible,onVisibleChange:visible=>latest.current.onVisibleChange?.(visible)});},[controller,injected,options.defaultVisible,options.onVisibleChange,options.evaluateStrength,options.evaluationTimeoutMs]);
 React.useLayoutEffect(()=>controller.bindReader(readPassword),[controller]);
 React.useLayoutEffect(()=>{controller.refresh();},[controller,(props as PasswordInputPresentationProps).value]);
 const summary=(labels.strengthSummary??getPasswordStrengthSummary)(strength),level=strength.status==='ready'?strength.score+1:undefined;
 const {controller:_controller,defaultVisible:_defaultVisible,onVisibleChange:_onVisibleChange,labels:_labels,evaluateStrength:_evaluateStrength,evaluationTimeoutMs:_evaluationTimeoutMs,...viewProps}=props as PasswordStrengthInputProps&PasswordStrengthOptions&{controller?:PasswordStrengthController};
 const passwordProps={...viewProps,ref:input,controlRef:control,controller:controller.inputController,showLabel:labels.showPassword,hideLabel:labels.hidePassword,onInput:(event:React.InputEvent<HTMLInputElement>)=>{controller.refresh();onInput?.(event);},onClear:(reason:Parameters<NonNullable<PasswordInputPresentationProps['onClear']>>[0])=>{controller.clear();onClear?.(reason);}} as unknown as React.ComponentProps<typeof PasswordInput>;
 return <div className="xui-password-strength-input"><PasswordInput {...passwordProps}/>
  <meter className="xui-password-strength-meter" data-xui-password-strength="" data-state={strength.status} data-level={strength.status==='ready'?strength.level:undefined} min={0} max={5} value={level??0} role="meter" aria-label={labels.strengthLabel??newPasswordLabels.strengthLabel} aria-valuemin={0} aria-valuemax={5} aria-valuenow={level} aria-valuetext={summary}/>
  <span className="xui-password-strength-status" data-xui-password-strength-status="" role="status" aria-live="polite">{summary}</span>
 </div>;
}
/** Reads a validated secret only at the host's submit boundary. */
export interface NewPasswordFieldsHandle {readValidatedPassword():string|null;clear():void}
type NewPasswordFieldsOptions=Pick<NewPasswordFieldsControllerOptions,'defaultVisible'|'onVisibleChange'|'evaluateStrength'|'evaluationTimeoutMs'>;
/** Fixed password/confirmation composition; no remote policy or strength threshold is accepted. */
type NewPasswordFieldsPresentationProps={disabled?:boolean;labels?:Partial<NewPasswordLabels>;ref?:React.Ref<NewPasswordFieldsHandle>};
export type NewPasswordFieldsProps=NewPasswordFieldsPresentationProps&ControllerProps<NewPasswordFieldsController,NewPasswordFieldsOptions>;
/** Tooltip owns visual positioning; Field retains the single accessible error description. */
function PasswordValidationTip({input,message,open,onClose}:{input:React.RefObject<HTMLInputElement|null>;message?:string;open:boolean;onClose:()=>void}){
 return <BaseTooltip.Root open={open&&!!message} onOpenChange={next=>{if(!next)onClose();}}><Tooltip.Content aria-hidden="true" positionerProps={{anchor:input,side:'bottom',align:'start'}}>{message}</Tooltip.Content></BaseTooltip.Root>;
}
/** One aggregate controller owns validation feedback and both child visibility models. */
export function NewPasswordFields(props:NewPasswordFieldsProps){
 const {disabled=false,labels:overrides,ref}=props,options=props as NewPasswordFieldsOptions,injected='controller'in props?props.controller:undefined;
 assertControllerProps(injected,props,['defaultVisible','onVisibleChange','evaluateStrength','evaluationTimeoutMs']);
 const labels={...newPasswordLabels,...overrides},password=React.useRef<HTMLInputElement>(null),confirmation=React.useRef<HTMLInputElement>(null),passwordControl=React.useRef<PasswordInputHandle>(null),confirmationControl=React.useRef<PasswordInputHandle>(null);
 const controller=useOwnedController(injected,()=>createNewPasswordFieldsController({evaluateStrength:options.evaluateStrength,evaluationTimeoutMs:options.evaluationTimeoutMs,defaultVisible:options.defaultVisible,onVisibleChange:visible=>options.onVisibleChange?.(visible)}));
 const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),error=state.error as ReturnType<typeof validateNewPassword>;
 const clearError=()=>{controller.setError(null);controller.setTipOpen(false);},clear=()=>{try{passwordControl.current?.clear();}finally{try{confirmationControl.current?.clear();}finally{controller.clear();}}};
 React.useImperativeHandle(ref,()=>({clear,readValidatedPassword(){if(disabled)return null;const value=password.current?.value??'',result=validateNewPassword(value,confirmation.current?.value??'');controller.setError(result);controller.setTipOpen(!!result);if(result){(result==='confirmation_mismatch'?confirmation:password).current?.focus();return null;}return value;}}),[disabled,controller]);
 React.useLayoutEffect(()=>{if(!injected)controller.update({evaluateStrength:options.evaluateStrength,evaluationTimeoutMs:options.evaluationTimeoutMs,defaultVisible:options.defaultVisible,onVisibleChange:visible=>options.onVisibleChange?.(visible)});},[controller,injected,options.defaultVisible,options.onVisibleChange,options.evaluateStrength,options.evaluationTimeoutMs]);
 React.useEffect(()=>()=>{if(password.current)password.current.value='';if(confirmation.current)confirmation.current.value='';},[]);
 const message=getNewPasswordErrorMessage(error,labels,countPasswordCodePoints(password.current?.value??'')),passwordInvalid=error!==null&&error!=='confirmation_mismatch',confirmationInvalid=error==='confirmation_mismatch';
 const closeTip=()=>controller.setTipOpen(false),key=(event:React.KeyboardEvent<HTMLInputElement>)=>{if(event.key==='Escape'&&state.tipOpen){event.preventDefault();closeTip();}};
 return <div className="xui-stack"><Field className="xui-password-validation-field" label={labels.password} required error={passwordInvalid?message:undefined}><PasswordStrengthInput ref={password} controlRef={passwordControl} controller={controller.password} showLabel={labels.showPassword} hideLabel={labels.hidePassword} autoComplete="new-password" disabled={disabled} labels={labels} onFocus={()=>{if(passwordInvalid)controller.setTipOpen(true);}} onBlur={closeTip} onKeyDown={key} onInput={clearError} onClear={clearError}/><PasswordValidationTip input={password} message={passwordInvalid?message:undefined} open={passwordInvalid&&state.tipOpen} onClose={closeTip}/></Field>
  <Field className="xui-password-validation-field" label={labels.confirmation} required error={confirmationInvalid?message:undefined}><PasswordInput ref={confirmation} controlRef={confirmationControl} controller={controller.confirmation} showLabel={labels.showPassword} hideLabel={labels.hidePassword} autoComplete="new-password" disabled={disabled} onFocus={()=>{if(confirmationInvalid)controller.setTipOpen(true);}} onBlur={closeTip} onKeyDown={key} onInput={clearError} onClear={clearError}/><PasswordValidationTip input={confirmation} message={confirmationInvalid?message:undefined} open={confirmationInvalid&&state.tipOpen} onClose={closeTip}/></Field></div>;
}

export {PasswordChangeForm} from './password-change.js';
export type {PasswordChangeFormProps,PasswordChangeFormHandle} from './password-change.js';
