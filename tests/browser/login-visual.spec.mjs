import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

const stableKeys=['brand','identity','title','username','password','submit','actions'];
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function measurements(page){return page.evaluate(()=>{
  const selectors={brand:'.xui-login-brand',identity:'.xui-login-identity',logo:'.xui-login-logo',product:'.xui-login-identity strong',description:'.xui-login-description',visual:'.xui-login-visual',content:'.xui-login-content',title:'.xui-login-body h1',label:'.xui-login-body .xui-label',username:'input[name=username]',password:'input[name=password]',submit:'.xui-login-submit',actions:'.xui-login-actions',feedback:'.xui-login-feedback',support:'.xui-login-support'};
  return {viewport:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth},state:window.loginDemo.auth.getState().status,busy:window.loginDemo.auth.getState().busy,elements:Object.fromEntries(Object.entries(selectors).map(([name,selector])=>{const element=document.querySelector(selector),rect=element.getBoundingClientRect(),style=getComputedStyle(element);return [name,{x:rect.x,y:rect.y,width:rect.width,height:rect.height,right:rect.right,bottom:rect.bottom,fontSize:style.fontSize,lineHeight:style.lineHeight,display:style.display,scrollHeight:element.scrollHeight,clientHeight:element.clientHeight}];}))};
});}
function stable(before,after){for(const key of stableKeys)for(const dimension of ['x','y','width','height'])expect(Math.abs(after.elements[key][dimension]-before.elements[key][dimension]),`${key}.${dimension} remains stable`).toBeLessThanOrEqual(1.5);}
async function evidence(page,info,name,data){
  const image=info.outputPath(name+'.png'),json=info.outputPath(name+'.json');
  await page.screenshot({path:image,animations:'disabled'});
  await writeFile(json,JSON.stringify({standard:'docs/LOGIN_VISUAL_ACCEPTANCE.md',expected:{title:'32/40px',brand:'20/28px',logo:40,maxContentWidth:400,controlHeight:40,passwordToPrimaryGap:16,maximumStateGeometryDelta:1.5},measured:data},null,2));
  await info.attach(name,{path:image,contentType:'image/png'});await info.attach(name+'-geometry',{path:json,contentType:'application/json'});
}
for(const kind of ['react','vanilla'])for(const appearance of ['light','dark','system'])for(const width of [1280,390]){
  test(`${kind} visual acceptance ${appearance} ${width}: hierarchy, idle, error and busy`,async({page},info)=>{
    await page.setViewportSize({width,height:800});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>localStorage.setItem('ui.theme.mode',mode),appearance);
    await page.goto(`/login-${kind}/?visual&visualAcceptance&productName=${encodeURIComponent('统一协作与数据管理工作台')}&title=${encodeURIComponent('登录团队协作工作台')}`);
    const submit=page.getByRole('button',{name:'登录',exact:true}),username=page.getByRole('textbox',{name:'用户名',exact:true}),password=page.getByLabel('密码');
    await expect(submit).toBeEnabled();await expect.poll(()=>page.locator('.xui-login-visual img').evaluate(image=>image.complete&&image.naturalWidth===640&&image.naturalHeight===480)).toBe(true);await settle(page);
    const idle=await measurements(page),e=idle.elements;
    expect(e.content.width).toBeLessThanOrEqual(400);expect(e.title.fontSize).toBe('32px');expect(e.title.lineHeight).toBe('40px');expect(e.product.fontSize).toBe('20px');expect(e.product.lineHeight).toBe('28px');expect(e.label.fontSize).toBe('13px');expect(e.username.fontSize).toBe('14px');
    for(const key of ['logo','username','password','submit'])expect(e[key].height).toBeCloseTo(40,0);
    expect(e.logo.width).toBeCloseTo(40,0);expect(e.submit.width).toBeCloseTo(e.password.width,0);expect(e.username.width).toBeCloseTo(e.password.width,0);
    expect(e.username.y-e.label.bottom).toBeCloseTo(8,0);expect(e.password.y-e.username.bottom-e.label.height-8).toBeCloseTo(16,0);expect(e.submit.y-e.password.bottom).toBeCloseTo(16,0);expect(e.label.y-e.title.bottom).toBeCloseTo(24,0);
    expect(e.feedback.y).toBeGreaterThanOrEqual(e.submit.bottom);expect(e.feedback.height).toBeCloseTo(48,0);expect(e.identity.bottom).toBeLessThan(e.description.y);
    if(width===1280){expect(e.description.bottom).toBeLessThan(e.visual.y);expect(e.visual.height).toBeGreaterThan(250);}else expect(e.visual.display).toBe('none');
    await expect(page.locator('.xui-login-actions button:visible')).toHaveCount(1);await expect(page.getByRole('button',{name:'重试连接',exact:true})).toHaveCount(0);await expect(page.locator('.xui-login-form .xui-reserved-action')).toHaveCount(0);
    expect(idle.viewport.scrollWidth).toBeLessThanOrEqual(width);await expect(submit).toBeInViewport();await evidence(page,info,`${kind}-${appearance}-${width}-idle`,idle);
    await page.evaluate(()=>window.loginDemo.setMode('login','credentials'));await username.fill('demo');await password.fill('FAKE_VISUAL_PASSWORD');await submit.click();await expect(page.getByRole('alert')).toHaveText('用户名或密码不正确。');await settle(page);
    const error=await measurements(page);stable(idle,error);await expect(page.getByRole('button',{name:'重试连接',exact:true})).toHaveCount(0);await expect(password).toHaveValue('');await evidence(page,info,`${kind}-${appearance}-${width}-error`,error);
    await page.evaluate(()=>window.loginDemo.setMode('login','hold'));await password.fill('FAKE_VISUAL_PASSWORD');await submit.click();await expect(page.getByRole('button',{name:'正在登录…',exact:true})).toBeDisabled();await settle(page);
    const busy=await measurements(page);expect(busy.busy).toBe('login');stable(idle,busy);await expect(page.locator('.xui-login-feedback').getByRole('button',{name:'取消等待'})).toBeVisible();await evidence(page,info,`${kind}-${appearance}-${width}-busy`,busy);
    await page.getByRole('button',{name:'取消等待'}).click();await expect(username).toBeFocused();await page.evaluate(()=>window.loginDemo.release('login'));
    expect(await page.evaluate(()=>window.loginDemo.getDestinations())).toEqual([]);
  });
}
for(const kind of ['react','vanilla']){
  test(`${kind} login title respects independent font and line-height preferences`,async({page})=>{
    await page.goto(`/login-${kind}/`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();
    const title=page.locator('.xui-login-body h1');
    for(const [font,line,height,size] of [['1','2','80px','32px'],['2','1','80px','64px'],['.5','.5','20px','16px']]){
      await page.evaluate(({font,line})=>{document.documentElement.style.setProperty('--font-scale',font);document.documentElement.style.setProperty('--line-height-scale',line);},{font,line});
      expect(await title.evaluate(element=>({size:getComputedStyle(element).fontSize,height:getComputedStyle(element).lineHeight}))).toEqual({size,height});
    }
  });
  test(`${kind} real Tab order exposes only actual actions and returns focus after cancel`,async({page},info)=>{
    await page.goto(`/login-${kind}/?extensions&visualAcceptance`);const submit=page.getByRole('button',{name:'登录',exact:true});await expect(submit).toBeEnabled();
    await page.getByLabel('服务地址').focus();
    for(const target of [page.getByLabel('账户来源'),page.getByRole('textbox',{name:'用户名',exact:true}),page.getByLabel('密码'),submit,page.getByRole('button',{name:'企业 OIDC 登录'}),page.getByRole('button',{name:'企业 SAML 登录'})]){await page.keyboard.press('Tab');await expect(target).toBeFocused();}
    await expect(page.getByRole('button',{name:'取消等待'})).toHaveCount(0);await expect(page.getByRole('button',{name:'重试连接'})).toHaveCount(0);
    await page.evaluate(()=>window.loginDemo.setExtensionMode('hold'));await page.getByRole('button',{name:'企业 SAML 登录'}).click();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'取消等待'})).toBeFocused();
    await info.attach(`${kind}-cancel-keyboard`,{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});await page.keyboard.press('Enter');await expect(page.getByRole('textbox',{name:'用户名',exact:true})).toBeFocused();await page.evaluate(()=>window.loginDemo.releaseExtension());
  });
  test(`${kind} explicit safe read recovery stays local and does not become a login peer`,async({page},info)=>{
    await page.goto(`/login-${kind}/?sessionReadError&visualAcceptance`);const retry=page.getByRole('button',{name:'重试连接',exact:true});await expect(retry).toBeVisible();await expect(page.locator('.xui-login-feedback').getByRole('button',{name:'重试连接',exact:true})).toHaveCount(1);await expect(page.locator('.xui-login-actions button:visible')).toHaveCount(1);
    expect(await page.evaluate(()=>window.loginDemo.auth.getState().reauthenticationRequired)).toBe(false);await page.keyboard.press('Tab');await retry.focus();await info.attach(`${kind}-safe-recovery`,{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});
    await page.evaluate(()=>window.loginDemo.setMode('session','ok'));await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'示例工作区',exact:true})).toBeVisible();expect((await page.evaluate(()=>window.loginDemo.getRequests())).filter(request=>request.path.endsWith('/login')||request.path.endsWith('/logout'))).toEqual([]);
  });
}

for(const kind of ['react','vanilla'])test(`${kind} automatic checks are bounded and only a confirmed read timeout offers retry`,async({page})=>{
  await page.goto(`/login-${kind}/?session=hold`);await expect(page.getByRole('status')).toHaveText('正在确认登录状态…');await expect(page.getByRole('button',{name:'取消等待'})).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveText('会话安全状态尚未确认，请重新登录验证。');await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();await expect(page.getByRole('button',{name:'重试连接'})).toHaveCount(0);
  expect((await page.evaluate(()=>window.loginDemo.getRequests())).filter(request=>request.path.endsWith('/refresh'))).toHaveLength(1);await page.evaluate(()=>window.loginDemo.release('session'));expect(await page.evaluate(()=>window.loginDemo.getDestinations())).toEqual([]);
  await page.goto(`/login-${kind}/?sessionReadTimeout`);const retry=page.getByRole('button',{name:'重试连接'});await expect(retry).toBeVisible();
  const before=await page.evaluate(()=>({state:window.loginDemo.auth.getState(),requests:window.loginDemo.getRequests()}));expect(before.state.reauthenticationRequired).toBe(false);expect(before.state.error.kind).toBe('timeout');expect(before.requests.filter(request=>request.path.endsWith('/session'))).toHaveLength(1);
  await page.evaluate(()=>{window.loginDemo.setMode('session','ok');window.loginDemo.release('session');});await retry.click();await expect(page.getByRole('heading',{name:'示例工作区',exact:true})).toBeVisible();
  expect((await page.evaluate(()=>window.loginDemo.getRequests())).filter(request=>request.path.endsWith('/session'))).toHaveLength(2);
});
