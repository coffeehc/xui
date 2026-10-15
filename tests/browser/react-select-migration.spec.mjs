import {test,expect} from '@playwright/test';
import {readFile,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
let source;
test.beforeAll(async()=>{
 const {runDirectory}=JSON.parse(await readFile('.consumers/latest.json','utf8')),cwd=resolve(runDirectory,'react');
 await copyFile('tests/fixtures/react-select-migration.tsx',`${cwd}/react-select-migration.tsx`);
 const result=await build({entryPoints:[`${cwd}/react-select-migration.tsx`],bundle:true,write:false,metafile:true,format:'iife',platform:'browser',jsx:'automatic',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 expect(Object.keys(result.metafile.inputs).every(file=>resolve(file).startsWith(cwd+'/'))).toBe(true);
 source=result.outputFiles[0].text;
});
test.beforeEach(async({page})=>{
 await page.route('**/react-select-contract',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/react/app.css"></head><body><div id="root"></div></body></html>'}));
 await page.goto('/react-select-contract');await page.addScriptTag({content:source});
});
async function choose(page,name,value){await page.getByRole('combobox',{name,exact:true}).click();await page.getByRole('listbox',{name,exact:true}).getByRole('option',{name:value,exact:true}).click();}
const values=page=>page.evaluate(()=>Object.fromEntries(new FormData(document.querySelector('#contract-form'))));
test('controlled acceptance and rejection preserve the public select and one change event',async({page})=>{
 const control=page.getByRole('combobox',{name:'Controlled',exact:true});await expect(control).toHaveText('Alpha');await choose(page,'Controlled','Beta');await expect(control).toHaveText('Beta');await expect(page.getByLabel('Change calls')).toHaveText('1');
 await page.getByRole('button',{name:'Toggle acceptance'}).click();await choose(page,'Controlled','Alpha');await expect(control).toHaveText('Beta');expect((await values(page)).controlled).toBe('b');await expect(page.getByLabel('Change calls')).toHaveText('2');
 await page.getByRole('button',{name:'Translate',exact:true}).click();await expect(page.getByRole('combobox',{name:'受控选择',exact:true})).toHaveText('Beta');
 await page.getByRole('button',{name:'Toggle disabled'}).click();await expect(page.getByRole('combobox',{name:'受控选择',exact:true})).toBeDisabled();expect((await values(page)).controlled).toBeUndefined();
});
test('names, hidden and disabled options, multiple values and reset stay coherent',async({page})=>{
 await expect(page.getByRole('combobox',{name:'Label supplied name',exact:true})).toBeVisible();await expect(page.getByRole('combobox',{name:'Label reference name',exact:true})).toBeVisible();
 await choose(page,'Wrapped','Beta');await expect(page.getByRole('combobox',{name:'Wrapped',exact:true})).toHaveText('Beta');await expect(page.getByRole('combobox',{name:'Referenced',exact:true})).toBeVisible();
 const multi=page.getByRole('combobox',{name:'Multiple',exact:true});await multi.click();await expect(page.getByRole('option',{name:'Hidden',exact:true})).toHaveCount(0);await expect(page.getByRole('option',{name:'Gamma',exact:true})).toBeDisabled();await page.getByRole('option',{name:'Beta',exact:true}).click();
 expect(await page.evaluate(()=>new FormData(document.querySelector('#contract-form')).getAll('multiple'))).toEqual(['a','b']);await page.keyboard.press('Escape');await expect(multi).toBeFocused();
 await page.getByRole('button',{name:'Reset form'}).click();await expect(multi).toHaveText('Alpha');await expect(page.getByRole('combobox',{name:'Wrapped',exact:true})).toHaveText('Alpha');
});
test('disabling a parent fieldset closes its open popup and rejects inherited-disabled interaction',async({page})=>{
 const trigger=page.getByRole('combobox',{name:'Inherited choice',exact:true});await trigger.click();await expect(page.getByRole('listbox')).toBeVisible();
 await page.locator('#inherited-policy').evaluate(node=>node.disabled=true);await expect(page.getByRole('listbox')).toHaveCount(0);await expect(trigger).toBeDisabled();await expect(trigger).toHaveText('Alpha');expect((await values(page)).inherited).toBeUndefined();
 await page.locator('#inherited-policy').evaluate(node=>node.disabled=false);await expect(trigger).toBeEnabled();await choose(page,'Inherited choice','Beta');expect((await values(page)).inherited).toBe('b');
});
test('required validation focuses visible control and readonly selection does not mutate',async({page})=>{
 await page.getByRole('button',{name:'Submit form'}).click();const required=page.getByRole('combobox',{name:'Required',exact:true});await expect(required).toBeFocused();await expect(required).toHaveAttribute('aria-invalid','true');await expect(required).toHaveText('Choose a value');
 await choose(page,'Required','Beta');await expect(required).not.toHaveAttribute('aria-invalid','true');expect((await values(page)).required).toBe('b');
 await choose(page,'Readonly','Beta');await expect(page.getByRole('combobox',{name:'Readonly',exact:true})).toHaveText('Alpha');expect((await values(page)).readonly).toBe('a');
});
for(const theme of ['light','dark','system'])test(`${theme} narrow enlarged nested popup closes one layer and returns focus`,async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme:'dark'});await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.style.fontSize='200%';},theme);
 await page.getByRole('button',{name:'Open form',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Parent dialog',exact:true}),draft=page.getByRole('textbox',{name:'Dialog draft'}),trigger=page.getByRole('combobox',{name:'Dialog choice'});await draft.fill('保留长中文草稿');await trigger.click();await expect(page.getByRole('listbox')).toBeVisible();await page.keyboard.press('ArrowDown');await page.keyboard.press('Escape');await expect(page.getByRole('listbox')).toHaveCount(0);await expect(dialog).toBeVisible();await expect(trigger).toBeFocused();await expect(draft).toHaveValue('保留长中文草稿');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await info.attach('nested-select.png',{body:await page.screenshot(),contentType:'image/png'});await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(page.getByRole('button',{name:'Open form',exact:true})).toBeFocused();
});
