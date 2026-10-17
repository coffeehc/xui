import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const baseline=!!process.env.XUI_LAYOUT_BASELINE;
test.setTimeout(90000);
const errors=new WeakMap();
test.beforeEach(({page})=>{const list=[];errors.set(page,list);page.on('pageerror',error=>list.push(error.message));});
test.afterEach(({page})=>{expect(errors.get(page)).toEqual([]);});
const settle=page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
async function proof(info,name,{body,contentType}){
 const directory=resolve('.artifacts/public-fixes-4.2.14/browser-proof');await mkdir(directory,{recursive:true});
 const path=resolve(directory,name);await writeFile(path,body);await info.attach(name,{path,contentType});
}
async function setup(page,{mode='light',scale=1,toolbar=false,old=false}={}){
 await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.goto(`/public-layout-${old?'baseline-':process.env.XUI_LAYOUT_CANDIDATE==='quick'?'quick-':''}react/?mode=${mode}&scale=${scale}${toolbar?'&toolbar':''}`);await settle(page);
}
async function toolbarGeometry(page){return page.getByTestId('nested-toolbar').evaluate(root=>{
 const box=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
 return {input:box(root.querySelector('input')),actions:box(root.querySelector('.xui-search-toolbar-actions')),trigger:box(root.querySelector('.xui-search-toolbar-actions>button[aria-expanded]')),control:box(root.querySelector('[role="combobox"]')??root.querySelector('select')),refresh:box([...root.querySelectorAll('button')].find(node=>node.textContent==='刷新'))};
});}
async function sidebarGeometry(page){return page.locator('.xui-shell-drawer').evaluate(root=>{
 const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
 const body=root.querySelector('.xui-dialog-body'),aside=root.querySelector('aside'),label=[...root.querySelectorAll('.xui-navigation-label')].find(node=>node.textContent==='团队经理');
 return {drawer:rect(root),aside:rect(aside),body:rect(body),bodyPadding:['paddingTop','paddingRight','paddingBottom','paddingLeft'].map(name=>parseFloat(getComputedStyle(body)[name])),label:rect(label),labelFont:getComputedStyle(label).fontSize,labelLine:getComputedStyle(label).lineHeight,flow:aside.dataset.sidebarFlow??null,rootFont:getComputedStyle(document.documentElement).fontSize,overflow:document.documentElement.scrollWidth>innerWidth+1};
});}
test('4.2.13 baseline reproduces tall disclosure and compressed sidebar',async({page},info)=>{
 test.skip(!baseline);await page.setViewportSize({width:1440,height:900});await setup(page,{toolbar:true,old:true});const toolbar=await toolbarGeometry(page);
 await proof(info,'baseline-toolbar.png',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await page.setViewportSize({width:390,height:900});await setup(page,{scale:2,old:true});await page.getByRole('button',{name:'搜索会话',exact:true}).click();await settle(page);const sidebar=await sidebarGeometry(page);
 await proof(info,'baseline.json',{body:JSON.stringify({toolbar,sidebar}),contentType:'application/json'});
 expect(toolbar.trigger.height).toBeGreaterThan(toolbar.refresh.height*2);expect(sidebar.drawer.width).toBeLessThan(390);expect(sidebar.label.height).toBeGreaterThan(parseFloat(sidebar.labelLine)+1);
 await proof(info,'baseline-sidebar.png',{body:await page.screenshot(),contentType:'image/png'});await proof(info,'baseline.json',{body:JSON.stringify({toolbar,sidebar}),contentType:'application/json'});
});
for(const mode of ['light','dark','system']){
 test(`4.2.14 ${mode} toolbar multirow and labeled-control alignment`,async({page},info)=>{
  test.skip(baseline);
  for(const scale of [1,2])for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:900});await setup(page,{mode,scale,toolbar:true});const measured=await toolbarGeometry(page);
   expect(measured.trigger.height).toBeCloseTo(measured.refresh.height,0);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   const direct=page.getByTestId('direct-toolbar');const positions=await direct.evaluate(root=>{const select=root.querySelector('[role="combobox"]'),button=[...root.querySelectorAll('button')].find(node=>node.textContent==='刷新');return {a:select.getBoundingClientRect().bottom,b:button.getBoundingClientRect().bottom,y:select.getBoundingClientRect().y,by:button.getBoundingClientRect().y};});
   if(Math.abs(positions.y-positions.by)<measured.refresh.height)expect(Math.abs(positions.a-positions.b)).toBeLessThanOrEqual(1);
   const input=page.getByLabel('嵌套搜索',{exact:true});await input.fill('保留搜索草稿');const trigger=page.getByTestId('nested-toolbar').getByRole('button',{name:'更多筛选',exact:true});await trigger.focus();await page.keyboard.press('Enter');await expect(page.getByLabel('嵌套高级条件')).toBeVisible();await page.getByLabel('嵌套高级条件').fill('保留条件');await trigger.focus();await page.keyboard.press('Space');await expect(trigger).toBeFocused();await expect(input).toHaveValue('保留搜索草稿');
   if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');}
   await proof(info,`toolbar-${mode}-${width}-${scale}.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  }
 });
 test(`4.2.14 ${mode} sidebar width, regions, keyboard and resize continuity`,async({page},info)=>{
  test.skip(baseline);
  for(const scale of [1,2])for(const viewport of [{width:390,height:900},{width:320,height:900},{width:390,height:400}]){
   await page.setViewportSize(viewport);await setup(page,{mode,scale});const trigger=page.getByRole('button',{name:'搜索会话',exact:true});await trigger.click();await settle(page);const measured=await sidebarGeometry(page);
   expect(measured.drawer.width).toBeCloseTo(viewport.width,0);expect(measured.drawer.x).toBeCloseTo(0,0);expect(measured.overflow).toBe(false);expect(measured.bodyPadding).toEqual([0,0,0,0]);expect(measured.flow).toBe(scale===2||viewport.height===400?'whole':'split');
   expect(measured.label.width).toBeGreaterThanOrEqual(parseFloat(measured.labelFont)*4-1);expect(measured.label.height).toBeLessThanOrEqual(parseFloat(measured.labelLine)+1);
   const dialog=page.getByRole('dialog');const search=dialog.getByLabel('搜索会话名称');await search.fill('持续草稿');await search.evaluate(node=>{window.publicSidebarDraft=node;});
   for(const name of ['当前','插件会话','团队','已归档']){const tab=dialog.getByRole('tab',{name,exact:true});await tab.focus();await page.keyboard.press('Enter');await expect(tab).toHaveAttribute('aria-selected','true');await settle(page);const visible=await tab.evaluate(node=>{const r=node.getBoundingClientRect(),track=node.closest('.xui-shell-sidebar-tabs').getBoundingClientRect();return {ok:r.left>=track.left-1&&r.right<=track.right+1,left:r.left,right:r.right,trackLeft:track.left,trackRight:track.right,scroll:node.closest('.xui-shell-sidebar-tabs').scrollLeft};});expect(visible.ok,JSON.stringify({scale,viewport,name,...visible})).toBe(true);}
   await proof(info,`sidebar-tabs-${mode}-${viewport.width}-${viewport.height}-${scale}.png`,{body:await page.screenshot(),contentType:'image/png'});
   const branch=dialog.getByRole('button',{name:/(展开|收起) 研发团队/});await branch.focus();await page.keyboard.press('Space');await expect(branch).toHaveAttribute('aria-expanded','false');await page.keyboard.press('Enter');await expect(branch).toHaveAttribute('aria-expanded','true');
   await dialog.getByRole('link',{name:'团队经理',exact:true}).focus();await page.keyboard.press('Enter');await expect(dialog.getByRole('link',{name:'团队经理',exact:true})).toHaveAttribute('aria-current','page');
   await dialog.getByRole('button',{name:'配置团队',exact:true}).click();await expect(page.getByRole('status',{name:'操作次数'}).or(page.locator('output[aria-label="操作次数"]'))).toHaveText('1');
   await dialog.getByRole('link',{name:'团队经理',exact:true}).focus();await proof(info,`sidebar-selected-${mode}-${viewport.width}-${viewport.height}-${scale}.png`,{body:await page.screenshot(),contentType:'image/png'});
   const footer=dialog.getByRole('button',{name:/codex_setup/});await footer.focus();expect(await footer.evaluate(node=>{const r=node.getBoundingClientRect();return r.y>=0&&r.bottom<=innerHeight+1;})).toBe(true);
   await page.keyboard.press('Shift+Tab');await expect(dialog.getByRole('link',{name:'团队经理',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(footer).toBeFocused();await search.focus();await expect(search).toHaveValue('持续草稿');
   await proof(info,`sidebar-${mode}-${viewport.width}-${viewport.height}-${scale}.png`,{body:await page.screenshot(),contentType:'image/png'});await proof(info,`sidebar-${viewport.width}-${viewport.height}-${scale}.json`,{body:JSON.stringify(measured),contentType:'application/json'});
   await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await trigger.click();await expect(search).toHaveValue('持续草稿');await page.setViewportSize({width:1280,height:900});await expect(page.getByRole('dialog')).toBeHidden();await expect(page.getByLabel('搜索会话名称')).toHaveValue('持续草稿');expect(await page.getByLabel('搜索会话名称').evaluate(node=>node===window.publicSidebarDraft)).toBe(true);
  }
 });
}
for(const mode of ['light','dark','system'])test(`4.2.14 ${mode} genuine browser 200% zoom keeps public navigation usable`,async({},info)=>{
 test.skip(baseline);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=780,1000']});
 try{const page=await context.newPage();await setup(page,{mode});const before=await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth,font:getComputedStyle(document.documentElement).fontSize}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);const zoom=await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth,font:getComputedStyle(document.documentElement).fontSize,cssZoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(zoom.width).toBeCloseTo(before.width/2,0);expect(zoom.font).toBe(before.font);expect(zoom.cssZoom).toBe('1');expect(zoom.pinch).toBe(1);await proof(info,`browser-200-${mode}.json`,{body:JSON.stringify({before,zoom}),contentType:'application/json'});await page.getByRole('button',{name:'搜索会话',exact:true}).click();await settle(page);const measured=await sidebarGeometry(page);expect(measured.overflow).toBe(false);expect(measured.drawer.width).toBeCloseTo(await page.evaluate(()=>innerWidth),0);await page.getByRole('dialog').getByRole('button',{name:'关闭导航',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'搜索会话',exact:true})).toBeFocused();await proof(info,`browser-200-${mode}.png`,{body:await captureZoomViewport(page),contentType:'image/png'});}finally{await context.close();}
});
