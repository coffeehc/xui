import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {PasswordStrengthInput,NewPasswordFields,type PasswordStrengthInputProps,type NewPasswordFieldsProps} from '@coffeehc/xui-react/password';
import type {PasswordInputHandle} from '@coffeehc/xui-react/text-inputs';
import {validatePassword,createPasswordStrengthController,type PasswordStrengthEstimate} from '@coffeehc/xui-runtime/password';
import {HTTPService} from '@coffeehc/xui-runtime/http';
import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import {Button} from '@coffeehc/xui-react/button';
import {Field} from '@coffeehc/xui-react/forms';
import '@coffeehc/xui-theme/style.css';

bootstrap({}, {window});
let password:HTMLInputElement|null=null,control:PasswordInputHandle|null=null;
const controller=createPasswordStrengthController({readPassword:()=>''});
const remote=async(value:string,{signal}:{signal:AbortSignal})=>(await HTTPService.request<PasswordStrengthEstimate>('/api/xui-fixture/password-strength',{method:'POST',json:{password:value},response:'json',signal})).payload;
const root=createRoot(document.getElementById('app')!);
function Fixture(){
 const [result,setResult]=React.useState('');
 return <><form id="password-fixture-form"><Field label="新密码" required><PasswordStrengthInput controller={controller} ref={node=>{password=node;}} controlRef={handle=>{control=handle;}} name="password" autoComplete="new-password" required/></Field></form><Button onClick={()=>setResult(password&&validatePassword(password.value)===null?'accepted':'rejected')}>Submit fixture</Button><output data-submit-result="">{result}</output></>;
}
root.render(<Fixture/>);
Object.assign(window,{passwordStrengthFixture:{clear:()=>control?.clear(),destroy:()=>{root.unmount();controller.destroy();},getInput:()=>password,state:()=>controller.getState(),useRemote:(timeoutMs=15000)=>controller.update({evaluateStrength:remote,evaluationTimeoutMs:timeoutMs}),useBasic:()=>controller.update({evaluateStrength:undefined}),stop:()=>controller.destroy()}});

function publicTypesOnly(){
 const props:NewPasswordFieldsProps={evaluateStrength:remote,evaluationTimeoutMs:15000};
 const standalone:PasswordStrengthInputProps={evaluateStrength:()=>({score:2,hint:'common'})};
 // @ts-expect-error A supplied Controller owns the evaluator.
 const duplicate:PasswordStrengthInputProps={controller,evaluateStrength:remote};
 // @ts-expect-error The result is a bounded score, not a password or arbitrary DTO.
 const invalid:NewPasswordFieldsProps={evaluateStrength:()=>({score:5})};
 void [props,standalone,duplicate,invalid,NewPasswordFields];
}
