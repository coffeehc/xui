import {test,expect} from '@playwright/test';

// Assert the public focus and persistent-selection contract at actual controls.
const settle=page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
const modes=['light','dark','system'];
const sizes=[{name:'wide',width:1280,height:800},{name:'narrow',width:390,height:844}];

async function appearance(page,mode){
 await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);
}
async function tabTo(page,control){
 for(let count=0;count<64;count++){
  if(await control.evaluate(node=>node===node.ownerDocument.activeElement))return;
  await page.keyboard.press('Tab');
 }
 await expect(control,'the control must be reachable through ordinary Tab navigation').toBeFocused();
}
async function evidence(page,info,name,measurements){
 await info.attach(`${name}.json`,{body:JSON.stringify(measurements,null,2),contentType:'application/json'});
 await info.attach(`${name}.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
}
async function focusPaint(control){return control.evaluate(input=>{
 const node=input.closest('.xui-input-group')??input;
 const box=element=>{const r=element.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
 const rect=box(node),style=getComputedStyle(node),root=getComputedStyle(document.documentElement);
 const outlineWidth=parseFloat(style.outlineWidth),outlineOffset=parseFloat(style.outlineOffset),outset=Math.max(0,outlineWidth+outlineOffset);
 const paint={left:rect.left-outset,top:rect.top-outset,right:rect.right+outset,bottom:rect.bottom+outset};
 const boundaries=[],clipped=[];
 for(let parent=node.parentElement;parent;parent=parent.parentElement){
  const s=getComputedStyle(parent),r=parent.getBoundingClientRect();
  const clip={left:r.left+parent.clientLeft,top:r.top+parent.clientTop,right:r.left+parent.clientLeft+parent.clientWidth,bottom:r.top+parent.clientTop+parent.clientHeight};
  const x=/^(auto|scroll|hidden|clip)$/.test(s.overflowX),y=/^(auto|scroll|hidden|clip)$/.test(s.overflowY);
  if(!x&&!y)continue;
  const sides=[];
  if(x&&paint.left<clip.left-.5)sides.push('left');
  if(x&&paint.right>clip.right+.5)sides.push('right');
  if(y&&paint.top<clip.top-.5)sides.push('top');
  if(y&&paint.bottom>clip.bottom+.5)sides.push('bottom');
  const boundary={element:parent.tagName,className:parent.className,overflowX:s.overflowX,overflowY:s.overflowY,clip,sides};
  boundaries.push(boundary);if(sides.length)clipped.push(boundary);
 }
 const probe=document.createElement('span');probe.style.color='var(--interaction-focus)';document.body.append(probe);const focusColor=getComputedStyle(probe).color;probe.remove();
 return {focused:input===document.activeElement,focusVisible:input.matches(':focus-visible'),paintElement:node.className,rect,paint,outlineStyle:style.outlineStyle,outlineWidth,outlineOffset,borderColor:style.borderColor,focusColor,tokens:{width:root.getPropertyValue('--focus-width').trim(),offset:root.getPropertyValue('--focus-offset').trim()},boundaries,clipped,viewport:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth}};
});}
async function togglePaint(control){return control.evaluate(node=>{
 const style=getComputedStyle(node),root=getComputedStyle(document.documentElement),probe=document.createElement('span');
 probe.style.position='absolute';probe.style.visibility='hidden';probe.style.pointerEvents='none';document.body.append(probe);
 const resolved=token=>{probe.style.backgroundColor=`var(${token})`;return getComputedStyle(probe).backgroundColor;};
 try{return {pressed:node.getAttribute('aria-pressed'),hover:node.matches(':hover'),focusVisible:node.matches(':focus-visible'),background:style.backgroundColor,color:style.color,borderColor:style.borderColor,outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth,outlineOffset:style.outlineOffset,tokens:Object.fromEntries(['--interaction-selected','--interaction-selected-foreground','--button-hover-background'].map(token=>[token,{specified:root.getPropertyValue(token).trim(),resolved:resolved(token)}]))};}finally{probe.remove();}
});}

async function boundary(control){return control.evaluate(node=>{
 const s=getComputedStyle(node),r=node.getBoundingClientRect(),part=getComputedStyle(node,'::before');
 return {width:r.width,height:r.height,border:[s.borderTopWidth,s.borderRightWidth,s.borderBottomWidth,s.borderLeftWidth],borderColor:s.borderColor,radius:s.borderRadius,background:s.backgroundColor,shadow:s.boxShadow,outline:s.outlineStyle,outlineWidth:s.outlineWidth,part:{content:part.content,width:part.borderWidth,color:part.borderColor,inset:part.inset}};
});}

for(const mode of modes){
 test(`focus ${mode}: valid and invalid text fields preserve border geometry and error priority`,async({page})=>{
  await appearance(page,mode);await page.goto('/react/input-foundation-contract.html');
  await page.evaluate(()=>document.documentElement.style.setProperty('--interaction-focus','#336699'));
  for(const kind of ['input','textarea'])for(const invalid of [false,true]){
   const control=page.locator(`#${kind}-default-${invalid?'invalid':'valid'}`);
   await control.scrollIntoViewIfNeeded();await page.mouse.move(0,0);const before=await boundary(control);
   await page.keyboard.press('Tab');await control.focus();await expect(control).toHaveCSS('border-color',invalid?before.borderColor:'rgb(51, 102, 153)');const after=await boundary(control);
   await expect(control).toBeFocused();expect(after.outline).toBe('none');expect(after.outlineWidth).toBe('0px');
   expect(after).toMatchObject({width:before.width,height:before.height,border:before.border,radius:before.radius,background:before.background,shadow:before.shadow});
   expect(after.borderColor).toBe(invalid?before.borderColor:'rgb(51, 102, 153)');
   await control.blur();await expect(control).toHaveCSS('border-color',before.borderColor);
  }
 });
 test(`focus ${mode}: buttons preserve transparent borders and recolor only existing outline variants`,async({page})=>{
  await appearance(page,mode);await page.goto('/react/button-state-contract.html');
  await page.evaluate(()=>document.documentElement.style.setProperty('--interaction-focus','#336699'));
  for(const round of [false,true])for(const variant of ['primary','secondary','outline','ghost','destructive','link',...(round?['text']:[])]){
   const control=page.getByTestId(`${round?'round-':''}${variant}-enabled`);
   await control.scrollIntoViewIfNeeded();await page.mouse.move(0,0);const before=await boundary(control);
   await page.keyboard.press('Tab');await control.focus();await settle(page);const after=await boundary(control);
   await expect(control).toBeFocused();expect(after.outline).toBe('none');expect(after.outlineWidth).toBe('0px');
   expect(after).toMatchObject({width:before.width,height:before.height,border:before.border,radius:before.radius,background:before.background,shadow:before.shadow});
   expect(after.borderColor).toBe(variant==='outline'&&!round?'rgb(51, 102, 153)':before.borderColor);
   expect(after.part).toEqual({...before.part,color:variant==='outline'&&round?'rgb(51, 102, 153)':before.part.color});
   await control.blur();const restored=await boundary(control);expect(restored.borderColor).toBe(before.borderColor);expect(restored.part.color).toBe(before.part.color);
  }
 });
 test(`focus ${mode}: login password errors retain one border through pointer and keyboard focus`,async({page},info)=>{
  await appearance(page,mode);await page.setViewportSize({width:390,height:844});await page.goto('/login-react/');
  const username=page.locator('input[name="username"]'),password=page.locator('input[name="password"]'),group=page.locator('.xui-input-group').filter({has:password});
  await username.fill('admin');await page.getByRole('button',{name:'登录',exact:true}).click();
  await expect(password).toHaveAttribute('aria-invalid','true');const error=await boundary(group);
  await password.click();await expect(password).toBeFocused();const pointer=await boundary(group);
  expect(pointer.outline).toBe('none');expect(pointer.outlineWidth).toBe('0px');expect(pointer.borderColor).toBe(error.borderColor);expect(pointer.border).toEqual(error.border);
  await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await expect(password).toBeFocused();
  expect(await boundary(group)).toEqual(pointer);await expect(password).toHaveCSS('outline-style','none');
  const toggle=group.getByRole('button');await page.keyboard.press('Tab');await expect(toggle).toBeFocused();await expect(toggle).toHaveCSS('outline-style','none');
  expect((await boundary(group)).borderColor).toBe(error.borderColor);await password.click();
  await info.attach(`${mode}-login-one-border`,{body:await page.screenshot(),contentType:'image/png'});
 });
}

for(const kind of ['react'])for(const mode of modes)for(const size of sizes){
 test(`${kind} workspace ${mode} ${size.name}: first/grouped/last controls change only their existing border`,async({page},info)=>{
  await page.setViewportSize({width:size.width,height:size.height});await appearance(page,mode);
  await page.goto('/react/foundation-contract.html');
  await page.waitForFunction(()=>typeof window.renderWorkspaceFocusCase==='function');
  await page.evaluate(config=>window.renderWorkspaceFocusCase(config),{mode});
  const first=page.getByRole('textbox',{name:'Workspace first',exact:true});await expect(first).toBeVisible();await settle(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);
  for(const [label,value] of [['Workspace first','Keep first draft'],['Workspace grouped','Keep grouped draft'],['Workspace last','Keep last draft']]){
   const control=page.getByRole('textbox',{name:label,exact:true});await tabTo(page,control);await settle(page);
   await expect(control).toBeFocused();await expect(control).toHaveValue(value);
   const result=await focusPaint(control);await evidence(page,info,`${kind}-${mode}-${size.name}-${label.replaceAll(' ','-')}`,result);
   expect.soft(result.focusVisible).toBe(true);
   expect.soft(result.outlineStyle).toBe('none');expect.soft(result.outlineWidth).toBe(0);
   expect.soft(result.borderColor).toBe(result.focusColor);
   expect.soft(result.clipped,'every painted focus edge must fit inside every clipping ancestor').toEqual([]);
   expect.soft(result.paint.left).toBeGreaterThanOrEqual(-.5);expect.soft(result.paint.right).toBeLessThanOrEqual(result.viewport.width+.5);
   expect.soft(result.paint.top).toBeGreaterThanOrEqual(-.5);expect.soft(result.paint.bottom).toBeLessThanOrEqual(result.viewport.height+.5);
   expect.soft(result.viewport.scrollWidth).toBeLessThanOrEqual(result.viewport.width+1);
  }
 });
 test(`${kind} ToggleGroup ${mode} ${size.name}: keyboard selection survives selected-plus-hover`,async({page},info)=>{
  await page.setViewportSize({width:size.width,height:size.height});await appearance(page,mode);await page.goto(`/widgets-${kind}/`);
  const one=page.getByRole('button',{name:'视图一',exact:true}),two=page.getByRole('button',{name:'视图二',exact:true});
  await expect(one).toHaveAttribute('aria-pressed','true');await settle(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);
  await tabTo(page,one);await page.keyboard.press('ArrowRight');await expect(two).toBeFocused();await page.keyboard.press('Space');
  await expect(two).toHaveAttribute('aria-pressed','true');await expect(one).toHaveAttribute('aria-pressed','false');
  await page.mouse.move(0,0);await settle(page);
  const selected=await togglePaint(two);await evidence(page,info,`${kind}-${mode}-${size.name}-selected-keyboard`,selected);
  expect.soft(selected.focusVisible).toBe(true);expect.soft(selected.outlineStyle).toBe('none');
  expect.soft(selected.background).toBe(selected.tokens['--interaction-selected'].resolved);
  expect.soft(selected.color).toBe(selected.tokens['--interaction-selected-foreground'].resolved);
  await two.hover();await settle(page);
  const hovered=await togglePaint(two);await evidence(page,info,`${kind}-${mode}-${size.name}-selected-hover`,hovered);
  expect.soft(hovered.hover).toBe(true);expect.soft(hovered.pressed).toBe('true');
  expect.soft(hovered.background,'DESIGN requires hover to preserve the persistent selected surface').toBe(hovered.tokens['--interaction-selected'].resolved);
  expect.soft(hovered.color).toBe(hovered.tokens['--interaction-selected-foreground'].resolved);
  await page.mouse.move(0,0);await settle(page);
  const restored=await togglePaint(two);expect.soft(restored.background).toBe(restored.tokens['--interaction-selected'].resolved);
  await expect(two).toBeFocused();await expect(two).toHaveAttribute('aria-pressed','true');
 });
}
