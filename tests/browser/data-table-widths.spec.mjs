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
  const root=node.closest('.xui-data-table'),tools=root.querySelector('.xui-data-table-tools'),feedback=root.querySelector('.xui-data-table-feedback'),footer=root.querySelector('.xui-data-table-footer');
  return {chrome:{toolbar:tools&&box(tools),feedback:box(feedback),footer:box(footer),toolbarToTable:tools?table.getBoundingClientRect().top-tools.getBoundingClientRect().bottom:null,footerInViewport:footer.getBoundingClientRect().bottom<=innerHeight},body:{...box(node),clientWidth:node.clientWidth,clientLeft:node.clientLeft,clientTop:node.clientTop,scrollWidth:node.scrollWidth,scrollHeight:node.scrollHeight,clientHeight:node.clientHeight},table:box(table),layout:getComputedStyle(table).tableLayout,headers:headers.map(box),labels:headers.map(th=>th.textContent),rows:[...table.querySelectorAll('tbody tr')].map(tr=>[...tr.children].map(box)),tracks:[...table.querySelectorAll('col')].map(col=>col.style.width),font,probes:{height:node.querySelector('.xui-data-table-widths').getBoundingClientRect().height,visibility:getComputedStyle(node.querySelector('.xui-data-table-widths')).visibility},direction:getComputedStyle(node).direction};
});}
function expected(m){return {'编号':112,'名称':Math.max(12*m.font,Math.min(m.body.clientWidth*.35,28*m.font)),'类型':m.body.clientWidth*.10+m.font,'来源':7*m.font,'操作':120,'范围':160};}
function widthError(m,{all,fluid}){
  const widths=expected(m),minimumTotal=m.labels.reduce((sum,label)=>sum+widths[label],0),errors=[];
  for(let i=0;i<m.headers.length;i++)if(all||m.labels[i]!==fluid){
    const minimum=widths[m.labels[i]];
    errors.push(Math.abs(parseFloat(m.tracks[i])-minimum));
    errors.push(all&&minimumTotal<m.body.clientWidth?Math.max(0,minimum-m.headers[i].width):Math.abs(m.headers[i].width-minimum));
  }
  if(all)errors.push(Math.abs(m.table.width-Math.max(m.body.clientWidth,minimumTotal)));
  return Math.max(...errors);
}
function assertRowAlignment(m){
  let width=0,position=0;
  for(const row of m.rows.filter(row=>row.length===m.headers.length))for(let i=0;i<row.length;i++){
    width=Math.max(width,Math.abs(row[i].width-m.headers[i].width));
    position=Math.max(position,Math.abs(row[i].x-m.headers[i].x));
  }
  expect(width,'every row shares its header track').toBeLessThan(1.5);
  expect(position,'every row aligns at the same horizontal scroll position').toBeLessThan(1.5);
}
async function assertWidths(page,{all=false,fluid='范围'}={}){
  // Font/viewport changes can animate the shell width. A probe update alone does
  // not prove the resulting table geometry has caught up in the same frame.
  let m;
  try{
    await expect.poll(async()=>{m=await measure(page);return widthError(m,{all,fluid});},{message:'resolved column minima and actual tracks agree with the available body'}).toBeLessThan(1.5);
  }finally{
    if(m)await test.info().attach('column-width-rectangles.json',{body:JSON.stringify({chrome:m.chrome,body:m.body,table:m.table,labels:m.labels,headers:m.headers,firstRow:m.rows[0],tracks:m.tracks,expected:expected(m),direction:m.direction},null,2),contentType:'application/json'});
  }
  expect(m.layout).toBe('fixed');expect(m.probes).toEqual({height:0,visibility:'hidden'});
  const widths=expected(m),minimumTotal=m.labels.reduce((sum,label)=>sum+widths[label],0);
  for(let i=0;i<m.headers.length;i++)if(all||m.labels[i]!==fluid){
    const minimum=widths[m.labels[i]];
    expect(m.headers[i].width,'a configured column is never compressed below its minimum').toBeGreaterThanOrEqual(minimum-1.5);
    if(!all||minimumTotal>=m.body.clientWidth)expect(Math.abs(m.headers[i].width-minimum),'only spare width stretches configured tracks').toBeLessThan(1.5);
  }
  if(all)expect(Math.abs(m.table.width-Math.max(m.body.clientWidth,minimumTotal)),'all-sized table fills the body or preserves the larger sum of minima').toBeLessThan(1.5);
  assertRowAlignment(m);
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
    const hidden=await assertWidths(page,{all:true});expect(Math.abs(hidden.table.width-hidden.body.clientWidth),'all-sized columns share spare viewport width after columns are hidden').toBeLessThan(1.5);
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

// Both all-sized minima and the ordinary fluid-content configuration fill the
// same public consumer without host CSS or a synthetic filler column.
for(const kind of ['react','vanilla']){
  test(`${kind} all-sized minima and optional fluid columns both fill the frame`,async({page},info)=>{
    await page.setViewportSize({width:1700,height:1000});
    await page.goto(`/data-table-${kind}/?internal&widths&fluid-content&column-mode=sized&hide-column=source&size=20`);
    await page.waitForFunction(()=>window.dataTableDemo?.owner.getState().status==='ready');await settle(page);
    const fixed=await assertWidths(page,{all:true});
    expect(Math.abs(fixed.table.width-fixed.body.clientWidth)).toBeLessThan(1.5);
    const frame=await page.locator('#records-table .xui-data-table-frame').boundingBox();
    expect(Math.abs(fixed.body.x-frame.x)).toBeLessThan(2);
    expect(Math.abs(fixed.body.width-frame.width)).toBeLessThan(3);
    await info.attach('all-sized-public-consumer.png',{body:await page.screenshot(),contentType:'image/png'});
    await view(page,'mixed',['source']);const fluid=await assertWidths(page,{fluid:'名称'});
    expect(Math.abs(fluid.table.x-fluid.body.x-fluid.body.clientLeft)).toBeLessThan(1.5);
    expect(Math.abs(fluid.table.width-fluid.body.clientWidth),'the omitted content width consumes the available scrollport').toBeLessThan(1.5);
    for(let i=0;i<fluid.labels.length;i++)if(fluid.labels[i]!=='名称')expect(Math.abs(fluid.headers[i].width-expected(fluid)[fluid.labels[i]]),'unconfigured content receives spare width before configured minima').toBeLessThan(1.5);
    await info.attach('fluid-column-public-consumer.png',{body:await page.screenshot(),contentType:'image/png'});
  });
  for(const width of [320,390,1280])for(const layout of ['natural','workspace'])for(const theme of ['light','dark','system'])test(`${kind} ${width}px ${layout} ${theme} automatic, mixed and all-sized columns cover the scrollport`,async({page},info)=>{
    await page.setViewportSize({width,height:1000});
    await page.addInitScript(()=>localStorage.setItem('ui.theme.mode',new URLSearchParams(location.search).get('theme')??'light'));
    await page.emulateMedia({colorScheme:theme==='dark'?'dark':'light'});
    await page.goto(`/data-table-${kind}/?internal&layout=${layout}&theme=${theme}&size=100`);
    await page.waitForFunction(()=>window.dataTableDemo?.owner.getState().status==='ready');await settle(page);
    for(const mode of ['auto','mixed','sized']){
      await view(page,mode,['source']);
      for(const scale of ['100%','200%']){
        await page.evaluate(scale=>document.documentElement.style.fontSize=scale,scale);await settle(page);
        const m=mode==='auto'?await measure(page):await assertWidths(page,{all:mode==='sized'});
        expect(m.table.width,'table never stops short of the available scrollport').toBeGreaterThanOrEqual(m.body.clientWidth-1.5);
        expect(Math.abs(m.table.x-m.body.x-m.body.clientLeft)).toBeLessThan(1.5);
        if(m.body.scrollWidth<=m.body.clientWidth+1)expect(Math.abs(m.table.right-m.body.x-m.body.clientLeft-m.body.clientWidth)).toBeLessThan(1.5);
        if(mode==='auto')assertRowAlignment(m);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
        await info.attach(`${layout}-${theme}-${mode}-${scale}-bounds.json`,{body:JSON.stringify({chrome:m.chrome,body:m.body,table:m.table,headers:m.headers}),contentType:'application/json'});
      }
    }
  });
}
