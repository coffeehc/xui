import {test,expect} from '@playwright/test';
for(const kind of ['react','vanilla']){
  const setup=async page=>{await page.goto(`/header-controls-${kind}/?compact&locale&controlled`);await page.waitForFunction(()=>!!window.headerDemo);};
  test(`${kind} locale themed popup is anchored, bounded, keyboard operable and controlled`,async({page},info)=>{
    await setup(page);const trigger=page.getByRole('combobox',{name:'语言',exact:true});await trigger.focus();await page.keyboard.press('ArrowDown');const popup=page.getByRole('listbox');await expect(popup).toBeVisible();await expect(popup.getByRole('option',{name:'Deutsch',exact:true})).toBeDisabled();
    const boxes=await page.evaluate(()=>{const t=document.querySelector('button.xui-header-locale').getBoundingClientRect(),p=document.querySelector('.xui-header-locale-popup').getBoundingClientRect();return{t:{left:t.left,bottom:t.bottom},p:{left:p.left,top:p.top,right:p.right,bottom:p.bottom},width:innerWidth,height:innerHeight};});expect(boxes.p.left).toBeCloseTo(boxes.t.left,0);expect(boxes.p.top).toBeGreaterThanOrEqual(boxes.t.bottom);expect(boxes.p.right).toBeLessThanOrEqual(boxes.width);expect(boxes.p.bottom).toBeLessThanOrEqual(boxes.height);
    await info.attach('locale-popup.png',{body:await page.screenshot(),contentType:'image/png'});
    await page.keyboard.press('End');await page.keyboard.press('Enter');await expect(trigger).toHaveText('简体中文');expect(await page.evaluate(()=>window.headerDemo.getRequests())).toEqual(['en']);await page.evaluate(()=>window.headerDemo.setValue('en'));await expect(trigger).toHaveText('English');
    await trigger.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(popup).toBeHidden();
    await page.evaluate(()=>window.headerDemo.setOptions(Array.from({length:80},(_,i)=>({value:`lang-${i}`,label:`Language option ${i} with a long localized name`})))) ;await trigger.click();await expect(popup).toBeVisible();await page.setViewportSize({width:390,height:600});await expect.poll(()=>popup.evaluate(node=>{const r=node.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;})).toBe(true);
    await page.keyboard.press('End');await expect(popup.getByRole('option').last()).toBeInViewport();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  });
  test(`${kind} brand precedes toggle and tracks desktop sidebar/content geometry`,async({page})=>{
    await setup(page);const identity=page.locator('.xui-app-header-identity'),toggle=page.locator('[data-xui-menu-toggle]'),brand=page.locator('.xui-app-header-brand');
    for(const collapsed of [false,true,false]){
      if((await page.locator('.xui-shell').getAttribute('data-collapsed'))!==String(collapsed))await toggle.click();await expect(page.locator('.xui-shell')).toHaveAttribute('data-collapsed',String(collapsed));
      await expect.poll(async()=>{const rect=await toggle.boundingBox();return page.locator('main').evaluate((node,left)=>Math.abs(left-(node.getBoundingClientRect().left+parseFloat(getComputedStyle(node).paddingLeft))),rect.x);}).toBeLessThan(1);
      const region=await identity.boundingBox(),button=await toggle.boundingBox();expect(region.x+region.width).toBeLessThanOrEqual(button.x);expect(await brand.evaluate(node=>!!(node.compareDocumentPosition(node.closest('.xui-app-header-primary').querySelector('[data-xui-menu-toggle]'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    }
    await page.setViewportSize({width:390,height:844});await expect(brand).toBeVisible();await toggle.click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(toggle).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  });
}

for(const kind of ['react','vanilla'])for(const leading of [false,true])for(const direction of ['ltr','rtl'])test(`${kind} public brand bounds oversized artwork and centers compact identity with leading=${leading} ${direction}`,async({page},info)=>{
  await page.setViewportSize({width:1280,height:800});await page.goto(`/header-controls-${kind}/?brandImage${leading?'&leading':''}`);await page.waitForFunction(()=>!!window.headerDemo);await page.evaluate(direction=>document.documentElement.dir=direction,direction);
  const logo=page.locator('.xui-header-brand-logo'),name=page.locator('.xui-header-brand-name'),toggle=page.locator('[data-xui-menu-toggle]');
  await expect(logo.locator('img')).toBeVisible();expect(await logo.locator('img').evaluate(node=>getComputedStyle(node).objectFit)).toBe('contain');
  for(const collapsed of [false,true,false]){
    if((await page.locator('.xui-shell').getAttribute('data-collapsed'))!==String(collapsed))await toggle.click();
    await expect.poll(()=>page.evaluate(({collapsed,leading})=>{const rail=document.querySelector('.xui-shell-sidebar'),brand=document.querySelector('.xui-app-header-brand'),logo=document.querySelector('.xui-header-brand-logo'),image=logo.querySelector('img'),toggle=document.querySelector('[data-xui-menu-toggle]'),main=document.querySelector('.xui-shell-main');const rtl=getComputedStyle(main).direction==='rtl';const r=rail.getBoundingClientRect(),b=brand.getBoundingClientRect(),l=logo.getBoundingClientRect(),i=image.getBoundingClientRect(),t=toggle.getBoundingClientRect(),m=main.getBoundingClientRect();const probe=document.createElement('span');probe.style.cssText='position:absolute;inline-size:var(--control-height-sm);block-size:var(--control-height-sm)';logo.append(probe);const expected=probe.getBoundingClientRect().width;probe.remove();return {contained:i.width<=l.width+1&&i.height<=l.height+1,bounded:Math.abs(l.width-expected)<1&&Math.abs(l.height-expected)<1,aligned:!collapsed||Math.abs(l.x+l.width/2-(leading?b.x+b.width/2:r.x+r.width/2))<1,toggle:Math.abs(rtl?t.right-(m.right-parseFloat(getComputedStyle(main).paddingRight)):t.x-(m.x+parseFloat(getComputedStyle(main).paddingLeft)))<1,safe:!leading||(rtl?document.querySelector('.xui-app-header-leading').getBoundingClientRect().left>=l.right:document.querySelector('.xui-app-header-leading').getBoundingClientRect().right<=l.x)};},{collapsed,leading})).toEqual({contained:true,bounded:true,aligned:true,toggle:true,safe:true});
    expect(await name.textContent()).toContain('跨区域项目');await info.attach(`${kind}-${leading?'leading':'plain'}-${collapsed?'compact':'expanded'}-brand`,{body:await page.locator('.xui-shell-header').screenshot({animations:'disabled'}),contentType:'image/png'});
  }
  await page.setViewportSize({width:390,height:800});await expect(name).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
