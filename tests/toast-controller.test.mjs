import test from 'node:test';
import assert from 'node:assert/strict';
import {createToastController} from '../packages/runtime/dist/toast.js';

function shown(controller,binding,id){const record=controller.getState().toasts.find(item=>item.id===id);binding.entered(id,record.revision);return controller.getState().toasts.find(item=>item.id===id);}
function clock(t){t.mock.timers.enable({apis:['Date','setTimeout'],now:0});}

test('Toast is inert without a View and resumes the same queue and deadline',t=>{
 clock(t);const controller=createToastController({timeout:1000});t.after(()=>controller.destroy());const id=controller.add({title:'saved'});t.mock.timers.tick(5000);assert.equal(controller.getState().toasts.length,1);
 const binding=controller.bindView();shown(controller,binding,id);t.mock.timers.tick(400);binding.setPaused('hover',true);t.mock.timers.tick(5000);assert.equal(controller.getState().toasts[0].transitionStatus,undefined);
 binding.setPaused('focus',true);binding.setPaused('hover',false);t.mock.timers.tick(5000);assert.equal(controller.getState().paused,true);binding.setPaused('focus',false);t.mock.timers.tick(599);assert.equal(controller.getState().toasts[0].transitionStatus,undefined);t.mock.timers.tick(1);assert.equal(controller.getState().toasts[0].transitionStatus,'ending');
});

test('last View pauses borrowed queue and a stale lease cannot resume it',t=>{
 clock(t);const controller=createToastController({timeout:1000});t.after(()=>controller.destroy());const a=controller.bindView(),id=controller.add({});shown(controller,a,id);t.mock.timers.tick(200);a.release();a.setPaused('old',false);a.entered(id,0);t.mock.timers.tick(9000);assert.equal(controller.getState().toasts.length,1);assert.equal(controller.getState().paused,true);
 const b=controller.bindView();t.mock.timers.tick(799);assert.equal(controller.getState().toasts[0].transitionStatus,undefined);t.mock.timers.tick(1);assert.equal(controller.getState().toasts[0].transitionStatus,'ending');b.release();assert.equal(controller.getState().toasts.length,0);
});

test('limit pauses hidden rows and a promoted row receives its full timeout',t=>{
 clock(t);const controller=createToastController({timeout:1000,limit:1});t.after(()=>controller.destroy());const binding=controller.bindView(),old=controller.add({title:'old'});shown(controller,binding,old);t.mock.timers.tick(100);const fresh=controller.add({title:'new'});shown(controller,binding,fresh);assert.equal(controller.getState().toasts[1].limited,true);t.mock.timers.tick(500);controller.close(fresh);binding.exited(fresh,controller.getState().toasts[0].revision);assert.equal(controller.getState().toasts[0].id,old);assert.equal(controller.getState().toasts[0].limited,false);t.mock.timers.tick(899);assert.equal(controller.getState().toasts[0].transitionStatus,undefined);t.mock.timers.tick(1);assert.equal(controller.getState().toasts[0].transitionStatus,'ending');
});

test('close, repeated close, animation receipts and callback errors cannot remove twice',t=>{
 const controller=createToastController({timeout:-1});t.after(()=>controller.destroy());const binding=controller.bindView(),calls=[];const id=controller.add({onClose:()=>{calls.push('close');throw Error('host');},onRemove:()=>calls.push('remove')});const old=shown(controller,binding,id);assert.throws(()=>controller.close(id),AggregateError);const ending=controller.getState().toasts[0];controller.close(id);binding.exited(id,old.revision);assert.equal(controller.getState().toasts.length,1);binding.exited(id,ending.revision);binding.exited(id,ending.revision);assert.deepEqual(calls,['close','remove']);assert.equal(controller.getState().toasts.length,0);
});

test('timeout -1, exit fallback, upsert and closing-id reuse are deterministic',t=>{
 clock(t);const controller=createToastController({timeout:-1,exitTimeout:40});t.after(()=>controller.destroy());const binding=controller.bindView(),calls=[];controller.add({id:'same',title:'one',onRemove:()=>calls.push('old')});shown(controller,binding,'same');controller.add({id:'same',title:'two'});assert.equal(controller.getState().toasts.length,1);t.mock.timers.tick(10000);assert.equal(controller.getState().toasts[0].title,'two');controller.close('same');const closing=controller.getState().toasts[0];controller.add({id:'same',title:'replacement'});binding.exited('same',closing.revision);assert.deepEqual(calls,['old']);assert.equal(controller.getState().toasts[0].title,'replacement');controller.close();t.mock.timers.tick(40);assert.equal(controller.getState().toasts.length,0);
});

test('updates invalidate stale entry receipts and restart only the item deadline',t=>{
 clock(t);const controller=createToastController({timeout:100});t.after(()=>controller.destroy());const binding=controller.bindView(),id=controller.add({title:'before'}),old=controller.getState().toasts[0];controller.update(id,{title:'after',timeout:300});binding.entered(id,old.revision);assert.equal(controller.getState().toasts[0].transitionStatus,'starting');shown(controller,binding,id);t.mock.timers.tick(299);assert.equal(controller.getState().toasts[0].transitionStatus,undefined);t.mock.timers.tick(1);assert.equal(controller.getState().toasts[0].transitionStatus,'ending');
});

test('promise success updates its queue, rejection remains observable to the caller',async t=>{
 const controller=createToastController({timeout:-1});t.after(()=>controller.destroy());const result=await controller.promise(Promise.resolve(42),{loading:'working',success:value=>({title:`done ${value}`,data:{value}}),error:'failed'});assert.equal(result,42);assert.equal(controller.getState().toasts[0].title,'done 42');assert.deepEqual(controller.getState().toasts[0].data,{value:42});assert.equal(controller.getState().toasts[0].type,'success');
 const error=Error('offline');await assert.rejects(controller.promise(Promise.reject(error),{loading:'working',success:'done',error:value=>({title:value.message})}),error);assert.equal(controller.getState().toasts[0].title,'offline');assert.equal(controller.getState().toasts[0].type,'error');
});

for(const operation of ['close','update','destroy'])test(`late promise cannot revive an item after ${operation}`,async()=>{
 const controller=createToastController({timeout:-1});let resolve,formatted=0;const pending=controller.promise(new Promise(done=>resolve=done),{loading:{id:'late',title:'working'},success:()=>{formatted++;return 'done';},error:'failed'});
 if(operation==='close')controller.close('late');else if(operation==='update')controller.update('late',{title:'new owner'});else controller.destroy();resolve('result');assert.equal(await pending,'result');assert.equal(formatted,0);assert.equal(controller.getState().toasts.some(item=>item.title==='done'),false);controller.destroy();
});

test('borrowed queues are isolated across replacement and snapshot identities are stable',()=>{
 const a=createToastController(),b=createToastController();const view=a.bindView();a.add({id:'record',title:'A'});const snapshot=a.getState();assert.equal(a.getState(),snapshot);assert(Object.isFrozen(snapshot));assert(Object.isFrozen(snapshot.toasts));assert(Object.isFrozen(snapshot.toasts[0]));view.release();b.add({id:'record',title:'B'});view.exited('record',b.getState().toasts[0].revision);view.setExpanded(true);assert.equal(b.getState().toasts[0].title,'B');assert.equal(b.getState().expanded,false);a.destroy();b.destroy();
});

test('invalid configuration fails early and destroying a queue is idempotent',()=>{
 for(const options of [{limit:0},{limit:1.2},{timeout:-.5},{timeout:-2},{exitTimeout:Infinity},{timeout:2147483648}])assert.throws(()=>createToastController(options),TypeError);
 const controller=createToastController();assert.throws(()=>controller.add({id:''}),TypeError);assert.throws(()=>controller.add({priority:'urgent'}),TypeError);controller.destroy();controller.destroy();assert.equal(controller.getState().toasts.length,0);assert.throws(()=>controller.add({}),/destroyed/);
});

test('ordinary content updates preserve remaining time while upsert explicitly restarts it',t=>{
 clock(t);const controller=createToastController({timeout:1000});t.after(()=>controller.destroy());const binding=controller.bindView(),id=controller.add({id:'progress',title:'one'});shown(controller,binding,id);t.mock.timers.tick(800);controller.update(id,{title:'two'});t.mock.timers.tick(199);assert.equal(controller.getState().toasts[0].transitionStatus,undefined);controller.add({id,title:'upsert'});t.mock.timers.tick(999);assert.equal(controller.getState().toasts[0].transitionStatus,undefined);t.mock.timers.tick(1);assert.equal(controller.getState().toasts[0].transitionStatus,'ending');
});

test('closing-id reuse remains unique when old remove callback reenters add',()=>{
 const controller=createToastController({timeout:-1});const binding=controller.bindView();controller.add({id:'same',title:'old',onRemove:()=>controller.add({id:'same',title:'reentered'})});controller.close('same');controller.add({id:'same',title:'new'});assert.equal(controller.getState().toasts.length,1);assert.equal(controller.getState().toasts[0].title,'reentered');binding.release();controller.destroy();
});

test('default timeout automatically closes at five seconds and -1 explicitly disables it',t=>{
 clock(t);const controller=createToastController();t.after(()=>controller.destroy());assert.equal(controller.getState().timeout,5000);const binding=controller.bindView(),id=controller.add({title:'default'});shown(controller,binding,id);t.mock.timers.tick(4999);assert.equal(controller.getState().toasts[0].transitionStatus,undefined);t.mock.timers.tick(1);assert.equal(controller.getState().toasts[0].transitionStatus,'ending');controller.add({id:'pinned',timeout:-1});shown(controller,binding,'pinned');t.mock.timers.tick(10000);assert.equal(controller.getState().toasts[0].id,'pinned');assert.equal(controller.getState().toasts[0].transitionStatus,undefined);
});

for(const options of [{},{timeout:0}])test(`zero and omitted timeout use five-second defaults: ${JSON.stringify(options)}`,t=>{
 clock(t);const controller=createToastController(options);t.after(()=>controller.destroy());const binding=controller.bindView(),id=controller.add({title:'zero',timeout:0});shown(controller,binding,id);assert.equal(controller.getState().timeout,5000);assert.equal(controller.getState().toasts[0].timeout,5000);t.mock.timers.tick(4999);assert.equal(controller.getState().toasts[0].transitionStatus,undefined);t.mock.timers.tick(1);assert.equal(controller.getState().toasts[0].transitionStatus,'ending');
});

test('View presentation caps release without mutating the host configured limit',()=>{
 const controller=createToastController({timeout:-1,limit:3}),a=controller.bindView(),b=controller.bindView();for(let i=0;i<4;i++)controller.add({title:String(i)});a.setVisibleLimit(1);assert.equal(controller.getState().limit,3);assert.equal(controller.getState().visibleLimit,1);assert.equal(controller.getState().toasts.filter(item=>!item.limited).length,1);b.setVisibleLimit(2);a.release();assert.equal(controller.getState().visibleLimit,2);a.setVisibleLimit(1);assert.equal(controller.getState().visibleLimit,2);assert.throws(()=>b.setVisibleLimit(0),TypeError);b.release();assert.equal(controller.getState().visibleLimit,3);controller.destroy();
});
