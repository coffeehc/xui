import * as React from 'react';
import {createCollectionRequestGuard,getCollectionState,type CollectionViewOptions} from '@coffeehc/xui-runtime/collection-view';
import {SimpleSelect} from './forms.js';
import {LoadingState,EmptyState,ErrorState} from './feedback.js';
import {Pagination} from './navigation.js';
import {Button} from './button.js';
import {hasContent} from './shared.js';

/** Shared presentation of host-confirmed facts; no request or retained snapshot owner. */
export function useCollectionView(options:CollectionViewOptions,rowCount:number){
  const state=getCollectionState(options,rowCount);
  const guard=React.useRef<ReturnType<typeof createCollectionRequestGuard>|null>(null);
  React.useLayoutEffect(()=>{const current=createCollectionRequestGuard();guard.current=current;return()=>{current.destroy();guard.current=null;};},[]);
  const request=(callback:(()=>void)|undefined)=>guard.current?.run(state.blocked,callback);
  const error=<ErrorState title={state.labels.error} retryLabel={state.labels.retry} onRetry={options.onRetry?()=>request(options.onRetry):undefined} retryDisabled={state.blocked}/>;
  const empty=<EmptyState title={options.filtered?state.labels.noMatches:state.labels.empty}/>;
  return {state,request,error,empty};
}

/** One footer implementation for table/card collections. Prefix preserves each
 * component's existing public skin; pagination never mutates confirmed facts. */
export function CollectionFooter({prefix,view,pagination,rowCount,error,feedback,footer}:{
  prefix:'xui-data-table'|'xui-card-group';view:ReturnType<typeof useCollectionView>;
  pagination:CollectionViewOptions['pagination'];rowCount:number;
  error:React.ReactNode;feedback?:React.ReactNode;footer?:React.ReactNode;
}){
  const {state,request}=view,{labels}=state,hasRows=rowCount>0;
  const countLabel=labels.count({rowCount,total:state.total});
  const hasSummary=!!countLabel||hasRows&&(state.status==='error'||state.busy)||hasContent(feedback);
  const hasFooter=hasSummary||!!pagination||hasContent(footer);
  const part=(name:string)=>`${prefix}-${name}`;
  return <footer className={part('footer')} hidden={!hasFooter}>
    <div className={part('summary')} hidden={!hasSummary}>
      <span className={part('count')} aria-live="polite">{countLabel}</span>
      <div className={part('feedback')}>{hasRows&&(state.status==='error'?error:state.busy?<LoadingState layout="inline">{labels.refreshing}</LoadingState>:null)}{feedback}</div>
    </div>
    {pagination&&<label className={part('page-size')}><span>{labels.pageSize}</span><SimpleSelect aria-label={labels.pageSize} value={pagination.pageSize} disabled={state.blocked||!pagination.onPageSizeChange} onChange={event=>{const size=Number(event.currentTarget.value);event.currentTarget.value=String(pagination.pageSize);if(size!==pagination.pageSize&&state.sizes.includes(size))request(()=>pagination.onPageSizeChange?.(size));}}>{state.sizes.map(size=><option value={size} key={size}>{size}</option>)}</SimpleSelect></label>}
    {pagination&&pagination.mode!=='cursor'&&state.pageCount!==null&&!state.outOfRange&&<Pagination aria-label={labels.pagination} page={state.page} pageCount={state.pageCount} disabled={state.blocked||!pagination.onPageChange} previousLabel={labels.previous} nextLabel={labels.next} onPageChange={page=>request(()=>pagination.onPageChange?.(page-1+pagination.pageIndexOffset))}/>}
    {pagination?.mode==='cursor'&&<nav className="xui-pagination" aria-label={labels.pagination}>
      <Button disabled={state.blocked||!pagination.hasPrevious||!pagination.onPrevious} onClick={()=>request(pagination.hasPrevious?pagination.onPrevious:undefined)}>{labels.previous}</Button>
      <Button disabled={state.blocked||pagination.nextCursor===null||!pagination.onNext} onClick={()=>{const cursor=pagination.nextCursor;if(cursor!==null)request(pagination.onNext?()=>pagination.onNext!(cursor):undefined);}}>{labels.next}</Button>
    </nav>}
    {hasContent(footer)&&<div className={part('footer-extra')}>{footer}</div>}
  </footer>;
}
