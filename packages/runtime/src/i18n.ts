export type {I18nState} from './i18n-core.js';
export {getI18nService} from './i18n-access.js';


import type {I18nService as I18nServiceContract} from './i18n-core.js';

import {serviceInstance} from './service-resolvers.js';
import {getI18nService as resolveSharedI18nService} from './i18n-access.js';
export type I18nService=I18nServiceContract;
/** Direct module singleton; state/configuration comes from the same application registry on use. */
export const I18nService:I18nService=serviceInstance(resolveSharedI18nService,['getState', 'subscribe', 'setLocale', 't', 'registerMessages'],['locales']);
