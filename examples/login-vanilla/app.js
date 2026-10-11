import {createLoginPage} from '@coffeehc/xui-runtime/login-dom';
import {createThemeController} from '@coffeehc/xui-runtime/theme';
import {createLoginExample} from '../shared/login-model';
import '@coffeehc/xui-theme/critical.css';
const owner=createLoginExample(location.href),theme=window.xuiTheme??createThemeController(),view=createLoginPage(document.getElementById('root'),{auth:owner.auth,theme,config:owner.config,onAuthenticated:owner.onAuthenticated});window.loginDemo={...owner,destroy(){view.destroy();owner.destroy();}};window.addEventListener('pagehide',()=>window.loginDemo.destroy(),{once:true});
