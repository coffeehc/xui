import {bindOverflowTextPresentation} from './overflow-text.js';
import {OverflowTextInteraction} from './overflow-text-context.js';
import {linkifyText} from '@coffeehc/xui-runtime/text-links';
import * as React from 'react';
import {createCopyController,copyableLabels,validateImageOptions,type HeadingLevel,type HeadingRole,type TextTone,type CopyStatus,type CopyableLabels,type ClipboardWriter,type ImageOptions,type ImageStatus} from '@coffeehc/xui-runtime/display';
import {Button} from './button.js';
import {cx,hasContent} from './shared.js';
import {useOwnedController,type ControllerProps,assertControllerProps} from './controller.js';
import {Surface,Badge} from './feedback.js';
import type {CardHeadingLevel,CardBadge} from '@coffeehc/xui-runtime/display';
export type {CardHeadingLevel,CardBadge} from '@coffeehc/xui-runtime/display';
export type {HeadingLevel,HeadingRole,TextTone,CopyStatus,CopyableLabels,ClipboardWriter,ImageOptions,ImageSize,ImageStatus} from '@coffeehc/xui-runtime/display';
export type TypographyHeadingProps = React.ComponentProps<'h2'> & {level:HeadingLevel;visualRole?:HeadingRole};
export type TypographyTextProps = ((Omit<React.ComponentProps<'span'>,'color'> & {as?:'span'}) | (Omit<React.ComponentProps<'p'>,'color'> & {as:'p'})) & {
 tone?:TextTone;
 /** Explicit foreground only; use a public semantic CSS variable, without changing the text role. */
 color?:React.CSSProperties['color'];
};
export type TypographyLinkProps = React.ComponentProps<'a'>;
export type TypographyCodeProps = Omit<React.ComponentProps<'code'>,'children'|'dangerouslySetInnerHTML'> & {value:string;block?:boolean};
function Heading({level,visualRole='section',className,...props}:TypographyHeadingProps){if(!Number.isInteger(level)||level<1||level>6)throw new TypeError('Heading level must be 1–6');const Tag=`h${level}` as 'h2';return <Tag {...props} className={cx('xui-heading',className)} data-visual-role={visualRole}/>;}
function Text({as:Tag='span',tone='default',color,style,className,...props}:TypographyTextProps){return React.createElement(Tag,{...props,className:cx('xui-text',className),'data-tone':tone,style:color===undefined?style:{...style,color}});}
function Link({className,...props}:TypographyLinkProps){return <a {...props} className={cx('xui-link',className)}/>;}
function Code({value,block=false,className,...props}:TypographyCodeProps){const code=<code {...props} className={cx('xui-code',className)}>{value}</code>;return block?<pre className="xui-code-block">{code}</pre>:code;}
export type LinkedTextProps=Omit<React.ComponentProps<'span'>,'children'|'dangerouslySetInnerHTML'>&{
 value?:string|number|null;children?:React.ReactNode;
 /** Native link props; href and content always come from the safe text parser. */
 linkProps?:Omit<TypographyLinkProps,'href'|'children'|'dangerouslySetInnerHTML'|'ref'>;
 /** Explicit opt-in for links inside independently interactive rows/cards. */
 stopPropagation?:boolean;
};
export function LinkedText({value,children,linkProps,stopPropagation=false,className,...props}:LinkedTextProps){
 const render=(node:React.ReactNode,path:string):React.ReactNode=>{
  if(typeof node==='string'||typeof node==='number')return linkifyText(String(node)).map((part,index)=>part.type==='text'?part.text:<Link {...linkProps} key={`${path}-${index}`} href={part.href} target={linkProps?.target??'_blank'} rel={[...new Set([...(linkProps?.rel??'').split(/\s+/).filter(token=>token&&token!=='opener'),'noopener','noreferrer'])].join(' ')} onClick={event=>{linkProps?.onClick?.(event);if(stopPropagation)event.stopPropagation();}}>{part.text}</Link>);
  if(Array.isArray(node))return node.map((child,index)=><React.Fragment key={`${path}-${index}`}>{render(child,`${path}-${index}`)}</React.Fragment>);
  return node;
 };
 return <span {...props} className={cx('xui-linked-text',className)}>{render(value??children,'text')}</span>;
}
export const Typography={Heading,Text,Link,Code,LinkedText};
/** Passive glyph presentation. Put actions in Button/IconButton, not on the icon. */
export type IconProps=Omit<React.ComponentProps<'span'>,'color'|'role'>&{
 /** Omitted colors inherit. CSS variables remain live across theme changes. */
 color?:React.CSSProperties['color'];
 /** Soft opacity pulse, off by default; without color it uses action-primary. */
 blink?:boolean;
};
/** Decorative by default; an explicit aria-label/labelledby exposes a named image. */
export function Icon({color,blink=false,className,style,'aria-label':label,'aria-labelledby':labelledby,'aria-hidden':hidden,...props}:IconProps){
 const named=!!(label||labelledby);
 // Route even native style.color through the token so disabled CSS can still
 // inherit the owning control's foreground without an !important override.
 const {color:styleColor,...layoutStyle}=style??{},foreground=color??styleColor;
 const appearance=foreground===undefined?layoutStyle:{...layoutStyle,'--icon-color':foreground} as React.CSSProperties;
 return <span {...props} className={cx('xui-icon',className)} data-blink={blink} data-colored={foreground!==undefined} style={appearance} aria-label={label} aria-labelledby={labelledby} role={named?'img':undefined} aria-hidden={hidden??(!named||undefined)}/>;
}
export type SeparatorProps=Omit<React.ComponentProps<'div'>,'children'> & {orientation?:'horizontal'|'vertical';decorative?:boolean};
export function Separator({orientation='horizontal',decorative=false,className,...props}:SeparatorProps){return <div {...props} className={cx('xui-separator',className)} role={decorative?'none':'separator'} aria-hidden={decorative||undefined} aria-orientation={decorative?undefined:orientation} data-orientation={orientation}/>;}
export type TagProps=Omit<React.ComponentProps<'span'>,'children'> & {label:string;disabled?:boolean} & ({onRemove?:never;removeLabel?:never;onRemoveFocus?:never}|{onRemove:()=>void;removeLabel:string;onRemoveFocus?:(trigger:HTMLButtonElement)=>void});
/** Removal is an intent. The host owns collection state and chooses the next focus target. */
export function Tag({label,disabled=false,onRemove,removeLabel,onRemoveFocus,className,...props}:TagProps){if(onRemove&&(!removeLabel||!removeLabel.trim()))throw new TypeError('Removable Tag requires removeLabel');return <span {...props} className={cx('xui-badge xui-tag',className)}><span className="xui-tag-label">{label}</span>{onRemove&&<Button variant="ghost" size="xs" disabled={disabled} aria-label={removeLabel} onClick={event=>{const trigger=event.currentTarget as HTMLButtonElement;onRemove();onRemoveFocus?.(trigger);}}>×</Button>}</span>;}
type CopyController=ReturnType<typeof createCopyController>;
type CopyableModelOptions=Parameters<typeof createCopyController>[0];
export type CopyableProps=Omit<React.ComponentProps<'span'>,'children'> & {labels?:Partial<CopyableLabels>} & ControllerProps<CopyController,CopyableModelOptions>;
export function Copyable(props:CopyableProps){
  const {labels:overrides,className}=props,injected='controller'in props?props.controller:undefined,options=props as CopyableModelOptions;
  assertControllerProps(injected,props,['value','disabled','writeText','onStatusChange']);
  const latest=React.useRef(options.onStatusChange);latest.current=options.onStatusChange;
  const owner=useOwnedController(injected,()=>createCopyController({...options,onStatusChange:status=>latest.current?.(status)}));
  const state=React.useSyncExternalStore(owner.subscribe,owner.getState,owner.getState),labels={...copyableLabels,...overrides};
  React.useLayoutEffect(()=>{if(!injected)owner.update({...options,onStatusChange:status=>latest.current?.(status)});},[owner,injected,options.value,options.disabled,options.writeText,options.onStatusChange]);
  const {labels:_labels,className:_className,value:_value,disabled:_disabled,writeText:_writeText,onStatusChange:_onStatusChange,controller:_controller,...spanProps}=props as CopyableProps&{value?:string;disabled?:boolean;writeText?:ClipboardWriter;onStatusChange?:(status:CopyStatus)=>void;controller?:CopyController};
  return <span {...spanProps} className={cx('xui-copyable',className)} data-status={state.status}><code className="xui-code">{state.value}</code><Button variant="ghost" size="xs" disabled={state.disabled||state.status==='copying'} onClick={()=>{void owner.copy();}}>{labels.copy}</Button><span className="xui-copyable-status" role="status" aria-live="polite">{state.status==='idle'?'':labels[state.status]}</span></span>;
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
 const inheritedInteraction=React.useContext(OverflowTextInteraction),interaction=interactionRef??inheritedInteraction;
 const viewport=React.useRef<HTMLSpanElement>(null),track=React.useRef<HTMLSpanElement>(null),target=React.useRef(interaction);target.current=interaction;
 const binding=React.useRef<ReturnType<typeof bindOverflowTextPresentation>|null>(null);
 React.useImperativeHandle(ref,()=>viewport.current!,[]);
 React.useLayoutEffect(()=>{binding.current=bindOverflowTextPresentation(viewport.current!,track.current!,()=>target.current?.current??null);return()=>{binding.current?.destroy();binding.current=null;};},[]);
 React.useLayoutEffect(()=>binding.current?.refresh());
 return <span {...props} ref={viewport} className={cx('xui-overflow-text',className)}><span ref={track} className="xui-overflow-text-content">{text}</span></span>;
}

/** Public card composition. Slots define geometry; data, permissions and actions stay with the host. */
export type CardProps=Omit<React.ComponentProps<'section'>,'title'|'children'>&{
 title:string;headingLevel?:CardHeadingLevel;icon?:React.ReactNode;badge?:CardBadge;
 /** Identity glyphs use a themed tile by default; plain supports already-framed images/avatars. */
 iconVariant?:'tile'|'plain';
 /** Decorative header foreground only; defaults to the theme accent. */
 iconColor?:React.CSSProperties['color'];
 /** Auxiliary header actions, such as an existing Menu trigger. */
 actions?:React.ReactNode;
 /** Description and business content share the single natural-height content region. */
 description?:string;children?:React.ReactNode;
 /** Read-only facts shrink before actions. OverflowText borrows this card’s existing interaction surface;
  * reduced motion/coarse pointers or no keyboard entry retain complete wrapping text. */
  footerMeta?:React.ReactNode;
  /** Compact Card action spacing uses card-actions-gap; controls retain their own size and semantics. */
  footerActions?:React.ReactNode;
 /** Band (default) separates the footer surface; plain keeps the unframed composition. */
 footerVariant?:'band'|'plain';
 /** Fill an available flex/grid track; content can grow and the footer stays at its end. */
 stretch?:boolean;
};
export function Card({title,headingLevel=3,icon,iconVariant='tile',iconColor,badge,actions,description,children,footerMeta,footerActions,footerVariant='band',stretch=false,ref,className,...props}:CardProps){
 if(typeof title!=='string'||!title.trim()||!Number.isInteger(headingLevel)||headingLevel<2||headingLevel>6)throw new TypeError('Card requires a nonempty title and heading level 2–6');
 if(badge&&(typeof badge.label!=='string'||!badge.label.trim()||badge.tone&&!['neutral','info','success','warning','error'].includes(badge.tone)||badge.variant&&!['plain','soft'].includes(badge.variant)))throw new TypeError('Invalid Card badge');
 const root=React.useRef<HTMLElement>(null);React.useImperativeHandle(ref,()=>root.current!,[]);
 return <Surface {...props} padding="none" data-stretch={stretch} ref={root} className={cx('xui-card',className)}><header className="xui-toolbar xui-card-header"><div className="xui-toolbar xui-card-heading">{hasContent(icon)&&<span className="xui-card-icon" data-variant={iconVariant} style={iconColor===undefined?undefined:{color:iconColor}} aria-hidden="true">{icon}</span>}<Typography.Heading level={headingLevel} className="xui-card-title"><OverflowText text={title} interactionRef={root}/></Typography.Heading></div>{(badge||hasContent(actions))&&<div className="xui-toolbar xui-card-trailing">{badge&&<Badge tone={badge.tone??'neutral'} variant={badge.variant??'soft'} color={badge.color}>{badge.label}</Badge>}{hasContent(actions)&&<div className="xui-toolbar xui-card-actions">{actions}</div>}</div>}</header>{(description||hasContent(children))&&<div className="xui-card-content">{description&&<Typography.Text as="p" tone="muted" className="xui-card-description">{description}</Typography.Text>}{hasContent(children)&&<div className="xui-card-body">{children}</div>}</div>}{(hasContent(footerMeta)||hasContent(footerActions))&&<footer className="xui-toolbar xui-card-footer" data-variant={footerVariant}>{hasContent(footerMeta)&&<div className="xui-text xui-card-meta" data-tone="muted"><OverflowTextInteraction.Provider value={root}>{footerMeta}</OverflowTextInteraction.Provider></div>}{hasContent(footerActions)&&<div className="xui-toolbar xui-card-actions">{footerActions}</div>}</footer>}</Surface>;
}
