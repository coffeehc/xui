import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const theme=async(page,mode)=>{await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);};
const visit=(page,path)=>page.goto(new URL(path,process.env.XUI_BASE_URL??'http://127.0.0.1:4173').href);
const ready=page=>expect.poll(()=>page.evaluate(()=>window.continuityDemo?.ready)).toBe(true);
async function focusedInView(control){
 await expect(control).toBeFocused();await expect(control).toBeInViewport({ratio:1});const bounds=await control.evaluate(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node),ring=s.outlineStyle==='none'?0:parseFloat(s.outlineWidth)+Math.max(0,parseFloat(s.outlineOffset));return {left:r.left-ring,top:r.top-ring,right:r.right+ring,bottom:r.bottom+ring,width:visualViewport.width,height:visualViewport.height};});for(const edge of ['left','top'])expect(bounds[edge]).toBeGreaterThanOrEqual(0);expect(bounds.right).toBeLessThanOrEqual(bounds.width);expect(bounds.bottom).toBeLessThanOrEqual(bounds.height);
}
async function guard(page,info,{strict=false,long=false}={}){
 await visit(page,`/continuity-react${strict?'-strict':''}/?${long?'long':''}`);await ready(page);const trigger=page.locator('[data-xui-menu-toggle]');
 await page.evaluate(()=>{window.savedTrigger=window.continuityDemo.ref;});
 const narrow=await page.evaluate(()=>matchMedia('(max-width:47.999rem)').matches);
 if(narrow){await trigger.focus();await page.keyboard.press('Enter');await expect(trigger).toHaveAttribute('aria-expanded','true');}
 const link=page.getByRole('link',{name:long?'团队协作设置与权限核对：长中文导航名称':'设置',exact:true});await link.focus();await page.keyboard.press('Enter');
 const dialog=page.getByRole('alertdialog',{name:'尚未保存的修改',exact:true});await expect(dialog).toBeVisible();await expect.poll(()=>dialog.evaluate(node=>node.contains(document.activeElement))).toBe(true);
 const keep=dialog.getByRole('button',{name:'保留草稿',exact:true});await keep.focus();await page.keyboard.press('Space');await expect(dialog).toBeHidden();await focusedInView(trigger);if(narrow)await expect(trigger).toHaveAttribute('aria-expanded','false');
 await expect(page.getByRole('textbox',{name:'尚未保存的说明'})).toHaveValue('保留这份草稿');expect(page.url()).not.toContain('target=');expect(await page.evaluate(()=>window.savedTrigger===window.continuityDemo.ref)).toBe(true);
 await info.attach('guard-return.png',{body:await page.screenshot(),contentType:'image/png'});
 // A second confirmation deliberately returns to the host's destination action.
 if(narrow)await trigger.click();await link.click();await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:'放弃草稿并继续'}).click();await expect(dialog).toBeHidden();await focusedInView(page.getByRole('button',{name:'页面操作',exact:true}));await expect(page.getByRole('heading',{name:'设置',exact:true})).toBeVisible();
 if(narrow){await trigger.click();await expect(page.getByRole('dialog',{name:'工作导航',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();}
}
for(const mode of ['light','dark','system'])for(const width of [1280,390,320])test(`drawer guard ${mode} ${width}px keeps and discards without hidden focus`,async({page},info)=>{
 await page.setViewportSize({width,height:844});await theme(page,mode);if(width===320)await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>document.documentElement.style.fontSize='200%'));
 await guard(page,info,{strict:width===390,long:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('navigation ref survives responsive reparenting and cleans up in development StrictMode',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await visit(page,'/continuity-react-strict/');await ready(page);await page.evaluate(()=>{window.savedTrigger=window.continuityDemo.ref;});const attached=await page.evaluate(()=>window.continuityDemo.refAttachments);
 for(const width of [1280,390,320]){await page.setViewportSize({width,height:844});await settle(page);expect(await page.evaluate(()=>window.savedTrigger===window.continuityDemo.ref&&window.continuityDemo.ref.isConnected)).toBe(true);}
 expect(await page.evaluate(()=>window.continuityDemo.refAttachments)).toBe(attached);await page.evaluate(()=>window.continuityDemo.destroy());expect(await page.evaluate(()=>window.continuityDemo.ref)).toBeNull();expect(await page.evaluate(()=>window.continuityDemo.refCleanups)).toBeGreaterThan(0);await info.attach('ref-lifecycle.json',{body:JSON.stringify(await page.evaluate(()=>({attachments:window.continuityDemo.refAttachments,cleanups:window.continuityDemo.refCleanups}))),contentType:'application/json'});
});
for(const mode of ['light','dark','system'])test(`genuine Chrome zoom200 ${mode} confirmation focus`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});try{const page=await context.newPage();await theme(page,mode);await page.goto('http://127.0.0.1:4173/continuity-react/');const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);const after=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize,cssZoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.cssZoom).toBe('1');expect(after.pinch).toBe(1);

 await guard(page,info,{long:true});await info.attach('zoom200.png',{body:await captureZoomViewport(page),contentType:'image/png'});await info.attach('zoom.json',{body:JSON.stringify({before,after}),contentType:'application/json'});
 }finally{await context.close();}
});

test('object navigation ref exposes the stable public button and clears on unmount',async({page})=>{
 await page.setViewportSize({width:390,height:844});await visit(page,'/continuity-react/?object-ref');await ready(page);expect(await page.evaluate(()=>window.continuityDemo.readRef()?.matches('button[data-xui-menu-toggle]'))).toBe(true);await page.getByRole('button',{name:'工作导航',exact:true}).click();await page.getByRole('link',{name:'设置',exact:true}).click();await page.getByRole('button',{name:'保留草稿',exact:true}).click();await expect(page.getByRole('button',{name:'工作导航',exact:true})).toBeFocused();await page.evaluate(()=>window.continuityDemo.destroy());expect(await page.evaluate(()=>window.continuityDemo.readRef())).toBeNull();
});
