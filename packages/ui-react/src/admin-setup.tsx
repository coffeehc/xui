import * as React from 'react';
import {createAdminSetupController,adminSetupLabels,getAdminSetupMessage,type AdminSetupController,type AdminSetupControllerOptions,type AdminSetupState,type AdminSetupLabels,type AdminSetupSubmit,type AdminSetupCheck} from '@coffeehc/xui-runtime/admin-setup';
import {type NewPasswordLabels} from '@coffeehc/xui-runtime/password';
import {AuthPage,type AuthPageConfig} from './login.js';
import {NewPasswordFields,type NewPasswordFieldsHandle} from './password.js';
import {Field,Input} from './forms.js';
import {Button} from './button.js';
import {Alert} from './feedback.js';
import {useOwnedController,type ControllerProps,assertControllerProps} from './controller.js';
export type {AdminSetupState,AdminSetupLabels,AdminSetupSubmit,AdminSetupResult,AdminSetupStatus,AdminSetupCredentials,AdminSetupCheck,AdminSetupCheckResult,AdminSetupController,AdminSetupControllerOptions,AdminSetupFormController,AdminSetupFormState,AdminSetupUsernameValidator} from '@coffeehc/xui-runtime/admin-setup';
/** Clears password DOM and username validation feedback; does not change authority or username. */
export interface AdminSetupFormHandle {clear():void}
/** The complete page exposes the same form handle. */
export interface AdminSetupPageHandle extends AdminSetupFormHandle {}
type AdminSetupPresentationProps={labels?:Partial<AdminSetupLabels>;passwordLabels?:Partial<NewPasswordLabels>};
/** A complete form without a page, card, brand, authentication or navigation owner. */
export type AdminSetupFormProps=AdminSetupPresentationProps&{ref?:React.Ref<AdminSetupFormHandle>}&ControllerProps<AdminSetupController,AdminSetupControllerOptions>;
export type AdminSetupPageProps=AdminSetupPresentationProps&{config:AuthPageConfig;brandVisual?:React.ReactNode;ref?:React.Ref<AdminSetupPageHandle>}&ControllerProps<AdminSetupController,AdminSetupControllerOptions>;
/** Native focus scrolling can reveal only the caret in WebKit. After that
 * layout pass, honor the control's public scroll-margin without moving focus.
 * A queued reveal cannot affect an unmounted view or a newer focus target. */
function revealFocusedControl(event:React.FocusEvent<HTMLFormElement>){
 const target=event.target;
 target.ownerDocument.defaultView?.requestAnimationFrame(()=>{
  if(target.isConnected&&target.ownerDocument.activeElement===target)target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
 });
}
/** The host passes authoritative availability; completion does not authenticate or navigate. */
export function AdminSetupForm(props:AdminSetupFormProps){
 const {labels:overrides,passwordLabels,ref}=props,injected='controller'in props?props.controller:undefined;
 assertControllerProps(injected,props,['state','onSubmit','onCheck','validateUsername']);
 const options=props as AdminSetupControllerOptions,callback=React.useRef(options.onSubmit),checkCallback=React.useRef(options.onCheck);callback.current=options.onSubmit;checkCallback.current=options.onCheck;
 const controller=useOwnedController(injected,()=>createAdminSetupController({state:options.state,onSubmit:(credentials,context)=>callback.current(credentials,context),onCheck:options.onCheck?context=>checkCallback.current?.(context)??'unconfirmed':undefined,validateUsername:options.validateUsername}));
 const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),formState=React.useSyncExternalStore(controller.form.subscribe,controller.form.getState,controller.form.getState),labels={...adminSetupLabels,...overrides};
 React.useLayoutEffect(()=>{if(!injected)controller.update({onSubmit:(credentials,context)=>callback.current(credentials,context),onCheck:options.onCheck?context=>checkCallback.current?.(context)??'unconfirmed':undefined,validateUsername:options.validateUsername});},[controller,injected,options.onSubmit,options.onCheck,options.validateUsername]);
 const username=React.useRef<HTMLInputElement>(null),password=React.useRef<NewPasswordFieldsHandle>(null),previous=React.useRef(options.state);
 React.useEffect(()=>{if(injected)return;const authority=options.state;if(!previous.current||previous.current.status!==authority.status||previous.current.rejected!==authority.rejected||previous.current.checkFailed!==authority.checkFailed||previous.current.revision!==authority.revision){previous.current=authority;password.current?.clear();controller.form.clear();controller.setState(authority);}},[options.state,controller,injected]);
 React.useImperativeHandle(ref,()=>({clear(){password.current?.clear();controller.form.setUsernameError(false);}}),[controller]);
 React.useEffect(()=>{const hide=()=>{if(!injected)controller.suspend();};window.addEventListener('pagehide',hide);return()=>{window.removeEventListener('pagehide',hide);};},[controller,injected]);
 const locked=state.status!=='idle',message=getAdminSetupMessage(state,labels),usernameIssue=formState.usernameIssue;
 const usernameFeedback=!formState.usernameError?undefined:typeof usernameIssue==='object'?usernameIssue.message:usernameIssue==='invalid'?(labels.usernameInvalid??adminSetupLabels.usernameInvalid):labels.usernameRequired;
 return <form className="xui-login-form xui-admin-setup-form" aria-label={labels.submit} noValidate onFocusCapture={revealFocusedControl} onSubmit={event=>{event.preventDefault();
 if(locked||controller.getState().status!=='idle')return;const name=username.current?.value??'';if(!controller.form.validateUsername(name)){username.current?.focus();return;}
 const value=password.current?.readValidatedPassword();if(value==null)return;password.current?.clear();void controller.submit({username:name,password:value});if(controller.form.getState().usernameError)username.current?.focus();
 }}><div className="xui-login-content">
 <div className="xui-stack xui-admin-setup-fields" aria-busy={state.status==='submitting'||state.status==='checking'}><Field label={labels.username} required error={usernameFeedback}><Input ref={username} name="username" autoComplete="username" disabled={locked} onInput={()=>controller.form.setUsernameError(false)}/></Field><NewPasswordFields ref={password} controller={controller.form.passwordFields} disabled={locked} labels={passwordLabels}/></div>
 <footer className="xui-login-actions"><Button type="submit" className="xui-login-submit" size="lg" disabled={locked} aria-busy={state.status==='submitting'} data-idle-label={labels.submit} data-busy-label={labels.submitting}><span>{state.status==='submitting'?labels.submitting:labels.submit}</span></Button><span className="xui-login-announcement" role={state.status==='submitting'?'status':undefined} aria-live="polite" aria-atomic="true">{state.status==='submitting'?labels.submitting:''}</span></footer>
 </div>
 {(message&&state.status!=='submitting'||controller.canCheck()&&['unconfirmed','unavailable','checking'].includes(state.status))?<div className="xui-login-support"><div className="xui-login-feedback">
 {message&&state.status!=='submitting'?<Alert tone={state.status==='unavailable'||state.rejected||state.checkFailed?'error':'info'}>{message}</Alert>:null}
 {controller.canCheck()&&['unconfirmed','unavailable','checking'].includes(state.status)?<Button variant="ghost" size="sm" disabled={state.status==='checking'} aria-busy={state.status==='checking'} onClick={()=>{password.current?.clear();void controller.check();}}>{state.status==='checking'?labels.checking:labels.check}</Button>:null}
 </div></div>:null}
 </form>;
}
/** Same form implementation and owner, composed with the standard authentication shell. */
export function AdminSetupPage({config,brandVisual,...formProps}:AdminSetupPageProps){
 return <AuthPage config={config} brandVisual={brandVisual}><AdminSetupForm {...formProps}/></AuthPage>;
}
