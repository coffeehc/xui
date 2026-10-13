import {test,expect} from '@playwright/test';
async function setup(page,{native,kind,mode,width,scale=1,standalone=false,noHeader=false,titleText}){
 await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.goto('/react/foundation-contract.html');await page.waitForFunction(()=>!!window.renderFocusCase);
 await page.evaluate(({native,kind,mode,scale,standalone,noHeader,titleText})=>{document.documentElement.dataset.theme=mode;document.documentElement.dataset.themeEffective=mode==='system'?'dark':mode;document.documentElement.style.fontSize=`${16*scale}px`;window.renderFocusCase({native,kind,standalone,noHeader,titleText});},{native,kind,mode,scale,standalone,noHeader,titleText});
 if(kind!=='card')await page.getByRole('button',{name:'Open form',exact:true}).click();
}
async function assertFocusPaint(control){
 await control.focus();
 const result=await control.evaluate(node=>{
  const paint=node.closest('.xui-input-group')??node,style=getComputedStyle(paint),rect=paint.getBoundingClientRect(),reach=Math.max(0,parseFloat(style.outlineWidth)+parseFloat(style.outlineOffset));
  const violations=[];for(let parent=paint.parentElement;parent;parent=parent.parentElement){const css=getComputedStyle(parent),box=parent.getBoundingClientRect();const left=box.left+parent.clientLeft,top=box.top+parent.clientTop,right=left+parent.clientWidth,bottom=top+parent.clientHeight;
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

for(const native of [false,true])for(const titleText of ['', '很长的标题用于检查表单标题轨道不会盖住关闭按钮以及在窄屏放大后仍可完整换行'])test(`${native?'native':'react'} header safely handles ${titleText?'long':'empty'} title`,async({page})=>{
 await setup(page,{native,kind:'dialog',mode:'light',width:390,scale:2,titleText});const dialog=page.getByRole('dialog'),close=dialog.locator('.xui-dialog-close');await expect(close).toHaveCount(1);
 const heading=dialog.locator('.xui-dialog-heading'),[headBox,closeBox]=await Promise.all([heading.boundingBox(),close.boundingBox()]);expect(headBox.x+headBox.width).toBeLessThanOrEqual(closeBox.x+1);await close.click();await expect(dialog).toBeHidden();
});
for(const native of [false,true])test(`${native?'native':'react'} existing body/footer without Header remains compatible`,async({page})=>{
 await setup(page,{native,kind:'dialog',mode:'dark',width:390,noHeader:true});const dialog=page.getByRole('dialog');await expect(dialog.locator('.xui-dialog-close')).toHaveCount(0);await expect(dialog.locator('.xui-dialog-header')).toHaveCount(0);await assertFocusPaint(dialog.locator('input').first());await assertFocusPaint(dialog.locator('input').last());await dialog.getByRole('button',{name:'Cancel form'}).click();await expect(dialog).toBeHidden();await expect(page.getByRole('button',{name:'Open form'})).toBeFocused();
});
