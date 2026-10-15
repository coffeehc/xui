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
  for(const status of ['refreshing','error']){const markup=render({status,onRetry:()=>{}});assert.match(markup,/First record/);assert.match(markup,status==='error'?/Retry/:/Refreshing/);assert.ok(markup.indexOf('class="xui-data-table-feedback"')>markup.indexOf('<footer '));}
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

test('width accepts finite pixels, CSS lengths and responsive expressions, rejecting invalid shapes',()=>{
  for(const width of [0,128,1.5,'12rem','25%','clamp(12rem, 35%, 30rem)','calc(50% - 1rem)','min(20vw, 12rem)','max(10rem, 30%)','var(--layout-field-min)'])assert.doesNotThrow(()=>validateDataTableKeys([],[{id:'one',width}],row=>row.id));
  for(const width of [-1,NaN,Infinity,-Infinity,null,true,{},[],['12rem'],'','120','auto','-1px','1fr','200px; color:red','clamp(1rem, 50%, 20rem','calc()','calc(1rem)) calc(2rem)','calc(1px/*no*/)'])assert.throws(()=>validateDataTableKeys([],[{id:'one',width}],row=>row.id),/DataTable width/);
});
test('browser CSS parser rejects malformed width math before rendering',()=>{
  const prior=Object.getOwnPropertyDescriptor(globalThis,'CSS');globalThis.CSS={supports:(property,value)=>property==='width'&&value==='calc(50% - 1rem)'};
  try{assert.throws(()=>validateDataTableKeys([],[{id:'one',width:'calc(bad)'}],()=>''),/DataTable width/);assert.doesNotThrow(()=>validateDataTableKeys([],[{id:'one',width:'calc(50% - 1rem)'}],()=>''));}
  finally{if(prior)Object.defineProperty(globalThis,'CSS',prior);else delete globalThis.CSS;}
});
test('React widths use a single colgroup while empty, hidden and reordered columns remain aligned structurally',()=>{
  const named={...columns[0],width:'clamp(12rem, 35%, 30rem)'},fixed={id:'fixed',header:'Fixed',cell:()=> 'Value',width:128,sticky:'end'};
  const html=render({columns:[named,fixed]});assert.match(html,/data-column-sizing="sized"/);assert.match(html,/<colgroup><col style="width:clamp\(12rem, 35%, 30rem\)"\/><col style="width:128px"\/><\/colgroup>/);assert.match(html,/class="xui-data-table-widths" aria-hidden="true"/);
  assert.match(render({columns:[named,{...fixed,width:undefined}]}),/data-column-sizing="mixed"/);assert.doesNotMatch(render({}),/data-column-sizing=/);
  const empty=render({columns:[fixed,named],rows:[]});assert.match(empty,/colspan="2"/i);assert.ok(empty.indexOf('width:128px',empty.indexOf('<colgroup>'))<empty.indexOf('width:clamp(',empty.indexOf('<colgroup>')));
  const hidden=render({columns:[fixed]});assert.equal((hidden.match(/<col style=/g)||[]).length,1);assert.doesNotMatch(hidden,/Record name/);assert.match(hidden,/data-sticky="end"/);
});

test('layout defaults to natural, retains explicit fill/document, and validates at the shared boundary',()=>{
  assert.equal(getDataTableState({label:'Records'},0).layout,'natural');
  for(const layout of ['natural','workspace','document']){assert.equal(getDataTableState({label:'Records',layout},1).layout,layout);assert.match(render({layout}),new RegExp(`data-layout="${layout}"`));}
  assert.throws(()=>getDataTableState({label:'Records',layout:'fill'},1),/Invalid Collection layout/);
  assert.match(render({}),/data-layout="natural"/);
});
test('React toolbar, table and the one controlled footer belong to a single frame',()=>{
  const html=render({toolbar:React.createElement('button',null,'Filter')});
  assert.match(html,/<div class="xui-data-table-frame"><div class="xui-data-table-tools"><button>Filter<\/button><\/div>/);
  assert.equal((html.match(/<footer /g)||[]).length,1);
  const footer=html.slice(html.indexOf('<footer '),html.indexOf('</footer>'));
  assert.match(footer,/1 shown · 125 total/);assert.match(footer,/Rows per page/);assert.match(footer,/xui-pagination/);
  assert.doesNotMatch(render({pagination:undefined}),/Rows per page|xui-pagination/);
});
test('local pagination slices once in its host and uses the same controlled page facts without a resource',async()=>{
  const {build}=await import('esbuild');
  const built=await build({entryPoints:['examples/shared/data-table-model.ts'],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
  const {createDataTableExample}=await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].contents).toString('base64')}`);
  for(const offset of [0,1]){
    const owner=createDataTableExample({local:true,offset});owner.load();let state=owner.getState();assert.equal(state.rows.length,20);assert.equal(state.total,125);
    owner.page(offset+1);state=owner.getState();assert.equal(state.pageIndex,offset+1);assert.equal(state.rows[0].id,'21');
    owner.pageSize(50);state=owner.getState();assert.equal(state.pageIndex,offset);assert.equal(state.rows.length,50);
    owner.filter('search','记录 125');state=owner.getState();assert.equal(state.rows.length,1);assert.equal(state.total,1);assert.equal(state.rows[0].id,'125');
    assert.deepEqual(owner.getRequests(),[]);owner.destroy();owner.clear();assert.equal(owner.getState(),state);
  }
});
test('layout CSS keeps natural sizing independent of DataRegion import order and document out of flex shrinking',async()=>{
  const {readFile}=await import('node:fs/promises');
  const css=await readFile('packages/theme/dist/table.css','utf8');
  assert.match(css,/\.xui-data-table\[data-layout='natural'\]\s*\{[^}]*max-block-size:100%;[^}]*min-block-size:0;/);
  assert.match(css,/\.xui-data-table\[data-layout='document'\]\s*\{[^}]*flex:none;[^}]*min-block-size:0;/);
  assert.match(css,/\.xui-data-table-frame\s*\{[^}]*display:grid;[^}]*min-block-size:0;/);
  assert.match(css,/\.xui-data-table\[data-layout='workspace'\]\s*\{[^}]*min-block-size:var\(--data-table-min-block-size\);/);
  assert.doesNotMatch(css,/min-block-size:min-content/);
});

test('cursor pagination requires explicit end/previous facts and never derives numbered pages even with total',()=>{
  const cursor={mode:'cursor',pageSize:20,total:null,nextCursor:'opaque + / 中文',hasPrevious:false};
  for(const total of [null,0,100]){const state=getDataTableState({label:'Records',pagination:{...cursor,total}},20);assert.equal(state.pageCount,null);assert.equal(state.outOfRange,false);const markup=render({pagination:{...cursor,total,onNext:()=>{}}});assert.match(markup,/class="xui-pagination"/);assert.doesNotMatch(markup,/1 \/ [0-9]/);assert.match(markup,/Next page/);}
  for(const invalid of [{...cursor,nextCursor:undefined},{...cursor,nextCursor:''},{...cursor,hasPrevious:undefined},{...cursor,hasPrevious:1},{...cursor,total:undefined},{...cursor,pageSize:0},{...pagination,mode:'invented'}])assert.throws(()=>getDataTableState({label:'Records',pagination:invalid},20),TypeError);
  const end=render({pagination:{...cursor,nextCursor:null,hasPrevious:true,onPrevious:()=>{}}});assert.match(end,/Next page/);assert.doesNotMatch(end,/opaque/);
});

test('cursor example commits exact server tokens/history only after success, cancels late reads and resets filters',async()=>{
  const {build}=await import('esbuild');
  const built=await build({entryPoints:['examples/shared/data-table-model.ts'],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
  const {createDataTableExample}=await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].contents).toString('base64')}`);
  const owner=createDataTableExample({cursor:true,unknown:true,pageSize:100});
  const waitFor=async(condition)=>{const until=Date.now()+3000;while(!condition()){if(Date.now()>until)throw Error('Cursor example did not settle');await new Promise(resolve=>setTimeout(resolve,5));}};
  const plan=()=>owner.planNext({delayMs:5});plan();owner.load();await waitFor(()=>owner.getState().status==='ready');let state=owner.getState();assert.equal(state.total,null);assert.equal(state.rows.length,100);assert.equal(state.hasPrevious,false);assert.equal(state.nextCursor,'fixture:+/100');
  const token=state.nextCursor;plan();owner.next(token);assert.equal(owner.getState().nextCursor,token);assert.equal(owner.getState().hasPrevious,false);await waitFor(()=>owner.getState().status==='ready');state=owner.getState();assert.equal(state.rows.length,25);assert.equal(state.rows[0].id,'101');assert.equal(state.nextCursor,null);assert.equal(state.hasPrevious,true);
  plan();owner.previous();await waitFor(()=>owner.getState().status==='ready');assert.equal(owner.getState().rows[0].id,'1');assert.equal(owner.getState().hasPrevious,false);
  owner.planNext({delayMs:80,ignoreAbort:true});owner.next(token);owner.cancel();await new Promise(resolve=>setTimeout(resolve,100));assert.equal(owner.getState().rows[0].id,'1');assert.equal(owner.getState().hasPrevious,false);
  owner.planNext({delayMs:5,fail:true});owner.next(token);await waitFor(()=>owner.getState().status==='error');assert.equal(owner.getState().hasPrevious,false);assert.equal(owner.getState().nextCursor,token);plan();owner.retry();await waitFor(()=>owner.getState().status==='ready');assert.equal(owner.getState().hasPrevious,true);
  owner.planNext({delayMs:80,ignoreAbort:true});owner.filter('search','记录 1');plan();owner.filter('search','记录 125');await waitFor(()=>owner.getState().status==='ready');await new Promise(resolve=>setTimeout(resolve,100));assert.equal(owner.getState().rows.length,1);assert.equal(owner.getState().rows[0].id,'125');assert.equal(owner.getState().nextCursor,null);assert.equal(owner.getState().hasPrevious,false);
  for(const request of owner.getRequests().map(JSON.parse)){assert.equal(request.return_total,false);assert.equal('page_index' in request,false);assert.equal('total' in request,false);}
  assert.equal(JSON.parse(owner.getRequests()[1]).cursor,token);owner.destroy();
});

test('React empty cursor body does not turn an explicit continuation token into end-of-list',()=>{
  for(const nextCursor of ['scan:one','scan:two']){
    const markup=render({rows:[],pagination:{mode:'cursor',pageSize:20,total:null,nextCursor,hasPrevious:false,onNext:()=>{}}});
    assert.match(markup,/No records yet/);const next=markup.match(/<button([^>]*)>Next page<\/button>/);assert.ok(next);assert.doesNotMatch(next[1],/disabled/);
  }
});

test('React feedback lives beside the existing count and an omitted count/pagination does not leave an empty footer',()=>{
  const html=render({status:'error',onRetry:()=>{},labels:{error:'Complete error with recovery conditions'}});
  const footer=html.slice(html.indexOf('<footer '));assert.match(footer,/Complete error with recovery conditions/);assert.match(footer,/1 shown · 125 total/);assert.match(footer,/Retry/);
  const empty=render({pagination:undefined,labels:{count:()=>''}});assert.match(empty,/<footer class="xui-data-table-footer" hidden=""/);
  const feedback=render({pagination:undefined,labels:{count:()=>''},feedback:React.createElement('button',null,'Read details')});assert.match(feedback,/<footer class="xui-data-table-footer">/);assert.match(feedback,/Read details/);
});
