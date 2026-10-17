import {isPasswordChangeRejection} from './password-change-errors.js';
import type {AuthClient,PasswordChangeCredentials} from './auth.js';
import {HttpError,isHttpError} from './http-service.js';
import {createPasswordInputController,type PasswordInputController} from './display.js';
import {createNewPasswordFieldsController,type NewPasswordFieldsController} from './password-strength.js';

/** Presentation only. AuthClient remains the single credential and mutation owner. */
export interface PasswordChangeOptions {auth:AuthClient;onChanged?:()=>void}
export interface PasswordChangeState {
 readonly status:'idle'|'submitting'|'changed'|'unknown'|'reauthenticate';
 readonly currentPasswordRequired:boolean;readonly error:HttpError|null;
}
export interface PasswordChangeController {
 readonly auth:AuthClient;readonly currentPassword:PasswordInputController;readonly newPassword:NewPasswordFieldsController;
 getState:()=>Readonly<PasswordChangeState>;subscribe:(listener:()=>void)=>()=>void;
 /** Credentials are handed to auth once and immediately cleared from this caller-owned object. */
 submit:(credentials:PasswordChangeCredentials)=>Promise<void>;
 validateCurrentPassword:(value:string)=>boolean;clearCurrentPasswordError:()=>void;
 /** Cancels this form's waiting; cannot undo a server commit or unlock an unknown result. */
 suspend:()=>void;update:(options:Partial<Pick<PasswordChangeOptions,'onChanged'>>)=>void;destroy:()=>void;
}
export interface PasswordChangeLabels {currentPassword:string;currentPasswordRequired:string;submit:string;submitting:string;changed:string;committedFollowup:string;unknown:string;reauthenticate:string;rejected:string}
export const passwordChangeLabels:Readonly<PasswordChangeLabels>=Object.freeze({currentPassword:'当前密码',currentPasswordRequired:'请输入当前密码。',submit:'修改密码',submitting:'正在修改…',changed:'密码已更改，请重新登录。',committedFollowup:'密码已更改，后续处理未完成。请重新登录。',unknown:'无法确认改密结果。请重新登录后核对，勿重复提交。',reauthenticate:'会话已失效，请重新登录。',rejected:'未能修改密码，请检查输入后重试。'});
export function getPasswordChangeMessage(state:Readonly<PasswordChangeState>,labels:PasswordChangeLabels=passwordChangeLabels):string {
 return state.status==='idle'?(state.error?labels.rejected:''):state.status==='changed'&&state.error?labels.committedFollowup:labels[state.status];
}
/** No passwords or tokens enter snapshots. One active form uses one controller. */
export function createPasswordChangeController(initial:PasswordChangeOptions):PasswordChangeController {
 const auth=initial.auth,currentPassword=createPasswordInputController(),newPassword=createNewPasswordFieldsController(),listeners=new Set<()=>void>();
 let options=initial,dead=false,revision=0,pending:AbortController|undefined;
 let state:Readonly<PasswordChangeState>=Object.freeze({status:'idle',currentPasswordRequired:false,error:null});
 const publish=(patch:Partial<PasswordChangeState>)=>{if(dead)return;state=Object.freeze({...state,...patch});for(const listener of [...listeners])if(listeners.has(listener))try{listener();}catch{/* A view observer cannot interrupt credential cleanup or command progress. */}};
 const clearModels=()=>{for(const clear of [()=>currentPassword.markCleared(),()=>newPassword.clear()])try{clear();}catch{/* Visibility observers cannot stop the remaining cleanup. */}};
 const suspend=()=>{if(dead)return;revision++;pending?.abort();pending=undefined;clearModels();if(state.status==='submitting')publish({status:'unknown'});};
 const validateCurrentPassword=(value:string)=>{if(dead)return false;publish({currentPasswordRequired:!value});return !!value;};
 return Object.freeze({auth,currentPassword,newPassword,getState:()=>state,subscribe(listener:()=>void){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},validateCurrentPassword,
  clearCurrentPasswordError(){if(state.currentPasswordRequired)publish({currentPasswordRequired:false});},
  async submit(credentials:PasswordChangeCredentials){
   try{
    if(dead||pending||state.status!=='idle')return;
    if(!validateCurrentPassword(credentials.current_password))return;
    if(auth.getState().status!=='authenticated'){publish({status:'reauthenticate'});return;}
    if(auth.getState().busy)return;
    const epoch=++revision,abort=new AbortController();pending=abort;publish({status:'submitting',error:null});
    if(dead||epoch!==revision)return;
    try{
     let result:Promise<void>;
     try{result=auth.changePassword(credentials,{signal:abort.signal});}finally{credentials.current_password='';credentials.new_password='';clearModels();}
     await result;if(dead||epoch!==revision)return;publish({status:'changed'});
     try{void Promise.resolve(options.onChanged?.()).catch(()=>{});}catch{/* Host navigation does not change the committed fact. */}
    }catch(value){
     if(dead||epoch!==revision)return;
     const error=isHttpError(value)?new HttpError(value.kind,value.metadata):new HttpError('parse',{attempts:0,endpointId:'auth.password'});
     const status=error.status===503&&error.code===50302?'changed':auth.getState().status!=='authenticated'&&(error.status===401||error.status===409)?'reauthenticate':(error.kind==='parse'&&error.metadata.attempts===0&&auth.getState().status==='authenticated'||isPasswordChangeRejection(error))?'idle':'unknown';
     publish({status,error});
    }finally{if(epoch===revision)pending=undefined;}
   }finally{credentials.current_password='';credentials.new_password='';}
  },suspend,update(next:Partial<Pick<PasswordChangeOptions,'onChanged'>>){if(!dead)options={...options,...next};},
  destroy(){if(dead)return;suspend();dead=true;listeners.clear();options={auth};currentPassword.destroy();newPassword.destroy();},
 });
}
