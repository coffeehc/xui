import {createDataTable,createDataTableToolbar,createDataTableFilter,type NativeDataTableColumn} from '@coffeehc/xui-runtime/data-table-dom';
import type {DataTablePagination} from '@coffeehc/xui-runtime/data-table';
type Row={id:string;name:string};const rows:readonly Row[]=[];
const pagination:DataTablePagination={pageIndex:1,pageIndexOffset:1,pageSize:20,total:null,pageSizeOptions:[20,50,100]};
const columns:readonly NativeDataTableColumn<Row>[]=[{id:'name',header:'Name',cell:row=>row.name},{id:'action',header:'Action',cell:row=>({element:document.createElement('button'),update(next,context){next.name;context.busy;},destroy(){}})}];
const table=createDataTable(document.createElement('section'),{rows,columns,rowKey:row=>row.id,label:'Records',pagination,toolbar:createDataTableToolbar(document,[createDataTableFilter(document,{label:'Search',control:document.createElement('input')})])});table.update({status:'refreshing'});table.getBody();table.destroy();
// @ts-expect-error Explicit page offset is required in the native entry as well.
const invalid:DataTablePagination={pageIndex:1,pageSize:20,total:10};
