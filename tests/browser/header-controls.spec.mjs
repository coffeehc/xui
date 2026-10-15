import {expectOptionSpacing} from './option-spacing.mjs';
import {test as base,expect} from '@playwright/test';
const test=base.extend({page:async({page},use,info)=>{const errors=[];page.on('pageerror',error=>errors.push(error.message));await use(page);await info.attach('browser-errors.json',{body:JSON.stringify(errors),contentType:'application/json'});expect(errors).toEqual([]);}});
const toggle=page=>page.locator('.xui-theme-mode-toggle');
const setup=async(page,kind,query='',mode=null)=>{await page.setViewportSize({width:1280,height:800});await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});if(mode!==null)await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);await page.goto(`/header-controls-${kind}/${query}`);await page.waitForFunction(()=>!!window.headerDemo);await expect(toggle(page)).toBeEnabled();};
for(const kind of ['react']){
  test(`${kind} default header cycles preference with one owner, icons, persistence and keyboard`,async({page},info)=>{
    await setup(page,kind);const control=toggle(page);await expect(control).toHaveCount(1);await expect(page.locator('.xui-header-locale')).toHaveCount(0);await expect(control).toHaveAttribute('data-theme-mode','dark');await expect(control).toHaveAccessibleName('暗黑模式. 切换到跟随系统');await expect(control).toHaveAttribute('title','切换到跟随系统');
    await page.evaluate(()=>{window.savedTheme=window.xuiTheme;window.savedButton=document.querySelector('.xui-theme-mode-toggle');window.icons=[];});
    await control.focus();
    for(const [key,mode] of [['Enter','system'],['Space','light'],['Enter','dark']]){await page.keyboard.press(key);await expect(control).toBeFocused();await expect(control).toHaveAttribute('data-theme-mode',mode);expect(await page.evaluate(()=>window.xuiTheme===window.savedTheme&&document.querySelector('.xui-theme-mode-toggle')===window.savedButton)).toBe(true);expect(await page.evaluate(()=>sessionStorage.getItem('ui.theme.mode'))).toBe(mode);await page.evaluate(()=>window.icons.push(document.querySelector('.xui-theme-mode-icon').innerHTML));}
    expect(await page.evaluate(()=>new Set(window.icons).size)).toBe(3);await page.evaluate(()=>window.xuiTheme.setMode('system'));await expect(control).toHaveAttribute('data-theme-mode','system');await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');await expect(control).toHaveAttribute('data-theme-mode','system');await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
    await page.evaluate(()=>window.xuiTheme.setMode('dark'));await page.reload();await expect(toggle(page)).toHaveAttribute('data-theme-mode','dark');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
    // Reduced motion uses the same public button contract.
    const motion=await toggle(page).evaluate(node=>getComputedStyle(node).transitionDuration);expect(motion.split(',').every(value=>parseFloat(value)<=0.01)).toBe(true);
    await page.emulateMedia({reducedMotion:'no-preference'});expect(await toggle(page).evaluate(node=>getComputedStyle(node).transitionDuration.split(',').some(value=>parseFloat(value)>0))).toBe(true);await toggle(page).focus();await page.keyboard.press('Enter');await expect(toggle(page)).toBeFocused();
    const path=info.outputPath('default-header.png');await page.screenshot({path});await info.attach('default-header.png',{path,contentType:'image/png'});
  });
  test(`${kind} Precision default stays dark on OS light and saved preferences win`,async({page})=>{
    await setup(page,kind);const control=toggle(page),root=page.locator('html');
    await expect(control).toHaveAttribute('data-theme-mode','dark');await expect(root).toHaveAttribute('data-theme','dark');await expect(root).toHaveAttribute('data-theme-effective','dark');
    await control.click();await expect(control).toHaveAttribute('data-theme-mode','system');await expect(root).toHaveAttribute('data-theme-effective','light');
    await control.click();await expect(control).toHaveAttribute('data-theme-mode','light');await expect(root).toHaveAttribute('data-theme-effective','light');
    await control.click();await expect(control).toHaveAttribute('data-theme-mode','dark');await expect(root).toHaveAttribute('data-theme-effective','dark');
    await page.evaluate(()=>sessionStorage.setItem('ui.theme.mode','light'));await page.reload();await expect(toggle(page)).toHaveAttribute('data-theme-mode','light');await expect(root).toHaveAttribute('data-theme-effective','light');
    await page.evaluate(()=>sessionStorage.setItem('ui.theme.mode','system'));await page.reload();await expect(toggle(page)).toHaveAttribute('data-theme-mode','system');await expect(root).toHaveAttribute('data-theme-effective','light');
    await page.emulateMedia({colorScheme:'dark'});await expect(root).toHaveAttribute('data-theme-effective','dark');await expect(toggle(page)).toHaveAttribute('data-theme-mode','system');
  });
  test(`${kind} controlled theme and locale report requests only until host sync`,async({page})=>{
    await setup(page,kind,'?controlled&locale');await expect(toggle(page)).toHaveAttribute('data-theme-mode','light');await toggle(page).click();expect(await page.evaluate(()=>window.themeRequests)).toEqual(['dark']);await expect(toggle(page)).toHaveAttribute('data-theme-mode','light');expect(await page.evaluate(()=>sessionStorage.getItem('ui.theme.mode'))).toBeNull();
    await page.evaluate(()=>window.headerDemo.syncTheme('dark'));await expect(toggle(page)).toHaveAttribute('data-theme-mode','dark');const select=page.getByRole('combobox',{name:'语言',exact:true});await select.click();await page.getByRole('option',{name:'English',exact:true}).click();expect(await page.evaluate(()=>window.headerDemo.getRequests())).toEqual(['en']);await expect(select).toHaveText('简体中文');await page.evaluate(()=>window.headerDemo.setValue('en'));await expect(select).toHaveText('English');
    await select.focus();await page.evaluate(()=>window.headerDemo.localize());await expect(page.getByRole('combobox',{name:'Language',exact:true})).toBeFocused();await expect(toggle(page)).toHaveAccessibleName('Dark. Follow system');await expect(toggle(page)).toHaveAttribute('title','Follow system');
  });
  test(`${kind} locale enablement and auxiliary updates preserve input, identity and callback count`,async({page})=>{
    await setup(page,kind,'?slots');await expect(page.locator('.xui-header-locale')).toHaveCount(0);const extension=page.getByRole('button',{name:'扩展操作',exact:true});await extension.focus();await page.evaluate(()=>{window.extension=document.querySelector('.xui-app-header-auxiliary button');window.headerDemo.update();window.headerDemo.update();});await expect(extension).toBeFocused();expect(await extension.evaluate(node=>node===window.extension)).toBe(true);await extension.click();await expect(page.getByTestId('count')).toHaveText('1');
    await page.evaluate(()=>window.headerDemo.setEnabled(true));const select=page.getByRole('combobox',{name:'语言',exact:true});await select.click();await page.getByRole('option',{name:'English',exact:true}).click();await expect(select).toHaveText('English');expect(await page.evaluate(()=>window.headerDemo.getRequests())).toEqual(['en']);await select.focus();await page.evaluate(()=>{window.localeNode=document.querySelector('.xui-header-locale');window.headerDemo.update();});await expect(select).toBeFocused();expect(await select.evaluate(node=>node===window.localeNode)).toBe(true);
    await page.evaluate(()=>window.headerDemo.setDisabled(true));await expect(select).toBeDisabled();await select.evaluate(node=>{node.value='zh-CN';node.dispatchEvent(new Event('change',{bubbles:true}));});expect(await page.evaluate(()=>window.headerDemo.getRequests())).toEqual(['en']);await page.evaluate(()=>window.headerDemo.setDisabled(false));await select.focus();
    await page.evaluate(()=>window.headerDemo.setEnabled(false));await expect(page.locator('.xui-header-locale')).toHaveCount(0);await expect(toggle(page)).toBeFocused();await expect(extension).toBeVisible();
  });
  test(`${kind} semantic slots preserve content and sidebar identity across updates and responsive drawer`,async({page},info)=>{
    await setup(page,kind,'?slots&locale');const draft=page.getByRole('textbox',{name:'正文草稿',exact:true});await draft.fill('正在编辑的正文');await page.getByRole('textbox',{name:'全局搜索',exact:true}).fill('搜索草稿');await page.getByRole('textbox',{name:'页面过滤',exact:true}).fill('过滤草稿');
    await page.evaluate(()=>{window.nodes={sidebar:document.querySelector('.xui-shell-sidebar'),menu:document.querySelector('.xui-navigation-menu'),content:document.querySelector('.xui-shell-content'),header:document.querySelector('.xui-shell-page-header'),toolbar:document.querySelector('.xui-shell-page-toolbar'),footer:document.querySelector('.xui-shell-page-footer')};});await draft.focus();await page.evaluate(()=>{window.headerDemo.navigate();window.headerDemo.update();});await expect(draft).toBeFocused();await expect(draft).toHaveValue('正在编辑的正文');await expect(page.getByRole('textbox',{name:'页面过滤',exact:true})).toHaveValue('过滤草稿');
    expect(await page.evaluate(()=>Object.entries(window.nodes).every(([name,node])=>node===document.querySelector({sidebar:'.xui-shell-sidebar',menu:'.xui-navigation-menu',content:'.xui-shell-content',header:'.xui-shell-page-header',toolbar:'.xui-shell-page-toolbar',footer:'.xui-shell-page-footer'}[name])))).toBe(true);
    await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'工作导航',exact:true}).click();await expect(page.getByRole('button',{name:'当前工作区与项目',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'返回工作空间',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.querySelector('.xui-shell-sidebar')===window.nodes.sidebar&&document.querySelector('.xui-navigation-menu')===window.nodes.menu)).toBe(true);await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'工作导航',exact:true})).toBeFocused();
    await page.setViewportSize({width:1280,height:800});await page.evaluate(()=>window.headerDemo.setSlots(false));await expect(page.locator('.xui-shell-page-toolbar:visible')).toHaveCount(0);await expect(draft).toHaveValue('正在编辑的正文');expect(await page.evaluate(()=>document.querySelector('.xui-navigation-menu')===window.nodes.menu)).toBe(true);
    await page.evaluate(()=>{window.headerDemo.setSidebarVisible(false);window.headerDemo.setSlots(true);});expect(await page.evaluate(()=>document.querySelector('.xui-navigation-menu')===window.nodes.menu)).toBe(true);await page.evaluate(()=>window.headerDemo.setSidebarVisible(true));expect(await page.evaluate(()=>document.querySelector('.xui-navigation-menu')===window.nodes.menu)).toBe(true);await expect(page.getByRole('button',{name:'页面操作',exact:true})).toBeVisible();const path=info.outputPath('semantic-slots.png');await page.screenshot({path});await info.attach('semantic-slots.png',{path,contentType:'image/png'});
  });
  test(`${kind} removing layout views does not destroy the shared theme owner`,async({page})=>{
    await setup(page,kind,'?slots&locale');await page.evaluate(()=>{window.savedTheme=window.xuiTheme;window.headerDemo.destroy();});await expect(toggle(page)).toHaveCount(0);expect(await page.evaluate(()=>!window.savedTheme.isDestroyed()&&window.savedTheme===window.xuiTheme)).toBe(true);await page.evaluate(()=>window.xuiTheme.setMode('dark'));await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
  });
  test(`${kind} 200 percent narrow slots remain bounded and preserve reachable menu and footer`,async({page})=>{
    await setup(page,kind,'?slots&locale');await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.documentElement.style.fontSize='200%');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await expect(toggle(page)).toBeVisible();await page.getByRole('button',{name:'工作导航',exact:true}).click();const menu=page.locator('.xui-shell-sidebar-menu');expect(await menu.evaluate(node=>node.clientHeight)).toBeGreaterThan(0);const last=page.locator('[data-menu-id="row-59"][data-menu-control="primary"]');await last.focus();await expect(last).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'返回工作空间',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'工作导航',exact:true})).toBeFocused();
  });
}

for(const kind of ['react'])test(`${kind} compact sidebar header and footer retain symmetric icon bounds`,async({page})=>{
  await setup(page,kind,'?slots&locale');
  await page.getByRole('button',{name:'收起导航',exact:true}).click();
  await expect(page.locator('.xui-menu-layout')).toHaveAttribute('data-collapsed','true');
  const rail=await page.locator('.xui-shell-sidebar').boundingBox();expect(rail.width).toBeCloseTo(60,1);
  for(const name of ['当前工作区与项目','返回工作空间']){
    const button=page.getByRole('button',{name,exact:true}),box=await button.boundingBox(),icon=await button.locator('.xui-sidebar-footer-icon').boundingBox();
    expect(box.width).toBeCloseTo(36,1);expect(box.x-rail.x).toBeCloseTo(12,1);expect(rail.x+rail.width-box.x-box.width).toBeCloseTo(12,1);
    expect(icon.x).toBeGreaterThanOrEqual(box.x);expect(icon.x+icon.width).toBeLessThanOrEqual(box.x+box.width);
    expect(await button.evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);
  }
});

for(const kind of ['react'])test(`${kind} locale option backgrounds retain shared spacing in themes and narrow windows`,async({page},info)=>{
  await setup(page,kind,'?locale');
  for(const mode of ['light','dark','system'])for(const width of [1280,390]){
    await page.setViewportSize({width,height:844});await page.evaluate(mode=>window.xuiTheme.setMode(mode),mode);
    const trigger=page.getByRole('combobox',{name:'语言',exact:true});await trigger.click();
    await expect(trigger).toHaveAttribute('aria-controls',/\S+/);const popup=page.locator(`[id=${JSON.stringify(await trigger.getAttribute('aria-controls'))}]`);await expect(popup).toBeVisible();
    await popup.getByRole('option',{name:'English',exact:true}).hover();await expectOptionSpacing(popup.getByRole('option'));
    await info.attach(`${kind}-${mode}-${width}-locale-spacing`,{body:await popup.screenshot({animations:'disabled'}),contentType:'image/png'});
    await page.keyboard.press('Escape');await expect(popup).toBeHidden();await expect(trigger).toBeFocused();
  }
});
