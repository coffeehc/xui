import {test,expect} from '@playwright/test';
const user={id:'9007199254740993',username:'fixture',display_name:'示例用户'},access='bs-v1-sha256-access-'+'A'.repeat(43);
const wire=(payload,status=200,code=status===200?200:40101)=>({success:status===200,message:'',payload,request_id:'',code});
const issued=()=>({schema_version:2,user,access_token:access,token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()});
for(const kind of ['react','vanilla']){
 test(`${kind} full-page navigation restores memory access through an HttpOnly refresh cookie`,async({page,context})=>{
  const requests=[];let cookieSerial=0;
  await context.route('**/api/v1/auth/**',async route=>{
   const request=route.request(),operation=new URL(request.url()).pathname.split('/').at(-1),headers=await request.allHeaders(),cookie=headers.cookie??'';
   requests.push({path:new URL(request.url()).pathname,operation,authorization:headers.authorization??null,cookie,origin:headers.origin??null,contentType:headers['content-type']??null});
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
  await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();await page.getByRole('textbox',{name:'用户名',exact:true}).fill('fixture');await page.getByLabel(/^密码(?:\s*\*)?$/).fill('FAKE_PASSWORD');
  await page.getByRole('button',{name:'登录',exact:true}).click();await expect(page).toHaveURL(new RegExp(`/login-${kind}/\\?transport=http$`));await expect(page.getByRole('heading',{name:'示例工作区',exact:true})).toBeVisible();
  expect(requests.map(request=>request.operation)).toEqual(['refresh','login','refresh','session']);expect(requests.some(request=>request.path.includes('/recovery-session')||request.path.includes('/operations/'))).toBe(false);expect(await page.evaluate(async()=> (await indexedDB.databases()).map(database=>database.name))).not.toContain('xui.operation-recovery.v1');
  for(const request of requests){if(request.operation==='session'){expect(request.authorization).toBe(`Bearer ${access}`);expect(request.cookie).toBe('');}else{expect(request.authorization).toBeNull();expect(request.contentType).toContain('application/json');}}
  expect(requests[2].cookie).toContain('baseservice_refresh=FAKE_RECOVERY_1');expect((await context.cookies()).find(cookie=>cookie.name==='baseservice_refresh').httpOnly).toBe(true);
  expect(await page.evaluate(()=>document.cookie)).not.toContain('FAKE_RECOVERY');expect(await page.evaluate(()=>JSON.stringify(window.loginDemo.auth.getState())+JSON.stringify(localStorage)+JSON.stringify(sessionStorage))).not.toContain(access);
  await page.getByRole('button',{name:'退出登录',exact:true}).click();await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();expect(requests.at(-1)).toMatchObject({operation:'logout',authorization:null});expect(requests.at(-1).cookie).toContain('FAKE_RECOVERY_2');
 });
 test(`${kind} a lost login response gets one ordinary refresh and session check`,async({page,context})=>{
  const requests=[];
  await context.route('**/api/v1/auth/**',async route=>{
   const request=route.request(),operation=new URL(request.url()).pathname.split('/').at(-1),headers=await request.allHeaders();requests.push({operation,cookie:headers.cookie??''});
   if(operation==='login'){await context.addCookies([{name:'baseservice_refresh',value:'FAKE_REFRESH_AFTER_COMMIT',url:new URL(request.url()).origin+'/'}]);await route.abort('failed');return;}
   if(operation==='refresh'){const hasCookie=(headers.cookie??'').includes('baseservice_refresh=FAKE_REFRESH_AFTER_COMMIT');await route.fulfill({status:hasCookie?200:401,contentType:'application/json',body:JSON.stringify(wire(hasCookie?issued():null,hasCookie?200:401))});return;}
   if(operation==='session'){await route.fulfill({contentType:'application/json',body:JSON.stringify(wire({schema_version:2,user}))});return;}
   await route.fulfill({contentType:'application/json',body:JSON.stringify(wire(null))});
  });
  await page.goto(`/login-${kind}/?transport=http`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();await page.getByRole('textbox',{name:'用户名',exact:true}).fill('fixture');await page.getByLabel(/^密码(?:\s*\*)?$/).fill('FAKE_PASSWORD');await page.getByRole('button',{name:'登录',exact:true}).click();await expect(page.getByRole('heading',{name:'示例工作区'})).toBeVisible();
  expect(requests.map(request=>request.operation)).toEqual(['refresh','login','refresh','session']);expect(requests.filter(request=>request.operation==='login')).toHaveLength(1);expect(requests.some(request=>request.operation==='recovery-session'||request.operation==='operations')).toBe(false);expect(JSON.stringify(await page.evaluate(()=>window.loginDemo.auth.getState())+JSON.stringify(localStorage)+JSON.stringify(sessionStorage))).not.toContain(access);
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
 await a.getByRole('textbox',{name:'用户名',exact:true}).fill('fixture');await a.getByLabel(/^密码(?:\s*\*)?$/).fill('FAKE_PASSWORD');await a.getByRole('button',{name:'登录',exact:true}).click();await expect(a.getByRole('heading',{name:'示例工作区',exact:true})).toBeVisible();
 await expect.poll(()=>b.evaluate(()=>window.loginDemo.auth.getState().status)).toBe('unknown');
 await Promise.all([a.evaluate(()=>window.loginDemo.auth.refresh()),b.evaluate(()=>window.loginDemo.auth.refresh())]);expect(maximum).toBe(1);
 for(const page of [a,b]){await expect(page.getByRole('heading',{name:'示例工作区',exact:true})).toBeVisible();const events=await page.evaluate(()=>window.authBroadcastMessages);for(const event of events)expect(Object.keys(event).sort()).toEqual(['epoch','kind']);expect(await page.evaluate(()=>JSON.stringify(localStorage)+JSON.stringify(sessionStorage)+JSON.stringify(window.authBroadcastMessages))).not.toContain(access);}
 await a.getByRole('button',{name:'退出登录',exact:true}).click();await expect.poll(()=>b.evaluate(()=>window.loginDemo.auth.getState().status)).toBe('anonymous');
 await a.close();await b.close();
});
