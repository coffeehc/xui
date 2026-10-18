import {QueryForm,QueryField,type QueryFormProps,type QueryFieldWidth} from '@coffeehc/xui-react/search-toolbar';
import {Input} from '@coffeehc/xui-react/forms';
import {EmptyState} from '@coffeehc/xui-react/feedback';
import {DataTable,type DataTableProps} from '@coffeehc/xui-react/data-table';
import {createOverlayController} from '@coffeehc/xui-runtime/interaction';
const width:QueryFieldWidth='compact';
const form:QueryFormProps={label:'查询',fields:<QueryField width={width} label="状态"><Input/></QueryField>,actions:<button type="submit">查询</button>,disclosure:{expanded:false,onExpandedChange:()=>{}},onSubmit:event=>event.preventDefault()};
export const query=<QueryForm {...form}/>;
export const injected=<QueryForm {...form} disclosure={{controller:createOverlayController()}}/>;
const table:DataTableProps<{id:string}>={label:'结果',rows:[],columns:[{id:'id',header:'编号',cell:row=>row.id}],rowKey:row=>row.id,status:'idle',idleState:<EmptyState align="center" icon="⌕" title="开始查询"/>};
export const results=<DataTable {...table}/>;
// @ts-expect-error Semantic widths are finite; arbitrary pixels do not define a new public role.
export const invalid=<QueryField width="400px" label="编号"/>;
// @ts-expect-error QueryForm always needs an accessible form name.
export const unnamed=<QueryForm fields={null} actions={null}/>;
// @ts-expect-error Injected disclosure has a single state owner.
export const duplicate=<QueryForm {...form} disclosure={{controller:createOverlayController(),expanded:true}}/>;
