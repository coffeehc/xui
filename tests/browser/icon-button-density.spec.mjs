import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const variants=['primary','secondary','outline','ghost','destructive','link','text'];
const settle=page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
async function open(page,{mode='light',width=1280,scale=100}={}){
 await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);await page.goto('/react/button-state-contract.html?mode='+mode);await expect(page.getByTestId('round-text-enabled')).toBeVisible();if(scale!==100)await page.evaluate(scale=>document.documentElement.style.fontSize=scale+'%',scale);await settle(page);
}
async function geometry(control){return control.evaluate(node=>{
 const s=getComputedStyle(node),r=node.getBoundingClientRect(),glyph=node.querySelector('svg')?.getBoundingClientRect(),border=getComputedStyle(node,'::before'),reach=parseFloat(s.outlineWidth)+parseFloat(s.outlineOffset),padding=parseFloat(s.paddingLeft),line=parseFloat(s.borderLeftWidth);
 return {width:r.width,height:r.height,icon:glyph?.width??null,iconHeight:glyph?.height??null,padding,line,clip:s.backgroundClip,surface:r.width-2*(padding+line),focusDiameter:r.width+2*reach,outline:s.outlineStyle,outlineWidth:parseFloat(s.outlineWidth),offset:parseFloat(s.outlineOffset),color:s.color,background:s.backgroundColor,border:s.borderColor,borderPart:{content:border.content,inset:parseFloat(border.top),width:parseFloat(border.borderTopWidth),color:border.borderColor,pointer:border.pointerEvents},inside:r.left-reach>=0&&r.right+reach<=innerWidth&&r.top-reach>=0&&r.bottom+reach<=innerHeight};
 });}
async function keyboardFocus(page,control){await control.evaluate(node=>node.scrollIntoView({block:'center',inline:'nearest'}));await control.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await expect(control).toBeFocused();await expect(control).toBeInViewport({ratio:1});await settle(page);}
function compact(m,scale=1){expect(m.width).toBe(36*scale);expect(m.height).toBe(36*scale);expect(m.icon).toBe(16*scale);expect(m.iconHeight).toBe(16*scale);expect(m.clip).toBe('content-box');expect(m.surface).toBe(28*scale);expect(m.focusDiameter).toBe(36*scale+6-8*scale);expect(m.outline).toBe('solid');expect(m.outlineWidth).toBe(2);expect((m.focusDiameter-2*m.outlineWidth-m.surface)/2).toBe(1);expect(m.inside).toBe(true);}

test('default edit focus is compact without reducing its hit target or glyph',async({page},info)=>{
 await open(page);const button=page.getByTestId('compact-edit');await keyboardFocus(page,button);const m=await geometry(button);await info.attach('geometry.json',{body:JSON.stringify(m),contentType:'application/json'});await info.attach('focus.png',{body:await button.locator('..').screenshot(),contentType:'image/png'});compact(m);
});
for(const mode of ['light','dark','system'])for(const width of [1280,390])for(const scale of [100,200])test(`${mode} ${width} reading${scale}: all icon skins keep targets, states and full focus`,async({page},info)=>{
 await open(page,{mode,width,scale});const measures=[];
 for(const variant of variants){
  const button=page.getByTestId(`round-${variant}-enabled`);await keyboardFocus(page,button);const idle=await geometry(button);compact(idle,scale/100);await button.hover();const hover=await geometry(button);expect(hover.surface).toBe(idle.surface);await page.keyboard.down('Space');await expect(button).toHaveAttribute('data-pressed','true');await page.keyboard.up('Space');expect(await page.evaluate(id=>window.buttonStateClicks[id],`round-${variant}-enabled`)).toBe(1);
  // Transparent outer padding is still the button's real target, not a wrapper.
  const box=await button.boundingBox();await page.mouse.click(box.x+1,box.y+box.height/2);expect(await page.evaluate(id=>window.buttonStateClicks[id],`round-${variant}-enabled`)).toBe(2);
  for(const state of ['disabled','disabled-busy']){const disabled=page.getByTestId(`round-${variant}-${state}`);await disabled.scrollIntoViewIfNeeded();const b=await disabled.boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);await expect(disabled).toBeDisabled();expect(await page.evaluate(id=>window.buttonStateClicks[id]??0,`round-${variant}-${state}`)).toBe(0);expect((await geometry(disabled)).clip).toBe('content-box');}
  const busy=page.getByTestId(`round-${variant}-busy`);await busy.click();expect(await page.evaluate(id=>window.buttonStateClicks[id],`round-${variant}-busy`)).toBe(1);const bm=await geometry(busy);expect(bm.borderPart.inset).toBe(4*scale/100);expect(bm.borderPart.width).toBe(1);expect(bm.borderPart.pointer).toBe('none');await busy.focus();await page.keyboard.press('Tab');await expect(page.getByTestId(`round-${variant}-expanded`)).toBeFocused();
  measures.push({variant,idle,hover,busy:bm});
 }
 const marked=page.getByTestId('round-text-marked');await keyboardFocus(page,marked);compact(await geometry(marked),scale/100);
 const danger=page.getByTestId('danger-text-enabled');await keyboardFocus(page,danger);const dm=await geometry(danger);compact(dm,scale/100);expect(dm.color).not.toBe((await geometry(marked)).color);await info.attach('focus.png',{body:await danger.locator('..').screenshot(),contentType:'image/png'});
 const text=page.getByTestId('round-text-control');await keyboardFocus(page,text);expect(await text.evaluate(node=>getComputedStyle(node).outlineOffset)).toBe('2px');
 if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');await keyboardFocus(page,danger);compact(await geometry(danger),scale/100);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await info.attach('states.json',{body:JSON.stringify(measures),contentType:'application/json'});
});
test('all public sizes and a rendered link keep their original targets and keyboard behavior',async({page},info)=>{
 await open(page);const sizes={xs:[24,12],sm:[32,16],default:[36,16],lg:[40,16]},measured=[];
 for(const [size,[target,glyph]]of Object.entries(sizes)){const button=page.getByTestId(`size-${size}-icon`);await keyboardFocus(page,button);const m=await geometry(button);expect(m.width).toBe(target);expect(m.height).toBe(target);expect(m.surface).toBe(target-8);expect(m.icon).toBe(glyph);expect(m.focusDiameter).toBe(target-2);measured.push({size,...m});}
 const link=page.getByTestId('round-render');await keyboardFocus(page,link);compact(await geometry(link));await page.keyboard.press('Space');expect(await page.evaluate(()=>window.buttonStateClicks['round-render']??0)).toBe(0);await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.buttonStateClicks['round-render'])).toBe(1);await expect(page).toHaveURL(/#icon-shape-panel$/);await info.attach('sizes.json',{body:JSON.stringify(measured),contentType:'application/json'});
});
for(const mode of ['light','dark','system'])test(`${mode} real browser zoom200 preserves CSS geometry and compact focus`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1180,1100']});
 try{const page=await context.newPage();await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);await page.goto('http://127.0.0.1:4173/react/button-state-contract.html?mode='+mode);await expect(page.getByTestId('round-text-enabled')).toBeVisible();const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);const after=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize,css:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.css).toBe('1');expect(after.pinch).toBe(1);
  const button=page.getByTestId('round-text-enabled');await keyboardFocus(page,button);const m=await geometry(button);compact(m);await info.attach('zoom.json',{body:JSON.stringify({before,after,m}),contentType:'application/json'});await info.attach('zoom.png',{body:await captureZoomViewport(page),contentType:'image/png'});
 }finally{await context.close();}
});

for(const mode of ['light','dark','system'])test(`${mode}: toolbar, Card and menu trigger share public density and retain close focus`,async({page},info)=>{
 await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.goto('/text-actions-react/?mode='+mode);await expect(page.getByRole('button',{name:'编辑卡片任务',exact:true})).toBeVisible();
 for(const label of ['编辑研究任务','编辑工作区','编辑配置','编辑卡片任务','删除卡片任务']){const button=page.getByRole('button',{name:label,exact:true});await keyboardFocus(page,button);compact(await geometry(button));await page.keyboard.press('Enter');}expect(await page.evaluate(()=>window.textActionsDemo.calls)).toBe(5);await info.attach('card-toolbar.png',{body:await page.screenshot(),contentType:'image/png'});
 await open(page,{mode});const trigger=page.getByTestId('round-menu-trigger');await keyboardFocus(page,trigger);compact(await geometry(trigger));await page.keyboard.press('Enter');await expect(page.getByRole('menuitem',{name:'添加附件',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();compact(await geometry(trigger));
});

test('built-in navigation branch and row actions use the same compact paint in expanded and compact modes',async({page},info)=>{
 await page.setViewportSize({width:1280,height:1000});await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});const measured=[];
 for(const compactMode of [false,true]){await page.goto('/navigation-tones-react/?mode=light'+(compactMode?'&compact':''));await expect(page.getByRole('button',{name:'配置研发团队',exact:true})).toBeVisible();
  for(const selector of ['.xui-shell-toggle','.xui-menu-branch-toggle','.xui-menu-row-action']){const button=page.locator(selector).first();await keyboardFocus(page,button);const m=await geometry(button);expect(m.width).toBe(36);expect(m.height).toBe(36);expect(m.surface).toBe(28);expect(m.focusDiameter).toBe(34);expect(m.outline).toBe('solid');expect(m.inside).toBe(true);measured.push({compactMode,selector,...m});}
 }await info.attach('navigation.json',{body:JSON.stringify(measured),contentType:'application/json'});
});
