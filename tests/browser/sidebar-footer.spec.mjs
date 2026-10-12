import {test as base,expect} from '@playwright/test';

const test=base.extend({page:async({page},use,info)=>{
  const errors=[];page.on('pageerror',error=>errors.push({kind:'pageerror',message:error.message}));
  page.on('console',message=>{if(message.type()==='error'||message.type()==='warning'&&/hydrat|uncaught|invalid hook|cannot update|does not match|did not match/i.test(message.text()))errors.push({kind:`console.${message.type()}`,message:message.text()});});
  await use(page);await info.attach('browser-errors.json',{body:JSON.stringify(errors,null,2),contentType:'application/json'});
  expect(errors,'footer consumers must not emit browser errors or serious React warnings').toEqual([]);
}});
const actionName='查看工作空间授权与许可证状态',themeName='切换主题显示模式';
const nav=(page,id)=>page.locator(`[data-menu-id="${id}"][data-menu-control="primary"]`);
const action=page=>page.getByTestId('footer-action');
const menu=page=>page.locator('.xui-shell-sidebar-menu');
const footer=page=>page.locator('.xui-shell-sidebar-footer');
const sidebar=page=>page.locator('.xui-shell-sidebar-with-footer');
const drawer=page=>page.getByRole('dialog',{name:'工作导航',exact:true});
const roving=page=>page.locator('nav[aria-label="工作导航"] [data-menu-control][tabindex="0"]');
async function assertMenuTarget(page,id){await expect(roving(page)).toHaveCount(1);await expect(roving(page)).toHaveAttribute('data-menu-id',id);await expect(nav(page,id)).toBeFocused();}
const bounds=node=>node.evaluate(element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,clientWidth:element.clientWidth,scrollWidth:element.scrollWidth,clientHeight:element.clientHeight,scrollHeight:element.scrollHeight,scrollTop:element.scrollTop};});
const within=(inner,outer)=>{expect(inner.x).toBeGreaterThanOrEqual(outer.x-1);expect(inner.right).toBeLessThanOrEqual(outer.right+1);expect(inner.y).toBeGreaterThanOrEqual(outer.y-1);expect(inner.bottom).toBeLessThanOrEqual(outer.bottom+1);};
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
async function setup(page,kind,query='',mode='light',viewport={width:1280,height:800}){
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
  await page.addInitScript(mode=>localStorage.setItem('ui.theme.mode',mode),mode);await page.goto(`/sidebar-footer-${kind}/${query}`);
  await page.waitForFunction(()=>!!window.sidebarFooterDemo);await settle(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);
}
async function capture(page,info,name){
  const metrics=await page.evaluate(()=>({theme:{mode:document.documentElement.dataset.theme,effective:document.documentElement.dataset.themeEffective},viewport:{width:innerWidth,height:innerHeight},rootFontSize:getComputedStyle(document.documentElement).fontSize,documentWidth:document.documentElement.scrollWidth,
    regions:[...document.querySelectorAll('.xui-shell-sidebar,.xui-shell-sidebar-menu,.xui-shell-sidebar-footer,.xui-sidebar-footer-content,.xui-sidebar-footer-label,.xui-shell-main')].filter(node=>node.getClientRects().length).map(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return {className:node.className,x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,scrollTop:node.scrollTop,scrollHeight:node.scrollHeight,clientHeight:node.clientHeight,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,overflowY:s.overflowY,fontSize:s.fontSize,lineHeight:s.lineHeight};})}));
  await info.attach(`${name}-css-pixels.json`,{body:JSON.stringify(metrics,null,2),contentType:'application/json'});
  const path=info.outputPath(`${name}.png`);await page.screenshot({path,animations:'disabled'});await info.attach(`${name}.png`,{path,contentType:'image/png'});
}
async function remember(page){await page.evaluate(()=>{window.footerIdentity={sidebar:document.querySelector('.xui-shell-sidebar-with-footer'),footer:document.querySelector('.xui-shell-sidebar-footer'),action:document.querySelector('[data-testid="footer-action"]'),version:document.querySelector('[data-testid="footer-version"]'),main:document.querySelector('main'),draft:document.getElementById('footer-draft'),theme:window.xuiTheme};});}
async function assertIdentity(page){expect(await page.evaluate(()=>window.sidebarFooterDemo.getVersionNode()===document.querySelector('[data-testid="footer-version"]'))).toBe(true);expect(await page.evaluate(()=>Object.entries(window.footerIdentity).every(([key,node])=>node===({sidebar:document.querySelector('.xui-shell-sidebar-with-footer'),footer:document.querySelector('.xui-shell-sidebar-footer'),action:document.querySelector('[data-testid="footer-action"]'),version:document.querySelector('[data-testid="footer-version"]'),main:document.querySelector('main'),draft:document.getElementById('footer-draft'),theme:window.xuiTheme})[key]))).toBe(true);}

for(const kind of ['react','vanilla']){
  for(const mode of ['light','dark','system'])for(const collapsed of [false,true])test(`${kind} ${mode} ${collapsed?'compact':'expanded'} footer stays at the bottom with complete action names`,async({page},info)=>{
    await setup(page,kind,`?collapsed=${collapsed}`,mode);await expect(action(page)).toBeVisible();const toggle=page.locator('.xui-shell-header .xui-shell-toggle');await expect(toggle).toHaveAccessibleName(collapsed?'展开导航':'紧凑导航');await expect(toggle).toHaveAttribute('aria-expanded',String(!collapsed));await expect(sidebar(page).locator('.xui-menu-compact-toggle:visible')).toHaveCount(0);
    const rail=await bounds(sidebar(page)),bottom=await bounds(footer(page)),menuBox=await bounds(menu(page));
    expect(rail.width).toBeCloseTo(collapsed?60:216,1);within(bottom,rail);expect(Math.abs(rail.bottom-bottom.bottom-12)).toBeLessThanOrEqual(1);expect(menuBox.bottom).toBeLessThanOrEqual(bottom.y+1);
    expect(menuBox.scrollHeight).toBeLessThanOrEqual(menuBox.clientHeight+1);expect(bottom.scrollHeight).toBeLessThanOrEqual(bottom.clientHeight+1);
    await expect(action(page)).toHaveAccessibleName(actionName);await expect(action(page).locator('.xui-sidebar-footer-label')).toHaveText(actionName);
    const label=await action(page).locator('.xui-sidebar-footer-label').evaluate(node=>({display:getComputedStyle(node).display,visibility:getComputedStyle(node).visibility,width:node.getBoundingClientRect().width,text:node.textContent}));
    expect(label.display).not.toBe('none');expect(label.visibility).not.toBe('hidden');expect(label.text).toBe(actionName);expect(label.width).toBeGreaterThan(0);if(collapsed)expect(label.width).toBeLessThanOrEqual(1);else expect(label.width).toBeGreaterThan(80);
    const icon=await bounds(action(page).locator('.xui-sidebar-footer-icon>svg'));expect(icon.width).toBeCloseTo(16,1);expect(icon.height).toBeCloseTo(16,1);within(icon,rail);
    await expect(page.getByTestId('footer-version')).toHaveText('v1版本 1.2.3（合成示例）');
    await expect(page.locator('nav[aria-label="工作导航"]')).toHaveCount(1);await capture(page,info,`${mode}-${collapsed?'compact':'expanded'}`);
    if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');await capture(page,info,`system-light-${collapsed?'compact':'expanded'}`);}
  });

  test(`${kind} one header toggle owns desktop keyboard collapse and narrow drawer semantics`,async({page},info)=>{
    await setup(page,kind);const toggle=page.locator('.xui-shell-header .xui-shell-toggle');await expect(toggle).toHaveCount(1);await expect(toggle).toHaveAccessibleName('紧凑导航');await expect(toggle).toHaveAttribute('aria-expanded','true');await expect(sidebar(page).locator('.xui-menu-compact-toggle:visible')).toHaveCount(0);
    await toggle.focus();await page.keyboard.down('Space');await expect(toggle).toHaveAttribute('data-pressed','true');await page.keyboard.up('Space');await expect(toggle).toBeFocused();await expect(toggle).toHaveAccessibleName('展开导航');await expect(toggle).toHaveAttribute('aria-expanded','false');expect((await bounds(sidebar(page))).width).toBeCloseTo(60,1);
    await page.keyboard.press('Enter');await expect(toggle).toBeFocused();await expect(toggle).toHaveAttribute('aria-expanded','true');expect((await bounds(sidebar(page))).width).toBeCloseTo(216,1);await page.keyboard.press('Tab');await expect(page.locator('.xui-theme-mode-toggle')).toBeFocused();await page.keyboard.press('Tab');await expect(nav(page,'overview')).toBeFocused();
    await page.setViewportSize({width:390,height:844});await expect(toggle).toHaveAccessibleName('工作导航');await expect(toggle).toHaveAttribute('aria-expanded','false');await toggle.focus();await page.keyboard.press('Enter');await expect(drawer(page)).toBeVisible();await expect(toggle).toHaveAttribute('aria-expanded','true');expect(await toggle.evaluate(node=>{const target=document.getElementById(node.getAttribute('aria-controls'));return target?.getAttribute('role')==='dialog'||target?.tagName==='DIALOG';})).toBe(true);await expect(page.locator('nav[aria-label="工作导航"]')).toHaveCount(1);await page.keyboard.press('Escape');await expect(toggle).toBeFocused();await expect(toggle).toHaveAttribute('aria-expanded','false');await capture(page,info,'header-toggle-responsive-keyboard');
  });

  for(const scroll of ['viewport','document'])test(`${kind} ${scroll} long menu scrolls independently and never covers the footer`,async({page},info)=>{
    await setup(page,kind,`?list=long&scroll=${scroll}`);await expect(nav(page,'record-79')).toHaveAttribute('aria-current','page');
    await expect.poll(async()=>(await bounds(menu(page))).scrollTop).toBeGreaterThan(0);within(await bounds(nav(page,'record-79')),await bounds(menu(page)));
    const initialFooter=await bounds(footer(page)),initialMenu=await bounds(menu(page));expect(initialMenu.scrollHeight).toBeGreaterThan(initialMenu.clientHeight);expect(initialMenu.bottom).toBeLessThanOrEqual(initialFooter.y+1);
    expect(await sidebar(page).evaluate(node=>node.scrollTop)).toBe(0);expect(initialFooter.scrollHeight).toBeLessThanOrEqual(initialFooter.clientHeight+1);
    await menu(page).evaluate(node=>{node.scrollTop=0;});expect((await bounds(footer(page))).y).toBeCloseTo(initialFooter.y,1);
    await nav(page,'record-0').focus();await page.keyboard.press('End');await expect(nav(page,'record-79')).toBeFocused();within(await bounds(nav(page,'record-79')),await bounds(menu(page)));
    await page.keyboard.press('Tab');await expect(action(page)).toBeFocused();within(await bounds(action(page)),await bounds(footer(page)));
    for(const label of ['紧凑导航','展开导航']){await page.getByRole('button',{name:label,exact:true}).click();await settle(page);within(await bounds(nav(page,'record-79')),await bounds(menu(page)));expect((await bounds(footer(page))).bottom).toBeCloseTo(initialFooter.bottom,1);}
    const beforeMenu=await menu(page).evaluate(node=>node.scrollTop);
    if(scroll==='viewport'){await page.locator('main').evaluate(node=>{node.scrollTop=500;});expect(await page.evaluate(()=>scrollY)).toBe(0);}else{await page.evaluate(()=>scrollTo(0,500));expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(0);}
    expect(await menu(page).evaluate(node=>node.scrollTop)).toBe(beforeMenu);await expect(action(page)).toBeVisible();await capture(page,info,`long-${scroll}`);
  });

  test(`${kind} removing a focused final menu item stays inside the open drawer`,async({page})=>{
    await setup(page,kind,'','light',{width:390,height:844});await page.getByRole('button',{name:'工作导航',exact:true}).click();await nav(page,'overview').focus();await page.evaluate(()=>window.sidebarFooterDemo.update({items:[],activeId:null}));await expect(drawer(page)).toBeVisible();await expect(page.getByRole('button',{name:'关闭导航',exact:true})).toBeFocused();await expect(page.locator('nav[aria-label="工作导航"] [data-menu-control][tabindex="0"]')).toHaveCount(0);await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'工作导航',exact:true})).toBeFocused();
  });

  test(`${kind} updates preserve footer focus, draft and node identity, including repeated consumed input`,async({page},info)=>{
    await setup(page,kind);await page.getByRole('textbox',{name:'草稿',exact:true}).fill('完整保留正在编辑的草稿');await remember(page);await action(page).focus();
    await page.evaluate(()=>{window.sidebarFooterDemo.update({activeId:'library',location:location.href+'#changed'});window.sidebarFooterDemo.repeatFooter();});await expect(action(page)).toBeFocused();await assertIdentity(page);
    await page.evaluate(()=>window.sidebarFooterDemo.update({items:[{id:'new',label:'新增菜单',icon:'file',href:'?page=new'},{id:'library',label:'已更新的项目资料',icon:'folder',href:'?page=library'}]}));
    await expect(nav(page,'library')).toHaveText('已更新的项目资料');await expect(action(page)).toBeFocused();await assertIdentity(page);
    await page.evaluate(()=>window.sidebarFooterDemo.update({items:[],activeId:null}));await expect(action(page)).toBeFocused();await assertIdentity(page);await expect(page.locator('nav[aria-label="工作导航"]')).toHaveCount(1);
    await page.evaluate(()=>window.sidebarFooterDemo.setList(false));await nav(page,'settings').click();await expect(page.getByTestId('current-route')).toHaveText('settings');await assertIdentity(page);
    await expect(page.getByRole('textbox',{name:'草稿',exact:true})).toHaveValue('完整保留正在编辑的草稿');await expect(action(page)).toHaveCount(1);await expect(page.getByTestId('footer-version')).toHaveCount(1);await capture(page,info,'stable-updates');
  });

  test(`${kind} footer keyboard actions respect disabled, busy and same-tick duplicate guards`,async({page},info)=>{
    await setup(page,kind,'?collapsed=true');await nav(page,'overview').focus();await page.keyboard.press('Tab');await expect(action(page)).toBeFocused();
    expect(await action(page).evaluate(node=>node.matches(':focus-visible')&&getComputedStyle(node).outlineStyle==='solid')).toBe(true);
    await page.keyboard.press('Enter');await expect(action(page)).toBeDisabled();await expect(action(page)).toHaveAttribute('aria-busy','true');expect(await page.evaluate(()=>window.sidebarFooterDemo.snapshot().calls)).toBe(1);
    await action(page).dispatchEvent('click');await action(page).dispatchEvent('click');expect(await page.evaluate(()=>window.sidebarFooterDemo.snapshot().calls)).toBe(1);
    await page.evaluate(()=>{window.sidebarFooterDemo.finish();window.sidebarFooterDemo.setActionState({disabled:true});});await expect(action(page)).toBeDisabled();await action(page).dispatchEvent('click');expect(await page.evaluate(()=>window.sidebarFooterDemo.snapshot().calls)).toBe(1);
    await nav(page,'overview').focus();await page.keyboard.press('Tab');await expect(page.getByTestId('footer-theme')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
    await page.evaluate(()=>window.sidebarFooterDemo.setActionState({disabled:false}));await action(page).focus();await page.keyboard.press('Space');expect(await page.evaluate(()=>window.sidebarFooterDemo.snapshot().calls)).toBe(2);
    await page.evaluate(()=>window.sidebarFooterDemo.finish());await expect(action(page)).toBeEnabled();
    // React must commit the enabled DOM state before native click() can run.
    // Both clicks remain in one task to exercise the synchronous domain gate.
    await page.evaluate(()=>{const node=document.querySelector('[data-testid="footer-action"]');node.click();node.click();});expect(await page.evaluate(()=>window.sidebarFooterDemo.snapshot().calls)).toBe(3);
    await capture(page,info,'keyboard-disabled-busy');
  });

  test(`${kind} one responsive drawer keeps the exact footer nodes and restores its trigger`,async({page},info)=>{
    await setup(page,kind,'?collapsed=true');await remember(page);await page.setViewportSize({width:390,height:844});const trigger=page.locator('.xui-shell-header .xui-shell-toggle');await expect(trigger).toHaveAccessibleName('工作导航');
    for(let count=0;count<2;count++){
      await trigger.click();await expect(drawer(page)).toBeVisible();await expect(trigger).toHaveAttribute('aria-expanded','true');await expect(action(page)).toBeVisible();await assertIdentity(page);
      await expect(drawer(page).locator('.xui-shell-sidebar-footer')).toHaveCount(1);await expect(page.locator('nav[aria-label="工作导航"]')).toHaveCount(1);await expect(action(page)).toHaveAccessibleName(actionName);
      const label=await bounds(action(page).locator('.xui-sidebar-footer-label'));expect(label.width).toBeGreaterThan(80);within(await bounds(action(page)),await bounds(drawer(page)));
      await action(page).focus();await page.keyboard.press('Tab');await expect(page.getByTestId('footer-theme')).toBeFocused();await page.keyboard.press('Escape');await expect(drawer(page)).toBeHidden();await expect(trigger).toBeFocused();await expect(trigger).toHaveAttribute('aria-expanded','false');await assertIdentity(page);
    }
    await page.evaluate(()=>window.sidebarFooterDemo.update({activeId:'settings'}));await expect(nav(page,'settings')).toHaveAttribute('tabindex','0');await expect(nav(page,'overview')).toHaveAttribute('tabindex','-1');await trigger.click();await expect(nav(page,'settings')).toHaveAttribute('aria-current','page');await assertMenuTarget(page,'settings');await page.getByRole('button',{name:'关闭导航',exact:true}).focus();await page.keyboard.press('Tab');await assertMenuTarget(page,'settings');await expect(nav(page,'settings')).toHaveAttribute('aria-current','page');await nav(page,'library').click();await expect(drawer(page)).toBeHidden();await expect(trigger).toBeFocused();await expect(trigger).toHaveAttribute('aria-expanded','false');await assertIdentity(page);
    await trigger.click();await capture(page,info,'single-narrow-drawer');await page.setViewportSize({width:1280,height:800});await expect(drawer(page)).toBeHidden();await expect(action(page)).toBeVisible();await assertIdentity(page);expect((await bounds(sidebar(page))).width).toBeCloseTo(60,1);
  });

  for(const target of ['main','dialog'])test(`${kind} closing drawer does not steal the host's new ${target} focus`,async({page},info)=>{
    await setup(page,kind,'?page=settings','dark',{width:390,height:844});await page.evaluate(target=>window.sidebarFooterDemo.setHostFocus(target),target);await page.getByRole('button',{name:'工作导航',exact:true}).click();await assertMenuTarget(page,'settings');await nav(page,'library').click();await expect(drawer(page)).toBeHidden();
    const destination=page.getByTestId(target==='main'?'page-heading':'host-dialog-action');await expect(destination).toBeFocused();await settle(page);await expect(destination).toBeFocused();
    if(target==='dialog'){await expect(page.getByTestId('host-dialog')).toBeVisible();await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement.closest('[data-testid="host-dialog"]')!==null)).toBe(true);}
    await capture(page,info,`host-${target}-focus`);
  });

  test(`${kind} 200 percent Chinese text remains reachable in a narrow long-menu drawer`,async({page},info)=>{
    await setup(page,kind,'?list=long&collapsed=true','dark',{width:390,height:844});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.getByRole('button',{name:'工作导航',exact:true}).click();await expect(drawer(page)).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    within(await bounds(footer(page)),await bounds(drawer(page)));expect((await bounds(menu(page))).height).toBeGreaterThan(30);
    for(const [node,name] of [[action(page),actionName],[page.getByTestId('footer-theme'),themeName]]){await node.focus();await expect(node).toBeFocused();within(await bounds(node),await bounds(footer(page)));await expect(node).toHaveAccessibleName(name);const label=await bounds(node.locator('.xui-sidebar-footer-label'));expect(label.width).toBeGreaterThan(50);expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth+1);}
    await nav(page,'record-79').focus();within(await bounds(nav(page,'record-79')),await bounds(menu(page)));expect((await bounds(menu(page))).bottom).toBeLessThanOrEqual((await bounds(footer(page))).y+1);
    await capture(page,info,'narrow-200-percent');await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'工作导航',exact:true})).toBeFocused();
  });

  test(`${kind} iconless compact footer keeps its full visible static label`,async({page},info)=>{
    await setup(page,kind,'?collapsed=true');await page.evaluate(()=>window.sidebarFooterDemo.setFooter('plain'));const content=page.getByTestId('footer-plain'),label=content.locator('.xui-sidebar-footer-label');await expect(label).toBeVisible();await expect(label).toHaveText('无图标的完整静态状态');await expect(content.locator('.xui-sidebar-footer-icon')).toHaveCount(0);expect((await bounds(label)).width).toBeGreaterThan(1);expect(await label.evaluate(node=>getComputedStyle(node).position)).not.toBe('absolute');within(await bounds(content),await bounds(footer(page)));await capture(page,info,'compact-no-icon');
  });

  test(`${kind} slot replacement and removal are explicit and leave navigation and main usable`,async({page},info)=>{
    await setup(page,kind);await page.getByRole('textbox',{name:'草稿',exact:true}).fill('替换底部也保留');await page.evaluate(()=>window.sidebarFooterDemo.setFooter('replacement'));await expect(page.getByTestId('footer-replacement')).toHaveText('已替换底部内容');await expect(action(page)).toHaveCount(0);
    await page.evaluate(()=>window.sidebarFooterDemo.repeatFooter());await expect(page.getByTestId('footer-replacement')).toHaveCount(1);await page.evaluate(()=>window.sidebarFooterDemo.setFooter('none'));await expect(page.getByTestId('footer-replacement')).toHaveCount(0);await expect(footer(page)).toBeHidden();await nav(page,'settings').click();await expect(page.getByTestId('current-route')).toHaveText('settings');await expect(page.getByRole('textbox',{name:'草稿',exact:true})).toHaveValue('替换底部也保留');await capture(page,info,'footer-cleared');await page.evaluate(()=>window.sidebarFooterDemo.setFooter('original'));await expect(action(page)).toHaveAccessibleName(actionName);await expect(page.getByTestId('footer-version')).toHaveCount(1);await action(page).click();expect(await page.evaluate(()=>window.sidebarFooterDemo.snapshot().calls)).toBe(1);for(let count=0;count<2;count++){await page.evaluate(()=>window.sidebarFooterDemo.setFooter('none'));await expect(page.locator('.xui-shell-sidebar')).toHaveCount(1);await page.evaluate(()=>window.sidebarFooterDemo.setFooter('original'));await expect(sidebar(page)).toHaveCount(1);await expect(page.locator('.xui-shell-sidebar')).toHaveCount(1);await expect(page.locator('nav[aria-label="工作导航"]')).toHaveCount(1);}
  });
}

for(const footerKind of ['original','none'])test(`vanilla opening ${footerKind==='original'?'a footer':'a menu-only'} drawer preserves its non-first selected target`,async({page})=>{
  await setup(page,'vanilla','?collapsed=true','light',{width:390,height:844});
  if(footerKind==='none')await page.evaluate(()=>window.sidebarFooterDemo.setFooter('none'));
  // This is the public update/trigger sequence reported in Chromium. No menu
  // control has had real focus, so selection supplies the pre-open tab stop.
  await page.evaluate(()=>window.sidebarFooterDemo.update({activeId:'settings'}));
  await expect(nav(page,'settings')).toHaveAttribute('aria-current','page');await expect(nav(page,'settings')).toHaveAttribute('tabindex','0');await expect(nav(page,'overview')).toHaveAttribute('tabindex','-1');
  await page.evaluate(()=>{window.drawerMenuFocus=[];document.addEventListener('focusin',event=>{if(event.target.matches('[data-menu-control]'))window.drawerMenuFocus.push(event.target.dataset.menuId);});});
  const trigger=page.locator('.xui-shell-header .xui-shell-toggle');
  for(let count=0;count<2;count++){
    await page.evaluate(()=>{window.drawerMenuFocus=[];});await trigger.click();await expect(drawer(page)).toBeVisible();await assertMenuTarget(page,'settings');await expect(nav(page,'overview')).toHaveAttribute('tabindex','-1');
    // Even transient focus of overview corrupts roving state and can run host
    // focus handlers. A snapshot followed by refocusing is not sufficient.
    await settle(page);expect(await page.evaluate(()=>window.drawerMenuFocus)).toEqual(['settings']);
    // Tab cycles back to the same target, not whatever showModal happened to
    // focus first. Read the expected id before opening, never from the result.
    await page.getByRole('button',{name:'关闭导航',exact:true}).focus();await page.keyboard.press('Tab');await assertMenuTarget(page,'settings');
    await page.keyboard.press('Escape');await expect(drawer(page)).toBeHidden();await expect(trigger).toBeFocused();await settle(page);await expect(trigger).toBeFocused();
  }
});

test('vanilla live navigation focus takes priority over selection and survives drawer reopening',async({page})=>{
  await setup(page,'vanilla','?collapsed=true','light',{width:390,height:844});const trigger=page.locator('.xui-shell-header .xui-shell-toggle');await trigger.click();await assertMenuTarget(page,'overview');
  await page.keyboard.press('ArrowDown');await assertMenuTarget(page,'library');
  await page.evaluate(()=>window.sidebarFooterDemo.update({activeId:'settings'}));
  await expect(nav(page,'settings')).toHaveAttribute('aria-current','page');await expect(nav(page,'settings')).toHaveAttribute('tabindex','-1');await assertMenuTarget(page,'library');
  for(let count=0;count<2;count++){
    await page.keyboard.press('Escape');await expect(drawer(page)).toBeHidden();await expect(trigger).toBeFocused();await expect(nav(page,'library')).toHaveAttribute('tabindex','0');
    await trigger.click();await expect(drawer(page)).toBeVisible();await assertMenuTarget(page,'library');await expect(nav(page,'settings')).toHaveAttribute('aria-current','page');await expect(nav(page,'settings')).toHaveAttribute('tabindex','-1');
  }
  await page.getByRole('button',{name:'关闭导航',exact:true}).click();await expect(drawer(page)).toBeHidden();await expect(trigger).toBeFocused();
});

test('vanilla an initially empty drawer focuses its close fallback and restores the trigger',async({page})=>{
  await setup(page,'vanilla','?collapsed=true','light',{width:390,height:844});await page.evaluate(()=>window.sidebarFooterDemo.update({items:[],activeId:null}));const trigger=page.locator('.xui-shell-header .xui-shell-toggle');
  for(let count=0;count<2;count++){
    await trigger.click();await expect(drawer(page)).toBeVisible();await expect(roving(page)).toHaveCount(0);await expect(action(page)).toBeVisible();
    const close=page.getByRole('button',{name:'关闭导航',exact:true});await expect(close).toBeFocused();await page.keyboard.press('Tab');await expect(action(page)).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(close).toBeFocused();
    await close.click();await expect(drawer(page)).toBeHidden();await expect(trigger).toBeFocused();
  }
});

test('vanilla reopening a long drawer keeps the focused first item visible instead of scrolling to selection',async({page})=>{
  await setup(page,'vanilla','?list=long&collapsed=true','light',{width:390,height:844});const trigger=page.locator('.xui-shell-header .xui-shell-toggle');await trigger.click();await assertMenuTarget(page,'record-79');
  await page.keyboard.press('Home');await assertMenuTarget(page,'record-0');await expect(nav(page,'record-79')).toHaveAttribute('aria-current','page');within(await bounds(nav(page,'record-0')),await bounds(menu(page)));
  for(let count=0;count<2;count++){
    await page.keyboard.press('Escape');await expect(drawer(page)).toBeHidden();await expect(trigger).toBeFocused();await expect(nav(page,'record-0')).toHaveAttribute('tabindex','0');
    await trigger.click();await expect(drawer(page)).toBeVisible();await assertMenuTarget(page,'record-0');await expect(nav(page,'record-79')).toHaveAttribute('aria-current','page');
    await settle(page);await assertMenuTarget(page,'record-0');within(await bounds(nav(page,'record-0')),await bounds(menu(page)));
  }
});

test('direct React AppShell consumes the same public footer on desktop and mobile',async({page},info)=>{
  await setup(page,'react','?composition=shell&collapsed=true','system');await expect(action(page)).toBeVisible();expect((await bounds(sidebar(page))).width).toBeCloseTo(60,1);await remember(page);await action(page).focus();await page.evaluate(()=>window.sidebarFooterDemo.update({activeId:'library'}));await expect(action(page)).toBeFocused();await assertIdentity(page);
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'工作导航',exact:true}).click();await expect(action(page)).toBeVisible();await assertIdentity(page);await expect(page.locator('nav[aria-label="工作导航"]')).toHaveCount(1);await capture(page,info,'direct-app-shell');
});
