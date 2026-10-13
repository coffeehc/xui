import * as React from 'react';
import {parsePasswordPolicy,validateNewPassword,getNewPasswordErrorMessage,newPasswordLabels,type PasswordPolicy,type NewPasswordLabels} from '@coffeehc/xui-runtime/password';
import {Field,Input} from './forms.js';

export interface NewPasswordFieldsHandle {readValidatedPassword():string|null;clear():void}
export interface NewPasswordFieldsProps {policy:PasswordPolicy|null;disabled?:boolean;labels?:Partial<NewPasswordLabels>;ref?:React.Ref<NewPasswordFieldsHandle>}
/** 公共密码/确认控件；宿主只在提交业务前读取已验证值，不复制密码策略。 */
export function NewPasswordFields({policy:input,disabled=false,labels:overrides,ref}:NewPasswordFieldsProps){
  const policy=React.useMemo(()=>{try{return input===null?null:parsePasswordPolicy(input);}catch{return null;}},[input]),labels={...newPasswordLabels,...overrides};
  const password=React.useRef<HTMLInputElement>(null),confirmation=React.useRef<HTMLInputElement>(null),[error,setError]=React.useState<ReturnType<typeof validateNewPassword>>(null);
  const passwordRef=React.useCallback((node:HTMLInputElement|null)=>{if(password.current&&password.current!==node){password.current.value='';password.current.defaultValue='';}password.current=node;},[]);
  const confirmationRef=React.useCallback((node:HTMLInputElement|null)=>{if(confirmation.current&&confirmation.current!==node){confirmation.current.value='';confirmation.current.defaultValue='';}confirmation.current=node;},[]);
  const clear=()=>{for(const field of [password.current,confirmation.current])if(field){field.value='';field.defaultValue='';}setError(null);};
  React.useImperativeHandle(ref,()=>({clear,readValidatedPassword(){const value=password.current?.value??'',result=validateNewPassword(policy,value,confirmation.current?.value??'');setError(result);if(result){(result==='confirmation_mismatch'?confirmation:password).current?.focus();return null;}return disabled?null:value;}}),[policy,disabled]);
  React.useEffect(()=>{const clearValues=()=>{for(const field of [password.current,confirmation.current])if(field){field.value='';field.defaultValue='';}};window.addEventListener('pagehide',clearValues);return()=>{clearValues();window.removeEventListener('pagehide',clearValues);};},[]);
  const message=getNewPasswordErrorMessage(error,policy,labels),help=policy?labels.length(policy.minimum_characters,policy.maximum_characters):labels.policyUnavailable;
  return <><Field label={labels.password} required help={help} error={error!=='confirmation_mismatch'?message:undefined}><Input ref={passwordRef} type="password" autoComplete="new-password" disabled={disabled||policy===null} onInput={()=>setError(null)}/></Field><Field label={labels.confirmation} required error={error==='confirmation_mismatch'?message:undefined}><Input ref={confirmationRef} type="password" autoComplete="new-password" disabled={disabled||policy===null} onInput={()=>setError(null)}/></Field></>;
}
