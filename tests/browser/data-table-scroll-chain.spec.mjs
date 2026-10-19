import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';

const body=page=>page.locator('#records-table .xui-data-table-body');
async function ready(page){await expect.poll(()=>page.evaluate(()=>window.dataTableDemo?.owner.getState().status)).toBe('ready');}
async function geometry(page){return page.evaluate(()=>{
 const box=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,top:node.scrollTop,left:node.scrollLeft,client:node.clientHeight,scroll:node.scrollHeight,widthClient:node.clientWidth,widthScroll:node.scrollWidth,yBoundary:getComputedStyle(node).overscrollBehaviorY};};
 return {main:box(document.querySelector('.xui-shell-main')),content:box(document.querySelector('.xui-shell-content')),body:box(document.querySelector('.xui-data-table-body')),header:box(document.querySelector('.xui-shell-header')),sidebar:box(document.querySelector('.xui-shell-sidebar')),document:box(document.scrollingElement)};
});}
async function wheel(page,x,y){
 const point=await body(page).evaluate(node=>{
  const r=node.getBoundingClientRect();let left=Math.max(0,r.left),right=Math.min(innerWidth,r.right),top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom);
  for(let parent=node.parentElement;parent;parent=parent.parentElement){const s=getComputedStyle(parent),p=parent.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(s.overflowY)){top=Math.max(top,p.top+parent.clientTop);bottom=Math.min(bottom,p.top+parent.clientTop+parent.clientHeight);}if(/auto|scroll|hidden|clip/.test(s.overflowX)){left=Math.max(left,p.left+parent.clientLeft);right=Math.min(right,p.left+parent.clientLeft+parent.clientWidth);}}
  const x=(left+right)/2,y=(top+bottom)/2;return {x,y,hit:node.contains(document.elementFromPoint(x,y)),height:bottom-top};
 });
 expect(point.height).toBeGreaterThan(10);expect(point.hit,'wheel pointer hits the visible table, below fixed shell chrome').toBe(true);await page.mouse.move(point.x,point.y);await page.mouse.wheel(x,y);
}
const scrollTop=(page,owner)=>geometry(page).then(m=>m[owner].top);
async function unbounded(page,{shell='workspace',layout='document',mode='light',font=false}={}){
 await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
 await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);
 await page.goto(`/data-table-react/?size=50&no-search&no-actions&layout=${layout}${shell==='viewport'?'&viewport':shell==='document'?'&unbounded':''}`);await ready(page);
 if(font)await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 const owner=shell==='workspace'?'content':shell==='document'?'document':'main';
 await expect.poll(()=>geometry(page).then(m=>m.body.scroll-m.body.client)).toBeLessThanOrEqual(1);
 const before=await geometry(page);expect(before[owner].scroll).toBeGreaterThan(before[owner].client+100);
 await wheel(page,0,450);await expect.poll(()=>scrollTop(page,owner)).toBeGreaterThan(before[owner].top+100);
 const after=await geometry(page);expect(after.body.top).toBe(0);
 if(shell!=='document')for(const part of ['header','sidebar']){expect(after[part].y).toBeCloseTo(before[part].y,1);expect(after[part].top).toBe(before[part].top);}
 await wheel(page,0,-200);await expect.poll(()=>scrollTop(page,owner)).toBeLessThan(after[owner].top-50);
 return {before,after};
}

// This route also exists in the old formal package consumer: it reproduces the
// wheel trap without rewriting CSS or assigning the outer scroll position.
test('unbounded workspace table hands real vertical wheel input to its content owner',async({page},info)=>{
 const evidence=await unbounded(page);await info.attach('wheel.json',{body:JSON.stringify(evidence),contentType:'application/json'});
});
for(const mode of ['light','dark','system'])for(const layout of ['natural','document'])test(`viewport ${layout} ${mode}: long table scrolls main while shell stays fixed`,async({page},info)=>{
 await page.setViewportSize({width:1280,height:900});const evidence=await unbounded(page,{shell:'viewport',layout,mode});await info.attach('wheel.json',{body:JSON.stringify(evidence),contentType:'application/json'});await info.attach('viewport.png',{body:await page.screenshot(),contentType:'image/png'});
});
test('unbounded document table retains document wheel scrolling',async({page})=>{await unbounded(page,{shell:'document'});});
test('narrow 200% text keeps viewport main as the unbounded table scroll owner',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});const evidence=await unbounded(page,{shell:'viewport',layout:'natural',mode:'system',font:true});await info.attach('wheel.json',{body:JSON.stringify(evidence),contentType:'application/json'});await info.attach('large-text.png',{body:await page.screenshot(),contentType:'image/png'});
});
for(const layout of ['natural','workspace'])test(`bounded ${layout} table keeps wheel input and its edge boundary`,async({page},info)=>{
 await page.goto(`/data-table-react/?internal&layout=${layout}&size=50`);await ready(page);await expect.poll(()=>geometry(page).then(m=>m.body.scroll-m.body.client)).toBeGreaterThan(100);
 const before=await geometry(page);await wheel(page,0,300);await expect.poll(()=>scrollTop(page,'body')).toBeGreaterThan(100);
 await wheel(page,0,100000);await expect.poll(()=>geometry(page).then(m=>m.body.scroll-m.body.client-m.body.top)).toBeLessThanOrEqual(1);
 await wheel(page,0,300);await expect.poll(()=>scrollTop(page,'content')).toBe(before.content.top);expect(await scrollTop(page,'main')).toBe(before.main.top);
 await body(page).focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowUp');await expect(body(page)).toBeFocused();
 await info.attach('bounded.json',{body:JSON.stringify({before,after:await geometry(page)}),contentType:'application/json'});
});
test('natural table boundary follows data, empty state and allocated size without remounting',async({page})=>{
 await page.goto('/data-table-react/?internal&size=50');await ready(page);const node=await body(page).elementHandle();
 await expect.poll(()=>geometry(page).then(m=>m.body.yBoundary)).toBe('contain');
 await page.evaluate(()=>window.dataTableDemo.owner.filter('search','记录 125：'));await ready(page);await expect.poll(()=>geometry(page).then(m=>m.body.yBoundary)).toBe('auto');
 await page.evaluate(()=>window.dataTableDemo.owner.setEmpty(true));await ready(page);await expect.poll(()=>geometry(page).then(m=>m.body.yBoundary)).toBe('auto');
 await page.evaluate(()=>{window.dataTableDemo.owner.setEmpty(false);window.dataTableDemo.owner.clear();});await ready(page);await expect.poll(()=>geometry(page).then(m=>m.body.yBoundary)).toBe('contain');
 await page.setViewportSize({width:1280,height:10000});await expect.poll(()=>geometry(page).then(m=>m.body.yBoundary)).toBe('auto');
 await page.setViewportSize({width:1280,height:800});await expect.poll(()=>geometry(page).then(m=>m.body.yBoundary)).toBe('contain');
 expect(await body(page).evaluate((current,saved)=>current===saved,node)).toBe(true);
});
test('horizontal wheel and sticky columns remain inside the table',async({page},info)=>{
 await page.setViewportSize({width:980,height:800});await page.goto('/data-table-react/?internal&widths&column-mode=sized&size=50');await ready(page);
 const before=await geometry(page);expect(before.body.widthScroll).toBeGreaterThan(before.body.widthClient+30);await wheel(page,300,0);await expect.poll(()=>geometry(page).then(m=>m.body.left)).toBeGreaterThan(20);
 const after=await geometry(page);for(const part of ['main','content','document'])expect(after[part].left).toBe(before[part].left);
 const sticky=await body(page).evaluate(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.left+node.clientWidth,start:node.querySelector('th[data-sticky=start]').getBoundingClientRect().left,end:node.querySelector('th[data-sticky=end]').getBoundingClientRect().right};});expect(sticky.start).toBeCloseTo(sticky.left,0);expect(sticky.end).toBeCloseTo(sticky.right,0);
 await info.attach('horizontal.json',{body:JSON.stringify({before,after,sticky}),contentType:'application/json'});
});
test('genuine browser 200% zoom preserves vertical wheel chaining',async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,1000']});
 try{const page=await context.newPage();await page.goto('http://127.0.0.1:4173/data-table-react/?viewport&size=50&no-search&no-actions');await ready(page);const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);const after=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize,css:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.css).toBe('1');expect(after.pinch).toBe(1);
  await expect.poll(()=>geometry(page).then(m=>m.body.scroll-m.body.client)).toBeLessThanOrEqual(1);const start=await scrollTop(page,'main');await wheel(page,0,400);await expect.poll(()=>scrollTop(page,'main')).toBeGreaterThan(start+50);await info.attach('zoom.json',{body:JSON.stringify({before,after,scroll:await geometry(page)}),contentType:'application/json'});await info.attach('zoom.png',{body:await captureZoomViewport(page),contentType:'image/png'});
 }finally{await context.close();}
});
