import {test,expect} from '@playwright/test';
async function setup(page,{native,kind,mode,width,scale=1,standalone=false,noHeader=false,titleText,side}){
 await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.goto('/react/foundation-contract.html');await page.waitForFunction(()=>!!window.renderFocusCase);
 await page.evaluate(({native,kind,mode,scale,standalone,noHeader,titleText,side})=>{document.documentElement.dataset.theme=mode;document.documentElement.dataset.themeEffective=mode==='system'?'dark':mode;document.documentElement.style.fontSize=`${16*scale}px`;window.renderFocusCase({native,kind,standalone,noHeader,titleText,side});},{native,kind,mode,scale,standalone,noHeader,titleText,side});
 if(kind!=='card')await page.getByRole('button',{name:'Open form',exact:true}).click();
}
async function pointAtScrollOwner(page,owner){
 // The fixture deliberately contains a nested ScrollArea. Its contained wheel
 // gestures must not be mistaken for gestures on the outer modal scrollport.
 const point=await owner.evaluate(node=>{const r=node.getBoundingClientRect(),css=getComputedStyle(node);const x=r.left+node.clientLeft+parseFloat(css.paddingLeft)/2,y=r.top+r.height/2;return {x,y,hit:node.ownerDocument.elementFromPoint(x,y)===node};});
 expect(point.hit,'The gesture must hit the requested scroll owner, not a nested scroll area').toBe(true);await page.mouse.move(point.x,point.y);return point;
}
async function touchScrollToEnd(page,owner,cdp){
 const gestures=[];
 await owner.evaluate(node=>{window.dialogTouchEvents=[];window.dialogTouchRecorder=event=>{window.dialogTouchEvents.push({type:event.type,target:event.target?.className,cancelable:event.cancelable,defaultPrevented:event.defaultPrevented,isTrusted:event.isTrusted,scrollTop:node.scrollTop});};for(const name of ['touchstart','touchmove','touchend','touchcancel'])node.addEventListener(name,window.dialogTouchRecorder,{passive:true});});
 const geometry=await owner.evaluate(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node),padding=parseFloat(s.paddingTop);return {x:r.left+node.clientLeft+parseFloat(s.paddingLeft)/2,start:r.bottom-padding,end:r.top+padding,range:node.scrollHeight-node.clientHeight};});
 const distance=geometry.start-geometry.end;expect(distance).toBeGreaterThan(0);
 for(let attempt=0;attempt<=Math.ceil(geometry.range/distance)*2;attempt++){
  const before=await owner.evaluate(node=>({top:node.scrollTop,max:node.scrollHeight-node.clientHeight}));if(before.top>=before.max)break;
  const hit=await owner.evaluate((node,p)=>node.ownerDocument.elementFromPoint(p.x,p.start)===node,geometry);expect(hit).toBe(true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:geometry.x,y:geometry.start,id:0}]});
  for(let step=1;step<=4;step++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:geometry.x,y:geometry.start-distance*step/4,id:0}]});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())));}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>owner.evaluate(node=>node.scrollTop)).toBeGreaterThan(before.top);
  gestures.push({before:before.top,after:await owner.evaluate(node=>node.scrollTop),x:geometry.x,start:geometry.start,end:geometry.end});
 }
 return gestures;
}
async function assertFocusPaint(control){
 await control.focus();
 const result=await control.evaluate(node=>{
  const paint=node.closest('.xui-input-group')??node,style=getComputedStyle(paint),rect=paint.getBoundingClientRect(),reach=Math.max(0,parseFloat(style.outlineWidth)+parseFloat(style.outlineOffset));
  const violations=[];
  // Root/body scroll locking propagates overflow to the viewport. A fixed portal
  // is not clipped by the body's short in-flow content box (the opener button).
  // Check viewport paint explicitly, then every actual component clipping box.
  const viewport=window.visualViewport,leftEdge=viewport?.offsetLeft??0,topEdge=viewport?.offsetTop??0,rightEdge=leftEdge+(viewport?.width??document.documentElement.clientWidth),bottomEdge=topEdge+(viewport?.height??document.documentElement.clientHeight);
  if(rect.left-reach<leftEdge-1||rect.right+reach>rightEdge+1)violations.push('viewport:inline');
  if(rect.top-reach<topEdge-1||rect.bottom+reach>bottomEdge+1)violations.push('viewport:block');
  for(let parent=paint.parentElement;parent;parent=parent.parentElement){
   if(parent===document.body||parent===document.documentElement)continue;
   const css=getComputedStyle(parent),box=parent.getBoundingClientRect();const left=box.left+parent.clientLeft,top=box.top+parent.clientTop,right=left+parent.clientWidth,bottom=top+parent.clientHeight;
   if(/auto|scroll|hidden|clip/.test(css.overflowX)&&(rect.left-reach<left-1||rect.right+reach>right+1))violations.push(`${parent.className}:inline`);
   if(/auto|scroll|hidden|clip/.test(css.overflowY)&&(rect.top-reach<top-1||rect.bottom+reach>bottom+1))violations.push(`${parent.className}:block`);
  }
  return {violations,outline:parseFloat(style.outlineWidth),boxSizing:getComputedStyle(node).boxSizing};
 });
 expect(result.boxSizing).toBe('border-box');expect(result.outline).toBeGreaterThan(0);expect(result.violations).toEqual([]);
}
for(const native of [false,true])for(const mode of ['light','dark','system'])for(const viewport of [{width:1280,scale:1},{width:390,scale:1},{width:390,scale:2}])for(const kind of ['dialog','sheet','card']){
 test(`${native?'native':'react'} ${kind} focus paint ${mode} ${viewport.width}px ${viewport.scale*100}%`,async({page},info)=>{
  await setup(page,{native,kind,mode,...viewport});const scope=kind==='card'?page.getByRole('region',{name:'Card form',exact:true}):page.getByRole('dialog');
  const fields=scope.locator('input');for(const index of [0,1,17])await assertFocusPaint(fields.nth(index));
  const first=fields.first();await assertFocusPaint(first);await expect(first).toHaveAttribute('aria-invalid','true');expect(await first.evaluate(node=>getComputedStyle(node).borderTopColor)).not.toBe(await first.evaluate(node=>getComputedStyle(node).outlineColor));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width+1);
  if(kind!=='card'){
   const dismiss=scope.getByRole('button',{name:'Dismiss form',exact:true}),cancel=scope.getByRole('button',{name:'Cancel form',exact:true});await expect(dismiss).toHaveCount(1);
   const [closeBox,modalBox,footerBox]=await Promise.all([dismiss.boundingBox(),scope.boundingBox(),cancel.boundingBox()]);expect(closeBox.x).toBeGreaterThan(modalBox.x+modalBox.width/2);expect(closeBox.y).toBeLessThan(footerBox.y);expect(footerBox.y+footerBox.height).toBeLessThanOrEqual(844);
   expect(await cancel.evaluate(node=>getComputedStyle(node).position)).toBe('static');
   await assertFocusPaint(fields.last());await page.screenshot({path:info.outputPath('last-field.png')});
   await dismiss.focus();await page.keyboard.press('Enter');await expect(scope).toBeHidden();await expect(page.getByRole('button',{name:'Open form',exact:true})).toBeFocused();
   await page.keyboard.press('Enter');await expect(scope).toBeVisible();await page.keyboard.press('Escape');await expect(scope).toBeHidden();await expect(page.getByRole('button',{name:'Open form',exact:true})).toBeFocused();
  }else {await assertFocusPaint(fields.last());await page.screenshot({path:info.outputPath('card-last-field.png')});}
 });
}
for(const native of [false,true])test(`${native?'native':'react'} standalone close has reserved top-right space`,async({page})=>{
 await setup(page,{native,kind:'dialog',mode:'light',width:390,scale:2,standalone:true});const dialog=page.getByRole('dialog'),close=dialog.getByRole('button',{name:'Dismiss form'});expect(await close.evaluate(node=>getComputedStyle(node).position)).toBe('absolute');await expect(close).toHaveCount(1);
 const title=dialog.locator('.xui-dialog-title');expect(await title.evaluate(node=>parseFloat(getComputedStyle(node).paddingInlineEnd))).toBeGreaterThan(30);
 await close.click();await expect(dialog).toBeHidden();await expect(page.getByRole('button',{name:'Open form'})).toBeFocused();
});

for(const native of [false,true])for(const titleText of ['', '很长的标题用于检查表单标题轨道不会盖住关闭按钮以及在窄屏放大后仍可完整换行'])test(`${native?'native':'react'} header safely handles ${titleText?'long':'empty'} title`,async({page},info)=>{
 await setup(page,{native,kind:'dialog',mode:'light',width:390,scale:2,titleText});const dialog=page.getByRole('dialog'),close=dialog.locator('.xui-dialog-close');await expect(close).toHaveCount(1);
 const heading=dialog.locator('.xui-dialog-heading'),[headBox,closeBox]=await Promise.all([heading.boundingBox(),close.boundingBox()]);expect(headBox.x+headBox.width).toBeLessThanOrEqual(closeBox.x+1);
 const body=dialog.locator('.xui-dialog-body'),first=body.locator('input').first(),footer=dialog.locator('.xui-dialog-footer');const geometry=await body.evaluate((node)=>{const input=node.querySelector('input'),probe=document.createElement('span');probe.style.cssText='position:absolute;visibility:hidden;width:calc(var(--focus-width) + var(--focus-offset))';node.append(probe);const reach=parseFloat(getComputedStyle(probe).width);probe.remove();return {body:node.clientHeight,control:input.getBoundingClientRect().height,reach};});
 expect(geometry.body,'The header must not consume the body editing track').toBeGreaterThanOrEqual(geometry.control+Math.max(0,geometry.reach)*2);
 if(titleText){
  await expect(dialog).toHaveAttribute('data-dialog-scroll','whole');await expect(body).toHaveCSS('overflow-y','visible');
  await expect(close).toBeFocused();await page.keyboard.press('Tab');await expect(first).toBeFocused();await first.fill('Preserved across layout changes');
  await pointAtScrollOwner(page,dialog);await page.mouse.wheel(0,await dialog.evaluate(node=>node.scrollHeight));
  await expect.poll(async()=>{const box=await footer.boundingBox();return box.y>=0&&box.y+box.height<=844;}).toBe(true);
  await dialog.getByRole('button',{name:'Save form',exact:true}).click();expect(await page.evaluate(()=>window.focusCaseSaves)).toBe(1);await info.attach('whole-scroll-footer.png',{body:await page.screenshot(),contentType:'image/png'});
  await pointAtScrollOwner(page,dialog);await page.mouse.wheel(0,-(await dialog.evaluate(node=>node.scrollHeight)));await expect.poll(()=>dialog.evaluate(node=>node.scrollTop)).toBe(0);
  await info.attach('whole-scroll-title-and-close.png',{body:await page.screenshot(),contentType:'image/png'});
 }else {await expect(dialog).toHaveAttribute('data-dialog-scroll','body');const foot=await footer.boundingBox();expect(foot.y+foot.height).toBeLessThanOrEqual(844);}
 await close.click();await expect(dialog).toBeHidden();await expect(page.getByRole('button',{name:'Open form',exact:true})).toBeFocused();
});
for(const native of [false,true])test(`${native?'native':'react'} existing body/footer without Header remains compatible`,async({page})=>{
 await setup(page,{native,kind:'dialog',mode:'dark',width:390,noHeader:true});const dialog=page.getByRole('dialog');await expect(dialog.locator('.xui-dialog-close')).toHaveCount(0);await expect(dialog.locator('.xui-dialog-header')).toHaveCount(0);await assertFocusPaint(dialog.locator('input').first());await assertFocusPaint(dialog.locator('input').last());await dialog.getByRole('button',{name:'Cancel form'}).click();await expect(dialog).toBeHidden();await expect(page.getByRole('button',{name:'Open form'})).toBeFocused();
});

for(const native of [false,true])test(`${native?'native':'react'} dialog changes scroll owner without remounting fields`,async({page},info)=>{
 await setup(page,{native,kind:'dialog',mode:'dark',width:390});
 const dialog=page.getByRole('dialog'),body=dialog.locator('.xui-dialog-body'),first=body.locator('input').first(),title=dialog.locator('.xui-dialog-title');
 await expect(dialog).toHaveAttribute('data-dialog-scroll','body');
 const close=dialog.getByRole('button',{name:'Dismiss form',exact:true});await expect(close).toBeFocused();await page.keyboard.press('Tab');await expect(first).toBeFocused();await first.fill('Keep this field and focus');
 const identity=await first.evaluate(node=>{window.dialogFieldIdentity=node;return node.id;});
 await title.evaluate(node=>node.textContent='很长的标题用于检查表单标题轨道不会盖住关闭按钮以及在窄屏放大后仍可完整换行');await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 await expect(dialog).toHaveAttribute('data-dialog-scroll','whole');await expect(body).toHaveCSS('overflow-y','visible');await expect(first).toBeFocused();await expect(first).toHaveValue('Keep this field and focus');expect(await first.evaluate(node=>node===window.dialogFieldIdentity)).toBe(true);
 await page.setViewportSize({width:390,height:320});
 const cdp=await page.context().newCDPSession(page);
 const {windowId}=await cdp.send('Browser.getWindowForTarget');await cdp.send('Browser.setWindowBounds',{windowId,bounds:{width:800,height:900,windowState:'normal'}});
 expect(await page.evaluate(()=>({width:innerWidth,height:innerHeight}))).toEqual({width:390,height:320});
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 let gestures;try{gestures=await touchScrollToEnd(page,dialog,cdp);}finally{const events=await dialog.evaluate(node=>{for(const name of ['touchstart','touchmove','touchend','touchcancel'])node.removeEventListener(name,window.dialogTouchRecorder);return window.dialogTouchEvents;});await info.attach('touch-scroll-events.json',{body:JSON.stringify(events,null,2),contentType:'application/json'});}await info.attach('touch-scroll-trajectory.json',{body:JSON.stringify(gestures,null,2),contentType:'application/json'});
 const footer=dialog.locator('.xui-dialog-footer');await expect.poll(async()=>{const r=await footer.boundingBox();return r.y>=0&&r.y+r.height<=320;}).toBe(true);
 const saveBox=await dialog.getByRole('button',{name:'Save form',exact:true}).boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:saveBox.x+saveBox.width/2,y:saveBox.y+saveBox.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(()=>page.evaluate(()=>window.focusCaseSaves)).toBe(1);await info.attach('short-window-touch-footer.png',{body:await page.screenshot(),contentType:'image/png'});await cdp.detach();
 await title.evaluate(node=>node.textContent='Short title');await page.evaluate(()=>document.documentElement.style.fontSize='100%');await page.setViewportSize({width:390,height:844});await expect(dialog).toHaveAttribute('data-dialog-scroll','body');await expect(first).toHaveValue('Keep this field and focus');expect(await first.getAttribute('id')).toBe(identity);expect(await first.evaluate(node=>node===window.dialogFieldIdentity)).toBe(true);
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(page.getByRole('button',{name:'Open form',exact:true})).toBeFocused();
});

test('native dialog remains reachable without ResizeObserver',async({page},info)=>{
 await page.setViewportSize({width:390,height:480});await page.goto('/react/foundation-contract.html');await page.waitForFunction(()=>!!window.renderFocusCase);
 await page.evaluate(()=>{const observer=window.ResizeObserver;window.ResizeObserver=undefined;try{window.renderFocusCase({native:true,kind:'dialog',titleText:'很长的标题'.repeat(12)});}finally{window.ResizeObserver=observer;}});
 await page.getByRole('button',{name:'Open form',exact:true}).click();const dialog=page.getByRole('dialog');await expect(dialog).not.toHaveAttribute('data-dialog-scroll','body');await expect(dialog.locator('.xui-dialog-body')).toHaveCSS('overflow-y','visible');
 await pointAtScrollOwner(page,dialog);await page.mouse.wheel(0,await dialog.evaluate(node=>node.scrollHeight));const cancel=dialog.getByRole('button',{name:'Cancel form',exact:true});await expect.poll(async()=>{const b=await cancel.boundingBox();return b.y>=0&&b.y+b.height<=480;}).toBe(true);await info.attach('no-observer-footer.png',{body:await page.screenshot(),contentType:'image/png'});await cancel.click();await expect(dialog).toBeHidden();await expect(page.getByRole('button',{name:'Open form',exact:true})).toBeFocused();
});

for(const native of [false,true])for(const side of ['top','bottom'])test(`${native?'native':'react'} ${side} sheet respects its actual height budget`,async({page},info)=>{
 await setup(page,{native,kind:'sheet',side,mode:'light',width:390,scale:2,titleText:'很长的标题用于检查表单标题轨道不会盖住关闭按钮以及在窄屏放大后仍可完整换行'});const dialog=page.getByRole('dialog'),body=dialog.locator('.xui-dialog-body');await expect(dialog).toHaveAttribute('data-dialog-scroll','whole');await expect(body).toHaveCSS('overflow-y','visible');
 await pointAtScrollOwner(page,dialog);await page.mouse.wheel(0,await dialog.evaluate(node=>node.scrollHeight));const cancel=dialog.getByRole('button',{name:'Cancel form',exact:true});await expect.poll(async()=>{const c=await cancel.boundingBox(),d=await dialog.boundingBox();return c.y>=d.y&&c.y+c.height<=d.y+d.height;}).toBe(true);await info.attach('fixed-height-sheet-footer.png',{body:await page.screenshot(),contentType:'image/png'});await cancel.click();await expect(dialog).toBeHidden();
});

for(const native of [false,true])test(`${native?'native':'react'} last-field focus remains painted through both scroll-owner transitions`,async({page},info)=>{
 await setup(page,{native,kind:'dialog',mode:'light',width:390});const dialog=page.getByRole('dialog'),body=dialog.locator('.xui-dialog-body'),last=body.locator('input').nth(17);await expect(dialog.getByRole('button',{name:'Dismiss form',exact:true})).toBeFocused();
 for(let index=0;index<18;index++){await page.keyboard.press('Tab');await expect(body.locator('input').nth(index)).toBeFocused();}
 await last.fill('Last field remains');
 for(const [scale,text,mode] of [[2,'很长的标题用于检查表单标题轨道不会盖住关闭按钮以及在窄屏放大后仍可完整换行','whole'],[1,'Short title','body']]){
  await dialog.locator('.xui-dialog-title').evaluate((node,text)=>node.textContent=text,text);await page.evaluate(scale=>document.documentElement.style.fontSize=`${scale*100}%`,scale);await expect(dialog).toHaveAttribute('data-dialog-scroll',mode);await expect(last).toBeFocused();await expect(last).toHaveValue('Last field remains');
  await expect.poll(()=>last.evaluate(node=>{const dialog=node.closest('[role="dialog"],dialog'),owner=dialog.dataset.dialogScroll==='body'?node.closest('.xui-dialog-body'):dialog,r=node.getBoundingClientRect(),s=getComputedStyle(node),reach=parseFloat(s.outlineWidth)+parseFloat(s.outlineOffset),o=owner.getBoundingClientRect(),top=o.top+owner.clientTop,left=o.left+owner.clientLeft;return r.top-reach>=Math.max(0,top)&&r.bottom+reach<=Math.min(innerHeight,top+owner.clientHeight)&&r.left-reach>=left&&r.right+reach<=left+owner.clientWidth;})).toBe(true);
  await info.attach(`last-focus-${mode}.png`,{body:await page.screenshot(),contentType:'image/png'});
 }
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
});
