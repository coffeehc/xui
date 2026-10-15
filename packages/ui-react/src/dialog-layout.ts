import * as React from 'react';
import {observeDialogLayout} from './dialog-layout-observer.js';
/** @internal Preserve the peer ref contract while attaching shared layout cleanup. */
export function useDialogLayoutRef(ref:React.Ref<HTMLDivElement>|undefined){
 return React.useCallback((node:HTMLDivElement|null)=>{
  if(!node)return;
  const release=observeDialogLayout(node);
  const refCleanup=typeof ref==='function'?ref(node):undefined;
  if(ref&&typeof ref!=='function')ref.current=node;
  return()=>{release();if(typeof refCleanup==='function')refCleanup();else if(typeof ref==='function')ref(null);else if(ref)ref.current=null;};
 },[ref]);
}
