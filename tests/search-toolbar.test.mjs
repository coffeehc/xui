import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import postcss from 'postcss';
import {SearchToolbar} from '../packages/ui-react/dist/search-toolbar.js';
import {SearchToolbar as rootReact} from '../packages/ui-react/dist/index.js';
const render=props=>renderToStaticMarkup(React.createElement(SearchToolbar,props));

test('public roots, named slots, default collapsed and initial/controlled expansion render correctly',()=>{
  assert.equal(SearchToolbar,rootReact);
  const content=React.createElement('input',{'aria-label':'Extra'});
  assert.match(render({advanced:content}),/aria-expanded="false"/);assert.match(render({advanced:content}),/hidden="" inert=""/);
  assert.match(render({advanced:content,defaultExpanded:true}),/aria-expanded="true"/);
  assert.match(render({advanced:content,defaultExpanded:true,expanded:false}),/aria-expanded="false"/);
  assert.match(render({search:React.createElement('input'),actions:React.createElement('button',null,'Save')}),/xui-search-toolbar-search/);
  for(const advanced of [null,undefined,false,true,'',[],React.createElement(React.Fragment,null,false)])assert.doesNotMatch(render({advanced}),/aria-expanded|aria-controls/);
  assert.match(render({advanced:0}),/aria-expanded/);assert.match(render({advanced:content,advancedLabel:'  '}),/>Advanced options</);
});

test('layout is remaining-space search plus bounded actions, token-sized controls and no clipping',async()=>{
  const css=await readFile('packages/theme/dist/search-toolbar.css','utf8'),rules=postcss.parse(css),declarations=selector=>{const values={};rules.walkRules(selector,rule=>rule.walkDecls(decl=>values[decl.prop]=decl.value));return values;};
  assert.equal(declarations('.xui-search-toolbar-search').flex,'1 1 0');assert.equal(declarations('.xui-search-toolbar-search')['min-inline-size'],'0');assert.equal(declarations('.xui-search-toolbar-actions')['margin-inline-start'],'auto');
  assert.match(css,/min-height:var\(--control-height\)/);assert.match(css,/@container \(max-width:40rem\)/);assert.match(css,/padding:calc\(var\(--focus-width\) \+ var\(--focus-offset\)\)/);
  assert.doesNotMatch(css,/overflow\s*:\s*(hidden|clip|auto)|\d+px|--[\w-]+\s*:/);
});
