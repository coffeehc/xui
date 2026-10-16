import {registerService} from './service-resolvers.js';
import type {ConfigService} from './config.js';
import {browserState,optionsFor,sameValue,type RegistryState} from './service-state.js';
export function resolveConfigService(state:RegistryState):ConfigService{return state.configService??=Object.freeze({getConfig:()=>state.config});}
export function getConfigService():ConfigService{return resolveConfigService(browserState());}

registerService('config',resolveConfigService);
