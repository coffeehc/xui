import {test,expect} from '@playwright/test';
const control=page=>page.locator('[data-xui-menu-toggle]');
async function ready(page,kind,{width=1280,mode='light',font=16}={}){
 await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(({mode,font})=>{sessionStorage.setItem('ui.theme.mode',mode);document.addEventListener('DOMContentLoaded',()=>document.documentElement.style.fontSize=font+'px',{once:true});},{mode,font});
 await page.goto(`/sidebar-footer-${kind}/?composition=shell`);await page.waitForFunction(()=>!!window.sidebarFooterDemo);await expect(control(page)).toHaveCount(1);await expect(page.locator('html')).toHaveCSS('font-size',font+'px');
}
for(const kind of ['react','vanilla'])for(const mode of ['light','dark','system'])for(const width of [1280,390])for(const font of [16,32])test(`${kind} sidebar-owned control ${mode} ${width}px root${font}`,async({page},info)=>{
 await ready(page,kind,{width,mode,font});const toggle=control(page),rail=page.locator('.xui-shell-sidebar'),header=page.locator('.xui-shell-header');
 await page.getByRole('textbox',{name:'草稿',exact:true}).fill('位置切换仍保留这份草稿');
 if(width===1280){
  await expect(toggle).toHaveAccessibleName('紧凑导航');await expect(rail.locator('[data-xui-menu-toggle]')).toHaveCount(1);await expect(header.locator('[data-xui-menu-toggle]')).toHaveCount(0);
  const geometry=await toggle.evaluate(node=>{const rail=node.closest('aside'),button=node.getBoundingClientRect(),box=rail.getBoundingClientRect(),style=getComputedStyle(rail);return {end:box.right-parseFloat(style.paddingRight),right:button.right,top:button.top,railTop:box.top,headerBottom:document.querySelector('header').getBoundingClientRect().bottom};});expect(geometry.right).toBeCloseTo(geometry.end,1);expect(geometry.top).toBeGreaterThanOrEqual(geometry.headerBottom);
  await toggle.focus();await page.keyboard.press('Space');await expect(toggle).toBeFocused();await expect(toggle).toHaveAccessibleName('展开导航');await expect(toggle).toHaveAttribute('aria-expanded','false');
  await expect.poll(()=>toggle.evaluate(node=>{const button=node.getBoundingClientRect(),rail=node.closest('aside').getBoundingClientRect();return Math.abs(button.x+button.width/2-(rail.x+rail.width/2));})).toBeLessThan(1);
  expect(await rail.evaluate(node=>node.getBoundingClientRect().width)).toBeCloseTo(60*font/16,1);
  await page.keyboard.press('Enter');await expect(toggle).toBeFocused();await expect(toggle).toHaveAttribute('aria-expanded','true');
 }else{
  await expect(header.locator('[data-xui-menu-toggle]')).toHaveCount(1);await expect(rail.locator('[data-xui-menu-toggle]')).toHaveCount(0);await expect(toggle).toHaveAccessibleName('工作导航');await expect(toggle).toHaveAttribute('aria-haspopup','dialog');
  await toggle.focus();await page.keyboard.press('Enter');const dialog=page.getByRole('dialog',{name:'工作导航',exact:true});await expect(dialog).toBeVisible();await expect(toggle).toHaveAttribute('aria-expanded','true');expect(await toggle.evaluate(node=>document.getElementById(node.getAttribute('aria-controls'))?.contains(document.querySelector('aside')))).toBe(true);
  await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(toggle).toBeFocused();await expect(toggle).toHaveAttribute('aria-expanded','false');
 }
 await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await expect(toggle).toBeFocused();
 const focus=await toggle.evaluate(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node),out=Math.max(0,parseFloat(s.outlineOffset)+parseFloat(s.outlineWidth));return {x:r.x-out,right:r.right+out,y:r.y-out,bottom:r.bottom+out,style:s.outlineStyle,width:parseFloat(s.outlineWidth)};});expect(focus.style).toBe('solid');expect(focus.width).toBeGreaterThan(0);expect(focus.x).toBeGreaterThanOrEqual(0);expect(focus.right).toBeLessThanOrEqual(width);expect(focus.y).toBeGreaterThanOrEqual(0);expect(focus.bottom).toBeLessThanOrEqual(900);
 await expect(page.getByRole('textbox',{name:'草稿',exact:true})).toHaveValue('位置切换仍保留这份草稿');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await info.attach('owned-navigation-control.png',{body:await page.screenshot(),contentType:'image/png'});
});
for(const kind of ['react','vanilla'])test(`${kind} responsive control keeps one DOM node, focus and host state`,async({page})=>{
 await ready(page,kind);const toggle=control(page);await page.getByRole('textbox',{name:'草稿',exact:true}).fill('响应式草稿');await page.evaluate(()=>{window.ownedControl=document.querySelector('[data-xui-menu-toggle]');window.ownedDraft=document.querySelector('input[aria-label="草稿"]')??document.querySelector('#footer-draft');});
 await toggle.focus();await page.setViewportSize({width:390,height:900});await expect(page.locator('.xui-shell-header [data-xui-menu-toggle]')).toHaveCount(1);await expect(toggle).toBeFocused();expect(await toggle.evaluate(node=>node===window.ownedControl)).toBe(true);
 await page.setViewportSize({width:1280,height:900});await expect(page.locator('aside [data-xui-menu-toggle]')).toHaveCount(1);await expect(toggle).toHaveAccessibleName('紧凑导航');await expect(toggle).toHaveAttribute('aria-expanded','true');await expect(toggle).toBeFocused();expect(await toggle.evaluate(node=>node===window.ownedControl)).toBe(true);await expect(page.getByRole('textbox',{name:'草稿',exact:true})).toHaveValue('响应式草稿');expect(await page.getByRole('textbox',{name:'草稿',exact:true}).evaluate(node=>node===window.ownedDraft)).toBe(true);await page.getByRole('textbox',{name:'草稿',exact:true}).focus();await page.setViewportSize({width:390,height:900});await expect(page.getByRole('textbox',{name:'草稿',exact:true})).toBeFocused();await page.setViewportSize({width:1280,height:900});await expect(page.getByRole('textbox',{name:'草稿',exact:true})).toBeFocused();
});
