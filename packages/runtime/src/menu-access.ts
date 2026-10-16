import {registerService} from './service-resolvers.js';
import {buildMenuService,type MenuService} from './menu-service-core.js';
import {resolveI18nService} from './i18n-access.js';
import {browserState,optionsFor,sameValue,type RegistryState} from './service-state.js';
export function resolveMenuService(state:RegistryState):MenuService{const entry=state.menu;if(entry.value)return entry.value;entry.value=buildMenuService(state.config.menu,resolveI18nService(state));entry.owned=true;return entry.value;}
export function getMenuService():MenuService{return resolveMenuService(browserState());}

registerService('menu',resolveMenuService);
