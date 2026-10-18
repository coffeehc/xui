import {resolveConfig,type ConfigReadonly,type XuiConfig,type XuiConfigOverrides} from './config-core.js';

/** JSON presentation defaults for the four public full pages; endpoints and authorization are not configurable here. */
export interface DefaultPagesConfig {
  login:{path:string;title:string;description:string;layout:'card'|'fullscreen'};
  adminSetup:{path:string;title:string;description:string;layout:'card'|'fullscreen'};
  businessLog:{path:string;title:string;pageSize:number};
  apiKeys:{path:string;title:string;pageSize:number;pageSizeOptions:readonly number[]};
}

/**
 * Pure, validated projection of config.json into existing full-page props/options.
 * Paths are URI paths under router.basePath. No service, controller, route, menu,
 * request, capability or initialization state is created; SSR callers pass their own config.
 */
export function resolveDefaultPages(overrides:ConfigReadonly<XuiConfig>|XuiConfigOverrides={}){
  const config=resolveConfig(overrides),pages=config.pages!,{app}=config;
  const path=(value:string)=>(config.router.basePath.replace(/\/+$/,'')+value)||'/';
  const auth=(page:DefaultPagesConfig['login'])=>Object.freeze({productName:app.name,title:page.title,description:page.description||undefined,layout:page.layout,logo:app.logo?Object.freeze({src:app.logo,alt:app.name}):undefined});
  return Object.freeze({
    login:Object.freeze({path:path(pages.login.path),config:Object.freeze({...auth(pages.login),fallbackReturnTo:config.router.basePath})}),
    adminSetup:Object.freeze({path:path(pages.adminSetup.path),config:auth(pages.adminSetup)}),
    businessLog:Object.freeze({path:path(pages.businessLog.path),options:Object.freeze({pageSize:pages.businessLog.pageSize,labels:Object.freeze({title:pages.businessLog.title})})}),
    apiKeys:Object.freeze({path:path(pages.apiKeys.path),labels:Object.freeze({title:pages.apiKeys.title}),pagination:Object.freeze({defaultPageSize:pages.apiKeys.pageSize,pageSizeOptions:pages.apiKeys.pageSizeOptions})}),
  });
}
