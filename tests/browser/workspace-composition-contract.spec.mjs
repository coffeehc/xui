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

async function assertPaintedErrorBorder(page,node,info,name,color){
 const box=await node.boundingBox();expect(box).not.toBeNull();
 const borderWidth=await node.evaluate(element=>parseFloat(getComputedStyle(element).borderTopWidth));
 const point=[box.x+box.width/2,box.y+borderWidth/2],png=await page.screenshot({animations:'disabled'});
 const pixel=await page.evaluate(async({encoded,point,color})=>{
  const image=new Image();image.src=`data:image/png;base64,${encoded}`;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const context=canvas.getContext('2d');context.drawImage(image,0,0);
  const x=Math.round(point[0]*image.width/innerWidth),y=Math.round(point[1]*image.height/innerHeight);
  const samples=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)samples.push(Array.from(context.getImageData(x+dx,y+dy,1,1).data));
  context.fillStyle=color;context.fillRect(0,0,1,1);
  return {samples,expected:Array.from(context.getImageData(0,0,1,1).data)};
 },{encoded:png.toString('base64'),point,color});
 await info.attach(`${name}-error-border.json`,{body:JSON.stringify({point,borderWidth,...pixel},null,2),contentType:'application/json'});
 const delta=Math.min(...pixel.samples.map(sample=>Math.max(...sample.map((channel,index)=>Math.abs(channel-pixel.expected[index])))));
 expect(delta,`${name}: error border remains painted while focus is inset`).toBeLessThanOrEqual(20);
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

for(const kind of ['react','vanilla'])test(`${kind} stacked InputGroup.Textarea preserves native editing, field semantics and wrapping actions`,async({page},info)=>{
 await page.setViewportSize({width:1280,height:1200});await page.goto(`/widgets-${kind}/`);await waitForDemo(page,'widgetsDemo');
 const group=page.getByTestId('stacked-input-group'),textarea=page.locator('#multiline-draft'),help=page.locator('#multiline-draft-help'),error=page.locator('#multiline-draft-error');
 await expect(group).toHaveAttribute('data-layout','stacked');await expect(textarea).toHaveAttribute('name','multiline');await expect(textarea).toHaveAttribute('required','');
 await expect(textarea).toHaveAccessibleName('多行草稿');await expect(help).toBeVisible();
 expect(await page.evaluate(()=>window.widgetsDemo.getComposerControl()===document.getElementById('multiline-draft'))).toBe(true);
 await textarea.fill('第一行');if(kind==='react')await expect.poll(()=>page.evaluate(()=>window.widgetsDemo.getComposerDraft())).toBe('第一行');await tabTo(page,textarea);await expect(textarea).toBeFocused();await expect(textarea).toHaveCSS('outline-style','none');
 await textarea.press('Enter');await expect(textarea).toHaveValue('第一行\n');if(kind==='react')await expect.poll(()=>page.evaluate(()=>window.widgetsDemo.getComposerDraft())).toBe('第一行\n');
 await textarea.evaluate(node=>node.setSelectionRange(2,2));
 // These are synthetic CompositionEvents. They check callback forwarding, not OS IME behavior.
 await textarea.evaluate(node=>{for(const [type,data] of [['compositionstart','拼'],['compositionupdate','拼音'],['compositionend','拼']])node.dispatchEvent(new CompositionEvent(type,{bubbles:true,data}));});
 expect(await page.evaluate(()=>window.widgetsDemo.getComposerEvents())).toEqual({start:1,update:1,end:1});
 await page.evaluate(()=>window.widgetsDemo.setComposerState({layout:'inline'}));await expect(group).toHaveAttribute('data-layout','inline');
 const retained=await page.evaluate(()=>{const node=window.widgetsDemo.getComposerControl();return {same:node===document.getElementById('multiline-draft'),focused:node===document.activeElement,value:node.value,start:node.selectionStart,end:node.selectionEnd,draft:window.widgetsDemo.getComposerDraft?.()};});expect(retained).toEqual({same:true,focused:true,value:'第一行\n',start:2,end:2,draft:kind==='react'?'第一行\n':undefined});
 await expect(textarea).toHaveAttribute('aria-describedby','multiline-draft-help');
 await page.evaluate(()=>window.widgetsDemo.setComposerState({layout:'stacked',invalid:true}));await expect(group).toHaveAttribute('data-layout','stacked');await expect(textarea).toHaveAttribute('aria-invalid','true');await expect(textarea).toHaveAttribute('aria-describedby','multiline-draft-help multiline-draft-error');await expect(error).toHaveText('草稿需要修正');
 const errorColor=await group.evaluate(node=>{const probe=document.createElement('span');probe.style.color='var(--status-error-foreground)';node.append(probe);const color=getComputedStyle(probe).color;probe.remove();return color;});await expect(group).toHaveCSS('border-top-color',errorColor);
 await textarea.evaluate(node=>node.setSelectionRange(2,2));await group.scrollIntoViewIfNeeded();await assertPaintedFocus(page,group,info,`${kind}-textarea-invalid-focus`);await assertPaintedErrorBorder(page,group,info,`${kind}-textarea-invalid-focus`,errorColor);
 await page.evaluate(()=>window.widgetsDemo.setComposerState({invalid:false,sendDisabled:true}));await expect(textarea).not.toHaveAttribute('aria-invalid','true');await expect(error).toBeHidden();await expect(textarea).toHaveAttribute('aria-describedby','multiline-draft-help');
 const send=group.getByRole('button',{name:'发送草稿',exact:true});await expect(send).toBeDisabled();await expect(textarea).toBeEnabled();
 const enabledBackground=await group.evaluate(node=>getComputedStyle(node).backgroundColor);await expect(group).not.toHaveAttribute('data-disabled','true');
 await page.evaluate(()=>window.widgetsDemo.setComposerState({disabled:true}));await expect(textarea).toBeDisabled();
 const muted=await group.evaluate(node=>{const probe=document.createElement('span');probe.style.backgroundColor='var(--muted)';node.append(probe);const color=getComputedStyle(probe).backgroundColor;probe.remove();return color;});await expect(group).toHaveCSS('background-color',muted);
 await page.evaluate(()=>window.widgetsDemo.setComposerState({disabled:false,sendDisabled:true,readOnly:true}));await expect(textarea).toHaveAttribute('readonly','');await expect(textarea).toBeEnabled();await expect(group).toHaveCSS('background-color',enabledBackground);
 await page.evaluate(()=>window.widgetsDemo.setComposerState({readOnly:false,emptyAddons:true}));await expect(group.locator(':scope > .xui-input-addon')).toHaveCount(2);await expect(group.locator(':scope > .xui-input-addon').nth(0)).toBeEmpty();await expect(group.locator(':scope > .xui-input-addon').nth(1)).toBeEmpty();await expect(textarea).toHaveValue('第一行\n');
 await page.evaluate(()=>window.widgetsDemo.setComposerState({emptyAddons:false,layout:'stacked'}));await expect(group.locator(':scope > .xui-input-addon')).toHaveCount(2);
 await page.setViewportSize({width:320,height:720});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
 const addon=group.locator(':scope > .xui-input-addon').nth(1),actions=addon.getByRole('button');await expect(actions).toHaveCount(2);
 const geometry=await group.evaluate(node=>{const r=node.getBoundingClientRect(),addons=[...node.querySelectorAll(':scope > .xui-input-addon')].map(item=>item.getBoundingClientRect()),field=node.querySelector('textarea').getBoundingClientRect(),buttons=[...node.querySelectorAll(':scope > .xui-input-addon:last-child button')].map(item=>item.getBoundingClientRect());return {group:{left:r.left,right:r.right,width:r.width},addons:addons.map(({left,right,top,bottom})=>({left,right,top,bottom})),field:{left:field.left,right:field.right,top:field.top,bottom:field.bottom},buttons:buttons.map(({left,right,top,bottom})=>({left,right,top,bottom}))};});
 expect(geometry.addons[0].bottom).toBeLessThanOrEqual(geometry.field.top+1);expect(geometry.field.bottom).toBeLessThanOrEqual(geometry.addons[1].top+1);
 for(const button of geometry.buttons){expect(button.left).toBeGreaterThanOrEqual(geometry.group.left-1);expect(button.right).toBeLessThanOrEqual(geometry.group.right+1);}
 expect(geometry.buttons[1].top).toBeGreaterThan(geometry.buttons[0].top);
 await expect(textarea).toHaveValue('第一行\n');await expect(textarea).not.toHaveAttribute('readonly','');
 await info.attach(`${kind}-input-group-320-200.png`,{body:await page.screenshot({animations:'disabled',fullPage:true}),contentType:'image/png'});
 await info.attach(`${kind}-input-group-geometry.json`,{body:JSON.stringify(geometry,null,2),contentType:'application/json'});
});
