import {test as base,expect} from '@playwright/test';

// Uses the existing independent React/native tarball consumers, never source aliases.
const test=base.extend({page:async({page},use,info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await use(page);await info.attach('width-browser-errors.json',{body:JSON.stringify(errors,null,2),contentType:'application/json'});
  expect(errors,'including ResizeObserver feedback-loop errors').toEqual([]);
}});
const table=page=>page.getByRole('table',{name:'合成记录表格',exact:true});
const body=page=>page.locator('#records-table .xui-data-table-body');
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function setup(page,kind){
  await page.goto(`/data-table-${kind}/?widths&size=100`);
  await page.waitForFunction(()=>window.dataTableDemo?.owner.getState().status==='ready');
  await expect(table(page).locator('tbody tr')).toHaveCount(100);await settle(page);
}
async function view(page,mode,hidden=[]){await page.evaluate(({mode,hidden})=>window.dataTableDemo.setColumnView(mode,hidden),{mode,hidden});await settle(page);}
async function measure(page){return body(page).evaluate(node=>{
  const table=node.querySelector('table'),rect=node.getBoundingClientRect(),headers=[...table.querySelectorAll('th')],font=parseFloat(getComputedStyle(document.documentElement).fontSize);
  const box=element=>{const b=element.getBoundingClientRect();return {x:b.x,right:b.right,y:b.y,width:b.width,height:b.height};};
  return {body:{...box(node),clientWidth:node.clientWidth,clientLeft:node.clientLeft,clientTop:node.clientTop,scrollWidth:node.scrollWidth,scrollHeight:node.scrollHeight,clientHeight:node.clientHeight},table:box(table),layout:getComputedStyle(table).tableLayout,headers:headers.map(box),labels:headers.map(th=>th.textContent),rows:[...table.querySelectorAll('tbody tr')].map(tr=>[...tr.children].map(box)),tracks:[...table.querySelectorAll('col')].map(col=>col.style.width),font,probes:{height:node.querySelector('.xui-data-table-widths').getBoundingClientRect().height,visibility:getComputedStyle(node.querySelector('.xui-data-table-widths')).visibility},direction:getComputedStyle(node).direction};
});}
function expected(m){return {'编号':112,'名称':Math.max(12*m.font,Math.min(m.body.clientWidth*.35,28*m.font)),'类型':m.body.clientWidth*.10+m.font,'来源':7*m.font,'操作':120,'范围':160};}
async function assertWidths(page,{all=false}={}){
  // A viewport/column update can schedule a ResizeObserver delivery after React commits.
  await expect.poll(async()=>{const m=await measure(page),widths=expected(m);return Math.max(...m.headers.map((h,i)=>m.labels[i]==='范围'&&!all?0:Math.abs(h.width-widths[m.labels[i]])));},{message:'actual column rectangles match fixed/percentage clamp/calc requested widths'}).toBeLessThan(1.5);
  const m=await measure(page);expect(m.layout).toBe('fixed');expect(m.probes).toEqual({height:0,visibility:'hidden'});
  for(const row of m.rows.filter(row=>row.length===m.headers.length))for(let i=0;i<row.length;i++){
    expect(Math.abs(row[i].width-m.headers[i].width),'every row shares its header track').toBeLessThan(1.5);
    expect(Math.abs(row[i].x-m.headers[i].x),'every row aligns at the same horizontal scroll position').toBeLessThan(1.5);
  }
  await test.info().attach('column-width-rectangles.json',{body:JSON.stringify({body:m.body,table:m.table,labels:m.labels,headers:m.headers,firstRow:m.rows[0],expected:expected(m),direction:m.direction},null,2),contentType:'application/json'});
  return m;
}
for(const kind of ['react','vanilla']){
  test(`${kind} fixed and percentage-math widths resize with the available body, with long content intact`,async({page})=>{
    await setup(page,kind);let m=await assertWidths(page);const initial=m.headers[1].width;
    const text=await table(page).locator('tbody tr').first().locator('td').nth(1).evaluate(cell=>{
      const range=document.createRange();range.selectNodeContents(cell);const cellRect=cell.getBoundingClientRect();const lines=[...range.getClientRects()];return {text:cell.textContent,lines:lines.length,contained:lines.every(r=>r.left>=cellRect.left-1&&r.right<=cellRect.right+1)};
    });expect(text.text).toContain('验证换行');expect(text.lines).toBeGreaterThan(1);expect(text.contained).toBe(true);
    for(const width of [1700,900,390]){await page.setViewportSize({width,height:900});m=await assertWidths(page);}
    expect(Math.abs(m.headers[1].width-initial)).toBeGreaterThan(10);
    expect(m.body.scrollWidth,'narrow tables scroll in their body').toBeGreaterThan(m.body.clientWidth);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),'measurement probes do not escape the document').toBeLessThanOrEqual(1);
    await page.evaluate(()=>document.documentElement.style.fontSize='200%');await assertWidths(page);
  });
  test(`${kind} column visibility and all-sized tracks preserve identities and clear back to automatic layout`,async({page})=>{
    await setup(page,kind);
    await page.evaluate(()=>{window.widthAction=document.querySelector('[data-row-id="1"]');window.widthBody=document.querySelector('#records-table .xui-data-table-body');});
    await view(page,'sized');const full=await assertWidths(page,{all:true});
    const sum=full.headers.reduce((total,column)=>total+column.width,0);expect(Math.abs(full.table.width-sum)).toBeLessThan(1.5);
    await view(page,'sized',['scope','source']);await expect(table(page).getByRole('columnheader')).toHaveText(['编号','名称','类型','操作']);
    const hidden=await assertWidths(page,{all:true});expect(hidden.table.width,'all-sized columns do not stretch to consume spare viewport width').toBeLessThan(hidden.body.clientWidth-20);
    expect(await page.evaluate(()=>window.widthAction===document.querySelector('[data-row-id="1"]')&&window.widthBody===document.querySelector('#records-table .xui-data-table-body'))).toBe(true);
    await view(page,'mixed');await assertWidths(page);await expect(table(page).locator('col')).toHaveCount(6);
    await view(page,'auto');await expect(table(page)).not.toHaveAttribute('data-column-sizing');expect((await measure(page)).layout).toBe('auto');expect((await measure(page)).tracks.every(width=>width==='')).toBe(true);
    await view(page,'sized',['scope','source']);await page.evaluate(()=>window.dataTableDemo.owner.setEmpty(true));await page.waitForFunction(()=>window.dataTableDemo.owner.getState().status==='ready');
    await expect(table(page).locator('tbody td')).toHaveAttribute('colspan','4');await expect(table(page).getByRole('columnheader')).toHaveCount(4);await assertWidths(page,{all:true});
  });
  test(`${kind} measured widths retain sticky alignment in LTR/RTL and recover from a hidden container`,async({page})=>{
    await page.setViewportSize({width:390,height:844});await setup(page,kind);await view(page,'sized');
    for(const direction of ['ltr','rtl']){
      await page.evaluate(direction=>{document.documentElement.dir=direction;},direction);await settle(page);
      await body(page).evaluate(node=>{node.scrollTop=node.scrollHeight/2;node.scrollLeft=getComputedStyle(node).direction==='rtl'?-node.scrollWidth:node.scrollWidth;});await settle(page);
      const m=await assertWidths(page,{all:true}),first=m.headers[0],last=m.headers.at(-1),start=m.body.x+m.body.clientLeft,end=start+m.body.clientWidth;
      expect(Math.abs((direction==='ltr'?first.x:first.right)-(direction==='ltr'?start:end)),'start-sticky column stays at logical start').toBeLessThan(2);
      expect(Math.abs((direction==='ltr'?last.right:last.x)-(direction==='ltr'?end:start)),'end-sticky column stays at logical end').toBeLessThan(2);
      expect(Math.abs(first.y-m.body.y-m.body.clientTop),'sticky header remains at scrollport top').toBeLessThan(2);
    }
    await page.locator('#records-table').evaluate(node=>node.style.display='none');await page.setViewportSize({width:1280,height:800});await settle(page);
    await page.locator('#records-table').evaluate(node=>node.style.display='');await assertWidths(page,{all:true});
    await page.evaluate(()=>window.dataTableDemo.destroy());await page.setViewportSize({width:900,height:700});await settle(page);await expect(page.locator('.xui-data-table-widths')).toHaveCount(0);
  });
}
