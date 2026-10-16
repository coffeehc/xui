import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
async function visit(page,{strict=false,theme='light',font=16,width=1280}={}){
 await page.setViewportSize({width,height:700});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(({theme,font})=>{sessionStorage.setItem('ui.theme.mode',theme);document.addEventListener('DOMContentLoaded',()=>document.documentElement.style.fontSize=font+'px',{once:true});},{theme,font});
 await page.goto(`/action-menu-react${strict?'-strict':''}/`);await expect(page.getByRole('button',{name:'账户操作',exact:true})).toBeVisible();
}
test('default Menu.View renders serializable groups, dispatches once and preserves host focus/takeover',async({page})=>{
 await visit(page);const trigger=page.getByRole('button',{name:'账户操作',exact:true});await trigger.focus();await page.keyboard.press('Enter');
 const menu=page.getByRole('menu');await expect(menu).toBeVisible();await expect(menu.getByRole('separator')).toHaveCount(1);await expect(menu.getByRole('menuitem',{name:'管理员',exact:true})).toHaveCount(0);await expect(menu.getByRole('menuitem',{name:'暂不可用',exact:true})).toBeDisabled();
 await expect(menu.getByRole('menuitem',{name:'研究工作区',exact:true})).toBeFocused();await page.keyboard.press('End');await expect(menu.getByRole('menuitem',{name:'退出登录',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(menu).toBeVisible();
 expect(await page.evaluate(()=>window.actionMenuDemo.events)).toEqual([{actionId:'logout',owner:'default',source:'keyboard'}]);
 await page.keyboard.press('Escape');await expect(menu).toBeHidden();await expect(trigger).toBeFocused();
 await trigger.click();await menu.getByRole('menuitem',{name:'设置',exact:true}).click();await expect(menu).toBeHidden();await expect(page.getByRole('button',{name:'宿主设置入口'})).toBeFocused();
 await trigger.click();await menu.getByRole('menuitem',{name:'研究工作区',exact:true}).click();await expect(menu).toBeHidden();await expect(trigger).toBeFocused();expect(await page.evaluate(()=>window.actionMenuDemo.events.length)).toBe(3);
});
test('menu data composition remains reachable at actual browser zoom200',async({},info)=>{
 const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});
 try{
  const page=await context.newPage();await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.goto('http://127.0.0.1:4173/action-menu-react/');const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));
  const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);
  const after=await page.evaluate(()=>({width:innerWidth,font:getComputedStyle(document.documentElement).fontSize,zoom:getComputedStyle(document.documentElement).zoom,scale:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.zoom).toBe('1');expect(after.scale).toBe(1);
  const trigger=page.getByRole('button',{name:'账户操作',exact:true});await trigger.click();await page.keyboard.press('End');await expect(page.getByRole('menuitem',{name:'退出登录',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(page.getByRole('menu')).toBeVisible();await info.attach('menu-actual-zoom.png',{body:await captureZoomViewport(page),contentType:'image/png'});await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
 }finally{await context.close();}
});
test('injected controller fully replaces opening, config, focus and actions without parallel ownership',async({page})=>{
 await visit(page);const trigger=page.getByRole('button',{name:'账户操作',exact:true});await trigger.evaluate(node=>window.originalTrigger=node);
 await page.evaluate(()=>{window.actionMenuDemo.setInjected(true);window.actionMenuDemo.setBlocked(true);});await expect.poll(()=>page.evaluate(()=>window.actionMenuDemo.stats().subscribers)).toBe(1);
 expect(await trigger.evaluate(node=>node===window.originalTrigger)).toBe(true);await trigger.click();await expect(page.getByRole('menu')).toBeHidden();
 await page.evaluate(()=>{window.actionMenuDemo.setBlocked(false);window.actionMenuDemo.controller.setOpen(true);window.actionMenuDemo.controller.focusItem('settings');});
 const menu=page.getByRole('menu');await expect(menu.getByRole('menuitem',{name:'设置',exact:true})).toBeFocused();
 await page.evaluate(()=>{const d=window.actionMenuDemo,c=JSON.parse(JSON.stringify(d.controller.getState().config));c.items=c.items.filter(item=>item.id!=='settings');c.items.find(item=>item.id==='admin').hidden=false;d.controller.setConfig(c);});
 await expect(menu.getByRole('menuitem',{name:'管理员',exact:true})).toBeFocused();await page.keyboard.press('Space');await expect(menu).toBeHidden();expect((await page.evaluate(()=>window.actionMenuDemo.events)).at(-1)).toMatchObject({actionId:'open.admin',owner:'injected',source:'keyboard'});
 await page.evaluate(()=>window.actionMenuDemo.setMounted(false));await expect.poll(()=>page.evaluate(()=>window.actionMenuDemo.stats().subscribers)).toBe(0);expect(await page.evaluate(()=>window.actionMenuDemo.stats().destroys)).toBe(0);expect(await page.evaluate(()=>window.actionMenuDemo.controller.getState().destroyed)).toBe(false);
 await page.evaluate(()=>window.actionMenuDemo.setMounted(true));await expect.poll(()=>page.evaluate(()=>window.actionMenuDemo.stats().subscribers)).toBe(1);await trigger.focus();await page.keyboard.press('Enter');await expect(menu.getByRole('menuitem',{name:'研究工作区',exact:true})).toBeFocused();await expect(menu.getByRole('menuitem',{name:'管理员',exact:true})).toBeVisible();
 await page.keyboard.press('End');await expect(menu.getByRole('menuitem',{name:'退出登录',exact:true})).toBeFocused();await page.keyboard.press('ArrowUp');await expect(menu.getByRole('menuitem',{name:'暂不可用',exact:true})).toBeFocused();expect(await page.evaluate(()=>window.actionMenuDemo.controller.getState().activeId)).toBe('unavailable');
 const before=await page.evaluate(()=>window.actionMenuDemo.events.length);await page.keyboard.press('Enter');await page.keyboard.press('Space');expect(await page.evaluate(()=>window.actionMenuDemo.events.length)).toBe(before);await expect(menu).toBeVisible();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
});
test('development StrictMode and repeated owned/injected replacement preserve one live subscription and usable defaults',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await visit(page,{strict:true});
 const trigger=page.getByRole('button',{name:'账户操作',exact:true});for(let i=0;i<3;i++){
  await trigger.click();await expect(page.getByRole('menu')).toBeVisible();await page.keyboard.press('Escape');
  await page.evaluate(()=>window.actionMenuDemo.setInjected(true));await expect.poll(()=>page.evaluate(()=>window.actionMenuDemo.stats().subscribers)).toBe(1);
  await page.evaluate(()=>window.actionMenuDemo.setInjected(false));await expect.poll(()=>page.evaluate(()=>window.actionMenuDemo.stats().subscribers)).toBe(0);
 }
 await page.evaluate(()=>window.actionMenuDemo.setMounted(false));await expect(trigger).toHaveCount(0);await page.evaluate(()=>window.actionMenuDemo.setMounted(true));await trigger.click();await page.getByRole('menuitem',{name:'研究工作区',exact:true}).click();await expect(page.getByRole('menu')).toBeHidden();expect(await page.evaluate(()=>window.actionMenuDemo.events.length)).toBe(1);expect(errors).toEqual([]);
});
for(const theme of ['light','dark','system'])for(const [width,font] of [[1280,16],[390,32]])test(`menu data slots ${theme} width${width} font${font}`,async({page},info)=>{
 await visit(page,{theme,width,font});const trigger=page.getByRole('button',{name:'账户操作',exact:true});await trigger.click();const menu=page.getByRole('menu'),long=menu.getByRole('menuitem',{name:'跨部门研究与运营协作的长期任务及完整消息记录',exact:true});await expect(long).toBeVisible();await long.scrollIntoViewIfNeeded();const geometry=await long.evaluate(node=>{const r=node.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {hit:node.contains(hit),left:r.left,right:r.right,viewport:innerWidth};});expect(geometry.hit).toBe(true);expect(geometry.left).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(geometry.viewport+1);
 await page.keyboard.press('End');await expect(menu.getByRole('menuitem',{name:'退出登录',exact:true})).toBeFocused();await info.attach('action-menu.png',{body:await page.screenshot(),contentType:'image/png'});await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
});
