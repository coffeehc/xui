import {test as base,expect} from '@playwright/test';

// Routes use independent installed tarballs; no source alias or fixture CSS repair.
const test=base.extend({page:async({page},use,info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await use(page);await info.attach('browser-errors.json',{body:JSON.stringify(errors,null,2),contentType:'application/json'});expect(errors).toEqual([]);
}});
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
async function setup(page,kind,mode='light'){
  await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});await page.addInitScript(mode=>localStorage.setItem('ui.theme.mode',mode),mode);
  await page.goto(`/metric-card-${kind}/`);await expect(page.getByTestId('zero-card')).toBeVisible();await settle(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='system'?'dark':mode);
}
async function measure(page){return page.locator('.xui-metric-card').evaluateAll(cards=>cards.map(card=>{
  const box=node=>{const rect=node.getBoundingClientRect(),style=getComputedStyle(node);return {x:rect.x,y:rect.y,right:rect.right,bottom:rect.bottom,width:rect.width,height:rect.height,clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,fontSize:parseFloat(style.fontSize),lineHeight:parseFloat(style.lineHeight),fontWeight:style.fontWeight,color:style.color,background:style.backgroundColor,padding:style.padding,borderRadius:style.borderRadius,fontVariantNumeric:style.fontVariantNumeric};};
  return {card:box(card),label:box(card.querySelector('.xui-metric-card-label')),value:box(card.querySelector('.xui-metric-card-value')),parts:[...card.querySelectorAll('.xui-metric-card-content,.xui-metric-card-header,.xui-metric-card-label,.xui-metric-card-value,.xui-metric-card-marker')].filter(node=>node.getClientRects().length).map(box)};
}));}

for(const kind of ['react','vanilla']){
  for(const mode of ['light','dark','system'])test(`${kind} MetricCard ${mode}: statistical tokens, narrow content and 200% text`,async({page},info)=>{
    await setup(page,kind,mode);
    for(const width of [1280,320,276])for(const scale of [1,2]){
      await page.setViewportSize({width,height:900});await page.evaluate(scale=>{document.documentElement.style.fontSize=`${scale*100}%`;},scale);await settle(page);
      await expect(page.getByTestId('zero-card').locator('.xui-metric-card-value')).toHaveText('0');
      await expect(page.getByTestId('long-card').locator('.xui-metric-card-value')).toHaveText('1234567890'.repeat(10));
      await expect(page.getByTestId('empty-marker-card').locator('.xui-metric-card-marker')).toBeHidden();
      await expect(page.getByTestId('marked-card').getByText('已达标',{exact:true})).toBeVisible();
      const metrics=await measure(page);expect(metrics).toHaveLength(6);
      for(const {card,label,value,parts} of metrics){
        expect(card.padding).toBe(`${12*scale}px`);expect(label.fontSize).toBe(13*scale);expect(value.fontSize).toBe(24*scale);expect(value.fontWeight).toBe('600');expect(value.fontVariantNumeric).toContain('tabular-nums');
        for(const part of parts){expect(part.x).toBeGreaterThanOrEqual(card.x-1);expect(part.right).toBeLessThanOrEqual(card.right+1);expect(part.y).toBeGreaterThanOrEqual(card.y-1);expect(part.bottom).toBeLessThanOrEqual(card.bottom+1);expect(part.scrollWidth).toBeLessThanOrEqual(part.clientWidth+1);}
        expect(label.bottom).toBeLessThanOrEqual(value.y+1);
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
      if(width<=320)for(let index=1;index<metrics.length;index++)expect(metrics[index].card.y).toBeGreaterThanOrEqual(metrics[index-1].card.bottom);
      const wideMarker=await page.getByTestId('wide-marker-card').evaluate(card=>{const label=card.querySelector('.xui-metric-card-label'),marker=card.querySelector('.xui-metric-card-marker'),a=label.getBoundingClientRect(),b=marker.getBoundingClientRect();return {labelWidth:a.width,fontSize:parseFloat(getComputedStyle(label).fontSize),labelRight:a.right,labelBottom:a.bottom,markerX:b.x,markerY:b.y};});
      expect(wideMarker.labelWidth).toBeGreaterThanOrEqual(wideMarker.fontSize-1);
      expect(wideMarker.labelRight<=wideMarker.markerX+1||wideMarker.labelBottom<=wideMarker.markerY+1,'a nearly full-width marker must not overlap the label').toBe(true);
      if(width===1280&&scale===1){
        expect(metrics[1].card.y).toBeCloseTo(metrics[0].card.y,1);
        const position=await page.getByTestId('marked-card').evaluate(card=>{const label=card.querySelector('.xui-metric-card-label').getBoundingClientRect(),marker=card.querySelector('.xui-metric-card-marker').getBoundingClientRect();return {labelRight:label.right,labelY:label.y,markerX:marker.x,markerY:marker.y};});
        expect(position.markerX).toBeGreaterThanOrEqual(position.labelRight);expect(position.markerY).toBeCloseTo(position.labelY,1);
      }
      await info.attach(`${kind}-${mode}-${width}-text-${scale*100}.json`,{body:JSON.stringify(metrics,null,2),contentType:'application/json'});
      await info.attach(`${kind}-${mode}-${width}-text-${scale*100}.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
    }
    if(mode==='system'){
      const before=await page.getByTestId('zero-card').evaluate(node=>getComputedStyle(node).backgroundColor);
      await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');
      await expect.poll(()=>page.getByTestId('zero-card').evaluate(node=>getComputedStyle(node).backgroundColor)).not.toBe(before);
    }
  });

  test(`${kind} MetricCard preserves host updates, marker keyboard action and RTL`,async({page})=>{
    await setup(page,kind);await page.setViewportSize({width:320,height:900});
    const action=page.getByRole('button',{name:'查看说明',exact:true}),update=page.getByRole('button',{name:'更新示例',exact:true});
    await update.focus();await page.keyboard.press('Tab');await expect(action).toBeFocused();await page.keyboard.press('Enter');await expect(page.getByTestId('marker-result')).toHaveText('说明已查看 1 次');
    await page.keyboard.press('Space');await expect(page.getByTestId('marker-result')).toHaveText('说明已查看 2 次');
    expect(await action.evaluate(node=>getComputedStyle(node).outlineStyle)).not.toBe('none');
    await page.evaluate(()=>{window.metricAction=document.querySelector('[data-testid="action-card"] button');});
    await update.click();await expect(page.getByTestId('zero-card').locator('.xui-metric-card-value')).toHaveText('1,234.50');await expect(page.getByTestId('zero-card').locator('.xui-metric-card-label')).toHaveText('更新后的记录数');await expect(page.getByTestId('zero-card').getByText('已同步')).toBeVisible();
    await update.click();await expect(page.getByTestId('zero-card').locator('.xui-metric-card-value')).toHaveText('0');await expect(page.getByTestId('zero-card').locator('.xui-metric-card-marker')).toHaveCount(0);
    expect(await action.evaluate(node=>node===window.metricAction)).toBe(true);
    await expect(page.locator('.xui-metric-card[tabindex],.xui-metric-card[role="button"]')).toHaveCount(0);
    await page.evaluate(()=>{document.documentElement.dir='rtl';});await settle(page);
    const rtl=await page.getByTestId('marked-card').evaluate(card=>{const label=card.querySelector('.xui-metric-card-label').getBoundingClientRect(),marker=card.querySelector('.xui-metric-card-marker').getBoundingClientRect();return {labelLeft:label.left,markerRight:marker.right};});
    expect(rtl.markerRight).toBeLessThanOrEqual(rtl.labelLeft+1);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
  });
}
