import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {resolveConfig} from '../packages/runtime/dist/config.js';
import {XuiServices} from '../packages/runtime/dist/services.js';
import {isolatedTheme,disposeServices} from './helpers/runtime-services.mjs';

function browser(saved='system'){
 const writes=[],reads=[],listeners=new Set(),styles=new Map();
 const media={matches:false,addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
 const document={documentElement:{dataset:{},style:{getPropertyValue:k=>styles.get(k)??'',setProperty:(k,v)=>styles.set(k,v)}},currentScript:{getAttribute:()=>null}};
 const window={document,matchMedia:()=>media,sessionStorage:{getItem:key=>{reads.push(key);return key==='ui.theme.mode'?saved:null;},setItem:(...args)=>writes.push(args)}};
 return {window,document,media,listeners,writes,reads,os(dark){media.matches=dark;listeners.forEach(fn=>fn());}};
}
test('project presets use a validated frozen configuration, independent from brightness defaults',()=>{
 assert.equal(resolveConfig().theme.preset,'violet');
 for(const preset of ['violet','ember','forest','crimson','cobalt','precision']){
  const config=resolveConfig({theme:{preset}});assert.equal(config.theme.preset,preset);assert.equal(config.theme.mode,'dark');assert(Object.isFrozen(config.theme));
 }
 assert.equal(resolveConfig({theme:{mode:'light'}}).theme.preset,'violet');
 for(const preset of ['red','',null,4])assert.throws(()=>resolveConfig({theme:{preset}}),TypeError);
});
test('one document owner changes palette without persisting, changing brightness or duplicate notifications',()=>{
 const b=browser(),owner=isolatedTheme({window:b.window,preset:'forest'});let notifications=0;owner.subscribe(()=>notifications++);
 assert.deepEqual(owner.getState(),{preset:'forest',mode:'system',effective:'light'});
 owner.setPreset('crimson');owner.setPreset('crimson');assert.equal(notifications,1);assert.equal(b.document.documentElement.dataset.themePreset,'crimson');assert.equal(b.writes.length,0);assert.deepEqual(b.reads,['ui.theme.mode']);
 b.os(true);assert.deepEqual(owner.getState(),{preset:'crimson',mode:'system',effective:'dark'});assert.equal(notifications,2);
 owner.setMode('light');assert.deepEqual(b.writes,[['ui.theme.mode','light']]);assert.equal(owner.getState().preset,'crimson');
 owner.setPreset('precision');assert.equal(owner.getState().mode,'light');assert.equal(b.writes.length,1);
 owner.setPreset('invalid');assert.equal(owner.getState().preset,'violet');assert(Object.isFrozen(owner.getState()));
 disposeServices(owner);const count=notifications;owner.setPreset('ember');assert.equal(notifications,count);assert.equal(b.listeners.size,0);
});
test('controlled brightness and isolated project palettes do not request or affect each other',()=>{
 const a=browser(),b=browser(),requests=[];
 const first=isolatedTheme({window:a.window,preset:'ember',mode:'light',onModeChange:mode=>requests.push(mode)}),second=isolatedTheme({window:b.window,preset:'cobalt',persist:false});
 first.setPreset('forest');assert.deepEqual(requests,[]);assert.equal(second.getState().preset,'cobalt');assert.equal(first.getState().mode,'light');assert.equal(a.reads.length+a.writes.length,0);
 first.setMode('dark');assert.deepEqual(requests,['dark']);assert.equal(first.getState().mode,'light');first.syncMode('dark');assert.equal(first.getState().preset,'forest');
 disposeServices(first,second);
});
test('configuration reaches the lazy shared owner; initialization is pre-paint only and an existing owner wins',async()=>{
 const script=await readFile('packages/runtime/dist/init.js','utf8');
 for(const preset of ['forest','crimson','cobalt','precision','violet','ember']){
  const b=browser('light');b.window.xuiThemeOptions={preset,defaultMode:'dark'};
  const ctx={window:b.window,document:b.document};runInNewContext(script,ctx);
  assert.equal(b.document.documentElement.dataset.themePreset,preset);assert.equal(b.document.documentElement.dataset.themeEffective,'light');assert.equal(b.window.xuiTheme,undefined);assert.equal(b.listeners.size,0);
  const services=new XuiServices({}, {window:b.window,config:{theme:{preset}}}),owner=services.getThemeService(b.window);
  assert.equal(owner.getState().preset,preset);assert.equal(owner.getState().mode,'light');owner.setPreset('ember');b.window.xuiThemeOptions.preset='cobalt';runInNewContext(script,ctx);assert.equal(b.document.documentElement.dataset.themePreset,'ember');assert.equal(b.window.xuiTheme,owner);services.dispose();
 }
 const b=browser();b.window.xuiThemeOptions={preset:'invalid'};runInNewContext(script,{window:b.window,document:b.document});assert.equal(b.document.documentElement.dataset.themePreset,'violet');
 const isolated=new XuiServices({}, {window:b.window,config:{theme:{preset:'crimson'}}});delete b.window.xuiThemeOptions;assert.equal(isolated.getThemeService(b.window).getState().preset,'crimson');isolated.dispose();
});
