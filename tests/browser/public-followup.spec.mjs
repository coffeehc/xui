import {test,expect,chromium} from '@playwright/test';
import {chooseSelect,expectSelectValue} from './select-interaction.mjs';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';

async function setup(page,{theme='light',width=1280,height=900,font=16}={}){
 await page.setViewportSize({width,height});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(({theme,font})=>{sessionStorage.setItem('ui.theme.mode',theme);document.addEventListener('DOMContentLoaded',()=>document.documentElement.style.fontSize=font+'px',{once:true});},{theme,font});
}
async function expectMetadataFits(page){
 const bounds=await page.locator('.xui-data-table .xui-table-value,.xui-data-table .xui-table-label').evaluateAll(nodes=>nodes.map(node=>{const range=document.createRange();range.selectNodeContents(node);const text=range.getBoundingClientRect(),cell=node.closest('td,th').getBoundingClientRect();return {text:node.textContent,left:text.left-cell.left,right:text.right-cell.right};}));
 expect(bounds.length).toBeGreaterThan(0);for(const item of bounds){expect(item.left,item.text).toBeGreaterThanOrEqual(-1);expect(item.right,item.text).toBeLessThanOrEqual(1);}
}
async function pointerOptions(page,info){
 const create=page.getByRole('button',{name:'创建 API Key',exact:true});await create.click();
 const dialog=page.getByRole('dialog'),select=dialog.getByRole('combobox',{name:'有效期',exact:true}),draft=dialog.getByRole('textbox',{name:'名称',exact:true});await draft.fill('跨区域协作研究与运营监控密钥');
 await select.evaluate(node=>window.followupSelect=node);
 const hits=[];
 for(const [value,label] of [['demo.never','示例：无到期时间'],['demo.30d','示例：30 天']]){
  await select.click();const option=page.getByRole('option',{name:label,exact:true});await option.scrollIntoViewIfNeeded();
  const hit=await option.evaluate(node=>{const r=node.getBoundingClientRect(),target=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2),positioner=node.closest('.xui-positioner');return {text:node.textContent,hit:node.contains(target),target:target?.className,z:getComputedStyle(positioner).zIndex,scroll:getComputedStyle(node.closest('.xui-floating')).overflowY};});
  expect(hit.hit).toBe(true);expect(Number(hit.z)).toBeGreaterThan(50);expect(hit.scroll).toBe('auto');hits.push(hit);
  await option.click();await expectSelectValue(page,select,value,label);expect(await page.evaluate(()=>window.apiKeyDemo.controller.getState().draft.expiryId)).toBe(value);await expect(draft).toHaveValue('跨区域协作研究与运营监控密钥');
 }
 await select.focus();await page.keyboard.press('Enter');await expect(page.getByRole('option',{name:'示例：30 天',exact:true})).toBeFocused();await page.keyboard.press('End');await page.keyboard.press('Enter');await expectSelectValue(page,select,'demo.never','示例：无到期时间');
 await select.focus();await page.keyboard.press('Enter');await expect(page.getByRole('listbox')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('listbox')).toBeHidden();await expect(dialog).toBeVisible();await expect(select).toBeFocused();
 expect(await select.evaluate(node=>node===window.followupSelect)).toBe(true);await info.attach('select-hit.json',{body:JSON.stringify(hits,null,2),contentType:'application/json'});await info.attach('select-dialog.png',{body:await page.screenshot(),contentType:'image/png'});
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(create).toBeFocused();
}
for(const theme of ['light','dark','system'])for(const [width,height,font] of [[1280,900,16],[390,720,16],[1280,500,32],[390,560,32]])test(`public select footer pointer ${theme} ${width}x${height} font${font}`,async({page},info)=>{
 await setup(page,{theme,width,height,font});await page.goto('/api-key-react/');await pointerOptions(page,info);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('API key DataTable paginates complete rows without querying and retains rows/focus during refresh',async({page},info)=>{
 await setup(page);await page.goto('/api-key-react/');await expect(page.getByRole('cell',{name:'资料读取',exact:true})).toBeVisible();
 await expectMetadataFits(page);await expect(page.locator('.xui-data-table').getByRole('columnheader')).toHaveCount(8);await expect(page.getByRole('columnheader',{name:'前缀',exact:true})).toBeVisible();
 await page.evaluate(()=>{const base=window.apiKeyDemo.controller.getState().rows[0];window.apiKeyDemo.setRows(Array.from({length:23},(_,index)=>({...base,id:`page-${index}`,name:`研究与运营长期可用记录 ${index}`,status:index===22?'revoked':'active'})));});await page.getByRole('button',{name:'刷新列表'}).click();
 const table=page.locator('.xui-data-table'),count=table.locator('.xui-data-table-count');await expect(count).toHaveText('本页 10 条，共 23 条');expect(await table.locator('tbody tr').count()).toBe(10);
 const requests=await page.evaluate(()=>window.apiKeyDemo.getCalls().list);await page.getByRole('button',{name:'下一页',exact:true}).click();await expect(page.getByRole('cell',{name:'研究与运营长期可用记录 10',exact:true})).toBeVisible();await page.getByRole('button',{name:'下一页',exact:true}).click();await expect(count).toHaveText('本页 3 条，共 23 条');expect(await page.evaluate(()=>window.apiKeyDemo.getCalls().list)).toBe(requests);
 const action=page.getByRole('button',{name:'撤销 研究与运营长期可用记录 20',exact:true});await action.focus();await page.evaluate(()=>{window.apiKeyDemo.setBehavior('list','hold');window.heldKeyRow=document.querySelector('tbody tr');window.apiKeyDemo.controller.refresh();});await expect(count).toHaveText('本页 3 条，共 23 条');await expect(action).toBeFocused();expect(await page.evaluate(()=>window.heldKeyRow===document.querySelector('tbody tr'))).toBe(true);await expect(table.getByRole('button',{name:'下一页',exact:true})).toBeDisabled();
 await page.evaluate(()=>{window.apiKeyDemo.setBehavior('list','ok');window.apiKeyDemo.release('list');});await expect(action).toBeFocused();expect(await page.evaluate(()=>window.heldKeyRow===document.querySelector('tbody tr'))).toBe(true);
 await chooseSelect(page,'每页条数','25');await expect(count).toHaveText('本页 23 条，共 23 条');expect(await page.evaluate(()=>window.apiKeyDemo.getCalls().list)).toBe(requests+1);
 await chooseSelect(page,'每页条数','10');await page.getByRole('button',{name:'下一页',exact:true}).click();await page.getByRole('button',{name:'下一页',exact:true}).click();await page.evaluate(()=>{window.apiKeyDemo.setRows(window.apiKeyDemo.controller.getState().rows.slice(0,11));});await page.getByRole('button',{name:'刷新列表'}).click();await expect(count).toHaveText('本页 1 条，共 11 条');await expect(page.getByRole('cell',{name:'研究与运营长期可用记录 10',exact:true})).toBeVisible();
 await page.evaluate(()=>window.apiKeyDemo.setRows([]));await page.getByRole('button',{name:'刷新列表'}).click();await expect(count).toHaveText('本页 0 条，共 0 条');await expect(table.getByText('没有 API Key',{exact:true})).toBeVisible();await info.attach('api-key-empty.png',{body:await page.screenshot(),contentType:'image/png'});
});
test('API key all-rows opt-out keeps an honest count and local horizontal scrolling at enlarged narrow widths',async({page},info)=>{
 await setup(page,{theme:'dark',width:390,font:32});await page.goto('/api-key-react/?all');await expect(page.getByRole('cell',{name:'资料读取',exact:true})).toBeVisible();
 await page.evaluate(()=>{const base=window.apiKeyDemo.controller.getState().rows[0];window.apiKeyDemo.setRows(Array.from({length:23},(_,index)=>({...base,id:`all-${index}`,name:`跨部门共享研究与运营协作的完整记录 ${index}`})));});await page.getByRole('button',{name:'刷新列表'}).click();
 const table=page.locator('.xui-data-table');await expect(table.locator('tbody tr')).toHaveCount(23);await expect(table.locator('.xui-data-table-count')).toHaveText('已读取 23 条');await expect(page.getByRole('combobox',{name:'每页条数',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'下一页',exact:true})).toHaveCount(0);
 await expectMetadataFits(page);
 const action=page.getByRole('button',{name:'撤销 跨部门共享研究与运营协作的完整记录 22',exact:true});await action.scrollIntoViewIfNeeded();await action.focus();await expect(action).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 const facts=await action.evaluate(node=>{const r=node.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {hit:node.contains(hit),left:r.left,right:r.right,width:innerWidth};});expect(facts.hit).toBe(true);expect(facts.left).toBeGreaterThanOrEqual(0);expect(facts.right).toBeLessThanOrEqual(facts.width+1);
 await info.attach('api-key-all-enlarged.png',{body:await page.screenshot(),contentType:'image/png'});await action.click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(action).toBeFocused();
});
for(const grouped of [false,true])test(`structured log optional records grouped=${grouped} preserves paging, cancel and recovery`,async({page})=>{
 await setup(page,{width:390,font:32});await page.goto('/log-react/'+(grouped?'?grouped':''));await expect(page.locator('[data-log-counts]')).toBeVisible();const view=page.getByRole('combobox',{name:'分组 / 观察记录',exact:true});await expect(view).toHaveCount(grouped?0:1);
 const kinds=()=>page.evaluate(()=>window.logDemo.getRequests().map(request=>request.kind));const before=(await kinds()).length;
 if(grouped){await page.evaluate(()=>window.logDemo.controller.setView('records'));expect((await kinds()).length).toBe(before);}
 const open=page.getByRole('button',{name:'查看观察 demo:g1',exact:true});await open.focus();await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'查看详情 demo:r2',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'所有观察',exact:true})).toHaveCount(grouped?0:1);
 const snapshot=await page.locator('[data-log-snapshot]').textContent();await page.getByRole('button',{name:'下一段',exact:true}).click();await expect(page.locator('[data-log-page]')).toHaveText('已访问段 2');await expect(page.locator('[data-log-snapshot]')).toHaveText(snapshot);await page.getByRole('button',{name:'上一段',exact:true}).click();await expect(page.locator('[data-log-page]')).toHaveText('已访问段 1');
 const detail=page.getByRole('button',{name:'查看详情 demo:r2',exact:true});await detail.click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(detail).toBeFocused();
 await page.evaluate(()=>{window.logDemo.setMode('groupRecords','hold');window.logDemo.controller.refresh();});await expect(page.getByRole('button',{name:'取消读取',exact:true})).toBeVisible();await page.getByRole('button',{name:'取消读取',exact:true}).click();await page.evaluate(()=>window.logDemo.release('groupRecords'));expect(await page.evaluate(()=>window.logDemo.controller.getState().busy)).toBe(false);
 await page.evaluate(()=>window.logDemo.setMode('groupRecords','error'));await page.getByRole('button',{name:'刷新快照',exact:true}).click();await expect(page.getByRole('alert')).toContainText('日志读取失败');await expect(detail).toBeVisible();await page.evaluate(()=>window.logDemo.setMode('groupRecords','ok'));await page.getByRole('button',{name:'重试读取',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);
 if(grouped){await page.getByRole('button',{name:'分组',exact:true}).click();await expect(open).toBeVisible();expect((await kinds()).includes('records')).toBe(false);}else{await page.getByRole('button',{name:'所有观察',exact:true}).click();expect((await kinds()).at(-1)).toBe('records');}
});
for(const theme of ['light','dark','system'])test(`menu separators preserve group boundaries and keyboard ${theme}`,async({page},info)=>{
 await setup(page,{theme,width:390,font:32});await page.goto('/typography-slots-react/');
 for(const context of [false,true]){
  const trigger=context?page.getByText('右键记录区域',{exact:true}):page.getByRole('button',{name:'打开菜单',exact:true});await trigger.scrollIntoViewIfNeeded();await trigger.focus();if(context)await page.keyboard.press('Shift+F10');else await page.keyboard.press('Enter');
  const separator=page.getByRole('separator').filter({visible:true}),menu=page.getByRole('menu');await expect(menu).toBeVisible();await expect(separator).toHaveCount(1);await expect(separator).toHaveCSS('border-top-style','solid');expect(await separator.evaluate(node=>parseFloat(getComputedStyle(node).borderTopWidth))).toBe(1);expect(await separator.getAttribute('tabindex')).not.toBe('0');
  await page.keyboard.press('Home');await expect(menu.getByRole('menuitem').first()).toBeFocused();await page.keyboard.press('ArrowDown');await expect(menu.getByRole('menuitem').last()).toBeFocused();await info.attach(`separator-${context?'context':'menu'}.png`,{body:await page.screenshot(),contentType:'image/png'});await page.keyboard.press('Escape');await expect(menu).toBeHidden();await expect(trigger).toBeFocused();
 }
});
for(const theme of ['light','dark','system'])test(`public followup actual browser zoom200 ${theme}`,async({},info)=>{
 test.setTimeout(90000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,1000']});
 try{
  const page=await context.newPage();await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);await page.goto('http://127.0.0.1:4173/api-key-react/');const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));
  const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);
  const after=await page.evaluate(()=>({width:innerWidth,font:getComputedStyle(document.documentElement).fontSize,css:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.css).toBe('1');expect(after.pinch).toBe(1);await pointerOptions(page,info);await info.attach('actual-zoom.png',{body:await captureZoomViewport(page),contentType:'image/png'});
 }finally{await context.close();}
});
