import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createModuleResource,loadModuleWithStyles} from '../packages/runtime/dist/loading.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const ticks=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function documentFixture(){const links=[];return {links,doc:{baseURI:'https://example.test/app/',createElement(){return {remove(){this.removed=true;}};},head:{append(link){links.push(link);}}}};}
function moduleFixture(timeoutMs=200){const {doc,links}=documentFixture(),calls=[];const resource=createModuleResource({document:doc,timeoutMs,resolve:(key,context)=>({moduleURL:`/${key}.js?attempt=${context.request}`,styles:[`/${key}.css`]}),load:(url,signal)=>{const pending=deferred();calls.push({url,signal,...pending});return pending.promise;}});return {resource,doc,links,calls};}
test('module CSS shares a per-document lease and releases only its last user',async()=>{
 const {doc,links}=documentFixture(),a=new AbortController(),b=new AbortController();
 const first=loadModuleWithStyles({moduleURL:'/panel.js',styles:['./panel.css','https://example.test/app/panel.css'],document:doc,signal:a.signal,load:async()=>({name:'first'})});
 const second=loadModuleWithStyles({moduleURL:'/panel.js',styles:['./panel.css'],document:doc,signal:b.signal,load:async()=>({name:'second'})});
 assert.equal(links.length,1);links[0].onload();const [one,two]=await Promise.all([first,second]);assert.equal(one.module.name,'first');one.release();one.release();assert(!links[0].removed);two.release();assert(links[0].removed);
 const other=documentFixture(),pending=loadModuleWithStyles({moduleURL:'/panel.js',styles:['./panel.css'],document:other.doc,signal:new AbortController().signal,load:async()=>1});assert.equal(other.links.length,1);other.links[0].onload();(await pending).release();
});
test('cancelling one concurrent CSS borrower preserves the other, including ready lifetime abort',async()=>{
 const {doc,links}=documentFixture(),a=new AbortController(),b=new AbortController();
 const options={moduleURL:'/x.js',styles:['/x.css'],document:doc,load:async()=>1};
 const first=loadModuleWithStyles({...options,signal:a.signal}),failure=assert.rejects(first,{name:'AbortError'}),second=loadModuleWithStyles({...options,signal:b.signal});a.abort();await failure;assert(!links[0].removed);links[0].onload();await second;b.abort();assert(links[0].removed);
});
test('module/CSS failure evicts styles and explicit retry gets fresh trusted assets',async()=>{
 const {resource,links,calls}=moduleFixture();const initial=resource.load('A');await ticks();links[0].onerror();await initial;assert.equal(resource.getState().status,'error');assert(links[0].removed);assert(calls[0].signal.aborted);
 const retry=resource.retry();await ticks();assert.match(calls[1].url,/attempt=2/);calls[1].resolve('ready');links[1].onload();await retry;assert.equal(resource.getState().value.module,'ready');assert(!links[1].removed);resource.destroy();assert(links[1].removed);
});
test('same-key refresh keeps ready CSS through failure and swaps successful leases without a gap',async()=>{
 const {resource,links,calls}=moduleFixture();const initial=resource.load('A');await ticks();calls[0].resolve('old');links[0].onload();await initial;
 const failed=resource.load('A');await ticks();assert.equal(resource.getState().status,'refreshing');assert.equal(links.length,1);calls[1].reject(Error('failed refresh'));await failed;assert.equal(resource.getState().value.module,'old');assert(!links[0].removed);
 const refresh=resource.load('A');await ticks();calls[2].resolve('new');await refresh;assert.equal(resource.getState().value.module,'new');assert(!links[0].removed);resource.destroy();assert(links[0].removed);
});
test('scope change, timeout, late module results, cancel and destroy release owned CSS',async()=>{
 const {resource,links,calls}=moduleFixture(20);const a=resource.load('A');await ticks();const b=resource.load('B');await ticks();assert(links[0].removed);assert(calls[0].signal.aborted);calls[0].resolve('late A');links[1].onload();await b;await a;assert.equal(resource.getState().error.name,'TimeoutError');assert(links[1].removed);calls[1].resolve('late B');await ticks();assert(!resource.getState().hasValue);
 const c=resource.load('C');await ticks();resource.cancel();await c;assert(links[2].removed);assert.equal(resource.getState().busy,false);
 const d=resource.load('D');await ticks();resource.destroy();await d;assert(links[3].removed);resource.destroy();assert.equal(resource.getState().hasValue,false);
});
test('low-level loader rejection releases CSS and SSR no-style modules stay usable',async()=>{
 const {doc,links}=documentFixture();await assert.rejects(loadModuleWithStyles({moduleURL:'/bad.js',styles:['/pending.css'],document:doc,signal:new AbortController().signal,load:async()=>{throw Error('module failed');}}),/module failed/);assert(links[0].removed);
 const lease=await loadModuleWithStyles({moduleURL:'trusted:test',signal:new AbortController().signal,load:async()=>42});assert.equal(lease.module,42);lease.release();
 await assert.rejects(loadModuleWithStyles({moduleURL:'/x.js',styles:['/x.css'],signal:new AbortController().signal,load:async()=>1}),/document is required/);
 for(const timeoutMs of [0,-1,Infinity,NaN])assert.throws(()=>createModuleResource({timeoutMs,resolve:()=>({moduleURL:'/x'}),load:async()=>1}),RangeError);
});
test('Resource provides immutable explicit load/retry context without changing two-argument loaders',async()=>{
 const {createResource}=await import('../packages/runtime/dist/loading.js'),contexts=[];
 const resource=createResource({loader:async(key,signal,context)=>{contexts.push(context);return key;}});await resource.load('A');await resource.retry();assert.deepEqual(contexts,[{request:1,retry:false},{request:2,retry:true}]);assert(contexts.every(Object.isFrozen));resource.destroy();
});
