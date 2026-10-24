import * as React from 'react';
import {Toast} from './toast.js';

type CopyState={readonly copyStatus:'idle'|'copying'|'copied'|'error'};
type CopySource<S>={getState:()=>S;subscribe:(listener:()=>void)=>()=>void};
/** Observe exact owner transitions, including repeated copies batched into one React render. */
export function useCopyFeedback<S extends CopyState>(source:CopySource<S>,active:(state:S)=>boolean,labels:{copied:string;copyError:string}){
 const toast=Toast.useToastManager(),latest=React.useRef({active,labels,toast});
 latest.current={active,labels,toast};
 React.useLayoutEffect(()=>{
  let previous=source.getState().copyStatus;
  return source.subscribe(()=>{
   const state=source.getState(),changed=previous!==state.copyStatus;
   previous=state.copyStatus;
   if(!changed||!latest.current.active(state))return;
   if(state.copyStatus==='copied'||state.copyStatus==='error')latest.current.toast.add({description:state.copyStatus==='copied'?latest.current.labels.copied:latest.current.labels.copyError,type:state.copyStatus==='copied'?'success':'error',priority:state.copyStatus==='error'?'high':'low'});
  });
 },[source]);
}
