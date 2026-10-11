import * as React from 'react';
import {resolveLoginPageConfig,getLoginPageError,type LoginPageConfig,type AuthClient,type AuthUser} from '@coffeehc/xui-runtime/auth';
import type {ThemeController} from '@coffeehc/xui-runtime/theme';
import {Button} from './button.js';
import {Field,Input,NativeSelect} from './forms.js';
import {Alert} from './feedback.js';
import {useTheme} from './theme.js';
export type {LoginPageConfig,LoginPageLabels,AuthClient,AuthUser} from '@coffeehc/xui-runtime/auth';
export interface ConfigurableLoginPageProps {auth:AuthClient;theme:ThemeController;config:LoginPageConfig;onAuthenticated?:(user:Readonly<AuthUser>,returnTo:string)=>void}
export function ConfigurableLoginPage({auth,theme,config:input,onAuthenticated}:ConfigurableLoginPageProps){
  const config=React.useMemo(()=>resolveLoginPageConfig(input),[input]),{labels}=config,state=React.useSyncExternalStore(auth.subscribe,auth.getState,auth.getState),appearance=useTheme(theme);
  const username=React.useRef<HTMLInputElement>(null),password=React.useRef<HTMLInputElement|null>(null),feedback=React.useRef<HTMLDivElement>(null),revision=React.useRef(0),pending=React.useRef<AbortController|undefined>(undefined),alive=React.useRef(true);
  const [errors,setErrors]=React.useState<{username?:string;password?:string}>({}),titleId=React.useId();
  const clearPassword=()=>{if(password.current){password.current.value='';password.current.defaultValue='';password.current.textContent='';}};
  const passwordRef=React.useCallback((element:HTMLInputElement|null)=>{const previous=password.current;if(previous&&previous!==element){previous.value='';previous.defaultValue='';previous.textContent='';}password.current=element;},[]);
  const navigate=(user:Readonly<AuthUser>)=>{if(!alive.current)return;if(onAuthenticated)onAuthenticated(user,config.returnTo);else window.location.assign(config.returnTo);};
  const run=async(operation:'session'|'login'|'logout',credentials?:{username:string;password:string})=>{
    const id=++revision.current;pending.current?.abort();const controller=new AbortController();pending.current=controller;
    try{if(operation==='login'){const user=await auth.login(credentials!,{signal:controller.signal});if(alive.current&&id===revision.current&&auth.getState().user===user)navigate(user);}else if(operation==='session')await auth.currentUser({signal:controller.signal});else await auth.logout({signal:controller.signal});}
    catch{if(alive.current&&id===revision.current&&!controller.signal.aborted)feedback.current?.focus();}
    finally{if(id===revision.current){pending.current=undefined;clearPassword();}}
  };
  React.useLayoutEffect(()=>auth.subscribe(()=>{const next=auth.getState();if(next.status==='authenticated'||next.error)clearPassword();}),[auth]);
  React.useEffect(()=>{alive.current=true;const release=()=>{revision.current++;pending.current?.abort();pending.current=undefined;clearPassword();};window.addEventListener('pagehide',release);if(auth.getState().status==='unknown'&&!auth.getState().busy)void run('session');return()=>{alive.current=false;release();window.removeEventListener('pagehide',release);};},[auth]);
  const authenticated=state.status==='authenticated',busy=!!state.busy;
  return <main className="xui xui-login-page"><section className="xui-login-card xui-surface" aria-labelledby={titleId}><header className="xui-login-brand">{config.logo&&<img className="xui-login-logo" src={config.logo.src} alt={config.logo.alt} referrerPolicy="no-referrer"/>}<strong>{config.productName}</strong><Field className="xui-login-theme" label={labels.theme}><NativeSelect value={appearance.mode} onChange={event=>theme.setMode(event.target.value as 'light'|'dark'|'system')}>{(['light','dark','system'] as const).map(mode=><option key={mode} value={mode}>{labels[mode]}</option>)}</NativeSelect></Field></header>
    <form className="xui-login-form" noValidate onSubmit={event=>{event.preventDefault();if(auth.getState().busy)return;const credentials={username:username.current?.value??'',password:password.current?.value??''},next={username:credentials.username.trim()?undefined:labels.usernameRequired,password:credentials.password?undefined:labels.passwordRequired};setErrors(next);if(next.username||next.password){(next.username?username:password).current?.focus();return;}clearPassword();void run('login',credentials);}}>
    <div className="xui-login-body"><h1 id={titleId}>{config.title}</h1>{config.description&&<p className="xui-login-description">{config.description}</p>}{!authenticated&&<div className="xui-stack"><Field label={labels.username} required error={errors.username}><Input ref={username} name="username" autoComplete="username" maxLength={128} disabled={busy} onChange={()=>setErrors(current=>({...current,username:undefined}))}/></Field><Field label={labels.password} required error={errors.password}><Input ref={passwordRef} name="password" type="password" autoComplete="current-password" maxLength={4096} disabled={busy} onChange={()=>setErrors(current=>({...current,password:undefined}))}/></Field></div>}{authenticated&&<p>{labels.signedIn}: {state.user!.display_name??state.user!.username}</p>}{(state.error||state.busy)&&<Alert ref={feedback} tabIndex={-1} tone={state.error&&state.error.kind!=='cancel'?'error':'info'}>{state.error?getLoginPageError(state.error,labels):labels[state.busy==='session'?'checking':state.busy==='login'?'signingIn':'signingOut']}</Alert>}</div>
    <footer className="xui-login-actions">{!authenticated&&<Button type="submit" disabled={busy}>{state.busy==='login'?labels.signingIn:labels.submit}</Button>}{busy&&<Button variant="outline" onClick={()=>{revision.current++;pending.current?.abort();pending.current=undefined;clearPassword();}}>{labels.cancel}</Button>}{!authenticated&&!busy&&(state.status!=='anonymous'||state.error)&&<Button variant="outline" onClick={()=>run('session')}>{labels.checkSession}</Button>}{authenticated&&<><Button disabled={busy} onClick={()=>navigate(state.user!)}>{labels.continue}</Button><Button variant="outline" disabled={busy} onClick={()=>{clearPassword();void run('logout');}}>{labels.logout}</Button></>}</footer></form>
  </section></main>;
}
