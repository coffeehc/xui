import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {NewPasswordFields,type NewPasswordFieldsHandle} from '@coffeehc/xui-react/password';
import {Button} from '@coffeehc/xui-react/button';
import '@coffeehc/xui-theme/style.css';
const policy={version:1,minimum_characters:6,maximum_characters:32,counting_unit:'unicode_code_points'} as const;
let fields:NewPasswordFieldsHandle|null=null;
const root=createRoot(document.getElementById('app')!);
function Fixture(){const [result,setResult]=React.useState('');return <><NewPasswordFields policy={policy} ref={value=>{fields=value;}}/><Button onClick={()=>setResult(fields?.readValidatedPassword()===null?'rejected':'accepted')}>Submit fixture</Button><output data-submit-result="">{result}</output></>;}
root.render(<Fixture/>);Object.assign(window,{passwordStrengthFixture:{clear:()=>fields?.clear(),destroy:()=>root.unmount()}});
