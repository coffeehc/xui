import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
// Exercise real isolation with the normal browser sandbox enabled.
// Hosted Ubuntu ships a stable Chrome AppArmor profile; preserve its normal sandbox.
test.use({...(process.env.CI?{channel:'chrome'}:{}),launchOptions:{chromiumSandbox:true,args:[]}});
let bundle;
test.beforeAll(async()=>{
 const result=await build({entryPoints:['tests/fixtures/api-key-atomic-browser.mjs'],bundle:true,write:false,format:'iife',globalName:'KeyAtomic',platform:'browser',target:'es2022',metafile:true});
 expect(Object.keys(result.metafile.inputs).filter(path=>path.includes('packages/runtime/')).every(path=>path.includes('/dist/'))).toBe(true);bundle=result.outputFiles[0].text;
});
const defer=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
async function open(page,scope,options){await page.goto('http://key-intranet.test/');await page.addScriptTag({content:bundle});await page.evaluate(async({scope,options})=>{window.fixture=await KeyAtomic.install(scope,options);},{scope,options});}
async function intranet(context){await context.route('http://key-intranet.test/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Intranet atomic recovery test</title>'}));}

test('non-secure HTTP same-origin tabs preserve the first distinct operation through unknown outcome and reload',async({context})=>{
 await intranet(context);const prepared=[],dispatches=[],preparation=defer(),response=defer();
 await context.exposeBinding('keyPrepared',async(_source,descriptor)=>{prepared.push(descriptor);await preparation.promise;});
 await context.exposeBinding('keyDispatch',async(_source,descriptor)=>{dispatches.push(descriptor);await response.promise;});
 const pages=[await context.newPage(),await context.newPage()],scope='http://key-intranet.test|trusted-actor|tenant-race';await Promise.all(pages.map(page=>open(page,scope,{barrier:true})));
 for(const page of pages){expect(await page.evaluate(()=>({secure:isSecureContext,locks:!!navigator.locks,randomUUID:typeof crypto.randomUUID,idb:!!indexedDB}))).toEqual({secure:false,locks:false,randomUUID:'undefined',idb:true});await page.evaluate(()=>{window.attempt=fixture.start();});}
 await expect.poll(()=>prepared.length).toBe(2);expect(prepared[0].operation_id).not.toBe(prepared[1].operation_id);preparation.resolve();await expect.poll(()=>dispatches.length).toBe(1);
 const raw=await pages[0].evaluate(()=>fixture.read()),original=JSON.parse(raw).descriptor;expect(original.operation_id).toBe(dispatches[0].operation_id);response.resolve();await Promise.all(pages.map(page=>page.evaluate(()=>window.attempt)));
 for(const page of pages){expect(await page.evaluate(()=>fixture.guard.getState().descriptor)).toEqual(original);expect(await page.evaluate(()=>fixture.read())).toBe(raw);await page.reload();await page.addScriptTag({content:bundle});await page.evaluate(async scope=>{window.fixture=await KeyAtomic.install(scope);},scope);expect(await page.evaluate(()=>fixture.guard.getState().descriptor)).toEqual(original);await page.evaluate(()=>fixture.start());}
 expect(dispatches).toHaveLength(1);await pages[0].evaluate(()=>fixture.manager.recoverUncertainWrite());expect(await pages[0].evaluate(()=>fixture.read())).toBe(raw);expect(dispatches).toHaveLength(1);
 await pages[0].evaluate(async()=>{fixture.setReceipt('applied');await fixture.manager.recoverUncertainWrite();});expect(await pages[0].evaluate(()=>fixture.read())).toBeNull();expect(await pages[0].evaluate(()=>fixture.manager.readSecret())).toBeNull();
 for(const forbidden of ['Private draft','FAKE_TRANSIENT_VALUE','password','secret','token'])expect(raw).not.toContain(forbidden);
});

test('closing an in-flight HTTP tab cannot release its durable operation or authorize a replacement',async({context})=>{
 await intranet(context);const dispatches=[],response=defer();await context.exposeBinding('keyDispatch',async(_source,descriptor)=>{dispatches.push(descriptor);await response.promise;});
 const first=await context.newPage(),scope='http://key-intranet.test|trusted-actor|tenant-close';await open(first,scope);await first.evaluate(()=>{window.attempt=fixture.start();});await expect.poll(()=>dispatches.length).toBe(1);const raw=await first.evaluate(()=>fixture.read());await first.close();
 const second=await context.newPage();await open(second,scope);expect(await second.evaluate(()=>fixture.read())).toBe(raw);await second.evaluate(()=>fixture.start());response.resolve();expect(dispatches).toHaveLength(1);expect(await second.evaluate(()=>fixture.guard.getState().descriptor.operation_id)).toBe(dispatches[0].operation_id);
});

test('IndexedDB reserve and conditional clear are real cross-page transactions; normal intranet create succeeds',async({context})=>{
 await intranet(context);let sends=0;await context.exposeBinding('keyDispatch',async()=>{sends++;});const pages=[await context.newPage(),await context.newPage()];await Promise.all(pages.map(page=>open(page,'http://key-intranet.test|trusted-actor|normal',{success:true})));
 const values=await Promise.all(pages.map((page,index)=>page.evaluate(async index=>Promise.all(Array.from({length:12},(_,n)=>KeyAtomic.createIndexedDBOperationStore().compareExchange('test.atomic',null,`attempt:${index}:${n}`))),index)));
 const results=values.flat(),winner=results.find(value=>value.exchanged);expect(results.filter(value=>value.exchanged)).toHaveLength(1);expect(results.every(value=>value.current===winner.current)).toBe(true);
 expect(await pages[1].evaluate(()=>KeyAtomic.createIndexedDBOperationStore().compareExchange('test.atomic','wrong-attempt',null))).toEqual({exchanged:false,current:winner.current});
 await pages[0].evaluate(()=>fixture.start());expect(sends).toBe(1);expect(await pages[0].evaluate(()=>fixture.manager.readSecret())).toBe('FAKE_TRANSIENT_VALUE');expect(await pages[0].evaluate(()=>fixture.read())).toBeNull();await pages[0].evaluate(()=>fixture.manager.close());expect(await pages[0].evaluate(()=>fixture.manager.readSecret())).toBeNull();
});

test('custom rotation identity survives real two-tab CAS and reload; ordinary collection creates remain repeatable',async({context})=>{
 await intranet(context);const prepared=[],dispatches=[],preparation=defer();await context.exposeBinding('keyPrepared',async(_source,descriptor)=>{prepared.push(descriptor);await preparation.promise;});await context.exposeBinding('keyDispatch',async(_source,descriptor)=>{dispatches.push(descriptor);});
 const scope='http://key-intranet.test|trusted-actor|custom',pages=[await context.newPage(),await context.newPage()];
 for(const page of pages){await page.goto('http://key-intranet.test/');await page.addScriptTag({content:bundle});await page.evaluate(async scope=>{window.fixture=await KeyAtomic.installCustom(scope,{barrier:true});},scope);await page.evaluate(()=>{window.attempt=fixture.start();});}
 await expect.poll(()=>prepared.length).toBe(2);preparation.resolve();await Promise.all(pages.map(page=>page.evaluate(()=>window.attempt)));expect(dispatches).toHaveLength(1);const original=dispatches[0];expect(original.action).toBe('key-rotate');expect(original.expected_version).toBe('0');expect(original.target_id).toBe('a1');
 for(const page of pages){await page.reload();await page.addScriptTag({content:bundle});await page.evaluate(async scope=>{window.fixture=await KeyAtomic.installCustom(scope);},scope);expect(await page.evaluate(()=>fixture.guard.getState().descriptor)).toEqual(original);await page.evaluate(()=>fixture.start());}expect(dispatches).toHaveLength(1);
 await pages[0].evaluate(async()=>{await fixture.manager.recoverUncertainWrite();});expect(await pages[0].evaluate(()=>fixture.read())).not.toBeNull();await pages[0].evaluate(async()=>{fixture.setReceipt('applied');await fixture.manager.recoverUncertainWrite();});expect(await pages[0].evaluate(()=>fixture.read())).toBeNull();
 await pages[0].evaluate(async scope=>{fixture.manager.destroy();window.fixture=await KeyAtomic.installCustom(scope,{success:true});for(let i=0;i<3;i++){await fixture.start();fixture.manager.close();}},scope);expect(dispatches).toHaveLength(4);expect(await pages[0].evaluate(()=>fixture.read())).toBeNull();
});
