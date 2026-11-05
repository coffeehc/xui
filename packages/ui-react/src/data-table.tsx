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
import {OverflowTextInteraction} from './overflow-text-context.js';
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
  /** Semantic cell text/layout class; the table retains its native td and row identity. */
  cellClassName?:string;
  ariaSort?:React.AriaAttributes['aria-sort'];
  /** Pin a column to its logical edge. The standard actions column defaults to end; false explicitly unpins it. */
  sticky?:'start'|'end'|false;
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
function stickyEdge<T>({id,sticky}:DataTableColumn<T>) {
  return sticky===false?undefined:sticky??(id==='actions'?'end':undefined);
}
/** One stable row surface lends existing actions to passive text reveal. */
function DataRow<T>({row,columns,context,state,events}:{row:T;columns:readonly DataTableColumn<T>[];context:DataTableCellContext;state?:{selected?:boolean;expanded?:boolean};events:React.HTMLAttributes<HTMLTableRowElement>}){
  const interaction=React.useRef<HTMLTableRowElement>(null);
  return <OverflowTextInteraction.Provider value={interaction}><TableRow ref={interaction} {...state} {...events}>{columns.map(column=><TableCell key={column.id} sticky={stickyEdge(column)} className={column.cellClassName}>{column.cell(row,context)}</TableCell>)}</TableRow></OverflowTextInteraction.Provider>;
}
/** Query facts stay controlled. Optional local sizing never requests data or changes page facts. */
export function DataTable<T>({rows,columns,rowKey,rowState,rowEvents,toolbar,idleState,emptyState,errorState,feedback,footer,striped=false,stickyHeader=true,className,id,columnSizing:resizeOptions,...options}:DataTableProps<T>) {
  const keys=validateDataTableKeys(rows,columns,rowKey),view=useCollectionView(options,rows.length),{state}=view,{labels}=state;
  const rowEvent=<E extends React.SyntheticEvent<HTMLTableRowElement>>(row:T,index:number,event:E,handler:((row:T,context:DataTableRowContext,event:E)=>void)|undefined)=>{
    if(!state.blocked&&isDataTableRowEvent(event.nativeEvent,event.currentTarget))handler?.(row,{rowIndex:index,rowKey:keys[index],busy:state.busy,disabled:state.blocked},event);
  };
  const sizing=useDataTableColumnSizing(resizeOptions),fixedWidths=resizeOptions&&columns.some(column=>Object.hasOwn(sizing.widths,column.id))?sizing.widths:undefined;
  const columnSizing=fixedWidths?'resized':resizeOptions?'sized':columns.some(column=>column.width!==undefined)?columns.every(column=>column.width!==undefined)?'sized':'mixed':undefined;
  const lastEdit=React.useRef<{id:string;width:number}|null>(null);
  const onCommitWidth=(id:string,width:number)=>{lastEdit.current={id,width};};
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
      if(fixedWidths){
        // Width preferences stay in the controller. Fill unused space with data,
        // not with a huge frozen action cell or a blank strip beside the table.
        const total=resolved.reduce<number>((sum,width)=>sum+(width??0),0);
        const portWidth=probes.clientWidth, spare=portWidth-total;
        if(spare>0){
          // Prefer a different data column so dragging the flexible column still
          // moves its handle. Cancelled or rejected widths do not become preferences.
          const last=lastEdit.current;
          const edited=sizing.controller.getState().resizing?.columnId??(last&&fixedWidths[last.id]===last.width?last.id:undefined);
          let data=-1,other=-1;
          columns.forEach((column,i)=>{if(!stickyEdge(column)&&column.resize!==false){data=i;if(column.id!==edited)other=i;}});
          const fill=other>=0?other:data>=0?data:columns.length-1;
          resolved[fill]=(resolved[fill]??0)+spare;
        }
        const totalWidth=Math.max(total,portWidth);
        group.parentElement!.style.inlineSize=`${totalWidth}px`;
      }
      resolved.forEach((width,index)=>{if(width!==null&&Number.isFinite(width)){const col=group.children[index] as HTMLTableColElement;if(col.style.width!==`${width}px`)col.style.width=`${width}px`;}});
    };
    const schedule=()=>{if(!dead&&!frame)frame=win.requestAnimationFrame(()=>{frame=0;measure();});};
    const observer=new ResizeObserver(schedule);observer.observe(probes);for(const probe of Array.from(probes.children))observer.observe(probe);
    win.addEventListener('resize',schedule);measure();
    return()=>{dead=true;observer.disconnect();win.cancelAnimationFrame(frame);win.removeEventListener('resize',schedule);group.parentElement!.style.removeProperty('inline-size');};
  },[columns,columnSizing,fixedWidths,!!resizeOptions,sizing.controller]);
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
          <thead><TableRow>{columns.map(column=><TableHeaderCell key={column.id} sticky={stickyEdge(column)} aria-label={typeof column.header==='string'?column.header:undefined} data-resizable={resizeOptions&&column.resize!==false||undefined} aria-sort={column.ariaSort}>{column.header}{resizeOptions&&column.resize!==false&&<ColumnResizeHandle onCommitWidth={onCommitWidth} columnId={column.id} label={column.resize?.label??`Resize ${typeof column.header==='string'?column.header:column.id}`} bounds={column.resize} blocked={state.blocked} controller={sizing.controller} table={layoutTable} ids={columns.map(column=>column.id)} minimum={minimum} maximum={maximum}/>}</TableHeaderCell>)}</TableRow></thead>
          <tbody>{hasRows?rows.map((row,index)=><DataRow key={keys[index]} row={row} columns={columns} context={{rowIndex:index,rowKey:keys[index],busy:state.busy,disabled:state.blocked}} state={rowState?.(row)} events={{
            onClick:rowEvents?.onClick?event=>rowEvent(row,index,event,rowEvents.onClick):undefined,
            onDoubleClick:rowEvents?.onDoubleClick?event=>rowEvent(row,index,event,rowEvents.onDoubleClick):undefined,
            onContextMenu:rowEvents?.onContextMenu?event=>rowEvent(row,index,event,rowEvents.onContextMenu):undefined,
            onKeyDown:rowEvents?.onKeyDown?event=>rowEvent(row,index,event,rowEvents.onKeyDown):undefined,
          }}/>):<TableRow aria-hidden={loading||undefined}><TableCell colSpan={columns.length}><div className="xui-data-table-placeholder">{loading?null:showError&&!state.hasValue?error:state.status==='idle'?idleState??<div className="xui-state" role="status">{labels.idle}</div>:empty}</div></TableCell></TableRow>}</tbody>
        </Table>
      </TableContainer>
      {/* Share the visible body track, not the horizontally overflowing table.
          This layer exists only without records; refresh never covers rows. */}
      {!hasRows&&loading&&<LoadingState className="xui-data-table-loading">{labels.loading}</LoadingState>}
      <CollectionFooter prefix="xui-data-table" view={view} pagination={options.pagination} rowCount={rows.length} error={error} feedback={feedback} footer={footer}/>
    </div>
  </DataRegion>;
}
