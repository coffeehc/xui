import {test,expect} from '@playwright/test';

for(const kind of ['react'])for(const family of ['menu','context']){
 const triggerName=family==='menu'?'打开菜单':'右键菜单';
 const open=async page=>{const trigger=page.getByRole('button',{name:triggerName,exact:true});await trigger.focus();await trigger.press(family==='menu'?'ArrowDown':'Shift+F10');await expect(page.getByRole('menu')).toBeVisible();await page.keyboard.press('Home');await expect(page.getByRole('menuitem',{name:'查看记录',exact:true})).toBeFocused();return trigger;};
 test(kind+' '+family+' danger default/hover/pressed/keyboard/disabled and focus restoration',async({page})=>{
  await page.goto('/menu-danger-'+kind+'/');const trigger=await open(page),popup=page.getByRole('menu'),danger=popup.getByRole('menuitem',{name:'删除记录',exact:true}),disabled=popup.getByRole('menuitem',{name:'禁止删除',exact:true});
  const normal=popup.getByRole('menuitem',{name:'查看记录',exact:true});
  const color=await danger.evaluate(el=>getComputedStyle(el).color);expect(color).not.toBe(await normal.evaluate(el=>getComputedStyle(el).color));
  await danger.hover();const hover=await danger.evaluate(el=>getComputedStyle(el).backgroundColor);expect(hover).not.toBe('rgba(0, 0, 0, 0)');
  await expect(danger.locator('svg')).toHaveCSS('color',color);
  const box=await danger.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  await expect.poll(()=>danger.evaluate(el=>getComputedStyle(el).color)).not.toBe(color);await page.mouse.up();await expect(popup).not.toBeVisible();await expect(page.getByLabel('执行次数')).toHaveText('1');
  await expect(trigger).toBeFocused();await open(page);await disabled.click({force:true});await expect(page.getByLabel('执行次数')).toHaveText('1');await expect(popup).toBeVisible();
  expect(await disabled.evaluate(el=>getComputedStyle(el).color)).not.toBe(color);
  await normal.focus();await page.keyboard.press('ArrowDown');await expect(danger).toBeFocused();
  await expect(danger).toHaveCSS('outline-style','none');await page.keyboard.press('ArrowDown');
  // The disabled item remains readable and rejects execution without closing the menu.
  await expect(disabled).toBeFocused();await page.keyboard.press('Enter');await page.keyboard.press('Space');await expect(page.getByLabel('执行次数')).toHaveText('1');await expect(popup).toBeVisible();
  await page.keyboard.press('Escape');await expect(popup).not.toBeVisible();await expect(trigger).toBeFocused();
 });
 for(const mode of ['light','dark','system'])for(const width of [1280,390])test(kind+' '+family+' '+mode+' '+width+' long menu at 200% text scrolls and restores focus',async({page},info)=>{
  await page.setViewportSize({width,height:800});await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);
  await page.goto('/menu-danger-'+kind+'/?long');await page.evaluate(()=>document.documentElement.style.fontSize='200%');const trigger=await open(page),popup=page.getByRole('menu');
  await page.keyboard.press('ArrowDown');const danger=popup.locator('[data-tone="danger"]').first();await expect(danger).toBeFocused();
  const bounds=await danger.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+1);
  await info.attach(kind+'-'+family+'-'+mode+'-'+width+'.png',{body:await page.screenshot(),contentType:'image/png'});
  await page.keyboard.press('End');await expect(popup.getByRole('menuitem',{name:'其他操作 35',exact:true})).toBeFocused();
  expect(await popup.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
 });
}
for(const kind of ['react'])test(kind+' system theme changes an open danger menu without losing keyboard focus or execution state',async({page})=>{
 await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.addInitScript(()=>sessionStorage.setItem('ui.theme.mode','system'));await page.goto('/menu-danger-'+kind+'/');
 const trigger=page.getByRole('button',{name:'打开菜单'});await trigger.focus();await trigger.press('ArrowDown');await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');
 const danger=page.getByRole('menuitem',{name:'删除记录',exact:true});await expect(danger).toBeFocused();
 const dark=await danger.evaluate(el=>getComputedStyle(el).color);
 await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');await expect(danger).toBeFocused();
 await expect.poll(()=>danger.evaluate(el=>getComputedStyle(el).color)).not.toBe(dark);await expect(page.getByLabel('执行次数')).toHaveText('0');
 await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');await expect(danger).toBeFocused();
});
