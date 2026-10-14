import {test,expect} from '@playwright/test';

// Regression assertions intentionally describe DESIGN's required behavior.
// At baseline 75ef6e3 the workspace gutter and selected-toggle hover cases are
// expected to fail. Do not use test.fail(), skip(), or invert these assertions
// to turn that baseline into an apparent pass.
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
 return {focused:input===document.activeElement,focusVisible:input.matches(':focus-visible'),paintElement:node.className,rect,paint,outlineStyle:style.outlineStyle,outlineWidth,outlineOffset,tokens:{width:root.getPropertyValue('--focus-width').trim(),offset:root.getPropertyValue('--focus-offset').trim()},boundaries,clipped,viewport:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth}};
});}
async function togglePaint(control){return control.evaluate(node=>{
 const style=getComputedStyle(node),root=getComputedStyle(document.documentElement),probe=document.createElement('span');
 probe.style.position='absolute';probe.style.visibility='hidden';probe.style.pointerEvents='none';document.body.append(probe);
 const resolved=token=>{probe.style.backgroundColor=`var(${token})`;return getComputedStyle(probe).backgroundColor;};
 try{return {pressed:node.getAttribute('aria-pressed'),hover:node.matches(':hover'),focusVisible:node.matches(':focus-visible'),background:style.backgroundColor,color:style.color,borderColor:style.borderColor,outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth,outlineOffset:style.outlineOffset,tokens:Object.fromEntries(['--interaction-selected','--interaction-selected-foreground','--button-hover-background'].map(token=>[token,{specified:root.getPropertyValue(token).trim(),resolved:resolved(token)}]))};}finally{probe.remove();}
});}

for(const kind of ['react','vanilla'])for(const mode of modes)for(const size of sizes){
 test(`${kind} workspace ${mode} ${size.name}: first/grouped/last controls retain all four focus edges`,async({page},info)=>{
  await page.setViewportSize({width:size.width,height:size.height});await appearance(page,mode);
  await page.goto('/react/foundation-contract.html');
  await page.waitForFunction(()=>typeof window.renderWorkspaceFocusCase==='function');
  await page.evaluate(config=>window.renderWorkspaceFocusCase(config),{native:kind==='vanilla',mode});
  const first=page.getByRole('textbox',{name:'Workspace first',exact:true});await expect(first).toBeVisible();await settle(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);
  for(const [label,value] of [['Workspace first','Keep first draft'],['Workspace grouped','Keep grouped draft'],['Workspace last','Keep last draft']]){
   const control=page.getByRole('textbox',{name:label,exact:true});await tabTo(page,control);await settle(page);
   await expect(control).toBeFocused();await expect(control).toHaveValue(value);
   const result=await focusPaint(control);await evidence(page,info,`${kind}-${mode}-${size.name}-${label.replaceAll(' ','-')}`,result);
   expect.soft(result.focusVisible).toBe(true);
   expect.soft(result.outlineStyle).toBe('solid');expect.soft(result.outlineWidth).toBeCloseTo(parseFloat(result.tokens.width),2);
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
  expect.soft(selected.focusVisible).toBe(true);expect.soft(selected.outlineStyle).toBe('solid');
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
