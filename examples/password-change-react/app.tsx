import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {AuthPage} from '@coffeehc/xui-react/login';
import {NewPasswordFields,type NewPasswordFieldsHandle} from '@coffeehc/xui-react/password';
import {Button} from '@coffeehc/xui-react/button';
import '@coffeehc/xui-theme/style.css';
const labels={showPassword:'显示密码',hidePassword:'隐藏密码'};
let calls=0,settle:()=>void=()=>{};
function App(){const fields=React.useRef<NewPasswordFieldsHandle>(null),[busy,setBusy]=React.useState(false);return <AuthPage config={{productName:'Example',title:'修改密码'}} form={{noValidate:true,onSubmit:()=>{if(busy)return;const value=fields.current?.readValidatedPassword();if(value==null)return;fields.current?.clear();calls++;setBusy(true);settle=()=>setBusy(false);}}} actions={<Button type="submit" disabled={busy} aria-busy={busy}>{busy?'正在保存…':'保存新密码'}</Button>}><NewPasswordFields ref={fields} labels={labels} disabled={busy}/></AuthPage>;}
const root=createRoot(document.getElementById('root')!);root.render(<React.StrictMode><App/></React.StrictMode>);Object.assign(window,{passwordChangeDemo:{calls:()=>calls,settle:()=>settle(),destroy:()=>root.unmount()}});
