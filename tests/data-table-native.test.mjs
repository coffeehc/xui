import test from 'node:test';
import assert from 'node:assert/strict';
import {createDataTable,createDataTableToolbar,createDataTableFilter} from '../packages/runtime/dist/data-table-dom.js';
import {navigationDOM,fire} from './fixtures/navigation-dom.mjs';
const page={pageIndex:0,pageIndexOffset:0,pageSize:20,total:125,pageSizeOptions:[20,50,100]};
const base={label:'Records',columns:[{id:'name',header:'Name',cell:row=>row.name}],rows:[{id:'one',name:'First'}],rowKey:row=>row.id,pagination:page};
const find=(root,text)=>root.querySelectorAll('button').find(node=>node.textContent===text);
test('native controlled page/pageSize requests report once, never change confirmed values, and honor busy/disabled',async()=>{
  const {root}=navigationDOM(),requests=[];const owner=createDataTable(root,{...base,pagination:{...page,onPageChange:value=>requests.push(['page',value]),onPageSizeChange:value=>requests.push(['size',value])}}),next=find(root,'Next page');next.click();next.click();assert.deepEqual(requests,[['page',1]]);assert.match(root.textContent,/1 \/ 7/);await Promise.resolve();
  const select=root.querySelector('select');select.value='50';fire(select,'change');assert.deepEqual(requests,[['page',1],['size',50]]);assert.equal(select.value,'20');
  owner.update({status:'refreshing'});next.click();select.value='100';fire(select,'change');assert.equal(select.value,'20');assert.equal(requests.length,2);
  owner.update({status:'ready',disabled:true});await Promise.resolve();next.click();assert.equal(requests.length,2);owner.destroy();next.click();owner.update({disabled:false});assert.equal(requests.length,2);
});
test('native footer updates retain search, row action, table body, focus and cell lifecycle',()=>{
  const {root,doc}=navigationDOM();const search=doc.createElement('input'),toolbar=createDataTableToolbar(doc,[createDataTableFilter(doc,{label:'Search',control:search,grow:true})]);let creates=0,updates=0,disposes=0;
  const columns=[...base.columns,{id:'action',header:'Action',cell:row=>{creates++;const button=doc.createElement('button');return {element:button,update(value){updates++;button.textContent='View '+value.name;},destroy(){disposes++;button.onclick=null;}};}}];
  const owner=createDataTable(root,{...base,columns,toolbar}),action=find(root,'View First'),body=owner.getBody();action.focus();owner.update({status:'refreshing'});owner.update({status:'error',onRetry:()=>{}});owner.update({pagination:{...page,total:200},status:'ready'});
  assert.equal(root.querySelector('.xui-data-table-feedback').parentElement,root.querySelector('.xui-data-table-frame'));assert.equal(doc.activeElement,action);assert.equal(find(root,'View First'),action);assert.equal(owner.getBody(),body);assert.equal(creates,1);assert.ok(updates>=4);assert.equal(disposes,0);
  search.focus();owner.update({pagination:{...page,total:50}});assert.equal(doc.activeElement,search);assert.equal(root.querySelector('input'),search);
  owner.update({rows:[{id:'one',name:'Updated'}]});assert.equal(find(root,'View Updated'),action);assert.equal(creates,1);owner.update({rows:[]});assert.equal(disposes,1);owner.destroy();assert.equal(disposes,1);
});
test('native empty/loading/error states retain column headers and use tbody for feedback',()=>{
  const {root}=navigationDOM(),owner=createDataTable(root,{...base,rows:[]});const header=root.querySelector('thead');assert.equal(root.querySelector('tbody').textContent,'No records yet');
  owner.update({filtered:true});assert.equal(root.querySelector('tbody').textContent,'No matching records');owner.update({status:'loading'});assert.equal(root.querySelectorAll('.xui-skeleton').length,5);assert.doesNotMatch(root.querySelector('tbody').textContent,/No matching/);
  owner.update({status:'error',onRetry:()=>{}});assert.match(root.querySelector('tbody').textContent,/Could not load recordsRetry/);assert.equal(root.querySelector('thead'),header);
  owner.update({status:'ready',rows:base.rows});assert.equal(root.querySelector('thead'),header);assert.equal(root.querySelector('tbody').textContent,'First');owner.destroy();
});
test('native unknown totals and stale ranges do not manufacture numbered pages',()=>{
  const {root}=navigationDOM(),owner=createDataTable(root,{...base,pagination:{...page,total:null}});assert.equal(root.querySelector('.xui-pagination').hidden,true);assert.match(root.querySelector('.xui-data-table-count').textContent,/1 loaded/);
  owner.update({pagination:{...page,total:1,pageIndex:5}});assert.equal(root.querySelector('.xui-pagination').hidden,true);owner.destroy();
});
test('native validation is atomic, failed factories release root, and destruction restores host content',()=>{
  const {root,original}=navigationDOM();root.className='host';assert.throws(()=>createDataTable(root,{...base,columns:[]}),TypeError);assert.equal(root.childNodes[0],original);
  let cleaned=0;assert.throws(()=>createDataTable(root,{...base,columns:[{id:'one',header:'One',cell:()=>({element:root.ownerDocument.createElement('span'),destroy(){cleaned++;}})},{id:'two',header:'Two',cell:()=>{throw Error('factory');}}]}),/factory/);assert.equal(cleaned,1);assert.equal(root.childNodes[0],original);
  const owner=createDataTable(root,base);assert.throws(()=>createDataTable(root,base),/already owns/);assert.throws(()=>owner.update({rows:[{id:'x'},{id:'x'}]}),TypeError);assert.equal(root.querySelector('tbody').textContent,'First');owner.destroy();owner.destroy();assert.equal(root.className,'host');assert.equal(root.childNodes[0],original);
});
test('native slot cleanup is once-only even when one host cleanup throws',()=>{
  const {root,doc}=navigationDOM();const calls=[];const owner=createDataTable(root,{...base,columns:[{id:'one',header:'One',cell:()=>({element:doc.createElement('button'),destroy(){calls.push('one');throw Error('cleanup');}})},{id:'two',header:'Two',cell:()=>({element:doc.createElement('button'),destroy(){calls.push('two');}})}]});owner.update({rows:[]});owner.destroy();assert.deepEqual(calls,['one','two']);
});
test('native replacing a Node with identical text removes the old interactive semantics',()=>{
  const {root,doc}=navigationDOM(),button=doc.createElement('button');button.textContent='Same';const owner=createDataTable(root,{...base,columns:[{id:'name',header:button,cell:()=> 'First'}]});owner.update({columns:[{id:'name',header:'Same',cell:()=> 'First'}]});assert.equal(root.querySelector('thead').textContent,'Same');assert.equal(root.querySelector('thead').querySelector('button'),null);owner.destroy();
});
test('native optional slots hide empty strings and retain numeric zero',()=>{
  const {root}=navigationDOM(),owner=createDataTable(root,{...base,toolbar:'',feedback:'',footer:''});assert.equal(root.querySelector('.xui-data-table-tools').hidden,true);assert.equal(root.querySelector('.xui-data-table-feedback').hidden,true);assert.equal(root.querySelector('.xui-data-table-footer-extra').hidden,true);owner.update({toolbar:0,feedback:0,footer:0});for(const name of ['tools','feedback','footer-extra']){assert.equal(root.querySelector('.xui-data-table-'+name).hidden,false);assert.equal(root.querySelector('.xui-data-table-'+name).textContent,'0');}owner.destroy();
});

test('native width tracks update, reorder, hide and clear without replacing retained rows or slots',()=>{
  const {root}=navigationDOM(),cell=base.columns[0].cell;
  const name={id:'name',header:'Name',cell,width:'calc(50% - 1rem)'},fixed={id:'fixed',header:'Fixed',cell:()=> 'Fixed',width:128,sticky:'end'};
  const owner=createDataTable(root,{...base,columns:[name,fixed]}),group=root.querySelector('colgroup'),track=group.children[0],row=root.querySelector('tbody').firstElementChild;
  assert.equal(root.querySelector('table').dataset.columnSizing,'sized');assert.equal(track.style.width,'calc(50% - 1rem)');assert.equal(group.children[1].style.width,'128px');
  owner.update({columns:[fixed,{...name,width:'clamp(12rem, 40%, 30rem)'}]});assert.equal(group.children[1],track);assert.equal(track.style.width,'clamp(12rem, 40%, 30rem)');assert.equal(root.querySelector('tbody').firstElementChild,row);
  owner.update({columns:[{...name,width:undefined},fixed]});assert.equal(track.style.width,'');assert.equal(root.querySelector('table').dataset.columnSizing,'mixed');
  owner.update({columns:[{...name,width:undefined}]});assert.equal(group.children.length,1);assert.equal(root.querySelector('.xui-data-table-widths').children.length,1);assert.equal(root.querySelector('table').dataset.columnSizing,undefined);
  assert.throws(()=>owner.update({columns:[{...name,width:{bad:1}}]}),/DataTable width/);assert.equal(group.children[0],track);owner.destroy();
});
test('native width observer batches used CSS widths and disconnects on update and destroy',()=>{
  const {root,win}=navigationDOM();let callback,disconnects=0,observed=[],frame;win.requestAnimationFrame=fn=>{frame=fn;return 1;};win.cancelAnimationFrame=()=>{frame=undefined;};const flush=()=>{const fn=frame;frame=undefined;fn?.();};
  const previous=Object.getOwnPropertyDescriptor(globalThis,'ResizeObserver');globalThis.ResizeObserver=class {constructor(value){callback=value;}observe(node){observed.push(node);}disconnect(){disconnects++;observed=[];}};
  let pixels='237.5px';win.getComputedStyle=()=>({width:pixels});
  try{
    const owner=createDataTable(root,{...base,columns:[{...base.columns[0],width:'calc(50% - 1rem)'}]}),track=root.querySelector('col');assert.equal(track.style.width,'237.5px');assert.equal(observed.length,2);
    pixels='0px';callback();flush();assert.equal(track.style.width,'0px');pixels='301px';callback();flush();assert.equal(track.style.width,'301px');
    owner.update({columns:base.columns});assert.equal(observed.length,0);assert.equal(track.style.width,'');
    callback();owner.destroy();assert.equal(frame,undefined);assert.ok(disconnects>=3);pixels='999px';callback();assert.equal(track.style.width,'');assert.equal(win.listeners.get('resize').length,0);
  }finally{if(previous)Object.defineProperty(globalThis,'ResizeObserver',previous);else delete globalThis.ResizeObserver;}
});

test('native natural layout and single-frame toolbar update without replacing scroll or pagination owners',()=>{
  const {root,doc}=navigationDOM(),toolbar=createDataTableToolbar(doc,[doc.createElement('input')]);
  const owner=createDataTable(root,{...base,toolbar}),frame=root.querySelector('.xui-data-table-frame'),body=owner.getBody(),footer=root.querySelector('footer'),select=root.querySelector('select');
  assert.equal(root.dataset.layout,'natural');assert.equal(root.querySelector('.xui-data-table-tools').parentElement,frame);assert.equal(body.parentElement,frame);assert.equal(footer.parentElement,frame);
  for(const layout of ['workspace','document','natural']){owner.update({layout});assert.equal(root.dataset.layout,layout);assert.equal(owner.getBody(),body);assert.equal(root.querySelector('footer'),footer);assert.equal(root.querySelector('select'),select);}
  assert.throws(()=>owner.update({layout:'fill'}),/Invalid DataTable layout/);assert.equal(root.dataset.layout,'natural');
  owner.update({pagination:undefined,toolbar:undefined});assert.equal(select.parentElement.hidden,true);assert.equal(root.querySelector('.xui-data-table-tools').hidden,true);assert.match(root.querySelector('.xui-data-table-count').textContent,/1 loaded/);owner.destroy();
});
