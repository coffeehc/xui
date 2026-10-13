import {test,expect} from '@playwright/test';
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const ready=page=>expect.poll(()=>page.evaluate(()=>window.dataTableDemo?.owner.getState().status)).toBe('ready');
const rects=page=>page.evaluate(()=>Object.fromEntries(['.xui-data-table-tools','.xui-data-table-body','.xui-data-table-footer','.xui-data-table-feedback'].map(selector=>{const node=document.querySelector(selector),r=node.getBoundingClientRect();return [selector,{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,scrollHeight:node.scrollHeight,clientHeight:node.clientHeight}];})));
for(const kind of ['react','vanilla']){
  test(`${kind} ready toolbar meets thead and short status reuses existing footer space`,async({page},info)=>{
    await page.setViewportSize({width:1700,height:1000});await page.goto(`/data-table-${kind}/?internal&layout=workspace`);await ready(page);await settle(page);
    const before=await rects(page);expect(Math.abs(before['.xui-data-table-body'].y-before['.xui-data-table-tools'].bottom),'no empty status row above thead').toBeLessThan(1.5);
    const action=page.getByRole('button',{name:'查看记录 1',exact:true});await action.focus();
    await page.evaluate(()=>{window.dataTableDemo.owner.planNext({delayMs:300,fail:true});window.dataTableDemo.owner.refresh();});await expect(page.locator('#records-table')).toHaveAttribute('aria-busy','true');await settle(page);
    for(const state of ['busy','error']){
      if(state==='error')await expect.poll(()=>page.evaluate(()=>window.dataTableDemo.owner.getState().status)).toBe('error');await settle(page);
      const current=await rects(page);for(const key of ['.xui-data-table-body','.xui-data-table-footer'])for(const dimension of ['x','y','width','height'])expect(Math.abs(current[key][dimension]-before[key][dimension]),`${state} ${key} ${dimension}`).toBeLessThan(1.5);
      await expect(action).toBeFocused();await expect(page.locator('.xui-data-table-count')).toContainText('125');
    }
    await info.attach('compact-footer-status.png',{body:await page.screenshot(),contentType:'image/png'});
    await info.attach('compact-footer-bounds.json',{body:JSON.stringify({before,after:await rects(page)}),contentType:'application/json'});
  });
  for(const width of [320,390,1280])test(`${kind} ${width}px long feedback at 200% is complete and footer controls remain reachable`,async({page},info)=>{
    await page.setViewportSize({width,height:600});await page.goto(`/data-table-${kind}/?internal&long-error`);await ready(page);
    await page.evaluate(()=>document.documentElement.style.fontSize='200%');
    await page.evaluate(()=>window.dataTableDemo.owner.refresh(true));await expect.poll(()=>page.evaluate(()=>window.dataTableDemo.owner.getState().status)).toBe('error');await settle(page);
    const slot=page.locator('.xui-data-table-feedback');const bounds=await slot.evaluate(node=>{
      const title=node.querySelector('strong'),range=document.createRange();range.selectNodeContents(title);const r=node.getBoundingClientRect(),lines=[...range.getClientRects()];return {height:r.height,scrollHeight:node.scrollHeight,clientHeight:node.clientHeight,lines:lines.length,contained:lines.every(line=>line.top>=r.top-1&&line.bottom<=r.bottom+1&&line.left>=r.left-1&&line.right<=r.right+1)};
    });expect(bounds.lines).toBeGreaterThan(1);expect(bounds.contained).toBe(true);expect(bounds.scrollHeight).toBeLessThanOrEqual(bounds.clientHeight+1);
    for(const control of [slot.getByRole('button',{name:'重试',exact:true}),page.getByRole('combobox',{name:'每页条数',exact:true}),page.getByRole('button',{name:'下一页',exact:true})]){
      await control.focus();await expect(control).toBeFocused();await expect(control).toBeInViewport({ratio:1});expect(await control.evaluate(node=>{const r=node.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!hit&&(node===hit||node.contains(hit));})).toBe(true);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await info.attach('long-feedback-bounds.json',{body:JSON.stringify({text:bounds,layout:await rects(page)}),contentType:'application/json'});
    await info.attach('long-feedback-footer.png',{body:await page.screenshot(),contentType:'image/png'});
  });
  test(`${kind} absent count/pagination has no blank footer; custom Node disclosure retains state`,async({page})=>{
    await page.goto(`/data-table-${kind}/?internal&no-count&no-pagination`);await ready(page);await expect(page.locator('.xui-data-table-footer')).toBeHidden();
    await page.evaluate(()=>window.dataTableDemo.owner.refresh(true));await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('.xui-data-table-footer')).toBeVisible();await page.getByRole('button',{name:'重试',exact:true}).click();await ready(page);await expect(page.locator('.xui-data-table-footer')).toBeHidden();
    await page.goto(`/data-table-${kind}/?internal&no-count&no-pagination&disclosure-feedback`);await ready(page);
    const toggle=page.getByRole('button',{name:'查看完整说明',exact:true});await toggle.focus();await page.keyboard.press('Enter');const input=page.getByRole('textbox',{name:'详情备注',exact:true});await input.fill('保留用户编辑');await input.focus();
    await page.evaluate(()=>window.dataTableDemo.owner.refresh(true));await expect.poll(()=>page.evaluate(()=>window.dataTableDemo.owner.getState().status)).toBe('error');await expect(input).toBeFocused();await expect(input).toHaveValue('保留用户编辑');await expect(toggle).toHaveAttribute('aria-expanded','true');await toggle.focus();await page.keyboard.press('Enter');await expect(input).toBeHidden();
  });
}
