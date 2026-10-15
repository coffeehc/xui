/** Opt-in sizing only. The textarea remains the value, form and interaction owner. */
export interface TextareaAutoResizeOptions {
  /** Maximum visible text rows; the existing rows/CSS minimum remains the floor. */
  maxRows:number;
}
export interface TextareaAutoResizeBinding {
  /** Re-measure after a programmatic value or style change; input events are observed automatically. */
  update(options?:TextareaAutoResizeOptions):void;
  /** Release observers and restore the original inline sizing/resize styles. */
  destroy():void;
}
const owners=new WeakSet<HTMLTextAreaElement>();
/** Native counterpart of Textarea.autoResize. Never changes values, selection, focus or events. */
export function bindTextareaAutoResize(input:HTMLTextAreaElement,initial:TextareaAutoResizeOptions):TextareaAutoResizeBinding {
  const checked=(value:TextareaAutoResizeOptions)=>{if(!value||!Number.isSafeInteger(value.maxRows)||value.maxRows<1)throw new TypeError('Textarea maxRows must be a positive integer');return {...value};};
  let options=checked(initial);if(owners.has(input))throw new Error('Textarea already has an auto-resize owner');
  const doc=input.ownerDocument,view=doc.defaultView;if(!view)throw new TypeError('Textarea needs a browsing context');
  const resizeAttribute='data-xui-auto-resize',originalResizeAttribute=input.getAttribute(resizeAttribute);
  const properties=['block-size','overflow-y','resize'] as const;
  const original=properties.map(name=>({name,value:input.style.getPropertyValue(name),priority:input.style.getPropertyPriority(name)}));
  const mirror=doc.createElement('textarea');mirror.setAttribute('aria-hidden','true');mirror.tabIndex=-1;mirror.inert=true;mirror.disabled=true;
  let dead=false,frame=0,resetTimer:ReturnType<typeof setTimeout>|undefined,width=-1;
  const measure=()=>{
    if(dead||!input.isConnected||input.getClientRects().length===0)return;
    const style=view.getComputedStyle(input);if(parseFloat(style.width)<=0)return;
    // Measure a hidden copy rather than collapsing the focused textarea. This
    // avoids temporarily changing the parent scroll range and moving its view.
    for(const name of ['box-sizing','width','font-family','font-size','font-weight','font-style','font-stretch','line-height','letter-spacing','text-transform','text-indent','word-spacing','tab-size','white-space','overflow-wrap','word-break','padding-top','padding-bottom','padding-left','padding-right','border-top-width','border-bottom-width','border-left-width','border-right-width','border-style'])mirror.style.setProperty(name,style.getPropertyValue(name));
    Object.assign(mirror.style,{position:'fixed',visibility:'hidden',pointerEvents:'none',height:'0',minHeight:'0',maxHeight:'none',overflow:'hidden',resize:'none',margin:'0',inset:'0'});
    mirror.wrap=input.wrap;doc.body.append(mirror);
    const padding=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom),border=parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth);
    mirror.value='x';const one=mirror.scrollHeight;mirror.value='x\nx';const line=parseFloat(style.lineHeight)||mirror.scrollHeight-one;
    mirror.value=input.value||input.placeholder;const content=mirror.scrollHeight+border;mirror.remove();
    if(line<=0)return;
    const floor=Math.max(parseFloat(style.minHeight)||0,padding+border+line*input.rows);
    const ceiling=Math.max(floor,padding+border+line*Math.max(input.rows,options.maxRows));
    const size=Math.max(floor,Math.min(content,ceiling,parseFloat(style.maxHeight)||Infinity)),scroll=input.scrollTop;
    input.style.blockSize=`${style.boxSizing==='border-box'?size:size-padding-border}px`;
    input.style.overflowY=content>size?'auto':'hidden';input.style.resize='none';input.scrollTop=scroll;
  };
  const schedule=()=>{if(!dead&&!frame)frame=view.requestAnimationFrame(()=>{frame=0;measure();});};
  const reset=(event:Event)=>{if(event.target===input.form){clearTimeout(resetTimer);resetTimer=setTimeout(schedule,0);}};
  const observer=new view.ResizeObserver(entries=>{const next=entries[0]?.contentRect.width;if(next!==undefined&&next!==width){width=next;schedule();}});
  observer.observe(input);input.addEventListener('input',schedule);input.addEventListener('compositionend',schedule);doc.addEventListener('reset',reset,true);view.addEventListener('resize',schedule);doc.fonts?.addEventListener('loadingdone',schedule);void doc.fonts?.ready.then(schedule);
  // Let a stacked InputGroup honor this owner's measured block size without
  // changing the flex behavior of ordinary, manually sized textareas.
  owners.add(input);input.setAttribute(resizeAttribute,'');measure();
  return {update(next){if(dead)return;if(next)options=checked(next);measure();},destroy(){if(dead)return;dead=true;observer.disconnect();view.cancelAnimationFrame(frame);clearTimeout(resetTimer);input.removeEventListener('input',schedule);input.removeEventListener('compositionend',schedule);doc.removeEventListener('reset',reset,true);view.removeEventListener('resize',schedule);doc.fonts?.removeEventListener('loadingdone',schedule);mirror.remove();for(const {name,value,priority} of original)if(value)input.style.setProperty(name,value,priority);else input.style.removeProperty(name);if(originalResizeAttribute===null)input.removeAttribute(resizeAttribute);else input.setAttribute(resizeAttribute,originalResizeAttribute);owners.delete(input);}};
}
