import * as React from 'react';
import {createAdminSetupController,adminSetupLabels,getAdminSetupMessage,type AdminSetupState,type AdminSetupLabels,type AdminSetupSubmit} from '@coffeehc/xui-runtime/admin-setup';
import {type NewPasswordLabels} from '@coffeehc/xui-runtime/password';
import {AuthPage,type AuthPageConfig} from './login.js';
import {NewPasswordFields,type NewPasswordFieldsHandle} from './password.js';
import {Field,Input} from './forms.js';
import {Button} from './button.js';
import {Alert} from './feedback.js';
export type {AdminSetupState,AdminSetupLabels,AdminSetupSubmit,AdminSetupResult,AdminSetupStatus,AdminSetupCredentials} from '@coffeehc/xui-runtime/admin-setup';
export interface AdminSetupPageHandle {clear():void}
export interface AdminSetupPageProps {config:AuthPageConfig;state:AdminSetupState;onSubmit:AdminSetupSubmit;labels?:Partial<AdminSetupLabels>;passwordLabels?:Partial<NewPasswordLabels>;brandVisual?:React.ReactNode;ref?:React.Ref<AdminSetupPageHandle>}
/** The host passes authoritative availability; completion does not authenticate or navigate. */
export function AdminSetupPage({config,state:authority,onSubmit,labels:overrides,passwordLabels,brandVisual,ref}:AdminSetupPageProps){
 const callback=React.useRef(onSubmit);callback.current=onSubmit;
 const [controller]=React.useState(()=>createAdminSetupController({state:authority,onSubmit:(credentials,context)=>callback.current(credentials,context)}));
 const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),labels={...adminSetupLabels,...overrides};
 const username=React.useRef<HTMLInputElement>(null),password=React.useRef<NewPasswordFieldsHandle>(null),[usernameError,setUsernameError]=React.useState(false);
 const previous=React.useRef(authority);React.useEffect(()=>{if(previous.current.status!==authority.status||previous.current.rejected!==authority.rejected||previous.current.revision!==authority.revision){previous.current=authority;password.current?.clear();controller.setState(authority);}},[authority,controller]);
 React.useImperativeHandle(ref,()=>({clear(){password.current?.clear();}}),[]);
 React.useEffect(()=>{const hide=()=>{password.current?.clear();controller.suspend();};window.addEventListener('pagehide',hide);return()=>{hide();window.removeEventListener('pagehide',hide);};},[controller]);
 const locked=state.status!=='idle',message=getAdminSetupMessage(state,labels);
 return <AuthPage config={config} brandVisual={brandVisual} form={{noValidate:true,onSubmit:()=>{
 if(locked||controller.getState().status!=='idle')return;const name=username.current?.value??'';if(!name.trim()){setUsernameError(true);username.current?.focus();return;}setUsernameError(false);
 const value=password.current?.readValidatedPassword();if(value==null)return;password.current?.clear();void controller.submit({username:name,password:value});
 }}} actions={<><Button type="submit" className="xui-login-submit" size="lg" disabled={locked} aria-busy={state.status==='submitting'} data-idle-label={labels.submit} data-busy-label={labels.submitting}><span>{state.status==='submitting'?labels.submitting:labels.submit}</span></Button><span className="xui-login-announcement" role={state.status==='submitting'?'status':undefined} aria-live="polite" aria-atomic="true">{state.status==='submitting'?labels.submitting:''}</span></>}
 feedback={message&&state.status!=='submitting'?<Alert tone={state.status==='unavailable'||state.rejected?'error':'info'}>{message}</Alert>:undefined}>
 <div className="xui-stack" aria-busy={state.status==='submitting'}><Field label={labels.username} required error={usernameError?labels.usernameRequired:undefined}><Input ref={username} name="username" autoComplete="username" disabled={locked} onInput={()=>setUsernameError(false)}/></Field><NewPasswordFields ref={password} disabled={locked} labels={passwordLabels}/></div>
 </AuthPage>;
}
