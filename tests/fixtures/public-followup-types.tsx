import * as React from 'react';
import {Menu,type MenuController,type MenuConfig} from '@coffeehc/xui-react/menu';
import type {BusinessLogExplorerColumn,BusinessLogExplorerListPresentation,BusinessLogExplorerProps} from '@coffeehc/xui-react/business-log';
import type {StructuredLogExplorerColumnId,StructuredLogExplorerProps} from '@coffeehc/xui-react/structured-log';
import type {ApiKeyManagerProps} from '@coffeehc/xui-react/api-key';
import type {ChartProps} from '@coffeehc/xui-react/chart';
import type {DataTableColumn,DataTableColumnResizeOptions,DataTableColumnSizingProps} from '@coffeehc/xui-react/data-table';
import type {DataTableColumnSizingController} from '@coffeehc/xui-runtime/data-table';
import {createStructuredLogController,createStructuredLogHttpAdapter,type StructuredLogAdapter,type GroupedStructuredLogAdapter,type LogQueryRequest} from '@coffeehc/xui-runtime/structured-log';
import type {HttpClient} from '@coffeehc/xui-runtime/http';
declare const controller:MenuController,config:MenuConfig,client:HttpClient,request:LogQueryRequest,context:{signal:AbortSignal};
const owned=<Menu.View trigger={<button>菜单</button>} config={config} onAction={event=>{event.preventDefault();event.actionId satisfies string;}}/>;
const injected=<Menu.View trigger={<button>菜单</button>} controller={controller}/>;
// @ts-expect-error injection replaces config/action ownership, rather than adding a second owner
const mixed=<Menu.View trigger={<button>菜单</button>} controller={controller} config={config}/>;
// @ts-expect-error serializable menu nodes cannot contain executable action handlers
const executable:MenuConfig={items:[{id:'x',kind:'item',label:'条目',actionId:'x',onClick(){}}]};
declare const complete:StructuredLogAdapter;
// The existing named full interface preserves direct records calls.
complete.records(request,context);
const grouped:GroupedStructuredLogAdapter={groups:complete.groups,groupRecords:complete.groupRecords,record:complete.record};
createStructuredLogController({adapter:grouped});
createStructuredLogController({adapter:complete});
createStructuredLogHttpAdapter(client,{groups:'/groups',groupRecords:'/group',record:'/record',records:'/records'}).records(request,context);
const optional=createStructuredLogHttpAdapter(client,{groups:'/groups',groupRecords:'/group',record:'/record'});
// @ts-expect-error a grouped capability cannot be called without checking for records
optional.records(request,context);

const columnBounds:DataTableColumnResizeOptions={minWidth:160,maxWidth:520,label:'调整列宽'};
const sizing:DataTableColumnSizingProps={defaultWidths:{summary:260},onWidthsChange:(widths,change)=>{
  widths.summary satisfies number|undefined;
  change.reason satisfies 'pointer'|'keyboard'|'reset';
}};
declare const sizingController:DataTableColumnSizingController;
const injectedSizing:DataTableColumnSizingProps={controller:sizingController};
const controlledSizing:DataTableColumnSizingProps={widths:{summary:280},onWidthsChange:(_widths,change)=>{change.columnId satisfies string|null;}};
// @ts-expect-error an injected sizing owner replaces its local sizing options
const mixedSizingOwners:DataTableColumnSizingProps={controller:sizingController,widths:{summary:280}};

const resizableBusinessColumn:BusinessLogExplorerColumn={id:'summary',header:'摘要',width:'24rem',resize:columnBounds,cell:({content})=>content};
const fixedBusinessDetailColumn:BusinessLogExplorerColumn={id:'detail',header:'详情',width:180,resize:false};
const businessColumns:BusinessLogExplorerListPresentation={columns:[resizableBusinessColumn,fixedBusinessDetailColumn]};
const businessSizing:BusinessLogExplorerProps['columnSizing']=injectedSizing;
const apiKeySizing:ApiKeyManagerProps['columnSizing']=controlledSizing;
const chartSizing:ChartProps['columnSizing']=sizing;

const structuredColumnIds:Record<StructuredLogExplorerColumnId,true>={summary:true,severity:true,source:true,entry_count:true,matched_entry_count:true,last_seen_at:true,occurred_at:true,retryable:true,user_fixable:true,actions:true};
const structuredColumnOptions:NonNullable<StructuredLogExplorerProps['columnOptions']>={
  summary:{width:'24rem',resize:columnBounds},severity:{width:'8rem'},source:{width:'14rem'},
  entry_count:{width:120},matched_entry_count:{width:160},last_seen_at:{width:180},occurred_at:{width:200},
  retryable:{width:110},user_fixable:{width:120},actions:{width:160,resize:false},
};
// @ts-expect-error the structured-log action column always stays fixed
const resizableStructuredAction:NonNullable<StructuredLogExplorerProps['columnOptions']>={actions:{resize:columnBounds}};
// @ts-expect-error structured log column options accept only public semantic ids
const unknownStructuredColumn:NonNullable<StructuredLogExplorerProps['columnOptions']>={payload:{width:220}};
const structuredSizing:StructuredLogExplorerProps['columnSizing']=sizing;

const semanticCell:DataTableColumn<{id:string}>={id:'id',header:'ID',cell:row=>row.id,cellClassName:'xui-table-value'};
const invalidCell:DataTableColumn<{id:string}>={id:'id',header:'ID',cell:row=>row.id,
  // @ts-expect-error semantic cell classes are strings
  cellClassName:42,
};
void [owned,injected,mixed,executable,columnBounds,sizing,injectedSizing,controlledSizing,mixedSizingOwners,resizableBusinessColumn,fixedBusinessDetailColumn,businessColumns,businessSizing,apiKeySizing,chartSizing,structuredColumnIds,structuredColumnOptions,resizableStructuredAction,unknownStructuredColumn,structuredSizing,semanticCell,invalidCell];
