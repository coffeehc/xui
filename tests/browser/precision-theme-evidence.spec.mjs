import {test,expect} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const output=resolve('.artifacts/ownership-contract-4.2.13/images/precision-theme-evidence');
const pages=[
 {name:'table',url:'/data-table-react/?widths&column-mode=sized&hide-column=source&size=12&internal&layout=workspace'},
 {name:'react',url:'/react/'}
];

for(const entry of pages)for(const theme of ['dark','light'])test(`capture final ${theme} ${entry.name} preview evidence`,async({page},info)=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
 await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);
 await page.goto(entry.url,{waitUntil:'domcontentloaded'});
 if(entry.name==='table'){
  await page.waitForFunction(()=>window.dataTableDemo?.owner.getState().status==='ready');
  await expect(page.getByRole('table',{name:'合成记录表格'})).toBeVisible();
 }else{
  await expect(page.getByRole('heading',{name:'工作偏好',exact:true})).toBeVisible();
  await expect(page.getByLabel('名称')).toBeVisible();
 }
 await expect(page.locator('html')).toHaveAttribute('data-theme-effective',theme);
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
 const metadata=await page.evaluate(()=>({url:location.href,theme:{mode:sessionStorage.getItem('ui.theme.mode'),effective:document.documentElement.dataset.themeEffective},viewport:{width:innerWidth,height:innerHeight},colors:{canvas:getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim(),primary:getComputedStyle(document.documentElement).getPropertyValue('--action-primary').trim(),inputBorder:getComputedStyle(document.querySelector('.xui-input')??document.documentElement).getPropertyValue('--input-border-color').trim()}}));
 let generation=null;try{generation=JSON.parse(await readFile('.artifacts/consumer-validation.json','utf8')).sourceGeneration??null;}catch{}
 await mkdir(output,{recursive:true});
 const name=`${entry.name}-${theme}`;
 const screenshot=await page.screenshot({path:join(output,`${name}.png`),animations:'disabled'});
 const record={generation,...metadata};
 await writeFile(join(output,`${name}.json`),JSON.stringify(record,null,2));
 await info.attach(`${name}.png`,{body:screenshot,contentType:'image/png'});
 await info.attach(`${name}.json`,{body:JSON.stringify(record,null,2),contentType:'application/json'});
});

for(const kind of ['react'])for(const theme of ['dark','light'])test(`capture final ${kind} administrator ${theme} desktop and narrow large-text focus evidence`,async({page},info)=>{
 const generation=JSON.parse(await readFile('.artifacts/consumer-validation.json','utf8')).sourceGeneration;
 const save=async(name,state)=>{
  const metadata=await page.evaluate(state=>({url:location.href,theme:{mode:sessionStorage.getItem('ui.theme.mode'),effective:document.documentElement.dataset.themeEffective},viewport:{width:innerWidth,height:innerHeight},rootFontSize:getComputedStyle(document.documentElement).fontSize,state,focus:(()=>{const element=document.activeElement,target=element instanceof HTMLInputElement?(element.closest('.xui-input-group')??element):element,r=target.getBoundingClientRect(),style=getComputedStyle(target),distance=parseFloat(style.outlineWidth)/2+parseFloat(style.outlineOffset);return {label:element instanceof HTMLInputElement?(element.labels?.[0]?.textContent??element.getAttribute('aria-label')):element?.textContent?.trim(),target:target.className,outline:{style:style.outlineStyle,width:style.outlineWidth,offset:style.outlineOffset,color:style.outlineColor},bounds:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},edges:{left:r.x-distance,right:r.right+distance,top:r.y-distance,bottom:r.bottom+distance}};})()}),state);
  const screenshot=await page.screenshot({path:join(output,`${name}.png`),animations:'disabled'});
  const record={generation,...metadata};await writeFile(join(output,`${name}.json`),JSON.stringify(record,null,2));await info.attach(`${name}.png`,{body:screenshot,contentType:'image/png'});await info.attach(`${name}.json`,{body:JSON.stringify(record,null,2),contentType:'application/json'});
 };
 await mkdir(output,{recursive:true});await page.setViewportSize({width:1280,height:720});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);await page.goto(`/admin-setup-${kind}/`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.adminSetupDemo);await expect(page.getByRole('heading',{name:'创建管理员',exact:true})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-theme-effective',theme);await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
 await save(`admin-${kind}-${theme}`,{view:'desktop'});
 await page.setViewportSize({width:390,height:800});await page.evaluate(()=>document.documentElement.style.fontSize='200%');const username=page.getByRole('textbox',{name:'管理员用户名',exact:true}),password=page.getByLabel(/^新密码(?:\s*\*)?$/),confirmation=page.getByLabel(/^确认密码(?:\s*\*)?$/),show=page.getByRole('button',{name:'显示密码'}),submit=page.locator('.xui-login-submit');
 await username.focus();await page.keyboard.press('Tab');await expect(password).toBeFocused();await page.keyboard.press('Tab');await expect(show.first()).toBeFocused();await page.keyboard.press('Tab');await expect(confirmation).toBeFocused();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 let name=`admin-${kind}-${theme}-narrow-200-confirmation-focus`;let snapshot=await page.evaluate(()=>{const element=document.activeElement,target=element.closest('.xui-input-group'),r=target.getBoundingClientRect(),style=getComputedStyle(target),distance=parseFloat(style.outlineWidth)/2+parseFloat(style.outlineOffset);return {edges:{left:r.x-distance,right:r.right+distance,top:r.y-distance,bottom:r.bottom+distance},viewport:{width:innerWidth,height:innerHeight}};});for(const edge of ['left','right','top','bottom'])expect(snapshot.edges[edge]).toBeGreaterThanOrEqual(0),expect(snapshot.edges[edge]).toBeLessThanOrEqual(snapshot.viewport[edge==='left'||edge==='right'?'width':'height']);await save(name,{view:'narrow-200%',focus:'confirmation',geometry:snapshot});
 await page.keyboard.press('Tab');await expect(show.last()).toBeFocused();await page.keyboard.press('Tab');await expect(submit).toBeFocused();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));name=`admin-${kind}-${theme}-narrow-200-submit-focus`;snapshot=await page.evaluate(()=>{const element=document.activeElement,r=element.getBoundingClientRect(),style=getComputedStyle(element),distance=parseFloat(style.outlineWidth)/2+parseFloat(style.outlineOffset);return {edges:{left:r.x-distance,right:r.right+distance,top:r.y-distance,bottom:r.bottom+distance},viewport:{width:innerWidth,height:innerHeight}};});for(const edge of ['left','right','top','bottom'])expect(snapshot.edges[edge]).toBeGreaterThanOrEqual(0),expect(snapshot.edges[edge]).toBeLessThanOrEqual(snapshot.viewport[edge==='left'||edge==='right'?'width':'height']);await save(name,{view:'narrow-200%',focus:'submit',geometry:snapshot});
});
