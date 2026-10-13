import {test,expect} from '@playwright/test';
const engine='**/password-strength-*/chunks/password-strength-engine-*.js';
const fields=page=>({password:page.getByLabel(/^新密码(?:\s*\*)?$/),confirmation:page.getByLabel(/^确认密码(?:\s*\*)?$/),strength:page.locator('[data-xui-password-strength]')});
for(const kind of ['react','vanilla']){
 test(`${kind}: strength is lazy, local and advisory; common mixed passwords still remain weak`,async({page},info)=>{
  const requests=[];page.on('request',request=>requests.push(request));await page.goto(`/password-strength-${kind}/`);const {password,confirmation,strength}=fields(page);await expect(password).toBeVisible();expect(requests.filter(r=>r.url().includes('/password-strength-engine-'))).toHaveLength(0);
  await page.evaluate(()=>{const samples={inputEvents:0,maxTimerDelay:0,longTasks:[]};let prior=performance.now();const timer=setInterval(()=>{const now=performance.now();samples.maxTimerDelay=Math.max(samples.maxTimerDelay,now-prior);prior=now;},16);const input=()=>samples.inputEvents++;document.addEventListener('input',input);const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())samples.longTasks.push(entry.duration);});observer.observe({type:'longtask',buffered:false});window.strengthTiming={finish:()=>{clearInterval(timer);observer.disconnect();document.removeEventListener('input',input);return samples;}};});await password.pressSequentially('Password1!',{delay:20});await confirmation.fill('Password1!');await expect(strength).toContainText('密码强度：弱');await expect(strength).toContainText('常见密码');await page.getByRole('button',{name:'Submit fixture'}).click();await expect(page.locator('[data-submit-result]')).toHaveText('accepted');
  await password.fill('t7#Vz_9m+Lp2');await expect(strength).toContainText('密码强度：强');await expect(strength).toContainText('仅供参考');expect(requests.filter(r=>r.method()!=='GET')).toHaveLength(0);await info.attach(`${kind}-strength-browser-timing.json`,{body:JSON.stringify(await page.evaluate(()=>window.strengthTiming.finish())),contentType:'application/json'});
  await page.evaluate(()=>window.passwordStrengthFixture.clear());await expect(strength).toBeEmpty();await expect(password).toHaveValue('');await expect(page.locator('[data-xui-password-count]')).toHaveText('已输入0个字符');
 });
 test(`${kind}: an offline estimator never blocks a valid new password`,async({page})=>{
  await page.route(engine,route=>route.abort('failed'));await page.goto(`/password-strength-${kind}/`);const {password,confirmation,strength}=fields(page);await password.fill('password');await confirmation.fill('password');await expect(strength).toContainText('暂时无法评估');await page.getByRole('button',{name:'Submit fixture'}).click();await expect(page.locator('[data-submit-result]')).toHaveText('accepted');
 });
 test(`${kind}: a late dictionary load scores only the latest input and teardown ignores late work`,async({page})=>{
  let held;await page.route(engine,route=>{held=route;});await page.goto(`/password-strength-${kind}/`);const {password,strength}=fields(page);await password.fill('password');await expect.poll(()=>!!held).toBe(true);await password.fill('t7#Vz_9m+Lp2');await held.continue();await expect(strength).toContainText('密码强度：强');
  await password.fill('abcabcabc');await page.evaluate(()=>window.passwordStrengthFixture.destroy());await expect(password).toHaveCount(0);await page.waitForTimeout(200);await expect(page.locator('[data-xui-password-strength]')).toHaveCount(0);
 });
}
