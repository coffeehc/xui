import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
let production,development,css;
test.beforeAll(async()=>{
 const latest=JSON.parse(await readFile('.consumers/latest.json','utf8')),cwd=resolve(process.env.XUI_CONSUMER??resolve(latest.runDirectory,'react'));
 for(const mode of ['production','development']){
  const result=await build({preserveSymlinks:true,entryPoints:[`${cwd}/controlled-render.tsx`],bundle:true,write:false,outdir:resolve('.artifacts/controlled-render-bundle'),metafile:true,format:'iife',platform:'browser',jsx:'automatic',target:'es2022',define:{'process.env.NODE_ENV':JSON.stringify(mode)}});
  expect(Object.keys(result.metafile.inputs).every(file=>resolve(file).startsWith(cwd+'/'))).toBe(true);
  const js=result.outputFiles.find(file=>file.path.endsWith('.js')).text;css=result.outputFiles.find(file=>file.path.endsWith('.css')).text;
  if(mode==='production')production=js;else development=js;
 }
});
async function open(page,strict=false){
 await page.route('**/controlled-render-contract*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html class="xui" lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>'}));
 await page.goto('/controlled-render-contract'+(strict?'?strict':''));await page.addStyleTag({content:css});await page.addScriptTag({content:strict?development:production});await expect(page.getByRole('button',{name:'来源依据',exact:true})).toHaveAttribute('aria-expanded','false');
}
async function effects(page){return page.evaluate(()=>window.controlledRender.effects);}
for(const strict of [false,true])test(`Disclosure parent passive effect can focus immediately ${strict?'StrictMode':'production'}`,async({page},info)=>{
 await open(page,strict);await page.getByRole('button',{name:'打开来源引用',exact:true}).click();const record=page.locator('article');await expect(record).toBeVisible();
 const observed=(await effects(page)).filter(item=>item.expected.open);expect(observed.filter(item=>item.phase==='layout').length).toBeGreaterThan(0);expect(observed.filter(item=>item.phase==='passive').length).toBeGreaterThan(0);await info.attach('owner-effects.json',{body:JSON.stringify(observed),contentType:'application/json'});
 expect(observed.filter(item=>item.phase==='layout').every(item=>!item.hidden)).toBe(true);expect(observed.filter(item=>item.phase==='passive').every(item=>!item.hidden&&item.focused)).toBe(true);await expect(record).toBeFocused();
 await page.evaluate(()=>window.controlledRender.update({open:false}));await expect(record).not.toBeVisible();await expect(page.getByRole('button',{name:'来源依据',exact:true})).toBeFocused();expect((await effects(page)).filter(item=>!item.expected.open).every(item=>item.hidden)).toBe(true);
 await page.evaluate(()=>window.controlledRender.update({open:true}));await expect(record).toBeFocused();await page.getByRole('button',{name:'组件外部焦点',exact:true}).focus();await page.evaluate(()=>window.controlledRender.update({open:false}));await expect(page.getByRole('button',{name:'组件外部焦点',exact:true})).toBeFocused();
});
for(const strict of [false,true])test(`controlled values match props in owner effects ${strict?'StrictMode':'production'}`,async({page},info)=>{
 await open(page,strict);await page.evaluate(()=>window.controlledRender.update({tab:'b',selected:'two',input:'updated'}));await expect(page.getByRole('tab',{name:'乙视图'})).toHaveAttribute('aria-selected','true');
 const observed=(await effects(page)).filter(item=>item.expected.tab==='b');await info.attach('value-effects.json',{body:JSON.stringify(observed),contentType:'application/json'});expect(observed.length).toBeGreaterThan(0);for(const item of observed){expect(item.tab).toBe('乙视图');expect(item.serialized).toBe('two');expect(item.input).toBe('updated');}
 await page.evaluate(()=>window.controlledRender.update({tab:'a',selected:'one',input:''}));await expect(page.getByRole('tab',{name:'甲视图'})).toHaveAttribute('aria-selected','true');const latest=(await effects(page)).at(-1);expect(latest.tab).toBe('甲视图');expect(latest.serialized).toBe('one');expect(latest.input).toBe('');await expect(page.locator('[data-test=selected-value]')).toHaveText('One');
});
test('rejected controlled intents, uncontrolled toggles and injected Controller lifetime remain independent',async({page})=>{
 await open(page,true);await page.evaluate(()=>window.controlledRender.setReject(true));const trigger=page.getByRole('button',{name:'来源依据',exact:true});await trigger.click();await expect(trigger).toHaveAttribute('aria-expanded','false');expect(await page.evaluate(()=>window.controlledRender.events.filter(event=>event.kind==='open'))).toEqual([{kind:'open',value:true}]);
 await page.getByRole('tab',{name:'乙视图'}).click();await expect(page.getByRole('tab',{name:'甲视图'})).toHaveAttribute('aria-selected','true');
 const uncontrolled=page.getByRole('button',{name:'非受控来源',exact:true});await expect(uncontrolled).toHaveAttribute('aria-expanded','true');await uncontrolled.press('Space');await expect(uncontrolled).toHaveAttribute('aria-expanded','false');
 const injected=page.getByRole('button',{name:'独立 Controller 来源',exact:true});await injected.click();await expect(injected).toHaveAttribute('aria-expanded','true');await page.evaluate(()=>window.controlledRender.setMounted(false));await expect(injected).toHaveCount(0);await page.evaluate(()=>{window.controlledRender.injected.setOpen(false);window.controlledRender.setMounted(true);});await expect(injected).toHaveAttribute('aria-expanded','false');
});
for(const theme of ['light','dark','system'])for(const width of [1280,320])test(`Disclosure focus ${theme} ${width} at 200% text`,async({page},info)=>{
 await page.setViewportSize({width,height:700});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await open(page);await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.style.fontSize='200%';},theme);await page.getByRole('button',{name:'打开来源引用',exact:true}).click();await expect(page.locator('article')).toBeFocused();await expect(page.getByRole('button',{name:'来源依据',exact:true})).toHaveAttribute('aria-expanded','true');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await info.attach('disclosure-focus.png',{body:await page.screenshot(),contentType:'image/png'});
});
