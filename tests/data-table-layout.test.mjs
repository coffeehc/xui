import test from 'node:test';
import assert from 'node:assert/strict';
import {observeDataTableLayout} from '../packages/runtime/dist/data-table.js';

function fixture() {
  let next = 0, writes = 0, value = '', callback;
  const pending = new Map(), listeners = new Map(), observed = new Set();
  const first = {offsetHeight:60}, last = {offsetHeight:80}, head = {offsetHeight:40};
  const win = {
    getComputedStyle:() => ({borderTopWidth:'0px',borderBottomWidth:'0px',scrollPaddingTop:'8px',scrollPaddingBottom:'8px'}),
    requestAnimationFrame:fn => {pending.set(++next,fn);return next;},
    cancelAnimationFrame:id => pending.delete(id),
    addEventListener:(name,fn) => listeners.set(name,fn),
    removeEventListener:(name,fn) => {if(listeners.get(name)===fn)listeners.delete(name);},
  };
  const body = {offsetHeight:240,clientHeight:224};
  const table = {ownerDocument:{defaultView:win},offsetWidth:500,offsetHeight:1000,tHead:head,tBodies:[{rows:[first,last]}]};
  const frame = {style:{get gridTemplateRows(){return value;},set gridTemplateRows(next){value=next;writes++;}}};
  const prior = Object.getOwnPropertyDescriptor(globalThis,'ResizeObserver');
  globalThis.ResizeObserver = class {constructor(fn){callback=fn;}observe(node){observed.add(node);}unobserve(node){observed.delete(node);}disconnect(){observed.clear();}};
  return {body,table,head,first,last,frame,observed,pending,listeners,
    tick(){const tasks=[...pending.values()];pending.clear();tasks.forEach(fn=>fn());},
    resize(){callback();},get writes(){return writes;},
    restore(){if(prior)Object.defineProperty(globalThis,'ResizeObserver',prior);else delete globalThis.ResizeObserver;},
  };
}

test('layout minimum uses actual header, edge rows, computed clearance and scrollbar, capped by content',()=>{
  const f=fixture();let owner;
  try {
    owner=observeDataTableLayout(f.frame,f.body,f.table);f.tick();
    assert.equal(f.frame.style.gridTemplateRows,'auto auto minmax(152px, 1fr) auto');
    assert.equal(f.observed.size,5);
    // Short actual content wins; this is independent of row count.
    f.table.offsetHeight=110;f.resize();f.tick();
    assert.equal(f.frame.style.gridTemplateRows,'auto auto minmax(126px, 1fr) auto');
    // One tall row is not classified as short merely by its count.
    f.table.tBodies[0].rows=[f.first];f.first.offsetHeight=700;f.table.offsetHeight=740;
    owner.update();f.tick();
    assert.equal(f.frame.style.gridTemplateRows,'auto auto minmax(756px, 1fr) auto');
    assert.equal(f.observed.has(f.last),false);
    assert.equal(f.observed.size,4);
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
    assert.equal(f.frame.style.gridTemplateRows,'auto auto minmax(176px, 1fr) auto');
    f.resize();assert.equal(f.pending.size,1);owner.destroy();owner.destroy();
    assert.equal(f.pending.size,0);assert.equal(f.observed.size,0);assert.equal(f.listeners.size,0);
    assert.equal(f.frame.style.gridTemplateRows,'');const destroyedWrites=f.writes;
    f.resize();owner.update();f.tick();assert.equal(f.writes,destroyedWrites);
  } finally {owner?.destroy();f.restore();}
});

test('layout owner does not overwrite a subsequent host style on destroy and skips non-layout DOMs',()=>{
  const f=fixture();let owner;
  try {
    owner=observeDataTableLayout(f.frame,f.body,f.table);f.tick();
    f.frame.style.gridTemplateRows='auto';owner.destroy();assert.equal(f.frame.style.gridTemplateRows,'auto');
    const inert=observeDataTableLayout(f.frame,f.body,{ownerDocument:{defaultView:f.table.ownerDocument.defaultView}});
    inert.update();inert.destroy();assert.equal(f.pending.size,0);
  } finally {owner?.destroy();f.restore();}
});
