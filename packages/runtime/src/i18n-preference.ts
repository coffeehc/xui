import type {ConfigReadonly,XuiConfig} from './config.js';
import defaults from './config-defaults.js';

/** Default localStorage key for the selected, declared UI locale. Contains no authentication data. */
export const defaultI18nStorageKey=defaults.i18n.storageKey;
/** Shared by bootstrap prepaint and the lazy language owner; disabled i18n ignores saved choices. */
export function readI18nLocale(config:ConfigReadonly<XuiConfig['i18n']>,win?:Window|null):string{
 if(config.enabled&&config.persist!==false)try{
  const value=win?.localStorage.getItem(config.storageKey??defaultI18nStorageKey);
  if(config.locales.some(option=>option.value===value))return value!;
 }catch{/* Storage denial does not prevent using the configured language. */}
 return config.defaultLocale;
}
