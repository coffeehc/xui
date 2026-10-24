import * as React from 'react';

/** Numeric screen coordinates only. Raw records and inspection never enter this layer. */
export function interpolateChartFrame(from:readonly number[],to:readonly number[],progress:number){
 return to.map((value,index)=>progress>=1?value:from[index]+(value-from[index])*progress);
}
type Phase='idle'|'enter'|'update';
interface Frame {values:readonly number[];progress:number;phase:Phase}
interface Target {boundary:string;values:readonly number[];initial:readonly number[];ready:boolean;hasData:boolean}
const milliseconds=(value:string)=>{const text=value.trim();return /^\d*\.?\d+(ms|s)$/.test(text)?parseFloat(text)*(text.endsWith('ms')?1:1000):0;};

/** React owns geometry; the browser timing engine supplies the shared token easing. */
export function useChartMotion(node:SVGSVGElement|null,enabled:boolean,target:Target){
 const [frame,setFrame]=React.useState<Frame>({values:target.values,progress:1,phase:'idle'});
 const current=React.useRef(frame),previous=React.useRef<{boundary:string;key:string;seen:boolean}>({boundary:'',key:'',seen:false});
 const stop=React.useRef<()=>void>(()=>{}),settle=React.useRef<()=>void>(()=>{});
 const key=JSON.stringify(target.values);
 React.useLayoutEffect(()=>{
  const view=node?.ownerDocument.defaultView,document=node?.ownerDocument;
  const publish=(next:Frame)=>{current.current=next;setFrame(next);};
  const finish=()=>{stop.current();publish({values:target.values,progress:1,phase:'idle'});};
  settle.current=finish;
  if(!target.hasData){previous.current.seen=false;finish();return;}
  if(!node||!view||!document||!target.ready){finish();return;}
  const reduced=view.matchMedia('(prefers-reduced-motion: reduce)'),before=previous.current;
  const first=!before.seen,changed=before.key!==key,compatible=before.boundary===target.boundary;
  previous.current={boundary:target.boundary,key,seen:true};
  const style=view.getComputedStyle(node),duration=milliseconds(style.getPropertyValue('--motion-duration-chart'));
  let raf=0,clock:Animation|undefined,dead=false;
  const cancel=()=>{if(raf)view.cancelAnimationFrame(raf);raf=0;clock?.cancel();clock=undefined;};
  stop.current=cancel;
  const permitted=enabled&&!reduced.matches&&!document.hidden&&duration>0;
  if(permitted&&(first||changed&&compatible)){
   try{
    // A targetless effect computes token easing without mutating SVG or creating a hidden element.
    const effect=new view.KeyframeEffect(null,[],{duration,easing:style.getPropertyValue('--motion-easing').trim(),fill:'both'});
    clock=new view.Animation(effect,document.timeline);
    const from=first?target.initial:current.current.values;
    const draw=(progress:number)=>publish({values:interpolateChartFrame(from,target.values,progress),progress:first?progress:1,phase:first?'enter':'update'});
    draw(0);clock.play();
    const tick=()=>{if(dead||!clock)return;const progress=effect.getComputedTiming().progress??0;if(clock.playState==='finished'){finish();return;}draw(progress);raf=view.requestAnimationFrame(tick);};
    raf=view.requestAnimationFrame(tick);
   }catch{finish();}
  }else finish();
  const preference=()=>{if(reduced.matches)finish();},visibility=()=>{if(document.hidden)finish();};
  reduced.addEventListener('change',preference);document.addEventListener('visibilitychange',visibility);
  return()=>{dead=true;cancel();reduced.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);};
 },[node,enabled,target.boundary,key,target.ready,target.hasData]);
 const finish=React.useCallback(()=>{if(current.current.phase!=='idle')settle.current();},[]);
 // A structural change is committed before paint, never rendered with an old index map.
 const compatible=previous.current.boundary===target.boundary&&frame.values.length===target.values.length;
 return {frame:compatible?frame:{values:target.values,progress:1,phase:'idle' as const},finish};
}
