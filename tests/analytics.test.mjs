import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnalytics, createGa4AnalyticsAdapter} from '../packages/runtime/dist/analytics.js';
const base = {enabled:true, environment:'production', product:'agready', version:'1.0.0', routes:{home:'/', task:'/tasks/:task'}, features:['search'], taskTypes:['research']};
function harness(overrides={}) {const sent=[];let starts=0,stops=0;const adapter={start:async()=>{starts++;return true;},stop:()=>{stops++;},send:e=>sent.push(e)}; const analytics=createAnalytics({...base,adapter,...overrides});return {analytics,sent,get starts(){return starts;},get stops(){return stops;}};}
test('default off, missing environment, preview/dev/test never start even with consent', async()=>{
 for(const options of [{enabled:undefined},{environment:undefined},{environment:'test'},{environment:'development'},{environment:'preview'}]) {const h=harness(options);assert.equal(await h.analytics.setConsent('granted'),false);assert.equal(h.starts,0);assert.equal(h.analytics.page('home'),false);}
});
test('no preconsent collection, explicit page/SPA dedupe, business results never inferred',async()=>{
 const h=harness();assert.equal(h.analytics.page('home'),false);assert.equal(h.analytics.task('succeeded','research'),false);
 assert.equal(await h.analytics.setConsent('granted'),true);assert.equal(await h.analytics.setConsent('granted'),true);assert.equal(h.starts,1);assert.equal(h.sent.length,0);
 assert.equal(h.analytics.page('home','nav1'),true);assert.equal(h.analytics.page('home','nav1'),false);assert.equal(h.analytics.page('task','nav2'),true);assert.equal(h.analytics.page('home','nav3'),true);
 assert.equal(h.analytics.feature('search'),true);assert.equal(h.sent.filter(e=>e.name.startsWith('task_')).length,0);
 assert.equal(h.analytics.task('submitted','research','request1'),true);assert.equal(h.analytics.task('submitted','research','request1'),false);assert.equal(h.analytics.task('succeeded','research','request1'),true);
 assert.ok(h.sent.every(e=>!JSON.stringify(e).includes('request1')));
});
test('static route/event catalogs drop arbitrary values; configuration is snapshotted',async()=>{
 const routes={home:'/',bad:'/secret?token=abc'},features=['search'];const h=harness({routes,features});routes.home='/changed';features.push('private');await h.analytics.setConsent('granted');
 assert.equal(h.analytics.page('bad'),false);assert.equal(h.analytics.page('/tasks/secret'),false);assert.equal(h.analytics.feature('private'),false);assert.equal(h.analytics.feature('prompt text'),false);assert.equal(h.analytics.task('finished','research'),false);assert.equal(h.analytics.task('failed','private'),false);
 h.analytics.page('home');assert.equal(h.sent[0].path,'/');assert.deepEqual(Object.keys(h.sent[0]).sort(),['environment','name','path','product','route','version']);assert.equal(Object.isFrozen(h.sent[0]),true);
});
test('revoke while async start pending cannot revive; events are not replayed',async()=>{
 let finish;const h=harness({adapter:{start:()=>new Promise(r=>finish=r),stop(){},send(){throw Error('must not send');}}});const pending=h.analytics.setConsent('granted');assert.equal(h.analytics.page('home'),false);await Promise.resolve();await h.analytics.setConsent('denied');finish(true);assert.equal(await pending,false);assert.equal(h.analytics.getState().ready,false);assert.equal(h.analytics.page('home'),false);
});
test('failed providers never interrupt caller, reacceptance and destroy are bounded',async()=>{
 const h=harness({adapter:{start:async()=>{throw Error('blocked');},stop(){throw Error('stop');},send(){throw Error('send');}}});assert.equal(await h.analytics.setConsent('granted'),false);h.analytics.destroy();h.analytics.destroy();assert.equal(await h.analytics.setConsent('granted'),false);
 const j=harness();await j.analytics.setConsent('granted');j.analytics.page('home');await j.analytics.setConsent('denied');assert.equal(j.analytics.page('home'),false);await j.analytics.setConsent('granted');assert.equal(j.analytics.page('home'),true);j.analytics.destroy();assert.equal(j.analytics.task('succeeded','research'),false);
 const k=harness({adapter:{start:async()=>true,stop(){},send(){throw Error('send');}}});await k.analytics.setConsent('granted');assert.equal(k.analytics.page('home'),false);assert.equal(k.analytics.getState().ready,false);
});
function fakeWindow(host='product.example') {const scripts=[];const win={location:{protocol:'https:',hostname:host,origin:`https://${host}`,href:`https://${host}/document/private?token=secret#private`},document:{title:'Secret document',createElement:()=>({}),querySelector:()=>null,head:{appendChild:s=>scripts.push(s)}}};return {win,scripts,commands:()=>win.dataLayer.map(x=>Array.from(x))};}
const gaOptions = {measurementId:'G-TEST123',allowedHosts:['product.example'],loadTimeoutMs:100};
const page={name:'page_view',product:'agready',version:'1',environment:'production',route:'home',path:'/'};
test('SSR/missing ID/disallowed host fail closed with no tag',async()=>{
 assert.equal(await createGa4AnalyticsAdapter({...gaOptions,window:undefined}).start(),false);
 for(const opt of [{measurementId:''},{measurementId:'UA-123'},{allowedHosts:[]}]){const f=fakeWindow();assert.equal(await createGa4AnalyticsAdapter({...gaOptions,...opt,window:f.win}).start(),false);assert.equal(f.scripts.length,0);}
});
test('GA delayed load, manual pageview, strict field projection and target routing',async()=>{
 const f=fakeWindow();const a=createGa4AnalyticsAdapter({...gaOptions,window:f.win,nonce:'test-nonce'});assert.equal(f.scripts.length,0);const p=a.start();assert.equal(f.scripts.length,1);assert.equal(f.scripts[0].nonce,'test-nonce');assert.equal(f.scripts[0].referrerPolicy,'no-referrer');assert.equal(f.win['ga-disable-G-TEST123'],true);a.send(page);assert.equal(f.commands().filter(c=>c[0]==='event').length,0);
 f.scripts[0].onload();assert.equal(await p,true);const cfg=f.commands().find(c=>c[0]==='config');assert.equal(cfg[2].send_page_view,false);assert.equal(cfg[2].page_referrer,'');assert.equal(cfg[2].page_title,'');assert.equal(f.commands().filter(c=>c[0]==='event').length,0);
 a.send({...page,prompt:'secret',email:'someone@example.test',url:f.win.location.href});const event=f.commands().find(c=>c[0]==='event');assert.equal(event[2].send_to,'G-TEST123');assert.equal(event[2].page_location,'https://product.example/');assert.equal(JSON.stringify(event).includes('secret'),false);
 a.stop();assert.equal(f.win['ga-disable-G-TEST123'],true);const count=f.commands().length;a.send(page);assert.equal(f.commands().length,count);assert.equal(await a.start(),true);assert.equal(f.scripts.length,1);assert.equal(f.commands().filter(c=>c[0]==='config').length,1);a.stop();
});
test('GA withdrawal during loading drops old grant and regrant uses one script',async()=>{
 const f=fakeWindow(),a=createGa4AnalyticsAdapter({...gaOptions,window:f.win});const first=a.start();a.stop();const second=a.start();f.scripts[0].onload();assert.equal(await first,false);assert.equal(await second,true);assert.equal(f.scripts.length,1);assert.equal(f.commands().filter(c=>c[0]==='config').length,1);a.stop();
});
test('GA refuses existing tag or second owner rather than overriding consent',async()=>{
 const f=fakeWindow();f.win.gtag=()=>{};assert.equal(await createGa4AnalyticsAdapter({...gaOptions,window:f.win}).start(),false);
 const g=fakeWindow();const a=createGa4AnalyticsAdapter({...gaOptions,window:g.win}),b=createGa4AnalyticsAdapter({...gaOptions,window:g.win});const p=a.start();assert.equal(await b.start(),false);g.scripts[0].onload();assert.equal(await p,true);a.stop();
});
test('blocked tag failure and timeout remain disabled without automatic retries',async()=>{
 const f=fakeWindow(),a=createGa4AnalyticsAdapter({...gaOptions,window:f.win});const p=a.start();f.scripts[0].onerror();assert.equal(await p,false);assert.equal(await a.start(),false);assert.equal(f.scripts.length,1);assert.equal(f.win['ga-disable-G-TEST123'],true);
 const g=fakeWindow(),b=createGa4AnalyticsAdapter({...gaOptions,window:g.win});assert.equal(await b.start(),false);assert.equal(g.win['ga-disable-G-TEST123'],true);assert.equal(await b.start(),false);
});

test('GA ignores cross-event optional fields including secret URL/title payloads',async()=>{
 const f=fakeWindow(),a=createGa4AnalyticsAdapter({...gaOptions,window:f.win});const p=a.start();f.scripts[0].onload();await p;
 a.send({...page,name:'feature_clicked',feature:'search',path:'/x?token=secret',route:'private title',taskType:'private task'});
 a.send({...page,feature:'private feature',taskType:'private task'});
 const events=f.commands().filter(c=>c[0]==='event');assert.equal(events.length,2);assert.equal(events[0][2].page_location,'https://product.example/');assert.equal(events[0][2].page_title,'');assert.equal(JSON.stringify(events).includes('private'),false);assert.equal(JSON.stringify(events).includes('secret'),false);a.stop();
});

test('synchronous provider start failure clears pending and permits explicit retry',async()=>{
 let starts=0;const h=harness({adapter:{start(){if(++starts===1)throw Error('sync');return Promise.resolve(true);},stop(){},send(){}}});
 assert.equal(await h.analytics.setConsent('granted'),false);assert.equal(await h.analytics.setConsent('granted'),true);assert.equal(starts,2);
});

test('immediate revoke before provider startup microtask performs no start',async()=>{
 const h=harness();const p=h.analytics.setConsent('granted');await h.analytics.setConsent('denied');assert.equal(await p,false);assert.equal(h.starts,0);
});
test('same-tick destroy never starts provider and rejects later grants',async()=>{
 const h=harness();const p=h.analytics.setConsent('granted');h.analytics.destroy();assert.equal(await p,false);assert.equal(h.starts,0);assert.equal(await h.analytics.setConsent('granted'),false);
});
