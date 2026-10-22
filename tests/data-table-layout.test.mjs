import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
import {observeDataTableLayout} from '../packages/ui-react/dist/data-table-layout.js';

function fixture() {
  let next = 0, writes = 0, value = '', rootValue = '', callback;
  const pending = new Map(), listeners = new Map(), observed = new Set();
  const first = {offsetHeight:60}, last = {offsetHeight:80}, head = {offsetHeight:40};
  const win = {
    getComputedStyle:node => node===frame ? {borderTopWidth:'1px',borderBottomWidth:'1px',paddingTop:'0px',paddingBottom:'0px'} : {borderTopWidth:'0px',borderBottomWidth:'0px',scrollPaddingTop:'8px',scrollPaddingBottom:'8px'},
    requestAnimationFrame:fn => {pending.set(++next,fn);return next;},
    cancelAnimationFrame:id => pending.delete(id),
    addEventListener:(name,fn) => listeners.set(name,fn),
    removeEventListener:(name,fn) => {if(listeners.get(name)===fn)listeners.delete(name);},
  };
  const body = {addEventListener:win.addEventListener,removeEventListener:win.removeEventListener,clientLeft:0,clientWidth:500,scrollLeft:0,offsetHeight:240,clientHeight:224,scrollHeight:1000,dataset:{}};
  const table = {ownerDocument:{defaultView:win},offsetWidth:500,offsetHeight:1000,tHead:head,tBodies:[{rows:[first,last]}]};
  const tools={offsetHeight:100},footer={offsetHeight:50};
  for(const node of [tools,body,footer])node.classList={contains:()=>false};
  const root={dataset:{layout:'natural'},style:{get minBlockSize(){return rootValue;},set minBlockSize(next){rootValue=next;writes++;}}};
  const frame = {parentElement:root,children:[tools,body,footer],style:{get gridTemplateRows(){return value;},set gridTemplateRows(next){value=next;writes++;}}};
  const prior = Object.getOwnPropertyDescriptor(globalThis,'ResizeObserver');
  globalThis.ResizeObserver = class {constructor(fn){callback=fn;}observe(node){observed.add(node);}unobserve(node){observed.delete(node);}disconnect(){observed.clear();}};
  return {body,table,head,first,last,root,frame,tools,footer,observed,pending,listeners,
    tick(){const tasks=[...pending.values()];pending.clear();tasks.forEach(fn=>fn());},
    resize(){callback();},get writes(){return writes;},
    restore(){if(prior)Object.defineProperty(globalThis,'ResizeObserver',prior);else delete globalThis.ResizeObserver;},
  };
}

test('asynchronous geometry reveals only the focused body action and releases its observation',()=>{
 const f=fixture();let owner,scrolls=0,box={left:550,right:650,top:50,bottom:90};
 const action={getBoundingClientRect:()=>box,scrollIntoView:options=>{assert.deepEqual(options,{block:'nearest',inline:'nearest'});scrolls++;}};
 f.body.getBoundingClientRect=()=>({left:0,right:500,top:0,bottom:240});f.table.tBodies[0].contains=node=>node===action;
 try{
  owner=observeDataTableLayout(f.frame,f.body,f.table);f.tick();assert.equal(scrolls,0);
  f.table.ownerDocument.activeElement=action;f.listeners.get('focusin')();f.tick();assert.equal(scrolls,1);assert.equal(f.observed.has(action),true);
  assert.equal(f.body.scrollLeft,150);
  box={left:450,right:490,top:50,bottom:90};f.resize();f.tick();assert.equal(scrolls,1);
  box={left:450,right:590,top:50,bottom:90};f.resize();f.tick();assert.equal(scrolls,2);
  f.table.ownerDocument.activeElement={};owner.update();f.tick();assert.equal(scrolls,2);assert.equal(f.observed.has(action),false);
  owner.destroy();assert.equal(f.listeners.size,0);
 }finally{owner?.destroy();f.restore();}
});

test('layout minimum uses actual header, edge rows, computed clearance and scrollbar, capped by content',()=>{
  const f=fixture();let owner;
  try {
    owner=observeDataTableLayout(f.frame,f.body,f.table);f.tick();
    assert.equal(f.frame.style.gridTemplateRows,'auto minmax(152px, 1fr) auto');
    assert.equal(f.root.style.minBlockSize,'304px');
    assert.equal(f.observed.size,7);
    assert.equal(f.observed.has(f.root),false);assert.equal(f.observed.has(f.frame),false);
    // Short actual content wins; this is independent of row count.
    f.table.offsetHeight=110;f.resize();f.tick();
    assert.equal(f.frame.style.gridTemplateRows,'auto minmax(126px, 1fr) auto');
    assert.equal(f.root.style.minBlockSize,'278px');
    // One tall row is not classified as short merely by its count.
    f.table.tBodies[0].rows=[f.first];f.first.offsetHeight=700;f.table.offsetHeight=740;
    owner.update();f.tick();
    assert.equal(f.frame.style.gridTemplateRows,'auto minmax(756px, 1fr) auto');
    assert.equal(f.observed.has(f.last),false);
    assert.equal(f.observed.size,6);
  } finally {owner?.destroy();f.restore();}
});

test('layout owner coalesces unchanged observations, retains hidden geometry, refreshes targets and disposes pending work',()=>{
  const f=fixture();let owner;
  try {
    owner=observeDataTableLayout(f.frame,f.body,f.table);f.tick();const writes=f.writes;
    f.resize();f.resize();owner.update();assert.equal(f.pending.size,1);f.tick();assert.equal(f.writes,writes);
    f.table.offsetHeight=0;f.table.offsetWidth=0;f.resize();f.tick();assert.equal(f.writes,writes);
    const replacement={offsetHeight:120};f.table.tBodies[0].rows=[replacement];f.table.offsetWidth=500;f.table.offsetHeight=160;
    owner.update();f.tick();assert.equal(f.observed.has(f.first),false);assert.equal(f.observed.has(replacement),true);
    assert.equal(f.frame.style.gridTemplateRows,'auto minmax(176px, 1fr) auto');
    f.resize();assert.equal(f.pending.size,1);owner.destroy();owner.destroy();
    assert.equal(f.pending.size,0);assert.equal(f.observed.size,0);assert.equal(f.listeners.size,0);
    assert.equal(f.frame.style.gridTemplateRows,'');assert.equal(f.root.style.minBlockSize,'');const destroyedWrites=f.writes;
    f.resize();owner.update();f.tick();assert.equal(f.writes,destroyedWrites);
  } finally {owner?.destroy();f.restore();}
});

test('vertical boundary follows actual overflow, keeps hidden geometry and restores only owned state',()=>{
  const f=fixture();let owner;
  try {
    owner=observeDataTableLayout(f.frame,f.body,f.table);f.tick();assert.equal(f.body.dataset.scrollableY,'true');
    f.body.scrollHeight=f.body.clientHeight;f.resize();f.tick();assert.equal(f.body.dataset.scrollableY,'false');
    f.table.offsetHeight=0;f.body.scrollHeight=1000;f.resize();f.tick();assert.equal(f.body.dataset.scrollableY,'false');
    f.table.offsetHeight=1000;f.resize();f.tick();assert.equal(f.body.dataset.scrollableY,'true');
    owner.destroy();assert.equal(f.body.dataset.scrollableY,undefined);
    f.body.dataset.scrollableY='false';owner=observeDataTableLayout(f.frame,f.body,f.table);f.tick();owner.destroy();assert.equal(f.body.dataset.scrollableY,'false');
    owner=observeDataTableLayout(f.frame,f.body,f.table);f.tick();f.body.dataset.scrollableY='external';owner.destroy();assert.equal(f.body.dataset.scrollableY,'external');
  } finally {owner?.destroy();f.restore();}
});

test('layout owner does not overwrite a subsequent host style on destroy and skips non-layout DOMs',()=>{
  const f=fixture();let owner;
  try {
    owner=observeDataTableLayout(f.frame,f.body,f.table);f.tick();
    f.frame.style.gridTemplateRows='auto';f.root.style.minBlockSize='999px';owner.destroy();assert.equal(f.frame.style.gridTemplateRows,'auto');assert.equal(f.root.style.minBlockSize,'999px');
    const inert=observeDataTableLayout(f.frame,f.body,{ownerDocument:{defaultView:f.table.ownerDocument.defaultView}});
    inert.update();inert.destroy();assert.equal(f.pending.size,0);
  } finally {owner?.destroy();f.restore();}
});

test('loading aligns below the measured header without counting its allocated body height as chrome',()=>{
  const f=fixture();let owner;
  const loading={style:{marginBlockStart:''},offsetHeight:900,classList:{contains:name=>name==='xui-data-table-loading'},children:[{offsetHeight:16},{offsetHeight:140}]};
  const previous=f.table.ownerDocument.defaultView.getComputedStyle;
  f.table.ownerDocument.defaultView.getComputedStyle=node=>node===loading?{rowGap:'8px',paddingTop:'12px',paddingBottom:'12px'}:previous(node);
  f.frame.children.push(loading);f.table.offsetHeight=120;f.table.tBodies[0].rows=[f.first];
  try{
    owner=observeDataTableLayout(f.frame,f.body,f.table);f.tick();
    assert.equal(loading.style.marginBlockStart,'40px');
    assert.equal(f.frame.style.gridTemplateRows,'auto minmax(244px, 1fr) auto');
    assert.equal(f.root.style.minBlockSize,'396px');assert.equal(f.observed.has(loading),false);
    assert.equal(f.observed.has(loading.children[1]),true);
    loading.offsetHeight=1900;f.resize();f.tick();assert.equal(f.root.style.minBlockSize,'396px');
    f.head.offsetHeight=80;f.resize();f.tick();assert.equal(loading.style.marginBlockStart,'80px');
    owner.destroy();assert.equal(loading.style.marginBlockStart,'');
  }finally{owner?.destroy();f.restore();}
});


test('component minimum follows measured chrome changes and preserves layout-specific minimum ownership',()=>{
  const f=fixture();let owner;
  try {
    owner=observeDataTableLayout(f.frame,f.body,f.table);f.tick();
    // The natural cap may shrink below full table content, but never below
    // actual chrome + a readable body. No allocated output height is reused.
    assert.equal(f.root.style.minBlockSize,'304px');
    f.tools.offsetHeight=400;f.footer.offsetHeight=160;f.resize();f.tick();
    assert.equal(f.root.style.minBlockSize,'714px');
    f.tools.offsetHeight=0;f.footer.offsetHeight=50;f.resize();f.tick();
    assert.equal(f.root.style.minBlockSize,'204px');
    const replacement={offsetHeight:30,classList:{contains:()=>false}};f.frame.children=[f.body,f.footer,replacement];owner.update();f.tick();
    assert.equal(f.root.style.minBlockSize,'234px');
    assert.equal(f.observed.has(f.tools),false);assert.equal(f.observed.has(replacement),true);
    f.root.dataset.layout='workspace';owner.update();f.tick();
    assert.equal(f.root.style.minBlockSize,'max(var(--data-table-min-block-size), 234px)');
    f.root.dataset.layout='document';owner.update();f.tick();assert.equal(f.root.style.minBlockSize,'');
    f.root.dataset.layout='natural';owner.update();f.tick();assert.equal(f.root.style.minBlockSize,'234px');
  } finally {owner?.destroy();f.restore();}
});


test('CSS and measured geometry retain the same three-track frame ownership',()=>{
  const css=readFileSync(new URL('../packages/theme/src/table.css',import.meta.url),'utf8');
  assert.match(css,/grid-template-rows:auto minmax\(var\(--control-height\),1fr\) auto/);
  assert.match(css,/\.xui-data-table-tools \{[^}]*grid-row:1;[^}]*\}/);
  const bodyRules=[];postcss.parse(css).walkRules('.xui-data-table-body',rule=>bodyRules.push(rule));
  assert.ok(bodyRules.some(rule=>rule.nodes.some(node=>node.prop==='grid-row'&&node.value==='2')));
  assert.ok(bodyRules.some(rule=>rule.nodes.some(node=>node.prop==='grid-column'&&node.value==='1')),'body and loading share one visible track');
  const sharedFooterRules=[];
  postcss.parse(css).walkRules(rule=>{
    if(rule.selector.includes('.xui-data-table-footer')&&rule.selector.includes('.xui-card-group-footer'))sharedFooterRules.push(rule);
  });
  assert.ok(sharedFooterRules.some(rule=>rule.nodes.some(node=>node.type==='decl'&&node.prop==='grid-row'&&node.value==='3')),'DataTable and CardGroup footer share the third frame row');
  const f=fixture();let owner;try{owner=observeDataTableLayout(f.frame,f.body,f.table);f.tick();assert.equal(f.frame.style.gridTemplateRows,'auto minmax(152px, 1fr) auto');}finally{owner?.destroy();f.restore();}
});
