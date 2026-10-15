import {test,expect} from '@playwright/test';

const engine='**/password-strength-*/chunks/password-strength-worker-*.js';
const fields=page=>({password:page.getByLabel(/^新密码(?:\s*\*)?$/),meter:page.locator('[data-xui-password-strength]'),status:page.locator('[data-xui-password-strength-status]')});
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function expectEmptyMeter(meter,summary){
 await expect(meter).toHaveAttribute('role','meter');await expect(meter).toHaveAccessibleName('密码强度');await expect(meter).toHaveAttribute('aria-valuemin','0');await expect(meter).toHaveAttribute('aria-valuemax','5');await expect(meter).not.toHaveAttribute('aria-valuenow',/.+/);await expect(meter).toHaveAttribute('aria-valuetext',summary);await expect(meter).not.toHaveAttribute('data-level',/.+/);
 const state=await meter.evaluate(node=>({native:node instanceof HTMLMeterElement,min:node.min,max:node.max,value:node.value}));expect(state).toEqual({native:true,min:0,max:5,value:0});
}
async function expectScore(meter,{score,level,summary}){
 const value=score+1;await expect(meter).toHaveAttribute('role','meter');await expect(meter).toHaveAccessibleName('密码强度');await expect(meter).toHaveAttribute('aria-valuemin','0');await expect(meter).toHaveAttribute('aria-valuemax','5');await expect(meter).toHaveAttribute('aria-valuenow',String(value));await expect(meter).toHaveAttribute('aria-valuetext',summary);await expect(meter).toHaveAttribute('data-level',level);
 const state=await meter.evaluate(node=>({native:node instanceof HTMLMeterElement,min:node.min,max:node.max,value:node.value,paint:getComputedStyle(node,'::-webkit-meter-optimum-value').backgroundColor,box:node.getBoundingClientRect().toJSON()}));expect(state.native).toBe(true);expect(state.min).toBe(0);expect(state.max).toBe(5);expect(state.value).toBe(value);expect(state.box.width).toBeGreaterThan(0);expect(state.paint).not.toBe('rgba(0, 0, 0, 0)');
}
async function expectNoVisibleLegacyGuidance(page){
 await expect(page.locator('[data-xui-password-count],[data-xui-password-advice]')).toHaveCount(0);await expect(page.getByRole('button',{name:'改进建议'})).toHaveCount(0);
 const meter=page.locator('[data-xui-password-strength]'),status=page.locator('[data-xui-password-strength-status]');await expect(meter).toBeVisible();await expect(status).toHaveCSS('clip-path','inset(50%)');
 const guidance=await page.locator('#app').evaluate(root=>Array.from(root.querySelectorAll('.xui-help')).filter(node=>{const style=getComputedStyle(node);return style.display!=='none'&&style.visibility!=='hidden'&&!node.matches('[data-xui-password-strength-status]');}).map(node=>node.innerText).join(' '));expect(guidance).not.toMatch(/6–32|已输入\d+个字符|等待输入|评估中|暂不可评估|改进建议|建议避开/);
}

for(const kind of ['react']){
 test(`${kind}: lazy local strength uses a five-step advisory meter and never gates a weak valid password`,async({page},info)=>{
  const requests=[];page.on('request',request=>requests.push(request));await page.goto(`/password-strength-${kind}/`);const {password,meter,status}=fields(page);await expect(password).toBeVisible();await expectNoVisibleLegacyGuidance(page);await expectEmptyMeter(meter,'等待输入');await expect(status).toHaveText('等待输入');expect(requests.filter(request=>request.url().includes('/password-policy'))).toHaveLength(0);expect(requests.filter(request=>request.url().includes('/password-strength-worker-'))).toHaveLength(0);
  const samples=[['password',0,'weak','弱'],['admin123',1,'weak','弱'],['December2025!',2,'medium','中'],['I love you',3,'strong','强'],['t7#Vz_9m+Lp2',4,'strong','强']];let timing;
  await password.fill(samples[0][0]);await expect.poll(()=>meter.getAttribute('aria-valuenow')).toBe('1');await expectScore(meter,{score:0,level:'weak',summary:'弱'});await page.getByRole('button',{name:'Submit fixture'}).click();await expect(page.locator('[data-submit-result]')).toHaveText('accepted');
  await page.evaluate(()=>{const samples={inputEvents:0,maxTimerDelay:0,longTasks:[]};let prior=performance.now();const timer=setInterval(()=>{const now=performance.now();samples.maxTimerDelay=Math.max(samples.maxTimerDelay,now-prior);prior=now;},16);const input=()=>samples.inputEvents++;document.addEventListener('input',input);const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())samples.longTasks.push(entry.duration);});observer.observe({type:'longtask',buffered:false});window.strengthTiming={finish:()=>{clearInterval(timer);observer.disconnect();document.removeEventListener('input',input);return samples;}};});
  for(const [index,[value,score,level,summary]]of samples.entries()){
   if(index===0)await password.pressSequentially(value,{delay:20});else await password.fill(value);
   await expect.poll(()=>meter.getAttribute('aria-valuenow')).toBe(String(score+1));await settle(page);await expectScore(meter,{score,level,summary});await expect(status).toHaveText(summary);await expectNoVisibleLegacyGuidance(page);
  }
  timing=await page.evaluate(()=>window.strengthTiming.finish());expect(timing.inputEvents).toBeGreaterThan(0);expect(requests.filter(request=>request.url().includes('/password-policy'))).toHaveLength(0);expect(requests.filter(request=>new URL(request.url()).pathname.startsWith('/api/'))).toHaveLength(0);expect(requests.filter(request=>request.method()!=='GET')).toHaveLength(0);await info.attach(`${kind}-strength-meter.json`,{body:JSON.stringify({samples:samples.map(([password,score,level,summary])=>({password,score,level,summary})),timing,workerRequests:requests.filter(request=>request.url().includes('/password-strength-worker-')).map(request=>request.url())},null,2),contentType:'application/json'});
  await page.evaluate(()=>window.passwordStrengthFixture.clear());await expect(password).toHaveValue('');await expectEmptyMeter(meter,'等待输入');await expect(status).toHaveText('等待输入');
 });

 test(`${kind}: unavailable local estimator leaves an accessible empty meter and never blocks submission`,async({page})=>{
  await page.route(engine,route=>route.abort('failed'));await page.goto(`/password-strength-${kind}/`);const {password,meter,status}=fields(page);await expectEmptyMeter(meter,'等待输入');await password.fill('password');await expect.poll(()=>meter.getAttribute('aria-valuetext')).toBe('暂不可评估');await expectEmptyMeter(meter,'暂不可评估');await expect(status).toHaveText('暂不可评估');await expectNoVisibleLegacyGuidance(page);await page.getByRole('button',{name:'Submit fixture'}).click();await expect(page.locator('[data-submit-result]')).toHaveText('accepted');
 });

 test(`${kind}: a late dictionary load estimates only the latest input`,async({page})=>{
  let held;await page.route(engine,route=>{held=route;});await page.goto(`/password-strength-${kind}/`);const {password,meter,status}=fields(page);await password.fill('password');await expect.poll(()=>!!held).toBe(true);await expect(meter).toHaveAttribute('aria-valuetext','评估中');await expectEmptyMeter(meter,'评估中');await expect(status).toHaveText('评估中');await password.fill('t7#Vz_9m+Lp2');await held.continue();await expect.poll(()=>meter.getAttribute('aria-valuenow')).toBe('5');await expectScore(meter,{score:4,level:'strong',summary:'强'});await expect(status).toHaveText('强');
 });

 test(`${kind}: teardown during a pending dictionary load ignores its late result`,async({page})=>{
  let held;const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.route(engine,route=>{held=route;});await page.goto(`/password-strength-${kind}/`);const {password}=fields(page);await password.fill('password');await expect.poll(()=>!!held).toBe(true);await page.evaluate(()=>window.passwordStrengthFixture.destroy());await held.continue();await page.waitForTimeout(200);await expect(page.locator('[data-xui-password-strength]')).toHaveCount(0);expect(errors).toEqual([]);
 });
 test(`${kind}: worker-src CSP blocks estimation without adding a password submission gate`,async({page})=>{
  await page.route(`**/password-strength-${kind}/`,async route=>{const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'content-security-policy':"worker-src 'none'"}});});await page.goto(`/password-strength-${kind}/`);const {password,meter,status}=fields(page);await password.fill('password');await expect.poll(()=>meter.getAttribute('aria-valuetext')).toBe('暂不可评估');await expectEmptyMeter(meter,'暂不可评估');await expect(status).toHaveText('暂不可评估');await expectNoVisibleLegacyGuidance(page);await page.getByRole('button',{name:'Submit fixture'}).click();await expect(page.locator('[data-submit-result]')).toHaveText('accepted');
 });
}
