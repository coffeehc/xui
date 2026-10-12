import * as React from 'react';
import {getDataTableState,validateDataTableKeys,createDataTableRequestGuard,type DataTableViewOptions} from '@coffeehc/xui-runtime/data-table';
import {Table,TableContainer,TableRow,TableCell,TableHeaderCell} from './table.js';
import {Toolbar} from './layout.js';
import {Field,NativeSelect,type FieldProps} from './forms.js';
import {DataRegion,LoadingState,EmptyState,ErrorState,Skeleton} from './feedback.js';
import {Pagination} from './navigation.js';
import {cx} from './shared.js';
export type {DataTablePagination,DataTableLabels,DataTableCount,DataTableStatus,DataTableViewOptions} from '@coffeehc/xui-runtime/data-table';
export interface DataTableCellContext {rowIndex:number;rowKey:string|number;busy:boolean;disabled:boolean}
export interface DataTableColumn<T> {
  id:string; header:React.ReactNode; cell:(row:T,context:DataTableCellContext)=>React.ReactNode;
  ariaSort?:React.AriaAttributes['aria-sort']; sticky?:'start'|'end';
}
export interface DataTableProps<T> extends DataTableViewOptions {
  rows:readonly T[]; columns:readonly DataTableColumn<T>[]; rowKey:(row:T)=>string|number;
  rowState?:(row:T)=>{selected?:boolean;expanded?:boolean};
  /** Use this OR the existing pageToolbar slot, never duplicate controls in both. */
  toolbar?:React.ReactNode; emptyState?:React.ReactNode; errorState?:React.ReactNode; feedback?:React.ReactNode;
  /** Optional host cursor controls; no numbered pagination is fabricated for unknown total. */
  footer?:React.ReactNode;
  /** workspace fills an already bounded parent; document follows natural flow. */
  layout?:'workspace'|'document'; striped?:boolean; stickyHeader?:boolean;
  className?:string; id?:string;
}
export function DataTableToolbar({className,...props}:React.ComponentProps<typeof Toolbar>) {return <Toolbar {...props} className={cx('xui-data-table-toolbar',className)}/>;}
export function DataTableFilter({className,grow=false,...props}:FieldProps&{grow?:boolean}) {return <Field {...props} data-grow={grow} className={cx('xui-data-table-filter',className)}/>;}
const hasContent=(value:React.ReactNode):boolean=>value!==undefined&&value!==null&&typeof value!=='boolean'&&(typeof value!=='string'||value.length>0)&&(Array.isArray(value)?value.some(hasContent):React.isValidElement<{children?:React.ReactNode}>(value)&&value.type===React.Fragment?hasContent(value.props.children):true);
/** Fully controlled composition; it never owns a request or changes page facts. */
export function DataTable<T>({rows,columns,rowKey,rowState,toolbar,emptyState,errorState,feedback,footer,layout='workspace',striped=false,stickyHeader=true,className,id,...options}:DataTableProps<T>) {
  const state=getDataTableState(options,rows.length),keys=validateDataTableKeys(rows,columns,rowKey),{labels,pagination}= {labels:state.labels,pagination:options.pagination};
  const guard=React.useRef<ReturnType<typeof createDataTableRequestGuard>|null>(null);if(!guard.current)guard.current=createDataTableRequestGuard();
  const request=(callback:(()=>void)|undefined)=>guard.current!.run(state.blocked,callback);
  const hasRows=rows.length>0,showError=state.status==='error';
  const error=errorState??<ErrorState title={labels.error} retryLabel={labels.retry} onRetry={options.onRetry?()=>request(options.onRetry):undefined} retryDisabled={state.blocked}/>;
  const empty=emptyState??<EmptyState title={options.filtered?labels.noMatches:labels.empty}/>;
  return <DataRegion id={id} className={cx('xui-data-table',className)} data-layout={layout} aria-label={options.label} busy={state.busy}>
    {hasContent(toolbar)&&<div className="xui-data-table-tools">{toolbar}</div>}
    <div className="xui-data-table-frame">
      {(hasRows&&(state.busy||showError)||hasContent(feedback))&&<div className="xui-data-table-feedback">{hasRows&&(showError?error:state.busy?<LoadingState>{labels.refreshing}</LoadingState>:null)}{feedback}</div>}
      <TableContainer className="xui-data-table-body" aria-label={options.label+' — '+labels.count({rowCount:rows.length,total:state.total})}>
        <Table striped={striped} stickyHeader={stickyHeader} aria-label={options.label}>
          <thead><TableRow>{columns.map(column=><TableHeaderCell key={column.id} sticky={column.sticky} aria-sort={column.ariaSort}>{column.header}</TableHeaderCell>)}</TableRow></thead>
          <tbody>{hasRows?rows.map((row,index)=><TableRow key={keys[index]} {...rowState?.(row)}>{columns.map(column=><TableCell key={column.id} sticky={column.sticky}>{column.cell(row,{rowIndex:index,rowKey:keys[index],busy:state.busy,disabled:state.blocked})}</TableCell>)}</TableRow>):state.busy?<>{Array.from({length:5},(_,index)=><TableRow key={index}><TableCell colSpan={columns.length}><Skeleton/></TableCell></TableRow>)}<TableRow><TableCell colSpan={columns.length}><LoadingState>{labels.loading}</LoadingState></TableCell></TableRow></>:<TableRow><TableCell colSpan={columns.length}>{showError?error:state.status==='idle'?<div className="xui-state" role="status">{labels.idle}</div>:empty}</TableCell></TableRow>}</tbody>
        </Table>
      </TableContainer>
      <footer className="xui-data-table-footer">
        <span className="xui-data-table-count" aria-live="polite">{state.status==='loading'&&!hasRows?labels.loading:state.status==='idle'&&!hasRows?labels.idle:state.status==='error'&&!hasRows?labels.error:labels.count({rowCount:rows.length,total:state.total})}</span>
        {pagination&&<label className="xui-data-table-page-size"><span>{labels.pageSize}</span><NativeSelect aria-label={labels.pageSize} value={pagination.pageSize} disabled={state.blocked||!pagination.onPageSizeChange} onChange={event=>{const size=Number(event.currentTarget.value);event.currentTarget.value=String(pagination.pageSize);if(size!==pagination.pageSize&&state.sizes.includes(size))request(()=>pagination.onPageSizeChange?.(size));}}>{state.sizes.map(size=><option value={size} key={size}>{size}</option>)}</NativeSelect></label>}
        {pagination&&state.pageCount!==null&&!state.outOfRange&&<Pagination aria-label={labels.pagination} page={state.page} pageCount={state.pageCount} disabled={state.blocked||!pagination.onPageChange} previousLabel={labels.previous} nextLabel={labels.next} onPageChange={page=>request(()=>pagination.onPageChange?.(page-1+pagination.pageIndexOffset))}/>}
        {hasContent(footer)&&<div className="xui-data-table-footer-extra">{footer}</div>}
      </footer>
    </div>
  </DataRegion>;
}
