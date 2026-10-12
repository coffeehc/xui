import {DataTable,DataTableFilter,DataTableToolbar,type DataTableColumn,type DataTablePagination,type DataTableColumnWidth} from '@coffeehc/xui-react/data-table';
import {createDataTable,createDataTableToolbar,createDataTableFilter,type NativeDataTableColumn} from '@coffeehc/xui-runtime/data-table-dom';
import type {DataTableColumnWidth as ReactRootColumnWidth} from '@coffeehc/xui-react';
import type {DataTableColumnWidth as RuntimeRootColumnWidth} from '@coffeehc/xui-runtime';
import type {DataTableColumnWidth as SharedColumnWidth} from '@coffeehc/xui-runtime/data-table';
import type {CSSProperties} from 'react';
import {AppShell} from '@coffeehc/xui-react/layout';
import {Input} from '@coffeehc/xui-react/forms';
type Row={id:string;name:string};const rows:readonly Row[]=[{id:'one',name:'One'}];
const pagination:DataTablePagination={pageIndex:0,pageIndexOffset:0,pageSize:20,total:1,pageSizeOptions:[20,50,100],onPageChange:()=>{}};
const columns:readonly DataTableColumn<Row>[]=[{id:'name',header:'Name',cell:row=>row.name}];
const width:DataTableColumnWidth=160;
const rootWidth:ReactRootColumnWidth='12rem';
const runtimeWidth:RuntimeRootColumnWidth='25%';
const sharedWidth:SharedColumnWidth='calc(50% - 1rem)';
const sizedColumns:readonly DataTableColumn<Row>[]=[
  {id:'fixed',header:'Fixed',width,cell:row=>row.id},
  {id:'relative',header:'Relative',width:rootWidth,cell:row=>row.name},
  {id:'percentage',header:'Percentage',width:runtimeWidth,cell:row=>row.name},
  {id:'mixed',header:'Mixed',width:sharedWidth,cell:row=>row.name},
  {id:'bounded',header:'Bounded',width:'clamp(10rem, 25%, 24rem)',cell:row=>row.name},
  {id:'minimum',header:'Minimum',width:'min(20rem, 50%)',cell:row=>row.name},
  {id:'maximum',header:'Maximum',width:'max(12rem, 25%)',cell:row=>row.name},
  {id:'variable',header:'Variable',width:'var(--host-column-width, 12rem)',cell:row=>row.name},
  {id:'zero',header:'Zero',width:0,cell:row=>row.name},
  {id:'automatic',header:'Automatic',cell:row=>row.name},
];
export const sizedExample=<DataTable rows={rows} columns={sizedColumns} rowKey={row=>row.id} label="Sized records"/>;
// @ts-expect-error A numeric string without a CSS unit is not a width.
const numericStringWidth:DataTableColumn<Row>={id:'bad',header:'Bad',width:'160',cell:row=>row.name};
// @ts-expect-error Width is one value, not an object of CSS properties.
const objectWidth:DataTableColumn<Row>={id:'bad',header:'Bad',width:{width:160},cell:row=>row.name};
// @ts-expect-error Width does not accept a list.
const arrayWidth:DataTableColumn<Row>={id:'bad',header:'Bad',width:[160],cell:row=>row.name};
// @ts-expect-error Boolean is not a column width.
const booleanWidth:DataTableColumn<Row>={id:'bad',header:'Bad',width:false,cell:row=>row.name};
// @ts-expect-error Omit width to request automatic layout.
const autoWidth:DataTableColumnWidth='auto';
export const example=<DataTable rows={rows} columns={columns} rowKey={row=>row.id} label="Records" pagination={pagination} toolbar={<DataTableToolbar><DataTableFilter label="Search" grow><Input/></DataTableFilter></DataTableToolbar>}/>;
const nativeColumns:readonly NativeDataTableColumn<Row>[]=[{id:'name',header:'Name',cell:row=>row.name},{id:'action',header:'Action',cell:row=>({element:document.createElement('button'),update(next,context){next.name;context.busy;},destroy(){}})}];
const owner=createDataTable(document.createElement('section'),{rows,columns:nativeColumns,rowKey:row=>row.id,label:'Records',pagination,toolbar:createDataTableToolbar(document,[createDataTableFilter(document,{label:'Search',control:document.createElement('input')})])});owner.update({status:'refreshing'});owner.getBody();owner.destroy();
// @ts-expect-error The endpoint page base must be explicit.
const missingOffset:DataTablePagination={pageIndex:1,pageSize:20,total:10};
// @ts-expect-error Cursor is not a numbered pagination contract.
const inventedCursor:DataTablePagination={pageIndex:0,pageIndexOffset:0,pageSize:20,cursor:'opaque',total:null};

export const workspace=<AppShell sidebar={null} scrollMode="workspace" style={{'--layout-workspace-content-min-block-size':'var(--data-table-min-block-size)'} as CSSProperties}>{example}</AppShell>;
