import * as React from 'react';
import {getMenuService,type MenuService,type MenuServiceState} from '@coffeehc/xui-runtime/menu-service';
import {getI18nService,type I18nService} from '@coffeehc/xui-runtime/i18n';
/** Optional explicit owner for SSR/embedded apps. Views never dispose borrowed application services. */
const ServicesContext=React.createContext<{menu?:MenuService;i18n?:I18nService}>({});
const serverLanguage=Object.freeze({enabled:false,locale:'zh-CN',revision:0});
const noSubscribe=()=>()=>{};
const serverSnapshot=()=>serverLanguage;
const noLocales=Object.freeze([]);
const untranslated=(key:string,_params?:Readonly<Record<string,string|number>>,fallback?:string)=>fallback??key;
const noSwitch=()=>false;
export function ServicesProvider({menu,i18n,children}:{menu?:MenuService;i18n?:I18nService;children:React.ReactNode}){const value=React.useMemo(()=>({menu,i18n}),[menu,i18n]);return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;}
/** Borrow the existing provider/application language owner; never create a page-specific owner. */
export function useI18nService():I18nService|undefined{return React.useContext(ServicesContext).i18n??(typeof window==='undefined'?undefined:getI18nService());}
export function useI18n(){const service=useI18nService();const state=React.useSyncExternalStore(service?.subscribe??noSubscribe,service?.getState??serverSnapshot,service?.getState??serverSnapshot);return React.useMemo(()=>({...state,locales:service?.locales??noLocales,t:service?.t??untranslated,setLocale:service?.setLocale??noSwitch}),[state,service]);}
export function useMenu():Readonly<MenuServiceState>{const service=React.useContext(ServicesContext).menu??getMenuService();return React.useSyncExternalStore(service.subscribe,service.getState,service.getState);}
