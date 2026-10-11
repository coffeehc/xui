import {createMenuLayout} from '@coffeehc/xui-runtime/menu-layout';
import {createApiKeyManager} from '@coffeehc/xui-runtime/api-key-dom';
import {createApiKeyExample} from '../shared/api-key-model';
import '@coffeehc/xui-theme/critical.css';
const layout=createMenuLayout(document.getElementById('root'),{title:'xui',label:'管理导航',items:[{id:'keys',label:'API Key',icon:'folder',href:location.pathname}],activeId:'keys'}),container=document.createElement('div');container.className='xui-container';layout.getMain().append(container);
const example=createApiKeyExample(),view=createApiKeyManager(container,{controller:example.controller,writeClipboard:example.writeClipboard});void example.controller.refresh();
window.apiKeyDemo={...example,destroy(){view.destroy();example.destroy();layout.destroy();}};
window.addEventListener('pagehide',()=>window.apiKeyDemo.destroy(),{once:true});
