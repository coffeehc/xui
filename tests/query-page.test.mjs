import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {build} from 'esbuild';
import {QueryForm,QueryField} from '../packages/ui-react/dist/search-toolbar.js';
import {QueryForm as RootQueryForm} from '../packages/ui-react/dist/index.js';
import {Input} from '../packages/ui-react/dist/forms.js';
import {EmptyState} from '../packages/ui-react/dist/feedback.js';
import {DataTable} from '../packages/ui-react/dist/data-table.js';
import {CardGroup} from '../packages/ui-react/dist/card-group.js';
const h=React.createElement;

test('query form is one named native form with associated field validation and existing disclosure',()=>{
  assert.equal(RootQueryForm,QueryForm);
  const markup=render(h(QueryForm,{label:'消息查询',id:'query',onSubmit:()=>{},fields:h(QueryField,{label:'Agent ID',required:true,width:'primary',help:'完整标识',error:'必须输入'},h(Input,{name:'agent'})),actions:h('button',{type:'submit'},'查询'),advanced:h(Input,{'aria-label':'日期'}),summary:'已查询：昨天'}));
  assert.equal((markup.match(/<form /g)||[]).length,1);assert.match(markup,/<form aria-label="消息查询" id="query"/);
  const id=markup.match(/<input[^>]*\sid="([^"]+)"/)[1];assert.ok(markup.includes(`for="${id}"`));assert.ok(markup.includes(`aria-describedby="${id}-help ${id}-error"`));assert.match(markup,/aria-invalid="true"/);assert.match(markup,/required=""/);
  assert.match(markup,/hidden="" inert=""/);assert.match(markup,/aria-expanded="false"/);assert.match(markup,/xui-query-summary/);
  assert.throws(()=>render(h(QueryForm,{label:' ',fields:null,actions:null})),/accessible label/);
});

test('query slots are optional where documented; old default EmptyState remains start aligned',()=>{
  const markup=render(h(QueryForm,{label:'Query',fields:null,actions:null}));assert.doesNotMatch(markup,/xui-query-summary|aria-expanded|xui-query-fields/);
  for(const width of ['primary','compact','standard','full'])assert.match(render(h(QueryField,{width,label:'Width'},h(Input))),new RegExp(`data-query-width="${width}"`));
  assert.match(render(h(EmptyState,{title:'Waiting'})),/data-align="start"/);
  const centered=render(h(EmptyState,{title:'Waiting',icon:'⌕',align:'center'}));assert.match(centered,/data-align="center"/);assert.match(centered,/class="xui-state-icon" aria-hidden="true"/);
});

test('unconfirmed collections do not announce fabricated zero counts; confirmed empty and refresh retain facts',()=>{
  for(const [component,base] of [[DataTable,{columns:[{id:'id',header:'ID',cell:row=>row.id}],rowKey:row=>row.id,idleState:h(EmptyState,{title:'Start query'})}],[CardGroup,{rowKey:row=>row.id,renderCard:row=>row.id}]]){
    for(const status of ['idle','loading','error']){
      const markup=render(h(component,{...base,label:'Results',rows:[],status,labels:{count:()=>{throw Error('Count is not confirmed');}}}));
      assert.doesNotMatch(markup,/0 loaded|0 total/);if(component===DataTable&&status==='idle')assert.match(markup,/Start query/);
    }
    assert.match(render(h(component,{...base,label:'Results',rows:[],status:'ready'})),/0 loaded/);
    assert.match(render(h(component,{...base,label:'Results',rows:[],status:'error',hasValue:true})),/0 loaded/);
  }
});

test('complete query example keeps applied scope, pagination and generation separate from drafts',async()=>{
  const result=await build({entryPoints:['examples/shared/query-page-model.ts'],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
  const {createQueryPageExample,readQuery,queryStatus}=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString('base64')}`);
  const example=createQueryPageExample(),draft={agent:' Alpha ',status:'all',start:'',end:''};example.fixture({delay:1});
  try{
    await example.submit({...draft,agent:''});assert.equal(example.requestCount(),0);
    await example.submit(draft);const first=example.resource.getState();assert.equal(first.value.rows.length,5);assert.equal(first.value.total,13);assert.equal(readQuery(first.key).agent,'Alpha');
    example.fixture({delay:25});const refresh=example.refresh();assert.equal(queryStatus(example.resource.getState()),'refreshing');assert.equal(example.resource.getState().value,first.value);await refresh;
    example.fixture({next:'error'});await example.refresh();assert.equal(example.resource.getState().hasValue,true);assert.equal(example.resource.getState().status,'error');assert.equal(example.resource.getState().value.rows[0].agent,'Alpha');
    await example.resource.retry();await example.page(2);assert.equal(example.resource.getState().value.rows.length,3);assert.equal(example.resource.getState().value.pageIndex,2);
    const old=example.submit({...draft,agent:'Old'});example.fixture({delay:1});const newer=example.submit({...draft,agent:'New'});assert.equal(example.resource.getState().hasValue,false);assert.equal(example.resource.getState().value,undefined);await Promise.all([old,newer]);assert.equal(example.resource.getState().value.rows[0].agent,'New');
    example.fixture({next:'empty'});await example.submit({...draft,agent:'Empty'});assert.equal(queryStatus(example.resource.getState()),'ready');assert.equal(example.resource.getState().hasValue,true);assert.equal(example.resource.getState().value.total,0);
    example.fixture({delay:100});const pending=example.submit({...draft,agent:'Cancelled'});example.resource.cancel();await pending;assert.equal(queryStatus(example.resource.getState()),'idle');assert.equal(example.resource.getState().hasValue,false);
  }finally{example.destroy();}
});
