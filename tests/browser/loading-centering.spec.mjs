import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';

async function open(page,{theme='light',width=1280,scale=1}={}){
 await page.setViewportSize({width,height:900});
 await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(({theme,scale})=>{sessionStorage.setItem('ui.theme.mode',theme);sessionStorage.setItem('ui.interface.scale',String(scale));},{theme,scale});
 await page.goto('/react/feedback-foundation-contract.html');
 await expect(page.locator('.xui-data-table-loading')).toBeVisible();
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
}

async function centered(region,bodySelector,headerSelector){
 const result=await region.evaluate((root,{bodySelector,headerSelector})=>{
  const body=bodySelector?root.querySelector(bodySelector):root,status=root.querySelector('.xui-loading-state'),head=headerSelector&&root.querySelector(headerSelector);
  const b=body.getBoundingClientRect(),h=head&&head.getBoundingClientRect();
  const top=h?h.bottom:b.top,bottom=b.top+body.clientHeight;
  const parts=[...status.children].map(node=>node.getBoundingClientRect());
  const content={left:Math.min(...parts.map(r=>r.left)),right:Math.max(...parts.map(r=>r.right)),top:Math.min(...parts.map(r=>r.top)),bottom:Math.max(...parts.map(r=>r.bottom))};
  return {body:{left:b.left,right:b.left+body.clientWidth,top,bottom},content,dx:(content.left+content.right)/2-(b.left+body.clientWidth/2),dy:(content.top+content.bottom)/2-(top+bottom)/2,statuses:root.querySelectorAll('[role="status"]').length,scrollWidth:body.scrollWidth,clientWidth:body.clientWidth};
 },{bodySelector,headerSelector});
 expect(Math.abs(result.dx),JSON.stringify(result)).toBeLessThanOrEqual(2);
 expect(Math.abs(result.dy),JSON.stringify(result)).toBeLessThanOrEqual(2);
 expect(result.content.left).toBeGreaterThanOrEqual(result.body.left-1);
 expect(result.content.right).toBeLessThanOrEqual(result.body.right+1);
 expect(result.content.top).toBeGreaterThanOrEqual(result.body.top-1);
 expect(result.content.bottom).toBeLessThanOrEqual(result.body.bottom+1);
 expect(result.statuses).toBe(1);return result;
}
async function allRegions(page,info){
 const table=page.locator('.xui-data-table[aria-label="加载位置表格"]'),cards=page.locator('.xui-card-group[aria-label="加载位置卡片集合"]');
 const results={
  content:await centered(page.getByRole('region',{name:'普通内容区域',exact:true})),
  firstFeedback:await centered(page.getByRole('region',{name:'首次反馈区域',exact:true})),
  reserved:await centered(page.getByRole('region',{name:'保留反馈区域',exact:true}).locator('.xui-feedback-slot')),
  table:await centered(table,'.xui-data-table-body','thead'),
  cards:await centered(cards,'.xui-card-group-body'),
 };
 // Horizontal scrolling must not move the no-records status off the visible body.
 await table.locator('.xui-data-table-body').evaluate(node=>node.scrollLeft=node.scrollWidth);
 results.scrolledTable=await centered(table,'.xui-data-table-body','thead');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await info.attach('loading-centers.json',{body:JSON.stringify(results,null,2),contentType:'application/json'});
 await cards.scrollIntoViewIfNeeded();await info.attach('component-loading.png',{body:await page.screenshot(),contentType:'image/png'});
 return results;
}
for(const theme of ['light','dark','system'])for(const width of [1280,390])for(const scale of [1,2])test(`${theme} ${width} scale${scale} loading centers in each visible component body`,async({page},info)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await open(page,{theme,width,scale});await allRegions(page,info);
 await expect(page.locator('.xui-data-table-loading .xui-spinner')).toHaveAttribute('aria-hidden','true');
 if(theme==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');await allRegions(page,info);}
 expect(errors).toEqual([]);
});
test('loading resolves to records; same-scope refresh retains nodes and focus without transient flow feedback',async({page})=>{
 await open(page,{width:390});await page.evaluate(()=>window.setLoadingDemo('ready',true));
 const table=page.locator('.xui-data-table[aria-label="加载位置表格"]'),cards=page.locator('.xui-card-group[aria-label="加载位置卡片集合"]');
 const action=table.getByRole('button',{name:'保留的研究任务',exact:true});await action.focus();
 await page.evaluate(()=>{window.keptLoadingNodes={row:document.querySelector('.xui-data-table tbody tr'),card:document.querySelector('.xui-card-group .xui-card'),active:document.activeElement};window.setLoadingDemo('refreshing',true);});
 for(const region of [table,cards]){await expect(region).toHaveAttribute('aria-busy','true');await expect(region.locator('.xui-loading-state')).toHaveCount(0);await expect(region.getByRole('status')).toHaveCount(0);}
 await expect(table.locator('.xui-data-table-loading')).toHaveCount(0);await expect(cards.locator('.xui-card-group-placeholder')).toHaveCount(0);await expect(action).toBeFocused();
 expect(await page.evaluate(()=>window.keptLoadingNodes.row===document.querySelector('.xui-data-table tbody tr')&&window.keptLoadingNodes.card===document.querySelector('.xui-card-group .xui-card')&&window.keptLoadingNodes.active===document.activeElement)).toBe(true);
 await page.evaluate(()=>window.setLoadingDemo('ready',true));await expect(action).toBeFocused();await expect(table.getByRole('status')).toHaveCount(0);
});
test('natural and document collections center in their actual compact content region',async({page},info)=>{
 await open(page);
 for(const layout of ['natural','document']){
  await page.evaluate(layout=>window.setLoadingDemo('loading',false,layout),layout);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await allRegions(page,info);
 }
});
test('actual browser zoom 200% keeps loading centered and long text readable',async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,1000']});
 try{
  const page=await context.newPage();await page.goto('http://127.0.0.1:4173/react/feedback-foundation-contract.html');await expect(page.locator('.xui-data-table-loading')).toBeVisible();
  const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio}));
  const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();
  await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);expect(await page.evaluate(()=>innerWidth)).toBeCloseTo(before.width/2,0);await allRegions(page,info);
 }finally{await context.close();}
});
