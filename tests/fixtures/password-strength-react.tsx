import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {PasswordStrengthInput} from '@coffeehc/xui-react/password';
import type {PasswordInputHandle} from '@coffeehc/xui-react/text-inputs';
import {validatePassword} from '@coffeehc/xui-runtime/password';
import {Button} from '@coffeehc/xui-react/button';
import {Field} from '@coffeehc/xui-react/forms';
import '@coffeehc/xui-theme/style.css';

let password:HTMLInputElement|null=null,control:PasswordInputHandle|null=null;
const root=createRoot(document.getElementById('app')!);
function Fixture(){
 const [result,setResult]=React.useState('');
 return <><form id="password-fixture-form"><Field label="新密码" required><PasswordStrengthInput ref={node=>{password=node;}} controlRef={handle=>{control=handle;}} name="password" autoComplete="new-password" required/></Field></form><Button onClick={()=>setResult(password&&validatePassword(password.value)===null?'accepted':'rejected')}>Submit fixture</Button><output data-submit-result="">{result}</output></>;
}
root.render(<Fixture/>);
Object.assign(window,{passwordStrengthFixture:{clear:()=>control?.clear(),destroy:()=>root.unmount(),getInput:()=>password,state:()=>({result:document.querySelector('[data-submit-result]')?.textContent??''})}});
