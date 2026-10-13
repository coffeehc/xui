import {bindSelectControl} from './dom.js';
/** Locale facts stay with the host's existing i18n owner. Omission is disabled. */
export interface HeaderLocaleOption {value:string;label:string;disabled?:boolean}
export interface HeaderLocaleOptions {
  enabled:boolean;value:string;options:readonly HeaderLocaleOption[];
  onValueChange:(value:string)=>void;label?:string;disabled?:boolean;
}
export function isHeaderLocaleEnabled(locale?:HeaderLocaleOptions):locale is HeaderLocaleOptions{return locale?.enabled===true;}
type HeaderLocaleBinding={element:HTMLSpanElement;update:(next:HeaderLocaleOptions)=>void;destroy:()=>void};
const localeOwners=new WeakMap<HTMLSelectElement,HeaderLocaleBinding>();
/** A persistent native select. Mount element; updates keep the select and its focus.
 * Destroy removes this decoration/listener and unwraps the original select, retaining
 * the last host facts. A destroyed handle cannot update a later binding. */
export function bindHeaderLocaleSelect(select:HTMLSelectElement,initial:HeaderLocaleOptions):HeaderLocaleBinding{
  const existing=localeOwners.get(select);if(existing){existing.update(initial);return existing;}
  const doc=select.ownerDocument,element=doc.createElement('span'),icon=doc.createElementNS('http://www.w3.org/2000/svg','svg'),path=doc.createElementNS('http://www.w3.org/2000/svg','path');
  element.className='xui-header-locale-control';icon.setAttribute('class','xui-header-locale-icon');icon.setAttribute('viewBox','0 0 20 20');icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');icon.setAttribute('fill','none');icon.setAttribute('stroke','currentColor');path.setAttribute('d','m1 6 9 8 9-8');icon.append(path);
  if(select.parentNode)select.parentNode.insertBefore(element,select);element.append(select,icon);
  let options=initial,signature='',dead=false;
  const update=(next:HeaderLocaleOptions)=>{if(dead)return;options=next;select.classList.add('xui-select','xui-header-locale');select.setAttribute('aria-label',options.label??'语言');select.disabled=!options.enabled||!!options.disabled;
    const items=options.options,hasCurrent=items.some(item=>item.value===options.value),key=JSON.stringify([items,hasCurrent?null:options.value]);
    if(key!==signature){select.replaceChildren(...[...(hasCurrent?[]:[{value:options.value,label:'',disabled:true}]),...items].map(item=>{const node=doc.createElement('option');node.value=item.value;node.textContent=item.label;node.disabled=!!item.disabled;return node;}));signature=key;}
    select.value=options.value;
  };
  const change=()=>{if(dead)return;const next=select.value;select.value=options.value;if(options.enabled&&!options.disabled&&options.options.some(item=>item.value===next&&!item.disabled)&&next!==options.value)options.onValueChange(next);};
  const binding:HeaderLocaleBinding={element,update,destroy(){if(dead)return;dead=true;select.removeEventListener('change',change);localeOwners.delete(select);if(element.parentNode)element.parentNode.insertBefore(select,element);else select.remove();element.remove();select.classList.remove('xui-header-locale');}};
  update(initial);select.addEventListener('change',change);localeOwners.set(select,binding);return binding;
}

/** A themed, controlled choice. The hidden select is a form/event bridge only. */
export function createHeaderLocaleSelect(doc:Document,initial:HeaderLocaleOptions){
  const select=doc.createElement('select');let options=initial,dead=false;
  select.className='xui-select';
  const binding=bindSelectControl(select);binding.element.classList.add('xui-header-locale-control');binding.trigger.classList.add('xui-header-locale');
  const icon=binding.trigger.querySelector('svg')!;icon.classList.add('xui-header-locale-icon');binding.element.insertBefore(icon,binding.element.querySelector('[role="listbox"]'));
  binding.element.querySelector('[role="listbox"]')!.classList.add('xui-header-locale-popup');
  const update=(next:HeaderLocaleOptions)=>{if(dead)return;options=next;select.disabled=!next.enabled||!!next.disabled;select.setAttribute('aria-label',next.label??'语言');const known=next.options.some(item=>item.value===next.value);select.replaceChildren(...[...(known?[]:[{value:next.value,label:'',disabled:true}]),...next.options].map(item=>{const node=doc.createElement('option');node.value=item.value;node.textContent=item.label;node.disabled=!!item.disabled;node.hidden=!known&&item.value===next.value;return node;}));select.value=next.value;binding.update();};
  const change=()=>{if(dead)return;const next=select.value;select.value=options.value;binding.update();if(options.enabled&&!options.disabled&&next!==options.value&&options.options.some(item=>item.value===next&&!item.disabled))options.onValueChange(next);};
  select.addEventListener('change',change);update(initial);
  return {element:binding.element,trigger:binding.trigger,update,destroy(){if(dead)return;dead=true;select.removeEventListener('change',change);binding.destroy();select.remove();}};
}
