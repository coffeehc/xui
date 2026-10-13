import {test,expect} from '@playwright/test';

// Standalone installed-package fixtures: these checks complement the existing
// native-controls smoke test without changing display/foundation examples.
const tones=['info','success','warning','error'];
async function setup(page,kind,theme,reducedMotion='reduce'){
 await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion});
 await page.addInitScript(theme=>localStorage.setItem('ui.theme.mode',theme),theme);
 await page.goto(`/${kind}/feedback-foundation-contract.html`);
 await expect(page.getByRole('heading',{name:'Feedback foundation contract',exact:true})).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('data-theme-effective',theme==='system'?'dark':theme);
 await page.evaluate(()=>document.fonts.ready);
}
async function color(page,token){return page.evaluate(token=>{const probe=document.createElement('span');probe.style.color=`var(${token})`;document.body.append(probe);const result=getComputedStyle(probe).color;probe.remove();return result;},token);}
async function alertColors(page,node,tone){
 for(const [property,role] of [['color','foreground'],['background-color','soft'],['border-top-color','line']])await expect(node).toHaveCSS(property,await color(page,`--status-${tone}-${role}`));
}
async function unclipped(node){return node.evaluate(element=>{
 const box=element.getBoundingClientRect(),style=getComputedStyle(element),range=document.createRange();range.selectNodeContents(element);
 const lines=[...range.getClientRects()];return {overflowX:element.scrollWidth-element.clientWidth,overflowY:element.scrollHeight-element.clientHeight,hidden:style.overflowY==='hidden'||style.overflowY==='clip',lines:lines.length,inside:lines.every(r=>r.left>=box.left-.5&&r.right<=box.right+.5&&r.top>=box.top-.5&&r.bottom<=box.bottom+.5)};
});}
// Sample the actual native progress drawing. Chromium's progress pseudo-element
// computed-style API can report host styles, so it is not a fill-paint oracle.
async function paintedProgress(page,node,expected,info,name){
 const png=await node.screenshot({animations:'disabled'});
 const result=await page.evaluate(async({encoded,expected})=>{
  const image=new Image();image.src=`data:image/png;base64,${encoded}`;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d');context.drawImage(image,0,0);
  const samples=expected.map(([fraction])=>Array.from(context.getImageData(Math.floor(image.width*fraction),Math.floor(image.height/2),1,1).data));
  const colors=expected.map(([,color])=>{context.clearRect(0,0,1,1);context.fillStyle=color;context.fillRect(0,0,1,1);return Array.from(context.getImageData(0,0,1,1).data);});
  return {width:image.width,height:image.height,samples,colors};
 },{encoded:png.toString('base64'),expected});
 await info.attach(`${name}.png`,{body:png,contentType:'image/png'});
 await info.attach(`${name}-pixels.json`,{body:JSON.stringify(result,null,2),contentType:'application/json'});
 for(const [index,pixel] of result.samples.entries())for(let channel=0;channel<4;channel++)expect(Math.abs(pixel[channel]-result.colors[index][channel]),`${name} sample ${index} channel ${channel}`).toBeLessThanOrEqual(2);
}

for(const kind of ['react','vanilla'])for(const theme of ['light','dark','system']){
 test(`${kind} ${theme}: Alert tones retain semantics, independent tokens and complete long text`,async({page},info)=>{
  await setup(page,kind,theme);
  const defaultAlert=page.getByTestId('alert-default');await expect(defaultAlert).toHaveAttribute('role','status');await alertColors(page,defaultAlert,'info');
  for(const tone of tones){
   const node=page.getByTestId(`alert-${tone}`);await expect(node).toHaveAttribute('role',tone==='error'?'alert':'status');await expect(node).toHaveText(`${tone}: 可理解的状态文字。`);
   await alertColors(page,node,tone);await expect(node).toHaveCSS('padding','12px');await expect(node).toHaveCSS('border-top-width','1px');await expect(node).toHaveCSS('border-radius','8px');
   expect(await node.evaluate(element=>element.tabIndex)).toBe(-1);await node.hover();await alertColors(page,node,tone);
  }
  await info.attach('alert-default-tones.png',{body:await page.locator('#alerts').screenshot(),contentType:'image/png'});
  const overrides=tones.map((tone,index)=>`--status-${tone}-foreground:rgb(${20+index*10} ${40+index*10} ${60+index*10});--status-${tone}-soft:rgb(${220-index*10} ${230-index*10} ${240-index*10});--status-${tone}-line:rgb(${80+index*10} ${100+index*10} ${120+index*10});`).join('');
  await page.addStyleTag({content:`@layer product-overrides {:root {${overrides} --space-content-gap:var(--space-section-gap);--line-width-surface:var(--line-width-emphasis);--radius-lg:var(--radius-xl);}}`});
  for(const tone of tones){const node=page.getByTestId(`alert-${tone}`);await alertColors(page,node,tone);await expect(node).toHaveCSS('padding','16px');await expect(node).toHaveCSS('border-top-width','2px');await expect(node).toHaveCSS('border-radius','11.2px');}
  await alertColors(page,defaultAlert,'info');
  if(theme==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');for(const tone of tones)await alertColors(page,page.getByTestId(`alert-${tone}`),tone);}
  const long=page.getByTestId('alert-long');await expect(long).toContainText('END-OF-MESSAGE');
  for(const width of [1280,390])for(const scale of [1,2]){
   await page.setViewportSize({width,height:844});await page.evaluate(scale=>document.documentElement.style.fontSize=`${scale*100}%`,scale);
   const measured=await unclipped(long);expect(measured.overflowX).toBeLessThanOrEqual(1);expect(measured.overflowY).toBeLessThanOrEqual(1);expect(measured.hidden).toBe(false);expect(measured.inside).toBe(true);expect(measured.lines).toBeGreaterThan(1);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
   await info.attach(`alert-long-${width}-root-${scale*100}.json`,{body:JSON.stringify(measured),contentType:'application/json'});
  }
  await info.attach('alert-long-narrow-root-200.png',{body:await long.screenshot(),contentType:'image/png'});
 });

 test(`${kind} ${theme}: Skeleton and Spinner remain decorative when motion is reduced or restored`,async({page},info)=>{
  await setup(page,kind,theme,'no-preference');
  const spinner=page.getByTestId('spinner'),skeleton=page.getByTestId('skeleton'),unknown=page.getByTestId('progress-indeterminate'),status=page.locator('#loading-status');
  await expect(status).toHaveAttribute('role','status');await expect(status).toHaveAttribute('aria-busy','true');await expect(status).toHaveText('正在读取示例内容。');await expect(status.getByRole('status')).toHaveCount(0);
  for(const node of [spinner,skeleton]){await expect(node).toHaveAttribute('aria-hidden','true');expect(await node.getAttribute('role')).toBeNull();expect(await node.evaluate(element=>element.tabIndex)).toBe(-1);}
  await expect(spinner).toHaveCSS('animation-name','xui-spin');await expect(spinner).toHaveCSS('animation-duration','1.2s');await expect(skeleton).toHaveCSS('animation-name','xui-pulse');await expect(skeleton).toHaveCSS('animation-duration','1.5s');
  for(const node of [spinner,skeleton,unknown])await expect(node).toHaveCSS('animation-iteration-count','infinite');
  await expect(spinner).toHaveCSS('width','16px');await expect(spinner).toHaveCSS('height','16px');await expect(spinner).toHaveCSS('border-top-width','2px');await expect(spinner).toHaveCSS('border-top-color',await color(page,'--surface-line-strong'));await expect(spinner).toHaveCSS('border-inline-end-color',await color(page,'--action-primary'));
  await expect(skeleton).toHaveCSS('min-height','36px');await expect(skeleton).toHaveCSS('border-radius','6.4px');await expect(skeleton).toHaveCSS('background-color',await color(page,'--muted'));
  await page.addStyleTag({content:'@layer product-overrides {:root {--motion-duration-pulse:2.4s;--motion-duration-spin:1.8s;--control-icon-size:var(--illustration-icon-size);--control-height:var(--control-height-lg);--muted:var(--layer-support);--surface-line-strong:var(--status-warning-foreground);--action-primary:var(--status-success-foreground);}}'});
  await expect(spinner).toHaveCSS('animation-duration','1.8s');await expect(skeleton).toHaveCSS('animation-duration','2.4s');await expect(spinner).toHaveCSS('width','24px');await expect(spinner).toHaveCSS('height','24px');await expect(skeleton).toHaveCSS('min-height','40px');await expect(skeleton).toHaveCSS('background-color',await color(page,'--muted'));await expect(spinner).toHaveCSS('border-top-color',await color(page,'--surface-line-strong'));await expect(spinner).toHaveCSS('border-inline-end-color',await color(page,'--action-primary'));
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const node of [spinner,skeleton,unknown]){await expect(node).toHaveCSS('animation-name','none');await expect(node).toHaveCSS('opacity','1');await expect(node).toHaveCSS('transform','none');expect(await node.evaluate(element=>element.getAnimations().length)).toBe(0);}
  await expect(spinner).toHaveCSS('width','24px');await expect(skeleton).toHaveCSS('min-height','40px');await expect(status).toHaveText('正在读取示例内容。');
  await page.locator('#before-feedback').focus();await page.keyboard.press('Tab');await expect(page.locator('#after-feedback')).toBeFocused();
  await info.attach('decorative-reduced-motion.png',{body:await page.locator('#loading-feedback').screenshot(),contentType:'image/png'});
  await page.emulateMedia({reducedMotion:'no-preference'});await expect(spinner).toHaveCSS('animation-name','xui-spin');await expect(spinner).toHaveCSS('animation-duration','1.8s');await expect(skeleton).toHaveCSS('animation-name','xui-pulse');await expect(unknown).toHaveCSS('animation-name','xui-pulse');
 });

 test(`${kind} ${theme}: Progress preserves measured fractions, indeterminate facts and token-driven paint`,async({page},info)=>{
  await setup(page,kind,theme);
  const facts=[['zero',0,100,0],['determinate',40,100,.4],['fractional',3,8,.375],['complete',100,100,1],['indeterminate',null,1,-1]];
  for(const [id,value,max,position] of facts){
   const node=page.getByTestId(`progress-${id}`);await expect(page.getByRole('progressbar',{name:`${id==='zero'?'Zero':id==='determinate'?'Determinate':id==='fractional'?'Fractional':id==='complete'?'Complete':'Indeterminate'} progress`,exact:true})).toHaveCount(1);
   expect(await node.evaluate(element=>({tag:element.tagName,value:element.getAttribute('value'),max:element.max,position:element.position,indeterminate:element.matches(':indeterminate')}))).toEqual({tag:'PROGRESS',value:value===null?null:String(value),max,position,indeterminate:value===null});
   expect(await node.getAttribute('aria-valuenow')).toBeNull();await expect(node).toHaveCSS('appearance','none');await expect(node).toHaveCSS('height','8px');await expect(node).toHaveCSS('animation-name','none');
  }
  const primary=await color(page,'--action-primary'),track=await color(page,'--muted'),pending=await color(page,'--interaction-selected');
  for(const [id,expected] of [['zero',[[.2,track],[.8,track]]],['determinate',[[.2,primary],[.6,track]]],['fractional',[[.2,primary],[.6,track]]],['complete',[[.2,primary],[.8,primary]]],['indeterminate',[[.2,pending],[.8,pending]]]])await paintedProgress(page,page.getByTestId(`progress-${id}`),expected,info,`progress-${id}-default`);
  const changing=page.getByTestId('progress-changing');await changing.evaluate(element=>window.savedFeedbackProgress=element);
  for(const [value,max,position] of [[null,100,-1],[0,100,0],[3,8,.375],[8,8,1],[null,8,-1]]){
   await page.evaluate(({value,max})=>window.setFeedbackProgress(value,max),{value,max});
   await expect.poll(()=>changing.evaluate(element=>element.position)).toBe(position);expect(await changing.evaluate(element=>element===window.savedFeedbackProgress)).toBe(true);
   expect(await changing.getAttribute('value')).toBe(value===null?null:String(value));expect(await changing.getAttribute('aria-valuenow')).toBeNull();
  }
  await page.addStyleTag({content:'@layer product-overrides {:root {--action-primary:rgb(31 67 103);--muted:rgb(221 229 237);--interaction-selected:rgb(165 189 213);--space-control-gap:var(--space-content-gap);}}'});
  await page.setViewportSize({width:390,height:844});
  for(const id of ['determinate','indeterminate']){const node=page.getByTestId(`progress-${id}`);await expect(node).toHaveCSS('height','12px');await expect(node).toHaveCSS('color',await color(page,'--action-primary'));await expect(node).toHaveCSS('accent-color',await color(page,'--action-primary'));}
  await paintedProgress(page,page.getByTestId('progress-determinate'),[[.2,await color(page,'--action-primary')],[.6,await color(page,'--muted')]],info,'progress-determinate-overrides');
  await paintedProgress(page,page.getByTestId('progress-indeterminate'),[[.2,await color(page,'--interaction-selected')],[.8,await color(page,'--interaction-selected')]],info,'progress-indeterminate-overrides');
  await page.emulateMedia({forcedColors:'active'});for(const id of ['zero','determinate','indeterminate'])await expect(page.getByTestId(`progress-${id}`)).toHaveCSS('appearance','auto');
  await expect.poll(()=>page.getByTestId('progress-indeterminate').evaluate(element=>element.position)).toBe(-1);
  await info.attach('progress-forced-colors.png',{body:await page.locator('#progress-feedback').screenshot(),contentType:'image/png'});
 });
}
