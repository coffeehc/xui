import defaults from './config-defaults.js';
import type {ThemeMode,InterfaceScale} from './theme.js';
import type {NavigationItem} from './navigation.js';
import {indexNavigation} from './navigation.js';
export type ConfigValue=null|boolean|number|string|readonly ConfigValue[]|{readonly [key:string]:ConfigValue};
export type ConfigReadonly<T>=T extends object?{readonly [K in keyof T]:ConfigReadonly<T[K]>}:T;
/** Only this configuration shape is serialized. Callbacks/instances belong to the bootstrap environment. */
export interface ConfigMenuItem extends Omit<NavigationItem,'children'> {
  /** Optional translation key; label remains the required human-readable fallback. */
  labelKey?:string;
  children?:readonly ConfigMenuItem[];
}
export interface XuiConfig {
  schemaVersion:1;
  app:{name:string;title:string;logo:string|null};
  http:{baseURL:string;timeoutMs:number};
  auth:{enabled:boolean;timeoutMs:number;protectedPaths:readonly string[];idEncoding:'decimal'|'hex'};
  router:{basePath:string};
  theme:{mode:ThemeMode;scale:InterfaceScale;persist:boolean};
  i18n:{enabled:boolean;defaultLocale:string;fallbackLocale:string;locales:readonly {value:string;label:string}[];messages:Readonly<Record<string,Readonly<Record<string,string>>>>};
  menu:{label:string;labelKey:string|null;items:readonly ConfigMenuItem[]};
  /** Project-owned JSON. Projects validate their own business schema before use. Never store secrets here. */
  extensions:Readonly<Record<string,ConfigValue>>;
}
/** Objects merge recursively, arrays replace completely, undefined means no override. */
export type ConfigOverrides<T> = T extends readonly unknown[]?T:T extends object?{[K in keyof T]?:ConfigOverrides<T[K]>}:T;
export type XuiConfigOverrides=ConfigOverrides<XuiConfig>;
export interface ConfigService {getConfig:()=>ConfigReadonly<XuiConfig>}
const unsafe=new Set(['__proto__','prototype','constructor']);
function object(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));}
function fail(path:string):never{throw new TypeError(`Invalid xui configuration: ${path}`);}
function json(value:unknown,path:string,seen=new Set<object>()):unknown {
  if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))return value;
  if(typeof value!=='object'||!value||seen.has(value))return fail(path);
  seen.add(value);
  let result:unknown;
  if(Array.isArray(value))result=value.map((item,index)=>json(item,`${path}[${index}]`,seen));
  else {if(!object(value))return fail(path);const copy:Record<string,unknown>={};for(const [key,field] of Object.entries(Object.getOwnPropertyDescriptors(value))){if(unsafe.has(key)||!('value'in field))fail(`${path}.${key}`);if(field.value!==undefined)copy[key]=json(field.value,`${path}.${key}`,seen);}result=copy;}
  seen.delete(value);return result;
}
function merge(base:unknown,override:unknown):unknown{
  if(!object(base)||!object(override))return override;
  const next={...base};for(const [key,value] of Object.entries(override))next[key]=key in base?merge(base[key],value):value;return next;
}
function keys(value:unknown,allowed:readonly string[],path:string):asserts value is Record<string,unknown>{if(!object(value))fail(path);for(const key of Object.keys(value))if(!allowed.includes(key))fail(`${path}.${key}`);}
function text(value:unknown,path:string,empty=false):asserts value is string{if(typeof value!=='string'||!empty&&!value.trim())fail(path);}
function bool(value:unknown,path:string){if(typeof value!=='boolean')fail(path);}
function deadline(value:unknown,path:string){if(typeof value!=='number'||!Number.isSafeInteger(value)||value<=0||value>2147483647)fail(path);}
function validate(value:unknown):asserts value is XuiConfig {
  keys(value,['schemaVersion','app','http','auth','router','theme','i18n','menu','extensions'],'config');
  if(value.schemaVersion!==1)fail('schemaVersion');
  const {app,http,auth,router,theme,i18n,menu,extensions}=value;
  keys(app,['name','title','logo'],'app');text(app.name,'app.name');text(app.title,'app.title',true);if(app.logo!==null)text(app.logo,'app.logo');
  keys(http,['baseURL','timeoutMs'],'http');text(http.baseURL,'http.baseURL');deadline(http.timeoutMs,'http.timeoutMs');
  try{const url=new URL(http.baseURL,'https://xui.invalid/');if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)fail('http.baseURL');}catch{fail('http.baseURL');}
  keys(auth,['enabled','timeoutMs','protectedPaths','idEncoding'],'auth');bool(auth.enabled,'auth.enabled');deadline(auth.timeoutMs,'auth.timeoutMs');if(!['decimal','hex'].includes(auth.idEncoding as string))fail('auth.idEncoding');if(!Array.isArray(auth.protectedPaths)||auth.protectedPaths.some(path=>typeof path!=='string'||!path.startsWith('/')||path.startsWith('//')||/[\\?#%\u0000-\u0020\u007f]/.test(path)||new URL(path,'https://xui.invalid').pathname!==path))fail('auth.protectedPaths');
  keys(router,['basePath'],'router');text(router.basePath,'router.basePath');if(!router.basePath.startsWith('/')||router.basePath.startsWith('//')||/[?#\\]|(?:^|\/)\.\.?(?:\/|$)/.test(router.basePath))fail('router.basePath');
  keys(theme,['mode','scale','persist'],'theme');if(!['light','dark','system'].includes(theme.mode as string))fail('theme.mode');if(![1,1.25,1.5,2].includes(theme.scale as number))fail('theme.scale');bool(theme.persist,'theme.persist');
  keys(i18n,['enabled','defaultLocale','fallbackLocale','locales','messages'],'i18n');bool(i18n.enabled,'i18n.enabled');text(i18n.defaultLocale,'i18n.defaultLocale');text(i18n.fallbackLocale,'i18n.fallbackLocale');
  if(!Array.isArray(i18n.locales)||!i18n.locales.length)fail('i18n.locales');const locales=new Set<string>();
  for(const locale of i18n.locales){keys(locale,['value','label'],'i18n.locales');text(locale.value,'i18n.locales.value');text(locale.label,'i18n.locales.label');try{if(Intl.getCanonicalLocales(locale.value)[0]!==locale.value)fail('i18n.locales.value');}catch{fail('i18n.locales.value');}if(locales.has(locale.value))fail('i18n.locales.value');locales.add(locale.value);}
  if(!locales.has(i18n.defaultLocale)||!locales.has(i18n.fallbackLocale))fail('i18n default/fallback must be declared in locales');
  if(!object(i18n.messages))fail('i18n.messages');for(const [locale,messages] of Object.entries(i18n.messages)){if(!locales.has(locale)||!object(messages))fail(`i18n.messages.${locale}`);for(const [key,message] of Object.entries(messages))text(message,`i18n.messages.${locale}.${key}`,true);}
  keys(menu,['label','labelKey','items'],'menu');text(menu.label,'menu.label');if(menu.labelKey!==null)text(menu.labelKey,'menu.labelKey');
  const items=(entries:unknown):void=>{if(!Array.isArray(entries))fail('menu.items');for(const item of entries){keys(item,['id','label','labelKey','icon','href','children','group','disabled','target','download','rel'],'menu.items');for(const key of ['id','label','labelKey','icon','href','target','rel'])if(key in item)text(item[key],`menu.items.${key}`);for(const key of ['group','disabled'])if(key in item)bool(item[key],`menu.items.${key}`);if(item.download!==undefined&&typeof item.download!=='boolean'&&typeof item.download!=='string')fail('menu.items.download');if(item.href){const href=item.href as string;if(/^#(?:!|\/)/.test(href)||/^(?:javascript|data):/i.test(href.trim()))fail('menu.items.href');}if(item.children!==undefined)items(item.children);}};
  items(menu.items);indexNavigation(menu.items as ConfigMenuItem[]);
  if(!object(extensions))fail('extensions');
}
function freeze<T>(value:T):ConfigReadonly<T>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value as ConfigReadonly<T>;}
/** Pure resolution/validation; neither mutates defaults/input nor initializes any service. */
export function resolveConfig(overrides:XuiConfigOverrides={}):ConfigReadonly<XuiConfig>{
  if(!object(overrides))fail('overrides');const value=merge(json(defaults,'defaults'),json(overrides,'overrides'));validate(value);return freeze(value);
}
export {getConfigService} from './config-access.js';
