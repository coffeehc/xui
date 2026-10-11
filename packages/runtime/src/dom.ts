export interface ChangeDetails{reason:string;event?:Event;cancel:()=>void}
export interface OpenOptions{open?:boolean;defaultOpen?:boolean;onOpenChange?:(open:boolean,details:ChangeDetails)=>void;finalFocus?:HTMLElement|(()=>HTMLElement|null)}
const disabled=(node:HTMLElement)=>node.matches(':disabled,[aria-disabled="true"]');
const focusable=(root:HTMLElement)=>Array.from(root.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,[tabindex]')).filter(node=>!disabled(node)&&node.tabIndex>=0&&!node.closest('[hidden]')&&node.getClientRects().length>0);
function change(node:HTMLElement,value:unknown,reason:string,event:Event|undefined,callback?: (details:ChangeDetails)=>void){
  let cancelled=false;const details={reason,event,cancel:()=>{cancelled=true;}};callback?.(details);
  const custom=new CustomEvent('xui:change',{bubbles:true,cancelable:true,detail:{value,reason,event}});
  if(!node.dispatchEvent(custom))cancelled=true;return !cancelled;
}
function restore(doc:Document,trigger:HTMLElement,finalFocus:OpenOptions['finalFocus']){
  const explicit=typeof finalFocus==='function'?finalFocus():finalFocus;
  const target=[explicit,trigger].find(node=>node?.isConnected&&!disabled(node)&&node.getClientRects().length>0);
  target?.focus();
}
export function bindPressFeedback(root:HTMLElement){
  const pressed=new Set<HTMLElement>();
  const down=(event:KeyboardEvent)=>{const target=(event.target as HTMLElement).closest<HTMLElement>('.xui-button');if(target&&!disabled(target)&&!event.defaultPrevented&&(event.key==='Enter'||event.key===' ')){target.dataset.pressed='true';pressed.add(target);}};
  const clear=()=>{pressed.forEach(node=>{delete node.dataset.pressed;});pressed.clear();};
  root.addEventListener('keydown',down);root.addEventListener('keyup',clear);root.addEventListener('focusout',clear);
  return()=>{root.removeEventListener('keydown',down);root.removeEventListener('keyup',clear);root.removeEventListener('focusout',clear);clear();};
}

export function createDisclosureController(trigger:HTMLElement,panel:HTMLElement,options:OpenOptions={}){
  let open=options.open??options.defaultOpen??false,dead=false;const controlled=options.open!==undefined;
  if(!panel.id)panel.id=`xui-disclosure-${crypto.randomUUID()}`;trigger.setAttribute('aria-controls',panel.id);
  const syncOpen=(next:boolean)=>{if(dead)return;open=next;trigger.setAttribute('aria-expanded',String(open));panel.hidden=!open;};
  const request=(next:boolean,event?:Event)=>{if(dead||disabled(trigger)||next===open)return;if(change(trigger,next,'toggle',event,details=>options.onOpenChange?.(next,details))&&!controlled)syncOpen(next);};
  const click=(event:Event)=>request(!open,event);trigger.addEventListener('click',click);syncOpen(open);
  return {getOpen:()=>open,setOpen:(next:boolean)=>request(next),syncOpen,destroy(){dead=true;trigger.removeEventListener('click',click);}};
}

export function createTabsController(root:HTMLElement,options:{value?:string;defaultValue?:string;activateOnFocus?:boolean;loopFocus?:boolean;onValueChange?:(value:string,details:ChangeDetails)=>void}={}){
  let dead=false;const tabs=()=>Array.from(root.querySelectorAll<HTMLElement>('[role="tab"]')).filter(node=>node.closest('[role="tablist"]')===root);
  let value=options.value??options.defaultValue??tabs().find(node=>node.getAttribute('aria-selected')==='true')?.dataset.value??tabs().find(node=>!disabled(node))?.dataset.value??'';
  const syncValue=(next:string)=>{if(dead)return;value=next;for(const tab of tabs()){const active=tab.dataset.value===value;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;const panel=tab.ownerDocument.getElementById(tab.getAttribute('aria-controls')??'');if(panel)panel.hidden=!active;}};
  const request=(next:string,event?:Event)=>{const tab=tabs().find(node=>node.dataset.value===next);if(dead||!tab||disabled(tab)||next===value)return;if(change(root,next,event?'interaction':'imperative',event,details=>options.onValueChange?.(next,details))&&options.value===undefined)syncValue(next);};
  const move=(tab:HTMLElement,event:Event)=>{tabs().forEach(node=>{node.tabIndex=node===tab?0:-1;});tab.focus();if(options.activateOnFocus)request(tab.dataset.value??'',event);};
  const key=(event:KeyboardEvent)=>{if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;const all=tabs(),current=all.indexOf(root.ownerDocument.activeElement as HTMLElement);if(current<0)return;
    if(event.key==='Enter'||event.key===' '){event.preventDefault();request(all[current].dataset.value??'',event);return;}
    const vertical=root.getAttribute('aria-orientation')==='vertical',rtl=getComputedStyle(root).direction==='rtl';
    const previous=vertical?'ArrowUp':rtl?'ArrowRight':'ArrowLeft',next=vertical?'ArrowDown':rtl?'ArrowLeft':'ArrowRight';
    if(![previous,next,'Home','End'].includes(event.key))return;event.preventDefault();
    if(event.key==='Home'||event.key==='End'){const enabled=all.filter(node=>!disabled(node));const target=event.key==='Home'?enabled[0]:enabled.at(-1);if(target)move(target,event);return;}
    const step=event.key===next?1:-1;for(let distance=1;distance<=all.length;distance++){const index=current+distance*step;if(options.loopFocus===false&&(index<0||index>=all.length))return;const target=all[(index+all.length)%all.length];if(!disabled(target)){move(target,event);return;}}
  };
  const click=(event:MouseEvent)=>{const tab=(event.target as HTMLElement).closest<HTMLElement>('[role="tab"]');if(tab&&tab.closest('[role="tablist"]')===root){if(disabled(tab)){event.preventDefault();return;}request(tab.dataset.value??'',event);}};
  root.addEventListener('keydown',key);root.addEventListener('click',click);syncValue(value);
  return {getValue:()=>value,setValue:(next:string)=>request(next),syncValue,destroy(){dead=true;root.removeEventListener('keydown',key);root.removeEventListener('click',click);}};
}

export function createDialogController(dialog:HTMLDialogElement,trigger:HTMLElement,options:OpenOptions={}){
  let dead=false;const controlled=options.open!==undefined;trigger.setAttribute('aria-haspopup','dialog');if(dialog.id)trigger.setAttribute('aria-controls',dialog.id);
  const syncOpen=(next:boolean)=>{if(dead)return;if(next&&!dialog.open){if(disabled(trigger))return;dialog.showModal();}else if(!next&&dialog.open)dialog.close();trigger.setAttribute('aria-expanded',String(dialog.open));};
  const request=(next:boolean,reason='imperative',event?:Event)=>{if(dead||next===dialog.open||(next&&disabled(trigger)))return;if(change(dialog,next,reason,event,details=>options.onOpenChange?.(next,details))&&!controlled)syncOpen(next);};
  const click=(event:Event)=>request(true,'trigger',event);
  const cancel=(event:Event)=>{event.preventDefault();request(false,'escape',event);};
  const closeClick=(event:MouseEvent)=>{const button=(event.target as HTMLElement).closest<HTMLElement>('[data-xui-close]');if(button&&!disabled(button))request(false,'close',event);};
  const closed=()=>{if(dead)return;trigger.setAttribute('aria-expanded','false');restore(dialog.ownerDocument,trigger,options.finalFocus);};
  trigger.addEventListener('click',click);dialog.addEventListener('cancel',cancel);dialog.addEventListener('click',closeClick);dialog.addEventListener('close',closed);syncOpen(options.open??options.defaultOpen??false);
  return {getOpen:()=>dialog.open,open:()=>request(true),close:()=>request(false),syncOpen,destroy(){if(dead)return;syncOpen(false);dead=true;trigger.removeEventListener('click',click);dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('click',closeClick);dialog.removeEventListener('close',closed);}};
}

const popupStacks=new WeakMap<Document,HTMLElement[]>();
export function createPopoverController(trigger:HTMLElement,popup:HTMLElement,options:OpenOptions & {menu?:boolean;tooltip?:boolean}={}){
  let open=false,dead=false,touch=false;const doc=popup.ownerDocument,win=doc.defaultView!;const controlled=options.open!==undefined;
  if(!popup.id)popup.id=`xui-popup-${crypto.randomUUID()}`;popup.setAttribute('popover','manual');popup.hidden=false;
  if(options.tooltip){popup.setAttribute('role','tooltip');trigger.setAttribute('aria-describedby',[trigger.getAttribute('aria-describedby'),popup.id].filter(Boolean).join(' '));}
  else{trigger.setAttribute('aria-controls',popup.id);if(options.menu){trigger.setAttribute('aria-haspopup','menu');popup.setAttribute('role','menu');}}
  const stack=popupStacks.get(doc)??[];popupStacks.set(doc,stack);
  const position=()=>{if(!open)return;popup.style.position='fixed';popup.style.inset='auto';popup.style.marginInline='0';const anchor=trigger.getBoundingClientRect(),box=popup.getBoundingClientRect();const below=anchor.bottom+box.height<=win.innerHeight;popup.dataset.side=below?'bottom':'top';popup.style.left=`${Math.max(0,Math.min(anchor.left,win.innerWidth-box.width))}px`;popup.style.top=`${below?anchor.bottom:Math.max(0,anchor.top-box.height)}px`;};
  const syncOpen=(next:boolean)=>{if(dead||next===open)return;open=next;const index=stack.indexOf(popup);if(index>=0)stack.splice(index,1);if(open){popup.showPopover();stack.push(popup);position();}else{popup.hidePopover();}if(!options.tooltip)trigger.setAttribute('aria-expanded',String(open));};
  const request=(next:boolean,reason:string,event?:Event)=>{if(dead||(next&&disabled(trigger))||next===open)return;if(change(popup,next,reason,event,details=>options.onOpenChange?.(next,details))&&!controlled)syncOpen(next);};
  const items=()=>Array.from(popup.querySelectorAll<HTMLElement>('[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]')).filter(node=>!disabled(node));
  const click=(event:Event)=>{request(!open,'trigger',event);if(open&&options.menu)items()[0]?.focus();};
  const pointer=(event:PointerEvent)=>{touch=event.pointerType==='touch';};
  const outside=(event:PointerEvent)=>{if(open&&!popup.contains(event.target as Node)&&!trigger.contains(event.target as Node))request(false,'outside',event);};
  const key=(event:KeyboardEvent)=>{touch=false;if(event.defaultPrevented)return;
    if(open&&event.key==='Escape'&&stack.at(-1)===popup){event.preventDefault();event.stopPropagation();request(false,'escape',event);if(!open&&!options.tooltip)restore(doc,trigger,options.finalFocus);return;}
    if(!options.menu)return;
    if(event.target===trigger&&(event.key==='ArrowDown'||event.key==='ArrowUp')){event.preventDefault();request(true,'keyboard',event);if(open)(event.key==='ArrowUp'?items().at(-1):items()[0])?.focus();return;}
    if(!open||!popup.contains(event.target as Node))return;
    if(event.key==='Tab'){request(false,'tab',event);return;}
    const enabled=items(),current=enabled.indexOf(doc.activeElement as HTMLElement);
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?enabled.length-1:(current+(event.key==='ArrowDown'?1:-1)+enabled.length)%enabled.length;enabled[index]?.focus();}
  };
  const itemClick=(event:MouseEvent)=>{const item=(event.target as HTMLElement).closest<HTMLElement>('[role^="menuitem"]');if(item&&disabled(item)){event.preventDefault();event.stopImmediatePropagation();}else if(item&&options.menu&&(item.getAttribute('role')==='menuitem'||item.dataset.close==='true')){request(false,'select',event);if(!open)restore(doc,trigger,options.finalFocus);}};
  const focus=()=>{if(options.tooltip&&!touch)request(true,'focus');};const blur=(event:FocusEvent)=>{if(open&&!popup.contains(event.relatedTarget as Node)&&options.tooltip)request(false,'blur',event);};
  const enter=(event:PointerEvent)=>{if(options.tooltip&&event.pointerType==='mouse')request(true,'hover',event);};const leave=(event:PointerEvent)=>{if(options.tooltip&&doc.activeElement!==trigger)request(false,'hover',event);};
  trigger.addEventListener('click',click);trigger.addEventListener('pointerdown',pointer);trigger.addEventListener('focus',focus);trigger.addEventListener('blur',blur);trigger.addEventListener('pointerenter',enter);trigger.addEventListener('pointerleave',leave);
  doc.addEventListener('pointerdown',outside);doc.addEventListener('keydown',key);popup.addEventListener('click',itemClick,true);win.addEventListener('resize',position);doc.addEventListener('scroll',position,true);
  if(!options.tooltip)trigger.setAttribute('aria-expanded','false');syncOpen(options.open??options.defaultOpen??false);
  return {getOpen:()=>open,open:()=>request(true,'imperative'),close:()=>request(false,'imperative'),syncOpen,destroy(){syncOpen(false);dead=true;trigger.removeEventListener('click',click);trigger.removeEventListener('pointerdown',pointer);trigger.removeEventListener('focus',focus);trigger.removeEventListener('blur',blur);trigger.removeEventListener('pointerenter',enter);trigger.removeEventListener('pointerleave',leave);doc.removeEventListener('pointerdown',outside);doc.removeEventListener('keydown',key);popup.removeEventListener('click',itemClick,true);win.removeEventListener('resize',position);doc.removeEventListener('scroll',position,true);}};
}

export function createShellController(root:HTMLElement,options:OpenOptions={}){
  const trigger=root.querySelector<HTMLElement>('[data-xui-sidebar-toggle]')!,dialog=root.querySelector<HTMLDialogElement>('[data-xui-sidebar-dialog]')!,sidebar=root.querySelector<HTMLElement>('[data-xui-sidebar]')!,main=root.querySelector<HTMLElement>('main')!,slot=dialog.querySelector<HTMLElement>('[data-xui-sidebar-content]')!;
  if(!trigger||!dialog||!sidebar||!main||!slot)throw new Error('AppShell requires toggle, dialog, sidebar, content slot and main');
  const media=root.ownerDocument.defaultView!.matchMedia('(max-width: 47.999rem)');
  const control=createDialogController(dialog,trigger,{...options,finalFocus:options.finalFocus??(()=>media.matches?trigger:main)});
  const update=()=>{if(media.matches)slot.append(sidebar);else{control.syncOpen(false);root.insertBefore(sidebar,main);}};
  media.addEventListener('change',update);update();return {...control,destroy(){media.removeEventListener('change',update);control.destroy();root.insertBefore(sidebar,main);}};
}

export function createToastController(viewport:HTMLElement,options:{limit?:number;dismissLabel?:string}={}){
  const toasts=new Map<string,{node:HTMLElement;timer?:ReturnType<typeof setTimeout>;cleanup:()=>void}>();let dead=false;
  viewport.classList.add('xui-toast-viewport','xui-layer');viewport.tabIndex=-1;
  const close=(id:string)=>{const item=toasts.get(id);if(!item)return;const focused=item.node.contains(viewport.ownerDocument.activeElement);if(item.timer)clearTimeout(item.timer);item.cleanup();item.node.remove();toasts.delete(id);if(focused)viewport.focus();};
  return {add(message:{id?:string;title:string;description?:string;tone?:'info'|'success'|'warning'|'error';timeoutMs?:number}){
    if(dead)return '';const id=message.id??crypto.randomUUID();close(id);while(toasts.size>=Math.max(1,options.limit??5))close(toasts.keys().next().value!);
    const doc=viewport.ownerDocument,node=doc.createElement('div'),title=doc.createElement('strong'),description=doc.createElement('p'),button=doc.createElement('button');node.className='xui-toast';node.dataset.tone=message.tone??'info';node.setAttribute('role',message.tone==='error'?'alert':'status');title.textContent=message.title;description.textContent=message.description??'';button.type='button';button.className='xui-button';button.textContent=options.dismissLabel??'Dismiss notification';const clicked=()=>close(id);button.addEventListener('click',clicked);node.append(title,description,button);viewport.append(node);
    let remaining=message.timeoutMs,start=0;const item={node,timer:undefined as ReturnType<typeof setTimeout>|undefined,cleanup:()=>{button.removeEventListener('click',clicked);node.removeEventListener('pointerenter',pause);node.removeEventListener('pointerleave',resume);node.removeEventListener('focusin',pause);node.removeEventListener('focusout',focusOut);}};
    const pause=()=>{if(item.timer){clearTimeout(item.timer);item.timer=undefined;if(remaining!==undefined)remaining=Math.max(0,remaining-(Date.now()-start));}};
    const resume=()=>{if(remaining!==undefined&&!item.timer&&!node.matches(':hover')&&!node.contains(doc.activeElement)){start=Date.now();item.timer=setTimeout(()=>close(id),Math.max(0,remaining));}};
    const focusOut=()=>queueMicrotask(()=>{if(toasts.get(id)===item)resume();});
    node.addEventListener('pointerenter',pause);node.addEventListener('pointerleave',resume);node.addEventListener('focusin',pause);node.addEventListener('focusout',focusOut);toasts.set(id,item);resume();return id;
  },close,destroy(){dead=true;Array.from(toasts.keys()).forEach(close);}};
}
