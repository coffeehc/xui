import {test as base,expect,chromium} from '@playwright/test';
import {paint,roleColor} from './semantic-paint.mjs';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const test=base.extend({page:async({page},use,info)=>{const errors=[];page.on('pageerror',error=>errors.push(error.message));await use(page);await info.attach('page-errors.json',{body:JSON.stringify(errors),contentType:'application/json'});expect(errors).toEqual([]);}});
const card=(page,id)=>page.locator(`#${id}.xui-chart`),plot=(page,id)=>card(page,id).locator('svg.xui-chart-plot');
async function ready(page){await expect.poll(()=>page.evaluate(()=>window.chartDemo?.resource.getState().status)).toBe('ready');await expect.poll(()=>plot(page,'line').evaluate(node=>node.getBoundingClientRect().width)).toBeGreaterThan(100);}
async function setup(page,mode='light',preset='violet',extra=''){
  await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.goto(`/charts-react/?mode=${mode}&preset=${preset}${extra}`);await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme-preset',preset);
}
async function load(page,fixture,key='chart-scope',delay=10){await page.evaluate(([fixture,key,delay])=>window.chartDemo.load(fixture,key,delay),[fixture,key,delay]);}
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
async function screenshot(page,info,name){await info.attach(name,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});}
for(const mode of ['light','dark','system'])for(const preset of ['violet','ember','forest','crimson','cobalt','precision'])test(`charts ${mode} ${preset}: tokens, geometry and accessible content`,async({page},info)=>{
  await setup(page,mode,preset);
  for(const id of ['line','bar','pie']){await expect(plot(page,id)).toHaveCount(1);expect((await paint(card(page,id).locator('.xui-card-title'))).contrast).toBeGreaterThanOrEqual(4.5);}
  const line=card(page,'line');expect(await line.locator('[data-series-id="research"] .xui-chart-line').getAttribute('d')).toMatch(/M.*L.*M/);
  expect(await line.locator('[data-series-id="research"] .xui-chart-point').count()).toBe(5);
  expect(await line.locator('[data-series-id="review"]').getAttribute('data-shape')).not.toBe(await line.locator('[data-series-id="research"]').getAttribute('data-shape'));
  for(const series of await page.locator('.xui-chart-series').all())expect((await paint(series)).contrast).toBeGreaterThanOrEqual(3);
  for(const text of await page.locator('.xui-chart-legend li span:last-child,.xui-chart-tick').all())expect((await paint(text)).contrast).toBeGreaterThanOrEqual(4.5);
  const bar=card(page,'bar'),baseline=Number(await bar.locator('.xui-chart-grid[data-zero="true"]').getAttribute('y1'));
  const positive=bar.locator('[data-series-id="changes"] [data-category-id="day-0"]'),negative=bar.locator('[data-series-id="changes"] [data-category-id="day-1"]'),zero=bar.locator('[data-series-id="changes"] [data-category-id="day-4"]');
  expect(Number(await positive.getAttribute('y'))).toBeLessThan(baseline);expect(Number(await negative.getAttribute('y'))).toBeCloseTo(baseline,1);expect(Number(await zero.getAttribute('height'))).toBe(0);
  await expect(bar.locator('.xui-chart-tick').getByText('0',{exact:true})).toHaveCount(1);
  expect(await card(page,'pie').locator('[data-slice-id="d"]').count()).toBe(0);expect(await card(page,'pie').locator('.xui-chart-pie-legend').innerText()).toContain('0 · 0%');
  if(mode==='system'){const before=await roleColor(page,'--chart-color-1');await page.emulateMedia({colorScheme:'light'});await expect.poll(()=>roleColor(page,'--chart-color-1')).not.toBe(before);}
  await noOverflow(page);await screenshot(page,info,`charts-${preset}-${mode}.png`);
});
for(const mode of ['light','dark','system'])for(const dimensions of [{width:390,font:1},{width:390,font:2},{width:320,font:2}])test(`charts ${mode} ${dimensions.width} text${dimensions.font}: long Chinese and local scrolling`,async({page},info)=>{
  await page.setViewportSize({width:dimensions.width,height:900});await setup(page,mode,'forest','&long');
  if(dimensions.font===2)await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  await noOverflow(page);
  for(const id of ['line','bar','pie']){const svg=plot(page,id);await svg.focus();await expect(svg).toBeFocused();await svg.press('Home');expect((await card(page,id).locator('.xui-chart-inspection').innerText()).length).toBeGreaterThan(0);expect(await svg.evaluate(node=>getComputedStyle(node).fontSize)).toBe(`${12*dimensions.font}px`);}
  const viewport=card(page,'line').locator('.xui-chart-viewport');expect(await viewport.evaluate(node=>node.scrollWidth>node.clientWidth)).toBe(true);await viewport.evaluate(node=>node.scrollLeft=0);await plot(page,'line').press('End');await expect(card(page,'line').locator('.xui-chart-inspection')).toContainText('6');
  expect(await card(page,'line').locator('[data-series-id="research"] [data-category-id="day-5"]').evaluate(node=>{const point=node.getBoundingClientRect(),area=node.closest('.xui-chart-viewport').getBoundingClientRect();return point.left>=area.left&&point.right<=area.right;})).toBe(true);
  await card(page,'line').getByRole('button',{name:'查看数据表格',exact:true}).click();await expect(card(page,'line').getByRole('table')).toBeVisible();await noOverflow(page);await screenshot(page,info,`charts-${mode}-${dimensions.width}-text${dimensions.font}.png`);
});
test('chart keyboard inspection, missing samples, table equivalence and localization',async({page})=>{
  await setup(page);const line=plot(page,'line'),readout=card(page,'line').locator('.xui-chart-inspection');
  await line.focus();await line.press('Home');await expect(readout).toHaveText('10/12 · 采样任务: 40');await line.press('ArrowRight');await line.press('ArrowRight');await expect(readout).toContainText('缺少采样');await line.press('ArrowDown');await expect(readout).toHaveText('10/14 · 复核任务: 30');await line.press('End');await expect(readout).toContainText('70');await line.press('Escape');await expect(readout).toBeEmpty();
  const button=card(page,'line').getByRole('button',{name:'查看数据表格',exact:true});await button.focus();await button.press('Space');const table=card(page,'line').getByRole('table');await expect(table.getByRole('row')).toHaveCount(13);await expect(table.getByRole('cell',{name:'缺少采样',exact:true})).toHaveCount(1);await card(page,'line').getByRole('button',{name:'收起数据表格'}).press('Enter');await expect(table).toHaveCount(0);
  await page.evaluate(()=>window.chartDemo.setLanguage('en'));await expect(card(page,'line').getByRole('button',{name:'View data',exact:true})).toBeVisible();await line.focus();await line.press('Home');await line.press('ArrowRight');await line.press('ArrowRight');await expect(readout).toContainText('Missing');
  await plot(page,'pie').focus();await plot(page,'pie').press('End');await expect(card(page,'pie').locator('.xui-chart-inspection')).toContainText('待分配: 0 · 0%');
});
test('same-scope refresh/error preserves nodes, reading, scroll and the original Resource',async({page},info)=>{
  await page.setViewportSize({width:390,height:900});await setup(page);const line=plot(page,'line'),readout=card(page,'line').locator('.xui-chart-inspection');
  await line.focus();await line.press('End');await page.evaluate(()=>{const chart=document.querySelector('#line'),scroll=chart.querySelector('.xui-chart-viewport');scroll.scrollLeft=100;window.chartIdentity={svg:chart.querySelector('svg.xui-chart-plot'),point:chart.querySelector('[data-series-id="research"] [data-category-id="day-5"]'),top:chart.querySelector('svg.xui-chart-plot').getBoundingClientRect().top,scroll:scroll.scrollLeft,calls:window.chartDemo.calls};void window.chartDemo.load('normal','chart-scope',700);});
  await expect(card(page,'line').locator('.xui-chart-region')).toHaveAttribute('aria-busy','true');await expect(line).toBeVisible();await expect(line).toBeFocused();await expect(readout).toContainText('95');
  await ready(page);expect(await page.evaluate(()=>{const chart=document.querySelector('#line'),snapshot=window.chartIdentity;return chart.querySelector('svg.xui-chart-plot')===snapshot.svg&&chart.querySelector('[data-series-id="research"] [data-category-id="day-5"]')===snapshot.point&&Math.abs(chart.querySelector('svg.xui-chart-plot').getBoundingClientRect().top-snapshot.top)<1&&chart.querySelector('.xui-chart-viewport').scrollLeft===snapshot.scroll&&window.chartDemo.calls===snapshot.calls+1;})).toBe(true);
  await load(page,'error');await expect(card(page,'line').getByRole('alert')).toContainText('图表加载失败');await expect(line).toBeFocused();await expect(line).toBeVisible();await card(page,'line').getByRole('button',{name:'重试',exact:true}).click();await ready(page);await screenshot(page,info,'charts-refresh-preserved.png');
});
test('reorder/removal and new scope never report a stale record; empty/zero/single states are honest',async({page})=>{
  await setup(page);await plot(page,'line').focus();await plot(page,'line').press('Home');await load(page,'reverse');await expect(card(page,'line').locator('.xui-chart-inspection')).toHaveText('10/12 · 采样任务: 40');
  await load(page,'normal');await plot(page,'line').press('End');await expect(card(page,'line').locator('.xui-chart-inspection')).toContainText('95');await load(page,'single');await expect(card(page,'line').locator('.xui-chart-inspection')).toBeEmpty();await plot(page,'line').press('Home');await expect(card(page,'line').locator('.xui-chart-inspection')).toContainText('0');await expect(card(page,'pie').locator('circle.xui-chart-slice')).toHaveCount(1);
  await load(page,'zero');await expect(card(page,'pie').getByText('暂无图表数据',{exact:true})).toBeVisible();await expect(card(page,'pie').locator('.xui-chart-slice')).toHaveCount(0);await expect(plot(page,'line')).toBeVisible();
  await page.evaluate(()=>{void window.chartDemo.load('normal','new-scope',600);});await expect(card(page,'line').getByText('正在加载图表',{exact:true})).toBeVisible();await expect(plot(page,'line')).toHaveCount(0);await ready(page);
  await page.evaluate(()=>{void window.chartDemo.load('reverse','stale-scope',900);void window.chartDemo.load('empty','final-scope',20);});await expect.poll(()=>page.evaluate(()=>window.chartDemo.resource.getState().key)).toBe('final-scope');await expect(card(page,'line').getByText('暂无图表数据',{exact:true})).toBeVisible();await page.waitForTimeout(950);await expect(plot(page,'line')).toHaveCount(0);
});
test('RTL keeps category coordinates aligned and the top tick inside its scroll viewport',async({page})=>{
  await setup(page,'light','violet','&dir=rtl');
  const geometry=await card(page,'line').evaluate(node=>{const axis=node.querySelector('.xui-chart-x-axis span').getBoundingClientRect(),point=node.querySelector('[data-series-id="research"] [data-category-id="day-0"]').getBoundingClientRect(),viewport=node.querySelector('.xui-chart-viewport').getBoundingClientRect(),ticks=[...node.querySelectorAll('.xui-chart-tick')].map(item=>item.getBoundingClientRect());return {alignment:Math.abs((axis.left+axis.right-point.left-point.right)/2),top:Math.min(...ticks.map(item=>item.top))-viewport.top,bottom:viewport.bottom-Math.max(...ticks.map(item=>item.bottom))};});
  expect(geometry.alignment).toBeLessThan(1);expect(geometry.top).toBeGreaterThanOrEqual(0);expect(geometry.bottom).toBeGreaterThanOrEqual(0);await noOverflow(page);
  await page.setViewportSize({width:390,height:900});
  // ResizeObserver must commit the new physical geometry before inspecting it.
  await expect.poll(()=>card(page,'line').evaluate(node=>{const axis=node.querySelector('.xui-chart-x-axis span').getBoundingClientRect(),point=node.querySelector('[data-series-id="research"] [data-category-id="day-0"]').getBoundingClientRect();return Math.abs((axis.left+axis.right-point.left-point.right)/2);})).toBeLessThan(1);
  for(const key of ['Home','End']){await plot(page,'line').focus();await plot(page,'line').press(key);const id=key==='Home'?'day-0':'day-5',boundary=await card(page,'line').locator(`[data-series-id="research"] [data-category-id="${id}"]`).evaluate(node=>{const point=node.getBoundingClientRect(),parent=node.closest('.xui-chart-viewport'),area=parent.getBoundingClientRect();return {left:point.left,right:point.right,area:area.toJSON(),scrollLeft:parent.scrollLeft,scrollWidth:parent.scrollWidth,plot:node.closest('svg').getBoundingClientRect().toJSON()};});expect(boundary.left>=boundary.area.left&&boundary.right<=boundary.area.right,`${key}: ${JSON.stringify(boundary)}`).toBe(true);}
});
for(const scale of [1.25,1.5,2])test(`public interface scale ${scale} preserves readable chart slots`,async({page},info)=>{
  await page.addInitScript(value=>sessionStorage.setItem('ui.interface.scale',String(value)),scale);await page.setViewportSize({width:390,height:900});await setup(page,'light','crimson','&long');
  expect(await plot(page,'line').evaluate(node=>parseFloat(getComputedStyle(node).fontSize))).toBeCloseTo(12*scale,1);await plot(page,'line').focus();await plot(page,'line').press('End');await expect(card(page,'line').locator('.xui-chart-inspection')).toContainText('95');await noOverflow(page);await screenshot(page,info,`charts-interface-${scale}.png`);
});
test('idle/loading/first error use component-centered feedback and retry only on intent',async({page},info)=>{
  await page.goto('/charts-react/?mode=light&idle');await expect(card(page,'line').getByText('执行查询后查看图表')).toBeVisible();expect(await page.evaluate(()=>window.chartDemo.calls)).toBe(0);
  await page.evaluate(()=>{void window.chartDemo.load('error','chart-scope',600);});const state=card(page,'line').locator('.xui-loading-state');await expect(state).toBeVisible();
  const delta=await state.evaluate(node=>{const label=node.querySelector('.xui-loading-label').getBoundingClientRect(),region=node.closest('.xui-chart-placeholder').getBoundingClientRect();return Math.abs((label.top+label.bottom)/2-(region.top+region.bottom)/2);});expect(delta).toBeLessThan(30);
  await expect(card(page,'line').getByRole('alert')).toBeVisible();expect(await page.evaluate(()=>window.chartDemo.calls)).toBe(1);await screenshot(page,info,'charts-first-error.png');
});
test('ResizeObserver cleanup, custom token inheritance, reduce motion and forced colors',async({page})=>{
  await page.addInitScript(()=>{const Native=window.ResizeObserver;window.chartObservers=0;window.ResizeObserver=class extends Native{counted=false;observe(node,...args){if(node.tagName.toLowerCase()==='svg'&&!this.counted){window.chartObservers++;this.counted=true;}return super.observe(node,...args);}disconnect(){if(this.counted){window.chartObservers--;this.counted=false;}return super.disconnect();}};});
  await setup(page);await expect.poll(()=>page.evaluate(()=>window.chartObservers)).toBe(3);
  await page.evaluate(()=>document.documentElement.style.setProperty('--chart-color-1','var(--action-primary)'));expect((await paint(card(page,'line').locator('[data-series-id="research"]'))).color).toBe(await roleColor(page,'--action-primary'));
  await page.emulateMedia({forcedColors:'active'});await plot(page,'line').focus();await expect(plot(page,'line')).toBeFocused();await card(page,'line').getByRole('button',{name:'查看数据表格'}).click();await expect(card(page,'line').getByRole('table')).toBeVisible();
  await load(page,'empty');await expect.poll(()=>page.evaluate(()=>window.chartObservers)).toBe(0);await load(page,'normal');await expect.poll(()=>page.evaluate(()=>window.chartObservers)).toBe(3);
});
test('touch can inspect chart values and open the equivalent table',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:900},hasTouch:true,isMobile:true});try{const page=await context.newPage();await setup(page);await plot(page,'line').tap({position:{x:90,y:90}});await expect(card(page,'line').locator('.xui-chart-inspection')).toContainText(/[0-9]/);await card(page,'pie').getByRole('button',{name:'查看数据表格'}).tap();await expect(card(page,'pie').getByRole('table')).toBeVisible();await noOverflow(page);}finally{await context.close();}
});
for(const mode of ['light','dark','system'])test(`charts ${mode} genuine browser 200% zoom`,async({},info)=>{
  test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});try{
    const page=await context.newPage();await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.goto(`http://127.0.0.1:4173/charts-react/?mode=${mode}&long`);await ready(page);const before=await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth,font:getComputedStyle(document.documentElement).fontSize}));
    const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);await noOverflow(page);expect(await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize)).toBe(before.font);
    await plot(page,'line').focus();await plot(page,'line').press('End');await expect(card(page,'line').locator('.xui-chart-inspection')).toContainText('95');await card(page,'pie').getByRole('button',{name:'查看数据表格'}).click();await expect(card(page,'pie').getByRole('table')).toBeVisible();await info.attach(`charts-${mode}-real-zoom.png`,{body:await captureZoomViewport(page),contentType:'image/png'});await info.attach('zoom.json',{body:JSON.stringify({before,after:await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth,font:getComputedStyle(document.documentElement).fontSize,cssZoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}))}),contentType:'application/json'});
  }finally{await context.close();}
});
