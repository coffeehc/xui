import{test,expect,chromium}from'@playwright/test';
import{chromiumLaunchOptions}from'./chromium-launch-options.mjs';
import{captureZoomViewport}from'./zoom-capture.mjs';
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function configure(page,theme){await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);}
async function visit(page,{shell='shell',root200=false,rtl=false,long=false,mode='',segmented=false}={}){
 await page.goto(`/tabs-overlay-react/?sidebar=${shell}${long?'&long':''}${mode?'&'+mode:''}${segmented?'&segmented':''}`);
 if(root200)await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 if(rtl)await page.evaluate(()=>document.documentElement.dir='rtl');
 await page.waitForFunction(()=>window.tabsOverlayDemo);
 const trigger=page.getByRole('button',{name:'会话导航',exact:true});if(await page.evaluate(()=>matchMedia('(max-width:47.999rem)').matches)){await expect(trigger).toBeVisible();await trigger.click();}
 await expect(page.getByRole('tablist',{name:'会话范围'})).toBeVisible();await settle(page);
}
async function geometry(page){return page.getByRole('tablist',{name:'会话范围'}).evaluate(list=>{
 const rect=node=>{const r=node.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height};},header=list.closest('.xui-shell-sidebar-header'),selected=list.querySelector('[aria-selected=true]'),css=getComputedStyle(list);
 return {list:rect(list),header:rect(header),headerScrollHeight:header.scrollHeight,headerClientHeight:header.clientHeight,selected:rect(selected),headerBorder:getComputedStyle(header).borderBlockEndWidth,headerPadding:getComputedStyle(header).paddingBlockEnd,shadow:css.boxShadow,rows:new Set([...list.children].map(node=>node.getBoundingClientRect().top.toFixed(2))).size,tabs:[...list.querySelectorAll('[role=tab]')].map(node=>({selected:node.getAttribute('aria-selected'),weight:getComputedStyle(node).fontWeight,font:getComputedStyle(node).fontSize,border:getComputedStyle(node).borderBlockEndWidth,color:getComputedStyle(node).color,rect:rect(node)}))};
 });}
async function verify(page,info,{rtl=false,zoom=false}={}){
 const list=page.getByRole('tablist',{name:'会话范围'}),tabs=list.getByRole('tab'),search=page.getByRole('searchbox',{name:'搜索会话'});await search.fill('保留搜索草稿');
 if(!new URL(page.url()).searchParams.has('long'))await expect(tabs).toHaveText(['普通','团队','插件','已归档']);
 // MenuLayout puts Panels in main. Its narrow navigation is correctly modal;
 // inspect/edit main only after closing it, then reopen the retained sidebar.
 const outsidePanel=new URL(page.url()).searchParams.get('sidebar')==='menu'&&await page.getByRole('dialog').isVisible();
 const withPanel=async operation=>{if(outsidePanel){await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();}await operation();if(outsidePanel){await page.getByRole('button',{name:'会话导航',exact:true}).click();await expect(list).toBeVisible();}};
 await list.evaluate(node=>{window.baselineNodes={list:node,panels:[...document.querySelectorAll('[role=tabpanel]')],inputs:[...document.querySelectorAll('[role=tabpanel] input')]};});
 const observations=[];
 for(const tab of await tabs.all()){
  await tab.click();await expect(tab).toHaveAttribute('aria-selected','true');await withPanel(async()=>{const panel=page.getByRole('tabpanel').filter({visible:true});await panel.getByRole('textbox').fill('对应Panel保留的草稿');await panel.getByRole('region').evaluate(node=>node.scrollTop=70);});
  const measured=await geometry(page);expect(measured.headerBorder).toBe('0px');expect(measured.headerPadding).toBe('0px');expect(measured.shadow).not.toBe('none');expect(measured.list.width).toBeCloseTo(measured.header.width,1);if(measured.headerScrollHeight<=measured.headerClientHeight+1)expect(measured.header.bottom).toBeCloseTo(measured.list.bottom,2);
  for(const item of measured.tabs){expect(item.weight).toBe(item.selected==='true'?'600':'400');expect(parseFloat(item.border)).toBeGreaterThan(0);}
  if(measured.rows===1)expect(measured.selected.bottom).toBeCloseTo(measured.list.bottom,2);else expect(measured.selected.bottom).toBeLessThanOrEqual(measured.list.bottom+.01);
  observations.push(measured);
 }
 const singleRows=observations.filter(item=>item.rows===1);if(singleRows.length===observations.length)for(const item of singleRows){expect(item.list.height).toBeCloseTo(singleRows[0].list.height,2);expect(item.header.bottom).toBeCloseTo(singleRows[0].header.bottom,2);}
 for(const tab of await tabs.all()){
  await tab.click();await withPanel(async()=>{const panel=page.getByRole('tabpanel').filter({visible:true});await expect(panel.getByRole('textbox')).toHaveValue('对应Panel保留的草稿');expect(await panel.getByRole('region').evaluate(node=>node.scrollTop)).toBe(70);});
  expect(await list.evaluate(node=>window.baselineNodes.list===node&&window.baselineNodes.panels.every((panel,index)=>panel===document.querySelectorAll('[role=tabpanel]')[index])&&window.baselineNodes.inputs.every((input,index)=>input===document.querySelectorAll('[role=tabpanel] input')[index]))).toBe(true);
 }
 await tabs.nth(0).focus();await page.keyboard.press(rtl?'ArrowLeft':'ArrowRight');await expect(tabs.nth(1)).toBeFocused();await page.keyboard.press('End');await expect(tabs.nth(3)).toBeFocused();await page.keyboard.press('Home');await expect(tabs.nth(0)).toBeFocused();await expect(tabs.nth(0)).toHaveCSS('outline-style','solid');await expect(tabs.nth(0)).toBeInViewport();await expect(search).toHaveValue('保留搜索草稿');
 await page.keyboard.press('Enter');await expect(tabs.nth(0)).toHaveAttribute('aria-selected','true');await tabs.nth(0).hover();await expect(tabs.nth(0)).toHaveAttribute('aria-selected','true');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await info.attach('shared-baseline.json',{body:JSON.stringify(observations),contentType:'application/json'});await info.attach('shared-baseline.png',{body:zoom?await captureZoomViewport(page):await page.screenshot(),contentType:'image/png'});
 const dialog=page.getByRole('dialog');if(await dialog.isVisible()){await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(page.getByRole('button',{name:'会话导航',exact:true})).toBeFocused();}
}
for(const theme of['light','dark','system'])for(const shell of['shell','menu'])for(const scenario of[{width:1280},{width:1280,rtl:true},{width:390,rtl:true,root200:true,long:true}])test(`shared baseline ${theme} ${shell} ${JSON.stringify(scenario)}`,async({page},info)=>{
 await configure(page,theme);await page.setViewportSize({width:scenario.width,height:1000});await visit(page,{shell,...scenario,mode:shell==='shell'?'controlled':'injected'});await verify(page,info,scenario);
 if(theme==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');}
});
for(const theme of['light','dark','system'])for(const shell of['shell','menu'])test(`segmented header ${theme} ${shell} retains the shell separator`,async({page})=>{
 await configure(page,theme);await page.setViewportSize({width:1280,height:1000});await visit(page,{shell,segmented:true});const measured=await geometry(page);expect(parseFloat(measured.headerBorder)).toBeGreaterThan(0);expect(parseFloat(measured.headerPadding)).toBeGreaterThan(0);expect(measured.shadow).toBe('none');await expect(page.getByRole('tablist')).toHaveAttribute('data-variant','segmented');
});
for(const theme of['light','dark','system'])test(`genuine Chrome zoom200 shared baseline ${theme}`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,1000']});try{
  const page=await context.newPage();await configure(page,theme);await page.goto('http://127.0.0.1:4173/tabs-overlay-react/');const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize})),settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);expect(await page.evaluate(()=>innerWidth)).toBeCloseTo(before.width/2,0);expect(await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize)).toBe(before.font);expect(await page.evaluate(()=>getComputedStyle(document.documentElement).zoom)).toBe('1');expect(await page.evaluate(()=>visualViewport.scale)).toBe(1);
  for(const shell of['shell','menu']){await visit(page,{shell,mode:'controlled'});await verify(page,info,{zoom:true});}
 }finally{await context.close();}
});
