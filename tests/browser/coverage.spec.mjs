import { test, expect } from '@playwright/test';

for (const kind of ['vanilla','react']) {
  test(`${kind}: persisted initial modes and unknown preference`,async({browser})=>{
    for (const mode of ['light','dark','system','unknown']) {
      const context=await browser.newContext({colorScheme:'dark'});const page=await context.newPage();
      await page.addInitScript(value=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('ui.theme.mode',value);sessionStorage.setItem('seeded','true');}},mode);
      await page.goto(`http://127.0.0.1:4173/${kind}/`);
      await expect(page.getByLabel('外观')).toHaveValue(mode === 'unknown' ? 'system' : mode);
      await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode === 'light' ? 'light' : 'dark');
      await page.getByLabel('外观').selectOption('dark');await page.reload();await expect(page.getByLabel('外观')).toHaveValue('dark');
      await page.getByLabel('外观').selectOption('system');await page.reload();await expect(page.getByLabel('外观')).toHaveValue('system');
      await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
      await context.close();
    }
  });
  test(`${kind}: touch targets, narrow dialog, repeated cancellation and reduced fallback`,async({browser},testInfo)=>{
    const context=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844},colorScheme:'dark'});const page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(`http://127.0.0.1:4173/${kind}/`);
    const checkbox=page.getByLabel('允许提醒');await page.getByText('允许提醒',{exact:true}).tap();await expect(checkbox).not.toBeChecked();
    await page.getByText('自动整理',{exact:true}).tap();await expect(page.getByRole('switch')).toBeChecked();
    await page.getByRole('button',{name:'保存偏好',exact:true}).tap();await expect(page.getByText('偏好已保存在示例内存中。')).toBeVisible();
    const help=page.getByRole('button',{name:'使用说明',exact:true});
    for (let i=0;i<3;i++) {
      await help.tap();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
      const box=await dialog.boundingBox();expect(box.x).toBeGreaterThanOrEqual(15);expect(box.x+box.width).toBeLessThanOrEqual(375);expect(box.y+box.height).toBeLessThanOrEqual(829);
      const cancel=page.getByRole('button',{name:'取消',exact:true});await expect(cancel).toBeInViewport();
      await dialog.locator('.xui-dialog-body').evaluate(el=>{el.scrollTop=el.scrollHeight;});await expect(cancel).toBeInViewport();
      if(i===0) await page.screenshot({path:testInfo.outputPath(`${kind}-touch-narrow-dialog.png`)});
      await cancel.tap();await expect(dialog).not.toBeVisible();await expect(help).toBeFocused();
    }
    await page.emulateMedia({reducedMotion:'reduce'});await help.tap();await page.getByRole('button',{name:'取消',exact:true}).tap();await expect(help).toBeFocused();
    await page.emulateMedia({forcedColors:'active'});await page.getByText('允许提醒',{exact:true}).tap();await expect(checkbox).toBeChecked();expect(await checkbox.evaluate(el=>getComputedStyle(el).appearance)).toBe('auto');
    expect(errors).toEqual([]);await context.close();
  });
  test(`${kind}: semantic color contrast and product override in all modes`,async({page},testInfo)=>{
    await page.goto(`/${kind}/`);const results=[];
    for (const product of ['default','example']) for (const mode of ['light','dark','system']) {
      await page.getByLabel('主题配方').selectOption(product);await page.getByLabel('外观').selectOption(mode);await page.emulateMedia({colorScheme:mode === 'system' ? 'dark' : mode});
      // Wait for the actual CSS transition, then calculate rendered sRGB pairs.
      await page.locator('.xui-button').first().evaluate(async el=>{await Promise.all(el.getAnimations().map(animation=>animation.finished.catch(()=>{})));});
      const ratios=await page.evaluate(()=>{
        const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d',{willReadFrequently:true});
        const sample=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3);};
        const luminance=rgb=>rgb.map(channel=>{const value=channel/255;return value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4;}).reduce((total,value,index)=>total+value*[.2126,.7152,.0722][index],0);
        const contrast=(a,b)=>{const first=luminance(sample(a)),second=luminance(sample(b));return (Math.max(first,second)+.05)/(Math.min(first,second)+.05);};
        const vars=getComputedStyle(document.documentElement),v=name=>vars.getPropertyValue(`--${name}`).trim();
        const button=getComputedStyle(document.querySelector('.xui-button'));
        // Token colors are resolved by the browser on a temporary local node.
        const probe=document.createElement('span');document.body.append(probe);const resolved=name=>{probe.style.color=`var(--${name})`;return getComputedStyle(probe).color;};
        const pairs={body:contrast(resolved('foreground'),resolved('layer-canvas')),muted:contrast(resolved('muted-foreground'),resolved('layer-raised')),button:contrast(button.color,button.backgroundColor),inputBoundary:contrast(resolved('input-border-color'),resolved('input-background')),focus:contrast(resolved('interaction-focus'),resolved('layer-raised')),errorText:contrast(resolved('status-error-foreground'),resolved('layer-canvas')),errorBoundary:contrast(resolved('status-error-foreground'),resolved('input-background')),danger:contrast(resolved('action-danger'),resolved('action-danger-foreground')),selected:contrast(resolved('menu-item-selected-foreground'),resolved('menu-item-selected-background'))};
        for(const tone of ['info','warning','success','error']) pairs[`${tone}Text`]=contrast(resolved(`status-${tone}-foreground`),resolved(`status-${tone}-soft`));
        probe.remove();return pairs;
      });
      for(const [name,value] of Object.entries(ratios)) expect(value,`${product}/${mode}/${name}`).toBeGreaterThanOrEqual(['inputBoundary','focus','errorBoundary'].includes(name) ? 3 : 4.5);
      results.push({product,mode,ratios});
    }
    await testInfo.attach('contrast-results',{body:JSON.stringify(results,null,2),contentType:'application/json'});
  });
}
