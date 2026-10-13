import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
test.use({launchOptions:{chromiumSandbox:true,args:[]}});
let bundle;
test.beforeAll(async()=>{const result=await build({entryPoints:['tests/fixtures/auth-atomic-browser.mjs'],bundle:true,write:false,format:'iife',globalName:'AuthAtomic',platform:'browser',metafile:true});expect(Object.keys(result.metafile.inputs).filter(path=>path.includes('packages/runtime/')).every(path=>path.includes('/dist/'))).toBe(true);bundle=result.outputFiles[0].text;});
const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
async function open(page,scope){await page.goto('http://auth-intranet.test/');await page.addScriptTag({content:bundle});await page.evaluate(async scope=>{window.fixture=await AuthAtomic.install(scope);},scope);}
async function intranet(context){await context.route('http://auth-intranet.test/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Auth atomic intranet fixture</title>'}));}
test('normal first HTTP login commits and clears its exact IDB reservation without Web Locks',async({context})=>{
 await intranet(context);let sends=0;await context.exposeBinding('authDispatch',()=>{sends++;return 'success';});const page=await context.newPage();await open(page,'normal');expect(await page.evaluate(()=>({secure:isSecureContext,locks:!!navigator.locks,idb:!!indexedDB}))).toEqual({secure:false,locks:false,idb:true});expect(await page.evaluate(()=>fixture.start())).toBe(true);expect(sends).toBe(1);expect(await page.evaluate(()=>fixture.read())).toBeNull();expect(await page.evaluate(()=>fixture.auth.getState().status)).toBe('authenticated');
});
test('two HTTP tabs cannot overwrite unknown login before or after fetch settles or reload',async({context})=>{
 await intranet(context);let sends=0;const response=deferred();await context.exposeBinding('authDispatch',async()=>{sends++;return response.promise;});const pages=[await context.newPage(),await context.newPage()];await Promise.all(pages.map(page=>open(page,'race')));for(const page of pages)await page.evaluate(()=>{window.attempt=fixture.start();});await expect.poll(()=>sends).toBe(1);const original=await pages[0].evaluate(()=>fixture.read());expect(original).not.toBeNull();response.resolve('unknown');expect(await Promise.all(pages.map(page=>page.evaluate(()=>window.attempt)))).toEqual([false,false]);
 for(const page of pages){expect(await page.evaluate(()=>fixture.read())).toBe(original);expect(await page.evaluate(()=>fixture.start())).toBe(false);await open(page,'race');expect(await page.evaluate(()=>fixture.start())).toBe(false);expect(await page.evaluate(()=>fixture.read())).toBe(original);}expect(sends).toBe(1);expect(original).not.toMatch(/password|token|fixture|FAKE/);
});
test('closing a sent HTTP login owner does not free its IDB reservation for a new tab',async({context})=>{
 await intranet(context);let sends=0;const response=deferred();await context.exposeBinding('authDispatch',async()=>{sends++;return response.promise;});const first=await context.newPage();await open(first,'close');await first.evaluate(()=>{window.attempt=fixture.start();});await expect.poll(()=>sends).toBe(1);const original=await first.evaluate(()=>fixture.read());await first.close();const second=await context.newPage();await open(second,'close');expect(await second.evaluate(()=>fixture.start())).toBe(false);expect(await second.evaluate(()=>fixture.read())).toBe(original);response.resolve('success');expect(sends).toBe(1);
});
