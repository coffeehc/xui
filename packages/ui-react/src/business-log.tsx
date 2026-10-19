import {createBusinessLogViewController,type BusinessLogViewController,businessLogFilterDraft} from '@coffeehc/xui-runtime/component-views';
import {resolveBusinessLogLabels,type BusinessLogOptions,type BusinessLogListPresentation,type BusinessLogLabels} from '@coffeehc/xui-runtime/business-log';
import {useOwnedController,useViewRelease,assertControllerProps} from './controller.js';
import {Dialog as PeerDialog} from '@base-ui/react/dialog';
import * as React from 'react';
import {getBusinessLogSnapshot,findBusinessLogRenderer,getBusinessLogFacts,getBusinessLogTable,type BusinessLogController,type BusinessLogDetail,type BusinessLogFilter,type BusinessLogRenderer,type BusinessLogActorKind,type BusinessLogOutcome} from '@coffeehc/xui-runtime/business-log';
import {Button} from './button.js';
import {RefreshAction} from './refresh-action.js';
import {Field,Input,SimpleSelect} from './forms.js';
import {PageHeader,Toolbar,Grid,Stack} from './layout.js';
import {Disclosure} from './navigation.js';
import {DataRegion,LoadingState,ErrorState,EmptyState,Alert,RenderBoundary} from './feedback.js';
import {Table,TableContainer,TableHead,TableBody,TableRow,TableHeaderCell,TableCell} from './table.js';
import {Dialog} from './dialog.js';
import {cx} from './shared.js';
export type {BusinessLogController,BusinessLogEvent,BusinessLogDetail,BusinessLogFilter,BusinessLogLoader,BusinessLogRenderer,BusinessLogLabels,BusinessLogListColumnId,BusinessLogListPresentation,JSONValue} from '@coffeehc/xui-runtime/business-log';
interface BusinessLogExplorerSlots {className?:string;headerActions?:React.ReactNode;renderers?:readonly BusinessLogRenderer<React.ReactNode>[];
 /** Live list-only presentation; updating it does not recreate or query the controller. */
 list?:BusinessLogListPresentation;
 /** Live whole-page labels in every ownership mode. No controller mutation, reset or request. */
 labels?:Partial<BusinessLogLabels>;
}
const jsonStyle={whiteSpace:'pre-wrap',overflowWrap:'anywhere'} as const;
function Payload({detail,renderers}:{detail:Readonly<BusinessLogDetail>;renderers:readonly BusinessLogRenderer<React.ReactNode>[]}){const renderer=findBusinessLogRenderer(renderers,detail);return renderer?renderer.render(detail):<pre className="xui-code" style={jsonStyle}>{JSON.stringify(detail.payload,null,2)}</pre>;}
export type BusinessLogExplorerProps=BusinessLogExplorerSlots&({viewController:BusinessLogViewController;controller?:never;options?:never;pagination?:never}|{viewController?:undefined;controller:BusinessLogController;options?:never}|{viewController?:undefined;controller?:undefined;options:BusinessLogOptions});
/** Read-only log presentation; the host owns loader, permissions and event reliability. */
export function BusinessLogExplorer({viewController:injected,controller:borrowed,options:initialOptions,className,headerActions,renderers=[],list,labels:labelOverrides}:BusinessLogExplorerProps){
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
  const valueColumns=table.columnIds.filter(column=>column!=='detail');
  useViewRelease(controller,()=>{controller.closeDetail();controller.cancel();});
  const input=(key:Exclude<keyof typeof draft,'actorKind'|'result'>,label:string)=><Field key={key} label={label}><Input value={draft[key]} autoComplete="off" onChange={event=>setDraft({...draft,[key]:event.target.value})}/></Field>;
  const select=(key:'actorKind'|'result',label:string,values:readonly string[])=><Field label={label}><SimpleSelect value={draft[key]} onChange={event=>setDraft({...draft,[key]:event.target.value})}>{values.map(value=><option key={value} value={value}>{value?labels[value as BusinessLogActorKind|BusinessLogOutcome]:labels.all}</option>)}</SimpleSelect></Field>;
  const apply=()=>controller.setFilter({since:draft.since||null,until:draft.until||null,actor:draft.actorId?{kind:draft.actorKind as BusinessLogActorKind,id:draft.actorId}:null,object:draft.objectKind||draft.objectId?{kind:draft.objectKind,id:draft.objectId}:null,event_type:draft.event_type||null,action:draft.action||null,result:draft.result as BusinessLogOutcome||null,correlation_id:draft.correlation_id||null,request_id:draft.request_id||null});
  const object=detail?.event.object,href=object?controller.resolveObject(object):null;
  return <section className={cx('xui-stack',className)}><PageHeader title={labels.title} actions={<><RefreshAction ref={refresh} disabled={state.busy} busy={state.busy} onClick={()=>controller.refresh()}>{labels.refresh}</RefreshAction><Button disabled={!state.busy} variant="outline" onClick={()=>controller.cancel()}>{labels.cancel}</Button>{headerActions}</>}/>
    <Disclosure title={labels.filters} controller={viewController.filters}><form className="xui-stack" noValidate onSubmit={event=>{event.preventDefault();void apply();}}><Grid>{input('since',labels.since)}{input('until',labels.until)}{select('actorKind',labels.actorKind,['user','agent','service'])}{input('actorId',labels.actorId)}{input('objectKind',labels.objectKind)}{input('objectId',labels.objectId)}{input('event_type',labels.eventType)}{input('action',labels.action)}{select('result',labels.result,['','succeeded','failed','denied','unknown'])}{input('correlation_id',labels.correlationId)}{input('request_id',labels.requestId)}</Grid><Toolbar><Button type="submit">{labels.apply}</Button><Button variant="outline" onClick={()=>{setDraft(toDraft({}));void controller.setFilter({});}}>{labels.clear}</Button></Toolbar>{state.filterError&&<Alert tone="error">{state.filterErrorKey?labels[state.filterErrorKey]:state.filterError}</Alert>}</form></Disclosure>
    <DataRegion busy={state.busy} aria-label={labels.title} feedback={!state.data&&state.busy||state.error?<>{!state.data&&state.busy&&<LoadingState>{labels.loading}</LoadingState>}{state.error&&<ErrorState title={error!} onRetry={()=>controller.retry()} retryLabel={labels.retry}/>}</>:undefined}>
      {state.data&&<>{table.rows.length?<TableContainer className="xui-business-log-table" aria-label={labels.title}><Table className="xui-record-table" aria-label={labels.title}><TableHead><TableRow>{table.columnIds.map((column,index)=><TableHeaderCell key={column}>{table.headers[index]}</TableHeaderCell>)}</TableRow></TableHead><TableBody>{table.rows.map(row=><TableRow key={row.id}>{table.columnIds.map(column=><TableCell key={column} className={column==='summary'?'xui-table-primary':['action','occurredAt'].includes(column)?'xui-code xui-table-value':column==='detail'?undefined:'xui-table-label'}>{column==='detail'?<Button variant="ghost" size="xs" aria-label={`${labels.detail} ${row.id}`} onClick={event=>{lastTrigger.current=event.currentTarget;void controller.openDetail(row.id);}}>{labels.detail}</Button>:row.cells[valueColumns.indexOf(column)]}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer>:<EmptyState title={labels.empty}/>}<Toolbar><Button variant="outline" disabled={state.busy||!state.canPrevious||!!state.error||!!state.filterError} onClick={()=>controller.previous()}>{labels.previous}</Button><span data-business-log-page>{labels.page} {state.pageIndex+1}</span><Button variant="outline" disabled={state.busy||!state.canNext||!!state.error||!!state.filterError} onClick={()=>controller.next()}>{labels.next}</Button>{getBusinessLogSnapshot(state.data)!==null&&<span className="xui-code" data-business-log-snapshot>{labels.snapshot}: {getBusinessLogSnapshot(state.data)}</span>}</Toolbar></>}
    </DataRegion>
    <PeerDialog.Root open={state.detailOpen} onOpenChange={open=>{if(!open)controller.closeDetail();}}><Dialog.Content finalFocus={()=>lastTrigger.current?.isConnected?lastTrigger.current:refresh.current}><Dialog.Title>{labels.detailTitle}</Dialog.Title><Dialog.Body><Stack><div className="xui-feedback-slot" hidden={!state.detailBusy&&!state.detailError}>{state.detailBusy&&<LoadingState>{labels.loading}</LoadingState>}{state.detailError&&<ErrorState title={detailError!} retryLabel={labels.retry} onRetry={state.detailState==='error'?()=>controller.retryDetail():undefined}/>}</div>
      {detail&&<><strong className="xui-strong">{detail.event.summary}</strong><dl className="xui-details">{getBusinessLogFacts(detail.event,labels).map(([label,value],index)=><React.Fragment key={index}><dt>{label}</dt><dd className={index!==5&&index!==7?'xui-code':undefined}>{value}</dd></React.Fragment>)}<dt>{labels.object}</dt><dd>{object?(href?<a href={href}>{object.kind}: {object.id}</a>:<span>{object.kind}: {object.id}</span>):labels.unknown}</dd></dl>{detail.state==='available'?<><h3 className="xui-detail-heading">{labels.payload}</h3><RenderBoundary resetKey={detail} fallback={()=><><Alert tone="error">{labels.rendererError}</Alert><pre className="xui-code" style={jsonStyle}>{JSON.stringify(detail.payload,null,2)}</pre></>}><Payload detail={detail} renderers={renderers}/></RenderBoundary></>:<Alert tone="warning">{detail.state==='expired'?labels.expired:labels.unavailable}</Alert>}</>}
    </Stack></Dialog.Body><Dialog.Footer><Button variant="outline" onClick={()=>controller.closeDetail()}>{labels.close}</Button></Dialog.Footer></Dialog.Content></PeerDialog.Root>
  </section>;
}

export {createBusinessLogViewController} from '@coffeehc/xui-runtime/component-views';
export type {BusinessLogViewController} from '@coffeehc/xui-runtime/component-views';
