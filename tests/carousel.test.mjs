import test from 'node:test';
import assert from 'node:assert/strict';
import {createCarouselController} from '../packages/runtime/dist/carousel.js';
const ids=['a','b','c'];
test('carousel validates ids, interval and initial selection atomically',()=>{
 for(const options of [{ids:['a','a']},{ids:['']},{ids,interval:0},{ids,interval:999},{ids,value:'missing'}])assert.throws(()=>createCarouselController(options));
 const model=createCarouselController({ids});assert.equal(model.getState().value,'a');assert.equal(model.getState().interval,5000);
 assert.throws(()=>model.update({ids:['bad','bad'],value:'bad'}));assert.equal(model.getState().value,'a');
});
test('carousel handles boundaries, loop and stable-id reorder',()=>{
 const events=[],model=createCarouselController({ids,onValueChange:(value,details)=>events.push([value,details.reason])});
 assert.equal(model.previous(),false);model.next();assert.equal(model.getState().value,'b');model.next();assert.equal(model.getState().canNext,false);
 model.update({loop:true});model.next();assert.equal(model.getState().value,'a');model.previous();assert.equal(model.getState().value,'c');
 model.update({ids:['c','b','a']});assert.equal(model.getState().value,'c');assert.equal(model.getState().index,0);assert.equal(events.length,4);
});
test('carousel controlled requests wait for confirmation and updates never echo',()=>{
 const events=[],model=createCarouselController({ids,value:'a',onValueChange:(value,details)=>events.push([value,details.reason])});
 model.next();assert.equal(model.getState().value,'a');assert.deepEqual(events,[['b','next']]);model.update({value:'b'});assert.equal(model.getState().value,'b');assert.equal(events.length,1);
 model.update({value:undefined});assert.equal(model.getState().value,'b');model.next();assert.equal(model.getState().value,'c');
});
test('carousel cancellation and synchronous owner confirmation preserve ownership',()=>{
 const denied=createCarouselController({ids,onValueChange:(_value,details)=>details.cancel()});assert.equal(denied.next(),false);assert.equal(denied.getState().value,'a');
 let confirmed;confirmed=createCarouselController({ids,value:'a',onValueChange:value=>confirmed.update({value})});confirmed.next();assert.equal(confirmed.getState().value,'b');
});
test('carousel removal chooses nearest surviving position and notifies once',()=>{
 const events=[],model=createCarouselController({ids,defaultValue:'b',onValueChange:(value,details)=>events.push([value,details.reason])});
 model.update({ids:['a','c']});assert.equal(model.getState().value,'c');assert.deepEqual(events,[['c','items-change']]);model.update({ids:['a','c']});assert.equal(events.length,1);
 model.update({ids:[]});assert.equal(model.getState().value,null);model.update({ids:['z']});assert.equal(model.getState().value,'z');assert.equal(events.length,3);
});
test('carousel controlled missing item requests one fallback, including empty lists',()=>{
 const events=[],model=createCarouselController({ids,value:'b',onValueChange:value=>events.push(value)});
 model.update({ids:['a','c']});assert.equal(model.getState().value,null);assert.deepEqual(events,['c']);model.update({ids:['a','c']});assert.equal(events.length,1);
 model.update({value:'c'});assert.equal(model.getState().value,'c');model.update({ids:[]});assert.deepEqual(events,['c',null]);model.update({ids:[]});assert.equal(events.length,2);
});
test('carousel empty, single and explicit null selections remain truthful',()=>{
 const empty=createCarouselController({ids:[]});assert.equal(empty.getState().index,-1);assert.equal(empty.next(),false);
 const one=createCarouselController({ids:['a'],loop:true,autoPlay:true});assert.equal(one.getState().playing,false);assert.equal(one.getState().canNext,false);
 const none=createCarouselController({ids,defaultValue:null,loop:true});assert.equal(none.getState().value,null);none.previous();assert.equal(none.getState().value,'c');
});
test('carousel disabled gates actions, while explicit playback and user changes stop correctly',()=>{
 const model=createCarouselController({ids,loop:true,autoPlay:true});assert.equal(model.getState().playing,true);model.next('autoplay');assert.equal(model.getState().playing,true);
 model.previous();assert.equal(model.getState().playing,false);model.setPlaying(true);model.update({autoPlay:true});assert.equal(model.getState().playing,true);
 model.update({disabled:true});assert.equal(model.getState().playing,false);assert.equal(model.next(),false);model.setPlaying(true);assert.equal(model.getState().playing,false);
 model.update({disabled:false});assert.equal(model.getState().playing,false);model.setPlaying(true);assert.equal(model.getState().playing,true);
});
test('carousel default config updates do not restart user-paused playback',()=>{
 const model=createCarouselController({ids,loop:true,autoPlay:true});model.setPlaying(false);const state=model.getState();model.update({ids:[...ids],autoPlay:true});assert.equal(model.getState(),state);
 model.update({autoPlay:false});model.update({autoPlay:true});assert.equal(model.getState().playing,true);
});
test('carousel destroy stops subscribers and callback reentry cannot revive it',()=>{
 let notifications=0,model;model=createCarouselController({ids,autoPlay:true,onValueChange:()=>model.destroy()});model.subscribe(()=>notifications++);assert.equal(model.next(),false);assert.equal(model.getState().destroyed,true);assert.equal(model.getState().playing,false);assert.equal(model.getState().disabled,true);assert.equal(notifications,1);model.update({disabled:false});model.destroy();assert.equal(notifications,1);
});
