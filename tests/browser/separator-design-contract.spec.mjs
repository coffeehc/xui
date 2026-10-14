import {test,expect} from '@playwright/test';

// Both pages are existing standalone npm-tarball consumers. The only CSS added
// by this test is the documented same-root semantic-token override layer.
for(const kind of ['react','vanilla'])for(const theme of ['light','dark','system'])test(`${kind} ${theme} Separator width is independent from Surface`,async({page},info)=>{
 await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);
 await page.route('**/display-image-*.svg',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><title>Synthetic fixture</title></svg>'}));
 await page.goto(`/display-${kind}/`);
 await expect(page.locator('html')).toHaveAttribute('data-theme-effective',theme==='system'?'dark':theme);
 const surface=page.getByRole('region',{name:'Separator contract',exact:true});
 const horizontal=surface.getByRole('separator',{name:'Horizontal separator',exact:true});
 const vertical=surface.getByRole('separator',{name:'Vertical separator',exact:true});
 await expect(surface).toBeVisible();
 await expect(horizontal).toHaveAttribute('aria-orientation','horizontal');
 await expect(vertical).toHaveAttribute('aria-orientation','vertical');
 async function check(width){
  await expect(horizontal).toHaveCSS('border-block-start-width',width);
  await expect(horizontal).toHaveCSS('border-inline-start-width','0px');
  await expect(vertical).toHaveCSS('border-inline-start-width',width);
  await expect(vertical).toHaveCSS('border-block-start-width','0px');
  for(const side of ['top','right','bottom','left'])await expect(surface).toHaveCSS(`border-${side}-width`,'1px');
  const [h,v]=await Promise.all([horizontal.boundingBox(),vertical.boundingBox()]);
  expect(h.width).toBeGreaterThan(0);expect(h.height).toBeCloseTo(parseFloat(width),2);
  expect(v.width).toBeCloseTo(parseFloat(width),2);expect(v.height).toBeGreaterThan(0);
 }
 await check('1px');
 await info.attach('separator-default',{body:await surface.screenshot(),contentType:'image/png'});
 const override=await page.addStyleTag({content:'@layer product-overrides { :root { --line-width-separator: 3px; --line-width-surface: 1px; } }'});
 await check('3px');
 await info.attach('separator-override',{body:await surface.screenshot(),contentType:'image/png'});
 await override.evaluate(node=>node.remove());
 await check('1px');
});
