/** Presentation state only. The host owns initialization authority and persistence. */
export type AdminSetupStatus='idle'|'submitting'|'unconfirmed'|'complete'|'unavailable';
export interface AdminSetupState {readonly status:AdminSetupStatus;readonly rejected?:boolean;readonly revision?:number}
export type AdminSetupResult='complete'|'unconfirmed'|'unavailable'|'rejected';
export interface AdminSetupCredentials {username:string;password:string}
export type AdminSetupSubmit=(credentials:AdminSetupCredentials,context:{signal:AbortSignal})=>Promise<AdminSetupResult>|AdminSetupResult;
export interface AdminSetupLabels {username:string;usernameRequired:string;submit:string;submitting:string;unconfirmed:string;complete:string;unavailable:string;rejected:string}
export const adminSetupLabels:Readonly<AdminSetupLabels>=Object.freeze({username:'管理员用户名',usernameRequired:'请输入管理员用户名。',submit:'创建管理员',submitting:'正在创建管理员…',unconfirmed:'暂时无法确认创建结果，请稍候。',complete:'管理员已创建，请登录。',unavailable:'暂时无法创建管理员，请稍后再试。',rejected:'未能创建管理员，请检查输入后重试。'});
export function getAdminSetupMessage(state:AdminSetupState,labels:AdminSetupLabels=adminSetupLabels):string {return state.status==='idle'?(state.rejected?labels.rejected:''):labels[state.status];}
export interface AdminSetupController {getState():Readonly<AdminSetupState>;subscribe(listener:()=>void):()=>void;setState(state:AdminSetupState):void;submit(credentials:AdminSetupCredentials):Promise<void>;suspend():void;destroy():void}
export interface AdminSetupControllerOptions {state:AdminSetupState;onSubmit:AdminSetupSubmit}
function checkedState(state:AdminSetupState):Readonly<AdminSetupState>{if(!state||!['idle','submitting','unconfirmed','complete','unavailable'].includes(state.status))throw new TypeError('Invalid administrator setup state');if(state.revision!==undefined&&!Number.isSafeInteger(state.revision))throw new TypeError('Invalid administrator setup revision');return Object.freeze({status:state.status,...(state.revision!==undefined?{revision:state.revision}:{}),...(state.status==='idle'&&state.rejected?{rejected:true}:{})});}
/** Never retries a write, creates a session, or stores credentials. A rejection must be authoritative. */
export function createAdminSetupController(options:AdminSetupControllerOptions):AdminSetupController {
 let state=checkedState(options.state),dead=false,revision=0,pending:AbortController|undefined,activeCredentials:AdminSetupCredentials|undefined;const listeners=new Set<()=>void>();
 const publish=(next:AdminSetupState)=>{state=checkedState(next);for(const listener of listeners)listener();};
 const cancel=()=>{revision++;pending?.abort();pending=undefined;if(activeCredentials)activeCredentials.password='';activeCredentials=undefined;};
 return Object.freeze({getState:()=>state,subscribe(listener:()=>void){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},setState(next:AdminSetupState){if(dead)return;const checked=checkedState(next);cancel();publish(checked);},
 async submit(credentials:AdminSetupCredentials){if(dead||pending||state.status!=='idle'){credentials.password='';return;}const id=++revision,controller=new AbortController();pending=controller;activeCredentials=credentials;publish({status:'submitting'});
 try{const result=await options.onSubmit(credentials,{signal:controller.signal});if(dead||id!==revision)return;publish(result==='rejected'?{status:'idle',rejected:true}:{status:result==='complete'||result==='unavailable'?result:'unconfirmed'});}
 catch{if(!dead&&id===revision)publish({status:'unconfirmed'});}
 finally{credentials.password='';if(id===revision){pending=undefined;activeCredentials=undefined;}}
 },suspend(){if(dead)return;const busy=state.status==='submitting';cancel();if(busy)publish({status:'unconfirmed'});},destroy(){if(dead)return;dead=true;cancel();listeners.clear();}});
}
