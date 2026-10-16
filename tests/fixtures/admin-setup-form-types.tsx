import * as React from 'react';
import {AdminSetupForm,AdminSetupPage,type AdminSetupFormProps,type AdminSetupFormHandle,type AdminSetupUsernameValidator} from '@coffeehc/xui-react/admin-setup';
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

const validateUsername:AdminSetupUsernameValidator=raw=>raw.length>=3?null:'Too short';
const configured=[<AdminSetupForm {...owned} validateUsername={validateUsername}/>,<AdminSetupPage {...owned} config={{title:'Setup',productName:'Demo'}} validateUsername={validateUsername} labels={{usernameInvalid:'Invalid'}}/>];void configured;
controller.update({validateUsername});controller.update({validateUsername:undefined});const valid:boolean=controller.form.validateUsername('admin');void valid;
// @ts-expect-error Validation must be synchronous.
const asyncValidator:AdminSetupUsernameValidator=async()=>null;
// @ts-expect-error Validation returns a localized string or null, not a boolean.
const booleanValidator:AdminSetupUsernameValidator=()=>true;
// @ts-expect-error An injected Controller owns its validation options.
const duplicateValidator=<RootForm controller={controller} validateUsername={validateUsername}/>;
void asyncValidator;void booleanValidator;void duplicateValidator;
