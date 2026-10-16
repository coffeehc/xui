import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
import {chooseSelect} from './select-interaction.mjs';

async function setup(page,{theme='light',width=1280,textScale=1,scale=1}={}){
 await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(({theme,scale,textScale})=>{sessionStorage.setItem('ui.theme.mode',theme);sessionStorage.setItem('ui.interface.scale',String(scale));document.addEventListener('DOMContentLoaded',()=>document.documentElement.style.setProperty('--font-scale',String(textScale)),{once:true});},{theme,scale,textScale});
}
async function color(node,variable){return node.evaluate((element,variable)=>{const probe=document.createElement('span');probe.style.color=`var(${variable})`;element.append(probe);const value=getComputedStyle(probe).color;probe.remove();return value;},variable);}
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
async function record(page,info,name){await info.attach(name+'.png',{body:await page.screenshot(),contentType:'image/png'});}
async function fontRole(node,{size='body-sm',weight='body',family='sans'}={}){
 const result=await node.evaluate((element,{size,weight,family})=>{const probe=document.createElement('span');probe.style.font=`var(--font-weight-${weight}) var(--font-size-${size})/var(--line-height-${size}) var(--font-${family})`;element.append(probe);const properties=['fontFamily','fontSize','lineHeight','fontWeight'],snapshot=node=>Object.fromEntries(properties.map(key=>[key,getComputedStyle(node)[key]])),actual=snapshot(element),expected=snapshot(probe);probe.remove();return {actual,expected};},{size,weight,family});
 expect(result.actual).toEqual(result.expected);
}
async function tabsContract(page){
 const list=page.getByRole('tablist',{name:'记录视图'}),tabs=list.getByRole('tab');await expect(tabs).toHaveCount(3);
 await list.scrollIntoViewIfNeeded();
 const geometry=await list.evaluate(node=>{const s=getComputedStyle(node),boxes=[...node.children].map(tab=>tab.getBoundingClientRect());return {width:node.getBoundingClientRect().width,parent:node.parentElement.getBoundingClientRect().width,content:boxes.reduce((sum,b)=>sum+b.width,0)+parseFloat(s.columnGap)*(boxes.length-1)+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight)+parseFloat(s.borderLeftWidth)+parseFloat(s.borderRightWidth),oneRow:boxes.every(b=>Math.abs(b.y-boxes[0].y)<1)};});
 if(geometry.oneRow){expect(Math.abs(geometry.width-geometry.content)).toBeLessThan(2);if(geometry.parent>800)expect(geometry.width).toBeLessThan(geometry.parent-30);}
 await expect(tabs.first()).toHaveCSS('color',await color(list,'--action-primary'));
 await expect(tabs.first().locator('.xui-tab-icon')).toHaveCSS('color',await tabs.first().evaluate(node=>getComputedStyle(node).color));
 await expect(tabs.first().locator('.xui-tab-icon')).toHaveAttribute('aria-hidden','true');
 await fontRole(tabs.first(),{weight:'heading'});
 await fontRole(tabs.nth(1));
 await tabs.first().focus();await page.keyboard.press('ArrowRight');await expect(tabs.nth(1)).toBeFocused();await expect(tabs.first()).toHaveAttribute('aria-selected','true');
 await page.keyboard.press('Enter');await expect(tabs.nth(1)).toHaveAttribute('aria-selected','true');
 const draft=page.getByRole('textbox',{name:'日志视图草稿'});await draft.fill('切换与布局更新保留草稿');
 await page.evaluate(()=>{window.presentationTabsNodes=[document.querySelector('[aria-label="记录视图"]'),document.querySelector('#tab-log-draft')];window.typographyTabsDemo.setLayout('equal');});
 await expect(list).toHaveAttribute('data-layout','equal');
 const equal=await tabs.evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().width));expect(Math.max(...equal)-Math.min(...equal)).toBeLessThan(2);
 await tabs.first().click();await tabs.nth(1).click();await expect(draft).toHaveValue('切换与布局更新保留草稿');
 await page.evaluate(()=>{window.typographyTabsDemo.setLayout('content');window.typographyTabsDemo.setDisabled(true);});
 await expect(tabs.last()).toBeDisabled();await tabs.nth(1).focus();await page.keyboard.press('End');await expect(tabs.nth(1)).toBeFocused();await page.keyboard.press('ArrowRight');await expect(tabs.first()).toBeFocused();
 expect(await page.evaluate(()=>window.presentationTabsNodes.every(node=>node?.isConnected))).toBe(true);await noOverflow(page);
}
async function iconContract(page){
 const action=page.getByRole('button',{name:'执行合成升级动作',exact:true}),glyph=action.locator('.xui-icon');await expect(action).toBeVisible();
 await expect(glyph).toHaveAttribute('aria-hidden','true');await expect(page.getByRole('img',{name:'独立的被动状态图标'})).toHaveCount(1);
 await expect(glyph).toHaveCSS('color',await color(action,'--action-primary'));
 await chooseSelect(page,'提醒颜色','var(--status-warning-foreground)','警告语义变量');await expect(glyph).toHaveCSS('color',await color(action,'--status-warning-foreground'));
 await page.evaluate(()=>{document.documentElement.style.setProperty('--presentation-product-accent','var(--status-success-foreground)');window.iconDemo.setColor('var(--presentation-product-accent)');window.iconDemo.setBlink(true);});
 await expect(glyph).toHaveCSS('color',await color(action,'--status-success-foreground'));expect(await glyph.evaluate(node=>node.getAnimations().length)).toBe(0);
 await action.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');await expect(page.getByTestId('icon-action-count')).toHaveText('已执行 2 次合成操作');
 await page.evaluate(()=>window.iconDemo.setDisabled(true));await expect(action).toBeDisabled();await expect(glyph).toHaveCSS('color',await action.evaluate(node=>getComputedStyle(node).color));
 await page.evaluate(()=>{window.iconDemo.setDisabled(false);window.iconDemo.setBusy(true);});await expect(action).toBeDisabled();await expect(action).toHaveAttribute('aria-busy','true');
 await page.evaluate(()=>{window.iconDemo.setBusy(false);window.iconDemo.setColor('var(--action-primary)');});await expect(action).toBeEnabled();
 const compact=page.getByRole('button',{name:'执行紧凑合成动作'});const sizes=await Promise.all([glyph,compact.locator('.xui-icon')].map(node=>node.evaluate(element=>element.getBoundingClientRect().width)));expect(sizes[1]/sizes[0]).toBeCloseTo(.75,2);
 await noOverflow(page);
}
async function cardContract(page){
 await expect(page.getByRole('button',{name:'打开 record-1',exact:true})).toBeEnabled();const cards=page.locator('.xui-card-group .xui-card');await expect(cards).toHaveCount(6);
 const metrics=await cards.evaluateAll(nodes=>nodes.map(node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect(),footer=node.querySelector('footer'),f=footer.getBoundingClientRect(),c=node.querySelector('.xui-card-content'),description=node.querySelector('.xui-card-description');return {height:r.height,bottomGap:r.bottom-f.bottom-parseFloat(s.borderBottomWidth),zones:[...node.children].map(n=>n.tagName),clipped:description.scrollHeight>description.clientHeight+1,bodyFont:getComputedStyle(c).fontSize,footerFont:getComputedStyle(footer).fontSize,footerBackground:getComputedStyle(footer).backgroundColor,border:getComputedStyle(footer).borderTopWidth};}));
 expect(Math.max(...metrics.map(m=>m.height))-Math.min(...metrics.map(m=>m.height))).toBeLessThan(2);for(const m of metrics){expect(m.zones).toEqual(['HEADER','DIV','FOOTER']);expect(m.clipped).toBe(false);expect(Math.abs(m.bottomGap)).toBeLessThan(2);expect(parseFloat(m.border)).toBeGreaterThan(0);expect(m.footerBackground).not.toBe('rgba(0, 0, 0, 0)');}
 const draft=page.getByRole('textbox',{name:'备注 record-1',exact:true});await draft.fill('不同高度与排序仍保留');await draft.focus();await draft.evaluate(node=>window.presentationCardNode=node);
 const sizing=page.getByRole('button',{name:'等高卡片',exact:true});await sizing.evaluate(node=>node.click());await expect(page.locator('.xui-card-group')).toHaveAttribute('data-card-sizing','natural');
 await expect(draft).toBeFocused();await expect(draft).toHaveValue('不同高度与排序仍保留');
 const natural=await cards.evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().height));expect(Math.max(...natural)-Math.min(...natural)).toBeGreaterThan(3);
 await sizing.evaluate(node=>node.click());await expect(page.locator('.xui-card-group')).toHaveAttribute('data-card-sizing','equal');expect(await draft.evaluate(node=>node===window.presentationCardNode)).toBe(true);
 await expect(cards.first().locator('.xui-card-icon')).toHaveCSS('color',await color(cards.first(),'--action-primary'));
 await fontRole(cards.first().locator('.xui-card-title'),{size:'section-title',weight:'heading',family:'heading'});await fontRole(cards.first().locator('.xui-card-description'));await fontRole(cards.first().locator('.xui-card-meta'),{size:'body-xs'});await fontRole(cards.first().locator('.xui-badge'),{size:'body-xs',weight:'control'});await fontRole(page.getByRole('button',{name:'打开 record-1',exact:true}),{weight:'control'});
 await page.getByRole('button',{name:'打开 record-1',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByLabel('操作结果')).toContainText('record-1 revision 1');await noOverflow(page);
 return metrics;
}
async function navigationStatusContract(page){
 const link=page.locator('[data-menu-id="project-alpha"][data-menu-control="primary"]');await expect(link).toHaveCount(1);
 const trigger=page.locator('[data-xui-menu-toggle]');if(await trigger.getAttribute('aria-haspopup')==='dialog')await trigger.click();await expect(link).toBeVisible();
 const m=await link.evaluate(node=>{const status=node.querySelector('[data-navigation-status]').getBoundingClientRect(),label=node.querySelector('.xui-menu-label').getBoundingClientRect(),name=node.querySelector('.xui-navigation-label').getBoundingClientRect();return {right:status.right,labelRight:label.right,center:status.y+status.height/2,lineCenter:name.y+parseFloat(getComputedStyle(node).lineHeight)/2};});
 expect(Math.abs(m.right-m.labelRight)).toBeLessThan(2);expect(Math.abs(m.center-m.lineCenter)).toBeLessThan(2);await noOverflow(page);
}
for(const theme of ['light','dark','system'])for(const scenario of [
 {name:'desktop',width:1280},{name:'narrow',width:390},{name:'text200',width:390,textScale:2},{name:'interface200',width:1280,scale:2},
])test(`console presentation ${theme} ${scenario.name}`,async({page},info)=>{
 test.setTimeout(60000);const errors=[];page.on('pageerror',error=>errors.push(error.message));await setup(page,{theme,...scenario});
 await page.goto('/typography-slots-react/');await tabsContract(page);await record(page,info,'tabs');
 await page.goto('/display-react/?icons');await iconContract(page);await record(page,info,'icons');
 await page.goto('/card-group-react/?sizing=equal&varied&accent');const cards=await cardContract(page);await info.attach('card-geometry.json',{body:JSON.stringify(cards,null,2),contentType:'application/json'});await record(page,info,'cards');
 if(scenario.scale===2){await page.goto('/rich-navigation-react/?status');await navigationStatusContract(page);await record(page,info,'navigation-interface200');}
 if(theme==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');}
 expect(errors).toEqual([]);
});

test('icon pulse has visible opacity at both ends without moving layout; media changes stop it',async({page})=>{
 await setup(page);await page.goto('/display-react/?icons');await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>window.iconDemo.setBlink(true));
 const glyph=page.getByRole('img',{name:'独立的被动状态图标'});await expect.poll(()=>glyph.evaluate(node=>node.getAnimations().length)).toBe(1);
 const frames=await glyph.evaluate(node=>{const a=node.getAnimations()[0];a.pause();const sample=time=>{a.currentTime=time;const r=node.getBoundingClientRect();return {opacity:parseFloat(getComputedStyle(node).opacity),x:r.x,y:r.y,width:r.width,height:r.height};};return [sample(0),sample(a.effect.getTiming().duration)];});
 expect(frames[0].opacity).toBeGreaterThan(0);expect(frames[0].opacity).toBeLessThan(frames[1].opacity);expect({...frames[0],opacity:0}).toEqual({...frames[1],opacity:0});
 await page.emulateMedia({reducedMotion:'reduce'});await expect.poll(()=>glyph.evaluate(node=>node.getAnimations().length)).toBe(0);await expect(glyph).toHaveCSS('opacity','1');
});

test('card inherited avatar color, plain alternatives and empty region collapse use public props',async({page})=>{
 await setup(page);await page.goto('/display-react/?card&avatar');const card=page.getByRole('region',{name:'标准资源卡片'});
 await expect(card.locator('.xui-avatar')).toHaveCSS('color',await color(card,'--action-primary'));
 await page.getByRole('textbox',{name:'卡片业务草稿'}).fill('完整草稿');await page.evaluate(()=>window.cardDemo.setTitle('新名称：保持草稿和公共三段布局'));await expect(page.getByRole('textbox',{name:'卡片业务草稿'})).toHaveValue('完整草稿');
 await page.evaluate(()=>window.cardDemo.setEmpty(true));await expect(card.locator(':scope > *')).toHaveCount(1);await expect(card.locator('footer')).toHaveCount(0);
 await page.goto('/display-react/?card&avatar&icon=plain&footer=plain&badge=plain');await expect(card.locator('.xui-card-icon')).toHaveAttribute('data-variant','plain');await expect(card.locator('footer')).toHaveCSS('border-top-width','0px');await expect(card.locator('.xui-badge')).toHaveCSS('border-top-width','0px');
});

for(const composition of ['shell','layout'])for(const width of [1280,390])test(`${composition} owned navigation glyph, controlled state and long brand at ${width}px`,async({page},info)=>{
 await setup(page,{width});await page.goto(`/sidebar-footer-react/?composition=${composition}&brand=long&row&header=tabs`);
 const toggle=page.locator('[data-xui-menu-toggle]'),draft=page.getByRole('textbox',{name:'草稿',exact:true});await expect(toggle).toHaveCount(1);await draft.fill('唯一开关保留草稿');
 await page.evaluate(()=>window.presentationShellNodes=[document.querySelector('[data-xui-menu-toggle]'),document.querySelector('aside'),document.querySelector('#footer-draft')]);
 await toggle.focus();
 if(width===1280){
  expect(await toggle.evaluate(node=>node.closest('.xui-app-header-identity')!==null)).toBe(true);await expect(toggle).toHaveAccessibleName('紧凑导航');
  const expanded=await toggle.locator('.xui-shell-toggle-arrow').evaluate(node=>getComputedStyle(node).transform);
  await page.keyboard.press('Space');await expect(toggle).toHaveAccessibleName('展开导航');await expect(toggle).toHaveAttribute('aria-expanded','false');await expect(toggle).toBeFocused();expect(await toggle.locator('.xui-shell-toggle-arrow').evaluate(node=>getComputedStyle(node).transform)).not.toBe(expanded);
  expect(await page.evaluate(()=>window.sidebarFooterDemo.getCollapseRequests())).toBe(1);await page.keyboard.press('Enter');await expect(toggle).toHaveAttribute('aria-expanded','true');expect(await page.evaluate(()=>window.sidebarFooterDemo.getCollapseRequests())).toBe(2);
  await page.evaluate(()=>window.sidebarFooterDemo.setCollapseBlocked(true));await page.keyboard.press('Space');await expect(toggle).toHaveAttribute('aria-expanded','true');expect(await page.evaluate(()=>window.sidebarFooterDemo.getCollapseRequests())).toBe(3);
  await page.evaluate(()=>window.sidebarFooterDemo.setCollapsed(true));await expect(toggle).toHaveAttribute('aria-expanded','false');expect(await page.evaluate(()=>window.sidebarFooterDemo.getCollapseRequests())).toBe(3);
  await page.evaluate(()=>window.sidebarFooterDemo.setPlacement('bottom'));await expect(toggle).toBeFocused();await page.evaluate(()=>window.sidebarFooterDemo.setPlacement('top'));await expect(toggle).toBeFocused();
 }else{
  expect(await toggle.evaluate(node=>node.closest('.xui-shell-header')!==null)).toBe(true);await expect(toggle).toHaveAttribute('aria-haspopup','dialog');expect(await toggle.locator('.xui-shell-toggle-arrow').count()).toBe(0);
  await page.keyboard.press('Enter');await expect(page.getByRole('dialog',{name:'工作导航',exact:true})).toBeVisible();await expect(toggle).toHaveAttribute('aria-expanded','true');await page.keyboard.press('Escape');await expect(toggle).toBeFocused();await expect(toggle).toHaveAttribute('aria-expanded','false');
 }
 expect(await page.evaluate(()=>window.presentationShellNodes.every(node=>node?.isConnected))).toBe(true);await expect(draft).toHaveValue('唯一开关保留草稿');await noOverflow(page);await record(page,info,'owned-toggle');
});

for(const query of ['?orientation=vertical','?rtl'])test(`tabs retain directional keyboard semantics ${query}`,async({page})=>{
 await setup(page);await page.goto('/typography-slots-react/'+query);const tabs=page.getByRole('tablist',{name:'记录视图'}).getByRole('tab');await tabs.first().focus();await page.keyboard.press(query.includes('vertical')?'ArrowDown':'ArrowLeft');await expect(tabs.nth(1)).toBeFocused();await page.keyboard.press('Space');await expect(tabs.nth(1)).toHaveAttribute('aria-selected','true');await noOverflow(page);
});

for(const theme of ['light','dark','system'])test(`console ${theme} genuine browser zoom200`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,1000']});
 try{const page=await context.newPage();await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);await page.goto('http://127.0.0.1:4173/typography-slots-react/');const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));
 const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);const after=await page.evaluate(()=>({width:innerWidth,font:getComputedStyle(document.documentElement).fontSize,zoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.zoom).toBe('1');expect(after.pinch).toBe(1);
 await tabsContract(page);await page.goto('http://127.0.0.1:4173/display-react/?icons');await iconContract(page);await page.goto('http://127.0.0.1:4173/card-group-react/?sizing=equal&varied&accent');await cardContract(page);await info.attach('zoom200.png',{body:await captureZoomViewport(page),contentType:'image/png'});await page.goto('http://127.0.0.1:4173/rich-navigation-react/?status');await navigationStatusContract(page);await info.attach('navigation-zoom200.png',{body:await captureZoomViewport(page),contentType:'image/png'});
 }finally{await context.close();}
});
