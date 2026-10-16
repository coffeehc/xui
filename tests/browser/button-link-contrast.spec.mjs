import {test,expect} from '@playwright/test';
const settle=page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
// Resolve color spaces and transparent ancestor surfaces in the browser, rather
// than assuming that the visible background equals the control's own CSS value.
async function paint(control){return control.evaluate(node=>{
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d',{willReadFrequently:true});
 const rgba=value=>{context.clearRect(0,0,1,1);context.fillStyle=value;context.fillRect(0,0,1,1);return Array.from(context.getImageData(0,0,1,1).data);};
 const over=(top,bottom)=>{const a=top[3]/255;return top.slice(0,3).map((value,index)=>Math.round(value*a+bottom[index]*(1-a))).concat(255);};
 const ancestors=[];for(let current=node;current;current=current.parentElement)ancestors.unshift(current);
 let background=[255,255,255,255];for(const current of ancestors)background=over(rgba(getComputedStyle(current).backgroundColor),background);
 const style=getComputedStyle(node),foreground=over(rgba(style.color),background),luminance=color=>color.slice(0,3).map(channel=>{const c=channel/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0),f=luminance(foreground),b=luminance(background);
 return {foreground,background,contrast:(Math.max(f,b)+.05)/(Math.min(f,b)+.05),color:style.color,cssBackground:style.backgroundColor,iconColor:node.querySelector('svg')?getComputedStyle(node.querySelector('svg')).stroke:null,fontSize:style.fontSize,outline:style.outlineStyle,outlineWidth:style.outlineWidth};
});}
for(const [mode,scheme] of [['light','light'],['dark','dark'],['system','light'],['system','dark']])for(const width of [1280,320])test(`link ${mode}-${scheme} ${width}: default hover pressed focus remain readable and actions stay independent`,async({page,browserName},info)=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:scheme,reducedMotion:'reduce'});await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);
 await page.goto('/react/button-state-contract.html');await expect(page.getByRole('heading',{name:'Button state contracts',exact:true})).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('data-theme-effective',scheme);if(width===320)await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
 const button=page.getByTestId('link-enabled');await button.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await settle(page);const states={idle:await paint(button)};
 await button.hover();await settle(page);states.hover=await paint(button);await page.mouse.down();await settle(page);states.pointerPressed=await paint(button);await page.mouse.up();expect(await page.evaluate(()=>window.buttonStateClicks['link-enabled'])).toBe(1);
 await page.mouse.move(0,0);await button.focus();await page.keyboard.press(browserName==='webkit'?'Alt+Tab':'Tab');await page.keyboard.press(browserName==='webkit'?'Alt+Shift+Tab':'Shift+Tab');await expect(button).toBeFocused();await settle(page);states.focus=await paint(button);expect(states.focus.outline).not.toBe('none');expect(parseFloat(states.focus.outlineWidth)).toBeGreaterThan(0);
 await page.keyboard.down('Space');await expect(button).toHaveAttribute('data-pressed','true');await settle(page);states.keyboardPressed=await paint(button);await page.keyboard.up('Space');await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.buttonStateClicks['link-enabled'])).toBe(3);
 // Busy alone remains actionable. Native and anchor disabled variants do not act.
 await page.getByTestId('link-busy').click();expect(await page.evaluate(()=>window.buttonStateClicks['link-busy'])).toBe(1);
 for(const id of ['link-disabled','disabled-link-element']){const disabled=page.getByTestId(id);await disabled.hover();const box=await disabled.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);expect(await page.evaluate(id=>window.buttonStateClicks[id]??0,id)).toBe(0);}
 const anchor=page.getByTestId('enabled-link-element');await expect(anchor).toHaveRole('link');
  await anchor.hover();await settle(page);states.anchorHover=await paint(anchor);await anchor.focus();await page.mouse.move(0,0);await page.keyboard.press('Space');expect(await page.evaluate(()=>window.buttonStateClicks['enabled-link-element']??0)).toBe(0);await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.buttonStateClicks['enabled-link-element'])).toBe(1);await expect(page).toHaveURL(/#link-destination$/);
 await button.hover();await settle(page);await info.attach('link-states.json',{body:JSON.stringify({mode,scheme,width,states},null,2),contentType:'application/json'});await info.attach('link-hover.png',{body:await button.locator('xpath=..').screenshot(),contentType:'image/png'});
 for(const [state,actual] of Object.entries(states)){expect(actual.contrast,`${mode}/${scheme}/${width}/${state}: normal text >=4.5`).toBeGreaterThanOrEqual(4.5);if(actual.iconColor)expect(actual.iconColor,`${state}: icon inherits currentColor`).toBe(actual.color);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
