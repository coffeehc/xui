import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createStructuredLogController} from '../packages/runtime/dist/structured-log.js';
import {createStructuredLogViewController} from '../packages/runtime/dist/component-views.js';
import {StructuredLogExplorer} from '../packages/ui-react/dist/structured-log.js';
const response={schema_version:1,list:[],matched_groups:'0',matched_entries:'0',page:{as_of:'2026-10-18T00:00:00.123456789Z',next_cursor:null}};
function create(){const requests=[];const service=createStructuredLogController({adapter:{groups:async request=>{requests.push(request);return response;},groupRecords:async()=>{throw Error('unused');},record:async()=>{throw Error('unused');}},filter:{text:'submitted'},labels:{clear:'清除已生效筛选'}});return {service,requests};}
test('resetting a draft preserves submitted scope, result identity and the existing request owner',async()=>{
 const {service,requests}=create(),view=createStructuredLogViewController({service});const off=view.subscribe(()=>{});
 try{await service.refresh();const before=service.getState();view.setDraft({text:'unsubmitted'});view.setDraft(service.getState().filter);assert.equal(requests.length,1);assert.equal(view.service,service);assert.deepEqual(view.getState().draft,before.filter);assert.equal(service.getState(),before);assert.equal(view.filters.getState().open,false);
  await service.setFilter({});assert.equal(requests.length,2);assert.equal(service.getState().filter.text,null);assert.equal(view.getState().draft.text,null);assert.equal(requests[1].page.cursor,null);
 }finally{off();view.destroy();service.destroy();}
});
test('StructuredLogExplorer composes one QueryForm and named public slots with the original disclosure',()=>{
 const {service}=create(),view=createStructuredLogViewController({service});
 try{const html=renderToStaticMarkup(React.createElement(StructuredLogExplorer,{viewController:view,headerActions:React.createElement('span',null,'HEADER_SLOT'),pageToolbar:React.createElement('span',null,'PAGE_TOOLBAR_SLOT')}));
  assert.equal((html.match(/<form\b/g)||[]).length,1);assert.match(html,/xui-query-form/);assert.match(html,/data-query-width="primary"/);assert.match(html,/data-query-width="compact"/);assert.ok(html.includes('type="reset"'));assert.ok(html.includes('Reset draft'));assert.ok(html.includes('清除已生效筛选'));assert.ok(html.includes('Summary text: submitted'));
  assert.ok(html.indexOf('HEADER_SLOT')<html.indexOf('PAGE_TOOLBAR_SLOT'));assert.ok(html.indexOf('PAGE_TOOLBAR_SLOT')<html.indexOf('<form'));
 }finally{view.destroy();service.destroy();}
});
test('manually supplied prior labels keep working with default names for new query actions',()=>{
 const {service}=create();const {resetDraft,appliedFilters,...labels}=service.labels;
 try{const html=renderToStaticMarkup(React.createElement(StructuredLogExplorer,{controller:{...service,labels}}));assert.ok(html.includes('Reset draft'));assert.ok(html.includes('Applied filters'));assert.ok(html.includes('清除已生效筛选'));}finally{service.destroy();}
});
