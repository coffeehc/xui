import {test,expect} from '@playwright/test';

// Real DOM/pseudo-element styles and interactions from an installed tarball.
// Screenshots are evidence to review, not CSS-string or baseline substitutes.
async function setup(page,mode){
 await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(mode=>localStorage.setItem('ui.theme.mode',mode),mode);
 await page.goto('/react/native-controls-audit.html');
 await expect(page.getByRole('heading',{name:'Native control audit'})).toBeVisible();
 await page.evaluate(mode=>window.nativeAudit.setMode(mode),mode);
 await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);
 await page.evaluate(()=>document.fonts.ready);
}
async function tokenColor(page,name){return page.evaluate(name=>{const p=document.createElement('span');p.style.color=`var(${name})`;document.body.append(p);const value=getComputedStyle(p).color;p.remove();return value;},name);}
for(const mode of ['light','dark','system'])test(`native controls ${mode}: theme, errors, browser states and screenshots`,async({page},info)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await setup(page,mode);
 const primary=await tokenColor(page,'--action-primary'),error=await tokenColor(page,'--status-error-foreground'),muted=await tokenColor(page,'--muted');
 for(const type of ['text','search','email','url','tel','password','number','date','datetime-local','month','time','week','file','range','color']){
  const input=page.getByLabel(`${type} default`,{exact:true});await expect(input).toBeVisible();
  const style=await input.evaluate(node=>{const s=getComputedStyle(node);return {height:node.getBoundingClientRect().height,border:s.borderTopWidth,font:s.fontSize};});
  expect(style.height).toBeGreaterThanOrEqual(36);expect(style.border).toBe('1px');expect(style.font).toBe('14px');
  if(type==='range'){await expect(input).toHaveCSS('margin-left','0px');await expect(input).toHaveCSS('margin-right','0px');}
  await expect(page.getByLabel(`${type} disabled`,{exact:true})).toBeDisabled();
  await expect(page.getByLabel(`${type} invalid`,{exact:true})).toHaveCSS('border-top-color',error);
 }
 for(const name of ['Checkbox invalid','Mixed invalid','Radio first invalid','Switch invalid'])await expect(page.getByLabel(name,{exact:true})).toHaveCSS('border-top-color',error);
 const disabledMixed=page.getByLabel('Mixed disabled',{exact:true});await expect(disabledMixed).toBeDisabled();await expect(disabledMixed).toHaveCSS('background-color',muted);
 const mixed=page.getByLabel('Mixed default',{exact:true});expect(await mixed.evaluate(node=>node.indeterminate)).toBe(true);
 expect(await mixed.evaluate(node=>{const s=getComputedStyle(node,'::after');return {height:s.height,border:s.borderWidth,transform:s.transform};})).toEqual({height:'2px',border:'0px',transform:'none'});
 await expect(mixed).toHaveCSS('background-color',primary);
 const file=page.getByLabel('file default',{exact:true});expect(await file.evaluate(node=>getComputedStyle(node,'::file-selector-button').backgroundColor)).toBe(muted);
 await file.setInputFiles({name:'audit.txt',mimeType:'text/plain',buffer:Buffer.from('synthetic audit')});expect(await file.evaluate(node=>node.files[0].name)).toBe('audit.txt');
 const input=page.getByLabel('text invalid',{exact:true});await input.focus();await expect(input).toHaveCSS('border-top-color',error);await expect(input).toHaveCSS('outline-style','solid');
 const progress=page.getByRole('progressbar',{name:'Determinate progress',exact:true});await expect(progress).toHaveAttribute('value','40');await expect(progress).toHaveCSS('appearance','none');await expect(progress).toHaveCSS('height','8px');
 const unknown=page.getByRole('progressbar',{name:'Indeterminate progress',exact:true});expect(await unknown.getAttribute('value')).toBeNull();await expect(unknown).toHaveCSS('animation-name','none');
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  const overflow=await page.evaluate(()=>({width:document.documentElement.scrollWidth,edges:[...document.querySelectorAll('main *')].filter(node=>node.getBoundingClientRect().right>innerWidth+1).map(node=>({tag:node.tagName,className:node.className,type:node.getAttribute('type'),right:node.getBoundingClientRect().right,margin:getComputedStyle(node).margin}))}));expect(overflow.width,JSON.stringify(overflow.edges)).toBeLessThanOrEqual(width+1);
  for(const state of ['default','disabled','readonly','invalid'])await info.attach(`${mode}-${width}-${state}.png`,{body:await page.locator(`[data-state="${state}"]`).screenshot(),contentType:'image/png'});
  await info.attach(`${mode}-${width}-actions-progress.png`,{body:await page.locator('section').last().screenshot(),contentType:'image/png'});
 }
 expect(errors).toEqual([]);
});

test('native controls: keyboard, readonly, disabled actions, FormData, system and forced colors',async({page},info)=>{
 await setup(page,'system');
 const text=page.getByLabel('text default',{exact:true});await text.fill('Changed');expect(await page.locator('#audit-form').evaluate(form=>new FormData(form).get('text-default'))).toBe('Changed');
 const readonly=page.getByLabel('text readonly',{exact:true});await readonly.focus();await page.keyboard.type('ignored');await expect(readonly).toHaveValue('Sample');
 for(const name of ['Checkbox readonly','Switch readonly','Native readonly']){const node=page.getByLabel(name,{exact:true});await node.focus();await page.keyboard.press('Space');await expect(node).toBeChecked();await node.click();await expect(node).toBeChecked();}
 const mixed=page.getByLabel('Mixed default',{exact:true});await mixed.focus();await page.keyboard.press('Space');expect(await mixed.evaluate(node=>node.indeterminate)).toBe(false);await expect(mixed).toBeChecked();
 const range=page.getByLabel('range default',{exact:true});await range.focus();await page.keyboard.press('ArrowRight');await expect(range).toHaveValue('51');
 const number=page.getByLabel('number default',{exact:true});await number.focus();await page.keyboard.press('ArrowUp');await expect(number).toHaveValue('5');
 const radio=page.getByLabel('Radio first default',{exact:true});await radio.focus();await page.keyboard.press('ArrowRight');await expect(page.getByLabel('Radio second default',{exact:true})).toBeChecked();
 for(const name of ['link disabled','Disabled addon']){const node=page.getByRole('button',{name,exact:true});await expect(node).toBeDisabled();const before=await node.evaluate(node=>getComputedStyle(node).backgroundColor);await node.hover({force:true});await expect(node).toHaveCSS('background-color',before);}
 await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
 await page.emulateMedia({forcedColors:'active'});await expect(page.getByLabel('Checkbox default',{exact:true})).toHaveCSS('appearance','auto');await expect(range).toHaveCSS('appearance','auto');await expect(page.getByRole('progressbar',{name:'Determinate progress',exact:true})).toHaveCSS('appearance','auto');
 await info.attach('forced-colors-default.png',{body:await page.locator('[data-state="default"]').screenshot(),contentType:'image/png'});
 await info.attach('forced-colors-actions-progress.png',{body:await page.locator('section').last().screenshot(),contentType:'image/png'});
});
