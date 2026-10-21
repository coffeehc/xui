import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const output=resolve('.artifacts/ownership-contract-4.2.13/images/default-theme');
// Ask the browser to resolve OKLab mixes; compare the final opaque surfaces,
// including the two sides of a necessary input boundary.
import {colors} from './theme-color-probe.mjs';

for(const [mode,scheme] of [['light','light'],['dark','dark'],['system','light'],['system','dark']])for(const [width,font] of [[1440,16],[390,32]]){
 test(`default ${mode}-${scheme} ${width}px text ${font/16*100}%: public surfaces, form and focus`,async({page},info)=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:scheme,reducedMotion:'reduce'});
  await page.addInitScript(({mode,font})=>{sessionStorage.setItem('ui.theme.mode',mode);document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.fontSize=font+'px';},{once:true});},{mode,font});
  await page.goto('/page-composition-react/?long');await expect(page.getByRole('button',{name:/^公开账户行为研究 1：/})).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme-effective',scheme);
  const save=async(name)=>{await mkdir(output,{recursive:true});const filename=`${mode}-${scheme}-${width}-${name}.png`;await page.screenshot({path:join(output,filename),animations:'disabled'});await info.attach(filename,{path:join(output,filename),contentType:'image/png'});};
  const result=await colors(page);
  for(const [name,value] of Object.entries(result.ratios))expect(value,name).toBeGreaterThanOrEqual(/^(input|focus)\//.test(name)?3:4.5);
  await expect(page.locator('html')).toHaveAttribute('data-theme-preset','violet');
  if(scheme==='light')expect(result.values['layer-raised']).toEqual([255,255,255]);
  expect(result.values['layer-shell']).not.toEqual(result.values['layer-raised']);
  expect(result.values['table-row-stripe-background']).not.toEqual(result.values['table-row-background']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await save('page');
  const opener=page.getByRole('button',{name:'创建研究任务',exact:true});await opener.click();const dialog=page.getByRole('dialog',{name:'创建研究任务',exact:true});await expect(dialog).toBeVisible();
  const select=dialog.getByRole('combobox',{name:'冻结模板'});await select.focus();await select.press('ArrowDown');await expect(page.getByRole('listbox')).toBeVisible();await save('select');
  await page.keyboard.press('Escape');await expect(page.getByRole('listbox')).toHaveCount(0);await expect(select).toBeFocused();
  const cancel=dialog.getByRole('button',{name:'取消',exact:true});await cancel.focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await expect(cancel).toHaveCSS('outline-style','none');
  await save('form-focus');await cancel.click();await expect(opener).toBeFocused();
  await writeFile(join(output,`${mode}-${scheme}-${width}.json`),JSON.stringify(result,null,2));await info.attach('computed-colors.json',{body:JSON.stringify(result,null,2),contentType:'application/json'});
  if(mode==='system'){await page.emulateMedia({colorScheme:scheme==='light'?'dark':'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','system');await expect(page.locator('html')).toHaveAttribute('data-theme-effective',scheme==='light'?'dark':'light');}
 });
}
