import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';

test('bootstrap merges defaults once; History navigation preserves mounted drafts, language changes update public menu and title',async({page})=>{
 const requests=[];page.on('request',request=>requests.push(request.url()));
 await page.goto('/bootstrap-react/tasks');
 const input=page.getByRole('textbox',{name:'任务名称'});await input.fill('跨路由保留');
 await page.evaluate(()=>window.documentIdentity={});
 const same=await page.evaluate(()=>{const {app,repeat}=window.bootstrapDemo;const next=repeat();return {http:app.services.getHttpService()===next.services.getHttpService(),menu:app.services.getMenuService()===next.services.getMenuService(),auth:app.config.auth.enabled,timeout:app.config.http.timeoutMs};});
 expect(same).toEqual({http:true,menu:true,auth:false,timeout:15000});
 await page.getByRole('link',{name:'偏好设置',exact:true}).click();await expect(page).toHaveURL(/\/bootstrap-react\/settings$/);await expect(input).toHaveValue('跨路由保留');
 expect(await page.evaluate(()=>!!window.documentIdentity)).toBe(true);
 await page.goBack();await expect(page).toHaveURL(/\/bootstrap-react\/tasks$/);await expect(input).toHaveValue('跨路由保留');
 await page.getByRole('combobox',{name:'语言'}).click();await page.getByRole('option',{name:'English',exact:true}).click();
 await expect(page.getByRole('link',{name:'Preferences',exact:true})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(page.getByRole('textbox',{name:'Task name'})).toHaveValue('跨路由保留');
 expect(requests.filter(url=>/\/api\/|config\.json/.test(url))).toEqual([]);
 const conflict=await page.evaluate(()=>{try{window.bootstrapDemo.conflict();return false;}catch{return true;}});expect(conflict).toBe(true);
 await page.reload();await expect(page.getByRole('heading',{name:'研究任务',exact:true}).first()).toBeVisible();
});

for(const theme of ['light','dark','system'])for(const viewport of [{width:1280,height:800},{width:390,height:740}])test(`bootstrap ${theme} ${viewport.width}: config menu, session preference and 200% text`,async({page},info)=>{
 await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
 await page.addInitScript(theme=>{sessionStorage.setItem('ui.theme.mode',theme);sessionStorage.setItem('ui.interface.scale','1.25');},theme);
 await page.goto('/bootstrap-react/tasks');await expect(page.locator('html')).toHaveAttribute('data-theme',theme);await expect(page.locator('html')).toHaveAttribute('data-interface-scale','1.25');
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 const narrow=await page.evaluate(()=>matchMedia('(max-width: 47.999rem)').matches);
 const toggle=page.getByRole('button',{name:'导航',exact:true});
 if(narrow)await toggle.click();
 const link=page.getByRole('link',{name:'面向研发团队的跨年度独立研究任务与观察窗口',exact:true});await expect(link).toBeVisible();await link.focus();await expect(link).toBeFocused();
 await info.attach('bootstrap-menu.png',{body:await page.screenshot(),contentType:'image/png'});
 if(narrow){await page.keyboard.press('Escape');await expect(toggle).toBeFocused();}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('bootstrap public menu remains reachable at real browser 200% zoom',async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});
 try{const page=await context.newPage();await page.goto('http://127.0.0.1:4173/bootstrap-react/tasks');const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);
  await page.getByRole('button',{name:'导航',exact:true}).click();const link=page.getByRole('link',{name:'偏好设置',exact:true});await link.focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/bootstrap-react\/settings$/);await expect(page.getByRole('textbox',{name:'任务名称'})).toBeVisible();
  await info.attach('bootstrap-real-zoom.png',{body:await captureZoomViewport(page),contentType:'image/png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }finally{await context.close();}
});
