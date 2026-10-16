import {getClipboardService} from './clipboard.js';

/** Shared display contracts. These helpers never read the clipboard or own routing. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingRole = 'page' | 'section';
export type TextTone = 'default' | 'muted' | 'error' | 'success';
export type CopyStatus = 'idle' | 'copying' | 'copied' | 'error';
export type ClipboardWriter = (value: string) => void | Promise<void>;
export interface CopyableLabels {copy:string;copying:string;copied:string;error:string}
export const copyableLabels:Readonly<CopyableLabels> = Object.freeze({copy:'复制',copying:'正在复制',copied:'已复制',error:'复制失败，请选择文本手动复制'});
export interface CopyControllerOptions {value:string;disabled?:boolean;writeText?:ClipboardWriter;onStatusChange?:(status:CopyStatus)=>void}
export interface CopyControllerState {readonly value:string;readonly disabled:boolean;readonly status:CopyStatus}
export interface CopyController {
 getState():Readonly<CopyControllerState>;getStatus():CopyStatus;subscribe(listener:()=>void):()=>void;
 update(next:CopyControllerOptions):void;copy():Promise<void>;destroy():void;
}
/** Serializes actual clipboard writes. A new value invalidates feedback, not an in-flight write. */
export function createCopyController(options:CopyControllerOptions):CopyController {
  let current=options,status:CopyStatus='idle',generation=0,stateRevision=0,destroyed=false,pending=false,activeWrite:AbortController|undefined;const listeners=new Set<()=>void>();
  let state:Readonly<CopyControllerState>=Object.freeze({value:current.value,disabled:!!current.disabled,status});
  const publish=(next:CopyStatus)=>{status=next;state=Object.freeze({value:current.value,disabled:!!current.disabled,status});const published=state,revision=++stateRevision;current.onStatusChange?.(next);if(!destroyed&&revision===stateRevision&&state===published)for(const listener of [...listeners])if(listeners.has(listener))listener();};
  return Object.freeze({getState:()=>state,getStatus:()=>status,
    subscribe(listener:()=>void){if(destroyed)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
    update(next:CopyControllerOptions){if(destroyed)return;const changed=next.value!==current.value||next.writeText!==current.writeText||next.disabled!==current.disabled;current=next;if(changed){generation++;publish(pending?'copying':'idle');}},
    async copy(){
      if(destroyed||current.disabled||pending)return;
      const intent=++generation,value=current.value,writer=current.writeText;pending=true;publish('copying');
      try {
        if(writer)await writer(value);
        else {activeWrite=new AbortController();await getClipboardService().writeText(value,{signal:activeWrite.signal});}
        if(!destroyed&&intent===generation)publish('copied');
      }catch {if(!destroyed&&intent===generation)publish('error');}
      finally {activeWrite=undefined;pending=false;if(!destroyed&&intent!==generation)publish('idle');}
    },
    destroy(){destroyed=true;generation++;activeWrite?.abort();listeners.clear();},
  });
}

export interface PasswordInputOptions {defaultVisible?:boolean;onVisibleChange?:(visible:boolean)=>void}
export interface PasswordInputState {readonly visible:boolean;readonly cleared:boolean}
/** Secret-free view state; the DOM input remains the only password value owner. */
export interface PasswordInputController {
 getState():Readonly<PasswordInputState>;subscribe(listener:()=>void):()=>void;update(next:Partial<PasswordInputOptions>):void;
 setVisible(visible:boolean):void;toggle():void;hide():void;markCleared():void;markEdited():void;destroy():void;
}
export function createPasswordInputController(options:PasswordInputOptions={}) {
 let current={...options},visible=!!options.defaultVisible,cleared=false,destroyed=false;const listeners=new Set<()=>void>();
 const snapshot=()=>Object.freeze({visible,cleared});let state:Readonly<PasswordInputState>=snapshot();
 const publish=(notify=true)=>{if(destroyed)return;state=snapshot();for(const listener of [...listeners])if(listeners.has(listener))listener();if(notify)current.onVisibleChange?.(visible);};
 const setVisible=(next:boolean)=>{if(destroyed||typeof next!=='boolean'||next===visible)return;visible=next;publish();};
 return Object.freeze({getState:()=>state,subscribe(listener:()=>void){if(destroyed)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
  update(next:Partial<PasswordInputOptions>){if(destroyed)return;current={...current,...next};},setVisible,toggle(){setVisible(!visible);},hide(){setVisible(false);},
  markCleared(){if(destroyed)return;const changed=!cleared||visible;cleared=true;visible=false;if(changed)publish();},
  markEdited(){if(destroyed||!cleared)return;cleared=false;publish(false);},destroy(){if(destroyed)return;destroyed=true;listeners.clear();current={};}});
}
/** Supply a real intrinsic ratio before loading; dimensions are CSS pixels, never inferred. */
export type ImageSize = {width:number;height:number;aspectRatio?:never} | {aspectRatio:number;width?:number;height?:never};
export type ImageStatus = 'loading' | 'loaded' | 'error';
export type ImageOptions = ImageSize & {src:string;alt:string;retryKey?:string|number;fit?:'contain'|'cover';fallback?:string;loadingLabel?:string;onStatusChange?:(status:ImageStatus)=>void};
export function validateImageOptions(options:ImageOptions):void {
  if(typeof options.alt!=='string'||typeof options.src!=='string')throw new TypeError('Image requires explicit alt and src strings');
  for(const key of ['width','height','aspectRatio'] as const){const value=options[key];if(value!==undefined&&(!Number.isFinite(value)||value<=0))throw new TypeError(`Image ${key} must be finite and positive`);}
  if(options.aspectRatio===undefined&&(options.width===undefined||options.height===undefined))throw new TypeError('Image requires width/height or aspectRatio');
  if(options.aspectRatio!==undefined&&options.height!==undefined)throw new TypeError('Choose image dimensions or aspectRatio');
}

/** Content cards are nested sections, never a second page-level heading. */
export type CardHeadingLevel=2|3|4|5|6;
/** Passive ownership is neutral; explicit semantic statuses use the existing Badge tones. */
export interface CardBadge {
 label:string;tone?:'neutral'|'info'|'success'|'warning'|'error';
 /** Card defaults to a soft neutral label; plain preserves an unframed label. */
 variant?:'plain'|'soft';
 /** Explicit CSS foreground, preferably a public semantic variable. */
 color?:string;
}
