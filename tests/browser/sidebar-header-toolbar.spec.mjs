import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';

for(const theme of ['light','dark','system'])for(const [width,text] of [[1280,1],[390,1],[390,2]])for(const names of ['actions','long'])test(`${theme} width${width} text${text} sidebarHeader Toolbar ${names}`,async({page},info)=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);
 await page.goto(`/sidebar-footer-react/?composition=shell&header=${names}&row&list=long`);await page.waitForFunction(()=>window.sidebarFooterDemo);
 if(text!==1)await page.evaluate(value=>document.documentElement.style.setProperty('--font-scale',String(value)),text);
 if(width<768)await page.getByRole('button',{name:'工作导航',exact:true}).click();
 const header=page.getByTestId('sidebar-header-tools');await expect(header).toBeVisible();const buttons=header.getByRole('button');await expect(buttons).toHaveCount(3);
 const metrics=await header.evaluate(root=>{const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};},header=root.closest('.xui-shell-sidebar-header'),menu=header.nextElementSibling,sidebar=header.closest('aside');return {header:rect(header),sidebar:rect(sidebar),menu:rect(menu),menuMin:parseFloat(getComputedStyle(menu).minBlockSize),buttons:[...root.querySelectorAll('button')].map(n=>({...rect(n),font:getComputedStyle(n).fontSize,line:getComputedStyle(n).lineHeight,weight:getComputedStyle(n).fontWeight})),overflow:root.scrollWidth-root.clientWidth};});
 for(const item of metrics.buttons){expect(item.font).toBe(`${14*text}px`);expect(item.line).toBe(`${22*text}px`);expect(item.weight).toBe('500');if(names==='actions')expect(item.width).toBeLessThan(metrics.header.width-1);else expect(item.width).toBeLessThanOrEqual(metrics.header.width+1);}
 if(width===1280&&names==='actions'){expect(metrics.sidebar.width).toBeCloseTo(240,1);expect(new Set(metrics.buttons.map(b=>b.y)).size).toBe(1);}
 expect(metrics.header.height).toBeLessThanOrEqual(metrics.sidebar.height/2+1);expect(metrics.menu.height).toBeGreaterThanOrEqual(metrics.menuMin-1);expect(metrics.overflow).toBeLessThanOrEqual(1);
 for(const button of await buttons.all()){await button.focus();await expect(button).toBeInViewport();expect(await button.evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return n===hit||n.contains(hit);})).toBe(true);await page.keyboard.press('Enter');await expect(button).toBeFocused();}
 const footer=page.getByTestId('footer-action');await footer.focus();await expect(footer).toBeInViewport();await expect(footer).toHaveCSS('font-size',`${14*text}px`);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await info.attach('header-layout.json',{body:JSON.stringify(metrics,null,2),contentType:'application/json'});await info.attach('header.png',{body:await page.screenshot(),contentType:'image/png'});
 if(width<768){await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'工作导航',exact:true})).toBeFocused();}
});

for(const theme of ['light','dark','system'])for(const [width,text] of [[1280,1],[390,2]])test(`${theme} width${width} text${text} sidebarHeader respects host width choices`,async({page},info)=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);
 const observations=[];
 for(const kind of ['direct','content','full','business']){
  await page.goto(`/sidebar-footer-react/?composition=shell&header=${kind}&row`);await page.waitForFunction(()=>window.sidebarFooterDemo);if(text===2)await page.evaluate(()=>document.documentElement.style.setProperty('--font-scale','2'));if(width<768)await page.getByRole('button',{name:'工作导航',exact:true}).click();
  const header=page.locator('.xui-shell-sidebar-header'),buttons=header.getByRole('button');await expect(buttons).toHaveCount(kind==='business'?3:1);
  const geometry=await header.evaluate(root=>({width:root.clientWidth,buttons:[...root.querySelectorAll('button')].map(n=>({width:n.getBoundingClientRect().width,inline:n.style.width,font:getComputedStyle(n).fontSize}))}));
  for(const item of geometry.buttons){expect(item.font).toBe(`${14*text}px`);if(kind==='full'){expect(Math.abs(item.width-geometry.width)).toBeLessThanOrEqual(1);expect(item.inline).toBe('100%');}else expect(item.width).toBeLessThan(geometry.width-1);}
  for(const button of await buttons.all()){await button.focus();await expect(button).toBeInViewport();await page.keyboard.press('Enter');await expect(button).toBeFocused();}
  observations.push({kind,...geometry});
 }
 await info.attach('host-width-choices.json',{body:JSON.stringify(observations,null,2),contentType:'application/json'});
});

for(const theme of ['light','dark','system'])test(`${theme} sidebar actions and Tabs at actual zoom200`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,1000']});
 try{
  const page=await context.newPage();await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);
  await page.goto('http://127.0.0.1:4173/sidebar-footer-react/?composition=shell&header=tabs&row');await page.waitForFunction(()=>window.sidebarFooterDemo);
  const before=await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth})),settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();
  await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);expect(await page.evaluate(()=>innerWidth)).toBeCloseTo(before.width/2,0);
  const trigger=page.getByRole('button',{name:'工作导航',exact:true});await trigger.click();const panel=page.locator('.xui-shell-sidebar-menu [role="tabpanel"]:visible');await expect(panel).toHaveCSS('padding-block-start','0px');
  for(const button of await page.getByTestId('sidebar-header-tools').getByRole('button').all()){await button.focus();await expect(button).toBeInViewport();await expect(button).toHaveCSS('font-size','14px');await page.keyboard.press('Enter');await expect(button).toBeFocused();}
  await page.getByRole('tab',{name:'已归档',exact:true}).click();await panel.locator('.xui-nav-item').first().focus();await expect(panel.locator('.xui-nav-item').first()).toBeInViewport();await page.getByTestId('footer-action').focus();await expect(page.getByTestId('footer-action')).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await info.attach('actual-zoom-sidebar.png',{body:await page.screenshot(),contentType:'image/png'});await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
 }finally{await context.close();}
});

for(const theme of ['light','dark','system'])for(const [width,text] of [[1280,1],[390,2]])test(`${theme} width${width} text${text} sidebar Tabs inherit compact slot spacing`,async({page},info)=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);
 await page.goto('/sidebar-footer-react/?composition=shell&header=tabs&row');await page.waitForFunction(()=>window.sidebarFooterDemo);
 if(text!==1)await page.evaluate(value=>document.documentElement.style.setProperty('--font-scale',String(value)),text);
 if(width<768)await page.getByRole('button',{name:'工作导航',exact:true}).click();
 const search=page.getByRole('searchbox',{name:'搜索会话'}).or(page.getByRole('textbox',{name:'搜索会话'}));await search.fill('仍保留的搜索草稿');await search.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await expect(search).toBeFocused();await expect(search).toHaveCSS('outline-style','solid');expect(await search.evaluate(n=>parseFloat(getComputedStyle(n).outlineOffset))).toBeLessThan(0);
 const geometry=async()=>page.locator('.xui-shell-sidebar-menu [role="tabpanel"]:visible').evaluate(panel=>{
  const sidebar=panel.closest('aside'),header=sidebar.querySelector('.xui-shell-sidebar-header'),list=header.querySelector('[role=tablist]'),first=panel.querySelector('.xui-nav-item'),rect=n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};return {header:rect(header),list:rect(list),first:rect(first),panel:rect(panel),headerPadding:getComputedStyle(header).paddingBlockEnd,headerMargin:getComputedStyle(header).marginBlockEnd,padding:getComputedStyle(panel).paddingBlockStart,endPadding:getComputedStyle(panel).paddingBlockEnd,gap:first.getBoundingClientRect().top-list.getBoundingClientRect().bottom,expected:parseFloat(getComputedStyle(header).paddingBlockEnd)+parseFloat(getComputedStyle(header).marginBlockEnd)+parseFloat(getComputedStyle(header).borderBottomWidth)};
 });
 const before=await geometry();expect(before.headerPadding).toBe('4px');expect(before.headerMargin).toBe('4px');expect(before.padding).toBe('0px');expect(before.endPadding).toBe('0px');expect(before.gap).toBeCloseTo(before.expected,1);
 await page.getByRole('tab',{name:'当前',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'已归档',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(page.getByRole('tab',{name:'已归档',exact:true})).toHaveAttribute('aria-selected','true');
 const after=await geometry();expect(after.gap).toBeCloseTo(after.expected,1);await expect(search).toHaveValue('仍保留的搜索草稿');
 const first=page.locator('.xui-shell-sidebar-menu [role="tabpanel"]:visible .xui-nav-item').first();await first.focus();await expect(first).toBeInViewport();await expect(first).toHaveCSS('outline-style','solid');
 await page.getByTestId('footer-action').focus();await expect(page.getByTestId('footer-action')).toBeInViewport();await info.attach('sidebar-tabs.json',{body:JSON.stringify({before,after}),contentType:'application/json'});await info.attach('sidebar-tabs.png',{body:await page.screenshot(),contentType:'image/png'});
 // The ordinary page Tabs.Panel keeps its content spacing.
 await page.goto('/typography-slots-react/');await expect(page.getByRole('tabpanel')).toHaveCSS('padding-block-start','12px');
});
