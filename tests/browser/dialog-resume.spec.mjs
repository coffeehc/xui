import{test,expect,chromium}from'@playwright/test';
import{chromiumLaunchOptions}from'./chromium-launch-options.mjs';import{captureZoomViewport}from'./zoom-capture.mjs';
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function configure(page,mode){await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);}
async function visit(page,{whole=false,strict=false,root200=false}={}){await page.goto(`http://127.0.0.1:4173/dialog-resume-react${strict?'-strict':''}/?${whole?'whole':''}`);if(root200)await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.getByRole('button',{name:'打开保留详情',exact:true}).click();await settle(page);}
async function retained(page,info,{whole=false,zoom=false}={}){
 const dialog=page.getByRole('dialog'),body=dialog.locator(':scope>.xui-dialog-body'),field=page.getByRole('textbox',{name:'详情草稿'}),owner=whole?dialog:body;
 await expect(dialog).toHaveAttribute('data-dialog-scroll',whole?'whole':'body');await dialog.evaluate(node=>Promise.allSettled(node.getAnimations().map(animation=>animation.finished)));await field.fill('保留的草稿 unchanged draft');await field.evaluate(node=>node.setSelectionRange(2,7));await owner.evaluate(node=>node.scrollTop=93);await settle(page);const measuredOffset=await owner.evaluate(node=>node.scrollTop);expect(Math.abs(measuredOffset-93)).toBeLessThan(.1);
 await dialog.evaluate(node=>{window.retainedNodes={popup:node,body:node.querySelector('.xui-dialog-body'),field:node.querySelector('textarea')};});
 // Native Firefox quantizes scrollTop assignments under a scale animation;
 // the independent HTML control reproduces it without xui. Static geometry
 // and Chromium/WebKit still require exact restoration of the measured offset.
 const animatedFirefox=page.context().browser()?.browserType().name()==='firefox'&&await page.evaluate(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches);
 const precision=animatedFirefox?await page.evaluate(()=>1/devicePixelRatio):0;
 const checkOffset=async()=>{const actual=await owner.evaluate(node=>node.scrollTop);if(precision===0)expect(actual).toBe(measuredOffset);else expect(Math.abs(actual-measuredOffset)).toBeLessThanOrEqual(precision);return actual;};
 const samples=[];
 for(let pass=0;pass<2;pass++){
  await expect(field).toBeFocused();await checkOffset();await page.evaluate(()=>window.dialogResumeDemo.pause());await expect(dialog).toBeHidden();
  // An explicit host async boundary, long enough to complete the close phase.
  // No auth request or document.hidden override participates in this fixture.
  await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,350)));await page.evaluate(()=>window.dialogResumeDemo.resume());await expect(dialog).toBeVisible();await expect(field).toBeFocused();await dialog.evaluate(node=>Promise.allSettled(node.getAnimations().map(animation=>animation.finished)));await settle(page);
  await expect(dialog).toHaveAttribute('data-dialog-scroll',whole?'whole':'body');await checkOffset();await expect(field).toHaveValue('保留的草稿 unchanged draft');expect(await field.evaluate(node=>[node.selectionStart,node.selectionEnd])).toEqual([2,7]);
  expect(await dialog.evaluate(node=>window.retainedNodes.popup===node&&window.retainedNodes.body===node.querySelector('.xui-dialog-body')&&window.retainedNodes.field===node.querySelector('textarea'))).toBe(true);
  samples.push({pass,requestedOffset:93,measuredOffset,precision,owner:whole?'whole':'body',offset:await owner.evaluate(node=>node.scrollTop),events:await page.evaluate(()=>window.dialogResumeDemo.events)});
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await info.attach(`retained-${whole?'whole':'body'}.json`,{body:JSON.stringify(samples),contentType:'application/json'});await info.attach(`retained-${whole?'whole':'body'}.png`,{body:zoom?await captureZoomViewport(page):await page.screenshot(),contentType:'image/png'});
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(page.getByRole('button',{name:'打开保留详情',exact:true})).toBeFocused();
}
for(const mode of['light','dark','system'])for(const width of[1280,390,320])for(const whole of[false,true])test(`retained Dialog ${mode} ${width}px ${whole?'whole':'body'} keeps reading after an async pause`,async({page},info)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.setViewportSize({width,height:844});await configure(page,mode);if(width===1280)await page.emulateMedia({reducedMotion:'no-preference'});await visit(page,{whole,strict:width===390,root200:width===320});await retained(page,info,{whole});expect(errors).toEqual([]);if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');}
});
test('a real body/whole owner change during the pause still reveals the focused field',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await configure(page,'dark');await visit(page,{strict:true});const dialog=page.getByRole('dialog'),field=page.getByRole('textbox',{name:'详情草稿'}),body=dialog.locator(':scope>.xui-dialog-body');await field.fill('Keep same field');await field.evaluate(node=>window.sameField=node);await body.evaluate(node=>node.scrollTop=93);
 for(const whole of[true,false]){await page.evaluate(whole=>{window.dialogResumeDemo.pause();window.dialogResumeDemo.setWhole(whole);},whole);await expect(dialog).toBeHidden();await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,350)));await page.evaluate(()=>window.dialogResumeDemo.resume());await expect(dialog).toBeVisible();await expect(field).toBeFocused();await expect(dialog).toHaveAttribute('data-dialog-scroll',whole?'whole':'body');await settle(page);expect(await field.evaluate(node=>node===window.sameField)).toBe(true);await expect(field).toHaveValue('Keep same field');const bounds=await dialog.boundingBox(),control=await field.boundingBox();expect(control.y).toBeGreaterThanOrEqual(bounds.y-1);expect(control.y+control.height).toBeLessThanOrEqual(bounds.y+bounds.height+1);}
 await info.attach('owner-switch.png',{body:await page.screenshot(),contentType:'image/png'});
});
for(const mode of['light','dark','system'])test(`genuine Chrome zoom200 ${mode} retained Dialog body and whole`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});try{const page=await context.newPage();await configure(page,mode);await page.goto('http://127.0.0.1:4173/dialog-resume-react/');const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize})),settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);expect(await page.evaluate(()=>innerWidth)).toBeCloseTo(before.width/2,0);expect(await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize)).toBe(before.font);expect(await page.evaluate(()=>getComputedStyle(document.documentElement).zoom)).toBe('1');expect(await page.evaluate(()=>visualViewport.scale)).toBe(1);for(const whole of[false,true]){await visit(page,{whole});await retained(page,info,{whole,zoom:true});}}finally{await context.close();}
});
