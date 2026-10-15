import {setInterfaceScale,type InterfaceScale,type InterfaceScaleOptions} from '@coffeehc/xui-runtime/theme';
import {setInterfaceScale as setFromRoot,type InterfaceScale as RootScale} from '@coffeehc/xui-runtime';
const scale:InterfaceScale=1.25,rootScale:RootScale=2,options:InterfaceScaleOptions={window};
setInterfaceScale(scale,options);setFromRoot(rootScale);setInterfaceScale(1);setInterfaceScale(1.5);
// @ts-expect-error use a supported factor, not percentage units
setInterfaceScale(125);
// @ts-expect-error scale is numeric
setInterfaceScale('1.25');
// @ts-expect-error this API owns a document, not a component subtree
setInterfaceScale(1.5,{element:document.body});
// @ts-expect-error only the published factors are supported
setInterfaceScale(1.1);
