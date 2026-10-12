import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {AppHeader,AppShell} from '../packages/ui-react/dist/layout.js';
import {MenuLayout} from '../packages/ui-react/dist/menu-layout.js';

test('workspace is opt-in for both React shell compositions; old defaults remain document',()=>{
  for(const Component of [AppShell,MenuLayout]){
    const props={sidebar:'Navigation',items:[],children:'Content'};
    assert.match(renderToStaticMarkup(React.createElement(Component,props)),/data-scroll-mode="document"/);
    for(const scrollMode of ['document','viewport','workspace'])assert.match(renderToStaticMarkup(React.createElement(Component,{...props,scrollMode})),new RegExp(`data-scroll-mode="${scrollMode}"`));
  }
});
test('leading is optional and precedes navigation without forwarding a synthetic DOM attribute',()=>{
  for(const Component of [AppHeader,AppShell,MenuLayout]){
    const common={sidebar:'Navigation',items:[],children:'Content'},leading=React.createElement('button',null,'Platform');
    const props=Component===AppHeader?{leading,navigation:'Navigation'}:{...common,headerSlots:{leading}};
    const markup=renderToStaticMarkup(React.createElement(Component,props));
    assert.ok(markup.indexOf('xui-app-header-leading')<markup.indexOf('xui-app-header-navigation'));
    assert.doesNotMatch(markup,/ leading=/);
    const bare=renderToStaticMarkup(React.createElement(Component,Component===AppHeader?{}:common));
    assert.doesNotMatch(bare,/xui-app-header-leading/);
  }
});
test('bounded public CSS gives content remaining height and keeps natural page chrome',async()=>{
  const css=await readFile('packages/theme/dist/layout.css','utf8');
  assert.match(css,/data-scroll-mode='workspace'.*?xui-shell-main.*?display:flex;flex-direction:column/s);
  assert.match(css,/data-scroll-mode='workspace'.*?xui-shell-content.*?flex:1 1 0;min-block-size:min\(var\(--layout-workspace-content-min-block-size\),100dvh\);overflow:auto/s);
  assert.match(css,/xui-app-header-leading\s*\{[^}]*flex:none/);
});
test('workspace consumers use public packages and host-owned geometry only',async()=>{
  for(const kind of ['react','vanilla']){
    const source=await readFile(`examples/workspace-${kind}/app.${kind==='react'?'tsx':'js'}`,'utf8');
    assert.match(source,/@coffeehc\/xui-theme\/style.css/);
    assert.doesNotMatch(source,/xui-shell-|xui-app-header-|getBoundingClientRect|position:\s*['"](?:absolute|fixed)|packages\/.*\/src/);
  }
});

test('workspace minimum stays opt-in through the public shell style contract',async()=>{
  const css=await readFile('packages/theme/dist/style.css','utf8');
  assert.match(css,/--layout-workspace-content-min-block-size:\s*0px/);
  for(const Component of [AppShell,MenuLayout]){
    const props={sidebar:'Navigation',items:[],children:'Content',scrollMode:'workspace'};
    assert.doesNotMatch(renderToStaticMarkup(React.createElement(Component,props)),/style=/);
    const html=renderToStaticMarkup(React.createElement(Component,{...props,style:{'--layout-workspace-content-min-block-size':'var(--data-table-min-block-size)'}}));
    assert.match(html,/style="--layout-workspace-content-min-block-size:var\(--data-table-min-block-size\)"/);
  }
});
