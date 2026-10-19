export interface ClipboardWriteOptions {signal?:AbortSignal}
export type ClipboardPlatformWriter=(value:string,options:ClipboardWriteOptions)=>void|Promise<void>;
export interface ClipboardServiceOptions {
 /** Optional platform seam for embedding and deterministic tests. The service never owns or disposes it. */
 writeText?:ClipboardPlatformWriter;
 navigator?:Pick<Navigator,'clipboard'>|null;
 document?:Document|null;
 execCommand?:(document:Document,command:'copy')=>boolean;
}
export interface ClipboardService {writeText(value:string,options?:ClipboardWriteOptions):Promise<void>;dispose():void}
export type SharedClipboardService=Pick<ClipboardService,'writeText'>;
type Job={value:string;signal?:AbortSignal;controller:AbortController;resolve:()=>void;reject:(error:unknown)=>void;started:boolean;settled:boolean;cancelled:boolean;abort?:()=>void};
const abortError=()=>new DOMException('Clipboard write cancelled','AbortError');

function copyThroughTextarea(document:Document,value:string,execCommand:(document:Document,command:'copy')=>boolean){
 const view=document.defaultView,active=document.activeElement as HTMLElement|null;
 const scrollTargets:Array<{node:Element|Window;left:number;top:number}>=[];
 if(view)scrollTargets.push({node:view,left:view.scrollX,top:view.scrollY});
 for(let node:Element|null=active;node;node=node.parentElement)scrollTargets.push({node,left:node.scrollLeft,top:node.scrollTop});
 const root=document.documentElement,body=document.body;
 if(root)scrollTargets.push({node:root,left:root.scrollLeft,top:root.scrollTop});
 if(body)scrollTargets.push({node:body,left:body.scrollLeft,top:body.scrollTop});
 const control=active&&((document.defaultView?.HTMLInputElement&&active instanceof document.defaultView.HTMLInputElement)||(document.defaultView?.HTMLTextAreaElement&&active instanceof document.defaultView.HTMLTextAreaElement))?active as HTMLInputElement|HTMLTextAreaElement:null;
 let controlSelection:readonly[number,number,('forward'|'backward'|'none'|null)]|undefined;
 try{if(control&&control.selectionStart!==null&&control.selectionEnd!==null)controlSelection=[control.selectionStart,control.selectionEnd,control.selectionDirection];}catch{}
 const selection=view?.getSelection(),ranges:Range[]=[];
 if(selection)for(let i=0;i<selection.rangeCount;i++)ranges.push(selection.getRangeAt(i).cloneRange());
 const textarea=document.createElement('textarea');textarea.value=value;textarea.setAttribute('aria-hidden','true');textarea.tabIndex=-1;
 // Native Chrome can acknowledge copy for a zero-size selection without
 // copying its text. Keep a nonzero, invisible platform selection surface.
 Object.assign(textarea.style,{position:'fixed',left:'0',top:'0',width:'1px',height:'1px',padding:'0',border:'0',opacity:'0',pointerEvents:'none'});
 let copied=false;
 try{
  (document.body??document.documentElement).appendChild(textarea);textarea.focus({preventScroll:true});textarea.select();textarea.setSelectionRange(0,textarea.value.length);copied=execCommand(document,'copy');
  if(!copied)throw new Error('Clipboard write is unavailable');
 }finally{
  textarea.remove();
  if(active?.isConnected){try{active.focus({preventScroll:true});}catch{active.focus();}}
  if(selection){try{selection.removeAllRanges();for(const range of ranges)selection.addRange(range);}catch{}}
  // Restoring a DOM Range can reset the active input's native selection in Chrome.
  // Its original range/direction must therefore be applied after DOM Selection.
  if(control&&controlSelection){try{control.setSelectionRange(controlSelection[0],controlSelection[1],controlSelection[2]??undefined);}catch{}}
  for(const position of scrollTargets){try{if('scrollTo'in position.node&&typeof position.node.scrollTo==='function')position.node.scrollTo(position.left,position.top);else{(position.node as Element).scrollLeft=position.left;(position.node as Element).scrollTop=position.top;}}catch{}}
 }
}

/** Serialized write-only clipboard boundary. It never reads clipboard contents or retries failures. */
/** Internal factory; the public registry owns the shared instance and its disposal. */
export function buildClipboardService(options:ClipboardServiceOptions={}):ClipboardService {
 let dead=false,active:Job|undefined;const queue:Job[]=[];
 const execute=options.execCommand??((doc:Document,command:'copy')=>typeof doc.execCommand==='function'?doc.execCommand(command):false);
 const platformWrite:ClipboardPlatformWriter=options.writeText??(async(value,request)=>{
  const navigator=options.navigator===undefined?globalThis.navigator:options.navigator;
  const document=options.document===undefined?globalThis.document:options.document;
  if(navigator?.clipboard?.writeText){await navigator.clipboard.writeText(value);return;}
  if(!document||typeof execute!=='function')throw new Error('Clipboard write is unavailable');
  if(request.signal?.aborted)throw abortError();
  copyThroughTextarea(document,value,execute);
 });
 const settle=(job:Job,ok:boolean,error?:unknown)=>{if(job.settled)return;job.settled=true;if(ok)job.resolve();else job.reject(error);};
 const onAbort=(job:Job)=>{job.cancelled=true;job.value='';job.controller.abort();settle(job,false,abortError());if(!job.started){const index=queue.indexOf(job);if(index>=0)queue.splice(index,1);job.signal?.removeEventListener('abort',job.abort!);process();}};
 const process=()=>{
  if(dead||active)return;
  const job=queue.shift();if(!job)return;
  if(job.cancelled||job.signal?.aborted){onAbort(job);process();return;}
  active=job;job.started=true;
  void Promise.resolve().then(()=>{
   if(dead||job.controller.signal.aborted)throw abortError();
   const value=job.value;job.value='';return platformWrite(value,{signal:job.controller.signal});
  }).then(()=>settle(job,true),error=>settle(job,false,error)).finally(()=>{
   job.value='';job.signal?.removeEventListener('abort',job.abort!);active=undefined;process();
  });
 };
 return Object.freeze({writeText(value:string,request:ClipboardWriteOptions={}){
  if(typeof value!=='string')return Promise.reject(new TypeError('Clipboard value must be text'));
  if(dead)return Promise.reject(new Error('Clipboard service is disposed'));
  if(request.signal?.aborted)return Promise.reject(abortError());
  return new Promise<void>((resolve,reject)=>{
   const job:Job={value,signal:request.signal,controller:new AbortController(),resolve,reject,started:false,settled:false,cancelled:false};
   job.abort=()=>onAbort(job);request.signal?.addEventListener('abort',job.abort,{once:true});queue.push(job);process();
  });
 },dispose(){if(dead)return;dead=true;for(const job of queue.splice(0)){job.cancelled=true;job.value='';job.controller.abort();job.signal?.removeEventListener('abort',job.abort!);settle(job,false,new Error('Clipboard service is disposed'));}if(active){active.cancelled=true;active.value='';active.controller.abort();active.signal?.removeEventListener('abort',active.abort!);settle(active,false,new Error('Clipboard service is disposed'));}}});
}
