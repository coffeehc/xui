export type {MenuServiceState} from './menu-service-core.js';
export type {ConfigMenuItem} from './config.js';
export {getMenuService} from './menu-access.js';


import type {MenuService as MenuServiceContract} from './menu-service-core.js';

import {serviceInstance} from './service-resolvers.js';
import {getMenuService as resolveSharedMenuService} from './menu-access.js';
export type MenuService=MenuServiceContract;
/** Direct module singleton; state/configuration comes from the same application registry on use. */
export const MenuService:MenuService=serviceInstance(resolveSharedMenuService,['getState', 'subscribe', 'setItems'],[]);
