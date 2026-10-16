import {resolveConfig,type XuiConfigOverrides,type XuiConfig,type ConfigReadonly} from './config.js';
import {installXuiServices,disposeXuiServices,type XuiServices,type XuiServicesOptions} from './services-core.js';
import {restoreInterfaceScale} from './interface-scale.js';
/** Runtime dependencies are separate from the JSON-only configuration overrides. */
export interface BootstrapEnvironment {window?:Window;services?:XuiServicesOptions}
export interface XuiApplication {readonly config:ConfigReadonly<XuiConfig>;readonly services:XuiServices}
const applications=new WeakMap<XuiServices,XuiApplication>();
/**
 * Resolve the packaged config.json plus project overrides before React mounts.
 * Synchronous, no network requests/login/session restoration. Same resolved config
 * and service bindings reuse the same owners; conflicting startup fails explicitly.
 * Use new XuiServices for request-local SSR, never a process-global bootstrap.
 */
export function bootstrap(overrides:XuiConfigOverrides={},environment:BootstrapEnvironment={}):XuiApplication {
  const config=resolveConfig(overrides),win=environment.window??(typeof window==='undefined'?undefined:window);
  if(!win)throw new Error('bootstrap requires a browser Window; use new XuiServices for SSR');
  const injected=environment.services??{};
  if(!config.auth.enabled&&injected.auth)throw new TypeError('Enable auth before providing an auth service');
  if(!injected.route){const base=config.router.basePath.replace(/\/+$/,'');if(base&&win.location.pathname!==base&&!win.location.pathname.startsWith(base+'/')||/^#(?:!|\/)/.test(win.location.hash))throw new TypeError('Initial URI must use History routing inside router.basePath');}
  const options:XuiServicesOptions={
    ...(!injected.http?{http:{options:{baseURL:new URL(config.http.baseURL,win.location.href).href,timeoutMs:config.http.timeoutMs}}}:{}),
    ...(config.auth.enabled?{auth:{options:{timeoutMs:config.auth.timeoutMs,protectedPaths:config.auth.protectedPaths,idEncoding:config.auth.idEncoding}}}:{}),
    theme:{options:{defaultMode:config.theme.mode,persist:config.theme.persist}},
    route:{options:{basePath:config.router.basePath,window:win}},
    ...injected,
  };
  const services=installXuiServices(options,win,config);
  const existing=applications.get(services);if(existing)return existing;
  // Materialize configured infrastructure before rendering; no API operation is executed.
  try{
    services.getHttpService();if(config.auth.enabled)services.getAuthService();
    services.getRouteService();services.getI18nService();services.getMenuService();services.getThemeService(win);
    restoreInterfaceScale(win,config.theme.scale);
    if(config.app.title)win.document.title=config.app.title;
    const application=Object.freeze({config:services.getConfigService().getConfig(),services});applications.set(services,application);return application;
  }catch(error){disposeXuiServices(win);throw error;}
}
