import test from 'node:test';
import assert from 'node:assert/strict';
import {observeDialogLayout} from '../packages/ui-react/dist/dialog-layout-observer.js';
function fixture(){
 const observers=[],mutations=[],queue=new Map(),events=new Map();let serial=0;
 class Element{constructor(height=0){this.height=height;this.style={display:'block',position:'static',marginTop:'0',marginBottom:'0'};this.dataset={};this.children=[];this.scrollTop=0;this.scrollLeft=0;this.listeners=new Map();this.classList={contains:value=>value===this.className};}addEventListener(name,callback){this.listeners.set(name,callback);}removeEventListener(name,callback){if(this.listeners.get(name)===callback)this.listeners.delete(name);}get offsetHeight(){return this.height;}getBoundingClientRect(){throw Error('Transformed paint geometry must not determine layout budget');}getClientRects(){return [{}];}}
 const win={HTMLElement:Element,ResizeObserver:class{constructor(callback){this.callback=callback;this.targets=new Set();observers.push(this);}observe(node){this.targets.add(node);}unobserve(node){this.targets.delete(node);}disconnect(){this.targets.clear();this.disconnected=true;}},MutationObserver:class{constructor(callback){this.callback=callback;mutations.push(this);}observe(){}disconnect(){this.disconnected=true;}},getComputedStyle:node=>node.style,requestAnimationFrame(callback){const id=++serial;queue.set(id,callback);return id;},cancelAnimationFrame:id=>queue.delete(id),addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:(name,fn)=>{if(events.get(name)===fn)events.delete(name);}};
 const popup=new Element(),header=new Element(500),body=new Element(2000),footer=new Element(150);body.className='xui-dialog-body';body.style.minBlockSize='80';popup.children=[header,body,footer];for(const node of popup.children)node.parentElement=popup;
 popup.ownerDocument={defaultView:win};popup.style={...popup.style,maxHeight:'780px',paddingTop:'32',paddingBottom:'32',borderTopWidth:'1',borderBottomWidth:'1',rowGap:'16'};
 const flush=()=>{const batch=[...queue.values()];queue.clear();for(const fn of batch)fn();};
 return {popup,header,body,footer,win,observers,mutations,queue,events,flush};
}
test('dialog selects a single owner from fixed content budget, independent of body mode height',()=>{
 const f=fixture(),release=observeDialogLayout(f.popup);assert.equal(f.popup.dataset.dialogScroll,'whole');
 for(const height of [80,2000,8]){f.body.height=height;f.observers[0].callback();f.flush();assert.equal(f.popup.dataset.dialogScroll,'whole');}
 f.header.height=100;f.observers[0].callback();f.flush();assert.equal(f.popup.dataset.dialogScroll,'body');
 f.popup.style.maxHeight='250px';f.events.get('resize')();f.flush();assert.equal(f.popup.dataset.dialogScroll,'whole');
 f.popup.style.maxHeight='780px';f.mutations[0].callback();f.flush();assert.equal(f.popup.dataset.dialogScroll,'body');release();
});
test('dialog observers release pending frames and never reattach after destroy',()=>{
 const f=fixture(),release=observeDialogLayout(f.popup);f.observers[0].callback();assert.equal(f.queue.size,1);release();release();assert.equal(f.queue.size,0);assert.equal(f.popup.dataset.dialogScroll,undefined);assert.equal(f.observers[0].disconnected,true);assert.equal(f.mutations[0].disconnected,true);assert.equal(f.events.size,0);assert.equal(f.popup.listeners.size,0);f.observers[0].callback();assert.equal(f.queue.size,0);
});
test('unavailable layout observation leaves the CSS whole-dialog fallback intact',()=>{
 const f=fixture();delete f.win.ResizeObserver;const release=observeDialogLayout(f.popup);assert.equal(f.popup.dataset.dialogScroll,undefined);assert.equal(f.observers.length,0);release();
});

test('fixed-height sheets use their actual box budget, not viewport max-height',()=>{
 const f=fixture();f.header.height=100;f.popup.style.height='280px';f.popup.style.boxSizing='border-box';const release=observeDialogLayout(f.popup);assert.equal(f.popup.dataset.dialogScroll,'whole');f.popup.style.height='600px';f.observers[0].callback();f.flush();assert.equal(f.popup.dataset.dialogScroll,'body');release();
});

test('computed border-box and content-box measurements ignore transformed painting',()=>{
 const f=fixture();f.header.style={...f.header.style,height:'100px',boxSizing:'content-box',paddingTop:'50px',paddingBottom:'50px',borderTopWidth:'1px',borderBottomWidth:'1px'};f.footer.style={...f.footer.style,height:'400px',boxSizing:'border-box',paddingTop:'50px',paddingBottom:'50px'};f.header.height=1;f.footer.height=1;const release=observeDialogLayout(f.popup);assert.equal(f.popup.dataset.dialogScroll,'body');f.header.style.paddingTop='100px';f.observers[0].callback();f.flush();assert.equal(f.popup.dataset.dialogScroll,'whole');release();
});

test('a retained hidden dialog keeps its scroll owner and reading offset until a real owner change',()=>{
 const f=fixture();f.header.height=100;const release=observeDialogLayout(f.popup);
 const active=new f.win.HTMLElement();let reveals=0;active.scrollIntoView=()=>reveals++;f.popup.contains=node=>node===active;f.popup.ownerDocument.activeElement=active;
 f.body.scrollTop=93;f.popup.listeners.get('scroll')({target:f.body});f.popup.scrollTop=0;let hidden=true;f.popup.getClientRects=()=>hidden?[]:[{}];
 f.mutations[0].callback();f.flush();assert.equal(f.popup.dataset.dialogScroll,'body');assert.equal(f.body.scrollTop,93);assert.equal(reveals,0);
 f.body.scrollTop=0;hidden=false;f.observers[0].callback();f.flush();assert.equal(f.popup.dataset.dialogScroll,'body');assert.equal(f.body.scrollTop,93);assert.equal(reveals,0);
 // Geometry actually changes after reopening: the previous owner is reset and
 // the focused control is still revealed in the newly selected scroll owner.
 f.header.height=700;f.observers[0].callback();f.flush();assert.equal(f.popup.dataset.dialogScroll,'whole');assert.equal(f.body.scrollTop,0);assert.equal(reveals,1);
 f.popup.scrollTop=93;f.popup.listeners.get('scroll')({target:f.popup});hidden=true;f.mutations[0].callback();f.flush();assert.equal(f.popup.dataset.dialogScroll,'whole');assert.equal(f.popup.scrollTop,93);
 f.popup.scrollTop=0;hidden=false;f.observers[0].callback();f.flush();assert.equal(f.popup.scrollTop,93);assert.equal(reveals,1);
 f.header.height=100;f.observers[0].callback();f.flush();assert.equal(f.popup.dataset.dialogScroll,'body');assert.equal(f.popup.scrollTop,0);assert.equal(reveals,2);release();
});

test('hidden mutation remembers the boundary when animation frames are paused',()=>{
 const f=fixture();f.header.height=100;const release=observeDialogLayout(f.popup);f.body.scrollTop=93;f.popup.listeners.get('scroll')({target:f.body});
 let hidden=true;f.popup.getClientRects=()=>hidden?[]:[{}];f.mutations[0].callback();assert.equal(f.queue.size,1);f.body.scrollTop=0;
 // The queued frame runs only after the host resumes its retained popup.
 hidden=false;f.flush();assert.equal(f.body.scrollTop,93);assert.equal(f.popup.dataset.dialogScroll,'body');release();
});

test('a surviving native offset wins over an older scroll-event snapshot',()=>{
 const f=fixture();f.header.height=100;const release=observeDialogLayout(f.popup);
 f.body.scrollTop=40;f.popup.listeners.get('scroll')({target:f.body});
 f.body.scrollTop=93;let hidden=true;f.popup.getClientRects=()=>hidden?[]:[{}];f.mutations[0].callback();f.flush();
 hidden=false;f.observers[0].callback();f.flush();assert.equal(f.body.scrollTop,93);release();
});
