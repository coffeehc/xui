import {parsePasswordPolicy,countPasswordCodePoints,validateNewPassword,getNewPasswordErrorMessage,newPasswordLabels,type PasswordPolicy,type NewPasswordLabels} from './password.js';
import {generateDomId} from './dom-id.js';

export interface NewPasswordFieldsOptions {policy:PasswordPolicy|null;disabled?:boolean;labels?:Partial<NewPasswordLabels>;document?:Document}
/** 原生公共组合与 React 共用策略、计数和错误合同；密码只留在原生输入中。 */
export function createNewPasswordFields(options:NewPasswordFieldsOptions){
  const doc=options.document??document,labels={...newPasswordLabels,...options.labels},element=doc.createElement('div');
  let policy:PasswordPolicy|null=null,disabled=options.disabled??false,destroyed=false;
  const fields=[labels.password,labels.confirmation].map(label=>{
    const root=doc.createElement('div'),name=doc.createElement('label'),input=doc.createElement('input'),help=doc.createElement('p'),error=doc.createElement('p');
    root.className='xui-field';name.className='xui-label';input.className='xui-input';help.className='xui-help';error.className='xui-error';
    input.id=generateDomId(doc,'password');name.htmlFor=input.id;name.textContent=label;input.type='password';input.autocomplete='new-password';input.required=true;
    help.id=`${input.id}-help`;error.id=`${input.id}-error`;root.append(name,input,help,error);element.append(root);
    return {input,help,error};
  });
  const count=doc.createElement('span');count.setAttribute('data-xui-password-count','');
  const showCount=()=>{count.textContent=(labels.count??newPasswordLabels.count!)(countPasswordCodePoints(fields[0].input.value));};
  const clearErrors=()=>{for(const field of fields){field.error.textContent='';field.error.hidden=true;field.input.removeAttribute('aria-invalid');field.input.setAttribute('aria-describedby',field.help.id);}};
  const clear=()=>{for(const field of fields){field.input.value='';field.input.defaultValue='';}showCount();clearErrors();};
  const update=()=>{for(const field of fields)field.input.disabled=disabled||policy===null;fields[0].help.textContent=policy?labels.length(policy.minimum_characters,policy.maximum_characters):labels.policyUnavailable;if(policy){fields[0].help.append(' ',count);showCount();}fields[1].help.hidden=true;clearErrors();};
  const setPolicy=(value:PasswordPolicy|null)=>{try{policy=value===null?null:parsePasswordPolicy(value);}catch{policy=null;}update();};
  const changed=()=>{showCount();clearErrors();};for(const field of fields)field.input.addEventListener('input',changed);
  doc.defaultView?.addEventListener('pagehide',clear);setPolicy(options.policy);
  return Object.freeze({element,setPolicy,setDisabled(value:boolean){disabled=value;update();},clear,
    readValidatedPassword():string|null{if(destroyed||disabled)return null;const error=validateNewPassword(policy,fields[0].input.value,fields[1].input.value);showCount();clearErrors();if(error){const field=fields[error==='confirmation_mismatch'?1:0];field.error.textContent=getNewPasswordErrorMessage(error,policy,labels,countPasswordCodePoints(fields[0].input.value))??'';field.error.hidden=false;field.input.setAttribute('aria-invalid','true');field.input.setAttribute('aria-describedby',`${field.help.id} ${field.error.id}`);field.input.focus();return null;}return fields[0].input.value;},
    destroy(){if(destroyed)return;destroyed=true;clear();doc.defaultView?.removeEventListener('pagehide',clear);for(const field of fields)field.input.removeEventListener('input',changed);element.remove();},
  });
}
