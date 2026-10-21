import {test,expect} from '@playwright/test';

async function open(page,kind,{mode='dark',width=1280,font=16}={}){
  await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
  await page.addInitScript(({mode,font})=>{sessionStorage.setItem('ui.theme.mode',mode);document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.fontSize=font+'px';},{once:true});},{mode,font});
  await page.goto('/page-composition-'+kind+'/?long');expect(await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize)).toBe(font+'px');await expect(page.getByRole('button',{name:/^公开账户行为研究 1：/})).toBeVisible();
}
const creation=page=>page.getByRole('dialog',{name:'创建研究任务',exact:true});

for(const kind of ['react'])for(const mode of ['light','dark','system'])for(const width of [1280,390])for(const font of [16,32]){
  test(`${kind} ${mode} ${width}px text ${font/16*100}% page and form`,async({page},info)=>{
    await open(page,kind,{mode,width,font});
    await expect(page.getByRole('heading',{name:'研究任务',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    const table=page.locator('.xui-data-table-body');if(width===390||font===32){expect(await table.evaluate(node=>node.scrollWidth>node.clientWidth)).toBe(true);await table.evaluate(node=>node.scrollLeft=node.scrollWidth);expect(await table.evaluate(node=>node.scrollLeft)).toBeGreaterThan(0);await table.evaluate(node=>node.scrollLeft=0);}
    await info.attach('page.png',{body:await page.screenshot(),contentType:'image/png'});
    await page.getByRole('button',{name:'创建研究任务',exact:true}).click();const dialog=creation(page);await expect(dialog).toBeVisible();
    const grid=dialog.locator('.xui-form-grid').first(),geometry=await grid.evaluate(node=>{const box=node.getBoundingClientRect(),style=getComputedStyle(node),items=[...node.children].map(item=>{const r=item.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,span:item.dataset.span};});return {width:box.width,columns:style.gridTemplateColumns.split(' ').length,items};});
    expect(geometry.columns).toBe(geometry.width+0.5>=496*font/16?2:1);expect(geometry.columns).toBeLessThanOrEqual(2);
    expect(geometry.items.at(-1).width).toBeCloseTo(geometry.width,0);
    if(geometry.columns===2){expect(geometry.items[0].y).toBeCloseTo(geometry.items[1].y,0);const controls=await dialog.getByRole('combobox').all();expect((await controls[0].boundingBox()).y).toBeCloseTo((await controls[1].boundingBox()).y,0);}
    if(width<=640)expect((await dialog.boundingBox()).width).toBeCloseTo(width,0);
    await dialog.getByRole('button',{name:'研究说明',exact:true}).click();const notes=dialog.getByRole('textbox',{name:'补充研究范围、来源说明与需要人工复核的完整中文信息'});await notes.fill('刷新期间保留的中文草稿');
    const submit=dialog.getByRole('button',{name:'创建任务',exact:true});await submit.focus();await page.keyboard.press("Shift+Tab");await page.keyboard.press("Tab");await expect(submit).toBeFocused();await expect(submit).toHaveCSS('outline-style','none');
    const visible=await submit.evaluate(node=>{const r=node.getBoundingClientRect(),d=node.closest('[role="dialog"],dialog').getBoundingClientRect(),style=getComputedStyle(node);return {width:r.width,height:r.height,x:r.x,right:r.right,bottom:r.bottom,dialogWidth:d.width,outline:style.outlineStyle,innerWidth};});
    expect(visible.outline).toBe('none');expect(visible.width).toBeLessThan(visible.dialogWidth);expect(visible.x).toBeGreaterThanOrEqual(0);expect(visible.right).toBeLessThanOrEqual(width);expect(visible.height).toBeGreaterThan(0);expect(visible.bottom).toBeLessThanOrEqual(900);
    expect(await dialog.evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);
    await info.attach('form-geometry.json',{body:JSON.stringify({geometry,visible}),contentType:'application/json'});await info.attach('form-focus.png',{body:await page.screenshot(),contentType:'image/png'});
    await dialog.getByRole('button',{name:'取消',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.getByRole('button',{name:'创建研究任务',exact:true})).toBeFocused();
    if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','system');}
  });
}

for(const kind of ['react']){
 test(`${kind} refresh retains nodes, scroll, selection, focus and failure recovery`,async({page},info)=>{
  await open(page,kind,{width:960});let documents=0;page.on('request',request=>{if(request.resourceType()==='document')documents++;});
  const name=page.getByRole('button',{name:/^公开账户行为研究 1：/});await name.click();await expect(page.getByRole('dialog',{name:/^公开账户行为研究 1：/})).toBeVisible();await page.getByRole('button',{name:'关闭详情'}).click();await expect(name).toBeFocused();
  const search=page.getByRole('searchbox',{name:'搜索任务'});await search.focus();
  await page.evaluate(()=>{window.continuity={shell:document.querySelector('.xui-page-header'),body:document.querySelector('.xui-data-table-body'),row:document.querySelector('tbody tr'),search:document.querySelector('input[type=search]')};window.continuity.footerTop=document.querySelector('.xui-data-table-footer').getBoundingClientRect().top;window.continuity.body.scrollLeft=80;window.pageCompositionDemo.owner.planNext({delayMs:700});void window.pageCompositionDemo.owner.refresh();});
  await expect(page.getByRole('region',{name:'研究任务列表',exact:true})).toHaveAttribute('aria-busy','true');await expect(page.getByRole('button',{name:'刷新任务',exact:true})).toBeDisabled();await expect(name).toBeVisible();await expect(search).toBeFocused();await expect(page.locator('tbody tr').first()).toHaveAttribute('data-selected','true');
  const during=await page.evaluate(()=>({same:window.continuity.row===document.querySelector('tbody tr'),scroll:window.continuity.body.scrollLeft,footerDelta:document.querySelector('.xui-data-table-footer').getBoundingClientRect().top-window.continuity.footerTop,loading:document.querySelector('.xui-data-table-loading')!==null,opacity:getComputedStyle(window.continuity.body).opacity}));expect(during.same).toBe(true);expect(during.scroll).toBe(80);expect(during.footerDelta).toBeCloseTo(0,1);expect(during.loading).toBe(false);expect(during.opacity).toBe('1');
  await expect.poll(()=>page.evaluate(()=>window.pageCompositionDemo.owner.getState().busy)).toBe(false);
  await page.evaluate(()=>{window.pageCompositionDemo.owner.planNext({fail:true,delayMs:40});void window.pageCompositionDemo.owner.refresh();});await expect(page.getByRole('alert')).toContainText('暂时无法更新任务');await expect(name).toBeVisible();
  await page.getByRole('button',{name:'重试',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);
  expect(await page.evaluate(()=>Object.entries(window.continuity).filter(([key])=>key!=='footerTop').every(([key,node])=>node===document.querySelector({shell:'.xui-page-header',body:'.xui-data-table-body',row:'tbody tr',search:'input[type=search]'}[key])))).toBe(true);expect(documents).toBe(0);
  await info.attach('refresh-retained.png',{body:await page.screenshot(),contentType:'image/png'});
  await search.fill('没有此任务');await expect(page.getByText('没有匹配的任务',{exact:true})).toBeVisible();await page.getByRole('button',{name:'清空筛选',exact:true}).click();await expect(name).toBeVisible();
  await page.getByRole('button',{name:'下一页',exact:true}).click();await expect(page.getByRole('button',{name:/^公开账户行为研究 11：/})).toBeVisible();
 });
 test(`${kind} form validation, refresh draft, failed write and one submit owner`,async({page})=>{
  await open(page,kind);await page.getByRole('button',{name:'创建研究任务',exact:true}).click();const dialog=creation(page),limit=dialog.getByRole('spinbutton',{name:'候选账户上限'}),submit=dialog.getByRole('button',{name:'创建任务',exact:true});
  const flow=dialog.locator('.xui-feedback-slot[data-layout=flow]');expect((await flow.boundingBox())?.height??0).toBe(0);
  await limit.fill('0');await submit.click();await expect(limit).toBeFocused();await expect(limit).toHaveAttribute('aria-invalid','true');await expect(dialog.getByText('请输入大于零的候选账户上限。')).toBeVisible();await limit.fill('7');
  await dialog.getByRole('button',{name:'研究说明',exact:true}).click();const notes=dialog.getByRole('textbox',{name:'补充研究范围、来源说明与需要人工复核的完整中文信息'});await notes.fill('不丢弃的草稿');await notes.focus();
  await page.evaluate(()=>{window.savedDraft=document.querySelector('textarea');window.pageCompositionDemo.owner.planNext({delayMs:80});void window.pageCompositionDemo.owner.refresh();});await expect.poll(()=>page.evaluate(()=>window.pageCompositionDemo.owner.getState().busy)).toBe(false);await expect(notes).toHaveValue('不丢弃的草稿');await expect(notes).toBeFocused();expect(await page.evaluate(()=>window.savedDraft===document.querySelector('textarea'))).toBe(true);
  await page.evaluate(()=>window.pageCompositionDemo.owner.failNextSubmit());await submit.click();await expect(dialog.getByRole('button',{name:'正在创建…',exact:true})).toBeDisabled();await page.keyboard.press('Escape');await expect(dialog).toBeVisible();await expect(dialog.getByRole('alert')).toContainText('创建未完成');await expect(notes).toHaveValue('不丢弃的草稿');await expect(limit).toHaveValue('7');
  expect((await flow.boundingBox()).height).toBeGreaterThan(0);expect(await flow.evaluate(node=>node.scrollHeight<=node.clientHeight+1)).toBe(true);
  await dialog.getByRole('button',{name:'创建任务',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.getByRole('button',{name:/^公开账户行为研究 37：/})).toBeVisible();expect(await page.evaluate(()=>window.pageCompositionDemo.owner.getState().submitCount)).toBe(2);
 });
 test(`${kind} form net width breakpoint and action wrapping`,async({page})=>{
  await open(page,kind);await page.getByRole('button',{name:'创建研究任务',exact:true}).click();const grid=creation(page).locator('.xui-form-grid').first();
  for(const [width,columns] of [[495,1],[496,2],[1200,2]]){await grid.evaluate((node,width)=>node.style.inlineSize=width+'px',width);expect(await grid.evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').length)).toBe(columns);}
  await grid.evaluate(node=>{node.style.inlineSize='';node.dataset.columns='1';});expect(await grid.evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').length)).toBe(1);
 });
}

for(const kind of ['react'])test(`${kind} normal desktop keeps only decision columns and on-demand configuration`,async({page},info)=>{
 await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.goto('/page-composition-'+kind+'/');await expect(page.getByRole('button',{name:'公开账户行为研究 1',exact:true})).toBeVisible();await expect(page.getByRole('columnheader')).toHaveCount(4);await expect(page.getByRole('button',{name:'更多筛选'})).toHaveCount(0);await expect(page.getByRole('button',{name:'清空筛选'})).toHaveCount(0);await expect(page.getByRole('dialog')).toHaveCount(0);expect(await page.locator('.xui-data-table-body').evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);await info.attach('normal-desktop.png',{body:await page.screenshot(),contentType:'image/png'});
 await page.getByRole('button',{name:'创建研究任务',exact:true}).click();await expect(creation(page)).toBeVisible();await expect(creation(page)).toHaveCSS('opacity','1');await info.attach('normal-form.png',{body:await page.screenshot(),contentType:'image/png'});
});

for(const kind of ['react'])test(`${kind} nested select closes before sheet and keyboard returns to opener`,async({page})=>{
 await open(page,kind);const opener=page.getByRole('button',{name:'创建研究任务',exact:true});await opener.focus();await opener.press('Enter');const dialog=creation(page),select=dialog.getByRole('combobox',{name:'冻结模板'});await select.focus();await select.press('ArrowDown');await expect(page.getByRole('listbox')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('listbox')).toHaveCount(0);await expect(dialog).toBeVisible();await expect(select).toBeFocused();await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(opener).toBeFocused();
});
