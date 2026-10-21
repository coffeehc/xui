import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const url=mode=>'http://127.0.0.1:4173/public-capabilities-react/?mode='+mode;
const palettes=['violet','ember','forest','crimson','cobalt','precision'];
async function open(page,mode){await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.goto(url(mode));await expect(page.getByTestId('colors')).toHaveAttribute('data-colors',/srgb/);}
async function overflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
async function appearance(link){return link.evaluate(node=>{const s=getComputedStyle(node),parent=getComputedStyle(node.parentElement);return {decoration:s.textDecorationLine,color:s.color,parentColor:parent.color,font:s.fontSize,parentFont:parent.fontSize,outline:s.outlineStyle,outlineWidth:s.outlineWidth};});}
for(const mode of ['light','dark','system'])for(const width of [1280,390])test(`public links ${mode} ${width}: shared decoration, inherited text, pointer and keyboard`,async({page},info)=>{
 await open(page,mode);
 // This existing Link is also the old formal-package reproduction, before any new fixture is required.
 const linked=page.getByTestId('prose').getByRole('link').first();await expect(linked).toHaveCSS('text-decoration-line','none');
 if(width===390){await page.setViewportSize({width,height:900});await page.evaluate(()=>document.documentElement.style.fontSize='200%');}
 const title=page.getByTestId('message-title-link'),native=page.getByTestId('native-reference-link'),source=page.getByTestId('source-link');
 const links=[title,native,source,linked],colors=[];
 for(const preset of palettes){await page.evaluate(preset=>window.xuiTheme.setPreset(preset),preset);const values=await Promise.all(links.map(appearance));for(const value of values){expect(value.decoration).toBe('none');expect(value.color).toBe(values[0].color);expect(value.color).not.toBe(value.parentColor);expect(value.font).toBe(value.parentFont);}colors.push({preset,values});}
 await page.evaluate(()=>window.xuiTheme.setPreset('violet'));
 for(const link of [title,native,linked]){
  await link.hover();await expect(link).toHaveCSS('text-decoration-line','none');await page.mouse.down();await expect(link).toHaveCSS('text-decoration-line','none');await page.mouse.move(0,0);await page.mouse.up();
  await link.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await expect(link).toBeFocused();expect(await link.evaluate(node=>node.matches(':focus-visible'))).toBe(true);const focus=await appearance(link);expect(focus.decoration).toBe('none');expect(focus.outline).toBe('none');
 }
 await title.press('Enter');await expect(page).toHaveURL(/#message-details$/);await expect(title).toHaveCSS('text-decoration-line','none');await native.click();await expect(page).toHaveURL(/#message-details$/);
 await page.route('https://example.com/source',route=>route.fulfill({contentType:'text/html',body:'<title>Mock source</title>'}));const pending=page.waitForEvent('popup');await source.click();const popup=await pending;await popup.waitForLoadState();expect(popup.url()).toBe('https://example.com/source');expect(await popup.evaluate(()=>window.opener)).toBe(null);await popup.close();await expect(source).toHaveAttribute('rel','noopener noreferrer');await expect(source).toHaveCSS('text-decoration-line','none');
 await overflow(page);await title.scrollIntoViewIfNeeded();await info.attach('links.png',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});await info.attach('link-palettes.json',{body:JSON.stringify(colors),contentType:'application/json'});
});
for(const mode of ['light','dark','system'])test(`public links ${mode} genuine browser 200% zoom`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,1000']});
 try{const page=await context.newPage();await open(page,mode);const before=await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth,font:getComputedStyle(document.documentElement).fontSize}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);const after=await page.evaluate(()=>({dpr:devicePixelRatio,width:innerWidth,font:getComputedStyle(document.documentElement).fontSize,cssZoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.cssZoom).toBe('1');expect(after.pinch).toBe(1);await overflow(page);const title=page.getByTestId('message-title-link');await title.press('Tab');await page.keyboard.press('Shift+Tab');await expect(title).toBeFocused();expect(await title.evaluate(node=>node.matches(':focus-visible'))).toBe(true);expect((await appearance(title)).outline).toBe('none');await expect(title).toHaveCSS('text-decoration-line','none');await info.attach('links-zoom.png',{body:await captureZoomViewport(page),contentType:'image/png'});await info.attach('zoom.json',{body:JSON.stringify({before,after}),contentType:'application/json'});}finally{await context.close();}
});
