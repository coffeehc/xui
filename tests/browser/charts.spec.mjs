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
test('public line curve updates preserve the SVG, samples, focus and request owner',async({page})=>{
  await setup(page);const line=plot(page,'line'),path=card(page,'line').locator('[data-series-id="research"] .xui-chart-line'),readout=card(page,'line').locator('.xui-chart-inspection');
  await line.focus();await line.press('End');const text=await readout.innerText(),original=await path.getAttribute('d');
  await page.evaluate(()=>{window.curveIdentity={svg:document.querySelector('#line svg.xui-chart-plot'),path:document.querySelector('#line [data-series-id="research"] .xui-chart-line'),point:document.querySelector('#line [data-series-id="research"] [data-category-id="day-5"]'),calls:window.chartDemo.calls};});
  const paths=[];
  for(const curve of ['linear','monotone','step']){
    await page.evaluate(value=>window.chartDemo.setCurve(value),curve);
    if(curve==='monotone')await expect(path).toHaveAttribute('d',/C/);
    else await expect(path).not.toHaveAttribute('d',/C/);
    paths.push(await path.getAttribute('d'));await expect(line).toBeFocused();await expect(readout).toHaveText(text);
    expect((await path.getAttribute('d')).match(/M/g)).toHaveLength(2);expect(await card(page,'line').locator('[data-series-id="research"] .xui-chart-point').count()).toBe(5);
    expect(await page.evaluate(()=>({svg:window.curveIdentity.svg===document.querySelector('#line svg.xui-chart-plot'),path:window.curveIdentity.path===document.querySelector('#line [data-series-id="research"] .xui-chart-line'),point:window.curveIdentity.point===document.querySelector('#line [data-series-id="research"] [data-category-id="day-5"]'),calls:window.chartDemo.calls-window.curveIdentity.calls}))).toEqual({svg:true,path:true,point:true,calls:0});
  }
  expect(paths[0]).toBe(original);expect(new Set(paths).size).toBe(3);
  await page.evaluate(()=>{void window.chartDemo.load('normal','chart-scope',700);});await expect(card(page,'line').locator('.xui-chart-region')).toHaveAttribute('aria-busy','true');
  await page.evaluate(()=>window.chartDemo.setCurve('monotone'));await expect(path).toHaveAttribute('d',/C/);await expect(line).toBeFocused();await ready(page);
  expect(await page.evaluate(()=>window.chartDemo.calls-window.curveIdentity.calls)).toBe(1);
  await load(page,'empty');await page.evaluate(()=>window.chartDemo.setCurve('step'));await expect(card(page,'line').getByText('暂无图表数据',{exact:true})).toBeVisible();
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
test('chart motion: first entry differs from updates, raw values stay authoritative and refresh never replays',async({page},info)=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/charts-react/?mode=light&idle');
 await page.evaluate(()=>{document.documentElement.style.setProperty('--motion-duration-chart','1000ms');});
 await load(page,'normal');await ready(page);
 for(const id of ['line','bar','pie'])await expect(plot(page,id)).toHaveAttribute('data-motion','enter');
 expect(await card(page,'line').locator('clipPath').count()).toBe(0);
 expect(await card(page,'line').locator('[data-line-reveal-segment]').evaluateAll(nodes=>nodes.some(node=>Number(node.getAttribute('stroke-dashoffset'))>0))).toBe(true);
 await expect.poll(()=>plot(page,'line').getAttribute('data-motion')).toBe('idle');
 await plot(page,'line').focus();await plot(page,'line').press('Home');
 await card(page,'line').getByRole('button',{name:'查看数据表格',exact:true}).click();
 await plot(page,'line').focus();
 await page.evaluate(()=>{const node=document.querySelector('#line svg.xui-chart-plot');window.motionIdentity={node,path:node.querySelector('.xui-chart-line'),point:node.querySelector('.xui-chart-point'),boxes:['line','bar','pie'].map(id=>document.getElementById(id).getBoundingClientRect().toJSON()),calls:window.chartDemo.calls};});
 const before=await card(page,'line').locator('.xui-chart-point').first().getAttribute('transform');
 await load(page,'updated');
 for(const id of ['line','bar','pie'])await expect(plot(page,id)).toHaveAttribute('data-motion','update');
 await expect(card(page,'line').locator('.xui-chart-inspection')).toHaveText('10/12 · 采样任务: 60');
 await expect(plot(page,'line')).toBeFocused();
 await expect(card(page,'line').getByRole('table').getByRole('cell',{name:'60',exact:true})).toHaveCount(1);
 expect(await card(page,'line').locator('[data-series-id="research"] .xui-chart-line').evaluate(node=>(node.getAttribute('d').match(/M/g)||[]).length)).toBe(2);
 expect(await plot(page,'line').evaluate(node=>!node.querySelector('.xui-chart-line').hasAttribute('mask'))).toBe(true);
 await expect.poll(()=>card(page,'line').locator('.xui-chart-point').first().getAttribute('transform')).not.toBe(before);
 await expect.poll(()=>plot(page,'line').getAttribute('data-motion')).toBe('idle');
 expect(await page.evaluate(()=>{const saved=window.motionIdentity,node=document.querySelector('#line svg.xui-chart-plot');return node===saved.node&&node.querySelector('.xui-chart-line')===saved.path&&node.querySelector('.xui-chart-point')===saved.point&&['line','bar','pie'].every((id,index)=>{const current=document.getElementById(id).getBoundingClientRect();return ['top','width','height'].every(key=>Math.abs(current[key]-saved.boxes[index][key])<1);})&&window.chartDemo.calls===saved.calls+1;})).toBe(true);
 await page.evaluate(()=>{window.refreshPhases=[];const svg=document.querySelector('#line svg.xui-chart-plot');window.motionObserver=new MutationObserver(()=>window.refreshPhases.push(svg.dataset.motion));window.motionObserver.observe(svg,{attributes:true,attributeFilter:['data-motion']});void window.chartDemo.load('updated','chart-scope',400);});
 await expect(card(page,'line').locator('.xui-chart-region')).toHaveAttribute('aria-busy','true');await ready(page);await load(page,'error');
 expect(await page.evaluate(()=>{window.motionObserver.disconnect();return window.refreshPhases;})).toEqual([]);
 await screenshot(page,info,'chart-motion-update-preserved.png');
});
test('line and curve entry draws actual path lengths in order and reveals markers at arrival',async({page},info)=>{
 await page.addInitScript(()=>{const Native=window.Animation;window.entryClocks=[];window.Animation=class extends Native{constructor(...args){super(...args);window.entryClocks.push(this);}};});
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/charts-react/?mode=light&idle');
 await load(page,'normal');await ready(page);
 expect(await page.evaluate(()=>window.entryClocks.map(clock=>clock.effect.getTiming().duration).sort((a,b)=>a-b))).toEqual([900,900,900]);
 await expect(plot(page,'line')).toHaveAttribute('data-motion','idle');
 await page.evaluate(()=>{window.entryClocks=[];});await load(page,'updated');
 expect(await page.evaluate(()=>window.entryClocks.map(clock=>clock.effect.getTiming().duration))).toEqual([900,900,900]);
 await page.evaluate(()=>document.documentElement.style.setProperty('--motion-duration-chart','1000ms'));
 for(const curve of ['linear','monotone','step']){
  await load(page,'empty');await page.evaluate(curve=>{window.entryClocks=[];window.chartDemo.setCurve(curve);},curve);await load(page,'normal');await ready(page);
  await expect(card(page,'line').locator('[data-series-id="research"] [data-line-reveal-segment]')).toHaveCount(2);
  const measured=await page.evaluate(async()=>{
   for(const clock of window.entryClocks){clock.pause();clock.currentTime=250;}
   await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
   const group=document.querySelector('#line [data-series-id="research"]'),segments=[...group.querySelectorAll('[data-line-reveal-segment]')],lengths=segments.map(node=>node.getTotalLength()),amounts=segments.map(node=>1-Number(node.getAttribute('stroke-dashoffset'))),total=lengths.reduce((sum,value)=>sum+value,0);
   return {progress:window.entryClocks[0].effect.getComputedTiming().progress,drawn:lengths.reduce((sum,value,index)=>sum+value*amounts[index],0)/total,amounts,d:group.querySelector('.xui-chart-line').getAttribute('d'),mask:group.querySelector('.xui-chart-line').getAttribute('mask'),samePath:segments.map(node=>node.getAttribute('d')).join('')===group.querySelector('.xui-chart-line').getAttribute('d'),first:group.querySelector('[data-category-id="day-0"]').getAttribute('visibility'),last:group.querySelector('[data-category-id="day-5"]').getAttribute('visibility'),pattern:getComputedStyle(document.querySelector('#line [data-series-id="review"] .xui-chart-line')).strokeDasharray};
  });
  expect(measured.drawn).toBeCloseTo(measured.progress,5);expect(measured.samePath).toBe(true);expect(measured.mask).toMatch(/^url\(#/);expect(measured.first).not.toBe('hidden');expect(measured.last).toBe('hidden');expect(measured.pattern).not.toBe('none');
  expect(measured.d.match(/M/g)).toHaveLength(2);if(curve==='monotone')expect(measured.d).toContain('C');
  for(let index=0;index<measured.amounts.length-1;index++)if(measured.amounts[index]<1)expect(measured.amounts[index+1]).toBe(0);
  await screenshot(page,info,`chart-${curve}-entry.png`);
  await plot(page,'line').focus();await expect(plot(page,'line')).toHaveAttribute('data-motion','idle');await expect(card(page,'line').locator('[data-line-reveal-segment]')).toHaveCount(0);await expect(card(page,'line').locator('.xui-chart-point[visibility="hidden"]')).toHaveCount(0);
 }
 await load(page,'single');await expect(card(page,'line').locator('.xui-chart-point[visibility="hidden"]')).toHaveCount(0);
});
test('chart motion: interruption rebases, disabling and reduce motion settle immediately without replay',async({page})=>{
 await setup(page);await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>document.documentElement.style.setProperty('--motion-duration-chart','1000ms'));
 await load(page,'updated');await expect(plot(page,'line')).toHaveAttribute('data-motion','update');
 const continuity=await page.evaluate(async()=>{await new Promise(resolve=>setTimeout(resolve,120));const point=document.querySelector('#line .xui-chart-point'),y=()=>Number(/translate\([^,]+,([^\)]+)/.exec(point.getAttribute('transform'))[1]);const before=y();await window.chartDemo.load('normal','chart-scope',1);await new Promise(requestAnimationFrame);return {before,after:y()};});
 expect(Math.abs(continuity.after-continuity.before)).toBeLessThan(10);await expect(plot(page,'line')).toHaveAttribute('data-motion','update');
 await page.evaluate(()=>window.chartDemo.setAnimation(false));for(const id of ['line','bar','pie'])await expect(plot(page,id)).toHaveAttribute('data-motion','idle');
 const end=await card(page,'line').locator('.xui-chart-point').first().getAttribute('transform');await load(page,'updated');await expect(plot(page,'line')).toHaveAttribute('data-motion','idle');
 await page.evaluate(()=>window.chartDemo.setAnimation(true));await expect(plot(page,'line')).toHaveAttribute('data-motion','idle');
 await load(page,'normal');await expect(plot(page,'line')).toHaveAttribute('data-motion','update');await page.emulateMedia({reducedMotion:'reduce'});
 for(const id of ['line','bar','pie'])await expect(plot(page,id)).toHaveAttribute('data-motion','idle');
 expect(await card(page,'line').locator('.xui-chart-point').first().getAttribute('transform')).toBe(end);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>window.chartDemo.setCurve('step'));await expect(plot(page,'line')).toHaveAttribute('data-motion','idle');
 await load(page,'updated');await expect(plot(page,'line')).toHaveAttribute('data-motion','update');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await expect(plot(page,'line')).toHaveAttribute('data-motion','idle');
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await expect(plot(page,'line')).toHaveAttribute('data-motion','idle');
 await page.evaluate(()=>document.documentElement.style.setProperty('--motion-duration-chart','0ms'));await load(page,'normal');await expect(plot(page,'line')).toHaveAttribute('data-motion','idle');
 await load(page,'reverse');await expect(plot(page,'line')).toHaveAttribute('data-motion','idle');
 await page.setViewportSize({width:390,height:900});await expect(plot(page,'line')).toHaveAttribute('data-motion','idle');
});
test('chart motion: frame clocks are cancelled when chart nodes unmount',async({page})=>{
 await page.addInitScript(()=>{const Native=window.Animation;window.chartClocks=new Set();window.Animation=class extends Native{constructor(...args){super(...args);window.chartClocks.add(this);}cancel(){window.chartClocks.delete(this);return super.cancel();}};});
 await setup(page);await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>document.documentElement.style.setProperty('--motion-duration-chart','1000ms'));
 await load(page,'updated');await expect.poll(()=>page.evaluate(()=>window.chartClocks.size)).toBe(3);
 await load(page,'empty');await expect.poll(()=>page.evaluate(()=>window.chartClocks.size)).toBe(0);
 await page.evaluate(()=>{window.Animation=undefined;});await load(page,'normal');for(const id of ['line','bar','pie'])await expect(plot(page,id)).toHaveAttribute('data-motion','idle');
});
test('touch can inspect chart values and open the equivalent table',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:900},hasTouch:true,isMobile:true});try{const page=await context.newPage();await setup(page);await plot(page,'line').tap({position:{x:90,y:90}});await expect(card(page,'line').locator('.xui-chart-inspection')).toContainText(/[0-9]/);await card(page,'pie').getByRole('button',{name:'查看数据表格'}).tap();await expect(card(page,'pie').getByRole('table')).toBeVisible();await noOverflow(page);}finally{await context.close();}
});
for(const mode of ['light','dark','system'])test(`charts ${mode} genuine browser 200% zoom`,async({},info)=>{
  test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});try{
    const page=await context.newPage();await page.emulateMedia({colorScheme:'dark',reducedMotion:'no-preference'});await page.goto(`http://127.0.0.1:4173/charts-react/?mode=${mode}&long`);await ready(page);const before=await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth,font:getComputedStyle(document.documentElement).fontSize}));
    const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);await noOverflow(page);expect(await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize)).toBe(before.font);
    for(const curve of ['linear','monotone','step']){await page.evaluate(value=>window.chartDemo.setCurve(value),curve);const path=card(page,'line').locator('[data-series-id="research"] .xui-chart-line');if(curve==='monotone')await expect(path).toHaveAttribute('d',/C/);else await expect(path).not.toHaveAttribute('d',/C/);await plot(page,'line').focus();await plot(page,'line').press('End');await expect(card(page,'line').locator('.xui-chart-inspection')).toContainText('95');}
    await page.evaluate(()=>document.documentElement.style.setProperty('--motion-duration-chart','1000ms'));await load(page,'updated');
    for(const id of ['line','bar','pie'])await expect(plot(page,id)).toHaveAttribute('data-motion','update');
    await plot(page,'line').press('Home');await expect(card(page,'line').locator('.xui-chart-inspection')).toHaveText('跨区域研发团队完整的中文采样日期与窗口名称 1 · 研发团队的实际采样与完整长中文系列名称: 60');await expect(plot(page,'line')).toHaveAttribute('data-motion','idle');await noOverflow(page);
    await card(page,'pie').getByRole('button',{name:'查看数据表格'}).click();await expect(card(page,'pie').getByRole('table')).toBeVisible();await info.attach(`charts-${mode}-real-zoom.png`,{body:await captureZoomViewport(page),contentType:'image/png'});await info.attach('zoom.json',{body:JSON.stringify({before,after:await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth,font:getComputedStyle(document.documentElement).fontSize,cssZoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}))}),contentType:'application/json'});
  }finally{await context.close();}
});
