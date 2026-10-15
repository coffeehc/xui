/** Presentation state only. The host owns initialization authority and persistence. */
export type AdminSetupStatus='idle'|'submitting'|'checking'|'unconfirmed'|'complete'|'unavailable';
export interface AdminSetupState {readonly status:AdminSetupStatus;readonly rejected?:boolean;/** A failed read never unlocks initialization. */readonly checkFailed?:boolean;readonly revision?:number}
export type AdminSetupResult='complete'|'unconfirmed'|'unavailable'|'rejected';
export interface AdminSetupCredentials {username:string;password:string}
export type AdminSetupSubmit=(credentials:AdminSetupCredentials,context:{signal:AbortSignal})=>Promise<AdminSetupResult>|AdminSetupResult;
/** A read can confirm completion, but cannot authorize another initialization write. */
export type AdminSetupCheckResult='complete'|'unconfirmed'|'unavailable';
/** Host-owned read only authority check; no credentials or authentication side effect. */
export type AdminSetupCheck=(context:{signal:AbortSignal})=>Promise<AdminSetupCheckResult>|AdminSetupCheckResult;
export interface AdminSetupLabels {username:string;usernameRequired:string;submit:string;submitting:string;check?:string;checking?:string;checkError?:string;unconfirmed:string;complete:string;unavailable:string;rejected:string}
export const adminSetupLabels:Readonly<Required<AdminSetupLabels>>=Object.freeze({username:'管理员用户名',usernameRequired:'请输入管理员用户名。',submit:'创建管理员',submitting:'正在创建管理员…',check:'重新核对状态',checking:'正在核对状态…',checkError:'暂时无法核对创建结果，请重试。',unconfirmed:'暂时无法确认创建结果，不能再次提交。',complete:'管理员已创建，请登录。',unavailable:'暂时无法创建管理员，请稍后再试。',rejected:'未能创建管理员，请检查输入后重试。'});
export function getAdminSetupMessage(state:AdminSetupState,labels:AdminSetupLabels=adminSetupLabels):string {return state.checkFailed?(labels.checkError??adminSetupLabels.checkError):state.status==='checking'?(labels.checking??adminSetupLabels.checking):state.status==='idle'?(state.rejected?labels.rejected:''):labels[state.status];}
export interface AdminSetupController {getState():Readonly<AdminSetupState>;subscribe(listener:()=>void):()=>void;setState(state:AdminSetupState):void;submit(credentials:AdminSetupCredentials):Promise<void>;/** Explicitly reads authority in unconfirmed/unavailable states only. */check():Promise<void>;suspend():void;destroy():void}
export interface AdminSetupControllerOptions {state:AdminSetupState;onSubmit:AdminSetupSubmit;onCheck?:AdminSetupCheck}
function checkedState(state:AdminSetupState):Readonly<AdminSetupState>{if(!state||!['idle','submitting','checking','unconfirmed','complete','unavailable'].includes(state.status))throw new TypeError('Invalid administrator setup state');if(state.revision!==undefined&&!Number.isSafeInteger(state.revision))throw new TypeError('Invalid administrator setup revision');return Object.freeze({status:state.status,...(state.revision!==undefined?{revision:state.revision}:{}),...(state.status==='idle'&&state.rejected?{rejected:true}:{}),...((state.status==='unconfirmed'||state.status==='unavailable')&&state.checkFailed?{checkFailed:true}:{})});}
/** Release local callers promptly even when a host operation ignores abort. */
function waitForAuthority<T>(result:T|Promise<T>,signal:AbortSignal):Promise<T>{
 return new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(ok:boolean,value:unknown)=>{if(settled)return;settled=true;signal.removeEventListener('abort',cancel);if(ok)resolve(value as T);else reject(value);};
  const cancel=()=>finish(false,new DOMException('Cancelled','AbortError'));
  if(signal.aborted)cancel();else signal.addEventListener('abort',cancel,{once:true});
  Promise.resolve(result).then(value=>finish(true,value),error=>finish(false,error));
 });
}
/** Never retries a write, creates a session, or stores credentials. A rejection must be authoritative. */
export function createAdminSetupController(options:AdminSetupControllerOptions):AdminSetupController {
 let state=checkedState(options.state),dead=false,revision=0,pending:AbortController|undefined,activeCredentials:AdminSetupCredentials|undefined;const listeners=new Set<()=>void>();
 const publish=(next:AdminSetupState)=>{state=checkedState(next);for(const listener of listeners)listener();};
 const cancel=()=>{revision++;pending?.abort();pending=undefined;if(activeCredentials)activeCredentials.password='';activeCredentials=undefined;};
 return Object.freeze({getState:()=>state,subscribe(listener:()=>void){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},setState(next:AdminSetupState){if(dead)return;const checked=checkedState(next);cancel();publish(checked);},
 async submit(credentials:AdminSetupCredentials){if(dead||pending||state.status!=='idle'){credentials.password='';return;}const id=++revision,controller=new AbortController();pending=controller;activeCredentials=credentials;
 try{publish({status:'submitting'});if(dead||id!==revision)return;const result=await waitForAuthority(options.onSubmit(credentials,{signal:controller.signal}),controller.signal);if(dead||id!==revision)return;publish(result==='rejected'?{status:'idle',rejected:true}:{status:result==='complete'||result==='unavailable'?result:'unconfirmed'});}
 catch{if(!dead&&id===revision)publish({status:'unconfirmed'});}
 finally{credentials.password='';if(id===revision){pending=undefined;activeCredentials=undefined;}}
 },async check(){
 if(dead||pending||!options.onCheck||!['unconfirmed','unavailable'].includes(state.status))return;
 const id=++revision,controller=new AbortController();pending=controller;
 try{publish({status:'checking'});if(dead||id!==revision)return;const result=await waitForAuthority(options.onCheck({signal:controller.signal}),controller.signal);if(dead||id!==revision)return;
 if(result==='complete'||result==='unconfirmed'||result==='unavailable')publish({status:result});else publish({status:'unconfirmed',checkFailed:true});}
 catch{if(!dead&&id===revision)publish({status:'unconfirmed',checkFailed:true});}
 finally{if(id===revision)pending=undefined;}
 },suspend(){if(dead)return;const busy=state.status==='submitting'||state.status==='checking';cancel();if(busy)publish({status:'unconfirmed'});},destroy(){if(dead)return;dead=true;cancel();listeners.clear();}});
}
