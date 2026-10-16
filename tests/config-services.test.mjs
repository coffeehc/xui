import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveConfig} from '../packages/runtime/dist/config.js';
import {XuiServices} from '../packages/runtime/dist/services.js';
import {bootstrap} from '../packages/runtime/dist/bootstrap.js';

test('packaged defaults and recursive partial overrides have one source, frozen isolated snapshots and array replacement',async()=>{
 const defaults=JSON.parse(await readFile('packages/runtime/dist/config.json','utf8'));
 assert.deepEqual(resolveConfig(),defaults);
 const overrides={theme:{scale:1.5},menu:{items:[{id:'tasks',label:'任务',href:'/tasks'}]},extensions:{argus:{windows:[30,60]}}};
 const config=resolveConfig(overrides);
 assert.equal(config.theme.mode,defaults.theme.mode);assert.equal(config.theme.scale,1.5);
 assert.deepEqual(config.http,defaults.http);assert.deepEqual(config.extensions.argus.windows,[30,60]);
 overrides.menu.items[0].label='mutated';assert.equal(config.menu.items[0].label,'任务');
 assert.throws(()=>{config.menu.items[0].label='mutated';},TypeError);
 assert.deepEqual(resolveConfig({menu:{items:[]}}).menu.items,[]);
 assert.equal(resolveConfig({theme:{mode:undefined}}).theme.mode,defaults.theme.mode);
});
test('configuration validation rejects misspellings, invalid language declarations, unsafe values and unsupported route modes',()=>{
 for(const value of [{theme:{sacle:1.5}},{theme:{scale:3}},{router:{mode:'hash'}},{router:{basePath:'/app/../escape'}},{i18n:{defaultLocale:'fr'}},{menu:{items:[{id:'a',label:'A'},{id:'a',label:'B'}]}},{menu:{items:[{id:'a',label:'A',href:'#/tasks'}]}},{auth:{protectedPaths:[123]}},{http:{timeoutMs:Infinity}},{extensions:{fn:()=>0}},JSON.parse('{"extensions":{"__proto__":{"polluted":true}}}')])assert.throws(()=>resolveConfig(value),TypeError);
 assert.equal({}.polluted,undefined);
 let called=0;assert.throws(()=>resolveConfig({get theme(){called++;return {};}}),TypeError);assert.equal(called,0);
});
test('isolated services share one language/menu owner and preserve disabled language semantics',()=>{
 const first=new XuiServices({}, {config:{i18n:{enabled:true,messages:{'zh-CN':{tasks:'研发团队的研究任务'},en:{tasks:'Research tasks',hello:'Hello {name}'}}},menu:{items:[{id:'tasks',label:'任务',labelKey:'tasks',href:'/tasks'}]}}});
 const second=new XuiServices();const language=first.getI18nService(),menu=first.getMenuService();
 assert.equal(first.getMenuService(),menu);assert.equal(first.getI18nService(),language);
 let notifications=0;const off=menu.subscribe(()=>notifications++);
 assert.equal(menu.getState().items[0].label,'研发团队的研究任务');assert.equal(language.setLocale('en'),true);
 assert.equal(menu.getState().items[0].label,'Research tasks');assert.equal(notifications,1);
 language.setLocale('en');assert.equal(notifications,1);assert.equal(language.setLocale('fr'),false);
 assert.equal(language.t('hello',{name:'Ada'}),'Hello Ada');assert.equal(language.t('unknown',{},'Fallback'),'Fallback');
 language.registerMessages('en',{tasks:'All tasks'});assert.equal(menu.getState().items[0].label,'All tasks');
 menu.setItems([{id:'settings',label:'设置'}]);assert.equal(menu.getState().items[0].id,'settings');
 assert.equal(second.getI18nService().setLocale('en'),false);assert.equal(second.getI18nService().getState().locale,'zh-CN');assert.deepEqual(second.getMenuService().getState().items,[]);
 off();const before=notifications;language.setLocale('zh-CN');assert.equal(notifications,before);
 first.dispose();assert.throws(()=>first.getMenuService(),/disposed/);second.dispose();
});
test('application services borrow explicit dependencies, do not begin IO and never dispose a borrowed owner',async()=>{
 let requests=0,destroyed=0;
 const http={request:async()=>{requests++;return {payload:new Blob(['ok']),status:200,headers:{contentDisposition:'attachment; filename="report.csv"',contentType:'text/csv',contentLength:'2'}};},destroy(){destroyed++;},resetUnauthorized(){}};
 const services=new XuiServices({http:{instance:http}});
 assert.equal(services.getHttpService(),http);assert.equal(services.getDownloadService(),services.getDownloadService());assert.equal(requests,0);
 const file=await services.getDownloadService().request('/report');assert.equal(requests,1);assert.equal(file.fileName,'report.csv');
 services.dispose();services.dispose();assert.equal(destroyed,0);
 assert.throws(()=>new XuiServices().getHttpService(),/not configured/);
 assert.throws(()=>bootstrap(),/browser Window/);
});
test('request-local route state rejects hash routing and keeps service origins isolated',()=>{
 const services=new XuiServices({route:{options:{basePath:'/console',window:null,initialURI:'/console/tasks?page=2'}}});
 const route=services.getRouteService();assert.equal(route.getState().uri,'/console/tasks?page=2');assert.equal(route.href('/team?q=x'),'/console/team?q=x');
 assert.equal(route.resolve('#/teams'),null);assert.equal(route.resolve('https://other.test/console'),null);assert.equal(route.resolve('/outside'),null);
 const request=href=>({id:'anchor',href,url:new URL(href,'https://xui.invalid/console/tasks?page=2').href,sameLocation:false,event:new Event('click')});
 assert.equal(route.navigation.canNavigate(request('#details')),false);
 assert.equal(route.navigation.canNavigate(request('/console/tasks?page=2#details')),false);
 assert.equal(route.navigation.canNavigate(request('/console/team#details')),true);
 assert.equal(route.navigate('/console/team'),false);assert.throws(()=>route.href('/../outside'),/escapes/);
 services.dispose();
});
