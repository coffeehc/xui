import {bindOverflowTextPresentation} from './overflow-text.js';
import {createCopyController,copyableLabels,validateImageOptions,type HeadingLevel,type HeadingRole,type TextTone,type CopyableLabels,type ClipboardWriter,type CopyStatus,type ImageOptions,type ImageStatus} from './display.js';
export type {HeadingLevel,HeadingRole,TextTone,CopyableLabels,ClipboardWriter,CopyStatus,ImageOptions,ImageSize,ImageStatus} from './display.js';
export function createTypographyHeading(doc:Document,options:{level:HeadingLevel;visualRole?:HeadingRole;text:string}){if(!Number.isInteger(options.level)||options.level<1||options.level>6)throw new TypeError('Heading level must be 1–6');const element=doc.createElement(`h${options.level}`);element.className='xui-heading';element.dataset.visualRole=options.visualRole??'section';element.textContent=options.text;return element;}
export function createTypographyText(doc:Document,options:{text:string;as?:'span'|'p';tone?:TextTone}){const element=doc.createElement(options.as??'span');element.className='xui-text';element.dataset.tone=options.tone??'default';element.textContent=options.text;return element;}
export function createTypographyLink(doc:Document,options:{text:string;href:string;target?:string;download?:string;rel?:string}){const element=doc.createElement('a');element.className='xui-link';element.textContent=options.text;element.href=options.href;for(const key of ['target','download','rel'] as const)if(options[key]!==undefined)element.setAttribute(key,options[key]);return element;}
export function createTypographyCode(doc:Document,options:{value:string;block?:boolean}){const code=doc.createElement('code');code.className='xui-code';code.textContent=options.value;if(!options.block)return code;const pre=doc.createElement('pre');pre.className='xui-code-block';pre.append(code);return pre;}
export function createSeparator(doc:Document,options:{orientation?:'horizontal'|'vertical';decorative?:boolean}={}){const element=doc.createElement('div');element.className='xui-separator';element.dataset.orientation=options.orientation??'horizontal';element.setAttribute('role',options.decorative?'none':'separator');if(options.decorative)element.setAttribute('aria-hidden','true');else element.setAttribute('aria-orientation',options.orientation??'horizontal');return element;}
export type NativeTagOptions={label:string;disabled?:boolean} & ({onRemove?:never;removeLabel?:never;onRemoveFocus?:never}|{onRemove:()=>void;removeLabel:string;onRemoveFocus?:(trigger:HTMLButtonElement)=>void});
export function createTag(doc:Document,initial:NativeTagOptions){
  const element=doc.createElement('span'),label=doc.createElement('span'),button=doc.createElement('button');let options=initial,destroyed=false;
  element.className='xui-badge xui-tag';label.className='xui-tag-label';button.className='xui-button';button.dataset.variant='ghost';button.dataset.size='xs';button.type='button';button.textContent='×';element.append(label,button);
  const update=(next:NativeTagOptions)=>{if(destroyed)return;if(next.onRemove&&(!next.removeLabel||!next.removeLabel.trim()))throw new TypeError('Removable Tag requires removeLabel');options=next;label.textContent=next.label;button.hidden=!next.onRemove;button.disabled=!!next.disabled;button.setAttribute('aria-label',next.removeLabel??'');};
  const remove=()=>{if(destroyed||options.disabled||!options.onRemove)return;const current=options;current.onRemove!();current.onRemoveFocus?.(button);};button.addEventListener('click',remove);update(initial);
  return Object.freeze({element,removeButton:button,update,destroy(){if(destroyed)return;destroyed=true;button.removeEventListener('click',remove);element.remove();}});
}
export interface NativeCopyableOptions {value:string;disabled?:boolean;writeText?:ClipboardWriter;labels?:Partial<CopyableLabels>;onStatusChange?:(status:CopyStatus)=>void}
export function createCopyable(doc:Document,initial:NativeCopyableOptions){
  const element=doc.createElement('span'),value=doc.createElement('code'),button=doc.createElement('button'),feedback=doc.createElement('span');let options=initial,destroyed=false;
  element.className='xui-copyable';value.className='xui-code';button.className='xui-button';button.dataset.variant='ghost';button.dataset.size='xs';button.type='button';feedback.className='xui-copyable-status';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');element.append(value,button,feedback);
  const render=(status:CopyStatus)=>{const labels={...copyableLabels,...options.labels};element.dataset.status=status;value.textContent=options.value;button.textContent=labels.copy;button.disabled=!!options.disabled||status==='copying';feedback.textContent=status==='idle'?'':labels[status];};
  const notify=(status:CopyStatus)=>{render(status);options.onStatusChange?.(status);};
  const writeDefault:ClipboardWriter=value=>{const clipboard=doc.defaultView?.navigator?.clipboard;if(!clipboard?.writeText)throw new Error('Clipboard unavailable');return clipboard.writeText(value);};
  const owner=createCopyController({...options,writeText:options.writeText??writeDefault,onStatusChange:notify}),copy=()=>{void owner.copy();};button.addEventListener('click',copy);render('idle');
  return Object.freeze({element,button,update(next:NativeCopyableOptions){if(destroyed)return;options=next;owner.update({...next,writeText:next.writeText??writeDefault,onStatusChange:notify});render(owner.getStatus());},destroy(){if(destroyed)return;destroyed=true;owner.destroy();button.removeEventListener('click',copy);element.remove();}});
}
export function createImage(doc:Document,initial:ImageOptions){
  validateImageOptions(initial);const element=doc.createElement('span'),placeholder=doc.createElement('span');element.className='xui-image';let options=initial,destroyed=false,generation=0,image:HTMLImageElement|null=null,status:ImageStatus=initial.src?'loading':'error',release=()=>{};
  const render=()=>{element.dataset.fit=options.fit??'contain';element.style.width=options.width===undefined?'100%':`${options.width}px`;element.style.aspectRatio=String(options.aspectRatio??options.width!/options.height!);element.dataset.status=status;
    const message=status==='loading'?(options.loadingLabel??'图片加载中'):(options.fallback??'图片无法加载');placeholder.className=status==='loading'?'xui-image-placeholder xui-skeleton':'xui-image-placeholder';placeholder.textContent=message;placeholder.hidden=status==='loaded';placeholder.removeAttribute('role');placeholder.removeAttribute('aria-label');placeholder.removeAttribute('aria-hidden');
    if(options.alt){placeholder.setAttribute('role','img');placeholder.setAttribute('aria-label',`${options.alt}：${message}`);}else placeholder.setAttribute('aria-hidden','true');if(image){image.alt=options.alt;image.hidden=status!=='loaded';}
  };
  const load=()=>{release();image?.remove();const token=++generation;image=doc.createElement('img');const current=image;current.className='xui-image-content';status=options.src?'loading':'error';
    const complete=(next:ImageStatus)=>{if(destroyed||token!==generation)return;status=next;render();options.onStatusChange?.(next);};const loaded=()=>complete('loaded'),failed=()=>complete('error');current.addEventListener('load',loaded);current.addEventListener('error',failed);release=()=>{current.removeEventListener('load',loaded);current.removeEventListener('error',failed);};element.append(current,placeholder);render();if(options.src)current.src=options.src;
  };load();
  return Object.freeze({element,update(next:ImageOptions){if(destroyed)return;validateImageOptions(next);const changed=next.src!==options.src||next.retryKey!==options.retryKey;options=next;if(changed)load();else render();},destroy(){if(destroyed)return;destroyed=true;generation++;release();image?.removeAttribute('src');element.remove();}});
}

/** Safe text only. The optional target is an existing containing surface with keyboard actions. */
export interface OverflowTextOptions {text:string;interactionTarget?:HTMLElement|null}
export interface OverflowTextController {
 readonly element:HTMLSpanElement;
 /** Replace the declared text/interaction target, retaining the element and host focus. */
 update(options:OverflowTextOptions):void;
 /** Cancel motion and release measurements/listeners; removes only the owned element. */
 destroy():void;
}
export function createOverflowText(doc:Document,initial:OverflowTextOptions):OverflowTextController {
 const element=doc.createElement('span'),track=doc.createElement('span');element.className='xui-overflow-text';track.className='xui-overflow-text-content';element.append(track);
 let options=initial,dead=false;
 const check=(next:OverflowTextOptions)=>{if(typeof next.text!=='string')throw new TypeError('OverflowText requires text');if(next.interactionTarget&&next.interactionTarget.ownerDocument!==doc)throw new TypeError('OverflowText target must share its document');};
 check(initial);track.textContent=initial.text;const owner=bindOverflowTextPresentation(element,track,()=>options.interactionTarget??null);
 return {element,update(next){if(dead)return;check(next);options=next;if(track.textContent!==next.text)track.textContent=next.text;owner.refresh();},destroy(){if(dead)return;dead=true;owner.destroy();element.remove();}};
}
