import {registerService} from './service-resolvers.js';
import {buildI18nService,type I18nService} from './i18n-core.js';
import {browserState,optionsFor,sameValue,type RegistryState} from './service-state.js';
export function resolveI18nService(state:RegistryState):I18nService{const entry=state.i18n;if(entry.value)return entry.value;entry.value=buildI18nService(state.config.i18n,state.window);entry.owned=true;return entry.value;}
export function getI18nService():I18nService{return resolveI18nService(browserState());}

registerService('i18n',resolveI18nService);
