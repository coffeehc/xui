import * as React from 'react';
import { cx, branded } from './shared.js';
import {Button} from './button.js';
import {type ResourceState,type ResourceController} from '@coffeehc/xui-runtime/loading';
export function Surface({className,...props}: React.ComponentProps<'section'>) { return <section {...props} className={cx('xui-surface',className)} />; }
export type AlertProps = React.ComponentProps<'div'> & {tone?: 'info'|'success'|'warning'|'error'};
export function Alert({tone='info',className,...props}: AlertProps) { return <div role={tone === 'error' ? 'alert' : 'status'} {...props} className={cx('xui-alert',className)} data-tone={tone} />; }

export function Badge({className,...props}:React.ComponentProps<'span'>){return <span {...props} className={cx('xui-badge',className)}/>;}
export function Skeleton({className,...props}:React.ComponentProps<'div'>){return <div aria-hidden="true" {...props} className={cx('xui-skeleton',className)}/>;}
export function Spinner({className,...props}:React.ComponentProps<'span'>){return <span aria-hidden="true" {...props} className={cx('xui-spinner',className)}/>;}
export function Progress({className,...props}:React.ComponentProps<'progress'>){return <progress {...props} className={cx('xui-progress',className)}/>;}
export function LoadingState({children='Loading…',className,...props}:React.ComponentProps<'div'>){return <div role="status" {...props} className={cx('xui-state',className)}><Spinner/>{children}</div>;}
export function EmptyState({title,children,action,className,...props}:Omit<React.ComponentProps<'div'>,'title'> & {title:React.ReactNode;action?:React.ReactNode}){return <div {...props} className={cx('xui-state',className)}><strong className="xui-strong">{title}</strong>{children}{action}</div>;}
export function ErrorState({title,children,onRetry,retryLabel='Retry',retryDisabled,className,...props}:Omit<React.ComponentProps<'div'>,'title'> & {title:React.ReactNode;onRetry?:()=>void;retryLabel?:string;retryDisabled?:boolean}){return <div role="alert" {...props} className={cx('xui-state xui-state-error',className)}><strong className="xui-strong">{title}</strong>{children}{onRetry&&<Button variant="outline" disabled={retryDisabled} onClick={onRetry}>{retryLabel}</Button>}</div>;}
export function DataRegion({busy=false,children,feedback,className,...props}:React.ComponentProps<'section'> & {busy?:boolean;feedback?:React.ReactNode}){return <section {...props} aria-busy={busy} className={cx('xui-data-region',className)}>{children}{feedback}</section>;}
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
