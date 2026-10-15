import {createPopoverController,bindPressFeedback} from './dom.js';

export interface SelectControlBinding {element:HTMLSpanElement;trigger:HTMLButtonElement;update():void;destroy():void}
const owners=new WeakMap<HTMLSelectElement,SelectControlBinding>();
/** Keep the host's select as a hidden form/event bridge. Mount element or bind in place.
 * Call update after changing DOM values, options or attributes; no business state is owned here. */
export function bindSelectControl(select:HTMLSelectElement):SelectControlBinding{
  const prior=owners.get(select);if(prior){prior.update();return prior;}
  const doc=select.ownerDocument,element=doc.createElement('span'),trigger=doc.createElement('button'),label=doc.createElement('span'),popup=doc.createElement('div');
  const enclosingLabel=select.closest('label'),originalLabelFor=enclosingLabel?.getAttribute('for');
  const original={hidden:select.hidden,ariaHidden:select.getAttribute('aria-hidden'),id:select.id};
  element.className='xui-select-control';trigger.type='button';trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.className='xui-select';popup.className='xui-layer xui-floating xui-native-popup xui-select-popup xui-select-control-popup';popup.setAttribute('role','listbox');
  const icon=doc.createElementNS('http://www.w3.org/2000/svg','svg'),path=doc.createElementNS('http://www.w3.org/2000/svg','path');icon.setAttribute('class','xui-select-control-icon');icon.setAttribute('viewBox','0 0 20 20');icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');icon.setAttribute('fill','none');icon.setAttribute('stroke','currentColor');path.setAttribute('d','m1 6 9 8 9-8');icon.append(path);trigger.append(label,icon);
  if(select.parentNode)select.parentNode.insertBefore(element,select);element.append(select,trigger,popup);
  let dead=false,activeValue:string|null=null,search='',searchAt=0,signature='',bridgeClasses:string[]=[];let nodes:HTMLButtonElement[]=[],form:HTMLFormElement|null=null,labelProxy:HTMLSpanElement|undefined;
  const group=(item:HTMLOptionElement)=>item.parentElement?.tagName==='OPTGROUP'?item.parentElement as HTMLOptGroupElement:null;
  const reset=(event:Event)=>queueMicrotask(()=>{if(!dead&&!event.defaultPrevented)update();});
  const enabled=()=>nodes.filter(node=>!node.disabled);
  // Share actual HTML label text with both controls. Naming the popup from the
  // combobox does not carry its label, while a nested popup can pollute a wrapped label.
  const labelText=(node:Node):string=>{if(node===element)return '';if(node.nodeType===3)return node.textContent??'';if(node.nodeType===1){const item=node as HTMLElement;if(item.hidden||item.getAttribute('aria-hidden')==='true')return '';const style=doc.defaultView!.getComputedStyle(item);if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')return '';}return Array.from(node.childNodes).map(labelText).join('');};
  const syncName=()=>{
    const labels=Array.from(trigger.labels??[]);
    // Detached buttons can report no labels before mounting. A real wrapping
    // label is still known, provided its association targets this trigger.
    const wrapped=select.closest('label');
    if(!labels.length&&wrapped&&(!wrapped.hasAttribute('for')||wrapped.htmlFor===trigger.id))labels.push(wrapped);
    if(labels.length&&!trigger.getAttribute('aria-labelledby')&&!trigger.getAttribute('aria-label')){
      const labelledBy=labels.length===1?labels[0].getAttribute('aria-labelledby'):null,name=labels.length===1?labels[0].getAttribute('aria-label'):null;
      if(labelledBy)trigger.setAttribute('aria-labelledby',labelledBy);
      if(name)trigger.setAttribute('aria-label',name);
      if(!labelledBy&&!name){if(!labelProxy){labelProxy=doc.createElement('span');labelProxy.hidden=true;labelProxy.id=popup.id+'-label';element.append(labelProxy);}labelProxy.textContent=labels.map(labelText).join(' ').replace(/\s+/g,' ').trim();trigger.setAttribute('aria-labelledby',labelProxy.id);}
    }
    for(const name of ['aria-label','aria-labelledby']){const value=trigger.getAttribute(name);if(value===null)popup.removeAttribute(name);else popup.setAttribute(name,value);}
    if(!popup.getAttribute('aria-label')&&!popup.getAttribute('aria-labelledby')){if(!trigger.id)trigger.id=popup.id+'-trigger';popup.setAttribute('aria-labelledby',trigger.id);}
  };
  const highlight=(node:HTMLButtonElement|undefined)=>{nodes.forEach(item=>item.toggleAttribute('data-highlighted',item===node));if(node){activeValue=node.dataset.value!;node.focus();node.scrollIntoView({block:'nearest'});}};
  const controller=createPopoverController(trigger,popup,{onOpenChange:open=>{if(open)queueMicrotask(()=>{if(!dead&&controller.getOpen()&&!popup.contains(doc.activeElement))highlight(nodes.find(node=>node.getAttribute('aria-selected')==='true'&&!node.disabled)??enabled()[0]);});}});
  const change=(value:string)=>{if(dead||select.disabled)return;const option=Array.from(select.options).find(item=>item.value===value);if(!option||option.hidden||option.disabled||group(option)?.hidden||group(option)?.disabled)return;
    if(select.multiple)option.selected=!option.selected;else select.value=value;
    if(!select.multiple){controller.close();trigger.focus();}
    select.dispatchEvent(new doc.defaultView!.Event('input',{bubbles:true}));select.dispatchEvent(new doc.defaultView!.Event('change',{bubbles:true}));update();
  };
  const update=()=>{if(dead)return;if(form!==select.form){form?.removeEventListener('reset',reset);form=select.form;form?.addEventListener('reset',reset);}const hadFocus=popup.contains(doc.activeElement),bridgeFocused=doc.activeElement===select;select.hidden=true;select.setAttribute('aria-hidden','true');trigger.tabIndex=select.tabIndex;trigger.autofocus=select.autofocus;
    if(select.id){trigger.id=select.id;select.removeAttribute('id');}else if(!trigger.id&&original.id)trigger.id=original.id;
    trigger.classList.remove(...bridgeClasses);bridgeClasses=(select.className||'xui-select').split(/\s+/).filter(Boolean);trigger.classList.add(...bridgeClasses);trigger.disabled=select.disabled;
    for(const name of ['aria-label','aria-labelledby','aria-describedby','aria-invalid','title','data-control-size','aria-readonly']){const value=select.getAttribute(name);if(value===null)trigger.removeAttribute(name);else trigger.setAttribute(name,value);}
    if(enclosingLabel&&!originalLabelFor){if(!trigger.id)trigger.id=popup.id+'-trigger';enclosingLabel.htmlFor=trigger.id;}
    trigger.setAttribute('aria-required',String(select.required));popup.setAttribute('aria-multiselectable',String(select.multiple));syncName();
    label.textContent=Array.from(select.selectedOptions).map(item=>item.label).join(', ');
    const items=Array.from(select.options).filter(item=>!item.hidden&&!group(item)?.hidden),next=JSON.stringify(items.map(item=>[item.value,item.label,item.disabled,group(item)?.disabled,group(item)?.label]));
    if(next!==signature){signature=next;nodes=items.map(item=>{const node=doc.createElement('button');node.type='button';node.className='xui-menu-item';node.dataset.value=item.value;node.setAttribute('role','option');node.tabIndex=-1;node.textContent=item.label;node.disabled=item.disabled||item.parentElement?.tagName==='OPTGROUP'&&(item.parentElement as HTMLOptGroupElement).disabled;node.onclick=()=>change(item.value);return node;});popup.replaceChildren();const groups=new Map<HTMLOptGroupElement,HTMLDivElement>();nodes.forEach((node,index)=>{const parent=group(items[index]);if(!parent){popup.append(node);return;}let section=groups.get(parent);if(!section){section=doc.createElement('div');section.setAttribute('role','group');section.setAttribute('aria-label',parent.label);const title=doc.createElement('div');title.className='xui-help';title.textContent=parent.label;section.append(title);popup.append(section);groups.set(parent,section);}section.append(node);});}
    nodes.forEach((node,index)=>{node.setAttribute('aria-selected',String(items[index].selected));node.disabled=select.disabled||items[index].disabled||items[index].parentElement?.tagName==='OPTGROUP'&&(items[index].parentElement as HTMLOptGroupElement).disabled;});
    if(bridgeFocused&&!select.disabled)trigger.focus();
    if(select.disabled)controller.close();else if(hadFocus)highlight(nodes.find(node=>node.dataset.value===activeValue&&!node.disabled)??enabled()[0]);
  };
  const key=(event:KeyboardEvent)=>{if(dead||trigger.disabled||event.defaultPrevented||event.isComposing||event.ctrlKey||event.metaKey)return;const items=enabled();
    // Consume the owned popup's Escape before an enclosing React modal's
    // document listener can close both layers. A cancelled close keeps focus.
    if(event.key==='Escape'&&controller.getOpen()){event.preventDefault();event.stopPropagation();controller.close();if(!controller.getOpen())trigger.focus();return;}
    if(event.altKey&&event.key==='ArrowUp'){event.preventDefault();controller.close();trigger.focus();return;}
    if(event.key==='Tab'&&controller.getOpen()){controller.close();trigger.focus();return;}
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const wasOpen=controller.getOpen();if(!wasOpen)controller.open();const index=items.findIndex(node=>node.dataset.value===activeValue);highlight(event.key==='Home'?items[0]:event.key==='End'?items.at(-1):!wasOpen?(items.find(node=>node.getAttribute('aria-selected')==='true')??(event.key==='ArrowUp'?items.at(-1):items[0])):items[(index+(event.key==='ArrowUp'?-1:1)+items.length)%items.length]);}
    else if(event.key.length===1&&!event.altKey&&event.key!==' '){event.preventDefault();const now=Date.now();search=now-searchAt>700?event.key:search+event.key;searchAt=now;if(!controller.getOpen())controller.open();highlight(items.find(node=>node.textContent!.toLocaleLowerCase().startsWith(search.toLocaleLowerCase())));}
  };
  const invalid=(event:Event)=>{event.preventDefault();trigger.setAttribute('aria-invalid','true');trigger.focus();};
  element.addEventListener('keydown',key);select.addEventListener('change',update);select.addEventListener('invalid',invalid);const press=bindPressFeedback(element);update();
  const binding:SelectControlBinding={element,trigger,update,destroy(){if(dead)return;dead=true;form?.removeEventListener('reset',reset);controller.destroy();press();element.removeEventListener('keydown',key);select.removeEventListener('change',update);select.removeEventListener('invalid',invalid);owners.delete(select);select.hidden=original.hidden;if(original.ariaHidden===null)select.removeAttribute('aria-hidden');else select.setAttribute('aria-hidden',original.ariaHidden);if(enclosingLabel&&!originalLabelFor){if(originalLabelFor===null)enclosingLabel.removeAttribute('for');else enclosingLabel.setAttribute('for',originalLabelFor!);}if(trigger.id&&trigger.id!==popup.id+'-trigger')select.id=trigger.id;if(element.parentNode)element.parentNode.insertBefore(select,element);else select.remove();element.remove();}};owners.set(select,binding);return binding;
}
