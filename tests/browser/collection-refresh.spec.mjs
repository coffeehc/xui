import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const theme=async(page,mode)=>{await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);};
const visit=(page,path)=>page.goto(new URL(path,process.env.XUI_BASE_URL??'http://127.0.0.1:4173').href);
const ready=page=>expect.poll(()=>page.evaluate(()=>window.continuityDemo?.ready)).toBe(true);
const collectionRects=page=>page.evaluate(()=>Object.fromEntries(['#continuity-table','.xui-data-table-body','.xui-data-table-footer','#continuity-cards','.xui-card-group-footer','p'].map(selector=>{const node=document.querySelector(selector),r=node.getBoundingClientRect();return[selector,{x:r.x,y:r.y,width:r.width,height:r.height}];})));
async function collection(page,info,{empty=false,root200=false}={}){
 await visit(page,`/collection-refresh-react/?scenario=collection${empty?'&empty':''}`);await ready(page);if(root200)await page.evaluate(()=>document.documentElement.style.fontSize='200%');await settle(page);
 const action=page.getByRole('button',{name:'查看该记录',exact:true});if(!empty)await action.focus();
 await page.evaluate(()=>{window.savedRecord=document.querySelector('#continuity-table tbody tr');window.savedCardAction=[...document.querySelectorAll('button')].find(node=>node.textContent==='查看该记录');});
 const before=await collectionRects(page);
 for(let pass=0;pass<2;pass++){
  await page.evaluate(()=>window.continuityDemo.status('refreshing'));await expect(page.locator('#continuity-table')).toHaveAttribute('aria-busy','true');await settle(page);const during=await collectionRects(page);
  for(const selector in before)for(const dimension of ['x','y','width','height'])expect(Math.abs(during[selector][dimension]-before[selector][dimension]),`${selector} ${dimension}`).toBeLessThanOrEqual(.5);
  if(empty){await expect(page.getByText('确认没有表格记录',{exact:true})).toBeVisible();await expect(page.getByText('确认没有卡片记录',{exact:true})).toBeVisible();}
  else{await expect(action).toBeFocused();expect(await page.evaluate(()=>window.savedRecord===document.querySelector('#continuity-table tbody tr')&&window.savedCardAction===[...document.querySelectorAll('button')].find(node=>node.textContent==='查看该记录'))).toBe(true);}
  for(const next of await page.getByRole('button',{name:'Next page',exact:true}).all())await expect(next).toBeDisabled();expect(await page.evaluate(()=>window.continuityDemo.requests)).toBe(0);
  await page.evaluate(()=>window.continuityDemo.status('ready'));await settle(page);
 }
 await info.attach('refresh-geometry.json',{body:JSON.stringify({before,after:await collectionRects(page)}),contentType:'application/json'});await info.attach('refresh.png',{body:await page.screenshot(),contentType:'image/png'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}
for(const mode of ['light','dark','system'])for(const width of [1280,390,320])for(const empty of [false,true])test(`collection refresh ${mode} ${width}px ${empty?'confirmed empty':'rows'} preserves geometry`,async({page},info)=>{
 await page.setViewportSize({width,height:844});await theme(page,mode);await collection(page,info,{empty,root200:width===320});
});
test('confirmed empty refresh error differs from an initial load or initial error',async({page})=>{
 await visit(page,'/collection-refresh-react/?scenario=collection&empty');await ready(page);await page.evaluate(()=>window.continuityDemo.status('refreshing'));await expect(page.getByText('确认没有表格记录',{exact:true})).toBeVisible();await page.evaluate(()=>window.continuityDemo.status('error'));await expect(page.getByText('确认没有表格记录',{exact:true})).toBeVisible();await expect(page.getByText('确认没有卡片记录',{exact:true})).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(2);
 await page.evaluate(()=>window.continuityDemo.status('loading'));await expect(page.getByText('确认没有表格记录',{exact:true})).toHaveCount(0);await expect(page.getByRole('status')).toHaveCount(2);await page.evaluate(()=>window.continuityDemo.status('error'));await expect(page.getByText('确认没有表格记录',{exact:true})).toHaveCount(0);await expect(page.getByText('确认没有卡片记录',{exact:true})).toHaveCount(0);await expect(page.getByRole('alert')).toHaveCount(2);
});
for(const mode of ['light','dark','system'])test(`genuine Chrome zoom200 ${mode} empty collection refresh continuity`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});try{const page=await context.newPage();await theme(page,mode);await page.goto('http://127.0.0.1:4173/collection-refresh-react/');const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);const after=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize,cssZoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.cssZoom).toBe('1');expect(after.pinch).toBe(1);

 await collection(page,info,{empty:true});await info.attach('zoom200.png',{body:await captureZoomViewport(page),contentType:'image/png'});await info.attach('zoom.json',{body:JSON.stringify({before,after}),contentType:'application/json'});
 }finally{await context.close();}
});
const managedRects=page=>page.evaluate(()=>Object.fromEntries(['.xui-page-header','.xui-page-header > .xui-toolbar','.xui-disclosure','.xui-data-region','.xui-data-table-footer'].flatMap(selector=>{const node=document.querySelector(selector);if(!node)return[];const r=node.getBoundingClientRect();return[[selector,{x:r.x,y:r.y,width:r.width,height:r.height}]];})));
for(const mode of ['light','dark','system'])for(const width of [1280,390,320])for(const kind of ['api-key','log'])test(`managed ${kind} ${mode} ${width}px held refresh keeps actions filters and records`,async({page},info)=>{
 await page.setViewportSize({width,height:844});await theme(page,mode);await visit(page,`/${kind}-react/`);
 await expect.poll(()=>page.evaluate(kind=>{const state=(kind==='log'?window.logDemo:window.apiKeyDemo)?.controller.getState();return !!state&&(kind==='log'?!!state.data&&!state.busy:state.hasLoaded&&!state.listBusy);},kind)).toBe(true);
 if(width===320)await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 if(kind==='log'){await page.getByRole('button',{name:'筛选条件',exact:true}).click();await page.getByRole('textbox',{name:'摘要文本',exact:true}).fill('保留未应用的筛选草稿');await expect(page.getByRole('button',{name:'取消读取',exact:true})).toBeDisabled();}
 await page.evaluate(()=>{window.savedManagedRow=document.querySelector('tbody tr');});await settle(page);const before=await managedRects(page);
 const count=await page.evaluate(kind=>kind==='log'?window.logDemo.getRequests().length:window.apiKeyDemo.getCalls().list,kind);
 await page.evaluate(kind=>{if(kind==='log'){window.logDemo.setMode('groups','hold');void window.logDemo.controller.refresh();}else{window.apiKeyDemo.setBehavior('list','hold');void window.apiKeyDemo.controller.refresh();}},kind);
 const refresh=page.getByRole('button',{name:kind==='log'?'刷新快照':'刷新列表',exact:true});await expect(refresh).toBeDisabled();await expect(refresh).toHaveAttribute('aria-busy','true');await settle(page);const during=await managedRects(page);
 for(const selector in before)for(const dimension of ['x','y','width','height'])expect(Math.abs(during[selector][dimension]-before[selector][dimension]),`${kind} ${selector} ${dimension}`).toBeLessThanOrEqual(.5);
 expect(await page.evaluate(()=>window.savedManagedRow===document.querySelector('tbody tr'))).toBe(true);expect(await page.evaluate(kind=>kind==='log'?window.logDemo.getRequests().length:window.apiKeyDemo.getCalls().list,kind)).toBe(count+1);
 if(kind==='log'){await expect(page.getByRole('textbox',{name:'摘要文本',exact:true})).toHaveValue('保留未应用的筛选草稿');await expect(page.getByRole('button',{name:'取消读取',exact:true})).toBeEnabled();}
 await info.attach('managed-held-refresh.png',{body:await page.screenshot(),contentType:'image/png'});await info.attach('managed-geometry.json',{body:JSON.stringify({before,during}),contentType:'application/json'});
 await page.evaluate(kind=>{if(kind==='log'){window.logDemo.setMode('groups','ok');window.logDemo.release('groups');}else{window.apiKeyDemo.setBehavior('list','ok');window.apiKeyDemo.release('list');}},kind);await expect(refresh).toBeEnabled();await expect(refresh).toHaveAttribute('aria-busy','false');expect(await page.evaluate(()=>window.savedManagedRow===document.querySelector('tbody tr'))).toBe(true);
});
