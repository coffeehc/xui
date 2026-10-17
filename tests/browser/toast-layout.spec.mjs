import {test,expect,chromium} from '@playwright/test';
import {paint,roleColor} from './semantic-paint.mjs';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const message='无法连接到 xAgent API，请确认后端服务或代理可用。';
const roots=page=>page.locator('.xui-toast');
async function setup(page,mode='light',preset='violet',width=1280){
 await page.setViewportSize({width,height:800});
 await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(({mode,preset})=>{sessionStorage.setItem('ui.theme.mode',mode);window.xuiThemeOptions={preset};},{mode,preset});
 await page.goto('/toast-react/');await expect(page.getByText('绑定前的通知',{exact:true})).toBeVisible();
 await page.evaluate(()=>window.toastDemo.a.clear());await expect(roots(page)).toHaveCount(0);
 await page.getByRole('button',{name:'切换标准通知',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme-preset',preset);
 await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);
}
async function aligned(root){
 const g=await root.evaluate(n=>{const box=x=>{const r=x.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};const title=n.querySelector('.xui-toast-title,.xui-toast-description'),close=n.querySelector('.xui-toast-close'),content=n.querySelector('.xui-toast-content'),s=getComputedStyle(n),reflow=getComputedStyle(content).display==='contents',bottom=Math.max(...[...content.children,close].filter(x=>getComputedStyle(x).display!=='none').map(x=>x.getBoundingClientRect().bottom));return {root:box(n),title:box(title),close:box(close),content:box(content),reflow,bottom,padding:parseFloat(s.paddingTop),border:parseFloat(s.borderTopWidth),gap:parseFloat(s.rowGap),actions:n.querySelector('.xui-toast-actions')?getComputedStyle(n.querySelector('.xui-toast-actions')).display:'none',font:parseFloat(getComputedStyle(title).fontSize)};});
 expect(g.close.y).toBeCloseTo(g.root.y+g.padding+g.border,0);
 if(g.title.y>g.close.y+1){expect(g.title.y).toBeGreaterThanOrEqual(g.close.bottom+g.gap-1);expect(g.title.width).toBeCloseTo(g.root.width-2*(g.padding+g.border),0);}else expect(Math.abs(g.close.y-g.title.y)).toBeLessThanOrEqual(1);
 expect(g.close.width).toBeGreaterThanOrEqual(32);
 expect(g.close.height).toBeGreaterThanOrEqual(32);
 if(g.title.y<g.close.bottom)expect(Math.min(g.close.right,g.title.right)-Math.max(g.close.x,g.title.x)).toBeLessThanOrEqual(0);
 expect(g.root.height).toBeCloseTo(g.reflow?g.bottom-g.root.y+g.padding+g.border:Math.max(g.content.height,g.close.height)+2*(g.padding+g.border),0);
 return g;
}
for(const mode of ['light','dark','system'])for(const preset of ['violet','ember','forest','crimson','cobalt','precision'])test(`compact Toast ${mode} ${preset} screenshot message top close and no empty footer`,async({page},info)=>{
 await setup(page,mode,preset);await page.getByRole('button',{name:'连接失败示例',exact:true}).click();await page.mouse.move(0,0);
 await expect(roots(page)).toHaveCount(2);expect(await page.evaluate(()=>window.toastDemo.a.getState().toasts.length)).toBe(2);
 for(const root of await roots(page).all()){
  const g=await aligned(root);expect(g.root.height).toBeLessThan(100);expect(g.font).toBe(14);expect(g.actions).toBe('none');
  const title=root.getByRole('heading',{name:message,exact:true});expect((await paint(title)).contrast).toBeGreaterThanOrEqual(4.5);
  const icon=root.locator('.xui-toast-icon');await expect(icon).toHaveAttribute('aria-hidden','true');expect((await paint(icon)).color).toBe(await roleColor(page,'--status-error-foreground'));
  const close=root.getByRole('button',{name:'关闭通知',exact:true});await expect(close).toHaveAttribute('data-icon','true');await close.hover();expect((await paint(close)).alpha).toBe(0);
 }
 await info.attach('compact-toast.png',{body:await page.screenshot(),contentType:'image/png'});
 const origin=page.getByRole('textbox',{name:'操作草稿',exact:true});await origin.fill('保留操作中的草稿');await page.keyboard.press('F6');await page.keyboard.press('Tab');await expect(roots(page).first().getByRole('button')).toBeFocused();await page.keyboard.press('Space');await expect(roots(page)).toHaveCount(1);await page.keyboard.press('Escape');await expect(roots(page)).toHaveCount(0);await expect(origin).toBeFocused();await expect(origin).toHaveValue('保留操作中的草稿');
});
for(const mode of ['light','dark','system'])test(`compact Toast ${mode} description only unknown type and all explicit semantic icons`,async({page})=>{
 await setup(page,mode);await page.evaluate(message=>window.toastDemo.add({title:undefined,description:message,type:'host-domain-event',timeout:-1}),message);
 const root=roots(page);await aligned(root);await expect(root.locator('.xui-toast-title')).toHaveCount(0);await expect(root).not.toHaveAttribute('aria-labelledby');await expect(root).toHaveAttribute('aria-describedby',/./);
 expect((await paint(root.locator('.xui-toast-description'))).color).toBe(await roleColor(page,'--muted-foreground'));expect((await paint(root.locator('.xui-toast-icon'))).color).toBe(await roleColor(page,'--muted-foreground'));
 expect(await root.locator('.xui-toast-description').evaluate(n=>parseFloat(getComputedStyle(n).fontSize))).toBe(13);
 for(const type of ['success','warning','error','info']){await page.evaluate(type=>window.toastDemo.a.update(window.toastDemo.a.getState().toasts[0].id,{type}),type);await expect(root.locator('.xui-toast-icon')).toHaveAttribute('data-tone',type);expect((await paint(root.locator('.xui-toast-icon'))).color).toBe(await roleColor(page,`--status-${type}-foreground`));await expect(root).toHaveAttribute('role','status');}
});
for(const mode of ['light','dark','system'])test(`compact Toast ${mode} RTL narrow root 200% long content real action and close remain reachable`,async({page},info)=>{
 await setup(page,mode,'forest',320);await page.evaluate(()=>{document.documentElement.dir='rtl';document.documentElement.style.fontSize='200%';window.toastDemo.add({title:'跨区域协作的长中文结果通知',description:'请核对当前记录与来源，完整内容不得截断。'.repeat(30),type:'warning',timeout:-1,actionProps:{children:'查看完整结果'}});});
 const root=roots(page);const g=await aligned(root);expect(g.reflow).toBe(true);const description=root.locator('.xui-toast-description');expect((await description.boundingBox()).width).toBeCloseTo(g.root.width-2*(g.padding+g.border),0);expect(await description.evaluate(n=>n.scrollWidth<=n.clientWidth+1)).toBe(true);
 await expect(root.getByRole('button',{name:'查看完整结果',exact:true})).toHaveCount(1);await expect(root.locator('.xui-toast-actions')).not.toHaveCSS('display','none');
 const origin=page.getByRole('textbox',{name:'操作草稿',exact:true});await origin.focus();await page.keyboard.press('F6');await page.keyboard.press('Tab');await expect(root.getByRole('button',{name:'查看完整结果',exact:true})).toBeFocused();await page.keyboard.press('Tab');const close=root.getByRole('button',{name:'关闭通知',exact:true});await expect(close).toBeFocused();await expect(close).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);const scroll=await page.locator('.xui-toast-viewport').evaluate(n=>({height:n.clientHeight,scroll:n.scrollHeight}));expect(scroll.scroll).toBeGreaterThan(scroll.height);await info.attach('compact-toast-rtl200.png',{body:await page.screenshot(),contentType:'image/png'});await page.keyboard.press('Escape');await expect(root).toHaveCount(0);await expect(origin).toBeFocused();
});
test('legacy close-only Actions and ungrouped parts retain compact readable geometry',async({page})=>{
 await setup(page);await page.getByRole('button',{name:'切换部件组合',exact:true}).click();
 await page.evaluate(message=>window.toastDemo.add({title:message,timeout:-1}),message);let root=roots(page);const row=await root.evaluate(n=>{const t=n.querySelector('h2').getBoundingClientRect(),b=n.querySelector('button').getBoundingClientRect();return{title:t.y,close:b.y,height:n.getBoundingClientRect().height};});expect(Math.abs(row.title-row.close)).toBeLessThanOrEqual(1);expect(row.height).toBeLessThan(100);
 await page.evaluate(()=>{window.toastDemo.a.clear();window.toastDemo.add({title:'未使用Content的旧组合',description:'正文保持在标题下方',timeout:-1,data:{ungrouped:true},actionProps:{children:'实际动作'}});});root=roots(page);const layout=await root.evaluate(n=>{const box=selector=>{const r=n.querySelector(selector).getBoundingClientRect();return{y:r.y,bottom:r.bottom};};return{title:box('h2'),description:box('p'),action:box('button:not(.xui-toast-close)'),close:box('.xui-toast-close')};});expect(layout.description.y).toBeGreaterThanOrEqual(layout.title.bottom);expect(layout.action.y).toBeGreaterThanOrEqual(layout.description.bottom);expect(layout.close.y).toBeCloseTo(layout.title.y,0);
});
for(const mode of ['light','dark','system'])test(`compact Toast ${mode} genuine Chrome 200% zoom geometry and keyboard`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=780,1000']});
 try{const page=await context.newPage();await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);await page.goto('http://127.0.0.1:4173/toast-react/');await expect(page.getByText('绑定前的通知',{exact:true})).toBeVisible();await page.evaluate(()=>window.toastDemo.a.clear());await page.getByRole('button',{name:'切换标准通知',exact:true}).click();await page.getByRole('button',{name:'连接失败示例',exact:true}).click();const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);const after=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize,css:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.css).toBe('1');expect(after.pinch).toBe(1);
 await page.mouse.move(0,0);await expect.poll(()=>page.evaluate(()=>window.toastDemo.a.getState().visibleLimit)).toBe(1);await aligned(roots(page).first());const origin=page.getByRole('textbox',{name:'操作草稿',exact:true});await origin.focus();await page.keyboard.press('F6');await page.keyboard.press('Tab');await expect(roots(page).first().getByRole('button',{name:'关闭通知',exact:true})).toBeFocused();await info.attach('compact-toast-zoom.png',{body:await captureZoomViewport(page),contentType:'image/png'});await info.attach('zoom.json',{body:JSON.stringify({before,after}),contentType:'application/json'});await page.keyboard.press('Escape');await page.keyboard.press('Escape');await expect(origin).toBeFocused();
 }finally{await context.close();}
});
