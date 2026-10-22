import {test,expect} from '@playwright/test';

async function resize(table,index=0,max=Infinity){
 const headers=table.locator('thead th'),handle=headers.nth(index).getByRole('separator');
 await expect(handle).toBeEnabled();await handle.scrollIntoViewIfNeeded();
 const before=await headers.evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().width));
 await handle.focus();await handle.press('Shift+ArrowRight');
 await expect.poll(()=>headers.nth(index).evaluate(node=>node.getBoundingClientRect().width)).toBeCloseTo(Math.min(max,before[index]+10),0);
 const after=await headers.evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().width));
 return {before,after};
}
async function fixedActions(table,expectedHandles){
 await expect(table.getByRole('separator')).toHaveCount(expectedHandles);
 await expect(table.locator('thead th').last().getByRole('separator')).toHaveCount(0);
 await expect(table.locator('thead th').last()).not.toHaveAttribute('data-resizable','true');
}
for(const mode of ['light','dark','system']){
 test(`${mode}: business log uses one DataTable sizing owner without querying or replacing cells`,async({page})=>{
  await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
  await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);
  await page.goto('/business-log-react/?cells&labels');
  const table=page.getByRole('table');await expect(table.locator('tbody tr')).toHaveCount(2);
  await page.evaluate(()=>window.businessLogDemo.setList({columns:[{id:'summary',header:'Summary',width:240,resize:{minWidth:100,maxWidth:320,label:'Resize summary'}},{id:'detail',header:'Detail',resize:{minWidth:100,maxWidth:500}}]}));
  await fixedActions(table,1);const button=table.locator('tbody tr').first().getByRole('button');
  const saved=await button.elementHandle(),reads=await page.evaluate(()=>window.businessLogDemo.getRequests().length);
  const {before,after}=await resize(table,0,320);expect(after[1]).toBeCloseTo(before[1],0);
  expect(await page.evaluate(()=>window.businessLogDemo.getRequests().length)).toBe(reads);
  expect(await button.evaluate((node,saved)=>node===saved,saved)).toBe(true);
  await table.getByRole('separator').press('End');await expect.poll(()=>table.locator('thead th').first().evaluate(n=>n.getBoundingClientRect().width)).toBeCloseTo(320,0);
  await page.getByRole('button',{name:'刷新日志',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.businessLogDemo.getRequests().length)).toBe(reads+1);
  await expect.poll(()=>table.locator('thead th').first().evaluate(n=>n.getBoundingClientRect().width)).toBeCloseTo(320,0);
  await button.click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(button).toBeFocused();
  await expect(page.getByRole('button',{name:/重置列宽|Reset column widths/i})).toHaveCount(0);
 });
 test(`${mode}: structured group and record data resize while navigation and detail stay controller-owned`,async({page})=>{
  await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
  await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);
  await page.goto('/log-react/');const table=page.getByRole('table');await expect(table.locator('tbody tr')).toHaveCount(2);
  await fixedActions(table,6);const reads=await page.evaluate(()=>window.logDemo.getRequests().length);
  const {before,after}=await resize(table);expect(after.at(-1)).toBeCloseTo(before.at(-1),0);
  expect(await page.evaluate(()=>window.logDemo.getRequests().length)).toBe(reads);
  await table.locator('tbody tr').first().getByRole('button').click();await expect.poll(()=>page.evaluate(()=>window.logDemo.controller.getState().view)).toBe('records');
  await fixedActions(table,6);const recordReads=await page.evaluate(()=>window.logDemo.getRequests().length);
  const record=await resize(table,1);expect(record.after.at(-1)).toBeCloseTo(record.before.at(-1),0);
  expect(await page.evaluate(()=>window.logDemo.getRequests().length)).toBe(recordReads);
  const detail=table.locator('tbody tr').first().getByRole('button');await detail.click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(detail).toBeFocused();
  await expect(page.getByRole('button',{name:/重置列宽|Reset column widths/i})).toHaveCount(0);
 });
}

test('API Key actions stay fixed and chart data views share DataTable resizing',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/api-key-react/');let table=page.getByRole('table');
 await expect(table.locator('tbody tr').first().getByRole('button').first()).toBeVisible();await fixedActions(table,7);
 const {before,after}=await resize(table);expect(after.at(-1)).toBeCloseTo(before.at(-1),0);
 await page.goto('/charts-react/');await expect.poll(()=>page.evaluate(()=>window.chartDemo?.resource.getState().status)).toBe('ready');const calls=await page.evaluate(()=>window.chartDemo.calls);
 for(const [id,handles] of [['line',3],['bar',3],['pie',4]]){const chart=page.locator(`#${id}`);await chart.getByRole('button',{name:'查看数据表格',exact:true}).click();table=chart.getByRole('table');await expect(table.getByRole('separator')).toHaveCount(handles);await resize(table);}
 expect(await page.evaluate(()=>window.chartDemo.calls)).toBe(calls);
 await expect(page.getByRole('button',{name:/重置列宽|Reset column widths/i})).toHaveCount(0);
});
