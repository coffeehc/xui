import {test,expect} from '@playwright/test';
const variants=['primary','secondary','outline','ghost','destructive','link'];
const settle=page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
async function setup(page,kind,theme,width){
 await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);
 await page.goto(`/${kind}/button-state-contract.html`);await expect(page.getByRole('heading',{name:'Button state contracts',exact:true})).toBeVisible();await settle(page);
 await expect(page.locator('html')).toHaveAttribute('data-theme-effective',theme==='system'?'dark':theme);
}
async function paint(control){return control.evaluate(node=>{
 const s=getComputedStyle(node),root=getComputedStyle(document.documentElement),probe=document.createElement('span');probe.style.position='absolute';probe.style.visibility='hidden';document.body.append(probe);
 const resolve=(token,property)=>{probe.style[property]=`var(${token})`;return getComputedStyle(probe)[property];};
 try{return {background:s.backgroundColor,color:s.color,cursor:s.cursor,transform:s.transform,forcedColorAdjust:s.forcedColorAdjust,disabled:node.matches(':disabled'),ariaDisabled:node.getAttribute('aria-disabled'),busy:node.getAttribute('aria-busy'),pressed:node.getAttribute('aria-pressed'),tokens:{background:{value:root.getPropertyValue('--button-disabled-background').trim(),resolved:resolve('--button-disabled-background','backgroundColor')},foreground:{value:root.getPropertyValue('--button-disabled-foreground').trim(),resolved:resolve('--button-disabled-foreground','color')}}};}finally{probe.remove();}
});}
function disabledPaint(actual,label){
 expect.soft(actual.background,`${label} disabled background`).toBe(actual.tokens.background.resolved);
 expect.soft(actual.color,`${label} disabled foreground`).toBe(actual.tokens.foreground.resolved);
 expect.soft(actual.cursor).toBe('not-allowed');expect.soft(actual.transform).toBe('none');
}
async function attach(page,info,name,values){await info.attach(`${name}.json`,{body:JSON.stringify(values,null,2),contentType:'application/json'});await info.attach(`${name}.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});}
for(const kind of ['react','vanilla'])for(const theme of ['light','dark','system'])for(const width of [1280,390])test(`${kind} ${theme} ${width}: every Button variant honors disabled and busy combinations`,async({page},info)=>{
 await setup(page,kind,theme,width);const measured=[];
 for(const variant of variants){
  for(const state of ['enabled','busy']){const id=`${variant}-${state}`,button=page.getByTestId(id);await expect(button).toBeEnabled();await button.click();expect(await page.evaluate(id=>window.buttonStateClicks[id],id)).toBe(1);}
  for(const state of ['disabled','disabled-busy']){
   const id=`${variant}-${state}`,button=page.getByTestId(id);await expect(button).toBeDisabled();await button.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await settle(page);
   const normal=await paint(button);disabledPaint(normal,id);await button.hover();await settle(page);const hovered=await paint(button);disabledPaint(hovered,`${id}:hover`);
   const box=await button.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();const pressed=await paint(button);await page.mouse.up();disabledPaint(pressed,`${id}:active`);
   expect(await page.evaluate(id=>window.buttonStateClicks[id]??0,id)).toBe(0);expect(normal.busy).toBe(state==='disabled-busy'?'true':null);measured.push({id,normal,hovered,pressed});
  }
 }
 const toggle=page.getByTestId('disabled-selected-toggle');await expect(toggle).toBeDisabled();await expect(toggle).toHaveAttribute('aria-pressed','true');const selected=await paint(toggle);disabledPaint(selected,'disabled selected toggle');measured.push({id:'disabled-selected-toggle',selected});
 if(kind==='react'){const link=page.getByTestId('disabled-link-element');await expect(link).toHaveAttribute('aria-disabled','true');disabledPaint(await paint(link),'disabled anchor');}
 await attach(page,info,`${kind}-${theme}-${width}-disabled-states`,measured);
 await page.addStyleTag({content:'@layer product-overrides { :root { --button-disabled-background:var(--status-warning-soft); --button-disabled-foreground:var(--status-warning-foreground); } }'});await settle(page);
 const overrides=[];for(const variant of variants)for(const state of ['disabled','disabled-busy']){const id=`${variant}-${state}`,actual=await paint(page.getByTestId(id));disabledPaint(actual,`${id} token override`);overrides.push({id,actual});}
 await attach(page,info,`${kind}-${theme}-${width}-disabled-token-overrides`,overrides);
 // Ordinary Tab skips native disabled buttons. Busy alone keeps its keyboard stop.
 const enabled=page.getByTestId('primary-enabled'),busy=page.getByTestId('primary-busy');await enabled.focus();await page.keyboard.press('Tab');await expect(busy).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByTestId('secondary-enabled')).toBeFocused();
});
for(const kind of ['react','vanilla'])for(const scheme of ['light','dark'])test(`${kind} ${scheme}: disabled Button variants preserve platform forced-color handling`,async({page},info)=>{
 await setup(page,kind,scheme,390);await page.emulateMedia({forcedColors:'active',colorScheme:scheme,reducedMotion:'reduce'});await settle(page);const measured=[];
 for(const variant of variants){const button=page.getByTestId(`${variant}-disabled-busy`);await expect(button).toBeDisabled();const actual=await paint(button);expect(actual.forcedColorAdjust).toBe('auto');expect(actual.busy).toBe('true');measured.push({variant,actual});}
 const enabled=page.getByTestId('primary-enabled');await enabled.focus();await page.keyboard.press('Tab');await expect(page.getByTestId('primary-busy')).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByTestId('secondary-enabled')).toBeFocused();
 await attach(page,info,`${kind}-${scheme}-forced-colors`,measured);
});
