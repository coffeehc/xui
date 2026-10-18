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

import {StructuredLogExplorer,type StructuredLogExplorerSlots} from '@coffeehc/xui-react/structured-log';
import type {StructuredLogController} from '@coffeehc/xui-runtime/structured-log';
declare const logs:StructuredLogController;
const logSlots:StructuredLogExplorerSlots={pageToolbar:<span>宿主范围</span>,headerActions:<span>宿主动作</span>};
export const logQuery=<StructuredLogExplorer controller={logs} {...logSlots}/>;
// @ts-expect-error Layout slots cannot introduce a second request owner.
export const secondLogOwner=<StructuredLogExplorer controller={logs} loader={async()=>[]}/>;

import {structuredLogDefaultLabels,type StructuredLogLabels} from '@coffeehc/xui-runtime/structured-log';
const {resetDraft,appliedFilters,...priorLogLabels}=structuredLogDefaultLabels;
export const compatiblePriorLabels:StructuredLogLabels=priorLogLabels;
export const localizedLogLabels:StructuredLogLabels={...priorLogLabels,resetDraft:'恢复草稿',appliedFilters:'已提交范围'};
