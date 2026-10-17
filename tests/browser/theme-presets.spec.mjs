import {test,expect,chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {colors} from './theme-color-probe.mjs';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const presets=['violet','ember','forest','crimson','cobalt','precision'];
const task='整理公开模型的多模态能力与许可差异';
const output=resolve('.artifacts/ownership-contract-4.2.13/images/theme-presets');
for(const preset of presets)for(const mode of ['light','dark','system'])for(const [width,font] of [[1600,16],[390,32]])test(`${preset} ${mode} ${width}px text${font/16*100}: formal components and palette continuity`,async({page},info)=>{
 const scheme=mode==='dark'?'dark':'light';await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:scheme,reducedMotion:'reduce'});
 await page.addInitScript(font=>{document.addEventListener('DOMContentLoaded',()=>document.documentElement.style.fontSize=font+'px',{once:true});},font);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(`/theme-presets-react/?preset=${preset}&mode=${mode}`);
 await expect(page.getByRole('heading',{name:'智能体工作台'})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-theme-preset',preset);await expect(page.locator('html')).toHaveAttribute('data-theme-effective',scheme);
 const check=async()=>{const result=await colors(page);for(const [name,ratio] of Object.entries(result.ratios))expect(ratio,`${preset}/${mode}/${name}`).toBeGreaterThanOrEqual(/^(input|focus)\//.test(name)?3:4.5);await info.attach('computed-colors.json',{body:JSON.stringify(result,null,2),contentType:'application/json'});};
 await check();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 if(width===1600){const paletteBox=await page.getByRole('combobox',{name:'主题方案',exact:true}).boundingBox(),modeBox=await page.getByRole('combobox',{name:'显示模式',exact:true}).boundingBox();expect(paletteBox.y,'desktop controls share one header row').toBeCloseTo(modeBox.y,1);}
 await mkdir(output,{recursive:true});await page.screenshot({path:resolve(output,`${preset}-${mode}-${width}.png`),animations:'disabled'});
 const opener=page.getByRole('button',{name:task,exact:true});await opener.click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();const draft=dialog.getByRole('textbox',{name:'复核说明'});await draft.fill('主题切换仍保留中文草稿与焦点');await draft.focus();
 const scrollBefore=await draft.evaluate(node=>{const positions=[];for(let p=node.parentElement;p;p=p.parentElement)positions.push([p.scrollTop,p.scrollLeft]);return positions;});
 const before=await page.evaluate(()=>({storage:JSON.stringify(Object.entries(sessionStorage))}));
 const next=presets[(presets.indexOf(preset)+1)%presets.length];await page.evaluate(preset=>window.xuiTheme.setPreset(preset),next);
 await expect(page.locator('html')).toHaveAttribute('data-theme-preset',next);await expect(draft).toHaveValue('主题切换仍保留中文草稿与焦点');await expect(draft).toBeFocused();await expect(dialog).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(Object.entries(sessionStorage)))).toBe(before.storage);
 expect(await draft.evaluate(node=>{const positions=[];for(let p=node.parentElement;p;p=p.parentElement)positions.push([p.scrollTop,p.scrollLeft]);return positions;})).toEqual(scrollBefore);
 await page.evaluate(preset=>window.xuiTheme.setPreset(preset),preset);
 if(mode==='system')for(const colorScheme of ['dark','light']){await page.emulateMedia({colorScheme});await expect(page.locator('html')).toHaveAttribute('data-theme-effective',colorScheme);await expect(draft).toBeFocused();await expect(draft).toHaveValue('主题切换仍保留中文草稿与焦点');await check();}
 const close=dialog.getByRole('button',{name:'关闭详情',exact:true});await close.focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await expect(close).toHaveCSS('outline-style','solid');await close.click();await expect(opener).toBeFocused();expect(errors).toEqual([]);
});

test('configuration runs before application code; project preset reloads and public overrides win',async({page})=>{
 await page.route('**/theme-presets-react/app.js',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/theme-presets-react/?preset=forest&mode=light');await expect(page.locator('html')).toHaveAttribute('data-theme-preset','forest');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');expect(await page.evaluate(()=>window.xuiTheme)).toBeUndefined();expect((await colors(page)).values['action-primary']).toEqual([4,120,87]);
 await page.unroute('**/theme-presets-react/app.js');await page.goto('/theme-presets-react/');await expect(page.getByRole('heading',{name:'智能体工作台'})).toBeVisible();
 const input=page.getByRole('textbox',{name:'任务名称',exact:true});await input.fill('项目保留自定义配色');const chooser=page.getByRole('combobox',{name:'主题方案',exact:true});await chooser.click();await page.getByRole('option',{name:'绯红',exact:true}).click();await expect(chooser).toBeFocused();await expect(input).toHaveValue('项目保留自定义配色');
 await page.evaluate(()=>window.xuiTheme.setMode('light'));await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme-preset','violet');await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.addStyleTag({content:'@layer product-overrides {:root {--action-primary: #135e96; --action-primary-foreground:#fff;}}'});
 for(const preset of presets){await page.evaluate(preset=>window.xuiTheme.setPreset(preset),preset);expect((await colors(page)).values['action-primary']).toEqual([19,94,150]);}
});
for(const preset of presets)for(const mode of ['light','dark'])test(`${preset} ${mode}: genuine Chrome200% zoom and Sheet focus`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});
 try{
  const page=await context.newPage();await page.emulateMedia({colorScheme:mode,reducedMotion:'reduce'});await page.goto(`http://127.0.0.1:4173/theme-presets-react/?preset=${preset}&mode=${mode}`);await expect(page.getByRole('heading',{name:'智能体工作台'})).toBeVisible();
  const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);
  const after=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize,zoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.zoom).toBe('1');expect(after.pinch).toBe(1);
  const opener=page.getByRole('button',{name:task,exact:true});await opener.click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();const close=dialog.getByRole('button',{name:'关闭详情',exact:true});await close.focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await expect(close).toHaveCSS('outline-style','solid');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const screenshot=await captureZoomViewport(page);await mkdir(output,{recursive:true});await writeFile(resolve(output,`${preset}-${mode}-zoom200.png`),screenshot);await info.attach('zoom200.png',{body:screenshot,contentType:'image/png'});await info.attach('zoom.json',{body:JSON.stringify({before,after}),contentType:'application/json'});await close.click();await expect(opener).toBeFocused();
 }finally{await context.close();}
});
