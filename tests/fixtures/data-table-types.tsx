import {DataTable,DataTableFilter,DataTableToolbar,type DataTableColumn,type DataTablePagination} from '@coffeehc/xui-react/data-table';
import {createDataTable,createDataTableToolbar,createDataTableFilter,type NativeDataTableColumn} from '@coffeehc/xui-runtime/data-table-dom';
import type {CSSProperties} from 'react';
import {AppShell} from '@coffeehc/xui-react/layout';
import {Input} from '@coffeehc/xui-react/forms';
type Row={id:string;name:string};const rows:readonly Row[]=[{id:'one',name:'One'}];
const pagination:DataTablePagination={pageIndex:0,pageIndexOffset:0,pageSize:20,total:1,pageSizeOptions:[20,50,100],onPageChange:()=>{}};
const columns:readonly DataTableColumn<Row>[]=[{id:'name',header:'Name',cell:row=>row.name}];
export const example=<DataTable rows={rows} columns={columns} rowKey={row=>row.id} label="Records" pagination={pagination} toolbar={<DataTableToolbar><DataTableFilter label="Search" grow><Input/></DataTableFilter></DataTableToolbar>}/>;
const nativeColumns:readonly NativeDataTableColumn<Row>[]=[{id:'name',header:'Name',cell:row=>row.name},{id:'action',header:'Action',cell:row=>({element:document.createElement('button'),update(next,context){next.name;context.busy;},destroy(){}})}];
const owner=createDataTable(document.createElement('section'),{rows,columns:nativeColumns,rowKey:row=>row.id,label:'Records',pagination,toolbar:createDataTableToolbar(document,[createDataTableFilter(document,{label:'Search',control:document.createElement('input')})])});owner.update({status:'refreshing'});owner.getBody();owner.destroy();
// @ts-expect-error The endpoint page base must be explicit.
const missingOffset:DataTablePagination={pageIndex:1,pageSize:20,total:10};
// @ts-expect-error Cursor is not a numbered pagination contract.
const inventedCursor:DataTablePagination={pageIndex:0,pageIndexOffset:0,pageSize:20,cursor:'opaque',total:null};

export const workspace=<AppShell sidebar={null} scrollMode="workspace" style={{'--layout-workspace-content-min-block-size':'var(--data-table-min-block-size)'} as CSSProperties}>{example}</AppShell>;
