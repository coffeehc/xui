import {createMenuLayout} from '@coffeehc/xui-runtime/menu-layout';
import {createStructuredLogExplorer} from '@coffeehc/xui-runtime/structured-log-dom';
import {createStructuredLogExample} from '../shared/log-model';
import '@coffeehc/xui-theme/critical.css';
const layout=createMenuLayout(document.getElementById('root'),{title:'xui',label:'管理导航',items:[{id:'logs',label:'结构化错误',icon:'folder',href:location.pathname}],activeId:'logs'}),container=document.createElement('div');container.className='xui-container';layout.getMain().append(container);
const example=createStructuredLogExample(location.href),view=createStructuredLogExplorer(container,{controller:example.controller});void example.controller.refresh();window.logDemo={...example,destroy(){view.destroy();example.destroy();layout.destroy();}};window.addEventListener('pagehide',()=>window.logDemo.destroy(),{once:true});
