import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {AppHeader,AppShell} from '../packages/ui-react/dist/layout.js';
import {checkContract,expand} from '../scripts/tokens.mjs';

test('AppHeader owns role groups without inventing business semantics',()=>{
  const markup=renderToStaticMarkup(React.createElement(AppHeader,{brand:'工作台',breadcrumb:React.createElement('nav',{'aria-label':'路径'},'项目'),status:'已连接',actions:React.createElement('button',null,'新建'),navigation:React.createElement('button',null,'导航')},React.createElement('span',null,'旧header')));
  for(const role of ['primary','secondary','brand','breadcrumb','status','actions','navigation','legacy'])assert.ok(markup.includes(`class="xui-app-header-${role}"`));
  assert.match(markup,/aria-label="路径"/);
  assert.ok(markup.indexOf('工作台')<markup.indexOf('已连接'));
  assert.ok(markup.indexOf('新建')<markup.indexOf('旧header'));
});

test('AppHeader keeps the default theme action, omits empty host roles and preserves zero-valued content',()=>{
  const empty=renderToStaticMarkup(React.createElement(AppHeader,{brand:'工作台',status:null,actions:false}));
  assert.ok(empty.includes('xui-app-header-secondary'));assert.ok(empty.includes('xui-theme-mode-toggle'));assert.ok(!empty.includes('xui-app-header-status'));assert.ok(!empty.includes('xui-app-header-actions'));
  const zero=renderToStaticMarkup(React.createElement(AppHeader,{status:0}));
  assert.match(zero,/xui-app-header-status">0</);
});

test('AppShell preserves legacy header markup and adds the default right theme control',()=>{
  const markup=renderToStaticMarkup(React.createElement(AppShell,{sidebar:'Navigation',header:React.createElement(React.Fragment,null,React.createElement('strong',null,'Legacy brand'),React.createElement('span',null,'Legacy context'))},'Content'));
  assert.match(markup,/<div class="xui-app-header-legacy"><strong>Legacy brand<\/strong><span>Legacy context<\/span><\/div>/);
  assert.doesNotMatch(markup,/xui-app-header-brand/);assert.ok(markup.indexOf('Legacy context')<markup.indexOf('xui-app-header-secondary'));
  assert.ok(markup.includes('xui-app-header'));assert.ok(markup.includes('xui-theme-mode-toggle'));
});

test('compact sidebar derives exactly one item plus symmetric insets from DESIGN',async()=>{
  const {light}=checkContract(await readFile('docs/DESIGN.md','utf8'));
  const number=(name,font=16,viewport=1280)=>{const expression=expand(light[name],light).replace(/calc/g,'').replace(/min/g,'Math.min').replace(/rem/g,'*'+font).replace(/vw/g,'*'+viewport+'/100').replace(/px/g,'');assert.match(expression.replace(/Math\.min|clamp/g,''),/^[\d\s,.*+()/\-]+$/);return Function('clamp',`return (${expression})`)((lo,value,hi)=>Math.max(lo,Math.min(value,hi)));};
  assert.equal(number('--nav-sidebar-width'),324);
  assert.equal(number('--nav-sidebar-width',16,1600),400);
  assert.equal(number('--nav-sidebar-width',16,1920),432);
  assert.equal(number('--nav-sidebar-width',32,800),400);
  assert.equal(number('--nav-sidebar-width',32,1600),648);
  assert.equal(number('--nav-sidebar-padding'),12);
  assert.equal(number('--nav-collapsed-width'),60);
  assert.equal(number('--nav-collapsed-width'),number('--nav-collapsed-item-size')+2*number('--nav-sidebar-padding'));
});

test('AppShell owns one sidebar toggle and limits collapsed state to its sidebar navigation',async()=>{
  const {NavigationMenu}=await import('../packages/ui-react/dist/menu-layout.js');
  const items=[{id:'one',label:'First',href:'/one'}];
  const markup=renderToStaticMarkup(React.createElement(AppShell,{collapsed:true,compactLabel:'收起侧栏',expandLabel:'展开侧栏',sidebar:React.createElement(NavigationMenu,{items,label:'Sidebar menu'})},React.createElement(NavigationMenu,{items,label:'Independent menu',defaultCollapsed:false})));
  assert.equal((markup.match(/class="xui-button xui-shell-toggle"/g)??[]).length,1);
  const header=/<header[\s\S]*?<\/header>/.exec(markup)[0];assert.match(header,/xui-app-header-identity[\s\S]*xui-shell-toggle-slot[\s\S]*xui-shell-toggle"/);
  const sidebar=/<aside[\s\S]*?<\/aside>/.exec(markup)[0],main=/<main[\s\S]*?<\/main>/.exec(markup)[0];
  assert.doesNotMatch(sidebar,/xui-shell-navigation-control/);assert.match(header,/aria-label="展开侧栏"/);assert.match(header,/aria-expanded="false"/);
  assert.doesNotMatch(sidebar,/xui-menu-compact-toggle/);
  assert.match(sidebar,/aria-label="Sidebar menu" data-collapsed="true"/);
  assert.match(main,/xui-menu-compact-toggle/);
  assert.match(main,/aria-label="Independent menu" data-collapsed="false"/);
});
