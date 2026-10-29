import test from 'node:test';
import assert from 'node:assert/strict';
import {isolatedHttp,isolatedAuth,disposeServices} from './helpers/runtime-services.mjs';
const encoder=new TextEncoder(),flush=async()=>{for(let n=0;n<100;n++)await Promise.resolve();};
const wire=(payload,success=true,code=1)=>({success,payload,code,message:'SYNTHETIC_PRIVATE',request_id:'fixture-id'});
const json=(payload,status=200)=>Response.json(wire(payload,status===200,status===200?1:status*100),{status});
const user={id:'42',username:'demo',display_name:'Demo'};
const issued=()=>({schema_version:2,user,access_token:'bs-v1-sha256-access-'+'A'.repeat(43),token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()});
const client=fetch=>isolatedHttp({baseURL:'https://fixture.example/',fetch});
const frame=(text,step=1)=>{const bytes=encoder.encode(text);let offset=0;return new Response(new ReadableStream({pull(controller){if(offset===bytes.length){controller.close();return;}const end=Math.min(bytes.length,offset+step);controller.enqueue(bytes.slice(offset,end));offset=end;}}),{headers:{'Content-Type':'text/event-stream; charset=utf-8','X-Request-ID':'header-id'}});};
const live=()=>{let source,cancelled=0;const response=new Response(new ReadableStream({start(c){source=c;},cancel(){cancelled++;}}),{headers:{'Content-Type':'text/event-stream'}});return {response,get cancelled(){return cancelled;},push(text){source.enqueue(encoder.encode(text));}};};
const owner=fetch=>isolatedAuth({baseURL:'https://fixture.example/',fetch},{protectedPaths:['/api/events/']});

test('SSE parses byte-split UTF8/BOM/CR/LF, multiline/empty data and persistent/reset IDs; ignores heartbeats/retry and incomplete EOF',async()=>{
 const values=[],http=client(async()=>frame('\uFEFF:heartbeat\r\nid: first\r\nevent: event\r\ndata: 中文😀\r\ndata: 第二行\r\n\r\nid: ignored\0id\ndata:\n\nid:\rdata: reset\r\rid: id-only\n\nevent: custom\ndata: last\n\ndata: unfinished'));
 await http.readEvents('/live',{onEvent:event=>values.push(event)});
 assert.deepEqual(values,[{event:'event',id:'first',data:'中文😀\n第二行'},{event:'message',id:'first',data:''},{event:'message',id:'',data:'reset'},{event:'custom',id:'id-only',data:'last'}]);assert(values.every(Object.isFrozen));http.destroy();
});
test('SSE typed projection/backpressure preserves order, handshake facts, Last-Event-ID and explicit EOF without reconnect',async()=>{
 let sent,opens=0,releases,requests=0;const gate=new Promise(resolve=>releases=resolve),events=[];
 const http=client(async(url,init)=>{requests++;sent=init;return frame('event: event\nid: 8\ndata: {"value":1}\n\ndata: {"value":2}\n\n',9999);});
 const request=http.readEvents('/live',{lastEventId:'7',endpointId:'events:live',project:event=>JSON.parse(event.data),onOpen(context){opens++;assert.equal(context.status,200);assert.equal(context.headerRequestId,'header-id');assert(!('headers'in context));},async onEvent(event,signal){assert(!signal.aborted);events.push(event.value);if(event.value===1)await gate;}});
 await flush();assert.deepEqual(events,[1]);releases();await request;assert.deepEqual(events,[1,2]);assert.equal(opens,1);assert.equal(requests,1);assert.equal(sent.method,'GET');assert.equal(sent.credentials,'omit');assert.equal(sent.cache,'no-store');assert.equal(sent.redirect,'error');assert.equal(sent.headers.get('accept'),'text/event-stream');assert.equal(sent.headers.get('last-event-id'),'7');assert.equal(sent.body,undefined);http.destroy();
});
test('SSE line/block budgets cover comments, unknown fields and many data fields; malformed input is safe and closes the reader',async()=>{
 for(const [text,options] of [['data:123456789\n\n',{maxLineBytes:8}],[':123456789\n',{maxLineBytes:8}],['data:a\ndata:b\ndata:c\n\n',{maxEventBytes:14}],['unknown:a\nunknown:b\n\n',{maxEventBytes:10}]]){
  let count=0;const http=client(async()=>frame(text));await assert.rejects(http.readEvents('/live',{...options,onEvent(){count++;}}),error=>error.kind==='parse'&&!JSON.stringify(error).includes(text));assert.equal(count,0);http.destroy();
 }
 const http=client(async()=>frame('data: {invalid}\n\n'));await assert.rejects(http.readEvents('/live',{project:event=>JSON.parse(event.data),onEvent(){assert.fail();}}),error=>error.kind==='parse');http.destroy();
});
test('SSE cancellation/destroy promptly release a blocked reader and stop late callbacks, including an uncooperative consumer',async()=>{
 for(const stop of ['abort','destroy']){const body=live(),http=client(async()=>body.response),signal=new AbortController();let opened=false,count=0;const request=http.readEvents('/live',{signal:signal.signal,onOpen(){opened=true;},onEvent(){count++;}}),rejected=assert.rejects(request,e=>e.kind==='cancel');await flush();assert(opened);if(stop==='abort')signal.abort(new Error('SYNTHETIC_PRIVATE'));else http.destroy();await rejected;await flush();assert.equal(body.cancelled,1);assert.equal(count,0);http.destroy();}
 const body=live(),http=client(async()=>body.response),signal=new AbortController();let entered=false,release;const request=http.readEvents('/live',{signal:signal.signal,onEvent(){entered=true;return new Promise(resolve=>release=resolve);}}),rejected=assert.rejects(request,e=>e.kind==='cancel');await flush();body.push('data:first\n\ndata:late\n\n');await flush();assert(entered);signal.abort();await rejected;release();await flush();assert.equal(body.cancelled,1);http.destroy();
});
test('SSE connect deadline includes providers/error reads; idle deadline includes callback backpressure and explicit zero disables it',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});let count=0;const http=isolatedHttp({baseURL:'https://fixture.example',fetch:async()=>{count++;return frame('');},getHeaders:()=>new Promise(()=>{})});const request=http.readEvents('/live',{connectTimeoutMs:20,onEvent(){}}),failure=assert.rejects(request,e=>e.kind==='timeout');await flush();t.mock.timers.tick(20);await failure;assert.equal(count,0);http.destroy();
 for(const callback of [false,true]){const body=live(),http=client(async()=>body.response);const request=http.readEvents('/live',{idleTimeoutMs:30,onEvent:callback?()=>new Promise(()=>{}):()=>{}}),failure=assert.rejects(request,e=>e.kind==='timeout');await flush();if(callback){body.push('data:held\n\n');await flush();}t.mock.timers.tick(30);await failure;assert.equal(body.cancelled,1);http.destroy();}
 const body=live(),http2=client(async()=>body.response),signal=new AbortController();const held=http2.readEvents('/live',{signal:signal.signal,idleTimeoutMs:0,onEvent(){}}),failure2=assert.rejects(held,e=>e.kind==='cancel');await flush();t.mock.timers.tick(1000000);assert.equal(body.cancelled,0);signal.abort();await failure2;http2.destroy();
});
test('SSE non-2xx retains status/DTO, 200 failure envelopes are business errors; wrong MIME/empty 200 reject and 204 stops',async()=>{
 for(const status of [400,401,403,409,500,503]){const http=client(async()=>json(null,status));await assert.rejects(http.readEvents('/live',{onEvent(){assert.fail();}}),e=>e.kind==='http'&&e.status===status&&e.code===status*100&&e.requestId==='fixture-id'&&!JSON.stringify(e).includes('SYNTHETIC_PRIVATE'));http.destroy();}
 const rejected=client(async()=>Response.json(wire(null,false,44000)));await assert.rejects(rejected.readEvents('/live',{onEvent(){}}),e=>e.kind==='business'&&e.code===44000);rejected.destroy();
 for(const response of [()=>Response.json(wire(null)),()=>new Response('private'),()=>new Response(null,{headers:{'Content-Type':'text/event-stream'}})]){const http=client(async()=>response());await assert.rejects(http.readEvents('/live',{onEvent(){}}),e=>e.kind==='parse');http.destroy();}
 const stop=client(async()=>new Response(null,{status:204}));await stop.readEvents('/live',{onOpen(){assert.fail();},onEvent(){assert.fail();}});stop.destroy();
 for(const status of [401,500]){const http=client(async()=>new Response('x'.repeat(65537),{status}));await assert.rejects(http.readEvents('/live',{onEvent(){}}),e=>e.kind==='http'&&e.status===status&&e.metadata.readFailure==='parse');http.destroy();}
});
test('SSE public options reject writes/retries/credential overrides, invalid limits and cross-origin before IO',async()=>{
 let count=0;const http=client(async()=>{count++;return frame('');});
 for(const options of [undefined,{}, {onEvent:1},{onEvent(){},method:'POST'},{onEvent(){},retry:{}},{onEvent(){},body:'write'},{onEvent(){},credentials:'include'},{onEvent(){},lastEventId:'\nx'},{onEvent(){},maxLineBytes:0},{onEvent(){},maxEventBytes:16777217},{onEvent(){},idleTimeoutMs:-1}])await assert.rejects(http.readEvents('/live',options));
 await assert.rejects(http.readEvents('https://other.example/live',{onEvent(){}}));assert.equal(count,0);http.destroy();
});
test('SSE session borrows current access only, forbids second credentials and never refreshes/replays 401 or 403',async()=>{
 let calls=[];const ctx=owner(async(url,init)=>{calls.push({path:new URL(url).pathname,init});return url.endsWith('/login')?json(issued()):url.endsWith('/session')?json({schema_version:2,user}):json(null,401);});
 await assert.rejects(ctx.http.readEvents('/api/events/live',{onEvent(){}}),e=>e.status===401);assert.equal(calls.length,0);
 await ctx.auth.login({username:'demo',password:'SYNTHETIC_PASSWORD'});await assert.rejects(ctx.http.readEvents('/api/events/live',{headers:{Authorization:'Bearer OTHER'},onEvent(){}}),e=>e.kind==='parse');assert.equal(calls.length,1);
 await assert.rejects(ctx.http.readEvents('/api/events/live',{onEvent(){}}),e=>e.kind==='http'&&e.status===401&&e.code===40100);assert.equal(ctx.auth.getState().status,'anonymous');assert.deepEqual(calls.map(c=>c.path),['/api/v1/auth/login','/api/events/live']);assert(calls[1].init.headers.has('Authorization'));assert.equal(calls[1].init.credentials,'omit');assert(!JSON.stringify(ctx.auth.getState()).includes('bs-v1'));disposeServices(ctx.http);
 const forbidden=owner(async url=>url.endsWith('/login')?json(issued()):json(null,403));await forbidden.auth.login({username:'demo',password:'test'});await assert.rejects(forbidden.http.readEvents('/api/events/live',{onEvent(){}}),e=>e.status===403);assert.equal(forbidden.auth.getState().status,'authenticated');disposeServices(forbidden.http);
});
test('SSE lease is cancelled immediately on logout intent, identity replacement, expire, Auth destroy and container disposal',async()=>{
 for(const operation of ['logout','login','expire','destroy','dispose']){const body=live(),calls=[];const ctx=owner(async url=>{calls.push(new URL(url).pathname);return url.includes('/api/events/')?body.response:url.endsWith('/logout')?json(null):json(issued());});await ctx.auth.login({username:'demo',password:'test'});let count=0;const request=ctx.http.readEvents('/api/events/live',{onEvent(){count++;}}),failure=assert.rejects(request,e=>e.kind==='cancel');await flush();if(operation==='login')await ctx.auth.login({username:'other',password:'test'});else if(operation==='dispose')ctx.services.dispose();else await ctx.auth[operation]();await failure;await flush();assert.equal(body.cancelled,1);assert.equal(count,0);assert(!calls.some(c=>c.endsWith('/refresh')));disposeServices(ctx.http);}
});

test('unmanaged API Key SSE uses the existing HTTP provider and explicit 401 ownership without expiring a session',async()=>{
 let notifications=0,count=0,hasKey=false;const ctx=isolatedAuth({baseURL:'https://fixture.example/',onUnauthorized(){notifications++;},fetch:async(url,init)=>{if(url.endsWith('/login'))return json(issued());count++;hasKey=init.headers.get('X-API-Key')==='SYNTHETIC_KEY';assert.equal(init.credentials,'omit');return json(null,401);}},{protectedPaths:['/api/events/']});await ctx.auth.login({username:'demo',password:'test'});
 await assert.rejects(ctx.http.readEvents('/api/events/live',{unauthorized:'ignore',onEvent(){}}),TypeError);assert.equal(count,0);
 await assert.rejects(ctx.http.readEvents('/subscriptions/live',{headers:{'X-API-Key':'SYNTHETIC_KEY'},unauthorized:'ignore',onEvent(){}}),e=>e.status===401);assert(hasKey);assert.equal(count,1);assert.equal(notifications,0);assert.equal(ctx.auth.getState().status,'authenticated');disposeServices(ctx.http);
});
test('SSE current access expiry stops a silent connection without a refresh or late event',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:Date.now()});const body=live(),ctx=owner(async url=>url.endsWith('/login')?json({...issued(),expires_at:new Date(Date.now()+2000).toISOString()}):body.response);await ctx.auth.login({username:'demo',password:'test'});const request=ctx.http.readEvents('/api/events/live',{onEvent(){assert.fail();}}),failure=assert.rejects(request,e=>e.kind==='cancel');await flush();t.mock.timers.tick(2000);await failure;assert.equal(body.cancelled,1);disposeServices(ctx.http);
});
test('SSE fetch/read/callback failures are safe, single attempt and release resources',async()=>{
 for(const fetch of [async()=>{throw Error('SYNTHETIC_PRIVATE');},async()=>new Response(new ReadableStream({pull(c){c.error(Error('SYNTHETIC_PRIVATE'));}}),{headers:{'Content-Type':'text/event-stream'}})]){const http=client(fetch);await assert.rejects(http.readEvents('/live',{onEvent(){}}),e=>e.kind==='network'&&!JSON.stringify(e).includes('SYNTHETIC_PRIVATE'));http.destroy();}
 const http=client(async()=>frame('data:one\n\ndata:two\n\n'));let count=0;await assert.rejects(http.readEvents('/live',{onEvent(){count++;throw Error('SYNTHETIC_PRIVATE');}}),e=>e.kind==='parse'&&!JSON.stringify(e).includes('SYNTHETIC_PRIVATE'));assert.equal(count,1);http.destroy();
});

test('logout before SSE headers cancels the pending fetch and drops a late 200/401 without touching a newer identity',async()=>{
 for(const status of [200,401]){let resolve;const held=new Promise(done=>resolve=done),body=live(),requests=[];const ctx=owner(async url=>{requests.push(new URL(url).pathname);return url.includes('/api/events/')?held:url.endsWith('/logout')?json(null):json(issued());});await ctx.auth.login({username:'demo',password:'test'});const request=ctx.http.readEvents('/api/events/live',{onEvent(){assert.fail();}}),failure=assert.rejects(request,e=>e.kind==='cancel');await flush();await ctx.auth.logout();await failure;await ctx.auth.login({username:'other',password:'test'});resolve(status===200?body.response:json(null,401));await flush();assert.equal(ctx.auth.getState().status,'authenticated');assert(!requests.some(path=>path.endsWith('/refresh')));if(status===200)assert.equal(body.cancelled,1);disposeServices(ctx.http);}
});

test('explicit access refresh cancels the old SSE lease once; it does not reconnect the stream',async()=>{
 const body=live(),requests=[],ctx=owner(async url=>{requests.push(new URL(url).pathname);return url.includes('/api/events/')?body.response:json(issued());});await ctx.auth.login({username:'demo',password:'test'});const request=ctx.http.readEvents('/api/events/live',{onEvent(){assert.fail();}}),failure=assert.rejects(request,e=>e.kind==='cancel');await flush();await ctx.auth.refresh();await failure;assert.equal(body.cancelled,1);assert.equal(ctx.auth.getState().status,'authenticated');assert.equal(requests.filter(path=>path==='/api/events/live').length,1);assert.equal(requests.filter(path=>path.endsWith('/refresh')).length,1);disposeServices(ctx.http);
});

test('explicit Unicode Last-Event-ID is UTF-8 bytes and over-budget IDs fail before IO',async()=>{
 const id='序号-😀';let calls=0;const http=client(async(url,init)=>{calls++;const encoded=init.headers.get('last-event-id');assert.equal(new TextDecoder().decode(Uint8Array.from(encoded,char=>char.charCodeAt(0))),id);return frame('data:value\n\n');});let last;
 await http.readEvents('/live',{lastEventId:id,onEvent(event){last=event.id;}});assert.equal(last,id);await assert.rejects(http.readEvents('/live',{lastEventId:'中'.repeat(3000),onEvent(){}}),TypeError);assert.equal(calls,1);http.destroy();
});

test('unmanaged SSE also rejects a bridge response from a different origin and cancels its body',async()=>{
 const body=live();Object.defineProperty(body.response,'url',{value:'https://other.example/private'});const http=client(async()=>body.response);await assert.rejects(http.readEvents('/live',{headers:{'X-API-Key':'SYNTHETIC_KEY'},onEvent(){assert.fail();}}),e=>e.kind==='network'&&!JSON.stringify(e).includes('other.example'));await flush();assert.equal(body.cancelled,1);http.destroy();
});
