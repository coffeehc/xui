import {bindOverflowTextPresentation} from './overflow-text.js';
import * as React from 'react';
import {createCopyController,copyableLabels,validateImageOptions,type HeadingLevel,type HeadingRole,type TextTone,type CopyStatus,type CopyableLabels,type ClipboardWriter,type ImageOptions,type ImageStatus} from '@coffeehc/xui-runtime/display';
import {Button} from './button.js';
import {cx,hasContent} from './shared.js';
import {Surface,Badge} from './feedback.js';
import type {CardHeadingLevel,CardBadge} from '@coffeehc/xui-runtime/display';
export type {CardHeadingLevel,CardBadge} from '@coffeehc/xui-runtime/display';
export type {HeadingLevel,HeadingRole,TextTone,CopyStatus,CopyableLabels,ClipboardWriter,ImageOptions,ImageSize,ImageStatus} from '@coffeehc/xui-runtime/display';
export type TypographyHeadingProps = React.ComponentProps<'h2'> & {level:HeadingLevel;visualRole?:HeadingRole};
export type TypographyTextProps = ((React.ComponentProps<'span'> & {as?:'span'}) | (React.ComponentProps<'p'> & {as:'p'})) & {tone?:TextTone};
export type TypographyLinkProps = React.ComponentProps<'a'>;
export type TypographyCodeProps = Omit<React.ComponentProps<'code'>,'children'|'dangerouslySetInnerHTML'> & {value:string;block?:boolean};
function Heading({level,visualRole='section',className,...props}:TypographyHeadingProps){if(!Number.isInteger(level)||level<1||level>6)throw new TypeError('Heading level must be 1–6');const Tag=`h${level}` as 'h2';return <Tag {...props} className={cx('xui-heading',className)} data-visual-role={visualRole}/>;}
function Text({as:Tag='span',tone='default',className,...props}:TypographyTextProps){return React.createElement(Tag,{...props,className:cx('xui-text',className),'data-tone':tone});}
function Link({className,...props}:TypographyLinkProps){return <a {...props} className={cx('xui-link',className)}/>;}
function Code({value,block=false,className,...props}:TypographyCodeProps){const code=<code {...props} className={cx('xui-code',className)}>{value}</code>;return block?<pre className="xui-code-block">{code}</pre>:code;}
export const Typography={Heading,Text,Link,Code};
export type SeparatorProps=Omit<React.ComponentProps<'div'>,'children'> & {orientation?:'horizontal'|'vertical';decorative?:boolean};
export function Separator({orientation='horizontal',decorative=false,className,...props}:SeparatorProps){return <div {...props} className={cx('xui-separator',className)} role={decorative?'none':'separator'} aria-hidden={decorative||undefined} aria-orientation={decorative?undefined:orientation} data-orientation={orientation}/>;}
export type TagProps=Omit<React.ComponentProps<'span'>,'children'> & {label:string;disabled?:boolean} & ({onRemove?:never;removeLabel?:never;onRemoveFocus?:never}|{onRemove:()=>void;removeLabel:string;onRemoveFocus?:(trigger:HTMLButtonElement)=>void});
/** Removal is an intent. The host owns collection state and chooses the next focus target. */
export function Tag({label,disabled=false,onRemove,removeLabel,onRemoveFocus,className,...props}:TagProps){if(onRemove&&(!removeLabel||!removeLabel.trim()))throw new TypeError('Removable Tag requires removeLabel');return <span {...props} className={cx('xui-badge xui-tag',className)}><span className="xui-tag-label">{label}</span>{onRemove&&<Button variant="ghost" size="xs" disabled={disabled} aria-label={removeLabel} onClick={event=>{const trigger=event.currentTarget as HTMLButtonElement;onRemove();onRemoveFocus?.(trigger);}}>×</Button>}</span>;}
export type CopyableProps=Omit<React.ComponentProps<'span'>,'children'> & {value:string;disabled?:boolean;writeText?:ClipboardWriter;labels?:Partial<CopyableLabels>;onStatusChange?:(status:CopyStatus)=>void};
export function Copyable({value,disabled=false,writeText,labels:overrides,onStatusChange,className,...props}:CopyableProps){
  const [status,setStatus]=React.useState<CopyStatus>('idle'),owner=React.useRef<ReturnType<typeof createCopyController>|null>(null),labels={...copyableLabels,...overrides};
  const notify=React.useCallback((next:CopyStatus)=>{setStatus(next);onStatusChange?.(next);},[onStatusChange]);
  React.useLayoutEffect(()=>{const instance=createCopyController({value,disabled,writeText,onStatusChange:notify});owner.current=instance;return()=>{instance.destroy();if(owner.current===instance)owner.current=null;};},[]);
  React.useLayoutEffect(()=>{owner.current?.update({value,disabled,writeText,onStatusChange:notify});},[value,disabled,writeText,notify]);
  return <span {...props} className={cx('xui-copyable',className)} data-status={status}><code className="xui-code">{value}</code><Button variant="ghost" size="xs" disabled={disabled||status==='copying'} onClick={()=>{void owner.current?.copy();}}>{labels.copy}</Button><span className="xui-copyable-status" role="status" aria-live="polite">{status==='idle'?'':labels[status]}</span></span>;
}
export type ImageProps=ImageOptions & Omit<React.ComponentProps<'span'>,'children'|'onLoad'|'onError'>;
function ImageResource({src,alt,retryKey,fallback='图片无法加载',loadingLabel='图片加载中',onStatusChange}:{src:string;alt:string;retryKey?:string|number;fallback?:string;loadingLabel?:string;onStatusChange?:(status:ImageStatus)=>void}){
  const [status,setStatus]=React.useState<ImageStatus>(src?'loading':'error'),active=React.useRef(true),image=React.useRef<HTMLImageElement>(null),settled=React.useRef<ImageStatus|null>(null);
  const complete=(next:ImageStatus)=>{if(active.current&&settled.current!==next){settled.current=next;setStatus(next);onStatusChange?.(next);}};
  React.useLayoutEffect(()=>{active.current=true;const node=image.current;if(src&&node?.complete)complete(node.naturalWidth>0?'loaded':'error');return()=>{active.current=false;};},[]);
  return <><img ref={image} className="xui-image-content" src={src||undefined} alt={alt} hidden={status!=='loaded'} onLoad={()=>complete('loaded')} onError={()=>complete('error')}/>{status!=='loaded'&&<span className={status==='loading'?'xui-image-placeholder xui-skeleton':'xui-image-placeholder'} role={alt?'img':undefined} aria-label={alt?`${alt}：${status==='loading'?loadingLabel:fallback}`:undefined} aria-hidden={!alt||undefined}>{status==='error'?fallback:loadingLabel}</span>}</>;
}
/** Changing src or retryKey replaces only the resource, preserving the reserved frame. */
export function Image({src,alt,width,height,aspectRatio,fit='contain',retryKey,fallback,loadingLabel,onStatusChange,className,style,...props}:ImageProps){
  validateImageOptions({src,alt,width,height,aspectRatio} as ImageOptions);
  return <span {...props} className={cx('xui-image',className)} data-fit={fit} style={{...style,width:width===undefined?'100%':width,aspectRatio:aspectRatio??width!/height!}}><ImageResource key={JSON.stringify([src,retryKey])} {...{src,alt,retryKey,fallback,loadingLabel,onStatusChange}}/></span>;
}

/** A non-interactive text part. Keep headings, icons, badges and actions outside it. */
export type OverflowTextProps=Omit<React.ComponentProps<'span'>,'children'|'dangerouslySetInnerHTML'>&{
 text:string;
 /** Existing containing card/control; its own keyboard actions trigger the same reveal. */
 interactionRef?:React.RefObject<HTMLElement|null>;
};
export function OverflowText({text,interactionRef,ref,className,...props}:OverflowTextProps){
 const viewport=React.useRef<HTMLSpanElement>(null),track=React.useRef<HTMLSpanElement>(null),target=React.useRef(interactionRef);target.current=interactionRef;
 const binding=React.useRef<ReturnType<typeof bindOverflowTextPresentation>|null>(null);
 React.useImperativeHandle(ref,()=>viewport.current!,[]);
 React.useLayoutEffect(()=>{binding.current=bindOverflowTextPresentation(viewport.current!,track.current!,()=>target.current?.current??null);return()=>{binding.current?.destroy();binding.current=null;};},[]);
 React.useLayoutEffect(()=>binding.current?.refresh());
 return <span {...props} ref={viewport} className={cx('xui-overflow-text',className)}><span ref={track} className="xui-overflow-text-content">{text}</span></span>;
}

/** Public card composition. Slots define geometry; data, permissions and actions stay with the host. */
export type CardProps=Omit<React.ComponentProps<'section'>,'title'|'children'>&{
 title:string;headingLevel?:CardHeadingLevel;icon?:React.ReactNode;badge?:CardBadge;
 /** Auxiliary header actions, such as an existing Menu trigger. */
 actions?:React.ReactNode;
 /** Description and business content share the single natural-height content region. */
 description?:string;children?:React.ReactNode;
 /** Read-only facts and business actions occupy separate footer groups. */
 footerMeta?:React.ReactNode;footerActions?:React.ReactNode;
};
export function Card({title,headingLevel=3,icon,badge,actions,description,children,footerMeta,footerActions,ref,className,...props}:CardProps){
 if(typeof title!=='string'||!title.trim()||!Number.isInteger(headingLevel)||headingLevel<2||headingLevel>6)throw new TypeError('Card requires a nonempty title and heading level 2–6');
 if(badge&&(typeof badge.label!=='string'||!badge.label.trim()||badge.tone&&!['neutral','info','success','warning','error'].includes(badge.tone)))throw new TypeError('Invalid Card badge');
 const root=React.useRef<HTMLElement>(null);React.useImperativeHandle(ref,()=>root.current!,[]);
 return <Surface {...props} ref={root} className={cx('xui-card',className)}><header className="xui-toolbar xui-card-header"><div className="xui-toolbar xui-card-heading">{hasContent(icon)&&<span className="xui-card-icon" aria-hidden="true">{icon}</span>}<Typography.Heading level={headingLevel} className="xui-card-title"><OverflowText text={title} interactionRef={root}/></Typography.Heading></div>{(badge||hasContent(actions))&&<div className="xui-toolbar xui-card-trailing">{badge&&<Badge tone={badge.tone??'neutral'}>{badge.label}</Badge>}{hasContent(actions)&&<div className="xui-toolbar xui-card-actions">{actions}</div>}</div>}</header>{(description||hasContent(children))&&<div className="xui-card-content">{description&&<Typography.Text as="p" tone="muted" className="xui-card-description">{description}</Typography.Text>}{hasContent(children)&&<div className="xui-card-body">{children}</div>}</div>}{(hasContent(footerMeta)||hasContent(footerActions))&&<footer className="xui-toolbar xui-card-footer">{hasContent(footerMeta)&&<div className="xui-text xui-card-meta" data-tone="muted">{footerMeta}</div>}{hasContent(footerActions)&&<div className="xui-toolbar xui-card-actions">{footerActions}</div>}</footer>}</Surface>;
}
