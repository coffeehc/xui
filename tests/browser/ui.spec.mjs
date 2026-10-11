import { test, expect } from '@playwright/test';
const pageErrors = new WeakMap();
test.beforeEach(({page})=>{ const errors=[];pageErrors.set(page,errors);page.on('pageerror',error=>errors.push(error.message)); });
test.afterEach(({page})=>{ expect(pageErrors.get(page)).toEqual([]); });

for (const kind of ['vanilla','react']) {
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
    const theme=page.getByLabel('外观');await theme.selectOption('dark');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
    const initial=await page.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--action-primary').trim());
    await page.getByLabel('主题配方').selectOption('example');
    expect(await page.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--action-primary').trim())).not.toBe(initial);
    await theme.selectOption('system');await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
    await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
    await theme.selectOption('light');await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
    await expect(page.getByLabel('名称')).toHaveValue('很长的中文工作空间名称'.repeat(15));
    expect(await page.evaluate(()=>localStorage.getItem('ui.theme.mode'))).toBe('light');
    await page.reload();await expect(theme).toHaveValue('light');
  });
  test(`${kind}: storage and matchMedia failures use a visible safe fallback`,async({page})=>{
    await page.emulateMedia({colorScheme:'dark'});
    await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('Denied');}});const original=window.matchMedia.bind(window);window.matchMedia=query=>{if(query === '(prefers-color-scheme: dark)') throw Error('Unavailable');return original(query);};});
    await page.goto(`/${kind}/`);await expect(page.getByLabel('外观')).toHaveValue('system');await expect(page.locator('html')).toHaveAttribute('data-theme','light');
    await page.getByLabel('外观').selectOption('dark');await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
    await page.getByRole('button',{name:'保存偏好',exact:true}).click();await expect(page.getByText('偏好已保存在示例内存中。')).toBeVisible();
    await page.reload();await expect(page.getByLabel('外观')).toHaveValue('system');
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
    const before=await item.boundingBox();await item.hover();
    const selected=await item.evaluate(el=>({background:getComputedStyle(el).backgroundColor,indicator:getComputedStyle(el,'::before').opacity,border:getComputedStyle(el).borderWidth,padding:getComputedStyle(el).paddingLeft}));
    expect(selected.indicator).toBe('1');expect(selected.border).toBe('0px');
    await other.hover();expect(await other.evaluate(el=>getComputedStyle(el,'::before').opacity)).toBe('0');
    await item.focus();await expect(item).toBeFocused();expect(await item.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
    await other.focus();expect(await item.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('solid');
    expect(await item.boundingBox()).toEqual(before);
    await other.click();await expect(other).toHaveAttribute('aria-current','page');await other.hover();await expect.poll(()=>other.evaluate(el=>getComputedStyle(el,'::before').opacity)).toBe('1');
  });
  test(`${kind}: wide/narrow, long Chinese, reduced motion and zoom access`,async({page},testInfo)=>{
    for (const viewport of [{width:1280,height:800},{width:390,height:844}]) for (const mode of ['light','dark']) {
      await page.setViewportSize(viewport);await page.goto(`/${kind}/`);await page.getByLabel('外观').selectOption(mode);
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
