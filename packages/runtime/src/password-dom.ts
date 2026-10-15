import {countPasswordCodePoints,validateNewPassword,getNewPasswordErrorMessage,newPasswordLabels,createPasswordStrengthController,getPasswordStrengthSummary,type PasswordStrengthState,type NewPasswordLabels} from './password.js';
import {createPopoverController} from './dom.js';
import {createPasswordInput,type PasswordInputOptions} from './text-inputs-dom.js';

/** Adds one advisory meter to the ordinary native password input. */
export type PasswordStrengthInputOptions=PasswordInputOptions & {labels?:Partial<NewPasswordLabels>};
/** PasswordInput remains the only input/visibility/secret-cleanup owner; the worker receives transient reads. */
export function createPasswordStrengthInput(host:HTMLElement,initial:PasswordStrengthInputOptions){
 const doc=host.ownerDocument;let metadata={labels:initial.labels,onClear:initial.onClear},dead=false;
 const view=createPasswordInput(host,{...initial,onClear:reason=>{owner.clear();metadata.onClear?.(reason);}}),{input,element}=view;
 const meter=doc.createElement('meter'),status=doc.createElement('span');meter.className='xui-password-strength-meter';meter.setAttribute('data-xui-password-strength','');meter.setAttribute('role','meter');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','5');meter.min=0;meter.max=5;status.className='xui-password-strength-status';status.setAttribute('data-xui-password-strength-status','');status.setAttribute('role','status');status.setAttribute('aria-live','polite');element.insertBefore(meter,element.children[2]??null);element.append(status);
 const showStrength=(state:PasswordStrengthState)=>{const labels={...newPasswordLabels,...metadata.labels},summary=(labels.strengthSummary??getPasswordStrengthSummary)(state),level=state.status==='ready'?state.score+1:undefined;meter.dataset.state=state.status;meter.setAttribute('aria-label',labels.strengthLabel??newPasswordLabels.strengthLabel!);meter.setAttribute('aria-valuetext',summary);status.textContent=summary;if(state.status==='ready'){meter.setAttribute('aria-valuenow',String(level));meter.dataset.level=state.level;meter.value=level!;}else{meter.removeAttribute('aria-valuenow');delete meter.dataset.level;meter.value=0;}};
 const owner=createPasswordStrengthController({readPassword:()=>countPasswordCodePoints(input.value)===null?null:input.value,onChange:showStrength});
 const changed=()=>owner.refresh();input.addEventListener('input',changed);
 let resetTimer:ReturnType<typeof setTimeout>|undefined;const reset=(event:Event)=>{if(event.target!==input.form)return;clearTimeout(resetTimer);resetTimer=setTimeout(()=>{if(!dead&&!event.defaultPrevented)changed();},0);};doc.addEventListener('reset',reset,true);owner.refresh();
 return {element,input,clear:view.clear,
  update(next:Partial<PasswordStrengthInputOptions>){
   if(dead)return;
   view.update({...next,onClear:reason=>{owner.clear();metadata.onClear?.(reason);}});
   metadata={labels:'labels' in next?next.labels:metadata.labels,onClear:'onClear' in next?next.onClear:metadata.onClear};showStrength(owner.getState());if('value' in next)owner.refresh();
  },
  destroy(){if(dead)return;dead=true;clearTimeout(resetTimer);input.removeEventListener('input',changed);doc.removeEventListener('reset',reset,true);owner.destroy();view.destroy();},
 };
}
/** Keeps the existing tooltip position/dismiss lifecycle; only submit and invalid focus can open it. */
function createPasswordValidationTip(field:{input:HTMLInputElement;element:HTMLElement;update:(next:Partial<PasswordInputOptions>)=>void}){
 const {input,element}=field,popup=input.ownerDocument.createElement('div');let message:string|undefined,dead=false;
 element.classList.add('xui-password-validation-field');popup.className='xui-layer xui-floating xui-tooltip-popup xui-native-popup';popup.setAttribute('aria-hidden','true');element.append(popup);
 const owner=createPopoverController(input,popup,{tooltip:true,open:false,onOpenChange(next,details){if(!next&&details.reason!=='trigger'&&details.reason!=='hover')owner.syncOpen(false);}});
 const render=()=>{if(dead)return;field.update({error:message});if(input.disabled)owner.syncOpen(false);};
 const blur=()=>owner.syncOpen(false),focus=()=>{if(message&&!input.disabled)owner.syncOpen(true);},key=(event:KeyboardEvent)=>{if(event.key==='Escape'&&owner.getOpen()){event.preventDefault();owner.syncOpen(false);}};
 input.addEventListener('blur',blur);input.addEventListener('focus',focus);input.addEventListener('keydown',key);render();
 return {render,setMessage(next?:string){if(dead)return;message=next;popup.textContent=message??'';render();if(!message)owner.syncOpen(false);},show(){if(!dead&&message&&!input.disabled)owner.syncOpen(true);},destroy(){if(dead)return;dead=true;input.removeEventListener('blur',blur);input.removeEventListener('focus',focus);input.removeEventListener('keydown',key);owner.destroy();popup.remove();element.classList.remove('xui-password-validation-field');}};
}
/** Password and confirmation use the same fixed validation as React. Secrets remain in input DOM. */
export interface NewPasswordFieldsOptions {disabled?:boolean;labels?:Partial<NewPasswordLabels>;document?:Document}
/** Builds the public strength input plus an ordinary confirmation input; no policy IO or configuration exists. */
export function createNewPasswordFields(options:NewPasswordFieldsOptions={}){
 const doc=options.document??document,labels={...newPasswordLabels,...options.labels},element=doc.createElement('div'),passwordHost=doc.createElement('div'),confirmationHost=doc.createElement('div');element.className='xui-stack';element.append(passwordHost,confirmationHost);let disabled=options.disabled??false,destroyed=false;
 const clearErrors=()=>{passwordTip.setMessage();confirmationTip.setMessage();};
 const password=createPasswordStrengthInput(passwordHost,{label:labels.password,showLabel:labels.showPassword,hideLabel:labels.hidePassword,autoComplete:'new-password',required:true,disabled,labels,onClear:clearErrors}),confirmation=createPasswordInput(confirmationHost,{label:labels.confirmation,showLabel:labels.showPassword,hideLabel:labels.hidePassword,autoComplete:'new-password',required:true,disabled,onClear:clearErrors}),passwordTip=createPasswordValidationTip(password),confirmationTip=createPasswordValidationTip(confirmation);
 password.input.addEventListener('input',clearErrors);confirmation.input.addEventListener('input',clearErrors);
 const clear=()=>{if(destroyed)return;password.clear();confirmation.clear();clearErrors();};
 return Object.freeze({element,setDisabled(value:boolean){if(destroyed)return;disabled=value;password.update({disabled});confirmation.update({disabled});passwordTip.render();confirmationTip.render();},clear,
  readValidatedPassword():string|null{if(destroyed||disabled)return null;const error=validateNewPassword(password.input.value,confirmation.input.value);clearErrors();if(error){const field=error==='confirmation_mismatch'?confirmation:password,tip=error==='confirmation_mismatch'?confirmationTip:passwordTip;field.input.focus();tip.setMessage(getNewPasswordErrorMessage(error,labels,countPasswordCodePoints(password.input.value)));tip.show();return null;}return password.input.value;},
  destroy(){if(destroyed)return;destroyed=true;password.input.removeEventListener('input',clearErrors);confirmation.input.removeEventListener('input',clearErrors);passwordTip.destroy();confirmationTip.destroy();try{password.destroy();}finally{confirmation.destroy();element.remove();}},
 });
}
