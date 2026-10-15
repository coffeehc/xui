/** Internal shared DOM behavior. Only a declared navigation name moves; controls and rich metadata stay fixed. */
export function bindNavigationPresentation(nav:HTMLElement){
  const doc=nav.ownerDocument,win=doc.defaultView;
  if(!win||typeof win.matchMedia!=='function'||typeof nav.animate!=='function')return {refresh(){},destroy(){}};
  const media=win.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'),coarse=win.matchMedia('(any-pointer: coarse)'),enabled=()=>media.matches&&!coarse.matches;
  let hovered:HTMLElement|null=null,focused:HTMLElement|null=null,active:HTMLElement|null=null,viewport:HTMLElement|null=null,track:HTMLElement|null=null,timer:number|undefined,animation:Animation|undefined,signature='',dead=false;
  nav.dataset.labelMotion=enabled()?'enabled':'static';
  const primary=(target:EventTarget|null)=>{const node=target instanceof win.Node?(target.nodeType===1?target as Element:target.parentElement):null,control=node?.closest<HTMLElement>('[data-menu-control="primary"]');return control&&nav.contains(control)?control:null;};
  const stop=()=>{if(timer!==undefined)win.clearTimeout(timer);timer=undefined;animation?.cancel();animation=undefined;viewport?.removeAttribute('data-scrolling');observer?.disconnect();active=viewport=track=null;signature='';};
  const refresh=()=>{
    if(dead)return;nav.dataset.labelMotion=enabled()?'enabled':'static';const next=focused??hovered,name=next?.querySelector<HTMLElement>('.xui-navigation-label'),text=name?.firstElementChild as HTMLElement|null;
    if(!next||!name||!text||!next.isConnected||doc.hidden||!enabled()||nav.dataset.labelOverflow!=='marquee'||next.matches(':disabled,[aria-disabled="true"]')||win.getComputedStyle(name.closest('.xui-menu-label')??name).position==='absolute'){stop();return;}
    const distance=Math.max(0,text.scrollWidth-name.clientWidth),style=win.getComputedStyle(text),speed=Number.parseFloat(style.getPropertyValue('--nav-label-scroll-speed'));
    const delayText=style.animationDelay.split(',')[0],delay=Number.parseFloat(delayText)*(delayText.endsWith('ms')?1:1000),direction=style.direction==='rtl'?1:-1;
    if(distance<=1||!Number.isFinite(speed)||speed<=0||!Number.isFinite(delay)){stop();return;}
    const nextSignature=JSON.stringify([text.textContent,distance,direction,speed,delay]);
    if(next===active&&name===viewport&&text===track&&nextSignature===signature)return;
    stop();active=next;viewport=name;track=text;signature=nextSignature;observer?.observe(name);observer?.observe(text);
    timer=win.setTimeout(()=>{timer=undefined;if(dead||active!==next||!enabled()||!next.isConnected)return;name.dataset.scrolling='true';
      // The measured overflow sets distance, never a design offset or a consumer DOM dependency.
      animation=text.animate([{transform:'translateX(0)'},{transform:`translateX(${direction*distance}px)`}],{duration:distance/speed*1000,easing:'linear',fill:'forwards'});
    },Math.max(0,delay));
  };
  const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(refresh):null;
  const over=(event:PointerEvent)=>{if(event.pointerType!=='mouse')return;hovered=primary(event.target);refresh();};
  const out=(event:PointerEvent)=>{if(event.pointerType!=='mouse')return;const next=primary(event.relatedTarget);if(next===hovered)return;hovered=next;refresh();};
  const focus=(event:FocusEvent)=>{focused=primary(event.target);refresh();};
  const blur=(event:FocusEvent)=>{focused=primary(event.relatedTarget);if(!focused&&!nav.contains(event.relatedTarget as Node))hovered=null;refresh();};
  const reset=()=>{hovered=focused=null;stop();};
  nav.addEventListener('pointerover',over);nav.addEventListener('pointerout',out);nav.addEventListener('focusin',focus);nav.addEventListener('focusout',blur);media.addEventListener('change',refresh);coarse.addEventListener('change',refresh);doc.addEventListener('visibilitychange',refresh);win.addEventListener('blur',reset);
  return {refresh,destroy(){if(dead)return;reset();dead=true;delete nav.dataset.labelMotion;nav.removeEventListener('pointerover',over);nav.removeEventListener('pointerout',out);nav.removeEventListener('focusin',focus);nav.removeEventListener('focusout',blur);media.removeEventListener('change',refresh);coarse.removeEventListener('change',refresh);doc.removeEventListener('visibilitychange',refresh);win.removeEventListener('blur',reset);}};
}
