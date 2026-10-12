import * as React from 'react';
import type {ApiKeyManagerController} from '@coffeehc/xui-runtime/api-key';
import {Button} from './button.js';
import {Field,Input,Textarea,NativeSelect,Fieldset,Checkbox} from './forms.js';
import {PageHeader,Toolbar,Stack} from './layout.js';
import {DataRegion,LoadingState,ErrorState,EmptyState,Alert,Badge} from './feedback.js';
import {Table,TableContainer,TableCaption,TableHead,TableBody,TableRow,TableHeaderCell,TableCell} from './table.js';
import {Dialog} from './dialog.js';
import {cx} from './shared.js';
export type {ApiKeyMetadata,ApiKeyManagerController,ApiKeyManagerOptions,ApiKeyAdapter,ApiKeyDraft,CreatedApiKey,ApiKeyWriteGuard,ApiKeyPendingWrite,ApiKeyWriteResolution,ApiKeyWriteContext} from '@coffeehc/xui-runtime/api-key';
export interface ApiKeyManagerProps {controller:ApiKeyManagerController;className?:string;headerActions?:React.ReactNode;writeClipboard?:(value:string)=>Promise<void>}
/** The caller owns the controller and backend. Unmount releases the transient result. */
export function ApiKeyManager({controller,className,headerActions,writeClipboard}:ApiKeyManagerProps){
  const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),{options,labels}=controller;
  const formId=React.useId(),nameRef=React.useRef<HTMLInputElement>(null),secretRef=React.useRef<HTMLTextAreaElement>(null),createRef=React.useRef<HTMLButtonElement>(null),refreshRef=React.useRef<HTMLButtonElement>(null),recoveryRef=React.useRef<HTMLButtonElement>(null),confirmationRef=React.useRef<HTMLInputElement>(null),lastTrigger=React.useRef<HTMLElement|null>(null);
  const clearSecret=React.useCallback(()=>{const node=secretRef.current;if(node){node.value='';node.defaultValue='';node.textContent='';}},[]);
  const attachSecret=React.useCallback((node:HTMLTextAreaElement|null)=>{if(secretRef.current!==node)clearSecret();secretRef.current=node;},[clearSecret]);
  React.useLayoutEffect(()=>{const off=controller.subscribe(()=>{if(controller.getState().phase!=='result')clearSecret();}),release=()=>{clearSecret();controller.close();};window.addEventListener('pagehide',release);return()=>{off();window.removeEventListener('pagehide',release);release();};},[controller,clearSecret]);
  React.useLayoutEffect(()=>{if(state.phase==='result')secretRef.current?.focus();},[state.phase]);
  const finalFocus=()=>{const recovery=recoveryRef.current;if(controller.getState().writeBlock?.status==='uncertain'&&recovery?.isConnected&&!recovery.disabled)return recovery;const target=lastTrigger.current;return target?.isConnected&&!target.matches(':disabled,[aria-disabled="true"]')?target:refreshRef.current;};
  const submit=async()=>{await controller.submitCreate();if(controller.getState().phase==='create'&&Object.values(controller.getState().fieldErrors).some(Boolean))(controller.getState().fieldErrors.confirmation&&!controller.getState().fieldErrors.name?confirmationRef:nameRef).current?.focus();};
  const writeFeedback=state.writeBlock&&<Alert tone="warning"><p>{state.writeBlock.status==='uncertain'?labels.writeUncertain:labels.writePending}</p>{state.writeBlock.status==='uncertain'&&<Stack><Button ref={recoveryRef} variant="outline" disabled={state.recoveryBusy} aria-busy={state.recoveryBusy} onClick={()=>controller.recoverUncertainWrite()}>{state.recoveryBusy?labels.checkingWrite:labels.checkWrite}</Button>{state.recoveryBusy&&<Button variant="outline" onClick={()=>controller.close()}>{labels.cancel}</Button>}{state.recoveryError&&<p role="alert">{state.recoveryError}</p>}</Stack>}</Alert>;
  return <section className={cx('xui-stack',className)}>
    <PageHeader title={labels.title} actions={<><Button ref={createRef} disabled={!!state.writeBlock} hidden={options.canCreate!==true} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openCreate();}}>{labels.create}</Button>{headerActions}</>}/>
    {state.phase==='closed'&&writeFeedback}
    <Toolbar><Button ref={refreshRef} variant="outline" disabled={state.listBusy} aria-busy={state.listBusy} onClick={()=>controller.refresh()}>{labels.refresh}</Button></Toolbar>
    <DataRegion busy={state.listBusy} aria-label={labels.title} feedback={<>{state.listBusy&&<LoadingState>{labels.loading}</LoadingState>}{state.listError&&<ErrorState title={state.listError} retryLabel={labels.retry} onRetry={()=>controller.refresh()}/>}</>}>
      {state.rows.length>0?<TableContainer aria-label={labels.title}><Table><TableCaption>{labels.title}</TableCaption><TableHead><TableRow>{[labels.name,labels.prefix,labels.permissions,labels.createdAt,labels.expiry,labels.lastUsedAt,labels.status,labels.actions].map((label,index)=><TableHeaderCell key={index}>{label}</TableHeaderCell>)}</TableRow></TableHead><TableBody>{state.rows.map(key=><TableRow key={key.id}><TableCell>{key.name}</TableCell><TableCell>{key.prefix===null?labels.unknown:`${key.prefix}…`}</TableCell><TableCell>{key.permissionIds.length?key.permissionIds.map(id=>options.permissions.find(item=>item.id===id)?.label??id).join(', '):'—'}</TableCell><TableCell>{key.createdAt??labels.unknown}</TableCell><TableCell>{key.expiresAt??labels.unknown}</TableCell><TableCell>{key.lastUsedAt??labels.unknown}{key.lastUsedAtPending===true&&<> <Badge>{labels.lastUsedAtPending}</Badge></>}</TableCell><TableCell>{key.status===null?labels.unknown:labels[key.status]}</TableCell><TableCell><Button variant="destructive" disabled={!controller.canRevoke(key)} aria-label={`${labels.revoke} ${key.name}`} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openRevoke(key.id);}}>{labels.revoke}</Button>{controller.canDeleteRecord(key)&&<Button variant="destructive" aria-label={`${labels.deleteRecord} ${key.name}`} onClick={event=>{lastTrigger.current=event.currentTarget;controller.openDeleteRecord(key.id);}}>{labels.deleteRecord}</Button>}</TableCell></TableRow>)}</TableBody></Table></TableContainer>:state.hasLoaded&&<EmptyState title={labels.empty}/>}
    </DataRegion>
    <Dialog.Root open={state.phase!=='closed'} onOpenChange={open=>{if(!open)controller.close();}}>
      <Dialog.Content finalFocus={finalFocus}>
        <Dialog.Title>{state.phase==='result'?labels.resultTitle:state.phase==='delete'?labels.deleteTitle:state.phase==='revoke'?labels.revokeTitle:labels.createTitle}</Dialog.Title>
        {state.phase==='result'&&<Dialog.Description>{labels.oneTime}</Dialog.Description>}{state.phase==='revoke'&&<Dialog.Description>{labels.revokeWarning}</Dialog.Description>}{state.phase==='delete'&&<Dialog.Description>{labels.deleteWarning}</Dialog.Description>}
        <Dialog.Body>
          {state.phase==='create'&&<form id={formId} noValidate className="xui-stack" onSubmit={event=>{event.preventDefault();void submit();}}>
            <Field label={labels.name} required error={state.fieldErrors.name}><Input ref={nameRef} autoFocus autoComplete="off" value={state.draft.name} disabled={state.actionBusy||!!state.writeBlock} onChange={event=>controller.setDraft({name:event.target.value})}/></Field>
            <Fieldset legend={labels.permissions} error={state.fieldErrors.permissions} disabled={state.actionBusy||!!state.writeBlock}>{options.permissions.map(item=><Checkbox key={item.id} label={item.label} title={item.description} checked={state.draft.permissionIds.includes(item.id)} disabled={item.disabled||item.required} onChange={event=>controller.setDraft({permissionIds:event.target.checked?[...state.draft.permissionIds,item.id]:state.draft.permissionIds.filter(id=>id!==item.id)})}/>)}</Fieldset>
            {options.confirmationLabel&&<Fieldset legend={labels.confirmation} error={state.fieldErrors.confirmation}><Checkbox ref={confirmationRef} label={options.confirmationLabel} required disabled={state.actionBusy||!!state.writeBlock} checked={state.draft.confirmed===true} onChange={event=>controller.setDraft({confirmed:event.target.checked})}/></Fieldset>}
            <Field label={labels.expiry} error={state.fieldErrors.expiry}><NativeSelect value={state.draft.expiryId} disabled={state.actionBusy||!!state.writeBlock} onChange={event=>controller.setDraft({expiryId:event.target.value})}>{options.expiryOptions.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</NativeSelect></Field>
          </form>}
          {state.phase==='result'&&<Stack><Field label={labels.secret}><Textarea ref={attachSecret} readOnly autoComplete="off" spellCheck={false} value={controller.readSecret()??''}/></Field>{state.copyStatus==='error'?<Alert tone="error">{labels.copyError}</Alert>:state.copyStatus!=='idle'&&<p role="status">{state.copyStatus==='copying'?labels.copying:labels.copied}</p>}</Stack>}
          {(state.phase==='revoke'||state.phase==='delete')&&state.revokeTarget&&<dl className="xui-details"><dt>{labels.name}</dt><dd>{state.revokeTarget.name}</dd><dt>{labels.prefix}</dt><dd>{state.revokeTarget.prefix===null?labels.unknown:`${state.revokeTarget.prefix}…`}</dd></dl>}
          {state.phase!=='closed'&&state.writeBlock?.status==='uncertain'&&writeFeedback}
          {state.actionBusy&&<Alert tone="warning">{state.phase==='create'?labels.creationPending:state.phase==='delete'?labels.deletePending:labels.revokePending}</Alert>}{state.actionError&&<Alert tone="error">{state.actionError}</Alert>}
        </Dialog.Body>
        <Dialog.Footer>
          {state.phase!=='closed'&&<Button variant="outline" onClick={()=>controller.close()}>{state.phase==='result'?labels.close:labels.cancel}</Button>}
          {state.phase==='create'&&<Button type="submit" form={formId} disabled={state.actionBusy||!!state.writeBlock} aria-busy={state.actionBusy}>{state.actionBusy?labels.creating:labels.submit}</Button>}
          {state.phase==='result'&&<Button disabled={state.copyStatus==='copying'} onClick={()=>controller.copySecret(writeClipboard??(value=>navigator.clipboard.writeText(value)))}>{state.copyStatus==='copying'?labels.copying:labels.copy}</Button>}
          {state.phase==='delete'&&<Button variant="destructive" disabled={state.actionBusy||!!state.writeBlock} aria-busy={state.actionBusy} onClick={()=>controller.confirmDeleteRecord()}>{state.actionBusy?labels.deleting:labels.confirmDelete}</Button>}
          {state.phase==='revoke'&&<Button variant="destructive" disabled={state.actionBusy||!!state.writeBlock} aria-busy={state.actionBusy} onClick={()=>controller.confirmRevoke()}>{state.actionBusy?labels.revoking:labels.confirmRevoke}</Button>}
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  </section>;
}
