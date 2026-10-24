import {createApiKeyManagerViewController,type ApiKeyManagerViewController} from '@coffeehc/xui-runtime/component-views';
import type {ApiKeyManagerOptions} from '@coffeehc/xui-runtime/api-key';
import {useOwnedController,useViewRelease,assertControllerProps} from './controller.js';
import {getClipboardService} from '@coffeehc/xui-runtime/clipboard';
import {Dialog as PeerDialog} from '@base-ui/react/dialog';
import * as React from 'react';
import {dataTableDefaultLabels} from '@coffeehc/xui-runtime/data-table';
import type {ApiKeyMetadata,ApiKeyManagerController} from '@coffeehc/xui-runtime/api-key';
import {Button} from './button.js';
import {ApiKeyCell,type ApiKeyCellCopyOptions} from './api-key-cell.js';
export type {ApiKeyCellCopyOptions} from './api-key-cell.js';
import {Toast,type ToastController} from './toast.js';
import {Popover} from './popover.js';
import {RefreshAction} from './refresh-action.js';
import {Field,Input,Textarea,SimpleSelect,Fieldset,Checkbox} from './forms.js';
import {PageHeader,Stack} from './layout.js';
import {ErrorState,EmptyState,Alert,Badge} from './feedback.js';
import {TableActions} from './table.js';
import {DataTable,type DataTableColumn,type DataTableLabels,type DataTableColumnSizingProps} from './data-table.js';
import {Dialog} from './dialog.js';
import {cx} from './shared.js';
import {useCopyFeedback} from './copy-feedback.js';
export type {ApiKeyMetadata,ApiKeyManagerController,ApiKeyManagerOptions,ApiKeyAdapter,ApiKeyDraft,CreatedApiKey,ApiKeyWriteContext,ApiKeyUpdateDraft} from '@coffeehc/xui-runtime/api-key';
/** Client pagination over the complete metadata collection returned by adapter.list. */
export type {ApiKeyManagerPagination} from '@coffeehc/xui-runtime/component-views';
import type {ApiKeyManagerPagination} from '@coffeehc/xui-runtime/component-views';
interface ApiKeyManagerSlots {
 /** Omit/false for passive masked values; provide the authenticated reader to enable cell copy. */
 keyCopy?:ApiKeyCellCopyOptions|false;
 toastController?:ToastController;
 locale?:string;timeZone?:string;rowActions?:(key:Readonly<ApiKeyMetadata>)=>React.ReactNode;className?:string;headerActions?:React.ReactNode;writeClipboard?:(value:string)=>Promise<void>;
 /** DataTable owns widths; data columns resize by default and actions stay fixed. */
 columnSizing?:DataTableColumnSizingProps;
 /** Defaults to 10 rows with 10/25/50 choices. false displays the complete loaded collection. */

 /** Public DataTable footer/count and status labels; never server pagination facts. */
 tableLabels?:Partial<DataTableLabels>;
}
export type ApiKeyManagerProps=ApiKeyManagerSlots&({viewController:ApiKeyManagerViewController;controller?:never;options?:never;pagination?:never}|{viewController?:undefined;controller:ApiKeyManagerController;options?:never;pagination?:ApiKeyManagerPagination|false}|{viewController?:undefined;controller?:undefined;options:ApiKeyManagerOptions;pagination?:ApiKeyManagerPagination|false});
function KeyTimestamp({value,unknown,locale,timeZone}:{value:string|null;unknown:string;locale?:string;timeZone?:string}){
 if(value===null)return <span className="xui-table-label">{unknown}</span>;
 const date=new Date(value);let text=value;
 if(Number.isFinite(date.getTime()))text=new Intl.DateTimeFormat(locale??(typeof document==='undefined'?undefined:document.documentElement.lang||undefined),{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date);
 return <Popover.Root><Popover.Trigger render={<Button variant="text" size="xs"/>}><time dateTime={value}>{text}</time></Popover.Trigger><Popover.Content><span className="xui-code">{value}</span></Popover.Content></Popover.Root>;
}
/** The caller owns the controller and backend. Unmount releases the transient result. */
export function ApiKeyManager(props:ApiKeyManagerProps){const content=<ApiKeyManagerContent {...props}/>;return props.toastController?<Toast.Provider controller={props.toastController}>{content}</Toast.Provider>:<Toast.Provider>{content}<Toast.View/></Toast.Provider>;}
function ApiKeyManagerContent({viewController:injected,controller:borrowed,options:initialOptions,className,headerActions,writeClipboard,pagination,tableLabels,columnSizing={},locale,timeZone,rowActions,keyCopy}:ApiKeyManagerProps){
  assertControllerProps(injected,{controller:borrowed,options:initialOptions,pagination},['controller','options','pagination']);
  if(borrowed&&initialOptions)throw new TypeError('controller cannot be combined with options');
  const viewController=useOwnedController(injected,()=>createApiKeyManagerViewController(borrowed?{service:borrowed,pagination}:{options:initialOptions!,pagination}),borrowed);
  const controller=viewController.service,viewState=React.useSyncExternalStore(viewController.subscribe,viewController.getState,viewController.getState);
  const activeOwner=React.useRef(controller);activeOwner.current=controller;
  React.useEffect(()=>viewController.start(),[viewController]);
  const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),{options,labels}=controller;
  useCopyFeedback(controller,state=>state.phase==='result',labels);
  const formId=React.useId(),nameRef=React.useRef<HTMLInputElement>(null),secretRef=React.useRef<HTMLTextAreaElement>(null),createRef=React.useRef<HTMLButtonElement>(null),refreshRef=React.useRef<HTMLButtonElement>(null),confirmationRef=React.useRef<HTMLInputElement>(null),dialogRef=React.useRef<HTMLDivElement>(null),lastTrigger=React.useRef<HTMLElement|null>(null);
  const copyAbort=React.useRef(new Map<ApiKeyManagerController,AbortController>());
  const copyText=(value:string)=>{copyAbort.current.get(controller)?.abort();const operation=new AbortController();copyAbort.current.set(controller,operation);return getClipboardService().writeText(value,{signal:operation.signal});};
  const clearSecret=React.useCallback(()=>{const node=secretRef.current;if(node){node.value='';node.defaultValue='';node.textContent='';}},[]);
  const attachSecret=React.useCallback((node:HTMLTextAreaElement|null)=>{if(secretRef.current!==node)clearSecret();secretRef.current=node;if(node&&controller.getState().phase==='result')node.value=controller.readSecret()??'';},[clearSecret,controller]);
  React.useLayoutEffect(()=>controller.subscribe(()=>{if(controller.getState().phase!=='result'){copyAbort.current.get(controller)?.abort();clearSecret();}}),[controller,clearSecret]);
  useViewRelease(controller,()=>{copyAbort.current.get(controller)?.abort();copyAbort.current.delete(controller);if(activeOwner.current===controller)clearSecret();controller.close();});
  React.useLayoutEffect(()=>{if(state.phase==='result')secretRef.current?.focus();},[state.phase]);
  const finalFocus=()=>{
    const dialog=dialogRef.current,doc=dialog?.ownerDocument,active=doc?.activeElement;
    // A host may deliberately move focus while closing. Only restore from our
    // own dialog, its trigger or the document body.
    if(active&&active!==doc?.body&&active!==lastTrigger.current&&!dialog?.contains(active))return false;
    const target=lastTrigger.current;return target?.isConnected&&!target.matches(':disabled,[aria-disabled="true"]')?target:refreshRef.current;
  };
  const submit=async()=>{await (state.phase==='update'?controller.submitUpdate():controller.submitCreate());if(['create','update'].includes(controller.getState().phase)&&Object.values(controller.getState().fieldErrors).some(Boolean))(controller.getState().fieldErrors.confirmation&&!controller.getState().fieldErrors.name?confirmationRef:nameRef).current?.focus();};
  const editing=state.phase==='update',draft=editing?state.updateDraft:state.draft,setDraft=editing?controller.setUpdateDraft:controller.setDraft;
  const {pageSize,pageIndex,pageSizeOptions:pageSizes}=viewState;
  React.useLayoutEffect(()=>{if(!injected)viewController.updatePagination(pagination);},[viewController,injected,pagination]);
  const visibleRows=!viewState.pagination?state.rows:state.rows.slice(pageIndex*pageSize,(pageIndex+1)*pageSize);
  const columns:readonly DataTableColumn<Readonly<ApiKeyMetadata>>[]=React.useMemo(()=>[
    {id:'name',header:labels.name,width:'var(--layout-field-min)',cell:key=><div className="xui-table-primary">{key.name}</div>},
    {id:'prefix',header:labels.prefix,width:'var(--query-field-compact)',cell:key=><ApiKeyCell record={key} owner={controller} copy={keyCopy} disabled={state.actionBusy||state.listBusy} labels={labels}/>},
    {id:'status',header:labels.status,width:'var(--api-key-status-inline-size)',cell:key=><Badge className="xui-table-label" tone={key.status==='active'?'success':key.status==='expired'?'warning':'neutral'}>{key.status===null?labels.unknown:labels[key.status]}</Badge>},
    {id:'permissions',header:labels.permissions,width:'var(--query-field-min)',cell:key=>key.permissionIds.length?key.permissionIds.map(id=>options.permissions.find(item=>item.id===id)?.label??id).join(', '):'—'},
    {id:'createdAt',header:labels.createdAt,width:'var(--query-field-min)',cell:key=><KeyTimestamp value={key.createdAt} unknown={labels.unknown} locale={locale} timeZone={timeZone}/>},
    {id:'expiresAt',header:labels.expiry,width:'var(--query-field-min)',cell:key=><KeyTimestamp value={key.expiresAt} unknown={labels.unknown} locale={locale} timeZone={timeZone}/>},
    {id:'lastUsedAt',header:labels.lastUsedAt,width:'var(--query-field-min)',cell:key=><><KeyTimestamp value={key.lastUsedAt} unknown={labels.unknown} locale={locale} timeZone={timeZone}/>{key.lastUsedAtPending===true&&<> <Badge>{labels.lastUsedAtPending}</Badge></>}</>},
    {id:'actions',header:labels.actions,resize:false,width:'var(--query-field-compact)',cell:key=><TableActions>{rowActions?.(key)}{options.adapter.update&&key.status!=='revoked'&&<Button variant="text" size="xs" disabled={!controller.canUpdate(key)} aria-label={`${labels.edit} ${key.name}`} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openUpdate(key.id);}}>{labels.edit}</Button>}{key.status!=='revoked'&&<Button variant="text" tone="danger" size="xs" disabled={!controller.canRevoke(key)} aria-label={`${labels.revoke} ${key.name}`} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openRevoke(key.id);}}>{labels.revoke}</Button>}{controller.canDeleteRecord(key)&&<Button variant="text" tone="danger" size="xs" aria-label={`${labels.deleteRecord} ${key.name}`} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openDeleteRecord(key.id);}}>{labels.deleteRecord}</Button>}</TableActions>},
  ],[controller,options,labels,locale,timeZone,rowActions,keyCopy,state.actionBusy,state.listBusy]);
  return <section className={cx('xui-stack',className)}>
    <PageHeader title={labels.title} actions={<><RefreshAction ref={refreshRef} variant="outline" disabled={state.listBusy} busy={state.listBusy} onClick={()=>controller.refresh()}>{labels.refresh}</RefreshAction><Button ref={createRef} disabled={state.actionBusy} hidden={options.canCreate!==true} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openCreate();}}>{labels.create}</Button>{headerActions}</>}/>
    <DataTable className="xui-record-table" columnSizing={columnSizing} rows={visibleRows} columns={columns} rowKey={key=>key.id} label={labels.title} status={state.listBusy?(state.hasLoaded?'refreshing':'loading'):state.listError?'error':state.hasLoaded?'ready':'idle'} disabled={state.actionBusy} hasValue={state.hasLoaded}
      pagination={!viewState.pagination||!state.hasLoaded?undefined:{pageIndex,pageIndexOffset:0,pageSize,total:state.rows.length,pageSizeOptions:pageSizes,onPageChange:viewController.setPage,onPageSizeChange:viewController.setPageSize}}
      labels={{empty:labels.empty,idle:labels.loading,loading:labels.loading,refreshing:labels.loading,error:labels.listError,retry:labels.retry,...tableLabels,count:facts=>state.hasLoaded?(tableLabels?.count??dataTableDefaultLabels.count)(facts):''}}
      emptyState={<EmptyState title={labels.empty}/>} errorState={<ErrorState title={state.listError??labels.listError} retryLabel={labels.retry} onRetry={()=>controller.refresh()}/>}/>
    <PeerDialog.Root open={state.phase!=='closed'} onOpenChange={open=>{if(!open)controller.close();}}>
      <Dialog.Content ref={dialogRef} finalFocus={finalFocus}>
        <Dialog.Title>{editing?labels.updateTitle:state.phase==='result'?labels.resultTitle:state.phase==='delete'?labels.deleteTitle:state.phase==='revoke'?labels.revokeTitle:labels.createTitle}</Dialog.Title>
        <Dialog.Body className="xui-stack">
        {state.phase==='result'&&<Dialog.Description>{labels.oneTime}</Dialog.Description>}{state.phase==='revoke'&&<Dialog.Description>{labels.revokeWarning}</Dialog.Description>}{state.phase==='delete'&&<Dialog.Description>{labels.deleteWarning}</Dialog.Description>}
        {editing&&<Dialog.Description>{labels.updateWarning}</Dialog.Description>}
          {(state.phase==='create'||editing)&&<form id={formId} noValidate className="xui-stack" onSubmit={event=>{event.preventDefault();void submit();}}>
            <Field label={labels.name} required error={state.fieldErrors.name}><Input ref={nameRef} autoFocus autoComplete="off" value={draft.name} disabled={state.actionBusy} onChange={event=>setDraft({name:event.target.value})}/></Field>
            <Fieldset legend={labels.permissions} error={state.fieldErrors.permissions} disabled={state.actionBusy}>{options.permissions.map(item=><Checkbox key={item.id} label={item.label} title={item.description} checked={draft.permissionIds.includes(item.id)} disabled={item.disabled||item.required} onChange={event=>setDraft({permissionIds:event.target.checked?[...draft.permissionIds,item.id]:draft.permissionIds.filter(id=>id!==item.id)})}/>)}</Fieldset>
            {!editing&&options.confirmationLabel&&<Fieldset legend={labels.confirmation} error={state.fieldErrors.confirmation}><Checkbox ref={confirmationRef} label={options.confirmationLabel} required disabled={state.actionBusy} checked={state.draft.confirmed===true} onChange={event=>controller.setDraft({confirmed:event.target.checked})}/></Fieldset>}
            {!editing&&<Field label={labels.expiry} error={state.fieldErrors.expiry}><SimpleSelect value={state.draft.expiryId} disabled={state.actionBusy} onChange={event=>controller.setDraft({expiryId:event.target.value})}>{options.expiryOptions.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</SimpleSelect></Field>}
            {editing&&<Checkbox label={labels.enabled} checked={state.updateDraft.enabled} disabled={state.actionBusy} onChange={event=>controller.setUpdateDraft({enabled:event.target.checked})}/>}
          </form>}
          {state.phase==='result'&&<Field label={labels.secret}><Textarea className="xui-code" style={{fontFamily:'var(--font-mono)',fontVariantNumeric:'tabular-nums'}} ref={attachSecret} readOnly autoComplete="off" spellCheck={false} value={controller.readSecret()??''}/></Field>}
          {(state.phase==='revoke'||state.phase==='delete')&&state.revokeTarget&&<dl className="xui-details"><dt>{labels.name}</dt><dd>{state.revokeTarget.name}</dd><dt>{labels.prefix}</dt><dd className="xui-code">{state.revokeTarget.prefix===null?labels.unknown:`${state.revokeTarget.prefix}…`}</dd></dl>}
          <div className="xui-feedback-slot" hidden={!state.actionBusy&&!state.actionError}>
          {state.actionBusy&&<Alert tone="warning">{editing?labels.updatePending:state.phase==='create'?labels.creationPending:state.phase==='delete'?labels.deletePending:labels.revokePending}</Alert>}{state.actionError&&<Alert tone="error">{state.actionError}</Alert>}</div>
        </Dialog.Body>
        <Dialog.Footer>
          {state.phase!=='closed'&&<Button variant="outline" onClick={()=>controller.close()}>{state.phase==='result'?labels.close:labels.cancel}</Button>}
          {(state.phase==='create'||editing)&&<Button type="submit" form={formId} disabled={state.actionBusy} aria-busy={state.actionBusy}>{editing?(state.actionBusy?labels.saving:labels.save):(state.actionBusy?labels.creating:labels.submit)}</Button>}
          {state.phase==='result'&&<Button disabled={state.copyStatus==='copying'} aria-busy={state.copyStatus==='copying'} onClick={()=>controller.copySecret(writeClipboard??copyText)}>{state.copyStatus==='copying'?labels.copying:labels.copy}</Button>}
          {state.phase==='delete'&&<Button variant="destructive" disabled={state.actionBusy} aria-busy={state.actionBusy} onClick={()=>controller.confirmDeleteRecord()}>{state.actionBusy?labels.deleting:labels.confirmDelete}</Button>}
          {state.phase==='revoke'&&<Button variant="destructive" disabled={state.actionBusy} aria-busy={state.actionBusy} onClick={()=>controller.confirmRevoke()}>{state.actionBusy?labels.revoking:labels.confirmRevoke}</Button>}
        </Dialog.Footer>
      </Dialog.Content>
    </PeerDialog.Root>
  </section>;
}

export {createApiKeyManagerViewController} from '@coffeehc/xui-runtime/component-views';
export type {ApiKeyManagerViewController} from '@coffeehc/xui-runtime/component-views';
