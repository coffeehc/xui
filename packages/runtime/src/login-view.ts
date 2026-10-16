import {resolveLoginPageConfig,runLoginPageExtension,type AuthClient,type AuthUser,type LoginCredentials,type LoginPageConfig,type LoginPageExtensions,type LoginPageAction} from './auth.js';
import {createPasswordInputController,type PasswordInputController} from './display.js';
export interface LoginViewOptions {auth:AuthClient;config:LoginPageConfig;extensions?:LoginPageExtensions;onAuthenticated?:(user:Readonly<AuthUser>,returnTo:string)=>void|Promise<void>}
/** Readers are bound only while a View exists. No credential is retained in the model. */
export interface LoginViewBinding {readCredentials:()=>LoginCredentials;clearPassword:()=>void;focus:(target:'username'|'password'|'feedback')=>void;navigate:(returnTo:string)=>void}
export interface LoginViewState {config:ReturnType<typeof resolveLoginPageConfig>;errors:Readonly<{username?:string;password?:string}>;operation:'session'|'login'|'extension'|null;extensionBusy:string|null;extensionError:boolean;navigationPhase:'idle'|'opening'|'failed';sessionFailed:boolean}
export interface LoginViewController {
 readonly auth:AuthClient;readonly password:PasswordInputController;
 getState:()=>Readonly<LoginViewState>;subscribe:(listener:()=>void)=>()=>void;
 getExtensions:()=>LoginPageExtensions|undefined;
 bind:(binding:LoginViewBinding)=>()=>void;submit:()=>Promise<void>;checkSession:()=>Promise<void>;runAction:(id:string)=>Promise<void>;retryNavigation:()=>Promise<void>;
 clearFieldError:(field:'username'|'password')=>void;pause:()=>void;resume:()=>void;
 update:(options:Partial<Omit<LoginViewOptions,'auth'>>)=>void;destroy:()=>void;
}
/** Login presentation orchestrates the existing AuthClient. It never creates or destroys auth. */
export function createLoginViewController(initial:LoginViewOptions):LoginViewController {
 const auth=initial.auth,password=createPasswordInputController(),listeners=new Set<()=>void>();let options={...initial},binding:LoginViewBinding|undefined,off:(()=>void)|undefined,dead=false,active=false,revision=0,navigationRevision=0,pending:AbortController|undefined,navigatedId:string|null=null;
 let state:Readonly<LoginViewState>=Object.freeze({config:resolveLoginPageConfig(options.config),errors:Object.freeze({}),operation:null,extensionBusy:null,extensionError:false,navigationPhase:'idle',sessionFailed:false});
 const emit=(patch:Partial<LoginViewState>)=>{if(dead)return;state=Object.freeze({...state,...patch});for(const listener of [...listeners])if(listeners.has(listener))listener();};
 const clear=()=>{password.markCleared();binding?.clearPassword();};
 const focus=(target:'username'|'password'|'feedback',epoch=revision)=>queueMicrotask(()=>{if(!dead&&active&&epoch===revision)binding?.focus(target);});
 const navigate=async(retry=false)=>{const current=auth.getState(),user=current.user;if(dead||!active||!binding||current.status!=='authenticated'||!user||current.busy||pending||state.sessionFailed||navigatedId===user.id&&(!retry||state.navigationPhase!=='failed'))return;navigatedId=user.id;const epoch=++navigationRevision;emit({navigationPhase:'opening'});clear();try{if(options.onAuthenticated)await options.onAuthenticated(user,state.config.returnTo);else binding.navigate(state.config.returnTo);}catch{if(!dead&&active&&epoch===navigationRevision&&auth.getState().status==='authenticated'&&auth.getState().user?.id===user.id){emit({navigationPhase:'failed'});focus('feedback');}}};
 const run=async(operation:'session'|'login'|'extension',action?:LoginPageAction)=>{
  if(dead||!active||!binding||pending)return;const current=auth.getState();if(operation!=='session'&&(current.busy||current.status==='authenticated'))return;
  const epoch=++revision,abort=new AbortController();pending=abort;emit({operation,extensionError:false,sessionFailed:false});let extension=false;
  try {
   const hook=operation==='extension'?action?.run:operation==='login'?options.extensions?.beforeSubmit:undefined;
   if(hook){extension=true;emit({extensionBusy:operation==='extension'?action!.label:state.config.labels.signingIn});let credentials=binding.readCredentials();const username=credentials.username;credentials.password='';await runLoginPageExtension(hook,{username,signal:abort.signal});if(dead||!active||epoch!==revision||abort.signal.aborted)return;emit({extensionBusy:null});extension=false;}
   if(operation==='extension')return;
   if(operation==='login'){
    // Acquire the secret after extension awaits, hand it straight to auth, and
    // clear both the temporary object and DOM before awaiting the auth result.
    const credentials=binding.readCredentials();let result:ReturnType<AuthClient['login']>;
    try{result=auth.login({username:credentials.username,password:credentials.password},{signal:abort.signal});}finally{credentials.password='';clear();}
    await result;
   }else{const user=await auth.currentUser({signal:abort.signal});if(auth.getState().status==='authenticated'&&auth.getState().user?.id!==user?.id)throw new Error('Session identity changed');}
  }catch{if(!dead&&active&&epoch===revision&&!abort.signal.aborted){emit(operation==='session'?{sessionFailed:true}:{extensionError:extension||!auth.getState().error});focus('feedback',epoch);}}
  finally{if(epoch===revision&&pending===abort){pending=undefined;if(!dead)emit({operation:null,extensionBusy:null});clear();if(!dead&&active)void navigate();}}
 };
 const observe=()=>{const current=auth.getState();if(current.status==='authenticated'||current.error)clear();if(current.status==='anonymous'||current.busy==='login'||current.busy==='logout'){if(navigatedId){navigatedId=null;navigationRevision++;emit({navigationPhase:'idle'});}}if(!current.busy&&state.operation===null)void navigate();};
 const pause=()=>{active=false;revision++;navigationRevision++;pending?.abort();pending=undefined;emit({operation:null,extensionBusy:null});clear();};
 const resume=()=>{if(dead||!binding)return;active=true;navigatedId=null;emit({navigationPhase:'idle'});const current=auth.getState();if(current.busy==='session'||current.busy==='refresh'||current.status==='unknown'&&!current.busy&&!current.error)void run('session');else observe();};
 return {auth,password,getState:()=>state,getExtensions:()=>options.extensions,subscribe(listener){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
  bind(next){if(dead)return()=>{};if(binding)pause();off?.();binding=next;off=auth.subscribe(observe);resume();return()=>{if(binding!==next)return;pause();off?.();off=undefined;binding=undefined;};},
  async submit(){if(dead||!active||!binding||pending||auth.getState().busy||auth.getState().status==='authenticated')return;const credentials=binding.readCredentials(),errors={username:credentials.username.trim()?undefined:state.config.labels.usernameRequired,password:credentials.password?undefined:state.config.labels.passwordRequired};credentials.password='';emit({errors:Object.freeze(errors)});if(errors.username||errors.password){focus(errors.username?'username':'password');return;}await run('login');},
  checkSession:()=>run('session'),runAction:async(id)=>{const action=options.extensions?.actions?.find(action=>action.id===id);if(!action||action.disabled)return;clear();await run('extension',action);},retryNavigation:()=>navigate(true),
  clearFieldError(field){if(state.errors[field])emit({errors:Object.freeze({...state.errors,[field]:undefined})});},pause,resume,
  update(next){if(dead)return;options={...options,...next};if(next.config)emit({config:resolveLoginPageConfig(next.config)});},
  destroy(){if(dead)return;pause();dead=true;off?.();binding=undefined;password.destroy();listeners.clear();options={auth,config:initial.config};},
 };
}
