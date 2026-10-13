import {parsePasswordPolicy,countPasswordCodePoints,validateNewPassword,getNewPasswordErrorMessage,newPasswordLabels,createPasswordStrengthController,getPasswordStrengthMessage,getPasswordStrengthSummary,type PasswordPolicy,type NewPasswordLabels} from './password.js';
import {generateDomId} from './dom-id.js';
import {createDisclosureController} from './dom.js';

export interface NewPasswordFieldsOptions {policy:PasswordPolicy|null;disabled?:boolean;labels?:Partial<NewPasswordLabels>;document?:Document}
/** 原生公共组合与 React 共用策略、计数和错误合同；密码只留在原生输入中。 */
export function createNewPasswordFields(options:NewPasswordFieldsOptions){
  const doc=options.document??document,labels={...newPasswordLabels,...options.labels},element=doc.createElement('div');
  element.className='xui-stack';
  let policy:PasswordPolicy|null=null,disabled=options.disabled??false,destroyed=false;
  const fields=[labels.password,labels.confirmation].map(label=>{
    const root=doc.createElement('div'),name=doc.createElement('label'),input=doc.createElement('input'),help=doc.createElement('p'),error=doc.createElement('p');
    root.className='xui-field';name.className='xui-label';input.className='xui-input';help.className='xui-help';error.className='xui-error';
    input.id=generateDomId(doc,'password');name.htmlFor=input.id;name.textContent=label;const required=doc.createElement('span');required.setAttribute('aria-hidden','true');required.textContent=' *';name.append(required);input.type='password';input.autocomplete='new-password';input.required=true;
    help.id=`${input.id}-help`;error.id=`${input.id}-error`;root.append(name,input,help,error);element.append(root);
    return {input,help,error};
  });
  const count=doc.createElement('span');count.setAttribute('data-xui-password-count','');
  const strength=doc.createElement('span');strength.setAttribute('data-xui-password-strength','');strength.setAttribute('role','status');strength.setAttribute('aria-live','polite');
  const area=doc.createElement('div'),summary=doc.createElement('p'),disclosure=doc.createElement('div'),trigger=doc.createElement('button'),panel=doc.createElement('div'),advice=doc.createElement('p');area.className='xui-password-strength';summary.className='xui-help xui-password-strength-summary';const states:import('./password.js').PasswordStrengthState[]=[{status:'idle'},{status:'loading'},{status:'unavailable'},{status:'ready',score:0,level:'weak',hint:'common'},{status:'ready',score:2,level:'medium',hint:'personal'},{status:'ready',score:4,level:'strong',hint:'none'}];for(const state of states){const reserve=doc.createElement('span');reserve.className='xui-password-strength-reserve';reserve.setAttribute('aria-hidden','true');reserve.textContent='密码强度：'+(labels.strengthSummary??getPasswordStrengthSummary)(state);summary.append(reserve);}summary.append(strength);disclosure.className='xui-disclosure';trigger.type='button';trigger.className='xui-disclosure-trigger';trigger.textContent=labels.strengthAdvice??'改进建议';panel.className='xui-disclosure-body';advice.className='xui-help xui-password-strength-summary';for(const state of states){const reserve=doc.createElement('span');reserve.className='xui-password-strength-reserve';reserve.setAttribute('aria-hidden','true');reserve.textContent=(labels.strength??getPasswordStrengthMessage)(state)||'强度仅供参考，建议使用较长、不易猜测的密码。';advice.append(reserve);}const adviceText=doc.createElement('span');adviceText.setAttribute('data-xui-password-advice','');advice.append(adviceText);panel.append(advice);disclosure.append(trigger,panel);area.append(summary,disclosure);element.append(area);const disclosureOwner=createDisclosureController(trigger,panel);
  const showStrength=(state:import('./password.js').PasswordStrengthState)=>{strength.textContent='密码强度：'+(labels.strengthSummary??getPasswordStrengthSummary)(state);adviceText.textContent=(labels.strength??getPasswordStrengthMessage)(state)||'强度仅供参考，建议使用较长、不易猜测的密码。';};showStrength({status:'idle'});
  const strengthOwner=createPasswordStrengthController({readPassword:()=>{const value=fields[0].input.value;return countPasswordCodePoints(value)===null?null:value;},onChange:showStrength});
  const showCount=()=>{count.textContent=(labels.count??newPasswordLabels.count!)(countPasswordCodePoints(fields[0].input.value));};
  const clearErrors=()=>{for(const field of fields){field.error.textContent='';field.error.hidden=true;field.input.removeAttribute('aria-invalid');field.input.setAttribute('aria-describedby',field.help.id);}};
  const clear=()=>{for(const field of fields){field.input.value='';field.input.defaultValue='';}strengthOwner.clear();showStrength({status:'idle'});showCount();clearErrors();};
  const update=()=>{area.hidden=policy===null;for(const field of fields)field.input.disabled=disabled||policy===null;fields[0].help.textContent=policy?labels.length(policy.minimum_characters,policy.maximum_characters):labels.policyUnavailable;if(policy){fields[0].help.append(' ',count);showCount();}fields[1].help.hidden=true;clearErrors();};
  const setPolicy=(value:PasswordPolicy|null)=>{try{policy=value===null?null:parsePasswordPolicy(value);}catch{policy=null;}update();};
  const changed=(event:Event)=>{showCount();clearErrors();if(event.target===fields[0].input)strengthOwner.refresh();};for(const field of fields)field.input.addEventListener('input',changed);
  doc.defaultView?.addEventListener('pagehide',clear);setPolicy(options.policy);
  return Object.freeze({element,setPolicy,setDisabled(value:boolean){disabled=value;update();},clear,
    readValidatedPassword():string|null{if(destroyed||disabled)return null;const error=validateNewPassword(policy,fields[0].input.value,fields[1].input.value);showCount();clearErrors();if(error){const field=fields[error==='confirmation_mismatch'?1:0];field.error.textContent=getNewPasswordErrorMessage(error,policy,labels,countPasswordCodePoints(fields[0].input.value))??'';field.error.hidden=false;field.input.setAttribute('aria-invalid','true');field.input.setAttribute('aria-describedby',`${field.help.id} ${field.error.id}`);field.input.focus();return null;}return fields[0].input.value;},
    destroy(){if(destroyed)return;destroyed=true;strengthOwner.destroy();disclosureOwner.destroy();clear();doc.defaultView?.removeEventListener('pagehide',clear);for(const field of fields)field.input.removeEventListener('input',changed);element.remove();},
  });
}
