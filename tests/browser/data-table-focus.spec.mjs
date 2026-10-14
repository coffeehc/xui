import {test,expect} from '@playwright/test';

for(const kind of ['react','vanilla'])test(`${kind} first sortable header keeps all keyboard focus ring edges inside the table scrollport`,async({page},info)=>{
 await page.setViewportSize({width:1280,height:800});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
 await page.addInitScript(()=>sessionStorage.setItem('ui.theme.mode','dark'));
 await page.goto(`/data-table-${kind}/?widths&column-mode=sized&hide-column=source&size=12&internal&layout=workspace`);
 await page.waitForFunction(()=>window.dataTableDemo?.owner.getState().status==='ready');
 const header=page.locator('#records-table thead th').first();
 await header.evaluate(node=>{node.setAttribute('aria-sort','ascending');const button=document.createElement('button');button.type='button';button.className='xui-sort-button';button.setAttribute('aria-label','按编号排序');button.textContent='编号';node.replaceChildren(button);});
 const sort=page.getByRole('button',{name:'按编号排序',exact:true});
 // Use keyboard navigation to make :focus-visible and keep the real public
 // button markup inside the actual workspace DataTable scroll viewport.
 await sort.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await expect(sort).toBeFocused();
 const focus=await sort.evaluate(button=>{
  const body=button.closest('.xui-data-table-body'),rect=button.getBoundingClientRect(),scroll=body.getBoundingClientRect(),style=getComputedStyle(button),extent=parseFloat(style.outlineWidth)+parseFloat(style.outlineOffset);
  return {visible:button.matches(':focus-visible'),outline:{style:style.outlineStyle,width:parseFloat(style.outlineWidth),offset:parseFloat(style.outlineOffset)},ring:{top:rect.top-extent,right:rect.right+extent,bottom:rect.bottom+extent,left:rect.left-extent},scrollport:{top:scroll.top+body.clientTop,right:scroll.left+body.clientLeft+body.clientWidth,bottom:scroll.top+body.clientTop+body.clientHeight,left:scroll.left+body.clientLeft}};
 });
 await info.attach('sortable-header-focus-geometry.json',{body:JSON.stringify(focus,null,2),contentType:'application/json'});
 expect(focus.visible).toBe(true);expect(focus.outline).toEqual({style:'solid',width:2,offset:2});
 expect(focus.ring.top,'top focus edge remains visible').toBeGreaterThanOrEqual(focus.scrollport.top);
 expect(focus.ring.right,'right focus edge remains visible').toBeLessThanOrEqual(focus.scrollport.right);
 expect(focus.ring.bottom,'bottom focus edge remains visible').toBeLessThanOrEqual(focus.scrollport.bottom);
 expect(focus.ring.left,'left focus edge remains visible').toBeGreaterThanOrEqual(focus.scrollport.left);
 await info.attach('sortable-header-keyboard-focus.png',{body:await page.screenshot(),contentType:'image/png'});
});
