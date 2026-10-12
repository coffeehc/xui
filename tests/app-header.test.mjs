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

test('AppHeader omits empty secondary roles and preserves zero-valued content',()=>{
  const empty=renderToStaticMarkup(React.createElement(AppHeader,{brand:'工作台',status:null,actions:false}));
  assert.ok(!empty.includes('xui-app-header-secondary'));
  const zero=renderToStaticMarkup(React.createElement(AppHeader,{status:0}));
  assert.match(zero,/xui-app-header-status">0</);
});

test('AppShell preserves legacy header markup when role slots are not opted into',()=>{
  const markup=renderToStaticMarkup(React.createElement(AppShell,{sidebar:'Navigation',header:React.createElement('strong',null,'Legacy brand')},'Content'));
  assert.match(markup,/<strong>Legacy brand<\/strong>/);
  assert.ok(!markup.includes('xui-app-header'));
});

test('compact sidebar derives exactly one item plus symmetric insets from DESIGN',async()=>{
  const {light}=checkContract(await readFile('docs/DESIGN.md','utf8'));
  const number=name=>{const expression=expand(light[name],light).replace(/calc/g,'').replace(/rem/g,'*16').replace(/px/g,'');assert.match(expression,/^[\d\s.*+()/\-]+$/);return Function(`return (${expression})`)();};
  assert.equal(number('--nav-sidebar-width'),216);
  assert.equal(number('--nav-sidebar-padding'),12);
  assert.equal(number('--nav-collapsed-width'),60);
  assert.equal(number('--nav-collapsed-width'),number('--nav-collapsed-item-size')+2*number('--nav-sidebar-padding'));
});
