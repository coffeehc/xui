import * as React from 'react';
import {resolveLoginPageConfig,getLoginPageError,runLoginPageExtension,type LoginPageExtensions,type LoginPageAction,type LoginPageConfig,type AuthPageConfig,type AuthClient,type AuthUser} from '@coffeehc/xui-runtime/auth';
import type {ThemeController} from '@coffeehc/xui-runtime/theme';
import {Button} from './button.js';
import {Field,Input} from './forms.js';
import {Alert} from './feedback.js';
import {AlertDialog} from './alert-dialog.js';
export type {AuthPageConfig,LoginPageConfig,LoginPageLayout,LoginPageLabels,AuthClient,AuthUser} from '@coffeehc/xui-runtime/auth';
export interface AuthPageProps {
  config:AuthPageConfig;
  /** Optional compact decoration in the identity header; inert and hidden on narrow screens. */
  brandVisual?:React.ReactNode;children?:React.ReactNode;
  actions?:React.ReactNode;alternatives?:React.ReactNode;feedback?:React.ReactNode;feedbackActions?:React.ReactNode;
  form?:{noValidate?:boolean;onSubmit?:React.FormEventHandler<HTMLFormElement>};
}
/** Shared, request-free presentation for sign-in, setup and startup states. */
export function AuthPage({config:input,brandVisual,children,actions,alternatives,feedback,feedbackActions,form}:AuthPageProps){
  if(form!==undefined&&(form===null||typeof form!=='object'))throw new TypeError('Invalid authentication page form.');
  const config=React.useMemo(()=>{if(typeof input.title!=='string')throw new TypeError('AuthPage title is required.');return resolveLoginPageConfig(input);},[input]),titleId=React.useId(),formMode=React.useRef(form!==undefined);
  if(formMode.current!==(form!==undefined))throw new TypeError('AuthPage form mode cannot change after mounting.');
  const content=<><div className="xui-login-content">
    <div className="xui-login-body"><div className="xui-login-heading"><h1 id={titleId}>{config.title}</h1>{config.description&&<p className="xui-login-description">{config.description}</p>}</div>{children}</div>
    {actions!=null&&<footer className="xui-login-actions">{actions}</footer>}
    {alternatives!=null&&<div className="xui-login-options">{alternatives}</div>}
  </div><div className="xui-login-support"><div className="xui-login-feedback">{feedback}{feedbackActions}</div></div></>;
  return <main className="xui xui-login-page" data-layout={config.layout}><section className={`xui-login-card${config.layout==='card'?' xui-surface':''}`} aria-labelledby={titleId}>
    <header className="xui-login-brand"><div className="xui-login-brand-content">
      <div className="xui-login-identity">{config.logo&&<img className="xui-login-logo" src={config.logo.src} alt={config.logo.alt} referrerPolicy="no-referrer"/>}<strong>{config.productName}</strong></div>
      {brandVisual!=null&&<div className="xui-login-visual" aria-hidden="true" inert>{brandVisual}</div>}
    </div></header>
    {form?<form className="xui-login-form" noValidate={form.noValidate} onSubmit={event=>{event.preventDefault();form.onSubmit?.(event);}}>{content}</form>:<section className="xui-login-form">{content}</section>}
  </section></main>;
}
export interface ConfigurableLoginPageProps {auth:AuthClient;theme:ThemeController;config:LoginPageConfig;brandVisual?:React.ReactNode;extensions?:LoginPageExtensions;beforeFields?:React.ReactNode;afterFields?:React.ReactNode;onAuthenticated?:(user:Readonly<AuthUser>,returnTo:string)=>void|Promise<void>}
export function ConfigurableLoginPage({auth,config:input,onAuthenticated,extensions,beforeFields,afterFields,brandVisual}:ConfigurableLoginPageProps){
  const config=React.useMemo(()=>resolveLoginPageConfig(input),[input]),{labels}=config,state=React.useSyncExternalStore(auth.subscribe,auth.getState,auth.getState);
  const username=React.useRef<HTMLInputElement>(null),password=React.useRef<HTMLInputElement|null>(null),submit=React.useRef<HTMLButtonElement>(null),feedback=React.useRef<HTMLDivElement>(null),revision=React.useRef(0),pending=React.useRef<AbortController|undefined>(undefined),alive=React.useRef(true),active=React.useRef(true);
  const sessionFailed=React.useRef(false),[viewOperation,setViewOperation]=React.useState<'session'|'login'|'extension'|null>(null);
  const [extensionBusy,setExtensionBusy]=React.useState<string|null>(null),[extensionError,setExtensionError]=React.useState(false),[navigationPhase,setNavigationPhase]=React.useState<'idle'|'opening'|'failed'>('idle');
  const navigation=React.useRef<{owner:AuthClient;user:Readonly<AuthUser>|null;revision:number;phase:'idle'|'opening'|'failed'}>({owner:auth,user:null,revision:0,phase:'idle'}),navigationOptions=React.useRef({onAuthenticated,returnTo:config.returnTo});navigationOptions.current={onAuthenticated,returnTo:config.returnTo};
  const [recoveryId,setRecoveryId]=React.useState<string|null>(null);
  const [errors,setErrors]=React.useState<{username?:string;password?:string}>({});
  const clearPassword=()=>{if(password.current){password.current.value='';password.current.defaultValue='';password.current.textContent='';}};
  const passwordRef=React.useCallback((element:HTMLInputElement|null)=>{const previous=password.current;if(previous&&previous!==element){previous.value='';previous.defaultValue='';previous.textContent='';}password.current=element;},[]);
  const openApplication=async(user:Readonly<AuthUser>,retry=false)=>{
    const current=auth.getState();if(navigation.current.owner!==auth||!alive.current||!active.current||current.status!=='authenticated'||current.user?.id!==user.id||current.reauthenticationRequired||current.busy||pending.current||sessionFailed.current)return;
    if(navigation.current.owner===auth&&navigation.current.user?.id===user.id&&(!retry||navigation.current.phase!=='failed'))return;
    const id=++navigation.current.revision;navigation.current.owner=auth;navigation.current.user=user;navigation.current.phase='opening';setNavigationPhase('opening');clearPassword();
    try{const options=navigationOptions.current;if(options.onAuthenticated)await options.onAuthenticated(user,options.returnTo);else{const target=new URL(options.returnTo,window.location.href);if(target.pathname===window.location.pathname&&target.search===window.location.search)throw new Error('The target is the current page');window.location.assign(options.returnTo);}}
    catch{if(alive.current&&active.current&&id===navigation.current.revision&&navigation.current.owner===auth&&(auth.getState().status==='authenticated'&&auth.getState().user?.id===user.id||!auth.getState().reauthenticationRequired&&auth.getState().status==='unknown'&&auth.getState().busy!=='login'&&auth.getState().busy!=='logout')){navigation.current.phase='failed';setNavigationPhase('failed');queueMicrotask(()=>{if(alive.current&&active.current&&id===navigation.current.revision)feedback.current?.focus();});}}
  };
  const run=async(operation:'session'|'login'|'extension',credentials?:{username:string;password:string},action?:LoginPageAction)=>{
    if(!alive.current||!active.current)return;const id=++revision.current;pending.current?.abort();const controller=new AbortController();pending.current=controller;sessionFailed.current=false;setViewOperation(operation);setExtensionError(false);let extensionPhase=false;
    try{if(operation==='extension'||operation==='login'&&extensions?.beforeSubmit){extensionPhase=true;setExtensionBusy(operation==='extension'?action!.label:labels.signingIn);await runLoginPageExtension(operation==='extension'?action!.run:extensions!.beforeSubmit!,{username:credentials?.username??username.current?.value??'',signal:controller.signal});if(!alive.current||!active.current||id!==revision.current||controller.signal.aborted)return;setExtensionBusy(null);extensionPhase=false;}if(operation==='extension')return;if(operation==='login')await auth.login(credentials!,{signal:controller.signal});else{const user=await auth.currentUser({signal:controller.signal});if(auth.getState().status==='authenticated'&&auth.getState().user?.id!==user?.id)throw new Error('Session identity changed');}}
    catch{if(alive.current&&active.current&&id===revision.current&&!controller.signal.aborted){if(operation==='session')sessionFailed.current=true;else if(extensionPhase||!auth.getState().error)setExtensionError(true);queueMicrotask(()=>{if(alive.current&&active.current&&id===revision.current)feedback.current?.focus();});}}
    finally{if(credentials)credentials.password='';if(id===revision.current&&pending.current===controller&&navigation.current.owner===auth){pending.current=undefined;if(alive.current){setExtensionBusy(null);setViewOperation(null);}clearPassword();}}
  };
  const runRecovery=async(resolve:boolean,id?:string)=>{
    if(!alive.current||!active.current||pending.current||auth.getState().busy)return;
    const revisionId=++revision.current,controller=new AbortController();pending.current=controller;setViewOperation('session');setExtensionError(false);setRecoveryId(null);clearPassword();
    try{if(resolve&&id)await auth.resolveRecovery?.(id,{signal:controller.signal});else await auth.inspectRecovery?.({signal:controller.signal});}
    catch{/* The shared auth owner retains the authoritative failure and gate. */}
    finally{if(alive.current&&active.current&&revisionId===revision.current){pending.current=undefined;setViewOperation(null);sessionFailed.current=false;queueMicrotask(()=>{if(alive.current&&active.current)(auth.getState().reauthenticationRequired?feedback.current:username.current)?.focus();});}}
  };
  React.useEffect(()=>{setRecoveryId(null);},[auth]);
  React.useLayoutEffect(()=>auth.subscribe(()=>{const next=auth.getState();if(next.status==='authenticated'||next.error)clearPassword();}),[auth]);
  React.useEffect(()=>{
    alive.current=true;active.current=true;
    if(navigation.current.owner!==auth){sessionFailed.current=false;setViewOperation(null);navigation.current={owner:auth,user:null,revision:navigation.current.revision+1,phase:'idle'};setNavigationPhase('idle');}
    const checkSession=()=>{const current=auth.getState();if(!current.reauthenticationRequired&&(current.busy==='session'||current.busy==='refresh'||current.status==='unknown'&&!current.busy&&!current.error))void run('session');};
    const release=()=>{active.current=false;revision.current++;navigation.current.revision++;pending.current?.abort();pending.current=undefined;if(alive.current){setExtensionBusy(null);setViewOperation(null);}clearPassword();};
    const resume=(event:PageTransitionEvent)=>{if(!event.persisted||!alive.current)return;active.current=true;navigation.current.revision++;navigation.current.user=null;navigation.current.phase='idle';setNavigationPhase('idle');const current=auth.getState();if(current.busy==='session'||current.busy==='refresh')checkSession();else{if(current.status==='authenticated'&&current.user&&!current.busy&&!current.reauthenticationRequired)void openApplication(current.user);}};
    window.addEventListener('pagehide',release);window.addEventListener('pageshow',resume);
    // Join an existing owner read on mount/effect replay; cancelling a view never cancels that shared read.
    checkSession();
    return()=>{alive.current=false;revision.current++;pending.current?.abort();pending.current=undefined;clearPassword();window.removeEventListener('pagehide',release);window.removeEventListener('pageshow',resume);};
  },[auth]);
  React.useEffect(()=>{
    if(state.status!=='authenticated'||!state.user||state.reauthenticationRequired){if(navigation.current.user&&(state.reauthenticationRequired||state.status==='anonymous'||state.busy==='login'||state.busy==='logout')){navigation.current.revision++;navigation.current.user=null;navigation.current.phase='idle';setNavigationPhase('idle');}return;}
    if(!state.busy&&viewOperation===null)void openApplication(state.user);
  },[auth,state.status,state.user,state.busy,state.reauthenticationRequired,viewOperation]);
  const authenticated=state.status==='authenticated',busy=!!state.busy||viewOperation!==null||extensionBusy!==null||authenticated&&!sessionFailed.current&&navigationPhase!=='failed',locked=busy||authenticated;
  const canCheck=!busy&&!state.reauthenticationRequired&&(sessionFailed.current&&!state.error||!authenticated&&state.error?.metadata.endpointId==='auth.session'&&(state.error.kind==='network'||state.error.kind==='timeout'||state.error.kind==='http'&&(state.error.status??0)>=500));
  const canRecover=state.reauthenticationRequired&&state.recovery?.canResolve&&!!auth.inspectRecovery&&!!auth.resolveRecovery;
  const navigating=authenticated&&!state.busy&&viewOperation===null&&!sessionFailed.current,navigationFailed=navigating&&navigationPhase==='failed';
  const message=navigationFailed?labels.navigationError:navigating?labels.opening:extensionBusy??(state.reauthenticationRequired&&!state.busy&&!viewOperation?labels.reauthenticate:state.error?getLoginPageError(state.error,labels):sessionFailed.current?labels.error:labels[viewOperation==='session'||state.busy==='session'||state.busy==='refresh'?'checking':'signingIn']);
  const submitLabel=navigating?labels.opening:state.busy==='login'||viewOperation==='login'?labels.signingIn:labels.submit;
  const feedbackIsError=state.reauthenticationRequired&&!busy||navigationFailed||extensionError||sessionFailed.current||!!state.error&&state.error.kind!=='cancel';
  const statusInSubmit=busy&&!feedbackIsError&&message===submitLabel;
  // A new label starts in view; unrelated renders preserve deliberate label scrolling.
  React.useLayoutEffect(()=>{if(submit.current)submit.current.scrollTop=0;},[submitLabel]);
  return <AuthPage config={config} brandVisual={brandVisual}
    form={{noValidate:true,onSubmit:event=>{event.preventDefault();if(auth.getState().status==='authenticated'||auth.getState().busy||pending.current||!active.current)return;const credentials={username:username.current?.value??'',password:password.current?.value??''},next={username:credentials.username.trim()?undefined:labels.usernameRequired,password:credentials.password?undefined:labels.passwordRequired};setErrors(next);if(next.username||next.password){(next.username?username:password).current?.focus();return;}clearPassword();void run('login',credentials);}}}
    actions={<><Button ref={submit} className="xui-login-submit" size="lg" data-idle-label={labels.submit} data-busy-label={labels.signingIn} type="submit" disabled={locked} aria-busy={busy}><span>{submitLabel}</span><span className="xui-login-opening-reservation" aria-hidden="true">{labels.opening}</span></Button><span className="xui-login-announcement" role={statusInSubmit?'status':undefined} aria-live="polite" aria-atomic="true">{statusInSubmit?submitLabel:''}</span></>}
    alternatives={extensions?.actions?.length?extensions.actions.map(action=><Button key={action.id} variant="outline" disabled={locked||action.disabled} onClick={()=>{if(pending.current||auth.getState().busy||auth.getState().status==='authenticated')return;clearPassword();void run('extension',undefined,action);}}>{action.label}</Button>):undefined}
    feedback={!statusInSubmit&&(state.reauthenticationRequired||state.error||state.busy||viewOperation||extensionBusy||extensionError||sessionFailed.current||authenticated)?<Alert ref={feedback} tabIndex={-1} tone={feedbackIsError?'error':'info'}>{extensionError?(extensions?.errorLabel??'登录配置或认证方式暂不可用，请检查后重试。'):message}</Alert>:undefined}
    feedbackActions={<>{canRecover&&<><Button size="sm" variant="ghost" disabled={busy} onClick={()=>void runRecovery(false)}>{labels.checkRecovery}</Button><Button size="sm" variant="outline" disabled={busy} onClick={()=>setRecoveryId(auth.getState().recovery?.operationId??null)}>{labels.terminateRecovery}</Button></>}<AlertDialog.Root open={!!recoveryId} onOpenChange={open=>{if(!open)setRecoveryId(null);}}><AlertDialog.Content><AlertDialog.Title>{labels.recoveryTitle}</AlertDialog.Title><AlertDialog.Description>{labels.recoveryDescription}</AlertDialog.Description><AlertDialog.Footer><Button variant="outline" onClick={()=>setRecoveryId(null)}>{labels.cancelRecovery}</Button><Button onClick={()=>{const id=recoveryId;if(id)void runRecovery(true,id);}}>{labels.confirmRecovery}</Button></AlertDialog.Footer></AlertDialog.Content></AlertDialog.Root>{canCheck&&<Button size="sm" variant="ghost" onClick={()=>run('session')}>{labels.checkSession}</Button>}{navigationFailed&&<Button size="sm" variant="ghost" onClick={()=>{const user=auth.getState().user;if(user)void openApplication(user,true);}}>{labels.retryNavigation}</Button>}</>}
  >
    <div className="xui-stack">
      <fieldset className="xui-login-extension" disabled={locked}>{beforeFields}</fieldset>
      <Field label={labels.username} required error={errors.username}><Input ref={username} name="username" autoComplete="username" maxLength={128} disabled={locked} onChange={()=>setErrors(current=>({...current,username:undefined}))}/></Field>
      <Field label={labels.password} required error={errors.password}><Input ref={passwordRef} name="password" type="password" autoComplete="current-password" maxLength={4096} disabled={locked} onChange={()=>setErrors(current=>({...current,password:undefined}))}/></Field>
      <fieldset className="xui-login-extension" disabled={locked}>{afterFields}</fieldset>
    </div>
  </AuthPage>;
}
