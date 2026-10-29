import {test,expect} from '@playwright/test';

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
 test(`${kind}: basic regex feedback needs no Worker, API or asynchronous dictionary resource`,async({page},info)=>{
  const requests=[];page.on('request',request=>requests.push(request));await page.goto(`/password-strength-${kind}/`);
  const {password,meter,status}=fields(page);await expectEmptyMeter(meter,'等待输入');await expectNoVisibleLegacyGuidance(page);
  const initial=requests.length;
  for(const [value,score,level,summary]of [['password',1,'weak','弱'],['abcabcabcabc',0,'weak','弱'],['Password1!',2,'medium','中'],['t7#Vz_9m+Lp2&Q8!x',4,'strong','强']]){
   await password.fill(value);await expectScore(meter,{score,level,summary});await expect(status).toHaveText(summary);
  }
  expect(requests.slice(initial)).toHaveLength(0);expect(requests.some(request=>/password-strength-worker|zxcvbn|password-policy/.test(request.url()))).toBe(false);
  await page.getByRole('button',{name:'Submit fixture'}).click();await expect(page.locator('[data-submit-result]')).toHaveText('accepted');
  await page.evaluate(()=>window.passwordStrengthFixture.clear());await expect(password).toHaveValue('');await expectEmptyMeter(meter,'等待输入');
  await info.attach('loading-boundary.json',{body:JSON.stringify({initialRequests:requests.map(request=>new URL(request.url()).pathname),requestsAfterInput:0}),contentType:'application/json'});
 });

 test(`${kind}: an explicitly injected host API uses the existing HTTP service, with no submission gate`,async({page})=>{
  let calls=0;await page.route('**/api/xui-fixture/password-strength',route=>{calls++;expect(route.request().method()).toBe('POST');return route.fulfill({json:{score:0,hint:'common'}});});
  await page.goto(`/password-strength-${kind}/`);await page.evaluate(()=>window.passwordStrengthFixture.useRemote());
  const {password,meter}=fields(page);await password.fill('t7#Vz_9m+Lp2');await expectScore(meter,{score:0,level:'weak',summary:'弱'});expect(calls).toBe(1);
  await page.getByRole('button',{name:'Submit fixture'}).click();await expect(page.locator('[data-submit-result]')).toHaveText('accepted');expect(calls).toBe(1);
 });

 test(`${kind}: failed or malformed host API results never create a score or expose response secrets`,async({page})=>{
  let failed=true;await page.route('**/api/xui-fixture/password-strength',route=>route.fulfill(failed?{status:503,json:{message:'synthetic-secret'}}:{json:{score:4,password:'synthetic-secret'}}));
  await page.goto(`/password-strength-${kind}/`);await page.evaluate(()=>window.passwordStrengthFixture.useRemote());
  const {password,meter}=fields(page);await password.fill('synthetic-secret');await expectEmptyMeter(meter,'暂不可评估');
  failed=false;await password.fill('synthetic-secret-2');await expectEmptyMeter(meter,'暂不可评估');
  expect(JSON.stringify(await page.evaluate(()=>window.passwordStrengthFixture.state()))).not.toContain('synthetic-secret');
  await page.getByRole('button',{name:'Submit fixture'}).click();await expect(page.locator('[data-submit-result]')).toHaveText('accepted');
 });

 test(`${kind}: new input aborts the old request and a late response cannot replace the newer score`,async({page})=>{
  const pending=[],failed=[];page.on('requestfailed',request=>failed.push(request.url()));
  await page.route('**/api/xui-fixture/password-strength',route=>{pending.push(route);});await page.goto(`/password-strength-${kind}/`);await page.evaluate(()=>window.passwordStrengthFixture.useRemote());
  const {password,meter}=fields(page);await password.fill('synthetic-first');await expect.poll(()=>pending.length).toBe(1);
  await password.fill('synthetic-second');await expect.poll(()=>pending.length).toBe(2);await expect.poll(()=>failed.length).toBe(1);
  await pending[1].fulfill({json:{score:2}});await expectScore(meter,{score:2,level:'medium',summary:'中'});await pending[0].fulfill({json:{score:4}}).catch(()=>{});await settle(page);await expect(meter).toHaveAttribute('aria-valuenow','3');
 });

 test(`${kind}: clear and unmount abort host work, without late state or page errors`,async({page})=>{
  const pending=[],failed=[],errors=[];page.on('requestfailed',request=>failed.push(request.url()));page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/xui-fixture/password-strength',route=>{pending.push(route);});await page.goto(`/password-strength-${kind}/`);await page.evaluate(()=>window.passwordStrengthFixture.useRemote());
  const {password,meter}=fields(page);await password.fill('synthetic-first');await expect.poll(()=>pending.length).toBe(1);
  await page.evaluate(()=>window.passwordStrengthFixture.clear());await expectEmptyMeter(meter,'等待输入');await expect.poll(()=>failed.length).toBe(1);
  await password.fill('synthetic-second');await expect.poll(()=>pending.length).toBe(2);await page.evaluate(()=>window.passwordStrengthFixture.destroy());await expect.poll(()=>failed.length).toBe(2);
  for(const route of pending)await route.fulfill({json:{score:4}}).catch(()=>{});await expect(meter).toHaveCount(0);expect(errors).toEqual([]);
 });

 test(`${kind}: custom evaluation timeout stops the request and explicit removal restores local feedback`,async({page})=>{
  let pending;const failed=[];page.on('requestfailed',request=>failed.push(request.url()));await page.route('**/api/xui-fixture/password-strength',route=>{pending=route;});
  await page.goto(`/password-strength-${kind}/`);await page.evaluate(()=>window.passwordStrengthFixture.useRemote(50));
  const {password,meter}=fields(page);await password.fill('synthetic-first');await expectEmptyMeter(meter,'暂不可评估');await expect.poll(()=>failed.length).toBe(1);
  await page.evaluate(()=>window.passwordStrengthFixture.useBasic());await expectEmptyMeter(meter,'等待输入');await password.fill('password');await expectScore(meter,{score:1,level:'weak',summary:'弱'});await pending.fulfill({json:{score:4}}).catch(()=>{});await expect(meter).toHaveAttribute('aria-valuenow','2');
 });

 test(`${kind}: blocking Worker and network connections leaves the built-in regex feedback available`,async({page})=>{
  await page.route(`**/password-strength-${kind}/`,async route=>{const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'content-security-policy':"worker-src 'none'; connect-src 'none'"}});});
  await page.goto(`/password-strength-${kind}/`);const {password,meter}=fields(page);await password.fill('password');await expectScore(meter,{score:1,level:'weak',summary:'弱'});await expectNoVisibleLegacyGuidance(page);
 });
}
