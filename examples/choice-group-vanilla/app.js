import {createCheckboxGroup,createRadioGroup} from '@coffeehc/xui-runtime/choice-group-dom';
import '@coffeehc/xui-theme/style.css';
const root=document.getElementById('root'),form=document.createElement('form'),checks=document.createElement('div'),radios=document.createElement('div'),output=document.createElement('output');output.className='xui-code';output.setAttribute('aria-label','State');root.className='xui-container';root.append(form);form.append(checks,radios);form.onsubmit=event=>event.preventDefault();
let value=['locked','unknown'],radio=null,requests=0,readOnly=false,accept=true,options=[{key:'read',label:'Read'},{key:'write',label:'Write'},{key:'locked',label:'Locked',disabled:true}];
const render=()=>{checkbox.update({value,options,readOnly});radioGroup.update({value:radio,options,readOnly});output.textContent=JSON.stringify({value,radio,requests});};
const checkbox=createCheckboxGroup(checks,{legend:'Permissions',name:'permissions',options,value,required:true,selectAll:'Select available',help:'Only current editable options are selected.',onValueChange:next=>{requests++;if(accept)value=next;render();}});
const radioGroup=createRadioGroup(radios,{legend:'Mode',name:'mode',options,value:radio,required:true,onValueChange:next=>{requests++;if(accept)radio=next;render();}});
for(const [label,action] of [['Toggle acceptance',()=>{accept=!accept;}],['Toggle readonly',()=>{readOnly=!readOnly;render();}],['Remove write',()=>{options=options.filter(option=>option.key!=='write');render();}]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=action;form.append(button);}
const reset=document.createElement('button');reset.type='reset';reset.textContent='Reset form';form.append(reset,output);render();
