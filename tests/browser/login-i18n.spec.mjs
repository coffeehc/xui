import {test,expect,chromium} from '@playwright/test';
import {chooseSelect} from './select-interaction.mjs';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const tool=page=>page.locator('[data-slot="tools"]').getByRole('combobox');
const username=page=>page.locator('input[name="username"]'),password=page=>page.locator('input[name="password"]');
const ready=page=>expect(page.locator('.xui-login-submit')).toBeEnabled();
const calls=page=>page.evaluate(()=>window.loginDemo.getRequests().length);
const url='/login-react/?i18n&visualAcceptance';

for(const locale of ['zh-CN','en'])test(`saved ${locale} restores complete login text before interaction`,async({page})=>{
 await page.addInitScript(locale=>localStorage.setItem('xui.locale',locale),locale);await page.goto(url);await ready(page);
 await expect(page.getByRole('heading',{name:locale==='en'?'Sign in':'登录',exact:true})).toBeVisible();await expect(username(page)).toHaveAccessibleName(locale==='en'?'Username':'用户名');await expect(password(page)).toHaveAccessibleName(locale==='en'?'Password':'密码');await expect(tool(page)).toHaveAccessibleName(locale==='en'?'Language':'语言');
 await expect(page.locator('html')).toHaveAttribute('lang',locale);await expect(page.locator('.xui-login-logo')).toHaveAttribute('src','./mark.svg');
 const css=await tool(page).evaluate(node=>{const s=getComputedStyle(node);return {color:s.borderTopColor,background:s.backgroundColor};});expect(css.color).toBe('rgba(0, 0, 0, 0)');expect(css.background).toBe('rgba(0, 0, 0, 0)');
});

for(const injected of [false,true])test(`switching language preserves ${injected?'injected':'default'} controller, form, values and request count`,async({page})=>{
 await page.goto(url+(injected?'&injected':''));await ready(page);await username(page).fill('retained-user');await password(page).fill('SYNTHETIC_SECRET');await password(page).evaluate(node=>{node.setSelectionRange(2,7);window.savedPassword=node;window.savedUsername=document.querySelector('input[name=username]');window.savedForm=document.querySelector('form');window.savedAuth=window.loginDemo.auth;window.savedView=window.loginDemo.viewController;});const before=await calls(page),href=page.url();
 await chooseSelect(page,tool(page),'en','English');await expect(page.getByRole('heading',{name:'Sign in',exact:true})).toBeVisible();await expect(tool(page)).toBeFocused();await expect(username(page)).toHaveValue('retained-user');await expect(password(page)).toHaveValue('SYNTHETIC_SECRET');expect(await calls(page)).toBe(before);expect(page.url()).toBe(href);
 expect(await page.evaluate(()=>({form:window.savedForm===document.querySelector('form'),input:window.savedPassword===document.querySelector('input[name=password]'),auth:window.savedAuth===window.loginDemo.auth,view:window.savedView===window.loginDemo.viewController,selection:[window.savedPassword.selectionStart,window.savedPassword.selectionEnd],stored:localStorage.getItem('xui.locale')}))).toEqual({form:true,input:true,auth:true,view:true,selection:[2,7],stored:'en'});
 await chooseSelect(page,tool(page),'zh-CN','简体中文');await expect(page.getByRole('heading',{name:'登录',exact:true})).toBeVisible();expect(await calls(page)).toBe(before);
});

test('language preference survives reload and required field errors translate without submitting',async({page})=>{
 await page.goto(url);await ready(page);await page.locator('.xui-login-submit').click();await expect(page.getByText('请输入用户名。',{exact:true})).toBeVisible();const before=await calls(page);await chooseSelect(page,tool(page),'en','English');await expect(page.getByText('Enter your username.',{exact:true})).toBeVisible();expect(await calls(page)).toBe(before);await page.reload();await ready(page);await expect(page.getByRole('heading',{name:'Sign in',exact:true})).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('xui.locale'))).toBe('en');
});

for(const injected of [false,true])test(`language changes during ${injected?'injected':'default'} sign-in never cancel or repeat the write`,async({page})=>{
 await page.goto(url+(injected?'&injected':''));await ready(page);await page.evaluate(()=>window.loginDemo.setMode('login','hold'));await username(page).fill('demo');await password(page).fill('SYNTHETIC_SECRET');await page.locator('.xui-login-submit').click();await expect(page.locator('.xui-login-submit')).toHaveAttribute('aria-busy','true');await expect.poll(()=>page.evaluate(()=>window.loginDemo.getRequests().filter(request=>request.path.endsWith('/login')).length)).toBe(1);const before=await calls(page);await chooseSelect(page,tool(page),'en','English');await expect(page.locator('.xui-login-submit')).toContainText('Signing in…');expect(await calls(page)).toBe(before);await expect(password(page)).toHaveValue('');expect(await page.evaluate(()=>window.loginDemo.getRequests().filter(request=>request.path.endsWith('/login')).length)).toBe(1);await page.evaluate(()=>window.loginDemo.release('login'));
});

test('keyboard opens the language menu, Escape restores focus, and Enter selects without navigating',async({page})=>{
 await page.goto(url);await ready(page);await tool(page).focus();await page.keyboard.press('Enter');await expect(page.getByRole('listbox')).toBeVisible();await page.keyboard.press('Escape');await expect(tool(page)).toBeFocused();await expect(page.getByRole('listbox')).toHaveCount(0);const before=await calls(page);await page.keyboard.press('Space');await expect(page.getByRole('listbox')).toBeVisible();await expect(page.getByRole('option',{name:'简体中文',exact:true})).toBeFocused();await page.keyboard.press('End');await expect(page.getByRole('option',{name:'English',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(tool(page)).toHaveText('English');await expect(tool(page)).toBeFocused();expect(await calls(page)).toBe(before);
});

test('disabled i18n ignores saved preferences and omits the tool slot',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('xui.locale','en'));await page.goto('/login-react/?visualAcceptance');await ready(page);await expect(page.locator('[data-slot=tools]')).toHaveCount(0);await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');expect(await page.evaluate(()=>localStorage.getItem('xui.locale'))).toBe('en');
});

test('denied storage keeps an in-memory language choice usable',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('denied');}}));await page.goto(url);await ready(page);await chooseSelect(page,tool(page),'en','English');await expect(page.getByRole('heading',{name:'Sign in',exact:true})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('lang','en');
});

test('custom preference key restores the declared locale, invalid values fall back without deletion',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('project.locale','en');localStorage.setItem('xui.locale','invalid');});await page.goto(url+'&storageKey=project.locale');await ready(page);await expect(page.getByRole('heading',{name:'Sign in',exact:true})).toBeVisible();await page.goto(url);await ready(page);await expect(page.getByRole('heading',{name:'登录',exact:true})).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('xui.locale'))).toBe('invalid');
});

test('a second tab updates language without auth requests, draft loss or storage echo',async({page,context})=>{
 await page.goto(url);await ready(page);await username(page).fill('keep-user');const before=await calls(page);const other=await context.newPage();await other.goto(url);await ready(other);await chooseSelect(other,tool(other),'en','English');await expect(page.getByRole('heading',{name:'Sign in',exact:true})).toBeVisible();await expect(username(page)).toHaveValue('keep-user');expect(await calls(page)).toBe(before);await other.evaluate(()=>localStorage.removeItem('xui.locale'));await expect(page.getByRole('heading',{name:'登录',exact:true})).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('xui.locale'))).toBeNull();await other.close();
});

for(const mode of ['light','dark','system'])for(const width of [1280,390])test(`borderless login language ${mode} ${width} supports popup scrolling and enlarged Chinese`,async({page},info)=>{
 await page.setViewportSize({width,height:720});await page.emulateMedia({colorScheme:mode==='light'?'light':'dark'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);await page.goto(url+'&longLanguage&productName='+encodeURIComponent('长中文品牌与统一智能体工作台'));await ready(page);if(width===390)await page.evaluate(()=>window.loginDemo.setScale(2));
 await tool(page).scrollIntoViewIfNeeded();await tool(page).focus();await page.keyboard.press('Enter');await expect(page.getByRole('listbox')).toBeVisible();const popup=page.getByRole('listbox');const rect=await popup.boundingBox();expect(rect.width).toBeLessThanOrEqual(width);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await popup.getByRole('option',{name:'English',exact:true}).click();await expect(tool(page)).toBeFocused();await expect(tool(page)).toBeInViewport();await password(page).focus();await password(page).scrollIntoViewIfNeeded();await expect(password(page)).toBeInViewport();await info.attach('login-language.png',{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});
});

for(const mode of ['light','dark','system'])test(`login language genuine browser 200 percent ${mode}`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1000,720']});
 try{const page=await context.newPage();await page.emulateMedia({colorScheme:mode==='light'?'light':'dark'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);await page.goto('http://127.0.0.1:4173'+url);await ready(page);const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);expect(await page.evaluate(()=>innerWidth)).toBeCloseTo(before.width/2,0);expect(await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize)).toBe(before.font);await chooseSelect(page,tool(page),'en','English');await expect(tool(page)).toBeFocused();await tool(page).scrollIntoViewIfNeeded();await expect(tool(page)).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await info.attach('zoom-language.png',{body:await captureZoomViewport(page),contentType:'image/png'});
 }finally{await context.close();}
});
