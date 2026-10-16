import * as React from 'react';
import {validateCollectionKeys,type CollectionViewOptions,type CollectionRowContext} from '@coffeehc/xui-runtime/collection-view';
import {Card,type CardProps} from './display.js';
import {ScrollArea} from './scroll-area.js';
import {DataRegion,LoadingState} from './feedback.js';
import {useCollectionView,CollectionFooter} from './collection-view.js';
import {cx,hasContent} from './shared.js';

export type {CollectionStatus,CollectionLayout,CollectionPagination,CollectionCursorPagination,CollectionLabels,CollectionCount,CollectionViewOptions} from '@coffeehc/xui-runtime/collection-view';
/** Current published record identity and view facts; never a cached record/index. */
export type CardGroupContext=CollectionRowContext;
/** Public Card slots/attributes. CardGroup owns Card instances and their keys. */
export type CardGroupCardProps=Omit<CardProps,'ref'|'stretch'>;
export interface CardGroupProps<T> extends CollectionViewOptions {
  /** Natural preserves independent heights; equal derives a shared grid height from the largest card. */
  cardSizing?:'natural'|'equal';
  /** Host-confirmed records. Keep the same-scope records during refresh/error. */
  rows:readonly T[];
  /** Stable business identity, with the same key rules as DataTable. */
  rowKey:(row:T)=>string|number;
  /** Return Card configuration, not JSX or a replacement card renderer.
   * Business controls apply context.disabled according to their own operation. */
  renderCard:(row:T,context:CardGroupContext)=>CardGroupCardProps;
  /** Use this or pageToolbar once. It stays outside the scrolling card body. */
  toolbar?:React.ReactNode;
  emptyState?:React.ReactNode;errorState?:React.ReactNode;
  /** Supplementary local feedback/footer; count and pagination have one owner. */
  feedback?:React.ReactNode;footer?:React.ReactNode;
  className?:string;id?:string;
}
/** Controlled collection composition. Owns layout/slots and Card reconciliation;
 * never fetches, sorts, caches, selects, confirms writes or changes page facts. */
export function CardGroup<T>({rows,rowKey,renderCard,cardSizing='natural',toolbar,emptyState,errorState,feedback,footer,className,id,...options}:CardGroupProps<T>){
  const keys=validateCollectionKeys(rows,rowKey),view=useCollectionView(options,rows.length),{state}=view;
  const error=errorState??view.error,empty=emptyState??view.empty;
  return <DataRegion id={id} className={cx('xui-card-group',className)} data-layout={state.layout} data-card-sizing={cardSizing} aria-label={options.label} busy={state.busy}>
    {hasContent(toolbar)&&<div className="xui-card-group-tools">{toolbar}</div>}
    <ScrollArea.Viewport className="xui-card-group-body" aria-label={options.label+' — '+state.labels.count({rowCount:rows.length,total:state.total})} tabIndex={state.layout==='document'?-1:0} focusMode="gutter">
      {rows.length>0?<ul className="xui-grid xui-card-group-items">{rows.map((row,rowIndex)=>{
        const props=renderCard(row,{rowIndex,rowKey:keys[rowIndex],busy:state.busy,disabled:state.blocked});
        if(!props||typeof props!=='object'||React.isValidElement(props))throw new TypeError('CardGroup renderCard must return public Card props');
        return <li className="xui-card-group-item" key={keys[rowIndex]}><Card {...props} stretch={cardSizing==='equal'} key={keys[rowIndex]}/></li>;
      })}</ul>:<div className="xui-card-group-placeholder" data-loading={state.status==='loading'&&!state.hasValue}>{state.status==='loading'&&!state.hasValue?<LoadingState>{state.labels.loading}</LoadingState>:state.status==='error'&&!state.hasValue?error:state.status==='idle'?<div className="xui-state" role="status">{state.labels.idle}</div>:empty}</div>}
    </ScrollArea.Viewport>
    <CollectionFooter prefix="xui-card-group" view={view} pagination={options.pagination} rowCount={rows.length} error={error} feedback={feedback} footer={footer}/>
  </DataRegion>;
}
