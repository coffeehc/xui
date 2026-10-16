/** Public application service registry; bootstrap's install hook stays internal. */
export {XuiServices,getHttpService,getAuthService,getThemeService,getClipboardService,getConfigService,getRouteService,getI18nService,getMenuService,getDownloadService,disposeXuiServices} from './services-core.js';
export {getUtilService,type UtilService} from './util-service.js';
export type {ServiceInput,AuthServiceOptions,XuiServicesOptions,XuiServicesEnvironment} from './services-core.js';
