import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

const stableKeys=['card','brand','form','identity','title','username','password','submit','actions'];
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function measurements(page){return page.evaluate(()=>{
  const selectors={card:'.xui-login-card',brand:'.xui-login-brand',form:'.xui-login-form',identity:'.xui-login-identity',logo:'.xui-login-logo',product:'.xui-login-identity strong',description:'.xui-login-description',content:'.xui-login-content',title:'.xui-login-body h1',label:'.xui-login-body .xui-label',username:'input[name=username]',password:'input[name=password]',submit:'.xui-login-submit',actions:'.xui-login-actions',feedback:'.xui-login-feedback',support:'.xui-login-support'};
  return {viewport:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth},state:window.loginDemo.auth.getState().status,busy:window.loginDemo.auth.getState().busy,elements:Object.fromEntries(Object.entries(selectors).map(([name,selector])=>{const element=document.querySelector(selector),rect=element.getBoundingClientRect(),style=getComputedStyle(element);return [name,{x:rect.x,y:rect.y,width:rect.width,height:rect.height,right:rect.right,bottom:rect.bottom,fontSize:style.fontSize,lineHeight:style.lineHeight,display:style.display,scrollHeight:element.scrollHeight,clientHeight:element.clientHeight}];}))};
});}
function stable(before,after){for(const key of stableKeys)for(const dimension of ['x','y','width','height'])expect(Math.abs(after.elements[key][dimension]-before.elements[key][dimension]),`${key}.${dimension} remains stable`).toBeLessThanOrEqual(1.5);}
async function evidence(page,info,name,data){
  const image=info.outputPath(name+'.png'),json=info.outputPath(name+'.json');
  await page.screenshot({path:image,animations:'disabled'});
  await writeFile(json,JSON.stringify({standard:'docs/LOGIN_VISUAL_ACCEPTANCE.md',expected:{title:'28/36px',brand:'14/22px',logo:32,maxCardWidth:434,maxContentWidth:384,controlHeight:44,passwordToPrimaryGap:16,maximumStateGeometryDelta:1.5},measured:data},null,2));
  await info.attach(name,{path:image,contentType:'image/png'});await info.attach(name+'-geometry',{path:json,contentType:'application/json'});
}
for(const kind of ['react','vanilla'])for(const appearance of ['light','dark','system'])for(const width of [1280,1600,390]){
  test(`${kind} login acceptance ${appearance} ${width}: centered hierarchy, idle, error and busy`,async({page},info)=>{
    await page.setViewportSize({width,height:800});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>localStorage.setItem('ui.theme.mode',mode),appearance);
    await page.goto(`/login-${kind}/?visualAcceptance&productName=${encodeURIComponent('统一协作与数据管理工作台')}&title=${encodeURIComponent('登录团队协作工作台')}`);
    const submit=page.getByRole('button',{name:'登录',exact:true}),username=page.getByRole('textbox',{name:'用户名',exact:true}),password=page.getByLabel('密码');
    await expect(submit).toBeEnabled();await settle(page);
    const idle=await measurements(page),e=idle.elements;
    expect(e.card.width).toBeLessThanOrEqual(Math.min(width,434));expect(Math.abs((e.card.x+e.card.width/2)-width/2)).toBeLessThanOrEqual(1);
    expect(e.content.width).toBeLessThanOrEqual(384);expect(e.form.width).toBeLessThanOrEqual(384);expect(e.brand.bottom).toBeLessThanOrEqual(e.form.y);
    expect(e.title.fontSize).toBe('28px');expect(e.title.lineHeight).toBe('36px');expect(e.product.fontSize).toBe('14px');expect(e.product.lineHeight).toBe('22px');expect(e.label.fontSize).toBe('14px');expect(e.username.fontSize).toBe('16px');
    for(const key of ['username','password','submit'])expect(e[key].height).toBeCloseTo(44,0);
    expect(e.logo.width).toBeCloseTo(32,0);expect(e.submit.width).toBeCloseTo(e.password.width,0);expect(e.username.width).toBeCloseTo(e.password.width,0);
    expect(e.username.y-e.label.bottom).toBeCloseTo(8,0);expect(e.password.y-e.username.bottom-e.label.height-8).toBeCloseTo(16,0);expect(e.submit.y-e.password.bottom).toBeCloseTo(16,0);expect(e.label.y-e.description.bottom).toBeCloseTo(24,0);
    expect(e.feedback.y).toBeGreaterThanOrEqual(e.submit.bottom);expect(e.feedback.height).toBeCloseTo(40,0);expect(e.identity.bottom).toBeLessThan(e.title.y);expect(e.description.y-e.title.bottom).toBeCloseTo(8,0);expect(e.card.bottom-e.submit.bottom).toBeCloseTo(57,0);
    await expect(page.locator('.xui-login-visual')).toBeHidden();await expect(page.locator('.xui-login-visual img')).toHaveCount(0);
    await expect(page.locator('.xui-login-actions button:visible')).toHaveCount(1);await expect(page.getByRole('button',{name:'重试连接',exact:true})).toHaveCount(0);await expect(page.locator('.xui-login-form .xui-reserved-action')).toHaveCount(0);
    expect(idle.viewport.scrollWidth).toBeLessThanOrEqual(width);await expect(submit).toBeInViewport();await evidence(page,info,`${kind}-${appearance}-${width}-idle`,idle);
    await page.evaluate(()=>window.loginDemo.setMode('login','credentials'));await username.fill('demo');await password.fill('FAKE_VISUAL_PASSWORD');await submit.click();await expect(page.getByRole('alert')).toHaveText('用户名或密码不正确。');await settle(page);
    const error=await measurements(page);stable(idle,error);await expect(page.getByRole('button',{name:'重试连接',exact:true})).toHaveCount(0);await expect(password).toHaveValue('');await evidence(page,info,`${kind}-${appearance}-${width}-error`,error);
    await page.evaluate(()=>window.loginDemo.setMode('login','hold'));await password.fill('FAKE_VISUAL_PASSWORD');await submit.click();await expect(page.getByRole('button',{name:'正在登录…',exact:true})).toBeDisabled();await settle(page);
    const busy=await measurements(page);expect(busy.busy).toBe('login');stable(idle,busy);await expect(page.getByRole('button',{name:'取消等待'})).toHaveCount(0);await evidence(page,info,`${kind}-${appearance}-${width}-busy`,busy);
    await page.evaluate(()=>{window.loginDemo.destroy();window.loginDemo.release('login');});await settle(page);await expect(page.locator('.xui-login-page')).toHaveCount(0);
    expect(await page.evaluate(()=>window.loginDemo.getDestinations())).toEqual([]);
  });
}
for(const kind of ['react','vanilla']){
  test(`${kind} login title respects independent font and line-height preferences`,async({page})=>{
    await page.goto(`/login-${kind}/`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();
    const title=page.locator('.xui-login-body h1');
    for(const [font,line,height,size] of [['1','2','72px','28px'],['2','1','72px','56px'],['.5','.5','18px','14px']]){
      await page.evaluate(({font,line})=>{document.documentElement.style.setProperty('--font-scale',font);document.documentElement.style.setProperty('--line-height-scale',line);},{font,line});
      expect(await title.evaluate(element=>({size:getComputedStyle(element).fontSize,height:getComputedStyle(element).lineHeight}))).toEqual({size,height});
    }
  });
  test(`${kind} real Tab order exposes only actual actions and unmount blocks late extensions`,async({page},info)=>{
    await page.goto(`/login-${kind}/?extensions&visualAcceptance`);const submit=page.getByRole('button',{name:'登录',exact:true});await expect(submit).toBeEnabled();
    await page.getByLabel('服务地址').focus();
    for(const target of [page.getByLabel('账户来源'),page.getByRole('textbox',{name:'用户名',exact:true}),page.getByLabel('密码'),submit,page.getByRole('button',{name:'企业 OIDC 登录'}),page.getByRole('button',{name:'企业 SAML 登录'})]){await page.keyboard.press('Tab');await expect(target).toBeFocused();}
    await expect(page.getByRole('button',{name:'取消等待'})).toHaveCount(0);await expect(page.getByRole('button',{name:'重试连接'})).toHaveCount(0);
    await page.evaluate(()=>window.loginDemo.setExtensionMode('hold'));await page.getByRole('button',{name:'企业 SAML 登录'}).click();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'取消等待'})).toHaveCount(0);await expect(submit).toBeDisabled();
    await info.attach(`${kind}-extension-busy-keyboard`,{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});await page.evaluate(()=>{window.loginDemo.destroy();window.loginDemo.releaseExtension();});await settle(page);await expect(page.locator('.xui-login-page')).toHaveCount(0);expect(await page.evaluate(()=>window.loginDemo.getDestinations())).toEqual([]);
  });
  test(`${kind} explicit safe read recovery stays local and does not become a login peer`,async({page},info)=>{
    await page.goto(`/login-${kind}/?sessionReadError&handoff=hold&visualAcceptance`);const retry=page.getByRole('button',{name:'重试连接',exact:true});await expect(retry).toBeVisible();await expect(page.locator('.xui-login-feedback').getByRole('button',{name:'重试连接',exact:true})).toHaveCount(1);await expect(page.locator('.xui-login-actions button:visible')).toHaveCount(1);
    await expect.poll(()=>page.evaluate(()=>{const state=window.loginDemo.auth.getState();return state.error?.metadata.endpointId==='auth.session'&&state.error.kind==='network';})).toBe(true);await page.keyboard.press('Tab');await retry.focus();await info.attach(`${kind}-safe-recovery`,{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});
    await page.evaluate(()=>window.loginDemo.setMode('session','ok'));await retry.click();await expect.poll(()=>page.evaluate(()=>window.loginDemo.auth.getState().status==='authenticated'&&window.loginDemo.auth.getState().busy===null&&window.loginDemo.getRequests().filter(request=>request.path.endsWith('/session')).length===2)).toBe(true);expect((await page.evaluate(()=>window.loginDemo.getRequests())).filter(request=>request.path.endsWith('/login')||request.path.endsWith('/logout'))).toEqual([]);await page.evaluate(()=>window.loginDemo.releaseHandoff());await expect(page.getByRole('heading',{name:'示例工作区',exact:true})).toBeVisible();
  });
}

for(const kind of ['react','vanilla'])test(`${kind} startup refresh timeout clears busy state and leaves ordinary login available`,async({page})=>{
  await page.goto(`/login-${kind}/?session=hold`);await expect(page.getByRole('status')).toHaveText('正在确认登录状态…');await expect(page.getByRole('button',{name:'取消等待'})).toHaveCount(0);
  await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();await expect(page.getByRole('button',{name:'重试连接'})).toHaveCount(0);
  expect((await page.evaluate(()=>window.loginDemo.getRequests())).filter(request=>request.path.endsWith('/refresh'))).toHaveLength(1);await page.evaluate(()=>window.loginDemo.release('session'));expect(await page.evaluate(()=>window.loginDemo.getDestinations())).toEqual([]);
});

for(const kind of ['react','vanilla'])test(`${kind} a confirmed session read timeout offers safe retry`,async({page})=>{
  await page.goto(`/login-${kind}/?sessionReadTimeout&handoff=hold`);const retry=page.getByRole('button',{name:'重试连接'});await expect(retry).toBeVisible();
  const before=await page.evaluate(()=>{const state=window.loginDemo.auth.getState();return {errorKind:state.error?.kind,endpointId:state.error?.metadata.endpointId,requests:window.loginDemo.getRequests()};});expect(before.errorKind).toBe('timeout');expect(before.endpointId).toBe('auth.session');expect(before.requests.filter(request=>request.path.endsWith('/session'))).toHaveLength(1);
  await page.evaluate(()=>{window.loginDemo.setMode('session','ok');window.loginDemo.release('session');});await retry.click();await expect.poll(()=>page.evaluate(()=>window.loginDemo.auth.getState().status==='authenticated'&&window.loginDemo.auth.getState().busy===null&&window.loginDemo.getRequests().filter(request=>request.path.endsWith('/session')).length===2)).toBe(true);await page.evaluate(()=>window.loginDemo.releaseHandoff());await expect(page.getByRole('heading',{name:'示例工作区',exact:true})).toBeVisible();
  expect((await page.evaluate(()=>window.loginDemo.getRequests())).filter(request=>request.path.endsWith('/session'))).toHaveLength(2);
});
