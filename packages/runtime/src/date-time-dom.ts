import {createDateTimeModel,dateTimeDefaultLabels,type DateTimeOptions,type DateTimePickerLabels} from './date-time.js';
import {createCalendar} from './widgets-dom.js';
import {createPopoverController,bindSelectControl} from './dom.js';
import {generateDomId} from './dom-id.js';
import type {TextInputCommon} from './text-inputs-dom.js';

/** Native counterpart of DateTimePicker. The text input alone owns the form value. */
export interface NativeDateTimePickerOptions extends DateTimeOptions,TextInputCommon {labels?:Partial<DateTimePickerLabels>}
const owners=new WeakSet<HTMLElement>();
/** Composes the public Field/InputGroup, Calendar, select binding and Popover contracts. */
export function createDateTimePicker(host:HTMLElement,initial:NativeDateTimePickerOptions){
 if(owners.has(host))throw new Error('A date-time picker already owns this host');
 const model=createDateTimeModel(initial),doc=host.ownerDocument,original=Array.from(host.childNodes);
 const node=<K extends keyof HTMLElementTagNameMap>(tag:K,css:string)=>{const element=doc.createElement(tag);element.className=css;return element;};
 const root=node('div','xui-field'),label=node('label','xui-label'),group=node('div','xui-input-group'),input=node('input','xui-input'),help=node('p','xui-help'),error=node('p','xui-error');
 const button=(css='xui-button')=>{const element=node('button',css);element.type='button';return element;};
 const trigger=button('xui-input-action'),clear=button('xui-input-action'),popup=node('div','xui-layer xui-floating xui-popover-popup'),stack=node('div','xui-stack'),title=node('h2','xui-dialog-title'),calendarHost=node('div',''),times=node('div','xui-toolbar'),actions=node('div','xui-toolbar'),apply=button(),cancel=button();
 const feedback=node('div','xui-feedback-slot');feedback.setAttribute('aria-live','polite');feedback.append(error);
 const id=initial.id??generateDomId(doc,'xui-date-time');input.type='text';title.id=generateDomId(doc,'xui-date-time-title');title.tabIndex=-1;popup.setAttribute('role','dialog');popup.setAttribute('aria-labelledby',title.id);trigger.setAttribute('aria-haspopup','dialog');cancel.dataset.variant='outline';
 const timeField=(count:number)=>{const field=node('div','xui-field'),caption=node('label','xui-label'),select=node('select','xui-select');select.id=generateDomId(doc,'xui-date-time-part');caption.htmlFor=select.id;for(let i=0;i<count;i++){const option=doc.createElement('option');option.value=String(i);option.textContent=String(i).padStart(2,'0');select.append(option);}field.append(caption,select);times.append(field);return {caption,select};};
 const hours=timeField(24),minutes=timeField(60);group.append(input,trigger,clear);root.append(label,group,help,feedback);actions.append(apply,cancel);stack.append(title,calendarHost,times,actions);popup.append(stack);
 let options={...initial},dead=false,wasOpen=false,returnFocus=true,resetRevision=0;
 const calendar=createCalendar(calendarHost,{value:model.getState().date,month:model.getState().month,today:initial.today,locale:initial.locale,weekStartsOn:initial.weekStartsOn,onValueChange:value=>model.setDate(value as string|null),onMonthChange:month=>model.setMonth(month)});
 host.replaceChildren(root,popup);owners.add(host);
 const hourBinding=bindSelectControl(hours.select),minuteBinding=bindSelectControl(minutes.select);
 const popover=createPopoverController(trigger,popup,{open:false,onOpenChange:(next,details)=>{returnFocus=details.reason!=='outside'&&details.reason!=='scroll';if(next)model.open();else model.close();}});
 const render=()=>{
  if(dead)return;
  const state=model.getState(),labels={...dateTimeDefaultLabels,...options.labels},blocked=state.disabled||state.readOnly,hadFocus=popup.contains(doc.activeElement);
  input.id=options.id??id;input.name=options.name??'';label.htmlFor=input.id;label.textContent=options.label;
  if(state.required){const marker=doc.createElement('span');marker.setAttribute('aria-hidden','true');marker.textContent=' *';label.append(marker);}
  if(options.form===undefined)input.removeAttribute('form');else input.setAttribute('form',options.form);
  input.disabled=state.disabled;input.readOnly=state.readOnly;input.required=state.required;input.placeholder=options.placeholder??'YYYY-MM-DDTHH:mm';input.autocomplete=(options.autoComplete??'off') as AutoFill;
  if(input.value!==state.draft)input.value=state.draft;input.defaultValue=state.value??'';
  const message=options.error||(state.error?labels[state.error==='format'?'invalid':'required']:'');
  help.id=input.id+'-help';error.id=input.id+'-error';help.textContent=options.help??'';help.hidden=!options.help;error.textContent=message;error.hidden=!message;feedback.tabIndex=message?0:-1;feedback.hidden=!state.invalid&&!message;
  input.setAttribute('aria-describedby',[options.help?help.id:'',message?error.id:'',options.describedBy??''].filter(Boolean).join(' '));input.setAttribute('aria-invalid',String(!!message));
  input.setCustomValidity(options.error??(state.invalid?labels[state.invalid==='format'?'invalid':'required']:''));
  trigger.disabled=clear.disabled=blocked;trigger.textContent='选择';trigger.setAttribute('aria-label',labels.open+' '+options.label);clear.textContent='×';clear.setAttribute('aria-label',labels.clear+' '+options.label);clear.hidden=!state.draft&&!state.value;
  title.textContent=labels.title;calendarHost.setAttribute('aria-label',labels.date);hours.caption.textContent=labels.hour;minutes.caption.textContent=labels.minute;
  hours.select.disabled=minutes.select.disabled=blocked;hours.select.value=String(state.hour);minutes.select.value=String(state.minute);hourBinding.update();minuteBinding.update();
  calendar.update({value:state.date,month:state.month,disabled:blocked,today:options.today,locale:options.locale,weekStartsOn:options.weekStartsOn});
  apply.textContent=labels.apply;cancel.textContent=labels.cancel;apply.disabled=blocked||!state.date;
  popover.syncOpen(state.open);
  if(state.open&&!wasOpen)title.focus();
  if(!state.open&&wasOpen&&returnFocus&&hadFocus&&!state.disabled&&(doc.activeElement===doc.body||popup.contains(doc.activeElement)))(state.readOnly?input:trigger).focus();
  wasOpen=state.open;
 };
 const edit=()=>{resetRevision++;model.edit(input.value);},commit=()=>model.commit(),key=(event:KeyboardEvent)=>{if(event.defaultPrevented||event.isComposing)return;if(event.key==='Enter'){event.preventDefault();model.commit();}else if(event.key==='ArrowDown'&&event.altKey){event.preventDefault();returnFocus=true;model.open();}};
 const clearValue=()=>{input.focus();returnFocus=false;model.clear();},applyValue=()=>{returnFocus=true;model.apply();},close=()=>{returnFocus=true;model.close();};
 const changeHour=()=>model.setTime('hour',Number(hours.select.value)),changeMinute=()=>model.setTime('minute',Number(minutes.select.value));
 const reset=(event:Event)=>{if(event.target!==input.form)return;const revision=++resetRevision;queueMicrotask(()=>{if(!dead&&!event.defaultPrevented&&revision===resetRevision)model.resetDraft();});};
 input.addEventListener('input',edit);input.addEventListener('blur',commit);input.addEventListener('invalid',commit);input.addEventListener('keydown',key);clear.addEventListener('click',clearValue);apply.addEventListener('click',applyValue);cancel.addEventListener('click',close);hours.select.addEventListener('change',changeHour);minutes.select.addEventListener('change',changeMinute);doc.addEventListener('reset',reset,true);
 const off=model.subscribe(render);render();
 return {element:root,input,model,open(){returnFocus=true;model.open();},close,update(next:Partial<NativeDateTimePickerOptions>){if(dead)return;const previous=options;options={...options,...next};try{model.update(next);}catch(error){options=previous;throw error;}},destroy(){
  if(dead)return;dead=true;resetRevision++;off();doc.removeEventListener('reset',reset,true);input.removeEventListener('input',edit);input.removeEventListener('blur',commit);input.removeEventListener('invalid',commit);input.removeEventListener('keydown',key);clear.removeEventListener('click',clearValue);apply.removeEventListener('click',applyValue);cancel.removeEventListener('click',close);hours.select.removeEventListener('change',changeHour);minutes.select.removeEventListener('change',changeMinute);
  calendar.destroy();hourBinding.destroy();minuteBinding.destroy();popover.destroy();model.destroy();
  const children=Array.from(host.childNodes);if(children.every(child=>child===root||child===popup)&&children.includes(root))host.replaceChildren(...original);else{root.remove();popup.remove();}owners.delete(host);
 }};
}
