import {test,expect} from '@playwright/test';
import {chooseSelect} from './select-interaction.mjs';
const api='**/api/xui-example/records?*';
const reply=(payload,extra={})=>({success:true,message:'',payload,request_id:'fake-body-id',code:1,...extra});
const record=name=>({id:'fake-record',name,created:'2026-10-11 12:00:00'});
for(const kind of ['react']){
  test(`${kind} formal HTTP consumer uses actual fetch, exact query, page and filter contracts`,async({page})=>{
    const urls=[];page.on('request',request=>{if(request.url().includes('/api/xui-example/'))urls.push(new URL(request.url()));});await page.goto(`/http-${kind}/`);
    await expect(page.locator('[data-total]')).toHaveText('共 3 条');await expect(page.locator('tbody tr')).toHaveCount(2);
    const first=urls[0].searchParams;expect(first.get('page_index')).toBe('0');expect(first.get('page_size')).toBe('2');expect(first.get('return_total')).toBe('true');expect(first.get('sort')).toBe('name');expect(first.get('sort_name')).toBe('asc');expect(first.has('field')).toBe(false);
    await page.evaluate(()=>{window.httpMain=document.querySelector('main');});await page.getByRole('button',{name:'下一页'}).click();await expect(page.locator('tbody tr')).toHaveCount(1);expect(urls.at(-1).searchParams.get('page_index')).toBe('1');
    await page.getByRole('textbox',{name:'名称',exact:true}).fill('资料整理');await page.getByRole('button',{name:'应用筛选'}).click();await expect(page.locator('[data-total]')).toHaveText('共 1 条');expect(urls.at(-1).searchParams.get('page_index')).toBe('0');expect(urls.at(-1).searchParams.get('name')).toBe('资料整理');
    await page.getByRole('textbox',{name:'名称',exact:true}).fill('中文 & + %');await page.getByRole('button',{name:'应用筛选'}).click();await expect(page.getByText('没有匹配记录')).toBeVisible();expect(urls.at(-1).searchParams.get('name')).toBe('中文 & + %');
    await page.getByRole('textbox',{name:'名称',exact:true}).fill('');await page.getByRole('button',{name:'应用筛选'}).click();await expect(page.locator('[data-total]')).toHaveText('共 3 条');expect(urls.at(-1).searchParams.has('name')).toBe(false);
    await chooseSelect(page,page.getByRole('combobox',{name:'排序'}),'desc','名称降序');await expect.poll(()=>urls.at(-1).searchParams.get('sort_name')).toBe('desc');await expect(page.getByRole('region',{name:'记录结果'})).toHaveAttribute('aria-busy','false');expect(await page.evaluate(()=>window.httpMain===document.querySelector('main'))).toBe(true);
  });
  test(`${kind} refresh failure retains data, explicit retry recovers, cancellation and timeout do not publish late results`,async({page})=>{
    let mode='success';const held=[];await page.route(api,async route=>{if(mode==='failure')return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify(reply(null,{success:false,message:'FAKE_PRIVATE_MESSAGE',code:-1}))});if(mode==='hang'){await new Promise(resolve=>held.push(async()=>{await route.fulfill({contentType:'application/json',body:JSON.stringify(reply({list:[record('晚到记录')],total:1}))}).catch(()=>{});resolve();}));return;}return route.continue();});
    await page.goto(`/http-${kind}/`);await expect(page.locator('[data-total]')).toHaveText('共 3 条');const names=await page.locator('tbody').innerText();mode='failure';await page.getByRole('button',{name:'刷新记录'}).click();await expect(page.getByRole('alert')).toContainText('读取失败');expect(await page.locator('tbody').innerText()).toBe(names);await expect(page.getByRole('alert')).not.toContainText('FAKE_PRIVATE_MESSAGE');
    mode='success';await page.getByRole('button',{name:'重试读取'}).click();await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.getByRole('region',{name:'记录结果'})).toHaveAttribute('aria-busy','false');
    mode='hang';await page.getByRole('button',{name:'刷新记录'}).click();await expect.poll(()=>held.length).toBe(1);await page.getByRole('button',{name:'取消读取'}).click();await expect(page.getByRole('region',{name:'记录结果'})).toHaveAttribute('aria-busy','false');await expect(page.getByRole('alert')).toHaveCount(0);await held.shift()();expect(await page.locator('tbody').innerText()).toBe(names);
    await page.clock.install();await page.getByRole('button',{name:'刷新记录'}).click();await expect.poll(()=>held.length).toBe(1);await page.clock.fastForward(2001);await expect(page.getByRole('alert')).toContainText('The request exceeded its time budget.');expect(await page.locator('tbody').innerText()).toBe(names);await held.shift()();await expect(page.getByText('晚到记录')).toHaveCount(0);
  });
  test(`${kind} one auth owner distinguishes HTTP 401, 403 and successful-HTTP business errors`,async({page})=>{
    let status=200,fail=false;await page.route(api,route=>fail?route.fulfill({status,headers:{'Content-Type':'application/json','X-Request-ID':'fake-header-id'},body:JSON.stringify(reply(null,{success:false,message:'FAKE_SECRET https://private.example/?token=FAKE_SECRET',code:403001}))}):route.continue());await page.goto(`/http-${kind}/`);await expect(page.locator('[data-total]')).toHaveText('共 3 条');
    fail=true;status=401;await page.getByRole('button',{name:'刷新记录'}).click();await expect(page.locator('[data-auth-count]')).toHaveText('1');await expect(page.getByRole('alert')).toContainText('Authentication is required.');
    await page.evaluate(()=>Promise.allSettled([1,2,3].map(()=>window.httpDemo.owner.client.request('records?parallel=true'))));await expect(page.locator('[data-auth-count]')).toHaveText('1');
    for(const nextStatus of [403,200]){status=nextStatus;await page.evaluate(()=>window.httpDemo.owner.client.resetUnauthorized());await page.getByRole('button',{name:'刷新记录'}).click();await expect(page.getByRole('alert')).toContainText(nextStatus===403?'Permission was denied.':'The operation was rejected.');await expect(page.locator('[data-auth-count]')).toHaveText('1');
      const error=await page.evaluate(()=>window.httpDemo.owner.resource.getState().error.toJSON());expect(error.kind).toBe(nextStatus===403?'http':'business');expect(error.status).toBe(nextStatus);expect(error.code).toBe(403001);expect(error.bodyRequestId).toBe('fake-body-id');expect(error.headerRequestId).toBe('fake-header-id');expect(error.requestId).toBe('fake-body-id');expect(JSON.stringify(error)).not.toContain('FAKE_SECRET');expect(JSON.stringify(error)).not.toContain('private.example');
    }
  });
  test(`${kind} changed query cancels older reads and renders only the latest result`,async({page})=>{
    let release;await page.route(api,async route=>{const name=new URL(route.request().url()).searchParams.get('name');if(name==='slow'){await new Promise(resolve=>{release=async()=>{await route.fulfill({contentType:'application/json',body:JSON.stringify(reply({list:[record('过时记录')],total:1}))}).catch(()=>{});resolve();};});return;}if(name==='快')return route.fulfill({contentType:'application/json',body:JSON.stringify(reply({list:[record('快记录')],total:1}))});return route.continue();});
    await page.goto(`/http-${kind}/`);await expect(page.locator('[data-total]')).toHaveText('共 3 条');await page.getByRole('textbox',{name:'名称',exact:true}).fill('slow');await page.getByRole('button',{name:'应用筛选'}).click();await expect.poll(()=>!!release).toBe(true);await page.getByRole('textbox',{name:'名称',exact:true}).fill('快');await page.getByRole('button',{name:'应用筛选'}).click();await expect(page.getByRole('cell',{name:'快记录',exact:true})).toBeVisible();await release();await expect(page.getByText('过时记录')).toHaveCount(0);await expect(page.getByRole('cell',{name:'快记录',exact:true})).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(0);
  });
  test(`${kind} nil lists, unsafe totals and malicious record text follow public validation and rendering`,async({page})=>{
    let payload={list:null,total:0};await page.route(api,route=>route.fulfill({contentType:'application/json',body:JSON.stringify(reply(payload))}));await page.setViewportSize({width:390,height:720});await page.goto(`/http-${kind}/`);await expect(page.getByText('没有匹配记录')).toBeVisible();await expect(page.locator('[data-total]')).toHaveText('共 0 条');await expect(page.getByRole('heading',{name:'记录查询'})).toBeVisible();const action=await page.getByRole('button',{name:'刷新记录'}).boundingBox();expect(action.y+action.height).toBeLessThan(720);
    payload={list:[],total:9007199254740992};await page.getByRole('button',{name:'刷新记录'}).click();await expect(page.getByRole('alert')).toContainText('The response did not match the expected contract.');expect(await page.evaluate(()=>window.httpDemo.owner.resource.getState().error.kind)).toBe('parse');
    const hostile='<img src=x onerror="window.__unsafe=1">';payload={list:[record(hostile)],total:1};await page.getByRole('button',{name:'重试读取'}).click();await expect(page.getByRole('cell',{name:hostile,exact:true})).toBeVisible();expect(await page.locator('td img').count()).toBe(0);expect(await page.evaluate(()=>window.__unsafe)).toBeUndefined();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.evaluate(()=>window.httpDemo.destroy());const errors=await page.evaluate(()=>window.httpDemo.owner.client.request('records').catch(error=>error.kind));expect(errors).toBe('cancel');
  });
}

for(const kind of ['react']){
  test(`${kind} omitted total is unknown and never uses current-page length as numbered page count`,async({page})=>{
    await page.goto(`/http-${kind}/`);await expect(page.locator('[data-total]')).toHaveText('共 3 条');
    const response=page.waitForResponse(value=>value.url().includes('/api/xui-example/records?')&&new URL(value.url()).searchParams.get('return_total')==='false');
    await page.evaluate(()=>window.httpDemo.owner.load({page_index:0,page_size:2,return_total:false,sort:[{field:'name',order:'asc'}]}));
    expect(Object.hasOwn((await (await response).json()).payload,'total')).toBe(false);await expect(page.locator('[data-total]')).toHaveText('共 未知 条');await expect(page.locator('tbody tr')).toHaveCount(2);await expect(page.locator('.xui-pagination:visible')).toHaveCount(0);
    await page.getByRole('button',{name:'刷新记录'}).click();await expect(page.locator('[data-total]')).toHaveText('共 3 条');await expect(page.locator('.xui-pagination:visible')).toHaveCount(1);
  });
}
