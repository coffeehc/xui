import * as React from 'react';
import {createCarouselController,type CarouselController,type CarouselOptions,type CarouselState} from '@coffeehc/xui-runtime/carousel';
import {Button,type ButtonProps} from './button.js';
import {DataRegion,LoadingState,EmptyState,ErrorState} from './feedback.js';
import {useOwnedController,assertControllerProps,type ControllerProps} from './controller.js';
import {cx,branded} from './shared.js';
export type {CarouselController,CarouselOptions,CarouselState,CarouselChangeDetails,CarouselChangeReason} from '@coffeehc/xui-runtime/carousel';
export interface CarouselLabels {
 carousel:string;slide:string;slides:string;indicators:string;previous:string;next:string;play:string;pause:string;
 loading:string;refreshing:string;empty:string;unselected:string;idle:string;error:string;retry:string;reducedMotion:string;
 slideLabel:(index:number,total:number)=>string;
}
export const carouselDefaultLabels:Readonly<CarouselLabels>=/* @__PURE__ */Object.freeze({carousel:'carousel',slide:'slide',slides:'Slides',indicators:'Choose content',previous:'Previous slide',next:'Next slide',play:'Start rotation',pause:'Stop rotation',loading:'Loading…',refreshing:'Refreshing…',empty:'No content',unselected:'Choose content to view',idle:'Ready to load',error:'Unable to load content',retry:'Retry',reducedMotion:'Automatic rotation is disabled by the reduced motion preference',slideLabel:(index:number,total:number)=>(index+1)+' of '+total});
export interface CarouselItemContext {id:string;index:number;active:boolean;disabled:boolean}
type Slots<T>=Omit<React.ComponentProps<'section'>,'children'|'onChange'>&{
 label:string;items:readonly T[];itemKey:(item:T)=>string;renderItem:(item:T,context:CarouselItemContext)=>React.ReactNode;
 labels?:Partial<CarouselLabels>;status?:'idle'|'loading'|'ready'|'refreshing'|'error';
 /** Default controls include pause, previous, indicators and next. false also suppresses the View clock. */
 controls?:React.ReactNode|false;
 loadingState?:React.ReactNode;emptyState?:React.ReactNode;errorState?:React.ReactNode;onRetry?:()=>void;
};
export type CarouselProps<T>=Slots<T>&ControllerProps<CarouselController,Omit<CarouselOptions,'ids'>>;
interface Context {model:CarouselController;state:Readonly<CarouselState>;labels:CarouselLabels;prefix:string;reduced:boolean}
const activeViews=new WeakMap<CarouselController,HTMLElement>();
const CarouselContext=/* @__PURE__ */React.createContext<Context|null>(null);
function useCarousel(){const context=React.useContext(CarouselContext);if(!context)throw new Error('Carousel controls need a Carousel ancestor');return context;}
function Controls({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-carousel-controls',className)}/>;}
function Previous({children,className,onClick,disabled,...props}:ButtonProps){const {model,state,labels,prefix}=useCarousel();return <Button aria-controls={prefix+'-viewport'} variant="outline" {...props} className={branded('xui-carousel-previous',className)} disabled={disabled||!state.canPrevious} aria-label={props['aria-label']??labels.previous} onClick={event=>{onClick?.(event);if(!event.defaultPrevented)model.previous();}}>{children??<Arrow previous/>}</Button>;}
function Next({children,className,onClick,disabled,...props}:ButtonProps){const {model,state,labels,prefix}=useCarousel();return <Button aria-controls={prefix+'-viewport'} variant="outline" {...props} className={branded('xui-carousel-next',className)} disabled={disabled||!state.canNext} aria-label={props['aria-label']??labels.next} onClick={event=>{onClick?.(event);if(!event.defaultPrevented)model.next();}}>{children??<Arrow/>}</Button>;}
function Arrow({previous=false}:{previous?:boolean}){return <svg className="xui-carousel-arrow" aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d={previous?'m12 4-6 6 6 6':'m8 4 6 6-6 6'}/></svg>;}
function PlayPause({children,className,onClick,onPointerDown,onPointerCancel,onBlur,disabled,...props}:ButtonProps){
 const {model,state,labels,reduced}=useCarousel(),pointerPlaying=React.useRef<boolean|null>(null);
 // Pointer focus stops rotation before click. Preserve the action the user pressed;
 // keyboard activation instead uses the already focused, current playback state.
 return <Button variant="text" {...props} className={branded('xui-carousel-playback',className)} disabled={disabled||state.disabled||state.ids.length<2||reduced||!state.canNext} aria-label={props['aria-label']??(state.playing?labels.pause:labels.play)} title={reduced?labels.reducedMotion:props.title}
  onPointerDown={event=>{pointerPlaying.current=model.getState().playing;onPointerDown?.(event);}}
  onPointerCancel={event=>{pointerPlaying.current=null;onPointerCancel?.(event);}}
  onBlur={event=>{pointerPlaying.current=null;onBlur?.(event);}}
  onClick={event=>{const playing=event.detail>0?pointerPlaying.current??model.getState().playing:model.getState().playing;pointerPlaying.current=null;onClick?.(event);if(!event.defaultPrevented)model.setPlaying(!playing);}}>{children??(state.playing?labels.pause:labels.play)}</Button>;
}
export type CarouselIndicatorProps=ButtonProps&{itemId:string};
function Indicator({itemId,children,className,onClick,disabled,...props}:CarouselIndicatorProps){const {model,state,labels,prefix}=useCarousel(),index=state.ids.indexOf(itemId),current=state.value===itemId,blocked=!!disabled||state.disabled||index<0;return <Button size="sm" variant="text" {...props} className={branded('xui-carousel-indicator',className)} disabled={blocked} aria-disabled={blocked||current||undefined} aria-current={current?'true':undefined} aria-controls={prefix+'-slide-'+encodeURIComponent(itemId)} aria-label={props['aria-label']??labels.slideLabel(index,state.ids.length)} onClick={event=>{if(current||blocked){event.preventDefault();return;}onClick?.(event);if(!event.defaultPrevented)model.setValue(itemId,'indicator');}}>{children??index+1}</Button>;}
function Indicators({className,...props}:React.ComponentProps<'div'>){const {state,labels}=useCarousel();return <div role="group" aria-label={labels.indicators} {...props} className={cx('xui-carousel-indicators',className)}>{props.children??state.ids.map(id=><Indicator key={id} itemId={id}/>)}</div>;}
function CarouselView<T>(props:CarouselProps<T>){
 const {items,itemKey,renderItem,label,labels:overrides,status='ready',controls,loadingState,emptyState,errorState,onRetry,className,id,ref,onFocusCapture,onBlurCapture,onPointerEnter,onPointerLeave,controller:injected,...rest}=props;
 assertControllerProps(injected,props,['value','defaultValue','onValueChange','disabled','loop','autoPlay','interval']);
 if(!label.trim())throw new TypeError('Carousel needs an accessible label');
 if(!['idle','loading','ready','refreshing','error'].includes(status))throw new TypeError('Invalid Carousel status');
 const ids=items.map(itemKey);if(ids.some(key=>typeof key!=='string'||!key.trim())||new Set(ids).size!==ids.length)throw new TypeError('Carousel items need unique nonempty keys');
 const options=props as CarouselOptions&Slots<T>,latest=React.useRef(options);latest.current=options;
 const model=useOwnedController(injected,()=>createCarouselController({ids,value:options.value,defaultValue:options.defaultValue,disabled:options.disabled,loop:options.loop,autoPlay:options.autoPlay,interval:options.interval,onValueChange:(value,details)=>latest.current.onValueChange?.(value,details)}));
 const state=React.useSyncExternalStore(model.subscribe,model.getState,model.getState),labels={...carouselDefaultLabels,...overrides},generated=React.useId(),prefix=id??generated;
 const root=React.useRef<HTMLElement>(null),viewport=React.useRef<HTMLDivElement>(null),focused=React.useRef<{node:HTMLElement;id:string}|null>(null),previous=React.useRef(state.value);
 const [hover,setHover]=React.useState(false),[hidden,setHidden]=React.useState(false),[reduced,setReduced]=React.useState(false);
 React.useImperativeHandle(ref,()=>root.current!);
 React.useLayoutEffect(()=>{const node=root.current!,other=activeViews.get(model);if(other&&other!==node&&other.isConnected)throw new TypeError('A CarouselController can bind only one active Carousel View');activeViews.set(model,node);return()=>{if(activeViews.get(model)===node)activeViews.delete(model);};},[model]);
 const sameIds=JSON.stringify(ids);
 React.useLayoutEffect(()=>{if(!injected)model.update({ids:JSON.parse(sameIds),value:options.value,disabled:options.disabled,loop:options.loop,autoPlay:options.autoPlay,interval:options.interval});},[model,injected,sameIds,options.value,options.disabled,options.loop,options.autoPlay,options.interval]);
 React.useEffect(()=>{
  const doc=root.current!.ownerDocument,media=doc.defaultView!.matchMedia('(prefers-reduced-motion: reduce)');
  const motion=()=>{setReduced(media.matches);if(media.matches)model.setPlaying(false);},visibility=()=>setHidden(doc.hidden),hide=()=>model.setPlaying(false);
  const outside=(event:Event)=>{if(!root.current?.contains(event.target as Node))focused.current=null;};
  motion();visibility();media.addEventListener('change',motion);doc.addEventListener('visibilitychange',visibility);doc.addEventListener('pointerdown',outside,true);doc.defaultView!.addEventListener('pagehide',hide);
  return()=>{media.removeEventListener('change',motion);doc.removeEventListener('visibilitychange',visibility);doc.removeEventListener('pointerdown',outside,true);doc.defaultView!.removeEventListener('pagehide',hide);};
 },[model]);
 const rotating=state.playing&&!hover&&!hidden&&!reduced&&controls!==false;
 React.useEffect(()=>{if(!rotating)return;const timer=setTimeout(()=>model.next('autoplay'),state.interval);return()=>clearTimeout(timer);},[model,rotating,state.value,state.ids,state.interval]);
 React.useLayoutEffect(()=>{
  const old=focused.current,doc=root.current?.ownerDocument;
  if(previous.current!==state.value&&old&&old.id===previous.current&&doc&&(doc.activeElement===old.node||doc.activeElement===doc.body)&&!state.disabled)viewport.current?.focus();
  previous.current=state.value;
 },[state.value,state.disabled]);
 const gesture=React.useRef<{id:number;x:number;y:number}|null>(null);
 const busy=status==='loading'||status==='refreshing',byId=new Map(items.map(item=>[itemKey(item),item])),hasActive=state.value!==null&&byId.has(state.value);
 const failure=errorState??<ErrorState title={labels.error} onRetry={onRetry} retryLabel={labels.retry}/>;
 const {value:_value,defaultValue:_default,onValueChange:_change,disabled:_disabled,loop:_loop,autoPlay:_auto,interval:_interval,...native}=rest as React.ComponentProps<'section'>&Partial<CarouselOptions>;
 return <CarouselContext.Provider value={{model,state,labels,prefix,reduced}}><DataRegion {...native} ref={root} id={id} className={cx('xui-carousel',className)} role={native.role??'region'} aria-label={label} aria-roledescription={labels.carousel} busy={busy} data-playing={rotating} feedback={hasActive?(status==='error'?failure:busy?<LoadingState layout="inline">{labels.refreshing}</LoadingState>:null):null}
  onPointerEnter={event=>{if(event.pointerType==='mouse')setHover(true);onPointerEnter?.(event);}} onPointerLeave={event=>{if(event.pointerType==='mouse')setHover(false);onPointerLeave?.(event);}}
  onFocusCapture={event=>{const target=event.target as HTMLElement,slide=target.closest<HTMLElement>('[data-carousel-id]');focused.current=slide?{node:target,id:slide.dataset.carouselId!}:null;model.setPlaying(false);onFocusCapture?.(event);}}
  onBlurCapture={event=>{if(event.relatedTarget&&!root.current?.contains(event.relatedTarget as Node))focused.current=null;onBlurCapture?.(event);}}>
  {controls!==false&&<div className="xui-carousel-controls-slot">{controls??<Controls><PlayPause/><Previous/><Indicators/><Next/></Controls>}</div>}
  <div ref={viewport} id={prefix+'-viewport'} className="xui-carousel-viewport" role="group" aria-label={labels.slides} tabIndex={state.disabled?-1:0}
   onKeyDown={event=>{if(event.target!==event.currentTarget||event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.nativeEvent.isComposing||state.disabled)return;const rtl=getComputedStyle(event.currentTarget).direction==='rtl';if(event.key==='ArrowRight'){event.preventDefault();rtl?model.previous('keyboard'):model.next('keyboard');}else if(event.key==='ArrowLeft'){event.preventDefault();rtl?model.next('keyboard'):model.previous('keyboard');}else if(event.key==='Home'||event.key==='End'){event.preventDefault();const key=state.ids[event.key==='Home'?0:state.ids.length-1];if(key)model.setValue(key,'keyboard');}}}
   onPointerDown={event=>{if(state.disabled||event.pointerType==='mouse'||event.button!==0)return;const target=event.target as Element,control=target.closest('a,button,input,textarea,select,[contenteditable],[tabindex],[role="button"],[role="link"]');if(control&&control!==event.currentTarget)return;gesture.current={id:event.pointerId,x:event.clientX,y:event.clientY};}}
   onPointerCancel={()=>{gesture.current=null;}} onPointerUp={event=>{const start=gesture.current;gesture.current=null;if(!start||start.id!==event.pointerId)return;const x=event.clientX-start.x,y=event.clientY-start.y,threshold=Math.max(event.currentTarget.clientWidth*.12,parseFloat(getComputedStyle(event.currentTarget).fontSize)*2);if(Math.abs(x)<threshold||Math.abs(x)<=Math.abs(y))return;const next=(x<0)!==(getComputedStyle(event.currentTarget).direction==='rtl');next?model.next('swipe'):model.previous('swipe');}}>
   {state.ids.map((key,index)=>{if(!byId.has(key))return null;const item=byId.get(key) as T;const active=state.value===key;return <div key={key} id={prefix+'-slide-'+encodeURIComponent(key)} className="xui-carousel-slide" role="group" aria-roledescription={labels.slide} aria-label={labels.slideLabel(index,state.ids.length)} aria-hidden={!active||undefined} inert={!active} data-active={active} data-carousel-id={key}>{renderItem(item,{id:key,index,active,disabled:state.disabled})}</div>;})}
   {!hasActive&&<div className="xui-carousel-placeholder">{busy?(loadingState??<LoadingState>{labels.loading}</LoadingState>):status==='error'?failure:(emptyState??<EmptyState title={status==='idle'?labels.idle:items.length?labels.unselected:labels.empty} align="center"/>)}</div>}
  </div>
  <span className="xui-carousel-announcement" role="status" aria-live={rotating?'off':'polite'} aria-atomic="true">{hasActive?labels.slideLabel(state.index,state.ids.length):''}</span>
 </DataRegion></CarouselContext.Provider>;
}
/** Viewport/items retain one model-owned identity; controls are replaceable public slots. */
export const Carousel=/* @__PURE__ */Object.assign(CarouselView,{Controls,Previous,Next,Indicators,Indicator,PlayPause});
