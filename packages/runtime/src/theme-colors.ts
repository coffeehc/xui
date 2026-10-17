import {getThemeService} from './theme-access.js';
import type {ThemeController} from './theme-service.js';
/** Normalized, encoded sRGB channels sampled at 8-bit precision; not linear-light WebGL values. */
export interface ThemeColor {readonly colorSpace:'srgb';readonly rgba:readonly [number,number,number,number];readonly css:string}
export type ThemeColors<T extends Record<string,string>>=Readonly<{[K in keyof T]:ThemeColor|null}>;
export interface ThemeColorReadOptions {element?:HTMLElement;document?:Document}
/** Resolve actual CSS in its element context. Missing/unsupported colors are null, never guessed black. */
export function readThemeColors<T extends Record<string,string>>(tokens:T,options:ThemeColorReadOptions={}):ThemeColors<T>{
 const doc=options.element?.ownerDocument??options.document??(typeof document==='undefined'?undefined:document),element=options.element??doc?.documentElement;
 const colors:Record<string,ThemeColor|null>=Object.fromEntries(Object.keys(tokens).map(key=>[key,null]));
 if(!doc||!element||!doc.defaultView)return Object.freeze(colors) as ThemeColors<T>;
 const canvas=doc.createElement('canvas');canvas.width=canvas.height=1;
 let context:CanvasRenderingContext2D|null;
 try{context=canvas.getContext('2d',{willReadFrequently:true,colorSpace:'srgb'});}catch{return Object.freeze(colors) as ThemeColors<T>;}
 if(!context)return Object.freeze(colors) as ThemeColors<T>;
 const probe=doc.createElement('span');probe.hidden=true;
 try{
  const styles=doc.defaultView.getComputedStyle(element);
  for(const [key,token] of Object.entries(tokens)){
   if(!/^--[\w-]+$/.test(token))continue;
   const value=styles.getPropertyValue(token).trim();if(!value)continue;
   // Set while detached: the observer watches ancestor attributes, never this temporary probe.
   probe.remove();probe.style.color='';probe.style.color=value;if(!probe.style.color)continue;
   element.append(probe);const resolved=doc.defaultView.getComputedStyle(probe).color;probe.remove();
   context.fillStyle='#010203';context.fillStyle=resolved;const first=context.fillStyle;
   context.fillStyle='#040506';context.fillStyle=resolved;if(first!==context.fillStyle)continue;
   context.clearRect(0,0,1,1);context.fillRect(0,0,1,1);
   try{
    const [r,g,b,a]=context.getImageData(0,0,1,1,{colorSpace:'srgb'}).data;
    colors[key]=Object.freeze({colorSpace:'srgb',rgba:Object.freeze([r/255,g/255,b/255,a/255]) as ThemeColor['rgba'],css:`rgba(${r}, ${g}, ${b}, ${a/255})`});
   }catch{/* Missing readback support is an explicit unavailable color. */}
  }
 }finally{probe.remove();}
 return Object.freeze(colors) as ThemeColors<T>;
}
export interface ThemeColorObserver<T extends Record<string,string>> {getState():ThemeColors<T>;refresh():void;dispose():void}
export interface ThemeColorObserveOptions extends ThemeColorReadOptions {
 theme?:Pick<ThemeController,'subscribe'>;
 signal?:AbortSignal;
}
/** Borrow the existing theme owner. Stylesheet replacement/CSSOM edits require explicit refresh(). */
export function observeThemeColors<T extends Record<string,string>>(tokens:T,listener:(colors:ThemeColors<T>)=>void,options:ThemeColorObserveOptions={}):ThemeColorObserver<T>{
 const mapping=Object.freeze({...tokens}) as T,doc=options.element?.ownerDocument??options.document??(typeof document==='undefined'?undefined:document),win=doc?.defaultView;
 if(!doc||!win)throw new Error('A document Window is required to observe theme colors');
 let disposed=!!options.signal?.aborted,signature='',state=Object.freeze(Object.fromEntries(Object.keys(mapping).map(key=>[key,null]))) as ThemeColors<T>,off=()=>{};
 const observer=new win.MutationObserver(()=>refresh());
 const dispose=()=>{if(disposed)return;disposed=true;off();observer.disconnect();win.removeEventListener('resize',refresh);options.signal?.removeEventListener('abort',dispose);};
 const refresh=()=>{
  if(disposed)return;
  const next=readThemeColors(mapping,options),key=JSON.stringify(next);
  if(key!==signature){signature=key;state=next;try{listener(state);}catch{/* Renderer errors cannot interrupt the shared theme owner. */}}
 };
 if(!disposed){
  try{
  for(let element:HTMLElement|null=options.element??doc.documentElement;element;element=element.parentElement)observer.observe(element,{attributes:true,attributeFilter:['class','style','data-theme','data-theme-effective','data-theme-preset']});
  options.signal?.addEventListener('abort',dispose,{once:true});win.addEventListener('resize',refresh);
  const unsubscribe=(options.theme??getThemeService(win)).subscribe(refresh);if(disposed)unsubscribe();else off=unsubscribe;
  refresh();
  }catch(error){dispose();throw error;}
 }
 return {getState:()=>state,refresh,dispose};
}
