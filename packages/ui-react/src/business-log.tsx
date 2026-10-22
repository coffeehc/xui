import {createBusinessLogViewController,type BusinessLogViewController,businessLogFilterDraft} from '@coffeehc/xui-runtime/component-views';
import {resolveBusinessLogLabels,type BusinessLogOptions,type BusinessLogListPresentation,type BusinessLogLabels,type BusinessLogListColumn,type BusinessLogListColumnId,type BusinessLogCellContext} from '@coffeehc/xui-runtime/business-log';
import {useOwnedController,useViewRelease,assertControllerProps} from './controller.js';
import {Dialog as PeerDialog} from '@base-ui/react/dialog';
import * as React from 'react';
import {getBusinessLogSnapshot,findBusinessLogRenderer,getBusinessLogFacts,getBusinessLogTable,type BusinessLogController,type BusinessLogDetail,type BusinessLogFilter,type BusinessLogRenderer,type BusinessLogActorKind,type BusinessLogOutcome} from '@coffeehc/xui-runtime/business-log';
import {Button} from './button.js';
import {RefreshAction} from './refresh-action.js';
import {Field,Input,SimpleSelect} from './forms.js';
import {PageHeader,Toolbar,FormGrid,Stack} from './layout.js';
import {QueryForm,QueryField} from './search-toolbar.js';
import {OverflowText} from './display.js';
import {LoadingState,ErrorState,EmptyState,Alert,RenderBoundary} from './feedback.js';
import {DataTable,type DataTableColumn,type DataTableColumnSizingProps} from './data-table.js';
import {Dialog} from './dialog.js';
import {cx} from './shared.js';
export type {BusinessLogController,BusinessLogEvent,BusinessLogDetail,BusinessLogFilter,BusinessLogLoader,BusinessLogRenderer,BusinessLogLabels,BusinessLogListColumnId,BusinessLogListColumn,BusinessLogListPresentation,BusinessLogCellContext,JSONValue} from '@coffeehc/xui-runtime/business-log';
export interface BusinessLogExplorerCellContext extends BusinessLogCellContext {readonly content:React.ReactNode}
export interface BusinessLogExplorerColumn extends BusinessLogListColumn {
 /** Null/omitted renders the corresponding raw field. A function owns its complete result, including empty content. */
 cell?:((context:BusinessLogExplorerCellContext)=>React.ReactNode)|null;
}
export interface BusinessLogExplorerListPresentation extends Omit<BusinessLogListPresentation,'columns'> {
 columns?:readonly BusinessLogExplorerColumn[];
}
interface BusinessLogExplorerSlots {className?:string;headerActions?:React.ReactNode;renderers?:readonly BusinessLogRenderer<React.ReactNode>[];
 /** DataTable owns local sizing by default; optional controlled widths or an injected sizing controller. */
 columnSizing?:DataTableColumnSizingProps;
 /** Live list-only presentation; updating it does not recreate or query the controller. */
 list?:BusinessLogExplorerListPresentation;
 /** Additional direct QueryField children. The host retains their values and query-scope owner. */
 queryFields?:React.ReactNode;
 /** Host-confirmed extra scope/feedback, never inferred from unsubmitted fields. */
 querySummary?:React.ReactNode;
 /** Live whole-page labels in every ownership mode. No controller mutation, reset or request. */
 labels?:Partial<BusinessLogLabels>;
}
const jsonStyle={whiteSpace:'pre-wrap',overflowWrap:'anywhere'} as const;
function Payload({detail,renderers}:{detail:Readonly<BusinessLogDetail>;renderers:readonly BusinessLogRenderer<React.ReactNode>[]}){const renderer=findBusinessLogRenderer(renderers,detail);return renderer?renderer.render(detail):<pre className="xui-code" style={jsonStyle}>{JSON.stringify(detail.payload,null,2)}</pre>;}
export type BusinessLogExplorerProps=BusinessLogExplorerSlots&({viewController:BusinessLogViewController;controller?:never;options?:never;pagination?:never}|{viewController?:undefined;controller:BusinessLogController;options?:never}|{viewController?:undefined;controller?:undefined;options:BusinessLogOptions});
function defaultColumns(labels:Readonly<BusinessLogLabels>):readonly BusinessLogExplorerColumn[]{return [
 {id:'summary',header:labels.summary},
 {id:'result',header:labels.result,cell:({event})=>labels[event.result]},
 {id:'actor',header:labels.actor,cell:({event})=>`${labels[event.actor.kind]} · ${event.actor.display_name?event.actor.display_name+' · ':''}${event.actor.id}`},
 {id:'action',header:labels.action},{id:'occurred_at',header:labels.occurredAt},
 {id:'object',header:labels.object,cell:({event})=>event.object?`${event.object.kind}: ${event.object.id}${event.object.display_name?' · '+event.object.display_name:''}`:labels.unknown},
 {id:'detail',header:labels.detail},
];}
/** Read-only log presentation; the host owns loader, permissions and event reliability. */
export function BusinessLogExplorer({viewController:injected,controller:borrowed,options:initialOptions,className,headerActions,queryFields,querySummary,renderers=[],list,labels:labelOverrides,columnSizing={}}:BusinessLogExplorerProps){
  assertControllerProps(injected,{controller:borrowed,options:initialOptions},['controller','options']);
  if(borrowed&&initialOptions)throw new TypeError('controller cannot be combined with options');
  const viewController=useOwnedController(injected,()=>createBusinessLogViewController(borrowed?{service:borrowed}:{options:initialOptions!}),borrowed);
  const controller=viewController.service,viewState=React.useSyncExternalStore(viewController.subscribe,viewController.getState,viewController.getState);
  React.useEffect(()=>viewController.start(),[viewController]);
  const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState);
  const labels=resolveBusinessLogLabels(labelOverrides,initialOptions?resolveBusinessLogLabels(initialOptions.labels):controller.labels);
  const error=state.errorKey?labels[state.errorKey]:state.error,detailError=state.detailErrorKey?labels[state.detailErrorKey]:state.detailError;
  const draft=viewState.draft,setDraft=viewController.setDraft,toDraft=businessLogFilterDraft;
  const lastTrigger=React.useRef<HTMLButtonElement|null>(null),refresh=React.useRef<HTMLButtonElement>(null),table=getBusinessLogTable(state,labels,list),detail=state.detail;
  const cells=new Map((list?.columns??defaultColumns(labels)).map(column=>{if(column.cell!=null&&typeof column.cell!=='function')throw new TypeError('Business log cell must be a function or null');return [column.id,column.cell] as const;}));
  const columns:readonly DataTableColumn<typeof table.rows[number]>[]=table.columns.map((column,index)=>({
    id:column.id,header:column.header,width:column.width??(column.id==='detail'?'var(--layout-field-min)':undefined),resize:column.resize,
    cellClassName:column.id==='summary'?'xui-table-primary':['action','occurred_at'].includes(column.id)?'xui-code xui-table-value':column.id==='detail'?undefined:'xui-table-label',
    cell:row=>{
      const detail=column.id==='detail',value=row.values[index],text=detail?labels.detail:value==null?'':typeof value==='object'?JSON.stringify(value):String(value);
      const content=detail?<Button variant="ghost" size="xs" aria-label={`${labels.detail} ${row.id}`} onClick={event=>{lastTrigger.current=event.currentTarget;void controller.openDetail(row.id);}}>{labels.detail}</Button>:column.overflow==='ellipsis'?<OverflowText text={text}/>:text;
      const context=Object.freeze({rowId:row.id,columnId:column.id,event:row.event,value,text,content}),cell=cells.get(column.id);
      return <span className="xui-business-log-cell" data-overflow={column.overflow}>{cell?cell(context):context.content}</span>;
    },
  }));
  useViewRelease(controller,()=>{controller.closeDetail();controller.cancel();});
  const input=(key:Exclude<keyof typeof draft,'actorKind'|'result'>,label:string)=><Field key={key} label={label}><Input value={draft[key]} autoComplete="off" onChange={event=>setDraft({...draft,[key]:event.target.value})}/></Field>;
  const eventField=(key:'event_type',label:string)=><QueryField label={label} width="standard"><Input value={draft[key]} autoComplete="off" onChange={event=>setDraft({...draft,[key]:event.target.value})}/></QueryField>;
  const select=(key:'actorKind'|'result',label:string,values:readonly string[])=><Field label={label}><SimpleSelect value={draft[key]} onChange={event=>setDraft({...draft,[key]:event.target.value})}>{values.map(value=><option key={value} value={value}>{value?labels[value as BusinessLogActorKind|BusinessLogOutcome]:labels.all}</option>)}</SimpleSelect></Field>;
  const apply=()=>controller.setFilter({since:draft.since||null,until:draft.until||null,actor:draft.actorId?{kind:draft.actorKind as BusinessLogActorKind,id:draft.actorId}:null,object:draft.objectKind||draft.objectId?{kind:draft.objectKind,id:draft.objectId}:null,event_type:draft.event_type||null,action:draft.action||null,result:draft.result as BusinessLogOutcome||null,correlation_id:draft.correlation_id||null,request_id:draft.request_id||null});
  const object=detail?.event.object,href=object?controller.resolveObject(object):null;
  return <section className={cx('xui-stack',className)}><PageHeader title={labels.title} actions={<><RefreshAction ref={refresh} variant="outline" disabled={state.busy} busy={state.busy} onClick={()=>controller.refresh()}>{labels.refresh}</RefreshAction><Button disabled={!state.busy} variant="outline" onClick={()=>controller.cancel()}>{labels.cancel}</Button>{headerActions}</>}/>
    <QueryForm label={labels.filters} noValidate onSubmit={event=>{event.preventDefault();void apply();}}
      fields={<>{queryFields}{eventField('event_type',labels.eventType)}<QueryField label={labels.result} width="compact"><SimpleSelect value={draft.result} onChange={event=>setDraft({...draft,result:event.target.value})}>{['','succeeded','failed','denied','unknown'].map(value=><option key={value} value={value}>{value?labels[value as BusinessLogOutcome]:labels.all}</option>)}</SimpleSelect></QueryField></>}
      actions={<><Button type="submit">{labels.apply}</Button><Button variant="outline" onClick={()=>{setDraft(toDraft({}));void controller.setFilter({});}}>{labels.clear}</Button></>}
      advancedLabel={labels.filters} disclosure={{controller:viewController.filters}}
      advanced={<FormGrid>{input('since',labels.since)}{input('until',labels.until)}{select('actorKind',labels.actorKind,['user','agent','service'])}{input('actorId',labels.actorId)}{input('objectKind',labels.objectKind)}{input('objectId',labels.objectId)}{input('action',labels.action)}{input('correlation_id',labels.correlationId)}{input('request_id',labels.requestId)}</FormGrid>}
      summary={<>{querySummary}{state.filterError&&<Alert tone="error">{state.filterErrorKey?labels[state.filterErrorKey]:state.filterError}</Alert>}</>}/>
    <DataTable className="xui-record-table xui-business-log-table" label={labels.title} layout="document" rows={table.rows} columns={columns} rowKey={row=>row.id} columnSizing={columnSizing}
      status={state.busy?(state.data?'refreshing':'loading'):state.error?'error':state.data?'ready':'idle'} hasValue={state.data!==null}
      labels={{loading:labels.loading,refreshing:labels.loading,idle:labels.loading,empty:labels.empty,retry:labels.retry,count:()=>''}}
      emptyState={<EmptyState title={labels.empty}/>} errorState={<ErrorState title={error??labels.readError} onRetry={()=>controller.retry()} retryLabel={labels.retry}/>}
      footer={state.data?<Toolbar><Button variant="outline" disabled={state.busy||!state.canPrevious||!!state.error||!!state.filterError} onClick={()=>controller.previous()}>{labels.previous}</Button><span data-business-log-page>{labels.page} {state.pageIndex+1}</span><Button variant="outline" disabled={state.busy||!state.canNext||!!state.error||!!state.filterError} onClick={()=>controller.next()}>{labels.next}</Button>{getBusinessLogSnapshot(state.data)!==null&&<span className="xui-code" data-business-log-snapshot>{labels.snapshot}: {getBusinessLogSnapshot(state.data)}</span>}</Toolbar>:undefined}/>
    <PeerDialog.Root open={state.detailOpen} onOpenChange={open=>{if(!open)controller.closeDetail();}}><Dialog.Content finalFocus={()=>lastTrigger.current?.isConnected?lastTrigger.current:refresh.current}><Dialog.Title>{labels.detailTitle}</Dialog.Title><Dialog.Body><Stack><div className="xui-feedback-slot" hidden={!state.detailBusy&&!state.detailError}>{state.detailBusy&&<LoadingState>{labels.loading}</LoadingState>}{state.detailError&&<ErrorState title={detailError!} retryLabel={labels.retry} onRetry={state.detailState==='error'?()=>controller.retryDetail():undefined}/>}</div>
      {detail&&<><strong className="xui-strong">{detail.event.summary}</strong><dl className="xui-details">{getBusinessLogFacts(detail.event,labels).map(([label,value],index)=><React.Fragment key={index}><dt>{label}</dt><dd className={index!==5&&index!==7?'xui-code':undefined}>{value}</dd></React.Fragment>)}<dt>{labels.object}</dt><dd>{object?(href?<a href={href}>{object.kind}: {object.id}</a>:<span>{object.kind}: {object.id}</span>):labels.unknown}</dd></dl>{detail.state==='available'?<><h3 className="xui-detail-heading">{labels.payload}</h3><RenderBoundary resetKey={detail} fallback={()=><><Alert tone="error">{labels.rendererError}</Alert><pre className="xui-code" style={jsonStyle}>{JSON.stringify(detail.payload,null,2)}</pre></>}><Payload detail={detail} renderers={renderers}/></RenderBoundary></>:<Alert tone="warning">{detail.state==='expired'?labels.expired:labels.unavailable}</Alert>}</>}
    </Stack></Dialog.Body><Dialog.Footer><Button variant="outline" onClick={()=>controller.closeDetail()}>{labels.close}</Button></Dialog.Footer></Dialog.Content></PeerDialog.Root>
  </section>;
}

export {createBusinessLogViewController} from '@coffeehc/xui-runtime/component-views';
export type {BusinessLogViewController} from '@coffeehc/xui-runtime/component-views';
