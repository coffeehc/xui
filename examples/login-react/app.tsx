import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {ConfigurableLoginPage} from '@coffeehc/xui-react/login';
import {createThemeController,type ThemeController} from '@coffeehc/xui-runtime/theme';
import {createLoginExample} from '../shared/login-model';
import {Field,Input,NativeSelect} from '@coffeehc/xui-react/forms';
import {createLoginExtensionExample} from '../shared/login-extensions';
import '@coffeehc/xui-theme/critical.css';
const owner=createLoginExample(location.href),theme=(window as Window&{xuiTheme?:ThemeController}).xuiTheme??createThemeController(),root=createRoot(document.getElementById('root')!);
const enabled=new URL(location.href).searchParams.has('extensions');let extensionOwner:ReturnType<typeof createLoginExtensionExample>|undefined;
function App(){const [service,setService]=React.useState('https://synthetic.invalid'),[source,setSource]=React.useState('local'),current=React.useRef({service,source});current.current={service,source};const [extension]=React.useState(()=>createLoginExtensionExample(()=>current.current));extensionOwner=extension;return <ConfigurableLoginPage auth={owner.auth} theme={theme} config={owner.config} onAuthenticated={owner.onAuthenticated} extensions={enabled?extension.extensions:undefined} beforeFields={enabled?<><Field label="服务地址"><Input value={service} onChange={event=>setService(event.target.value)}/></Field><Field label="账户来源"><NativeSelect value={source} onChange={event=>setSource(event.target.value)}><option value="local">本地账户</option><option value="ldap">LDAP 账户</option></NativeSelect></Field></>:undefined}/>;}
root.render(<React.StrictMode><App/></React.StrictMode>);
Object.assign(window,{loginDemo:{...owner,getExtensionCalls:()=>extensionOwner!.getExtensionCalls(),setExtensionMode:(value:string)=>extensionOwner!.setExtensionMode(value),releaseExtension:()=>extensionOwner!.releaseExtension(),destroy(){root.unmount();owner.destroy();}}});window.addEventListener('pagehide',()=>owner.destroy(),{once:true});
