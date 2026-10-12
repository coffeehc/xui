import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {NavigationMenu} from '../packages/ui-react/dist/menu-layout.js';
import {ContextMenu} from '../packages/ui-react/dist/context-menu.js';

const element=React.createElement;
function ContextLink({ref,...props}){return element(ContextMenu.Root,{disabled:props['aria-disabled']===true},element(ContextMenu.Trigger,{render:element('a',{...props,ref})}),element(ContextMenu.Content,null,element(ContextMenu.Item,null,'配置')));}
function ContextBranch({ref,...props}){return element(ContextMenu.Root,{disabled:props.disabled},element(ContextMenu.Trigger,{render:element('button',{...props,ref})}),element(ContextMenu.Content,null,element(ContextMenu.Item,null,'配置')));}
const items=[{id:'branch',label:'项目目录',children:[{id:'page',label:'项目文档',href:'/document'}]}];
test('React branch/link context renderers keep one primary control and sibling actions',()=>{
 const html=renderToStaticMarkup(element(NavigationMenu,{items,defaultExpandedIds:['branch'],showCollapseToggle:false,renderButton:()=>element(ContextBranch),renderLink:()=>element(ContextLink),renderLabel:item=>element('span',null,item.label,element('small',null,' 描述')),renderAction:item=>element('button',{'aria-label':`配置 ${item.label}`},'⚙')}));
 assert.equal((html.match(/<a\b/g)??[]).length,1);assert.equal((html.match(/<button\b/g)??[]).length,3);
 assert.equal((html.match(/data-menu-control="action"/g)??[]).length,2);
 assert.match(html,/aria-expanded="true"[^>]+aria-controls=/);assert.match(html,/href="\/document"/);
 assert.doesNotMatch(html,/role="(?:option|listbox)"/);for(const match of html.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/g))assert.doesNotMatch(match[2],/<(?:a|button)\b/);
});
test('React auxiliary button inherits disabled and preserves host busy, label and content',()=>{
 const html=renderToStaticMarkup(element(NavigationMenu,{items:[{id:'page',label:'文档',href:'/document',disabled:true}],showCollapseToggle:false,renderAction:()=>element('button',{'aria-label':'编辑配置','aria-busy':true,disabled:false},'⚙')}));
 assert.match(html,/<button[^>]+disabled=""/);assert.match(html,/aria-busy="true"/);assert.match(html,/aria-label="编辑配置"/);assert.match(html,/data-menu-control="action"[^>]*>⚙<\/button>/);assert.doesNotMatch(html,/href="\/document"/);
});
test('React auxiliary busy remains separate from its explicit disabling policy',()=>{
 const html=renderToStaticMarkup(element(NavigationMenu,{items:[{id:'page',label:'文档',href:'/document'}],showCollapseToggle:false,renderAction:()=>element('button',{'aria-busy':true},'⚙')}));
 assert.match(html,/aria-busy="true"/);assert.doesNotMatch(html,/<button[^>]*disabled=""/);assert.match(html,/aria-label="Actions for 文档"/);
 const absent=renderToStaticMarkup(element(NavigationMenu,{items,renderAction:()=>null}));assert.doesNotMatch(absent,/data-menu-control="action"/);
});

test('synthetic rich navigation host keeps independent cursors and ignores cancelled late reads',async t=>{
 const {readFile}=await import('node:fs/promises'),{transform}=await import('esbuild');
 const {code}=await transform(await readFile('examples/shared/rich-navigation-model.ts','utf8'),{loader:'ts',format:'esm',target:'es2022'});
 const {createRichNavigationExample}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
 t.mock.timers.enable({apis:['setTimeout']});const owner=createRichNavigationExample();
 t.mock.timers.tick(200);assert.equal(owner.getState().groups.projects.items.length,2);assert.equal(owner.getState().groups.projects.total,undefined);assert.equal(owner.getState().reads.members,0);
 owner.setMembersOpen(true);t.mock.timers.tick(200);const memberCursor=owner.getState().groups.members.cursor;
 owner.loadMore('projects');owner.loadMore('projects');t.mock.timers.tick(200);assert.equal(owner.getState().groups.projects.items.length,4);assert.equal(owner.getState().groups.members.cursor,memberCursor);
 owner.setQuery('负责人');owner.setMembersOpen(false);t.mock.timers.tick(200);assert.equal(owner.getState().groups.members.items.length,0);assert.ok(owner.getState().cancelled.members>0);assert.ok(owner.getState().discarded.members>0);
 const reads=owner.getState().reads.members;owner.setQuery('资料');t.mock.timers.tick(200);assert.equal(owner.getState().reads.members,reads);owner.setMembersOpen(true);t.mock.timers.tick(200);assert.deepEqual(owner.getState().groups.members.items.map(item=>item.id),['member-chen']);
 owner.configure('project-beta');owner.configure('project-beta');assert.equal(owner.getState().actions,1);assert.equal(owner.getState().navigations,0);owner.finishActions();owner.configure('project-beta');assert.equal(owner.getState().actions,2);owner.configure('project-locked');assert.equal(owner.getState().actions,2);
 owner.destroy();const snapshot=owner.getState();owner.setQuery('忽略');owner.configure('project-beta');t.mock.timers.tick(1000);assert.equal(owner.getState(),snapshot);
});
