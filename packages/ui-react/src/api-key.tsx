import * as React from 'react';
import type {ApiKeyManagerController} from '@coffeehc/xui-runtime/api-key';
import {Button} from './button.js';
import {Field,Input,Textarea,SimpleSelect,Fieldset,Checkbox} from './forms.js';
import {PageHeader,Toolbar,Stack} from './layout.js';
import {DataRegion,LoadingState,ErrorState,EmptyState,Alert,Badge} from './feedback.js';
import {Table,TableContainer,TableCaption,TableHead,TableBody,TableRow,TableHeaderCell,TableCell,TableActions} from './table.js';
import {Dialog} from './dialog.js';
import {cx} from './shared.js';
export type {ApiKeyMetadata,ApiKeyManagerController,ApiKeyManagerOptions,ApiKeyAdapter,ApiKeyDraft,CreatedApiKey,ApiKeyWriteContext,ApiKeyUpdateDraft} from '@coffeehc/xui-runtime/api-key';
export interface ApiKeyManagerProps {controller:ApiKeyManagerController;className?:string;headerActions?:React.ReactNode;writeClipboard?:(value:string)=>Promise<void>}
/** The caller owns the controller and backend. Unmount releases the transient result. */
export function ApiKeyManager({controller,className,headerActions,writeClipboard}:ApiKeyManagerProps){
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
  return <section className={cx('xui-stack',className)}>
    <PageHeader title={labels.title} actions={<><Button ref={createRef} disabled={state.actionBusy} hidden={options.canCreate!==true} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openCreate();}}>{labels.create}</Button>{headerActions}</>}/>
    <Toolbar><Button ref={refreshRef} variant="outline" disabled={state.listBusy} aria-busy={state.listBusy} onClick={()=>controller.refresh()}>{labels.refresh}</Button></Toolbar>
    <DataRegion busy={state.listBusy} aria-label={labels.title} feedback={<>{state.listBusy&&<LoadingState>{labels.loading}</LoadingState>}{state.listError&&<ErrorState title={state.listError} retryLabel={labels.retry} onRetry={()=>controller.refresh()}/>}</>}>
      {state.rows.length>0?<TableContainer aria-label={labels.title}><Table><TableCaption>{labels.title}</TableCaption><TableHead><TableRow>{[labels.name,labels.prefix,labels.permissions,labels.createdAt,labels.expiry,labels.lastUsedAt,labels.status,labels.actions].map((label,index)=><TableHeaderCell key={index}>{label}</TableHeaderCell>)}</TableRow></TableHead><TableBody>{state.rows.map(key=><TableRow key={key.id}><TableCell>{key.name}</TableCell><TableCell>{key.prefix===null?labels.unknown:`${key.prefix}…`}</TableCell><TableCell>{key.permissionIds.length?key.permissionIds.map(id=>options.permissions.find(item=>item.id===id)?.label??id).join(', '):'—'}</TableCell><TableCell>{key.createdAt??labels.unknown}</TableCell><TableCell>{key.expiresAt??labels.unknown}</TableCell><TableCell>{key.lastUsedAt??labels.unknown}{key.lastUsedAtPending===true&&<> <Badge>{labels.lastUsedAtPending}</Badge></>}</TableCell><TableCell>{key.status===null?labels.unknown:labels[key.status]}</TableCell><TableCell><TableActions>{options.adapter.update&&<Button variant="outline" disabled={!controller.canUpdate(key)} aria-label={`${labels.edit} ${key.name}`} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openUpdate(key.id);}}>{labels.edit}</Button>}<Button variant="destructive" disabled={!controller.canRevoke(key)} aria-label={`${labels.revoke} ${key.name}`} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openRevoke(key.id);}}>{labels.revoke}</Button>{controller.canDeleteRecord(key)&&<Button variant="destructive" aria-label={`${labels.deleteRecord} ${key.name}`} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openDeleteRecord(key.id);}}>{labels.deleteRecord}</Button>}</TableActions></TableCell></TableRow>)}</TableBody></Table></TableContainer>:state.hasLoaded&&<EmptyState title={labels.empty}/>}
    </DataRegion>
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
          {state.phase==='result'&&<Stack><Field label={labels.secret}><Textarea ref={attachSecret} readOnly autoComplete="off" spellCheck={false} value={controller.readSecret()??''}/></Field>{state.copyStatus==='error'?<Alert tone="error">{labels.copyError}</Alert>:state.copyStatus!=='idle'&&<p className="xui-text" role="status">{state.copyStatus==='copying'?labels.copying:labels.copied}</p>}</Stack>}
          {(state.phase==='revoke'||state.phase==='delete')&&state.revokeTarget&&<dl className="xui-details"><dt>{labels.name}</dt><dd>{state.revokeTarget.name}</dd><dt>{labels.prefix}</dt><dd>{state.revokeTarget.prefix===null?labels.unknown:`${state.revokeTarget.prefix}…`}</dd></dl>}
          <div className="xui-feedback-slot">
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
