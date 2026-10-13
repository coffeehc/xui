import {test,expect} from '@playwright/test';

const roles=[
 ['main > .xui-heading','font-size-page-title','line-height-page-title','font-weight-heading','font-heading'],
 ['#details > .xui-heading','font-size-section-title','line-height-section-title','font-weight-heading','font-heading'],
 ['main > .xui-text','font-size-body-sm','line-height-body-sm','font-weight-body','font-sans'],
 ['main > .xui-link','font-size-body-sm','line-height-body-sm','font-weight-body','font-sans'],
 ['main > pre > .xui-code','font-size-body-sm','line-height-body-sm','font-weight-body','font-mono'],
];
async function expected(page){return page.evaluate(roles=>{
 const probe=document.createElement('span');document.body.append(probe);
 const result=roles.map(([selector,size,line,weight,family])=>{
  probe.style.font=`var(--${weight}) var(--${size})/var(--${line}) var(--${family})`;
  const s=getComputedStyle(probe);return {selector,size:s.fontSize,line:s.lineHeight,weight:s.fontWeight,family:s.fontFamily};
 });probe.remove();return result;
},roles);}
async function check(page){
 for(const role of await expected(page)){
  const node=page.locator(role.selector);await expect(node).toHaveCount(1);
  for(const [css,key] of [['font-size','size'],['line-height','line'],['font-weight','weight'],['font-family','family']])await expect(node).toHaveCSS(css,role[key]);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
for(const kind of ['react','vanilla'])for(const theme of ['light','dark','system'])test(`${kind} ${theme}: Typography and Surface consume independent public role tokens`,async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(theme=>localStorage.setItem('ui.theme.mode',theme),theme);
 await page.route('**/display-image-*.svg',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><title>Synthetic fixture</title></svg>'}));
 await page.goto(`/display-${kind}/`);await expect(page.locator('html')).toHaveAttribute('data-theme-effective',theme==='system'?'dark':theme);
 await check(page);await expect(page.locator('main > .xui-text')).toHaveCSS('font-weight','400');await expect(page.locator('main > .xui-heading')).toHaveCSS('font-weight','600');
 const surface=page.getByRole('region',{name:'Separator contract',exact:true});
 async function surfaceTokens(){const values=await surface.evaluate(node=>{
  const probe=document.createElement('span');node.append(probe);probe.style.cssText='display:block;background:var(--card-background);border:var(--line-width-surface) solid var(--card-border-color);border-radius:var(--card-radius);padding:var(--card-padding);box-shadow:var(--shadow-flat)';
  const s=getComputedStyle(probe),result={background:s.backgroundColor,border:s.borderTopColor,width:s.borderTopWidth,radius:s.borderTopLeftRadius,padding:s.paddingTop,shadow:s.boxShadow};probe.remove();return result;
 });for(const [property,key] of [['background-color','background'],['border-top-color','border'],['border-top-width','width'],['border-top-left-radius','radius'],['padding-top','padding'],['box-shadow','shadow']])await expect(surface).toHaveCSS(property,values[key]);}
 await surfaceTokens();await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'查看详情'})).toBeFocused();await expect(page.getByRole('link',{name:'查看详情'})).toHaveCSS('outline-style','solid');
 await info.attach('display-foundation-default',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 const override=await page.addStyleTag({content:'@layer product-overrides { :root { --font-sans: serif; --font-heading: sans-serif; --font-mono: monospace; --font-weight-body:450; --font-weight-heading:650; --font-size-body-sm:1rem; --line-height-body-sm:1.625rem; --font-size-page-title:1.5rem; --line-height-page-title:2rem; --font-size-section-title:1.125rem; --line-height-section-title:1.75rem; --card-background:#edf5f2; --card-border-color:#315b50; --line-width-surface:3px; --card-radius:0.75rem; --card-padding:1.25rem; } }'});
 await check(page);await surfaceTokens();await expect(surface).toHaveCSS('border-top-width','3px');await expect(surface).toHaveCSS('padding-top','20px');
 // Separator owns its distinct semantic line-width token even when Surface changes.
 await expect(surface.getByRole('separator',{name:'Horizontal separator'})).toHaveCSS('border-top-width','1px');
 await info.attach('display-foundation-overridden',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await override.evaluate(node=>node.remove());await check(page);await surfaceTokens();
 const enlarged=await page.addStyleTag({content:'html {font-size:200%}'});await check(page);await surfaceTokens();
 await expect(page.locator('main > .xui-text')).toHaveCSS('font-size','28px');
 await info.attach('display-foundation-enlarged-text',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});await enlarged.evaluate(node=>node.remove());
});
