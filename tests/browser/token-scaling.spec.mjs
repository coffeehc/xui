import {test as base,expect} from '@playwright/test';

// Both routes are independent npm-tarball consumers built by test:consumer.
// Only documented root overrides and isolated token probes are added here;
// source CSS, fixture-layout repairs and browser zoom are deliberately absent.
const test=base.extend({page:async({page},use,info)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push({kind:'pageerror',message:error.message}));
  page.on('console',message=>{
    if(message.type()==='error'||message.type()==='warning'&&/hydrat|uncaught|invalid hook|cannot update|not wrapped in act|does not match|did not match/i.test(message.text()))errors.push({kind:`console.${message.type()}`,message:message.text(),location:message.location()});
  });
  await use(page);
  await info.attach('browser-errors.json',{body:JSON.stringify(errors,null,2),contentType:'application/json'});
  const expectedResourceFailures=info.annotations.filter(annotation=>annotation.type==='expected-resource-error').map(annotation=>annotation.description);
  const unexpected=errors.filter(error=>!(error.kind==='console.error'&&error.message.includes('404')&&expectedResourceFailures.some(path=>error.location?.url===`http://127.0.0.1:4173${path}`)));
  expect(unexpected,'formal consumers must not emit unexpected browser errors or hydration warnings').toEqual([]);
}});

const roles={
  caption:{font:12,line:18},
  'body-xs':{font:13,line:20},
  'body-sm':{font:14,line:22},
  'section-title':{font:16,line:26},
  'secondary-value':{font:18,line:28},
  'page-title':{font:20,line:28},
  metric:{font:24,line:28},
};
const kinds=['react','vanilla'];
const modes=['light','dark','system'];
const scales=[.95,.9];
const navItem=(page,id)=>page.locator(`[data-menu-id="${id}"][data-menu-control="primary"]`);
const clamp=value=>Math.min(2,Math.max(.5,value));
function expectedRole(role,fontScale=1,lineScale=fontScale,rootScale=1){
  const defaults=roles[role];
  const font=Math.max(12,defaults.font*clamp(fontScale))*rootScale;
  // The original role-specific leading ratio is the accessibility floor.
  // Thus a 12px caption keeps 18px leading even when font-scale is .9.
  return {font,line:Math.max(font*defaults.line/defaults.font,defaults.line*rootScale*clamp(lineScale))};
}
async function settle(page){
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
}
async function setup(page,kind,mode='light',query=''){
  await page.setViewportSize({width:1280,height:800});
  await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
  await page.addInitScript(mode=>sessionStorage.setItem('ui.theme.mode',mode),mode);
  await page.goto(`/layout-typography-${kind}/${query}`);
  await page.waitForFunction(()=>!!window.layoutTypography);
  // Initialization script order is not guaranteed if setup is reused. Select
  // this case's mode through the consumer's actual public theme owner as well.
  await page.evaluate(mode=>window.layoutTypography.setMode(mode),mode);
  await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);
  await page.evaluate(names=>{
    // Probes exercise every public type role, including roles unused in this
    // fixture, without participating in the consumer's layout or screenshots.
    const probes=document.createElement('div');
    probes.dataset.tokenProbes='';probes.setAttribute('aria-hidden','true');
    Object.assign(probes.style,{position:'fixed',left:'0',top:'0',visibility:'hidden',pointerEvents:'none'});
    for(const name of names){
      const probe=document.createElement('span');probe.dataset.tokenRole=name;probe.textContent='Aa 中文';
      Object.assign(probe.style,{display:'block',fontSize:`var(--font-size-${name})`,lineHeight:`var(--line-height-${name})`,fontFamily:'var(--font-sans)'});
      probes.append(probe);
    }
    document.body.append(probes);
  },Object.keys(roles));
  await settle(page);
}
async function setScales(page,fontScale=null,lineScale=null,rootPercent=100){
  await page.evaluate(({fontScale,lineScale,rootPercent})=>{
    const root=document.documentElement;
    for(const [key,value] of [['--font-scale',fontScale],['--line-height-scale',lineScale]]){
      if(value===null)root.style.removeProperty(key);else root.style.setProperty(key,String(value));
    }
    root.style.fontSize=`${rootPercent}%`;
  },{fontScale,lineScale,rootPercent});
  await settle(page);
}
async function measure(locator){
  return locator.evaluate(node=>{
    const box=node.getBoundingClientRect(),style=getComputedStyle(node);
    return {x:box.x,y:box.y,width:box.width,height:box.height,right:box.right,bottom:box.bottom,
      clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,
      fontSize:parseFloat(style.fontSize),lineHeight:parseFloat(style.lineHeight),fontWeight:style.fontWeight,
      minHeight:style.minHeight,padding:style.padding,gap:style.gap,borderWidth:style.borderWidth,borderRadius:style.borderRadius};
  });
}
async function roleMetrics(page){
  return page.locator('[data-token-role]').evaluateAll(nodes=>Object.fromEntries(nodes.map(node=>{
    const style=getComputedStyle(node);
    return [node.dataset.tokenRole,{font:parseFloat(style.fontSize),line:parseFloat(style.lineHeight)}];
  })));
}
async function assertRoles(page,fontScale=1,lineScale=fontScale,rootScale=1){
  const metrics=await roleMetrics(page);
  expect(Object.keys(metrics)).toEqual(Object.keys(roles));
  for(const role of Object.keys(roles)){
    const expected=expectedRole(role,fontScale,lineScale,rootScale),actual=metrics[role];
    expect(actual.font,`${role} font at ${fontScale}/${lineScale}`).toBeCloseTo(expected.font,2);
    expect(actual.line,`${role} leading at ${fontScale}/${lineScale}`).toBeCloseTo(expected.line,2);
    expect(actual.font,`${role} must retain the .75rem floor`).toBeGreaterThanOrEqual(12*rootScale);
    expect(actual.line,`${role} must preserve its original leading ratio`).toBeGreaterThanOrEqual(actual.font*roles[role].line/roles[role].font-.01);
  }
  return metrics;
}
async function assertType(locator,role,fontScale=1,lineScale=fontScale,rootScale=1){
  const actual=await measure(locator),expected=expectedRole(role,fontScale,lineScale,rootScale);
  expect(actual.fontSize).toBeCloseTo(expected.font,2);expect(actual.lineHeight).toBeCloseTo(expected.line,2);
  return actual;
}
async function assertNoOverflow(page){
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth+1));
  for(const selector of ['.xui-shell-header','.xui-shell-main','.xui-app-header-status','.xui-app-header-actions']){
    const box=await measure(page.locator(selector));
    expect(box.scrollWidth,`${selector} must wrap within its available width`).toBeLessThanOrEqual(box.clientWidth+1);
  }
}
async function geometry(page){
  const field=page.getByTestId('field');
  const [label,input,help,error,button,choice]=await Promise.all([
    field.locator('.xui-label'),field.locator('input'),field.locator('.xui-help'),field.locator('.xui-error'),
    page.getByRole('button',{name:'保存草稿',exact:true}),page.getByTestId('checkbox-label-text').locator('..'),
  ].map(measure));
  const fixed=({height,minHeight,padding,gap,borderWidth,borderRadius})=>({height,minHeight,padding,gap,borderWidth,borderRadius});
  const box=await measure(choiceLocator(page));
  return {input:fixed(input),button:fixed(button),choice:fixed(choice),choiceBox:{width:box.width,height:box.height,borderWidth:box.borderWidth,borderRadius:box.borderRadius},
    fieldGap:{labelToInput:input.y-label.bottom,inputToHelp:help.y-input.bottom,helpToError:error.y-help.bottom},
    shell:await page.locator('.xui-shell-header,.xui-shell-sidebar,.xui-shell-main').evaluateAll(nodes=>nodes.map(node=>{const s=getComputedStyle(node);return {className:node.className,padding:s.padding,borderWidth:s.borderWidth,gap:s.gap};}))};
}
const choiceLocator=page=>page.getByTestId('checkbox-label-text').locator('..').locator('input');
async function snapshot(page,info,name,{screenshot=true}={}){
  const metrics=await page.evaluate(()=>{
    const root=document.documentElement,style=getComputedStyle(root);
    const measure=node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return {className:node.className,testId:node.dataset.testid,role:node.getAttribute('role'),x:r.x,y:r.y,width:r.width,height:r.height,fontSize:s.fontSize,lineHeight:s.lineHeight,padding:s.padding,gap:s.gap,borderWidth:s.borderWidth,clientWidth:node.clientWidth,scrollWidth:node.scrollWidth};};
    return {viewport:{width:innerWidth,height:innerHeight,devicePixelRatio,visualViewportScale:visualViewport?.scale},
      rootFontSize:style.fontSize,fontScale:style.getPropertyValue('--font-scale').trim(),lineHeightScale:style.getPropertyValue('--line-height-scale').trim(),
      theme:{mode:root.dataset.theme,effective:root.dataset.themeEffective},documentWidth:root.scrollWidth,
      roles:[...document.querySelectorAll('[data-token-role]')].map(node=>({name:node.dataset.tokenRole,...measure(node)})),
      elements:[...document.querySelectorAll('.xui-shell-header,.xui-shell-sidebar,.xui-shell-main,.xui-app-header-status,.xui-app-header-actions,.xui-field>*,.xui-button,.xui-choice,.xui-nav-item,.xui-menu-item,.xui-menu-popup,.xui-shell-drawer,[data-menu-symbol]')].filter(node=>node.getClientRects().length).map(measure)};
  });
  await info.attach(`${name}-css-pixels.json`,{body:JSON.stringify(metrics,null,2),contentType:'application/json'});
  if(screenshot){const path=info.outputPath(`${name}.png`);await page.screenshot({path,animations:'disabled'});await info.attach(`${name}.png`,{path,contentType:'image/png'});}
  return metrics;
}

async function overrideRoot(page,values){
  await page.evaluate(values=>{for(const [name,value] of Object.entries(values)){if(value===null)document.documentElement.style.removeProperty(name);else document.documentElement.style.setProperty(name,value);}},values);
  await settle(page);
}
async function designMetrics(locator,pseudo=null){
  return locator.evaluate((node,pseudo)=>{
    const style=getComputedStyle(node,pseudo),rect=node.getBoundingClientRect();
    const number=name=>parseFloat(style[name]);
    return {width:pseudo?number('width'):rect.width,height:pseudo?number('height'):rect.height,
      minHeight:number('minHeight'),paddingTop:number('paddingTop'),paddingRight:number('paddingRight'),paddingBottom:number('paddingBottom'),paddingLeft:number('paddingLeft'),
      gap:style.gap,borderTopWidth:number('borderTopWidth'),borderRightWidth:number('borderRightWidth'),borderBottomWidth:number('borderBottomWidth'),borderLeftWidth:number('borderLeftWidth'),
      radius:style.borderRadius,color:style.color,background:style.backgroundColor,outlineWidth:number('outlineWidth'),outlineColor:style.outlineColor,
      transform:style.transform,translateX:style.transform==='none'?0:new DOMMatrixReadOnly(style.transform).m41,fontSize:number('fontSize'),lineHeight:style.lineHeight};
  },pseudo);
}
async function layoutDesignMetrics(page){
  const check=choiceLocator(page),toggle=page.getByTestId('switch-label-text').locator('..').locator('input'),nav=navItem(page,'overview');
  return {
    input:await designMetrics(page.getByTestId('field').locator('input')),
    button:await designMetrics(page.getByRole('button',{name:'保存草稿',exact:true})),
    checkbox:await designMetrics(check),checkmark:await designMetrics(check,'::after'),
    switch:await designMetrics(toggle),thumb:await designMetrics(toggle,'::before'),
    nav:await designMetrics(nav),indicator:await designMetrics(nav,'::before'),icon:await designMetrics(nav.locator('svg')),
    sidebar:await designMetrics(page.locator('.xui-shell-sidebar')),
    breadcrumb:await designMetrics(page.getByRole('link',{name:'团队项目与知识资料',exact:true})),
    fieldGap:(await geometry(page)).fieldGap,
  };
}
async function attachMetrics(info,name,metrics){await info.attach(`${name}-design-families.json`,{body:JSON.stringify(metrics,null,2),contentType:'application/json'});}

for(const kind of kinds){
  for(const mode of modes){
    test(`${kind} root typography scales: ${mode}, defaults and .95/.9 retain geometry`,async({page},info)=>{
      await setup(page,kind,mode);
      const initial=await assertRoles(page),defaultGeometry=await geometry(page);
      expect(await page.locator('html').evaluate(node=>getComputedStyle(node).fontSize)).toBe('16px');
      expect(defaultGeometry.input.height).toBe(36);expect(defaultGeometry.button.height).toBe(36);
      expect(defaultGeometry.input.borderWidth).toBe('1px');expect(defaultGeometry.button.borderWidth).toBe('1px');
      expect(defaultGeometry.choiceBox).toMatchObject({width:16,height:16,borderWidth:'1px'});
      expect(defaultGeometry.fieldGap).toEqual({labelToInput:8,inputToHelp:4,helpToError:4});
      const initialLayout=await snapshot(page,info,'default-no-overrides');
      await setScales(page,1,1);
      expect(await assertRoles(page)).toEqual(initial);expect(await geometry(page)).toEqual(defaultGeometry);
      const explicitDefault=await snapshot(page,info,'explicit-default-one');
      expect(explicitDefault.elements,'explicit defaults must leave every measured default rectangle unchanged').toEqual(initialLayout.elements);
      for(const scale of scales){
        await setScales(page,scale);
        await assertRoles(page,scale);
        expect(await geometry(page),'text density must not resize controls, borders, spacing or choice icons').toEqual(defaultGeometry);
        await assertType(page.getByRole('heading',{name:'布局与文字验收',exact:true}),'page-title',scale);
        await assertType(page.getByRole('heading',{name:'操作与表单',exact:true}),'section-title',scale);
        await assertType(page.getByTestId('field').locator('input'),'body-sm',scale);
        await assertType(page.getByTestId('field').locator('.xui-label'),'body-xs',scale);
        await assertType(page.getByTestId('field').locator('.xui-help'),'body-xs',scale);
        await assertType(page.getByTestId('header-status'),'body-xs',scale);
        await assertNoOverflow(page);await snapshot(page,info,`font-${scale}`);
      }
      if(mode==='system'){
        await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
        await assertRoles(page,.9);expect(await geometry(page)).toEqual(defaultGeometry);
        await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','dark');await assertRoles(page,.9);
      }
    });
  }

  test(`${kind} non-type root families reach real layout controls and restore defaults`,async({page},info)=>{
    test.setTimeout(60000);
    await setup(page,kind);
    for(const mode of modes){
      await page.emulateMedia({colorScheme:mode==='light'?'light':'dark'});
      await page.evaluate(mode=>window.layoutTypography.setMode(mode),mode);
      await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);
      await choiceLocator(page).check();await page.getByTestId('switch-label-text').locator('..').locator('input').check();
      await page.getByTestId('field').locator('input').focus();await page.mouse.move(1279,799);await settle(page);
      const baseline=await layoutDesignMetrics(page),typeBaseline=await roleMetrics(page);
      await attachMetrics(info,`${mode}-root-family-default`,baseline);
      const cases=[
        {name:'spacing',values:{'--spacing':'6px'},check:actual=>{
          expect(actual.input.minHeight).toBe(54);expect(actual.input.height).toBeGreaterThanOrEqual(54);
          expect(actual.button.minHeight).toBe(54);expect(actual.button.height).toBeGreaterThanOrEqual(54);
          expect(actual.input.paddingTop).toBe(6);expect(actual.input.paddingLeft).toBe(12);
          expect(actual.button.paddingTop).toBe(6);expect(actual.button.paddingLeft).toBe(18);expect(actual.button.gap).toBe('9px');
          expect(actual.fieldGap).toEqual({labelToInput:12,inputToHelp:6,helpToError:6});
          expect(actual.checkbox.width).toBe(24);expect(actual.checkbox.height).toBe(24);
          expect(actual.switch.width).toBe(42);expect(actual.switch.height).toBeCloseTo(24.9,1);
          expect(actual.thumb.width).toBeCloseTo(21.6,1);expect(actual.thumb.height).toBeCloseTo(21.6,1);
          expect(actual.thumb.translateX).toBeCloseTo(17.4,2);
          expect(actual.icon.width).toBe(24);expect(actual.icon.height).toBe(24);expect(actual.nav.gap).toBe('12px');
          expect(actual.nav.minHeight).toBe(54);expect(actual.sidebar.width).toBe(324);expect(actual.sidebar.paddingLeft).toBe(18);
          expect(actual.input.borderTopWidth).toBe(baseline.input.borderTopWidth);expect(actual.input.radius).toBe(baseline.input.radius);
        }},
        {name:'radius',values:{'--base-radius':'12px'},check:actual=>{
          expect(actual.input.radius).toBe('12px');expect(actual.button.radius).toBe('12px');expect(actual.nav.radius).toBe('12px');expect(actual.checkbox.radius).toBe('6px');
          expect(actual.switch.radius).toBe(baseline.switch.radius);expect(actual.input.paddingTop).toBe(baseline.input.paddingTop);expect(actual.input.borderTopWidth).toBe(baseline.input.borderTopWidth);
        }},
        {name:'border-and-emphasis',values:{'--base-line-thin':'3px','--base-line-emphasis':'4px'},check:actual=>{
          for(const role of ['input','button','checkbox','switch'])for(const edge of ['borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth'])expect(actual[role][edge],`${role} ${edge}`).toBe(3);
          expect(actual.checkmark.borderRightWidth).toBe(4);expect(actual.checkmark.borderBottomWidth).toBe(4);expect(actual.indicator.width).toBe(4);expect(actual.input.outlineWidth).toBe(4);
          expect(actual.input.height).toBeGreaterThanOrEqual(actual.input.minHeight);expect(actual.button.height).toBeGreaterThanOrEqual(actual.button.minHeight);
          expect(actual.input.paddingTop).toBe(baseline.input.paddingTop);expect(actual.input.radius).toBe(baseline.input.radius);
        }},
        {name:'semantic-primary',values:{'--action-primary':'rgb(96, 65, 170)'},check:actual=>{
          const color='rgb(96, 65, 170)';
          expect(actual.checkbox.background).toBe(color);expect(actual.switch.background).toBe(color);expect(actual.nav.color).toBe(color);expect(actual.indicator.background).toBe(color);expect(actual.breadcrumb.color).toBe(color);expect(actual.input.outlineColor).toBe(color);
          expect(actual.input.height).toBe(baseline.input.height);expect(actual.input.radius).toBe(baseline.input.radius);expect(actual.input.borderTopWidth).toBe(baseline.input.borderTopWidth);
        }},
      ];
      for(const entry of cases)await test.step(`${mode}: ${entry.name}`,async()=>{
        await overrideRoot(page,entry.values);const actual=await layoutDesignMetrics(page);entry.check(actual);
        expect(await roleMetrics(page),'spacing, shape, line and color overrides must not change type roles').toEqual(typeBaseline);
        await attachMetrics(info,`${mode}-${entry.name}`,actual);await snapshot(page,info,`${mode}-${entry.name}`);
        await overrideRoot(page,Object.fromEntries(Object.keys(entry.values).map(key=>[key,null])));
        expect(await layoutDesignMetrics(page),'removing each root override must restore its actual control geometry and style').toEqual(baseline);
      });
      await snapshot(page,info,`${mode}-root-families-restored`);
    }
  });

  test(`${kind} widget switch sizes, primary buttons and grouped boundaries follow root families`,async({page},info)=>{
    // Avatar intentionally requests a missing image to demonstrate its fallback.
    // Record that exact expected 404; all other errors still fail this test.
    info.annotations.push({type:'expected-resource-error',description:'/not-an-avatar.png'});
    info.annotations.push({type:'expected-resource-error',description:'/favicon.ico'});
    await page.emulateMedia({reducedMotion:'reduce',colorScheme:'light'});
    await page.goto(`/widgets-${kind}/`);await expect(page.getByRole('heading',{name:'公共控件',exact:true})).toBeVisible();await settle(page);
    const large=page.getByLabel('大开关',{exact:true});await large.check();
    const read=async()=>{
      const switches={};
      for(const [size,label] of [['sm','只读开关'],['default','禁用开关'],['lg','大开关']]){
        const input=page.getByLabel(label,{exact:true});switches[size]={box:await designMetrics(input),thumb:await designMetrics(input,'::before')};
      }
      const search=page.getByRole('textbox',{name:'搜索',exact:true}),group=page.locator('.xui-input-group').filter({has:search});
      await expect(group).toHaveCount(1);
      return {switches,button:await designMetrics(page.getByRole('button',{name:'固定窗口高度',exact:true})),group:await designMetrics(group),checkmark:await designMetrics(page.getByLabel('只读勾选',{exact:true}),'::after')};
    };
    await page.getByRole('textbox',{name:'搜索',exact:true}).focus();await page.mouse.move(1279,799);await settle(page);
    const baseline=await read();await attachMetrics(info,'widgets-default',baseline);
    for(const [size,width,height,thumb] of [['sm',24,14,12],['default',28,16.6,14.4],['lg',36,20,18]]){
      const actual=baseline.switches[size];expect(actual.box.width).toBe(width);expect(actual.box.height).toBeCloseTo(height,1);expect(actual.thumb.width).toBeCloseTo(thumb,1);
    }
    await setScales(page,.9);const dense=await read();
    for(const size of ['sm','default','lg']){
      for(const property of ['width','height','radius','borderTopWidth'])expect(dense.switches[size].box[property]).toBe(baseline.switches[size].box[property]);
      for(const property of ['width','height','transform'])expect(dense.switches[size].thumb[property]).toBe(baseline.switches[size].thumb[property]);
    }
    await snapshot(page,info,'widgets-font-only');await setScales(page);
    const values={'--spacing':'6px','--base-radius':'12px','--base-line-thin':'3px','--base-line-emphasis':'4px','--action-primary':'rgb(96, 65, 170)'};
    await overrideRoot(page,values);const changed=await read();
    for(const [size,width,height,thumb] of [['sm',36,21,18],['default',42,24.9,21.6],['lg',54,30,27]]){
      const actual=changed.switches[size];expect(actual.box.width).toBe(width);expect(actual.box.height).toBeCloseTo(height,1);expect(actual.thumb.width).toBeCloseTo(thumb,1);expect(actual.thumb.height).toBeCloseTo(thumb,1);expect(actual.box.borderTopWidth).toBe(3);
    }
    expect(changed.switches.sm.thumb.translateX).toBe(15);expect(changed.switches.lg.thumb.translateX).toBe(24);
    expect(changed.switches.sm.box.background).toBe('rgb(96, 65, 170)');expect(changed.switches.lg.box.background).toBe('rgb(96, 65, 170)');
    expect(changed.button.background).toBe('rgb(96, 65, 170)');expect(changed.button.radius).toBe('12px');expect(changed.button.borderTopWidth).toBe(3);expect(changed.button.paddingLeft).toBe(18);expect(changed.button.minHeight).toBe(54);expect(changed.button.height).toBeGreaterThanOrEqual(54);
    expect(changed.group.radius).toBe('12px');expect(changed.group.borderTopWidth).toBe(3);expect(changed.group.outlineWidth).toBe(4);expect(changed.group.outlineColor).toBe('rgb(96, 65, 170)');expect(changed.checkmark.borderRightWidth).toBe(4);
    await attachMetrics(info,'widgets-root-overrides',changed);await snapshot(page,info,'widgets-root-overrides');
    await overrideRoot(page,Object.fromEntries(Object.keys(values).map(key=>[key,null])));expect(await read()).toEqual(baseline);
    await snapshot(page,info,'widgets-restored');
  });

  test(`${kind} independent root overrides, typed invalid values and safe scale bounds`,async({page},info)=>{
    await setup(page,kind);
    const cases=[
      {name:'font-only',font:.9,line:null,expected:[.9,.9]},
      {name:'leading-only',font:null,line:1.2,expected:[1,1.2]},
      {name:'independent-leading',font:.9,line:1.1,expected:[.9,1.1]},
      {name:'leading-cannot-crush-type',font:1.2,line:.5,expected:[1.2,.5]},
      {name:'smallest-supported',font:.5,line:.5,expected:[.5,.5]},
      {name:'zero',font:0,line:0,expected:[0,0]},
      {name:'negative',font:-10,line:-10,expected:[-10,-10]},
      {name:'upper-bound',font:20,line:20,expected:[20,20]},
      {name:'invalid-font-string',font:'compact',line:null,expected:[1,1]},
      {name:'invalid-font-unit',font:'14px',line:null,expected:[1,1]},
      {name:'invalid-leading-string',font:.9,line:'compact',expected:[.9,1]},
      {name:'invalid-leading-unit',font:.9,line:'1.2rem',expected:[.9,1]},
      {name:'both-invalid',font:'small',line:'120%',expected:[1,1]},
      {name:'reset-to-default',font:null,line:null,expected:[1,1]},
    ];
    for(const entry of cases){
      await test.step(entry.name,async()=>{
        await setScales(page,entry.font,entry.line);
        await assertRoles(page,...entry.expected);
        await snapshot(page,info,entry.name,{screenshot:['independent-leading','smallest-supported','upper-bound','reset-to-default'].includes(entry.name)});
      });
    }
  });

  for(const mode of modes){
    test(`${kind} scaled ${mode} menu portals retain leading, icons and keyboard controls`,async({page},info)=>{
      await setup(page,kind,mode);
      const trigger=page.getByRole('button',{name:'打开操作菜单',exact:true});
      for(const scale of scales){
        await setScales(page,scale);
        await trigger.focus();await trigger.press('ArrowDown');
        const popup=page.getByTestId('ordinary-popup');await expect(popup).toBeVisible();
        expect(await popup.evaluate(node=>!document.querySelector('main').contains(node)),'the menu must inherit root tokens outside main content').toBe(true);
        await assertType(popup,'body-sm',scale);
        for(const id of ['ordinary-item','link-item','checkbox-item','radio-item','submenu-trigger']){
          const item=page.getByTestId(id);await expect(item).toBeVisible();await assertType(item,'body-xs',scale);
          const metrics=await measure(item);expect(metrics.height).toBeGreaterThanOrEqual(28);expect(metrics.padding).toBe('4px 8px');expect(metrics.borderWidth).toBe('0px');
          const icon=await measure(item.locator('[data-menu-symbol]'));expect(icon.width).toBe(16);expect(icon.height).toBe(16);
        }
        const illustration=await measure(page.getByTestId('illustration-item').locator('[data-illustration]'));expect(illustration.width).toBe(24);expect(illustration.height).toBe(24);
        await expect(page.getByTestId('ordinary-item')).toBeFocused();
        await page.keyboard.press('ArrowDown');await expect(page.getByTestId('link-item')).toBeFocused();
        const submenu=page.getByTestId('submenu-trigger');await submenu.focus();await submenu.press('ArrowRight');
        const child=page.getByTestId('submenu-item');await expect(child).toBeVisible();await expect(child).toBeFocused();await assertType(child,'body-xs',scale);
        await snapshot(page,info,`font-${scale}-submenu`);
        await page.keyboard.press('Escape');await expect(submenu).toBeFocused();await page.keyboard.press('Escape');await expect(popup).toBeHidden();await expect(trigger).toBeFocused();

        const context=page.getByTestId('context-trigger');await context.focus();await context.press('Shift+F10');
        const contextPopup=page.getByTestId('context-popup');await expect(contextPopup).toBeVisible();
        for(const id of ['context-item','context-checkbox-item','context-radio-item','context-submenu-trigger'])await assertType(page.getByTestId(id),'body-xs',scale);
        const more=page.getByTestId('context-submenu-trigger');await more.focus();await more.press('ArrowRight');
        await expect(page.getByTestId('context-submenu-item')).toBeFocused();await assertType(page.getByTestId('context-submenu-item'),'body-xs',scale);
        await snapshot(page,info,`font-${scale}-context-submenu`);
        await page.keyboard.press('Escape');await expect(more).toBeFocused();await page.keyboard.press('Escape');await expect(contextPopup).toBeHidden();await expect(context).toBeFocused();
      }
    });
  }

  for(const mode of modes){
    test(`${kind} scaled ${mode} compact rail, narrow drawer and 200% root text`,async({page},info)=>{
      test.setTimeout(60000);
      await setup(page,kind,mode,'?collapsed=true');
      const originalDpr=await page.evaluate(()=>devicePixelRatio);
      for(const scale of scales){
        for(const rootPercent of [100,200]){
          await page.setViewportSize({width:1280,height:800});await setScales(page,scale,null,rootPercent);
          const factor=rootPercent/100;await assertRoles(page,scale,scale,factor);
          const rail=await measure(page.locator('.xui-shell-sidebar'));expect(rail.width).toBeCloseTo(60*factor,1);
          const rects=[];
          for(const id of ['overview','library','settings']){
            const item=navItem(page,id),box=await measure(item);rects.push(box);
            expect(box.width).toBeCloseTo(36*factor,1);expect(box.height).toBeCloseTo(36*factor,1);
            expect(box.x-rail.x).toBeCloseTo(12*factor,1);expect(rail.right-box.right).toBeCloseTo(12*factor,1);
            const icon=await measure(item.locator('svg'));expect(icon.width).toBeCloseTo(16*factor,1);expect(icon.height).toBeCloseTo(16*factor,1);
          }
          expect(rects[1].y-rects[0].bottom).toBeCloseTo(4*factor,1);expect(rects[2].y-rects[1].bottom).toBeCloseTo(4*factor,1);
          await navItem(page,'overview').focus();await page.keyboard.press('ArrowDown');await expect(navItem(page,'library')).toBeFocused();await expect(navItem(page,'overview')).toHaveAttribute('aria-current','page');
          await assertNoOverflow(page);await snapshot(page,info,`font-${scale}-root-${rootPercent}-compact`);

          await page.setViewportSize({width:390,height:844});await settle(page);await assertNoOverflow(page);
          expect(await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize)).toBe(`${16*factor}px`);
          expect(await page.evaluate(()=>devicePixelRatio),'root text resizing is not device-scale or browser zoom').toBe(originalDpr);
          expect(await page.evaluate(()=>visualViewport.scale),'root text resizing must not invoke browser zoom').toBe(1);
          const trigger=page.getByRole('button',{name:'工作导航',exact:true});
          // Repeated keyboard opens catch stale focus/portal state as density
          // and viewport change. The public trigger owns the mobile drawer.
          for(let repeat=0;repeat<2;repeat++){
            await trigger.focus();await trigger.press('Enter');const drawer=page.getByRole('dialog');await expect(drawer).toBeVisible();
            const label=navItem(page,'library').locator('.xui-menu-label');await expect(label).toBeVisible();
            const box=await measure(label);expect(box.width).toBeGreaterThan(0);expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth+1);
            await assertType(navItem(page,'library'),'body-sm',scale,scale,factor);
            const dialog=await measure(drawer);expect(dialog.x).toBeCloseTo(16*factor,1);expect(dialog.y).toBeCloseTo(16*factor,1);expect(dialog.right).toBeLessThanOrEqual(391);expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth+1);
            await assertNoOverflow(page);
            if(repeat===0)await snapshot(page,info,`font-${scale}-root-${rootPercent}-narrow-drawer`);
            await page.keyboard.press('Escape');await expect(drawer).toBeHidden();await expect(trigger).toBeFocused();
          }
          await snapshot(page,info,`font-${scale}-root-${rootPercent}-narrow-closed`);
        }
      }
    });
  }
}
