import {test,expect} from '@playwright/test';

const cases=[
 {path:'api-key',global:'apiKeyDemo',title:'API Key 管理',first:'名称',action:'创建 API Key',dialog:'创建 API Key'},
 {path:'business-log',global:'businessLogDemo',title:'业务日志',first:'摘要',action:'查看日志详情 business-log:1',dialog:'业务日志详情'},
 {path:'log',global:'logDemo',title:'结构化错误',first:'首次代表摘要',action:'查看观察 demo:g1'}
];
for(const kind of ['react'])for(const theme of ['light','dark','system'])test(`${kind} ${theme}: public list pages keep task, records and compact actions ahead of secondary content`,async({page},info)=>{
 await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);
 for(const sample of cases){
  await page.setViewportSize({width:1280,height:800});await page.goto(`/${sample.path}-${kind}/`);
  await page.waitForFunction(name=>window[name]?.controller.getState()&&!window[name].controller.getState().busy&&!window[name].controller.getState().listBusy,sample.global);
  const heading=page.getByRole('heading',{name:sample.title,exact:true}),table=page.getByRole('table').first();
  await expect(heading).toBeVisible();await expect(table).toBeVisible();await expect(table.getByRole('columnheader').first()).toHaveText(sample.first);
  await expect(table.locator('caption:visible')).toHaveCount(0);
  await expect(page.locator('.xui-feedback-slot:visible')).toHaveCount(0);
  const actions=table.locator('tbody button');expect(await actions.count()).toBeGreaterThan(0);
  for(const action of await actions.all()){await expect(action).toHaveAttribute('data-variant',sample.path==='business-log'?'ghost':'text');await expect(action).toHaveAttribute('data-size','xs');}
  if(sample.path==='api-key'){
   await expect(page.getByRole('cell',{name:'有效',exact:true}).locator('.xui-badge')).toHaveAttribute('data-tone','success');
   expect(await page.getByRole('button',{name:'刷新列表',exact:true}).evaluate(node=>node.closest('.xui-page-header')!==null)).toBe(true);
  }
  for(const width of [1280,390]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>document.fonts.ready);
   const bounds=await heading.boundingBox(),first=await table.locator('tbody tr').first().boundingBox();
   expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(844);expect(first.y+first.height).toBeLessThanOrEqual(844);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   const primary=table.locator('tbody .xui-table-primary').first();expect((await primary.boundingBox()).width).toBeGreaterThanOrEqual(await primary.evaluate(node=>parseFloat(getComputedStyle(node).minInlineSize))-1);
   // Resizable business columns may wrap values; their row must still contain the complete content.
   for(const value of await table.locator('tbody :is(.xui-table-value,.xui-table-label)').all())expect(await value.evaluate(node=>{const range=document.createRange();range.selectNodeContents(node);return range.getBoundingClientRect().height<=node.closest('td').getBoundingClientRect().height+1;})).toBe(true);
   await page.screenshot({path:info.outputPath(`${sample.path}-${kind}-${theme}-${width}.png`)});
  }
  const action=page.getByRole('button',{name:sample.action,exact:true});await action.click();
  if(sample.dialog){
   const dialog=page.getByRole('dialog',{name:sample.dialog,exact:true});await expect(dialog).toBeVisible();await page.waitForFunction(name=>!window[name].controller.getState().detailBusy,sample.global);
   await expect(dialog.locator('.xui-feedback-slot:visible')).toHaveCount(0);
   await page.evaluate(()=>document.documentElement.style.fontSize='200%');
   const close=dialog.getByRole('button',{name:sample.path==='api-key'?'取消':'关闭',exact:true});await close.click();await expect(dialog).toBeHidden();await expect(action).toBeFocused();
  }else await expect(page.getByRole('cell',{name:'第二次观察：来源请求超时',exact:true})).toBeVisible();
 }
});

for(const kind of ['react'])test(`${kind}: a wide metric marker wraps without turning a short label into a vertical column`,async({page})=>{
 await page.goto(`/metric-card-${kind}/`);
 for(const width of [1280,390])for(const scale of [1,2]){
  await page.setViewportSize({width,height:900});await page.evaluate(scale=>document.documentElement.style.fontSize=`${scale*100}%`,scale);
  const label=page.locator('.xui-metric-card-label').filter({hasText:'宽标记'});await expect(label).toBeVisible();
  expect(await label.evaluate(node=>{const range=document.createRange();range.selectNodeContents(node);return range.getClientRects().length;})).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
});
