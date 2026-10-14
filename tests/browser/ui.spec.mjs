import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { chooseSelect, expectSelectValue } from './select-interaction.mjs';

async function navigationState(item) {
  return item.evaluate(el=>{
    const style=getComputedStyle(el),indicator=getComputedStyle(el,'::before'),icon=el.querySelector('svg'),bounds=el.getBoundingClientRect();
    return {background:style.backgroundColor,color:style.color,icon:icon ? {color:getComputedStyle(icon).color,fill:getComputedStyle(icon).fill,stroke:getComputedStyle(icon).stroke} : null,
      indicator:{opacity:indicator.opacity,color:indicator.backgroundColor,width:indicator.width,height:indicator.height},
      border:style.borderWidth,padding:style.padding,rect:{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height}};
  });
}
async function navigationTokens(page,state) {
  return page.locator('#token-probe').evaluate((el,state)=>{
    el.style.backgroundColor=`var(--menu-item-${state === 'default' ? '' : state+'-'}background)`;
    el.style.color=`var(--menu-item-${state === 'default' ? '' : state+'-'}foreground)`;
    const style=getComputedStyle(el);return {background:style.backgroundColor,color:style.color};
  },state);
}

const pageErrors = new WeakMap();
test.beforeEach(({page})=>{ const errors=[];pageErrors.set(page,errors);page.on('pageerror',error=>errors.push(error.message)); });
test.afterEach(({page})=>{ expect(pageErrors.get(page)).toEqual([]); });

// Use formal exports from the fresh standalone tarball install. Comparing both
// installed and built CSS to source prevents a stale consumer masking this bug.
for (const entry of ['navigation','style']) for (const mode of ['light','dark']) {
  test(`${entry}.css: ${mode} navigation selected hover, disabled and keyboard focus`,async({page})=>{
    const {runDirectory}=JSON.parse(await readFile('.consumers/latest.json','utf8'));
    const require=createRequire(resolve(runDirectory,'vanilla/package.json'));
    const names=entry === 'navigation' ? ['tokens','base','navigation'] : ['style'];
    const sourceNavigation=await readFile('packages/theme/src/navigation.css','utf8');
    const builtNavigation=await readFile('packages/theme/dist/navigation.css','utf8');
    expect(builtNavigation).toBe(sourceNavigation);
    const css=await Promise.all(names.map(async name=>{
      const installed=await readFile(require.resolve(`@coffeehc/xui-theme/${name}.css`),'utf8');
      expect(installed).toBe(await readFile(`packages/theme/dist/${name}.css`,'utf8'));
      if(name === 'navigation' || name === 'style') expect(installed).toContain(sourceNavigation);
      return installed;
    }));
    const icon='<svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor"><path d="M2 2h16v16H2z"/></svg>';
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.setContent(`<html data-theme="${mode}"><head><style>${css.join('\n')}</style></head><body class="xui">
      <nav class="xui-nav"><a id="selected" href="#selected" class="xui-nav-item" aria-current="page">菜单${icon}</a>
      <a id="ordinary" href="#ordinary" class="xui-nav-item">普通菜单${icon}</a>
      <a id="step" href="#step" class="xui-nav-item" aria-current="step">当前步骤${icon}</a>
      <a id="current" href="#current" class="xui-nav-item" aria-current="true">当前链接${icon}</a>
      <button id="disabled" class="xui-nav-item" disabled>不可用${icon}</button>
      <button id="disabled-selected" class="xui-nav-item" disabled aria-current="page">选中不可用${icon}</button>
      <a id="aria-disabled" href="#disabled" class="xui-nav-item" aria-disabled="true">不可用链接${icon}</a>
      <a id="aria-disabled-selected" href="#disabled" class="xui-nav-item" aria-disabled="true" aria-current="page">选中不可用链接${icon}</a></nav>
      <span id="token-probe" hidden></span></body></html>`);
    const selected=page.locator('#selected'),ordinary=page.locator('#ordinary');
    const selectedTokens=await navigationTokens(page,'selected'),defaultTokens=await navigationTokens(page,'default'),hoverTokens=await navigationTokens(page,'hover');
    await page.mouse.move(1200,700);
    const before=await navigationState(selected);
    expect(before).toMatchObject({...selectedTokens,icon:{color:selectedTokens.color,fill:selectedTokens.color,stroke:selectedTokens.color},indicator:{opacity:'1'},border:'0px'});
    expect(before.background).not.toBe(hoverTokens.background);expect(before.color).not.toBe(hoverTokens.color);
    await selected.hover();expect(await navigationState(selected)).toEqual(before);
    await ordinary.hover();expect(await navigationState(selected)).toEqual(before);
    for(const id of ['ordinary','step','current']) {
      const item=page.locator('#'+id);await page.mouse.move(1200,700);
      const normal=await navigationState(item);expect(normal).toMatchObject({...defaultTokens,indicator:{opacity:'0'},border:'0px'});
      await item.hover();const hovered=await navigationState(item);
      expect(hovered).toMatchObject({...hoverTokens,icon:{color:hoverTokens.color,fill:hoverTokens.color,stroke:hoverTokens.color},indicator:{opacity:'0'}});
      expect(hovered.rect).toEqual(normal.rect);expect(hovered.border).toBe(normal.border);expect(hovered.padding).toBe(normal.padding);
    }
    const disabledColor=await page.locator('#token-probe').evaluate(el=>{el.style.color='var(--menu-item-disabled-foreground)';return getComputedStyle(el).color;});
    for(const id of ['disabled','disabled-selected','aria-disabled','aria-disabled-selected']) {
      const item=page.locator('#'+id);await page.mouse.move(1200,700);
      const disabled=await navigationState(item);
      expect(disabled).toMatchObject({background:id.endsWith('-selected') ? selectedTokens.background : defaultTokens.background,color:disabledColor,
        icon:{color:disabledColor,fill:disabledColor,stroke:disabledColor},indicator:{opacity:id.endsWith('-selected') ? '1' : '0'},border:'0px'});
      expect(await item.evaluate(el=>getComputedStyle(el).cursor)).toBe('not-allowed');
      await item.hover();expect(await navigationState(item)).toEqual(disabled);
    }
    await page.mouse.move(1200,700);await page.keyboard.press('Tab');await expect(selected).toBeFocused();
    expect(await selected.evaluate(el=>el.matches(':focus-visible'))).toBe(true);
    expect(await selected.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
    expect(await navigationState(selected)).toEqual(before);
    await selected.hover();expect(await navigationState(selected)).toEqual(before);
    await page.keyboard.press('Tab');await expect(ordinary).toBeFocused();
    expect(await selected.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('solid');
    expect(await ordinary.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
    expect(await navigationState(ordinary)).toMatchObject({...defaultTokens,indicator:{opacity:'0'},border:'0px'});
  });
}

for (const kind of ['vanilla','react']) {
  test(`${kind}: an unset theme starts dark on a light OS and persisted light/system choices remain respected`,async({page})=>{
    await page.emulateMedia({colorScheme:'light'});
    await page.goto(`/${kind}/`);
    const theme=page.getByRole('combobox',{name:'外观',exact:true});
    await expectSelectValue(page,theme,'dark','深色');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
    await chooseSelect(page,theme,'light','浅色');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');await page.reload();await expectSelectValue(page,'外观','light','浅色');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
    await chooseSelect(page,'外观','system','跟随系统');await expect(page.locator('html')).toHaveAttribute('data-theme','system');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');await page.reload();await expectSelectValue(page,'外观','system','跟随系统');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
    await chooseSelect(page,'外观','dark','深色');await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');await page.reload();await expectSelectValue(page,'外观','dark','深色');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
  });
  if(kind==='vanilla')test('vanilla example synthetic persisted pagehide preserves both public select owners',async({page})=>{
    await page.goto('/vanilla/');
    const theme=page.getByRole('combobox',{name:'外观',exact:true}),brand=page.getByRole('combobox',{name:'主题配方',exact:true});
    await expect(theme).toBeVisible();await expect(brand).toBeVisible();await expect(page.getByRole('combobox')).toHaveCount(2);
    await page.evaluate(()=>{window.persistedSelectTriggers=[...document.querySelectorAll('button[role="combobox"]')];window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
    expect(await page.evaluate(()=>window.persistedSelectTriggers.length===2&&window.persistedSelectTriggers.every((node,index)=>node.isConnected&&node===document.querySelectorAll('button[role="combobox"]')[index]))).toBe(true);
    await page.evaluate(()=>window.xuiTheme.setMode('light'));await expectSelectValue(page,theme,'light','浅色');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
    await chooseSelect(page,'主题配方','example','蓝色覆盖');await expect(brand).toHaveText('蓝色覆盖');await expect(page.locator('html')).toHaveAttribute('data-product','example');
    await chooseSelect(page,'外观','dark','深色');await expectSelectValue(page,theme,'dark','深色');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
  });
  test(`${kind}: modes, first paint, persistence, system changes, override and retained draft`,async({page})=>{
    await page.emulateMedia({colorScheme:'dark'});
    await page.addInitScript(()=>localStorage.setItem('ui.theme.mode','light'));
    // Observe immediately after the blocking initializer, before stylesheet/body.
    await page.route(`**/${kind}/`,async route=>{
      const response=await route.fetch();const html=await response.text();
      await route.fulfill({response,body:html.replace('</script>','</script><script>window.prePaintTheme={...document.documentElement.dataset,bodyExists:!!document.body};</script>')});
    });
    await page.goto(`/${kind}/`);await expect(page.getByRole('heading',{name:'工作偏好'})).toBeVisible();
    expect(await page.evaluate(()=>window.prePaintTheme)).toMatchObject({theme:'light',themeEffective:'light',bodyExists:false});
    await page.unroute(`**/${kind}/`);
    await page.getByLabel('名称').fill('很长的中文工作空间名称'.repeat(15));
    const theme=page.getByRole('combobox',{name:'外观',exact:true});await chooseSelect(page,theme,'dark','深色');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
    const initial=await page.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--action-primary').trim());
    await chooseSelect(page,'主题配方','example','蓝色覆盖');
    expect(await page.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--action-primary').trim())).not.toBe(initial);
    await chooseSelect(page,theme,'system','跟随系统');await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
    await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
    await chooseSelect(page,theme,'light','浅色');await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
    await expect(page.getByLabel('名称')).toHaveValue('很长的中文工作空间名称'.repeat(15));
    expect(await page.evaluate(()=>localStorage.getItem('ui.theme.mode'))).toBe('light');
    await page.reload();await expectSelectValue(page,theme,'light','浅色');
  });
  test(`${kind}: blocked storage defaults dark and explicit system keeps its safe fallback`,async({page})=>{
    await page.emulateMedia({colorScheme:'dark'});
    await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('Denied');}});const original=window.matchMedia.bind(window);window.matchMedia=query=>{if(query === '(prefers-color-scheme: dark)') throw Error('Unavailable');return original(query);};});
    await page.goto(`/${kind}/`);await expectSelectValue(page,'外观','dark','深色');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
    await chooseSelect(page,'外观','system','跟随系统');await expectSelectValue(page,'外观','system','跟随系统');await expect(page.locator('html')).toHaveAttribute('data-theme','light');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
    await chooseSelect(page,'外观','dark','深色');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
    await page.getByRole('button',{name:'保存偏好',exact:true}).click();await expect(page.getByText('偏好已保存在示例内存中。')).toBeVisible();
    await page.reload();await expectSelectValue(page,'外观','dark','深色');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
  });
  test(`${kind}: native input, keyboard/touch states, invalid focus, disabled and dialog lifecycle`,async({page})=>{
    await page.goto(`/${kind}/`);
    const input=page.getByLabel('名称');await input.fill('');await page.getByRole('button',{name:'保存偏好',exact:true}).click();
    await expect(input).toHaveAttribute('aria-invalid','true');await expect(input).toBeFocused();await expect(page.getByText('请填写名称，草稿未保存。')).toBeVisible();
    const described=await input.getAttribute('aria-describedby');expect(described).toBeTruthy();
    await input.fill('新名称');await page.getByRole('button',{name:'保存偏好',exact:true}).focus();await page.keyboard.down('Space');
    await expect(page.getByRole('button',{name:'保存偏好',exact:true})).toHaveAttribute('data-pressed','true');await page.keyboard.up('Space');
    await expect(page.getByText('偏好已保存在示例内存中。')).toBeVisible();
    const checkbox=page.getByLabel('允许提醒');await checkbox.focus();await page.keyboard.press('Space');await expect(checkbox).not.toBeChecked();
    const toggle=page.getByRole('switch',{name:'自动整理'});await toggle.focus();await page.keyboard.press('Space');await expect(toggle).toBeChecked();
    const radio=page.getByRole('radio',{name:'站内',exact:true});await radio.focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('radio',{name:'邮件',exact:true})).toBeChecked();
    await expect(page.getByRole('button',{name:'等待同步'})).toBeDisabled();
    const trigger=page.getByRole('button',{name:'使用说明',exact:true});await trigger.focus();await page.keyboard.press('Enter');
    const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog).toHaveAccessibleName('使用说明');
    const bounds=await dialog.boundingBox();expect(bounds.height).toBeLessThanOrEqual(768);
    const cancel=page.getByRole('button',{name:'取消',exact:true});await expect(cancel).toBeInViewport();
    await cancel.focus();await page.keyboard.press('Tab');await expect.poll(()=>page.evaluate(()=>document.activeElement.closest('[role="dialog"],dialog') !== null)).toBe(true);
    await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
    await trigger.click();await cancel.click();await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
    await expect(input).toHaveValue('新名称');
    await page.getByRole('textbox',{name:'备注',exact:true}).fill('保留备注');await page.getByRole('button',{name:'清空备注'}).click();await expect(page.getByRole('textbox',{name:'备注',exact:true})).toHaveValue('');
  });
  test(`${kind}: selected navigation, independent focus and stable positioning`,async({page})=>{
    await page.goto(`/${kind}/`);const item=page.getByRole('link',{name:'偏好',exact:true});const other=page.getByRole('link',{name:'详情',exact:true});
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const mode of ['light','dark']) {
      await chooseSelect(page,'外观',mode,mode==='light'?'浅色':'深色');await page.mouse.move(1200,700);
      const beforeHover=await navigationState(item);await item.hover();
      expect(await navigationState(item)).toEqual(beforeHover);
    }
    const before=await item.boundingBox();
    const selected=await navigationState(item);
    expect(selected.indicator.opacity).toBe('1');expect(selected.border).toBe('0px');
    await other.hover();expect(await other.evaluate(el=>getComputedStyle(el,'::before').opacity)).toBe('0');
    await page.keyboard.press('Tab');await item.focus();await expect(item).toBeFocused();expect(await item.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
    await other.focus();expect(await item.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('solid');
    expect(await item.boundingBox()).toEqual(before);
    await other.click();await expect(other).toHaveAttribute('aria-current','page');await other.hover();await expect.poll(()=>other.evaluate(el=>getComputedStyle(el,'::before').opacity)).toBe('1');
  });
  test(`${kind}: wide/narrow, long Chinese, reduced motion and zoom access`,async({page},testInfo)=>{
    for (const viewport of [{width:1280,height:800},{width:390,height:844}]) for (const mode of ['light','dark']) {
      await page.setViewportSize(viewport);await page.goto(`/${kind}/`);await chooseSelect(page,'外观',mode,mode==='light'?'浅色':'深色');
      const save=page.getByRole('button',{name:'保存偏好',exact:true});const title=page.getByRole('heading',{name:'工作偏好'});
      await expect(title).toBeInViewport();await expect(save).toBeInViewport();await expect(page.getByLabel('名称')).toBeInViewport();
      const box=await save.boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({path:testInfo.outputPath(`${kind}-${viewport.width}-${mode}-first-viewport.png`)});
      await save.click();await expect(page.getByText('偏好已保存在示例内存中。')).toBeVisible();
      await page.screenshot({path:testInfo.outputPath(`${kind}-${viewport.width}-${mode}.png`),fullPage:true});
    }
    await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('switch',{name:'自动整理'}).check();
    expect(await page.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--motion-duration').trim())).toBe('0ms');
    expect(await page.getByRole('switch').evaluate(el=>getComputedStyle(el,'::before').transitionDuration)).toBe('0s, 0s');
    await page.getByRole('button',{name:'使用说明',exact:true}).click();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'使用说明',exact:true})).toBeFocused();
    await page.locator('html').evaluate(el=>{el.style.fontSize='200%';});
    await page.getByLabel('名称').fill('非常长的中文名称'.repeat(40));
    await page.getByRole('button',{name:'保存偏好',exact:true}).click();await expect(page.getByText('偏好已保存在示例内存中。')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`${kind}-200-percent-text.png`),fullPage:true});
  });
}
test('React tabs skip disabled item, connect panel and preserve native readOnly',async({page})=>{
  await page.goto('/react/');const note=page.getByRole('tab',{name:'备注',exact:true});await note.focus();await page.keyboard.press('ArrowRight');
  const identity=page.getByRole('tab',{name:'标识',exact:true});await expect(identity).toBeFocused();await expect(identity).toHaveAttribute('aria-selected','false');await page.keyboard.press('Enter');await expect(identity).toHaveAttribute('aria-selected','true');
  await expect(page.getByRole('tabpanel',{name:'标识',exact:true})).toBeVisible();await expect(page.getByRole('tabpanel',{name:'备注',exact:true})).not.toBeVisible();await expect(page.getByLabel('只读标识')).toHaveAttribute('readonly','');
  const current=page.getByText('不可用入口', {exact:true});await expect(current).toHaveAttribute('aria-disabled','true');await expect(current).toHaveAttribute('aria-current','page');
  await identity.focus();await page.keyboard.press('ArrowRight');await expect(note).toBeFocused();
  await page.keyboard.press('End');await expect(identity).toBeFocused();await page.keyboard.press('Home');await expect(note).toBeFocused();
  await page.locator('html').evaluate(el=>{el.dir='rtl';});await page.keyboard.press('ArrowLeft');await expect(identity).toBeFocused();
  await page.keyboard.press('ArrowLeft');await expect(note).toBeFocused();
});
