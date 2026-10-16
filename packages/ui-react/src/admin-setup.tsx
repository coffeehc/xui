import * as React from 'react';
import {createAdminSetupController,adminSetupLabels,getAdminSetupMessage,type AdminSetupController,type AdminSetupControllerOptions,type AdminSetupState,type AdminSetupLabels,type AdminSetupSubmit,type AdminSetupCheck} from '@coffeehc/xui-runtime/admin-setup';
import {type NewPasswordLabels} from '@coffeehc/xui-runtime/password';
import {AuthPage,type AuthPageConfig} from './login.js';
import {NewPasswordFields,type NewPasswordFieldsHandle} from './password.js';
import {Field,Input} from './forms.js';
import {Button} from './button.js';
import {Alert} from './feedback.js';
import {useOwnedController,type ControllerProps,assertControllerProps} from './controller.js';
export type {AdminSetupState,AdminSetupLabels,AdminSetupSubmit,AdminSetupResult,AdminSetupStatus,AdminSetupCredentials,AdminSetupCheck,AdminSetupCheckResult,AdminSetupController,AdminSetupControllerOptions,AdminSetupFormController,AdminSetupFormState} from '@coffeehc/xui-runtime/admin-setup';
export interface AdminSetupPageHandle {clear():void}
type AdminSetupPagePresentationProps={config:AuthPageConfig;labels?:Partial<AdminSetupLabels>;passwordLabels?:Partial<NewPasswordLabels>;brandVisual?:React.ReactNode;ref?:React.Ref<AdminSetupPageHandle>};
export type AdminSetupPageProps=AdminSetupPagePresentationProps&ControllerProps<AdminSetupController,AdminSetupControllerOptions>;
/** The host passes authoritative availability; completion does not authenticate or navigate. */
export function AdminSetupPage(props:AdminSetupPageProps){
 const {config,labels:overrides,passwordLabels,brandVisual,ref}=props,injected='controller'in props?props.controller:undefined;
 assertControllerProps(injected,props,['state','onSubmit','onCheck']);
 const options=props as AdminSetupControllerOptions,callback=React.useRef(options.onSubmit),checkCallback=React.useRef(options.onCheck);callback.current=options.onSubmit;checkCallback.current=options.onCheck;
 const controller=useOwnedController(injected,()=>createAdminSetupController({state:options.state,onSubmit:(credentials,context)=>callback.current(credentials,context),onCheck:options.onCheck?context=>checkCallback.current?.(context)??'unconfirmed':undefined}));
 const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),formState=React.useSyncExternalStore(controller.form.subscribe,controller.form.getState,controller.form.getState),labels={...adminSetupLabels,...overrides};
 React.useLayoutEffect(()=>{if(!injected)controller.update({onSubmit:(credentials,context)=>callback.current(credentials,context),onCheck:options.onCheck?context=>checkCallback.current?.(context)??'unconfirmed':undefined});},[controller,injected,options.onSubmit,options.onCheck]);
 const username=React.useRef<HTMLInputElement>(null),password=React.useRef<NewPasswordFieldsHandle>(null),previous=React.useRef(options.state);
 React.useEffect(()=>{if(injected)return;const authority=options.state;if(!previous.current||previous.current.status!==authority.status||previous.current.rejected!==authority.rejected||previous.current.checkFailed!==authority.checkFailed||previous.current.revision!==authority.revision){previous.current=authority;password.current?.clear();controller.form.clear();controller.setState(authority);}},[options.state,controller,injected]);
 React.useImperativeHandle(ref,()=>({clear(){password.current?.clear();controller.form.setUsernameError(false);}}),[controller]);
 React.useEffect(()=>{const hide=()=>{if(!injected)controller.suspend();};window.addEventListener('pagehide',hide);return()=>{window.removeEventListener('pagehide',hide);};},[controller,injected]);
 const locked=state.status!=='idle',message=getAdminSetupMessage(state,labels);
 return <AuthPage config={config} brandVisual={brandVisual} form={{noValidate:true,onSubmit:()=>{
 if(locked||controller.getState().status!=='idle')return;const name=username.current?.value??'';if(!name.trim()){controller.form.setUsernameError(true);username.current?.focus();return;}controller.form.setUsernameError(false);
 const value=password.current?.readValidatedPassword();if(value==null)return;password.current?.clear();void controller.submit({username:name,password:value});
 }}} actions={<><Button type="submit" className="xui-login-submit" size="lg" disabled={locked} aria-busy={state.status==='submitting'} data-idle-label={labels.submit} data-busy-label={labels.submitting}><span>{state.status==='submitting'?labels.submitting:labels.submit}</span></Button><span className="xui-login-announcement" role={state.status==='submitting'?'status':undefined} aria-live="polite" aria-atomic="true">{state.status==='submitting'?labels.submitting:''}</span></>}
 feedbackActions={controller.canCheck()&&['unconfirmed','unavailable','checking'].includes(state.status)?<Button variant="ghost" size="sm" disabled={state.status==='checking'} aria-busy={state.status==='checking'} onClick={()=>{password.current?.clear();void controller.check();}}>{state.status==='checking'?labels.checking:labels.check}</Button>:undefined}
 feedback={message&&state.status!=='submitting'?<Alert tone={state.status==='unavailable'||state.rejected||state.checkFailed?'error':'info'}>{message}</Alert>:undefined}>
 <div className="xui-stack" aria-busy={state.status==='submitting'||state.status==='checking'}><Field label={labels.username} required error={formState.usernameError?labels.usernameRequired:undefined}><Input ref={username} name="username" autoComplete="username" disabled={locked} onInput={()=>controller.form.setUsernameError(false)}/></Field><NewPasswordFields ref={password} controller={controller.form.passwordFields} disabled={locked} labels={passwordLabels}/></div>
 </AuthPage>;
}
