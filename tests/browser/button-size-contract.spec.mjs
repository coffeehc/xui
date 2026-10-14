import {test,expect} from '@playwright/test';

// DESIGN Layout/Components give default xs/sm/default/lg heights 24/32/36/40.
// The typography contract permits natural growth for enlarged or wrapping text.
// Consequently only a short, single-line label at default scale is compared to
// the nominal height; the enlarged-text checks require content-driven growth.
// Current xs text buttons are expected to expose a 32px-versus-24px regression.
// Keep this strict: no test.fail(), skip(), fixed host height, or changed tokens.
const sizes={xs:{height:24,padding:8,gap:4,icon:12},sm:{height:32,padding:10,gap:6,icon:16},default:{height:36,padding:12,gap:6,icon:16},lg:{height:40,padding:16,gap:8,icon:16}};
const settle=page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
async function measure(control){return control.evaluate(node=>{
 const s=getComputedStyle(node),r=node.getBoundingClientRect(),svg=node.querySelector('svg'),icon=svg.getBoundingClientRect();
 return {height:r.height,width:r.width,minHeight:parseFloat(s.minHeight),lineHeight:parseFloat(s.lineHeight),fontSize:parseFloat(s.fontSize),padding:{top:parseFloat(s.paddingTop),bottom:parseFloat(s.paddingBottom),left:parseFloat(s.paddingLeft),right:parseFloat(s.paddingRight)},border:{top:parseFloat(s.borderTopWidth),bottom:parseFloat(s.borderBottomWidth)},gap:parseFloat(s.gap),icon:{width:icon.width,height:icon.height},clientHeight:node.clientHeight,scrollHeight:node.scrollHeight,rootFont:getComputedStyle(document.documentElement).fontSize};
});}
async function attach(page,info,name,values){await info.attach(`${name}.json`,{body:JSON.stringify(values,null,2),contentType:'application/json'});await info.attach(`${name}.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});}
for(const kind of ['react','vanilla'])for(const theme of ['light','dark','system'])for(const width of [1280,390])test(`${kind} ${theme} ${width}: default Button size geometry and natural enlarged-text growth`,async({page},info)=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);await page.goto(`/${kind}/button-state-contract.html`);
 await expect(page.getByRole('heading',{name:'Button sizes',exact:true})).toBeVisible();await settle(page);
 await expect(page.locator('html')).toHaveAttribute('data-theme-effective',theme==='system'?'dark':theme);
 const normal=[];
 for(const [size,expected]of Object.entries(sizes)){
  const text=await measure(page.getByTestId(`size-${size}-text`)),icon=await measure(page.getByTestId(`size-${size}-icon`));normal.push({size,expected,text,icon});
  expect.soft(text.rootFont).toBe('16px');expect.soft(text.minHeight).toBe(expected.height);
  expect.soft(text.height,`${size} short default-scale text button uses its documented height`).toBeCloseTo(expected.height,2);
  expect.soft(text.padding.left).toBe(expected.padding);expect.soft(text.padding.right).toBe(expected.padding);expect.soft(text.gap).toBe(expected.gap);
  expect.soft(text.icon.width).toBe(expected.icon);expect.soft(text.icon.height).toBe(expected.icon);
  expect.soft(icon.height).toBe(expected.height);expect.soft(icon.width).toBe(expected.height);expect.soft(icon.padding.top+icon.padding.bottom+icon.padding.left+icon.padding.right).toBe(0);
 }
 await attach(page,info,`${kind}-${theme}-${width}-default-sizes`,normal);
 await page.addStyleTag({content:'@layer product-overrides { :root { --font-scale:2; --line-height-scale:2; } }'});await settle(page);
 const enlarged=[];
 for(const [size,expected]of Object.entries(sizes)){
  const text=await measure(page.getByTestId(`size-${size}-text`)),icon=await measure(page.getByTestId(`size-${size}-icon`));enlarged.push({size,text,icon});
  expect.soft(text.fontSize).toBe(28);expect.soft(text.lineHeight).toBe(44);
  expect.soft(text.height).toBeGreaterThanOrEqual(text.lineHeight+text.padding.top+text.padding.bottom+text.border.top+text.border.bottom-.5);
  expect.soft(text.scrollHeight).toBeLessThanOrEqual(text.clientHeight+1);
  expect.soft(icon.height).toBe(expected.height);expect.soft(icon.width).toBe(expected.height);expect.soft(icon.icon.width).toBe(expected.icon);
 }
 await attach(page,info,`${kind}-${theme}-${width}-enlarged-text`,enlarged);
});

for(const kind of ['react','vanilla'])for(const theme of ['light','dark','system'])test(`${kind} ${theme}: xs variants retain content geometry and independent padding override`,async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);await page.goto(`/${kind}/button-state-contract.html`);await expect(page.getByRole('heading',{name:'Extra small states',exact:true})).toBeVisible();
 for(const variant of ['primary','secondary','outline','ghost','destructive','link']){for(const state of ['enabled','busy','disabled','disabled-busy']){const control=page.getByTestId(`xs-${variant}-${state}`);expect((await control.boundingBox()).height).toBe(24);await expect(control).toHaveCSS('box-sizing','border-box');await expect(control).toHaveCSS('font-size','14px');await expect(control).toHaveCSS('line-height','22px');}const long=page.getByTestId(`xs-${variant}-long`);expect((await long.boundingBox()).height).toBeGreaterThan(24);expect(await long.evaluate(e=>e.scrollHeight-e.clientHeight)).toBeLessThanOrEqual(1);}
 await page.addStyleTag({content:'@layer product-overrides {:root {--button-padding-block-xs:var(--space-text-gap)}}'});expect((await page.getByTestId('xs-primary-enabled').boundingBox()).height).toBe(32);expect((await page.getByTestId('size-default-text').boundingBox()).height).toBe(36);
 await info.attach('xs-padding-override',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});
