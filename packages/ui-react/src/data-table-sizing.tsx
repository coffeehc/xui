import * as React from 'react';
import {createDataTableColumnSizingController,type DataTableColumnSizingOptions,type DataTableColumnSizingController,type DataTableColumnResizeOptions} from '@coffeehc/xui-runtime/data-table';
import {assertControllerProps,useOwnedController,useViewRelease,type ControllerProps} from './controller.js';
export type DataTableColumnSizingProps=ControllerProps<DataTableColumnSizingController,DataTableColumnSizingOptions>;
export function useDataTableColumnSizing(options:DataTableColumnSizingProps|undefined){
  assertControllerProps(options?.controller,options??{},['widths','defaultWidths','onWidthsChange']);
  const latest=React.useRef(options);latest.current=options;
  const controller=useOwnedController(options?.controller,()=>createDataTableColumnSizingController({...options,onWidthsChange:(widths,details)=>latest.current?.onWidthsChange?.(widths,details)}));
  const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState);
  React.useLayoutEffect(()=>{if(!options?.controller)controller.update({widths:options?.widths});},[controller,options?.controller,options?.widths]);
  const confirmed=options?.widths??state.widths;
  const changed=options?.widths!==undefined&&(Object.keys(options.widths).length!==Object.keys(state.widths).length||Object.entries(options.widths).some(([id,width])=>!Object.hasOwn(state.widths,id)||state.widths[id]!==width));
  const draft=changed?null:state.resizing;
  const widths=draft?{...draft.widths,[draft.columnId]:draft.width}:confirmed;
  return {controller,widths};
}
interface ResizeProps {
  columnId:string;label:string;bounds:DataTableColumnResizeOptions|false|undefined;blocked:boolean;
  controller:DataTableColumnSizingController;table:React.RefObject<HTMLTableElement|null>;ids:readonly string[];
  minimum:React.RefObject<HTMLDivElement|null>;maximum:React.RefObject<HTMLDivElement|null>;
}
/** One separator owns its pointer capture and temporary listeners. Controller owns the draft and confirmed widths. */
export function ColumnResizeHandle({columnId,label,bounds,blocked,controller,table,ids,minimum,maximum}:ResizeProps){
  const [,focusRevision]=React.useReducer(value=>value+1,0);
  const ref=React.useRef<HTMLDivElement>(null),gesture=React.useRef<{release:()=>void}|null>(null);
  const stop=()=>{const active=gesture.current;if(!active)return;gesture.current=null;active.release();};
  const cancel=()=>{if(gesture.current){stop();controller.cancel();}};
  const lifetime=React.useRef({});useViewRelease(lifetime.current,cancel);
  React.useLayoutEffect(()=>()=>cancel(),[controller]);
  const signature=JSON.stringify([ids,bounds&&bounds.minWidth,bounds&&bounds.maxWidth]);
  React.useLayoutEffect(()=>()=>cancel(),[signature]);
  React.useLayoutEffect(()=>{if(blocked||bounds===false||!ids.includes(columnId))cancel();});
  React.useLayoutEffect(()=>controller.subscribe(()=>{if(!controller.getState().resizing)stop();}),[controller]);
  React.useLayoutEffect(()=>{
    const node=ref.current!,win=node.ownerDocument.defaultView!;
    const frame=win.requestAnimationFrame(()=>{
      if(gesture.current||!node.isConnected||node.ownerDocument.activeElement!==node)return;
      const grid=table.current!,port=grid.parentElement!,box=node.getBoundingClientRect(),viewport=port.getBoundingClientRect(),rtl=win.getComputedStyle(port).direction==='rtl';
      const headers=Array.from(grid.tHead!.rows[0].cells),start=headers.find(cell=>cell.dataset.sticky==='start')?.getBoundingClientRect(),end=headers.find(cell=>cell.dataset.sticky==='end')?.getBoundingClientRect();
      const left=rtl?end?.right??viewport.left:start?.right??viewport.left,right=rtl?start?.left??viewport.right:end?.left??viewport.right;
      if(box.left<left||box.right>right)port.scrollLeft+=(box.left+box.width/2)-(left+right)/2;
    });
    return()=>win.cancelAnimationFrame(frame);
  });
  const context=()=>{
    const node=ref.current!,header=node.closest('th')!,win=node.ownerDocument.defaultView!;
    const min=bounds&&bounds.minWidth!==undefined?bounds.minWidth:parseFloat(win.getComputedStyle(minimum.current!).width);
    const max=bounds&&bounds.maxWidth!==undefined?bounds.maxWidth:parseFloat(win.getComputedStyle(maximum.current!).width);
    if(!Number.isFinite(min)||min<=0||!Number.isFinite(max)||max<min)throw new TypeError('Invalid column resize bounds');
    // Snapshot actual table tracks, removing ancestor transforms.
    const grid=table.current!,scale=grid.getBoundingClientRect().width/grid.offsetWidth,widths:Record<string,number>=Object.create(null);
    Array.from(grid.tHead!.rows[0].cells).forEach((cell,index)=>{widths[ids[index]]=cell.getBoundingClientRect().width/scale;});
    return {node,header,win,widths,min,max,rtl:win.getComputedStyle(header).direction==='rtl'};
  };
  React.useLayoutEffect(()=>{
    const node=ref.current!,header=node.closest('th')!,win=node.ownerDocument.defaultView!;
    const update=()=>{const grid=header.closest('table')!,scale=grid.getBoundingClientRect().width/grid.offsetWidth;if(!Number.isFinite(scale)||scale<=0)return;const current=header.getBoundingClientRect().width/scale,min=bounds&&bounds.minWidth!==undefined?bounds.minWidth:parseFloat(win.getComputedStyle(minimum.current!).width),max=bounds&&bounds.maxWidth!==undefined?bounds.maxWidth:parseFloat(win.getComputedStyle(maximum.current!).width);node.setAttribute('aria-valuenow',String(Math.round(current)));node.setAttribute('aria-valuemin',String(Math.min(min,current)));node.setAttribute('aria-valuemax',String(Math.max(max,current)));};
    const observer=new ResizeObserver(update);observer.observe(header);update();return()=>observer.disconnect();
  },[bounds,minimum,maximum]);
  return <div ref={ref} className="xui-table-column-resize" data-resizing={controller.getState().resizing?.columnId===columnId||undefined} role="separator" aria-orientation="vertical" aria-label={label} aria-disabled={blocked||undefined} tabIndex={blocked?-1:0}
    onFocus={()=>focusRevision()} onClick={event=>event.stopPropagation()} onDoubleClick={event=>event.stopPropagation()}
    onPointerDown={event=>{
      if(blocked||bounds===false||event.button!==0||!event.isPrimary)return;
      const {node,header,win,widths,min,max,rtl}=context();
      if(!controller.begin(columnId,widths,{minWidth:min,maxWidth:max}))return;
      if(!node.isConnected){controller.cancel();return;}event.preventDefault();event.stopPropagation();node.focus({preventScroll:true});
      const id=event.pointerId,start=event.clientX,width=widths[columnId],scale=header.getBoundingClientRect().width/width;
      let frame=0,last=start;
      const apply=()=>controller.resizeTo(width+(last-start)/scale*(rtl?-1:1));
      const move=(next:PointerEvent)=>{if(next.pointerId!==id)return;last=next.clientX;if(!frame)frame=win.requestAnimationFrame(()=>{frame=0;apply();});};
      const finish=(next:PointerEvent)=>{if(next.pointerId!==id)return;try{last=next.clientX;win.cancelAnimationFrame(frame);frame=0;apply();controller.commit();}finally{stop();}};
      const abort=(next:Event)=>{if(!('pointerId' in next)||next.pointerId===id)cancel();},key=(next:KeyboardEvent)=>{if(next.key==='Escape'){next.preventDefault();next.stopPropagation();cancel();}};
      const limits=new ResizeObserver(()=>{const next=context();if(next.min!==min||next.max!==max)cancel();});limits.observe(minimum.current!);limits.observe(maximum.current!);
      const release=()=>{win.cancelAnimationFrame(frame);limits.disconnect();win.removeEventListener('pointermove',move);win.removeEventListener('pointerup',finish);win.removeEventListener('pointercancel',abort);win.removeEventListener('blur',abort);win.removeEventListener('resize',abort);win.removeEventListener('keydown',key,true);node.removeEventListener('lostpointercapture',abort);if(node.hasPointerCapture(id))node.releasePointerCapture(id);};
      gesture.current={release};win.addEventListener('pointermove',move);win.addEventListener('pointerup',finish);win.addEventListener('pointercancel',abort);win.addEventListener('blur',abort);win.addEventListener('resize',abort);win.addEventListener('keydown',key,true);node.addEventListener('lostpointercapture',abort);try{node.setPointerCapture(id);}catch{cancel();}
    }}
    onKeyDown={event=>{
      if(blocked||bounds===false||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||event.ctrlKey||event.metaKey||event.altKey)return;
      event.preventDefault();event.stopPropagation();const {widths,min,max,rtl}=context();
      if(controller.begin(columnId,widths,{minWidth:min,maxWidth:max},'keyboard')){const delta=(event.key==='ArrowRight'?1:-1)*(rtl?-1:1)*(event.shiftKey?10:1);controller.resizeTo(event.key==='Home'?min:event.key==='End'?max:widths[columnId]+delta);controller.commit();}
    }}/>
}
