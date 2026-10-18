import {test as base,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const test=base.extend({page:async({page},use,info)=>{const errors=[];page.on('pageerror',error=>errors.push(error.message));await use(page);await info.attach('page-errors.json',{body:JSON.stringify(errors),contentType:'application/json'});expect(errors).toEqual([]);}});
const settle=page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
const field=page=>page.getByRole('textbox',{name:/Agent 唯一标识|Agent ID/});
const results=page=>page.getByRole('table',{name:'消息查询结果',exact:true});
async function setup(page,mode='light',long=false){
  await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
  await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);
  await page.goto(`/query-page-react/${long?'?long':''}`);await expect(page.getByRole('form',{name:'消息查询条件'})).toBeVisible();await settle(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);
}
async function noOverflow(page){
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const clipped=await page.locator('.xui-query-form input,.xui-query-form button').evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length&&node.getAttribute('aria-hidden')!=='true').filter(node=>{const r=node.getBoundingClientRect();return r.left<0||r.right>innerWidth+1;}).map(node=>node.outerHTML));expect(clipped).toEqual([]);
}
async function focusReachable(locator){
  await locator.focus();await locator.evaluate(node=>node.scrollIntoView({block:'center',inline:'nearest'}));
  const painted=await locator.evaluate(node=>{const paint=getComputedStyle(node).outlineStyle==='none'?node.closest('.xui-input-group')??node:node,r=paint.getBoundingClientRect(),s=getComputedStyle(paint),g=parseFloat(s.outlineWidth)+parseFloat(s.outlineOffset),clipped=[];for(let parent=paint.parentElement;parent;parent=parent.parentElement){const style=getComputedStyle(parent),bounds=parent.getBoundingClientRect();if(/hidden|clip|auto|scroll/.test(style.overflowX)&&(r.left-g<bounds.left-1||r.right+g>bounds.right+1))clipped.push(parent.className);if(/hidden|clip|auto|scroll/.test(style.overflowY)&&(r.top-g<bounds.top-1||r.bottom+g>bounds.bottom+1))clipped.push(parent.className);}return {left:r.left-g,right:r.right+g,top:r.top-g,bottom:r.bottom+g,width:innerWidth,height:innerHeight,outline:s.outlineStyle,clipped};});
  expect(painted.outline).not.toBe('none');expect(painted.clipped).toEqual([]);expect(painted.left).toBeGreaterThanOrEqual(0);expect(painted.right).toBeLessThanOrEqual(painted.width+1);expect(painted.top).toBeGreaterThanOrEqual(0);expect(painted.bottom).toBeLessThanOrEqual(painted.height+1);
}
async function query(page,agent='demo-agent'){await field(page).fill(agent);await page.getByRole('button',{name:'查询消息',exact:true}).click();await expect(results(page).getByRole('row')).toHaveCount(6);}
for(const mode of ['light','dark','system']){
  test(`Query results ${mode}: idle/empty/error stay in the visible wide-table scrollport`,async({page},info)=>{
    await page.setViewportSize({width:390,height:900});await setup(page,mode);
    const body=page.locator('.xui-data-table-body');
    const visible=async locator=>{
      await locator.scrollIntoViewIfNeeded();
      for(const direction of ['ltr','rtl'])for(const percent of [100,200]){
        await page.evaluate(({direction,percent})=>{document.documentElement.dir=direction;document.documentElement.style.fontSize=percent+'%';},{direction,percent});await settle(page);
        for(const end of [false,true]){
          await body.evaluate((node,{end,direction})=>{node.scrollLeft=end?node.scrollWidth*(direction==='rtl'?-1:1):0;},{end,direction});await settle(page);
          const bounds=await locator.evaluate(node=>{const r=node.getBoundingClientRect(),b=node.closest('.xui-data-table-body').getBoundingClientRect();return {left:r.left,right:r.right,bodyLeft:b.left,bodyRight:b.right,center:r.left+r.width/2,bodyCenter:b.left+b.width/2};});
          expect(bounds.left).toBeGreaterThanOrEqual(bounds.bodyLeft);expect(bounds.right).toBeLessThanOrEqual(bounds.bodyRight);expect(bounds.center).toBeCloseTo(bounds.bodyCenter,0);
        }
      }
    };
    await visible(page.getByText('输入 Agent ID 开始查询',{exact:true}));
    await page.evaluate(()=>{document.documentElement.dir='ltr';document.documentElement.style.fontSize='100%';window.queryDemo.fixture({next:'empty'});});await queryEmpty(page,'empty');await visible(page.locator('.xui-empty-state'));
    await page.evaluate(()=>{document.documentElement.dir='ltr';document.documentElement.style.fontSize='100%';window.queryDemo.fixture({next:'error'});});await queryEmpty(page,'failed');await expect(page.getByRole('alert')).toBeVisible();await visible(page.getByRole('alert'));
    await page.keyboard.press('Tab');await focusReachable(page.getByRole('button',{name:'重试查询',exact:true}));await page.getByRole('button',{name:'重试查询',exact:true}).click();await expect(results(page).getByRole('row')).toHaveCount(6);
    await info.attach(`query-${mode}-scrollport.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  });
  test(`QueryForm ${mode}: width roles, control bottoms and single surfaces`,async({page},info)=>{
    await page.setViewportSize({width:1600,height:1000});await setup(page,mode,true);
    const geometry=await page.locator('.xui-query-form').evaluate(form=>{
      const r=node=>{const b=node.getBoundingClientRect();return {width:b.width,bottom:b.bottom,top:b.top};};
      return {input:r(form.querySelector('input')),select:r(form.querySelector('button[role=combobox]')),buttons:[...form.querySelectorAll('.xui-query-controls>button')].map(r),surfaces:form.querySelectorAll('.xui-surface').length,font:getComputedStyle(form.querySelector('input')).fontSize};
    });
    expect(geometry.input.width).toBeLessThanOrEqual(480);expect(geometry.input.width).toBeGreaterThan(320);expect(geometry.select.width).toBeCloseTo(192,0);expect(geometry.surfaces).toBe(0);expect(geometry.font).toBe('14px');
    for(const button of geometry.buttons)expect(button.bottom).toBeCloseTo(geometry.input.bottom,0);expect(geometry.select.bottom).toBeCloseTo(geometry.input.bottom,0);
    // A real validation error and long label/help must not move actions below controls.
    await page.getByRole('button',{name:'查询消息',exact:true}).click();await expect(field(page)).toHaveAttribute('aria-invalid','true');
    const bottoms=await page.locator('.xui-query-form').evaluate(form=>[form.querySelector('input'),form.querySelector('button[role=combobox]'),...form.querySelectorAll('.xui-query-controls>button')].map(node=>node.getBoundingClientRect().bottom));expect(Math.max(...bottoms)-Math.min(...bottoms)).toBeLessThan(1);
    await expect(page.getByText('输入 Agent ID 开始查询',{exact:true})).toBeVisible();await expect(page.locator('.xui-data-table-count')).toBeHidden();
    const centered=await page.locator('.xui-empty-state').evaluate(node=>getComputedStyle(node).textAlign);expect(centered).toBe('center');
    await info.attach(`query-${mode}-desktop.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
    if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');}
  });
  test(`QueryForm ${mode}: narrow, long Chinese, 200% text, advanced draft and keyboard`,async({page},info)=>{
    await setup(page,mode,true);const toggle=page.getByRole('button',{name:'按日期筛选',exact:true});
    await toggle.focus();await page.keyboard.press('Enter');const start=page.getByRole('textbox',{name:'开始日期时间',exact:true});await expect(start).toBeVisible();await start.fill('2026-10-18T09:00');await start.press('Tab');
    await toggle.focus();await page.keyboard.press('Space');await expect(start).toBeHidden();await expect(page.locator('.xui-search-toolbar-advanced')).toHaveAttribute('inert','');await toggle.press('Enter');await expect(start).toHaveValue('2026-10-18T09:00');
    await field(page).fill('长中文研发团队');
    for(const width of [768,390,320])for(const percent of [100,200]){
      await page.setViewportSize({width,height:900});await page.evaluate(percent=>document.documentElement.style.fontSize=percent+'%',percent);await settle(page);await noOverflow(page);await page.keyboard.press('Tab');
      for(const locator of [field(page),toggle,page.getByRole('button',{name:'查询消息',exact:true}),start])await focusReachable(locator);
      const fields=await page.locator('.xui-query-field').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().width));expect(Math.abs(fields[0]-fields[1])).toBeLessThan(1);
      await info.attach(`query-${mode}-${width}-text${percent}.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
    }
    await page.evaluate(()=>{document.documentElement.style.fontSize='100%';});await page.setViewportSize({width:1280,height:900});await settle(page);
    await start.focus();await page.evaluate(()=>{document.querySelector('.xui-query-controls button[aria-expanded]').click();});await expect(toggle).toBeFocused();await expect(start).toBeHidden();
    await query(page,'长中文研发团队');await expect(page.locator('.xui-query-summary')).toContainText('2026-10-18T09:00');
    await field(page).press('Enter');await expect(results(page).getByRole('row')).toHaveCount(6);
    const detail=results(page).getByRole('button',{name:/研究任务已完成/}).first();await detail.click();await expect(page.getByRole('dialog',{name:'消息详情'})).toBeVisible();await page.keyboard.press('Escape');await expect(detail).toBeFocused();
  });
  test(`Query page ${mode}: idle/loading/ready/empty/error/refresh/scope continuity`,async({page},info)=>{
    await page.setViewportSize({width:1440,height:1000});await setup(page,mode);await expect(page.locator('.xui-data-table-count')).toBeHidden();
    await page.evaluate(()=>window.queryDemo.fixture({delay:250}));await field(page).fill('alpha');
    await field(page).evaluate(node=>{window.queryInput=node;node.focus();node.setSelectionRange(1,3);});
    await field(page).press('Enter');await expect(page.getByText('正在查询消息…',{exact:true})).toBeVisible();await expect(results(page).getByRole('row')).toHaveCount(1);await expect(field(page)).toHaveValue('alpha');
    await expect(results(page).getByRole('row')).toHaveCount(6);await expect(page.locator('.xui-data-table-count')).toHaveText('共 13 条');
    await page.getByRole('button',{name:'下一页',exact:true}).click();await expect(results(page).getByText('MSG-006',{exact:true})).toBeVisible();await expect(page.getByText('2 / 3',{exact:true})).toBeVisible();
    await field(page).fill('unsubmitted-draft');await field(page).evaluate(node=>{node.focus();node.setSelectionRange(1,4);});
    const before=await results(page).evaluate(table=>{window.queryFirstRow=table.querySelector('tbody tr');const r=table.getBoundingClientRect();return {y:r.y,height:r.height};});
    await page.evaluate(()=>{window.queryDemo.fixture({delay:400});void window.queryDemo.refresh();});await expect(page.getByText('MSG-006',{exact:true})).toBeVisible();await expect(field(page)).toBeFocused();
    expect(await field(page).evaluate(node=>node===window.queryInput&&node.selectionStart===1&&node.selectionEnd===4)).toBe(true);
    expect(await results(page).evaluate(table=>table.querySelector('tbody tr')===window.queryFirstRow)).toBe(true);
    const during=await results(page).evaluate(table=>{const r=table.getBoundingClientRect();return {y:r.y,height:r.height};});expect(during).toEqual(before);
    await expect(page.getByRole('button',{name:'刷新当前结果',exact:true})).toBeEnabled();await expect(results(page).getByText('alpha',{exact:true})).toHaveCount(5);await expect(field(page)).toHaveValue('unsubmitted-draft');
    await page.evaluate(()=>{window.queryDemo.fixture({next:'error'});void window.queryDemo.refresh();});await expect(page.getByRole('alert')).toContainText('刷新失败');await expect(results(page).getByText('MSG-006',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'重试查询',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);
    await page.evaluate(()=>window.queryDemo.fixture({next:'empty'}));await queryEmpty(page,'empty');await expect(page.getByText('没有匹配的消息',{exact:true})).toBeVisible();await expect(page.locator('.xui-data-table-count')).toHaveText('共 0 条');
    await page.evaluate(()=>window.queryDemo.fixture({next:'error'}));await field(page).fill('first-error');await page.getByRole('button',{name:'查询消息',exact:true}).click();await expect(page.getByRole('alert')).toContainText('查询未完成');await expect(page.locator('.xui-data-table-count')).toBeHidden();await expect(field(page)).toHaveValue('first-error');
    await page.evaluate(()=>{window.queryDemo.fixture({delay:350});void window.queryDemo.submit({agent:'old',status:'all',start:'',end:''});});await page.evaluate(()=>{window.queryDemo.fixture({delay:20});void window.queryDemo.submit({agent:'new',status:'all',start:'',end:''});});
    await expect(results(page).getByText('new',{exact:true})).toHaveCount(5);await page.waitForTimeout(400);await expect(results(page).getByText('old',{exact:true})).toHaveCount(0);
    await info.attach(`query-${mode}-results.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  });
  test(`QueryForm ${mode}: genuine Chrome 200% browser zoom`,async({},info)=>{
    const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});
    try{
      const page=await context.newPage();await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);await page.goto('http://127.0.0.1:4173/query-page-react/?long');await settle(page);
      const before=await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth,font:getComputedStyle(document.documentElement).fontSize}));
      const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);await settle(page);
      const after=await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth,font:getComputedStyle(document.documentElement).fontSize,cssZoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.cssZoom).toBe('1');expect(after.pinch).toBe(1);await noOverflow(page);
      const toggle=page.getByRole('button',{name:'按日期筛选',exact:true});await toggle.focus();await page.keyboard.press('Enter');await expect(page.getByRole('textbox',{name:'开始日期时间',exact:true})).toBeVisible();await focusReachable(page.getByRole('button',{name:'查询消息',exact:true}));await query(page);await page.keyboard.press('Tab');await focusReachable(page.getByRole('button',{name:'刷新当前结果',exact:true}));
      await info.attach('zoom.json',{body:JSON.stringify({before,after}),contentType:'application/json'});await info.attach(`query-${mode}-zoom.png`,{body:await captureZoomViewport(page),contentType:'image/png'});
    }finally{await context.close();}
  });
}
async function queryEmpty(page,agent){await field(page).fill(agent);await page.getByRole('button',{name:'查询消息',exact:true}).click();await expect(page.getByRole('button',{name:'查询消息',exact:true})).toBeEnabled();}
