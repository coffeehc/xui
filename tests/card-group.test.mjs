import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import {CardGroup} from '../packages/ui-react/dist/card-group.js';
import {CardGroup as RootGroup} from '../packages/ui-react/dist/index.js';
import {getCollectionState,collectionDefaultLabels,validateCollectionKeys,createCollectionRequestGuard} from '../packages/runtime/dist/collection-view.js';
import {getDataTableState,dataTableDefaultLabels,createDataTableRequestGuard} from '../packages/runtime/dist/data-table.js';
const rows=[{id:'a',name:'任务甲'},{id:'b',name:'任务乙'}];
const render=extra=>renderToString(React.createElement(CardGroup,{label:'任务',rows,rowKey:row=>row.id,renderCard:row=>({title:row.name,description:'来源',children:'正文',footerMeta:row.id}),...extra})).replace(/<!--.*?-->/g,'');
test('CardGroup exposes one React implementation and always creates public three-region Cards',()=>{
 assert.equal(CardGroup,RootGroup);const html=render();assert.match(html,/<ul class="xui-grid xui-card-group-items">/);assert.equal((html.match(/class="xui-card-group-item"/g)||[]).length,2);assert.equal((html.match(/xui-card-content/g)||[]).length,2);assert.equal((html.match(/xui-card-footer/g)||[]).length,2);assert.doesNotMatch(html,/role="button"|tabindex="0"[^>]*class="xui-card"/);
 assert.throws(()=>render({renderCard:()=>React.createElement('div')}),/return public Card props/);
});
test('record context uses current keys/order and reports busy and disabled without altering data',()=>{
 for(const options of [{},{status:'refreshing'},{disabled:true}]){const received=[];render({rows:[rows[1],rows[0]],...options,renderCard:(row,ctx)=>{received.push([row.id,ctx]);return {title:row.name};}});assert.equal(received[0][0],'b');assert.equal(received[0][1].rowKey,'b');assert.equal(received[0][1].rowIndex,0);assert.equal(received[0][1].busy,options.status==='refreshing');assert.equal(received[0][1].disabled,!!options.disabled||options.status==='refreshing');}
});
test('first loading, idle, empty, filtered empty and first error have distinct presentations',()=>{
 for(const [props,text] of [[{status:'loading'},'Loading…'],[{status:'idle'},'Ready to load'],[{},'No records yet'],[{filtered:true},'No matching records'],[{status:'error'},'Could not load records']])assert.match(render({rows:[],...props}),new RegExp(text));
 assert.match(render({rows:[],status:'error',onRetry(){}}),/Retry/);
 assert.match(render({rows:[],emptyState:'独立空态'}),/独立空态/);
});
test('refresh and refresh failure keep the same Card tree and put feedback in the footer',()=>{
 for(const status of ['refreshing','error']){const html=render({status,onRetry(){}});assert.equal((html.match(/xui-card-group-item"/g)||[]).length,2);assert.match(html,/<footer.*xui-card-group-footer/);assert.match(html,new RegExp(status==='error'?'Could not load records':'Refreshing…'));assert.doesNotMatch(html,/xui-card-group-placeholder/);}
 assert.doesNotMatch(render({toolbar:React.createElement(React.Fragment),footer:React.createElement(React.Fragment),labels:{count:()=>''}}),/xui-card-group-tools|xui-card-group-footer-extra/);
});
test('table and cards share exactly one state/default labels/request guard implementation',()=>{
 assert.equal(getCollectionState,getDataTableState);assert.equal(collectionDefaultLabels,dataTableDefaultLabels);assert.equal(createCollectionRequestGuard,createDataTableRequestGuard);
 for(const status of ['idle','loading','ready','refreshing','error'])assert.deepEqual(getCollectionState({label:'对象',status},2),getDataTableState({label:'对象',status},2));
 for(const layout of ['natural','workspace','document'])assert.match(render({layout}),new RegExp(`data-layout="${layout}"`));
});
test('stable keys reject numeric/string collisions, invalid numbers and duplicates before templating',()=>{
 assert.deepEqual(validateCollectionKeys(rows,row=>row.id),['a','b']);
 for(const ids of [[1,'1'],['a','a'],[NaN],[Infinity],[null],[{}]])assert.throws(()=>validateCollectionKeys(ids,id=>id),TypeError);
 let calls=0;assert.throws(()=>render({rows:[rows[0],rows[0]],renderCard:()=>{calls++;return {title:'不执行'};}}),TypeError);assert.equal(calls,0);
});
test('offset/cursor pagination remains controlled, unknown total never creates numbered pages',()=>{
 const offset={pageIndex:0,pageIndexOffset:0,pageSize:6,total:20,pageSizeOptions:[6,12],onPageChange(){}};
 assert.match(render({pagination:offset}),/1 \/ 4/);
 assert.doesNotMatch(render({pagination:{...offset,total:null}}),/1 \/ 4/);
 const cursor={mode:'cursor',pageSize:6,total:null,nextCursor:'opaque',hasPrevious:false,onNext(){}};assert.match(render({pagination:cursor}),/Next page/);assert.doesNotMatch(render({pagination:cursor}),/1 \/ /);
 assert.throws(()=>render({pagination:{...cursor,nextCursor:undefined}}),TypeError);
});
