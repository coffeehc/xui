const rowControlSelector='a,button,input,select,textarea,label,summary,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"],[role="checkbox"],[role="radio"],[role="switch"],[role="combobox"],[role="menuitem"],[role="option"],[role="slider"],[role="spinbutton"],[role="textbox"],[data-xui-row-action]';
/** React row-event boundary: ignore cancellation, nested tables and independent
 * cell controls (including open-shadow controls). Mark a host custom action
 * container with public data-xui-row-action; no stopPropagation is needed. */
export function isDataTableRowEvent(event:Pick<Event,'target'|'defaultPrevented'>&Partial<Pick<Event,'composedPath'>>,row:HTMLTableRowElement):boolean {
 if(event.defaultPrevented)return false;
 const node=event.target as Node|null,target=node?.nodeType===1?node as Element:node?.parentElement;
 if(!target||!row.contains(target)||target.closest('tr')!==row)return false;
 const control=target.closest(rowControlSelector);
 if(control&&row.contains(control))return false;
 for(const node of event.composedPath?.()??[]){
  if(node===row)break;
  if(typeof (node as Element).matches==='function'&&(node as Element).matches(rowControlSelector))return false;
 }
 return true;
}
