import {registerService} from './service-resolvers.js';
import {buildRouteService,type RouteService} from './route-core.js';
import {browserState,optionsFor,sameValue,type RegistryState} from './service-state.js';
export function resolveRouteService(state:RegistryState):RouteService{const entry=state.route;if(entry.value)return entry.value;entry.value=buildRouteService({basePath:state.config.router.basePath,window:state.window??null,...optionsFor(entry)});entry.owned=true;return entry.value;}
export function getRouteService():RouteService{return resolveRouteService(browserState());}

registerService('route',resolveRouteService);
