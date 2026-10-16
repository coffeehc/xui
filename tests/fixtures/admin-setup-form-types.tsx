import * as React from 'react';
import {AdminSetupForm,AdminSetupPage,type AdminSetupFormProps,type AdminSetupFormHandle} from '@coffeehc/xui-react/admin-setup';
import {AdminSetupForm as RootForm,type AdminSetupFormHandle as RootHandle} from '@coffeehc/xui-react';
import {createAdminSetupController} from '@coffeehc/xui-runtime/admin-setup';
const controller=createAdminSetupController({state:{status:'idle'},onSubmit:()=> 'complete'});
const ref=React.createRef<AdminSetupFormHandle>(),rootRef=React.createRef<RootHandle>();
const owned:AdminSetupFormProps={state:{status:'idle'},onSubmit:()=> 'complete',ref};
const views=[<AdminSetupForm {...owned}/>,<RootForm controller={controller} ref={rootRef}/>,<AdminSetupPage controller={controller} config={{productName:'Example',title:'Setup'}} ref={ref}/>];void views;
// @ts-expect-error Injected owner and default callback configuration are exclusive.
const duplicate=<AdminSetupForm controller={controller} state={{status:'idle'}} onSubmit={()=> 'complete'}/>;
// @ts-expect-error A page config is not a form capability.
const shell=<AdminSetupForm {...owned} config={{title:'Setup'}}/>;
void duplicate;void shell;
