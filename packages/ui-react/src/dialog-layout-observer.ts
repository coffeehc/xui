/** @internal Shared layout observation and cleanup; refresh after native visibility changes. */
export function observeDialogLayout(popup:HTMLElement){
 const win=popup.ownerDocument.defaultView;
 if(!win||!win.ResizeObserver||!win.MutationObserver||!win.requestAnimationFrame)return Object.assign(()=>{},{refresh:()=>{}});
 let dead=false,frame=0,hidden=false;
 let position:{owner:HTMLElement;top:number;left:number}|null=null;
 const children=new Set<Element>();
 const schedule=()=>{if(!dead&&!frame)frame=win.requestAnimationFrame(measure);};
 const observer=new win.ResizeObserver(schedule);
 const measure=()=>{
  frame=0;if(dead)return;
  for(const child of children)if(child.parentElement!==popup){observer.unobserve(child);children.delete(child);}
  for(const child of Array.from(popup.children))if(!children.has(child)){children.add(child);observer.observe(child);}
  const bodies=Array.from(popup.children).filter((node):node is HTMLElement=>node instanceof win.HTMLElement&&node.classList.contains('xui-dialog-body'));
  if(bodies.length!==1){position=null;delete popup.dataset.dialogScroll;return;}
  // keepMounted hides paint, not the retained scroll owner. Removing its mode
  // here would reset overflow and make reopening look like an owner switch,
  // scrolling a focused field over the user's preserved reading position.
  if(!popup.getClientRects().length){hidden=true;return;}
  const body=bodies[0],css=win.getComputedStyle(popup),bodyCSS=win.getComputedStyle(body);
  const number=(value:string)=>Number.parseFloat(value)||0;
  // max-height and fixed siblings are independent of the selected scroll mode.
  // A stable outer scrollbar gutter keeps sibling wrapping identical in both modes.
  const max=Number.parseFloat(css.maxHeight);
  if(!Number.isFinite(max)){position=null;delete popup.dataset.dialogScroll;return;}
  let used=number(css.paddingTop)+number(css.paddingBottom)+number(css.borderTopWidth)+number(css.borderBottomWidth);
  const height=Number.parseFloat(css.height);
  const budget=Number.isFinite(height)?Math.min(max,height+(css.boxSizing==='border-box'?0:used)):max;
  let count=0;
  for(const child of Array.from(popup.children)){
   if(!(child instanceof win.HTMLElement))continue;
   const style=win.getComputedStyle(child);
   if(style.display==='none'||style.position==='absolute'||style.position==='fixed')continue;
   count++;
   used+=number(style.marginTop)+number(style.marginBottom);
   if(child!==body){
    const height=Number.parseFloat(style.height);
    const edges=number(style.paddingTop)+number(style.paddingBottom)+number(style.borderTopWidth)+number(style.borderBottomWidth);
    used+=Number.isFinite(height)?height+(style.boxSizing==='border-box'?0:edges):child.offsetHeight;
   }
  }
  used+=Math.max(0,count-1)*number(css.rowGap);
  const mode=budget-used>=number(bodyCSS.minBlockSize)?'body':'whole';
  const owner=mode==='body'?body:popup;
  if(popup.dataset.dialogScroll!==mode){
   const active=popup.ownerDocument.activeElement;
   popup.dataset.dialogScroll=mode;
   // A former scroll container can retain its offset after overflow changes.
   if(mode==='body')popup.scrollTop=0;else body.scrollTop=0;
   // Preserve the already-focused control across the owner switch, without
   // refocusing or modifying native typing/Space behavior. CSS owns focus margins.
   if(active instanceof win.HTMLElement&&popup.contains(active))active.scrollIntoView({block:'nearest',inline:'nearest'});
  }else if(hidden&&position?.owner===owner){
   // Some engines discard scroll offsets when a retained popup is display:none.
   // A surviving native offset wins over an older event snapshot. Fill only
   // reset axes; real mode changes keep the focused-control rule above.
   if(owner.scrollTop===0)owner.scrollTop=position.top;
   if(owner.scrollLeft===0)owner.scrollLeft=position.left;
  }
  hidden=false;position={owner,top:owner.scrollTop,left:owner.scrollLeft};
 };
 const remember=(event:Event)=>{
  const current=position;if(dead||!current||event.target!==current.owner)return;
  if(!popup.getClientRects().length){hidden=true;return;}
  if(!hidden)position={owner:current.owner,top:current.owner.scrollTop,left:current.owner.scrollLeft};
 };
 popup.addEventListener('scroll',remember,{capture:true,passive:true});
 observer.observe(popup);
 const mutations=new win.MutationObserver(()=>{
  // Record the hidden boundary even when background-page animation frames pause.
  if(!popup.getClientRects().length)hidden=true;
  schedule();
 });
 // Text/slot replacement and visibility attributes may change fixed-area demand.
 mutations.observe(popup,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','class','style']});
 win.addEventListener('resize',schedule);win.visualViewport?.addEventListener('resize',schedule);
 popup.ownerDocument.fonts?.addEventListener('loadingdone',schedule);
 measure();
 const release=()=>{if(dead)return;dead=true;if(frame)win.cancelAnimationFrame(frame);position=null;popup.removeEventListener('scroll',remember,true);observer.disconnect();mutations.disconnect();win.removeEventListener('resize',schedule);win.visualViewport?.removeEventListener('resize',schedule);popup.ownerDocument.fonts?.removeEventListener('loadingdone',schedule);delete popup.dataset.dialogScroll;};
 return Object.assign(release,{refresh(){if(dead)return;if(frame)win.cancelAnimationFrame(frame);measure();}});
}
