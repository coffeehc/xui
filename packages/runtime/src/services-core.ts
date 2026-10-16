import type {HttpClient,HttpClientOptions} from './http-service.js';
import type {AuthClient,AuthClientOptions} from './auth-service.js';
import type {ThemeController,ThemeOptions} from './theme-service.js';
import type {ClipboardServiceOptions,SharedClipboardService} from './clipboard-service.js';
import type {RouteService,RouteServiceOptions} from './route-core.js';
import type {I18nService} from './i18n-core.js';
import type {MenuService} from './menu-service-core.js';
import type {DownloadService} from './download-service.js';
import type {UploadService} from './upload-service.js';
import type {XuiConfigOverrides,ConfigReadonly,XuiConfig,ConfigService} from './config.js';
import {states,windows,newRegistryState,browserState,assertLive,disposeState,sameValue,type Entry,type RegistryState} from './service-state.js';
import {resolveService} from './service-resolvers.js';
import {inspectHttp} from './http-auth-internal.js';
/** Supply either a borrowed instance or options for one registry-owned service. */
export type ServiceInput<T,O> = {instance:T;options?:never}|{options:O;instance?:never};
export type AuthServiceOptions = Omit<AuthClientOptions,'http'>;
export interface XuiServicesOptions {
  http?:ServiceInput<HttpClient,HttpClientOptions>;
  auth?:ServiceInput<AuthClient,AuthServiceOptions>;
  theme?:ServiceInput<ThemeController,ThemeOptions>;
  clipboard?:ServiceInput<SharedClipboardService,ClipboardServiceOptions>;
  route?:ServiceInput<RouteService,RouteServiceOptions>;
  /** Borrow an existing application language/menu owner by its narrow public contract. */
  i18n?:{instance:I18nService};
  menu?:{instance:MenuService};
}
/** Runtime-only environment. Keep Window and injected objects out of serializable config.json. */
export interface XuiServicesEnvironment {window?:Window;config?:XuiConfigOverrides}

const slotNames=['http','auth','theme','clipboard','route','i18n','menu'] as const;
function sameInput<T,O>(left:ServiceInput<T,O>|undefined,right:ServiceInput<T,O>):boolean{
  if(!left)return false;
  const leftInstance=Object.hasOwn(left,'instance'),rightInstance=Object.hasOwn(right,'instance');
  return leftInstance===rightInstance&&(leftInstance?left.instance===right.instance:sameValue(left.options,right.options));
}
function validateInput(value:unknown,name:string):asserts value is ServiceInput<unknown,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError(`Invalid ${name} service input`);
  const hasInstance=Object.hasOwn(value,'instance'),hasOptions=Object.hasOwn(value,'options');
  if(hasInstance===hasOptions||Reflect.ownKeys(value).length!==1)throw new TypeError(`Provide exactly one ${name} service instance or options`);
  const field=Object.getOwnPropertyDescriptor(value,hasInstance?'instance':'options');if(!field||!('value'in field)||field.value===undefined)throw new TypeError(`Invalid ${name} service input`);
}
function stateOf(services:XuiServices){const state=states.get(services);if(!state)throw new TypeError('Invalid XuiServices instance');assertLive(state);return state;}
/** Explicitly borrowed transports must be bound before their original reference can send.
 * This creates no IO; an unimported auth module fails configuration rather than leaking a write. */
function bindBorrowedHttp(state:RegistryState){
 if(!state.http.value||state.http.owned||!state.auth.input)return;
 resolveService('auth',state);
 if(!inspectHttp(state.http.value)?.binding)throw new TypeError('Configured auth must bind the same shared xui HTTP client');
}
/** One isolated infrastructure owner; injected instances remain borrowed. */
export class XuiServices {
 constructor(options:XuiServicesOptions={},environment:XuiServicesEnvironment={}){
  const state=newRegistryState(environment.window,environment.config);
  for(const name of slotNames){const input=options[name];if(input===undefined)continue;validateInput(input,name);const entry=state[name] as Entry<unknown,unknown>;entry.input=input as ServiceInput<unknown,unknown>;if(Object.hasOwn(input,'instance'))entry.value=(input as {instance:unknown}).instance;}
  states.set(this,state);try{bindBorrowedHttp(state);}catch(error){disposeState(state);throw error;}
 }
 getHttpService():HttpClient{return resolveService<HttpClient>('http',stateOf(this));}
 getAuthService():AuthClient{return resolveService<AuthClient>('auth',stateOf(this));}
 getThemeService(win?:Window):ThemeController{return resolveService<ThemeController>('theme',stateOf(this),win);}
 getClipboardService():SharedClipboardService{return resolveService<SharedClipboardService>('clipboard',stateOf(this));}
 getConfigService():ConfigService{return resolveService<ConfigService>('config',stateOf(this));}
 getRouteService():RouteService{return resolveService<RouteService>('route',stateOf(this));}
 getI18nService():I18nService{return resolveService<I18nService>('i18n',stateOf(this));}
 getMenuService():MenuService{return resolveService<MenuService>('menu',stateOf(this));}
 getDownloadService():DownloadService{return resolveService<DownloadService>('download',stateOf(this));}
 getUploadService():UploadService{return resolveService<UploadService>('upload',stateOf(this));}
 dispose(){const state=states.get(this);if(state)disposeState(state);}
}
function applyInput(state:RegistryState,name:typeof slotNames[number],input:ServiceInput<unknown,unknown>,commit=true):void{
  validateInput(input,name);const entry=state[name] as Entry<unknown,unknown>;
  if(entry.input){if(sameInput(entry.input,input))return;throw new Error(`The ${name} service is already configured`);}
  const byInstance=Object.hasOwn(input,'instance');
  if(entry.value){
    if(byInstance&&entry.value===input.instance){if(commit)entry.input=input;return;}
    if(!byInstance&&entry.resolvedOptions!==undefined&&sameValue(entry.resolvedOptions,input.options)){if(commit)entry.input=input;return;}
    throw new Error(`The ${name} service was already materialized with different ownership or options`);
  }
  if(commit){entry.input=input;if(byInstance){entry.value=input.instance;entry.owned=false;}}
}

/** Internal bootstrap hook: validate every addition before publishing any owner/config. */
export function installXuiServices(options:XuiServicesOptions={},win:Window|undefined=typeof window==='undefined'?undefined:window,config?:ConfigReadonly<XuiConfig>):XuiServices{
 if(!win)throw new Error('Install browser services with a Window; use new XuiServices() for isolated SSR');
 const state=browserState(win);const context=windows.get(win)!;
 if(config&&!sameValue(config,state.config)&&(state.configExplicit||state.configService||state.route.value||state.i18n.value||state.menu.value))throw new Error('Configuration was already consumed; bootstrap must run before application views');
 for(const name of slotNames){const input=options[name];if(input!==undefined)applyInput(state,name,input as ServiceInput<unknown,unknown>,false);}
 const previousConfig=state.config,previousExplicit=state.configExplicit,previous=slotNames.map(name=>({...state[name]}));
 try{
  if(config){if(!sameValue(config,state.config))state.config=config;state.configExplicit=true;}
  for(const name of slotNames){const input=options[name];if(input!==undefined)applyInput(state,name,input as ServiceInput<unknown,unknown>);}
  bindBorrowedHttp(state);
 }catch(error){
  // Only undo owners created by this installation; previously running and borrowed services survive.
  for(let index=0;index<slotNames.length;index++){
   const entry=state[slotNames[index]] as Entry<unknown,unknown>,before=previous[index];
   if(entry.owned&&entry.value!==before.value){const owner=entry.value as {destroy?:()=>void;dispose?:()=>void}|undefined;try{owner?.destroy?.();owner?.dispose?.();}catch{}}
   for(const key of ['input','value','resolvedOptions'] as const)delete entry[key];Object.assign(entry,before);
  }
  state.config=previousConfig;state.configExplicit=previousExplicit;throw error;
 }
 if(!context.owner){const owner=new XuiServices();states.set(owner,state);context.owner=owner;}
 return context.owner;
}
export function disposeXuiServices(win:Window|undefined=typeof window==='undefined'?undefined:window):void{if(!win)return;const context=windows.get(win);if(!context)return;windows.delete(win);disposeState(context.state);}
