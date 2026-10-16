import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import {resolveConfig,type XuiConfigOverrides} from '@coffeehc/xui-runtime/config';
const partial:XuiConfigOverrides={theme:{scale:1.25},app:{name:'Example'}};
resolveConfig(partial);
if(false){
 bootstrap();bootstrap(partial);
 // @ts-expect-error Configuration remains serializable.
 bootstrap({extensions:{callback:()=>0}});
 // @ts-expect-error History URI routing is the only route mode.
 bootstrap({router:{mode:'hash'}});
 // @ts-expect-error Scale is a supported reading size.
 bootstrap({theme:{scale:1.1}});
 // @ts-expect-error HTTP factory was removed from the public entry.
 import('@coffeehc/xui-runtime/http').then(module=>module.createHttpClient);
}
