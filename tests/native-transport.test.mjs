import test from 'node:test';
import assert from 'node:assert/strict';
import {createHttpClient} from '../packages/runtime/dist/http.js';
import {requestDownload} from '../packages/runtime/dist/download.js';
const response=(payload=null,status=200)=>Response.json({success:status===200,message:'',payload,request_id:'demo:native',code:status===200?1:40301},{status});
const native=fetch=>createHttpClient({baseURL:'wails://wails/',nativeOrigin:'wails://wails',fetch});
test('native transport requires declared application origin and bridge; tuple identity does not use null URL.origin',async()=>{
 assert.throws(()=>createHttpClient({baseURL:'wails://wails/',fetch:async()=>response()}),TypeError);
 for(const [baseURL,nativeOrigin,fetch] of [['wails://wails/','wails://wails',undefined],['wails://wails/','file://wails',async()=>response()],['wails://wails/','wails:opaque',async()=>response()],['wails://wails/','wails://wails/prefix',async()=>response()],['wails://wails/','wails://other',async()=>response()],['wails://user:password@wails/','wails://wails',async()=>response()],['https://user:password@fixture.invalid/',undefined,async()=>response()]])assert.throws(()=>createHttpClient({baseURL,nativeOrigin,fetch}),TypeError);
 let sends=0;const client=native(async(url,init)=>{sends++;assert.equal(url,'wails://wails/api/test');assert.equal(init.headers.get('accept'),'application/json');assert.equal(init.redirect,'error');return response({value:'synthetic'});});const result=await client.request('/api/test');assert.equal(result.payload.value,'synthetic');assert.equal(result.requestId,'demo:native');
 for(const path of ['wails://other/api/test','other://wails/api/test','https://wails/api/test','wails://wails:443/api/test','wails://user:password@wails/api/test'])await assert.rejects(client.request(path),TypeError);assert.equal(sends,1);client.destroy();
});
test('native redirect policy rejects automatic following and a foreign returned URL before decoding payload',async()=>{
 let sends=0;const client=native(async()=>{sends++;return response();});for(const redirect of ['follow','manual'])await assert.rejects(client.request('/file',{redirect}),TypeError);assert.equal(sends,0);
 const foreign=response({mustNotEscape:true});Object.defineProperty(foreign,'url',{value:'wails://other/file'});await assert.rejects(native(async()=>foreign).request('/file'),error=>error.kind==='network'&&error.status===200);
 const redirected=native(async()=>new Response('',{status:302,headers:{Location:'wails://other/file'}}));await assert.rejects(redirected.request('/file'),error=>error.kind==='http'&&error.status===302);
});
test('native requests keep status, structured rejection and the existing scoped unauthorized latch',async()=>{
 let invalidations=0;const client=createHttpClient({baseURL:'wails://wails',nativeOrigin:'wails://wails',fetch:async()=>response(null,401),onUnauthorized:()=>invalidations++});await assert.rejects(client.request('/auth',{unauthorized:'ignore'}),error=>error.status===401&&error.code===40301);assert.equal(invalidations,0);for(let i=0;i<2;i++)await assert.rejects(client.request('/protected'),error=>error.status===401);assert.equal(invalidations,1);client.resetUnauthorized();await assert.rejects(client.request('/protected'));assert.equal(invalidations,2);
});
test('native cancellation rejects an uncooperative late response; downloads use the same declared transport',async()=>{
 let release;const held=new Promise(resolve=>release=resolve),controller=new AbortController(),client=native(()=>held),pending=client.request('/read',{signal:controller.signal}),failure=assert.rejects(pending,error=>error.kind==='cancel');await Promise.resolve();controller.abort();await failure;release(response({late:true}));
 const file=await requestDownload(native(async()=>new Response('SYNTHETIC_BYTES',{headers:{'Content-Disposition':"attachment; filename*=UTF-8''%E6%8A%A5%E5%91%8A.txt"}})),'/file');assert.equal(file.fileName,'报告.txt');assert.equal(await file.blob.text(),'SYNTHETIC_BYTES');
});
