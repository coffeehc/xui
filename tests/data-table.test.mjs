import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {getDataTableState,validateDataTableKeys,createDataTableRequestGuard} from '../packages/runtime/dist/data-table.js';
import {DataTable,DataTableToolbar,DataTableFilter} from '../packages/ui-react/dist/data-table.js';
import {NativeSelect} from '../packages/ui-react/dist/forms.js';
const pagination={pageIndex:0,pageIndexOffset:0,pageSize:20,total:125,pageSizeOptions:[20,50,100]};
test('DataTable translates only an explicit endpoint page offset and known total',()=>{
  assert.deepEqual([getDataTableState({label:'Records',pagination},20).page,getDataTableState({label:'Records',pagination},20).pageCount],[1,7]);
  assert.equal(getDataTableState({label:'Records',pagination:{...pagination,pageIndex:1,pageIndexOffset:1}},20).page,1);
  assert.equal(getDataTableState({label:'Records',pagination:{...pagination,total:null}},20).pageCount,null);
  const stale=getDataTableState({label:'Records',pagination:{...pagination,pageIndex:9,total:1}},0);assert.equal(stale.outOfRange,true);assert.equal(stale.page,10);
  for(const page of [{...pagination,pageIndexOffset:undefined},{...pagination,pageIndex:-1},{...pagination,pageSize:0},{...pagination,total:-1},{...pagination,total:Infinity},{...pagination,pageSizeOptions:[50,100]},{...pagination,pageSizeOptions:[20,20]}])assert.throws(()=>getDataTableState({label:'Records',pagination:page},0),TypeError);
});
test('DataTable row/column keys reject ambiguity and status is not fabricated from empty rows',()=>{
  assert.throws(()=>validateDataTableKeys([],[],row=>row.id),TypeError);assert.throws(()=>validateDataTableKeys([{id:1},{id:'1'}],[{id:'name'}],row=>row.id),TypeError);
  assert.throws(()=>validateDataTableKeys([],[{id:'x'},{id:'x'}],row=>row.id),TypeError);
  assert.equal(getDataTableState({label:'Records',status:'error'},0).status,'error');assert.equal(getDataTableState({label:'Records',status:'refreshing'},20).blocked,true);
  assert.throws(()=>getDataTableState({label:''},0),TypeError);
});
test('one-turn request guard prevents reentrant duplicate calls without owning the request',async()=>{
  const guard=createDataTableRequestGuard();let count=0;const request=()=>{count++;guard.run(false,request);};guard.run(false,request);guard.run(false,request);assert.equal(count,1);await Promise.resolve();guard.run(true,request);assert.equal(count,1);guard.run(false,request);assert.equal(count,2);guard.destroy();await Promise.resolve();guard.run(false,request);assert.equal(count,2);
});
const columns=[{id:'name',header:'Record name',cell:row=>row.name}],rows=[{id:'one',name:'First record'}];
const render=props=>renderToStaticMarkup(React.createElement(DataTable,{label:'Records',rowKey:row=>row.id,columns,rows,pagination,...props}));
test('React empty, loading and error bodies always retain semantic headers',()=>{
  for(const status of ['idle','loading','ready','error']){const markup=render({rows:[],status});assert.match(markup,/<thead><tr[^>]*><th scope="col"/);assert.match(markup,/<tbody>/);assert.equal((markup.match(/aria-label="Rows per page"/g)||[]).length,1);if(status==='loading'){assert.match(markup,/xui-skeleton/);assert.doesNotMatch(markup,/No records yet/);}if(status==='error'){assert.match(markup,/role="alert"/);assert.doesNotMatch(markup,/No records yet/);}}
  assert.match(render({rows:[],filtered:true}),/No matching records/);assert.match(render({rows:[]}),/No records yet/);
});
test('React refresh and failure preserve rows; numbered controls never guess unknown totals',()=>{
  for(const status of ['refreshing','error']){const markup=render({status,onRetry:()=>{}});assert.match(markup,/First record/);assert.match(markup,status==='error'?/Retry/:/Refreshing/);assert.match(markup,/<div class="xui-data-table-frame"><div class="xui-data-table-feedback">/);}
  const unknown=render({pagination:{...pagination,total:null}});assert.doesNotMatch(unknown,/class="xui-pagination"/);assert.match(unknown,/1 loaded/);
  assert.doesNotMatch(render({pagination:{...pagination,pageIndex:9,total:1}}),/class="xui-pagination"/);
});
test('React public filters reuse Toolbar and Field labels without a second search owner',()=>{
  const html=renderToStaticMarkup(React.createElement(DataTableToolbar,{'aria-label':'Filters'},React.createElement(DataTableFilter,{label:'Type'},React.createElement(NativeSelect,null,React.createElement('option',null,'All')))));
  assert.match(html,/xui-toolbar xui-data-table-toolbar/);assert.match(html,/xui-field xui-data-table-filter/);assert.match(html,/<label[^>]*for=/);
});
test('synthetic read owner keeps confirmed pagination, cancels and discards uncooperative late results',async()=>{
  const {build}=await import('esbuild');const {pathToFileURL}=await import('node:url');
  const built=await build({entryPoints:['examples/shared/data-table-model.ts'],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
  const {createDataTableExample}=await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].contents).toString('base64')}`);
  const owner=createDataTableExample();const waitFor=async(condition)=>{const end=Date.now()+3000;while(!condition()){if(Date.now()>end)throw Error('Synthetic read did not settle');await new Promise(resolve=>setTimeout(resolve,5));}};
  owner.planNext({delayMs:5});owner.load();await waitFor(()=>owner.getState().status==='ready');assert.equal(owner.getState().rows.length,20);assert.equal(owner.getState().total,125);
  owner.planNext({delayMs:100,ignoreAbort:true});owner.pageSize(50);await waitFor(()=>owner.getRequests().length===2);assert.equal(owner.getState().pageSize,20);assert.equal(owner.getState().rows.length,20);owner.cancel();await new Promise(resolve=>setTimeout(resolve,120));assert.equal(owner.getState().pageSize,20);assert.equal(owner.getState().rows.length,20);
  owner.planNext({delayMs:100,ignoreAbort:true});owner.filter('search','记录 1');await waitFor(()=>owner.getRequests().length===3);owner.planNext({delayMs:5});owner.filter('search','记录 125');await waitFor(()=>owner.getState().status==='ready');assert.equal(owner.getState().rows[0].id,'125');await new Promise(resolve=>setTimeout(resolve,120));assert.equal(owner.getState().rows.length,1);assert.equal(owner.getState().total,1);owner.destroy();
});
test('React empty optional slots do not reserve wrappers and numeric zero remains content',()=>{
  for(const toolbar of ['',null,undefined,false,[],React.createElement(React.Fragment)])assert.doesNotMatch(render({toolbar}),/class="xui-data-table-tools"/);
  const zero=render({toolbar:0,feedback:0,footer:0});assert.match(zero,/class="xui-data-table-tools">0<\/div>/);assert.match(zero,/class="xui-data-table-feedback">0<\/div>/);assert.match(zero,/class="xui-data-table-footer-extra">0<\/div>/);
});
