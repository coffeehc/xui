import {test,expect} from '@playwright/test';

async function setup(page,config){
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/react/nav-contract.html');
  await page.waitForFunction(()=>typeof window.renderNavCase==='function');
  if(config!==undefined)await render(page,config);
  await expect(page.getByRole('navigation')).toHaveAttribute('data-nav-case',/\d+/);
  return page.locator('.xui-nav-item');
}
async function render(page,config){
  const revision=await page.evaluate(config=>window.renderNavCase(config),config);
  await expect(page.getByRole('navigation')).toHaveAttribute('data-nav-case',String(revision));
}
async function appearance(item){
  return item.evaluate(el=>{
    const style=getComputedStyle(el),indicator=getComputedStyle(el,'::before'),icon=getComputedStyle(el.querySelector('svg')),rect=el.getBoundingClientRect();
    const probe=document.createElement('span');probe.hidden=true;el.append(probe);
    probe.style.backgroundColor='var(--menu-item-selected-background)';probe.style.color='var(--menu-item-selected-foreground)';
    const expected={background:getComputedStyle(probe).backgroundColor,color:getComputedStyle(probe).color};probe.remove();
    return {background:style.backgroundColor,color:style.color,icon:{color:icon.color,fill:icon.fill,stroke:icon.stroke},
      indicator:{opacity:indicator.opacity,color:indicator.backgroundColor,width:indicator.width,height:indicator.height},border:style.borderWidth,
      rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},expected};
  });
}

for(const mode of ['light','dark'])test(`NavItem: aria-current alone supplies default selected styling in ${mode}`,async({page})=>{
  const item=await setup(page);await page.locator('html').evaluate((el,mode)=>{el.dataset.theme=mode;},mode);
  await expect(item).toHaveAttribute('aria-current','page');await page.mouse.move(1200,700);
  const before=await appearance(item);
  expect(before).toMatchObject({...before.expected,icon:{color:before.expected.color,fill:before.expected.color,stroke:before.expected.color},indicator:{opacity:'1',color:before.expected.color},border:'0px'});
  expect(parseFloat(before.indicator.width)).toBeGreaterThan(0);expect(parseFloat(before.indicator.height)).toBeGreaterThan(0);
  await item.hover();expect(await appearance(item)).toEqual(before);
  await page.mouse.move(1200,700);await page.keyboard.press('Tab');await expect(item).toBeFocused();
  expect(await item.evaluate(el=>el.matches(':focus-visible')&&getComputedStyle(el).outlineStyle==='none')).toBe(true);
  expect(await appearance(item)).toEqual(before);await item.hover();expect(await appearance(item)).toEqual(before);
});

test('NavItem: omitted selected preserves ARIA, explicit selected wins conflicts',async({page})=>{
  const item=await setup(page,{});
  const cases=[
    {config:{},current:null},
    ...['page','step','location','date','time','true','false',true,false].map(current=>({config:{'aria-current':current},current:String(current)})),
    {config:{selected:true},current:'page'},{config:{selected:false},current:null},
    ...['page','step',true,false].flatMap(current=>[
      {config:{selected:true,'aria-current':current},current:'page'},
      {config:{selected:false,'aria-current':current},current:null},
    ]),
  ];
  for(const {config,current} of cases){
    await render(page,config);expect(await item.getAttribute('aria-current'),JSON.stringify(config)).toBe(current);
    expect(await item.evaluate(el=>getComputedStyle(el,'::before').opacity),JSON.stringify(config)).toBe(current==='page'?'1':'0');
  }
});

test('NavItem: native anchor ref, attributes, event phases and disabled contract survive',async({page})=>{
  const item=await setup(page,{'aria-current':'page',tabIndex:2});
  expect(await item.evaluate(el=>el===window.navRef)).toBe(true);expect(await item.evaluate(el=>el.tagName)).toBe('A');
  await expect(item).toHaveClass('xui-nav-item host-nav-item');await expect(item).toHaveAttribute('href','#destination');await expect(item).toHaveAttribute('tabindex','2');
  await item.focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.navEvents)).toEqual(['focus','capture','click']);
  await render(page,{selected:true,disabled:true,collapsed:true,tabIndex:2});
  await expect(item).toHaveAttribute('aria-current','page');await expect(item).toHaveAttribute('aria-disabled','true');await expect(item).toHaveAttribute('data-collapsed','true');await expect(item).toHaveAttribute('tabindex','-1');
  expect(await item.getAttribute('href')).toBeNull();expect(await item.evaluate(el=>el===window.navRef)).toBe(true);
  await item.click({force:true});expect(await page.evaluate(()=>window.navEvents.filter(event=>event!=='focus'))).toEqual(['capture']);
});

for(const composition of ['element','callback'])for(const mode of ['light','dark'])test(`NavItem: ${composition} router composition has one fully styled link in ${mode}`,async({page})=>{
  const item=await setup(page,{'aria-current':'page',composition});await page.locator('html').evaluate((el,mode)=>{el.dataset.theme=mode;},mode);
  await expect(page.locator('a')).toHaveCount(1);await expect(item.locator('a')).toHaveCount(0);
  await expect(item).toHaveClass(/xui-nav-item/);await expect(item).toHaveClass(/host-nav-item/);await expect(item).toHaveClass(/host-router/);
  expect(await item.evaluate(el=>el===window.navRef)).toBe(true);
  if(composition==='element')expect(await item.evaluate(el=>el===window.navRenderRef)).toBe(true);
  if(composition==='callback')await expect(item).toHaveAttribute('data-render-selected','true');
  await page.mouse.move(1200,700);const before=await appearance(item);
  expect(before).toMatchObject({...before.expected,icon:{color:before.expected.color,fill:before.expected.color,stroke:before.expected.color},indicator:{opacity:'1'},border:'0px'});
  await item.hover();expect(await appearance(item)).toEqual(before);
  await page.evaluate(()=>{window.navBefore={identity:window.navIdentity,link:window.navRef};});
  await item.click();await expect(page).toHaveURL(/\/react\/nav-destination\.html$/);
  expect(await page.evaluate(()=>window.navBefore.identity===window.navIdentity&&window.navBefore.link===window.navRef)).toBe(true);
  expect(await page.evaluate(()=>window.navEvents.filter(event=>event!=='focus'))).toEqual(['capture','render-click','click','route']);
});

for(const composition of ['element','callback'])test(`NavItem: ${composition} merges events, honors cancellation and prevents disabled routing`,async({page})=>{
  const item=await setup(page,{'aria-current':'page',composition,cancelRender:true});await item.click();
  await expect(page).toHaveURL(/nav-contract\.html$/);expect(await page.evaluate(()=>window.navEvents.filter(event=>event!=='focus'))).toEqual(['capture','render-click','click']);
  await render(page,{selected:false,'aria-current':'page',composition,disabled:true});
  expect(await item.getAttribute('aria-current')).toBeNull();await expect(item).toHaveAttribute('aria-disabled','true');await expect(item).toHaveAttribute('tabindex','-1');
  await item.click({force:true});await item.click({button:'middle',force:true});await item.focus();await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/nav-contract\.html$/);
  expect(await page.evaluate(()=>window.navEvents.filter(event=>['render-click','click','route'].includes(event)))).toEqual([]);
});

for(const composition of [undefined,'element','callback'])test(`NavItem: ${composition??'native'} preserves modified, middle, target and download browser actions`,async({page})=>{
  const item=await setup(page,{composition,allowNative:true,href:'/react/nav-destination.html'});
  for(const action of [{modifiers:['ControlOrMeta']},{button:'middle'}]){
    const popupPromise=page.context().waitForEvent('page');await item.click(action);const popup=await popupPromise;
    await popup.waitForLoadState();await expect(popup).toHaveURL(/nav-destination\.html$/);await popup.close();
    await expect(page).toHaveURL(/nav-contract\.html$/);
  }
  await render(page,{composition,allowNative:true,href:'/react/nav-destination.html',target:'_blank'});
  const popupPromise=page.waitForEvent('popup');await item.click();const popup=await popupPromise;await popup.waitForLoadState();await expect(popup).toHaveURL(/nav-destination\.html$/);await popup.close();
  await render(page,{composition,allowNative:true,href:'/react/nav-destination.html',download:'destination.html'});
  const downloadPromise=page.waitForEvent('download');await item.click();expect((await downloadPromise).suggestedFilename()).toBe('destination.html');
  await expect(page).toHaveURL(/nav-contract\.html$/);
  expect(await page.evaluate(()=>window.navEvents)).not.toContain('route');
});
