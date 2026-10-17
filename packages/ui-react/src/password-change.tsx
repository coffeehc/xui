import * as React from 'react';
import {createPasswordChangeController,getPasswordChangeMessage,passwordChangeLabels,type PasswordChangeController,type PasswordChangeOptions,type PasswordChangeLabels,type NewPasswordLabels} from '@coffeehc/xui-runtime/password';
import {NewPasswordFields,type NewPasswordFieldsHandle} from './password.js';
import {PasswordInput,type PasswordInputHandle} from './text-inputs.js';
import {Field} from './forms.js';
import {FormActions} from './layout.js';
import {Button} from './button.js';
import {Alert} from './feedback.js';
import {assertControllerProps,useOwnedController,useViewRelease,type ControllerProps} from './controller.js';

export interface PasswordChangeFormHandle {/** Clear DOM and visibility only; never retries or resets an unknown result. */clear:()=>void}
export type PasswordChangeFormProps={labels?:Partial<PasswordChangeLabels>;passwordLabels?:Partial<NewPasswordLabels>;ref?:React.Ref<PasswordChangeFormHandle>;/** Pass the public container open state when content is kept mounted. */active?:boolean}&ControllerProps<PasswordChangeController,PasswordChangeOptions>;
/** A real form for a page, Dialog or Sheet. Auth, navigation and the surrounding frame are not recreated. */
export function PasswordChangeForm(props:PasswordChangeFormProps){
 const {labels:overrides,passwordLabels,ref,active=true}=props,options=props as PasswordChangeOptions,injected=props.controller;
 assertControllerProps(injected,props,['auth','onChanged']);
 const latest=React.useRef(options.onChanged);latest.current=options.onChanged;
 const controller=useOwnedController(injected,()=>createPasswordChangeController({auth:options.auth,onChanged:()=>latest.current?.()}),options.auth);
 const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),auth=React.useSyncExternalStore(controller.auth.subscribe,controller.auth.getState,controller.auth.getState),labels={...passwordChangeLabels,...overrides};
 const current=React.useRef<HTMLInputElement>(null),currentControl=React.useRef<PasswordInputHandle>(null),fields=React.useRef<NewPasswordFieldsHandle>(null),feedback=React.useRef<HTMLDivElement>(null),prior=React.useRef(auth.user);
 const clear=()=>{for(const erase of [()=>currentControl.current?.clear(),()=>fields.current?.clear()])try{erase();}catch{/* Always clear the other password fields as well. */}};
 React.useImperativeHandle(ref,()=>({clear}),[controller]);
 useViewRelease(controller,()=>{clear();controller.suspend();});
 React.useLayoutEffect(()=>{if(!active){clear();controller.suspend();}},[active,controller]);
 React.useLayoutEffect(()=>{if(prior.current!==auth.user||auth.status!=='authenticated')clear();prior.current=auth.user;},[auth.user,auth.status]);
 const busy=state.status==='submitting',locked=!active||state.status!=='idle'||!!auth.busy||auth.status!=='authenticated',message=state.status==='idle'&&auth.status!=='authenticated'&&!auth.busy?labels.reauthenticate:getPasswordChangeMessage(state,labels);
 const previous=React.useRef(state.status);React.useLayoutEffect(()=>{if(previous.current==='submitting'&&state.status!=='submitting'){const node=feedback.current,focused=node?.ownerDocument.activeElement;if(active&&node&&(focused===node.ownerDocument.body||node.closest('form')?.contains(focused??null))){node.focus({preventScroll:true});node.scrollIntoView({block:'nearest',inline:'nearest'});}}previous.current=state.status;},[state.status]);
 return <form className="xui-stack" noValidate aria-label={labels.submit} onSubmit={event=>{
  event.preventDefault();if(locked)return;
  const value=current.current?.value??'';if(!controller.validateCurrentPassword(value)){current.current?.focus();return;}
  const next=fields.current?.readValidatedPassword();if(next==null)return;
  const result=controller.submit({current_password:value,new_password:next});clear();void result;
 }}>
  <Field label={labels.currentPassword} required error={state.currentPasswordRequired?labels.currentPasswordRequired:undefined}><PasswordInput ref={current} controlRef={currentControl} controller={controller.currentPassword} autoComplete="current-password" disabled={locked} showLabel={passwordLabels?.showPassword} hideLabel={passwordLabels?.hidePassword} onInput={()=>controller.clearCurrentPasswordError()}/></Field>
  <NewPasswordFields ref={fields} controller={controller.newPassword} labels={passwordLabels} disabled={locked}/>
  <FormActions><Button type="submit" disabled={locked} aria-busy={busy}><span aria-live="polite" aria-atomic="true">{busy?labels.submitting:labels.submit}</span></Button></FormActions>
  {message&&!busy&&<Alert ref={feedback} tabIndex={-1} tone={state.status==='changed'&&!state.error?'success':busy?'info':'error'} role={busy||state.status==='changed'?'status':'alert'}>{message}</Alert>}
 </form>;
}
