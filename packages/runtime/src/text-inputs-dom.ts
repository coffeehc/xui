import {generateDomId} from './dom-id.js';
import {parseNumberDraft,stepNumber,validateNumberConstraints,validateNumberValue,type NumberInputConstraints} from './number-input.js';
export interface TextInputCommon {label:string;id?:string;name?:string;
 /** Associates the native input with an existing form ID, including a form outside this host. */
 form?:string;
 /** Space-separated additional description IDs; the control still owns its help/error IDs. */
 describedBy?:string;
 help?:string;error?:string;placeholder?:string;autoComplete?:string;required?:boolean;disabled?:boolean;readOnly?:boolean}

export interface SearchInputOptions extends TextInputCommon {value:string;onValueChange:(value:string)=>void;onSubmit?:(value:string)=>void;onClear?:()=>void;clearLabel?:string;clearOnEscape?:boolean}
/** Native password values are either host-controlled or kept only in input DOM. Addon nodes move into InputGroup and return to their caller-owned positions on release; replaced original host content returns when the controller is destroyed. */
export type PasswordInputOptions=TextInputCommon & ({value:string;onValueChange:(value:string)=>void}|{value?:never;onValueChange?:(value:string)=>void}) & {prefix?:HTMLElement;suffix?:HTMLElement;showLabel?:string;hideLabel?:string;onClear?:(reason:'clear'|'reset'|'pagehide'|'destroy')=>void};
export interface NumberInputOptions extends TextInputCommon,NumberInputConstraints {value:number|null;onValueChange:(value:number|null)=>void;onDraftChange?:(draft:string)=>void;onInvalidDraft?:(draft:string,error:string)=>void;incrementLabel?:string;decrementLabel?:string}
function validateTextValue(value:string):void {if(typeof value!=='string')throw new TypeError('Text input value must be a string');}
const owners=new WeakSet<HTMLElement>();
function shell(host:HTMLElement){
 if(owners.has(host))throw new Error('An input already owns this host');owners.add(host);const doc=host.ownerDocument,original=Array.from(host.childNodes),root=doc.createElement('div'),label=doc.createElement('label'),group=doc.createElement('div'),input=doc.createElement('input'),help=doc.createElement('p'),error=doc.createElement('p'),id=generateDomId(doc,'xui-input');root.className='xui-field';label.className='xui-label';group.className='xui-input-group';input.className='xui-input';help.className='xui-help';error.className='xui-error';group.append(input);root.append(label,group,help,error);host.replaceChildren(root);
 const sync=(options:TextInputCommon)=>{input.id=options.id??id;label.htmlFor=input.id;label.textContent=options.label;if(options.required){const marker=doc.createElement('span');marker.setAttribute('aria-hidden','true');marker.textContent=' *';label.append(marker);}input.name=options.name??'';if(options.form===undefined)input.removeAttribute('form');else input.setAttribute('form',options.form);input.placeholder=options.placeholder??'';input.autocomplete=(options.autoComplete??'') as AutoFill;input.disabled=!!options.disabled;input.readOnly=!!options.readOnly;input.required=!!options.required;help.id=`${input.id}-help`;error.id=`${input.id}-error`;help.textContent=options.help??'';help.hidden=!options.help;error.textContent=options.error??'';error.hidden=!options.error;input.setAttribute('aria-describedby',[options.help?help.id:'',options.error?error.id:'',options.describedBy??''].filter(Boolean).join(' '));input.setAttribute('aria-invalid',String(!!options.error));};
 const button=()=>{const node=doc.createElement('button');node.type='button';node.className='xui-input-action';group.append(node);return node;};
 return {input,root,group,help,error,doc,sync,button,destroy(ownedNodes:readonly Node[]=[]){
  const current=Array.from(host.childNodes);
  // Owned placeholders keep their positions without counting as caller replacement content.
  if(current.includes(root)&&current.every(node=>node===root||ownedNodes.includes(node)))host.replaceChildren(...current.flatMap(node=>node===root?original:[node]));else root.remove();
  owners.delete(host);
 }};
}
export function createSearchInput(host:HTMLElement,initial:SearchInputOptions){
 validateTextValue(initial.value);const view=shell(host),{input,doc}=view,button=view.button();let options=initial,dead=false,composing=false;input.type='search';
 const sync=()=>{if(dead)return;view.sync(options);if(input.value!==options.value)input.value=options.value;input.defaultValue=options.value;button.textContent='×';button.setAttribute('aria-label',options.clearLabel??'Clear search');button.disabled=!!options.disabled||!!options.readOnly;button.hidden=!options.value;};
 const clear=()=>{if(dead||options.disabled||options.readOnly)return;options.onValueChange('');options.onClear?.();sync();input.focus();};
 const change=()=>{if(!options.disabled&&!options.readOnly)options.onValueChange(input.value);sync();};
 const start=()=>{composing=true;},end=()=>{composing=false;};
 const key=(event:KeyboardEvent)=>{if(event.defaultPrevented)return;if(composing||event.isComposing||event.keyCode===229){if(event.key==='Enter')event.preventDefault();return;}if(event.key==='Enter'&&options.onSubmit&&!options.disabled){event.preventDefault();options.onSubmit(options.value);}if(event.key==='Escape'&&options.clearOnEscape&&options.value&&!options.disabled&&!options.readOnly){event.preventDefault();clear();}};
 let resetTimer:ReturnType<typeof setTimeout>|undefined;const reset=(event:Event)=>{if(event.target!==input.form)return;clearTimeout(resetTimer);resetTimer=setTimeout(()=>{if(!event.defaultPrevented)sync();},0);};input.addEventListener('input',change);input.addEventListener('keydown',key);input.addEventListener('compositionstart',start);input.addEventListener('compositionend',end);button.addEventListener('click',clear);doc.addEventListener('reset',reset,true);sync();
 return {element:view.root,input,update(next:Partial<SearchInputOptions>){if(dead)return;const merged={...options,...next};validateTextValue(merged.value);options=merged;sync();},destroy(){if(dead)return;dead=true;clearTimeout(resetTimer);input.removeEventListener('input',change);input.removeEventListener('keydown',key);input.removeEventListener('compositionstart',start);input.removeEventListener('compositionend',end);button.removeEventListener('click',clear);doc.removeEventListener('reset',reset,true);view.destroy();}};
}
/** Composes InputGroup markup once; update preserves input identity and addon ownership. */
export function createPasswordInput(host:HTMLElement,initial:PasswordInputOptions){
 const controlled=initial.value!==undefined;
 if(controlled){validateTextValue(initial.value!);if(typeof initial.onValueChange!=='function')throw new TypeError('Controlled password input requires onValueChange');}
 if(initial.prefix&&initial.prefix===initial.suffix)throw new TypeError('Password addons must be distinct nodes');for(const node of [initial.prefix,initial.suffix])if(node&&(node===host||node.contains(host)))throw new TypeError('Password addon cannot contain its host');
 // Direct children of the original host return through shell's content snapshot.
 type Slot={node:HTMLElement;wrapper:HTMLElement};
 const initialParents=new Map<HTMLElement,Node|null>();for(const node of [initial.prefix,initial.suffix])if(node)initialParents.set(node,node.parentNode);
 const view=shell(host),{input,doc}=view,button=view.button();let options:{[K in keyof PasswordInputOptions]:PasswordInputOptions[K]}=initial,dead=false,visible=false;
 const origins=new Map<HTMLElement,{parent:Node|null;anchor:Comment|null}>();
 const rememberOrigin=(node:HTMLElement,parent:Node|null=node.parentNode)=>{
  if(origins.has(node))return;
  let anchor:Comment|null=null;if(parent&&node.parentNode===parent){anchor=doc.createComment('xui-password-addon');parent.insertBefore(anchor,node);}
  origins.set(node,{parent,anchor});
 };
 for(const [node,parent] of initialParents)rememberOrigin(node,parent);
 const slots=new Map<'prefix'|'suffix',Slot>();
 const releaseSlot=(key:'prefix'|'suffix')=>{const slot=slots.get(key);if(!slot)return;if(slot.node.parentNode===slot.wrapper){slot.node.remove();const origin=origins.get(slot.node)!;if(origin.parent&&origin.anchor?.parentNode===origin.parent)origin.parent.insertBefore(slot.node,origin.anchor);}slot.wrapper.remove();slots.delete(key);};
 const syncSlots=()=>{
  // Capture caller locations before moving either node; a swap never owns an internal wrapper as its origin.
  for(const node of [options.prefix,options.suffix])if(node)rememberOrigin(node);
  for(const key of ['prefix','suffix'] as const)if(slots.get(key)?.node!==options[key])releaseSlot(key);
  for(const [node,origin] of origins)if(node!==options.prefix&&node!==options.suffix){origin.anchor?.remove();origins.delete(node);}
  for(const key of ['prefix','suffix'] as const){const node=options[key];if(!node||slots.get(key)?.node===node)continue;const wrapper=doc.createElement('span');wrapper.className='xui-input-addon';wrapper.append(node);view.group.insertBefore(wrapper,key==='prefix'?input:button);slots.set(key,{node,wrapper});}
 };
 input.type='password';button.classList.add('xui-password-toggle');
 const icon=doc.createElementNS('http://www.w3.org/2000/svg','svg'),outline=doc.createElementNS('http://www.w3.org/2000/svg','path'),pupil=doc.createElementNS('http://www.w3.org/2000/svg','circle');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('fill','none');icon.setAttribute('stroke','currentColor');icon.setAttribute('stroke-linecap','round');icon.setAttribute('stroke-linejoin','round');icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');pupil.setAttribute('cx','12');pupil.setAttribute('cy','12');pupil.setAttribute('r','3');icon.append(outline,pupil);button.append(icon);
 const sync=()=>{if(dead)return;view.sync(options);syncSlots();input.type=visible?'text':'password';if(controlled&&input.value!==options.value)input.value=options.value??'';if(controlled)input.defaultValue=options.value??'';outline.setAttribute('d',visible?'m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.7 10.7 0 0 1 12 5c5 0 9 7 9 7a20.5 20.5 0 0 1-3.1 3.9M6.1 6.1A23.6 23.6 0 0 0 3 12s4 7 9 7a10.4 10.4 0 0 0 5.1-1.4':'M3 12s4-7 9-7 9 7 9 7-4 7-9 7-9-7-9-7Z');pupil.style.display=visible?'none':'';button.setAttribute('aria-label',visible?(options.hideLabel??'Hide password'):(options.showLabel??'Show password'));button.setAttribute('aria-pressed',String(visible));button.disabled=!!options.disabled;};
 const erase=()=>{input.value='';input.defaultValue='';input.removeAttribute('value');input.type='password';visible=false;if(controlled)options={...options,value:''};};
 const clear=(reason:'clear'|'reset'|'pagehide'|'destroy')=>{erase();try{options.onValueChange?.('');options.onClear?.(reason);}finally{erase();if(!dead)sync();}};
 const pagehide=()=>{if(!dead)clear('pagehide');};
 const change=()=>{if(!options.disabled&&!options.readOnly)options.onValueChange?.(input.value);if(!input.value)visible=false;sync();};
 const down=(event:MouseEvent)=>event.preventDefault();
 const toggle=()=>{if(dead||options.disabled)return;const start=input.selectionStart,end=input.selectionEnd;visible=!visible;sync();if(start!==null&&end!==null)input.setSelectionRange(start,end);};
 let resetTimer:ReturnType<typeof setTimeout>|undefined;const reset=(event:Event)=>{if(event.target!==input.form)return;clearTimeout(resetTimer);resetTimer=setTimeout(()=>{if(dead||event.defaultPrevented)return;visible=false;if(controlled)sync();else clear('reset');},0);};
 input.addEventListener('input',change);button.addEventListener('mousedown',down);button.addEventListener('click',toggle);doc.defaultView?.addEventListener('pagehide',pagehide);doc.addEventListener('reset',reset,true);sync();
 return {element:view.root,input,clear(){if(!dead)clear('clear');},update(next:Partial<PasswordInputOptions>){if(dead)return;const merged={...options,...next};if((merged.value!==undefined)!==controlled)throw new TypeError('Password input control mode cannot change');if(controlled){validateTextValue(merged.value!);if(typeof merged.onValueChange!=='function')throw new TypeError('Controlled password input requires onValueChange');}if(merged.prefix&&merged.prefix===merged.suffix)throw new TypeError('Password addons must be distinct nodes');for(const node of [merged.prefix,merged.suffix])if(node&&(node===host||node.contains(host)||view.root.contains(node)&&!Array.from(slots.values()).some(slot=>slot.node===node)))throw new TypeError('Password addon cannot contain its host or input');options=merged;sync();},destroy(){if(dead)return;dead=true;clearTimeout(resetTimer);input.removeEventListener('input',change);button.removeEventListener('mousedown',down);button.removeEventListener('click',toggle);doc.defaultView?.removeEventListener('pagehide',pagehide);doc.removeEventListener('reset',reset,true);try{clear('destroy');}finally{view.destroy(Array.from(origins.values()).flatMap(origin=>origin.anchor?[origin.anchor]:[]));releaseSlot('prefix');releaseSlot('suffix');for(const origin of origins.values())origin.anchor?.remove();origins.clear();}}};
}
export function createNumberInput(host:HTMLElement,initial:NumberInputOptions){
 validateNumberValue(initial.value);validateNumberConstraints(initial);const view=shell(host),{input,doc}=view,minus=view.button(),plus=view.button();let options=initial,dead=false,composing=false;input.type='text';input.inputMode='decimal';input.setAttribute('role','spinbutton');input.value=options.value===null?'':String(options.value);
 let resetTimer:ReturnType<typeof setTimeout>|undefined;
 const sync=()=>{if(dead)return;view.sync(options);input.defaultValue=options.value===null?'':String(options.value);const parsed=parseNumberDraft(input.value,options);input.setCustomValidity(parsed.valid?'':parsed.error);for(const [name,value] of [['aria-valuemin',options.min],['aria-valuemax',options.max],['aria-valuenow',options.value]] as const){if(value===undefined||value===null)input.removeAttribute(name);else input.setAttribute(name,String(value));}minus.textContent='−';plus.textContent='+';minus.setAttribute('aria-label',options.decrementLabel??'Decrease value');plus.setAttribute('aria-label',options.incrementLabel??'Increase value');minus.disabled=plus.disabled=!!options.disabled||!!options.readOnly;};
 const commit=()=>{if(dead||options.disabled||options.readOnly||composing)return;const result=parseNumberDraft(input.value,options);input.setCustomValidity(result.valid?'':result.error);if(result.valid){if(!Object.is(result.value,options.value))options.onValueChange(result.value);}else options.onInvalidDraft?.(input.value,result.error);sync();};
 const move=(direction:1|-1)=>{if(dead||options.disabled||options.readOnly)return;const parsed=parseNumberDraft(input.value,options),next=stepNumber(parsed.valid?parsed.value:options.value,direction,options);input.value=next===null?'':String(next);input.setCustomValidity('');if(!Object.is(next,options.value))options.onValueChange(next);sync();input.focus();};
 // A new edit owns the draft even if a previous form reset is still queued.
 const change=()=>{clearTimeout(resetTimer);const parsed=parseNumberDraft(input.value,options);input.setCustomValidity(parsed.valid?'':parsed.error);if(!options.disabled&&!options.readOnly)options.onDraftChange?.(input.value);};const start=()=>{composing=true;},end=()=>{composing=false;};
 const key=(event:KeyboardEvent)=>{if(event.defaultPrevented)return;if(composing||event.isComposing||event.keyCode===229){if(event.key==='Enter')event.preventDefault();return;}if(event.key==='Enter'){event.preventDefault();commit();}else if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();move(event.key==='ArrowUp'?1:-1);}};
 const decrement=()=>move(-1),increment=()=>move(1),down=(event:MouseEvent)=>event.preventDefault();const reset=(event:Event)=>{if(event.target!==input.form)return;clearTimeout(resetTimer);resetTimer=setTimeout(()=>{if(dead||event.defaultPrevented)return;input.value=options.value===null?'':String(options.value);input.setCustomValidity('');sync();},0);};
 input.addEventListener('input',change);input.addEventListener('keydown',key);input.addEventListener('blur',commit);input.addEventListener('compositionstart',start);input.addEventListener('compositionend',end);minus.addEventListener('click',decrement);plus.addEventListener('click',increment);minus.addEventListener('mousedown',down);plus.addEventListener('mousedown',down);doc.addEventListener('reset',reset,true);sync();
 return {element:view.root,input,getDraft:()=>input.value,commit,update(next:Partial<NumberInputOptions>){if(dead)return;const merged={...options,...next};validateNumberValue(merged.value);validateNumberConstraints(merged);if(!Object.is(merged.value,options.value)){input.value=merged.value===null?'':String(merged.value);input.setCustomValidity('');}options=merged;sync();},destroy(){if(dead)return;dead=true;clearTimeout(resetTimer);input.removeEventListener('input',change);input.removeEventListener('keydown',key);input.removeEventListener('blur',commit);input.removeEventListener('compositionstart',start);input.removeEventListener('compositionend',end);minus.removeEventListener('click',decrement);plus.removeEventListener('click',increment);minus.removeEventListener('mousedown',down);plus.removeEventListener('mousedown',down);doc.removeEventListener('reset',reset,true);view.destroy();}};
}
