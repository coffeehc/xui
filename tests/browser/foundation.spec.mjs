import {test,expect} from '@playwright/test';
for(const kind of ['vanilla','react']){
 const url=`/foundation-${kind}/`;
 test(`${kind}: real cold startup has readable critical content and explicit module failure recovery`,async({page},info)=>{
  let release;const blocked=new Promise(resolve=>release=resolve);let fail=false;
  await page.route(`**/foundation-${kind}/app.js`,async route=>{if(fail){await route.abort('failed');return;}const response=await route.fetch();await blocked;await route.fulfill({response});});
  await page.goto(url,{waitUntil:'commit'});await expect(page.getByText('正在加载界面。',{exact:true})).toBeVisible();const primary=page.getByRole('button',{name:'新建记录',exact:true}),before=await primary.boundingBox();await expect(primary).toBeDisabled();await expect(page.getByRole('heading',{name:'记录列表',exact:true})).toBeVisible();expect(before.y+before.height).toBeLessThan(800);
  release();await expect(primary).toBeEnabled();const after=await primary.boundingBox();expect(Math.abs(after.y-before.y)).toBeLessThan(1);await info.attach('startup-layout.json',{body:JSON.stringify({before,after}),contentType:'application/json'});
  fail=true;await page.reload();await expect(page.getByText('界面加载失败',{exact:true})).toBeVisible();fail=false;await page.getByRole('button',{name:'重新加载界面',exact:true}).click();await expect(primary).toBeEnabled();await expect(page.getByText('界面加载失败',{exact:true})).not.toBeVisible();
 });
 test(`${kind}: controlled host theme persists one JSON key and follows system`,async({page})=>{
  await page.emulateMedia({colorScheme:'dark'});
  await page.addInitScript(()=>{localStorage.setItem('ui.theme.mode','light');localStorage.setItem('xui.example.host-settings',JSON.stringify({appearance:{mode:'system'},retained:'host-value'}));});
  await page.goto(url);await expect(page.getByLabel('外观',{exact:true})).toHaveValue('system');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
  await page.getByLabel('外观',{exact:true}).selectOption('light');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('xui.example.host-settings')))).toMatchObject({appearance:{mode:'light'},retained:'host-value'});
  expect(await page.evaluate(()=>localStorage.getItem('ui.theme.mode'))).toBe('light');
  await page.getByLabel('外观',{exact:true}).selectOption('system');await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
  await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
 });
 test(`${kind}: public list/form/detail layout, error focus and narrow navigation`,async({page})=>{
  await page.goto(url);const title=page.getByRole('heading',{name:'记录列表',exact:true}),primary=page.getByRole('button',{name:'新建记录',exact:true});
  for(const node of [title,primary]){const box=await node.boundingBox();expect(box.y+box.height).toBeLessThan(800);}
  await page.getByLabel('搜索记录',{exact:true}).fill('没有这样的记录');await expect(page.getByText('没有匹配记录',{exact:true})).toBeVisible();await page.getByRole('button',{name:'清除条件',exact:true}).click();
  await primary.click();await page.getByRole('textbox',{name:/^名称/}).fill('');await page.getByRole('button',{name:'保存记录',exact:true}).click();await expect(page.getByText('请填写名称，草稿未保存。',{exact:true})).toBeVisible();await expect(page.getByRole('textbox',{name:/^名称/})).toBeFocused();
  await page.getByRole('textbox',{name:/^名称/}).fill('长中文名称'.repeat(30));await page.getByRole('button',{name:'保存记录',exact:true}).click();await expect(page.getByText('记录已保存在示例内存中。',{exact:true})).toBeVisible();
  await page.getByRole('link',{name:'详情',exact:true}).click();await expect(page.getByRole('heading',{name:'记录详情',exact:true})).toBeVisible();await page.getByRole(kind==='react'?'link':'button',{name:'返回列表',exact:true}).click();
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'打开导航',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();await expect(page.getByRole('button',{name:'打开导航',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'打开导航',exact:true}).click();await page.getByRole('link',{name:'表单',exact:true}).click();await expect(page.getByRole('heading',{name:'编辑记录',exact:true})).toBeVisible();
  for(const scale of [1,2]){await page.evaluate(scale=>document.documentElement.style.fontSize=`${scale*100}%`,scale);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);const box=await page.getByRole('button',{name:'保存记录',exact:true}).boundingBox();expect(box.y+box.height).toBeLessThan(844);}
 });
 test(`${kind}: delayed optional JS keeps critical actions visible, cancel ignores late completion`,async({page},info)=>{
  let release;const blocked=new Promise(resolve=>release=resolve);const requests=[];
  page.on('request',request=>requests.push(request.url()));
  await page.route('**/heavy-panel.js?*',async route=>{const response=await route.fetch();await blocked;await route.fulfill({response});});
  await page.addInitScript(()=>{window.layoutShifts=[];new PerformanceObserver(list=>{for(const entry of list.getEntries())window.layoutShifts.push({value:entry.value,hadRecentInput:entry.hadRecentInput});}).observe({type:'layout-shift',buffered:true});});
  await page.goto(url);expect(requests.some(value=>value.includes('heavy-panel.js'))).toBe(false);expect(requests.some(value=>value.includes('optional.css'))).toBe(false);
  const anchor=page.getByRole('button',{name:'新建记录',exact:true}),before=await anchor.boundingBox();
  await page.getByRole('button',{name:'打开工具',exact:true}).click();await expect(page.getByText('正在加载工具。',{exact:true})).toBeVisible();await expect(anchor).toBeEnabled();await anchor.click();await expect(page.getByRole('heading',{name:'编辑记录',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'取消加载',exact:true}).click();release();await page.waitForTimeout(150);await expect(page.getByLabel('类别',{exact:true})).toHaveCount(0);await expect(page.getByText('工具尚未打开',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'取消编辑',exact:true}).click();const after=await anchor.boundingBox();expect(Math.abs(after.y-before.y)).toBeLessThan(1);
  await info.attach('critical-layout.json',{body:JSON.stringify({before,after,shifts:await page.evaluate(()=>window.layoutShifts)}),contentType:'application/json'});
 });
 test(`${kind}: failed dynamic import retries; failed refresh retains values and controls`,async({page})=>{
  let fail=true;await page.route('**/heavy-panel.js?*',route=>fail?route.abort('failed'):route.continue());
  await page.goto(url);await page.getByRole('button',{name:'打开工具',exact:true}).click();await expect(page.getByText('工具加载失败',{exact:true})).toBeVisible();
  fail=false;await page.getByRole('button',{name:'重试工具',exact:true}).click();await expect(page.getByLabel('类别',{exact:true})).toBeVisible();
  if(kind==='vanilla')await page.getByLabel('类别',{exact:true}).selectOption('重要');else{await page.getByLabel('类别',{exact:true}).click();await page.getByRole('option',{name:'重要',exact:true}).click();}
  fail=true;await page.getByRole('button',{name:'刷新工具',exact:true}).click();await expect(page.getByText('工具加载失败',{exact:true})).toBeVisible();await expect(page.getByLabel('类别',{exact:true})).toBeVisible();
  if(kind==='vanilla')await expect(page.getByLabel('类别',{exact:true})).toHaveValue('重要');else await expect(page.getByLabel('类别',{exact:true})).toHaveText('重要');
  await page.getByRole('button',{name:'更多设置',exact:false}).click();await expect(page.getByLabel('显示完成项',{exact:true})).toBeVisible();
 });
 test(`${kind}: optional CSS failure can retry without orphan links`,async({page})=>{
  let fail=true;await page.route('**/optional.css',route=>fail?route.abort('failed'):route.continue());await page.goto(url);await page.getByRole('button',{name:'打开工具',exact:true}).click();await expect(page.getByText('工具加载失败',{exact:true})).toBeVisible();await expect(page.locator('link[href="./optional.css"]')).toHaveCount(0);
  fail=false;await page.getByRole('button',{name:'重试工具',exact:true}).click();await expect(page.getByLabel('类别',{exact:true})).toBeVisible();await expect(page.locator('link[href="./optional.css"]')).toHaveCount(1);
 });
 test(`${kind}: menu keyboard and disabled guard, popover cancellation, tooltip keyboard and toast dismissal`,async({page})=>{
  await page.goto(url);await page.getByRole('button',{name:'打开工具',exact:true}).click();await expect(page.getByLabel('类别',{exact:true})).toBeVisible();
  const menu=page.getByRole('button',{name:'更多操作',exact:true});await menu.focus();await page.keyboard.press('ArrowDown');await expect(page.getByRole('menuitem',{name:'显示通知',exact:true})).toBeFocused();await page.keyboard.press('ArrowDown');if(kind==='react'){await expect(page.getByRole('menuitem',{name:'暂不可用',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(page.getByRole('menu')).toBeVisible();await page.keyboard.press('ArrowDown');}await expect(page.getByRole('menuitem',{name:'关闭菜单',exact:true})).toBeFocused();await page.keyboard.press('Home');await page.keyboard.press('Enter');await expect(page.getByText('当前类别：普通',{exact:true})).toBeVisible();await expect(menu).toBeFocused();if(kind==='react'){await page.keyboard.press('F6');await expect(page.locator('.xui-toast-viewport')).toBeFocused();}await page.getByRole('button',{name:'关闭通知',exact:true}).click();await expect(page.getByText('当前类别：普通',{exact:true})).not.toBeVisible();
  const help=page.getByRole('button',{name:'帮助',exact:true});await help.click();await expect(page.getByRole('heading',{name:'使用帮助',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('heading',{name:'使用帮助',exact:true})).not.toBeVisible();await expect(help).toBeFocused();
  const tip=page.getByRole('button',{name:'状态提示',exact:true});await tip.focus();await expect(page.getByRole('tooltip')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('tooltip')).not.toBeVisible();
 });
}
