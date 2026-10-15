import {observeDialogLayout} from './dialog-layout.js';
import {generateDomId} from './dom-id.js';
export interface ChangeDetails{reason:string;event?:Event;cancel:()=>void}
export interface DialogCloseDetails{reason:string;event?:Event}
export interface OpenOptions{restoreFocus?:boolean|((details:DialogCloseDetails)=>boolean);open?:boolean;defaultOpen?:boolean;onOpenChange?:(open:boolean,details:ChangeDetails)=>void;finalFocus?:HTMLElement|(()=>HTMLElement|null);initialFocus?:HTMLElement|(()=>HTMLElement|null)}
const disabled=(node:HTMLElement)=>node.matches(':disabled,[aria-disabled="true"]');
const focusable=(root:HTMLElement)=>Array.from(root.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,[tabindex]')).filter(node=>!disabled(node)&&node.tabIndex>=0&&!node.closest('[hidden]')&&node.getClientRects().length>0);
function change(node:HTMLElement,value:unknown,reason:string,event:Event|undefined,callback?: (details:ChangeDetails)=>void){
  let cancelled=false;const details={reason,event,cancel:()=>{cancelled=true;}};callback?.(details);
  const custom=new CustomEvent('xui:change',{bubbles:true,cancelable:true,detail:{value,reason,event}});
  if(!node.dispatchEvent(custom))cancelled=true;return !cancelled;
}
function restore(doc:Document,trigger:HTMLElement,finalFocus:OpenOptions['finalFocus'],guard?:(target:HTMLElement|null|undefined)=>boolean){
  const explicit=typeof finalFocus==='function'?finalFocus():finalFocus;
  const target=[explicit,trigger].find(node=>node?.isConnected&&!disabled(node)&&node.getClientRects().length>0);
  if(!guard||guard(target))target?.focus();
}
export function bindPressFeedback(root:HTMLElement){
  const pressed=new Set<HTMLElement>();
  const down=(event:KeyboardEvent)=>{const target=(event.target as HTMLElement).closest<HTMLElement>('.xui-button');if(target&&!disabled(target)&&!event.defaultPrevented&&(event.key==='Enter'||event.key===' '&&!(target.tagName==='A'&&target.hasAttribute('href')&&target.getAttribute('role')!=='button'))){target.dataset.pressed='true';pressed.add(target);}};
  const clear=()=>{pressed.forEach(node=>{delete node.dataset.pressed;});pressed.clear();};
  root.addEventListener('keydown',down);root.addEventListener('keyup',clear);root.addEventListener('focusout',clear);
  return()=>{root.removeEventListener('keydown',down);root.removeEventListener('keyup',clear);root.removeEventListener('focusout',clear);clear();};
}

export function createDisclosureController(trigger:HTMLElement,panel:HTMLElement,options:OpenOptions={}){
  let open=options.open??options.defaultOpen??false,dead=false;const controlled=options.open!==undefined;
  if(!panel.id)panel.id=generateDomId(panel.ownerDocument,'xui-disclosure');trigger.setAttribute('aria-controls',panel.id);
  let indicator:SVGSVGElement|undefined;
  if((trigger.classList.contains('xui-disclosure-trigger')||trigger.classList.contains('xui-search-toolbar-toggle'))&&!trigger.querySelector('.xui-disclosure-indicator')){
    indicator=trigger.ownerDocument.createElementNS('http://www.w3.org/2000/svg','svg');indicator.classList.add('xui-disclosure-indicator');indicator.setAttribute('viewBox','0 0 20 20');indicator.setAttribute('aria-hidden','true');indicator.setAttribute('focusable','false');indicator.setAttribute('fill','none');indicator.setAttribute('stroke','currentColor');indicator.setAttribute('stroke-width','var(--icon-stroke-width)');
    const path=trigger.ownerDocument.createElementNS(indicator.namespaceURI,'path');path.setAttribute('d','m5 7 5 5 5-5');indicator.append(path);trigger.append(indicator);
  }
  const syncOpen=(next:boolean)=>{if(dead)return;if(!next&&panel.contains(panel.ownerDocument.activeElement))trigger.focus();open=next;trigger.setAttribute('aria-expanded',String(open));panel.hidden=!open;};
  const request=(next:boolean,event?:Event)=>{if(dead||disabled(trigger)||next===open)return;if(change(trigger,next,'toggle',event,details=>options.onOpenChange?.(next,details))&&!controlled)syncOpen(next);};
  const click=(event:Event)=>request(!open,event);trigger.addEventListener('click',click);syncOpen(open);
  return {getOpen:()=>open,setOpen:(next:boolean)=>request(next),syncOpen,destroy(){if(dead)return;dead=true;trigger.removeEventListener('click',click);indicator?.remove();}};
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

const dialogStacks=new WeakMap<Document,HTMLDialogElement[]>();
export function createDialogController(dialog:HTMLDialogElement,trigger:HTMLElement,options:OpenOptions={}){
  const releaseLayout=observeDialogLayout(dialog);
  let dead=false,opened=false,shouldRestore=true,nativeClosing=false,focusVersion=0,nativeReturnFocus:Element|null=null,closeDetails:DialogCloseDetails={reason:'native'};const controlled=options.open!==undefined;trigger.setAttribute('aria-haspopup','dialog');if(dialog.id)trigger.setAttribute('aria-controls',dialog.id);
  const stack=dialogStacks.get(dialog.ownerDocument)??[];dialogStacks.set(dialog.ownerDocument,stack);const remove=()=>{const index=stack.indexOf(dialog);if(index>=0)stack.splice(index,1);};
  const finishClose=(nativeReturn=false)=>{
    if(dead||dialog.open||!opened)return;
    opened=false;remove();trigger.setAttribute('aria-expanded','false');
    const policy=typeof options.restoreFocus==='function'?options.restoreFocus(closeDetails):options.restoreFocus;
    if(policy===false||!shouldRestore)return;
    const doc=dialog.ownerDocument;
    restore(doc,trigger,options.finalFocus,target=>{
      const active=doc.activeElement,top=stack.at(-1);
      return !dead&&!dialog.open&&(active===doc.body||active===trigger||nativeReturn&&active===nativeReturnFocus||dialog.contains(active))&&(!top||!!target&&top.contains(target));
    });
  };
  const syncOpen=(next:boolean,details:DialogCloseDetails={reason:'imperative'})=>{
    if(dead)return;
    if(next&&!dialog.open){
      // syncOpen is the controlled owner's confirmed state. The request path
      // still rejects disabled triggers; another enabled action may open this dialog.
      // Resolve before showModal: its synchronous focusin can otherwise replace a
      // navigation owner's roving target before initialFocus gets to read it.
      const version=++focusVersion;
      const requested=typeof options.initialFocus==='function'?options.initialFocus():options.initialFocus;
      if(dead||dialog.open||version!==focusVersion)return;
      const initial=requested&&dialog.contains(requested)&&!disabled(requested)?requested:null;
      // Chromium's legacy dialog algorithm ignores autofocus on the dialog
      // itself. Give the captured descendant native autofocus directly. A
      // transient focus proxy also covers an explicit dialog-root target.
      const proxy=initial===dialog?dialog.ownerDocument.createElement('span'):null;
      if(proxy){proxy.tabIndex=-1;dialog.prepend(proxy);}
      const nativeTarget=proxy??initial;
      const autofocus=initial?Array.from(new Set([dialog,...Array.from(dialog.querySelectorAll<HTMLElement>('[autofocus]')),nativeTarget!])).map(node=>({node,value:node.getAttribute('autofocus')})):[];
      for(const {node} of autofocus)node.removeAttribute('autofocus');
      nativeTarget?.setAttribute('autofocus','');
      remove();stack.push(dialog);opened=true;shouldRestore=true;closeDetails={reason:'native'};
      try{
        // Safari does not focus a clicked button. Native close may therefore
        // restore another pre-dialog element before our close event runs.
        nativeReturnFocus=dialog.ownerDocument.activeElement;
        try{dialog.showModal();}catch(error){if(version===focusVersion){opened=false;remove();}throw error;}
        // A focus handler may close/reopen, destroy, or hand focus to another
        // owner. Do not override it, even if the new focus stays in this dialog.
        const active=dialog.ownerDocument.activeElement;
        if(initial&&!dead&&dialog.open&&version===focusVersion&&stack.at(-1)===dialog&&(active===nativeTarget||active===dialog)){
          const target=dialog.contains(initial)&&!disabled(initial)&&initial.getClientRects().length>0?initial:focusable(dialog)[0]??dialog;
          if(active!==target)target.focus();
        }
      }finally{
        for(const {node,value} of autofocus){if(value===null)node.removeAttribute('autofocus');else node.setAttribute('autofocus',value);}
        proxy?.remove();
      }
      // The hidden dialog has no layout budget. Resolve the existing scroll
      // owner before the first visible frame, after temporary focus nodes leave.
      releaseLayout.refresh();
    }else if(!next&&dialog.open){
      const version=++focusVersion;closeDetails=details;const active=dialog.ownerDocument.activeElement;shouldRestore=dialog.contains(active)||active===dialog.ownerDocument.body;remove();
      nativeClosing=true;
      try{dialog.close();}finally{nativeClosing=false;}
      // Complete restoration within this action. A queued native close event
      // must not overwrite focus selected by the host after close() returns.
      if(version===focusVersion)finishClose(true);
    }
    trigger.setAttribute('aria-expanded',String(dialog.open));
  };
  const request=(next:boolean,reason='imperative',event?:Event)=>{if(dead||next===dialog.open||(next&&disabled(trigger)))return;if(change(dialog,next,reason,event,details=>options.onOpenChange?.(next,details))&&!controlled)syncOpen(next,{reason,event});};
  const click=(event:Event)=>request(true,'trigger',event);
  const cancel=(event:Event)=>{event.preventDefault();if(event.target===dialog&&stack.at(-1)===dialog)request(false,'escape',event);};
  const closeClick=(event:MouseEvent)=>{const button=(event.target as HTMLElement).closest<HTMLElement>('[data-xui-close]');if(button&&button.closest('dialog')===dialog&&!disabled(button))request(false,'close',event);};
  // Option+Tab is WebKit's full-control traversal on macOS; its boundaries
  // belong to the same modal focus cycle as ordinary Tab.
  const key=(event:KeyboardEvent)=>{if(!dialog.open||stack.at(-1)!==dialog||event.defaultPrevented||event.key!=='Tab'||event.ctrlKey||event.metaKey)return;const targets=focusable(dialog),active=dialog.ownerDocument.activeElement;
    if(!targets.length){event.preventDefault();dialog.focus();return;}if(event.shiftKey&&active===targets[0]||!event.shiftKey&&active===targets.at(-1)||!dialog.contains(active)){event.preventDefault();(event.shiftKey?targets.at(-1):targets[0])?.focus();}};
  const closed=()=>finishClose(nativeClosing);
  trigger.addEventListener('click',click);dialog.addEventListener('cancel',cancel);dialog.addEventListener('click',closeClick);dialog.addEventListener('keydown',key);dialog.addEventListener('close',closed);
  try{syncOpen(options.open??options.defaultOpen??false);}catch(error){releaseLayout();trigger.removeEventListener('click',click);dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('click',closeClick);dialog.removeEventListener('keydown',key);dialog.removeEventListener('close',closed);throw error;}
  return {getOpen:()=>dialog.open,open:()=>request(true),close:(reason='imperative')=>request(false,reason),syncOpen,destroy(){if(dead)return;syncOpen(false,{reason:'destroy'});remove();dead=true;releaseLayout();trigger.removeEventListener('click',click);dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('click',closeClick);dialog.removeEventListener('keydown',key);dialog.removeEventListener('close',closed);}};
}

const popupStacks=new WeakMap<Document,HTMLElement[]>();
const menuKeyboardOwners=new WeakSet<HTMLElement>();
/** Project keyboard focus for menu engines whose :focus-visible heuristic stays in pointer mode.
 * Never moves focus or owns selection. One binding per menu; release restores touched attributes.
 */
export function bindMenuKeyboardFocus(popup:HTMLElement){
  if(menuKeyboardOwners.has(popup))throw new Error('A keyboard focus binding already owns this menu');
  menuKeyboardOwners.add(popup);
  let keyboard=false,dead=false;
  const touched=new Map<HTMLElement,string|null>(),doc=popup.ownerDocument;
  const ownItem=(target:EventTarget|null)=>{
    if(!target||typeof (target as Element).closest!=='function')return null;
    const item=(target as Element).closest<HTMLElement>('.xui-menu-item');
    return item?.closest('[role="menu"]')===popup?item:null;
  };
  const clear=()=>{for(const item of touched.keys())item.removeAttribute('data-keyboard-active');};
  const paint=()=>{
    if(dead)return;
    clear();const item=ownItem(doc.activeElement);
    if(keyboard&&item){if(!touched.has(item))touched.set(item,item.getAttribute('data-keyboard-active'));item.setAttribute('data-keyboard-active','true');}
  };
  const key=(event:KeyboardEvent)=>{
    if(event.defaultPrevented||event.isComposing||event.altKey||event.ctrlKey||event.metaKey||(event.target!==popup&&!ownItem(event.target)))return;
    if(event.key.length===1||['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.key)){keyboard=true;paint();}
  };
  const pointer=()=>{keyboard=false;clear();};
  const focus=(event:FocusEvent)=>{if(ownItem(event.target)?.matches(':focus-visible'))keyboard=true;paint();};
  const blur=(event:FocusEvent)=>{clear();if(!ownItem(event.relatedTarget))keyboard=false;};
  popup.addEventListener('keydown',key,true);popup.addEventListener('pointermove',pointer,true);popup.addEventListener('pointerdown',pointer,true);popup.addEventListener('focusin',focus);popup.addEventListener('focusout',blur);
  return ()=>{
    if(dead)return;dead=true;menuKeyboardOwners.delete(popup);
    popup.removeEventListener('keydown',key,true);popup.removeEventListener('pointermove',pointer,true);popup.removeEventListener('pointerdown',pointer,true);popup.removeEventListener('focusin',focus);popup.removeEventListener('focusout',blur);
    for(const [item,prior] of touched){if(prior===null)item.removeAttribute('data-keyboard-active');else item.setAttribute('data-keyboard-active',prior);}
  };
}

export function createPopoverController(trigger:HTMLElement,popup:HTMLElement,options:OpenOptions & {menu?:boolean;tooltip?:boolean;contextMenu?:boolean;submenu?:boolean}={}){
  let open=false,dead=false,touch=false;const doc=popup.ownerDocument,win=doc.defaultView!;const controlled=options.open!==undefined;
  const menu=!!(options.menu||options.contextMenu);
  const releaseKeyboard=menu?bindMenuKeyboardFocus(popup):()=>{};
  const priorHasPopup=trigger.getAttribute('aria-haspopup');
  const restoreMenuFocus=()=>restore(doc,trigger,options.finalFocus,target=>{const active=doc.activeElement,top=dialogStacks.get(doc)?.at(-1);return !dead&&!open&&(active===doc.body||active===trigger||popup.contains(active))&&(!top||!!target&&top.contains(target));});
  let contextPoint:{x:number;y:number}|null=null;
  if(!popup.id)popup.id=generateDomId(popup.ownerDocument,'xui-popup');popup.setAttribute('popover','manual');popup.hidden=false;
  if(options.tooltip){popup.setAttribute('role','tooltip');trigger.setAttribute('aria-describedby',[trigger.getAttribute('aria-describedby'),popup.id].filter(Boolean).join(' '));}
  else{if(!options.contextMenu)trigger.setAttribute('aria-controls',popup.id);if(menu){trigger.setAttribute('aria-haspopup','menu');popup.setAttribute('role','menu');}}
  const stack=popupStacks.get(doc)??[];popupStacks.set(doc,stack);
  // Resolve semantic CSS lengths (including rem/calc overrides) using a non-layout probe.
  const measure=doc.createElement('span');measure.setAttribute('aria-hidden','true');measure.style.cssText='position:fixed;visibility:hidden;pointer-events:none;inline-size:var(--layout-viewport-inset);block-size:var(--floating-offset);';
  const position=()=>{if(!open)return;const scrollTop=popup.scrollTop,scrollLeft=popup.scrollLeft;
    popup.style.position='fixed';popup.style.inset='auto';popup.style.margin='0';
    popup.append(measure);const lengths=measure.getBoundingClientRect();measure.remove();
    const inset=lengths.width,gap=lengths.height,viewport=win.visualViewport;
    const left=(viewport?.offsetLeft??0)+inset,top=(viewport?.offsetTop??0)+inset,right=(viewport?.offsetLeft??0)+(viewport?.width??win.innerWidth)-inset,bottom=(viewport?.offsetTop??0)+(viewport?.height??win.innerHeight)-inset;
    popup.style.maxWidth=`${Math.max(0,right-left)}px`;popup.style.setProperty('--anchor-width',`${trigger.getBoundingClientRect().width}px`);
    const anchor=trigger.getBoundingClientRect(),rtl=win.getComputedStyle(trigger).direction==='rtl';
    popup.style.maxHeight=`${Math.max(0,bottom-top)}px`;let box=popup.getBoundingClientRect();
    let x=rtl?anchor.right-box.width:anchor.left,y=anchor.bottom+gap,side='bottom';
    if(options.submenu){const end=rtl?anchor.left-box.width-gap:anchor.right+gap,start=rtl?anchor.right+gap:anchor.left-box.width-gap;x=end;if(x<left||x+box.width>right)x=start;side=x<anchor.left?'left':'right';y=anchor.top;}
    else if(contextPoint){x=contextPoint.x;y=contextPoint.y;}
    else {const below=Math.max(0,bottom-anchor.bottom-gap),above=Math.max(0,anchor.top-gap-top);const down=box.height<=below||below>=above;side=down?'bottom':'top';popup.style.maxHeight=`${down?below:above}px`;popup.style.setProperty('--available-height',`${down?below:above}px`);box=popup.getBoundingClientRect();x=rtl?anchor.right-box.width:anchor.left;y=down?anchor.bottom+gap:anchor.top-gap-box.height;}
    popup.dataset.side=side;popup.style.left=`${Math.max(left,Math.min(x,right-box.width))}px`;popup.style.top=`${Math.max(top,Math.min(y,bottom-box.height))}px`;
    // Measuring with a temporary viewport-sized cap must not clamp away the user's scroll position.
    popup.scrollTop=scrollTop;popup.scrollLeft=scrollLeft;
  };
  const syncOpen=(next:boolean)=>{if(dead||next===open)return;open=next;const index=stack.indexOf(popup);if(index>=0)stack.splice(index,1);if(open){popup.showPopover();stack.push(popup);position();}else{popup.hidePopover();}if(!options.tooltip&&!options.contextMenu)trigger.setAttribute('aria-expanded',String(open));};
  const request=(next:boolean,reason:string,event?:Event)=>{if(dead||(next&&disabled(trigger))||next===open)return;if(change(popup,next,reason,event,details=>options.onOpenChange?.(next,details))&&!controlled)syncOpen(next);};
  const items=()=>Array.from(popup.querySelectorAll<HTMLElement>('[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]')).filter(node=>!disabled(node)&&node.closest('[role="menu"]')===popup);
  const click=(event:Event)=>{if(options.contextMenu)return;request(!open,'trigger',event);if(open&&menu)items()[0]?.focus();};
  const context=(event:MouseEvent)=>{if(!options.contextMenu||event.defaultPrevented||disabled(trigger))return;event.preventDefault();contextPoint={x:event.clientX,y:event.clientY};request(true,'contextmenu',event);if(open){position();items()[0]?.focus();}};
  const pointer=(event:PointerEvent)=>{touch=event.pointerType==='touch';};
  const outside=(event:PointerEvent)=>{if(open&&!popup.contains(event.target as Node)&&!trigger.contains(event.target as Node))request(false,'outside',event);};
  const key=(event:KeyboardEvent)=>{touch=false;if(event.defaultPrevented)return;
    if(open&&event.key==='Escape'&&stack.at(-1)===popup&&(!dialogStacks.get(doc)?.at(-1)||dialogStacks.get(doc)!.at(-1)!.contains(popup))){event.preventDefault();event.stopPropagation();request(false,'escape',event);if(!open&&!options.tooltip)restoreMenuFocus();return;}
    if(options.contextMenu&&trigger.contains(event.target as Node)&&(event.key==='ContextMenu'||event.shiftKey&&event.key==='F10')){event.preventDefault();contextPoint=null;request(true,'keyboard',event);if(open)items()[0]?.focus();return;}
    if(!menu)return;
    const rtl=win.getComputedStyle(trigger).direction==='rtl';if(options.submenu&&event.target===trigger&&event.key===(rtl?'ArrowLeft':'ArrowRight')){event.preventDefault();request(true,'keyboard',event);if(open)items()[0]?.focus();return;}
    if(options.submenu&&open&&popup.contains(event.target as Node)&&event.key===(rtl?'ArrowRight':'ArrowLeft')){event.preventDefault();request(false,'keyboard',event);if(!open)restoreMenuFocus();return;}
    if(!options.contextMenu&&event.target===trigger&&(event.key==='ArrowDown'||event.key==='ArrowUp')){event.preventDefault();request(true,'keyboard',event);if(open)(event.key==='ArrowUp'?items().at(-1):items()[0])?.focus();return;}
    if(!open||!popup.contains(event.target as Node))return;
    if(event.key==='Tab'){request(false,'tab',event);return;}
    if((event.target as Element).closest('[role="menu"]')!==popup)return;
    const enabled=items(),current=enabled.indexOf(doc.activeElement as HTMLElement);
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?enabled.length-1:(current+(event.key==='ArrowDown'?1:-1)+enabled.length)%enabled.length;enabled[index]?.focus();}
  };
  const disabledClick=(event:MouseEvent)=>{const item=(event.target as HTMLElement).closest<HTMLElement>('[role^="menuitem"]');if(item&&disabled(item)){event.preventDefault();event.stopImmediatePropagation();}};
  const itemClick=(event:MouseEvent)=>{if(event.defaultPrevented)return;const item=(event.target as HTMLElement).closest<HTMLElement>('[role^="menuitem"]');if(item&&disabled(item)){event.preventDefault();event.stopImmediatePropagation();}else if(item&&menu&&(item.getAttribute('role')==='menuitem'&&item.getAttribute('aria-haspopup')!=='menu'||item.dataset.close==='true')){request(false,'select',event);if(!open)restoreMenuFocus();}};
  const scroll=(event:Event)=>{if(popup.contains(event.target as Node))return;if(options.contextMenu&&open)request(false,'scroll',event);else position();};
  const focus=()=>{if(options.tooltip&&!touch)request(true,'focus');};const blur=(event:FocusEvent)=>{if(open&&!popup.contains(event.relatedTarget as Node)&&options.tooltip)request(false,'blur',event);};
  const enter=(event:PointerEvent)=>{if(options.tooltip&&event.pointerType==='mouse')request(true,'hover',event);};const leave=(event:PointerEvent)=>{if(options.tooltip&&doc.activeElement!==trigger)request(false,'hover',event);};
  trigger.addEventListener('click',click);trigger.addEventListener('contextmenu',context);trigger.addEventListener('pointerdown',pointer);trigger.addEventListener('focus',focus);trigger.addEventListener('blur',blur);trigger.addEventListener('pointerenter',enter);trigger.addEventListener('pointerleave',leave);
  doc.addEventListener('pointerdown',outside);doc.addEventListener('keydown',key);popup.addEventListener('click',disabledClick,true);popup.addEventListener('click',itemClick);win.addEventListener('resize',position);doc.addEventListener('scroll',scroll,true);
  const resizeObserver=new win.ResizeObserver(position);resizeObserver.observe(trigger);resizeObserver.observe(popup);win.visualViewport?.addEventListener('resize',position);win.visualViewport?.addEventListener('scroll',position);
  if(!options.tooltip&&!options.contextMenu)trigger.setAttribute('aria-expanded','false');syncOpen(options.open??options.defaultOpen??false);
  return {getOpen:()=>open,open:()=>{contextPoint=null;request(true,'imperative');if(open&&menu)items()[0]?.focus();},close:()=>request(false,'imperative'),syncOpen,destroy(){if(dead)return;syncOpen(false);dead=true;releaseKeyboard();resizeObserver.disconnect();win.visualViewport?.removeEventListener('resize',position);win.visualViewport?.removeEventListener('scroll',position);if(options.contextMenu&&trigger.getAttribute('aria-haspopup')==='menu'){if(priorHasPopup===null)trigger.removeAttribute('aria-haspopup');else trigger.setAttribute('aria-haspopup',priorHasPopup);}trigger.removeEventListener('click',click);trigger.removeEventListener('contextmenu',context);trigger.removeEventListener('pointerdown',pointer);trigger.removeEventListener('focus',focus);trigger.removeEventListener('blur',blur);trigger.removeEventListener('pointerenter',enter);trigger.removeEventListener('pointerleave',leave);doc.removeEventListener('pointerdown',outside);doc.removeEventListener('keydown',key);popup.removeEventListener('click',disabledClick,true);popup.removeEventListener('click',itemClick);win.removeEventListener('resize',position);doc.removeEventListener('scroll',scroll,true);}};
}

export function createSheetController(dialog:HTMLDialogElement,trigger:HTMLElement,{side='end',...options}:OpenOptions&{side?:'start'|'end'|'top'|'bottom'}={}){if(!['start','end','top','bottom'].includes(side))throw new TypeError('Invalid sheet side');const prior=dialog.dataset.side,hadClass=dialog.classList.contains('xui-sheet');dialog.classList.add('xui-sheet');dialog.dataset.side=side;const controller=createDialogController(dialog,trigger,options);let dead=false;return {...controller,destroy(){if(dead)return;dead=true;controller.destroy();if(!hadClass)dialog.classList.remove('xui-sheet');if(prior===undefined)delete dialog.dataset.side;else dialog.dataset.side=prior;}};}
export function createAlertDialogController(dialog:HTMLDialogElement,trigger:HTMLElement,options:OpenOptions={}){const role=dialog.getAttribute('role'),hadClass=dialog.classList.contains('xui-alert-dialog');dialog.setAttribute('role','alertdialog');dialog.classList.add('xui-alert-dialog');const controller=createDialogController(dialog,trigger,{...options,initialFocus:options.initialFocus??(()=>dialog.querySelector<HTMLElement>('[data-xui-cancel]')??dialog)});let dead=false;return {...controller,destroy(){if(dead)return;dead=true;controller.destroy();if(role===null)dialog.removeAttribute('role');else dialog.setAttribute('role',role);if(!hadClass)dialog.classList.remove('xui-alert-dialog');}};}
export function createContextMenuController(trigger:HTMLElement,popup:HTMLElement,options:OpenOptions={}){return createPopoverController(trigger,popup,{...options,contextMenu:true,menu:true});}

export function createShellController(root:HTMLElement,options:OpenOptions={}){
  const trigger=root.querySelector<HTMLElement>('[data-xui-sidebar-toggle]')!,dialog=root.querySelector<HTMLDialogElement>('[data-xui-sidebar-dialog]')!,sidebar=root.querySelector<HTMLElement>('[data-xui-sidebar]')!,main=root.querySelector<HTMLElement>('main')!,slot=dialog.querySelector<HTMLElement>('[data-xui-sidebar-content]')!;
  if(!trigger||!dialog||!sidebar||!main||!slot)throw new Error('AppShell requires toggle, dialog, sidebar, content slot and main');
  const doc=root.ownerDocument,media=doc.defaultView!.matchMedia('(max-width: 47.999rem)');
  // Closed dialog descendants have no client rects. Snapshot structural menu
  // eligibility now; the dialog owner validates visibility after modal setup.
  const initialFocus=()=>{
    const eligible=(node:HTMLElement|null):node is HTMLElement=>!!node&&sidebar.contains(node)&&!disabled(node)&&!node.closest('[hidden],[inert]');
    const active=doc.activeElement as HTMLElement|null;
    if(eligible(active))return active;
    const menu=Array.from(sidebar.querySelectorAll<HTMLElement>('[data-menu-control]')).filter(eligible);
    const navigation=Array.from(sidebar.querySelectorAll<HTMLElement>('nav a[href],nav button,nav input,nav select,nav textarea,nav [tabindex]')).filter(eligible);
    return menu.find(node=>node.tabIndex===0)??menu.find(node=>node.getAttribute('aria-current')==='page')??menu[0]??navigation.find(node=>node.getAttribute('aria-current')==='page')??navigation.find(node=>node.tabIndex>=0)??dialog.querySelector<HTMLElement>('[data-xui-close]:not(:disabled):not([aria-disabled="true"])')??dialog;
  };
  // Initial controlled/default-open must see the same sidebar tree as a later
  // trigger opening, not an empty drawer while the sidebar is still outside.
  if(media.matches&&sidebar.parentNode!==slot)slot.append(sidebar);
  const control=createDialogController(dialog,trigger,{...options,initialFocus:options.initialFocus??initialFocus,finalFocus:options.finalFocus??(()=>media.matches?trigger:main)});
  const update=()=>{if(media.matches){if(sidebar.parentNode!==slot)slot.append(sidebar);}else{control.syncOpen(false);if(sidebar.parentNode!==root||sidebar.nextSibling!==main)root.insertBefore(sidebar,main);}};
  media.addEventListener('change',update);update();let dead=false;return {...control,destroy(){if(dead)return;dead=true;media.removeEventListener('change',update);control.destroy();root.insertBefore(sidebar,main);}};
}

export function createToastController(viewport:HTMLElement,options:{limit?:number;dismissLabel?:string}={}){
  const toasts=new Map<string,{node:HTMLElement;timer?:ReturnType<typeof setTimeout>;cleanup:()=>void}>();let dead=false;
  viewport.classList.add('xui-toast-viewport','xui-layer');viewport.tabIndex=-1;
  const close=(id:string)=>{const item=toasts.get(id);if(!item)return;const focused=item.node.contains(viewport.ownerDocument.activeElement);if(item.timer)clearTimeout(item.timer);item.cleanup();item.node.remove();toasts.delete(id);if(focused)viewport.focus();};
  return {add(message:{id?:string;title:string;description?:string;tone?:'info'|'success'|'warning'|'error';timeoutMs?:number}){
    if(dead)return '';let id=message.id;if(id==null){do{id=generateDomId(viewport.ownerDocument,'xui-toast');}while(toasts.has(id));}close(id);while(toasts.size>=Math.max(1,options.limit??5))close(toasts.keys().next().value!);
    const doc=viewport.ownerDocument,node=doc.createElement('div'),title=doc.createElement('strong'),description=doc.createElement('p'),button=doc.createElement('button');node.className='xui-toast';node.dataset.tone=message.tone??'info';node.setAttribute('role',message.tone==='error'?'alert':'status');title.textContent=message.title;description.textContent=message.description??'';button.type='button';button.className='xui-button';button.textContent=options.dismissLabel??'Dismiss notification';const clicked=()=>close(id);button.addEventListener('click',clicked);node.append(title,description,button);viewport.append(node);
    const now=()=>doc.defaultView!.performance.now();
    let remaining=message.timeoutMs,start=0;const item={node,timer:undefined as ReturnType<typeof setTimeout>|undefined,cleanup:()=>{button.removeEventListener('click',clicked);node.removeEventListener('pointerenter',pause);node.removeEventListener('pointerleave',resume);node.removeEventListener('focusin',pause);node.removeEventListener('focusout',focusOut);}};
    const pause=()=>{if(item.timer){clearTimeout(item.timer);item.timer=undefined;if(remaining!==undefined)remaining=Math.max(0,remaining-(now()-start));}};
    const resume=()=>{if(remaining!==undefined&&!item.timer&&!node.matches(':hover')&&!node.contains(doc.activeElement)){start=now();item.timer=setTimeout(()=>close(id),Math.max(0,remaining));}};
    const focusOut=()=>queueMicrotask(()=>{if(toasts.get(id)===item)resume();});
    node.addEventListener('pointerenter',pause);node.addEventListener('pointerleave',resume);node.addEventListener('focusin',pause);node.addEventListener('focusout',focusOut);toasts.set(id,item);resume();return id;
  },close,destroy(){dead=true;Array.from(toasts.keys()).forEach(close);}};
}

/** Native submenu popup must remain a descendant of its parent menu in DOM. */
export function createSubmenuController(trigger:HTMLElement,popup:HTMLElement,options:OpenOptions={}){const parent=trigger.closest<HTMLElement>('[role="menu"]');if(!parent||!parent.contains(popup))throw new TypeError('Submenu needs a parent menu and nested popup');const controller=createPopoverController(trigger,popup,{...options,menu:true,submenu:true});let dead=false;const parentClosing=(event:Event)=>{if((event as ToggleEvent).newState==='closed')controller.syncOpen(false);};parent.addEventListener('beforetoggle',parentClosing);return {...controller,destroy(){if(dead)return;dead=true;parent.removeEventListener('beforetoggle',parentClosing);controller.destroy();}};}

export {bindSelectControl,type SelectControlBinding} from './select-control.js';
export {bindTextareaAutoResize,type TextareaAutoResizeOptions,type TextareaAutoResizeBinding} from './textarea.js';
