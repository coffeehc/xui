import {test,expect} from '@playwright/test';
const user={id:'9007199254740993',username:'fixture',display_name:'示例用户'},access='bs-v1-sha256-access-'+'A'.repeat(43);
const wire=(payload,status=200,code=status===200?200:40101)=>({success:status===200,message:'',payload,request_id:'',code});
const readGate=page=>page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.open('xui.operation-recovery.v1',1);request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('operations'),store=tx.objectStore('operations'),read=store.getAll();read.onsuccess=()=>resolve(read.result);tx.oncomplete=()=>db.close();};}));
const issued=()=>({schema_version:2,user,access_token:access,token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()});
for(const kind of ['react','vanilla']){
 test(`${kind} default full-page navigation restores memory access with HttpOnly recovery cookie and omits cookie from session`,async({page,context})=>{
  const requests=[];let cookieSerial=0;
  await context.route('**/api/v1/auth/**',async route=>{
   const request=route.request(),operation=new URL(request.url()).pathname.split('/').at(-1),headers=await request.allHeaders(),cookie=headers.cookie??'';
   requests.push({operation,authorization:headers.authorization??null,cookie,origin:headers.origin??null,contentType:headers['content-type']??null});
   let status=200,payload=null,extra={};
   if(operation==='login'||operation==='refresh'){
    if(operation==='refresh'&&!cookie.includes('baseservice_refresh='))status=401;
    else {payload=issued();extra={'Set-Cookie':`baseservice_refresh=FAKE_RECOVERY_${++cookieSerial}; HttpOnly; SameSite=Strict; Path=/`};}
   }else if(operation==='session')payload={schema_version:2,user};
   else extra={'Set-Cookie':'baseservice_refresh=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/'};
   await route.fulfill({status,contentType:'application/json',headers:{'Cache-Control':'no-store',...extra},body:JSON.stringify(wire(payload,status))});
  });
  const destination=`/login-${kind}/?transport=http`;
  await page.goto(`/login-${kind}/?transport=http&navigate&returnTo=${encodeURIComponent(destination)}`);
  await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();await page.getByRole('textbox',{name:'用户名',exact:true}).fill('fixture');await page.getByLabel('密码').fill('FAKE_PASSWORD');
  await page.getByRole('button',{name:'登录',exact:true}).click();await expect(page).toHaveURL(new RegExp(`/login-${kind}/\\?transport=http$`));await expect(page.getByRole('heading',{name:'示例工作区',exact:true})).toBeVisible();
  expect(requests.map(request=>request.operation)).toEqual(['refresh','login','refresh','session']);
  for(const request of requests){if(request.operation==='session'){expect(request.authorization).toBe(`Bearer ${access}`);expect(request.cookie).toBe('');}else{expect(request.authorization).toBeNull();expect(request.contentType).toContain('application/json');}}
  expect(requests[2].cookie).toContain('baseservice_refresh=FAKE_RECOVERY_1');expect((await context.cookies()).find(cookie=>cookie.name==='baseservice_refresh').httpOnly).toBe(true);
  expect(await page.evaluate(()=>document.cookie)).not.toContain('FAKE_RECOVERY');expect(await page.evaluate(()=>JSON.stringify(window.loginDemo.auth.getState())+JSON.stringify(localStorage)+JSON.stringify(sessionStorage))).not.toContain(access);
  await page.getByRole('button',{name:'退出登录',exact:true}).click();await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();expect(requests.at(-1)).toMatchObject({operation:'logout',authorization:null});expect(requests.at(-1).cookie).toContain('FAKE_RECOVERY_2');
 });
 test(`${kind} unconfirmed bootstrap shows blocked recovery and never automatically repeats refresh`,async({page})=>{
  let refreshes=0;
  await page.route('**/api/v1/auth/**',async route=>{const op=new URL(route.request().url()).pathname.split('/').at(-1);if(op==='refresh'){refreshes++;await route.fulfill({status:409,contentType:'application/json',body:JSON.stringify(wire(null,409,40901))});}else await route.fulfill({contentType:'application/json',body:JSON.stringify(wire(issued()))});});
  await page.goto(`/login-${kind}/?transport=http`);await expect(page.getByRole('alert')).toHaveText('上次会话操作结果未确认，暂时无法再次提交。');await expect(page.getByRole('button',{name:'重试连接',exact:true})).toHaveCount(0);
  const failure=await page.evaluate(async()=>{try{await window.loginDemo.auth.currentUser();}catch{}try{await window.loginDemo.auth.refresh();}catch{}return window.loginDemo.auth.getState().reauthenticationRequired;});expect(failure).toBe(true);expect(refreshes).toBe(1);
  await page.reload();await expect(page.getByRole('alert')).toHaveText('上次会话操作结果未确认，暂时无法再次提交。');expect(refreshes).toBe(1);expect(await page.evaluate(()=>window.loginDemo.auth.getState().reauthenticationRequired)).toBe(true);
  const restored=await page.evaluate(()=>({error:window.loginDemo.auth.getState().error,required:window.loginDemo.auth.getState().reauthenticationRequired}));expect(restored).toEqual({error:null,required:true});const gateBefore=await readGate(page);expect(gateBefore).toHaveLength(1);await page.evaluate(async()=>{try{await window.loginDemo.auth.currentUser();}catch{}try{await window.loginDemo.auth.refresh();}catch{}});expect(refreshes).toBe(1);expect(await readGate(page)).toEqual(gateBefore);
  await page.getByRole('textbox',{name:'用户名',exact:true}).fill('fixture');await page.getByLabel('密码').fill('FAKE_PASSWORD');await page.getByRole('button',{name:'登录',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('上次会话操作结果未确认，暂时无法再次提交。');expect(refreshes).toBe(1);expect(await page.evaluate(()=>window.loginDemo.getDestinations())).toEqual([]);
 });
}

test('same-origin tabs serialize recovery cookies with Web Locks and broadcast no credentials',async({context})=>{
 let serial=0,currentCookie='',active=0,maximum=0;
 await context.addInitScript(()=>{const Native=window.BroadcastChannel;window.authBroadcastMessages=[];window.BroadcastChannel=class extends Native{postMessage(data){window.authBroadcastMessages.push(structuredClone(data));super.postMessage(data);}};});
 await context.route('**/api/v1/auth/**',async route=>{
  const request=route.request(),operation=new URL(request.url()).pathname.split('/').at(-1),headers=await request.allHeaders();let status=200,payload=null,extra={};
  if(operation==='refresh'){
   expect(headers.authorization).toBeUndefined();if(!currentCookie||(headers.cookie??'').split('; ').find(value=>value===`baseservice_refresh=${currentCookie}`)===undefined)status=401;
   else{active++;maximum=Math.max(maximum,active);await new Promise(resolve=>setTimeout(resolve,50));active--;payload=issued();currentCookie=`FAKE_RECOVERY_${++serial}`;extra={'Set-Cookie':`baseservice_refresh=${currentCookie}; HttpOnly; SameSite=Strict; Path=/`};}
  }else if(operation==='login'){payload=issued();currentCookie=`FAKE_RECOVERY_${++serial}`;extra={'Set-Cookie':`baseservice_refresh=${currentCookie}; HttpOnly; SameSite=Strict; Path=/`};}
  else if(operation==='session')payload={schema_version:2,user};
  else{currentCookie='';extra={'Set-Cookie':'baseservice_refresh=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/'};}
  await route.fulfill({status,contentType:'application/json',headers:extra,body:JSON.stringify(wire(payload,status))});
 });
 const a=await context.newPage(),b=await context.newPage();await Promise.all([a.goto('/login-react/?transport=http'),b.goto('/login-vanilla/?transport=http')]);
 for(const page of [a,b])await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();
 await a.getByRole('textbox',{name:'用户名',exact:true}).fill('fixture');await a.getByLabel('密码').fill('FAKE_PASSWORD');await a.getByRole('button',{name:'登录',exact:true}).click();await expect(a.getByRole('heading',{name:'示例工作区',exact:true})).toBeVisible();
 await expect.poll(()=>b.evaluate(()=>window.loginDemo.auth.getState().status)).toBe('unknown');
 await Promise.all([a.evaluate(()=>window.loginDemo.auth.refresh()),b.evaluate(()=>window.loginDemo.auth.refresh())]);expect(maximum).toBe(1);
 for(const page of [a,b]){await expect(page.getByRole('heading',{name:'示例工作区',exact:true})).toBeVisible();const events=await page.evaluate(()=>window.authBroadcastMessages);for(const event of events)expect(Object.keys(event).sort()).toEqual(['epoch','kind']);expect(await page.evaluate(()=>JSON.stringify(localStorage)+JSON.stringify(sessionStorage)+JSON.stringify(window.authBroadcastMessages))).not.toContain(access);}
 await a.getByRole('button',{name:'退出登录',exact:true}).click();await expect.poll(()=>b.evaluate(()=>window.loginDemo.auth.getState().status)).toBe('anonymous');
 await a.close();await b.close();
});

for(const kind of ['react','vanilla']){
 test(`${kind} persistent recovery storage failure prevents all cookie POSTs`,async({page})=>{
  let posts=0;await page.route('**/api/v1/auth/**',async route=>{posts++;await route.fulfill({contentType:'application/json',body:JSON.stringify(wire(issued()))});});
  await page.addInitScript(()=>{IDBFactory.prototype.open=function(){throw new DOMException('Synthetic denial','SecurityError');};});
  await page.goto(`/login-${kind}/?transport=http`);await expect(page.getByRole('alert')).toHaveText('上次会话操作结果未确认，暂时无法再次提交。');
  await page.evaluate(async()=>{for(const run of [()=>window.loginDemo.auth.refresh(),()=>window.loginDemo.auth.login({username:'fixture',password:'FAKE_PASSWORD'}),()=>window.loginDemo.auth.logout()])try{await run();}catch{}});
  expect(posts).toBe(0);expect(await page.evaluate(()=>window.loginDemo.auth.getState().reauthenticationRequired)).toBe(true);
 });
 test(`${kind} transport-unknown refresh survives real reload without automatic resend`,async({page})=>{
  let refreshes=0;await page.route('**/api/v1/auth/**',async route=>{if(new URL(route.request().url()).pathname.endsWith('/refresh')){refreshes++;await route.abort('failed');}else await route.fulfill({contentType:'application/json',body:JSON.stringify(wire(issued()))});});
  await page.goto(`/login-${kind}/?transport=http`);await expect(page.getByRole('alert')).toHaveText('上次会话操作结果未确认，暂时无法再次提交。');
  await page.reload();await expect(page.getByRole('alert')).toHaveText('上次会话操作结果未确认，暂时无法再次提交。');expect(refreshes).toBe(1);
  await page.getByRole('textbox',{name:'用户名',exact:true}).fill('fixture');await page.getByLabel('密码').fill('FAKE_PASSWORD');await page.getByRole('button',{name:'登录',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('上次会话操作结果未确认，暂时无法再次提交。');expect(refreshes).toBe(1);expect(await page.evaluate(()=>window.loginDemo.getDestinations())).toEqual([]);
  expect(await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('xui.auth.recovery.v1:')))).toEqual([]);
 });
}
