import {DataTable,DataTableFilter,DataTableToolbar,type DataTableColumn,type DataTablePagination,type DataTableColumnWidth} from '@coffeehc/xui-react/data-table';
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
// @ts-expect-error The endpoint page base must be explicit.
const missingOffset:DataTablePagination={pageIndex:1,pageSize:20,total:10};
// @ts-expect-error Cursor is not a numbered pagination contract.
const inventedCursor:DataTablePagination={pageIndex:0,pageIndexOffset:0,pageSize:20,cursor:'opaque',total:null};

export const workspace=<AppShell sidebar={null} scrollMode="workspace" style={{'--layout-workspace-content-min-block-size':'var(--data-table-min-block-size)'} as CSSProperties}>{example}</AppShell>;

// Layout is shared across all public entry points; omission above exercises natural default.
import type {DataTableLayout} from '@coffeehc/xui-react/data-table';
import type {DataTableLayout as ReactRootLayout} from '@coffeehc/xui-react';
import type {DataTableLayout as RuntimeRootLayout} from '@coffeehc/xui-runtime';
import type {DataTableLayout as SharedLayout} from '@coffeehc/xui-runtime/data-table';
const naturalLayout:DataTableLayout='natural';
const workspaceLayout:ReactRootLayout='workspace';
const documentLayout:RuntimeRootLayout='document';
const sharedLayout:SharedLayout=naturalLayout;
export const naturalExample=<DataTable rows={rows} columns={columns} rowKey={row=>row.id} label="Natural records" layout={naturalLayout}/>;
export const workspaceExample=<DataTable rows={rows} columns={columns} rowKey={row=>row.id} label="Workspace records" layout={workspaceLayout}/>;
export const documentExample=<DataTable rows={rows} columns={columns} rowKey={row=>row.id} label="Document records" layout={documentLayout}/>;
// @ts-expect-error Layout accepts only natural, workspace or document.
const invalidLayout:DataTableLayout='viewport';
// @ts-expect-error React props use the shared layout contract.
export const invalidLayoutExample=<DataTable rows={rows} columns={columns} rowKey={row=>row.id} label="Invalid layout" layout="auto"/>;

import type {DataTableCursorPagination} from '@coffeehc/xui-react/data-table';
import type {DataTableCursorPagination as SharedCursorPagination} from '@coffeehc/xui-runtime/data-table';
import type {DataTableCursorPagination as RootCursorPagination} from '@coffeehc/xui-runtime';
import type {DataTableCursorPagination as ReactRootCursorPagination} from '@coffeehc/xui-react';
import {parseListData,toListPage,type ListData} from '@coffeehc/xui-runtime/query';
const cursorWire:ListData<Row>={list:rows,next_cursor:'opaque'};
const cursorPage=toListPage(parseListData(cursorWire),{returnTotal:false});
const cursorPagination:DataTableCursorPagination={mode:'cursor',pageSize:20,total:cursorPage.total,nextCursor:'opaque',hasPrevious:false,onNext:cursor=>{cursor.toUpperCase();}};
const sharedCursor:SharedCursorPagination=cursorPagination;
const rootCursor:RootCursorPagination=sharedCursor;
const reactRootCursor:ReactRootCursorPagination=rootCursor;
// @ts-expect-error cursor end must be explicitly known
const missingNextCursor:DataTableCursorPagination={mode:'cursor',pageSize:20,total:null,hasPrevious:false};
// @ts-expect-error cursor controls never accept numbered-page callbacks
const cursorWithPages:DataTableCursorPagination={...cursorPagination,onPageChange:()=>{}};
export const cursorExample=<DataTable rows={rows} columns={columns} rowKey={row=>row.id} label="Cursor records" pagination={rootCursor}/>;

export const confirmedEmptyRefreshError=<DataTable rows={[]} columns={columns} rowKey={(row:Row)=>row.id} label="Known empty" status="error" hasValue/>;
// @ts-expect-error Confirmed data is a boolean fact, not an inferred count.
export const invalidConfirmedResult=<DataTable rows={rows} columns={columns} rowKey={row=>row.id} label="Invalid fact" hasValue={0}/>;

import {createDataTableColumnSizingController,type DataTableColumnWidths} from '@coffeehc/xui-runtime/data-table';
const base={rows,columns,rowKey:(row:Row)=>row.id,label:'Resizable records'};
const widths:DataTableColumnWidths={name:240};
const sizing=createDataTableColumnSizingController({defaultWidths:widths,onWidthsChange:(next,details)=>{const pixel:number=next.name;const id:string|null=details.columnId;void pixel;void id;}});
const resizingViews=[<DataTable {...base} columnSizing={{}}/>,<DataTable {...base} columnSizing={{widths,onWidthsChange:()=>{}}}/>,<DataTable {...base} columnSizing={{controller:sizing}}/>];void resizingViews;
// @ts-expect-error an injected sizing owner cannot also receive default state
const duplicateSizing=<DataTable {...base} columnSizing={{controller:sizing,defaultWidths:widths}}/>;
// @ts-expect-error exact user widths are CSS pixel numbers, not CSS declarations
const invalidSizing=<DataTable {...base} columnSizing={{widths:{name:'12rem'}}}/>;
