import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const control=page=>page.locator('[data-xui-menu-toggle]');
async function ready(page,kind,{width=1280,mode='light',font=16,composition='shell',long=false}={}){
 await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(({mode,font})=>{sessionStorage.setItem('ui.theme.mode',mode);document.addEventListener('DOMContentLoaded',()=>document.documentElement.style.fontSize=font+'px',{once:true});},{mode,font});
 await page.goto(`/sidebar-footer-${kind}/?composition=${composition}${long?'&list=long':''}`);await page.waitForFunction(()=>!!window.sidebarFooterDemo);await expect(control(page)).toHaveCount(1);await expect(page.locator('html')).toHaveCSS('font-size',font+'px');
}
for(const kind of ['react'])for(const mode of ['light','dark','system'])for(const width of [1280,390])for(const font of [16,32])test(`${kind} brand-row navigation control ${mode} ${width}px root${font}`,async({page},info)=>{
 await ready(page,kind,{width,mode,font});const toggle=control(page),rail=page.locator('.xui-shell-sidebar'),header=page.locator('.xui-shell-header');
 await page.getByRole('textbox',{name:'草稿',exact:true}).fill('位置切换仍保留这份草稿');
 if(width===1280){
  await expect(toggle).toHaveAccessibleName('紧凑导航');await expect(rail.locator('[data-xui-menu-toggle]')).toHaveCount(0);await expect(header.locator('[data-xui-menu-toggle]')).toHaveCount(1);
  const geometry=await toggle.evaluate(node=>{const identity=node.closest('.xui-app-header-identity'),brand=identity.querySelector('.xui-app-header-brand').getBoundingClientRect(),button=node.getBoundingClientRect(),header=document.querySelector('header').getBoundingClientRect();return {left:button.left,brandRight:brand.right,center:button.y+button.height/2,brandCenter:brand.y+brand.height/2,bottom:button.bottom,headerBottom:header.bottom};});expect(geometry.left).toBeGreaterThan(geometry.brandRight);expect(geometry.center).toBeCloseTo(geometry.brandCenter,1);expect(geometry.bottom).toBeLessThanOrEqual(geometry.headerBottom);
  await toggle.focus();await page.keyboard.press('Space');await expect(toggle).toBeFocused();await expect(toggle).toHaveAccessibleName('展开导航');await expect(toggle).toHaveAttribute('aria-expanded','false');
  await expect.poll(()=>toggle.evaluate(node=>{const button=node.getBoundingClientRect(),brand=node.closest('.xui-app-header-identity').querySelector('.xui-app-header-brand').getBoundingClientRect();return Math.abs(button.y+button.height/2-(brand.y+brand.height/2));})).toBeLessThan(1);
  expect(await rail.evaluate(node=>node.getBoundingClientRect().width)).toBeCloseTo(60*font/16,1);
  await page.keyboard.press('Enter');await expect(toggle).toBeFocused();await expect(toggle).toHaveAttribute('aria-expanded','true');
 }else{
  await expect(header.locator('[data-xui-menu-toggle]')).toHaveCount(1);await expect(rail.locator('[data-xui-menu-toggle]')).toHaveCount(0);await expect(toggle).toHaveAccessibleName('工作导航');await expect(toggle).toHaveAttribute('aria-haspopup','dialog');
  await toggle.focus();await page.keyboard.press('Enter');const dialog=page.getByRole('dialog',{name:'工作导航',exact:true});await expect(dialog).toBeVisible();await expect(toggle).toHaveAttribute('aria-expanded','true');expect(await toggle.evaluate(node=>document.getElementById(node.getAttribute('aria-controls'))?.contains(document.querySelector('aside')))).toBe(true);
  await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(toggle).toBeFocused();await expect(toggle).toHaveAttribute('aria-expanded','false');
 }
 await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await expect(toggle).toBeFocused();
 const focus=await toggle.evaluate(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,style:s.outlineStyle};});expect(focus.style).toBe('none');expect(focus.x).toBeGreaterThanOrEqual(0);expect(focus.right).toBeLessThanOrEqual(width);expect(focus.y).toBeGreaterThanOrEqual(0);expect(focus.bottom).toBeLessThanOrEqual(900);
 await expect(page.getByRole('textbox',{name:'草稿',exact:true})).toHaveValue('位置切换仍保留这份草稿');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await info.attach('owned-navigation-control.png',{body:await page.screenshot(),contentType:'image/png'});
});
for(const kind of ['react'])test(`${kind} responsive control keeps one DOM node, focus and host state`,async({page})=>{
 await ready(page,kind);const toggle=control(page);await page.getByRole('textbox',{name:'草稿',exact:true}).fill('响应式草稿');await page.evaluate(()=>{window.ownedControl=document.querySelector('[data-xui-menu-toggle]');window.ownedDraft=document.querySelector('input[aria-label="草稿"]')??document.querySelector('#footer-draft');});
 await toggle.focus();await page.setViewportSize({width:390,height:900});await expect(page.locator('.xui-shell-header [data-xui-menu-toggle]')).toHaveCount(1);await expect(toggle).toBeFocused();expect(await toggle.evaluate(node=>node===window.ownedControl)).toBe(true);
 await page.setViewportSize({width:1280,height:900});await expect(page.locator('.xui-app-header-identity [data-xui-menu-toggle]')).toHaveCount(1);await expect(toggle).toHaveAccessibleName('紧凑导航');await expect(toggle).toHaveAttribute('aria-expanded','true');await expect(toggle).toBeFocused();expect(await toggle.evaluate(node=>node===window.ownedControl)).toBe(true);await expect(page.getByRole('textbox',{name:'草稿',exact:true})).toHaveValue('响应式草稿');expect(await page.getByRole('textbox',{name:'草稿',exact:true}).evaluate(node=>node===window.ownedDraft)).toBe(true);await page.getByRole('textbox',{name:'草稿',exact:true}).focus();await page.setViewportSize({width:390,height:900});await expect(page.getByRole('textbox',{name:'草稿',exact:true})).toBeFocused();await page.setViewportSize({width:1280,height:900});await expect(page.getByRole('textbox',{name:'草稿',exact:true})).toBeFocused();
});

async function expectSidebarBoundary(page,direction){
 const geometry=await page.locator('.xui-shell-sidebar').evaluate(node=>{
  const style=getComputedStyle(node),rect=node.getBoundingClientRect(),content=node.querySelector('.xui-shell-sidebar-menu').getBoundingClientRect(),footer=getComputedStyle(node.querySelector('.xui-shell-sidebar-footer'));
  return {width:rect.width,contentWidth:content.width,paddingStart:parseFloat(style.paddingInlineStart),paddingEnd:parseFloat(style.paddingInlineEnd),line:parseFloat(style.borderInlineEndWidth),left:parseFloat(style.borderLeftWidth),right:parseFloat(style.borderRightWidth),style:style.borderInlineEndStyle,color:style.borderInlineEndColor,separatorColor:footer.borderBlockStartColor};
 });
 expect(geometry.line).toBe(1);expect(geometry.style).toBe('solid');expect(geometry.color).toBe(geometry.separatorColor);
 expect(geometry.left).toBe(direction==='rtl'?1:0);expect(geometry.right).toBe(direction==='rtl'?0:1);
 // The new line uses existing padding, preserving the old symmetric content box.
 expect(geometry.contentWidth).toBeCloseTo(geometry.width-2*geometry.paddingStart,1);
 expect(geometry.paddingEnd+geometry.line).toBe(geometry.paddingStart);return geometry;
}
for(const composition of ['shell','layout'])for(const mode of ['light','dark','system'])for(const direction of ['ltr','rtl'])for(const font of [16,32])test(`sidebar boundary ${composition} ${mode} ${direction} root${font}`,async({page},info)=>{
 await ready(page,'react',{mode,font,composition,long:true});await page.evaluate(direction=>document.documentElement.dir=direction,direction);
 const aside=page.locator('.xui-shell-sidebar'),toggle=control(page);await expect(aside).toBeVisible();await page.evaluate(()=>window.boundarySidebar=document.querySelector('.xui-shell-sidebar'));
 const draft=page.getByRole('textbox',{name:'草稿',exact:true});await draft.fill('分隔线、折叠和抽屉切换保留的长中文草稿');
 const facts=[await expectSidebarBoundary(page,direction)];expect(facts[0].width).toBe(font===16?324:640);
 await toggle.focus();await page.keyboard.press('Space');await expect(toggle).toHaveAttribute('aria-expanded','false');await expect(toggle).toBeFocused();facts.push(await expectSidebarBoundary(page,direction));expect(facts[1].width).toBe(60*font/16);
 await page.keyboard.press('Enter');await expect(toggle).toHaveAttribute('aria-expanded','true');
 const menu=aside.locator('.xui-shell-sidebar-menu'),last=menu.getByRole('link').last();await last.focus();await expect(last).toBeFocused();expect(await menu.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);await expectSidebarBoundary(page,direction);
 if(direction==='ltr')await info.attach('sidebar-desktop.png',{body:await page.screenshot(),contentType:'image/png'});
 await toggle.focus();await page.setViewportSize({width:390,height:720});await expect(toggle).toHaveAttribute('aria-haspopup','dialog');await expect(toggle).toHaveAttribute('aria-expanded','false');await expect(toggle).toBeFocused();await page.keyboard.press('Enter');const dialog=page.getByRole('dialog',{name:'工作导航',exact:true});await expect(dialog).toBeVisible();
 await expect(aside).toHaveCSS('border-inline-end-width','0px');await expect(aside).toHaveCSS('border-inline-start-width','0px');await expect(dialog).toHaveCSS('border-inline-end-width','1px');
 expect(await aside.evaluate(node=>{const s=getComputedStyle(node);return s.paddingInlineStart===s.paddingInlineEnd;})).toBe(true);expect(await aside.evaluate(node=>node===window.boundarySidebar)).toBe(true);
 if(direction==='ltr'&&font===32)await info.attach('sidebar-drawer-font200.png',{body:await page.screenshot(),contentType:'image/png'});
 await page.keyboard.press('Escape');await expect(toggle).toBeFocused();await page.setViewportSize({width:1280,height:900});await expect(toggle).toHaveAccessibleName('紧凑导航');await expect(aside).toBeVisible();await expect(toggle).toBeFocused();await expectSidebarBoundary(page,direction);await expect(draft).toHaveValue('分隔线、折叠和抽屉切换保留的长中文草稿');expect(await aside.evaluate(node=>node===window.boundarySidebar)).toBe(true);
 await info.attach('sidebar-boundary.json',{body:JSON.stringify(facts),contentType:'application/json'});
});
for(const mode of ['light','dark','system'])test(`sidebar boundary actual browser zoom200 ${mode}`,async({},info)=>{
 test.setTimeout(90000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1920,1000']});
 try{
  const page=await context.newPage();await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);await page.goto('http://127.0.0.1:4173/sidebar-footer-react/?composition=shell&list=long');await page.waitForFunction(()=>!!window.sidebarFooterDemo);
  const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));await expectSidebarBoundary(page,'ltr');
  const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);
  const after=await page.evaluate(()=>({width:innerWidth,font:getComputedStyle(document.documentElement).fontSize,css:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.css).toBe('1');expect(after.pinch).toBe(1);
  await expectSidebarBoundary(page,'ltr');await control(page).focus();await page.keyboard.press('Space');await expect(control(page)).toBeFocused();await expectSidebarBoundary(page,'ltr');await info.attach('sidebar-browser200.png',{body:await captureZoomViewport(page),contentType:'image/png'});
 }finally{await context.close();}
});
