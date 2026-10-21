import {test,expect} from '@playwright/test';
import {readableFeedback} from './auth-feedback-helpers.mjs';

const ready=async(page,kind)=>{await page.goto(`/login-${kind}/`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();};
const box=locator=>locator.evaluate(element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};});
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const loginControls=async page=>page.evaluate(()=>{const selectors={card:'.xui-login-card',brand:'.xui-login-brand',username:'input[name=username]',password:'input[name=password]',submit:'.xui-login-submit'};window.loginStableNodes=Object.fromEntries(Object.entries(selectors).map(([name,selector])=>[name,document.querySelector(selector)]));return Object.fromEntries(Object.entries(window.loginStableNodes).map(([name,node])=>{const r=node.getBoundingClientRect();return [name,{x:r.x,width:r.width,height:r.height}];}));});
const expectStableLoginControls=async(page,before)=>{const after=await page.evaluate(()=>Object.fromEntries(Object.entries(window.loginStableNodes).map(([name,node])=>{const current=document.querySelector({card:'.xui-login-card',brand:'.xui-login-brand',username:'input[name=username]',password:'input[name=password]',submit:'.xui-login-submit'}[name]);const r=current.getBoundingClientRect();return [name,{same:current===node,x:r.x,width:r.width,height:r.height}];})));for(const [name,rect] of Object.entries(before)){expect(after[name].same,`${name} keeps its DOM identity`).toBe(true);for(const key of ['x','width','height']){if(name==='card'&&key==='height')continue;expect(Math.abs(after[name][key]-rect[key]),`${name}.${key} remains stable`).toBeLessThanOrEqual(1.5);}}const card=after.card;expect(card.x).toBeGreaterThanOrEqual(0);expect(card.x+card.width).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth));expect(card.width).toBeLessThanOrEqual(418);expect(Math.abs(card.x+card.width/2-(await page.evaluate(()=>innerWidth))/2)).toBeLessThanOrEqual(1);};
for(const kind of ['react']){
  for(const stored of ['light','dark','system',null,'invalid']){
    test(`${kind} login inherits ${stored??'missing'} preference before app and never adds a theme selector`,async({page})=>{
      await ready(page,kind);
      await page.evaluate(stored=>{if(stored===null)sessionStorage.removeItem('ui.theme.mode');else sessionStorage.setItem('ui.theme.mode',stored);},stored);
      await page.emulateMedia({colorScheme:'dark'});
      let resume;const gate=new Promise(resolve=>{resume=resolve;});
      await page.route(`**/login-${kind}/app.js`,async route=>{await gate;await route.continue();});
      await page.reload({waitUntil:'commit'});
      const expectedMode=['light','dark','system'].includes(stored)?stored:'dark',expectedEffective=expectedMode==='system'?'dark':expectedMode;
      await expect(page.locator('html')).toHaveAttribute('data-theme',expectedMode);
      await expect(page.locator('html')).toHaveAttribute('data-theme-effective',expectedEffective);
      expect(await page.evaluate(()=>window.xuiTheme),'pre-paint restores attributes without constructing an application service owner').toBeUndefined();
      await expect(page.locator('.xui-login-card')).toHaveCount(0);
      await page.evaluate(()=>{window.loginFrames=[];window.stopLoginFrames=false;const record=()=>{if(document.querySelector('.xui-login-card'))window.loginFrames.push({...document.documentElement.dataset});if(!window.stopLoginFrames)requestAnimationFrame(record);};requestAnimationFrame(record);});
      resume();await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();await settle(page);
      const firstPaint=await page.evaluate(()=>{window.stopLoginFrames=true;return {sameOwner:window.loginDemo.theme===window.xuiTheme,mode:window.loginDemo.theme.getState().mode,frames:window.loginFrames,stored:sessionStorage.getItem('ui.theme.mode')};});
      expect(firstPaint.sameOwner).toBe(true,'the login view receives the bootstrap-owned theme service');expect(firstPaint.mode).toBe(expectedMode);expect(firstPaint.frames.length).toBeGreaterThan(0);expect(firstPaint.frames.every(frame=>frame.theme===expectedMode&&frame.themeEffective===expectedEffective)).toBe(true);expect(firstPaint.stored).toBe(stored);
      await expect(page.locator('.xui-login-theme')).toHaveCount(0);await expect(page.getByRole('combobox',{name:'外观',exact:true})).toHaveCount(0);
      await page.getByRole('textbox',{name:'用户名',exact:true}).fill('保留输入');
      for(const colorScheme of ['light','dark','light']){await page.emulateMedia({colorScheme});await expect(page.locator('html')).toHaveAttribute('data-theme-effective',expectedMode==='system'?colorScheme:expectedMode);await expect(page.getByRole('textbox',{name:'用户名',exact:true})).toHaveValue('保留输入');}
      expect(await page.evaluate(()=>sessionStorage.getItem('ui.theme.mode'))).toBe(stored);
      await page.reload();await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();await expect(page.locator('html')).toHaveAttribute('data-theme',expectedMode);
    });
  }
  for(const appearance of ['light','dark','system'])for(const width of [1280,1600,390]){
    test(`${kind} public login stays centered in one column: ${appearance}, ${width}px`,async({page},info)=>{
      await page.setViewportSize({width,height:800});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
      await page.addInitScript(appearance=>sessionStorage.setItem('ui.theme.mode',appearance),appearance);
      await ready(page,kind);await settle(page);
      const brand=await box(page.locator('.xui-login-brand')),form=await box(page.locator('.xui-login-form')),content=await box(page.locator('.xui-login-content')),card=await box(page.locator('.xui-login-card'));
      expect(card.x).toBeGreaterThanOrEqual(0);expect(card.right).toBeLessThanOrEqual(width);expect(Math.abs((card.x+card.width/2)-width/2)).toBeLessThanOrEqual(1);
      expect(content.width).toBeLessThanOrEqual(360);expect(content.x).toBeGreaterThanOrEqual(card.x);expect(content.right).toBeLessThanOrEqual(card.right);
      expect(brand.bottom).toBeLessThanOrEqual(form.y);expect(brand.x).toBeGreaterThanOrEqual(card.x);expect(form.right).toBeLessThanOrEqual(card.right);
      if(width===390)expect(card.width).toBeLessThanOrEqual(390);else expect(card.width).toBeLessThanOrEqual(418);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeInViewport();
      await expect(page.locator('.xui-login-brand strong')).toHaveText('轻舟工作台');await expect(page.locator('.xui-login-description')).toHaveText('继续处理你的工作。');await expect(page.getByRole('heading',{name:'登录',exact:true})).toBeVisible();
      await expect(page.locator('.xui-login-visual')).toBeHidden();await expect(page.locator('.xui-login-visual img')).toHaveCount(0);
      const path=info.outputPath(`login-${kind}-${appearance}-${width}.png`);await page.screenshot({path,animations:'disabled'});await info.attach('login-layout',{path,contentType:'image/png'});
    });
  }
}

// Focus no longer paints an outer outline. Keep the actual control boundary
// inside the viewport and its scroll owners, and verify the field border state.
async function focusBoundary(page,locator,info,name){
  await page.keyboard.press('Tab');await locator.focus();
  await locator.evaluate(element=>element.scrollIntoView({block:'nearest',inline:'nearest'}));await settle(page);
  await expect(locator).toBeFocused();
  const metrics=await locator.evaluate(element=>{const target=element.matches('input')?(element.closest('.xui-input-group')??element):element,r=target.getBoundingClientRect(),s=getComputedStyle(target),viewport={left:0,top:0,right:innerWidth,bottom:innerHeight},scrollports=[];let clipped=false;for(let ancestor=target.parentElement;ancestor;ancestor=ancestor.parentElement){const style=getComputedStyle(ancestor),bounds=ancestor.getBoundingClientRect(),left=bounds.left+ancestor.clientLeft,top=bounds.top+ancestor.clientTop,right=left+ancestor.clientWidth,bottom=top+ancestor.clientHeight,clipsX=/auto|scroll|hidden|clip/.test(style.overflowX),clipsY=/auto|scroll|hidden|clip/.test(style.overflowY);if(clipsX||clipsY){scrollports.push({className:ancestor.className,left,top,right,bottom,clipsX,clipsY,scrollLeft:ancestor.scrollLeft,scrollTop:ancestor.scrollTop});if(clipsX&&(r.left<left-1||r.right>right+1)||clipsY&&(r.top<top-1||r.bottom>bottom+1))clipped=true;}}return {visible:element.matches(':focus-visible'),rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height},outline:s.outlineStyle,outlineWidth:parseFloat(s.outlineWidth),border:{style:s.borderTopStyle,width:parseFloat(s.borderTopWidth),color:s.borderTopColor},invalid:element.getAttribute('aria-invalid')==='true'||target.getAttribute('data-invalid')==='true',viewport,scrollports,clipped};});
  expect(metrics.visible).toBe(true);expect(metrics.outline).toBe('none');expect(metrics.outlineWidth).toBe(0);
  expect(metrics.rect.left).toBeGreaterThanOrEqual(0);expect(metrics.rect.top).toBeGreaterThanOrEqual(0);expect(metrics.rect.right).toBeLessThanOrEqual(metrics.viewport.right);expect(metrics.rect.bottom).toBeLessThanOrEqual(metrics.viewport.bottom);expect(metrics.clipped).toBe(false);
  const isField=await locator.evaluate(element=>element.matches('input,textarea,select'));if(isField){const expected=await page.evaluate(invalid=>{const probe=document.createElement('span');probe.style.color=invalid?'var(--status-error-foreground)':'var(--interaction-focus)';document.body.append(probe);const color=getComputedStyle(probe).color;probe.remove();return color;},metrics.invalid);expect(metrics.border.color).toBe(expected);}
  const png=await page.screenshot({animations:'disabled'});
  await info.attach(name+'.png',{body:png,contentType:'image/png'});
  await info.attach(name+'-focus-geometry',{body:JSON.stringify(metrics,null,2),contentType:'application/json'});
}
for(const kind of ['react']){
  test(`${kind} default and fullscreen modes keep the narrow single-column login usable`,async({page})=>{
    for(const layout of ['card','fullscreen'])for(const size of [{width:1280,height:800},{width:1600,height:900},{width:390,height:800}]){
      await page.setViewportSize(size);await page.goto(`/login-${kind}/${layout==='card'?'':'?layout=fullscreen'}`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();
      const card=await box(page.locator('.xui-login-card')),content=await box(page.locator('.xui-login-content')),brand=await box(page.locator('.xui-login-brand')),form=await box(page.locator('.xui-login-form'));
      expect(Math.abs((card.x+card.width/2)-size.width/2)).toBeLessThanOrEqual(1);expect(card.width).toBeLessThanOrEqual(Math.min(size.width,418));expect(content.width).toBeLessThanOrEqual(360);
      expect(brand.bottom).toBeLessThanOrEqual(form.y);await expect(page.getByRole('textbox',{name:'用户名',exact:true})).toBeInViewport();await expect(page.getByLabel(/^密码(?:\s*\*)?$/)).toBeInViewport();await expect(page.getByRole('button',{name:'登录',exact:true})).toBeInViewport();
      await expect(page.locator('.xui-login-page')).toHaveAttribute('data-layout',layout);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
  });
  test(`${kind} optional visual stays compact, decorative and absent from the default login`,async({page})=>{
    await ready(page,kind);await expect(page.locator('.xui-login-visual')).toBeHidden();await expect(page.locator('.xui-login-visual img')).toHaveCount(0);
    await page.goto(`/login-${kind}/?visual`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();
    await expect(page.locator('.xui-login-visual')).toBeVisible();await expect(page.locator('.xui-login-visual')).toHaveAttribute('aria-hidden','true');expect(await page.locator('.xui-login-visual').evaluate(element=>element.inert)).toBe(true);
    await expect.poll(()=>page.locator('.xui-login-visual img').evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
    expect((await box(page.locator('.xui-login-visual'))).height).toBeLessThanOrEqual(80);
    await page.setViewportSize({width:390,height:800});await expect(page.locator('.xui-login-visual')).toBeHidden();await expect(page.locator('.xui-login-identity strong')).toBeVisible();await expect(page.getByLabel(/^密码(?:\s*\*)?$/)).toBeInViewport();
  });
  test(`${kind} ordinary session feedback preserves control identity and size while the card grows naturally`,async({page})=>{
    await page.goto(`/login-${kind}/?session=hold`);await expect(page.getByRole('status')).toHaveText('正在确认登录状态…');
    const username=page.getByRole('textbox',{name:'用户名',exact:true}),initial=await loginControls(page);
    await page.evaluate(()=>window.loginDemo.release('session'));await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();await expectStableLoginControls(page,initial);
    await page.evaluate(()=>window.loginDemo.setMode('login','credentials'));await username.fill('demo');await page.getByLabel(/^密码(?:\s*\*)?$/).fill('FAKE_PASSWORD');await page.getByRole('button',{name:'登录',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('用户名或密码不正确。');await expectStableLoginControls(page,initial);await expect(username).toHaveValue('demo');await expect(page.getByLabel(/^密码(?:\s*\*)?$/)).toHaveValue('');
  });
  for(const appearance of ['light','dark','system'])for(const mode of ['desktop','narrow','large-text','short-height']){
    test(`${kind} focus has no outer outline and stays within scroll owners: ${appearance}, ${mode}`,async({page},info)=>{
      await page.setViewportSize(mode==='desktop'?{width:1280,height:800}:mode==='short-height'?{width:390,height:320}:{width:390,height:800});
      await page.emulateMedia({colorScheme:appearance==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(appearance=>sessionStorage.setItem('ui.theme.mode',appearance),appearance);
      await page.goto(`/login-${kind}/?extensions&focus`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();
      if(mode==='large-text')await page.evaluate(()=>document.documentElement.style.fontSize='200%');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      for(const [name,locator] of [['first-extension',page.getByLabel('服务地址')],['username',page.getByRole('textbox',{name:'用户名',exact:true})],['password',page.getByLabel(/^密码(?:\s*\*)?$/)],['last-extension',page.getByLabel('补充说明')],['sso-action',page.getByRole('button',{name:'企业 SAML 登录'})],['submit',page.getByRole('button',{name:'登录',exact:true})]])await focusBoundary(page,locator,info,`${kind}-${appearance}-${mode}-${name}`);
      await page.evaluate(()=>window.loginDemo.setExtensionMode('invalid'));await page.getByRole('button',{name:'企业 OIDC 登录'}).click();await expect(page.getByRole('alert')).toBeVisible();
      await focusBoundary(page,page.getByRole('alert'),info,`${kind}-${appearance}-${mode}-feedback`);
      await focusBoundary(page,page.getByLabel('服务地址'),info,`${kind}-${appearance}-${mode}-scrolled-first`);
    });
  }
}

for(const kind of ['react'])test(`${kind} long credential feedback is fully readable in document flow with large-text fields and actions reachable`,async({page},info)=>{
  await page.setViewportSize({width:390,height:720});await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`/login-${kind}/?extensions&focus&longError`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%';window.loginDemo.setMode('login','credentials');});
  await page.getByRole('textbox',{name:'用户名',exact:true}).fill('demo');await page.getByLabel(/^密码(?:\s*\*)?$/).fill('FAKE_LONG_ERROR_PASSWORD');await page.getByRole('button',{name:'登录',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('用户名或密码不正确，请核对当前服务地址和账户来源后再试。'.repeat(6));
  expect(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight)).toBe(true);await readableFeedback(page,page.getByRole('alert'),info,`${kind}-long-error`);
  await focusBoundary(page,page.getByLabel('服务地址'),info,`${kind}-long-error-first-field`);
  await focusBoundary(page,page.getByLabel('补充说明'),info,`${kind}-long-error-last-field`);
  await focusBoundary(page,page.getByRole('button',{name:'登录',exact:true}),info,`${kind}-long-error-submit`);
  expect(await page.getByLabel(/^密码(?:\s*\*)?$/).inputValue()).toBe('');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const kind of ['react'])for(const appearance of ['light','dark','system'])for(const mode of ['desktop','narrow','large-text','short-height'])test(`${kind} session retry has no outer outline and extension unmount blocks late results: ${appearance}, ${mode}`,async({page},info)=>{
  await page.setViewportSize(mode==='desktop'?{width:1280,height:800}:mode==='short-height'?{width:390,height:320}:{width:390,height:800});await page.emulateMedia({colorScheme:appearance==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),appearance);
  await page.goto(`/login-${kind}/?extensions&visualAcceptance`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();if(mode==='large-text')await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.evaluate(()=>window.loginDemo.setExtensionMode('hold'));await page.getByRole('button',{name:'企业 OIDC 登录'}).click();
  await expect(page.getByRole('button',{name:'取消等待'})).toHaveCount(0);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeDisabled();await page.evaluate(()=>{window.loginDemo.destroy();window.loginDemo.releaseExtension();});await settle(page);await expect(page.locator('.xui-login-page')).toHaveCount(0);expect(await page.evaluate(()=>window.loginDemo.getDestinations())).toEqual([]);
  await page.goto(`/login-${kind}/?sessionReadError&handoff=hold&visualAcceptance`);await expect(page.getByRole('button',{name:'重试连接'})).toBeVisible();await expect.poll(()=>page.evaluate(()=>{const state=window.loginDemo.auth.getState();return state.error?.metadata.endpointId==='auth.session'&&state.error.kind==='network';})).toBe(true);if(mode==='large-text')await page.evaluate(()=>document.documentElement.style.fontSize='200%');await focusBoundary(page,page.getByRole('button',{name:'重试连接'}),info,`${kind}-${appearance}-${mode}-retry`);
});
for(const kind of ['react'])test(`${kind} long configured primary stays scrollable, keeps busy text visible and has no outer outline`,async({page},info)=>{
  await page.setViewportSize({width:390,height:720});const label='立即登录企业统一身份认证工作台'.repeat(8);await page.goto(`/login-${kind}/?productName=${encodeURIComponent('工作台'.repeat(42))}&submitLabel=${encodeURIComponent(label)}&visualAcceptance`);const submit=page.locator('.xui-login-submit');await expect(submit).toBeEnabled();await page.evaluate(()=>{document.documentElement.style.fontSize='200%';document.documentElement.style.setProperty('--font-sans','monospace');});await submit.evaluate(element=>element.scrollIntoView({block:'nearest'}));await settle(page);await expect(submit).toHaveAccessibleName(label);const idle=await submit.evaluate(element=>({rect:element.getBoundingClientRect().toJSON(),height:element.clientHeight,scrollHeight:element.scrollHeight,scrollTop:element.scrollTop,outline:getComputedStyle(element).outlineStyle}));expect(idle.rect.y).toBeGreaterThanOrEqual(0);expect(idle.rect.bottom).toBeLessThanOrEqual(720);expect(idle.rect.height).toBeLessThanOrEqual(144);expect(idle.scrollHeight).toBeGreaterThan(idle.height);expect(idle.scrollTop).toBe(0);await submit.evaluate(element=>element.scrollTop=element.scrollHeight);expect(await submit.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);await submit.evaluate(element=>element.scrollTop=0);await focusBoundary(page,submit,info,`${kind}-long-primary-focus`);
  await page.getByRole('textbox',{name:'用户名',exact:true}).fill('demo');await page.getByLabel(/^密码(?:\s*\*)?$/).fill('FAKE_LONG_ACTION_PASSWORD');await submit.evaluate(element=>element.scrollTop=element.scrollHeight);expect(await submit.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);await page.evaluate(()=>window.loginDemo.repeatAuthNotification());expect(await submit.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);await page.evaluate(()=>window.loginDemo.setMode('login','hold'));await submit.click();await expect.poll(()=>page.evaluate(()=>window.loginDemo.auth.getState().busy)).toBe('login');await expect(submit).toBeDisabled();const busy=await submit.evaluate(element=>{const r=element.getBoundingClientRect(),label=element.querySelector('span').getBoundingClientRect(),contentTop=r.top+element.clientTop,contentBottom=contentTop+element.clientHeight;return {button:{top:r.top,right:r.right,bottom:r.bottom,left:r.left,contentTop,contentBottom,scrollTop:element.scrollTop},label:{top:label.top,right:label.right,bottom:label.bottom,left:label.left},text:element.querySelector('span').textContent};});expect(busy.button.scrollTop).toBe(0);expect(busy.text).toBe('正在登录…');expect(busy.label.top).toBeGreaterThanOrEqual(busy.button.contentTop);expect(busy.label.bottom).toBeLessThanOrEqual(busy.button.contentBottom);expect(busy.label.left).toBeGreaterThanOrEqual(busy.button.left);expect(busy.label.right).toBeLessThanOrEqual(busy.button.right);await expect(submit).toHaveAccessibleName('正在登录…');await expect(page.getByRole('button',{name:'取消等待'})).toHaveCount(0);await page.evaluate(()=>window.loginDemo.release('login'));
});
