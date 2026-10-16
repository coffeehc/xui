import {resolveConfig,type XuiConfigOverrides,type ConfigReadonly,type XuiConfig,type ConfigService} from './config.js';
import type {HttpClient,HttpClientOptions} from './http-service.js';
import type {AuthClient} from './auth-service.js';
import type {ThemeController,ThemeOptions} from './theme-service.js';
import type {SharedClipboardService,ClipboardServiceOptions} from './clipboard-service.js';
import type {RouteService,RouteServiceOptions} from './route-core.js';
import type {I18nService} from './i18n-core.js';
import type {MenuService} from './menu-service-core.js';
import type {DownloadService} from './download-service.js';
import type {ServiceInput,AuthServiceOptions,XuiServices} from './services-core.js';
export type Entry<T,O>={input?:ServiceInput<T,O>;value?:T;owned:boolean;resolvedOptions?:O;};
export interface RegistryState {
  disposed:boolean;window?:Window;
  http:Entry<HttpClient,HttpClientOptions>;
  auth:Entry<AuthClient,AuthServiceOptions>;
  theme:Entry<ThemeController,ThemeOptions>;
  clipboard:Entry<SharedClipboardService,ClipboardServiceOptions>;
  route:Entry<RouteService,RouteServiceOptions>;
  i18n:Entry<I18nService,never>;
  menu:Entry<MenuService,never>;
  config:ConfigReadonly<XuiConfig>;configService?:ConfigService;configExplicit:boolean;
  download?:DownloadService;
}

export const states=new WeakMap<XuiServices,RegistryState>();
export const windows=new WeakMap<Window,{state:RegistryState;owner?:XuiServices}>();
export function newRegistryState(win?:Window,config?:XuiConfigOverrides):RegistryState{return {disposed:false,window:win,http:{owned:false},auth:{owned:false},theme:{owned:false},clipboard:{owned:false},route:{owned:false},i18n:{owned:false},menu:{owned:false},config:resolveConfig(config),configExplicit:config!==undefined};}
export function assertLive(state:RegistryState){if(state.disposed)throw new Error('Xui services are disposed');}
export function browserState(win:Window|undefined=typeof window==='undefined'?undefined:window):RegistryState{if(!win)throw new Error('Use an explicit XuiServices container outside a browser Window');let context=windows.get(win);if(!context){context={state:newRegistryState(win)};windows.set(win,context);}assertLive(context.state);return context.state;}
export function optionsFor<T,O>(entry:Entry<T,O>):O|undefined{return entry.input&&Object.hasOwn(entry.input,'options')?entry.input.options:undefined;}
export function disposeState(state:RegistryState){if(state.disposed)return;state.disposed=true;for(const name of ['menu','i18n','route','auth','clipboard','theme','http'] as const){const entry=state[name];if(entry.owned&&entry.value){const owner=entry.value as unknown as {destroy?:()=>void;dispose?:()=>void};try{if(owner.destroy)owner.destroy();else owner.dispose?.();}catch{/* Complete remaining owned cleanup. */}}}const win=state.theme.resolvedOptions?.window??state.window;if(win&&win.xuiTheme===state.theme.value&&state.theme.owned)delete win.xuiTheme;for(const name of ['menu','i18n','route','auth','clipboard','theme','http'] as const)state[name].value=undefined;state.download=undefined;}
function objectLike(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object';}
export function sameValue(left:unknown,right:unknown,seen=new WeakMap<object,object>()):boolean{
  if(Object.is(left,right))return true;
  if(!objectLike(left)||!objectLike(right))return false;
  const leftPrototype=Object.getPrototypeOf(left),rightPrototype=Object.getPrototypeOf(right);
  if(Array.isArray(left)!==Array.isArray(right)||leftPrototype!==rightPrototype||(!Array.isArray(left)&&leftPrototype!==Object.prototype&&leftPrototype!==null))return false;
  const prior=seen.get(left);if(prior)return prior===right;seen.set(left,right);
  const leftKeys=Reflect.ownKeys(left),rightKeys=Reflect.ownKeys(right);if(leftKeys.length!==rightKeys.length)return false;
  for(const key of leftKeys){if(!rightKeys.includes(key))return false;const a=Object.getOwnPropertyDescriptor(left,key),b=Object.getOwnPropertyDescriptor(right,key);if(!a||!b||!('value'in a)||!('value'in b)||!sameValue(a.value,b.value,seen))return false;}
  return true;
}
