import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {isolatedTheme,disposeServices} from './helpers/runtime-services.mjs';
function browser(storage=new Map(),deny=false){let localReads=0,reads=0,writes=0;const listeners=new Set(),styles=new Map(),media={matches:false,addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)},document={documentElement:{dataset:{},style:{getPropertyValue:name=>styles.get(name)??'',setProperty:(name,value)=>styles.set(name,String(value))}},currentScript:{getAttribute:()=>null}};const window={document,matchMedia:()=>media,get localStorage(){localReads++;throw Error('Retired local storage');},get sessionStorage(){if(deny)throw Error('Denied session storage');return {getItem:key=>{reads++;return storage.get(key)??null;},setItem:(key,value)=>{writes++;storage.set(key,value);}};}};return {window,document,media,listeners,styles,get localReads(){return localReads;},get reads(){return reads;},get writes(){return writes;}};}
test('default persistence uses only sessionStorage, reload restores and independent sessions start dark',()=>{
 const storage=new Map(),first=browser(storage),owner=isolatedTheme({window:first.window});owner.setMode('light');assert.equal(storage.get('ui.theme.mode'),'light');disposeServices(owner);const reload=browser(storage),restored=isolatedTheme({window:reload.window});assert.equal(restored.getState().mode,'light');const fresh=browser(),independent=isolatedTheme({window:fresh.window});assert.equal(independent.getState().mode,'dark');assert.equal(first.localReads+reload.localReads+fresh.localReads,0);disposeServices(restored,independent);
});
test('system effective updates do not overwrite saved preference; custom key remains session-only',()=>{
 const storage=new Map([['appearance','system']]),b=browser(storage),owner=isolatedTheme({window:b.window,storageKey:'appearance'});b.media.matches=true;b.listeners.forEach(fn=>fn());assert.deepEqual(owner.getState(),{mode:'system',effective:'dark',preset:'violet'});assert.equal(b.writes,0);owner.setMode('light');assert.equal(storage.get('appearance'),'light');assert.equal(storage.has('ui.theme.mode'),false);assert.equal(b.localReads,0);disposeServices(owner);
});
test('controlled and memory-only themes access neither storage; denied session storage stays usable',()=>{
 for(const options of [{mode:'light'},{persist:false}]){const b=browser(),owner=isolatedTheme({window:b.window,...options});owner.setMode('dark');owner.syncMode('system');assert.equal(b.reads+b.writes+b.localReads,0);disposeServices(owner);}
 const b=browser(new Map(),true),owner=isolatedTheme({window:b.window});assert.equal(owner.getState().mode,'dark');owner.setMode('light');assert.equal(owner.getState().mode,'light');assert.equal(b.localReads,0);disposeServices(owner);
});
test('pre-paint reads session preference without creating the runtime owner; services create it lazily',async()=>{
 const b=browser(new Map([['ui.theme.mode','light']])),script=await readFile('packages/runtime/dist/init.js','utf8'),context={window:b.window,document:b.document};runInNewContext(script,context);assert.equal(b.document.documentElement.dataset.theme,'light');assert.equal(b.window.xuiTheme,undefined);runInNewContext(script,context);assert.equal(b.window.xuiTheme,undefined);assert.equal(b.reads,4);assert.equal(b.localReads,0);const owner=isolatedTheme({window:b.window});assert.equal(owner.getState().mode,'light');assert.equal(b.reads,5);disposeServices(owner);
});
