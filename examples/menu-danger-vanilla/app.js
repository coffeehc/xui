import {createPopoverController,createContextMenuController} from '@coffeehc/xui-runtime/dom';
import '@coffeehc/xui-theme/style.css';
const root=document.getElementById('root'),long=new URLSearchParams(location.search).has('long');
root.innerHTML='<main class="xui-stack" style="padding:var(--space-section-gap)"><h1>菜单危险操作</h1><div class="xui-toolbar"><button class="xui-button" id="menu-trigger">打开菜单</button><button class="xui-button" data-variant="outline" id="context-trigger">右键菜单</button></div><output aria-label="执行次数">0</output></main>';
let calls=0;
const makePopup=()=>{
 const popup=document.createElement('div');popup.className='xui-layer xui-floating xui-menu-popup';
 popup.innerHTML='<button type="button" class="xui-menu-item" role="menuitem">查看记录</button><button type="button" class="xui-menu-item" role="menuitem" data-tone="danger"><span class="xui-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/></svg></span>'+(long?'删除这个名称很长但必须完整保留的目录及其所有共享配置':'删除记录')+'</button><button type="button" class="xui-menu-item" role="menuitem" data-tone="danger" disabled>禁止删除</button>'+(long?Array.from({length:35},(_,i)=>'<button type="button" class="xui-menu-item" role="menuitem">其他操作 '+(i+1)+'</button>').join(''):'');
 popup.children[1].onclick=()=>{root.querySelector('output').textContent=String(++calls);};
 popup.children[2].onclick=()=>{root.querySelector('output').textContent=String(calls+=100);};root.append(popup);return popup;
};
const menu=createPopoverController(document.getElementById('menu-trigger'),makePopup(),{menu:true});
const context=createContextMenuController(document.getElementById('context-trigger'),makePopup());
window.addEventListener('pagehide',()=>{menu.destroy();context.destroy();},{once:true});
