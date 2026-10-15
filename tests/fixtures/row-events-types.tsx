import {DataTable,type DataTableRowEvents,type DataTableRowContext,type DataTableCellContext} from '@coffeehc/xui-react/data-table';
import type {DataTableRowContext as RootContext,DataTableRowEvents as RootEvents} from '@coffeehc/xui-react';
type Row={id:string;name:string};
const events:DataTableRowEvents<Row>={onDoubleClick:(row,context,event)=>{row.name.toUpperCase();context.rowKey;event.currentTarget.cells;},onKeyDown:(row,context,event)=>{event.key;event.preventDefault();}};
const rootEvents:RootEvents<Row>=events;
const context:DataTableRowContext={rowIndex:0,rowKey:'one',busy:false,disabled:false};const cell:DataTableCellContext=context;const rootContext:RootContext=cell;
export const example=<DataTable label="Records" rows={[{id:'one',name:'One'}]} columns={[{id:'name',header:'Name',cell:row=>row.name}]} rowKey={row=>row.id} rowEvents={rootEvents}/>;
// @ts-expect-error The row callback is typed as the supplied T.
const bad:DataTableRowEvents<Row>={onDoubleClick:(row:{unrelated:number})=>{}};
