import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import {resolveConfig,resolveDefaultPages,type XuiConfigOverrides,type XuiConfig} from '@coffeehc/xui-runtime/config';
import {ConfigurableLoginPage,type AuthClient} from '@coffeehc/xui-react/login';
import {AdminSetupPage,type AdminSetupSubmit} from '@coffeehc/xui-react/admin-setup';
import {BusinessLogExplorer,type BusinessLogLoader} from '@coffeehc/xui-react/business-log';
import {ApiKeyManager,type ApiKeyManagerController} from '@coffeehc/xui-react/api-key';
import type {ThemeController} from '@coffeehc/xui-runtime/theme';
const partial:XuiConfigOverrides={theme:{scale:1.25},app:{name:'Example'}};
resolveConfig(partial);
const pages=resolveDefaultPages(partial);
declare const auth:AuthClient,theme:ThemeController,submit:AdminSetupSubmit,loader:BusinessLogLoader,keys:ApiKeyManagerController;
export const defaultLogin=<ConfigurableLoginPage auth={auth} theme={theme} config={pages.login.config}/>;
export const defaultSetup=<AdminSetupPage config={pages.adminSetup.config} state={{status:'idle'}} onSubmit={submit}/>;
export const defaultLog=<BusinessLogExplorer options={{...pages.businessLog.options,loader}}/>;
export const defaultKeys=<ApiKeyManager controller={keys} pagination={pages.apiKeys.pagination}/>;
declare const priorConfig:Omit<XuiConfig,'pages'>;
export const compatiblePriorConfig:XuiConfig=priorConfig;
if(false){
 bootstrap();bootstrap(partial);
 // @ts-expect-error Configuration remains serializable.
 bootstrap({extensions:{callback:()=>0}});
 // @ts-expect-error History URI routing is the only route mode.
 bootstrap({router:{mode:'hash'}});
 // @ts-expect-error Scale is a supported reading size.
 bootstrap({theme:{scale:1.1}});
 // @ts-expect-error Page presentation cannot redefine standard HTTP endpoints.
 resolveDefaultPages({pages:{apiKeys:{endpoint:'/private'}}});
 // @ts-expect-error Initialization authority cannot be supplied by JSON.
 resolveDefaultPages({pages:{adminSetup:{initialized:true}}});
 // @ts-expect-error HTTP factory was removed from the public entry.
 import('@coffeehc/xui-runtime/http').then(module=>module.createHttpClient);
}
