import {test,expect,chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const names=['模型调用 · 可复制','已禁用 · 可管理读取','已过期 · 可管理读取','已撤销 · 可管理读取','历史哈希 · 不可恢复','读取权限已拒绝'];
const copy=(page,index=0)=>page.getByRole('button',{name:'复制 API Key '+names[index],exact:true});
const reads=page=>page.evaluate(()=>window.apiKeyDemo.getRequests().filter(item=>item.path.endsWith('/secret')));
const copied=page=>page.evaluate(()=>window.copiedValues);
async function prepare(page,mode='light'){await page.addInitScript(mode=>{window.xuiThemeOptions={mode};window.copiedValues=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.copiedValues.push(value);}}});},mode);}
async function open(page,mode='light'){await prepare(page,mode);await page.goto(`/api-key-react/?official&mode=${mode}`);await expect(copy(page)).toBeEnabled();await expect(page.locator('html')).toHaveAttribute('data-theme',mode);await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);}
async function key(page,index=0){await copy(page,index).focus();await expect(copy(page,index)).toBeInViewport();await page.keyboard.press('Enter');}

test('official reader is opt-in, exact key target, one IO per pointer/Enter/Space, and no secret in state or UI',async({page})=>{
 await open(page);expect(await reads(page)).toHaveLength(0);await expect(copy(page,4)).toBeDisabled();await expect(copy(page,5)).toBeDisabled();
 const row=page.getByRole('row').filter({has:copy(page)});await row.evaluate(node=>window.savedKeyRow=node);const before=await row.boundingBox();
 await copy(page).click();await expect.poll(()=>copied(page)).toEqual(['FAKE_1_SYNTHETIC_COMPLETE_CREDENTIAL']);
 await key(page,1);await copy(page,2).focus();await page.keyboard.press('Space');await expect.poll(()=>copied(page)).toHaveLength(3);
 expect((await reads(page)).map(item=>[item.method,item.path,item.body])).toEqual([['POST','/api/v1/api-keys/1/secret',{expected_version:'19'}],['POST','/api/v1/api-keys/2/secret',{expected_version:'19'}],['POST','/api/v1/api-keys/3/secret',{expected_version:'19'}]]);
 expect(await row.evaluate(node=>node===window.savedKeyRow)).toBe(true);expect((await row.boundingBox()).height).toBeCloseTo(before.height,1);
 expect(await page.evaluate(()=>JSON.stringify(window.apiKeyDemo.controller.getState()))).not.toContain('SYNTHETIC_COMPLETE');expect(await page.locator('body').innerText()).not.toContain('SYNTHETIC_COMPLETE');
 await page.getByRole('switch',{name:'点击密钥复制'}).click();await expect(copy(page)).toHaveCount(0);expect(await reads(page)).toHaveLength(3);await page.getByRole('switch',{name:'点击密钥复制'}).click();await expect(copy(page)).toBeEnabled();expect(await reads(page)).toHaveLength(3);
});

test('busy gates duplicate input; privilege/version refresh and unmount discard pending values and preserve row layout',async({page})=>{
 await open(page);await page.evaluate(()=>window.apiKeyDemo.setMode('hold'));await copy(page).click();await expect(copy(page)).toBeDisabled();await expect(copy(page)).toHaveAttribute('aria-busy','true');await page.keyboard.press('Enter');expect(await reads(page)).toHaveLength(1);
 await page.evaluate(async()=>{window.apiKeyDemo.setAccess('1',false);await window.apiKeyDemo.controller.refresh();window.apiKeyDemo.release();});await expect(copy(page)).toBeDisabled();expect(await copied(page)).toHaveLength(0);
 await page.evaluate(async()=>{window.apiKeyDemo.setAccess('1',true);await window.apiKeyDemo.controller.refresh();window.apiKeyDemo.setMode('hold');});await copy(page).click();await page.evaluate(async()=>{window.apiKeyDemo.setVersion('1');await window.apiKeyDemo.controller.refresh();window.apiKeyDemo.release();});await expect(copy(page)).toBeEnabled();expect(await copied(page)).toHaveLength(0);
 await page.evaluate(()=>window.apiKeyDemo.setMode('hold'));await copy(page).click();await page.evaluate(()=>{window.apiKeyDemo.unmountView();window.apiKeyDemo.release();});expect(await copied(page)).toHaveLength(0);await page.evaluate(()=>window.apiKeyDemo.remountView());await expect(copy(page)).toBeEnabled();
});

test('failed/conflicting reads neither refresh nor replay; current identity loss blocks copy without recovery',async({page})=>{
 await open(page);await page.evaluate(()=>window.apiKeyDemo.setMode('conflict'));await copy(page).click();await expect(page.getByText('复制失败，请重试',{exact:true})).toBeVisible();await expect(copy(page)).toBeEnabled();expect(await copied(page)).toHaveLength(0);expect(await reads(page)).toHaveLength(1);
 const initial=await page.evaluate(()=>window.apiKeyDemo.getRequests().length);await page.evaluate(()=>{window.apiKeyDemo.setMode('ok');window.apiKeyDemo.expire();});await copy(page).click();await expect(copy(page)).toBeEnabled();expect(await page.evaluate(()=>window.apiKeyDemo.getRequests().length)).toBe(initial);expect(await copied(page)).toHaveLength(0);
});

for(const mode of ['light','dark','system'])for(const narrow of [false,true])test(`official copy ${mode} ${narrow?'narrow reading 200%':'desktop'}: focus, long names and fixed regions`,async({page},info)=>{
 await page.emulateMedia({colorScheme:mode==='system'?'dark':mode});await page.setViewportSize({width:narrow?390:1440,height:900});if(narrow)await page.addInitScript(()=>sessionStorage.setItem('ui.interface.scale','2'));await open(page,mode);
 if(narrow)await expect(page.locator('html')).toHaveAttribute('data-interface-scale','2');
 if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');}
 await page.evaluate(async()=>{window.apiKeyDemo.setLong();await window.apiKeyDemo.controller.refresh();});
 const action=page.getByRole('button',{name:new RegExp('^复制 API Key '+names[0])});await action.focus();await expect(action).toBeInViewport();await page.keyboard.press('Space');await expect.poll(()=>copied(page)).toHaveLength(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.evaluate(()=>JSON.stringify(window.apiKeyDemo.controller.getState()))).not.toContain('SYNTHETIC_COMPLETE');
 await mkdir('output/playwright/api-key-v3-4.2.43',{recursive:true});await page.screenshot({path:`output/playwright/api-key-v3-4.2.43/${mode}-${narrow?'reading200':'desktop'}.png`,fullPage:true});
});

for(const mode of ['light','dark','system'])test(`official copy genuine Chrome zoom 200% ${mode}`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,1000']});
 try{const page=await context.newPage();await page.emulateMedia({colorScheme:'dark'});await prepare(page,mode);await page.goto(String(info.project.use.baseURL)+`/api-key-react/?official&mode=${mode}`);await expect(copy(page)).toBeEnabled();await expect(page.locator('html')).toHaveAttribute('data-theme',mode);await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);const after=await page.evaluate(()=>({width:innerWidth,font:getComputedStyle(document.documentElement).fontSize,zoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.zoom).toBe('1');expect(after.pinch).toBe(1);await key(page,3);await expect.poll(()=>copied(page)).toEqual(['FAKE_4_SYNTHETIC_COMPLETE_CREDENTIAL']);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const image=await captureZoomViewport(page);await info.attach('zoom.png',{body:image,contentType:'image/png'});await info.attach('geometry.json',{body:JSON.stringify({before,after}),contentType:'application/json'});
 }finally{await context.close();}
});
