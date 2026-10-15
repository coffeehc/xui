import {test,expect} from '@playwright/test';

const kinds=['react'],themes=['light','dark','system'];
async function setup(page,kind,theme){
 await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);
 await page.goto(`/${kind}/choice-state-contract.html`);
 await expect(page.getByRole('heading',{name:'Choice state contract'})).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('data-theme-effective',theme==='system'?'dark':theme);
 await expect(page.locator('input')).toHaveCount(48);
}
async function tokens(page){return page.evaluate(()=>{
 const probe=document.createElement('span');document.body.append(probe);
 const result={};
 for(const name of ['status-error-foreground','muted-foreground','muted','action-primary','action-primary-foreground','input-background','input-border-color','interaction-focus']){
  probe.style.color=`var(--${name})`;result[name]=getComputedStyle(probe).color;
 }
 probe.style.display='block';probe.style.width='var(--switch-travel)';result.travel=parseFloat(getComputedStyle(probe).width);
 probe.style.width='var(--focus-width)';result.focusWidth=getComputedStyle(probe).width;
 probe.style.width='var(--focus-offset)';result.focusOffset=getComputedStyle(probe).width;
 probe.remove();return result;
});}
async function states(page){return page.locator('input').evaluateAll(nodes=>nodes.map(node=>{
 const style=getComputedStyle(node),after=getComputedStyle(node,'::after'),before=getComputedStyle(node,'::before');
 const matrix=after.transform==='none'?new DOMMatrixReadOnly():new DOMMatrixReadOnly(after.transform);
 const thumb=before.transform==='none'?new DOMMatrixReadOnly():new DOMMatrixReadOnly(before.transform);
 return {id:node.id,kind:node.dataset.kind,visual:node.dataset.visual,availability:node.dataset.availability,
  checked:node.checked,mixed:node.indeterminate,disabled:node.disabled,readonly:node.readOnly,invalid:node.getAttribute('aria-invalid')==='true',
  described:node.getAttribute('aria-describedby'),error:node.getAttribute('aria-describedby')?document.getElementById(node.getAttribute('aria-describedby'))?.textContent:null,
  border:style.borderTopColor,background:style.backgroundColor,color:style.color,cursor:style.cursor,focused:node.matches(':focus-visible'),
  mark:{transform:after.transform,scale:Math.hypot(matrix.a,matrix.b),height:after.height,border:after.borderWidth,background:after.backgroundColor},travel:thumb.e};
}));}
function assertPaint(rows,expected){
 for(const row of rows){
  const selected=row.visual!=='unchecked',mixed=row.kind==='checkbox'&&row.visual.startsWith('mixed');
  expect(row.checked,row.id).toBe(row.visual==='checked'||row.visual==='mixed-checked');
  expect(row.mixed,row.id).toBe(mixed);
  expect(row.disabled,row.id).toBe(row.availability==='disabled');
  expect(row.readonly,row.id).toBe(row.availability==='readonly');
  expect(row.border,row.id).toBe(expected[row.invalid?'status-error-foreground':row.disabled?'muted-foreground':selected?'action-primary':'input-border-color']);
  expect(row.background,row.id).toBe(expected[row.disabled?'muted':selected?'action-primary':'input-background']);
  expect(row.color,row.id).toBe(expected[row.disabled?'muted-foreground':'action-primary-foreground']);
  if(row.invalid){expect(row.described,row.id).toBe(`${row.id}-error`);expect(row.error,row.id).toBe('Review this choice.');}
  if(row.disabled){expect(row.cursor,row.id).toBe('not-allowed');expect(row.focused,row.id).toBe(false);}
  if(row.kind==='switch')expect(row.travel,row.id).toBeCloseTo(row.checked?expected.travel:0,1);
  else if(mixed){expect(row.mark.transform,row.id).toBe('none');expect(row.mark.height,row.id).toBe('2px');expect(row.mark.border,row.id).toBe('0px');expect(row.mark.background,row.id).toBe(row.color);}
  else expect(row.mark.scale,row.id).toBeCloseTo(row.checked?1:0,4);
 }
}
for(const kind of kinds)for(const theme of themes){
 test(`${kind} ${theme}: choice errors survive disabled and independent token overrides`,async({page},info)=>{
  await setup(page,kind,theme);assertPaint(await states(page),await tokens(page));
  await info.attach('choice-default',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  const color=theme==='light'?'#9f1239':'#fda4af';
  const override=await page.addStyleTag({content:`@layer product-overrides { :root { --status-error-foreground: ${color}; } }`});
  assertPaint(await states(page),await tokens(page));
  await info.attach('choice-error-token-override',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  await override.evaluate(node=>node.remove());assertPaint(await states(page),await tokens(page));
 });
 test(`${kind} ${theme}: disabled is inert while readonly stays reachable and immutable`,async({page})=>{
  test.setTimeout(60000);
  await setup(page,kind,theme);const initial=await states(page),expected=await tokens(page);
  const immutable=rows=>rows.filter(row=>row.availability!=='enabled').map(row=>({id:row.id,checked:row.checked,mixed:row.mixed}));
  for(const row of initial.filter(row=>row.disabled)){
   const control=page.locator(`#${row.id}`);await control.scrollIntoViewIfNeeded();await control.hover();
   const box=await control.boundingBox();
   expect(await control.evaluate(node=>{const r=node.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===node;}),row.id).toBe(true);
   await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
   const label=page.locator('label').filter({has:control});const labelBox=await label.boundingBox();expect(labelBox).not.toBeNull();const point={x:labelBox.x+labelBox.width/2,y:labelBox.y+labelBox.height/2};expect(await label.evaluate((node,point)=>node.contains(document.elementFromPoint(point.x,point.y)),point)).toBe(true);await page.mouse.click(point.x,point.y);
   await expect(control).not.toBeFocused();
  }
  expect(immutable(await states(page))).toEqual(immutable(initial));expect(await page.evaluate(()=>window.choiceStateEvents)).toEqual([]);assertPaint(await states(page),expected);
  await page.getByRole('button',{name:'Before choices',exact:true}).click();
  for(const row of initial.filter(row=>!row.disabled)){
   await page.keyboard.press('Tab');const control=page.locator(`#${row.id}`);await expect(control).toBeFocused();
   expect(await control.evaluate(node=>node.matches(':focus-visible')),row.id).toBe(true);
   await expect(control).toHaveCSS('outline-style','solid');await expect(control).toHaveCSS('outline-width',expected.focusWidth);await expect(control).toHaveCSS('outline-offset',expected.focusOffset);await expect(control).toHaveCSS('outline-color',expected['interaction-focus']);
   if(row.invalid)await expect(control).toHaveCSS('border-top-color',expected['status-error-foreground']);
   if(row.readonly){
    await expect(control).toHaveAttribute('aria-readonly','true');await page.keyboard.press('Space');
    if(row.kind==='radio'){await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');}
    await control.click();await page.locator('label').filter({has:control}).click();
    expect(await control.evaluate(node=>({checked:node.checked,mixed:node.indeterminate})),row.id).toEqual({checked:row.checked,mixed:row.mixed});
   }
  }
  await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'After choices',exact:true})).toBeFocused();
  expect(immutable(await states(page))).toEqual(immutable(initial));expect(await page.evaluate(()=>window.choiceStateEvents)).toEqual([]);
  // An error does not disable an editable choice. Reach each by ordinary Tab.
  await page.getByRole('button',{name:'Before choices',exact:true}).click();
  const changed=[];
  for(const row of initial.filter(row=>!row.disabled)){
   await page.keyboard.press('Tab');const control=page.locator(`#${row.id}`);await expect(control).toBeFocused();
   if(row.availability==='enabled'&&row.visual==='unchecked'&&row.invalid){
    await page.keyboard.press('Space');await expect(control).toBeChecked();await expect(control).toHaveCSS('border-top-color',expected['status-error-foreground']);changed.push(row.id);
   }
  }
  expect(changed).toHaveLength(3);expect(await page.evaluate(()=>window.choiceStateEvents)).toEqual(changed);
 });
}
