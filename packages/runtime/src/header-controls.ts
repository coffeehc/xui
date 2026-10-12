/** Locale facts stay with the host's existing i18n owner. Omission is disabled. */
export interface HeaderLocaleOption {value:string;label:string;disabled?:boolean}
export interface HeaderLocaleOptions {
  enabled:boolean;value:string;options:readonly HeaderLocaleOption[];
  onValueChange:(value:string)=>void;label?:string;disabled?:boolean;
}
export function isHeaderLocaleEnabled(locale?:HeaderLocaleOptions):locale is HeaderLocaleOptions{return locale?.enabled===true;}
/** A persistent native select; updates neither replace it nor dispatch a change. */
export function bindHeaderLocaleSelect(select:HTMLSelectElement,initial:HeaderLocaleOptions){
  let options=initial,signature='';
  const update=(next:HeaderLocaleOptions)=>{options=next;select.classList.add('xui-select','xui-header-locale');select.setAttribute('aria-label',options.label??'语言');select.disabled=!!options.disabled;
    const items=options.options,hasCurrent=items.some(item=>item.value===options.value),key=JSON.stringify([items,hasCurrent?null:options.value]);
    if(key!==signature){select.replaceChildren(...[...(hasCurrent?[]:[{value:options.value,label:'',disabled:true}]),...items].map(item=>{const node=select.ownerDocument.createElement('option');node.value=item.value;node.textContent=item.label;node.disabled=!!item.disabled;return node;}));signature=key;}
    select.value=options.value;
  };
  const change=()=>{const next=select.value;select.value=options.value;if(options.enabled&&!options.disabled&&options.options.some(item=>item.value===next&&!item.disabled)&&next!==options.value)options.onValueChange(next);};
  update(initial);select.addEventListener('change',change);
  return {update,destroy(){select.removeEventListener('change',change);}};
}
