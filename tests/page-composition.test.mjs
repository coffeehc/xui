import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {build} from 'esbuild';
import {FormGrid,FormActions} from '../packages/ui-react/dist/layout.js';
import {Fieldset} from '../packages/ui-react/dist/forms.js';
import {DataRegion,LoadingState} from '../packages/ui-react/dist/feedback.js';
const h=React.createElement,render=renderToStaticMarkup;
test('form layout preserves semantics, default compatibility and action order',()=>{
  const html=render(h(Fieldset,{legend:'范围'},h(FormGrid,null,h(FormGrid.Item,null,'短字段'),h(FormGrid.Item,{span:'full'},'长字段')),h(FormActions,{secondary:h('button',{type:'button'},'取消')},h('button',{type:'submit'},'保存'))));
  assert.match(html,/<fieldset[^>]*data-layout="inline"/);assert.match(html,/<legend[^>]*>范围<\/legend>/);assert.match(html,/data-columns="2"/);assert.match(html,/data-span="full"/);assert.ok(html.indexOf('取消')<html.indexOf('保存'));
  assert.doesNotMatch(render(h(FormActions,null)),/xui-form-actions-(primary|secondary)/);
  assert.match(render(h(Fieldset,{legend:'范围',layout:'stack'})),/data-layout="stack"/);
});
test('feedback additions keep reserved/block defaults and one named loading status',()=>{
  assert.match(render(h(DataRegion,{feedback:null},'内容')),/data-layout="reserved"/);
  assert.match(render(h(DataRegion,{feedbackLayout:'flow',feedback:null},'内容')),/data-layout="flow"/);
  const html=render(h(LoadingState,{layout:'inline'},'正在刷新'));
  assert.equal((html.match(/role="status"/g)??[]).length,1);assert.match(html,/aria-hidden="true"/);assert.match(html,/data-layout="inline"/);
  assert.match(render(h(LoadingState)),/data-layout="block"/);
});
const bundled=await build({entryPoints:['examples/shared/page-composition-model.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {createPageCompositionExample,initialStudyDraft}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
test('reference owner retains facts during failure, explicit retry and local filtering',async()=>{
  const owner=createPageCompositionExample();try{
    assert.equal(owner.getState().total,null);await owner.load();owner.select('R-001');owner.setQuery('R-001');
    owner.planNext({fail:true,delayMs:20});const pending=owner.refresh();assert.equal(owner.getState().status,'refreshing');assert.equal(owner.getState().rows[0].id,'R-001');await pending;
    assert.equal(owner.getState().status,'error');assert.equal(owner.getState().selectedId,'R-001');assert.equal(owner.getState().query,'R-001');assert.equal(owner.getState().rows.length,1);
    owner.planNext({delayMs:0});await owner.retry();assert.equal(owner.getState().status,'ready');assert.equal(owner.getState().rows[0].id,'R-001');
    owner.setQuery('不存在');assert.equal(owner.getState().total,0);owner.clear();assert.equal(owner.getState().total,36);
  }finally{owner.destroy();}
});
test('confirmed creation supersedes an older read; one saving owner rejects duplicate writes',async()=>{
  const owner=createPageCompositionExample();try{
    owner.planNext({delayMs:0});await owner.load();owner.planNext({delayMs:900});const read=owner.refresh();const creation=owner.create(initialStudyDraft());
    assert.equal(owner.getState().saving,true);await assert.rejects(owner.create(initialStudyDraft()),/already active/);await creation;await read;
    assert.equal(owner.getState().rows[0].id,'R-037');assert.equal(owner.getState().total,37);assert.equal(owner.getState().submitCount,1);assert.equal(owner.getState().saving,false);
  }finally{owner.destroy();}
});
test('creation failure retains read facts and destroy cancels an active write',async()=>{
  const owner=createPageCompositionExample();owner.planNext({delayMs:0});await owner.load();owner.failNextSubmit();await assert.rejects(owner.create(initialStudyDraft()),/failed/);assert.equal(owner.getState().total,36);assert.equal(owner.getState().saving,false);
  const pending=owner.create(initialStudyDraft());owner.destroy();await assert.rejects(pending,error=>error.name==='AbortError');
});
