import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Breadcrumbs} from '../packages/ui-react/dist/navigation.js';
const path=[{id:'home',label:'首页',href:'/home'},{id:'team',label:'团队',href:'/team'},{id:'project',label:'项目',href:'/project'},{id:'current',label:'当前任务',href:'/current'}];
test('breadcrumb data composition has one non-link current location and named nav',()=>{
 const html=renderToStaticMarkup(h(Breadcrumbs,{items:path,'aria-label':'当前位置'}));
 assert.match(html,/<nav aria-label="当前位置"/);assert.equal((html.match(/aria-current="page"/g)||[]).length,1);assert.match(html,/href="\/home"/);assert.doesNotMatch(html,/href="\/current"/);assert.equal((html.match(/<li /g)||[]).length,4);
});
test('breadcrumb disabled ancestors do not expose actionable destinations',()=>{
 const html=renderToStaticMarkup(h(Breadcrumbs,{items:path,disabled:true}));assert.doesNotMatch(html,/href=/);assert.match(html,/aria-disabled="true"/);
 const link=renderToStaticMarkup(h(Breadcrumbs.Link,{disabled:true,href:'/unsafe',render:h('a',{href:'/alternate'})},'禁止操作'));assert.doesNotMatch(link,/href=/);assert.match(link,/tabindex="-1"/);
});
test('breadcrumb collapse preserves first/current and provides a named public overflow control',()=>{
 const html=renderToStaticMarkup(h(Breadcrumbs,{items:path,maxItems:3,overflowLabel:'显示上级路径'}));assert.match(html,/href="\/home"/);assert.match(html,/当前任务/);assert.match(html,/aria-label="显示上级路径"/);assert.doesNotMatch(html,/href="\/team"/);assert.equal((html.match(/<li /g)||[]).length,3);
});
test('breadcrumb retains legacy children and does not invent empty paths',()=>{
 const html=renderToStaticMarkup(h(Breadcrumbs,null,h('li',null,h('a',{href:'/legacy'},'旧路径'))));assert.match(html,/<ol[^>]*><li><a href="\/legacy">旧路径<\/a><\/li><\/ol>/);
 assert.equal(renderToStaticMarkup(h(Breadcrumbs,{items:[]})),'');
});
test('breadcrumb rejects ambiguous list owners and malformed data',()=>{
 for(const props of [{items:path,children:'duplicate'},{items:path,maxItems:2},{items:[path[0],path[0]]},{items:[{id:'x',label:''}]}])assert.throws(()=>renderToStaticMarkup(h(Breadcrumbs,props)));
});
