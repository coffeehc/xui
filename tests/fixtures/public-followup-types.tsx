import * as React from 'react';
import {Menu,type MenuController,type MenuConfig} from '@coffeehc/xui-react/menu';
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
void [owned,injected,mixed,executable];
