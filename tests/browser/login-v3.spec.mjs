import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';

const username=page=>page.getByRole('textbox',{name:'用户名',exact:true});
const password=page=>page.getByLabel(/^密码(?:\s*\*)?$/);
const submit=page=>page.locator('.xui-login-submit');
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function reachable(page,info,name){
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 for(const control of [username(page),password(page),page.getByRole('button',{name:'显示密码',exact:true}),submit(page)]){
  await control.focus();await control.scrollIntoViewIfNeeded();await expect(control).toBeFocused();await expect(control).toBeInViewport();
  const r=await control.boundingBox();expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth));
 }
 await info.attach(name,{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});
}

for(const appearance of ['light','dark','system'])for(const width of [1440,390,320])test(`V3 external brand and quiet card ${appearance} ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),appearance);
 await page.goto('/login-react/?visualAcceptance');await expect(submit(page)).toBeEnabled();
 const metrics=await page.evaluate(()=>{
  const box=s=>document.querySelector(s).getBoundingClientRect().toJSON(),card=document.querySelector('.xui-login-card'),style=getComputedStyle(card),root=getComputedStyle(document.documentElement);
  return {brand:box('.xui-login-brand'),card:box('.xui-login-card'),layout:box('.xui-login-layout'),logo:box('.xui-login-logo'),surface:style.backgroundColor,top:style.borderTopColor,side:style.borderInlineStartColor,border:style.borderTopWidth,radius:style.borderTopLeftRadius,shadow:style.boxShadow,background:style.backgroundImage,expected:root.getPropertyValue('--layer-surface').trim(),parent:document.querySelector('.xui-login-brand').parentElement===card.parentElement,inside:card.contains(document.querySelector('.xui-login-brand')),src:document.querySelector('.xui-login-logo').getAttribute('src'),alt:document.querySelector('.xui-login-logo').getAttribute('alt')};
 });
 expect(metrics.parent).toBe(true);expect(metrics.inside).toBe(false);expect(metrics.src).toBe('./mark.svg');expect(metrics.alt).toBe('轻舟工作台');expect(metrics.logo.width).toBe(48);expect(metrics.logo.height).toBe(48);
 expect(metrics.card.y-metrics.brand.bottom).toBe(24);expect(metrics.top).toBe(metrics.side);expect(metrics.border).toBe('1px');expect(metrics.radius).toBe('16px');expect(metrics.shadow).toBe('none');expect(metrics.background).toBe('none');
 expect(Math.abs(metrics.brand.x+metrics.brand.width/2-width/2)).toBeLessThanOrEqual(1);expect(Math.abs(metrics.layout.y+metrics.layout.height/2-450)).toBeLessThanOrEqual(1);
 expect((await page.locator('.xui-login-page').innerText()).replace(/\s+/g,' ')).toBe('轻舟工作台 登录 继续处理你的工作。 用户名 * 密码 * 登录');
 await info.attach('v3-idle.png',{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});await info.attach('v3-geometry.json',{body:JSON.stringify(metrics),contentType:'application/json'});
 if(appearance==='system'){
  await username(page).fill('retained');await username(page).focus();await page.evaluate(()=>{window.v3Input=document.activeElement;});await page.emulateMedia({colorScheme:'light'});
  await expect(username(page)).toBeFocused();expect(await page.evaluate(()=>window.v3Input===document.activeElement)).toBe(true);await expect(username(page)).toHaveValue('retained');await info.attach('v3-system-light.png',{body:await page.screenshot(),contentType:'image/png'});
 }
});

for(const appearance of ['light','dark','system'])for(const scale of [1.25,1.5,2])test(`V3 ${appearance} interface scale ${scale} keeps long brand and controls reachable`,async({page},info)=>{
 await page.setViewportSize({width:320,height:800});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.addInitScript(({appearance,scale})=>{sessionStorage.setItem('ui.theme.mode',appearance);sessionStorage.setItem('ui.interface.scale',String(scale));},{appearance,scale});
 await page.goto('/login-react/?visualAcceptance&productName='+encodeURIComponent('轻舟企业研发协作与数据治理统一工作台'));
 await expect(submit(page)).toBeEnabled();await expect(page.locator('html')).toHaveCSS('font-size',16*scale+'px');await reachable(page,info,'v3-scale.png');
 await username(page).fill('retained-name');await password(page).fill('FAKE_V3_PASSWORD');await password(page).focus();await password(page).evaluate(node=>{node.setSelectionRange(2,6);window.v3Password=node;});
 await page.evaluate(()=>window.loginDemo.setScale(1));await settle(page);await expect(password(page)).toBeFocused();await expect(password(page)).toHaveValue('FAKE_V3_PASSWORD');expect(await password(page).evaluate(node=>[node===window.v3Password,node.selectionStart,node.selectionEnd])).toEqual([true,2,6]);
});

for(const appearance of ['light','dark','system'])test(`V3 ${appearance} 200% text long errors grow without remounting the form`,async({page},info)=>{
 await page.setViewportSize({width:390,height:640});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),appearance);await page.goto('/login-react/?visualAcceptance&longError');await expect(submit(page)).toBeEnabled();await page.evaluate(()=>{document.documentElement.style.fontSize='200%';window.v3Form=document.querySelector('form');});
 await reachable(page,info,'v3-text200.png');await username(page).fill('retained-name');await password(page).fill('FAKE_V3_PASSWORD');await page.evaluate(()=>window.loginDemo.setMode('login','credentials'));await submit(page).click();await expect(page.getByRole('alert')).toHaveText('用户名或密码不正确，请核对当前服务地址和账户来源后再试。'.repeat(6));
 expect(await page.evaluate(()=>window.v3Form===document.querySelector('form'))).toBe(true);await expect(username(page)).toHaveValue('retained-name');await expect(password(page)).toHaveValue('');await reachable(page,info,'v3-long-error.png');
});

test('V3 missing and changing host logo never remounts the form or invents a fallback',async({page})=>{
 await page.goto('/login-react/?visualAcceptance&logo=none');await expect(submit(page)).toBeEnabled();await expect(page.locator('.xui-login-logo')).toHaveCount(0);await expect(page.locator('.xui-login-identity')).toHaveText('轻舟工作台');
 await page.goto('/auth-page-react/?decorative');await expect(page.getByRole('heading',{name:'创建管理员',exact:true})).toBeVisible();await expect(page.locator('.xui-login-logo')).toHaveAttribute('alt','');await page.getByRole('textbox',{name:'管理员用户名',exact:true}).fill('retained');
 await page.evaluate(()=>{window.v3HostForm=document.querySelector('form');window.authPageDemo.update({logo:{src:'./mark.svg',alt:'原始宿主Logo'},productName:'更新后的宿主品牌'});});await expect(page.locator('.xui-login-logo')).toHaveAttribute('alt','原始宿主Logo');
 await page.evaluate(()=>window.authPageDemo.update({logo:undefined}));await expect(page.locator('.xui-login-logo')).toHaveCount(0);expect(await page.evaluate(()=>document.querySelector('form')===window.v3HostForm)).toBe(true);await expect(page.getByRole('textbox',{name:'管理员用户名',exact:true})).toHaveValue('retained');
});

for(const appearance of ['light','dark','system'])test(`V3 ${appearance} genuine Chrome zoom 200%`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});
 try{
  const page=await context.newPage();await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),appearance);await page.goto('http://127.0.0.1:4173/login-react/?visualAcceptance');await expect(submit(page)).toBeEnabled();
  const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);
  const after=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize,zoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.zoom).toBe('1');expect(after.pinch).toBe(1);
  await reachable(page,info,'v3-browser-zoom.png');await info.attach('v3-native-zoom.png',{body:await captureZoomViewport(page),contentType:'image/png'});await info.attach('v3-zoom.json',{body:JSON.stringify({before,after}),contentType:'application/json'});
 }finally{await context.close();}
});
