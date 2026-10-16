import {test,expect,chromium} from '@playwright/test';
import {chromiumLaunchOptions} from './chromium-launch-options.mjs';
import {captureZoomViewport} from './zoom-capture.mjs';
const longName='跨年度研发团队观察窗口的独立研究任务附件名称用于验证完整中文可读性'.repeat(3)+'.csv';
const file=(name='records.csv',size=12)=>({name,mimeType:'text/csv',buffer:Buffer.alloc(size,65)});
const rows=page=>page.locator('[data-upload-row]');
const picker=page=>page.getByRole('button',{name:'选择文件：附件',exact:true});
async function open(page,path='/upload-react/'){
 await page.goto(path);await expect(page.getByRole('heading',{name:'文件上传',exact:true})).toBeVisible();await expect(picker(page)).toBeEnabled();
}
async function select(page,files){const chooser=page.waitForEvent('filechooser');await picker(page).click();await (await chooser).setFiles(files);}
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
async function focusPaintInside(page,button){
 await expect(button).toBeFocused();
 const bounds=await button.evaluate(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node),ring=parseFloat(s.outlineWidth)+parseFloat(s.outlineOffset);return {left:r.left-ring,right:r.right+ring,top:r.top-ring,bottom:r.bottom+ring,width:innerWidth,height:innerHeight};});
 expect(bounds.left).toBeGreaterThanOrEqual(0);expect(bounds.right).toBeLessThanOrEqual(bounds.width);expect(bounds.top).toBeGreaterThanOrEqual(0);expect(bounds.bottom).toBeLessThanOrEqual(bounds.height);
}

const wire=(payload,success=true)=>({success,payload,message:'',code:success?0:40001,request_id:'upload-browser'});
async function mock(page,{hold=false,failure=false}={}){
 const requests=[],releases=[];
 await page.route('**/api/demo/upload',async route=>{
  const request=route.request();requests.push({method:request.method(),headers:request.headers(),body:request.postDataBuffer()?.toString()});
  if(hold)await new Promise(resolve=>releases.push(resolve));
  try{await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(wire({id:'confirmed-'+requests.length,name:'records'},!failure))});}catch{/* A canceled request may already be closed. */}
 });
 return {requests,release:()=>releases.splice(0).forEach(resolve=>resolve())};
}

test('Upload real file chooser, one multipart POST, no selection IO, exact response and inherited slots',async({page})=>{
 const network=await mock(page,{hold:true});await open(page);await select(page,[file()]);await expect(rows(page)).toHaveCount(1);expect(network.requests).toHaveLength(0);
 const row=rows(page).first(),node=await row.elementHandle();await page.getByRole('button',{name:'上传',exact:true}).click();await expect.poll(()=>network.requests.length).toBe(1);
 await expect(row.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');await expect(row.getByText('上传中',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'上传中',exact:true})).toBeDisabled();await expect(page.getByRole('textbox',{name:'操作草稿'})).toHaveValue('保留焦点与草稿');
 expect(network.requests[0].method).toBe('POST');expect(network.requests[0].headers['content-type']).toMatch(/^multipart\/form-data; boundary=/);expect(network.requests[0].body).toContain('filename="records.csv"');expect(network.requests[0].body).toContain('name="purpose"');
 const metrics=await row.evaluate(row=>{const r=row.getBoundingClientRect(),p=row.querySelector('[data-slot="progress"]').getBoundingClientRect();return {center:Math.abs((p.left+p.right-r.left-r.right)/2),name:getComputedStyle(row.querySelector('[data-slot="filename"]')).fontSize,body:getComputedStyle(row).fontSize};});expect(metrics.center).toBeLessThan(1);expect(metrics.name).toBe(metrics.body);
 network.release();await expect(row.getByText('已上传',{exact:true})).toBeVisible();await expect(row.getByText('已确认记录：confirmed-1')).toBeVisible();expect(await row.evaluate((r,node)=>r===node,node)).toBe(true);expect(network.requests).toHaveLength(1);
});

test('Upload validation, readOnly/disabled gates and drop do not issue unexpected writes',async({page})=>{
 const network=await mock(page);await open(page);await select(page,[file('large.csv',1025),file('invalid.exe')]);await expect(page.getByText('文件超过大小限制',{exact:true})).toBeVisible();await expect(page.getByText('不支持此文件类型',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'上传',exact:true})).toBeDisabled();
 await page.evaluate(()=>window.uploadDemo.a.clear());await select(page,[file('a.csv'),file('b.csv'),file('c.csv'),file('d.csv')]);await select(page,[file('e.csv')]);await expect(rows(page)).toHaveCount(4);await expect(page.getByText('文件数量超出限制',{exact:true})).toBeVisible();await expect(picker(page)).toHaveAttribute('aria-invalid','true');expect(await picker(page).getAttribute('aria-describedby')).toBeTruthy();
 await page.evaluate(()=>window.uploadDemo.setReadOnly(true));await expect(picker(page)).toBeDisabled();await expect(rows(page).getByRole('button').first()).toBeDisabled();await page.evaluate(()=>{const transfer=new DataTransfer();transfer.items.add(new File(['x'],'drop.csv',{type:'text/csv'}));document.querySelector('[data-slot="picker"]').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));});await expect(rows(page)).toHaveCount(4);expect(network.requests).toHaveLength(0);
 await page.evaluate(()=>{window.uploadDemo.setReadOnly(false);window.uploadDemo.a.clear();});await page.evaluate(()=>{const transfer=new DataTransfer();transfer.items.add(new File(['x'],'drop.csv',{type:'text/csv'}));document.querySelector('[data-slot="picker"]').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));});await expect(rows(page)).toHaveCount(1);expect(network.requests).toHaveLength(0);await page.evaluate(()=>window.uploadDemo.setDisabled(true));await expect(picker(page)).toBeDisabled();
});

test('Upload Enter and Space open the native chooser with one focus stop and associated label',async({page})=>{
 const network=await mock(page);await open(page);const native=page.locator('input[type=file]');await expect(native).toHaveAccessibleName('附件');await expect(native).toHaveAttribute('tabindex','-1');await expect(native).toHaveAttribute('required','');expect(await native.getAttribute('aria-describedby')).toBeTruthy();
 for(const key of ['Enter','Space']){await picker(page).focus();const choosing=page.waitForEvent('filechooser');await page.keyboard.press(key);await (await choosing).setFiles([file(key+'.csv')]);await expect(picker(page)).toBeFocused();}
 await expect(rows(page)).toHaveCount(2);await expect(native).not.toHaveAttribute('required','');expect(network.requests).toHaveLength(0);
});

test('Upload cancel/retry/finish/remove keep row focus and do not steal external focus',async({page})=>{
 const network=await mock(page,{hold:true});await open(page);await select(page,[file('first.csv'),file('second.csv')]);await page.getByRole('button',{name:'上传',exact:true}).click();await expect.poll(()=>network.requests.length).toBe(1);
 let row=rows(page).first();await row.getByRole('button',{name:'取消 first.csv',exact:true}).focus();await page.keyboard.press('Enter');await expect(row.getByRole('button',{name:'重新上传 first.csv',exact:true})).toBeFocused();await expect(row.getByText('结果未确认，请先核对服务器；重新上传可能产生重复文件。')).toBeVisible();
 // The second queued file proceeds once the first local wait is canceled.
 await expect.poll(()=>network.requests.length).toBe(2);network.release();await expect(rows(page).nth(1).getByText('已上传',{exact:true})).toBeVisible();
 await row.getByRole('button',{name:'重新上传 first.csv',exact:true}).focus();await page.keyboard.press('Space');await expect(row.getByRole('button',{name:'取消 first.csv',exact:true})).toBeFocused();await expect.poll(()=>network.requests.length).toBe(3);network.release();await expect(row.getByRole('button',{name:'移除 first.csv',exact:true})).toBeFocused();
 await page.keyboard.press('Enter');await expect(rows(page)).toHaveCount(1);await expect(rows(page).getByRole('button',{name:'移除 second.csv',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(picker(page)).toBeFocused();
 await select(page,[file()]);await page.getByRole('button',{name:'上传',exact:true}).click();await expect.poll(()=>network.requests.length).toBe(4);const draft=page.getByRole('textbox',{name:'操作草稿'});await draft.focus();network.release();await expect(rows(page).getByText('已上传',{exact:true})).toBeVisible();await expect(draft).toBeFocused();
});

for(const path of ['/upload-react/','/upload-react-strict/'])test(`Upload full Controller replacement and view exit ${path}`,async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));const network=await mock(page,{hold:true});await open(page,path);await select(page,[file()]);await page.getByRole('button',{name:'上传',exact:true}).click();await expect.poll(()=>network.requests.length).toBe(1);
 await page.evaluate(()=>window.uploadDemo.swap('B'));await expect(rows(page)).toHaveCount(0);await expect.poll(()=>page.evaluate(()=>window.uploadDemo.a.getState().busy)).toBe(false);expect(await page.evaluate(()=>window.uploadDemo.a.getState().files[0].status)).toBe('canceled');network.release();
 await page.evaluate(()=>window.uploadDemo.swap('A'));await expect(rows(page).getByText('已停止等待',{exact:true})).toBeVisible();await page.evaluate(()=>window.uploadDemo.setMounted(false));await expect(rows(page)).toHaveCount(0);await page.evaluate(()=>window.uploadDemo.setMounted(true));await expect(rows(page)).toHaveCount(1);expect(errors).toEqual([]);
});

test('Upload business failure stays unconfirmed and retries only on explicit action',async({page})=>{
 const network=await mock(page,{failure:true});await open(page);await select(page,[file()]);await page.getByRole('button',{name:'上传',exact:true}).click();await expect(rows(page).getByText('上传未确认',{exact:true})).toBeVisible();expect(network.requests).toHaveLength(1);await expect(rows(page).locator('[data-slot="result"]')).toHaveCount(0);await rows(page).getByRole('button',{name:'重新上传 records.csv'}).click();await expect.poll(()=>network.requests.length).toBe(2);
});

for(const appearance of ['light','dark','system'])for(const mode of ['desktop','narrow','text','interface'])test(`Upload ${appearance} ${mode} long names and keyboard`,async({page},info)=>{
 await page.setViewportSize({width:mode==='desktop'?1280:320,height:700});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),appearance);const network=await mock(page,{hold:true});await open(page);await select(page,[file(longName)]);
 if(mode==='text')await page.evaluate(()=>document.documentElement.style.fontSize='200%');if(mode==='interface')await page.evaluate(()=>window.uploadDemo.setScale(2));await noOverflow(page);await page.getByRole('button',{name:'上传',exact:true}).click();await expect(rows(page).getByRole('progressbar')).toBeVisible();await expect(rows(page).getByText(longName,{exact:true})).toBeVisible();await noOverflow(page);
 const cancel=rows(page).getByRole('button',{name:'取消 '+longName,exact:true});await cancel.focus();await expect(cancel).toBeInViewport();await focusPaintInside(page,cancel);await info.attach('upload-layout.png',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});await page.keyboard.press('Enter');await expect(rows(page).getByRole('button',{name:'重新上传 '+longName,exact:true})).toBeFocused();network.release();
 if(appearance==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');}
 await page.evaluate(()=>window.uploadDemo.setEnglish(true));await expect(page.getByRole('button',{name:'Select files：Supporting files',exact:true})).toBeEnabled();await expect(rows(page).getByRole('button',{name:'Upload again '+longName,exact:true})).toBeFocused();
});

for(const appearance of ['light','dark','system'])test(`Upload ${appearance} genuine Chrome 200% zoom`,async({},info)=>{
 test.setTimeout(60000);const context=await chromium.launchPersistentContext('',{...chromiumLaunchOptions,headless:true,chromiumSandbox:true,viewport:null,args:['--window-size=1280,900']});
 try{const page=await context.newPage();await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),appearance);await mock(page);await open(page,'http://127.0.0.1:4173/upload-react/');await select(page,[file(longName)]);const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize}));const settings=await context.newPage();await settings.goto('chrome://settings/appearance');await settings.locator('select#zoomLevel').selectOption('2');await settings.close();await page.bringToFront();await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBeCloseTo(before.dpr*2,1);const after=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:getComputedStyle(document.documentElement).fontSize,zoom:getComputedStyle(document.documentElement).zoom,pinch:visualViewport.scale}));expect(after.width).toBeCloseTo(before.width/2,0);expect(after.font).toBe(before.font);expect(after.zoom).toBe('1');expect(after.pinch).toBe(1);await noOverflow(page);const upload=page.getByRole('button',{name:'上传',exact:true});await upload.focus();await expect(upload).toBeInViewport();await page.keyboard.press('Enter');await expect(rows(page).getByText('已上传',{exact:true})).toBeVisible();const remove=rows(page).getByRole('button',{name:'移除 '+longName,exact:true});await remove.focus();await expect(remove).toBeInViewport();await focusPaintInside(page,remove);await info.attach('upload-browser-zoom.png',{body:await captureZoomViewport(page),contentType:'image/png'});await info.attach('zoom.json',{body:JSON.stringify({before,after}),contentType:'application/json'});}finally{await context.close();}
});
