import {useDataTableColumnSizing,ColumnResizeHandle,type DataTableColumnSizingProps} from './data-table-sizing.js';
import {isDataTableRowEvent} from './data-table-row-events.js';
import {observeDataTableLayout} from './data-table-layout.js';
import * as React from 'react';
import {validateDataTableKeys,type DataTableViewOptions,type DataTableColumnWidth,type DataTableRowContext,type DataTableColumnResizeOptions} from '@coffeehc/xui-runtime/data-table';
import {Table,TableContainer,TableRow,TableCell,TableHeaderCell} from './table.js';
import {Toolbar} from './layout.js';
import {Field,type FieldProps} from './forms.js';
import {DataRegion,LoadingState} from './feedback.js';
import {cx,hasContent} from './shared.js';
import {useCollectionView,CollectionFooter} from './collection-view.js';
export type {DataTablePagination,DataTableCursorPagination,DataTableLabels,DataTableCount,DataTableStatus,DataTableLayout,DataTableViewOptions,DataTableColumnWidth,DataTableRowContext,DataTableColumnResizeOptions} from '@coffeehc/xui-runtime/data-table';
export type {DataTableColumnSizingProps} from './data-table-sizing.js';
export interface DataTableCellContext extends DataTableRowContext {}
/** React row callbacks receive synthetic events with currentTarget equal to the semantic tr. */
export interface DataTableRowEvents<T> {
  onClick?:(row:T,context:DataTableRowContext,event:React.MouseEvent<HTMLTableRowElement>)=>void;
  onDoubleClick?:(row:T,context:DataTableRowContext,event:React.MouseEvent<HTMLTableRowElement>)=>void;
  onContextMenu?:(row:T,context:DataTableRowContext,event:React.MouseEvent<HTMLTableRowElement>)=>void;
  onKeyDown?:(row:T,context:DataTableRowContext,event:React.KeyboardEvent<HTMLTableRowElement>)=>void;
}
export interface DataTableColumn<T> {
  id:string; header:React.ReactNode; cell:(row:T,context:DataTableCellContext)=>React.ReactNode;
  /** Optional minimum track width; numeric values are pixels. Percentages use the body width. Omit unless needed. */
  width?:DataTableColumnWidth;
  /** Enabled when the table opts into columnSizing; false excludes this handle. */
  resize?:DataTableColumnResizeOptions|false;
  ariaSort?:React.AriaAttributes['aria-sort']; sticky?:'start'|'end';
}
export interface DataTableProps<T> extends DataTableViewOptions {
  rows:readonly T[]; columns:readonly DataTableColumn<T>[]; rowKey:(row:T)=>string|number;
  rowState?:(row:T)=>{selected?:boolean;expanded?:boolean};
  /** Optional guarded row shortcuts; provide a normal cell Button/link for keyboard access. */
  rowEvents?:DataTableRowEvents<T>;
  /** Use this OR the existing pageToolbar slot, never duplicate controls in both. */
  toolbar?:React.ReactNode; idleState?:React.ReactNode; emptyState?:React.ReactNode; errorState?:React.ReactNode; feedback?:React.ReactNode;
  /** Optional supplementary footer content; standard cursor controls are supplied by pagination. */
  footer?:React.ReactNode;
  /** Optional local column sizing. Omit for the original responsive layout without handles. */
  columnSizing?:DataTableColumnSizingProps;
  striped?:boolean; stickyHeader?:boolean;
  className?:string; id?:string;
}
export function DataTableToolbar({className,...props}:React.ComponentProps<typeof Toolbar>) {return <Toolbar {...props} className={cx('xui-data-table-toolbar',className)}/>;}
export function DataTableFilter({className,grow=false,...props}:FieldProps&{grow?:boolean}) {return <Field {...props} data-grow={grow} className={cx('xui-data-table-filter',className)}/>;}
/** Query facts stay controlled. Optional local sizing never requests data or changes page facts. */
export function DataTable<T>({rows,columns,rowKey,rowState,rowEvents,toolbar,idleState,emptyState,errorState,feedback,footer,striped=false,stickyHeader=true,className,id,columnSizing:resizeOptions,...options}:DataTableProps<T>) {
  const keys=validateDataTableKeys(rows,columns,rowKey),view=useCollectionView(options,rows.length),{state}=view,{labels}=state;
  const rowEvent=<E extends React.SyntheticEvent<HTMLTableRowElement>>(row:T,index:number,event:E,handler:((row:T,context:DataTableRowContext,event:E)=>void)|undefined)=>{
    if(!state.blocked&&isDataTableRowEvent(event.nativeEvent,event.currentTarget))handler?.(row,{rowIndex:index,rowKey:keys[index],busy:state.busy,disabled:state.blocked},event);
  };
  const sizing=useDataTableColumnSizing(resizeOptions),fixedWidths=resizeOptions&&columns.some(column=>Object.hasOwn(sizing.widths,column.id))?sizing.widths:undefined;
  const columnSizing=fixedWidths?'resized':resizeOptions?'sized':columns.some(column=>column.width!==undefined)?columns.every(column=>column.width!==undefined)?'sized':'mixed':undefined;
  const widthProbes=React.useRef<HTMLDivElement>(null),columnGroup=React.useRef<HTMLTableColElement>(null),minimum=React.useRef<HTMLDivElement>(null),maximum=React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(()=>{
    if(!columnSizing)return;
    const probes=widthProbes.current!,group=columnGroup.current!,win=probes.ownerDocument.defaultView!;let dead=false,frame=0;
    const measure=()=>{
      if(dead)return;
      // Read every used block width before touching table tracks. Percentage math
      // is resolved outside table layout; transformed ancestors do not scale it.
      const widths=columns.map((column,index)=>column.width===undefined?null:win.getComputedStyle(probes.children[index]).width);
      const floor=resizeOptions?parseFloat(win.getComputedStyle(minimum.current!).width):0;
      const resolved=widths.map((width,index)=>{
        const column=columns[index],initial=resizeOptions?Math.max(width?parseFloat(width):0,column.resize&&column.resize.minWidth!==undefined?column.resize.minWidth:floor):width?parseFloat(width):null;
        return fixedWidths&&Object.hasOwn(fixedWidths,column.id)?fixedWidths[column.id]:initial;
      });
      resolved.forEach((width,index)=>{if(width!==null&&Number.isFinite(width)){const col=group.children[index] as HTMLTableColElement;if(col.style.width!==`${width}px`)col.style.width=`${width}px`;}});
      if(fixedWidths){const totalWidth=resolved.reduce<number>((sum,width)=>sum+(width??0),0);group.parentElement!.style.inlineSize=`${totalWidth}px`;}
    };
    const schedule=()=>{if(!dead&&!frame)frame=win.requestAnimationFrame(()=>{frame=0;measure();});};
    const observer=new ResizeObserver(schedule);observer.observe(probes);for(const probe of Array.from(probes.children))observer.observe(probe);
    win.addEventListener('resize',schedule);measure();
    return()=>{dead=true;observer.disconnect();win.cancelAnimationFrame(frame);win.removeEventListener('resize',schedule);group.parentElement!.style.removeProperty('inline-size');};
  },[columns,columnSizing,fixedWidths,!!resizeOptions]);
  const layoutFrame=React.useRef<HTMLDivElement>(null),layoutBody=React.useRef<HTMLDivElement>(null),layoutTable=React.useRef<HTMLTableElement>(null),layoutOwner=React.useRef<ReturnType<typeof observeDataTableLayout>|null>(null);
  React.useLayoutEffect(()=>{
    const owner=observeDataTableLayout(layoutFrame.current!,layoutBody.current!,layoutTable.current!);
    layoutOwner.current=owner;
    return()=>{owner.destroy();layoutOwner.current=null;};
  },[]);
  React.useLayoutEffect(()=>{layoutOwner.current?.update();});
  const hasRows=rows.length>0,loading=state.status==='loading'&&!state.hasValue,showError=state.status==='error';
  const error=errorState??view.error,empty=emptyState??view.empty;
  return <DataRegion id={id} className={cx('xui-data-table',className)} data-layout={state.layout} aria-label={options.label} busy={state.busy}>
    <div ref={layoutFrame} className="xui-data-table-frame">
      {hasContent(toolbar)&&<div className="xui-data-table-tools">{toolbar}</div>}
      <TableContainer ref={layoutBody} data-column-sizing={columnSizing} className="xui-data-table-body" aria-label={options.label+(state.hasValue?' — '+labels.count({rowCount:rows.length,total:state.total}):'')}>
        <div ref={widthProbes} className="xui-data-table-widths" aria-hidden="true" hidden={!columnSizing&&!resizeOptions}>{columns.map(column=><div key={column.id} style={column.width===undefined?undefined:{width:column.width}}/>)}{resizeOptions&&<><div ref={minimum} style={{width:'var(--data-table-column-resize-min)'}}/><div ref={maximum} style={{width:'var(--data-table-column-resize-max)'}}/></>}</div>
        <Table ref={layoutTable} data-column-sizing={columnSizing} striped={striped} stickyHeader={stickyHeader} data-resizable={!!resizeOptions||undefined} aria-label={options.label}>
          <colgroup ref={columnGroup}>{columns.map(column=><col key={column.id} style={column.width===undefined?undefined:{width:column.width}}/>)}</colgroup>
          <thead><TableRow>{columns.map(column=><TableHeaderCell key={column.id} sticky={column.sticky} data-resizable={resizeOptions&&column.resize!==false||undefined} aria-sort={column.ariaSort}>{column.header}{resizeOptions&&column.resize!==false&&<ColumnResizeHandle columnId={column.id} label={column.resize?.label??`Resize ${typeof column.header==='string'?column.header:column.id}`} bounds={column.resize} blocked={state.blocked} controller={sizing.controller} table={layoutTable} ids={columns.map(column=>column.id)} minimum={minimum} maximum={maximum}/>}</TableHeaderCell>)}</TableRow></thead>
          <tbody>{hasRows?rows.map((row,index)=><TableRow key={keys[index]} {...rowState?.(row)}
            onClick={rowEvents?.onClick?event=>rowEvent(row,index,event,rowEvents.onClick):undefined}
            onDoubleClick={rowEvents?.onDoubleClick?event=>rowEvent(row,index,event,rowEvents.onDoubleClick):undefined}
            onContextMenu={rowEvents?.onContextMenu?event=>rowEvent(row,index,event,rowEvents.onContextMenu):undefined}
            onKeyDown={rowEvents?.onKeyDown?event=>rowEvent(row,index,event,rowEvents.onKeyDown):undefined}
          >{columns.map(column=><TableCell key={column.id} sticky={column.sticky}>{column.cell(row,{rowIndex:index,rowKey:keys[index],busy:state.busy,disabled:state.blocked})}</TableCell>)}</TableRow>):<TableRow aria-hidden={loading||undefined}><TableCell colSpan={columns.length}><div className="xui-data-table-placeholder">{loading?null:showError&&!state.hasValue?error:state.status==='idle'?idleState??<div className="xui-state" role="status">{labels.idle}</div>:empty}</div></TableCell></TableRow>}</tbody>
        </Table>
      </TableContainer>
      {/* Share the visible body track, not the horizontally overflowing table.
          This layer exists only without records; refresh never covers rows. */}
      {!hasRows&&loading&&<LoadingState className="xui-data-table-loading">{labels.loading}</LoadingState>}
      <CollectionFooter prefix="xui-data-table" view={view} pagination={options.pagination} rowCount={rows.length} error={error} feedback={feedback} footer={footer}/>
    </div>
  </DataRegion>;
}
