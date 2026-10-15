import * as React from 'react';
import { cx, hasContent } from './shared.js';
import {Button} from './button.js';
import {type ResourceState,type ResourceController} from '@coffeehc/xui-runtime/loading';
/** Surface skin with default card spacing, or explicit none for host-composed content. */
export type SurfaceProps=React.ComponentProps<'section'>&{padding?:'default'|'none'};
export function Surface({className,padding='default',...props}:SurfaceProps) { return <section {...props} className={cx('xui-surface',className)} data-padding={padding} />; }
export type AlertProps = React.ComponentProps<'div'> & {tone?: 'info'|'success'|'warning'|'error'};
export function Alert({tone='info',className,...props}: AlertProps) { return <div role={tone === 'error' ? 'alert' : 'status'} {...props} className={cx('xui-alert',className)} data-tone={tone} />; }

/** Passive metadata or an explicit semantic status; neutral keeps plain text styling. */
export type BadgeTone = 'neutral'|'info'|'success'|'warning'|'error';
/** Standard span attributes plus a status tone; no live region or focus behavior is added. */
export type BadgeProps = React.ComponentProps<'span'> & {tone?:BadgeTone};
/** Render passive status text; the host supplies its label and any status icon. */
export function Badge({tone='neutral',className,...props}:BadgeProps){return <span {...props} className={cx('xui-badge',className)} data-tone={tone}/>;}
export function Skeleton({className,...props}:React.ComponentProps<'div'>){return <div aria-hidden="true" {...props} className={cx('xui-skeleton',className)}/>;}
export function Spinner({className,...props}:React.ComponentProps<'span'>){return <span aria-hidden="true" {...props} className={cx('xui-spinner',className)}/>;}
export function Progress({className,...props}:React.ComponentProps<'progress'>){return <progress {...props} className={cx('xui-progress',className)}/>;}
/** Block feedback centers in its allocated content region (not the window).
 * Inline feedback stays beside the existing action/count without taking over content. */
export type LoadingStateProps=React.ComponentProps<'div'>&{layout?:'block'|'inline'};
export function LoadingState({children='Loading…',layout='block',className,...props}:LoadingStateProps){return <div role="status" {...props} data-layout={layout} className={cx('xui-state xui-loading-state',className)}><Spinner/><div className="xui-loading-label">{children}</div></div>;}
export function EmptyState({title,children,action,className,...props}:Omit<React.ComponentProps<'div'>,'title'> & {title:React.ReactNode;action?:React.ReactNode}){return <div {...props} className={cx('xui-state',className)}><strong className="xui-strong">{title}</strong>{children}{action}</div>;}
export function ErrorState({title,children,onRetry,retryLabel='Retry',retryDisabled,className,...props}:Omit<React.ComponentProps<'div'>,'title'> & {title:React.ReactNode;onRetry?:()=>void;retryLabel?:string;retryDisabled?:boolean}){return <div role="alert" {...props} className={cx('xui-state xui-state-error',className)}><strong className="xui-strong">{title}</strong>{children}{onRetry&&<Button variant="outline" disabled={retryDisabled} onClick={onRetry}>{retryLabel}</Button>}</div>;}
/** Reserved keeps the existing bounded slot; flow grows only for actual feedback and does not create a scroll owner. */
export type DataRegionProps=React.ComponentProps<'section'>&{busy?:boolean;feedback?:React.ReactNode;feedbackLayout?:'reserved'|'flow'};
export function DataRegion({busy=false,children,feedback,feedbackLayout='reserved',className,...props}:DataRegionProps){return <section {...props} aria-busy={busy} data-waiting={busy&&!hasContent(children)} className={cx('xui-data-region',className)}>{children}{feedback!==undefined&&<div className="xui-feedback-slot" data-layout={feedbackLayout}>{feedback}</div>}</section>;}
/** External owner chooses key, loader and lifetime. The hook only subscribes. */
export function useResource<T>(controller:ResourceController<T>){return React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState);}
export interface RenderBoundaryProps{children:React.ReactNode;resetKey?:unknown;fallback:(error:Error,reset:()=>void)=>React.ReactNode;onError?:(error:Error,info:React.ErrorInfo)=>void}
/** Render exceptions are not Promise rejections; never retries requests. */
export class RenderBoundary extends React.Component<RenderBoundaryProps,{error:Error|null}>{
  state={error:null as Error|null};
  static getDerivedStateFromError(error:Error){return {error};}
  componentDidCatch(error:Error,info:React.ErrorInfo){this.props.onError?.(error,info);}
  componentDidUpdate(previous:RenderBoundaryProps){if(previous.resetKey!==this.props.resetKey&&this.state.error)this.setState({error:null});}
  render(){return this.state.error?this.props.fallback(this.state.error,()=>this.setState({error:null})):this.props.children;}
}
