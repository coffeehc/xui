import {createPopoverController,bindPressFeedback} from './dom.js';

export interface SelectControlBinding {element:HTMLSpanElement;trigger:HTMLButtonElement;update():void;destroy():void}
const owners=new WeakMap<HTMLSelectElement,SelectControlBinding>();
/** Keep the host's select as a hidden form/event bridge. Mount element or bind in place.
 * Call update after changing DOM values, options or attributes; no business state is owned here. */
export function bindSelectControl(select:HTMLSelectElement):SelectControlBinding{
  const prior=owners.get(select);if(prior){prior.update();return prior;}
  const doc=select.ownerDocument,element=doc.createElement('span'),trigger=doc.createElement('button'),label=doc.createElement('span'),popup=doc.createElement('div');
  const enclosingLabel=select.closest('label'),originalLabelFor=enclosingLabel?.getAttribute('for');
  const original={hidden:select.hidden,tabIndex:select.getAttribute('tabindex'),id:select.id};
  element.className='xui-select-control';trigger.type='button';trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.className='xui-select';popup.className='xui-layer xui-floating xui-native-popup xui-select-popup xui-select-control-popup';popup.setAttribute('role','listbox');
  const icon=doc.createElementNS('http://www.w3.org/2000/svg','svg'),path=doc.createElementNS('http://www.w3.org/2000/svg','path');icon.setAttribute('class','xui-select-control-icon');icon.setAttribute('viewBox','0 0 20 20');icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');icon.setAttribute('fill','none');icon.setAttribute('stroke','currentColor');path.setAttribute('d','m1 6 9 8 9-8');icon.append(path);trigger.append(label,icon);
  if(select.parentNode)select.parentNode.insertBefore(element,select);element.append(select,trigger,popup);
  let dead=false,activeValue:string|null=null,search='',searchAt=0,signature='',bridgeClasses:string[]=[];let nodes:HTMLButtonElement[]=[];
  const enabled=()=>nodes.filter(node=>!node.disabled);
  const highlight=(node:HTMLButtonElement|undefined)=>{nodes.forEach(item=>item.toggleAttribute('data-highlighted',item===node));if(node){activeValue=node.dataset.value!;node.focus();node.scrollIntoView({block:'nearest'});}};
  const controller=createPopoverController(trigger,popup,{onOpenChange:open=>{if(open)queueMicrotask(()=>{if(!dead&&controller.getOpen()&&!popup.contains(doc.activeElement))highlight(nodes.find(node=>node.getAttribute('aria-selected')==='true'&&!node.disabled)??enabled()[0]);});}});
  const change=(value:string)=>{if(dead||select.disabled)return;const option=Array.from(select.options).find(item=>item.value===value);if(!option||option.disabled||option.parentElement instanceof doc.defaultView!.HTMLOptGroupElement&&option.parentElement.disabled)return;
    if(select.multiple)option.selected=!option.selected;else select.value=value;
    if(!select.multiple){controller.close();trigger.focus();}
    select.dispatchEvent(new doc.defaultView!.Event('input',{bubbles:true}));select.dispatchEvent(new doc.defaultView!.Event('change',{bubbles:true}));update();
  };
  const update=()=>{if(dead)return;const hadFocus=popup.contains(doc.activeElement);select.hidden=true;select.tabIndex=-1;
    if(select.id){trigger.id=select.id;select.removeAttribute('id');}else if(!trigger.id&&original.id)trigger.id=original.id;
    trigger.classList.remove(...bridgeClasses);bridgeClasses=(select.className||'xui-select').split(/\s+/).filter(Boolean);trigger.classList.add(...bridgeClasses);trigger.disabled=select.disabled;
    for(const name of ['aria-label','aria-labelledby','aria-describedby','aria-invalid','title','data-control-size','aria-readonly']){const value=select.getAttribute(name);if(value===null)trigger.removeAttribute(name);else trigger.setAttribute(name,value);}
    trigger.setAttribute('aria-required',String(select.required));popup.setAttribute('aria-multiselectable',String(select.multiple));const name=trigger.getAttribute('aria-label');if(name)popup.setAttribute('aria-label',name);else{popup.setAttribute('aria-labelledby',trigger.id||popup.id+'-trigger');if(!trigger.id)trigger.id=popup.id+'-trigger';}
    if(enclosingLabel&&!originalLabelFor){if(!trigger.id)trigger.id=popup.id+'-trigger';enclosingLabel.htmlFor=trigger.id;}
    label.textContent=Array.from(select.selectedOptions).map(item=>item.label).join(', ');
    const items=Array.from(select.options).filter(item=>!item.hidden),next=JSON.stringify(items.map(item=>[item.value,item.label,item.disabled,item.parentElement?.tagName==='OPTGROUP'&&(item.parentElement as HTMLOptGroupElement).disabled]));
    if(next!==signature){signature=next;nodes=items.map(item=>{const node=doc.createElement('button');node.type='button';node.className='xui-menu-item';node.dataset.value=item.value;node.setAttribute('role','option');node.tabIndex=-1;node.textContent=item.label;node.disabled=item.disabled||item.parentElement?.tagName==='OPTGROUP'&&(item.parentElement as HTMLOptGroupElement).disabled;node.onclick=()=>change(item.value);return node;});popup.replaceChildren(...nodes);}
    nodes.forEach((node,index)=>{node.setAttribute('aria-selected',String(items[index].selected));node.disabled=select.disabled||items[index].disabled||items[index].parentElement?.tagName==='OPTGROUP'&&(items[index].parentElement as HTMLOptGroupElement).disabled;});
    if(select.disabled)controller.close();else if(hadFocus)highlight(nodes.find(node=>node.dataset.value===activeValue&&!node.disabled)??enabled()[0]);
  };
  const key=(event:KeyboardEvent)=>{if(dead||trigger.disabled||event.defaultPrevented||event.isComposing||event.ctrlKey||event.metaKey)return;const items=enabled();
    if(event.key==='Tab'&&controller.getOpen()){controller.close();trigger.focus();return;}
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const wasOpen=controller.getOpen();if(!wasOpen)controller.open();const index=items.findIndex(node=>node.dataset.value===activeValue);highlight(event.key==='Home'?items[0]:event.key==='End'?items.at(-1):!wasOpen?(items.find(node=>node.getAttribute('aria-selected')==='true')??(event.key==='ArrowUp'?items.at(-1):items[0])):items[(index+(event.key==='ArrowUp'?-1:1)+items.length)%items.length]);}
    else if(event.key.length===1&&!event.altKey&&event.key!==' '){event.preventDefault();const now=Date.now();search=now-searchAt>700?event.key:search+event.key;searchAt=now;if(!controller.getOpen())controller.open();highlight(items.find(node=>node.textContent!.toLocaleLowerCase().startsWith(search.toLocaleLowerCase())));}
  };
  const invalid=(event:Event)=>{event.preventDefault();trigger.setAttribute('aria-invalid','true');trigger.focus();};
  element.addEventListener('keydown',key);select.addEventListener('change',update);select.addEventListener('invalid',invalid);const press=bindPressFeedback(element);update();
  const binding:SelectControlBinding={element,trigger,update,destroy(){if(dead)return;dead=true;controller.destroy();press();element.removeEventListener('keydown',key);select.removeEventListener('change',update);select.removeEventListener('invalid',invalid);owners.delete(select);select.hidden=original.hidden;if(enclosingLabel&&!originalLabelFor)enclosingLabel.removeAttribute('for');if(original.tabIndex===null)select.removeAttribute('tabindex');else select.setAttribute('tabindex',original.tabIndex);if(trigger.id&&trigger.id!==popup.id+'-trigger')select.id=trigger.id;if(element.parentNode)element.parentNode.insertBefore(select,element);else select.remove();element.remove();}};owners.set(select,binding);return binding;
}
