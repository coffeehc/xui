import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {DataTable} from '../packages/ui-react/dist/data-table.js';
import {DataRegion} from '../packages/ui-react/dist/feedback.js';
import {ConfigurableLoginPage} from '../packages/ui-react/dist/login.js';
const read=path=>readFile(path,'utf8');

test('DataTable reserves the same status track before busy/error, and a bounded empty placeholder',()=>{
  for(const rows of [[],[{id:'a'}]])for(const status of ['idle','ready','loading','refreshing','error']){
    const html=renderToStaticMarkup(React.createElement(DataTable,{label:'Records',rows,status,rowKey:row=>row.id,columns:[{id:'name',header:'Name',cell:row=>row.id}],onRetry(){}}));
    assert.equal((html.match(/class="xui-data-table-feedback"/g)||[]).length,1);
    assert.match(html,/<thead>/);assert.match(html,/<footer class="xui-data-table-footer">/);
    if(!rows.length)assert.equal((html.match(/class="xui-data-table-placeholder"/g)||[]).length,1);
  }
});
test('DataRegion feedback prop opts into a persistent local slot, including idle null',()=>{
  for(const feedback of [null,React.createElement('div',{role:'alert'},'Failure')]){
    const html=renderToStaticMarkup(React.createElement(DataRegion,{feedback},React.createElement('input',{defaultValue:'keep'})));
    assert.match(html,/xui-feedback-slot/);assert.match(html,/value="keep"/);
  }
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(DataRegion,null,'Content')),/xui-feedback-slot/);
});
test('inactive login auxiliary controls reserve geometry but are excluded from focus and accessibility',()=>{
  const html=renderToStaticMarkup(React.createElement(ConfigurableLoginPage,{auth:{subscribe:()=>()=>{},getState:()=>({status:'anonymous',user:null,busy:null,error:null})},theme:{},config:{productName:'Demo',title:'Login'}}));
  assert.equal((html.match(/data-inactive="true"/g)||[]).length,2);
  for(const button of html.match(/<button[^>]*data-inactive="true"[^>]*>/g)||[]){assert.match(button,/aria-hidden="true"/);assert.match(button,/tabindex="-1"/);assert.match(button,/disabled=""/);}
  assert.match(html,/data-idle-label=/);assert.match(html,/data-busy-label=/);
});
test('shared error layout is locally scrollable, token-scaled, and needs no remote fonts/icons',async()=>{
  const css=await read('packages/theme/src/feedback.css'),auth=await read('packages/theme/src/auth.css');
  assert.match(css,/\.xui-feedback-slot,\.xui-data-table-feedback,\.xui-login-feedback \{block-size:var\(--feedback-slot-block-size\)/);
  assert.match(css,/overflow:auto/);assert.match(css,/visibility:hidden;pointer-events:none/);
  assert.match(auth,/\.xui-login-feedback>\.xui-alert \{max-block-size:100%;overflow:auto/);
  for(const part of ['base','button','forms','navigation','feedback','dialog','layout','floating','table','auth','sheet','widgets'])assert.doesNotMatch(await read(`packages/theme/src/${part}.css`),/@font-face|@import\s+['"]https?:|url\(\s*['"]?https?:/i);
});
test('native list views only move keyed rows when their actual order changes',async()=>{
  for(const name of ['api-key','business-log','structured-log']){
    const source=await read(`packages/runtime/src/${name}-dom.ts`);
    assert.doesNotMatch(source,/tbody\.append\(entry\.row\)/);
    assert.match(source,/tbody\.children\[rowIndex\]!==entry\.row/);
  }
});
