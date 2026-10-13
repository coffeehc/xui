import {test as base,expect} from '@playwright/test';

// Both routes are built by test:consumer from independently installed tarballs.
// The fixture supplies only its own conversation/inspector layout. These tests
// never patch an xui child, infer a header height, or position a fixed composer.
const test=base.extend({page:async({page},use,info)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push({kind:'pageerror',message:error.message}));
  page.on('console',message=>{
    if(message.type()==='error'||message.type()==='warning'&&/hydrat|uncaught|invalid hook|cannot update|does not match|did not match/i.test(message.text()))errors.push({kind:`console.${message.type()}`,message:message.text(),location:message.location()});
  });
  await use(page);
  await info.attach('browser-errors.json',{body:JSON.stringify(errors,null,2),contentType:'application/json'});
  expect(errors,'no browser errors or hydration warnings').toEqual([]);
}});
const kinds=['react','vanilla'];
const viewports=[{width:1280,height:844},{width:390,height:844}];
const themes=['light','dark','system'];
const selectors={shell:'.xui-shell',header:'.xui-shell-header',main:'.xui-shell-main',content:'.xui-shell-content',workspace:'[data-testid="workspace"]',history:'[data-testid="history"]',inspector:'[data-testid="inspector"]',composer:'form[aria-label="Composer"]',draft:'input[aria-label="Message draft"]',sidebar:'.xui-shell-sidebar',navigation:'nav[aria-label="Workspace navigation"]'};
const draft=page=>page.getByRole('textbox',{name:'Message draft',exact:true});
const send=page=>page.getByRole('button',{name:'Send message',exact:true});
const navToggle=page=>page.locator('.xui-shell-header [data-xui-menu-toggle]');
const near=(actual,expected,label)=>expect(Math.abs(actual-expected),`${label}: ${actual} vs ${expected} CSS px`).toBeLessThanOrEqual(1);
function contained(inner,outer,label){
  expect(inner.width,`${label} has nonzero width`).toBeGreaterThan(0);expect(inner.height,`${label} has nonzero height`).toBeGreaterThan(0);
  expect(inner.x,`${label} left`).toBeGreaterThanOrEqual(outer.x-1);expect(inner.right,`${label} right`).toBeLessThanOrEqual(outer.right+1);
  expect(inner.y,`${label} top`).toBeGreaterThanOrEqual(outer.y-1);expect(inner.bottom,`${label} bottom`).toBeLessThanOrEqual(outer.bottom+1);
}
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
async function finishMotion(page){
  await settle(page);
  await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(animation=>animation.effect?.getComputedTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{})));});
  await settle(page);
}
async function settledScroll(locator){
  return locator.evaluate(async node=>{
    let previous=node.scrollTop,stable=0;
    for(let frame=0;frame<180&&stable<5;frame++){
      await new Promise(resolve=>requestAnimationFrame(resolve));const next=node.scrollTop;
      stable=next===previous?stable+1:0;previous=next;
    }
    return node.scrollTop;
  });
}
async function setup(page,kind,{query='',theme='light',viewport=viewports[0],motion='reduce'}={}){
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:motion});
  await page.addInitScript(theme=>localStorage.setItem('ui.theme.mode',theme),theme);
  await page.goto(`/workspace-${kind}/${query}`);await page.waitForFunction(()=>!!window.workspaceDemo);await settle(page);
  await expect(page.locator('.xui-shell')).toHaveAttribute('data-scroll-mode','workspace');
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  await expect(page.locator('html')).toHaveAttribute('data-theme-effective',theme==='system'?'dark':theme);
  await expect(draft(page)).toHaveValue('Keep my draft');
}
async function metrics(page){
  return page.evaluate(selectors=>{
    const measure=node=>{
      if(!node||!node.getClientRects().length)return null;
      const r=node.getBoundingClientRect(),s=getComputedStyle(node);
      return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,
        clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,clientHeight:node.clientHeight,scrollHeight:node.scrollHeight,scrollTop:node.scrollTop,scrollLeft:node.scrollLeft,
        display:s.display,position:s.position,overflowY:s.overflowY,flexDirection:s.flexDirection,flexShrink:s.flexShrink,flexGrow:s.flexGrow,minBlockSize:s.minBlockSize,
        paddingTop:parseFloat(s.paddingTop),paddingBottom:parseFloat(s.paddingBottom),borderTop:parseFloat(s.borderTopWidth),borderBottom:parseFloat(s.borderBottomWidth),
        marginTop:parseFloat(s.marginTop),marginBottom:parseFloat(s.marginBottom),rowGap:parseFloat(s.rowGap)||0};
    };
    const root=document.scrollingElement;
    return {viewport:{x:0,y:0,right:innerWidth,bottom:innerHeight,width:innerWidth,height:innerHeight},document:{scrollWidth:root.scrollWidth,clientWidth:root.clientWidth,scrollHeight:root.scrollHeight,clientHeight:root.clientHeight,scrollTop:root.scrollTop,scrollLeft:root.scrollLeft},
      ...Object.fromEntries(Object.entries(selectors).map(([name,selector])=>[name,measure(document.querySelector(selector))])),
      slots:[...document.querySelectorAll('.xui-shell-main > .xui-shell-page-header,.xui-shell-main > .xui-shell-page-toolbar,.xui-shell-main > .xui-shell-page-footer')].map(measure).filter(Boolean)};
  },selectors);
}
async function assertWorkspace(page,{slots=true,long=true,shellHeight}={}){
  await settle(page);const m=await metrics(page);
  near(m.shell.height,shellHeight??m.viewport.height,'root block size');near(m.main.y,m.header.bottom,'main follows naturally measured app header');near(m.main.bottom,m.shell.bottom,'main reaches root end');
  expect(m.document.scrollWidth,'document horizontal overflow').toBeLessThanOrEqual(m.document.clientWidth+1);
  expect(m.document.scrollHeight,'document must not own workspace scrolling').toBeLessThanOrEqual(m.document.clientHeight+1);
  expect(m.document.scrollTop).toBe(0);expect(m.document.scrollLeft).toBe(0);
  expect(m.main.display).toBe('flex');expect(m.main.flexDirection).toBe('column');expect(m.content.flexGrow).toBe('1');expect(m.content.minBlockSize).toBe('0px');
  expect(m.slots).toHaveLength(slots?3:0);
  const chrome=m.slots.reduce((sum,slot)=>sum+slot.height+slot.marginTop+slot.marginBottom,0);
  const remaining=m.main.height-m.main.paddingTop-m.main.paddingBottom-m.main.borderTop-m.main.borderBottom-chrome-m.main.rowGap*m.slots.length;
  near(m.content.height,remaining,'content receives the remaining definite height');near(m.workspace.height,m.content.clientHeight,'100% host workspace resolves against content');
  for(const [name,region] of [['main',m.main],['content',m.content],['workspace',m.workspace]]){
    expect(region.scrollHeight,`${name} has no competing vertical scroll range`).toBeLessThanOrEqual(region.clientHeight+1);
    expect(region.scrollWidth,`${name} has no horizontal overflow`).toBeLessThanOrEqual(region.clientWidth+1);
    expect(region.scrollTop,`${name} stays at its origin`).toBe(0);
  }
  for(const slot of m.slots){expect(slot.flexShrink,'page chrome keeps natural height').toBe('0');expect(['fixed','absolute']).not.toContain(slot.position);contained(slot,m.main,'page slot');}
  if(slots){
    await expect(page.getByRole('heading',{name:'Page title',exact:true})).toBeVisible();await expect(page.getByText('Page tools',{exact:true})).toBeVisible();await expect(page.getByText('Page footer',{exact:true})).toBeVisible();
    expect(m.slots[0].bottom).toBeLessThanOrEqual(m.slots[1].y+1);expect(m.slots[1].bottom).toBeLessThanOrEqual(m.content.y+1);expect(m.content.bottom).toBeLessThanOrEqual(m.slots[2].y+1);
  }
  contained(m.workspace,m.main,'workspace');contained(m.composer,m.workspace,'composer');contained(m.composer,m.viewport,'first-screen composer');contained(m.draft,m.composer,'draft');
  expect(['fixed','absolute','sticky']).not.toContain(m.composer.position);
  expect(m.history.overflowY).toBe('auto');expect(m.inspector.overflowY).toBe('auto');
  expect(m.history.height).toBeGreaterThan(0);expect(m.history.bottom).toBeLessThanOrEqual(m.composer.y+1);contained(m.inspector,m.workspace,'business inspector');
  expect(m.history.right).toBeLessThanOrEqual(m.inspector.x+1);
  if(long){expect(m.history.scrollHeight).toBeGreaterThan(m.history.clientHeight);expect(m.inspector.scrollHeight).toBeGreaterThan(m.inspector.clientHeight);}
  else {expect(m.history.scrollHeight).toBeLessThanOrEqual(m.history.clientHeight+1);expect(m.inspector.scrollHeight).toBeLessThanOrEqual(m.inspector.clientHeight+1);}
  await expect(draft(page)).toBeInViewport({ratio:1});await expect(send(page)).toBeInViewport({ratio:1});await expect(send(page)).toBeEnabled();
  return m;
}
async function capture(page,info,name){
  await info.attach(`${name}-css-pixels.json`,{body:JSON.stringify(await metrics(page),null,2),contentType:'application/json'});
  const path=info.outputPath(`${name}.png`);await page.screenshot({path,animations:'disabled'});await info.attach(`${name}.png`,{path,contentType:'image/png'});
}
async function retainNodes(page){await page.evaluate(selectors=>{window.workspaceNodes=Object.fromEntries(Object.entries(selectors).map(([name,selector])=>[name,document.querySelector(selector)]));},selectors);}
async function assertRetained(page){expect(await page.evaluate(selectors=>Object.entries(window.workspaceNodes).filter(([,node])=>node).every(([name,node])=>node.isConnected&&node===document.querySelector(selectors[name])),selectors),'shell, content, business controls and the sole navigation retain DOM identity').toBe(true);}
async function assertInternalScrolling(page,options={}){
  const before=await assertWorkspace(page,options),history=page.getByTestId('history'),inspector=page.getByTestId('inspector');
  await history.evaluate(node=>{node.scrollTop=0;});await inspector.evaluate(node=>{node.scrollTop=0;});
  await history.hover();await page.mouse.wheel(0,260);await expect.poll(()=>history.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);
  expect(await inspector.evaluate(node=>node.scrollTop),'history wheel must not scroll the other business pane').toBe(0);
  const historyTop=await settledScroll(history);
  await inspector.hover();await page.mouse.wheel(0,220);await expect.poll(()=>inspector.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);
  await settledScroll(inspector);
  expect(await history.evaluate(node=>node.scrollTop)).toBe(historyTop);
  const after=await assertWorkspace(page,options);near(after.composer.y,before.composer.y,'composer stays still while panes scroll');near(after.content.y,before.content.y,'content stays still while panes scroll');
  await history.evaluate(node=>{node.scrollTop=0;});await history.focus();await page.keyboard.press('PageDown');await expect.poll(()=>history.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);
  await settledScroll(history);await expect(history).toBeFocused();await assertWorkspace(page,options);
}
async function assertKeyboardSend(page){
  const input=draft(page),button=send(page);await input.fill('Unsent workspace draft');await input.focus();await page.keyboard.press('Tab');await expect(button).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.getByTestId('inspector').getByText('Sent: 1',{exact:true})).toHaveCount(1);await expect(input).toHaveValue('Unsent workspace draft');
  await expect(button).toBeFocused();await expect(input).toBeInViewport({ratio:1});await expect(button).toBeInViewport({ratio:1});
}

for(const kind of kinds){
  for(const theme of themes)for(const viewport of viewports){
    test(`${kind} workspace ${theme} at ${viewport.width}px: definite content, independent history and first-screen composer`,async({page},info)=>{
      await setup(page,kind,{theme,viewport});await retainNodes(page);await assertInternalScrolling(page);await assertKeyboardSend(page);await assertRetained(page);
      if(theme==='system'){
        await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');await assertWorkspace(page);
        await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');await assertRetained(page);
      }
      expect(await navToggle(page).evaluate(node=>getComputedStyle(node).transitionDuration.split(',').every(value=>parseFloat(value)<=.01)),'reduced-motion control keeps its motion contract').toBe(true);
      await capture(page,info,`workspace-${theme}-${viewport.width}`);
    });
  }

  for(const viewport of viewports){
    test(`${kind} workspace ${viewport.width}px: short/empty/growing history and toggled page slots preserve focus and identity`,async({page},info)=>{
      await setup(page,kind,{query:'?short',viewport});const initial=await assertWorkspace(page,{long:false});await retainNodes(page);await draft(page).fill('Keep this draft across page chrome');await draft(page).focus();
      for(const slots of [false,true,false,true]){
        await page.evaluate(slots=>window.workspaceDemo.setSlots(slots),slots);const m=await assertWorkspace(page,{slots,long:false});
        await expect(draft(page)).toBeFocused();await expect(draft(page)).toHaveValue('Keep this draft across page chrome');await assertRetained(page);
        if(slots)near(m.content.height,initial.content.height,'restored page chrome height');else expect(m.content.height).toBeGreaterThan(initial.content.height);
      }
      for(const count of [0,100,2]){
        await page.evaluate(count=>window.workspaceDemo.setCount(count),count);await expect(page.getByTestId('history').locator('p')).toHaveCount(count);
        const m=await assertWorkspace(page,{long:count===100});near(m.composer.y,initial.composer.y,'composer does not follow history length');await expect(draft(page)).toBeFocused();await assertRetained(page);
      }
      await page.evaluate(()=>window.workspaceDemo.navigate());await expect(page.locator('[data-menu-id="settings"][data-menu-control="primary"]')).toHaveAttribute('aria-current','page');
      await expect(draft(page)).toBeFocused();await expect(draft(page)).toHaveValue('Keep this draft across page chrome');await assertRetained(page);await capture(page,info,`short-and-updated-${viewport.width}`);
    });

    test(`${kind} workspace ${viewport.width}px: omitted page slots leave no blank region`,async({page})=>{
      await setup(page,kind,{query:'?plain',viewport});const empty=await assertWorkspace(page,{slots:false});
      for(const name of ['Page title','Page tools','Page footer'])await expect(page.getByText(name,{exact:true})).toHaveCount(0);
      near(empty.content.y,empty.main.y+empty.main.borderTop+empty.main.paddingTop,'content starts at main padding');
      near(empty.content.bottom,empty.main.bottom-empty.main.borderBottom-empty.main.paddingBottom,'content ends at main padding');
      await retainNodes(page);await draft(page).focus();await page.evaluate(()=>window.workspaceDemo.setSlots(true));await assertWorkspace(page);await expect(draft(page)).toBeFocused();await assertRetained(page);
    });

    test(`${kind} workspace ${viewport.width}px: optional leading slot precedes brand and the sole toggle without its own blank space`,async({page},info)=>{
      await setup(page,kind,{viewport});await assertWorkspace(page);await retainNodes(page);
      const primary=page.locator('.xui-app-header-primary'),toggle=navToggle(page);const empty=await toggle.boundingBox(),start=await primary.boundingBox();
      await expect(page.locator('.xui-app-header-leading:visible')).toHaveCount(0);await expect(page.getByRole('button',{name:'Platform action',exact:true})).toHaveCount(0);near((await page.locator('.xui-app-header-brand').boundingBox()).x,start.x,'absent leading reserves no inline space before brand');expect(empty.x).toBeGreaterThan(start.x);
      await draft(page).focus();await page.evaluate(()=>window.workspaceDemo.setLeading(true));await expect(draft(page)).toBeFocused();await assertRetained(page);
      const action=page.getByRole('button',{name:'Platform action',exact:true}),leading=page.locator('.xui-app-header-leading');await expect(action).toBeVisible();await expect(toggle).toHaveCount(1);
      const slot=await leading.boundingBox(),button=await action.boundingBox(),navigation=await toggle.boundingBox();
      expect(slot.x).toBeLessThan(navigation.x);expect(slot.x+slot.width).toBeLessThanOrEqual(navigation.x+1);near(button.width,slot.width,'intrinsic leading width is preserved');
      expect(await leading.evaluate(node=>getComputedStyle(node).flexShrink)).toBe('0');expect(await action.evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);
      expect(await leading.evaluate(node=>!!(node.compareDocumentPosition(node.closest('.xui-app-header-primary').querySelector('.xui-app-header-navigation'))&Node.DOCUMENT_POSITION_FOLLOWING)),'leading precedes navigation in DOM order').toBe(true);
      await action.focus();await page.keyboard.press('Tab');await expect(toggle).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(action).toBeFocused();
      expect(await action.evaluate(node=>node.matches(':focus-visible')&&getComputedStyle(node).outlineStyle!=='none')).toBe(true);
      await page.evaluate(()=>window.workspaceDemo.navigate());await expect(action).toBeFocused();await assertRetained(page);
      await draft(page).focus();await page.evaluate(()=>window.workspaceDemo.setLeading(false));await expect(action).toHaveCount(0);await expect(draft(page)).toBeFocused();await assertRetained(page);
      near((await toggle.boundingBox()).x,empty.x,'removing leading restores the original toggle position');
      // Host fullscreen/platform changes can remove the safe area while the
      // library menu toggle keeps its identity and keyboard focus.
      await toggle.focus();
      for(const present of [true,false]){await page.evaluate(present=>window.workspaceDemo.setLeading(present),present);await expect(toggle).toBeFocused();await assertRetained(page);}
      await assertWorkspace(page);await capture(page,info,`leading-removed-${viewport.width}`);
    });
  }

  test(`${kind} platform leading content keeps its intrinsic width across desktop, compact and narrow layouts`,async({page},info)=>{
    await setup(page,kind,{query:'?platform'});const action=page.getByRole('button',{name:'Platform action',exact:true});await expect(action).toBeVisible();const original=await action.boundingBox();await retainNodes(page);
    await page.getByRole('button',{name:'Compact navigation',exact:true}).click();await finishMotion(page);
    for(const viewport of [viewports[0],viewports[1],viewports[0]]){
      await page.setViewportSize(viewport);await settle(page);await assertWorkspace(page);
      const button=await action.boundingBox(),toggle=await navToggle(page).boundingBox();near(button.width,original.width,'host leading content does not shrink');expect(button.x+button.width).toBeLessThanOrEqual(toggle.x+1);
      await action.focus();await page.keyboard.press('Tab');await expect(navToggle(page)).toBeFocused();await assertRetained(page);
    }
    await capture(page,info,'platform-leading');
  });

  for(const motion of ['reduce','no-preference'])test(`${kind} ${motion}: compact and repeated drawer open/close preserve the composer and single sidebar`,async({page},info)=>{
    await setup(page,kind,{motion});await retainNodes(page);await draft(page).fill('Draft survives navigation chrome');
    for(const label of ['Compact navigation','Expand navigation','Compact navigation']){
      await page.getByRole('button',{name:label,exact:true}).click();await finishMotion(page);await assertInternalScrolling(page);await assertRetained(page);await expect(draft(page)).toHaveValue('Draft survives navigation chrome');
    }
    await page.setViewportSize(viewports[1]);await finishMotion(page);await assertWorkspace(page);
    const toggle=page.getByRole('button',{name:'Workspace navigation',exact:true}),dialog=page.getByRole('dialog',{name:'Workspace navigation',exact:true});
    for(let i=0;i<2;i++){
      await toggle.click();await expect(dialog).toBeVisible();await finishMotion(page);await expect(dialog.getByRole('navigation',{name:'Workspace navigation',exact:true})).toHaveCount(1);await expect(page.locator(selectors.navigation)).toHaveCount(1);await assertRetained(page);
      await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await finishMotion(page);await expect(toggle).toBeFocused();await assertInternalScrolling(page);await assertRetained(page);
    }
    await toggle.click();await expect(dialog).toBeVisible();await dialog.getByRole('link',{name:'Settings',exact:true}).click();await expect(dialog).toBeHidden();await finishMotion(page);
    await expect(page.locator('[data-menu-id="settings"][data-menu-control="primary"]')).toHaveAttribute('aria-current','page');await assertWorkspace(page);await expect(draft(page)).toHaveValue('Draft survives navigation chrome');await assertRetained(page);
    // A breakpoint change while open must dismiss the existing drawer and move
    // the same sidebar back, rather than leaving a second modal owner behind.
    await toggle.click();await expect(dialog).toBeVisible();await page.setViewportSize(viewports[0]);await expect(dialog).toBeHidden();await finishMotion(page);
    await expect(page.getByRole('button',{name:'Expand navigation',exact:true})).toBeVisible();await expect(page.locator(selectors.navigation)).toHaveCount(1);await assertWorkspace(page);await assertRetained(page);
    await capture(page,info,`navigation-${motion}`);
  });

  test(`${kind} wrapped header contributes its natural height and keeps the remaining workspace bounded`,async({page},info)=>{
    await setup(page,kind,{viewport:viewports[1]});const ordinary=await assertWorkspace(page);
    await page.goto(`/workspace-${kind}/?wrapped&platform`);await page.waitForFunction(()=>!!window.workspaceDemo);await settle(page);const wrapped=await assertWorkspace(page);
    expect(wrapped.header.height,'host context makes the app header naturally taller').toBeGreaterThan(ordinary.header.height);
    near(ordinary.content.height-wrapped.content.height,wrapped.header.height-ordinary.header.height,'workspace gives up exactly the measured header growth');
    const context=page.locator('.xui-app-header-context');await expect(context).toBeVisible();
    expect(await context.evaluate(node=>node.scrollWidth<=node.clientWidth+1),'wrapped context does not overflow horizontally').toBe(true);
    const contextBox=await context.boundingBox(),headerBox=await page.locator('.xui-shell-header').boundingBox();expect(contextBox.y+contextBox.height).toBeLessThanOrEqual(headerBox.y+headerBox.height+1);
    await assertInternalScrolling(page);await assertKeyboardSend(page);await capture(page,info,'naturally-wrapped-header');
  });

  test(`${kind} public root block size bounds an embedded workspace without a fixed header calculation`,async({page})=>{
    await setup(page,kind,{query:'?wrapped&platform'});await retainNodes(page);
    // This is the documented public root style, not a private child repair.
    for(const height of [620,740]){
      await page.locator('.xui-shell').evaluate((node,height)=>{node.style.blockSize=`${height}px`;},height);await assertInternalScrolling(page,{shellHeight:height});await assertRetained(page);
    }
    await page.locator('.xui-shell').evaluate(node=>{node.style.removeProperty('block-size');});await assertWorkspace(page);await assertRetained(page);
  });

  test(`${kind} switching document, viewport and workspace retains the distinct legacy scroll owners`,async({page},info)=>{
    await setup(page,kind);await retainNodes(page);await draft(page).fill('Mode changes retain input');
    await page.evaluate(()=>window.workspaceDemo.setMode('document'));await expect(page.locator('.xui-shell')).toHaveAttribute('data-scroll-mode','document');await settle(page);
    const documentMode=await metrics(page);expect(documentMode.main.display).toBe('block');expect(documentMode.main.overflowY).toBe('visible');expect(documentMode.content.flexGrow).toBe('0');
    expect(documentMode.document.scrollHeight).toBeGreaterThan(documentMode.viewport.height);await page.evaluate(()=>window.scrollTo(0,200));await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(0);await assertRetained(page);
    await page.evaluate(()=>{window.scrollTo(0,0);window.workspaceDemo.setMode('viewport');});await expect(page.locator('.xui-shell')).toHaveAttribute('data-scroll-mode','viewport');await settle(page);
    const viewportMode=await metrics(page);near(viewportMode.shell.height,viewportMode.viewport.height,'legacy viewport root');expect(viewportMode.main.display).toBe('block');expect(viewportMode.main.overflowY).toBe('auto');expect(viewportMode.content.flexGrow).toBe('0');
    expect(viewportMode.main.scrollHeight).toBeGreaterThan(viewportMode.main.clientHeight);await page.locator('.xui-shell-main').evaluate(node=>{node.scrollTop=200;});await expect.poll(()=>page.locator('.xui-shell-main').evaluate(node=>node.scrollTop)).toBeGreaterThan(0);expect(await page.evaluate(()=>window.scrollY)).toBe(0);await assertRetained(page);
    await page.evaluate(()=>window.workspaceDemo.setMode('workspace'));await expect(page.locator('.xui-shell')).toHaveAttribute('data-scroll-mode','workspace');await assertWorkspace(page);await assertRetained(page);await expect(draft(page)).toHaveValue('Mode changes retain input');await capture(page,info,'restored-workspace');
  });
}

for(const theme of themes)for(const viewport of viewports)test(`direct React AppShell ${theme} at ${viewport.width}px shares workspace and leading contracts`,async({page},info)=>{
  await setup(page,'react',{query:'?direct&platform',theme,viewport});await retainNodes(page);await assertInternalScrolling(page);await assertKeyboardSend(page);
  const action=page.getByRole('button',{name:'Platform action',exact:true});await action.focus();await page.keyboard.press('Tab');await expect(navToggle(page)).toBeFocused();
  await draft(page).focus();await page.evaluate(()=>{window.workspaceDemo.setSlots(false);window.workspaceDemo.navigate();});await assertWorkspace(page,{slots:false});await expect(draft(page)).toBeFocused();await expect(draft(page)).toHaveValue('Unsent workspace draft');await assertRetained(page);
  await page.evaluate(()=>window.workspaceDemo.setSlots(true));await assertWorkspace(page);await expect(draft(page)).toBeFocused();await assertRetained(page);await capture(page,info,`direct-shell-${theme}-${viewport.width}`);
});
