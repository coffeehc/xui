/** Explicit aggregate entry loads all service modules. Prefer narrow entries in application code. */
export {XuiServices,disposeXuiServices} from './services-core.js';
export {HTTPService,getHttpService} from './http.js';
export {AuthService,getAuthService} from './auth.js';
export {ThemeService,getThemeService} from './theme.js';
export {ClipboardService,getClipboardService} from './clipboard.js';
export {ConfigService,getConfigService} from './config.js';
export {RouteService,getRouteService} from './route.js';
export {I18nService,getI18nService} from './i18n.js';
export {MenuService,getMenuService} from './menu-service.js';
export {DownloadService,getDownloadService} from './download.js';
export {UploadService,getUploadService} from './upload.js';
export {UtilService,getUtilService} from './util-service.js';
export type {ServiceInput,AuthServiceOptions,XuiServicesOptions,XuiServicesEnvironment} from './services-core.js';
