import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import postcss from 'postcss';
import {SearchToolbar} from '../packages/ui-react/dist/search-toolbar.js';
import {SearchToolbar as rootReact} from '../packages/ui-react/dist/index.js';
import {createSearchToolbar} from '../packages/runtime/dist/search-toolbar-dom.js';
import {createSearchToolbar as rootNative} from '../packages/runtime/dist/index.js';
import {navigationDOM} from './fixtures/navigation-dom.mjs';
const render=props=>renderToStaticMarkup(React.createElement(SearchToolbar,props));
function dom(){const result=navigationDOM(),prototype=Object.getPrototypeOf(result.root);prototype.removeChild=function(child){child.remove();return child;};result.doc.createDocumentFragment=()=>{const node=result.doc.createElement('fragment');node.nodeType=11;return node;};return result;}
function setup(options={}){const context=dom(),{doc,root}=context,search=doc.createElement('input'),action=doc.createElement('button'),advanced=doc.createElement('input');const view=createSearchToolbar(root,{search,actions:action,advanced,...options});return {...context,search,action,advanced,view,trigger:root.querySelector('.xui-search-toolbar-toggle'),panel:root.querySelector('.xui-search-toolbar-advanced')};}

test('public roots, named slots, default collapsed and initial/controlled expansion render correctly',()=>{
  assert.equal(SearchToolbar,rootReact);assert.equal(createSearchToolbar,rootNative);
  const content=React.createElement('input',{'aria-label':'Extra'});
  assert.match(render({advanced:content}),/aria-expanded="false"/);assert.match(render({advanced:content}),/hidden="" inert=""/);
  assert.match(render({advanced:content,defaultExpanded:true}),/aria-expanded="true"/);
  assert.match(render({advanced:content,defaultExpanded:true,expanded:false}),/aria-expanded="false"/);
  assert.match(render({search:React.createElement('input'),actions:React.createElement('button',null,'Save')}),/xui-search-toolbar-search/);
  for(const advanced of [null,undefined,false,true,'',[],React.createElement(React.Fragment,null,false)])assert.doesNotMatch(render({advanced}),/aria-expanded|aria-controls/);
  assert.match(render({advanced:0}),/aria-expanded/);assert.match(render({advanced:content,advancedLabel:'  '}),/>Advanced options</);
});

test('native uncontrolled defaults, single click callback and programmatic controlled fact',()=>{
  const requests=[],{view,trigger,panel}=setup({onExpandedChange:value=>requests.push(value)});
  assert.equal(view.getExpanded(),false);assert.equal(panel.hidden,true);assert.equal(panel.inert,true);assert.equal(trigger.getAttribute('aria-controls'),panel.id);
  trigger.click();assert.equal(view.getExpanded(),true);assert.equal(panel.hidden,false);assert.equal(panel.inert,false);assert.deepEqual(requests,[true]);
  view.update({defaultExpanded:false});assert.equal(view.getExpanded(),true);
  view.update({expanded:false});assert.equal(panel.hidden,true);assert.deepEqual(requests,[true]);
  trigger.click();assert.equal(panel.hidden,true);assert.equal(view.getExpanded(),false);assert.deepEqual(requests,[true,true]);
  view.update({expanded:true});assert.equal(panel.hidden,false);view.destroy();
});

test('native controlled requests reject or accept exactly once using latest callback',()=>{
  const requests=[],{view,trigger,panel}=setup({expanded:false,onExpandedChange:next=>requests.push(['initial',next])});
  trigger.click();assert.equal(panel.hidden,true);assert.deepEqual(requests,[['initial',true]]);
  view.update({onExpandedChange:next=>{requests.push(['latest',next]);view.update({expanded:next});}});
  for(let index=0;index<5;index++)view.update({advancedLabel:'Updated'});
  trigger.click();assert.equal(panel.hidden,false);assert.deepEqual(requests,[['initial',true],['latest',true]]);
  trigger.click();assert.equal(panel.hidden,true);assert.equal(requests.length,3);view.destroy();trigger.click();assert.equal(requests.length,3);
});

test('native updates preserve inputs, focus, fragments and listeners; collapsing restores only owned focus',()=>{
  const {doc,root,outside}=dom(),search=doc.createElement('input'),advanced=doc.createElement('input'),actions=doc.createDocumentFragment(),action=doc.createElement('button');actions.append(action);let count=0;action.onclick=()=>count++;
  const view=createSearchToolbar(root,{search,actions,advanced,defaultExpanded:true}),trigger=root.querySelector('.xui-search-toolbar-toggle');advanced.value='Retained';advanced.focus();
  for(let index=0;index<5;index++)view.update({search,actions,advanced,advancedLabel:'Updated'});
  assert.equal(doc.activeElement,advanced);assert.equal(root.querySelector('.xui-search-toolbar-advanced').children[0],advanced);assert.equal(advanced.value,'Retained');action.click();assert.equal(count,1);
  view.update({expanded:false});assert.equal(doc.activeElement,trigger);view.update({expanded:true});outside.focus();view.update({expanded:false});assert.equal(doc.activeElement,outside);
  assert.equal(root.querySelectorAll('.xui-disclosure-indicator').length,1);assert.equal(root.querySelectorAll('.xui-search-toolbar-actions')[0].children[0],action);view.destroy();
});

test('native slot changes are atomic, empty content has no trigger, destroy restores original',()=>{
  const {doc,root,original}=dom(),empty=doc.createDocumentFragment();const view=createSearchToolbar(root,{advanced:empty,defaultExpanded:true});
  assert.equal(root.querySelector('.xui-search-toolbar-toggle').hidden,true);assert.equal(view.getExpanded(),true);
  const advanced=doc.createElement('input');view.update({advanced});assert.equal(root.querySelector('.xui-search-toolbar-toggle').hidden,false);assert.equal(root.querySelector('.xui-search-toolbar-advanced').hidden,false);
  assert.throws(()=>view.update({search:advanced,actions:advanced}),/separate nodes/);assert.equal(root.querySelector('.xui-search-toolbar-advanced').children[0],advanced);
  assert.throws(()=>view.update({search:root}),/Invalid/);assert.throws(()=>createSearchToolbar(root),/already owns/);
  view.update({advanced:null});assert.equal(root.querySelector('.xui-search-toolbar-toggle').hidden,true);view.destroy();view.destroy();assert.deepEqual(root.childNodes,[original]);view.update({advanced});assert.deepEqual(root.childNodes,[original]);createSearchToolbar(root).destroy();
});

test('layout is remaining-space search plus bounded actions, token-sized controls and no clipping',async()=>{
  const css=await readFile('packages/theme/dist/search-toolbar.css','utf8'),rules=postcss.parse(css),declarations=selector=>{const values={};rules.walkRules(selector,rule=>rule.walkDecls(decl=>values[decl.prop]=decl.value));return values;};
  assert.equal(declarations('.xui-search-toolbar-search').flex,'1 1 0');assert.equal(declarations('.xui-search-toolbar-search')['min-inline-size'],'0');assert.equal(declarations('.xui-search-toolbar-actions')['margin-inline-start'],'auto');
  assert.match(css,/min-height:var\(--control-height\)/);assert.match(css,/@container \(max-width:40rem\)/);assert.match(css,/padding:calc\(var\(--focus-width\) \+ var\(--focus-offset\)\)/);
  assert.doesNotMatch(css,/overflow\s*:\s*(hidden|clip|auto)|\d+px|--[\w-]+\s*:/);
});

test('removing focused native advanced content falls back within the remaining controls',()=>{
  const {doc,view,search,advanced,trigger}=setup({defaultExpanded:true});advanced.focus();view.update({advanced:null});assert.equal(doc.activeElement,search);assert.equal(trigger.hidden,true);view.destroy();
});

test('native blank text and comments do not create an empty advanced trigger',()=>{
  const {doc,root}=dom(),empty=doc.createElement('text'),comment=doc.createElement('comment'),fragment=doc.createDocumentFragment();empty.nodeType=3;empty.textContent='';comment.nodeType=8;fragment.append(empty,comment);let calls=0;
  const view=createSearchToolbar(root,{advanced:fragment,onExpandedChange(){calls++;}}),trigger=root.querySelector('.xui-search-toolbar-toggle');assert.equal(trigger.hidden,true);assert.equal(trigger.disabled,true);trigger.click();assert.equal(calls,0);view.destroy();
});
