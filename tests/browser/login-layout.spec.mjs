import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {readableFeedback} from './auth-feedback-helpers.mjs';

const ready=async(page,kind)=>{await page.goto(`/login-${kind}/`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();};
const box=locator=>locator.evaluate(element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};});
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const loginGeometry=async page=>page.evaluate(()=>Object.fromEntries(Object.entries({brand:'.xui-login-brand',form:'.xui-login-form',title:'.xui-login-body h1',username:'input[name=username]',password:'input[name=password]',submit:'.xui-login-submit',actions:'.xui-login-actions',feedback:'.xui-login-feedback'}).map(([name,selector])=>{const r=document.querySelector(selector).getBoundingClientRect();return [name,{x:r.x,y:r.y,width:r.width,height:r.height}];})));
const expectSameGeometry=(before,after)=>{for(const [name,rect] of Object.entries(before))for(const key of Object.keys(rect))expect(Math.abs(after[name][key]-rect[key]),`${name}.${key} remains stable`).toBeLessThanOrEqual(1.5);};
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
  for(const appearance of ['light','dark','system'])for(const width of [1280,1600,390]){
    test(`${kind} public login stays centered in one column: ${appearance}, ${width}px`,async({page},info)=>{
      await page.setViewportSize({width,height:800});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
      await page.addInitScript(appearance=>localStorage.setItem('ui.theme.mode',appearance),appearance);
      await ready(page,kind);await settle(page);
      const brand=await box(page.locator('.xui-login-brand')),form=await box(page.locator('.xui-login-form')),content=await box(page.locator('.xui-login-content')),card=await box(page.locator('.xui-login-card'));
      expect(card.x).toBeGreaterThanOrEqual(0);expect(card.right).toBeLessThanOrEqual(width);expect(Math.abs((card.x+card.width/2)-width/2)).toBeLessThanOrEqual(1);
      expect(content.width).toBeLessThanOrEqual(384);expect(content.x).toBeGreaterThanOrEqual(card.x);expect(content.right).toBeLessThanOrEqual(card.right);
      expect(brand.bottom).toBeLessThanOrEqual(form.y);expect(brand.x).toBeGreaterThanOrEqual(card.x);expect(form.right).toBeLessThanOrEqual(card.right);
      if(width===390)expect(card.width).toBeLessThanOrEqual(390);else expect(card.width).toBeLessThanOrEqual(434);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeInViewport();
      await expect(page.locator('.xui-login-brand strong')).toHaveText('轻舟工作台');await expect(page.locator('.xui-login-description')).toHaveText('继续处理你的工作。');await expect(page.getByRole('heading',{name:'登录',exact:true})).toBeVisible();
      await expect(page.locator('.xui-login-visual')).toBeHidden();await expect(page.locator('.xui-login-visual img')).toHaveCount(0);
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
  const metrics=await locator.evaluate(element=>{const r=element.getBoundingClientRect(),s=getComputedStyle(element),width=parseFloat(s.outlineWidth),offset=parseFloat(s.outlineOffset),distance=offset+width/2;return {rect:{x:r.x,y:r.y,width:r.width,height:r.height},outline:s.outlineColor,width,offset,viewport:{width:innerWidth,height:innerHeight},scrollports:[...function*(){for(let ancestor=element.parentElement;ancestor;ancestor=ancestor.parentElement){const style=getComputedStyle(ancestor);if(/auto|scroll|hidden|clip/.test(style.overflowY)){const bounds=ancestor.getBoundingClientRect();yield {className:ancestor.className,x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height,paddingBottom:style.paddingBottom,scrollTop:ancestor.scrollTop,scrollHeight:ancestor.scrollHeight,clientHeight:ancestor.clientHeight};}}}()],points:[[r.x-distance,r.y+r.height/2],[r.right+distance,r.y+r.height/2],[r.x+r.width/2,r.y-distance],[r.x+r.width/2,r.bottom+distance]]};});
  expect(metrics.width).toBeGreaterThan(0);
  const png=await page.screenshot({animations:'disabled'});
  const pixels=await page.evaluate(async({encoded,metrics})=>{const image=new Image();image.src='data:image/png;base64,'+encoded;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const ratio=image.width/metrics.viewport.width;const samples=metrics.points.map(([x,y])=>Array.from(ctx.getImageData(Math.round(x*ratio),Math.round(y*ratio),1,1).data));ctx.fillStyle=metrics.outline;ctx.fillRect(0,0,1,1);return {samples,expected:Array.from(ctx.getImageData(0,0,1,1).data)};},{encoded:png.toString('base64'),metrics});
  const path=info.outputPath(name+'.png');await writeFile(path,png);await info.attach(name,{path,contentType:'image/png'});
  await info.attach(name+'-focus-pixels',{body:JSON.stringify({metrics,pixels},null,2),contentType:'application/json'});
  for(const [index,pixel] of pixels.samples.entries())for(let channel=0;channel<3;channel++)expect(Math.abs(pixel[channel]-pixels.expected[channel]),`${name}: ${['left','right','top','bottom'][index]} outline must be painted`).toBeLessThanOrEqual(20);
}
for(const kind of ['react','vanilla']){
  test(`${kind} default and fullscreen modes keep the narrow single-column login usable`,async({page})=>{
    for(const layout of ['card','fullscreen'])for(const size of [{width:1280,height:800},{width:1600,height:900},{width:390,height:800}]){
      await page.setViewportSize(size);await page.goto(`/login-${kind}/${layout==='card'?'':'?layout=fullscreen'}`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();
      const card=await box(page.locator('.xui-login-card')),content=await box(page.locator('.xui-login-content')),brand=await box(page.locator('.xui-login-brand')),form=await box(page.locator('.xui-login-form'));
      expect(Math.abs((card.x+card.width/2)-size.width/2)).toBeLessThanOrEqual(1);expect(card.width).toBeLessThanOrEqual(Math.min(size.width,434));expect(content.width).toBeLessThanOrEqual(384);
      expect(brand.bottom).toBeLessThanOrEqual(form.y);await expect(page.getByRole('textbox',{name:'用户名',exact:true})).toBeInViewport();await expect(page.getByLabel('密码')).toBeInViewport();await expect(page.getByRole('button',{name:'登录',exact:true})).toBeInViewport();
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
    await page.setViewportSize({width:390,height:800});await expect(page.locator('.xui-login-visual')).toBeHidden();await expect(page.locator('.xui-login-identity strong')).toBeVisible();await expect(page.getByLabel('密码')).toBeInViewport();
  });
  test(`${kind} initial session checking and one-line error preserve field positions`,async({page})=>{
    await page.goto(`/login-${kind}/?session=hold`);await expect(page.getByRole('status')).toHaveText('正在确认登录状态…');
    const username=page.getByRole('textbox',{name:'用户名',exact:true}),initial=await loginGeometry(page);
    await page.evaluate(()=>window.loginDemo.release('session'));await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();expectSameGeometry(initial,await loginGeometry(page));
    await page.evaluate(()=>window.loginDemo.setMode('login','credentials'));await username.fill('demo');await page.getByLabel('密码').fill('FAKE_PASSWORD');await page.getByRole('button',{name:'登录',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('用户名或密码不正确。');expectSameGeometry(initial,await loginGeometry(page));
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

for(const kind of ['react','vanilla'])test(`${kind} long credential feedback is fully readable in document flow with large-text fields and actions reachable`,async({page},info)=>{
  await page.setViewportSize({width:390,height:720});await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`/login-${kind}/?extensions&focus&longError`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%';window.loginDemo.setMode('login','credentials');});
  await page.getByRole('textbox',{name:'用户名',exact:true}).fill('demo');await page.getByLabel('密码').fill('FAKE_LONG_ERROR_PASSWORD');await page.getByRole('button',{name:'登录',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('用户名或密码不正确，请核对当前服务地址和账户来源后再试。'.repeat(6));
  expect(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight)).toBe(true);await readableFeedback(page,page.getByRole('alert'),info,`${kind}-long-error`);
  await paintedFocus(page,page.getByLabel('服务地址'),info,`${kind}-long-error-first-field`);
  await paintedFocus(page,page.getByLabel('补充说明'),info,`${kind}-long-error-last-field`);
  await paintedFocus(page,page.getByRole('button',{name:'登录',exact:true}),info,`${kind}-long-error-submit`);
  expect(await page.getByLabel('密码').inputValue()).toBe('');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const kind of ['react','vanilla'])for(const appearance of ['light','dark','system'])for(const mode of ['desktop','narrow','large-text','short-height'])test(`${kind} local recovery paints four focus sides and extension unmount blocks late results: ${appearance}, ${mode}`,async({page},info)=>{
  await page.setViewportSize(mode==='desktop'?{width:1280,height:800}:mode==='short-height'?{width:390,height:320}:{width:390,height:800});await page.emulateMedia({colorScheme:appearance==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>localStorage.setItem('ui.theme.mode',mode),appearance);
  await page.goto(`/login-${kind}/?extensions&visualAcceptance`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();if(mode==='large-text')await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.evaluate(()=>window.loginDemo.setExtensionMode('hold'));await page.getByRole('button',{name:'企业 OIDC 登录'}).click();
  await expect(page.getByRole('button',{name:'取消等待'})).toHaveCount(0);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeDisabled();await page.evaluate(()=>{window.loginDemo.destroy();window.loginDemo.releaseExtension();});await settle(page);await expect(page.locator('.xui-login-page')).toHaveCount(0);expect(await page.evaluate(()=>window.loginDemo.getDestinations())).toEqual([]);
  await page.goto(`/login-${kind}/?sessionReadError&handoff=hold&visualAcceptance`);await expect(page.getByRole('button',{name:'重试连接'})).toBeVisible();await expect.poll(()=>page.evaluate(()=>{const state=window.loginDemo.auth.getState();return state.error?.metadata.endpointId==='auth.session'&&state.error.kind==='network'&&!state.reauthenticationRequired;})).toBe(true);if(mode==='large-text')await page.evaluate(()=>document.documentElement.style.fontSize='200%');await paintedFocus(page,page.getByRole('button',{name:'重试连接'}),info,`${kind}-${appearance}-${mode}-retry`);
});
for(const kind of ['react','vanilla'])test(`${kind} long configured primary stays scrollable, keeps busy text visible and paints all focus sides`,async({page},info)=>{
  await page.setViewportSize({width:390,height:720});const label='立即登录企业统一身份认证工作台'.repeat(8);await page.goto(`/login-${kind}/?productName=${encodeURIComponent('工作台'.repeat(42))}&submitLabel=${encodeURIComponent(label)}&visualAcceptance`);const submit=page.locator('.xui-login-submit');await expect(submit).toBeEnabled();await page.evaluate(()=>{document.documentElement.style.fontSize='200%';document.documentElement.style.setProperty('--font-sans','monospace');});await submit.evaluate(element=>element.scrollIntoView({block:'nearest'}));await settle(page);await expect(submit).toHaveAccessibleName(label);const idle=await submit.evaluate(element=>({rect:element.getBoundingClientRect().toJSON(),height:element.clientHeight,scrollHeight:element.scrollHeight,scrollTop:element.scrollTop,outline:getComputedStyle(element).outlineStyle}));expect(idle.rect.y).toBeGreaterThanOrEqual(0);expect(idle.rect.bottom).toBeLessThanOrEqual(720);expect(idle.rect.height).toBeLessThanOrEqual(144);expect(idle.scrollHeight).toBeGreaterThan(idle.height);expect(idle.scrollTop).toBe(0);await submit.evaluate(element=>element.scrollTop=element.scrollHeight);expect(await submit.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);await submit.evaluate(element=>element.scrollTop=0);await paintedFocus(page,submit,info,`${kind}-long-primary-focus`);
  await page.getByRole('textbox',{name:'用户名',exact:true}).fill('demo');await page.getByLabel('密码').fill('FAKE_LONG_ACTION_PASSWORD');await submit.evaluate(element=>element.scrollTop=element.scrollHeight);expect(await submit.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);await page.evaluate(()=>window.loginDemo.repeatAuthNotification());expect(await submit.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);await page.evaluate(()=>window.loginDemo.setMode('login','hold'));await submit.click();await expect.poll(()=>page.evaluate(()=>window.loginDemo.auth.getState().busy)).toBe('login');await expect(submit).toBeDisabled();const busy=await submit.evaluate(element=>{const r=element.getBoundingClientRect(),label=element.querySelector('span').getBoundingClientRect(),contentTop=r.top+element.clientTop,contentBottom=contentTop+element.clientHeight;return {button:{top:r.top,right:r.right,bottom:r.bottom,left:r.left,contentTop,contentBottom,scrollTop:element.scrollTop},label:{top:label.top,right:label.right,bottom:label.bottom,left:label.left},text:element.querySelector('span').textContent};});expect(busy.button.scrollTop).toBe(0);expect(busy.text).toBe('正在登录…');expect(busy.label.top).toBeGreaterThanOrEqual(busy.button.contentTop);expect(busy.label.bottom).toBeLessThanOrEqual(busy.button.contentBottom);expect(busy.label.left).toBeGreaterThanOrEqual(busy.button.left);expect(busy.label.right).toBeLessThanOrEqual(busy.button.right);await expect(submit).toHaveAccessibleName('正在登录…');await expect(page.getByRole('button',{name:'取消等待'})).toHaveCount(0);await page.evaluate(()=>window.loginDemo.release('login'));
});
