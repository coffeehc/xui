import {test,expect} from '@playwright/test';
const result=page=>page.getByLabel('日期时间结果');
const input=page=>page.locator('input#start');
const trigger=page=>page.getByRole('button',{name:/^选择日期时间 开始日期时间/});
const dialog=page=>page.getByRole('dialog');
async function choose(page,part,value){await dialog(page).getByRole('combobox',{name:part,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();}
for(const kind of ['react','vanilla']){
 test(kind+' keyboard date and minute selection has one callback and restores focus',async({page})=>{
  await page.goto('/date-time-'+kind+'/');await trigger(page).focus();await page.keyboard.press('Enter');await expect(dialog(page).getByRole('heading')).toBeFocused();
  await dialog(page).getByRole('gridcell',{name:'2020-02-29',exact:true}).focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
  const hour=dialog(page).getByRole('combobox',{name:'小时',exact:true});await hour.focus();await page.keyboard.press('Enter');await expect(page.getByRole('listbox')).toBeVisible();await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(hour).toBeFocused();
  const minute=dialog(page).getByRole('combobox',{name:'分钟',exact:true});await minute.focus();await page.keyboard.press('Enter');await expect(page.getByRole('listbox')).toBeVisible();await page.keyboard.press('End');await page.keyboard.press('Enter');await expect(minute).toBeFocused();
  await expect(result(page)).toContainText('"calls":0');await dialog(page).getByRole('button',{name:'确认',exact:true}).focus();await page.keyboard.press('Enter');await expect(input(page)).toHaveValue('2020-03-01T01:59');await expect(result(page)).toContainText('"calls":1');await expect(trigger(page)).toBeFocused();
 });
 test(kind+' atomic picker confirmation, cancel, nested Escape and controlled update',async({page})=>{
  await page.goto('/date-time-'+kind+'/');await trigger(page).click();await expect(dialog(page).getByRole('heading')).toBeFocused();
  await dialog(page).getByRole('gridcell',{name:'2020-03-01',exact:true}).click();await choose(page,'小时','09');await choose(page,'分钟','30');
  await expect(result(page)).toContainText('"calls":0');await dialog(page).getByRole('button',{name:'确认',exact:true}).click();
  await expect(input(page)).toHaveValue('2020-03-01T09:30');await expect(result(page)).toContainText('"calls":1');await expect(trigger(page)).toBeFocused();
  await trigger(page).click();await choose(page,'小时','10');await dialog(page).getByRole('button',{name:'取消',exact:true}).click();await expect(input(page)).toHaveValue('2020-03-01T09:30');await expect(trigger(page)).toBeFocused();
  await trigger(page).click();const hour=dialog(page).getByRole('combobox',{name:'小时',exact:true});await hour.click();await page.keyboard.press('Escape');await expect(hour).toBeFocused();await expect(dialog(page)).toBeVisible();await page.keyboard.press('Escape');await expect(dialog(page)).toHaveCount(0);await expect(trigger(page)).toBeFocused();
  await page.getByRole('button',{name:'外部更新'}).click();await expect(input(page)).toHaveValue('2026-10-15T09:30');await expect(result(page)).toContainText('"calls":1');
  await page.getByRole('checkbox',{name:'拒绝受控更新'}).check();await input(page).fill('2020-02-29T00:00');await expect(input(page)).toHaveValue('2026-10-15T09:30');await expect(result(page)).toContainText('"calls":2');
 });
 test(kind+' manual minute input, clear, required, external errors and form association',async({page})=>{
  await page.goto('/date-time-'+kind+'/');await input(page).fill('2026-10-15T09:30:00');await input(page).press('Enter');await expect(result(page)).toContainText('"calls":0');await expect(page.getByText('请输入有效的日期时间（YYYY-MM-DDTHH:mm）', {exact:true})).toBeVisible();await expect(input(page)).toHaveAttribute('aria-invalid','true');
  expect(await input(page).evaluate(el=>el.getAttribute('aria-describedby').split(/\s+/).every(id=>!!document.getElementById(id)))).toBe(true);expect(await input(page).evaluate(el=>el.validity.valid)).toBe(false);
  await input(page).fill('2026-10-15T09:30Z');await input(page).press('Enter');await expect(result(page)).toContainText('"calls":0');
  await input(page).fill('2026-10-15T09:30');await input(page).press('Enter');await expect(result(page)).toContainText('"calls":1');
  await page.getByRole('button',{name:'提交',exact:true}).click();await expect(page.getByLabel('表单结果')).toHaveText('{"start":"2026-10-15T09:30","end":""}');
  await page.getByRole('checkbox',{name:'必填',exact:true}).check();await page.getByRole('button',{name:/^清空日期时间 开始日期时间/}).click();await expect(input(page)).toBeFocused();await expect(input(page)).toHaveValue('');await expect(result(page)).toContainText('"start":null');await expect(page.getByText('请选择日期时间',{exact:true})).toBeVisible();expect(await input(page).evaluate(el=>el.validity.valid)).toBe(false);
  await page.getByRole('checkbox',{name:'宿主错误',exact:true}).check();await expect(page.getByText('宿主提供的观察窗口校验错误',{exact:true})).toBeVisible();await input(page).fill('2026-10-15T09:30');await expect(page.getByText('宿主提供的观察窗口校验错误',{exact:true})).toBeVisible();
 });
 test(kind+' disabled/readOnly and form reset keep confirmed value; keyboard opening and outside focus',async({page})=>{
  await page.goto('/date-time-'+kind+'/');await page.getByRole('checkbox',{name:'只读',exact:true}).check();await expect(input(page)).toHaveAttribute('readonly','');await expect(trigger(page)).toBeDisabled();await input(page).focus();await page.keyboard.press('Alt+ArrowDown');await expect(dialog(page)).toHaveCount(0);await expect(result(page)).toContainText('"calls":0');
  await page.getByRole('checkbox',{name:'只读',exact:true}).uncheck();await page.getByRole('checkbox',{name:'禁用',exact:true}).check();await expect(input(page)).toBeDisabled();await expect(trigger(page)).toBeDisabled();await page.getByRole('checkbox',{name:'禁用',exact:true}).uncheck();
  await input(page).fill('2026-');await page.getByRole('button',{name:'重置草稿'}).click();await expect(input(page)).toHaveValue('2020-02-29T23:59');await expect(result(page)).toContainText('"calls":0');
  await input(page).evaluate(el=>{el.form.reset();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'2026-10');el.dispatchEvent(new Event('input',{bubbles:true}));});await expect(input(page)).toHaveValue('2026-10');await expect(result(page)).toContainText('"calls":0');
  await input(page).focus();await input(page).press('Alt+ArrowDown');await expect(dialog(page)).toBeVisible();await page.getByRole('button',{name:'外部更新'}).click();await expect(dialog(page)).toHaveCount(0);await expect(page.getByRole('button',{name:'外部更新'})).toBeFocused();
 });
 for(const mode of ['light','dark','system'])for(const width of [1280,390])test(kind+' '+mode+' '+width+' long Chinese and text 200% keep popup actions reachable',async({page},info)=>{
  await page.setViewportSize({width,height:800});await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);await page.goto('/date-time-'+kind+'/?long');await expect(page.locator('html')).toHaveAttribute('data-theme',mode);await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='light'?'light':'dark');
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');await trigger(page).click();await expect(dialog(page).getByRole('heading')).toBeFocused();
  await choose(page,'分钟','30');await dialog(page).getByRole('button',{name:'确认',exact:true}).click();await expect(input(page)).toHaveValue('2020-02-29T23:30');await expect(trigger(page)).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await trigger(page).click();await dialog(page).getByRole('button',{name:'取消',exact:true}).scrollIntoViewIfNeeded();
  const box=await dialog(page).boundingBox();expect(box.x).toBeGreaterThanOrEqual(-1);expect(box.x+box.width).toBeLessThanOrEqual(width+1);expect(await dialog(page).evaluate(el=>el.clientHeight>0&&el.scrollHeight>=el.clientHeight)).toBe(true);
  await info.attach('date-time-'+kind+'-'+mode+'-'+width+'.png',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 });
}
test('native date-time updates and destruction preserve input identity and release composite owners',async({page})=>{
 await page.goto('/date-time-vanilla/');const identity=await input(page).elementHandle();await page.evaluate(()=>window.dateTimeDemo.picker.update({locale:'en-US',weekStartsOn:0,value:'2024-02-29T12:01'}));expect(await input(page).evaluate((el,old)=>el===old,identity)).toBe(true);await expect(result(page)).toContainText('"calls":0');await trigger(page).click();await expect(dialog(page).locator('.xui-calendar strong')).toHaveText('February 2024');
 await page.evaluate(()=>window.dateTimeDemo.picker.destroy());await expect(page.locator('input#start')).toHaveCount(0);await expect(dialog(page)).toHaveCount(0);await page.keyboard.press('Escape');await expect(page.locator('input#end')).toBeVisible();
});
