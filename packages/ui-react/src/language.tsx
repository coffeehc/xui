import * as React from 'react';
import {SimpleSelect} from './forms.js';
import {useI18n} from './services.js';
import {cx} from './shared.js';
import type {HeaderLocaleOptions} from '@coffeehc/xui-runtime/header-controls';

export interface LanguageSelectProps {
 /** Omitted: use the existing I18nService. An explicit controlled host owner remains supported. */
 locale?:HeaderLocaleOptions;
 /** Optional layout/semantic class; the shared theme owns control styling. */
 className?:string;
}
function LocaleSelectView({locale,className}:{locale:HeaderLocaleOptions;className?:string}){
 if(!locale.enabled)return null;
 const known=locale.options.some(item=>item.value===locale.value);
 return <span className="xui-select-host"><SimpleSelect className={cx('xui-language-select',className)} aria-label={locale.label??'语言'} value={locale.value} disabled={locale.disabled} onChange={event=>{const value=event.currentTarget.value;if(!locale.disabled&&value!==locale.value&&locale.options.some(item=>item.value===value&&!item.disabled))locale.onValueChange(value);}}>{!known&&<option value={locale.value} hidden disabled/>}{locale.options.map(item=><option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>)}</SimpleSelect></span>;
}

function ConfiguredLanguageSelect({className}:{className?:string}){
 const shared=useI18n();
 return <LocaleSelectView className={className} locale={{enabled:shared.enabled,value:shared.locale,options:shared.locales,onValueChange:shared.setLocale,label:shared.t('xui.language',{},shared.locale.startsWith('zh')?'语言':'Language')}}/>;
}
/** Borderless language tool with the standard Select popup, keyboard and focus-return behavior. */
export function LanguageSelect({locale,className}:LanguageSelectProps){return locale===undefined?<ConfiguredLanguageSelect className={className}/>:<LocaleSelectView locale={locale} className={className}/>;}
