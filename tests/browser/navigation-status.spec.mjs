import {test,expect} from '@playwright/test';

// Run only with the batch's rebuilt, independent formal-package consumer.
const primary=(page,id='project-alpha')=>page.locator(`[data-menu-id="${id}"][data-menu-control="primary"]`);
const spinner=(page,id='project-alpha')=>primary(page,id).locator('[data-navigation-status] .xui-spinner');
async function ready(page,{mode='light',width=1280,textScale=1,motion='no-preference'}={}){
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:motion});
  await page.addInitScript(({mode,textScale})=>{
    sessionStorage.setItem('ui.theme.mode',mode);
    document.addEventListener('DOMContentLoaded',()=>document.documentElement.style.setProperty('--font-scale',String(textScale)),{once:true});
  },{mode,textScale});
  await page.goto('/rich-navigation-react/?status');
  await expect(primary(page)).toHaveCount(1);
  if(width<768)await page.getByRole('button',{name:'工作导航',exact:true}).click();
  await expect(primary(page)).toBeVisible();
}
async function geometry(page,id){return primary(page,id).evaluate(node=>{
  const box=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const name=node.querySelector('.xui-navigation-label'),label=node.querySelector('.xui-menu-label'),status=node.querySelector('[data-navigation-status]');
  return {name:box(name),label:box(label),status:box(status),row:box(node),lineHeight:parseFloat(getComputedStyle(node).lineHeight),pageWidth:document.documentElement.scrollWidth,viewport:innerWidth};
});}
async function spinnerFrame(page){return spinner(page).evaluate(node=>{
  const s=getComputedStyle(node),probe=document.createElement('span');probe.style.color='var(--action-primary)';node.append(probe);const primary=getComputedStyle(probe).color;probe.remove();
  return {borders:[s.borderTopColor,s.borderRightColor,s.borderBottomColor,s.borderLeftColor],primary,transform:s.transform,animations:node.getAnimations().length,hidden:node.getAttribute('aria-hidden')};
});}
for(const mode of ['light','dark','system'])for(const scenario of [
  {width:1280,textScale:1},{width:390,textScale:1},{width:390,textScale:2},
])for(const motion of ['no-preference','reduce'])test(`navigation trailing status ${mode} ${scenario.width}px text${scenario.textScale} ${motion}`,async({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await ready(page,{mode,...scenario,motion});
  for(const id of ['project-alpha','project-folder']){
    const m=await geometry(page,id);
    expect(Math.abs(m.status.right-m.label.right)).toBeLessThanOrEqual(1);
    expect(m.name.right).toBeLessThanOrEqual(m.status.x+1);
    expect(Math.abs(m.status.y+m.status.height/2-m.name.y-m.lineHeight/2)).toBeLessThanOrEqual(2);
    expect(m.status.width).toBeGreaterThan(0);
    expect(m.pageWidth).toBeLessThanOrEqual(m.viewport+1);
    expect(await primary(page,id).locator('[data-navigation-status] button,[data-navigation-status] a,[data-navigation-status] [tabindex]').count()).toBe(0);
  }
  const frame=await spinnerFrame(page);
  expect(frame.hidden).toBe('true');
  expect(frame.borders.filter(color=>color===frame.primary)).toHaveLength(3);
  expect(frame.borders.filter(color=>color==='rgba(0, 0, 0, 0)')).toHaveLength(1);
  if(motion==='reduce'){
    expect(frame.animations).toBe(0);
    await expect(spinner(page)).toHaveCSS('transform','none');
    await expect(primary(page).getByText('执行中',{exact:true})).toBeVisible();
  }else{
    expect(frame.animations).toBe(1);
    await expect.poll(async()=>(await spinnerFrame(page)).transform).not.toBe(frame.transform);
  }
  if(mode==='system'){
    await page.emulateMedia({colorScheme:'light'});
    await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
    expect((await spinnerFrame(page)).primary).not.toBe(frame.primary);
  }
  await info.attach('status-geometry.json',{body:JSON.stringify({long:await geometry(page,'project-alpha'),short:await geometry(page,'project-folder'),spinner:await spinnerFrame(page)},null,2),contentType:'application/json'});
  await info.attach('status.png',{body:await page.screenshot(),contentType:'image/png'});
  expect(errors).toEqual([]);
});

test('only the declared name moves; passive status updates preserve the navigation and draft',async({page})=>{
  await ready(page);
  const link=primary(page),track=link.locator('.xui-navigation-label-text');
  const draft=page.getByRole('textbox',{name:'正文草稿'});
  await draft.fill('状态变化保留草稿');
  await page.evaluate(()=>{window.statusNodes=[document.querySelector('[data-menu-id="project-alpha"][data-menu-control="primary"]'),document.querySelector('[data-menu-id="project-alpha"][data-menu-control="toggle"]'),document.querySelector('[data-menu-id="project-alpha"][data-menu-control="action"]'),document.querySelector('[data-menu-id="project-alpha"] .xui-navigation-label'),document.querySelector('[aria-label="正文草稿"]')];});
  const before=await geometry(page,'project-alpha');
  await link.hover();
  await expect.poll(()=>track.evaluate(node=>node.getAnimations().length)).toBe(1);
  await expect.poll(()=>track.evaluate(node=>new DOMMatrixReadOnly(getComputedStyle(node).transform).m41)).toBeLessThan(-2);
  expect((await geometry(page,'project-alpha')).status).toEqual(before.status);
  await draft.focus();
  await page.evaluate(()=>window.navigationStatusDemo.setRunning(false));
  await expect(spinner(page)).toHaveCount(0);
  await page.evaluate(()=>window.navigationStatusDemo.setRunning(true));
  await expect(spinner(page)).toBeVisible();
  await expect(draft).toBeFocused();await expect(draft).toHaveValue('状态变化保留草稿');
  expect(await page.evaluate(()=>window.statusNodes.every(node=>node.isConnected))).toBe(true);
  const configure=page.locator('[data-menu-id="project-alpha"][data-menu-control="action"]');
  await configure.focus();await page.keyboard.press('Enter');
  expect(await page.evaluate(()=>window.richNavigationDemo.owner.getState().actions)).toBe(1);
  expect(await page.evaluate(()=>window.richNavigationDemo.owner.getState().navigations)).toBe(0);
  await page.evaluate(()=>window.richNavigationDemo.owner.finishActions());
  await link.click({button:'right'});await expect(page.getByRole('menu')).toBeVisible();await page.keyboard.press('Escape');await expect(link).toBeFocused();
  expect(await page.evaluate(()=>window.richNavigationDemo.owner.getState().navigations)).toBe(0);
});

test('compact, RTL, touch and disabled names keep status in its assigned region',async({page,browser})=>{
  await ready(page);
  await page.evaluate(()=>{document.documentElement.dir='rtl';window.navigationLabelsDemo.update({projectItems:window.richNavigationDemo.owner.getState().groups.projects.items.map(item=>({...item,label:'跨团队多地区协同研究及完整记录名称验证'}))});});
  const m=await geometry(page,'project-alpha');
  expect(Math.abs(m.status.x-m.label.x)).toBeLessThanOrEqual(1);
  expect(m.name.x).toBeGreaterThanOrEqual(m.status.right-1);
  await page.evaluate(()=>window.navigationStatusDemo.setCollapsed(true));
  await expect(primary(page)).toHaveAttribute('data-collapsed','true');
  const compact=await primary(page).evaluate(node=>({row:node.getBoundingClientRect().width,hidden:getComputedStyle(node.querySelector('.xui-menu-label')).position}));
  expect(compact.hidden).toBe('absolute');expect(compact.row).toBeLessThanOrEqual(60);
  await page.evaluate(()=>window.navigationStatusDemo.setCollapsed(false));
  await page.evaluate(()=>window.navigationLabelsDemo.update({projectItems:window.richNavigationDemo.owner.getState().groups.projects.items.map(item=>({...item,disabled:true}))}));
  await expect(primary(page)).toHaveAttribute('aria-disabled','true');await expect(spinner(page)).toHaveCount(0);
  const context=await browser.newContext({hasTouch:true,viewport:{width:390,height:900}});
  try{
    const touch=await context.newPage();await ready(touch,{width:390});
    await expect(primary(touch).locator('.xui-navigation-label')).toHaveCSS('white-space','normal');
    const t=await geometry(touch,'project-alpha');expect(t.name.height).toBeGreaterThan(t.lineHeight);expect(Math.abs(t.status.right-t.label.right)).toBeLessThanOrEqual(1);
  }finally{await context.close();}
});
