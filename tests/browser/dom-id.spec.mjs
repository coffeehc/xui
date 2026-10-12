import {test,expect,chromium} from '@playwright/test';
import {build} from 'esbuild';

let bundleA,bundleB;
test.beforeAll(async()=>{
  const compile=async globalName=>{
    const result=await build({entryPoints:['tests/fixtures/dom-id-contract.mjs'],bundle:true,write:false,format:'iife',globalName,platform:'browser',target:'es2022',metafile:true});
    const runtimeInputs=Object.keys(result.metafile.inputs).filter(path=>path.includes('packages/runtime/'));
    expect(runtimeInputs.length).toBeGreaterThan(5);
    expect(runtimeInputs.every(path=>path.includes('/dist/'))).toBe(true);
    return result.outputFiles[0].text;
  };
  // Independent bundles intentionally contain separate allocator module instances.
  [bundleA,bundleB]=await Promise.all([compile('XuiDomIdA'),compile('XuiDomIdB')]);
});

async function openFixture(page,mode,url='/menu-vanilla/destination.html'){
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  if(mode)await page.addInitScript(value=>{
    if(value==='missing-crypto')Object.defineProperty(globalThis,'crypto',{configurable:true,value:undefined});
    else if(value==='blocked-crypto')Object.defineProperty(globalThis,'crypto',{configurable:true,get(){throw Error('Web Crypto must not be consulted for DOM IDs');}});
    else Object.defineProperty(globalThis.crypto,'randomUUID',{configurable:true,value:undefined});
  },mode);
  const response=await page.goto(url);expect(response.status()).toBe(200);
  await page.evaluate(()=>document.body.replaceChildren());
  await page.addScriptTag({content:bundleA});
  return errors;
}

function assertMount(result){
  expect(result.withForm.failures).toEqual([]);
  expect(result.withForm.ids.length).toBeGreaterThan(40);
  expect(new Set(result.withForm.ids).size).toBe(result.withForm.ids.length);
  expect(result.withForm.cases).toEqual(['navigation','layout','command','disclosure','popup','tooltip','toast','login','api-key','structured-log','business-log']);
  for(const attribute of ['aria-controls','aria-labelledby','aria-describedby','aria-activedescendant','for','form','skip-link'])expect(result.withForm.counts[attribute],attribute).toBeGreaterThan(0);
  expect(result.toastIds[0]).not.toBe(result.toastIds[1]);
  expect(result.toastIds.every(id=>typeof id==='string'&&id.length>0)).toBe(true);
  expect(result.explicitId).toBe('host-notification');
  expect(result.toastCountBefore).toBe(2);
  expect(result.toastCountAfterClose).toBe(1);
  expect(result.toastCountAfterReplace).toBe(2);
  expect(result.disclosureWorks).toBe(true);
  expect(result.formOpen).toBe(true);
}

async function exerciseRepeatedMounts(page){
  for(let iteration=0;iteration<3;iteration++){
    const result=await page.evaluate(async iteration=>{
      window.domIdSeen??=[];
      window.domIdHosts??=Array.from({length:2},()=>{const root=document.createElement('div');document.body.append(root);return root;});
      window.domIdOwners=await Promise.all(window.domIdHosts.map(root=>XuiDomIdA.mount(root)));
      const results=window.domIdOwners.map(owner=>({withForm:owner.withForm,toastIds:owner.toastIds,explicitId:owner.explicitId,toastCountBefore:owner.toastCountBefore,toastCountAfterClose:owner.toastCountAfterClose,toastCountAfterReplace:owner.toastCountAfterReplace,disclosureWorks:owner.disclosureWorks,formOpen:owner.formOpen}));
      const fresh=results.flatMap(value=>[...value.withForm.ids,...value.toastIds]);
      const repeated=fresh.filter(id=>window.domIdSeen.includes(id));window.domIdSeen.push(...fresh);
      return {results,repeated,all:XuiDomIdA.inspect(document.body),iteration};
    },iteration);
    result.results.forEach(assertMount);
    expect(result.repeated).toEqual([]);
    expect(result.all.failures).toEqual([]);
    const logins=page.locator('[data-dom-id-case="login"]');
    await expect(logins).toHaveCount(2);
    for(let index=0;index<2;index++){
      const login=logins.nth(index),submit=login.locator('button[type="submit"]');
      await expect(submit).toBeEnabled();
      await login.locator('input[name="username"]').fill(`demo-${iteration}-${index}`);
      await login.locator('input[name="password"]').fill('SYNTHETIC_DOM_ID_TEST_PASSWORD');
      await submit.click();
      await expect.poll(()=>page.evaluate(index=>window.domIdOwners[index].getLoginDestinations(),index)).toEqual([{userId:'demo:user',path:'/workspace'}]);
    }
    const desktop=await page.evaluate(()=>window.domIdOwners.map(owner=>owner.layoutTarget()));
    expect(desktop.every(target=>target.belongs&&target.tag==='ASIDE')).toBe(true);
    await page.setViewportSize({width:390,height:720});
    await expect.poll(()=>page.evaluate(()=>window.domIdOwners.map(owner=>owner.layoutTarget().tag))).toEqual(['DIALOG','DIALOG']);
    expect((await page.evaluate(()=>XuiDomIdA.inspect(document.body))).failures).toEqual([]);
    await page.setViewportSize({width:1280,height:800});
    await expect.poll(()=>page.evaluate(()=>window.domIdOwners.map(owner=>owner.layoutTarget().tag))).toEqual(['ASIDE','ASIDE']);
    await page.evaluate(()=>window.domIdOwners.forEach(owner=>owner.destroy()));
    expect(await page.locator('[data-dom-id-case]').count()).toBe(0);
  }
}

for(const mode of ['missing-randomUUID','missing-crypto','blocked-crypto'])test(`built runtime preserves every generated DOM relationship with ${mode}`,async({page})=>{
  const errors=await openFixture(page,mode);
  expect(await page.evaluate(()=>isSecureContext)).toBe(true);
  if(mode!=='blocked-crypto')expect(await page.evaluate(()=>typeof globalThis.crypto?.randomUUID)).toBe('undefined');
  await exerciseRepeatedMounts(page);
  expect(errors).toEqual([]);
});

test('independently bundled runtimes reserve unique IDs before insertion and avoid host ID namespaces',async({page})=>{
  const errors=await openFixture(page,'missing-crypto');
  await page.addScriptTag({content:bundleB});
  const result=await page.evaluate(()=>{
    // Reserve both a complete ID and a derived namespace before either bundle mounts.
    for(const id of ['xui-command-1','xui-command-2-0']){const existing=document.createElement('div');existing.id=id;document.body.append(existing);}
    const first=XuiDomIdA.detachedCommand(),second=XuiDomIdB.detachedCommand();
    const detached=[first,second].every(owner=>!owner.root.isConnected);
    const controls=[first,second].map(owner=>owner.controller.getInput().getAttribute('aria-controls'));
    document.body.append(first.root,second.root);
    for(const owner of [first,second])owner.controller.getInput().dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
    const snapshot=XuiDomIdA.inspect(document.body);
    for(const owner of [first,second])owner.controller.destroy();
    return {detached,controls,snapshot};
  });
  expect(result.detached).toBe(true);
  expect(new Set(result.controls).size).toBe(2);
  expect(result.controls).not.toContain('xui-command-1');
  expect(result.controls).not.toContain('xui-command-2');
  expect(result.snapshot.failures).toEqual([]);
  expect(result.snapshot.counts['aria-activedescendant']).toBe(2);
  expect(errors).toEqual([]);
});

test('built runtime works on an actual non-secure HTTP origin without a randomUUID polyfill',async({},testInfo)=>{
  const inherited=testInfo.project.use.launchOptions??{};
  const browser=await chromium.launch({...inherited,args:[...(inherited.args??[]),'--host-resolver-rules=MAP xui-dom-id.test 127.0.0.1','--no-proxy-server']});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:800}});
    const errors=await openFixture(page,undefined,'http://xui-dom-id.test:4173/menu-vanilla/destination.html');
    expect(await page.evaluate(()=>({secure:isSecureContext,uuid:typeof crypto.randomUUID,origin:location.origin}))).toEqual({secure:false,uuid:'undefined',origin:'http://xui-dom-id.test:4173'});
    await exerciseRepeatedMounts(page);
    expect(errors).toEqual([]);
    await testInfo.attach('non-secure-origin.json',{body:JSON.stringify(await page.evaluate(()=>({origin:location.origin,isSecureContext,randomUUID:typeof crypto.randomUUID}))),contentType:'application/json'});
  }finally{await browser.close();}
});

test('automatic toast identity preserves an existing explicit ID and explicit replacement still deduplicates',async({page})=>{
  const errors=await openFixture(page,'missing-crypto');
  const result=await page.evaluate(()=>{
    const viewport=document.createElement('div');document.body.append(viewport);
    const controller=XuiDomIdA.createToastController(viewport);
    const explicit=controller.add({id:'xui-toast-1',title:'Host notification'});
    const automatic=controller.add({title:'Automatic notification'});
    const before=[...viewport.querySelectorAll('strong')].map(node=>node.textContent);
    controller.add({id:explicit,title:'Updated host notification'});
    const after=[...viewport.querySelectorAll('strong')].map(node=>node.textContent);
    controller.close(automatic);
    const remaining=[...viewport.querySelectorAll('strong')].map(node=>node.textContent);
    controller.destroy();
    return {explicit,automatic,before,after,remaining,countAfterDestroy:viewport.children.length};
  });
  expect(result.explicit).toBe('xui-toast-1');
  expect(result.automatic).not.toBe(result.explicit);
  expect(result.before).toEqual(['Host notification','Automatic notification']);
  expect(result.after).toEqual(['Automatic notification','Updated host notification']);
  expect(result.remaining).toEqual(['Updated host notification']);
  expect(result.countAfterDestroy).toBe(0);
  expect(errors).toEqual([]);
});
