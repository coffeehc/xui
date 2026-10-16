import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const primary=page=>page.locator('[data-menu-id="project-alpha"][data-menu-control="primary"]');
async function foreground(page){return primary(page).evaluate(node=>{
 const probe=document.createElement('span');probe.style.color='var(--action-primary)';node.append(probe);const expected=getComputedStyle(probe).color;probe.remove();
 return {expected,actual:[node,...node.querySelectorAll('.xui-menu-label,.xui-navigation-label,.xui-text,.xui-code,.xui-icon,svg')].map(part=>getComputedStyle(part).color)};
});}
async function matchesTheme(page){await expect.poll(async()=>{const colors=await foreground(page);return colors.actual.every(color=>color===colors.expected);}).toBe(true);}
async function selectCurrent(page){
 await expect(primary(page)).toHaveCount(1);
 await page.evaluate(()=>window.richNavigationDemo.owner.navigate('project-alpha'));
 await expect(primary(page)).toHaveAttribute('aria-current','page');
 if(await page.evaluate(()=>matchMedia('(max-width: 47.999rem)').matches))await page.getByRole('button',{name:'工作导航',exact:true}).click();
 await expect(primary(page)).toBeVisible();await matchesTheme(page);
}
for(const mode of ['light','dark','system'])for(const scenario of [{width:1280,scale:1},{width:390,scale:1},{width:390,scale:2}])test(`selected navigation text ${mode} ${scenario.width} text${scenario.scale}`,async({page},info)=>{
 await page.setViewportSize({width:scenario.width,height:900});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);
 await page.goto('/rich-navigation-react/?status');
 if(scenario.scale===2)await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 await selectCurrent(page);
 await expect(primary(page).locator('.xui-text[data-tone="muted"]')).toBeVisible();
 await primary(page).hover();await matchesTheme(page);
 if(scenario.width===1280){await page.mouse.down();await matchesTheme(page);await page.mouse.up();}
 await primary(page).focus();await expect(primary(page)).toBeFocused();await matchesTheme(page);
 if(mode==='system'){const previous=(await foreground(page)).expected;await page.emulateMedia({colorScheme:'light'});await matchesTheme(page);expect((await foreground(page)).expected).not.toBe(previous);}
 const normal=page.locator('[data-menu-id="project-folder"][data-menu-control="primary"] .xui-text[data-tone="muted"]');
 expect(await normal.evaluate(node=>getComputedStyle(node).color)).not.toBe((await foreground(page)).expected);
 await info.attach('selected-navigation.png',{body:await page.screenshot(),contentType:'image/png'});
 await info.attach('selected-colors.json',{body:JSON.stringify(await foreground(page)),contentType:'application/json'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('selected navigation keeps theme foreground at genuine browser 200% zoom',async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});
 try{const page=await context.newPage();await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://127.0.0.1:4173/rich-navigation-react/?status');const before=await page.evaluate(()=>devicePixelRatio);const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before*2,1);
  await selectCurrent(page);await primary(page).focus();await expect(primary(page)).toBeFocused();await matchesTheme(page);
  await info.attach('selected-navigation-browser-zoom.png',{body:await captureZoomViewport(page),contentType:'image/png'});
 }finally{await context.close();}
});
