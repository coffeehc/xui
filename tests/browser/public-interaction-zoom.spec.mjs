import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';

for(const name of ['calendar-month','menu-danger'])for(const kind of ['react','vanilla'])for(const mode of ['light','dark','system']){
 test(name+' '+kind+' '+mode+' genuine Chrome zoom 200%',async({},info)=>{
  test.setTimeout(60000);
  const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});
  try{
   const page=await context.newPage();await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>localStorage.setItem('ui.theme.mode',mode),mode);
   await page.goto('http://127.0.0.1:4173/'+name+'-'+kind+'/');
   const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));
   const settings=await context.newPage();await settings.goto('chrome://settings/appearance');
   await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();
   await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);
   const after=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize,cssZoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));
   expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.cssZoom).toBe('1');expect(after.pinch).toBe(1);
   if(name==='calendar-month') {
    await page.getByRole('button',{name:'定位年月'}).click();await expect(page.getByLabel('月份结果')).toHaveText('2020-01');
    const day=page.locator('.xui-calendar[aria-label="受控日期"]').getByRole('gridcell',{name:'2020-01-01',exact:true});await day.focus();await page.keyboard.press('ArrowRight');
    await expect(page.locator('.xui-calendar[aria-label="受控日期"]').getByRole('gridcell',{name:'2020-01-02',exact:true})).toBeFocused();
   } else {
    const trigger=page.getByRole('button',{name:'打开菜单'});await trigger.focus();await trigger.press('ArrowDown');await page.keyboard.press('ArrowDown');
    const danger=page.getByRole('menuitem',{name:'删除记录',exact:true});await expect(danger).toBeFocused();await expect(danger).toHaveCSS('outline-style','solid');
    await info.attach('danger-focus.png',{body:await captureZoomViewport(page),contentType:'image/png'});
    await page.keyboard.press('Enter');await expect(page.getByLabel('执行次数')).toHaveText('1');await expect(trigger).toBeFocused();
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await info.attach(name+'-'+kind+'-'+mode+'-zoom200.json',{body:JSON.stringify({before,after}),contentType:'application/json'});
   await info.attach(name+'-'+kind+'-'+mode+'-zoom200.png',{body:await captureZoomViewport(page),contentType:'image/png'});
  }finally{await context.close();}
 });
}
