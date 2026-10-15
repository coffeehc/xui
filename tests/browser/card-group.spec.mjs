import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
const group=page=>page.locator('.xui-card-group');
const body=page=>page.locator('.xui-card-group-body');
const card=(page,id)=>page.locator('.xui-card').filter({has:page.getByRole('textbox',{name:'备注 '+id,exact:true})});
async function open(page,{theme='light',width=1280,scale=1,layout='workspace',external=false}={}){
 await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(({theme,scale})=>{sessionStorage.setItem('ui.theme.mode',theme);sessionStorage.setItem('ui.interface.scale',String(scale));},{theme,scale});
 await page.goto('/card-group-react/?layout='+layout+(external?'&external':''));await expect(page.getByRole('button',{name:'打开 record-1',exact:true})).toBeEnabled();
}
async function geometry(page,info){
 const metrics=await group(page).evaluate(node=>{
  const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const b=node.querySelector('.xui-card-group-body'),f=node.querySelector('.xui-card-group-footer'),t=node.querySelector('.xui-card-group-tools');
  return {root:rect(node),body:rect(b),footer:rect(f),toolbar:t?rect(t):null,cards:[...node.querySelectorAll('.xui-card')].map(rect),scrollHeight:b.scrollHeight,clientHeight:b.clientHeight,overflow:getComputedStyle(b).overflowY,columns:getComputedStyle(node.querySelector('ul')).gridTemplateColumns.split(' ').length};
 });
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(metrics.body.bottom).toBeLessThanOrEqual(metrics.footer.y+1);
 if(metrics.toolbar)expect(metrics.toolbar.bottom).toBeLessThanOrEqual(metrics.body.y+1);
 for(const r of metrics.cards){expect(r.x).toBeGreaterThanOrEqual(metrics.body.x-1);expect(r.right).toBeLessThanOrEqual(metrics.body.right+1);}
 const c=card(page,'record-1');await expect(c.locator(':scope > header')).toHaveCount(1);await expect(c.locator(':scope > .xui-card-content')).toHaveCount(1);await expect(c.locator(':scope > footer')).toHaveCount(1);
 await page.getByRole('button',{name:'打开 record-6',exact:true}).focus();await expect(page.getByRole('button',{name:'打开 record-6',exact:true})).toBeInViewport();await page.keyboard.press('Enter');await expect(page.getByLabel('操作结果')).toHaveText('record-6 revision 1 index 5 key record-6');
 await info.attach('geometry.json',{body:JSON.stringify(metrics),contentType:'application/json'});await info.attach('cards.png',{body:await page.screenshot(),contentType:'image/png'});return metrics;
}
for(const theme of ['light','dark','system'])for(const width of [1280,390])for(const scale of [1,2])test(`${theme} ${width} scale${scale} bounded cards, slots, focus and footer`,async({page},info)=>{
 await open(page,{theme,width,scale});const m=await geometry(page,info);if(width===390||scale===2)expect(m.columns).toBe(1);
 if(theme==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');}
});
for(const layout of ['natural','document'])test(`${layout} uses its declared scroll owner with external toolbar`,async({page},info)=>{
 await open(page,{layout,external:true});expect(await group(page).locator('.xui-card-group-tools').count()).toBe(0);await expect(page.getByRole('searchbox',{name:'搜索任务'})).toHaveCount(1);const m=await geometry(page,info);if(layout==='document')expect(m.overflow).toBe('visible');
});
test('refresh, failure and retry retain Card/input/shell identity, draft, selection, focus and scroll',async({page})=>{
 await open(page,{width:390});const draft=page.getByRole('textbox',{name:'备注 record-4',exact:true});await draft.fill('保留的草稿');await draft.focus();await draft.evaluate(el=>el.setSelectionRange(1,3));let documents=0;page.on('request',r=>{if(r.resourceType()==='document')documents++;});
 await page.evaluate(()=>{const input=document.querySelector('[aria-label="备注 record-4"]'),body=document.querySelector('.xui-card-group-body');window.keptCards={input,card:input.closest('.xui-card'),body,shell:document.querySelector('.xui-shell'),scroll:body.scrollTop};window.cardGroupDemo.plan({delay:450});void window.cardGroupDemo.resource.load('tasks');});
 await expect(group(page)).toHaveAttribute('aria-busy','true');await expect(group(page).getByRole('status').filter({hasText:'正在更新'})).toBeVisible();await expect(draft).toBeVisible();await expect(draft).toBeFocused();await expect(page.getByRole('button',{name:'下一页',exact:true})).toBeDisabled();
 await expect.poll(()=>page.evaluate(()=>window.cardGroupDemo.resource.getState().busy)).toBe(false);await expect(draft).toHaveValue('保留的草稿');await expect(draft).toBeFocused();
 await page.evaluate(()=>{window.cardGroupDemo.plan({fail:true,delay:80});void window.cardGroupDemo.resource.load('tasks');});await expect(group(page).getByRole('alert')).toContainText('保留上次结果');await expect(draft).toBeFocused();
 expect(await page.evaluate(()=>{const k=window.keptCards;return k.input===document.querySelector('[aria-label="备注 record-4"]')&&k.card===k.input.closest('.xui-card')&&k.body===document.querySelector('.xui-card-group-body')&&k.shell===document.querySelector('.xui-shell')&&Math.abs(k.scroll-k.body.scrollTop)<2&&k.input.selectionStart===1&&k.input.selectionEnd===3;})).toBe(true);expect(documents).toBe(0);
 await page.getByRole('button',{name:'重试',exact:true}).click();await expect(group(page).getByRole('alert')).toHaveCount(0);await expect(draft).toHaveValue('保留的草稿');
});
test('current records after reorder/update, stable mounted keys, one action and controlled offset/cursor pages',async({page})=>{
 await open(page);const size=page.getByRole('combobox',{name:'每页任务数',exact:true});await size.click();await page.getByRole('option',{name:'12',exact:true}).click();const draft=page.getByRole('textbox',{name:'备注 record-7',exact:true});await draft.fill('排序不重挂');await draft.focus();
 await draft.evaluate(el=>window.savedDraft=el);await page.getByRole('button',{name:'排序',exact:true}).evaluate(el=>el.click());await expect(draft).toHaveValue('排序不重挂');await expect(draft).toBeFocused();expect(await draft.evaluate(el=>el===window.savedDraft)).toBe(true);
 await page.evaluate(()=>{window.cardGroupDemo.plan({revision:3});void window.cardGroupDemo.resource.load('tasks');});await expect.poll(()=>page.evaluate(()=>window.cardGroupDemo.resource.getState().busy)).toBe(false);await page.getByRole('button',{name:'打开 record-7',exact:true}).click();await expect(page.getByLabel('操作结果')).toHaveText('record-7 revision 3 index 11 key record-7');
 await page.getByRole('button',{name:'下一页',exact:true}).click();await expect(page.getByRole('button',{name:'打开 record-6',exact:true})).toBeVisible();await page.getByRole('button',{name:'打开 record-6',exact:true}).focus();await page.keyboard.press('Space');await expect(page.getByLabel('操作结果')).toHaveText('record-6 revision 3 index 0 key record-6');
 await page.getByRole('button',{name:'切换游标',exact:true}).click();await expect(group(page).locator('.xui-pagination')).toHaveCount(1);await expect(group(page)).not.toContainText('1 /');await page.getByRole('button',{name:'下一页',exact:true}).click();await expect(page.getByRole('button',{name:'打开 record-6',exact:true})).toBeVisible();
});
test('filtered empty and disabled have distinct usable outcomes; popup Escape returns to trigger',async({page})=>{
 await open(page);const search=page.getByRole('searchbox',{name:'搜索任务'});await search.fill('没有这样的任务');await expect(group(page)).toContainText('没有匹配任务');await expect(group(page).locator('.xui-card')).toHaveCount(0);await search.clear();
 await page.getByRole('button',{name:'切换禁用',exact:true}).click();await expect(page.getByRole('button',{name:'打开 record-1',exact:true})).toBeDisabled();await expect(page.getByRole('combobox',{name:'每页任务数'})).toBeDisabled();await page.getByRole('button',{name:'切换禁用',exact:true}).click();
 const size=page.getByRole('combobox',{name:'每页任务数'});await size.focus();await size.press('ArrowDown');await expect(page.getByRole('listbox')).toBeVisible();await page.keyboard.press('Escape');await expect(size).toBeFocused();await expect(page.getByRole('listbox')).toHaveCount(0);
});
for(const theme of ['light','dark','system'])test(`${theme} actual browser zoom200 reflows cards and keeps controls reachable`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,1000']});
 try{const page=await context.newPage();await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);await page.goto('http://127.0.0.1:4173/card-group-react/');await expect(page.getByRole('button',{name:'打开 record-1',exact:true})).toBeEnabled();const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);const after=await page.evaluate(()=>({width:innerWidth,font:getComputedStyle(document.documentElement).fontSize,zoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.zoom).toBe('1');expect(after.pinch).toBe(1);await geometry(page,info);}finally{await context.close();}
});
for(const scale of [1,2])test(`short 150px host scale${scale} retains readable body and scrolls whole collection when chrome cannot fit`,async({page},info)=>{
 await open(page,{width:390,scale});await group(page).evaluate(node=>{node.style.blockSize='150px';node.style.maxBlockSize='150px';});
 const viewport=body(page);expect(await viewport.evaluate(el=>el.clientHeight)).toBeGreaterThanOrEqual(36*scale);
 const last=page.getByRole('button',{name:'打开 record-6',exact:true});await last.focus();
 const target=await last.boundingBox(),scrollport=await viewport.boundingBox();expect(target.y).toBeGreaterThanOrEqual(scrollport.y-1);expect(target.y+target.height).toBeLessThanOrEqual(scrollport.y+scrollport.height+1);await expect(last).toBeInViewport();
 const next=page.getByRole('button',{name:'下一页',exact:true});await next.focus();await expect(next).toBeInViewport();
 expect(await group(page).evaluate(node=>node.scrollHeight>node.clientHeight&&node.scrollTop>0)).toBe(true);await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'打开 record-7',exact:true})).toBeEnabled();
 await info.attach('short-host.png',{body:await page.screenshot(),contentType:'image/png'});
});
