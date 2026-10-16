import {createLoginViewController,type LoginViewController,type LoginViewOptions} from '@coffeehc/xui-runtime/login-view';
import {useOwnedController,type ControllerProps,assertControllerProps} from './controller.js';
import * as React from 'react';
import {resolveLoginPageConfig,getLoginPageError,runLoginPageExtension,type LoginPageExtensions,type LoginPageAction,type LoginPageConfig,type AuthPageConfig,type AuthClient,type AuthUser} from '@coffeehc/xui-runtime/auth';
import type {ThemeController} from '@coffeehc/xui-runtime/theme';
import {Button} from './button.js';
import {Field,Input} from './forms.js';
import {PasswordInput,type PasswordInputHandle} from './text-inputs.js';
import {Alert} from './feedback.js';
export type {AuthPageConfig,LoginPageConfig,LoginPageLayout,LoginPageLabels,AuthClient,AuthUser} from '@coffeehc/xui-runtime/auth';
export interface AuthPageProps {
  config:AuthPageConfig;
  /** Optional compact decoration below the external brand identity; inert and hidden on narrow screens. */
  brandVisual?:React.ReactNode;children?:React.ReactNode;
  actions?:React.ReactNode;alternatives?:React.ReactNode;feedback?:React.ReactNode;feedbackActions?:React.ReactNode;
  form?:{noValidate?:boolean;onSubmit?:React.FormEventHandler<HTMLFormElement>};
}
function hasAuthPageContent(value:React.ReactNode):boolean {
  return React.Children.toArray(value).some(child=>{
    if(typeof child==='string')return child.trim().length>0;
    if(!React.isValidElement<{hidden?:boolean;children?:React.ReactNode}>(child))return true;
    if(child.props.hidden)return false;
    return child.type===React.Fragment?hasAuthPageContent(child.props.children):true;
  });
}
/** Shared, request-free presentation for sign-in, setup and startup states. */
export function AuthPage({config:input,brandVisual,children,actions,alternatives,feedback,feedbackActions,form}:AuthPageProps){
  if(form!==undefined&&(form===null||typeof form!=='object'))throw new TypeError('Invalid authentication page form.');
  const config=React.useMemo(()=>{if(typeof input.title!=='string')throw new TypeError('AuthPage title is required.');return resolveLoginPageConfig(input);},[input]),titleId=React.useId(),formMode=React.useRef(form!==undefined);
  if(formMode.current!==(form!==undefined))throw new TypeError('AuthPage form mode cannot change after mounting.');
  const content=<><div className="xui-login-content">
    <div className="xui-login-body"><div className="xui-login-heading"><h1 id={titleId}>{config.title}</h1>{config.description&&<p className="xui-login-description">{config.description}</p>}</div>{children}</div>
    {hasAuthPageContent(actions)&&<footer className="xui-login-actions">{actions}</footer>}
    {hasAuthPageContent(alternatives)&&<div className="xui-login-options">{alternatives}</div>}
  </div>{(hasAuthPageContent(feedback)||hasAuthPageContent(feedbackActions))&&<div className="xui-login-support"><div className="xui-login-feedback">{feedback}{feedbackActions}</div></div>}</>;
  return <main className="xui xui-login-page" data-layout={config.layout}><div className="xui-login-layout">
    <header className="xui-login-brand">
      <div className="xui-login-identity">{config.logo&&<img className="xui-login-logo" src={config.logo.src} alt={config.logo.alt} referrerPolicy="no-referrer"/>}<strong>{config.productName}</strong></div>
      {brandVisual!=null&&<div className="xui-login-visual" aria-hidden="true" inert>{brandVisual}</div>}
    </header>
    <section className={`xui-login-card${config.layout==='card'?' xui-surface':''}`} aria-labelledby={titleId}>
    {form?<form className="xui-login-form" noValidate={form.noValidate} onSubmit={event=>{event.preventDefault();form.onSubmit?.(event);}}>{content}</form>:<section className="xui-login-form">{content}</section>}
  </section></div></main>;
}
export type ConfigurableLoginPageProps={theme:ThemeController;brandVisual?:React.ReactNode;beforeFields?:React.ReactNode;afterFields?:React.ReactNode}&ControllerProps<LoginViewController,LoginViewOptions>;
export function ConfigurableLoginPage({controller:injected,auth:borrowed,config:input,onAuthenticated,extensions:defaultExtensions,beforeFields,afterFields,brandVisual}:ConfigurableLoginPageProps){
  assertControllerProps(injected,{auth:borrowed,config:input,onAuthenticated,extensions:defaultExtensions},['auth','config','onAuthenticated','extensions']);
  const controller=useOwnedController(injected,()=>createLoginViewController({auth:borrowed!,config:input!,onAuthenticated,extensions:defaultExtensions}),borrowed);
  const view=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState),auth=controller.auth,state=React.useSyncExternalStore(auth.subscribe,auth.getState,auth.getState),config=view.config,{labels}=config,extensions=controller.getExtensions();
  const {errors,operation:viewOperation,extensionBusy,extensionError,navigationPhase}=view,sessionFailed=view.sessionFailed;
  const username=React.useRef<HTMLInputElement>(null),password=React.useRef<HTMLInputElement|null>(null),passwordControl=React.useRef<PasswordInputHandle>(null),submit=React.useRef<HTMLButtonElement>(null),feedback=React.useRef<HTMLDivElement>(null);
  const clearPassword=()=>{if(passwordControl.current)passwordControl.current.clear();else if(password.current){password.current.value='';password.current.defaultValue='';password.current.textContent='';}};
  const passwordRef=React.useCallback((element:HTMLInputElement|null)=>{const previous=password.current;if(previous&&previous!==element){previous.value='';previous.defaultValue='';previous.textContent='';}password.current=element;},[]);
  React.useLayoutEffect(()=>{if(!injected)controller.update({config:input!,onAuthenticated,extensions:defaultExtensions});},[controller,injected,input,onAuthenticated,defaultExtensions]);
  React.useEffect(()=>{
   const release=controller.bind({readCredentials:()=>({username:username.current?.value??'',password:password.current?.value??''}),clearPassword,focus:target=>(target==='feedback'?feedback:target==='username'?username:password).current?.focus(),navigate:returnTo=>{const target=new URL(returnTo,window.location.href);if(target.pathname===window.location.pathname&&target.search===window.location.search)throw new Error('The target is the current page');window.location.assign(returnTo);}});
   const pause=()=>controller.pause(),resume=(event:PageTransitionEvent)=>{if(event.persisted)controller.resume();};
   window.addEventListener('pagehide',pause);window.addEventListener('pageshow',resume);
   return()=>{release();clearPassword();window.removeEventListener('pagehide',pause);window.removeEventListener('pageshow',resume);};
  },[controller]);
  const authenticated=state.status==='authenticated',busy=!!state.busy||viewOperation!==null||extensionBusy!==null||authenticated&&!sessionFailed&&navigationPhase!=='failed',locked=busy||authenticated;
  const canCheck=!busy&&(sessionFailed&&!state.error||!authenticated&&state.error?.metadata.endpointId==='auth.session'&&(state.error.kind==='network'||state.error.kind==='timeout'||state.error.kind==='http'&&(state.error.status??0)>=500));
  const navigating=authenticated&&!state.busy&&viewOperation===null&&!sessionFailed,navigationFailed=navigating&&navigationPhase==='failed';
  const message=navigationFailed?labels.navigationError:navigating?labels.opening:extensionBusy??(state.error?getLoginPageError(state.error,labels):sessionFailed?labels.error:labels[viewOperation==='session'||state.busy==='session'||state.busy==='refresh'?'checking':'signingIn']);
  const submitLabel=navigating?labels.opening:state.busy==='login'||viewOperation==='login'?labels.signingIn:labels.submit;
  const feedbackIsError=navigationFailed||extensionError||sessionFailed||!!state.error&&state.error.kind!=='cancel';
  const statusInSubmit=busy&&!feedbackIsError&&message===submitLabel;
  // A new label starts in view; unrelated renders preserve deliberate label scrolling.
  React.useLayoutEffect(()=>{if(submit.current)submit.current.scrollTop=0;},[submitLabel]);
  return <AuthPage config={config} brandVisual={brandVisual}
    form={{noValidate:true,onSubmit:event=>{event.preventDefault();void controller.submit();}}}
    actions={<><Button ref={submit} className="xui-login-submit" size="lg" data-idle-label={labels.submit} data-busy-label={labels.signingIn} type="submit" disabled={locked} aria-busy={busy}><span>{submitLabel}</span><span className="xui-login-opening-reservation" aria-hidden="true">{labels.opening}</span></Button><span className="xui-login-announcement" role={statusInSubmit?'status':undefined} aria-live="polite" aria-atomic="true">{statusInSubmit?submitLabel:''}</span></>}
    alternatives={extensions?.actions?.length?extensions.actions.map(action=><Button key={action.id} variant="outline" disabled={locked||action.disabled} onClick={()=>{void controller.runAction(action.id);}}>{action.label}</Button>):undefined}
    feedback={!statusInSubmit&&(state.error||state.busy||viewOperation||extensionBusy||extensionError||sessionFailed||authenticated)?<Alert ref={feedback} tabIndex={-1} tone={feedbackIsError?'error':'info'}>{extensionError?(extensions?.errorLabel??'登录配置或认证方式暂不可用，请检查后重试。'):message}</Alert>:undefined}
    feedbackActions={<>{canCheck&&<Button size="sm" variant="ghost" onClick={()=>controller.checkSession()}>{labels.checkSession}</Button>}{navigationFailed&&<Button size="sm" variant="ghost" onClick={()=>controller.retryNavigation()}>{labels.retryNavigation}</Button>}</>}
  >
    <div className="xui-stack">
      <fieldset className="xui-login-extension" disabled={locked}>{beforeFields}</fieldset>
      <Field label={labels.username} required error={errors.username}><Input ref={username} name="username" autoComplete="username" maxLength={128} disabled={locked} onChange={()=>controller.clearFieldError('username')}/></Field>
      <Field label={labels.password} required error={errors.password}><PasswordInput controller={controller.password} ref={passwordRef} controlRef={passwordControl} showLabel={labels.showPassword} hideLabel={labels.hidePassword} name="password" autoComplete="current-password" maxLength={4096} disabled={locked} onInput={()=>controller.clearFieldError('password')}/></Field>
      <fieldset className="xui-login-extension" disabled={locked}>{afterFields}</fieldset>
    </div>
  </AuthPage>;
}

export {createLoginViewController} from '@coffeehc/xui-runtime/login-view';
export type {LoginViewController,LoginViewOptions,LoginViewState,LoginViewBinding} from '@coffeehc/xui-runtime/login-view';
