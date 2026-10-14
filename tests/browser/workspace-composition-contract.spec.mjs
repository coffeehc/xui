import {test,expect} from '@playwright/test';

async function waitForDemo(page,name){await page.waitForFunction(name=>!!window[name],name);}

async function tabTo(page,target){
 for(let step=0;step<120;step++){
  if(await target.evaluate(node=>node===document.activeElement))return;
  await page.keyboard.press('Tab');
 }
 throw new Error('The public control was not reachable by sequential Tab navigation');
}

async function metrics(node){return node.evaluate(element=>{
 const rect=element.getBoundingClientRect(),style=getComputedStyle(element);
 return {rect:{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom},width:parseFloat(style.outlineWidth),offset:parseFloat(style.outlineOffset),style:style.outlineStyle,color:style.outlineColor};
});}

async function assertPaintedFocus(page,node,info,name){
 const outline=await metrics(node);expect(outline.style).toBe('solid');expect(outline.width).toBeGreaterThan(0);
 const center=outline.offset>=0?-(outline.offset+outline.width/2):-outline.offset-outline.width/2;
 const points=[
  [outline.rect.left+center,(outline.rect.top+outline.rect.bottom)/2],
  [outline.rect.right-center,(outline.rect.top+outline.rect.bottom)/2],
  [(outline.rect.left+outline.rect.right)/2,outline.rect.top+center],
  [(outline.rect.left+outline.rect.right)/2,outline.rect.bottom-center],
 ];
 const png=await page.screenshot({animations:'disabled'});
 const pixels=await page.evaluate(async({encoded,points,color})=>{
  const image=new Image();image.src=`data:image/png;base64,${encoded}`;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const context=canvas.getContext('2d');context.drawImage(image,0,0);
  const sx=image.width/innerWidth,sy=image.height/innerHeight;
  const samples=points.map(([x,y])=>{
   const cx=Math.round(x*sx),cy=Math.round(y*sy),result=[];
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)result.push(Array.from(context.getImageData(cx+dx,cy+dy,1,1).data));
   return result;
  });
  context.fillStyle=color;context.fillRect(0,0,1,1);
  return {samples,expected:Array.from(context.getImageData(0,0,1,1).data)};
 },{encoded:png.toString('base64'),points,color:outline.color});
 await info.attach(`${name}-focus-pixels.json`,{body:JSON.stringify({outline,points,...pixels},null,2),contentType:'application/json'});
 await info.attach(`${name}-focus.png`,{body:png,contentType:'image/png'});
 for(const [side,samples] of pixels.samples.entries()){
  const delta=Math.min(...samples.map(pixel=>Math.max(...pixel.map((channel,index)=>Math.abs(channel-pixels.expected[index])))));
  expect(delta,`${name}: ${['left','right','top','bottom'][side]} focus outline is painted`).toBeLessThanOrEqual(20);
 }
}

for(const kind of ['react','vanilla'])test(`${kind} workspace insets keep nested paint boundaries and application state`,async({page},info)=>{
 await page.setViewportSize({width:1280,height:560});
 await page.goto(`/workspace-${kind}/?focus&surface&long-menu`);await waitForDemo(page,'workspaceDemo');
 const shell=page.locator('.xui-shell'),content=page.locator('.xui-shell-content'),surface=page.getByTestId('workspace');
 const history=page.getByTestId('history'),inspector=page.getByTestId('inspector'),draft=page.getByRole('textbox',{name:'Message draft',exact:true}),draftGroup=page.locator('.xui-input-group').filter({has:draft}),menu=page.locator('.xui-shell-sidebar');
 await expect(shell).toHaveAttribute('data-scroll-mode','workspace');await expect(shell).toHaveAttribute('data-content-inset','standard');
 await expect(history).toHaveAttribute('data-focus-mode','gutter');await expect(surface).toHaveAttribute('data-padding','none');
 const standard=await content.evaluate(node=>({padding:parseFloat(getComputedStyle(node).paddingTop),scrollPadding:parseFloat(getComputedStyle(node).scrollPaddingTop)}));
 const cardDefault=await page.getByRole('region',{name:'Padded inspector card',exact:true}).evaluate(node=>parseFloat(getComputedStyle(node).paddingTop));
 const cardFlush=await page.getByRole('region',{name:'Flush inspector card',exact:true}).evaluate(node=>parseFloat(getComputedStyle(node).paddingTop));
 expect(standard.padding).toBeGreaterThan(0);expect(standard.scrollPadding).toBeGreaterThan(0);expect(cardDefault).toBeGreaterThan(0);expect(cardFlush).toBe(0);
 await expect(history).toHaveAttribute('role','region');
 await expect(page.getByRole('region',{name:'Nested gutter',exact:true})).toHaveAttribute('data-focus-mode','gutter');
 await expect(page.getByRole('region',{name:'Nested inset',exact:true})).toHaveAttribute('data-focus-mode','inset');

 await draft.fill('Keep this draft while the workspace changes');await tabTo(page,draft);await expect(draft).toBeFocused();
 await assertPaintedFocus(page,draftGroup,info,`${kind}-workspace-standard`);
 await page.evaluate(()=>window.workspaceDemo.navigate());const active=page.locator('[data-menu-id="settings"][aria-current="page"]');await expect(active).toHaveCount(1);
 await history.evaluate(node=>node.scrollTop=Math.min(320,node.scrollHeight-node.clientHeight));
 await inspector.evaluate(node=>node.scrollTop=Math.min(180,node.scrollHeight-node.clientHeight));
 const sidebarRange=await menu.evaluate(node=>node.scrollHeight-node.clientHeight);expect(sidebarRange).toBeGreaterThan(0);
 await menu.evaluate(node=>node.scrollTop=node.scrollHeight-node.clientHeight);
 const before=await page.evaluate(()=>{
  window.__focusWorkspaceDraft=document.querySelector('[aria-label="Message draft"]');
  window.__activeWorkspaceNav=document.querySelector('[data-menu-id="settings"][aria-current="page"]');
  return {history:document.querySelector('[data-testid="history"]').scrollTop,inspector:document.querySelector('[data-testid="inspector"]').scrollTop,menu:document.querySelector('.xui-shell-sidebar').scrollTop,activeId:window.__activeWorkspaceNav?.getAttribute('data-menu-id'),value:window.__focusWorkspaceDraft.value,focused:document.activeElement===window.__focusWorkspaceDraft};
 });
 expect(before.focused).toBe(true);
 await page.evaluate(()=>window.workspaceDemo.setSurfacePadding('default'));
 await expect(surface).toHaveAttribute('data-padding','default');await expect.poll(()=>surface.evaluate(node=>parseFloat(getComputedStyle(node).paddingTop))).toBeGreaterThan(0);
 await expect(page.getByRole('region',{name:'Padded inspector card',exact:true})).toHaveCSS('padding-top',`${cardDefault}px`);await expect(page.getByRole('region',{name:'Flush inspector card',exact:true})).toHaveCSS('padding-top','0px');
 await page.evaluate(()=>window.workspaceDemo.setSurfacePadding('none'));
 await expect(surface).toHaveAttribute('data-padding','none');await expect.poll(()=>surface.evaluate(node=>getComputedStyle(node).paddingTop)).toBe('0px');
 await page.evaluate(()=>window.workspaceDemo.setContentInset('edge'));await expect(shell).toHaveAttribute('data-content-inset','edge');
 await expect.poll(()=>content.evaluate(node=>getComputedStyle(node).paddingTop)).toBe('0px');await expect.poll(()=>content.evaluate(node=>getComputedStyle(node).scrollPaddingTop)).toBe('0px');
 const historyGutter=await history.evaluate(node=>({padding:parseFloat(getComputedStyle(node).paddingTop),scrollPadding:parseFloat(getComputedStyle(node).scrollPaddingTop)}));expect(historyGutter.padding).toBeGreaterThan(0);expect(historyGutter.scrollPadding).toBeGreaterThan(0);
 await page.evaluate(()=>window.workspaceDemo.setFocusMode('inset'));await expect(history).toHaveAttribute('data-focus-mode','inset');
 await expect.poll(()=>history.evaluate(node=>getComputedStyle(node).paddingTop)).toBe('0px');await expect.poll(()=>history.evaluate(node=>getComputedStyle(node).scrollPaddingTop)).toBe('0px');
 const nestedGutterAfter=await page.getByRole('region',{name:'Nested gutter',exact:true}).evaluate(node=>({padding:parseFloat(getComputedStyle(node).paddingTop),scrollPadding:parseFloat(getComputedStyle(node).scrollPaddingTop)}));expect(nestedGutterAfter.padding).toBeGreaterThan(0);expect(nestedGutterAfter.scrollPadding).toBeGreaterThan(0);
 const nestedInset=page.getByRole('region',{name:'Nested inset',exact:true});await expect.poll(()=>nestedInset.evaluate(node=>getComputedStyle(node).paddingTop)).toBe('0px');await expect.poll(()=>nestedInset.evaluate(node=>getComputedStyle(node).scrollPaddingTop)).toBe('0px');
 expect(await page.evaluate(()=>({sameDraft:document.querySelector('[aria-label="Message draft"]')===window.__focusWorkspaceDraft,value:window.__focusWorkspaceDraft.value,focused:document.activeElement===window.__focusWorkspaceDraft}))).toEqual({sameDraft:true,value:before.value,focused:true});
 const after=await page.evaluate(()=>({history:document.querySelector('[data-testid="history"]').scrollTop,inspector:document.querySelector('[data-testid="inspector"]').scrollTop,menu:document.querySelector('.xui-shell-sidebar').scrollTop,activeId:document.querySelector('[data-menu-id="settings"][aria-current="page"]')?.getAttribute('data-menu-id'),sameActive:document.querySelector('[data-menu-id="settings"][aria-current="page"]')===window.__activeWorkspaceNav}));
 expect(after.history).toBe(before.history);expect(after.inspector).toBe(before.inspector);expect(after.menu).toBe(before.menu);expect(after.activeId).toBe(before.activeId);expect(after.sameActive).toBe(true);
 await assertPaintedFocus(page,draftGroup,info,`${kind}-workspace-edge-inset`);
 const nestedTable=page.getByRole('region',{name:'Nested inset table',exact:true});await expect(nestedTable).toHaveAttribute('tabindex','0');await tabTo(page,nestedTable);await expect(nestedTable).toBeFocused();
 await assertPaintedFocus(page,nestedTable,info,`${kind}-nested-table-root-inset-focus`);
 const insetField=page.getByRole('textbox',{name:'First inset field',exact:true});await tabTo(page,insetField);await expect(insetField).toBeFocused();await assertPaintedFocus(page,insetField,info,`${kind}-nested-inset-control-focus`);
 const gutterField=page.getByRole('textbox',{name:'First gutter field',exact:true});await tabTo(page,gutterField);await expect(gutterField).toBeFocused();await assertPaintedFocus(page,gutterField,info,`${kind}-nested-gutter-control-focus`);
 await page.evaluate(()=>{window.workspaceDemo.setContentInset('standard');window.workspaceDemo.setFocusMode('gutter');window.workspaceDemo.setSurfacePadding('default');});
 await expect(shell).toHaveAttribute('data-content-inset','standard');await expect(history).toHaveAttribute('data-focus-mode','gutter');await expect(surface).toHaveAttribute('data-padding','default');
 await expect(draft).toHaveValue(before.value);
 await info.attach(`${kind}-workspace-edge-state.json`,{body:JSON.stringify({before,after,standard,cardDefault,cardFlush,historyGutter,nestedGutterAfter},null,2),contentType:'application/json'});
});
