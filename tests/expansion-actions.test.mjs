import test from 'node:test';import assert from 'node:assert/strict';import * as React from 'react';import{renderToStaticMarkup as render}from'react-dom/server';
import{Menu}from'../packages/ui-react/dist/menu.js';import{Button}from'../packages/ui-react/dist/button.js';import{Disclosure}from'../packages/ui-react/dist/navigation.js';import{SearchToolbar}from'../packages/ui-react/dist/search-toolbar.js';
test('semantic expansion defaults reuse text presentation without creating extra controls or replacing explicit actions',()=>{
 const h=React.createElement;
 for(const component of[h(Menu.Root,null,h(Menu.Trigger,null,'菜单')),h(Disclosure,{title:'详情'},'正文'),h(SearchToolbar,{advancedLabel:'展开搜索',advanced:h('input',{'aria-label':'筛选'})})]){const markup=render(component);assert.match(markup,/data-variant="text"/);assert.equal((markup.match(/<button\b/g)||[]).length,1);if(markup.includes('aria-haspopup="menu"'))assert.match(markup,/aria-haspopup="menu"/);else assert.match(markup,/aria-expanded="false"/);}
 for(const variant of['primary','destructive']){const markup=render(h(Menu.Root,null,h(Menu.Trigger,{render:h(Button,{variant})},'明确操作')));assert.match(markup,new RegExp(`data-variant="${variant}"`));assert.doesNotMatch(markup,/data-variant="text"/);assert.equal((markup.match(/<button\b/g)||[]).length,1);}
 assert.match(render(h(Disclosure,{title:'历史外观',variant:'default'},'正文')),/data-variant="default"/);
});
test('optional Button tone preserves composed navigation semantics unless explicitly supplied',()=>{
 const h=React.createElement;
 assert.match(render(h(Button,{'data-tone':'warning',variant:'text'},'警告分支')),/data-tone="warning"/);
 assert.match(render(h(Button,{'data-tone':'warning',tone:'danger',variant:'text'},'删除')),/data-tone="danger"/);
 assert.match(render(h(Button,{'data-tone':'warning',tone:'default',variant:'text'},'普通动作')),/data-tone="default"/);
});
