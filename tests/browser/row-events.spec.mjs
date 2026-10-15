import {test,expect} from '@playwright/test';

for(const kind of ['react']){
 test(kind+' row double-click uses current record after sort, update and cursor pagination',async({page})=>{
  await page.goto('/row-events-'+kind+'/');const result=page.getByLabel('事件结果');
  await page.getByLabel('读取 row-1',{exact:true}).dblclick();
  await expect(result).toContainText('double 1 cell 0 clicks 2');await expect(result).toContainText('row-1 r1 index 0 key row-1');
  await page.getByRole('button',{name:'排序',exact:true}).click();await page.getByLabel('读取 row-6',{exact:true}).dblclick();
  await expect(result).toContainText('double 2');await expect(result).toContainText('row-6 r1 index 0 key row-6');
  await page.getByRole('button',{name:'更新数据',exact:true}).click();await page.getByLabel('读取 row-6',{exact:true}).dblclick();
  await expect(result).toContainText('double 3');await expect(result).toContainText('row-6 r2 index 0 key row-6');
  await page.getByRole('button',{name:'Next page',exact:true}).click();await page.getByLabel('读取 row-3',{exact:true}).dblclick();
  await expect(result).toContainText('double 4');await expect(result).toContainText('row-3 r2 index 0 key row-3');
  await page.getByRole('button',{name:'Previous page',exact:true}).click();await page.getByLabel('读取 row-6',{exact:true}).dblclick();await expect(result).toContainText('double 5');
 });
 test(kind+' independent cells never execute row callbacks and keyboard has normal button access',async({page})=>{
  await page.goto('/row-events-'+kind+'/');const result=page.getByLabel('事件结果'),name=page.getByRole('button',{name:'打开 row-1',exact:true});
  await name.focus();await page.keyboard.press('Enter');await expect(result).toContainText('double 0 cell 1 clicks 0 keys 0');
  await page.getByRole('button',{name:'按钮 row-1',exact:true}).dblclick();await expect(result).toContainText('double 0 cell 3 clicks 0 keys 0');
  await page.getByRole('link',{name:'链接 row-1',exact:true}).dblclick();await expect(result).toContainText('double 0 cell 3 clicks 0 keys 0');
  await page.getByRole('checkbox',{name:'勾选 row-1',exact:true}).check();await expect(result).toContainText('double 0 cell 3 clicks 0 keys 0');
  const text=page.getByLabel('读取 row-1',{exact:true});await text.focus();await text.press('Enter');await expect(result).toContainText('keys 1');await expect(result).toContainText('row-1 r1 index 0 key row-1');
  await text.click({button:'right'});await expect(result).toContainText('context 1');expect(await page.locator('tbody tr').first().getAttribute('role')).toBeNull();expect(await page.locator('tbody tr').first().getAttribute('tabindex')).toBeNull();
 });
 test(kind+' busy/disabled suppress shortcuts, refresh retains row/name focus, selected/expanded and empty cursor remain intact',async({page})=>{
  await page.goto('/row-events-'+kind+'/');const first=page.locator('tbody tr').first(),result=page.getByLabel('事件结果');
  await expect(first).toHaveAttribute('data-selected','true');await expect(page.locator('tbody tr').nth(1)).toHaveAttribute('data-expanded','true');
  await first.evaluate(el=>window.retainedRow=el);
  await page.getByRole('button',{name:'刷新状态',exact:true}).click();await page.getByLabel('读取 row-1',{exact:true}).dblclick();await expect(result).toContainText('double 0');
  expect(await first.evaluate(el=>el===window.retainedRow)).toBe(true);
  await page.getByRole('button',{name:'刷新状态',exact:true}).click();await page.getByRole('button',{name:'禁用状态',exact:true}).click();await page.getByLabel('读取 row-1',{exact:true}).dblclick();await expect(result).toContainText('double 0');
  await page.getByRole('button',{name:'禁用状态',exact:true}).click();await page.getByLabel('读取 row-1',{exact:true}).dblclick();await expect(result).toContainText('double 1');
  await page.getByRole('button',{name:'空数据',exact:true}).click();await expect(page.getByRole('columnheader',{name:'名称',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Next page',exact:true})).toBeEnabled();
 });
 for(const mode of ['light','dark','system'])for(const width of [1280,390])test(kind+' '+mode+' '+width+' long rows at 200% text keep keyboard, sticky and horizontal scroll',async({page},info)=>{
  await page.setViewportSize({width,height:800});await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);await page.goto('/row-events-'+kind+'/');
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  const name=page.getByRole('button',{name:'打开 row-1',exact:true});await name.focus();await page.keyboard.press('Enter');await expect(page.getByLabel('事件结果')).toContainText('cell 1');await expect(name).toBeFocused();
  const body=page.locator('.xui-data-table-body'),sticky=page.locator('tbody tr').first().locator('td').first(),before=await sticky.boundingBox();
  await body.evaluate(el=>el.scrollLeft=el.scrollWidth);
  expect(await body.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);const after=await sticky.boundingBox();expect(Math.abs(after.x-before.x)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await info.attach(kind+'-'+mode+'-'+width+'.png',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 });
}
