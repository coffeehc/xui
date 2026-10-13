import {chooseSelect} from './select-interaction.mjs';
import {test,expect} from '@playwright/test';
const ready=page=>expect.poll(()=>page.evaluate(()=>window.dataTableDemo.owner.getState().status)).toBe('ready');
for(const kind of ['react','vanilla'])for(const width of [1280,390]){
  test(`${kind} cursor ${width}px: optional count, exact next/back, failure/cancel and internal footer`,async({page})=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.setViewportSize({width,height:844});await page.goto(`/data-table-${kind}/?cursor&size=100&internal`);await ready(page);
    const root=page.locator('#records-table'),nav=root.getByRole('navigation',{name:'记录分页'}),next=nav.getByRole('button',{name:'下一页'}),previous=nav.getByRole('button',{name:'上一页'}),count=root.locator('.xui-data-table-count');
    await expect(count).toHaveText('已加载 100 条');await expect(previous).toBeDisabled();await expect(next).toBeEnabled();await expect(nav).not.toContainText('/');await expect(root.getByRole('combobox',{name:'每页条数'})).toHaveCount(1);
    const before=await page.evaluate(()=>window.dataTableDemo.owner.getState().nextCursor);await next.click();await ready(page);await expect(count).toHaveText('已加载 25 条');await expect(next).toBeDisabled();await expect(previous).toBeEnabled();
    expect(await page.evaluate(()=>JSON.parse(window.dataTableDemo.owner.getRequests()[1]).cursor)).toBe(before);
    await previous.click();await ready(page);await expect(count).toHaveText('已加载 100 条');await expect(previous).toBeDisabled();
    await page.evaluate(()=>window.dataTableDemo.owner.planNext({delayMs:60,fail:true}));await next.click();await expect.poll(()=>page.evaluate(()=>window.dataTableDemo.owner.getState().status)).toBe('error');await expect(count).toHaveText('已加载 100 条');await expect(previous).toBeDisabled();await root.getByRole('button',{name:'重试',exact:true}).click();await ready(page);await expect(count).toHaveText('已加载 25 条');
    await previous.click();await ready(page);await page.evaluate(()=>window.dataTableDemo.owner.planNext({delayMs:1000,ignoreAbort:true}));await next.click();await expect(next).toBeDisabled();await page.getByRole('button',{name:'取消请求',exact:true}).click();await ready(page);await page.waitForTimeout(1100);await expect(count).toHaveText('已加载 100 条');await expect(previous).toBeDisabled();
    await page.getByRole('searchbox',{name:'搜索记录'}).fill('记录 125');await ready(page);await expect(count).toHaveText('已加载 1 条');await expect(next).toBeDisabled();await expect(previous).toBeDisabled();
    const bounds=await root.evaluate(node=>{const frame=node.querySelector('.xui-data-table-frame').getBoundingClientRect(),footer=node.querySelector('footer').getBoundingClientRect();return {frame:{top:frame.top,left:frame.left,right:frame.right,bottom:frame.bottom},footer:{top:footer.top,left:footer.left,right:footer.right,bottom:footer.bottom}};});
    expect(bounds.footer.top).toBeGreaterThanOrEqual(bounds.frame.top);expect(bounds.footer.bottom).toBeLessThanOrEqual(bounds.frame.bottom);expect(bounds.footer.left).toBeGreaterThanOrEqual(bounds.frame.left);expect(bounds.footer.right).toBeLessThanOrEqual(bounds.frame.right);
    const requests=await page.evaluate(()=>window.dataTableDemo.owner.getRequests().map(JSON.parse));expect(requests.every(request=>request.return_total===false&&!('page_index'in request))).toBe(true);expect(errors).toEqual([]);
  });
  test(`${kind} cursor ${width}px: real total can coexist without numbered pages and empty cursor end is explicit`,async({page})=>{
    await page.setViewportSize({width,height:844});await page.goto(`/data-table-${kind}/?cursor&cursor-total&empty`);await ready(page);
    const root=page.locator('#records-table'),nav=root.getByRole('navigation',{name:'记录分页'});await expect(root.locator('.xui-data-table-count')).toHaveText('显示 0 条，共 0 条');await expect(nav.getByRole('button',{name:'下一页'})).toBeDisabled();await expect(nav).not.toContainText('/');
    expect(await page.evaluate(()=>window.dataTableDemo.owner.getState().nextCursor)).toBeNull();await page.getByRole('button',{name:'恢复记录',exact:true}).click();await ready(page);await expect(root.locator('.xui-data-table-count')).toHaveText('显示 20 条，共 125 条');await expect(nav.getByRole('button',{name:'下一页'})).toBeEnabled();await expect(nav).not.toContainText('/');
    await nav.getByRole('button',{name:'下一页'}).click();await ready(page);await expect(nav.getByRole('button',{name:'上一页'})).toBeEnabled();await chooseSelect(page,root.getByRole('combobox',{name:'每页条数'}),'50');await ready(page);await expect(root.locator('.xui-data-table-count')).toHaveText('显示 50 条，共 125 条');await expect(nav.getByRole('button',{name:'上一页'})).toBeDisabled();expect(await page.evaluate(()=>window.dataTableDemo.owner.getState().rows[0].id)).toBe('1');
  });
}
