/** Public JSON configuration policy plus the shared application's configuration reference. */
export * from './config-core.js';
export {getConfigService} from './config-access.js';
import type {ConfigService as ConfigContract} from './config-core.js';
import {getConfigService} from './config-access.js';
import {serviceInstance} from './service-resolvers.js';
export type ConfigService=ConfigContract;
/** Importing the reference never consumes/locks the pre-bootstrap defaults. */
export const ConfigService:ConfigService=serviceInstance(getConfigService,['getConfig']);
