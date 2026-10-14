import {test,expect} from '@playwright/test';
import {readableFeedback} from './auth-feedback-helpers.mjs';
for(const kind of ['react','vanilla']){
 for(const mode of ['light','dark','system'])test(`${kind} ${mode} complete auth summary and keyboard disclosure at enlarged narrow text`,async({page},info)=>{
  await page.setViewportSize({width:390,height:800});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);await page.goto(`/auth-page-${kind}/?feedbackDetails`);await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  const summary=page.locator('.xui-login-feedback>.xui-alert'),trigger=page.getByRole('button',{name:'查看详细信息'}),username=page.getByRole('textbox',{name:'管理员用户名',exact:true});await username.fill('retained-admin');await username.evaluate(node=>{window.retainedInput=node;});
  await expect(summary).toHaveText('上次操作结果尚未确认，不能再次提交。');await readableFeedback(page,summary,info,`${kind}-${mode}-summary`);await expect(trigger).toHaveAttribute('aria-expanded','false');await expect(page.getByRole('button',{name:'创建管理员',exact:true})).toBeDisabled();
  await trigger.focus();await page.keyboard.press('Enter');await expect(trigger).toHaveAttribute('aria-expanded','true');const details=page.locator('.xui-login-feedback .xui-disclosure-body>p');await readableFeedback(page,details,info,`${kind}-${mode}-details`);
  const back=page.getByRole('button',{name:'返回管理员用户名'});await page.keyboard.press('Tab');await expect(back).toBeFocused();await page.keyboard.press('Enter');await expect(username).toBeFocused();await expect(username).toHaveValue('retained-admin');expect(await username.evaluate(node=>node===window.retainedInput)).toBe(true);
  await trigger.focus();await page.keyboard.press('Space');await expect(trigger).toHaveAttribute('aria-expanded','false');await expect(trigger).toBeFocused();await expect(summary).toHaveText('上次操作结果尚未确认，不能再次提交。');expect(await page.evaluate(()=>window.authPageDemo.getSubmissions())).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
 for(const family of ['login','admin-setup'])test(`${kind} ${family} required indicators preserve exact accessible names`,async({page})=>{
  await page.goto(`/${family}-${kind}/`);await expect(page.locator('.xui-login-submit')).toBeEnabled();const labels=family==='login'?['用户名','密码']:['管理员用户名','新密码','确认密码'];
  for(const name of labels){const label=page.locator('.xui-label').filter({hasText:name}).filter({has:page.locator('[aria-hidden=true]')});await expect(label).toHaveCount(1);await expect(label).toHaveText(name+' *');const input=page.locator('[id="'+await label.getAttribute('for')+'"]');await expect(input).toHaveAccessibleName(name);await expect(input).toHaveAttribute('required','');}
 });
 test(`${kind} login busy has one visible live state`,async({page},info)=>{
  await page.goto(`/login-${kind}/`);await expect(page.locator('.xui-login-submit')).toBeEnabled();await page.getByRole('textbox',{name:'用户名',exact:true}).fill('demo');await page.locator('input[name=password]').fill('FAKE_REVIEW_PASSWORD');await page.evaluate(()=>window.loginDemo.setMode('login','hold'));await page.locator('.xui-login-submit').click();
  await expect(page.getByRole('status')).toHaveCount(1);await expect(page.locator('.xui-login-actions>.xui-login-announcement')).toHaveText('正在登录…');await expect(page.locator('.xui-login-feedback .xui-alert')).toBeHidden();await expect(page.locator('.xui-login-submit')).toBeDisabled();await expect(page.locator('.xui-login-submit')).toHaveAttribute('aria-busy','true');await info.attach(`${kind}-login-single-busy`,{body:await page.screenshot(),contentType:'image/png'});await page.evaluate(()=>{window.loginDemo.destroy();window.loginDemo.release('login');});
 });
}
