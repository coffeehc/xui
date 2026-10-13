import {test as base,expect,chromium} from '@playwright/test';
import {existsSync} from 'node:fs';

const test=base.extend({page:async({page},use,info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await use(page);
  await info.attach('browser-errors.json',{body:JSON.stringify(errors),contentType:'application/json'});expect(errors).toEqual([]);
}});
// Never disable the Chromium sandbox to work around a restricted executor.
const browserOptions=process.env.CI?{channel:'chrome'}:existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{};
test.use({launchOptions:{...browserOptions,chromiumSandbox:true,args:[]}});
const settle=page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
async function setup(page,kind,mode='light'){
  await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
  await page.addInitScript(mode=>localStorage.setItem('ui.theme.mode',mode),mode);
  await page.goto(`/search-toolbar-${kind}/`);await expect(page.getByLabel('Search records',{exact:true})).toBeVisible();await settle(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);
}
async function geometry(page){return page.getByTestId('default-toolbar').evaluate(root=>{
  const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const search=root.querySelector('input'),actions=root.querySelector('.xui-search-toolbar-actions'),buttons=[...actions.querySelectorAll('button')];
  return {root:rect(root),search:rect(search),actions:rect(actions),buttons:buttons.map(rect),min:getComputedStyle(search).minWidth,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth};
});}
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);const clipped=await page.locator('.xui-search-toolbar').evaluateAll(roots=>roots.flatMap(root=>[root,...root.querySelectorAll('input,textarea,button')]).filter(node=>node.getClientRects().length).filter(node=>node.getBoundingClientRect().right>innerWidth+1||node.getBoundingClientRect().left<0).map(node=>node.outerHTML));expect(clipped).toEqual([]);}
async function focusPaint(control){
  await control.focus();await control.evaluate(node=>node.scrollIntoView({block:'center',inline:'nearest'}));
  return control.evaluate(node=>{const rect=node.getBoundingClientRect(),style=getComputedStyle(node),outset=parseFloat(style.outlineWidth)+parseFloat(style.outlineOffset),clipped=[];for(let p=node.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),r=p.getBoundingClientRect();if(/hidden|clip|auto|scroll/.test(s.overflowX)&& (rect.left-outset<r.left-1||rect.right+outset>r.right+1))clipped.push(p.className);if(/hidden|clip|auto|scroll/.test(s.overflowY)&&(rect.top-outset<r.top-1||rect.bottom+outset>r.bottom+1))clipped.push(p.className);}return {clipped,left:rect.left-outset,right:rect.right+outset,viewport:innerWidth,outline:style.outlineStyle};});
}
for(const kind of ['react','vanilla']){
  for(const mode of ['light','dark','system'])test(`${kind} SearchToolbar ${mode}: wide row, uniform buttons, container wrapping and focus`,async({page},info)=>{
    await setup(page,kind,mode);const wide=await geometry(page);
    expect(wide.search.y).toBeCloseTo(wide.actions.y,1);expect(wide.search.right).toBeLessThan(wide.actions.x);expect(wide.search.width).toBeGreaterThan(wide.actions.width);expect(wide.min).toBe('0px');
    for(const button of wide.buttons){expect(button.y).toBeCloseTo(wide.search.y,1);expect(button.height).toBeCloseTo(wide.search.height,1);}
    await page.getByRole('button',{name:'高级筛选',exact:true}).click();await expect(page.getByLabel('Default owner',{exact:true})).toBeVisible();
    for(const width of [1280,640,390,276]){
      await page.setViewportSize({width,height:900});await settle(page);await noOverflow(page);
      if(width<=640){const result=await geometry(page);expect(result.actions.y).toBeGreaterThanOrEqual(result.search.bottom);}
      // Keyboard modality paints actual browser focus-visible outlines.
      await page.keyboard.press('Tab');
      for(const control of [page.getByLabel('Search records',{exact:true}),page.getByRole('button',{name:'高级筛选',exact:true}),page.getByLabel('Default owner',{exact:true}),page.getByLabel('Default notes',{exact:true})]){
        const result=await focusPaint(control);expect(result.clipped).toEqual([]);expect(result.outline).not.toBe('none');expect(result.left).toBeGreaterThanOrEqual(0);expect(result.right).toBeLessThanOrEqual(result.viewport+1);
      }
      await info.attach(`${kind}-${mode}-${width}.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
    }
    await page.setViewportSize({width:1280,height:900});await page.getByTestId('default-toolbar').evaluate(node=>{node.style.inlineSize='var(--layout-field-min)';});await settle(page);const narrowContainer=await geometry(page);expect(narrowContainer.actions.y).toBeGreaterThanOrEqual(narrowContainer.search.bottom);await noOverflow(page);
    if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');}
  });
  test(`${kind} SearchToolbar: keyboard, controlled acceptance, stable input identity and slot combinations`,async({page})=>{
    await setup(page,kind);const trigger=page.getByRole('button',{name:'高级筛选',exact:true}),owner=page.getByLabel('Default owner',{exact:true});
    await expect(trigger).toHaveAttribute('aria-expanded','false');await expect(owner).toBeHidden();await expect(page.getByTestId('default-toolbar').locator('[inert]')).toHaveCount(1);
    await trigger.focus();await page.keyboard.press('Enter');await expect(trigger).toHaveAttribute('aria-expanded','true');await owner.fill('Retained draft');await trigger.focus();await page.keyboard.press('Space');await expect(trigger).toHaveAttribute('aria-expanded','false');await page.keyboard.press('Tab');await expect(owner).not.toBeFocused();
    await trigger.focus();await page.keyboard.press('Enter');await expect(owner).toHaveValue('Retained draft');
    const controlled=page.getByTestId('controlled-toolbar'),toggle=controlled.getByRole('button',{name:/Controlled filters/}),input=page.getByLabel('Controlled owner',{exact:true});
    await toggle.focus();await page.keyboard.press('Space');await expect(toggle).toHaveAttribute('aria-expanded','false');await expect(page.getByTestId('counts')).toContainText('requests:1;');
    await page.evaluate(()=>window.searchToolbarExample.setAccept(true));await toggle.focus();await page.keyboard.press('Enter');await expect(toggle).toHaveAttribute('aria-expanded','true');await expect(page.getByTestId('counts')).toContainText('requests:2;');
    await input.fill('Unchanged');await input.evaluate(node=>{window.savedToolbarInput=node;node.focus();node.setSelectionRange(2,5);});
    for(let index=0;index<3;index++)await page.evaluate(()=>window.searchToolbarExample.update());
    await expect(input).toBeFocused();expect(await input.evaluate(node=>node===window.savedToolbarInput&&node.selectionStart===2&&node.selectionEnd===5)).toBe(true);await expect(input).toHaveValue('Unchanged');
    await page.evaluate(()=>window.searchToolbarExample.setExpanded(false));await expect(toggle).toBeFocused();await expect(input).toBeHidden();await expect(page.getByTestId('counts')).toContainText('requests:2;');
    await page.evaluate(()=>window.searchToolbarExample.setExpanded(true));await page.getByLabel('Search records',{exact:true}).focus();await page.evaluate(()=>window.searchToolbarExample.setExpanded(false));await expect(page.getByLabel('Search records',{exact:true})).toBeFocused();
    await page.evaluate(()=>window.searchToolbarExample.setAdvanced(false));await expect(toggle).toHaveCount(0);await page.evaluate(()=>window.searchToolbarExample.setAdvanced(true));await expect(toggle).toHaveCount(1);
    await expect(page.getByTestId('initial-open').getByRole('button')).toHaveAttribute('aria-expanded','true');await expect(page.getByLabel('Initially visible')).toBeVisible();
    await expect(page.getByTestId('search-only').getByRole('button')).toHaveCount(0);await expect(page.getByTestId('actions-only').getByRole('button')).toHaveCount(1);await expect(page.getByTestId('advanced-only').getByRole('button')).toHaveCount(1);await expect(page.getByTestId('empty-toolbar')).toBeHidden();await expect(page.getByTestId('search-actions').getByRole('button')).toHaveCount(1);await expect(page.getByTestId('search-advanced').getByRole('button')).toHaveCount(1);await expect(page.getByTestId('actions-advanced').getByRole('button')).toHaveCount(2);
  });
  for(const mode of ['light','dark','system'])test(`${kind} SearchToolbar ${mode}: genuine 200% browser page zoom`,async({},info)=>{
    // Chrome's ordinary Page zoom UI changes the actual browser profile zoom.
    // https://support.google.com/chrome/answer/96810
    // An ephemeral profile prevents changes to any user's browser or settings.
    const context=await chromium.launchPersistentContext('',{...browserOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});
    try{
      const page=await context.newPage();
      await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>localStorage.setItem('ui.theme.mode',mode),mode);await page.goto(`http://127.0.0.1:4173/search-toolbar-${kind}/`);await settle(page);
      const before=await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth,font:getComputedStyle(document.documentElement).fontSize}));
      const settings=await context.newPage();await settings.goto('chrome://settings/appearance');
      const zoomControl=settings.locator('select#zoomLevel');await expect(zoomControl).toBeVisible();await zoomControl.selectOption('2');await expect(zoomControl).toHaveValue('2');
      const zoom=Number(await zoomControl.inputValue());expect(zoom).toBe(2);await settings.close();await page.bringToFront();
      await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);await settle(page);
      const after=await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth,font:getComputedStyle(document.documentElement).fontSize,pinch:visualViewport.scale,cssZoom:getComputedStyle(document.documentElement).zoom}));
      expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.pinch).toBe(1);expect(after.cssZoom).toBe('1');await noOverflow(page);
      const toggle=page.getByRole('button',{name:'高级筛选',exact:true});await toggle.focus();await page.keyboard.press('Enter');await expect(page.getByLabel('Default owner',{exact:true})).toBeVisible();
      const paint=await focusPaint(page.getByLabel('Default notes',{exact:true}));expect(paint.clipped).toEqual([]);expect(paint.left).toBeGreaterThanOrEqual(0);expect(paint.right).toBeLessThanOrEqual(paint.viewport+1);
      const measured=await geometry(page);expect(measured.actions.y).toBeGreaterThanOrEqual(measured.search.bottom);
      await info.attach(`${kind}-${mode}-browser-200.json`,{body:JSON.stringify({zoom,before,after,measured}),contentType:'application/json'});await info.attach(`${kind}-${mode}-browser-200.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
    }finally{await context.close();}
  });
}
