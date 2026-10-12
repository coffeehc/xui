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
