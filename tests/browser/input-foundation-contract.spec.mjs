import {test,expect} from '@playwright/test';
const kinds=['input','textarea'],states=['default','readonly','disabled'];
const entries=kinds.flatMap(kind=>states.flatMap(state=>[false,true].map(invalid=>({kind,state,invalid,id:`${kind}-${state}-${invalid?'invalid':'valid'}`,value:kind==='input'?'Sample 中文 123':'Line 1 中文\nLine 2 123'}))));
async function setup(page,kind,theme){
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>localStorage.setItem('ui.theme.mode',theme),theme);
 await page.goto(`/${kind}/input-foundation-contract.html`);await expect(page.getByRole('heading',{name:'Input foundation contract'})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-theme-effective',theme==='system'?'dark':theme);
}
async function token(page,name,property='color'){return page.evaluate(({name,property})=>{const probe=document.createElement('span');probe.style.setProperty(property,`var(--${name})`);document.body.append(probe);const value=getComputedStyle(probe).getPropertyValue(property);probe.remove();return value;},{name,property});}
async function focusPaint(page,control){
 await expect(control).toBeFocused();expect(await control.evaluate(node=>node.matches(':focus-visible'))).toBe(true);
 await expect(control).toHaveCSS('outline-style','solid');await expect(control).toHaveCSS('outline-width',await token(page,'focus-width','width'));await expect(control).toHaveCSS('outline-offset',await token(page,'focus-offset','width'));await expect(control).toHaveCSS('outline-color',await token(page,'interaction-focus'));
 const edges=await control.evaluate(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node),ring=parseFloat(s.outlineWidth)+parseFloat(s.outlineOffset);return {left:r.left-ring,right:r.right+ring,top:r.top-ring,bottom:r.bottom+ring,width:innerWidth,height:innerHeight};});
 expect(edges.left).toBeGreaterThanOrEqual(0);expect(edges.right).toBeLessThanOrEqual(edges.width);expect(edges.top).toBeGreaterThanOrEqual(0);expect(edges.bottom).toBeLessThanOrEqual(edges.height);
}
for(const kind of ['react','vanilla'])for(const theme of ['light','dark','system']){
 test(`${kind} ${theme}: Input and Textarea preserve readonly selection, disabled exclusion and label semantics`,async({page})=>{
  await setup(page,kind,theme);const form=page.locator('#input-foundation');
  for(const row of entries){
   const control=page.getByRole('textbox',{name:row.id,exact:true});await expect(control).toHaveAttribute('id',row.id);await expect(control).toHaveAccessibleDescription(row.invalid?'帮助说明可以完整阅读。 请检查当前值。':'帮助说明可以完整阅读。');
   await expect(control).toHaveValue(row.value);expect(await control.evaluate(node=>({disabled:node.disabled,readOnly:node.readOnly}))).toEqual({disabled:row.state==='disabled',readOnly:row.state==='readonly'});
  }
  const initial=await form.evaluate(form=>Object.fromEntries(new FormData(form)));
  expect(initial).toEqual(Object.fromEntries(entries.filter(row=>row.state!=='disabled').map(row=>[row.id,row.value])));
  await page.locator('#before-inputs').click();
  for(const row of entries.filter(row=>row.state!=='disabled')){
   const control=page.locator(`#${row.id}`);await page.keyboard.press('Tab');await focusPaint(page,control);
   if(row.state==='readonly'){
    await page.keyboard.press('ControlOrMeta+A');expect(await control.evaluate(node=>[node.selectionStart,node.selectionEnd])).toEqual([0,row.value.length]);
    await page.keyboard.type('Cannot change readonly');await expect(control).toHaveValue(row.value);
   }
  }
  await page.keyboard.press('Tab');await expect(page.locator('#after-inputs')).toBeFocused();expect(await page.evaluate(()=>window.inputFoundationEvents)).toEqual([]);
  for(const row of entries){
   const control=page.locator(`#${row.id}`),label=page.locator(`label[for="${row.id}"]`);
   if(row.state==='disabled'){
    await label.scrollIntoViewIfNeeded();const b=await label.boundingBox();expect(b).not.toBeNull();const point={x:b.x+b.width/2,y:b.y+b.height/2};expect(await label.evaluate((node,p)=>node.contains(document.elementFromPoint(p.x,p.y)),point)).toBe(true);await page.mouse.click(point.x,point.y);await expect(control).not.toBeFocused();
   }else{await label.click();await expect(control).toBeFocused();}
  }
  for(const row of entries.filter(row=>row.state==='default')){const control=page.locator(`#${row.id}`);await control.fill(row.kind==='input'?'Edited 中文':'Edited line 1\nEdited line 2');}
  const final=await form.evaluate(form=>Object.fromEntries(new FormData(form)));
  expect(final).toEqual(Object.fromEntries(entries.filter(row=>row.state!=='disabled').map(row=>[row.id,row.state==='readonly'?row.value:row.kind==='input'?'Edited 中文':'Edited line 1\nEdited line 2'])));
  expect(await page.evaluate(()=>window.inputFoundationEvents)).toEqual(entries.filter(row=>row.state==='default').map(row=>row.id));
 });
 test(`${kind} ${theme}: Input and Textarea retain invalid boundaries and keyboard focus with independent tokens`,async({page},info)=>{
  await setup(page,kind,theme);
  async function paint(){
   for(const row of entries){const node=page.locator(`#${row.id}`);await expect(node).toHaveCSS('font-size',await token(page,'font-size-body-sm','font-size'));await expect(node).toHaveCSS('line-height',await token(page,'line-height-body-sm','line-height'));await expect(node).toHaveCSS('font-weight',await token(page,'font-weight-control','font-weight'));
    await expect(node).toHaveCSS('color',await token(page,row.state==='disabled'?'muted-foreground':'input-foreground'));await expect(node).toHaveCSS('background-color',await token(page,row.state==='disabled'?'muted':'input-background'));
    if(row.invalid)await expect(node).toHaveCSS('border-top-color',await token(page,'status-error-foreground'));
    const label=page.locator(`label[for="${row.id}"]`);await expect(label).toHaveCSS('font-size',await token(page,'font-size-body-xs','font-size'));await expect(label).toHaveCSS('font-weight',await token(page,'font-weight-control','font-weight'));
   }
  }
  await paint();const override=await page.addStyleTag({content:'@layer product-overrides {:root {--input-background:var(--layer-support);--input-border-color:var(--surface-line-strong);--font-weight-control:600;--status-error-foreground:var(--status-warning-foreground);}}'});await paint();await override.evaluate(node=>node.remove());
  for(const width of [1280,390])for(const scale of [1,2]){
   await page.setViewportSize({width,height:900});await page.evaluate(scale=>document.documentElement.style.fontSize=`${scale*100}%`,scale);await paint();
   await page.locator('#before-inputs').click();
   for(const row of entries.filter(row=>row.state!=='disabled')){await page.keyboard.press('Tab');const control=page.locator(`#${row.id}`);await focusPaint(page,control);if(row.invalid)await expect(control).toHaveCSS('border-top-color',await token(page,'status-error-foreground'));}
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await info.attach(`${kind}-${theme}-${width}-root-${scale*100}-invalid-focus`,{body:await page.locator('#textarea-readonly-invalid').locator('..').screenshot(),contentType:'image/png'});
  }
 });
}
