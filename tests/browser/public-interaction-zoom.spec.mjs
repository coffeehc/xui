import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';

for(const name of ['calendar-month','menu-danger','row-events','date-time','rich-navigation'])for(const kind of ['react','vanilla'])for(const mode of ['light','dark','system']){
 test(name+' '+kind+' '+mode+' genuine Chrome zoom 200%',async({},info)=>{
  test.setTimeout(60000);
  const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});
  try{
   const page=await context.newPage();await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);
   await page.goto('http://127.0.0.1:4173/'+name+'-'+kind+'/');
   const before=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));
   const settings=await context.newPage();await settings.goto('chrome://settings/appearance');
   await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();
   await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);
   const after=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize,cssZoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));
   expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.cssZoom).toBe('1');expect(after.pinch).toBe(1);
   if(name==='calendar-month') {
    await page.getByRole('button',{name:'定位年月'}).click();await expect(page.getByLabel('月份结果')).toHaveText('2020-01');
    const day=page.locator('.xui-calendar[aria-label="受控日期"]').getByRole('gridcell',{name:'2020-01-01',exact:true});await day.focus();await page.keyboard.press('ArrowRight');
    await expect(page.locator('.xui-calendar[aria-label="受控日期"]').getByRole('gridcell',{name:'2020-01-02',exact:true})).toBeFocused();
   } else if(name==='menu-danger') {
    const trigger=page.getByRole('button',{name:'打开菜单'});await trigger.focus();await trigger.press('ArrowDown');await page.keyboard.press('ArrowDown');
    const danger=page.getByRole('menuitem',{name:'删除记录',exact:true});await expect(danger).toBeFocused();await expect(danger).toHaveCSS('outline-style','solid');
    await info.attach('danger-focus.png',{body:await captureZoomViewport(page),contentType:'image/png'});
    await page.keyboard.press('Enter');await expect(page.getByLabel('执行次数')).toHaveText('1');await expect(trigger).toBeFocused();
   }
   if(name==='rich-navigation') {
    await page.getByRole('button',{name:'工作导航',exact:true}).click();
    const toggle=page.locator('[data-menu-id="project-alpha"][data-menu-control="toggle"]');
    await toggle.focus();await page.keyboard.press('ArrowRight');
    await expect(toggle).toHaveAttribute('aria-expanded','true');
    await page.evaluate(()=>window.navigationLabelsDemo.update({expandBranchLabel:item=>`展开 ${item.label}`,collapseBranchLabel:item=>`收起 ${item.label}`}));
    await expect(toggle).toHaveAccessibleName('收起 跨区域协作与知识交付项目：保留完整中文名称、负责人及当前业务状态');
    await expect(toggle).toBeFocused();await expect(toggle).toHaveCSS('outline-style','solid');
    await info.attach('navigation-branch-focus.png',{body:await captureZoomViewport(page),contentType:'image/png'});
    const geometry=await toggle.evaluate(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,outline:s.outline,viewport:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth}};});
    expect(geometry.width).toBeGreaterThan(0);expect(geometry.height).toBeGreaterThan(0);expect(geometry.x).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(after.width+1);expect(geometry.bottom).toBeLessThanOrEqual(after.height+1);expect(geometry.viewport.scrollWidth).toBeLessThanOrEqual(geometry.viewport.width+1);
    await page.keyboard.press('ArrowLeft');await expect(toggle).toHaveAttribute('aria-expanded','false');
   }
   if(name==='date-time') {
    const trigger=page.getByRole('button',{name:'选择日期时间 开始日期时间'});await trigger.click();
    const dialog=page.getByRole('dialog');await expect(dialog.getByRole('heading')).toBeFocused();
    await dialog.getByRole('gridcell',{name:'2020-02-29',exact:true}).focus();await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('gridcell',{name:'2020-03-01',exact:true})).toBeFocused();
    await dialog.getByRole('button',{name:'取消',exact:true}).click();await expect(trigger).toBeFocused();
   }
   if(name==='row-events') {
    const nameButton=page.getByRole('button',{name:'打开 row-1',exact:true});await nameButton.focus();await page.keyboard.press('Enter');await expect(page.getByLabel('事件结果')).toContainText('cell 1');await expect(nameButton).toBeFocused();
    const body=page.locator('.xui-data-table-body');await body.evaluate(el=>el.scrollLeft=el.scrollWidth);expect(await body.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await info.attach(name+'-'+kind+'-'+mode+'-zoom200.json',{body:JSON.stringify({before,after}),contentType:'application/json'});
   await info.attach(name+'-'+kind+'-'+mode+'-zoom200.png',{body:await captureZoomViewport(page),contentType:'image/png'});
  }finally{await context.close();}
 });
}
