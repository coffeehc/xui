import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import {resolveConfig,resolveDefaultPages,type XuiConfigOverrides,type XuiConfig} from '@coffeehc/xui-runtime/config';
import {ConfigurableLoginPage,type AuthClient} from '@coffeehc/xui-react/login';
import {AdminSetupPage,type AdminSetupSubmit} from '@coffeehc/xui-react/admin-setup';
import {BusinessLogExplorer,type BusinessLogLoader,type BusinessLogExplorerListPresentation,type BusinessLogListColumnId,type BusinessLogLabels,type BusinessLogController,type BusinessLogViewController} from '@coffeehc/xui-react/business-log';
import {ApiKeyManager,type ApiKeyManagerController} from '@coffeehc/xui-react/api-key';
import {resolveBusinessLogLabels} from '@coffeehc/xui-runtime/business-log';
import type {ThemeController} from '@coffeehc/xui-runtime/theme';
const partial:XuiConfigOverrides={theme:{scale:1.25},app:{name:'Example'}};
resolveConfig(partial);
const pages=resolveDefaultPages(partial);
declare const auth:AuthClient,theme:ThemeController,submit:AdminSetupSubmit,loader:BusinessLogLoader,keys:ApiKeyManagerController;
export const defaultLogin=<ConfigurableLoginPage auth={auth} theme={theme} config={pages.login.config}/>;
export const defaultSetup=<AdminSetupPage config={pages.adminSetup.config} state={{status:'idle'}} onSubmit={submit}/>;
export const defaultLog=<BusinessLogExplorer options={{...pages.businessLog.options,loader}}/>;
const timestamp:BusinessLogListColumnId='occurred_at';
export const activityPresentation:BusinessLogExplorerListPresentation={columns:[
 {id:'actor',header:'用户',cell:({event})=>event.actor.display_name??event.actor.id},
 {id:timestamp,header:'时间',cell:({value})=>new Intl.DateTimeFormat('zh-CN').format(new Date(String(value)))},
 {id:'summary',header:'摘要'},{id:'session',header:'会话',width:'20rem',overflow:'ellipsis',cell:context=><button onClick={()=>void context.event.attributes?.session}>{context.text}</button>},
 {id:'empty',header:'留空',cell:()=>null},{id:'detail',header:'详情',cell:context=>context.content},
]};
const liveLabels:Partial<BusinessLogLabels>={title:'业务日志',readError:'读取失败'};
declare const logs:BusinessLogController,logView:BusinessLogViewController;
export const borrowedLiveLabels=<BusinessLogExplorer controller={logs} labels={liveLabels}/>;
export const injectedLiveLabels=<BusinessLogExplorer viewController={logView} labels={liveLabels}/>;
export const ownedLiveLabels=<BusinessLogExplorer options={{loader,labels:liveLabels}} labels={{close:'关闭'}}/>;
export const resolvedLiveLabels=resolveBusinessLogLabels(liveLabels);
export const activityLog=<BusinessLogExplorer options={{...pages.businessLog.options,loader}} list={activityPresentation}/>;
export const defaultKeys=<ApiKeyManager controller={keys} pagination={pages.apiKeys.pagination}/>;
declare const priorConfig:Omit<XuiConfig,'pages'>;
export const compatiblePriorConfig:XuiConfig=priorConfig;
if(false){
 // @ts-expect-error Whole-page labels are typed text, not a query or arbitrary UI.
 const invalidLabels:Partial<BusinessLogLabels>={title:42};
 // @ts-expect-error Labels use only public presentation keys.
 const unknownLabels:Partial<BusinessLogLabels>={endpoint:'/logs'};
 // @ts-expect-error String columns were replaced by column definitions.
 const invalidColumn:BusinessLogExplorerListPresentation={columns:['summary']};
 // @ts-expect-error Legacy formatters were replaced by column.cell.
 const invalidFormatter:BusinessLogExplorerListPresentation={formatActor:()=>''};
 // @ts-expect-error Cell must be a callback or null.
 const invalidCell:BusinessLogExplorerListPresentation={columns:[{id:'summary',header:'摘要',cell:'text'}]};
 const immutable:BusinessLogExplorerListPresentation={columns:[{id:'summary',header:'摘要',cell:context=>{
  // @ts-expect-error Renderers cannot rewrite the original event.
  context.event.summary='changed';return context.content;
 }}]};
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
