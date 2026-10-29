import type {ConfigReadonly,XuiConfig} from './config.js';
import {readI18nLocale,defaultI18nStorageKey} from './i18n-preference.js';
export interface I18nState {enabled:boolean;locale:string;revision:number}
/** Shared UI language and plain-text catalog. No business timezone or HTML rendering. */
export interface I18nService {
  getState:()=>Readonly<I18nState>;
  subscribe:(listener:()=>void)=>()=>void;
  readonly locales:ConfigReadonly<XuiConfig['i18n']['locales']>;
  /** Returns false for disabled switching or unsupported locales. Same locale is a no-op. Enabled persisted changes write the configured localStorage key; storage failure keeps the in-memory choice. */
  setLocale:(locale:string)=>boolean;
  /** Current catalog, fallback catalog, explicit fallback, then key. Interpolation is plain text. */
  t:(key:string,params?:Readonly<Record<string,string|number>>,fallback?:string)=>string;
  /** Register a lazy feature catalog. Existing keys are replaced explicitly; inputs are copied. */
  registerMessages:(locale:string,messages:Readonly<Record<string,string>>)=>void;
}
export interface OwnedI18nService extends I18nService {dispose:()=>void}
export function buildI18nService(config:ConfigReadonly<XuiConfig['i18n']>,win?:Window|null):OwnedI18nService {
  let state:Readonly<I18nState>=Object.freeze({enabled:config.enabled,locale:readI18nLocale(config,win),revision:0}),dead=false;
  const listeners=new Set<()=>void>(),catalogs=new Map(Object.entries(config.messages).map(([locale,messages])=>[locale,{...messages}]));
  const known=(locale:string)=>config.locales.some(option=>option.value===locale);
  const publish=()=>{for(const listener of [...listeners])if(listeners.has(listener))try{listener();}catch{/* Observers do not own the language transition. */}};
  const apply=(locale:string)=>{if(dead||locale===state.locale)return;state=Object.freeze({...state,locale,revision:state.revision+1});if(win)win.document.documentElement.lang=locale;publish();};
  const storageKey=config.storageKey??defaultI18nStorageKey,persist=config.enabled&&config.persist!==false;
  const onStorage=(event:StorageEvent)=>{if(!persist||event.key!==storageKey&&event.key!==null)return;try{if(event.storageArea!==win?.localStorage)return;}catch{return;}const locale=event.newValue??config.defaultLocale;if(known(locale))apply(locale);};
  if(persist)win?.addEventListener?.('storage',onStorage);
  if(win)win.document.documentElement.lang=state.locale;
  return Object.freeze({getState:()=>state,locales:config.locales,subscribe(listener:()=>void){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
    setLocale(locale:string){if(dead||!known(locale)||!state.enabled&&locale!==state.locale)return false;if(locale===state.locale)return true;if(persist)try{win?.localStorage.setItem(storageKey,locale);}catch{/* Keep the in-memory choice usable. */}apply(locale);return true;},
    t(key:string,params:Readonly<Record<string,string|number>>={},fallback?:string){
      const current=catalogs.get(state.locale),other=catalogs.get(config.fallbackLocale);
      const message=current&&Object.hasOwn(current,key)?current[key]:other&&Object.hasOwn(other,key)?other[key]:fallback??key;
      return message.replace(/\{([\w.-]+)\}/g,(original,name:string)=>Object.hasOwn(params,name)?String(params[name]):original);
    },
    registerMessages(locale:string,messages:Readonly<Record<string,string>>){if(dead)return;if(!known(locale)||!messages||typeof messages!=='object'||Array.isArray(messages)||![Object.prototype,null].includes(Object.getPrototypeOf(messages)))throw new TypeError('Invalid language catalog');const entries=Object.entries(Object.getOwnPropertyDescriptors(messages));if(entries.some(([,field])=>!('value'in field)||typeof field.value!=='string'))throw new TypeError('Language messages must be plain strings');const next={...catalogs.get(locale)};for(const [key,field] of entries)Object.defineProperty(next,key,{value:field.value,enumerable:true,writable:true,configurable:true});catalogs.set(locale,next);state=Object.freeze({...state,revision:state.revision+1});publish();},
    dispose(){dead=true;if(persist)win?.removeEventListener?.('storage',onStorage);listeners.clear();catalogs.clear();},
  });
}
