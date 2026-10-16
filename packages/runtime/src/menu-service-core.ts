import {resolveConfig,type ConfigReadonly,type XuiConfig,type ConfigMenuItem} from './config-core.js';
import type {I18nService} from './i18n-core.js';
export interface MenuServiceState {label:string;items:readonly ConfigReadonly<ConfigMenuItem>[]}
/** Navigation content only. Permissions are projected by the host; view expansion/focus belongs to its controller. */
export interface MenuService {
  getState:()=>Readonly<MenuServiceState>;
  subscribe:(listener:()=>void)=>()=>void;
  /** Replace application navigation after an explicit host decision, without fetching or navigating. */
  setItems:(items:readonly ConfigMenuItem[])=>void;
}
export interface OwnedMenuService extends MenuService {dispose:()=>void}
export function buildMenuService(config:ConfigReadonly<XuiConfig['menu']>,i18n:I18nService):OwnedMenuService {
  let items=config.items,revision=-1,dead=false,state:Readonly<MenuServiceState>,off:(()=>void)|undefined;
  const listeners=new Set<()=>void>();
  const translate=(entries:readonly ConfigReadonly<ConfigMenuItem>[]):readonly ConfigReadonly<ConfigMenuItem>[]=>Object.freeze(entries.map(item=>Object.freeze({...item,label:item.labelKey?i18n.t(item.labelKey,{},item.label):item.label,...(item.children?{children:translate(item.children)}:{})})));
  const getState=()=>{const next=i18n.getState().revision;if(!state||revision!==next){revision=next;state=Object.freeze({label:config.labelKey?i18n.t(config.labelKey,{},config.label):config.label,items:translate(items)});}return state;};
  const publish=()=>{getState();for(const listener of [...listeners])if(listeners.has(listener))try{listener();}catch{/* A view cannot interrupt other menu consumers. */}};
  return Object.freeze({getState,subscribe(listener:()=>void){if(dead)return()=>{};listeners.add(listener);off??=i18n.subscribe(publish);return()=>{listeners.delete(listener);if(!listeners.size){off?.();off=undefined;}};},
    setItems(next:readonly ConfigMenuItem[]){if(dead)return;items=resolveConfig({menu:{items:next}}).menu.items;revision=-1;publish();},
    dispose(){dead=true;off?.();off=undefined;listeners.clear();},
  });
}
