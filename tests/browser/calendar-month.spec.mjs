import {test,expect} from '@playwright/test';

for(const kind of ['react']){
 test(kind+' absolute month and controlled navigation preserve date-only selection and focus',async({page})=>{
  await page.goto('/calendar-month-'+kind+'/');const calendar=page.locator('.xui-calendar[aria-label="受控日期"]');
  await page.getByRole('button',{name:'定位年月'}).click();
  await expect(page.getByLabel('月份结果')).toHaveText('2020-01');await expect(page.getByLabel('日期结果')).toHaveText('"2020-01-01"');
  await expect(page.getByLabel('事件次数')).toHaveText('month 0 value 0');
  await calendar.getByRole('gridcell',{name:'2020-01-31',exact:true}).focus();await page.keyboard.press('PageDown');
  await expect(calendar.getByRole('gridcell',{name:'2020-02-29',exact:true})).toBeFocused();
  await expect(page.getByLabel('事件次数')).toHaveText('month 1 value 0');
  await calendar.getByRole('gridcell',{name:'2020-02-15',exact:true}).click({force:true});await expect(page.getByLabel('事件次数')).toHaveText('month 1 value 0');
  await page.getByRole('checkbox',{name:'拒绝翻月请求'}).check();
  await calendar.getByRole('gridcell',{name:'2020-02-29',exact:true}).focus();await page.keyboard.press('PageDown');
  await expect(calendar.getByRole('gridcell',{name:'2020-02-29',exact:true})).toBeFocused();await expect(page.getByLabel('月份结果')).toHaveText('2020-02');
  await expect(page.getByLabel('事件次数')).toHaveText('month 2 value 0');
  const plain=page.locator('.xui-calendar[aria-label="非受控日期"]');await plain.getByRole('button',{name:'下个月'}).click();await expect(plain.getByRole('gridcell',{name:'2027-01-01',exact:true})).toBeVisible();
 });
 test(kind+' range remains selected across year navigation and locale changes',async({page})=>{
  await page.goto('/calendar-month-'+kind+'/?range');await page.getByRole('button',{name:'定位年月'}).click();
  const calendar=page.locator('.xui-calendar[aria-label="受控日期"]');
  await expect(calendar.getByRole('gridcell',{name:'2020-01-02',exact:true})).toHaveAttribute('aria-selected','true');
  await calendar.getByRole('button',{name:'上个月'}).click();await expect(page.getByLabel('月份结果')).toHaveText('2019-12');
  await page.getByRole('combobox',{name:'语言',exact:true}).click();await page.getByRole('option',{name:'English',exact:true}).click();
  await expect(calendar.locator('strong')).toHaveText('December 2019');await expect(page.getByLabel('日期结果')).toHaveText('{"start":"2020-01-01","end":"2020-01-03"}');
 });
 for(const mode of ['light','dark','system'])for(const width of [1280,390])test(kind+' '+mode+' '+width+' and 200% text keep public month controls reachable',async({page},info)=>{
  await page.setViewportSize({width,height:800});await page.emulateMedia({colorScheme:mode==='light'?'light':'dark'});
  await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);await page.goto('/calendar-month-'+kind+'/');
  await expect(page.locator('html')).toHaveAttribute('data-theme',mode);await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='light'?'light':'dark');
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  const jump=page.getByRole('button',{name:'定位年月'});await jump.click();await expect(jump).toBeFocused();await expect(page.getByLabel('月份结果')).toHaveText('2020-01');
  const choice=page.getByRole('checkbox',{name:'拒绝翻月请求'});const bounds=await choice.locator('..').boundingBox();expect(bounds.width).toBeGreaterThan(50);expect(bounds.height).toBeGreaterThan(30);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await info.attach(kind+'-'+mode+'-'+width+'.png',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 });
}
