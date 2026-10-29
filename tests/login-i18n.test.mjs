import test from 'node:test';
import assert from 'node:assert/strict';
import {XuiServices} from '../packages/runtime/dist/services.js';
import {resolveLoginPageConfig} from '../packages/runtime/dist/auth.js';
import {createLoginViewController} from '../packages/runtime/dist/login-view.js';

function fixture(config={},initial={}){
 const entries=new Map(Object.entries(initial)),events=new EventTarget();let writes=0;
 const win={document:{documentElement:{lang:''}},localStorage:{getItem:key=>entries.get(key)??null,setItem:(key,value)=>{writes++;entries.set(key,value);}},addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events)};
 const services=new XuiServices({}, {window:win,config:{i18n:{enabled:true,...config}}});
 return {win,services,entries,get writes(){return writes;},language:()=>services.getI18nService(),storage(key,newValue,storageArea=win.localStorage){const event=new Event('storage');Object.defineProperties(event,{key:{value:key},newValue:{value:newValue},storageArea:{value:storageArea}});events.dispatchEvent(event);}};
}

test('enabled language owner restores a declared localStorage preference and writes only explicit changes',()=>{
 const f=fixture({}, {'xui.locale':'en'}),i18n=f.language();assert.equal(i18n.getState().locale,'en');assert.equal(f.win.document.documentElement.lang,'en');assert.equal(f.writes,0);
 let notifications=0;i18n.subscribe(()=>notifications++);assert.equal(i18n.setLocale('zh-CN'),true);assert.equal(f.entries.get('xui.locale'),'zh-CN');assert.equal(f.writes,1);assert.equal(i18n.setLocale('zh-CN'),true);assert.equal(i18n.setLocale('fr'),false);assert.equal(f.writes,1);assert.equal(notifications,1);f.services.dispose();
});

test('disabled/persist:false language settings ignore saved values and do not rewrite them',()=>{
 for(const config of [{enabled:false},{persist:false}]){const f=fixture(config,{'xui.locale':'en'}),i18n=f.language();assert.equal(i18n.getState().locale,'zh-CN');assert.equal(i18n.setLocale('en'),config.enabled!==false);assert.equal(f.writes,0);assert.equal(f.entries.get('xui.locale'),'en');f.services.dispose();}
});

test('custom key, invalid values and denied storage preserve configured/in-memory behavior',()=>{
 const custom=fixture({storageKey:'project.locale'},{'project.locale':'en','xui.locale':'fr'});assert.equal(custom.language().getState().locale,'en');custom.services.dispose();
 for(const value of ['fr','{"locale":"en"}','EN','']){const f=fixture({}, {'xui.locale':value});assert.equal(f.language().getState().locale,'zh-CN');assert.equal(f.entries.get('xui.locale'),value);f.services.dispose();}
 const f=fixture();Object.defineProperty(f.win,'localStorage',{get(){throw Error('storage denied');}});const i18n=f.language();assert.equal(i18n.getState().locale,'zh-CN');assert.equal(i18n.setLocale('en'),true);assert.equal(f.win.document.documentElement.lang,'en');f.services.dispose();
});

test('cross-tab language updates publish without echo and disposal removes observation',()=>{
 const f=fixture(),i18n=f.language();let changes=0;i18n.subscribe(()=>changes++);
 f.storage('xui.locale','en',{});assert.equal(changes,0);f.storage('unrelated','en');assert.equal(changes,0);f.storage('xui.locale','fr');assert.equal(changes,0);
 f.storage('xui.locale','en');assert.equal(i18n.getState().locale,'en');assert.equal(f.win.document.documentElement.lang,'en');assert.equal(f.writes,0);
 f.storage('xui.locale',null);assert.equal(i18n.getState().locale,'zh-CN');assert.equal(changes,2);f.services.dispose();f.storage('xui.locale','en');assert.equal(changes,2);assert.equal(f.win.document.documentElement.lang,'zh-CN');
});

test('public login resolver supplies Chinese/English defaults while keeping explicit host copy and branding',()=>{
 assert.equal(resolveLoginPageConfig({productName:'Host'},'zh-CN').labels.username,'用户名');assert.equal(resolveLoginPageConfig({productName:'Host'},'en-US').labels.username,'Username');
 assert.equal(resolveLoginPageConfig({productName:'Host',title:'Sign in'},'zh-CN').title,'登录');assert.equal(resolveLoginPageConfig({productName:'Host',title:'登录'},'en').title,'Sign in');
 const config=resolveLoginPageConfig({productName:'Host',title:'Custom title',description:'Host copy',labels:{username:'Account'},logo:{src:'/host.svg',alt:'Brand'}},'zh-CN');assert.equal(resolveLoginPageConfig({productName:'Host',title:'登录',labels:{submit:'A long custom action'}},'zh-CN').title,'登录');assert.equal(config.title,'Custom title');assert.equal(config.labels.username,'Account');assert.equal(config.description,'Host copy');assert.equal(config.logo.src,'/host.svg');
});

function authFixture(){let calls=0,finish;const state={status:'anonymous',user:null,busy:null,error:null};return {auth:{getState:()=>state,subscribe:()=>()=>{},login:()=>{calls++;return new Promise(resolve=>finish=resolve);}},get calls(){return calls;},finish:()=>finish?.()};}

test('default and injected view bindings translate required errors without changing auth or readers',async()=>{
 const f=fixture(),language=f.language(),a=authFixture();let reads=0,clears=0;
 const controller=createLoginViewController({auth:a.auth,config:{productName:'Host'}});
 const release=controller.bind({i18n:language,readCredentials:()=>{reads++;return {username:'',password:''};},clearPassword(){clears++;},focus(){},navigate(){}});
 assert.equal(controller.getState().config.labels.username,'用户名');await controller.submit();assert.equal(a.calls,0);assert.equal(controller.getState().errors.username,'请输入用户名。');const before={reads,clears};
 language.setLocale('en');assert.equal(controller.getState().config.title,'Sign in');assert.equal(controller.getState().errors.username,'Enter your username.');assert.deepEqual({reads,clears},before);assert.equal(a.calls,0);
 language.registerMessages('en',{'xui.login.username':'Account name'});assert.equal(controller.getState().config.labels.username,'Account name');
 release();language.setLocale('zh-CN');assert.equal(controller.getState().config.labels.username,'Account name');controller.destroy();f.services.dispose();
});

test('language changes during sign-in preserve the pending request and update only presentation',async()=>{
 const f=fixture(),a=authFixture(),controller=createLoginViewController({auth:a.auth,config:{productName:'Host'}});let reads=0,clears=0;
 controller.bind({i18n:f.language(),readCredentials:()=>{reads++;return {username:'demo',password:'SYNTHETIC_SECRET'};},clearPassword(){clears++;},focus(){},navigate(){}});
 const pending=controller.submit();await Promise.resolve();assert.equal(a.calls,1);assert.equal(controller.getState().operation,'login');const before={reads,clears};f.language().setLocale('en');assert.deepEqual({reads,clears},before);assert.equal(a.calls,1);assert.equal(controller.getState().operation,'login');assert.equal(controller.getState().config.labels.signingIn,'Signing in…');assert.doesNotMatch(JSON.stringify(controller.getState()),/SYNTHETIC_SECRET/);
 a.finish();await pending;controller.destroy();f.services.dispose();
});
