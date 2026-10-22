import {createStructuredLogViewController,type StructuredLogViewController} from '@coffeehc/xui-runtime/component-views';
import type {StructuredLogOptions} from '@coffeehc/xui-runtime/structured-log';
import {useOwnedController,useViewRelease,assertControllerProps} from './controller.js';
import {getClipboardService} from '@coffeehc/xui-runtime/clipboard';
import {Dialog as PeerDialog} from '@base-ui/react/dialog';
import * as React from 'react';
import {getStructuredLogTable,structuredLogDefaultLabels,logSeverities,logNatures,type StructuredLogController,type StructuredLogFilter,type LogRef} from '@coffeehc/xui-runtime/structured-log';
import {Button} from './button.js';
import {RefreshAction} from './refresh-action.js';
import {Field,Input,SimpleSelect} from './forms.js';
import {PageHeader,Toolbar,FormGrid,Stack} from './layout.js';
import {QueryForm,QueryField} from './search-toolbar.js';
import {LoadingState,ErrorState,EmptyState,Alert} from './feedback.js';
import {DataTable,type DataTableColumn,type DataTableColumnSizingProps} from './data-table.js';
import {Dialog} from './dialog.js';
import {cx,hasContent} from './shared.js';
export type {StructuredLogController,StructuredLogOptions,StructuredLogAdapter,GroupedStructuredLogAdapter,StructuredLogFilter,LogRecord,LogRecordDetail,LogGroup,LogGroupsPage,LogRecordsPage} from '@coffeehc/xui-runtime/structured-log';
/** Stable semantic tracks shared by group and record views; actions never expose a resize handle. */
export type StructuredLogExplorerColumnId=ReturnType<typeof getStructuredLogTable>['columnIds'][number];
export interface StructuredLogExplorerSlots {
  className?:string;
  headerActions?:React.ReactNode;
  /** Additional page-level tools beside view/group controls, outside the query form. Does not replace built-in filters or own requests. */
  pageToolbar?:React.ReactNode;
  /** Local/controlled/injected DataTable sizing; enabled by default without owning queries. */
  columnSizing?:DataTableColumnSizingProps;
  /** Optional initial widths and resize bounds by semantic column id. Actions always remain fixed. */
  columnOptions?:Partial<Record<Exclude<StructuredLogExplorerColumnId,'actions'>,Pick<DataTableColumn<never>,'width'|'resize'>>>&{actions?:{width?:DataTableColumn<never>['width'];resize?:false}};
  writeClipboard?:(value:string)=>Promise<void>;
}
export type StructuredLogExplorerProps=StructuredLogExplorerSlots&({viewController:StructuredLogViewController;controller?:never;options?:never;pagination?:never}|{viewController?:undefined;controller:StructuredLogController;options?:never}|{viewController?:undefined;controller?:undefined;options:StructuredLogOptions});
export function StructuredLogExplorer({viewController:injected,controller:borrowed,options:initialOptions,className,headerActions,pageToolbar,writeClipboard,columnSizing={},columnOptions}:StructuredLogExplorerProps){
  assertControllerProps(injected,{controller:borrowed,options:initialOptions},['controller','options']);
  if(borrowed&&initialOptions)throw new TypeError('controller cannot be combined with options');
  const viewController=useOwnedController(injected,()=>createStructuredLogViewController(borrowed?{service:borrowed}:{options:initialOptions!}),borrowed);
  const controller=viewController.service,viewState=React.useSyncExternalStore(viewController.subscribe,viewController.getState,viewController.getState);
  React.useEffect(()=>viewController.start(),[viewController]);
  const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),{options,labels}=controller;
  const draft=viewState.draft,setDraft=viewController.setDraft;
  const setSubject=(key:'kind'|'id',value:string)=>{const subject={kind:draft.subject?.kind??'',id:draft.subject?.id??'',[key]:value};setDraft({...draft,subject:subject.kind||subject.id?subject:null});};
  const lastTrigger=React.useRef<HTMLElement|null>(null),refresh=React.useRef<HTMLButtonElement>(null),table=getStructuredLogTable(state,labels),detail=state.detail;
  const columns:readonly DataTableColumn<typeof table.rows[number]>[]=table.columnIds.map((id,index)=>({
    id,header:table.headers[index],...columnOptions?.[id],width:columnOptions?.[id]?.width??(id==='actions'?'var(--layout-field-min)':undefined),resize:id==='actions'?false:columnOptions?.[id]?.resize,
    cellClassName:id==='summary'?'xui-table-primary':['entry_count','matched_entry_count','last_seen_at','occurred_at'].includes(id)?'xui-code xui-table-value':id==='actions'?undefined:'xui-table-label',
    cell:row=>id==='actions'?<Button variant="text" size="xs" aria-label={`${table.action} ${row.id}`} onClick={event=>{lastTrigger.current=event.currentTarget;void(state.view==='groups'?controller.showGroup(row.id):controller.openRecord(row.id));}}>{table.action}</Button>:row.cells[index],
  }));
  const copyAbort=React.useRef(new Map<StructuredLogController,AbortController>());
  const copyText=(value:string)=>{copyAbort.current.get(controller)?.abort();const operation=new AbortController();copyAbort.current.set(controller,operation);return getClipboardService().writeText(value,{signal:operation.signal});};
  React.useLayoutEffect(()=>controller.subscribe(()=>{if(!controller.getState().detailOpen)copyAbort.current.get(controller)?.abort();}),[controller]);
  useViewRelease(controller,()=>{copyAbort.current.get(controller)?.abort();copyAbort.current.delete(controller);controller.closeDetail();controller.cancel();});
  const scalar=(key:'text'|'since'|'until'|'component'|'code',label:string,primary=false)=>{
    const control=<Input autoComplete="off" value={draft[key]??''} placeholder={key==='since'||key==='until'?'2026-10-11T00:00:00Z':undefined} onChange={event=>setDraft({...draft,[key]:event.target.value||null})}/>;
    return primary?<QueryField key={key} label={label} width="primary">{control}</QueryField>:<Field key={key} label={label}>{control}</Field>;
  };
  const multiple=(key:'sources'|'natures'|'categories'|'severities',label:string,values:readonly string[],primary=false)=>{
    const control=<SimpleSelect multiple value={[...(draft[key]??[])]} onChange={event=>setDraft({...draft,[key]:Array.from(event.target.selectedOptions).map(option=>option.value)})}>{values.map(value=><option key={value} value={value}>{value}</option>)}</SimpleSelect>;
    return primary?<QueryField key={key} label={label} width="compact">{control}</QueryField>:<Field key={key} label={label}>{control}</Field>;
  };
  // The service filter is the submitted scope. Never describe unsubmitted draft values as the visible result's scope.
  const applied=Object.entries(state.filter).flatMap(([key,value])=>{
    if(value===null||value===undefined||Array.isArray(value)&&!value.length)return [];
    const names={text:labels.text,since:labels.since,until:labels.until,sources:labels.source,natures:labels.nature,categories:labels.category,severities:labels.severity,component:labels.component,code:labels.code,subject:labels.subject};
    return [`${names[key as keyof typeof names]}: ${Array.isArray(value)?value.join(', '):typeof value==='object'&&'kind' in value?`${value.kind}: ${value.id}`:value}`];
  });
  const reference=(value:Readonly<LogRef>)=>{const href=controller.resolveReference(value);return href?<a href={href}>{value.kind}: {value.id}</a>:<span>{value.kind}: {value.id}</span>;};
  const tri=(value:boolean|null)=>value===null?labels.unknown:value?labels.yes:labels.no;
  const identifier=(value:string|null,label:string)=>value===null?labels.unknown:<Toolbar><span className="xui-code">{value}</span><Button variant="ghost" size="xs" aria-label={`${labels.copy} ${label}`} onClick={()=>controller.copyIdentifier(value,writeClipboard??copyText)}>{labels.copy}</Button></Toolbar>;
  return <section className={cx('xui-stack',className)}><PageHeader title={labels.title} actions={<><RefreshAction ref={refresh} disabled={state.busy} busy={state.busy} onClick={()=>controller.refresh()}>{labels.refresh}</RefreshAction><Button disabled={!state.busy} variant="outline" onClick={()=>controller.cancel()}>{labels.cancel}</Button>{headerActions}</>} meta={state.view==='groups'&&state.data&&'matched_groups' in state.data?<p className="xui-text" data-log-counts>{labels.matchedGroups}: {state.data.matched_groups} · {labels.matchedCount}: {state.data.matched_entries}</p>:undefined}/>
    {(options.adapter.records||state.groupId||hasContent(pageToolbar))&&<Toolbar>{options.adapter.records&&<Field label={labels.groups+' / '+labels.records} style={{flex:'none',inlineSize:'var(--query-field-compact)',minInlineSize:0,maxInlineSize:'100%'}}><SimpleSelect value={state.view} onChange={event=>controller.setView(event.target.value as 'groups'|'records')}><option value="groups">{labels.groups}</option><option value="records">{labels.records}</option></SimpleSelect></Field>}{state.groupId&&<><span>{labels.groupRecords}: {state.groupId}</span><Button variant="outline" onClick={()=>controller.setView(options.adapter.records?'records':'groups')}>{options.adapter.records?labels.allRecords:labels.groups}</Button></>}{pageToolbar}</Toolbar>}
    <QueryForm label={labels.filters} noValidate
      onSubmit={event=>{event.preventDefault();void controller.setFilter(viewController.getState().draft);}}
      onReset={event=>{event.preventDefault();viewController.setDraft(controller.getState().filter);}}
      fields={<>{scalar('text',labels.text,true)}{multiple('severities',labels.severity,logSeverities,true)}</>}
      actions={<><Button type="submit">{labels.apply}</Button><Button type="reset" variant="outline">{labels.resetDraft??structuredLogDefaultLabels.resetDraft}</Button><Button variant="text" onClick={()=>{void controller.setFilter({});}}>{labels.clear}</Button></>}
      advancedLabel={labels.filters} disclosure={{controller:viewController.filters}}
      advanced={<FormGrid>{scalar('since',labels.since)}{scalar('until',labels.until)}{multiple('sources',labels.source,options.sources??[])}{multiple('natures',labels.nature,logNatures)}{multiple('categories',labels.category,options.categories??[])}{scalar('component',labels.component)}{scalar('code',labels.code)}
        <Field label={labels.subjectKind}><Input value={draft.subject?.kind??''} onChange={event=>setSubject('kind',event.target.value)}/></Field><Field label={labels.subjectId}><Input value={draft.subject?.id??''} onChange={event=>setSubject('id',event.target.value)}/></Field></FormGrid>}
      summary={<>{applied.length>0&&<span data-log-applied>{labels.appliedFilters??structuredLogDefaultLabels.appliedFilters}: {applied.join(' · ')}</span>}{state.error===labels.invalidFilter&&<Alert tone="error">{state.error}</Alert>}</>}/>
    <DataTable className="xui-record-table" label={state.groupId?labels.groupRecords:state.view==='groups'?labels.groups:labels.records} layout="document" rows={table.rows} columns={columns} rowKey={row=>row.id} columnSizing={columnSizing}
      status={state.busy?(state.data?'refreshing':'loading'):state.error&&state.error!==labels.invalidFilter?'error':state.data?'ready':'idle'} hasValue={state.data!==null}
      labels={{loading:labels.loading,refreshing:labels.loading,idle:labels.loading,empty:labels.empty,retry:labels.retry,count:()=>''}}
      emptyState={<EmptyState title={labels.empty} align="center"/>} errorState={<ErrorState title={state.error??labels.empty} retryLabel={labels.retry} onRetry={()=>controller.retry()}/>}
      footer={state.data?<Toolbar><Button variant="outline" disabled={state.busy||!state.canPrevious||!!state.error} onClick={()=>controller.previous()}>{labels.previous}</Button><span data-log-page>{labels.page} {state.pageIndex+1}</span><Button variant="outline" disabled={state.busy||!state.canNext||!!state.error} onClick={()=>controller.next()}>{labels.next}</Button><span className="xui-code" data-log-snapshot>{labels.asOf}: {state.data.page.as_of}</span></Toolbar>:undefined}/>
    <PeerDialog.Root open={state.detailOpen} onOpenChange={open=>{if(!open)controller.closeDetail();}}><Dialog.Content finalFocus={()=>lastTrigger.current?.isConnected?lastTrigger.current:refresh.current}><Dialog.Title>{labels.detailTitle}</Dialog.Title><Dialog.Body><Stack><div className="xui-feedback-slot" hidden={!state.detailBusy&&!state.detailError}>{state.detailBusy&&<LoadingState>{labels.loading}</LoadingState>}{state.detailError&&<ErrorState title={state.detailError} onRetry={state.detailState==='error'?()=>controller.retryDetail():undefined} retryLabel={labels.retry}/>}</div>
      {detail&&<><strong className="xui-strong">{detail.facts.summary}</strong>{state.detailState==='expired'&&<Alert tone="warning">{labels.expired}</Alert>}<dl className="xui-details">{[[labels.recordId,detail.id],[labels.groupId,detail.group_id],[labels.occurredAt,detail.occurred_at??labels.unknown],[labels.recordedAt,detail.recorded_at??labels.unknown],[labels.operation,detail.facts.operation||'—'],[labels.retryable,tri(detail.facts.retryable)],[labels.userFixable,tri(detail.facts.user_fixable)]].map(([label,value],index)=><React.Fragment key={label}><dt>{label}</dt><dd className={index<5?'xui-code':undefined}>{value}</dd></React.Fragment>)}<dt>{labels.source}</dt><dd>{detail.facts.source}</dd><dt>{labels.severity}</dt><dd>{detail.facts.severity}</dd><dt>{labels.nature}</dt><dd>{detail.facts.nature}</dd><dt>{labels.category}</dt><dd>{detail.facts.category||'—'}</dd><dt>{labels.component}</dt><dd>{detail.facts.component||'—'}</dd><dt>{labels.code}</dt><dd className="xui-code">{detail.facts.code||'—'}</dd><dt>{labels.requestId}</dt><dd>{identifier(detail.facts.request_id,labels.requestId)}</dd><dt>{labels.traceId}</dt><dd>{identifier(detail.facts.trace_id,labels.traceId)}</dd><dt>{labels.subject}</dt><dd>{detail.facts.subject?reference(detail.facts.subject):labels.unknown}</dd><dt>{labels.related}</dt><dd>{detail.related.map((value,index)=><div key={index}>{reference(value)}</div>)}</dd></dl>
      {detail.details_retained&&<><h3 className="xui-detail-heading">{labels.detail}</h3><pre className="xui-code" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{detail.detail??labels.unknown}</pre><h3 className="xui-detail-heading">{labels.stack}</h3><pre className="xui-code" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{detail.stack??labels.unknown}</pre></>}<h3 className="xui-detail-heading">{labels.attributes}</h3><dl className="xui-details">{Object.entries(detail.attributes).map(([key,value])=><React.Fragment key={key}><dt>{key}</dt><dd>{value}</dd></React.Fragment>)}</dl>{state.copyStatus!=='idle'&&<Alert tone={state.copyStatus==='error'?'error':'success'}>{state.copyStatus==='error'?labels.copyError:labels.copied}</Alert>}</>}
    </Stack></Dialog.Body><Dialog.Footer><Button variant="outline" onClick={()=>controller.closeDetail()}>{labels.close}</Button></Dialog.Footer></Dialog.Content></PeerDialog.Root>
  </section>;
}

export {createStructuredLogViewController} from '@coffeehc/xui-runtime/component-views';
export type {StructuredLogViewController} from '@coffeehc/xui-runtime/component-views';
