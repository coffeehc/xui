import * as React from 'react';
import {getClipboardService} from '@coffeehc/xui-runtime/clipboard';
import type {ApiKeyMetadata,ApiKeyManagerController,ApiKeyLabels} from '@coffeehc/xui-runtime/api-key';
import {Button} from './button.js';
import {Spinner} from './feedback.js';
import {Toast} from './toast.js';
/** Presence enables click/Enter/Space copy. The host retains the authenticated secret-read owner. */
export interface ApiKeyCellCopyOptions {
 readValue:(record:Readonly<ApiKeyMetadata>,context:{signal:AbortSignal})=>string|Promise<string>;
 canCopy?:(record:Readonly<ApiKeyMetadata>)=>boolean;
 unavailableLabel?:(record:Readonly<ApiKeyMetadata>)=>string;
 labels?:Partial<Pick<ApiKeyLabels,'copy'|'copying'|'copied'|'copyError'>>;
}
export function maskedApiKeyPrefix(prefix:string){const value=prefix.replace(/^bs-v\d+-(?:sha256-)?/,'');return `${(value||prefix).slice(0,8)}••••`;}
export function ApiKeyCell({record,owner,copy,disabled,labels}:{record:Readonly<ApiKeyMetadata>;owner:ApiKeyManagerController;copy:ApiKeyCellCopyOptions|false|undefined;disabled:boolean;labels:Readonly<ApiKeyLabels>}){
 return copy?<CopyKeyCell {...{record,owner,copy,disabled,labels}}/>:<span className="xui-code xui-table-value">{record.prefix===null?labels.unknown:maskedApiKeyPrefix(record.prefix)}</span>;
}
function CopyKeyCell({record,owner,copy,disabled,labels}:{record:Readonly<ApiKeyMetadata>;owner:ApiKeyManagerController;copy:ApiKeyCellCopyOptions;disabled:boolean;labels:Readonly<ApiKeyLabels>}){
 const [busy,setBusy]=React.useState(false),pending=React.useRef<AbortController|null>(null),toast=Toast.useToastManager();
 const latest=React.useRef({record,owner,copy,disabled,labels});latest.current={record,owner,copy,disabled,labels};
 const allowed=(row:Readonly<ApiKeyMetadata>)=>{try{return copy.canCopy?.(row)??true;}catch{return false;}};
 const canCopy=!disabled&&allowed(record),text=record.prefix===null?labels.unknown:maskedApiKeyPrefix(record.prefix),messages={...labels,...copy.labels};
 React.useLayoutEffect(()=>{pending.current?.abort();pending.current=null;setBusy(false);return()=>{pending.current?.abort();};},[owner,record.id,record.version,record.prefix,record.status,record.secretAccess?.authorized,record.secretAccess?.recoverable,record.secretAccess?.canCopy,disabled,copy.readValue,copy.canCopy]);
 const copyValue=async()=>{
  if(pending.current||!canCopy)return;
  const operation=new AbortController();pending.current=operation;setBusy(true);let secret:string|undefined;
  const current=()=>!operation.signal.aborted&&latest.current.owner===owner&&!latest.current.disabled&&latest.current.record.id===record.id&&latest.current.record.version===record.version&&latest.current.record.status===record.status&&allowed(latest.current.record);
  try{
   secret=await copy.readValue(record,{signal:operation.signal});
   if(!current())return;
   const fresh=owner.getState().rows.find(row=>row.id===record.id);
   if(!fresh||fresh.version!==record.version||fresh.prefix!==record.prefix||fresh.status!==record.status||!allowed(fresh))return;
   if(typeof secret!=='string'||!secret.trim()||secret===record.prefix||secret===text||secret==='******')throw new Error('Credential unavailable');
   const write=getClipboardService().writeText(secret,{signal:operation.signal});secret=undefined;await write;
   if(current())toast.add({description:latest.current.copy.labels?.copied??latest.current.labels.copied,type:'success'});
  }catch{if(current())toast.add({description:latest.current.copy.labels?.copyError??latest.current.labels.copyError,type:'error'});}
  finally{secret=undefined;if(pending.current===operation){pending.current=null;if(current())setBusy(false);}}
 };
 return <Button variant="text" size="xs" className="xui-code xui-table-value" disabled={!canCopy||busy} aria-busy={busy} aria-label={`${messages.copy} ${record.name}`} title={canCopy?messages.copy:copy.unavailableLabel?.(record)} onClick={()=>void copyValue()}>{busy&&<Spinner/>}{text}</Button>;
}
