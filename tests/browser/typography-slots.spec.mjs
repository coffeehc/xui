import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';

// The expected roles come from DESIGN, not from the selector declarations.
const roles={tab:[14,22,400,'sans'],body:[14,22,400,'sans'],control:[14,22,500,'sans'],meta:[13,20,400,'sans'],label:[13,20,500,'sans'],page:[20,28,600,'heading'],section:[16,26,600,'heading'],'body-heading':[14,22,600,'sans'],'meta-heading':[13,20,600,'heading'],metric:[24,28,600,'mono'],code:[14,22,400,'mono']};
const normalize=value=>value.replace(/["'\s]/g,'').toLowerCase();
async function inspect(page,info,label,{controlWeight=500}={}){
 const records=await page.evaluate(()=>{
  const root=getComputedStyle(document.documentElement),fonts=Object.fromEntries(['sans','mono','heading'].map(name=>[name,root.getPropertyValue(`--font-${name}`)]));
  const read=(node,id,role)=>{const s=getComputedStyle(node);return {id,role,selected:node.getAttribute('aria-selected')==='true',tag:node.tagName,family:s.fontFamily,size:s.fontSize,line:s.lineHeight,weight:s.fontWeight};};
  const items=[...document.querySelectorAll('[data-type-role]')].filter(n=>n.getClientRects().length).map(n=>read(n,n.dataset.typeId,n.dataset.typeRole));
  // Include library-generated parts; consumers do not need to label or style these.
  for(const [selector,role] of Object.entries({'.xui-card-title':'section','.xui-card-description':'body','.xui-card-meta':'meta','.xui-badge':'label','.xui-calendar-header>strong':'body-heading','.xui-calendar-day':'control','.xui-calendar-weekday':'meta','.xui-menu-group-title':'meta-heading','.xui-nav-item':'control','.xui-pagination>span':'meta','.xui-data-table-count':'meta','.xui-copyable-status':'meta','.xui-image-placeholder':'body'})){
   document.querySelectorAll(selector).forEach((n,i)=>{if(n.getClientRects().length)items.push(read(n,`${selector}[${i}]`,role));});
  }
  return {items,fonts,root:parseFloat(root.fontSize),text:parseFloat(root.getPropertyValue('--font-scale'))||1,theme:document.documentElement.dataset.themeEffective,zoom:root.zoom,width:innerWidth,documentWidth:document.documentElement.scrollWidth};
 });
 expect(records.items.length).toBeGreaterThan(85);
 for(const item of records.items){
  const [size,line,weight,font]=roles[item.role],factor=records.root/16*records.text;
  expect(parseFloat(item.size),`${item.id} size`).toBeCloseTo(size*factor,1);
  expect(item.line,`${item.id} line`).toBe(item.tag==='SELECT'?'normal':`${line*factor}px`);
  expect(Number(item.weight),`${item.id} weight`).toBe(item.role==='tab'&&item.selected?600:weight===500?controlWeight:weight);
  expect(normalize(item.family),`${item.id} family`).toBe(normalize(records.fonts[font]));
 }
 expect(records.documentWidth).toBeLessThanOrEqual(records.width+1);expect(records.zoom).toBe('1');
 await info.attach(`${label}-font-matrix.json`,{body:JSON.stringify(records,null,2),contentType:'application/json'});
 return records;
}
async function open(page,{theme='light',width=1280,text=1,scale=1}={}){
 await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(({theme,scale})=>{sessionStorage.setItem('ui.theme.mode',theme);sessionStorage.setItem('ui.interface.scale',String(scale));},{theme,scale});
 await page.goto('/typography-slots-react/');await page.evaluate(()=>document.fonts.ready);
 if(text!==1)await page.evaluate(value=>document.documentElement.style.setProperty('--font-scale',String(value)),text);
 await expect(page.locator('[data-type-id="page-title"]')).toBeVisible();
}
async function overlays(page,info){
 for(const name of ['打开对话框','打开抽屉']){
  const trigger=page.getByRole('button',{name,exact:true});await trigger.click();const panel=page.getByRole('dialog');await expect(panel).toBeVisible();await inspect(page,info,name);
  const draft=panel.getByRole('textbox',{name:'弹层草稿'});await draft.fill('放大后依然完整的中文草稿');await draft.focus();
  const close=panel.getByRole('button',{name:'关闭面板'});await close.focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await expect(close).toBeFocused();await expect(close).toBeInViewport();await expect(close).toHaveCSS('outline-style','solid');
  expect(await panel.evaluate(n=>n.scrollWidth<=n.clientWidth+1)).toBe(true);
  await info.attach(`${name}.png`,{body:await page.screenshot(),contentType:'image/png'});
  await page.keyboard.press('Enter');await expect(panel).not.toBeVisible();await expect(trigger).toBeFocused();
 }
}
for(const theme of ['light','dark','system'])for(const [width,text,scale] of [[1280,1,1],[390,1,1],[1280,2,1],[390,2,1],[390,1,2]])test(`${theme} width${width} text${text} interface${scale} public typography slots`,async({page},info)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await open(page,{theme,width,text,scale});await inspect(page,info,'default');
 await page.getByRole('button',{name:'复制标识',exact:true}).click();await expect(page.locator('.xui-copyable-status')).toHaveText('已复制');await inspect(page,info,'copied');
 await overlays(page,info);
 await page.getByRole('button',{name:'打开菜单',exact:true}).click();await expect(page.locator('[data-type-id="menu-item"]')).toBeVisible();await inspect(page,info,'menu');await page.keyboard.press('Escape');
 const context=page.getByText('右键记录区域',{exact:true});await context.click({button:'right'});await expect(page.locator('[data-type-id="context-item"]')).toBeVisible();await inspect(page,info,'context-menu');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'显示通知',exact:true}).click();await expect(page.locator('[data-type-id="toast-title"]')).toBeVisible();await inspect(page,info,'toast');await page.keyboard.press('F6');await page.getByRole('button',{name:'关闭通知',exact:true}).click();
 const tooltip=page.getByRole('button',{name:'查看简短说明',exact:true});await tooltip.focus();await tooltip.hover();await expect(page.locator('[data-type-id="tooltip"]')).toBeVisible();await inspect(page,info,'tooltip');await page.keyboard.press('Tab');
 await page.evaluate(()=>document.documentElement.style.setProperty('--font-weight-control','700'));await inspect(page,info,'semantic-weight-update',{controlWeight:700});
 if(theme==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');await inspect(page,info,'system-light',{controlWeight:700});}
 await page.locator('[data-type-id="page-title"]').scrollIntoViewIfNeeded();await info.attach('page.png',{body:await page.screenshot(),contentType:'image/png'});expect(errors).toEqual([]);
});
for(const theme of ['light','dark','system'])test(`${theme} actual browser zoom200 keeps typography roles and overlay focus`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,1100']});
 try{
  const page=await context.newPage();await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);await page.goto('http://127.0.0.1:4173/typography-slots-react/');
  const before=await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth})),settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();
  await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);expect(await page.evaluate(()=>innerWidth)).toBeCloseTo(before.width/2,0);await inspect(page,info,'actual-zoom');await overlays(page,info);
 }finally{await context.close();}
});
