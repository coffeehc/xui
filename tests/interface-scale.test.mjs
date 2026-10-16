import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {setInterfaceScale} from '../packages/runtime/dist/theme.js';

function browser(stored,deny=false){
 const storage=new Map(stored===undefined?[]:[['ui.interface.scale',stored]]),properties=new Map(),dataset={},writes=[],changes=[];
 const root={dataset,style:{getPropertyValue:key=>properties.get(key)??'',setProperty:(key,value)=>{properties.set(key,value);changes.push([key,value]);}}};
 const document={documentElement:root,currentScript:{getAttribute:()=>null}};
 const window={document,matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),get sessionStorage(){if(deny)throw Error('Unavailable');return {getItem:key=>storage.get(key)??null,setItem:(key,value)=>{writes.push([key,value]);storage.set(key,value);}};},get localStorage(){throw Error('Never use localStorage');}};
 return {window,document,root,storage,properties,writes,changes};
}

test('public scale setter applies all supported sizes and persists only the current session preference',()=>{
 const b=browser();b.storage.set('ui.theme.mode','light');
 for(const scale of [1,1.25,1.5,2,1]){setInterfaceScale(scale,{window:b.window});assert.equal(b.root.dataset.interfaceScale,String(scale));assert.equal(b.properties.get('--interface-scale'),String(scale));assert.equal(b.storage.get('ui.interface.scale'),String(scale));}
 assert.equal(b.storage.get('ui.theme.mode'),'light');assert.equal(b.changes.length,5);
 setInterfaceScale(1,{window:b.window});assert.equal(b.changes.length,5);
});

test('invalid runtime scale rejects before DOM or storage mutation; import and valid calls are SSR safe',()=>{
 const b=browser();for(const value of [0,-1,100,1.1,Infinity,NaN,'1.25',null,undefined])assert.throws(()=>setInterfaceScale(value,{window:b.window}),TypeError);
 assert.equal(b.changes.length,0);assert.equal(b.writes.length,0);assert.deepEqual(b.root.dataset,{});
 assert.doesNotThrow(()=>setInterfaceScale(1.25));
});

test('unavailable storage still applies live scale',()=>{
 const b=browser(undefined,true);assert.doesNotThrow(()=>setInterfaceScale(2,{window:b.window}));assert.equal(b.root.dataset.interfaceScale,'2');assert.equal(b.properties.get('--interface-scale'),'2');
});

const script=await readFile('packages/runtime/dist/init.js','utf8');
const initialize=b=>runInNewContext(script,{window:b.window,document:b.document});
test('pre-paint initializer restores scale without creating a theme owner or writing storage',()=>{
 for(const value of ['1','1.25','1.5','2']){const b=browser(value),owner={isDestroyed:()=>false,getState:()=>({mode:'dark'})};b.window.xuiTheme=owner;initialize(b);assert.equal(b.window.xuiTheme,owner);assert.equal(b.root.dataset.theme,'dark');assert.equal(b.properties.get('--interface-scale'),value);assert.equal(b.root.dataset.interfaceScale,value);assert.equal(b.writes.length,0);initialize(b);assert.equal(b.changes.length,1);}
});
test('missing, malformed and unavailable saved scale apply the default without creating a theme owner or writing storage',()=>{
 for(const value of [undefined,'','0','100','1.1','1.25px',' 1.25 ','NaN']){const b=browser(value);initialize(b);assert.equal(b.root.dataset.interfaceScale,'1');assert.equal(b.properties.get('--interface-scale'),'1');assert.equal(b.window.xuiTheme,undefined);assert.equal(b.writes.length,0);}
 const denied=browser(undefined,true);assert.doesNotThrow(()=>initialize(denied));assert.equal(denied.root.dataset.interfaceScale,'1');assert.equal(denied.properties.get('--interface-scale'),'1');assert.equal(denied.window.xuiTheme,undefined);assert.equal(denied.writes.length,0);
});
test('reload restores a saved scale while a fresh session remains at the default',()=>{
 const first=browser();setInterfaceScale(1.5,{window:first.window});const reload=browser(first.storage.get('ui.interface.scale'));initialize(reload);assert.equal(reload.root.dataset.interfaceScale,'1.5');const fresh=browser();initialize(fresh);assert.equal(fresh.root.dataset.interfaceScale,'1');assert.equal(reload.window.xuiTheme,undefined);assert.equal(fresh.window.xuiTheme,undefined);
});
