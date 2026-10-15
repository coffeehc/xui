import {test,expect} from '@playwright/test';

const settle=page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
async function setup(page,kind,theme){
 await page.setViewportSize({width:1280,height:844});await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);
 await page.goto(`/${kind}/button-state-contract.html`);await expect(page.getByRole('heading',{name:'Button state contracts',exact:true})).toBeVisible();await settle(page);await expect(page.locator('html')).toHaveAttribute('data-theme-effective',theme==='system'?'dark':theme);
}
async function measure(button){return button.evaluate(node=>{
 const style=getComputedStyle(node),probe=document.createElement('span');probe.style.position='absolute';probe.style.visibility='hidden';document.body.append(probe);
 const resolve=(name,property)=>{probe.style[property]=`var(--${name})`;return getComputedStyle(probe)[property];};
 const luminance=color=>{const values=color.match(/[\d.]+/g).slice(0,3).map(Number).map(channel=>{const c=channel/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});return .2126*values[0]+.7152*values[1]+.0722*values[2];};
 try{const background=style.backgroundColor,foreground=style.color,l=luminance(background),f=luminance(foreground);return {background,foreground,contrast:(Math.max(l,f)+.05)/(Math.min(l,f)+.05),pressed:node.getAttribute('data-pressed'),tokens:{background:resolve('button-background','backgroundColor'),hover:resolve('button-hover-background','backgroundColor'),pressed:resolve('button-pressed-background','backgroundColor'),foreground:resolve('button-foreground','color')}};}finally{probe.remove();}
});}

for(const kind of ['react'])for(const theme of ['light','dark','system'])test(`${kind} ${theme}: primary Button D/H/P follow product primary overrides with readable contrast and keyboard activation`,async({page},info)=>{
 await setup(page,kind,theme);const button=page.getByTestId('primary-enabled');await page.mouse.move(0,0);await settle(page);
 const baseline={default:await measure(button)};await button.hover();await settle(page);baseline.hover=await measure(button);const box=await button.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await settle(page);baseline.pressed=await measure(button);await page.mouse.up();await page.mouse.move(0,0);await settle(page);
 await page.addStyleTag({content:'@layer product-overrides { :root { --action-primary:#1d4ed8; --action-primary-foreground:#ffffff; } }'});await settle(page);
 const states={default:await measure(button)};await button.hover();await settle(page);states.hover=await measure(button);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await settle(page);states.pressed=await measure(button);await page.mouse.up();await settle(page);
 for(const [state,actual] of Object.entries(states)){
  expect(actual.background,`${state} resolves its public state token`).toBe(actual.tokens[state==='default'?'background':state]);expect(actual.foreground,`${state} retains paired primary foreground`).toBe(actual.tokens.foreground);expect(actual.contrast,`${kind}/${theme}/${state} brand contrast`).toBeGreaterThanOrEqual(4.5);
  expect(actual.background,`${state} changes when the product changes action-primary`).not.toBe(baseline[state].background);
 }
 expect(states.default.background).toBe('rgb(29, 78, 216)');expect(states.default.foreground).toBe('rgb(255, 255, 255)');
 await button.focus();const before=await page.evaluate(()=>window.buttonStateClicks['primary-enabled']??0);await page.keyboard.press('Space');await expect(button).toBeFocused();await expect.poll(()=>page.evaluate(()=>window.buttonStateClicks['primary-enabled']??0)).toBe(before+1);await expect(button).toHaveAttribute('data-pressed','false');
 const result={theme,baseline,states,keyboard:{clicksBefore:before,clicksAfter:await page.evaluate(()=>window.buttonStateClicks['primary-enabled']??0)}};await info.attach(`${kind}-${theme}-brand-button-states.json`,{body:JSON.stringify(result,null,2),contentType:'application/json'});await info.attach(`${kind}-${theme}-brand-button-states.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});
