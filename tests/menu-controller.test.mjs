import test from 'node:test';
import assert from 'node:assert/strict';
import {createMenuController} from '../packages/runtime/dist/menu.js';
const item=(id,extra={})=>({id,kind:'item',label:`条目 ${id}`,actionId:`action.${id}`,...extra});
const config=()=>({items:[{id:'shortcuts',kind:'group',label:'快捷入口',items:[item('a'),item('b')]},{id:'divider',kind:'separator'},item('settings'),item('disabled',{disabled:true}),item('hidden',{hidden:true}),item('logout',{tone:'danger'})]});
test('menu presentation data round trips JSON, freezes a snapshot and rejects executable or ambiguous data',()=>{
 const input=config(),controller=createMenuController({config:JSON.parse(JSON.stringify(input))});
 input.items[0].items[0].label='修改宿主对象';assert.equal(controller.getState().config.items[0].items[0].label,'条目 a');assert.ok(Object.isFrozen(controller.getState().config.items[0].items));
 const before=controller.getState();for(const invalid of [{items:[item('x'),item('x')]},{items:[{...item('x'),onClick(){}}]},{items:[{...item('x'),tone:'warning'}]},{items:[{id:'g',kind:'group',items:[{id:'nested',kind:'group',items:[]}]}]},{items:[{...item('x'),get label(){throw Error('must not execute');}}]},{items:[item('x')],disabled:1}]){assert.throws(()=>controller.setConfig(invalid),TypeError);assert.equal(controller.getState(),before);}
 controller.destroy();
});
test('menu default controller owns open/focus only, skips unavailable actions and emits an exact action once',()=>{
 const calls=[],controller=createMenuController({config:config(),onAction:event=>calls.push(event)});let notifications=0;const unsubscribe=controller.subscribe(()=>notifications++);
 assert.equal(controller.activate('a'),false);controller.setOpen(true);assert.equal(controller.focusItem('a'),true);const request=controller.getState().focusRequest;assert.equal(request.itemId,'a');controller.recordFocus('a');assert.equal(controller.getState().focusRequest,request);
 for(const id of ['hidden','disabled','divider','missing']){assert.equal(controller.focusItem(id),false);assert.equal(controller.activate(id),false);}
 controller.recordFocus('disabled');assert.equal(controller.getState().activeId,'disabled');controller.setConfig(config());assert.equal(controller.getState().activeId,'disabled');controller.recordFocus('a');
 assert.equal(controller.activate('a',{source:'keyboard'}),true);assert.equal(calls.length,1);assert.equal(calls[0].actionId,'action.a');assert.equal(calls[0].source,'keyboard');assert.equal(controller.getState().open,false);assert.equal(controller.activate('a'),false);assert.equal(calls.length,1);assert.ok(notifications>0);unsubscribe();controller.destroy();
});
test('menu synchronous takeover prevents automatic close, reentrant activation and stale-session close',()=>{
 let nested,events=0,controller;controller=createMenuController({config:config(),onAction:event=>{events++;nested=controller.activate('b');if(event.actionId==='action.logout')event.preventDefault();else{controller.setOpen(false);controller.setOpen(true);}}});
 controller.setOpen(true);assert.equal(controller.activate('logout'),true);assert.equal(controller.getState().open,true);assert.equal(nested,false);assert.equal(events,1);
 controller.activate('a');assert.equal(controller.getState().open,true);assert.equal(events,2);controller.destroy();
});
test('menu dynamic data repairs active focus, global disabling closes, destruction releases listeners once',()=>{
 const controller=createMenuController({config:config(),defaultOpen:true});controller.recordFocus('b');const next=config();next.items[0].items.splice(1,1);controller.setConfig(next);assert.equal(controller.getState().activeId,'settings');assert.equal(controller.getState().focusRequest.itemId,'settings');
 controller.setConfig({...next,disabled:true});assert.equal(controller.getState().open,false);assert.equal(controller.focusItem('a'),false);controller.setOpen(true);assert.equal(controller.getState().open,false);
 let calls=0;controller.subscribe(()=>calls++);controller.destroy();const destroyed=controller.getState();controller.destroy();controller.setConfig(config());controller.setOpen(true);assert.equal(controller.getState(),destroyed);assert.equal(calls,1);assert.equal(controller.activate('a'),false);
});
test('menu action failure is propagated without closing, retrying or retaining callbacks after destroy',()=>{
 let calls=0;const controller=createMenuController({config:config(),defaultOpen:true,onAction(){calls++;throw Error('host failure');}});assert.throws(()=>controller.activate('a'),/host failure/);assert.equal(calls,1);assert.equal(controller.getState().open,true);controller.destroy();assert.equal(controller.activate('a'),false);assert.equal(calls,1);
});
