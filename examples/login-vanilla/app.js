import {createLoginPage} from '@coffeehc/xui-runtime/login-dom';
import {createThemeController} from '@coffeehc/xui-runtime/theme';
import {createLoginExample} from '../shared/login-model';
import {createLoginExtensionExample} from '../shared/login-extensions';
import '@coffeehc/xui-theme/critical.css';
const owner=createLoginExample(location.href),theme=window.xuiTheme??createThemeController();
const fields=document.createElement('div');fields.className='xui-stack';fields.innerHTML='<label class="xui-field">服务地址<input class="xui-input" value="https://synthetic.invalid"></label><label class="xui-field">账户来源<select class="xui-select"><option value="local">本地账户</option><option value="ldap">LDAP 账户</option></select></label>';
const extensionOwner=createLoginExtensionExample(()=>({service:fields.querySelector('input').value,source:fields.querySelector('select').value})),enabled=new URL(location.href).searchParams.has('extensions');
const view=createLoginPage(document.getElementById('root'),{auth:owner.auth,theme,config:owner.config,beforeFields:enabled?fields:undefined,extensions:enabled?extensionOwner.extensions:undefined,onAuthenticated:owner.onAuthenticated});window.loginDemo={...owner,...extensionOwner,destroy(){view.destroy();owner.destroy();}};window.addEventListener('pagehide',()=>window.loginDemo.destroy(),{once:true});
