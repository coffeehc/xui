import test from 'node:test';
import assert from 'node:assert/strict';
import {HttpError} from '../packages/runtime/dist/http.js';
import * as businessLog from '../packages/runtime/dist/business-log.js';
import {createBusinessLogController,parseBusinessLogEvent,parseBusinessLogPage,parseBusinessLogDetail,parseBusinessLogPayload,validateBusinessLogFilter,findBusinessLogRenderer,getBusinessLogTable} from '../packages/runtime/dist/business-log.js';
const stamp='2026-10-11T12:00:00.000000123Z',secret='FAKE_PRIVATE_BUSINESS_LOG_VALUE';
const event=(extra={})=>({id:'demo:1',event_type:'order.approved',schema_version:1,occurred_at:stamp,recorded_at:stamp,actor:{kind:'user',id:'demo-user',display_name:null},object:{kind:'order',id:'order-1',display_name:null},action:'approve',result:'succeeded',summary:'Approved',correlation_id:null,request_id:null,...extra});
const page=(extra={})=>({list:[event()],page:{next_cursor:null,snapshot_id:'snapshot-1'},...extra});
const detail=(extra={})=>({event:event(),state:'available',payload:{approval:{reason:'Allowed business details'}},...extra});
const make=(extra={})=>createBusinessLogController({loader:{list:async()=>page(),detail:async()=>detail()},...extra});
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
test('business log labels resolve live presentation independently of immutable controller state',async()=>{
 assert.equal(typeof businessLog.resolveBusinessLogLabels,'function');
 const {resolveBusinessLogLabels,businessLogDefaultLabels}=businessLog,controller=make({labels:{title:'初始标题',readError:'初始读取错误'}});
 try{await controller.refresh();await controller.openDetail('demo:1');const state=controller.getState(),original=controller.labels;
  const chinese=resolveBusinessLogLabels({title:'业务日志',close:'关闭'},original),english=resolveBusinessLogLabels({title:'Audit log'},original);
  assert.equal(chinese.close,'关闭');assert.equal(english.close,original.close);assert.equal(english.title,'Audit log');assert.ok(Object.isFrozen(chinese));assert.equal(controller.getState(),state);assert.equal(controller.labels,original);assert.equal(controller.labels.title,'初始标题');assert.equal(resolveBusinessLogLabels().title,businessLogDefaultLabels.title);
  assert.equal(resolveBusinessLogLabels({title:undefined},chinese).title,'业务日志');assert.equal(resolveBusinessLogLabels({title:''}).title,'');
  for(const title of [null,3,{},()=> 'title'])assert.throws(()=>resolveBusinessLogLabels({title}),TypeError);
 }finally{controller.destroy();}
});
test('business log feedback keys preserve legacy strings and clear atomically across read and detail transitions',async()=>{
 for(const [mode,key] of [['read','readError'],['contract','contractError'],[403,'forbidden'],[404,'notFound']]){
  let fail=true;const failure=()=>{if(mode==='contract')return {};throw typeof mode==='number'?new HttpError('http',{status:mode,attempts:1}):Error(secret);};
  const controller=make({labels:{readError:'初始读取失败'},loader:{list:async()=>fail?failure():page(),detail:async()=>fail?failure():detail()}});
  try{await controller.refresh();let state=controller.getState();assert.equal(state.errorKey,key);assert.equal(state.error,controller.labels[key]);assert.ok(!JSON.stringify(state).includes(secret));
   const translated=businessLog.resolveBusinessLogLabels({[key]:'Live translated feedback'});assert.equal(translated[state.errorKey],'Live translated feedback');
   await controller.openDetail('demo:1');state=controller.getState();assert.equal(state.detailErrorKey,key);assert.equal(state.detailError,controller.labels[key]);
   controller.closeDetail();assert.equal(controller.getState().detailErrorKey,null);controller.cancel();assert.equal(controller.getState().errorKey,null);
   fail=false;await controller.retry();await controller.openDetail('demo:1');assert.equal(controller.getState().errorKey,null);assert.equal(controller.getState().detailErrorKey,null);
   await controller.setFilter({actor:{kind:'user',id:''}});assert.equal(controller.getState().errorKey,null);assert.equal(controller.getState().filterError,controller.labels.invalidFilter);assert.equal(controller.getState().filterErrorKey,'invalidFilter');await controller.setFilter({});assert.equal(controller.getState().filterErrorKey,null);
  }finally{controller.destroy();}
 }
});
test('business log columns read exact raw fields without changing state or requests',async()=>{
 let reads=0;const raw=event({attributes:{owner_name:'用户甲',zero:0,flag:false,empty:null,summary:'cannot shadow',nested:{id:'session-real'}}});
 const controller=make({loader:{list:async()=>{reads++;return page({list:[raw]});},detail:async()=>detail()}});try{
  await controller.refresh();const state=controller.getState(),before=JSON.stringify(state),labels=controller.labels;
  const standard=getBusinessLogTable(state,labels);assert.equal(standard.headers.length,7);assert.equal(standard.rows[0].values.length,7);
  const ids=['owner_name','zero','flag','empty','missing','nested','occurred_at','summary','detail'];
  const columns=ids.map(id=>({id,header:id})),table=getBusinessLogTable(state,labels,{columns});
  assert.deepEqual(table.columnIds,ids);assert.deepEqual(table.rows[0].values.slice(0,5),['用户甲',0,false,null,undefined]);
  assert.equal(table.rows[0].values[5].id,'session-real');assert.equal(table.rows[0].values[6],raw.occurred_at);assert.equal(table.rows[0].values[7],raw.summary);assert.equal(table.rows[0].event,state.data.list[0]);
  assert.equal(JSON.stringify(state),before);assert.equal(reads,1);assert.ok(Object.isFrozen(state.data.list[0].attributes.nested));
  const custom=getBusinessLogTable(state,labels,{columns:[{id:'action',header:'动作'}]});assert.deepEqual(custom.columnIds,['action']);assert.deepEqual(custom.rows[0].values,['approve']);
 }finally{controller.destroy();}
});
test('business log column definitions validate identities, widths and explicit overflow',()=>{
 const controller=make(),table=columns=>getBusinessLogTable(controller.getState(),controller.labels,{columns});try{
  assert.deepEqual(table([{id:'custom',header:'自定义',width:'20rem',overflow:'ellipsis'}]).columnIds,['custom']);
  for(const columns of [[],['actor'],null,[{id:'x',header:'X'},{id:'x',header:'Y'}],[{id:'',header:'X'}],[{id:'x',header:''}],[{id:'x',header:'X',width:-1}],[{id:'x',header:'X',overflow:'ellipsis'}],[{id:'x',header:'X',overflow:'clip'}]])assert.throws(()=>table(columns),TypeError);
  for(const key of ['formatActor','formatAction','formatOccurredAt'])assert.throws(()=>getBusinessLogTable(controller.getState(),controller.labels,{[key]:()=>''}),TypeError);
 }finally{controller.destroy();}
});
test('business log explicit attributes are immutable JSON, not unknown field passthrough',()=>{
 const input=event({attributes:JSON.parse('{"__proto__":{"id":"safe"},"owner":{"id":"u","name":"名称"}}'),hidden:'hidden'}),parsed=parseBusinessLogEvent(input);
 input.attributes.owner.id='changed';assert.equal(parsed.attributes.owner.id,'u');assert.equal(parsed.attributes.__proto__.id,'safe');assert.equal(Object.getPrototypeOf(parsed.attributes),null);assert.ok(Object.isFrozen(parsed.attributes.owner));assert.equal(parsed.hidden,undefined);
 const controller=make();try{const state={...controller.getState(),data:parseBusinessLogPage(page({list:[parsed]}))};assert.equal(getBusinessLogTable(state,controller.labels,{columns:[{id:'constructor',header:'原型'}]}).rows[0].values[0],undefined);}finally{controller.destroy();}
 const cycle={};cycle.self=cycle;for(const attributes of [null,[],new Date(),{get secret(){throw Error('getter');}},cycle,{n:1n},{n:Infinity}])assert.throws(()=>parseBusinessLogEvent(event({attributes})),TypeError);
});
test('business log common fields are exact immutable metadata; domain payload is never in list snapshots',()=>{
 const parsed=parseBusinessLogEvent(event({payload:secret,stack:secret,schema_version:42,actor:{kind:'agent',id:'a',display_name:'Agent'}}));assert.equal(parsed.schema_version,42);assert.equal(parsed.actor.kind,'agent');assert.equal(parsed.correlation_id,null);assert.ok(Object.isFrozen(parsed.actor));assert.ok(!JSON.stringify(parsed).includes(secret));
 for(const change of [{schema_version:0},{actor:{kind:'system',id:'a',display_name:null}},{result:'error'},{occurred_at:'2026-02-30T00:00:00Z'},{object:undefined},{request_id:undefined},{id:''}])assert.throws(()=>parseBusinessLogEvent(event(change)),TypeError);
 assert.throws(()=>parseBusinessLogPage(page({list:[event(),event()]})));assert.throws(()=>parseBusinessLogPage({items:[],page:page().page}));assert.throws(()=>parseBusinessLogPage(page({page:{snapshot_id:'s',next_cursor:''}})));
});
test('business log JSON permits different domain schemas safely and rejects non-JSON, cycles and size excess',()=>{
 const inputs=[null,['a',true,3],{approval:{reason:'<img src=x onerror=alert(1)>'}},{setting:{previous:30,next:60}},JSON.parse('{"__proto__":{"safe":"plain JSON"}}')];for(const input of inputs){const parsed=parseBusinessLogPayload(input);assert.equal(JSON.stringify(parsed),JSON.stringify(input));if(parsed&&typeof parsed==='object')assert.ok(Object.isFrozen(parsed));}
 let accessed=0;const getter={get value(){accessed++;return secret;}},cycle={};cycle.self=cycle;const deep={};let child=deep;for(let i=0;i<17;i++){child.next={};child=child.next;}
 for(const invalid of [undefined,()=>{},1n,NaN,Infinity,9007199254740992,new Date(),getter,cycle,deep,'中'.repeat(21846),Array(4096).fill(null),{toJSON:()=>secret}])assert.throws(()=>parseBusinessLogPayload(invalid),TypeError);assert.equal(accessed,0);assert.equal(parseBusinessLogPayload({large:'9007199254740993'}).large,'9007199254740993');
 assert.throws(()=>parseBusinessLogDetail(detail({state:'expired',payload:secret})));assert.equal(parseBusinessLogDetail(detail({state:'unavailable',payload:null})).payload,null);assert.equal(parseBusinessLogDetail(detail({payload:null})).state,'available');
});
test('business log filters are exact paired fields and preserve nanosecond half-open bounds',()=>{
 const from='2026-10-11T12:00:00.000000001Z',until='2026-10-11T12:00:00.000000002Z';const result=validateBusinessLogFilter({since:from,until,actor:{kind:'service',id:'s'},correlation_id:'c',request_id:'r',result:'denied'});assert.equal(result.since,from);assert.equal(result.actor.kind,'service');assert.ok(Object.isFrozen(result.actor));
 for(const invalid of [{since:until,until:from},{since:from,until:'2026-10-11T13:00:00.000000001+01:00'},{object:{kind:'order',id:''}},{actor:{kind:'unknown',id:'a'}},{tenant:'fake'},{payload:'search'},{severity:'error'},{action:''}])assert.throws(()=>validateBusinessLogFilter(invalid));assert.throws(()=>make({pageSize:201}));assert.throws(()=>make({loader:{}}));assert.throws(()=>make({resolveObject:()=>'/object'}));
});
test('business log cursors bind a stable snapshot and previous reads cached summaries without new requests',async()=>{
 const requests=[];let wrong=false,loop=false;const controller=make({loader:{list:async query=>{requests.push(query);return page({page:{snapshot_id:wrong?'other':'snapshot-1',next_cursor:query.page.cursor?(loop?'opaque-next':null):'opaque-next'}});},detail:async()=>detail()}});await controller.refresh();assert.equal(requests[0].page.size,50);await controller.next();assert.equal(requests[1].page.cursor,'opaque-next');controller.previous();assert.equal(requests.length,2);assert.equal(controller.getState().pageIndex,0);await controller.setFilter({action:'approve'});assert.equal(requests.at(-1).page.cursor,null);wrong=true;await controller.next();assert.ok(controller.getState().error);wrong=false;loop=true;await controller.retry();assert.ok(controller.getState().error);controller.destroy();
});
test('business log refresh failures preserve old facts and reads never retry automatically',async()=>{
 let fail=false,calls=0;const controller=make({loader:{list:async query=>{calls++;if(fail)throw Error(secret);return page({page:{snapshot_id:'s',next_cursor:query.page.cursor?null:'next'}});},detail:async()=>detail()}});await controller.refresh();await controller.next();assert.equal(controller.getState().pageIndex,1);fail=true;await controller.refresh();assert.equal(controller.getState().pageIndex,1);assert.equal(controller.getState().canPrevious,false);assert.ok(controller.getState().data);assert.ok(controller.getState().error);assert.ok(!JSON.stringify(controller.getState()).includes(secret));assert.equal(calls,3);fail=false;await controller.retry();assert.equal(calls,4);assert.equal(controller.getState().pageIndex,0);await controller.setFilter({object:{kind:'x',id:''}});assert.ok(controller.getState().filterError);await controller.retry();assert.equal(calls,4);controller.destroy();
});
test('business log replacement, cancellation and destruction settle uncooperative reads and reject late results',async()=>{
 const old=deferred();let calls=0;const controller=make({loader:{list:()=>++calls===1?old.promise:Promise.resolve(page()),detail:async()=>detail()}});const first=controller.refresh();await tick();await controller.setFilter({action:'new'});await first;old.resolve(page({list:[event({summary:'Old'})]}));await tick();assert.equal(controller.getState().data.list[0].summary,'Approved');const held=deferred(),other=make({loader:{list:()=>held.promise,detail:async()=>detail()}}),pending=other.refresh();await tick();other.cancel();await pending;assert.equal(other.getState().busy,false);other.destroy();held.resolve(page());await tick();assert.equal(other.getState().data,null);controller.destroy();
});
test('business log subscribers can replace or destroy transitions and rebind without an infinite notification',async()=>{
 const requests=[];const controller=make({loader:{list:async query=>{requests.push(query.filter.action);return page();},detail:async()=>detail()}});let changed=false,nested;controller.subscribe(()=>{if(!changed){changed=true;nested=controller.setFilter({action:'new'});}});await controller.setFilter({action:'old'});await nested;assert.equal(controller.getState().filter.action,'new');assert.deepEqual(requests,['new']);controller.destroy();
 const stopped=make();stopped.subscribe(()=>stopped.destroy());await stopped.setFilter({action:'old'});assert.equal(stopped.getState().filter.action,null);assert.equal(stopped.getState().data,null);
 const rebound=make();let count=0,off=()=>{};const listener=()=>{count++;off();if(count<8)off=rebound.subscribe(listener);};off=rebound.subscribe(listener);rebound.cancel();assert.equal(count,1);off();rebound.destroy();
});
test('business log details distinguish forbidden, missing, expired, unavailable and legitimate null payload',async()=>{
 for(const [status,state] of [[403,'forbidden'],[404,'not_found']]){const controller=make({loader:{list:async()=>page(),detail:async()=>{throw new HttpError('http',{status,attempts:1});}}});await controller.openDetail('demo:1');assert.equal(controller.getState().detailState,state);assert.equal(controller.getState().detail,null);controller.destroy();}
 for(const state of ['expired','unavailable','available']){const controller=make({loader:{list:async()=>page(),detail:async()=>detail({state,payload:null})}});await controller.openDetail('demo:1');assert.equal(controller.getState().detailState,state);assert.equal(controller.getState().detail.payload,null);controller.closeDetail();assert.equal(controller.getState().detail,null);controller.destroy();}
});
test('business log detail IDs and generations isolate closing, replacement and destroy',async()=>{
 const old=deferred();let calls=0;const controller=make({loader:{list:async()=>page(),detail:id=>++calls===1?old.promise:Promise.resolve(detail({event:event({id})}))}});const first=controller.openDetail('demo:1');await tick();await controller.openDetail('demo:2');await first;old.resolve(detail({payload:secret}));await tick();assert.equal(controller.getState().detail.event.id,'demo:2');assert.ok(!JSON.stringify(controller.getState()).includes(secret));controller.closeDetail();assert.equal(controller.getState().detail,null);controller.destroy();await controller.openDetail('demo:1');assert.equal(calls,2);
 const wrong=make({loader:{list:async()=>page(),detail:async()=>detail({event:event({id:'wrong'})})}});await wrong.openDetail('demo:1');assert.equal(wrong.getState().detailState,'error');assert.equal(wrong.getState().detail,null);wrong.destroy();
});
test('a business log detail opened by an abort callback stays open across a filter reset',async()=>{
 const old=deferred();let current;const controller=make({loader:{list:async()=>page(),detail:(id,{signal})=>{if(id==='demo:1'){signal.addEventListener('abort',()=>{current=controller.openDetail('demo:2');},{once:true});return old.promise;}return Promise.resolve(detail({event:event({id})}));}}});const first=controller.openDetail('demo:1');await tick();await controller.setFilter({action:'approve'});await first;await current;assert.equal(controller.getState().filter.action,'approve');assert.equal(controller.getState().detailOpen,true);assert.equal(controller.getState().detailId,'demo:2');assert.equal(controller.getState().detail.event.id,'demo:2');controller.destroy();
});
test('business log renderers match exact type/version and object links require trusted safe origins',()=>{
 const matched={eventType:'order.approved',schemaVersion:1,render:()=>null},registry=[matched];assert.equal(findBusinessLogRenderer(registry,parseBusinessLogDetail(detail())),matched);assert.equal(findBusinessLogRenderer(registry,parseBusinessLogDetail(detail({event:event({schema_version:2})}))),undefined);
 let target='/object';const controller=make({baseURL:'https://host.invalid/business-log/',referenceOrigins:['https://allowed.invalid'],resolveObject:()=>target});assert.equal(controller.resolveObject(event().object),'https://host.invalid/object');for(const value of ['javascript:alert(1)','https://user:pass@host.invalid/','https://other.invalid/']){target=value;assert.equal(controller.resolveObject(event().object),null);}target='https://allowed.invalid/object';assert.equal(controller.resolveObject(event().object),target);controller.destroy();assert.equal(controller.resolveObject(event().object),null);
});
