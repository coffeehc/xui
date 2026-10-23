import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {setInterfaceScale} from '../packages/runtime/dist/theme.js';
import {isolatedTheme,disposeServices} from './helpers/runtime-services.mjs';

function browser(mode='system',scale='2'){
 const storage=new Map([['ui.theme.mode',mode],['ui.interface.scale',scale]]),reads=[],writes=[],mediaListeners=new Set(),observers=new Set();let denyWrites=false;
 const element=()=>{const styles=new Map();return {dataset:{},style:{getPropertyValue:key=>styles.get(key)??'',setProperty:(key,value)=>styles.set(key,value)}};};
 const document={documentElement:element(),currentScript:{getAttribute:()=>null}};
 const media={matches:false,addEventListener:(_,listener)=>mediaListeners.add(listener),removeEventListener:(_,listener)=>mediaListeners.delete(listener)};
 class MutationObserver {
  constructor(callback){this.callback=callback;}
  observe(target,options){if(target===document)assert.deepEqual(options,{childList:true});else{assert.equal(target,document.documentElement);assert.deepEqual(options,{attributes:true,attributeFilter:['data-theme','data-theme-effective','data-theme-preset','data-interface-scale','style']});}observers.add(this);}
  disconnect(){observers.delete(this);}
 }
 const window={document,MutationObserver,matchMedia:()=>media,sessionStorage:{getItem:key=>{reads.push(key);return storage.get(key)??null;},setItem:(key,value)=>{writes.push([key,value]);if(denyWrites)throw Error('Storage write denied');storage.set(key,value);}}};
 return {window,document,storage,reads,writes,observers,mediaListeners,element,denyWrites(){denyWrites=true;},replace(){const previous=document.documentElement;document.documentElement=element();return previous;},flush(){for(const observer of [...observers])observer.callback([]);},os(dark){media.matches=dark;for(const listener of mediaListeners)listener();}};
}
for(const mode of ['light','dark','system'])test(`root replacement restores ${mode}, forest and scale through the existing owner`,()=>{
 const b=browser(mode);setInterfaceScale(2,{window:b.window});const owner=isolatedTheme({window:b.window,preset:'forest'}),state=owner.getState();let notifications=0;owner.subscribe(()=>notifications++);
 try{const reads=b.reads.length,writes=b.writes.length,old=b.replace();b.flush();const root=b.document.documentElement;
  assert.equal(root.dataset.themePreset,'forest');assert.equal(root.dataset.theme,mode);assert.equal(root.dataset.themeEffective,mode==='dark'?'dark':'light');assert.equal(root.dataset.interfaceScale,'2');assert.equal(root.style.getPropertyValue('--interface-scale'),'2');assert.equal(b.window.xuiTheme,owner);assert.equal(owner.getState(),state);assert.equal(notifications,0);assert.equal(b.reads.length,reads);assert.equal(b.writes.length,writes);
  owner.setMode('dark');assert.equal(root.dataset.theme,'dark');assert.equal(old.dataset.theme,mode);assert.equal(b.storage.get('ui.theme.mode'),'dark');
  owner.setPreset('crimson');assert.equal(root.dataset.themePreset,'crimson');assert.equal(old.dataset.themePreset,'forest');
 }finally{disposeServices(owner);}
 assert.equal(b.observers.size,0);assert.equal(b.mediaListeners.size,0);
});
test('root recovery keeps pre-paint scale without re-reading saved preferences or creating an owner',async()=>{
 const b=browser('system','1.5'),init=await readFile('packages/runtime/dist/init.js','utf8');runInNewContext(init,{window:b.window,document:b.document});assert.equal(b.window.xuiTheme,undefined);
 const owner=isolatedTheme({window:b.window,preset:'forest'});try{const reads=b.reads.length,writes=b.writes.length;b.storage.set('ui.interface.scale','1');b.replace();b.flush();assert.equal(b.document.documentElement.dataset.interfaceScale,'1.5');assert.equal(b.document.documentElement.style.getPropertyValue('--interface-scale'),'1.5');assert.equal(b.reads.length,reads);assert.equal(b.writes.length,writes);}finally{disposeServices(owner);}
});
test('memory scale wins after a denied write; controlled recovery makes no mode requests or notifications',()=>{
 const b=browser('dark','1'),requests=[],owner=isolatedTheme({window:b.window,preset:'forest',mode:'light',onModeChange:mode=>requests.push(mode)});let count=0;owner.subscribe(()=>count++);
 try{b.denyWrites();setInterfaceScale(2,{window:b.window});const reads=b.reads.length,writes=b.writes.length;b.replace();b.flush();assert.equal(b.document.documentElement.dataset.interfaceScale,'2');assert.equal(b.document.documentElement.dataset.theme,'light');assert.deepEqual(requests,[]);assert.equal(count,0);assert.equal(b.reads.length,reads);assert.equal(b.writes.length,writes);
  owner.setMode('system');assert.deepEqual(requests,['system']);assert.equal(owner.getState().mode,'light');owner.syncMode('system');b.os(true);assert.equal(b.document.documentElement.dataset.themeEffective,'dark');assert.equal(count,2);assert.equal(b.writes.length,writes);
 }finally{disposeServices(owner);}
});
test('a temporary root gap accepts explicit changes and later restores only owned attributes',()=>{
 const b=browser(),owner=isolatedTheme({window:b.window,preset:'forest'});try{
  b.document.documentElement=null;assert.doesNotThrow(()=>b.flush());owner.setMode('light');owner.setPreset('ember');setInterfaceScale(1.25,{window:b.window});const root=b.element();root.dataset.product='retained';root.style.setProperty('--product-value','retained');b.document.documentElement=root;b.flush();assert.equal(root.dataset.themePreset,'ember');assert.equal(root.dataset.theme,'light');assert.equal(root.dataset.interfaceScale,'1.25');assert.equal(root.dataset.product,'retained');assert.equal(root.style.getPropertyValue('--product-value'),'retained');
  const first=root;b.replace();b.flush();b.os(true);assert.equal(b.document.documentElement.dataset.themeEffective,'light');assert.equal(first.dataset.theme,'light');owner.syncMode('system');assert.equal(b.document.documentElement.dataset.themeEffective,'dark');
 }finally{disposeServices(owner);}
});
test('destroy disconnects root and media observers; already queued callbacks and later roots remain untouched',()=>{
 const b=browser(),owner=isolatedTheme({window:b.window,preset:'forest'});const observer=[...b.observers][0];assert.ok(observer);const callbacks=[...b.mediaListeners];b.replace();disposeServices(owner);const root=b.document.documentElement;observer.callback([]);callbacks.forEach(listener=>listener());owner.setMode('light');owner.setPreset('crimson');assert.deepEqual(root.dataset,{});assert.equal(b.observers.size,0);assert.equal(b.mediaListeners.size,0);assert.equal(owner.isDestroyed(),true);
});
test('without MutationObserver explicit theme changes still target the current root',()=>{
 const b=browser();delete b.window.MutationObserver;const owner=isolatedTheme({window:b.window,preset:'forest'});try{setInterfaceScale(1.5,{window:b.window});b.replace();owner.syncMode('light');assert.equal(b.document.documentElement.dataset.themePreset,'forest');assert.equal(b.document.documentElement.dataset.interfaceScale,'1.5');assert.equal(b.document.documentElement.dataset.theme,'light');}finally{disposeServices(owner);}
});

test('same-root attribute removal restores projection without changing logical state or retrying storage',()=>{
 const b=browser('system'),owner=isolatedTheme({window:b.window,preset:'forest'});let notices=0;owner.subscribe(()=>notices++);
 try{setInterfaceScale(1.5,{window:b.window});const root=b.document.documentElement,state=owner.getState(),reads=b.reads.length,writes=b.writes.length;root.dataset={product:'untouched'};root.style.setProperty('--interface-scale','');b.flush();assert.deepEqual(root.dataset,{product:'untouched',interfaceScale:'1.5',theme:'system',themeEffective:'light',themePreset:'forest'});assert.equal(root.style.getPropertyValue('--interface-scale'),'1.5');assert.equal(owner.getState(),state);assert.equal(notices,0);assert.equal(b.reads.length,reads);assert.equal(b.writes.length,writes);b.flush();assert.equal(owner.getState(),state);assert.equal(notices,0);
 }finally{disposeServices(owner);}
});
