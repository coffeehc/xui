import {test,expect} from '@playwright/test';

const ready=async(page,kind)=>{await page.goto(`/login-${kind}/`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();};
const box=locator=>locator.evaluate(element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};});
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
for(const kind of ['react','vanilla']){
  for(const stored of ['light','dark','system',null,'invalid']){
    test(`${kind} login inherits ${stored??'missing'} preference before app and never adds a theme selector`,async({page})=>{
      await ready(page,kind);
      await page.evaluate(stored=>{if(stored===null)localStorage.removeItem('ui.theme.mode');else localStorage.setItem('ui.theme.mode',stored);},stored);
      await page.emulateMedia({colorScheme:'dark'});
      let resume;const gate=new Promise(resolve=>{resume=resolve;});
      await page.route(`**/login-${kind}/app.js`,async route=>{await gate;await route.continue();});
      await page.reload({waitUntil:'commit'});
      await page.waitForFunction(()=>!!window.xuiTheme);
      const expectedMode=['light','dark','system'].includes(stored)?stored:'system',expectedEffective=expectedMode==='light'?'light':'dark';
      await expect(page.locator('html')).toHaveAttribute('data-theme',expectedMode);
      await expect(page.locator('html')).toHaveAttribute('data-theme-effective',expectedEffective);
      await expect(page.locator('.xui-login-card')).toHaveCount(0);
      await page.evaluate(()=>{window.loginBootstrapOwner=window.xuiTheme;window.loginFrames=[];const record=()=>{if(document.querySelector('.xui-login-card'))window.loginFrames.push({...document.documentElement.dataset});if(!window.stopLoginFrames)requestAnimationFrame(record);};requestAnimationFrame(record);});
      resume();await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();await settle(page);
      const firstPaint=await page.evaluate(()=>{window.stopLoginFrames=true;return {sameOwner:window.loginBootstrapOwner===window.xuiTheme,frames:window.loginFrames,stored:localStorage.getItem('ui.theme.mode')};});
      expect(firstPaint.sameOwner).toBe(true);expect(firstPaint.frames.length).toBeGreaterThan(0);expect(firstPaint.frames.every(frame=>frame.theme===expectedMode&&frame.themeEffective===expectedEffective)).toBe(true);expect(firstPaint.stored).toBe(stored);
      await expect(page.locator('.xui-login-theme')).toHaveCount(0);await expect(page.getByRole('combobox',{name:'外观',exact:true})).toHaveCount(0);
      await page.getByRole('textbox',{name:'用户名',exact:true}).fill('保留输入');
      for(const colorScheme of ['light','dark','light']){await page.emulateMedia({colorScheme});await expect(page.locator('html')).toHaveAttribute('data-theme-effective',expectedMode==='system'?colorScheme:expectedMode);await expect(page.getByRole('textbox',{name:'用户名',exact:true})).toHaveValue('保留输入');}
      expect(await page.evaluate(()=>localStorage.getItem('ui.theme.mode'))).toBe(stored);
      await page.reload();await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();await expect(page.locator('html')).toHaveAttribute('data-theme',expectedMode);
    });
  }
  for(const appearance of ['light','dark','system'])for(const width of [1280,390]){
    test(`${kind} public login splits brand and form: ${appearance}, ${width}px`,async({page},info)=>{
      await page.setViewportSize({width,height:800});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
      await page.addInitScript(appearance=>localStorage.setItem('ui.theme.mode',appearance),appearance);
      await ready(page,kind);await settle(page);
      const brand=await box(page.locator('.xui-login-brand')),form=await box(page.locator('.xui-login-form')),card=await box(page.locator('.xui-login-card'));
      if(width>767){expect(brand.right).toBeCloseTo(form.x,1);expect(brand.y).toBeCloseTo(form.y,1);expect(brand.width/card.width).toBeGreaterThan(.4);expect(form.width/card.width).toBeGreaterThan(.4);}
      else {expect(brand.bottom).toBeCloseTo(form.y,1);expect(brand.x).toBeCloseTo(form.x,1);expect(form.width).toBeCloseTo(brand.width,1);}
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeInViewport();
      await expect(page.locator('.xui-login-brand strong')).toHaveText('轻舟工作台');await expect(page.locator('.xui-login-description')).toHaveText('继续处理你的工作。');await expect(page.getByRole('heading',{name:'登录工作台'})).toBeVisible();
      expect(await page.locator('.xui-login-brand').evaluate(element=>getComputedStyle(element).backgroundColor)).not.toBe(await page.locator('.xui-login-card').evaluate(element=>getComputedStyle(element).backgroundColor));
      const path=info.outputPath(`login-${kind}-${appearance}-${width}.png`);await page.screenshot({path,animations:'disabled'});await info.attach('login-layout',{path,contentType:'image/png'});
    });
  }
}

// Compare the painted screenshot pixels at the midpoint of every outline side.
// Merely checking computed outlineStyle misses clipping by an ancestor scrollport.
async function paintedFocus(page,locator,info,name){
  await page.keyboard.press('Tab');await locator.focus();
  await locator.evaluate(element=>element.scrollIntoView({block:'nearest',inline:'nearest'}));await settle(page);
  await expect(locator).toBeFocused();
  const metrics=await locator.evaluate(element=>{const r=element.getBoundingClientRect(),s=getComputedStyle(element),width=parseFloat(s.outlineWidth),offset=parseFloat(s.outlineOffset),distance=offset+width/2;return {rect:{x:r.x,y:r.y,width:r.width,height:r.height},outline:s.outlineColor,width,offset,viewport:{width:innerWidth,height:innerHeight},points:[[r.x-distance,r.y+r.height/2],[r.right+distance,r.y+r.height/2],[r.x+r.width/2,r.y-distance],[r.x+r.width/2,r.bottom+distance]]};});
  expect(metrics.width).toBeGreaterThan(0);
  const png=await page.screenshot({animations:'disabled'});
  const pixels=await page.evaluate(async({encoded,metrics})=>{const image=new Image();image.src='data:image/png;base64,'+encoded;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const ratio=image.width/metrics.viewport.width;const samples=metrics.points.map(([x,y])=>Array.from(ctx.getImageData(Math.round(x*ratio),Math.round(y*ratio),1,1).data));ctx.fillStyle=metrics.outline;ctx.fillRect(0,0,1,1);return {samples,expected:Array.from(ctx.getImageData(0,0,1,1).data)};},{encoded:png.toString('base64'),metrics});
  await info.attach(name,{body:png,contentType:'image/png'});
  await info.attach(name+'-focus-pixels',{body:JSON.stringify({metrics,pixels},null,2),contentType:'application/json'});
  for(const [index,pixel] of pixels.samples.entries())for(let channel=0;channel<3;channel++)expect(Math.abs(pixel[channel]-pixels.expected[channel]),`${name}: ${['left','right','top','bottom'][index]} outline must be painted`).toBeLessThanOrEqual(20);
}
for(const kind of ['react','vanilla']){
  test(`${kind} fullscreen panels cover the viewport and explicit card remains opt-in`,async({page})=>{
    for(const size of [{width:1280,height:800},{width:1600,height:900},{width:390,height:800}]){
      await page.setViewportSize(size);await ready(page,kind);
      const bounds=await box(page.locator('.xui-login-card'));
      expect(bounds).toEqual({x:0,y:0,right:size.width,bottom:size.height,width:size.width,height:size.height});
      expect(await page.locator('.xui-login-card').evaluate(element=>({border:getComputedStyle(element).borderTopWidth,radius:getComputedStyle(element).borderTopLeftRadius}))).toEqual({border:'0px',radius:'0px'});
      await expect(page.locator('.xui-login-page')).toHaveAttribute('data-layout','fullscreen');
    }
    await page.setViewportSize({width:1280,height:800});await page.goto(`/login-${kind}/?layout=card`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();
    const card=await box(page.locator('.xui-login-card'));expect(card.x).toBeGreaterThan(0);expect(card.y).toBeGreaterThan(0);expect(card.width).toBeLessThan(1280);
  });
  test(`${kind} decorative visual keeps shared branding and cannot steal keyboard focus`,async({page})=>{
    await page.goto(`/login-${kind}/?visual`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();
    await expect(page.locator('.xui-login-visual')).toBeVisible();await expect(page.locator('.xui-login-visual')).toHaveAttribute('aria-hidden','true');expect(await page.locator('.xui-login-visual').evaluate(element=>element.inert)).toBe(true);
    await expect.poll(()=>page.locator('.xui-login-visual img').evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
    await page.setViewportSize({width:390,height:800});await expect(page.locator('.xui-login-visual')).toBeHidden();await expect(page.locator('.xui-login-identity strong')).toBeVisible();await expect(page.getByLabel('密码')).toBeInViewport();
  });
  test(`${kind} initial session checking and one-line error preserve field positions`,async({page})=>{
    await page.goto(`/login-${kind}/?session=hold`);await expect(page.getByRole('status')).toHaveText('正在核对会话…');
    const username=page.getByRole('textbox',{name:'用户名',exact:true}),initial=await box(username);
    await page.evaluate(()=>window.loginDemo.release('session'));await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();expect(await box(username)).toEqual(initial);
    await page.evaluate(()=>window.loginDemo.setMode('login','credentials'));await username.fill('demo');await page.getByLabel('密码').fill('FAKE_PASSWORD');await page.getByRole('button',{name:'登录',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('用户名或密码不正确。');expect(await box(username)).toEqual(initial);
  });
  for(const appearance of ['light','dark','system'])for(const mode of ['desktop','narrow','large-text','short-height']){
    test(`${kind} four painted focus sides: ${appearance}, ${mode}`,async({page},info)=>{
      await page.setViewportSize(mode==='desktop'?{width:1280,height:800}:mode==='short-height'?{width:390,height:320}:{width:390,height:800});
      await page.emulateMedia({colorScheme:appearance==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(appearance=>localStorage.setItem('ui.theme.mode',appearance),appearance);
      await page.goto(`/login-${kind}/?extensions&focus`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();
      if(mode==='large-text')await page.evaluate(()=>document.documentElement.style.fontSize='200%');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      for(const [name,locator] of [['first-extension',page.getByLabel('服务地址')],['username',page.getByRole('textbox',{name:'用户名',exact:true})],['password',page.getByLabel('密码')],['last-extension',page.getByLabel('补充说明')],['sso-action',page.getByRole('button',{name:'企业 SAML 登录'})],['submit',page.getByRole('button',{name:'登录',exact:true})]])await paintedFocus(page,locator,info,`${kind}-${appearance}-${mode}-${name}`);
      await page.evaluate(()=>window.loginDemo.setExtensionMode('invalid'));await page.getByRole('button',{name:'企业 OIDC 登录'}).click();await expect(page.getByRole('alert')).toBeVisible();
      await paintedFocus(page,page.getByRole('alert'),info,`${kind}-${appearance}-${mode}-feedback`);
      await paintedFocus(page,page.getByLabel('服务地址'),info,`${kind}-${appearance}-${mode}-scrolled-first`);
    });
  }
}

for(const kind of ['react','vanilla'])test(`${kind} long credential feedback remains scrollable with large-text fields and actions reachable`,async({page},info)=>{
  await page.setViewportSize({width:390,height:720});await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`/login-${kind}/?extensions&focus&longError`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%';window.loginDemo.setMode('login','credentials');});
  await page.getByRole('textbox',{name:'用户名',exact:true}).fill('demo');await page.getByLabel('密码').fill('FAKE_LONG_ERROR_PASSWORD');await page.getByRole('button',{name:'登录',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('用户名或密码不正确，请核对当前服务地址和账户来源后再试。'.repeat(6));
  const scroll=page.locator('.xui-login-body');expect(await scroll.evaluate(element=>element.scrollHeight>element.clientHeight)).toBe(true);
  for(const end of [false,true]){await scroll.evaluate((element,end)=>{element.scrollTop=end?element.scrollHeight:0;},end);await info.attach(`${kind}-long-error-${end?'end':'start'}`,{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});}
  await paintedFocus(page,page.getByLabel('服务地址'),info,`${kind}-long-error-first-field`);
  await paintedFocus(page,page.getByLabel('补充说明'),info,`${kind}-long-error-last-field`);
  await paintedFocus(page,page.getByRole('button',{name:'登录',exact:true}),info,`${kind}-long-error-submit`);
  expect(await page.getByLabel('密码').inputValue()).toBe('');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
