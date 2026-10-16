/** Internal shared geometry; semantic owners choose the name and interaction surface. */
export function overflowTextGeometry(viewport:HTMLElement,track:HTMLElement,speedProperty:string){
 const win=viewport.ownerDocument.defaultView!,style=win.getComputedStyle(track),distance=Math.max(0,track.scrollWidth-viewport.clientWidth),speed=parseFloat(style.getPropertyValue(speedProperty));
 const delayText=style.animationDelay.split(',')[0],delay=parseFloat(delayText)*(delayText.endsWith('ms')?1:1000),direction=style.direction==='rtl'?1:-1;
 return {distance,speed,delay,direction,valid:distance>1&&Number.isFinite(speed)&&speed>0&&Number.isFinite(delay)};
}
const focusable='a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';
/** Internal presentation only. No values, tabindex, roles, navigation or business callbacks. */
export function bindOverflowTextPresentation(viewport:HTMLElement,track:HTMLElement,getTarget:()=>HTMLElement|null){
 const doc=viewport.ownerDocument,win=doc.defaultView;
 if(!win||!win.matchMedia||!track.animate)return {refresh(){},destroy(){}};
 const media=win.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'),coarse=win.matchMedia('(any-pointer: coarse)');
 let target:HTMLElement|null=null,hovered=false,focused=false,dead=false,timer:number|undefined,animation:Animation|undefined,signature='';
 const stop=()=>{if(timer!==undefined)win.clearTimeout(timer);timer=undefined;animation?.cancel();animation=undefined;signature='';viewport.removeAttribute('data-scrolling');};
 const over=(event:PointerEvent)=>{if(event.pointerType==='mouse'){hovered=true;refresh();}};
 const out=(event:PointerEvent)=>{if(event.pointerType==='mouse'&&!target?.contains(event.relatedTarget as Node|null)){hovered=false;refresh();}};
 const focus=()=>{focused=true;refresh();};
 const blur=(event:FocusEvent)=>{focused=!!target?.contains(event.relatedTarget as Node|null);refresh();};
 const listen=(node:HTMLElement|null,add:boolean)=>{if(!node)return;if(add){node.addEventListener('pointerover',over);node.addEventListener('pointerout',out);node.addEventListener('focusin',focus);node.addEventListener('focusout',blur);}else{node.removeEventListener('pointerover',over);node.removeEventListener('pointerout',out);node.removeEventListener('focusin',focus);node.removeEventListener('focusout',blur);}};
 const refresh=()=>{
  if(dead)return;
  const next=getTarget()??viewport.parentElement?.closest<HTMLElement>(focusable)??null;
  if(next&&next.ownerDocument!==doc)throw new TypeError('OverflowText target must share its document');
  if(next!==target){listen(target,false);stop();target=next;hovered=false;focused=!!target?.contains(doc.activeElement);listen(target,true);}
  // Non-interactive text never gains an extra tab stop. Without an existing
  // keyboard entry in its declared surface it stays fully readable instead.
  const enabled=media.matches&&!coarse.matches&&!!target?.contains(viewport)&&!target.matches(':disabled,[aria-disabled="true"]')&&!!(target.matches(focusable)||target.querySelector(focusable));
  viewport.dataset.overflowMotion=enabled?'enabled':'static';
  if(!enabled||doc.hidden||!viewport.isConnected||(!hovered&&!focused)){stop();return;}
  const geometry=overflowTextGeometry(viewport,track,'--text-overflow-scroll-speed');
  if(!geometry.valid){stop();return;}
  const key=JSON.stringify([track.textContent,geometry]);if(key===signature)return;
  stop();signature=key;
  timer=win.setTimeout(()=>{timer=undefined;if(dead||!viewport.isConnected||!media.matches||coarse.matches)return;viewport.dataset.scrolling='true';animation=track.animate([{transform:'translateX(0)'},{transform:`translateX(${geometry.direction*geometry.distance}px)`}],{duration:geometry.distance/geometry.speed*1000,easing:'linear',fill:'forwards'});},Math.max(0,geometry.delay));
 };
 const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(refresh):null;observer?.observe(viewport);observer?.observe(track);
 const reset=()=>{hovered=focused=false;stop();};
 media.addEventListener('change',refresh);coarse.addEventListener('change',refresh);doc.addEventListener('visibilitychange',refresh);win.addEventListener('blur',reset);win.addEventListener('resize',refresh);doc.fonts?.addEventListener('loadingdone',refresh);void doc.fonts?.ready.then(refresh);refresh();
 return {refresh,destroy(){if(dead)return;dead=true;stop();listen(target,false);observer?.disconnect();media.removeEventListener('change',refresh);coarse.removeEventListener('change',refresh);doc.removeEventListener('visibilitychange',refresh);win.removeEventListener('blur',reset);win.removeEventListener('resize',refresh);doc.fonts?.removeEventListener('loadingdone',refresh);delete viewport.dataset.overflowMotion;}};
}
