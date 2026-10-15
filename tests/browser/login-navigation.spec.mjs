import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const fill=async page=>{await page.getByRole('textbox',{name:'用户名',exact:true}).fill('demo');await page.getByLabel(/^密码(?:\s*\*)?$/).fill('FAKE_NAVIGATION_PASSWORD');};
const destination=page=>page.getByRole('heading',{name:'示例工作区',exact:true});
const startRecording=page=>page.evaluate(()=>{
  const form=document.querySelector('form'),username=form.querySelector('input[name=username]'),password=form.querySelector('input[name=password]'),submit=form.querySelector('.xui-login-submit');
  const rect=element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
  const geometry=()=>({username:rect(username),password:rect(password),submit:rect(submit)}),gaps=boxes=>({usernameToPassword:boxes.password.y-(boxes.username.y+boxes.username.height),passwordToSubmit:boxes.submit.y-(boxes.password.y+boxes.password.height)});
  const before=geometry();window.navigationEvidence={nodes:{form,username,password,submit},before:{...before,gaps:gaps(before)},frames:[]};
  const sample=()=>{const page=document.querySelector('.xui-login-page');if(!page)return;const saved=window.navigationEvidence,boxes=geometry();saved.frames.push({sameNodes:document.querySelector('form')===form&&form.querySelector('input[name=username]')===username&&form.querySelector('input[name=password]')===password&&form.querySelector('.xui-login-submit')===submit,intermediateCard:[...page.querySelectorAll('button')].some(button=>['进入应用','退出登录'].includes(button.textContent))||page.textContent.includes('已登录:'),...boxes,gaps:gaps(boxes)});};
  sample();window.navigationObserver=new MutationObserver(sample);window.navigationObserver.observe(document.getElementById('root'),{childList:true,subtree:true,attributes:true,characterData:true});
  let count=0;const tick=()=>{sample();if(++count<30)requestAnimationFrame(tick);};requestAnimationFrame(tick);
});
async function checkEvidence(page,info,name){
  const evidence=await page.evaluate(()=>{window.navigationObserver.disconnect();const {before,frames}=window.navigationEvidence;return {before,frames};});expect(evidence.frames.length).toBeGreaterThan(0);
  for(const frame of evidence.frames){expect(frame.sameNodes).toBe(true);expect(frame.intermediateCard).toBe(false);for(const key of ['username','password','submit'])for(const dimension of ['x','width','height'])expect(Math.abs(frame[key][dimension]-evidence.before[key][dimension]),`${key}.${dimension}`).toBeLessThanOrEqual(1.5);for(const name of Object.keys(evidence.before.gaps))expect(Math.abs(frame.gaps[name]-evidence.before.gaps[name]),`${name} remains stable while the centered card reflows`).toBeLessThanOrEqual(1.5);}
  const path=info.outputPath(name+'.json');await writeFile(path,JSON.stringify(evidence,null,2));await info.attach('navigation-dom-sequence',{path,contentType:'application/json'});
}
for(const kind of ['react','react-strict']){
  test(`${kind} a confirmed login keeps the form until one direct host navigation`,async({page},info)=>{
    await page.goto(`/login-${kind}/?handoff=hold&visualAcceptance`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();await fill(page);await startRecording(page);
    await page.getByRole('button',{name:'登录',exact:true}).click();await expect(page.getByRole('button',{name:'正在进入…',exact:true})).toBeDisabled();await expect.poll(()=>page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);await expect(page.getByLabel(/^密码(?:\s*\*)?$/)).toHaveValue('');await expect(page.getByRole('textbox',{name:'用户名',exact:true})).toBeDisabled();
    await page.evaluate(()=>{for(let i=0;i<4;i++)window.loginDemo.repeatAuthNotification();document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
    expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);expect((await page.evaluate(()=>window.loginDemo.getRequests())).filter(request=>request.path.endsWith('/login'))).toHaveLength(1);await expect(page.getByRole('button',{name:'取消等待'})).toHaveCount(0);
    await page.screenshot({path:info.outputPath(`${kind}-direct-handoff.png`),animations:'disabled'});await page.evaluate(()=>window.loginDemo.releaseHandoff());await expect(destination(page)).toBeVisible();await page.screenshot({path:info.outputPath(`${kind}-direct-destination.png`),animations:'disabled'});await checkEvidence(page,info,`${kind}-direct-handoff`);expect(await page.evaluate(()=>window.loginDemo.getDestinations())).toEqual([{userId:'42',path:'/workspace'}]);
  });
  test(`${kind} an owner-confirmed initial session opens the target once without a login or confirmation screen`,async({page},info)=>{
    await page.addInitScript(()=>{window.initialNavigationFrames=[];new MutationObserver(()=>{const page=document.querySelector('.xui-login-page');if(page)window.initialNavigationFrames.push([...page.querySelectorAll('button')].some(button=>['进入应用','退出登录'].includes(button.textContent))||page.textContent.includes('已登录:'));}).observe(document,{childList:true,subtree:true,attributes:true,characterData:true});});
    await page.goto(`/login-${kind}/?session=valid&handoff=hold&visualAcceptance`);await expect(page.getByRole('button',{name:'正在进入…',exact:true})).toBeDisabled();await expect.poll(()=>page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);await startRecording(page);await page.evaluate(()=>{for(let i=0;i<4;i++)window.loginDemo.repeatAuthNotification();});
    expect((await page.evaluate(()=>window.loginDemo.getRequests())).map(request=>request.path.split('/').at(-1))).toEqual(['refresh','session']);expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);await page.evaluate(()=>window.loginDemo.releaseHandoff());await expect(destination(page)).toBeVisible();await checkEvidence(page,info,`${kind}-initial-session`);const frames=await page.evaluate(()=>window.initialNavigationFrames);expect(frames.length).toBeGreaterThan(0);expect(frames.every(value=>!value)).toBe(true);
  });
}
for(const kind of ['react'])for(const source of ['login','session'])for(const failure of ['throw','reject'])test(`${kind} ${source} host navigation ${failure} retries only opening the target`,async({page},info)=>{
  await page.goto(`/login-${kind}/?handoff=${failure}&visualAcceptance${source==='session'?'&session=valid':''}`);
  if(source==='login'){await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();await fill(page);await page.getByRole('button',{name:'登录',exact:true}).click();}
  await expect(page.getByRole('alert')).toHaveText('已登录，但暂时无法进入应用。请重试。');await expect(page.getByRole('button',{name:'重试进入'})).toBeEnabled();await expect(page.getByRole('button',{name:'重试连接'})).toHaveCount(0);await expect(page.getByRole('button',{name:'取消等待'})).toHaveCount(0);await expect(page.getByLabel(/^密码(?:\s*\*)?$/)).toHaveValue('');await expect(page.getByRole('textbox',{name:'用户名',exact:true})).toBeDisabled();
  const requests=await page.evaluate(()=>window.loginDemo.getRequests());expect(await page.evaluate(()=>window.loginDemo.auth.getState().status)).toBe('authenticated');expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);await page.evaluate(()=>{window.loginDemo.repeatAuthNotification();window.loginDemo.setHandoffMode('ok');});expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);
  await page.screenshot({path:info.outputPath(`${kind}-${source}-${failure}-navigation-error.png`),animations:'disabled'});await page.getByRole('button',{name:'重试进入'}).click();await expect(destination(page)).toBeVisible();expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(2);expect(await page.evaluate(()=>window.loginDemo.getRequests())).toEqual(requests);expect(requests.filter(request=>request.path.endsWith('/login'))).toHaveLength(source==='login'?1:0);expect(requests.filter(request=>request.path.endsWith('/logout'))).toHaveLength(0);
});
for(const kind of ['react'])for(const release of ['pagehide','destroy'])test(`${kind} ${release} ignores a late host navigation rejection`,async({page})=>{
  await page.goto(`/login-${kind}/?handoff=hold&visualAcceptance`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();await fill(page);await page.getByRole('button',{name:'登录',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);
  const unchanged=await page.evaluate(async release=>{if(release==='pagehide')window.dispatchEvent(new Event('pagehide'));else window.loginDemo.destroy();const before=document.getElementById('root').innerHTML;window.loginDemo.releaseHandoff(true);await new Promise(resolve=>setTimeout(resolve,0));return before===document.getElementById('root').innerHTML;},release);expect(unchanged).toBe(true);await expect(destination(page)).toHaveCount(0);expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);
});

for(const kind of ['react'])test(`${kind} a default navigation target equal to the current page cannot create a reload loop`,async({page})=>{
  await page.goto(`/login-${kind}/?navigate&sameTarget&session=valid`);await expect(page.getByRole('alert')).toHaveText('已登录，但暂时无法进入应用。请重试。');const before=page.url();const requests=await page.evaluate(()=>window.loginDemo.getRequests());expect(requests.map(request=>request.path.split('/').at(-1))).toEqual(['refresh','session']);await page.getByRole('button',{name:'重试进入'}).click();await expect(page.getByRole('alert')).toHaveText('已登录，但暂时无法进入应用。请重试。');expect(page.url()).toBe(before);expect(await page.evaluate(()=>window.loginDemo.getRequests())).toEqual(requests);
});

for(const kind of ['react','react-strict'])test(`${kind} a refreshed user object with the same verified id does not repeat navigation`,async({page})=>{
  await page.goto(`/login-${kind}/?session=valid&preconfirmed&handoff=hold&visualAcceptance`);await page.waitForFunction(()=>!!window.loginDemo);await expect.poll(()=>page.evaluate(()=>window.loginDemo?.getHandoffCalls())).toBe(1);
  const replaced=await page.evaluate(async()=>{const before=window.loginDemo.auth.getState().user;await window.loginDemo.auth.refresh();return before!==window.loginDemo.auth.getState().user&&before.id===window.loginDemo.auth.getState().user.id;});expect(replaced).toBe(true);expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);await page.evaluate(()=>window.loginDemo.releaseHandoff());await expect(destination(page)).toBeVisible();
});
test('development StrictMode replays effects without duplicating or losing the current navigation rejection',async({page})=>{
  await page.goto('/login-react-strict/?session=valid&preconfirmed&handoff=hold&visualAcceptance');await expect.poll(()=>page.evaluate(()=>window.loginDemo?.getHandoffCalls())).toBe(1);await page.evaluate(()=>window.loginDemo.releaseHandoff(true));await expect(page.getByRole('alert')).toHaveText('已登录，但暂时无法进入应用。请重试。');expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);await page.evaluate(()=>window.loginDemo.setHandoffMode('ok'));await page.getByRole('button',{name:'重试进入'}).click();await expect(destination(page)).toBeVisible();expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(2);
});
for(const kind of ['react']){
  test(`${kind} persisted pagehide/pageshow restores anonymous interaction without an extra auth check`,async({page})=>{
    await page.goto(`/login-${kind}/?visualAcceptance`);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();const before=await page.evaluate(()=>window.loginDemo.getRequests());await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});expect(await page.evaluate(()=>window.loginDemo.getRequests())).toEqual(before);await fill(page);await page.getByRole('button',{name:'登录',exact:true}).click();await expect(destination(page)).toBeVisible();expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);
  });
  test(`${kind} persisted reactivation rejects a hidden old callback and resumes only navigation`,async({page})=>{
    await page.goto(`/login-${kind}/?session=valid&handoff=hold&visualAcceptance`);await expect.poll(()=>page.evaluate(()=>window.loginDemo?.getHandoffCalls())).toBe(1);const before=await page.evaluate(()=>window.loginDemo.getRequests());await page.evaluate(async()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.loginDemo.releaseHandoff(true);await new Promise(resolve=>setTimeout(resolve,0));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});await expect.poll(()=>page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(2);await expect(page.getByRole('alert')).toHaveCount(0);expect(await page.evaluate(()=>window.loginDemo.getRequests())).toEqual(before);await page.evaluate(()=>window.loginDemo.releaseHandoff());await expect(destination(page)).toBeVisible();
  });
}

// Hold the final owner read, not merely its preceding refresh notification.
for(const kind of ['react','react-strict']){
  for(const prechecking of [false,true])test(`${kind} waits for its final session result before one direct navigation (host started: ${prechecking})`,async({page},info)=>{
    await page.goto(`/login-${kind}/?sessionReadTimeout&handoff=hold&visualAcceptance${prechecking?'&prechecking':''}`);
    await expect.poll(()=>page.evaluate(()=>window.loginDemo.getRequests().filter(request=>request.path.endsWith('/session')).length)).toBe(1);
    await expect(page.getByRole('status')).toHaveText('正在确认登录状态…');await startRecording(page);
    await page.evaluate(()=>{for(let i=0;i<4;i++)window.loginDemo.repeatAuthNotification();});
    expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(0);await expect(page.getByRole('button',{name:'登录',exact:true})).toBeDisabled();
    await page.screenshot({path:info.outputPath(`${kind}-final-session-pending.png`),animations:'disabled'});
    await page.evaluate(()=>window.loginDemo.release('session'));await expect.poll(()=>page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);
    await checkEvidence(page,info,`${kind}-final-session`);await page.evaluate(()=>window.loginDemo.releaseHandoff());await expect(destination(page)).toBeVisible();
    expect((await page.evaluate(()=>window.loginDemo.getRequests())).map(request=>request.path.split('/').at(-1))).toEqual(['refresh','session']);
  });
  test(`${kind} a final session read failure never navigates and retries only that read`,async({page})=>{
    await page.goto(`/login-${kind}/?sessionReadError&handoff=hold&visualAcceptance`);await expect(page.getByRole('button',{name:'重试连接'})).toBeEnabled();
    expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(0);const before=await page.evaluate(()=>window.loginDemo.getRequests());
    await page.evaluate(()=>window.loginDemo.setMode('session','ok'));await page.getByRole('button',{name:'重试连接'}).click();await expect.poll(()=>page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);
    const requests=await page.evaluate(()=>window.loginDemo.getRequests());expect(requests.filter(request=>request.path.endsWith('/login')||request.path.endsWith('/logout'))).toHaveLength(0);expect(requests.filter(request=>request.path.endsWith('/session'))).toHaveLength(2);expect(before.filter(request=>request.path.endsWith('/session'))).toHaveLength(1);
  });
  test(`${kind} an anonymous final session does not navigate`,async({page})=>{
    await page.goto(`/login-${kind}/?sessionReadTimeout&handoff=hold&visualAcceptance`);await expect.poll(()=>page.evaluate(()=>window.loginDemo.getRequests().filter(request=>request.path.endsWith('/session')).length)).toBe(1);
    await page.evaluate(()=>{window.loginDemo.setSession(null);window.loginDemo.release('session');});await expect(page.getByRole('button',{name:'登录',exact:true})).toBeEnabled();expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(0);
  });
  test(`${kind} an obsolete session generation cannot navigate from a newer refresh`,async({page})=>{
    await page.goto(`/login-${kind}/?sessionReadTimeout&handoff=hold&visualAcceptance`);await expect.poll(()=>page.evaluate(()=>window.loginDemo.getRequests().filter(request=>request.path.endsWith('/session')).length)).toBe(1);
    await page.evaluate(()=>window.loginDemo.auth.refresh());expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(0);
    await page.evaluate(()=>window.loginDemo.release('session'));await expect(page.getByRole('button',{name:'重试连接'})).toBeEnabled();await page.evaluate(()=>window.loginDemo.repeatAuthNotification());expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(0);
    const before=await page.evaluate(()=>window.loginDemo.getRequests());await page.evaluate(()=>window.loginDemo.setMode('session','ok'));await page.getByRole('button',{name:'重试连接'}).click();await expect.poll(()=>page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);
    expect((await page.evaluate(()=>window.loginDemo.getRequests())).slice(before.length).map(request=>request.path.split('/').at(-1))).toEqual(['session']);
  });
  test(`${kind} a session completed while hidden is consumed without another read on persisted return`,async({page})=>{
    await page.goto(`/login-${kind}/?sessionReadTimeout&handoff=hold&visualAcceptance`);await expect.poll(()=>page.evaluate(()=>window.loginDemo.getRequests().filter(request=>request.path.endsWith('/session')).length)).toBe(1);
    await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.loginDemo.release('session');});await expect.poll(()=>page.evaluate(()=>window.loginDemo.auth.getState().busy)).toBe(null);
    expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(0);await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await expect.poll(()=>page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);
    expect((await page.evaluate(()=>window.loginDemo.getRequests())).map(request=>request.path.split('/').at(-1))).toEqual(['refresh','session']);
  });
  test(`${kind} a host rejection during refresh remains a local navigation retry`,async({page})=>{
    await page.goto(`/login-${kind}/?session=valid&preconfirmed&handoff=hold&visualAcceptance`);await page.waitForFunction(()=>!!window.loginDemo);await expect.poll(()=>page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);
    await page.evaluate(()=>{window.loginDemo.setMode('refresh','hold');window.refreshForNavigation=window.loginDemo.auth.refresh();});await expect.poll(()=>page.evaluate(()=>window.loginDemo.auth.getState().busy)).toBe('refresh');
    await page.evaluate(async()=>{window.loginDemo.releaseHandoff(true);await new Promise(resolve=>setTimeout(resolve,0));window.loginDemo.release('refresh');await window.refreshForNavigation;});await expect(page.getByRole('button',{name:'重试进入'})).toBeEnabled();
    await page.evaluate(()=>window.loginDemo.repeatAuthNotification());expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(1);const requests=await page.evaluate(()=>window.loginDemo.getRequests());await page.evaluate(()=>window.loginDemo.setHandoffMode('ok'));await page.getByRole('button',{name:'重试进入'}).click();await expect(destination(page)).toBeVisible();expect(await page.evaluate(()=>window.loginDemo.getRequests())).toEqual(requests);
  });
}
for(const kind of ['react','react-strict'])test(`${kind} replacing the owner discards an old session waiter`,async({page})=>{
  await page.goto(`/login-${kind}/?sessionReadTimeout&handoff=hold&visualAcceptance`);await expect.poll(()=>page.evaluate(()=>window.loginDemo.getRequests().filter(request=>request.path.endsWith('/session')).length)).toBe(1);
  await page.evaluate(()=>{window.replacementLogin=window.loginDemo.replaceAuthOwner();});await expect.poll(()=>page.evaluate(()=>window.replacementLogin.getRequests().filter(request=>request.path.endsWith('/session')).length)).toBe(1);
  await page.evaluate(()=>window.loginDemo.release('session'));await expect.poll(()=>page.evaluate(()=>window.loginDemo.auth.getState().busy)).toBe(null);expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(0);expect(await page.evaluate(()=>window.replacementLogin.getHandoffCalls())).toBe(0);
  await page.evaluate(()=>window.replacementLogin.release('session'));await expect.poll(()=>page.evaluate(()=>window.replacementLogin.getHandoffCalls())).toBe(1);expect(await page.evaluate(()=>window.loginDemo.getHandoffCalls())).toBe(0);
});
