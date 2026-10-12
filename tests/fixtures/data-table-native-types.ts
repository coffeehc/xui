import {createDataTable,createDataTableToolbar,createDataTableFilter,type NativeDataTableColumn,type DataTableColumnWidth} from '@coffeehc/xui-runtime/data-table-dom';
import type {DataTablePagination,DataTableColumnWidth as SharedColumnWidth} from '@coffeehc/xui-runtime/data-table';
import type {DataTableColumnWidth as RootColumnWidth} from '@coffeehc/xui-runtime';
type Row={id:string;name:string};const rows:readonly Row[]=[];
const pagination:DataTablePagination={pageIndex:1,pageIndexOffset:1,pageSize:20,total:null,pageSizeOptions:[20,50,100]};
const columns:readonly NativeDataTableColumn<Row>[]=[{id:'name',header:'Name',cell:row=>row.name},{id:'action',header:'Action',cell:row=>({element:document.createElement('button'),update(next,context){next.name;context.busy;},destroy(){}})}];
const width:DataTableColumnWidth=160;
const rootWidth:RootColumnWidth='12rem';
const sharedWidth:SharedColumnWidth='calc(50% - 1rem)';
const sizedColumns:readonly NativeDataTableColumn<Row>[]=[
  {id:'fixed',header:'Fixed',width,cell:row=>row.id},
  {id:'relative',header:'Relative',width:rootWidth,cell:row=>row.name},
  {id:'percentage',header:'Percentage',width:'25%',cell:row=>row.name},
  {id:'mixed',header:'Mixed',width:sharedWidth,cell:row=>row.name},
  {id:'bounded',header:'Bounded',width:'clamp(10rem, 25%, 24rem)',cell:row=>row.name},
  {id:'minimum',header:'Minimum',width:'min(20rem, 50%)',cell:row=>row.name},
  {id:'maximum',header:'Maximum',width:'max(12rem, 25%)',cell:row=>row.name},
  {id:'variable',header:'Variable',width:'var(--host-column-width, 12rem)',cell:row=>row.name},
  {id:'zero',header:'Zero',width:0,cell:row=>row.name},
  {id:'automatic',header:'Automatic',cell:row=>row.name},
];
const sizedTable=createDataTable(document.createElement('section'),{rows,columns:sizedColumns,rowKey:row=>row.id,label:'Sized records'});sizedTable.destroy();
// @ts-expect-error A numeric string without a CSS unit is not a width.
const numericStringWidth:NativeDataTableColumn<Row>={id:'bad',header:'Bad',width:'160',cell:row=>row.name};
// @ts-expect-error Width is one value, not an object of CSS properties.
const objectWidth:NativeDataTableColumn<Row>={id:'bad',header:'Bad',width:{width:160},cell:row=>row.name};
// @ts-expect-error Width does not accept a list.
const arrayWidth:NativeDataTableColumn<Row>={id:'bad',header:'Bad',width:[160],cell:row=>row.name};
// @ts-expect-error Boolean is not a column width.
const booleanWidth:NativeDataTableColumn<Row>={id:'bad',header:'Bad',width:false,cell:row=>row.name};
// @ts-expect-error Omit width to request automatic layout.
const autoWidth:DataTableColumnWidth='auto';
const table=createDataTable(document.createElement('section'),{rows,columns,rowKey:row=>row.id,label:'Records',pagination,toolbar:createDataTableToolbar(document,[createDataTableFilter(document,{label:'Search',control:document.createElement('input')})])});table.update({status:'refreshing'});table.getBody();table.destroy();
// @ts-expect-error Explicit page offset is required in the native entry as well.
const invalid:DataTablePagination={pageIndex:1,pageSize:20,total:10};
