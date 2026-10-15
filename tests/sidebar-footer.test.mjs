import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {SidebarFooterContent,SidebarFooterRow,AppShell} from '../packages/ui-react/dist/layout.js';
import {SidebarFooterContent as RootSidebarFooterContent} from '../packages/ui-react/dist/index.js';
import {Button} from '../packages/ui-react/dist/button.js';

const modelSource=await readFile('examples/shared/sidebar-footer-model.ts','utf8');
const {code}=await transform(modelSource,{loader:'ts',format:'esm',target:'es2022'});
const {createActionModel,fixtureOptions,copy}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('SidebarFooterContent is the same public layout/root export and forwards span properties',()=>{
  assert.equal(SidebarFooterContent,RootSidebarFooterContent);
  const markup=renderToStaticMarkup(React.createElement(SidebarFooterContent,{id:'footer-part',className:'host-marker','data-state':'ready',role:'status',title:'完整版本信息',icon:React.createElement('span',null,'v1')},copy.version));
  assert.match(markup,/^<span[^>]*id="footer-part"/);
  assert.match(markup,/class="xui-sidebar-footer-content host-marker"/);
  assert.match(markup,/data-state="ready"/);assert.match(markup,/role="status"/);assert.match(markup,/title="完整版本信息"/);
  assert.match(markup,/<span class="xui-sidebar-footer-icon" aria-hidden="true"><span>v1<\/span><\/span><span class="xui-sidebar-footer-label">版本 1\.2\.3（合成示例）<\/span>/);
  assert.doesNotMatch(markup,/tabindex|role="button"|<button|href=/);
});

test('footer composition preserves the complete action label and lets Button own interactions',()=>{
  const content=React.createElement(SidebarFooterContent,{icon:React.createElement('svg',{'aria-hidden':true,viewBox:'0 0 24 24'})},copy.action);
  const markup=renderToStaticMarkup(React.createElement(Button,{variant:'ghost',disabled:true,'aria-busy':true},content));
  assert.match(markup,/^<button/);assert.match(markup,/data-variant="ghost"/);assert.match(markup,/disabled=""/);assert.match(markup,/aria-busy="true"/);
  assert.ok(markup.includes(`<span class="xui-sidebar-footer-label">${copy.action}</span>`));
  assert.equal((markup.match(/<button/g)??[]).length,1);
  assert.doesNotMatch(markup,/<div|aria-label=/,'composition must preserve valid button phrasing content and its complete DOM label');
});

test('footer content supports iconless static state and a zero-valued label without invented roles',()=>{
  const plain=renderToStaticMarkup(React.createElement(SidebarFooterContent,null,'静态状态'));
  assert.equal(plain,'<span class="xui-sidebar-footer-content"><span class="xui-sidebar-footer-label">静态状态</span></span>');
  for(const icon of [false,true,null,undefined])assert.equal(renderToStaticMarkup(React.createElement(SidebarFooterContent,{icon},'静态状态')),plain,'boolean/null icons must not create an empty compact icon slot');
  assert.match(renderToStaticMarkup(React.createElement(SidebarFooterContent,{icon:0},0)),/aria-hidden="true">0<\/span><span class="xui-sidebar-footer-label">0<\/span>/);
});

test('AppShell without a footer keeps its original sidebar and does not expose the slot as a DOM attribute',()=>{
  const markup=renderToStaticMarkup(React.createElement(AppShell,{sidebar:React.createElement('nav',null,'Primary navigation'),sidebarFooter:null},'Main content'));
  assert.match(markup,/<aside[^>]+class="xui-shell-sidebar"[^>]*><div class="xui-shell-navigation-control">[\s\S]*?<\/div><nav>Primary navigation<\/nav><\/aside>/);
  assert.doesNotMatch(markup,/xui-shell-sidebar-menu|xui-shell-sidebar-footer|sidebarFooter=/);
});

test('bottom placement follows navigation and business footer in SSR reading order with one control',()=>{
 const markup=renderToStaticMarkup(React.createElement(AppShell,{sidebar:React.createElement('nav',null,'NAVIGATION'),sidebarTogglePlacement:'bottom',sidebarFooter:React.createElement(SidebarFooterRow,{id:'business-row'},React.createElement(Button,null,'返回会话'),React.createElement(SidebarFooterContent,null,'企业版 · v0.0.1'))},'Main content'));
 const aside=markup.slice(markup.indexOf('<aside'),markup.indexOf('</aside>'));
 assert.ok(aside.indexOf('NAVIGATION')<aside.indexOf('business-row'));
 assert.ok(aside.indexOf('business-row')<aside.indexOf('xui-shell-navigation-control'));
 assert.equal((aside.match(/data-xui-menu-toggle/g)??[]).length,1);
 assert.match(markup,/data-sidebar-toggle-placement="bottom"/);
 assert.doesNotMatch(markup,/sidebarTogglePlacement=/);
 assert.match(aside,/class="xui-sidebar-footer-row"/);
});

test('synthetic action gate blocks disabled, busy and same-tick duplicates without automatic replay',()=>{
  const owner=createActionModel();let events=0;const stop=owner.subscribe(()=>events++);
  owner.setState({disabled:true});assert.equal(owner.invoke(),false);assert.equal(owner.getState().calls,0);
  owner.setState({disabled:false,busy:true});assert.equal(owner.invoke(),false);
  owner.finish();assert.equal(owner.invoke(),true);assert.equal(owner.invoke(),false);assert.deepEqual(owner.getState(),{disabled:false,busy:true,calls:1});
  owner.setState({disabled:true});owner.finish();assert.equal(owner.invoke(),false);assert.equal(owner.getState().calls,1);
  owner.setState({disabled:false});assert.equal(owner.invoke(),true);assert.equal(owner.getState().calls,2);
  const before=events;stop();owner.finish();assert.equal(events,before);
});

test('synthetic action gate closes before reentrant subscribers run',()=>{
  const owner=createActionModel();const admitted=[];owner.subscribe(()=>admitted.push(owner.invoke()));
  assert.equal(owner.invoke(),true);assert.deepEqual(admitted,[false]);assert.equal(owner.getState().calls,1);
});

test('short and long fixtures retain stable ids and select the actual last long item',()=>{
  const short=fixtureOptions(''),long=fixtureOptions('?list=long&collapsed=true');
  assert.equal(short.items.length,3);assert.equal(short.scrollMode,'viewport');assert.equal(long.items.length,80);
  assert.equal(long.activeId,long.items.at(-1).id);assert.equal(long.collapsed,true);
  assert.equal(fixtureOptions('?scroll=document').scrollMode,'document');
  for(const options of [short,long])assert.equal(new Set(options.items.map(item=>item.id)).size,options.items.length);
});

test('official footer consumers use only public package CSS and keep actions inside the supplied slot',async()=>{
  for(const kind of ['react','vanilla']){
    const source=await readFile(`examples/sidebar-footer-${kind}/app.${kind==='react'?'tsx':'js'}`,'utf8');
    const styles=[...source.matchAll(/import\s+['"]([^'"]+\.css)['"]/g)].map(match=>match[1]);
    assert.deepEqual(styles,['@coffeehc/xui-theme/style.css']);
    assert.doesNotMatch(source,/style=|\.style\.|position\s*:\s*['"](?:fixed|absolute)|packages\/[^\s]+\/src/);
    assert.match(source,/sidebarFooter/);
  }
});
