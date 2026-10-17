import {LinkedText,Typography} from '@coffeehc/xui-react/display';
import {Toast,type ToastViewProps,type ToastPayload} from '@coffeehc/xui-react/toast';
import {createToastController,type ToastController} from '@coffeehc/xui-runtime/toast';
import {parseHttpURL,linkifyText} from '@coffeehc/xui-runtime/text-links';
import {UtilService} from '@coffeehc/xui-runtime/util-service';
import {createModuleResource,loadModuleWithStyles} from '@coffeehc/xui-runtime/loading';
import {readThemeColors,observeThemeColors,type ThemeColor} from '@coffeehc/xui-runtime/theme-colors';
const controller=createToastController<ToastPayload>();controller.clear();
// An old complete controller need not implement the optional new operation.
const {clear,...legacy}=controller;const old:ToastController<ToastPayload>=legacy;
const views=[<Toast.Provider controller={old}/>,<Toast.Provider controller={controller} scopeKey="account:1"><Toast.View/></Toast.Provider>,<LinkedText value="https://example.com" linkProps={{target:'_self'}} stopPropagation/>,<Typography.LinkedText>{['文本 ',42,<strong key="x">既有元素</strong>]}</Typography.LinkedText>];
const view:ToastViewProps<{id:number}>={renderActions:(toast,queue)=><button onClick={()=>queue.close(toast.id)}>{toast.data?.id}</button>};
const url:string|null=UtilService.url.parseHttp('https://example.com');const parts=UtilService.text.linkify('文本');
const colors=readThemeColors({accent:'--action-primary'}),color:ThemeColor|null=colors.accent;
const observer=observeThemeColors({accent:'--action-primary'},value=>{const result:ThemeColor|null=value.accent;void result;});observer.refresh();observer.dispose();
const resource=createModuleResource({timeoutMs:1000,resolve:(key,{request,retry})=>({moduleURL:`/${key}.js?r=${retry?request:0}`,styles:['/panel.css']}),load:async()=>({name:'panel'})});resource.getState().value?.module.name;
void loadModuleWithStyles({moduleURL:'/panel.js',signal:new AbortController().signal,load:async()=>1});
// @ts-expect-error parser owns href
const unsafe=<LinkedText linkProps={{href:'javascript:alert(1)'}}/>;
// @ts-expect-error only body content, never HTML
const html=<LinkedText dangerouslySetInnerHTML={{__html:'unsafe'}}/>;
// @ts-expect-error module loading requires an explicit finite budget
const noBudget=createModuleResource({resolve:()=>({moduleURL:'/x.js'}),load:async()=>1});
// @ts-expect-error token mapping has exactly its declared keys
colors.unknown;
void [views,view,url,parts,color,parseHttpURL,linkifyText,unsafe,html,noBudget,clear];
