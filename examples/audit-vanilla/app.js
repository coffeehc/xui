import {createMenuLayout} from '@coffeehc/xui-runtime/menu-layout';
import {createBusinessAuditExplorer} from '@coffeehc/xui-runtime/business-audit-dom';
import {createBusinessAuditExample} from '../shared/audit-model';
import '@coffeehc/xui-theme/critical.css';
const layout=createMenuLayout(document.getElementById('root'),{title:'xui',label:'管理导航',items:[{id:'audit',label:'业务审计',icon:'folder',href:location.pathname}],activeId:'audit'}),container=document.createElement('div');container.className='xui-container';layout.getMain().append(container);
const example=createBusinessAuditExample(location.href),renderers=[{eventType:'order.approved',schemaVersion:1,render:detail=>{const paragraph=document.createElement('p');paragraph.textContent=example.renderApproved(detail);return paragraph;}},{eventType:'demo.renderer.fail',schemaVersion:1,render:()=>{throw Error('FAKE_PRIVATE_RENDER_ERROR');}}],view=createBusinessAuditExplorer(container,{controller:example.controller,renderers});void example.controller.refresh();window.auditDemo={...example,destroy(){view.destroy();example.destroy();layout.destroy();}};window.addEventListener('pagehide',()=>window.auditDemo.destroy(),{once:true});
