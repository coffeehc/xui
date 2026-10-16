import * as React from 'react';
import {dataTableDefaultLabels} from '@coffeehc/xui-runtime/data-table';
import type {ApiKeyMetadata,ApiKeyManagerController} from '@coffeehc/xui-runtime/api-key';
import {Button} from './button.js';
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
export interface ApiKeyManagerPagination {defaultPageSize?:number;pageSizeOptions?:readonly number[]}
export interface ApiKeyManagerProps {controller:ApiKeyManagerController;className?:string;headerActions?:React.ReactNode;writeClipboard?:(value:string)=>Promise<void>;
 /** Defaults to 10 rows with 10/25/50 choices. false displays the complete loaded collection. */
 pagination?:ApiKeyManagerPagination|false;
 /** Public DataTable footer/count and status labels; never server pagination facts. */
 tableLabels?:Partial<DataTableLabels>;
}
/** The caller owns the controller and backend. Unmount releases the transient result. */
export function ApiKeyManager({controller,className,headerActions,writeClipboard,pagination,tableLabels}:ApiKeyManagerProps){
  const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),{options,labels}=controller;
  const formId=React.useId(),nameRef=React.useRef<HTMLInputElement>(null),secretRef=React.useRef<HTMLTextAreaElement>(null),createRef=React.useRef<HTMLButtonElement>(null),refreshRef=React.useRef<HTMLButtonElement>(null),confirmationRef=React.useRef<HTMLInputElement>(null),dialogRef=React.useRef<HTMLDivElement>(null),lastTrigger=React.useRef<HTMLElement|null>(null);
  const clearSecret=React.useCallback(()=>{const node=secretRef.current;if(node){node.value='';node.defaultValue='';node.textContent='';}},[]);
  const attachSecret=React.useCallback((node:HTMLTextAreaElement|null)=>{if(secretRef.current!==node)clearSecret();secretRef.current=node;},[clearSecret]);
  React.useLayoutEffect(()=>{const off=controller.subscribe(()=>{if(controller.getState().phase!=='result')clearSecret();}),release=()=>{clearSecret();controller.close();};window.addEventListener('pagehide',release);return()=>{off();window.removeEventListener('pagehide',release);release();};},[controller,clearSecret]);
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
  const defaultPageSize=pagination===false?10:pagination?.defaultPageSize??10;
  const [paging,setPaging]=React.useState({controller,pageIndex:0,pageSize:defaultPageSize});
  const pageSize=paging.controller===controller?paging.pageSize:defaultPageSize;
  const pageSizes=pagination===false?undefined:pagination?.pageSizeOptions??(pagination?.defaultPageSize===undefined?[10,25,50]:[defaultPageSize]);
  if(pagination!==false&&(!Number.isSafeInteger(pageSize)||pageSize<1))throw new TypeError('ApiKeyManager page size must be a positive integer');
  const pageIndex=Math.min(paging.controller===controller?paging.pageIndex:0,Math.max(0,Math.ceil(state.rows.length/pageSize)-1));
  React.useEffect(()=>{if(paging.controller!==controller||paging.pageIndex!==pageIndex)setPaging({controller,pageIndex,pageSize});},[controller,pageIndex,pageSize,paging]);
  const visibleRows=pagination===false?state.rows:state.rows.slice(pageIndex*pageSize,(pageIndex+1)*pageSize);
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
    <PageHeader title={labels.title} actions={<><Button ref={refreshRef} variant="outline" disabled={state.listBusy} aria-busy={state.listBusy} onClick={()=>controller.refresh()}>{labels.refresh}</Button><Button ref={createRef} disabled={state.actionBusy} hidden={options.canCreate!==true} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openCreate();}}>{labels.create}</Button>{headerActions}</>}/>
    <DataTable className="xui-record-table" rows={visibleRows} columns={columns} rowKey={key=>key.id} label={labels.title} status={state.listBusy?(state.hasLoaded?'refreshing':'loading'):state.listError?'error':state.hasLoaded?'ready':'idle'} disabled={state.actionBusy}
      pagination={pagination===false||!state.hasLoaded?undefined:{pageIndex,pageIndexOffset:0,pageSize,total:state.rows.length,pageSizeOptions:pageSizes,onPageChange:index=>setPaging({controller,pageIndex:index,pageSize}),onPageSizeChange:size=>setPaging({controller,pageIndex:0,pageSize:size})}}
      labels={{empty:labels.empty,idle:labels.loading,loading:labels.loading,refreshing:labels.loading,error:labels.listError,retry:labels.retry,...tableLabels,count:facts=>state.hasLoaded?(tableLabels?.count??dataTableDefaultLabels.count)(facts):''}}
      emptyState={<EmptyState title={labels.empty}/>} errorState={<ErrorState title={state.listError??labels.listError} retryLabel={labels.retry} onRetry={()=>controller.refresh()}/>}/>
    <Dialog.Root open={state.phase!=='closed'} onOpenChange={open=>{if(!open)controller.close();}}>
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
          {state.phase==='result'&&<Button disabled={state.copyStatus==='copying'} onClick={()=>controller.copySecret(writeClipboard??(value=>navigator.clipboard.writeText(value)))}>{state.copyStatus==='copying'?labels.copying:labels.copy}</Button>}
          {state.phase==='delete'&&<Button variant="destructive" disabled={state.actionBusy} aria-busy={state.actionBusy} onClick={()=>controller.confirmDeleteRecord()}>{state.actionBusy?labels.deleting:labels.confirmDelete}</Button>}
          {state.phase==='revoke'&&<Button variant="destructive" disabled={state.actionBusy} aria-busy={state.actionBusy} onClick={()=>controller.confirmRevoke()}>{state.actionBusy?labels.revoking:labels.confirmRevoke}</Button>}
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  </section>;
}
