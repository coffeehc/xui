import {test,expect} from '@playwright/test';
const control=(page,id)=>page.locator(`[data-menu-id="${id}"][data-menu-control="primary"]`);
test.use({hasTouch:true});
for(const kind of ['react','vanilla']){
  test(`${kind} data menu owns default selected skin, groups, nested links and stable navigation`,async({page})=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(`/menu-${kind}/?page=overview`);
    await expect(control(page,'overview')).toHaveAttribute('aria-current','page');
    await page.evaluate(()=>{window.menuIdentity={shell:document.querySelector('.xui-menu-layout'),main:document.querySelector('main'),nav:document.querySelector('nav[aria-label="工作导航"]'),link:document.querySelector('[data-menu-id="overview"]'),draft:document.getElementById('menu-draft')};});
    await page.getByRole('textbox',{name:'草稿'}).fill('切换页面也保留');
    await control(page,'library').click();await expect(page.locator('[data-route]')).toHaveText('library');await expect(control(page,'library')).toHaveAttribute('aria-current','page');await expect(control(page,'notes')).toBeHidden();await page.getByRole('button',{name:'Expand 资料库'}).click();await expect(control(page,'notes')).toBeVisible();
    await control(page,'library').click();expect(await page.evaluate(()=>window.menuDemo.calls())).toEqual(['library','library']);
    await page.goBack();await expect(control(page,'overview')).toHaveAttribute('aria-current','page');await page.goForward();await expect(control(page,'library')).toHaveAttribute('aria-current','page');
    expect(await page.evaluate(()=>Object.entries(window.menuIdentity).every(([key,value])=>value===({shell:document.querySelector('.xui-menu-layout'),main:document.querySelector('main'),nav:document.querySelector('nav[aria-label="工作导航"]'),link:document.querySelector('[data-menu-id="overview"]'),draft:document.getElementById('menu-draft')})[key]))).toBe(true);
    await expect(page.getByRole('textbox',{name:'草稿'})).toHaveValue('切换页面也保留');expect(await page.locator('a a').count()).toBe(0);expect(errors).toEqual([]);
    for(const colorScheme of ['light','dark']){await page.emulateMedia({colorScheme});await control(page,'library').hover();await page.waitForTimeout(180);
      const styles=await control(page,'library').evaluate(node=>{const style=getComputedStyle(node),line=getComputedStyle(node,'::before');const probe=document.createElement('span');node.append(probe);probe.style.background='var(--menu-item-selected-background)';probe.style.color='var(--menu-item-selected-foreground)';const expected=getComputedStyle(probe);const result={background:style.backgroundColor,color:style.color,expectedBackground:expected.backgroundColor,expectedColor:expected.color,line:line.opacity,border:style.borderWidth,icon:getComputedStyle(node.querySelector('svg')).color};probe.remove();return result;});
      expect(styles.background).toBe(styles.expectedBackground);expect(styles.color).toBe(styles.expectedColor);expect(styles.icon).toBe(styles.color);expect(styles.line).toBe('1');expect(styles.border).toBe('0px');
    }
    await page.evaluate(()=>window.menuDemo.update({items:[{id:'new-tab',label:'新标签页',href:'?page=new-tab',target:'_blank'},{id:'overview',label:'已更新的总览',icon:'home',href:'?page=overview'}]}));await expect(control(page,'overview')).toHaveText('已更新的总览');expect(await control(page,'overview').evaluate(node=>node===window.menuIdentity.link)).toBe(true);
  });
  test(`${kind} menu keyboard skips disabled, expands/collapses, supports RTL and visible focus`,async({page})=>{
    await page.goto(`/menu-${kind}/?page=overview`);await control(page,'overview').focus();await page.keyboard.press('ArrowDown');await expect(control(page,'library')).toBeFocused();await page.keyboard.press('ArrowRight');await expect(page.getByRole('button',{name:'Collapse 资料库'})).toHaveAttribute('aria-expanded','true');await page.keyboard.press('ArrowRight');await expect(control(page,'notes')).toBeFocused();await page.keyboard.press('ArrowLeft');await expect(control(page,'library')).toBeFocused();await page.keyboard.press('ArrowLeft');await expect(control(page,'notes')).toBeHidden();
    await control(page,'tools').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await expect(control(page,'preferences')).toBeFocused();await page.keyboard.press('ArrowDown');await expect(control(page,'new-tab')).toBeFocused();
    await page.evaluate(()=>document.documentElement.dir='rtl');await control(page,'tools').focus();await page.keyboard.press('ArrowRight');await expect(control(page,'preferences')).toBeHidden();await page.keyboard.press('ArrowLeft');await expect(control(page,'preferences')).toBeVisible();
    await page.keyboard.press('Home');await expect(control(page,'overview')).toBeFocused();await page.keyboard.press('End');await expect(control(page,'browser')).toBeFocused();
    const outline=await control(page,'browser').evaluate(node=>getComputedStyle(node).outlineStyle);expect(outline).not.toBe('none');await expect(control(page,'archive')).not.toHaveAttribute('href');
    await control(page,'archive').dispatchEvent('click');expect(await page.evaluate(()=>window.menuDemo.calls())).toEqual([]);
    await control(page,'overview').focus();await page.keyboard.down('Enter');await expect(control(page,'overview')).toHaveAttribute('data-pressed','true');await page.keyboard.up('Enter');await expect(control(page,'overview')).not.toHaveAttribute('data-pressed');
    expect(await page.locator('[data-menu-control][tabindex="0"]').count()).toBe(1);
  });
  test(`${kind} compact, controlled requests, updates and removed focus have safe fallbacks`,async({page})=>{
    await page.goto(`/menu-${kind}/?page=overview`);await page.getByRole('button',{name:'紧凑导航'}).click();await expect(page.locator('.xui-menu-layout')).toHaveAttribute('data-collapsed','true');await expect(control(page,'overview')).toHaveAccessibleName('总览');
    await page.evaluate(()=>{window.controlRequests=[];window.menuDemo.update({collapsed:true,onCollapsedChange:next=>window.controlRequests.push(next),expandedIds:[],onExpandedChange:next=>window.controlRequests.push(next)});});
    await page.getByRole('button',{name:'展开导航'}).click();await expect(page.locator('.xui-menu-layout')).toHaveAttribute('data-collapsed','true');expect(await page.evaluate(()=>window.controlRequests)).toEqual([false]);
    await control(page,'tools').click();await expect(control(page,'preferences')).toBeHidden();expect(await page.evaluate(()=>window.controlRequests)).toEqual([false,['tools']]);
    await page.evaluate(()=>window.menuDemo.update({collapsed:false,expandedIds:['tools'],activeId:null}));await expect(control(page,'preferences')).toBeVisible();expect(await page.locator('[aria-current="page"]').count()).toBe(0);
    await control(page,'preferences').focus();await page.evaluate(()=>window.menuDemo.update({items:[{id:'replacement',label:'替换后菜单',href:'?page=replacement'}],activeId:'replacement'}));await expect(control(page,'replacement')).toBeFocused();
    await page.evaluate(()=>window.menuDemo.update({items:[]}));await expect(page.getByText('暂无导航')).toBeVisible();await expect(page.getByRole('button',{name:'紧凑导航'})).toBeFocused();await expect(page.getByRole('heading',{level:1})).toBeVisible();await expect(page.getByRole('button',{name:'新建记录'})).toBeVisible();
  });
  test(`${kind} narrow drawer keeps expanded/compact state, escapes and returns focus`,async({page})=>{
    await page.goto(`/menu-${kind}/?page=overview`);await control(page,'tools').click();await page.getByRole('button',{name:'紧凑导航'}).click();await page.setViewportSize({width:390,height:720});
    const trigger=page.getByRole('button',{name:'工作导航',exact:true});await trigger.tap();await expect(page.getByRole('dialog')).toBeVisible();await expect(control(page,'preferences')).toBeVisible();await expect(control(page,'overview').locator('.xui-menu-label')).toBeVisible();
    await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();await expect(trigger).toBeFocused();
    await trigger.tap();await control(page,'preferences').tap();await expect(page.getByRole('dialog')).toBeHidden();await expect(trigger).toBeFocused();await expect(page.locator('[data-route]')).toHaveText('preferences');
    await trigger.click();await page.setViewportSize({width:1280,height:800});await expect(page.getByRole('dialog')).toBeHidden();await expect(control(page,'preferences')).toBeVisible();await expect(page.locator('.xui-menu-layout')).toHaveAttribute('data-collapsed','true');
    expect(await page.locator('nav[aria-label="工作导航"]').count()).toBe(1);
  });
  test(`${kind} controlled drawer changes only after the host confirms`,async({page})=>{
    await page.setViewportSize({width:390,height:720});await page.goto(`/menu-${kind}/?page=overview`);
    await page.evaluate(()=>{window.sidebarRequests=[];window.menuDemo.update({sidebarOpen:false,onSidebarOpenChange:open=>window.sidebarRequests.push(open)});});
    const trigger=page.getByRole('button',{name:'工作导航',exact:true});await trigger.click();await expect(page.getByRole('dialog')).toBeHidden();expect(await page.evaluate(()=>window.sidebarRequests)).toEqual([true]);
    await page.evaluate(()=>window.menuDemo.update({sidebarOpen:true}));await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeVisible();expect(await page.evaluate(()=>window.sidebarRequests)).toEqual([true,false]);
    await page.evaluate(()=>window.menuDemo.update({sidebarOpen:false}));await expect(page.getByRole('dialog')).toBeHidden();await expect(trigger).toBeFocused();
  });
  test(`${kind} long Chinese, 200% text and reduced motion preserve key content`,async({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`/menu-${kind}/?page=notes`);await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.setViewportSize({width:640,height:720});
    await expect(page.getByRole('heading',{level:1})).toBeVisible();await expect(page.getByRole('button',{name:'新建记录'})).toBeVisible();const primary=await page.getByRole('button',{name:'新建记录'}).boundingBox();expect(primary.y+primary.height).toBeLessThan(720);
    await page.getByRole('button',{name:'工作导航',exact:true}).click();await expect(control(page,'notes')).toBeVisible();const label=await control(page,'notes').locator('.xui-menu-label').evaluate(node=>({scroll:node.scrollWidth,client:node.clientWidth,whiteSpace:getComputedStyle(node).whiteSpace}));expect(label.scroll).toBeLessThanOrEqual(label.client+1);expect(label.whiteSpace).not.toBe('nowrap');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const motion=await control(page,'notes').evaluate(node=>getComputedStyle(node).transitionDuration.split(',').every(value=>parseFloat(value)<=.001));expect(motion).toBe(true);
    await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();
  });
  test(`${kind} native modifiers, target, download and adapter bypass preserve browser navigation`,async({page,context})=>{
    await page.goto(`/menu-${kind}/?page=overview`);const popup=page.waitForEvent('popup');await control(page,'new-tab').click();const tab=await popup;await tab.waitForLoadState();expect(tab.url()).toContain('page=new-tab');await tab.close();expect(await page.evaluate(()=>window.menuDemo.calls())).toEqual([]);
    for(const click of [{modifiers:['Control']},{button:'middle'}]){const opening=context.waitForEvent('page');await control(page,'overview').click(click);const opened=await opening;await opened.waitForLoadState();expect(opened.url()).toContain('page=overview');await opened.close();expect(await page.evaluate(()=>window.menuDemo.calls())).toEqual([]);}
    const download=page.waitForEvent('download');await control(page,'download').click();expect((await download).suggestedFilename()).toBe('reference.html');expect(await page.evaluate(()=>window.menuDemo.calls())).toEqual([]);
    await control(page,'browser').click();await expect(page).toHaveURL(new RegExp(`/menu-${kind}/destination.html$`));await expect(page.getByText('Browser destination')).toBeVisible();
  });
  test(`${kind} lifecycle releases the owner and can mount once again`,async({page})=>{
    await page.goto(`/menu-${kind}/?page=overview`);await page.evaluate(()=>window.menuDemo.destroy());await expect(page.locator('nav[aria-label="工作导航"]')).toHaveCount(0);await page.evaluate(()=>window.menuDemo.mount());await expect(control(page,'overview')).toBeVisible();await control(page,'library').click();expect(await page.evaluate(()=>window.menuDemo.calls())).toEqual(['library']);
    if(kind==='vanilla'){const results=await page.evaluate(()=>{const owner=window.menuDemo.getOwner(),before=owner.getMenu().getElement();let invalid=false;try{owner.update({items:[{id:'x',label:'X'},{id:'x',label:'Y'}]});}catch{invalid=true;}return {invalid,same:before===owner.getMenu().getElement(),stillSelected:before.querySelector('[aria-current="page"]')?.dataset.menuId};});expect(results).toEqual({invalid:true,same:true,stillSelected:'library'});}
  });
}
