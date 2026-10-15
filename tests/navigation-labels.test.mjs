import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {NavigationMenu} from '../packages/ui-react/dist/menu-layout.js';
import {createNavigationMenu} from '../packages/runtime/dist/navigation.js';
import {navigationDOM, key, mockComputedStyle} from './fixtures/navigation-dom.mjs';

const team=label=>({id:'team',label,href:'?sessionId=manager',children:[{id:'member',label:'成员',href:'?sessionId=member'}]});
const zh={expandBranchLabel:item=>`展开 ${item.label}`,collapseBranchLabel:item=>`收起 ${item.label}`};
const toggle=root=>root.querySelectorAll('[data-menu-control]').find(node=>node.dataset.menuId==='team'&&node.dataset.menuControl==='toggle');

test('React branch names preserve English defaults and use the actual item and confirmed state',()=>{
  const render=options=>renderToStaticMarkup(React.createElement(NavigationMenu,{items:[team('研发团队')],showCollapseToggle:false,...options}));
  assert.match(render({}),/aria-label="Expand 研发团队"/);
  assert.match(render({defaultExpandedIds:['team']}),/aria-label="Collapse 研发团队"/);
  assert.match(render({...zh,defaultExpandedIds:['team'],expandedIds:[]}),/aria-label="展开 研发团队"/);
  assert.match(render({...zh,expandedIds:['team']}),/aria-label="收起 研发团队"/);
  assert.match(render({expandBranchLabel:zh.expandBranchLabel,expandedIds:['team']}),/aria-label="Collapse 研发团队"/);
  const label='长中文团队名称与安全文本 <研发> "甲"';
  const html=render({...zh,items:[team(label)]});
  assert.match(html,/aria-label="展开 长中文团队名称与安全文本 &lt;研发&gt; &quot;甲&quot;"/);
  assert.match(html,/aria-expanded="false" aria-controls="[^"]+"/);
  assert.doesNotMatch(render({...zh,items:[{...team('无链接分组'),href:undefined}]}),/aria-label="展开 无链接分组"/);
});

test('native language, label and controlled state updates retain the button, controls relationship and focus',t=>{
  mockComputedStyle(t);
  const f=navigationDOM(),requests=[],original=team('研发团队');
  const owner=createNavigationMenu(f.root,{items:[original],expandedIds:['team'],onExpandedChange:ids=>requests.push(ids)});
  const button=toggle(f.root),controls=button.getAttribute('aria-controls');button.focus();
  assert.equal(button.getAttribute('aria-label'),'Collapse 研发团队');
  owner.update(zh);assert.equal(toggle(f.root),button);assert.equal(f.doc.activeElement,button);
  assert.equal(button.getAttribute('aria-label'),'收起 研发团队');
  button.click();assert.deepEqual(requests,[[]]);assert.equal(button.getAttribute('aria-expanded'),'true');
  owner.update({expandedIds:[]});assert.equal(button.getAttribute('aria-label'),'展开 研发团队');
  const renamed=team('跨区域研发团队：包含负责人、成员及完整中文名称');
  owner.update({items:[renamed]});assert.equal(button.getAttribute('aria-label'),`展开 ${renamed.label}`);
  assert.equal(button.getAttribute('aria-controls'),controls);assert.equal(f.doc.activeElement,button);
  owner.update({expandBranchLabel:item=>`Show members of ${item.label}`,collapseBranchLabel:item=>`Hide members of ${item.label}`,expandedIds:['team']});
  assert.equal(button.getAttribute('aria-label'),`Hide members of ${renamed.label}`);assert.deepEqual(requests,[[]]);
  owner.update({expandBranchLabel:undefined,collapseBranchLabel:undefined});assert.equal(button.getAttribute('aria-label'),`Collapse ${renamed.label}`);
  owner.destroy();
});

test('native translated toggles keep disabled inheritance and the single roving stop',t=>{
  mockComputedStyle(t);
  const f=navigationDOM(),requests=[],items=[team('研发团队'),{id:'end',label:'末项',href:'/end'}];
  const owner=createNavigationMenu(f.root,{items,...zh,onExpandedChange:ids=>requests.push(ids)});
  const primary=f.root.querySelector('[data-menu-control="primary"]'),button=toggle(f.root);
  primary.focus();key(primary,'ArrowDown');assert.equal(f.doc.activeElement,button);
  assert.equal(f.root.querySelectorAll('[data-menu-control][tabindex="0"]').length,1);
  button.click();assert.deepEqual(requests,[['team']]);assert.equal(button.getAttribute('aria-label'),'收起 研发团队');
  owner.update({items:[{...items[0],disabled:true},items[1]]});assert.equal(button.disabled,true);
  button.click();assert.deepEqual(requests,[['team']]);assert.equal(button.getAttribute('aria-expanded'),'true');
  assert.equal(f.doc.activeElement.dataset.menuId,'end');
  owner.destroy();
});
