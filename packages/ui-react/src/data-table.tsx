import * as React from 'react';
import {getDataTableState,validateDataTableKeys,createDataTableRequestGuard,observeDataTableLayout,type DataTableViewOptions,type DataTableColumnWidth} from '@coffeehc/xui-runtime/data-table';
import {Table,TableContainer,TableRow,TableCell,TableHeaderCell} from './table.js';
import {Toolbar} from './layout.js';
import {Field,SimpleSelect,type FieldProps} from './forms.js';
import {DataRegion,LoadingState,EmptyState,ErrorState,Skeleton} from './feedback.js';
import {Pagination} from './navigation.js';
import {Button} from './button.js';
import {cx} from './shared.js';
export type {DataTablePagination,DataTableCursorPagination,DataTableLabels,DataTableCount,DataTableStatus,DataTableLayout,DataTableViewOptions,DataTableColumnWidth} from '@coffeehc/xui-runtime/data-table';
export interface DataTableCellContext {rowIndex:number;rowKey:string|number;busy:boolean;disabled:boolean}
export interface DataTableColumn<T> {
  id:string; header:React.ReactNode; cell:(row:T,context:DataTableCellContext)=>React.ReactNode;
  /** Column track width; numeric values are pixels. Percentages use the table body width. */
  width?:DataTableColumnWidth;
  ariaSort?:React.AriaAttributes['aria-sort']; sticky?:'start'|'end';
}
export interface DataTableProps<T> extends DataTableViewOptions {
  rows:readonly T[]; columns:readonly DataTableColumn<T>[]; rowKey:(row:T)=>string|number;
  rowState?:(row:T)=>{selected?:boolean;expanded?:boolean};
  /** Use this OR the existing pageToolbar slot, never duplicate controls in both. */
  toolbar?:React.ReactNode; emptyState?:React.ReactNode; errorState?:React.ReactNode; feedback?:React.ReactNode;
  /** Optional supplementary footer content; standard cursor controls are supplied by pagination. */
  footer?:React.ReactNode;
  striped?:boolean; stickyHeader?:boolean;
  className?:string; id?:string;
}
export function DataTableToolbar({className,...props}:React.ComponentProps<typeof Toolbar>) {return <Toolbar {...props} className={cx('xui-data-table-toolbar',className)}/>;}
export function DataTableFilter({className,grow=false,...props}:FieldProps&{grow?:boolean}) {return <Field {...props} data-grow={grow} className={cx('xui-data-table-filter',className)}/>;}
const hasContent=(value:React.ReactNode):boolean=>value!==undefined&&value!==null&&typeof value!=='boolean'&&(typeof value!=='string'||value.length>0)&&(Array.isArray(value)?value.some(hasContent):React.isValidElement<{children?:React.ReactNode}>(value)&&value.type===React.Fragment?hasContent(value.props.children):true);
/** Fully controlled composition; it never owns a request or changes page facts. */
export function DataTable<T>({rows,columns,rowKey,rowState,toolbar,emptyState,errorState,feedback,footer,striped=false,stickyHeader=true,className,id,...options}:DataTableProps<T>) {
  const state=getDataTableState(options,rows.length),keys=validateDataTableKeys(rows,columns,rowKey),{labels,pagination}= {labels:state.labels,pagination:options.pagination};
  const guard=React.useRef<ReturnType<typeof createDataTableRequestGuard>|null>(null);if(!guard.current)guard.current=createDataTableRequestGuard();
  const request=(callback:(()=>void)|undefined)=>guard.current!.run(state.blocked,callback);
  const columnSizing=columns.some(column=>column.width!==undefined)?columns.every(column=>column.width!==undefined)?'sized':'mixed':undefined;
  const widthProbes=React.useRef<HTMLDivElement>(null),columnGroup=React.useRef<HTMLTableColElement>(null);
  React.useLayoutEffect(()=>{
    if(!columnSizing)return;
    const probes=widthProbes.current!,group=columnGroup.current!,win=probes.ownerDocument.defaultView!;let dead=false,frame=0;
    const measure=()=>{
      if(dead)return;
      // Read every used block width before touching table tracks. Percentage math
      // is resolved outside table layout; transformed ancestors do not scale it.
      const widths=columns.map((column,index)=>column.width===undefined?null:win.getComputedStyle(probes.children[index]).width);
      widths.forEach((width,index)=>{if(width?.endsWith('px')&&Number.isFinite(parseFloat(width))){const col=group.children[index] as HTMLTableColElement;if(col.style.width!==width)col.style.width=width;}});
    };
    const schedule=()=>{if(!dead&&!frame)frame=win.requestAnimationFrame(()=>{frame=0;measure();});};
    const observer=new ResizeObserver(schedule);observer.observe(probes);for(const probe of Array.from(probes.children))observer.observe(probe);
    win.addEventListener('resize',schedule);measure();
    return()=>{dead=true;observer.disconnect();win.cancelAnimationFrame(frame);win.removeEventListener('resize',schedule);};
  },[columns,columnSizing]);
  const layoutFrame=React.useRef<HTMLDivElement>(null),layoutBody=React.useRef<HTMLDivElement>(null),layoutTable=React.useRef<HTMLTableElement>(null),layoutOwner=React.useRef<ReturnType<typeof observeDataTableLayout>|null>(null);
  React.useLayoutEffect(()=>{
    const owner=observeDataTableLayout(layoutFrame.current!,layoutBody.current!,layoutTable.current!);
    layoutOwner.current=owner;
    return()=>{owner.destroy();layoutOwner.current=null;};
  },[]);
  React.useLayoutEffect(()=>{layoutOwner.current?.update();});
  const hasRows=rows.length>0,showError=state.status==='error';
  const countLabel=labels.count({rowCount:rows.length,total:state.total}),hasSummary=!!countLabel||hasRows&&(showError||state.busy)||hasContent(feedback);
  const hasFooter=hasSummary||!!pagination||hasContent(footer);
  const error=errorState??<ErrorState title={labels.error} retryLabel={labels.retry} onRetry={options.onRetry?()=>request(options.onRetry):undefined} retryDisabled={state.blocked}/>;
  const empty=emptyState??<EmptyState title={options.filtered?labels.noMatches:labels.empty}/>;
  return <DataRegion id={id} className={cx('xui-data-table',className)} data-layout={state.layout} aria-label={options.label} busy={state.busy}>
    <div ref={layoutFrame} className="xui-data-table-frame">
      {hasContent(toolbar)&&<div className="xui-data-table-tools">{toolbar}</div>}
      <TableContainer ref={layoutBody} data-column-sizing={columnSizing} className="xui-data-table-body" aria-label={options.label+' — '+labels.count({rowCount:rows.length,total:state.total})}>
        <div ref={widthProbes} className="xui-data-table-widths" aria-hidden="true" hidden={!columnSizing}>{columns.map(column=><div key={column.id} style={column.width===undefined?undefined:{width:column.width}}/>)}</div>
        <Table ref={layoutTable} data-column-sizing={columnSizing} striped={striped} stickyHeader={stickyHeader} aria-label={options.label}>
          <colgroup ref={columnGroup}>{columns.map(column=><col key={column.id} style={column.width===undefined?undefined:{width:column.width}}/>)}</colgroup>
          <thead><TableRow>{columns.map(column=><TableHeaderCell key={column.id} sticky={column.sticky} aria-sort={column.ariaSort}>{column.header}</TableHeaderCell>)}</TableRow></thead>
          <tbody>{hasRows?rows.map((row,index)=><TableRow key={keys[index]} {...rowState?.(row)}>{columns.map(column=><TableCell key={column.id} sticky={column.sticky}>{column.cell(row,{rowIndex:index,rowKey:keys[index],busy:state.busy,disabled:state.blocked})}</TableCell>)}</TableRow>):<TableRow><TableCell colSpan={columns.length}><div className="xui-data-table-placeholder">{state.busy?<><LoadingState>{labels.loading}</LoadingState>{Array.from({length:5},(_,index)=><Skeleton key={index}/>)}</>:showError?error:state.status==='idle'?<div className="xui-state" role="status">{labels.idle}</div>:empty}</div></TableCell></TableRow>}</tbody>
        </Table>
      </TableContainer>
      <footer className="xui-data-table-footer" hidden={!hasFooter}>
        <div className="xui-data-table-summary" hidden={!hasSummary}>
          <span className="xui-data-table-count" aria-live="polite">{countLabel}</span>
          <div className="xui-data-table-feedback">{hasRows&&(showError?error:state.busy?<LoadingState>{labels.refreshing}</LoadingState>:null)}{feedback}</div>
        </div>
        {pagination&&<label className="xui-data-table-page-size"><span>{labels.pageSize}</span><SimpleSelect aria-label={labels.pageSize} value={pagination.pageSize} disabled={state.blocked||!pagination.onPageSizeChange} onChange={event=>{const size=Number(event.currentTarget.value);event.currentTarget.value=String(pagination.pageSize);if(size!==pagination.pageSize&&state.sizes.includes(size))request(()=>pagination.onPageSizeChange?.(size));}}>{state.sizes.map(size=><option value={size} key={size}>{size}</option>)}</SimpleSelect></label>}
        {pagination&&pagination.mode!=='cursor'&&state.pageCount!==null&&!state.outOfRange&&<Pagination aria-label={labels.pagination} page={state.page} pageCount={state.pageCount} disabled={state.blocked||!pagination.onPageChange} previousLabel={labels.previous} nextLabel={labels.next} onPageChange={page=>request(()=>pagination.onPageChange?.(page-1+pagination.pageIndexOffset))}/>}
        {pagination?.mode==='cursor'&&<nav className="xui-pagination" aria-label={labels.pagination}>
          <Button disabled={state.blocked||!pagination.hasPrevious||!pagination.onPrevious} onClick={()=>request(pagination.hasPrevious?pagination.onPrevious:undefined)}>{labels.previous}</Button>
          <Button disabled={state.blocked||pagination.nextCursor===null||!pagination.onNext} onClick={()=>{const cursor=pagination.nextCursor;if(cursor!==null)request(pagination.onNext?()=>pagination.onNext!(cursor):undefined);}}>{labels.next}</Button>
        </nav>}
        {hasContent(footer)&&<div className="xui-data-table-footer-extra">{footer}</div>}
      </footer>
    </div>
  </DataRegion>;
}
