import * as React from 'react';
/** DOM presentation only: never writes the persistent navigation Controller. */
export function useSidebarReveal(sidebar:HTMLElement|null,enabled:boolean,trigger:React.RefObject<HTMLButtonElement|null>){
 const [visible,setVisible]=React.useState(false),owner=React.useRef<{pointer:()=>void;focus:(target:EventTarget)=>void}|null>(null);
 React.useLayoutEffect(()=>{
  setVisible(false);if(!sidebar||!enabled)return;
  const doc=sidebar.ownerDocument,win=doc.defaultView;if(!win)return;
  const media=win.matchMedia('(hover: hover) and (pointer: fine)');
  let hovered=false,focused=false,shown=false,blocked=false,coarseInput=false,dead=false,timer:number|undefined,focusedNode:Node|null=null;
  const clear=()=>{if(timer!==undefined)win.clearTimeout(timer);timer=undefined;};
  const publish=(next:boolean)=>{if(dead||shown===next)return;shown=next;setVisible(next);};
  const contains=(node:EventTarget|null)=>node instanceof win.Node&&sidebar.contains(node);
  const removedFocus=new win.MutationObserver(()=>{if(focusedNode&&!focusedNode.isConnected){trackFocus(null);reconcile();}});
  const trackFocus=(node:EventTarget|null)=>{
   removedFocus.disconnect();focusedNode=node instanceof win.Node?node:null;focused=!!focusedNode;
   // Observe only the owned focus ancestry: removing a portal/slot must release preview.
   for(let parent=focusedNode?.parentNode;parent;parent=parent.parentNode)removedFocus.observe(parent,{childList:true});
  };
  const reconcile=()=>{
   clear();if(!media.matches){hovered=false;trackFocus(null);publish(false);return;}
   if(!blocked&&(hovered||focused)){publish(true);return;}
   // An interaction grace period bridges the real offset between trigger and portal.
   // It is not motion and must remain available under prefers-reduced-motion.
   const delay=win.getComputedStyle(sidebar).getPropertyValue('--nav-reveal-close-delay').trim(),amount=Number.parseFloat(delay),milliseconds=Number.isFinite(amount)?Math.max(0,amount*(delay.endsWith('ms')?1:1000)):0;
   timer=win.setTimeout(()=>{timer=undefined;if(!hovered&&!focused||blocked)publish(false);},milliseconds);
  };
  const pointer=(event:PointerEvent)=>{
   if(event.pointerType!=='mouse')return;
   const inside=contains(event.target);if(inside&&!contains(event.relatedTarget))blocked=false;
   hovered=inside;if(inside&&!blocked&&contains(doc.activeElement))trackFocus(doc.activeElement);reconcile();
  };
  const leave=(event:PointerEvent)=>{if(event.pointerType!=='mouse')return;hovered=contains(event.relatedTarget);reconcile();};
  const focus=(event:FocusEvent)=>{trackFocus(!coarseInput&&contains(event.target)?event.target:null);if(focused&&event.target!==trigger.current)blocked=false;reconcile();};
  const blur=(event:FocusEvent)=>{trackFocus(!coarseInput&&contains(event.relatedTarget)?event.relatedTarget:null);reconcile();};
  const input=(event:PointerEvent)=>{coarseInput=event.pointerType!=='mouse';};
  const key=(event:KeyboardEvent)=>{
   coarseInput=false;
   // The topmost portal owns Escape first. Its DOM is deliberately outside this aside.
   if(event.key!=='Escape'||event.defaultPrevented||!shown||!contains(event.target))return;
   event.preventDefault();blocked=true;hovered=false;trackFocus(null);clear();trigger.current?.focus({preventScroll:true});publish(false);
  };
  const reset=()=>{clear();hovered=false;trackFocus(null);publish(false);};
  owner.current={pointer(){if(!media.matches||coarseInput||blocked)return;hovered=true;if(contains(doc.activeElement))trackFocus(doc.activeElement);reconcile();},focus(target){if(!media.matches||coarseInput)return;if(target!==trigger.current)blocked=false;trackFocus(target);reconcile();}};
  const change=()=>{reset();},leaveWindow=()=>{hovered=false;reconcile();};
  doc.addEventListener('pointerover',pointer,true);doc.addEventListener('pointerout',leave,true);doc.addEventListener('pointerdown',input,true);doc.addEventListener('focusin',focus,true);doc.addEventListener('focusout',blur,true);doc.addEventListener('keydown',key);
  media.addEventListener('change',change);win.addEventListener('blur',leaveWindow);doc.addEventListener('visibilitychange',leaveWindow);
  return()=>{dead=true;clear();removedFocus.disconnect();owner.current=null;doc.removeEventListener('pointerover',pointer,true);doc.removeEventListener('pointerout',leave,true);doc.removeEventListener('pointerdown',input,true);doc.removeEventListener('focusin',focus,true);doc.removeEventListener('focusout',blur,true);doc.removeEventListener('keydown',key);media.removeEventListener('change',change);win.removeEventListener('blur',leaveWindow);doc.removeEventListener('visibilitychange',leaveWindow);};
 },[sidebar,enabled,trigger]);
 // React capture follows a public popup through its portal, without host DOM selectors.
 const scope={onPointerOverCapture:(event:React.PointerEvent)=>{if(event.pointerType==='mouse')owner.current?.pointer();},onFocusCapture:(event:React.FocusEvent)=>owner.current?.focus(event.target)};
 return {revealed:enabled&&visible,scope};
}
