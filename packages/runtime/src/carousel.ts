import type {ObservableController,InteractionChange} from './interaction.js';

export type CarouselChangeReason='previous'|'next'|'indicator'|'keyboard'|'swipe'|'autoplay'|'items-change'|'programmatic';
export interface CarouselChangeDetails extends InteractionChange {reason:CarouselChangeReason}
export interface CarouselOptions {
 ids:readonly string[];
 value?:string|null;defaultValue?:string|null;
 onValueChange?:(value:string|null,details:CarouselChangeDetails)=>void;
 disabled?:boolean;loop?:boolean;
 /** Initial playback intent. Changing this option explicitly resets that intent. */
 autoPlay?:boolean;
 /** View clock budget, milliseconds; default 5000, minimum 1000. No timer lives in this model. */
 interval?:number;
}
export interface CarouselState {
 readonly ids:readonly string[];readonly value:string|null;readonly index:number;
 readonly disabled:boolean;readonly destroyed:boolean;readonly loop:boolean;readonly interval:number;
 /** Requested playback; the View additionally suspends its clock on hover/hidden/reduced motion. */
 readonly playing:boolean;readonly canPrevious:boolean;readonly canNext:boolean;
}
export interface CarouselController extends ObservableController<CarouselState> {
 setValue:(value:string|null,reason?:CarouselChangeReason)=>boolean;
 previous:(reason?:CarouselChangeReason)=>boolean;next:(reason?:CarouselChangeReason)=>boolean;
 setPlaying:(playing:boolean)=>void;
 /** Controlled confirmation/configuration never echoes a value callback. Removal requests one fallback. */
 update:(options:Partial<CarouselOptions>)=>void;
}
function validate(options:CarouselOptions){
 if(!Array.isArray(options.ids)||options.ids.some(id=>typeof id!=='string'||!id.trim())||new Set(options.ids).size!==options.ids.length)throw new TypeError('Carousel requires unique nonempty item ids');
 if(options.interval!==undefined&&(!Number.isFinite(options.interval)||options.interval<1000))throw new TypeError('Carousel interval must be at least 1000 milliseconds');
 for(const key of ['value','defaultValue'] as const)if(options[key]!==undefined&&options[key]!==null&&typeof options[key]!=='string')throw new TypeError('Carousel value must be an item id or null');
}
/** Stable-id selection and playback intent only; no DOM, timer, IO, route or global instance. */
export function createCarouselController(initial:CarouselOptions):CarouselController {
 validate(initial);
 let options={...initial,ids:Object.freeze([...initial.ids])},selected=initial.value!==undefined?initial.value:initial.defaultValue!==undefined?initial.defaultValue:initial.ids[0]??null;
 if(selected!==null&&!options.ids.includes(selected))throw new TypeError('Initial Carousel value must identify an item');
 let intent=0,dead=false,playing=!!initial.autoPlay&&!initial.disabled,fallbackSignature='';const listeners=new Set<()=>void>();
 const snapshot=():Readonly<CarouselState>=>{
  const candidate=options.value===undefined?selected:options.value,value=candidate!==null&&options.ids.includes(candidate)?candidate:null,index=value===null?-1:options.ids.indexOf(value),disabled=dead||!!options.disabled,loop=!!options.loop;
  const canPrevious=!disabled&&options.ids.length>0&&(index>0||loop&&options.ids.length>1),canNext=!disabled&&options.ids.length>0&&(index<options.ids.length-1||loop&&options.ids.length>1);
  return Object.freeze({ids:options.ids,value,index,disabled,destroyed:dead,loop,interval:options.interval??5000,playing:playing&&!disabled&&options.ids.length>1&&canNext,canPrevious,canNext});
 };
 let state=snapshot();
 const publish=()=>{if(dead)return;const next=snapshot();if(Object.keys(next).every(key=>Object.is(next[key as keyof CarouselState],state[key as keyof CarouselState])))return;state=next;for(const listener of [...listeners])if(listeners.has(listener))listener();};
 const request=(value:string|null,reason:CarouselChangeReason='programmatic')=>{
  if(dead||state.disabled||value!==null&&!state.ids.includes(value)||state.value===value&&!(reason==='items-change'&&options.value!==value))return false;
  const revision=++intent,details:CarouselChangeDetails={reason,isCanceled:false,cancel(){this.isCanceled=true;}};
  options.onValueChange?.(value,details);
  if(dead||revision!==intent||details.isCanceled)return false;
  if(reason!=='autoplay'&&reason!=='items-change')playing=false;
  if(options.value===undefined)selected=value;
  publish();return true;
 };
 const controller:CarouselController={
  getState:()=>state,subscribe(listener){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
  setValue:request,
  previous(reason='previous'){if(!state.canPrevious)return false;return request(state.ids[state.index<0?state.ids.length-1:(state.index-1+state.ids.length)%state.ids.length],reason);},
  next(reason='next'){if(!state.canNext)return false;return request(state.ids[(state.index+1)%state.ids.length],reason);},
  setPlaying(value){if(typeof value!=='boolean')throw new TypeError('playing must be boolean');if(dead)return;playing=value&&!state.disabled&&state.ids.length>1&&state.canNext;publish();},
  update(next){
   if(dead)return;
   const merged={...options,...next};validate(merged);
   const sameIds=merged.ids.length===options.ids.length&&merged.ids.every((id,index)=>id===options.ids[index]);
   const changed=!sameIds||(['value','disabled','loop','autoPlay','interval'] as const).some(key=>merged[key]!==options[key]);
   const previous=state,oldAutoPlay=options.autoPlay;if(options.value!==undefined&&merged.value===undefined)selected=previous.value;
   options={...merged,ids:sameIds?options.ids:Object.freeze([...merged.ids])};
   if(!changed)return;
   intent++;
   if(options.autoPlay!==oldAutoPlay)playing=!!options.autoPlay;
   if(options.disabled)playing=false;
   const missing=selected!==null&&!options.ids.includes(selected),fallback=options.ids[Math.min(Math.max(previous.index,0),options.ids.length-1)]??null;
   if(options.value===undefined&&(missing||selected===null&&previous.ids.length===0)){selected=fallback;}
   const controlledMissing=options.value!==undefined&&options.value!==null&&!options.ids.includes(options.value),signature=controlledMissing?JSON.stringify([options.ids,options.value]):'';
   publish();
   if(dead)return;
   if(controlledMissing){if(signature!==fallbackSignature){fallbackSignature=signature;request(fallback,'items-change');}}
   else {fallbackSignature='';if(options.value===undefined&&state.value!==previous.value)options.onValueChange?.(state.value,{reason:'items-change'});}
  },
  destroy(){if(dead)return;dead=true;intent++;playing=false;state=snapshot();for(const listener of [...listeners])if(listeners.has(listener))listener();listeners.clear();},
 };
 return controller;
}
