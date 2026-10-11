import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {ConfigurableLoginPage} from '@coffeehc/xui-react/login';
import {createThemeController,type ThemeController} from '@coffeehc/xui-runtime/theme';
import {createLoginExample} from '../shared/login-model';
import '@coffeehc/xui-theme/critical.css';
const owner=createLoginExample(location.href),theme=(window as Window&{xuiTheme?:ThemeController}).xuiTheme??createThemeController(),root=createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><ConfigurableLoginPage auth={owner.auth} theme={theme} config={owner.config} onAuthenticated={owner.onAuthenticated}/></React.StrictMode>);
Object.assign(window,{loginDemo:{...owner,destroy(){root.unmount();owner.destroy();}}});window.addEventListener('pagehide',()=>owner.destroy(),{once:true});
