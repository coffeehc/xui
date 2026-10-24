import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';

const table=page=>page.locator('#records-table');
const body=page=>table(page).locator('.xui-data-table-body');
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const ready=page=>expect.poll(()=>page.evaluate(()=>window.dataTableDemo?.owner.getState().status)).toBe('ready');
async function open(page,{theme='light',width=1280,scale=1,sticky='both',manual=true}={}){
 await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(({theme,scale})=>{sessionStorage.setItem('ui.theme.mode',theme);sessionStorage.setItem('ui.interface.scale',String(scale));},{theme,scale});
 await page.goto(`/data-table-react/?internal&no-search&column-mode=sized&layout=workspace&sticky=${sticky}${manual?'&manual':''}`);
 await page.evaluate(()=>document.fonts.ready);await expect(table(page)).toBeVisible();await settle(page);
}
async function lines(page,sticky){
 const result=await table(page).evaluate(root=>{
  const cells=[...root.querySelectorAll('th,td')].map(node=>{const s=getComputedStyle(node);return {tag:node.tagName,sticky:node.dataset.sticky??null,left:parseFloat(s.borderLeftWidth),right:parseFloat(s.borderRightWidth),bottom:parseFloat(s.borderBottomWidth),color:s.backgroundColor,image:s.backgroundImage,position:s.position,shadow:s.boxShadow};});
  return {cells,headers:root.querySelectorAll('thead th').length,rows:root.querySelectorAll('tbody tr').length,last:[...root.querySelectorAll('tbody tr:last-child td')].map(n=>parseFloat(getComputedStyle(n).borderBottomWidth)),footer:parseFloat(getComputedStyle(root.querySelector('footer')).borderTopWidth)};
 });
 expect(result.headers).toBe(6);
 for(const cell of result.cells){expect(cell.left).toBe(0);expect(cell.right).toBe(0);expect(cell.shadow).toBe('none');if(cell.sticky){expect(cell.position).toBe('sticky');expect(cell.color).not.toBe('rgba(0, 0, 0, 0)');}}
 for(const cell of result.cells.filter(c=>c.tag==='TH'))expect(cell.bottom).toBeGreaterThan(0);
 expect(result.last.every(value=>value===0)).toBe(true);expect(result.footer).toBeGreaterThan(0);
 const headers=result.cells.filter(c=>c.tag==='TH');expect(headers[0].sticky).toBe(['start','both'].includes(sticky)?'start':null);expect(headers.at(-1).sticky).toBe(['end','both'].includes(sticky)?'end':null);
 return result;
}
async function frozenGeometry(page,sticky){
 const geometry=()=>body(page).evaluate(node=>{const b=node.getBoundingClientRect(),head=node.querySelector('thead tr'),row=node.querySelector('tbody tr'),rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right};};return {port:{left:b.left,right:b.left+node.clientWidth},viewport:innerWidth,rootFont:parseFloat(getComputedStyle(document.documentElement).fontSize),scroll:node.scrollLeft,max:node.scrollWidth-node.clientWidth,head:[...head.children].map(rect),row:[...row.children].map(rect)};});
 await body(page).evaluate(node=>node.scrollLeft=0);await settle(page);const before=await geometry();expect(before.max).toBeGreaterThanOrEqual(0);if(before.viewport<1280||before.rootFont>16)expect(before.max).toBeGreaterThan(0);
 await body(page).evaluate(node=>node.scrollLeft=(node.scrollWidth-node.clientWidth)/2);await settle(page);const middle=await geometry();
 for(const [index,edge,fixed] of [[0,'left',['start','both'].includes(sticky)],[5,'right',['end','both'].includes(sticky)]]){
  const delta=middle.row[index][edge]-before.row[index][edge];expect(Math.abs(delta+(fixed?0:middle.scroll))).toBeLessThanOrEqual(2);
  expect(Math.abs(middle.row[index][edge]-middle.head[index][edge])).toBeLessThanOrEqual(2);
 }
 await body(page).evaluate(node=>node.scrollLeft=node.scrollWidth);await settle(page);const end=await geometry();
 if(['start','both'].includes(sticky))expect(Math.abs(end.row[0].left-end.port.left)).toBeLessThanOrEqual(2);
 if(['end','both'].includes(sticky))expect(Math.abs(end.row[5].right-end.port.right)).toBeLessThanOrEqual(2);
 return {before,middle,end};
}
async function verify(page,sticky,info){
 await page.evaluate(()=>{window.dataTableDemo.owner.planNext({delayMs:400});window.dataTableDemo.owner.load();});
 await expect(table(page)).toHaveAttribute('aria-busy','true');await expect(table(page).locator('.xui-data-table-loading')).toBeVisible();const loading=await lines(page,sticky);await ready(page);
 const normal=await lines(page,sticky),geometry=await frozenGeometry(page,sticky);
 await info.attach('table-ready.png',{body:await table(page).screenshot(),contentType:'image/png'});
 const action=page.getByRole('button',{name:'查看记录 1',exact:true});await action.focus();await expect(action).toBeInViewport();
 expect(await action.evaluate(node=>{const r=node.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return node===hit||node.contains(hit);})).toBe(true);
 await page.keyboard.press('Enter');await expect(page.getByLabel('查看结果')).toHaveText('已查看 1');
 await body(page).hover();await lines(page,sticky);
 await page.evaluate(()=>{window.dividerKept={row:document.querySelector('#records-table tbody tr'),active:document.activeElement,scroll:document.querySelector('.xui-data-table-body').scrollLeft};window.dataTableDemo.owner.planNext({delayMs:400});window.dataTableDemo.owner.refresh();});
 await expect(table(page)).toHaveAttribute('aria-busy','true');const refreshing=await lines(page,sticky);await expect(action).toBeFocused();await ready(page);
 expect(await page.evaluate(()=>window.dividerKept.row===document.querySelector('#records-table tbody tr')&&window.dividerKept.active===document.activeElement&&Math.abs(window.dividerKept.scroll-document.querySelector('.xui-data-table-body').scrollLeft)<2)).toBe(true);
 await page.evaluate(()=>window.dataTableDemo.owner.setEmpty(true));await ready(page);await expect(table(page)).toContainText('还没有记录');const empty=await lines(page,sticky);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await info.attach('divider-states.json',{body:JSON.stringify({loading,normal,refreshing,empty,geometry}),contentType:'application/json'});
}
for(const theme of ['light','dark','system'])for(const [width,scale] of [[1280,1],[390,2]])for(const sticky of ['none','start','end','both'])test(`${theme} ${width} scale${scale} sticky=${sticky} uniform row separators, scrolling and state continuity`,async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page,{theme,width,scale,sticky});await verify(page,sticky,info);
 if(theme==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');await lines(page,sticky);}
 expect(errors).toEqual([]);
});
for(const theme of ['light','dark','system'])test(`${theme} actual browser zoom200 retains both sticky columns without extra vertical rules`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,1000']});
 try{
  const page=await context.newPage();await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);
  await page.goto('http://127.0.0.1:4173/data-table-react/?internal&no-search&column-mode=sized&layout=workspace&sticky=both&manual');await expect(table(page)).toBeVisible();
  const before=await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth})),settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();
  await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);expect(await page.evaluate(()=>innerWidth)).toBeCloseTo(before.width/2,0);await verify(page,'both',info);
 }finally{await context.close();}
});
