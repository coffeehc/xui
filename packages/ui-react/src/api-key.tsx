import {createApiKeyManagerViewController,type ApiKeyManagerViewController} from '@coffeehc/xui-runtime/component-views';
import type {ApiKeyManagerOptions} from '@coffeehc/xui-runtime/api-key';
import {useOwnedController,useViewRelease,assertControllerProps} from './controller.js';
import {getClipboardService} from '@coffeehc/xui-runtime/clipboard';
import {Dialog as PeerDialog} from '@base-ui/react/dialog';
import * as React from 'react';
import {dataTableDefaultLabels} from '@coffeehc/xui-runtime/data-table';
import type {ApiKeyMetadata,ApiKeyManagerController} from '@coffeehc/xui-runtime/api-key';
import {Button} from './button.js';
import {RefreshAction} from './refresh-action.js';
import {Field,Input,Textarea,SimpleSelect,Fieldset,Checkbox} from './forms.js';
import {PageHeader,Stack} from './layout.js';
import {ErrorState,EmptyState,Alert,Badge} from './feedback.js';
import {TableActions} from './table.js';
import {DataTable,type DataTableColumn,type DataTableLabels} from './data-table.js';
import {Dialog} from './dialog.js';
import {cx} from './shared.js';
const metadataHeader=(label:string)=><span className="xui-table-label">{label}</span>;
export type {ApiKeyMetadata,ApiKeyManagerController,ApiKeyManagerOptions,ApiKeyAdapter,ApiKeyDraft,CreatedApiKey,ApiKeyWriteContext,ApiKeyUpdateDraft} from '@coffeehc/xui-runtime/api-key';
/** Client pagination over the complete metadata collection returned by adapter.list. */
export type {ApiKeyManagerPagination} from '@coffeehc/xui-runtime/component-views';
import type {ApiKeyManagerPagination} from '@coffeehc/xui-runtime/component-views';
interface ApiKeyManagerSlots {className?:string;headerActions?:React.ReactNode;writeClipboard?:(value:string)=>Promise<void>;
 /** Defaults to 10 rows with 10/25/50 choices. false displays the complete loaded collection. */

 /** Public DataTable footer/count and status labels; never server pagination facts. */
 tableLabels?:Partial<DataTableLabels>;
}
export type ApiKeyManagerProps=ApiKeyManagerSlots&({viewController:ApiKeyManagerViewController;controller?:never;options?:never;pagination?:never}|{viewController?:undefined;controller:ApiKeyManagerController;options?:never;pagination?:ApiKeyManagerPagination|false}|{viewController?:undefined;controller?:undefined;options:ApiKeyManagerOptions;pagination?:ApiKeyManagerPagination|false});
/** The caller owns the controller and backend. Unmount releases the transient result. */
export function ApiKeyManager({viewController:injected,controller:borrowed,options:initialOptions,className,headerActions,writeClipboard,pagination,tableLabels}:ApiKeyManagerProps){
  assertControllerProps(injected,{controller:borrowed,options:initialOptions,pagination},['controller','options','pagination']);
  if(borrowed&&initialOptions)throw new TypeError('controller cannot be combined with options');
  const viewController=useOwnedController(injected,()=>createApiKeyManagerViewController(borrowed?{service:borrowed,pagination}:{options:initialOptions!,pagination}),borrowed);
  const controller=viewController.service,viewState=React.useSyncExternalStore(viewController.subscribe,viewController.getState,viewController.getState);
  const activeOwner=React.useRef(controller);activeOwner.current=controller;
  React.useEffect(()=>viewController.start(),[viewController]);
  const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),{options,labels}=controller;
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
    {id:'name',header:metadataHeader(labels.name),cell:key=><div className="xui-table-primary">{key.name}</div>},
    {id:'status',header:metadataHeader(labels.status),cell:key=><Badge className="xui-table-label" tone={key.status==='active'?'success':key.status==='expired'?'warning':'neutral'}>{key.status===null?labels.unknown:labels[key.status]}</Badge>},
    {id:'prefix',header:metadataHeader(labels.prefix),cell:key=><span className="xui-code xui-table-value">{key.prefix===null?labels.unknown:`${key.prefix}…`}</span>},
    {id:'permissions',header:metadataHeader(labels.permissions),cell:key=>key.permissionIds.length?key.permissionIds.map(id=>options.permissions.find(item=>item.id===id)?.label??id).join(', '):'—'},
    {id:'createdAt',header:metadataHeader(labels.createdAt),cell:key=><span className="xui-code xui-table-value">{key.createdAt??labels.unknown}</span>},
    {id:'expiresAt',header:metadataHeader(labels.expiry),cell:key=><span className="xui-code xui-table-value">{key.expiresAt??labels.unknown}</span>},
    {id:'lastUsedAt',header:metadataHeader(labels.lastUsedAt),cell:key=><><span className="xui-code xui-table-value">{key.lastUsedAt??labels.unknown}</span>{key.lastUsedAtPending===true&&<> <Badge>{labels.lastUsedAtPending}</Badge></>}</>},
    {id:'actions',header:metadataHeader(labels.actions),cell:key=><TableActions>{options.adapter.update&&<Button variant="ghost" size="xs" disabled={!controller.canUpdate(key)} aria-label={`${labels.edit} ${key.name}`} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openUpdate(key.id);}}>{labels.edit}</Button>}<Button variant="ghost" size="xs" disabled={!controller.canRevoke(key)} aria-label={`${labels.revoke} ${key.name}`} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openRevoke(key.id);}}>{labels.revoke}</Button>{controller.canDeleteRecord(key)&&<Button variant="ghost" size="xs" aria-label={`${labels.deleteRecord} ${key.name}`} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openDeleteRecord(key.id);}}>{labels.deleteRecord}</Button>}</TableActions>},
  ],[controller,options,labels]);
  return <section className={cx('xui-stack',className)}>
    <PageHeader title={labels.title} actions={<><RefreshAction ref={refreshRef} variant="outline" disabled={state.listBusy} busy={state.listBusy} onClick={()=>controller.refresh()}>{labels.refresh}</RefreshAction><Button ref={createRef} disabled={state.actionBusy} hidden={options.canCreate!==true} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openCreate();}}>{labels.create}</Button>{headerActions}</>}/>
    <DataTable className="xui-record-table" rows={visibleRows} columns={columns} rowKey={key=>key.id} label={labels.title} status={state.listBusy?(state.hasLoaded?'refreshing':'loading'):state.listError?'error':state.hasLoaded?'ready':'idle'} disabled={state.actionBusy} hasValue={state.hasLoaded}
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
          {state.phase==='result'&&<Stack><Field label={labels.secret}><Textarea className="xui-code" style={{fontFamily:'var(--font-mono)',fontVariantNumeric:'tabular-nums'}} ref={attachSecret} readOnly autoComplete="off" spellCheck={false} value={controller.readSecret()??''}/></Field>{state.copyStatus==='error'?<Alert tone="error">{labels.copyError}</Alert>:state.copyStatus!=='idle'&&<p className="xui-text" role="status">{state.copyStatus==='copying'?labels.copying:labels.copied}</p>}</Stack>}
          {(state.phase==='revoke'||state.phase==='delete')&&state.revokeTarget&&<dl className="xui-details"><dt>{labels.name}</dt><dd>{state.revokeTarget.name}</dd><dt>{labels.prefix}</dt><dd className="xui-code">{state.revokeTarget.prefix===null?labels.unknown:`${state.revokeTarget.prefix}…`}</dd></dl>}
          <div className="xui-feedback-slot" hidden={!state.actionBusy&&!state.actionError}>
          {state.actionBusy&&<Alert tone="warning">{editing?labels.updatePending:state.phase==='create'?labels.creationPending:state.phase==='delete'?labels.deletePending:labels.revokePending}</Alert>}{state.actionError&&<Alert tone="error">{state.actionError}</Alert>}</div>
        </Dialog.Body>
        <Dialog.Footer>
          {state.phase!=='closed'&&<Button variant="outline" onClick={()=>controller.close()}>{state.phase==='result'?labels.close:labels.cancel}</Button>}
          {(state.phase==='create'||editing)&&<Button type="submit" form={formId} disabled={state.actionBusy} aria-busy={state.actionBusy}>{editing?(state.actionBusy?labels.saving:labels.save):(state.actionBusy?labels.creating:labels.submit)}</Button>}
          {state.phase==='result'&&<Button disabled={state.copyStatus==='copying'} onClick={()=>controller.copySecret(writeClipboard??copyText)}>{state.copyStatus==='copying'?labels.copying:labels.copy}</Button>}
          {state.phase==='delete'&&<Button variant="destructive" disabled={state.actionBusy} aria-busy={state.actionBusy} onClick={()=>controller.confirmDeleteRecord()}>{state.actionBusy?labels.deleting:labels.confirmDelete}</Button>}
          {state.phase==='revoke'&&<Button variant="destructive" disabled={state.actionBusy} aria-busy={state.actionBusy} onClick={()=>controller.confirmRevoke()}>{state.actionBusy?labels.revoking:labels.confirmRevoke}</Button>}
        </Dialog.Footer>
      </Dialog.Content>
    </PeerDialog.Root>
  </section>;
}

export {createApiKeyManagerViewController} from '@coffeehc/xui-runtime/component-views';
export type {ApiKeyManagerViewController} from '@coffeehc/xui-runtime/component-views';
