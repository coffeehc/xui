import {generateDomId} from './dom-id.js';
import {createDisclosureController} from './dom.js';
import {getGroupedComboboxItems,type GroupedComboboxOptions,type GroupedComboboxItem} from './grouped-combobox.js';
export type {GroupedComboboxOptions,GroupedComboboxGroup,GroupedComboboxItem,GroupedComboboxPagination} from './grouped-combobox.js';
const owners=new WeakSet<HTMLElement>();
/** Native equivalent of GroupedCombobox; the host owns query, expanded groups and pages. */
export function createGroupedCombobox(root:HTMLElement,initial:GroupedComboboxOptions){
  getGroupedComboboxItems(initial.groups);
  if(owners.has(root))throw new Error('This root already owns a grouped combobox');
  owners.add(root);
  const doc=root.ownerDocument,original=Array.from(root.childNodes),oldClass=root.className,id=generateDomId(doc,'xui-grouped-combobox');
  const node=<K extends keyof HTMLElementTagNameMap>(tag:K,className='')=>{const element=doc.createElement(tag);element.className=className;return element;};
  const input=node('input','xui-input'),controls=node('div','xui-grouped-combobox-controls'),list=node('div','xui-option-list'),empty=node('p','xui-state'),pages=node('div','xui-grouped-combobox-pages');
  root.classList.add('xui-grouped-combobox');list.id=id;list.setAttribute('role','listbox');input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','true');input.setAttribute('aria-haspopup','listbox');input.setAttribute('aria-controls',id);input.autocomplete='off';controls.setAttribute('role','group');empty.setAttribute('role','status');root.replaceChildren(input,controls,list,empty,pages);
  let options={...initial},selected=options.value===undefined?options.defaultValue??null:options.value,active:string|null=null,dead=false,composing=false,groupNumber=0,optionNumber=0,visible:GroupedComboboxItem[]=[];
  type Entry={panel:HTMLDivElement;label:HTMLDivElement;button?:HTMLButtonElement;disclosure?:ReturnType<typeof createDisclosureController>;page:HTMLElement;previous:HTMLButtonElement;next:HTMLButtonElement;position:HTMLSpanElement;status:HTMLParagraphElement};
  const entries=new Map<string,Entry>(),optionNodes=new Map<string,HTMLDivElement>();
  const arrange=(parent:HTMLElement,children:HTMLElement[])=>{children.forEach((child,index)=>{if(parent.children[index]!==child)parent.insertBefore(child,parent.children[index]??null);});for(const child of Array.from(parent.children))if(!children.includes(child as HTMLElement))child.remove();};
  const highlight=()=>{
    const target=active&&optionNodes.get(active);if(target&&visible.some(item=>item.id===active&&!item.disabled)&&!options.disabled&&doc.activeElement===input)input.setAttribute('aria-activedescendant',target.id);else {active=null;input.removeAttribute('aria-activedescendant');}
    for(const [key,element] of optionNodes)element.toggleAttribute('data-highlighted',key===active);
  };
  const select=(key:string)=>{if(dead||options.disabled||!visible.some(item=>item.id===key&&!item.disabled))return;input.focus();if(selected===key)return;if(options.value===undefined)selected=key;options.onValueChange?.(key);if(!dead)render();};
  const requestPage=(key:string,step:number)=>{if(dead||options.disabled)return;const group=options.groups.find(group=>group.id===key),pagination=group?.pagination;if(!group||group.open===false||group.disabled||!pagination||pagination.disabled)return;const page=pagination.page+step;if(page>=1&&page<=pagination.pageCount)options.onPageChange?.(key,page);};
  const render=()=>{
    if(dead)return;visible=getGroupedComboboxItems(options.groups).visible;
    const focused=doc.activeElement as HTMLElement|null,hadFocus=root.contains(focused),focusedGroup=[...entries].find(([,entry])=>entry.page.contains(focused))?.[0];
    if(!composing&&input.value!==options.inputValue)input.value=options.inputValue;input.disabled=!!options.disabled;input.setAttribute('aria-label',options.label);list.setAttribute('aria-label',options.label);controls.setAttribute('aria-label',options.controlsLabel??'显示分组');
    const used=new Set<string>(),usedOptions=new Set<string>(),panels:HTMLElement[]=[],buttons:HTMLElement[]=[],pageNodes:HTMLElement[]=[];
    for(const group of options.groups){
      used.add(group.id);let entry=entries.get(group.id);
      if(!entry){const panel=node('div'),label=node('div','xui-command-group'),page=node('nav','xui-pagination'),previous=node('button','xui-button'),next=node('button','xui-button'),position=node('span'),status=node('p');panel.id=id+'-group-'+(++groupNumber);label.id=id+'-label-'+groupNumber;panel.setAttribute('role','group');panel.setAttribute('aria-labelledby',label.id);previous.type=next.type='button';position.setAttribute('aria-live','polite');status.setAttribute('role','status');page.append(previous,position,next);previous.onclick=()=>requestPage(group.id,-1);next.onclick=()=>requestPage(group.id,1);entry={panel,label,page,previous,next,position,status};entries.set(group.id,entry);}
      const {panel,label,page,previous,next,position,status}=entry;label.textContent=group.label;panel.hidden=group.open===false;group.busy?panel.setAttribute('aria-busy','true'):panel.removeAttribute('aria-busy');
      if(group.open!==undefined){
        if(!entry.button){const button=node('button','xui-disclosure-trigger'),text=node('span','xui-disclosure-label');button.type='button';button.append(text);entry.button=button;entry.disclosure=createDisclosureController(button,panel,{open:group.open,onOpenChange:open=>{if(!dead)options.onGroupOpenChange?.(group.id,open);}});}
        entry.button.firstElementChild!.textContent=group.label;entry.button.disabled=!!options.disabled||!!group.disabled;entry.disclosure!.syncOpen(group.open);buttons.push(entry.button);
      }else if(entry.button){entry.disclosure?.destroy();entry.button.remove();entry.button=undefined;entry.disclosure=undefined;}
      const children:HTMLElement[]=[label];
      if(group.open!==false)for(const item of group.items){usedOptions.add(item.id);let option=optionNodes.get(item.id);if(!option){option=node('div','xui-menu-item');option.id=id+'-item-'+(++optionNumber);option.setAttribute('role','option');option.onmousedown=event=>event.preventDefault();option.onclick=()=>select(item.id);optionNodes.set(item.id,option);}option.textContent=item.label;option.setAttribute('aria-selected',String(selected===item.id));option.setAttribute('aria-disabled',String(!!options.disabled||!!group.disabled||!!item.disabled));children.push(option);}
      arrange(panel,children);panels.push(panel);
      if(group.open!==false){
        if(group.items.length===0&&group.emptyLabel){status.textContent=group.label+'：'+group.emptyLabel;pageNodes.push(status);}
        if(group.pagination){const pagination=group.pagination;page.setAttribute('aria-label',group.label+'分页');previous.textContent=pagination.previousLabel??group.label+'上一页';next.textContent=pagination.nextLabel??group.label+'下一页';previous.disabled=!!options.disabled||!!group.disabled||!!pagination.disabled||pagination.page===1;next.disabled=!!options.disabled||!!group.disabled||!!pagination.disabled||pagination.page===pagination.pageCount;position.textContent=pagination.page+' / '+pagination.pageCount;pageNodes.push(page);}
      }
    }
    arrange(list,panels);arrange(controls,buttons);controls.hidden=buttons.length===0;arrange(pages,pageNodes);
    for(const [key,entry] of entries)if(!used.has(key)){entry.disclosure?.destroy();entries.delete(key);}
    for(const [key] of optionNodes)if(!usedOptions.has(key))optionNodes.delete(key);
    empty.hidden=visible.length>0||options.groups.some(group=>group.open!==false&&(group.busy||!!group.emptyLabel));empty.textContent=options.emptyLabel??'没有匹配项';
    if(hadFocus&&focused&&root.contains(focused)===false&&doc.activeElement===doc.body){const entry=focusedGroup?entries.get(focusedGroup):undefined;(entry?.button&&!entry.button.disabled?entry.button:input).focus();}
    highlight();
  };
  const changed=()=>{if(dead||options.disabled||composing)return;active=null;highlight();options.onInputValueChange?.(input.value);if(!dead)input.value=options.inputValue;};
  const key=(event:KeyboardEvent)=>{
    if(dead||options.disabled||event.isComposing||composing||event.defaultPrevented||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey)return;
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const available=visible.filter(item=>!item.disabled),index=available.findIndex(item=>item.id===active),step=event.key==='ArrowDown'?1:-1;if(available.length){const next=index<0?(step===1?0:available.length-1):index+step;active=available[next]?.id??null;}highlight();if(active)optionNodes.get(active)?.scrollIntoView({block:'nearest'});}
    else if(event.key==='Enter'&&active){event.preventDefault();select(active);}
  };
  const blur=()=>{active=null;highlight();},pointer=()=>{active=null;highlight();},compositionStart=()=>{composing=true;},compositionEnd=()=>{composing=false;changed();};
  input.addEventListener('input',changed);input.addEventListener('keydown',key);input.addEventListener('blur',blur);input.addEventListener('compositionstart',compositionStart);input.addEventListener('compositionend',compositionEnd);list.addEventListener('pointermove',pointer);render();
  return {getElement:()=>root,getInput:()=>input,update(next:Partial<GroupedComboboxOptions>){if(dead)return;const candidate={...options,...next};getGroupedComboboxItems(candidate.groups);if(candidate.inputValue!==options.inputValue)active=null;options=candidate;if(options.value!==undefined)selected=options.value;render();},destroy(){if(dead)return;dead=true;for(const entry of entries.values())entry.disclosure?.destroy();input.removeEventListener('input',changed);input.removeEventListener('keydown',key);input.removeEventListener('blur',blur);input.removeEventListener('compositionstart',compositionStart);input.removeEventListener('compositionend',compositionEnd);list.removeEventListener('pointermove',pointer);root.replaceChildren(...original);root.className=oldClass;owners.delete(root);}};
}
