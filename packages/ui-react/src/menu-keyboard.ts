const menuKeyboardOwners=new WeakSet<HTMLElement>();
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
