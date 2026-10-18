import {chooseSelect} from './select-interaction.mjs';
import {test as base,expect} from '@playwright/test';

// Both routes must be built from independently installed formal tarballs.
// No source aliases, private CSS patches, fixed footer or measured header offsets.
// Collection/syntax checks are not browser passes. Run these on a permitted CI host.
const test=base.extend({page:async({page},use,info)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'||message.type()==='warning'&&/hydration|uncaught|invalid hook|cannot update|did not match/i.test(message.text()))errors.push(message.text());});
  await use(page);
  await info.attach('browser-errors.json',{body:JSON.stringify(errors,null,2),contentType:'application/json'});
  expect(errors,'browser errors and hydration warnings').toEqual([]);
}});
const kinds=['react'];
const viewports=[{width:1280,height:800},{width:390,height:844}];
const selectors={shell:'.xui-shell',main:'.xui-shell-main',content:'.xui-shell-content',header:'[data-testid="record-header"]',toolbar:'[data-testid="record-filters"]',table:'#records-table',frame:'#records-table .xui-data-table-frame',body:'#records-table .xui-data-table-body',footer:'#records-table .xui-data-table-footer',cards:'[data-testid="record-cards"]',cardViewport:'[aria-label="合成记录卡片"]'};
const table=page=>page.getByRole('table',{name:'合成记录表格',exact:true});
const rows=page=>table(page).locator('tbody tr').filter({has:page.locator('[data-row-id]')});
const body=page=>page.locator(selectors.body);
const size=page=>page.getByRole('combobox',{name:'每页条数',exact:true});
const search=page=>page.getByRole('searchbox',{name:'搜索记录',exact:true});
const next=page=>page.getByRole('button',{name:'下一页',exact:true});
const previous=page=>page.getByRole('button',{name:'上一页',exact:true});
const near=(actual,expected,label)=>expect(Math.abs(actual-expected),`${label}: ${actual} vs ${expected} CSS px`).toBeLessThanOrEqual(1.5);
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
async function ready(page){await expect.poll(()=>page.evaluate(()=>window.dataTableDemo.owner.getState().status)).toBe('ready');await settle(page);}
async function requestCount(page){return page.evaluate(()=>window.dataTableDemo.owner.getRequests().length);}
async function state(page){return page.evaluate(()=>window.dataTableDemo.owner.getState());}
async function setup(page,kind,{query='',theme='light',viewport=viewports[0],motion='reduce',wait=true}={}){
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:motion});
  await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),theme);
  const params=new URLSearchParams(query);params.set('layout','workspace');
  await page.goto(`/data-table-${kind}/?${params}`);await page.waitForFunction(()=>!!window.dataTableDemo);if(wait)await ready(page);else await settle(page);
  await expect(page.locator('.xui-shell')).toHaveAttribute('data-scroll-mode','workspace');
  expect(await page.locator('.xui-shell').evaluate(node=>node.style.getPropertyValue('--layout-workspace-content-min-block-size'))).toBe('var(--data-table-min-block-size)');
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  await expect(page.locator('html')).toHaveAttribute('data-theme-effective',theme==='system'?'dark':theme);
}
async function metrics(page){return page.evaluate(selectors=>{
  const measure=node=>{if(!node||!node.getClientRects().length)return null;const r=node.getBoundingClientRect(),s=getComputedStyle(node);return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,clientHeight:node.clientHeight,contentHeight:node.clientHeight-(parseFloat(s.paddingTop)||0)-(parseFloat(s.paddingBottom)||0),contentWidth:node.clientWidth-(parseFloat(s.paddingLeft)||0)-(parseFloat(s.paddingRight)||0),boxSizing:s.boxSizing,scrollHeight:node.scrollHeight,scrollTop:node.scrollTop,scrollLeft:node.scrollLeft,position:s.position,overflowX:s.overflowX,overflowY:s.overflowY,borderBottom:parseFloat(s.borderBottomWidth),borderTop:parseFloat(s.borderTopWidth),paddingBottom:parseFloat(s.paddingBottom),paddingTop:parseFloat(s.paddingTop),rowGap:parseFloat(s.rowGap)||0};};
  return {viewport:{width:innerWidth,height:innerHeight},document:measure(document.scrollingElement),...Object.fromEntries(Object.entries(selectors).map(([name,selector])=>[name,measure(document.querySelector(selector))]))};
},selectors);}
async function capture(page,info,label){
  await info.attach(`${label}-css-pixels.json`,{body:JSON.stringify(await metrics(page),null,2),contentType:'application/json'});
  await info.attach(`${label}.png`,{body:await page.screenshot(),contentType:'image/png'});
}
function stays(before,after,key){for(const dimension of ['x','y','width','height'])near(after[key][dimension],before[key][dimension],`${key} ${dimension} remains stable`);}
function normalContainer(m,key){expect(m[key].scrollHeight,`${key} has no second vertical scroll range`).toBeLessThanOrEqual(m[key].clientHeight+1.5);expect(m[key].scrollWidth,`${key} has no horizontal escape`).toBeLessThanOrEqual(m[key].clientWidth+1.5);}
async function assertWorkspace(page,{count=20,internal=false}={}){
  await settle(page);const m=await metrics(page);
  await expect(rows(page)).toHaveCount(count);await expect(table(page).getByRole('columnheader')).toHaveText(['编号','名称','类型','范围','来源','操作']);
  await expect(size(page)).toHaveCount(1);await expect(size(page)).toHaveText(String(count));
  await expect(page.getByRole('group',{name:'记录筛选',exact:true})).toHaveCount(1);
  if(internal){await expect(page.locator('.xui-shell-page-toolbar:visible')).toHaveCount(0);expect(m.toolbar.y).toBeGreaterThanOrEqual(m.table.y-1);}
  else {await expect(page.locator('.xui-shell-page-toolbar:visible')).toHaveCount(1);expect(m.toolbar.bottom).toBeLessThanOrEqual(m.table.y+1);}
  for(const key of ['document','main','content','table','frame'])normalContainer(m,key);
  expect(m.body.clientHeight,'table body has an actual scroll viewport').toBeGreaterThan(0);
  expect(m.body.scrollHeight,'20/50/100 rows truly overflow the body').toBeGreaterThan(m.body.clientHeight+1);
  expect(m.body.overflowY).toBe('auto');
  near(m.table.height,m.content.contentHeight,'public DataTable fills allocated workspace content box');
  near(m.table.width,m.content.contentWidth,'public DataTable fills allocated workspace content width');
  near(m.frame.bottom,m.table.bottom,'frame reaches table end without excess blank space');
  near(m.footer.bottom,m.frame.bottom-m.frame.borderBottom,'footer reaches frame end');
  expect(m.footer.y).toBeGreaterThanOrEqual(m.body.bottom-1.5);
  expect(m.footer.bottom,'footer remains within the viewport').toBeLessThanOrEqual(m.viewport.height+1);
  expect(m.footer.height).toBeGreaterThan(0);expect(['fixed','absolute','sticky']).not.toContain(m.footer.position);
  await expect(size(page)).toBeInViewport({ratio:1});await expect(next(page)).toBeInViewport({ratio:1});
  // Public pageToolbar has no permanent line. Any table boundary is the table's own border.
  const toolbarBorder=await page.locator('.xui-shell-page-toolbar').evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length).map(node=>parseFloat(getComputedStyle(node).borderBottomWidth)));
  expect(toolbarBorder.every(value=>value===0),'no redundant toolbar separator').toBe(true);
  return m;
}
async function assertColumns(page){
  const columns=await table(page).evaluate(node=>[...node.querySelectorAll('thead th')].map((header,index)=>{const cell=node.querySelector(`tbody tr:last-child td:nth-child(${index+1})`),a=header.getBoundingClientRect(),b=cell.getBoundingClientRect();return {header:{x:a.x,right:a.right,width:a.width},cell:{x:b.x,right:b.right,width:b.width}};}));
  for(const [index,column] of columns.entries())for(const edge of ['x','right','width'])near(column.header[edge],column.cell[edge],`column ${index+1} ${edge}`);
}
async function scrollToEnd(page){
  const before=await metrics(page),region=body(page);
  // Wheel is compositor-driven: settle its painted frame before reading scrollTop.
  // Reset each page-size phase so a retained offset cannot satisfy the assertion.
  await region.evaluate(node=>{node.scrollTop=0;});await settle(page);
  await region.hover();await page.mouse.wheel(0,240);await settle(page);
  await expect.poll(async()=>{await settle(page);return region.evaluate(node=>node.scrollTop);}).toBeGreaterThan(0);
  await region.evaluate(node=>{node.scrollTop=node.scrollHeight;});
  await expect.poll(()=>region.evaluate(node=>node.scrollHeight-node.clientHeight-node.scrollTop)).toBeLessThanOrEqual(1.5);
  await settle(page);const after=await metrics(page);
  for(const key of ['header','toolbar','table','footer'])stays(before,after,key);
  const last=await rows(page).last().boundingBox();expect(last.y+last.height,'actual final row is inside body after scrolling').toBeLessThanOrEqual(after.body.bottom+1.5);
  expect(after.footer.bottom).toBeLessThanOrEqual(after.viewport.height+1);
  for(const key of ['document','main','content']){normalContainer(after,key);expect(after[key].scrollTop,`${key} did not scroll`).toBe(before[key].scrollTop);}
  await assertColumns(page);
}
async function selectSize(page,value){await chooseSelect(page,size(page),String(value));await ready(page);await expect(rows(page)).toHaveCount(value);}
async function saveIdentity(page){await page.evaluate(()=>{window.dataTableNodes={search:document.querySelector('input[type="search"]'),action:document.querySelector('[data-row-id="1"]'),table:document.querySelector('#records-table'),body:document.querySelector('#records-table .xui-data-table-body'),header:document.querySelector('[data-testid="record-header"]'),toolbar:document.querySelector('[data-testid="record-filters"]')};});}
async function assertIdentity(page){expect(await page.evaluate(()=>Object.entries(window.dataTableNodes).every(([name,node])=>node.isConnected&&node===document.querySelector({search:'input[type="search"]',action:'[data-row-id="1"]',table:'#records-table',body:'#records-table .xui-data-table-body',header:'[data-testid="record-header"]',toolbar:'[data-testid="record-filters"]'}[name]))),'retained controls, page slots and region keep exact node identity').toBe(true);}
async function reachable(control){await control.focus();await expect(control).toBeFocused();await expect(control).toBeInViewport({ratio:1});expect(await control.evaluate(node=>{const r=node.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!hit&&(node===hit||node.contains(hit));}),'focused control is not clipped or covered').toBe(true);}

for(const kind of kinds){
  for(const theme of ['light','dark','system'])for(const viewport of viewports)for(const motion of ['reduce','no-preference']){
    test(`${kind} DataTable ${theme} ${viewport.width}px ${motion}: 20/50/100 real scrolling and stable page slots`,async({page},info)=>{
      await setup(page,kind,{theme,viewport,motion});
      for(const count of [20,50,100]){if(count!==20)await selectSize(page,count);await assertWorkspace(page,{count});await scrollToEnd(page);}
      if(viewport.width===1280){const controls=page.getByTestId('record-filters').locator('input[type="search"], [role="combobox"]:visible');await expect(controls).toHaveCount(4);const bounds=await controls.evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().y));expect(Math.max(...bounds)-Math.min(...bounds),'desktop search and all three visible filters share one row').toBeLessThanOrEqual(1.5);}
      else {
        const scroll=body(page);expect(await scroll.evaluate(node=>node.scrollWidth-node.clientWidth),'narrow table has a real horizontal range').toBeGreaterThan(0);
        for(const fraction of [0,.5,1]){await scroll.evaluate((node,fraction)=>{node.scrollLeft=(node.scrollWidth-node.clientWidth)*fraction;},fraction);await settle(page);await assertColumns(page);}
        const footerLines=await page.locator('.xui-data-table-footer').evaluate(node=>[...node.children].filter(child=>child.getClientRects().length).map(child=>child.getBoundingClientRect().y));expect(Math.max(...footerLines)-Math.min(...footerLines),'narrow footer naturally wraps').toBeGreaterThan(1.5);
      }
      const transitions=await rows(page).first().evaluate(node=>getComputedStyle(node).transitionDuration.split(',').map(value=>parseFloat(value)));
      if(motion==='reduce')expect(transitions.every(value=>value<=.01)).toBe(true);else expect(transitions.some(value=>value>0)).toBe(true);
      if(theme==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');await assertWorkspace(page,{count:100});}
      await capture(page,info,`rows-${theme}-${viewport.width}-${motion}`);
    });
  }

  for(const viewport of viewports)test(`${kind} ${viewport.width}px: idle/loading/empty preserve headers; 0 to rows and unmatched filters recover`,async({page},info)=>{
    await setup(page,kind,{query:'?manual&empty',viewport,wait:false});
    const initial=await metrics(page);await expect(table(page).getByRole('columnheader')).toHaveCount(6);await expect(page.getByText('等待加载',{exact:true}).first()).toBeVisible();
    await page.evaluate(()=>{window.emptyHeaders=[...document.querySelectorAll('#records-table th')];window.dataTableDemo.owner.planNext({delayMs:500});window.dataTableDemo.owner.load();});
    await expect(page.locator('#records-table')).toHaveAttribute('aria-busy','true');await expect(table(page).locator('tbody tr[aria-hidden="true"]')).toHaveCount(1);await expect(page.locator('#records-table .xui-data-table-loading[role="status"]')).toBeVisible();await expect(page.getByText('还没有记录',{exact:true})).toHaveCount(0);
    await ready(page);await expect(rows(page)).toHaveCount(0);await expect(table(page).getByText('还没有记录',{exact:true})).toBeVisible();await expect(page.locator('.xui-data-table-count')).toHaveText('显示 0 条，共 0 条');
    await expect(previous(page)).toBeDisabled();await expect(next(page)).toBeDisabled();const empty=await metrics(page);for(const key of ['header','toolbar','table'])stays(initial,empty,key);
    await page.getByRole('button',{name:'恢复记录',exact:true}).click();await ready(page);await assertWorkspace(page);await assertColumns(page);
    expect(await page.evaluate(()=>window.emptyHeaders.every((node,index)=>node===document.querySelectorAll('#records-table th')[index])),'the same column header nodes survive 0 to rows').toBe(true);
    const restored=await metrics(page);for(const key of ['header','toolbar','table'])stays(empty,restored,key);
    await search(page).fill('不存在的合成记录');await ready(page);await expect(rows(page)).toHaveCount(0);await expect(table(page).getByText('没有匹配记录',{exact:true})).toBeVisible();await expect(table(page).getByText('还没有记录',{exact:true})).toHaveCount(0);
    await page.getByRole('button',{name:'清空筛选',exact:true}).click();await ready(page);await expect(search(page)).toHaveValue('');await assertWorkspace(page);await assertColumns(page);await capture(page,info,`empty-restored-${viewport.width}`);
  });

  test(`${kind}: refresh keeps row action and external search nodes/focus through failure and retry`,async({page},info)=>{
    await setup(page,kind);await saveIdentity(page);const initialFrame=await metrics(page);await search(page).focus();
    await page.evaluate(()=>{window.dataTableDemo.owner.planNext({delayMs:500});window.dataTableDemo.owner.refresh();});
    await expect(page.locator('#records-table')).toHaveAttribute('aria-busy','true');await expect(rows(page)).toHaveCount(20);await expect(search(page)).toBeFocused();await assertIdentity(page);stays(initialFrame,await metrics(page),'frame');await ready(page);await expect(search(page)).toBeFocused();
    const action=page.getByRole('button',{name:'查看记录 1',exact:true});await action.focus();
    await page.evaluate(()=>{window.dataTableDemo.owner.planNext({delayMs:500,fail:true});window.dataTableDemo.owner.refresh();});
    await expect(action).toBeFocused();await expect(action).toBeEnabled();await expect(rows(page)).toHaveCount(20);await assertIdentity(page);
    await expect.poll(()=>page.evaluate(()=>window.dataTableDemo.owner.getState().status)).toBe('error');await expect(page.getByRole('alert')).toContainText('加载失败');await expect(rows(page)).toHaveCount(20);await expect(action).toBeFocused();await assertIdentity(page);stays(initialFrame,await metrics(page),'frame');
    const count=await requestCount(page);await page.waitForTimeout(160);expect(await requestCount(page),'no automatic retry').toBe(count);
    await page.evaluate(()=>window.dataTableDemo.owner.retry());await ready(page);await expect(page.getByRole('alert')).toHaveCount(0);await expect(action).toBeFocused();await assertIdentity(page);
    await page.keyboard.press('Enter');await expect(page.getByLabel('查看结果',{exact:true})).toHaveText('已查看 1');expect(await page.evaluate(()=>window.dataTableDemo.getActions())).toEqual(['1']);
    await page.evaluate(()=>window.dataTableDemo.owner.refresh(true));await expect(page.getByRole('alert')).toBeVisible();await page.getByRole('button',{name:'重试',exact:true}).click();await ready(page);await expect(page.getByRole('alert')).toHaveCount(0);await assertIdentity(page);await capture(page,info,'refresh-retry-identity');
  });

  for(const offset of [0,1])test(`${kind} offset ${offset}: keyboard pagination is controlled and repeated busy requests are blocked`,async({page})=>{
    await setup(page,kind,{query:`?offset=${offset}`});expect((await state(page)).pageIndex).toBe(offset);await expect(previous(page)).toBeDisabled();
    await page.evaluate(()=>window.dataTableDemo.owner.planNext({delayMs:700}));const count=await requestCount(page);await next(page).focus();await page.keyboard.press('Enter');
    await expect(page.locator('#records-table')).toHaveAttribute('aria-busy','true');expect((await state(page)).pageIndex,'request is not a confirmed page fact').toBe(offset);await expect(rows(page)).toHaveCount(20);await expect(next(page)).toBeDisabled();await expect(previous(page)).toBeDisabled();
    for(const key of ['Enter','Enter','Space','Enter'])await page.keyboard.press(key);
    // Dispatching on a disabled control also cannot bypass the component guard.
    await next(page).evaluate(node=>{node.dispatchEvent(new MouseEvent('click',{bubbles:true}));node.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
    expect(await requestCount(page)).toBe(count+1);await ready(page);expect((await state(page)).pageIndex).toBe(offset+1);await expect(page.getByRole('button',{name:'查看记录 21',exact:true})).toHaveCount(1);
    expect(await page.evaluate(()=>JSON.parse(window.dataTableDemo.owner.getRequests().at(-1)).page_index)).toBe(offset+1);
    await previous(page).click();await ready(page);expect((await state(page)).pageIndex).toBe(offset);
  });

  test(`${kind}: page size has one controlled owner and cancellation restores confirmed facts`,async({page})=>{
    await setup(page,kind);await expect(size(page)).toHaveCount(1);await size(page).click();await expect(page.getByRole('option')).toHaveText(['20','50','100']);await page.keyboard.press('Escape');await expect(size(page)).toBeFocused();
    await page.evaluate(()=>window.dataTableDemo.owner.planNext({delayMs:900,ignoreAbort:true}));const count=await requestCount(page);await chooseSelect(page,size(page),'50');
    await expect(size(page)).toHaveText('20');await expect(size(page)).toBeDisabled();expect((await state(page)).pageSize).toBe(20);await expect(rows(page)).toHaveCount(20);
    await size(page).evaluate(node=>{node.dispatchEvent(new MouseEvent('click',{bubbles:true}));});expect(await requestCount(page)).toBe(count+1);
    await page.getByRole('button',{name:'取消请求',exact:true}).click();await expect(size(page)).toBeEnabled();await expect(size(page)).toHaveText('20');await page.waitForTimeout(950);await expect(rows(page)).toHaveCount(20);expect((await state(page)).pageSize).toBe(20);
    await selectSize(page,50);await expect(size(page)).toHaveText('50');await selectSize(page,100);await expect(size(page)).toHaveText('100');expect((await state(page)).pageIndex).toBe(0);
    await next(page).click();await ready(page);await expect(rows(page)).toHaveCount(25);await expect(page.locator('.xui-data-table-count')).toHaveText('显示 25 条，共 125 条');await expect(next(page)).toBeDisabled();
  });

  test(`${kind}: failed first load is an error with headers and an explicit retry`,async({page})=>{
    await setup(page,kind,{query:'?manual',wait:false});await page.evaluate(()=>{window.dataTableDemo.owner.planNext({fail:true});window.dataTableDemo.owner.load();});
    await expect(page.getByRole('alert')).toBeVisible();await expect(table(page).getByRole('columnheader')).toHaveCount(6);await expect(page.getByText('还没有记录',{exact:true})).toHaveCount(0);await expect(page.getByText('没有匹配记录',{exact:true})).toHaveCount(0);
    await page.getByRole('button',{name:'重试',exact:true}).click();await ready(page);await assertWorkspace(page);
  });

  test(`${kind}: unknown totals never fabricate a count or numbered pagination`,async({page})=>{
    await setup(page,kind,{query:'?unknown'});expect((await state(page)).total).toBeNull();await expect(page.locator('.xui-data-table-count')).toHaveText('已加载 20 条');
    await expect(page.getByRole('navigation',{name:'记录分页',exact:true})).toHaveCount(0);await expect(next(page)).toHaveCount(0);await expect(size(page)).toHaveCount(1);
    await selectSize(page,50);expect((await state(page)).total).toBeNull();await expect(page.locator('.xui-data-table-count')).toHaveText('已加载 50 条');await expect(page.getByRole('navigation',{name:'记录分页',exact:true})).toHaveCount(0);
  });

  test(`${kind}: superseded uncooperative read cannot replace the newest filtered rows`,async({page})=>{
    await setup(page,kind);await search(page).focus();const original=await search(page).elementHandle();
    await page.evaluate(()=>window.dataTableDemo.owner.planNext({delayMs:700,ignoreAbort:true}));await search(page).fill('记录 1');const count=await requestCount(page);
    await page.evaluate(()=>window.dataTableDemo.owner.planNext({delayMs:40}));await search(page).fill('记录 125');await ready(page);await expect(rows(page)).toHaveCount(1);await expect(page.getByRole('button',{name:'查看记录 125',exact:true})).toHaveCount(1);
    await page.waitForTimeout(760);await expect(rows(page)).toHaveCount(1);expect((await state(page)).total).toBe(1);expect(await requestCount(page)).toBe(count+1);await expect(search(page)).toBeFocused();expect(await search(page).evaluate((node,original)=>node===original,original)).toBe(true);
  });

  test(`${kind}: destroy cancels pending reads and retained callbacks cannot revive the view`,async({page})=>{
    await setup(page,kind);await page.evaluate(()=>{window.retainedAction=document.querySelector('[data-row-id="1"]');window.savedTheme=window.xuiTheme;window.dataTableDemo.owner.planNext({delayMs:500,ignoreAbort:true});window.dataTableDemo.owner.refresh();});
    await expect(page.locator('#records-table')).toHaveAttribute('aria-busy','true');const count=await requestCount(page);
    await page.evaluate(()=>{window.dataTableDemo.destroy();window.dataTableDemo.destroy();window.retainedAction.click();window.dataTableDemo.owner.load();});await page.waitForTimeout(560);
    await expect(page.locator('#records-table')).toHaveCount(0);expect(await page.locator('#root').evaluate(node=>node.style.getPropertyValue('--layout-workspace-content-min-block-size'))).toBe('');expect(await requestCount(page)).toBe(count);expect(await page.evaluate(()=>window.dataTableDemo.getActions())).toEqual([]);
    expect(await page.evaluate(()=>window.xuiTheme===window.savedTheme&&!window.savedTheme.isDestroyed())).toBe(true);
  });

  for(const viewport of viewports)test(`${kind} ${viewport.width}px: optional internal toolbar owns the same controls exactly once`,async({page},info)=>{
    await setup(page,kind,{query:'?internal',viewport});await assertWorkspace(page,{internal:true});await scrollToEnd(page);await search(page).fill('记录 125');await ready(page);await expect(rows(page)).toHaveCount(1);await expect(search(page)).toBeFocused();await capture(page,info,`internal-tools-${viewport.width}`);
  });

  for(const theme of ['light','dark','system'])for(const viewport of viewports)test(`${kind} cards ${theme} ${viewport.width}px: public ScrollArea/Grid/Surface consume the same fixed page slots`,async({page},info)=>{
    await setup(page,kind,{query:'?cards&size=100',theme,viewport});await expect(table(page)).toHaveCount(0);await expect(page.getByRole('group',{name:'记录筛选',exact:true})).toHaveCount(1);await expect(page.locator('.xui-shell-page-toolbar:visible')).toHaveCount(1);
    const region=page.getByRole('region',{name:'合成记录卡片',exact:true});await expect(region.locator('.xui-surface')).toHaveCount(100);const before=await metrics(page);near(before.cards.height,before.content.contentHeight,'public card root fills allocated content');
    for(const key of ['document','main','content','cards'])normalContainer(before,key);expect(before.cardViewport.scrollHeight).toBeGreaterThan(before.cardViewport.clientHeight);
    await region.hover();await page.mouse.wheel(0,260);await expect.poll(()=>region.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);await region.evaluate(node=>{node.scrollTop=node.scrollHeight;});await expect.poll(()=>region.evaluate(node=>node.scrollHeight-node.clientHeight-node.scrollTop)).toBeLessThanOrEqual(1.5);
    const after=await metrics(page);for(const key of ['header','toolbar','cards'])stays(before,after,key);for(const key of ['document','main','content'])normalContainer(after,key);
    const last=await region.locator('.xui-surface').last().boundingBox();expect(last.y+last.height).toBeLessThanOrEqual(after.cardViewport.bottom+1.5);
    await search(page).fill('记录 125');await ready(page);await expect(region.locator('.xui-surface')).toHaveCount(1);await expect(search(page)).toBeFocused();await capture(page,info,`cards-${theme}-${viewport.width}`);
  });

  for(const viewport of viewports)test(`${kind} ${viewport.width}px: long Chinese title and filters wrap without overflow`,async({page},info)=>{
    await setup(page,kind,{query:'?long',viewport});await assertWorkspace(page);await scrollToEnd(page);await reachable(page.getByRole('button',{name:'刷新',exact:true}));await reachable(search(page));await capture(page,info,`long-title-${viewport.width}`);
  });

  test(`${kind}: the public minimum token updates without remounting and host teardown releases it`,async({page})=>{
    await setup(page,kind);await saveIdentity(page);await search(page).focus();
    await page.locator('.xui-shell').evaluate(node=>node.style.setProperty('--layout-workspace-content-min-block-size','var(--control-height)'));
    await page.evaluate(()=>window.dataTableDemo.owner.refresh());await ready(page);await assertIdentity(page);await expect(search(page)).toBeFocused();
    expect(await page.locator('.xui-shell').evaluate(node=>node.style.getPropertyValue('--layout-workspace-content-min-block-size'))).toBe('var(--control-height)');
    await page.locator('.xui-shell').evaluate(node=>node.style.setProperty('--layout-workspace-content-min-block-size','var(--data-table-min-block-size)'));
    await assertWorkspace(page);await page.evaluate(()=>window.dataTableDemo.destroy());
    expect(await page.locator('#root').evaluate(node=>node.style.getPropertyValue('--layout-workspace-content-min-block-size'))).toBe('');
  });

  for(const condition of ['tall','text-200'])test(`${kind} ${condition}: oversized page chrome retains a reachable scroll fallback`,async({page},info)=>{
    await setup(page,kind,{query:condition==='tall'?'?tall':'?long',viewport:viewports[1]});
    if(condition==='text-200'){await page.evaluate(()=>document.documentElement.style.fontSize='200%');await settle(page);}
    await capture(page,info,`${condition}-before-focus`);expect((await metrics(page)).content.clientHeight,'explicit public minimum keeps the content viewport reachable').toBeGreaterThan(0);
    expect(await page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1.5),'no document horizontal overflow').toBe(true);
    await reachable(page.getByRole('button',{name:'刷新',exact:true}));await reachable(search(page));await reachable(page.getByRole('combobox',{name:'来源',exact:true}));await reachable(size(page));await reachable(next(page));
    const m=await metrics(page);expect(m.main.scrollHeight>m.main.clientHeight||m.content.scrollHeight>m.content.clientHeight,'oversized chrome has a real fallback scroll range').toBe(true);
    await body(page).evaluate(node=>{node.scrollTop=node.scrollHeight;});await expect.poll(()=>body(page).evaluate(node=>node.scrollHeight-node.clientHeight-node.scrollTop)).toBeLessThanOrEqual(1.5);await reachable(size(page));await reachable(next(page));await capture(page,info,condition);
  });
}

test('React direct AppShell consumes the same pageHeader/pageToolbar/DataTable contract',async({page})=>{
  await setup(page,'react',{query:'?direct'});await assertWorkspace(page);await scrollToEnd(page);
});
