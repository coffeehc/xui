export type {RouteLocation,RouteNavigateOptions,RouteServiceOptions} from './route-core.js';
export {getRouteService} from './route-access.js';


import type {RouteService as RouteServiceContract} from './route-core.js';

import {serviceInstance} from './service-resolvers.js';
import {getRouteService as resolveSharedRouteService} from './route-access.js';
export type RouteService=RouteServiceContract;
/** Direct module singleton; state/configuration comes from the same application registry on use. */
export const RouteService:RouteService=serviceInstance(resolveSharedRouteService,['getState', 'subscribe', 'href', 'resolve', 'navigate', 'back', 'forward'],['basePath', 'navigation']);
