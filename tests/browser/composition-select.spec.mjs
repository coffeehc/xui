import {expectOptionSpacing} from './option-spacing.mjs';
import {test,expect} from '@playwright/test';
for(const kind of ['react','vanilla'])for(const theme of ['light','dark','system'])for(const width of [1280,390]){
  test(`${kind} ${theme} ${width}: table page-size uses a themed keyboard popup`,async({page},info)=>{
    await page.setViewportSize({width,height:844});
    await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
    await page.addInitScript(mode=>localStorage.setItem('ui.theme.mode',mode),theme);
    await page.goto(`/data-table-${kind}/?size=20&internal`);
    await expect.poll(()=>page.evaluate(()=>window.dataTableDemo.owner.getState().status)).toBe('ready');
    const trigger=page.getByRole('combobox',{name:'每页条数',exact:true});
    await expect(trigger).toHaveJSProperty('tagName','BUTTON');await expect(page.locator('.xui-data-table-page-size select')).toBeHidden();expect(await trigger.locator('span').evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);
    await trigger.focus();await page.keyboard.press('ArrowDown');
    const id=await trigger.getAttribute('aria-controls'),popup=page.locator(`[id=${JSON.stringify(id)}]`);
    await expect(popup).toBeVisible();await expectOptionSpacing(popup.getByRole('option'));
    const measured=await popup.evaluate(element=>{const r=element.getBoundingClientRect(),s=getComputedStyle(element);return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight,background:s.backgroundColor,border:s.borderTopStyle,font:s.fontFamily};});
    expect(measured.left).toBeGreaterThanOrEqual(0);expect(measured.top).toBeGreaterThanOrEqual(0);
    expect(measured.right).toBeLessThanOrEqual(measured.width);expect(measured.bottom).toBeLessThanOrEqual(measured.height);
    expect(measured.border).toBe('solid');expect(measured.background).not.toBe('rgba(0, 0, 0, 0)');
    await info.attach('themed-page-size-popup',{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});
    await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
    await expect(popup).toBeHidden();
    await expect.poll(()=>page.evaluate(()=>window.dataTableDemo.owner.getState().pageSize)).toBe(50);
    await expect.poll(()=>page.evaluate(()=>window.dataTableDemo.owner.getState().status)).toBe('ready');
    await expect(trigger).toHaveText('50');
    await trigger.click();await expect(popup).toBeVisible();await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();await expect(trigger).toBeFocused();
  });
}
