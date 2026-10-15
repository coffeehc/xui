/** Shared display contracts. These helpers never read the clipboard or own routing. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingRole = 'page' | 'section';
export type TextTone = 'default' | 'muted' | 'error' | 'success';
export type CopyStatus = 'idle' | 'copying' | 'copied' | 'error';
export type ClipboardWriter = (value: string) => void | Promise<void>;
export interface CopyableLabels {copy:string;copying:string;copied:string;error:string}
export const copyableLabels:Readonly<CopyableLabels> = Object.freeze({copy:'复制',copying:'正在复制',copied:'已复制',error:'复制失败，请选择文本手动复制'});
/** Serializes actual clipboard writes. A new value invalidates feedback, not an in-flight write. */
export function createCopyController(options:{value:string;disabled?:boolean;writeText?:ClipboardWriter;onStatusChange?:(status:CopyStatus)=>void}) {
  let current=options,status:CopyStatus='idle',generation=0,destroyed=false,pending=false;
  const publish=(next:CopyStatus)=>{status=next;current.onStatusChange?.(next);};
  return Object.freeze({getStatus:()=>status,
    update(next:typeof options){if(destroyed)return;const changed=next.value!==current.value||next.writeText!==current.writeText||next.disabled!==current.disabled;current=next;if(changed){generation++;publish(pending?'copying':'idle');}},
    async copy(){
      if(destroyed||current.disabled||pending)return;
      const intent=++generation,value=current.value,writer=current.writeText;pending=true;publish('copying');
      try {
        if(writer)await writer(value);
        else {const clipboard=globalThis.navigator?.clipboard;if(!clipboard?.writeText)throw new Error('Clipboard unavailable');await clipboard.writeText(value);}
        if(!destroyed&&intent===generation)publish('copied');
      }catch {if(!destroyed&&intent===generation)publish('error');}
      finally {pending=false;if(!destroyed&&intent!==generation)publish('idle');}
    },
    destroy(){destroyed=true;generation++;},
  });
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
export interface CardBadge {label:string;tone?:'neutral'|'info'|'success'|'warning'|'error'}
