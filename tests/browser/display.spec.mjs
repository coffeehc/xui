import {test,expect} from '@playwright/test';
// Preserve Chromium's sandbox even when the legacy workspace config overrides it.
test.use({launchOptions:{...(process.env.CI?{channel:'chrome'}:{executablePath:'/usr/bin/chromium'}),chromiumSandbox:true,args:[]}});
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><title>synthetic image</title><rect width="20" height="10" fill="currentColor"/></svg>';
for(const kind of ['react','vanilla']){
 test(`${kind}: native text/link semantics, explicit copy success/error and removal focus`,async({page})=>{
  await page.route('**/display-image-a.svg',route=>route.fulfill({contentType:'image/svg+xml',body:svg}));
  await page.goto(`/display-${kind}/`);
  await expect(page.getByRole('heading',{level:1})).toHaveText('文字、复制与媒体');
  await expect(page.locator('pre code')).toHaveText('<script>仅按文本显示</script>');
  await expect(page.locator('main script')).toHaveCount(0);
  const copy=page.getByRole('button',{name:'复制',exact:true});await copy.nth(0).focus();await page.keyboard.press('Enter');await expect(page.getByRole('status').nth(0)).toHaveText('已复制');await expect(copy.nth(0)).toBeFocused();expect(await page.evaluate(()=>window.copied)).toBe('explicit-id-中文-0123456789');
  await copy.nth(1).click();await expect(page.getByRole('status').nth(1)).toContainText('复制失败');
  await page.getByRole('button',{name:'移除标签 1',exact:true}).focus();await page.keyboard.press('Space');await expect(page.getByRole('button',{name:'移除标签 1',exact:true})).toHaveCount(0);await expect(page.getByRole('textbox',{name:'标签输入'})).toBeFocused();await expect(page.getByRole('button',{name:'禁用移除'})).toBeDisabled();
  await page.getByRole('link',{name:'查看详情'}).click();await expect(page).toHaveURL(/#details$/);
 });
 test(`${kind}: current image wins, failure reserves geometry and retry is explicit`,async({page})=>{
  let old;let requests=0;
  await page.route('**/display-image-a.svg',route=>{old=route;});
  await page.route('**/display-image-b.svg',route=>{requests++;return requests===1?route.fulfill({status:404,body:'missing'}):route.fulfill({contentType:'image/svg+xml',body:svg});});
  await page.goto(`/display-${kind}/`,{waitUntil:'domcontentloaded'});const frame=page.locator('.xui-image'),before=await frame.boundingBox();await expect.poll(()=>!!old).toBe(true);
  await page.getByRole('button',{name:'更换图片'}).click();await expect(page.getByRole('img',{name:'合成图片：图片无法加载',exact:true})).toBeVisible();await old?.fulfill({contentType:'image/svg+xml',body:svg}).catch(()=>{});
  await expect(page.getByRole('img',{name:'合成图片：图片无法加载',exact:true})).toBeVisible();expect(requests).toBe(1);const failed=await frame.boundingBox();expect(failed.height).toBeCloseTo(before.height,1);expect(failed.width).toBeCloseTo(before.width,1);
  await page.getByRole('button',{name:'重试图片'}).click();await expect(page.locator('img[alt="合成图片"]')).toBeVisible();expect(requests).toBe(2);const loaded=await frame.boundingBox();expect(loaded.height).toBeCloseTo(before.height,1);
 });
 for(const width of [1440,390,320])test(`${kind}: ${width}px theme/reduced-motion/forced-colors retain content`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.route('**/display-image-a.svg',route=>route.fulfill({contentType:'image/svg+xml',body:svg}));await page.goto(`/display-${kind}/`);
  for(const theme of ['light','dark']){await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await expect(page.getByRole('button',{name:'移除标签 2',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.evaluate(()=>delete document.documentElement.dataset.theme);await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce',forcedColors:'active'});await expect(page.getByRole('button',{name:'复制',exact:true}).first()).toBeVisible();await page.emulateMedia({colorScheme:'light'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}

test('React hydrates Node-rendered display without mismatches and binds copy intent',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/display-react/hydrate.html');await expect(page.getByRole('heading',{name:'Hydrated display'})).toBeVisible();await page.getByRole('button',{name:'复制',exact:true}).click();await expect(page.getByRole('status')).toHaveText('已复制');expect(await page.evaluate(()=>window.hydrationErrors)).toEqual([]);expect(errors).toEqual([]);
});
