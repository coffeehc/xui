import {test as base,expect} from '@playwright/test';

// Error collection never changes the page's handlers or suppresses its output.
// Record all console errors, uncaught page errors and serious React warnings.
const test=base.extend({page:async({page},use,info)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push({kind:'pageerror',message:error.message,stack:error.stack}));
  page.on('console',message=>{
    if(message.type()==='error'||message.type()==='warning'&&/hydrat|uncaught|invalid hook|cannot update|not wrapped in act|does not match|did not match/i.test(message.text()))errors.push({kind:`console.${message.type()}`,message:message.text(),location:message.location()});
  });
  await use(page);
  await info.attach('browser-errors.json',{body:JSON.stringify(errors,null,2),contentType:'application/json'});
  expect(errors,'fixture must not emit page errors, console errors or hydration warnings').toEqual([]);
}});

// These routes are produced by scripts/consumers.mjs from independently installed
// package tarballs. No test imports source CSS or repairs a fixture's layout.
const kinds=['react'];
const navItem=(page,id)=>page.locator(`[data-menu-id="${id}"][data-menu-control="primary"]`);
const bounds=node=>node.evaluate(element=>{
  const rect=element.getBoundingClientRect(),style=getComputedStyle(element);
  return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,right:rect.right,bottom:rect.bottom,
    clientWidth:element.clientWidth,scrollWidth:element.scrollWidth,fontSize:style.fontSize,lineHeight:style.lineHeight,fontWeight:style.fontWeight};
});
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
async function finishMotion(page){
  // Wait for actual finite component transitions, without disabling normal motion.
  await settle(page);await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(animation=>animation.effect?.getComputedTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{})));});await settle(page);
}
async function setup(page,kind,query='',mode='light',viewport={width:1280,height:800}){
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
  await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);
  await page.goto(`/layout-typography-${kind}/${query}`);
  await page.waitForFunction(()=>!!window.layoutTypography);await settle(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);
}
async function capture(page,info,name){
  const metrics=await page.evaluate(()=>{
    const measure=element=>{const r=element.getBoundingClientRect(),s=getComputedStyle(element);return {className:element.className,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,clientWidth:element.clientWidth,scrollWidth:element.scrollWidth,clientHeight:element.clientHeight,scrollHeight:element.scrollHeight,fontSize:s.fontSize,lineHeight:s.lineHeight,fontWeight:s.fontWeight};};
    return {viewport:{width:innerWidth,height:innerHeight,devicePixelRatio},theme:{mode:document.documentElement.dataset.theme,effective:document.documentElement.dataset.themeEffective},rootFontSize:getComputedStyle(document.documentElement).fontSize,documentWidth:document.documentElement.scrollWidth,
      regions:[...document.querySelectorAll('.xui-shell-header,.xui-app-header-primary,.xui-app-header-secondary,.xui-app-header-brand,.xui-app-header-breadcrumb,.xui-app-header-status,.xui-app-header-actions,.xui-shell-sidebar,.xui-shell-main')].map(measure),
      controls:[...document.querySelectorAll('.xui-nav-item,.xui-shell-header button,.xui-field>*,.xui-menu-item')].filter(element=>element.getClientRects().length).map(measure)};
  });
  await info.attach(`${name}-css-pixels.json`,{body:JSON.stringify(metrics,null,2),contentType:'application/json'});
  const path=info.outputPath(`${name}.png`);await page.screenshot({path,animations:'disabled'});await info.attach(`${name}.png`,{path,contentType:'image/png'});
  return metrics;
}
function contained(inner,outer){expect(inner.x).toBeGreaterThanOrEqual(outer.x-1);expect(inner.right).toBeLessThanOrEqual(outer.right+1);expect(inner.y).toBeGreaterThanOrEqual(outer.y-1);expect(inner.bottom).toBeLessThanOrEqual(outer.bottom+1);}
function separated(a,b){return a.right<=b.x+1||b.right<=a.x+1||a.bottom<=b.y+1||b.bottom<=a.y+1;}
async function assertHeader(page,selector='.xui-shell-header'){
  const header=await bounds(page.locator(selector));
  const slots=[];
  for(const role of ['brand','breadcrumb','status','actions']){
    const node=page.locator(`.xui-app-header-${role}`);await expect(node).toBeVisible();const box=await bounds(node);contained(box,header);
    expect(box.scrollWidth,`${role} must wrap instead of overflowing`).toBeLessThanOrEqual(box.clientWidth+1);slots.push(box);
  }
  for(let a=0;a<slots.length;a++)for(let b=a+1;b<slots.length;b++)expect(separated(slots[a],slots[b]),`header slots ${a}/${b} overlap`).toBe(true);
  for(const label of ['保存草稿','导出数据','帮助中心']){const action=page.getByRole('button',{name:label,exact:true});await expect(action).toBeVisible();contained(await bounds(action),header);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth+1));
}

for(const kind of kinds){
  for(const mode of ['light','dark','system'])for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
    test(`${kind} header roles: ${mode}, ${viewport.width}px, normal and 200% text`,async({page},info)=>{
      await setup(page,kind,'',mode,viewport);
      for(const scale of [1,2]){
        await page.evaluate(scale=>{document.documentElement.style.fontSize=`${scale*100}%`;window.scrollTo(0,0);},scale);await settle(page);
        await capture(page,info,`header-${mode}-${viewport.width}-text-${scale*100}`);await assertHeader(page);
        const header=await bounds(page.locator('.xui-shell-header'));expect(header.height).toBeLessThan(viewport.height);
        if(viewport.width===390){
          const primary=await bounds(page.locator('.xui-app-header-primary')),brand=await bounds(page.locator('.xui-app-header-brand')),breadcrumb=await bounds(page.locator('.xui-app-header-breadcrumb'));
          expect(breadcrumb.width).toBeCloseTo(primary.width,1);expect(breadcrumb.y).toBeGreaterThanOrEqual(brand.bottom);
        }
        if(viewport.width===390&&scale===2){
          // At this size each action wraps to its own row. A public Toolbar
          // wrapper must preserve the same end alignment as direct React parts.
          const end=(await bounds(page.locator('.xui-app-header-actions'))).right;
          const rows=[];for(const name of ['保存草稿','导出数据','帮助中心']){const action=await bounds(page.getByRole('button',{name,exact:true}));expect(action.right).toBeCloseTo(end,1);rows.push(action);}
          for(let index=1;index<rows.length;index++)expect(rows[index].y).toBeGreaterThanOrEqual(rows[index-1].bottom);
        }
      }
      if(mode==='system'){
        await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
        await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');
        expect(await page.evaluate(()=>window.xuiTheme.getState().mode)).toBe('system');
      }
    });
  }
  test(`${kind} header updates retain content, focus, navigation and action identity`,async({page},info)=>{
    await setup(page,kind);const input=page.getByRole('textbox',{name:/项目名称/});await input.fill('尚未保存的输入');await input.focus();
    await page.evaluate(()=>{window.fixtureIdentity={main:document.querySelector('main'),input:document.querySelector('#fixture-draft'),action:[...document.querySelectorAll('.xui-app-header-actions button')][0],menu:document.querySelector('.xui-navigation-menu'),brand:document.querySelector('[data-testid="header-brand"]')};window.layoutTypography.updateHeader('updated');});
    await expect(page.getByTestId('header-status')).toHaveText('已更新当前项目（演示）');await expect(input).toBeFocused();await expect(input).toHaveValue('尚未保存的输入');
    expect(await page.evaluate(()=>{const before=window.fixtureIdentity;return before.main===document.querySelector('main')&&before.input===document.querySelector('#fixture-draft')&&before.action===document.querySelector('.xui-app-header-actions button')&&before.menu===document.querySelector('.xui-navigation-menu')&&before.brand===document.querySelector('[data-testid="header-brand"]');})).toBe(true);
    await page.evaluate(()=>window.layoutTypography.navigate('settings'));await expect(navItem(page,'settings')).toHaveAttribute('aria-current','page');await expect(input).toHaveValue('尚未保存的输入');
    await page.getByRole('button',{name:'保存草稿',exact:true}).click();await expect(page.getByTestId('action-count')).toHaveText('已执行 1 次操作');
    for(const header of ['no-actions','legacy','fallback','empty-brand','full']){
      await page.evaluate(header=>window.layoutTypography.updateHeader(header),header);await settle(page);
      if(header==='no-actions'){await expect(page.locator('.xui-app-header-actions button')).toHaveCount(0);await expect(page.getByTestId('header-status')).toBeVisible();}
      if(header==='legacy'){await expect(page.getByTestId('legacy-header')).toBeVisible();await expect(page.locator('.xui-shell-header')).toContainText('后备品牌标题');}
      if(header==='fallback')await expect(page.locator('.xui-app-header-brand')).toHaveText('后备品牌标题');
      if(header==='empty-brand')await expect(page.locator('.xui-shell-header')).not.toContainText('后备品牌标题');
      await expect(input).toHaveValue('尚未保存的输入');await capture(page,info,`header-${header}`);
    }
  });
  test(`${kind} exactly three compact links use 60px rail, symmetric 12px insets and stable normal-motion toggling`,async({page},info)=>{
    await setup(page,kind,'?collapsed=true&noReveal');await page.emulateMedia({reducedMotion:'no-preference'});await finishMotion(page);const sidebar=page.locator('.xui-shell-sidebar'),links=page.locator('.xui-navigation-menu [data-menu-control="primary"]');await expect(links).toHaveCount(3);
    for(let iteration=0;iteration<3;iteration++){
      const rail=await bounds(sidebar);expect(rail.width).toBeCloseTo(60,1);
      const rects=[];for(const link of await links.all()){
        const item=await bounds(link);rects.push(item);expect(item.width).toBeCloseTo(36,1);expect(item.height).toBeCloseTo(36,1);expect(item.x-rail.x).toBeCloseTo(12,1);expect(rail.right-item.right).toBeCloseTo(12,1);
        const icon=await bounds(link.locator('svg'));expect(icon.width).toBeCloseTo(16,1);expect(icon.height).toBeCloseTo(16,1);expect(icon.x-item.x).toBeCloseTo(10,1);
      }
      expect(rects[1].y-rects[0].bottom).toBeCloseTo(4,1);expect(rects[2].y-rects[1].bottom).toBeCloseTo(4,1);expect(rail.scrollWidth).toBeLessThanOrEqual(rail.clientWidth);
      await page.getByRole('button',{name:'展开导航',exact:true}).click();await expect(page.locator('.xui-menu-layout')).toHaveAttribute('data-collapsed','false');await finishMotion(page);expect((await bounds(sidebar)).width).toBeCloseTo(204.8,1);
      const label=links.nth(1).locator('.xui-menu-label');expect(await label.evaluate(node=>getComputedStyle(node).whiteSpace)).not.toBe('nowrap');
      await page.getByRole('button',{name:'紧凑导航',exact:true}).click();await expect(page.locator('.xui-menu-layout')).toHaveAttribute('data-collapsed','true');await finishMotion(page);
    }
    expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
    expect(await page.locator('.xui-menu-layout').evaluate(node=>getComputedStyle(node).transitionDuration.split(',').some(value=>parseFloat(value)>0))).toBe(true);
    await capture(page,info,'three-link-compact');
  });
  test(`${kind} compact linked branch puts its toggle below the link without widening rail`,async({page},info)=>{
    await setup(page,kind,'?collapsed=true&list=branch&noReveal');const link=navItem(page,'library'),toggle=page.locator('[data-menu-id="library"][data-menu-control="toggle"]');
    for(const expanded of ['true','false','true']){
      await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded',expanded);await settle(page);
      const rail=await bounds(page.locator('.xui-shell-sidebar')),primary=await bounds(link),branch=await bounds(toggle);expect(rail.width).toBeCloseTo(60,1);contained(branch,rail);expect(branch.y).toBeGreaterThanOrEqual(primary.bottom-1);expect(rail.scrollWidth).toBeLessThanOrEqual(rail.clientWidth);
      if(expanded==='true'){const child=await bounds(navItem(page,'notes'));expect(child.width).toBeCloseTo(36,1);expect(child.x-rail.x).toBeCloseTo(12,1);}
    }
    await capture(page,info,'compact-linked-branch');
  });
  test(`${kind} selected indicator survives hover and keyboard focus without moving compact icons`,async({page},info)=>{
    await setup(page,kind,'?collapsed=true&noReveal','dark');const selected=navItem(page,'overview'),other=navItem(page,'library');
    const appearance=locator=>locator.evaluate(node=>{const s=getComputedStyle(node),i=getComputedStyle(node,'::before'),r=node.getBoundingClientRect();return {background:s.backgroundColor,color:s.color,border:s.borderWidth,indicator:{opacity:i.opacity,width:i.width,height:i.height,left:i.left,color:i.backgroundColor},x:r.x,width:r.width};});
    await page.mouse.move(1200,760);const initial=await appearance(selected);expect(initial.indicator).toMatchObject({opacity:'1',width:'2px',height:'16px',left:'2px'});expect(initial.border).toBe('0px');
    await selected.hover();expect(await appearance(selected)).toEqual(initial);await other.hover();expect((await appearance(other)).indicator.opacity).toBe('0');
    await page.getByRole('button',{name:'展开导航',exact:true}).focus();
    // The single toggle is now in the header. Follow its ordinary links/actions
    // before entering the sidebar's one roving tab stop.
    for(let step=0;step<8&&!await selected.evaluate(node=>node===document.activeElement);step++)await page.keyboard.press('Tab');await expect(selected).toBeFocused();
    expect(await selected.evaluate(node=>node.matches(':focus-visible')&&getComputedStyle(node).outlineStyle==='none')).toBe(true);expect(await appearance(selected)).toEqual(initial);
    await page.keyboard.press('ArrowDown');await expect(other).toBeFocused();await expect(selected).toHaveAttribute('aria-current','page');await capture(page,info,'compact-keyboard-focus');
  });
  test(`${kind} viewport mode independently scrolls long menu and content with current item visible`,async({page},info)=>{
    await setup(page,kind,'?list=long&scroll=viewport');const sidebar=page.locator('.xui-shell-sidebar'),main=page.locator('.xui-shell-main');
    const rail=await bounds(sidebar),current=await bounds(navItem(page,'record-79'));contained(current,rail);
    const before=await page.evaluate(()=>({sidebar:document.querySelector('.xui-shell-sidebar').scrollTop,main:document.querySelector('main').scrollTop,document:scrollY}));expect(before.sidebar).toBeGreaterThan(0);expect(before.main).toBe(0);expect(before.document).toBe(0);
    for(const [index,label] of ['紧凑导航','展开导航'].entries()){
      // Clicking the top toggle may scroll it into view; the layout must restore
      // the far-below current item after either density change, not just item0.
      await page.getByRole('button',{name:label,exact:true}).click();await settle(page);contained(await bounds(navItem(page,'record-79')),await bounds(sidebar));expect(await main.evaluate(node=>node.scrollTop)).toBe(0);expect(await page.evaluate(()=>scrollY)).toBe(0);await capture(page,info,`long-current-79-cycle-${index}`);
    }
    const sidebarBeforeMainScroll=await sidebar.evaluate(node=>node.scrollTop);
    await main.evaluate(node=>{node.scrollTop=500;});expect(await sidebar.evaluate(node=>node.scrollTop)).toBe(sidebarBeforeMainScroll);expect(await page.evaluate(()=>scrollY)).toBe(0);
    await page.evaluate(()=>window.layoutTypography.navigate('record-0'));await expect(navItem(page,'record-0')).toHaveAttribute('aria-current','page');await settle(page);
    contained(await bounds(navItem(page,'record-0')),await bounds(sidebar));expect(await main.evaluate(node=>node.scrollTop)).toBe(500);
    for(const label of ['紧凑导航','展开导航','紧凑导航','展开导航']){await page.getByRole('button',{name:label,exact:true}).click();await settle(page);expect(await main.evaluate(node=>node.scrollTop)).toBe(500);}
    await capture(page,info,'long-independent-scroll');
  });
  test(`${kind} narrow compact drawer exposes complete labels and restores keyboard focus`,async({page},info)=>{
    await setup(page,kind,'?collapsed=true','dark',{width:390,height:844});const trigger=page.getByRole('button',{name:'工作导航',exact:true});
    for(let iteration=0;iteration<2;iteration++){
      await trigger.click();const drawer=page.getByRole('dialog');await expect(drawer).toBeVisible();const link=navItem(page,'library'),label=link.locator('.xui-menu-label');await expect(label).toBeVisible();
      const text=await bounds(label);expect(text.width).toBeGreaterThan(100);expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth+1);expect(await label.evaluate(node=>getComputedStyle(node).whiteSpace)).not.toBe('nowrap');
      contained(await bounds(link),await bounds(drawer));await capture(page,info,`narrow-drawer-${iteration}`);await page.keyboard.press('Escape');await expect(drawer).toBeHidden();await expect(trigger).toBeFocused();
    }
    await trigger.click();await navItem(page,'settings').click();await expect(page.getByRole('dialog')).toBeHidden();await trigger.click();await expect(navItem(page,'settings')).toHaveAttribute('aria-current','page');
  });
  test(`${kind} menu, checkbox, radio, submenu and context text use 13/20/500 with explicit 16px icons`,async({page},info)=>{
    await setup(page,kind);const typography=async ids=>{for(const id of ids){const node=page.getByTestId(id);await expect(node).toBeVisible();expect(await bounds(node)).toMatchObject({fontSize:'13px',lineHeight:'20px',fontWeight:'500'});const icon=await bounds(node.locator('[data-menu-symbol]'));expect(icon.width).toBeCloseTo(16,1);expect(icon.height).toBeCloseTo(16,1);}};
    await page.getByRole('button',{name:'打开操作菜单',exact:true}).click();await typography(['ordinary-item','link-item','link-default-item','checkbox-item','radio-item','submenu-trigger']);expect(await bounds(page.getByTestId('ordinary-popup'))).toMatchObject({fontSize:'14px',lineHeight:'22px',fontWeight:'400'});
    expect((await bounds(page.getByTestId('illustration-item').locator('[data-illustration]'))).width).toBeCloseTo(24,1);await capture(page,info,'menu-typography');
    const more=page.getByTestId('submenu-trigger');await more.focus();await more.press('ArrowRight');await typography(['submenu-item']);await expect(page.getByTestId('submenu-item')).toBeFocused();await capture(page,info,'submenu-typography');await page.keyboard.press('Escape');await expect(more).toBeFocused();await page.keyboard.press('Escape');
    const context=page.getByTestId('context-trigger');await context.focus();await context.press('Shift+F10');await typography(['context-item','context-checkbox-item','context-radio-item','context-submenu-trigger']);await capture(page,info,'context-typography');
    const contextMore=page.getByTestId('context-submenu-trigger');await contextMore.focus();await contextMore.press('ArrowRight');await typography(['context-submenu-item']);await capture(page,info,'context-submenu-typography');await page.keyboard.press('Escape');await page.keyboard.press('Escape');await expect(context).toBeFocused();
    await page.getByRole('button',{name:'打开操作菜单',exact:true}).click();
    // Hash navigation proves the peer LinkItem remains an anchor while keeping
    // the menu open; the route link opts into closeOnClick explicitly.
    const defaultLink=page.getByTestId('link-default-item');await expect(defaultLink).toHaveAttribute('href','#menu-link-default');await defaultLink.click();await expect(page).toHaveURL(/#menu-link-default$/);await expect(page.getByTestId('ordinary-popup')).toBeVisible();
    const link=page.getByTestId('link-item');await expect(link).toHaveAttribute('href','#menu-link');await link.click();await expect(page).toHaveURL(/#menu-link$/);await expect(page.getByTestId('ordinary-popup')).toBeHidden();
  });
  test(`${kind} field labels use 13/20/500, preserve 8/4/4px gaps and accessible choice hit areas`,async({page},info)=>{
    await setup(page,kind);const field=page.getByTestId('field'),label=field.locator('.xui-label'),input=field.locator('input'),help=field.locator('.xui-help'),error=field.locator('.xui-error');
    const [l,i,h,e]=await Promise.all([label,input,help,error].map(bounds));expect(l).toMatchObject({fontSize:'13px',lineHeight:'20px',fontWeight:'500'});expect(i.y-l.bottom).toBeCloseTo(8,1);expect(h.y-i.bottom).toBeCloseTo(4,1);expect(e.y-h.bottom).toBeCloseTo(4,1);
    const id=await input.getAttribute('id');await expect(label).toHaveAttribute('for',id);await expect(input).toHaveAttribute('aria-invalid','true');await expect(input).toHaveAttribute('required','');
    const description=(await input.getAttribute('aria-describedby')).split(/\s+/);expect(description).toEqual([await help.getAttribute('id'),await error.getAttribute('id')]);
    await label.click();await expect(input).toBeFocused();expect(await input.evaluate(node=>getComputedStyle(node).outlineStyle)).toBe('none');
    expect(await bounds(page.locator('legend.xui-label'))).toMatchObject({fontSize:'13px',lineHeight:'20px',fontWeight:'500'});
    for(const type of ['checkbox','radio','switch']){const text=page.getByTestId(`${type}-label-text`),choice=text.locator('..').locator('input');const hit=await bounds(text.locator('..'));expect(hit.height).toBeGreaterThanOrEqual(36);await expect(choice).not.toBeChecked();await text.click();await expect(choice).toBeChecked();}
    await capture(page,info,'field-spacing-and-choice-labels');
  });
}

test('React AppHeader and AppShell expose the same role composition without consumer layout CSS',async({page},info)=>{
  for(const composition of ['header','shell'])for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
    await setup(page,'react',`?composition=${composition}`,'dark',viewport);await assertHeader(page,composition==='header'?'.xui-app-header':'.xui-shell-header');
    await expect(page.getByTestId('header-brand')).toBeVisible();await expect(page.getByTestId('header-status')).toBeVisible();
    if(composition==='header'){await expect(page.getByTestId('legacy-header')).toBeVisible();await expect(page.getByRole('button',{name:'独立导航',exact:true})).toBeVisible();}
    await capture(page,info,`direct-${composition}-${viewport.width}`);
  }
});

for(const kind of kinds)test(`${kind} breadcrumb keyboard focus stays inside its clipping wrapper`,async({page},info)=>{
  await setup(page,kind,'','light',{width:390,height:844});
  await page.getByRole('button',{name:'工作导航',exact:true}).focus();await page.keyboard.press('Tab');const breadcrumb=page.getByRole('link',{name:'团队项目与知识资料',exact:true});await expect(breadcrumb).toBeFocused();
  const focus=await breadcrumb.evaluate(node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect(),wrapper=node.closest('.xui-app-header-breadcrumb').getBoundingClientRect();return {visible:node.matches(':focus-visible'),style:s.outlineStyle,width:parseFloat(s.outlineWidth),offset:parseFloat(s.outlineOffset),rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height},wrapper:{left:wrapper.left,top:wrapper.top,right:wrapper.right,bottom:wrapper.bottom}};});
  expect(focus.visible).toBe(true);expect(focus.style).toBe('none');expect(focus.width).toBe(0);expect(focus.offset).toBeLessThan(0);
  expect(focus.rect.width).toBeGreaterThan(0);expect(focus.rect.height).toBeGreaterThan(0);expect(focus.rect.left).toBeGreaterThanOrEqual(focus.wrapper.left-1);expect(focus.rect.right).toBeLessThanOrEqual(focus.wrapper.right+1);expect(focus.rect.top).toBeGreaterThanOrEqual(focus.wrapper.top-1);expect(focus.rect.bottom).toBeLessThanOrEqual(focus.wrapper.bottom+1);
  await capture(page,info,'header-keyboard-focus');
});
