import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';

async function settleLayout(page){
  await page.evaluate(async()=>{
    await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    await Promise.all(document.querySelector('.xui-shell').getAnimations({subtree:true}).filter(animation=>animation.effect?.getComputedTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{})));
  });
}
async function open(page,{mode='light',width=1682,font=100,flags=''}={}){
  await page.setViewportSize({width,height:1000});
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'no-preference'});
  await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);
  await page.goto('/card-group-react/?footer-meta&icon-actions&sizing=equal'+flags);
  await page.addStyleTag({content:':root{--card-group-item-min:16rem}'});
  await expect(page.getByRole('button',{name:'编辑 record-1',exact:true})).toBeVisible();
  if(font!==100)await page.evaluate(font=>document.documentElement.style.fontSize=font+'%',font);
  await settleLayout(page);
}
async function metrics(page){
  return page.locator('.xui-card').first().evaluate(card=>{
    const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    const group=card.querySelector('footer .xui-card-actions'),buttons=[...group.querySelectorAll('button')],footer=group.parentElement;
    return {card:rect(card),footer:rect(footer),group:rect(group),gap:parseFloat(getComputedStyle(group).gap),toolbarGap:parseFloat(getComputedStyle(document.querySelector('.xui-search-toolbar-actions')).gap),buttons:buttons.map(rect),switchTarget:rect(group.querySelector('[role="switch"]').parentElement),danger:getComputedStyle(buttons.at(-1)).color,neutral:getComputedStyle(buttons[0]).color,controlsInside:[...group.children].every(node=>{const r=rect(node),f=rect(footer);return r.x>=f.x&&r.right<=f.right;}),columns:getComputedStyle(card.closest('ul')).gridTemplateColumns.split(' ').length};
  });
}
async function reachable(page){
  await page.keyboard.press('Tab');
  const controls=[page.getByRole('switch',{name:'启用 record-1',exact:true}),...['详情 record-1','编辑 record-1','删除 record-1'].map(name=>page.getByRole('button',{name,exact:true}))];
  for(const control of controls){
    await control.focus();await expect(control).toBeFocused();await expect(control).toBeInViewport({ratio:1});
    expect(await control.evaluate(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node),outset=parseFloat(s.outlineWidth)+parseFloat(s.outlineOffset),body=node.closest('.xui-card-group-body').getBoundingClientRect();return s.outlineStyle!=='none'&&r.left-outset>=Math.max(body.left,0)&&r.right+outset<=Math.min(body.right,innerWidth)&&r.top-outset>=Math.max(body.top,0)&&r.bottom+outset<=Math.min(body.bottom,innerHeight);})).toBe(true);
  }
}

test('default action gap is compact while default hit areas and ordinary Toolbar remain unchanged',async({page},info)=>{
  await open(page);const m=await metrics(page);await info.attach('geometry.json',{body:JSON.stringify(m),contentType:'application/json'});
  expect(m.gap).toBe(4);expect(m.toolbarGap).toBe(8);expect(m.columns).toBe(5);expect(m.card.width).toBeGreaterThan(265);expect(m.card.width).toBeLessThan(282);
  for(const button of m.buttons){expect(button.width).toBe(36);expect(button.height).toBe(36);}
  expect(m.switchTarget.width).toBe(28);expect(m.switchTarget.height).toBe(36);expect(m.buttons[1].x-m.buttons[0].x).toBe(40);expect(m.buttons[2].x-m.buttons[1].x).toBe(40);expect(m.controlsInside).toBe(true);expect(m.danger).not.toBe(m.neutral);
});
for(const mode of ['light','dark','system'])for(const width of [1682,390])for(const font of [100,200])test(`${mode} ${width} text${font}: compact actions retain targets, focus and honest wrapping`,async({page},info)=>{
  await open(page,{mode,width,font});const m=await metrics(page),scale=font/100;expect(m.gap).toBe(4*scale);expect(m.toolbarGap).toBe(8*scale);expect(m.switchTarget.width).toBe(28*scale);expect(m.switchTarget.height).toBe(36*scale);expect(m.controlsInside).toBe(true);for(const button of m.buttons){expect(button.width).toBe(36*scale);expect(button.height).toBe(36*scale);}expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await reachable(page);if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');expect((await metrics(page)).gap).toBe(m.gap);}
  await info.attach('geometry.json',{body:JSON.stringify(m),contentType:'application/json'});await info.attach('actions.png',{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});
});
for(const flags of ['&actions-only','&header-actions','&plain-meta'])test(`${flags}: only Card action groups use compact spacing`,async({page},info)=>{
  await open(page,{flags});const m=await metrics(page);expect(m.gap).toBe(4);expect(m.toolbarGap).toBe(8);expect(m.controlsInside).toBe(true);
  if(flags==='&actions-only')await expect(page.locator('.xui-card').first().locator('footer .xui-card-meta')).toHaveCount(0);
  if(flags==='&header-actions')expect(await page.locator('.xui-card').first().locator('header .xui-card-actions').evaluate(node=>getComputedStyle(node).gap)).toBe('4px');
  await info.attach('geometry.json',{body:JSON.stringify(m),contentType:'application/json'});
});
test('independent icon actions and Switch survive refresh; disabled actions never fire',async({page})=>{
  await open(page,{flags:'&draft'});const toggle=page.getByRole('switch',{name:'启用 record-1',exact:true}),draft=page.getByRole('textbox',{name:'备注 record-1',exact:true});
  await toggle.focus();await page.keyboard.press('Space');for(const name of ['详情 record-1','编辑 record-1','删除 record-1']){await page.keyboard.press('Tab');await expect(page.getByRole('button',{name,exact:true})).toBeFocused();await page.keyboard.press('Enter');}
  expect(await page.evaluate(()=>window.cardGroupDemo.getFooterEvents())).toEqual(['switch record-1','detail record-1','edit record-1','delete record-1']);
  await draft.fill('刷新保留草稿');await draft.focus();const button=page.getByRole('button',{name:'编辑 record-1',exact:true}),saved=await button.elementHandle();await page.evaluate(()=>{window.cardGroupDemo.plan({revision:2,delay:300});void window.cardGroupDemo.resource.load('tasks');});await expect.poll(()=>page.evaluate(()=>window.cardGroupDemo.resource.getState().busy)).toBe(false);expect(await button.evaluate((node,saved)=>node===saved,saved)).toBe(true);await expect(draft).toHaveValue('刷新保留草稿');await expect(draft).toBeFocused();await expect(toggle).toBeChecked();
  await page.getByRole('button',{name:'切换禁用',exact:true}).click();await expect(toggle).toBeDisabled();for(const name of ['详情 record-1','编辑 record-1','删除 record-1']){const target=page.getByRole('button',{name,exact:true});await expect(target).toBeDisabled();const box=await target.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);}expect(await page.evaluate(()=>window.cardGroupDemo.getFooterEvents())).toHaveLength(4);
});
test('a public Card gap token override stays local to Card actions',async({page})=>{
  await open(page);await page.addStyleTag({content:':root{--card-actions-gap:6px}'});const m=await metrics(page);expect(m.gap).toBe(6);expect(m.toolbarGap).toBe(8);for(const button of m.buttons)expect(button.width).toBe(36);
});
for(const mode of ['light','dark','system'])test(`${mode} native zoom200: compact gaps preserve default CSS hit areas and focus`,async({},info)=>{
  test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1744,1100']});
  try{const page=await context.newPage();await page.emulateMedia({colorScheme:'dark'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);await page.goto('http://127.0.0.1:4173/card-group-react/?footer-meta&icon-actions&sizing=equal');await page.addStyleTag({content:':root{--card-group-item-min:16rem}'});await expect(page.getByRole('button',{name:'编辑 record-1',exact:true})).toBeVisible();const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize})),settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);const after=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize,css:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.css).toBe('1');expect(after.pinch).toBe(1);await settleLayout(page);const m=await metrics(page);expect(m.gap).toBe(4);expect(m.controlsInside).toBe(true);for(const button of m.buttons)expect(button.width).toBe(36);await reachable(page);await info.attach('zoom.json',{body:JSON.stringify({before,after,geometry:m}),contentType:'application/json'});await info.attach('zoom.png',{body:await captureZoomViewport(page),contentType:'image/png'});}finally{await context.close();}
});
