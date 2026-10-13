import {chooseSelect} from './select-interaction.mjs';
import {test as base,expect} from '@playwright/test';

// Exercise the independent, formal-tarball consumers. Do not repair their layout
// with injected CSS, measured header offsets, a second owner, or a fixed footer.
// Syntax/collection checks are not browser passes; run on a permitted CI host.
const test=base.extend({page:async({page},use,info)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{
    if(message.type()==='error'||message.type()==='warning'&&/hydration|uncaught|invalid hook|cannot update|did not match|ResizeObserver.*(?:loop|undelivered)/i.test(message.text()))errors.push(message.text());
  });
  await use(page);
  await info.attach('layout-browser-errors.json',{body:JSON.stringify(errors,null,2),contentType:'application/json'});
  expect(errors,'browser errors, including ResizeObserver feedback loops').toEqual([]);
}});

const kinds=['react','vanilla'];
const desktop={width:1280,height:800};
const mobile={width:390,height:844};
const selectors={
  shell:'.xui-shell',main:'.xui-shell-main',content:'.xui-shell-content',
  header:'[data-testid="record-header"]',toolbar:'[data-testid="record-filters"]',
  outer:'#records-table',frame:'#records-table .xui-data-table-frame',
  tools:'#records-table .xui-data-table-tools',body:'#records-table .xui-data-table-body',
  grid:'#records-table > .xui-data-table-frame > .xui-data-table-body > table',thead:'#records-table > .xui-data-table-frame > .xui-data-table-body > table > thead',stickyHeader:'#records-table > .xui-data-table-frame > .xui-data-table-body > table > thead th:first-child',footer:'#records-table .xui-data-table-footer',
  count:'#records-table .xui-data-table-count',sizeField:'#records-table .xui-data-table-page-size',
  size:'#records-table .xui-data-table-page-size button[role=combobox]',pagination:'#records-table .xui-pagination',
};
const table=page=>page.getByRole('table',{name:'合成记录表格',exact:true});
// Placeholder/loading cells span all columns. Real rows still have multiple cells
// when the optional business-action column has been removed.
const rows=page=>table(page).locator('tbody > tr').filter({has:page.locator('td:nth-child(2)')});
const body=page=>page.locator(selectors.body);
const size=page=>page.getByRole('combobox',{name:'每页条数',exact:true});
const next=page=>page.getByRole('button',{name:'下一页',exact:true});
const previous=page=>page.getByRole('button',{name:'上一页',exact:true});
const search=page=>page.getByRole('searchbox',{name:'搜索记录',exact:true});
const near=(actual,expected,label)=>expect(Math.abs(actual-expected),`${label}: ${actual} vs ${expected} CSS px`).toBeLessThanOrEqual(1.5);
const state=page=>page.evaluate(()=>window.dataTableDemo.owner.getState());
async function settle(page){
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
}
async function ready(page){
  await expect.poll(async()=>await page.evaluate(()=>window.dataTableDemo?.owner.getState().status)).toBe('ready');
  await settle(page);
}
async function setup(page,kind,flags=[],viewport=desktop){
  await page.setViewportSize(viewport);
  await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});
  await page.addInitScript(()=>localStorage.setItem('ui.theme.mode','light'));
  await page.goto(`/data-table-${kind}/?${flags.join('&')}`);
  await ready(page);
}
async function metrics(page){
  return page.evaluate(selectors=>{
    const measure=node=>{
      if(!node||!node.getClientRects().length)return null;
      const r=node.getBoundingClientRect(),s=getComputedStyle(node);
      return {
        x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,
        clientWidth:node.clientWidth,clientHeight:node.clientHeight,contentHeight:node.clientHeight-(parseFloat(s.paddingTop)||0)-(parseFloat(s.paddingBottom)||0),contentWidth:node.clientWidth-(parseFloat(s.paddingLeft)||0)-(parseFloat(s.paddingRight)||0),boxSizing:s.boxSizing,
        scrollWidth:node.scrollWidth,scrollHeight:node.scrollHeight,
        scrollTop:node.scrollTop,scrollLeft:node.scrollLeft,
        overflowX:s.overflowX,overflowY:s.overflowY,position:s.position,display:s.display,
        minBlockSize:s.minBlockSize,maxBlockSize:s.maxBlockSize,flex:s.flex,
        borderTop:parseFloat(s.borderTopWidth),borderBottom:parseFloat(s.borderBottomWidth),
        borderLeft:parseFloat(s.borderLeftWidth),borderRight:parseFloat(s.borderRightWidth),
        paddingTop:parseFloat(s.paddingTop),paddingBottom:parseFloat(s.paddingBottom),
        scrollPaddingTop:parseFloat(s.scrollPaddingTop)||0,scrollPaddingBottom:parseFloat(s.scrollPaddingBottom)||0,
      };
    };
    const footer=document.querySelector(selectors.footer),grid=document.querySelector(selectors.grid);
    const last=grid?.querySelector('tbody tr:last-child');
    return {
      viewport:{width:innerWidth,height:innerHeight},document:measure(document.scrollingElement),
      ...Object.fromEntries(Object.entries(selectors).map(([name,selector])=>[name,measure(document.querySelector(selector))])),
      host:measure(document.querySelector(selectors.outer)?.parentElement),
      firstRow:measure(grid?.querySelector('tbody tr:first-child')),
      lastRow:measure(last),lastCellBorders:last?[...last.children].map(cell=>parseFloat(getComputedStyle(cell).borderBottomWidth)):[],
      footerChildren:footer?[...footer.children].map(measure).filter(Boolean):[],
      toolbarInFrame:!!document.querySelector(selectors.frame)?.contains(document.querySelector(selectors.toolbar)),
    };
  },selectors);
}
async function capture(page,label){
  const m=await metrics(page);
  await test.info().attach(`${label}-rectangles.json`,{body:JSON.stringify(m,null,2),contentType:'application/json'});
  return m;
}
function noVerticalScroll(m,key){
  expect(m[key].scrollHeight,`${key} has no competing vertical scroll range`).toBeLessThanOrEqual(m[key].clientHeight+1.5);
}
function noHorizontalEscape(m,key){
  expect(m[key].scrollWidth,`${key} has no horizontal escape`).toBeLessThanOrEqual(m[key].clientWidth+1.5);
}
function sameRect(before,after,key){
  for(const dimension of ['x','y','width','height'])near(after[key][dimension],before[key][dimension],`${key} ${dimension} stays put`);
}
function insideFrame(m,key){
  expect(m[key].x,`${key} begins inside the frame`).toBeGreaterThanOrEqual(m.frame.x+m.frame.borderLeft-1.5);
  expect(m[key].right,`${key} ends inside the frame`).toBeLessThanOrEqual(m.frame.right-m.frame.borderRight+1.5);
  expect(m[key].y,`${key} begins below the frame's top border`).toBeGreaterThanOrEqual(m.frame.y+m.frame.borderTop-1.5);
  expect(m[key].bottom,`${key} ends above the frame's bottom border`).toBeLessThanOrEqual(m.frame.bottom-m.frame.borderBottom+1.5);
}
function assertFrame(m){
  near(m.outer.y,m.frame.y,'frame begins at the outer component');
  near(m.outer.bottom,m.frame.bottom,'outer component ends with its frame');
  near(m.footer.bottom,m.frame.bottom-m.frame.borderBottom,'footer closes the frame');
  near(m.footer.y,m.body.bottom,'footer follows the body without a blank gap');
  expect(m.frame.borderTop,'one enclosing frame').toBeGreaterThan(0);
  expect(m.outer.borderTop+m.outer.borderBottom,'no second outer border').toBe(0);
  expect(m.body.borderTop+m.body.borderBottom,'scroll region does not add another frame').toBe(0);
  expect(m.footer.borderTop,'footer retains its information boundary').toBeGreaterThan(0);
  expect(['fixed','absolute','sticky'],'footer belongs to ordinary layout flow').not.toContain(m.footer.position);
  expect(m.body.clientHeight,'body never collapses').toBeGreaterThan(0);
  for(const key of ['body','footer',...(m.tools?['tools']:[])])insideFrame(m,key);
  for(const key of ['outer','frame']){noVerticalScroll(m,key);noHorizontalEscape(m,key);}
}
async function assertFooter(page,m,{pagination=true,compact=true}={}){
  await expect(page.locator(selectors.footer)).toHaveCount(1);
  await expect(page.locator(selectors.count)).toHaveCount(1);
  await expect(size(page)).toHaveCount(pagination?1:0);
  await expect(page.locator(selectors.footer).getByRole('combobox',{name:'每页条数',exact:true})).toHaveCount(pagination?1:0);
  if(pagination){
    await expect(size(page)).toHaveText(String((await state(page)).pageSize));
    expect(await page.locator(`[id=${JSON.stringify(await size(page).getAttribute('aria-controls'))}] [role=option]`).allTextContents()).toEqual(['20','50','100']);
  }
  if(compact){
    const centers=m.footerChildren.map(child=>child.y+child.height/2);
    expect(Math.max(...centers)-Math.min(...centers),'desktop count, page size and pagination share one line').toBeLessThanOrEqual(1.5);
    const tallest=Math.max(...m.footerChildren.map(child=>child.height));
    near(m.footer.height,tallest+m.footer.paddingTop+m.footer.paddingBottom+m.footer.borderTop+m.footer.borderBottom,'desktop footer has only one control row');
    if(pagination){
      near(m.size.y+m.size.height/2,m.sizeField.y+m.sizeField.height/2,'page-size label and select remain inline');
      expect(m.size.width,'page-size select is compact rather than full width').toBeLessThan(m.footer.width/3);
    }
  }
}
async function assertControls(page,m,{searchPresent=true,actionsPresent=true,internal=false}={}){
  await expect(search(page)).toHaveCount(searchPresent?1:0);
  await expect(page.getByRole('group',{name:'记录筛选',exact:true})).toHaveCount(searchPresent?1:0);
  for(const label of ['类型','范围','来源'])await expect(page.getByRole('combobox',{name:label,exact:true})).toHaveCount(searchPresent?1:0);
  await expect(page.getByRole('button',{name:'清空筛选',exact:true})).toHaveCount(searchPresent?1:0);
  for(const label of ['刷新','模拟失败','恢复记录','取消请求'])await expect(page.getByRole('button',{name:label,exact:true})).toHaveCount(actionsPresent?1:0);
  await expect(table(page).getByRole('columnheader')).toHaveText(actionsPresent?['编号','名称','类型','范围','来源','操作']:['编号','名称','类型','范围','来源']);
  await expect(page.getByRole('button',{name:/^查看记录 \d+$/})).toHaveCount(actionsPresent?await rows(page).count():0);
  if(searchPresent&&internal){
    expect(m.toolbarInFrame,'internal controls belong inside the enclosing frame').toBe(true);
    expect(m.toolbar.y).toBeGreaterThanOrEqual(m.frame.y+m.frame.borderTop-1.5);
    expect(m.toolbar.bottom).toBeLessThanOrEqual(m.body.y+1.5);
    await expect(page.locator('.xui-shell-page-toolbar:visible')).toHaveCount(0);
    await expect(page.locator('#records-table > .xui-data-table-tools:visible')).toHaveCount(0);
  }else if(searchPresent){
    expect(m.toolbarInFrame).toBe(false);
    expect(m.toolbar.bottom).toBeLessThanOrEqual(m.outer.y+1.5);
    await expect(page.locator('.xui-shell-page-toolbar:visible')).toHaveCount(1);
    expect(await page.locator('.xui-shell-page-toolbar:visible').evaluate(node=>parseFloat(getComputedStyle(node).borderBottomWidth)),'external toolbar adds no duplicate line').toBe(0);
  }else{
    expect(m.toolbar).toBeNull();
    await expect(page.locator('.xui-shell-page-toolbar:visible')).toHaveCount(0);
    await expect(page.locator('#records-table .xui-data-table-tools:visible')).toHaveCount(0);
  }
}
async function assertShort(page,count,{label=`short-${count}`,pagination=true}={}){
  await expect(rows(page)).toHaveCount(count);await settle(page);
  const m=await capture(page,label);assertFrame(m);
  for(const key of ['document','main','content','body'])noVerticalScroll(m,key);
  for(const key of ['document','main','content'])noHorizontalEscape(m,key);
  expect(m.outer.height,'short content does not fill the bounded parent').toBeLessThan(m.content.contentHeight-m.footer.height);
  // All desktop columns fit, so there is no horizontal scrollbar to include.
  near(m.body.height,m.grid.height,'body follows the actual table rather than a workspace minimum');
  near(m.lastRow.bottom,m.body.bottom,'last short row meets the footer boundary');
  expect(m.lastCellBorders.every(width=>width===0),'last row does not duplicate the footer separator').toBe(true);
  expect(m.lastRow.borderBottom,'row itself adds no duplicate separator').toBe(0);
  expect(m.footer.bottom).toBeLessThanOrEqual(m.viewport.height+1.5);
  await expect(page.locator(selectors.footer)).toBeInViewport({ratio:1});
  await assertFooter(page,m,{pagination});
  return m;
}
async function assertBounded(page,count,{label=`bounded-${count}`,layout='natural',compact=true,pagination=true}={}){
  await expect(rows(page)).toHaveCount(count);await settle(page);
  const m=await capture(page,label);assertFrame(m);
  for(const key of ['document','main','content']){noVerticalScroll(m,key);noHorizontalEscape(m,key);}
  near(m.outer.height,m.content.contentHeight,'long table caps at the allocated content box height');
  near(m.outer.width,m.content.contentWidth,'long table fills the allocated content box width');
  expect(m.body.scrollHeight,'long rows genuinely overflow the body').toBeGreaterThan(m.body.clientHeight+1.5);
  expect(m.body.overflowY).toBe('auto');
  // Test the measured cap, not a particular min-block-size CSS strategy. An
  // intrinsic minimum must preserve chrome and an actually usable body viewport.
  await expect(page.locator(selectors.outer)).toHaveAttribute('data-layout',layout);
  expect(m.footer.bottom,'footer stays inside the viewport').toBeLessThanOrEqual(m.viewport.height+1.5);
  await expect(page.locator(selectors.footer)).toBeInViewport({ratio:1});
  if(pagination)await expect(size(page)).toBeInViewport({ratio:1});
  await assertFooter(page,m,{pagination,compact});
  return m;
}
async function scrollBodyToEnd(page){
  const before=await metrics(page);
  await body(page).evaluate(node=>{node.scrollTop=0;});await settle(page);
  await body(page).hover();await page.mouse.wheel(0,260);
  await expect.poll(()=>body(page).evaluate(node=>node.scrollTop)).toBeGreaterThan(0);
  await body(page).evaluate(node=>{node.scrollTop=node.scrollHeight;});
  await expect.poll(()=>body(page).evaluate(node=>node.scrollHeight-node.clientHeight-node.scrollTop)).toBeLessThanOrEqual(1.5);
  await settle(page);const after=await metrics(page);
  for(const key of ['header','outer','frame','footer'])sameRect(before,after,key);
  if(before.toolbar)sameRect(before,after,'toolbar');
  for(const key of ['document','main','content'])near(after[key].scrollTop,before[key].scrollTop,`${key} does not scroll with body`);
  expect(after.lastRow.bottom,'last record can be fully reached').toBeLessThanOrEqual(after.body.bottom+1.5);
  expect(after.lastRow.y).toBeGreaterThanOrEqual(after.body.y-1.5);
  await expect(page.locator(selectors.footer)).toBeInViewport({ratio:1});
  return after;
}
async function reachable(control){
  await control.focus();await expect(control).toBeFocused();await expect(control).toBeInViewport({ratio:1});
  expect(await control.evaluate(node=>{
    const r=node.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return !!hit&&(node===hit||node.contains(hit));
  }),'focused control is not clipped or covered').toBe(true);
}
async function usableBodyMinimum(page){
  // A sticky header plus a whole edge row must fit. Scroll padding is part of
  // the browser's real geometry, rather than another hard-coded header offset.
  await expect.poll(async()=>{
    const m=await metrics(page);
    const required=Math.min(m.grid.height,m.thead.height+Math.max(m.firstRow.height,m.lastRow.height)+m.body.scrollPaddingTop+m.body.scrollPaddingBottom);
    return required-m.body.clientHeight;
  },{message:'measured body viewport fits the sticky header, an edge row and scroll padding'}).toBeLessThanOrEqual(1.5);
  await settle(page);
}
async function clickEdgeRowAction(page,edge,label){
  const row=edge==='first'?rows(page).first():rows(page).last();
  const id=await row.locator('td').first().innerText();
  const action=page.getByRole('button',{name:`查看记录 ${id}`,exact:true});
  const before=await page.evaluate(()=>window.dataTableDemo.getActions());
  // Only move the real body/ancestors. Do not use forced locator clicks or
  // scroll the action itself to conceal a row trapped behind the sticky header.
  await body(page).scrollIntoViewIfNeeded();
  await body(page).evaluate((node,edge)=>{node.scrollTop=edge==='first'?0:node.scrollHeight;},edge);
  await expect.poll(()=>body(page).evaluate((node,edge)=>edge==='first'?node.scrollTop:node.scrollHeight-node.clientHeight-node.scrollTop,edge)).toBeLessThanOrEqual(1.5);
  await settle(page);await expect(action).toBeInViewport({ratio:1});
  const point=await action.evaluate(node=>{
    const r=node.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);
    return {x,y,hit:!!hit&&(node===hit||node.contains(hit)),hitTag:hit?.tagName,hitLabel:hit?.getAttribute('aria-label'),top:r.top,bottom:r.bottom};
  });
  const m=await capture(page,`${label}-${edge}-action`);assertFrame(m);
  await test.info().attach(`${label}-${edge}-hit-test.json`,{body:JSON.stringify(point,null,2),contentType:'application/json'});
  expect(point.top,'whole edge action sits below the sticky column header').toBeGreaterThanOrEqual(m.stickyHeader.bottom-1.5);
  expect(point.bottom,'whole edge action stays inside the body viewport').toBeLessThanOrEqual(m.body.bottom+1.5);
  expect(point.hit,'elementFromPoint reaches the actual row action, not a sticky header or clipping ancestor').toBe(true);
  await page.mouse.click(point.x,point.y);
  await expect(page.getByLabel('查看结果',{exact:true})).toHaveText(`已查看 ${id}`);
  expect(await page.evaluate(()=>window.dataTableDemo.getActions()),'the real pointer click invokes exactly the requested record action').toEqual([...before,id]);
}
async function enlargedFrame(page,label){
  await usableBodyMinimum(page);
  const m=await capture(page,label);assertFrame(m);
  expect(m.content.clientHeight,'public shell minimum preserves an allocated content region').toBeGreaterThan(0);
  expect(m.body.scrollHeight).toBeGreaterThan(m.body.clientHeight);
  expect(m.main.scrollHeight>m.main.clientHeight+1.5||m.content.scrollHeight>m.content.clientHeight+1.5,'oversized but fully framed chrome uses an ancestor fallback').toBe(true);
  noHorizontalEscape(m,'document');
  await assertControls(page,m,{internal:true});await assertFooter(page,m,{compact:false});
  return m;
}

for(const kind of kinds){
  // Full optional-control cross product, with every fixture traversing 0, long,
  // one, and long again. Both data owners exercise the same public component.
  for(const source of ['local','server'])for(const searchPresent of [true,false])for(const actionsPresent of [true,false]){
    test(`${kind} natural ${source}, search=${searchPresent}, actions=${actionsPresent}: empty/long/one reflow without blank height`,async({page})=>{
      const flags=['empty',...(source==='local'?['local']:[]),...(!searchPresent?['no-search']:[]),...(!actionsPresent?['no-actions']:[])];
      await setup(page,kind,flags);
      await expect(page.locator(selectors.outer)).toHaveAttribute('data-layout','natural');
      await expect(page.locator(selectors.shell)).toHaveAttribute('data-scroll-mode','workspace');
      const empty=await assertShort(page,0,{label:'initial-empty'});
      await assertControls(page,empty,{searchPresent,actionsPresent});
      await expect(table(page).getByText('还没有记录',{exact:true})).toBeVisible();
      await expect(page.locator(selectors.count)).toHaveText('显示 0 条，共 0 条');
      await expect(previous(page)).toBeDisabled();await expect(next(page)).toBeDisabled();
      await page.evaluate(()=>window.dataTableDemo.owner.setEmpty(false));await ready(page);
      const full=await assertBounded(page,20);await scrollBodyToEnd(page);
      await page.evaluate(()=>window.dataTableDemo.owner.filter('search','记录 125'));await ready(page);
      const one=await assertShort(page,1,{label:'single-filtered-row'});
      await expect(rows(page).first().locator('td').first()).toHaveText('125');
      await expect(page.locator(selectors.count)).toHaveText('显示 1 条，共 1 条');
      await assertControls(page,one,{searchPresent,actionsPresent});
      sameRect(full,one,'header');if(searchPresent)sameRect(full,one,'toolbar');
      await page.evaluate(()=>window.dataTableDemo.owner.clear());await ready(page);
      const restored=await assertBounded(page,20,{label:'restored-long'});
      near(restored.outer.height,full.outer.height,'returning rows recover the original cap');
      await scrollBodyToEnd(page);
    });
  }

  for(const internal of [false,true])test(`${kind} natural narrow ${internal?'internal':'external'} toolbar: only the long body scrolls`,async({page})=>{
    await setup(page,kind,['size=100',...(internal?['internal']:[])],mobile);
    const m=await assertBounded(page,100,{label:'narrow-long',compact:false});
    await assertControls(page,m,{internal});
    if(internal)expect(m.tools.height,'internal tools contain all wrapped controls').toBeGreaterThanOrEqual(m.toolbar.height);
    expect(m.body.scrollWidth,'wide columns scroll in the body on a narrow screen').toBeGreaterThan(m.body.clientWidth);
    await scrollBodyToEnd(page);
    await body(page).evaluate(node=>{node.scrollLeft=node.scrollWidth;});await settle(page);
    const scrolled=await capture(page,'narrow-both-axes');
    sameRect(m,scrolled,'footer');noHorizontalEscape(scrolled,'document');
    await expect(size(page)).toBeInViewport({ratio:1});await expect(next(page)).toBeInViewport({ratio:1});
  });

  test(`${kind} natural internal toolbar at 200% text: complete frame and genuinely clickable edge rows`,async({page})=>{
    await setup(page,kind,['internal','long','size=100','nested-feedback'],mobile);
    await expect(page.getByRole('table',{name:'辅助表格',exact:true})).toBeVisible();
    await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});await settle(page);
    await expect(page.locator(selectors.outer)).toHaveAttribute('data-layout','natural');
    await enlargedFrame(page,'natural-enlarged-before-focus');
    // Ancestors can scroll, but all chrome remains inside the component's frame.
    for(const control of [page.getByRole('button',{name:'刷新',exact:true}),search(page),page.getByRole('combobox',{name:'来源',exact:true}),size(page),next(page)])await reachable(control);
    await clickEdgeRowAction(page,'first','natural-enlarged');
    await clickEdgeRowAction(page,'last','natural-enlarged');
    await reachable(size(page));await reachable(next(page));
    const after=await capture(page,'natural-enlarged-footer');assertFrame(after);noHorizontalEscape(after,'document');
  });

  test(`${kind} natural layout measurements recover from font changes and hidden resizes without remounting`,async({page})=>{
    await setup(page,kind,['internal','long','local','size=100'],mobile);
    const originalBody=await body(page).elementHandle();
    const originalFrame=await page.locator(selectors.frame).elementHandle();
    const originalFont=await page.evaluate(()=>({value:document.documentElement.style.getPropertyValue('font-size'),priority:document.documentElement.style.getPropertyPriority('font-size')}));
    // Keep the inspected-result text identical in baseline and restored phases,
    // so any difference measures layout recovery rather than header text wrap.
    await clickEdgeRowAction(page,'last','observer-before-baseline');
    await page.evaluate(()=>{for(const node of [document.scrollingElement,document.querySelector('.xui-shell-main'),document.querySelector('.xui-shell-content')])node.scrollTop=0;});
    const baseline=await assertBounded(page,100,{label:'observer-baseline',compact:false});
    await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
    const enlarged=await enlargedFrame(page,'observer-enlarged');
    expect(enlarged.thead.height,'font scaling actually changes the observed header geometry').toBeGreaterThan(baseline.thead.height);
    expect(enlarged.grid.height,'font scaling actually changes the observed row geometry').toBeGreaterThan(baseline.grid.height);
    await clickEdgeRowAction(page,'first','observer-enlarged');await clickEdgeRowAction(page,'last','observer-enlarged');
    await page.evaluate(original=>{
      if(original.value)document.documentElement.style.setProperty('font-size',original.value,original.priority);
      else document.documentElement.style.removeProperty('font-size');
      for(const node of [document.scrollingElement,document.querySelector('.xui-shell-main'),document.querySelector('.xui-shell-content')])node.scrollTop=0;
    },originalFont);
    await expect.poll(async()=>Math.abs((await metrics(page)).body.height-baseline.body.height),{message:'font restoration releases the enlarged intrinsic body floor'}).toBeLessThanOrEqual(1.5);
    const restored=await assertBounded(page,100,{label:'observer-font-restored',compact:false});
    for(const key of ['outer','frame','body','footer'])near(restored[key].height,baseline[key].height,`${key} recovers after font restoration`);
    // Change font and width while unmeasurable; showing the same nodes must
    // resume measurements instead of retaining zero or stale cached heights.
    await page.locator(selectors.outer).evaluate(node=>{node.style.display='none';});
    await expect(page.locator(selectors.outer)).toBeHidden();
    await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
    await page.setViewportSize({width:430,height:844});await settle(page);
    await page.locator(selectors.outer).evaluate(node=>{node.style.removeProperty('display');});
    await expect(page.locator(selectors.outer)).toBeVisible();
    await enlargedFrame(page,'observer-shown-after-hidden-resize');
    expect(await body(page).evaluate((node,original)=>node===original,originalBody),'body node is retained across font and visibility changes').toBe(true);
    expect(await page.locator(selectors.frame).evaluate((node,original)=>node===original,originalFrame),'frame node is retained across font and visibility changes').toBe(true);
    await clickEdgeRowAction(page,'first','observer-shown');await clickEdgeRowAction(page,'last','observer-shown');
    await reachable(size(page));await reachable(next(page));
    await page.evaluate(original=>{
      if(original.value)document.documentElement.style.setProperty('font-size',original.value,original.priority);
      else document.documentElement.style.removeProperty('font-size');
      for(const node of [document.scrollingElement,document.querySelector('.xui-shell-main'),document.querySelector('.xui-shell-content')])node.scrollTop=0;
    },originalFont);
    await page.setViewportSize(mobile);
    await expect.poll(async()=>Math.abs((await metrics(page)).body.height-baseline.body.height),{message:'a second restoration does not retain hidden-state or large-font measurements'}).toBeLessThanOrEqual(1.5);
    await assertBounded(page,100,{label:'observer-final-restored',compact:false});
    // The observer minimum must not turn one/zero-row states into a fixed-height
    // body after it has seen a long, enlarged, temporarily hidden table.
    await page.setViewportSize(desktop);
    await page.evaluate(()=>window.dataTableDemo.owner.filter('search','记录 125'));await ready(page);
    await assertShort(page,1,{label:'observer-final-one'});
    await page.evaluate(()=>window.dataTableDemo.owner.setEmpty(true));await ready(page);
    await assertShort(page,0,{label:'observer-final-empty'});
    await originalBody.dispose();await originalFrame.dispose();
  });

  test(`${kind} natural internal toolbar: one enclosing frame follows short and long content`,async({page})=>{
    await setup(page,kind,['internal','local','empty']);
    let m=await assertShort(page,0,{label:'internal-empty'});await assertControls(page,m,{internal:true});
    await page.evaluate(()=>window.dataTableDemo.owner.setEmpty(false));await ready(page);
    m=await assertBounded(page,20,{label:'internal-long'});await assertControls(page,m,{internal:true});
    await scrollBodyToEnd(page);
    await search(page).fill('记录 125');await ready(page);
    m=await assertShort(page,1,{label:'internal-one'});await assertControls(page,m,{internal:true});
    await expect(search(page)).toBeFocused();
  });

  for(const {layout,internal} of [{layout:'natural',internal:false},{layout:'natural',internal:true},{layout:'document',internal:true}]){
    test(`${kind} ${layout}, auto-height parent, internal=${internal}: content grows and document scroll reaches footer`,async({page})=>{
      await setup(page,kind,['unbounded','local','size=100',...(layout==='document'?['layout=document']:[]),...(internal?['internal']:[])]);
      await expect(page.locator(selectors.shell)).toHaveAttribute('data-scroll-mode','document');
      await expect(page.locator(selectors.outer)).toHaveAttribute('data-layout',layout);
      await expect(rows(page)).toHaveCount(100);
      const before=await capture(page,'unbounded-top');assertFrame(before);await assertControls(page,before,{internal});
      for(const key of ['main','content','outer','frame','body'])noVerticalScroll(before,key);
      noHorizontalEscape(before,'document');
      expect(before.body.height,'an auto-height ancestor does not resolve the body to zero').toBeGreaterThan(before.viewport.height);
      near(before.body.height,before.grid.height,'unbounded rows remain in natural flow');
      expect(before.document.scrollHeight,'document owns the long scroll range').toBeGreaterThan(before.document.clientHeight);
      expect(before.footer.y,'footer follows all rows below the viewport').toBeGreaterThan(before.viewport.height);
      await assertFooter(page,before);
      await page.locator(selectors.footer).scrollIntoViewIfNeeded();await settle(page);
      const after=await capture(page,'unbounded-footer');
      expect(after.document.scrollTop,'reaching the footer uses document scroll').toBeGreaterThan(0);
      near(after.body.scrollTop,0,'body has not acquired a competing scroll offset');
      for(const key of ['main','content'])near(after[key].scrollTop,0,`${key} remains an ordinary document section`);
      expect(after.lastRow.bottom).toBeLessThanOrEqual(after.body.bottom+1.5);
      await expect(rows(page).last()).toBeInViewport({ratio:1});
      await expect(size(page)).toBeInViewport({ratio:1});await expect(next(page)).toBeInViewport({ratio:1});
      // Removing most content must also shrink the document after it was scrolled.
      await page.evaluate(()=>window.dataTableDemo.owner.filter('search','记录 125'));await ready(page);
      const one=await capture(page,'unbounded-one');assertFrame(one);
      await expect(rows(page)).toHaveCount(1);near(one.body.height,one.grid.height,'auto-height parent still follows one row');
      expect(one.outer.height).toBeLessThan(before.outer.height);
      noVerticalScroll(one,'body');await expect(size(page)).toBeInViewport({ratio:1});
    });
  }

  for(const flexHost of [false,true])test(`${kind} explicit document with ${flexHost?'flex':'normal'} bounded host: no cap, reachable scroll fallback`,async({page})=>{
    await setup(page,kind,['layout=document','local','size=100',...(flexHost?['flex-host']:[])]);
    await expect(page.locator(selectors.shell)).toHaveAttribute('data-scroll-mode','workspace');
    await expect(page.locator(selectors.outer)).toHaveAttribute('data-layout','document');
    await expect(rows(page)).toHaveCount(100);
    const before=await capture(page,'document-bounded-top');assertFrame(before);
    if(flexHost){
      expect(before.host.display,'fixture is an actual flex parent').toBe('flex');
      expect(before.host.minBlockSize,'fixture allows its flex item to shrink').toBe('0px');
      near(before.host.height,before.content.contentHeight,'flex parent has a definite bounded block size');
    }
    for(const key of ['document','main','outer','frame','body'])noVerticalScroll(before,key);
    for(const key of ['document','main','content'])noHorizontalEscape(before,key);
    expect(before.outer.height,'document mode does not inherit the bounded natural cap').toBeGreaterThan(before.content.clientHeight);
    near(before.body.height,before.grid.height,'all rows participate in unbounded body flow');
    expect(before.content.scrollHeight,'the public shell content owns a real fallback range').toBeGreaterThan(before.content.clientHeight);
    expect(before.footer.y).toBeGreaterThan(before.content.bottom);
    await page.locator(selectors.footer).scrollIntoViewIfNeeded();await settle(page);
    const after=await capture(page,'document-bounded-footer');
    expect(after.content.scrollTop,'footer is reached through the bounded shell content').toBeGreaterThan(0);
    for(const key of ['document','main','body'])near(after[key].scrollTop,0,`${key} does not take the content fallback scroll`);
    await expect(rows(page).last()).toBeInViewport({ratio:1});
    await expect(size(page)).toBeInViewport({ratio:1});await expect(next(page)).toBeInViewport({ratio:1});
    await page.evaluate(()=>window.dataTableDemo.owner.filter('search','记录 125'));await ready(page);
    await assertShort(page,1,{label:'document-bounded-one'});
  });

  test(`${kind} explicit workspace with an auto-height parent preserves its intrinsic floor and content flow`,async({page})=>{
    await setup(page,kind,['unbounded','layout=workspace','local','empty','no-search','no-actions','no-pagination']);
    for(const count of [0,100,1]){
      if(count===100){await page.evaluate(()=>{window.dataTableDemo.owner.setEmpty(false);window.dataTableDemo.owner.pageSize(100);});await ready(page);}
      if(count===1){await page.evaluate(()=>window.dataTableDemo.owner.filter('search','记录 125'));await ready(page);}
      await expect(rows(page)).toHaveCount(count);
      const m=await capture(page,`workspace-auto-${count}`);assertFrame(m);noVerticalScroll(m,'body');
      const minimum=await page.locator(selectors.outer).evaluate(node=>parseFloat(getComputedStyle(node).minBlockSize));
      expect(Number.isFinite(minimum),'the declared workspace intrinsic floor resolves in an auto-height parent').toBe(true);
      expect(m.outer.height).toBeGreaterThanOrEqual(minimum-1.5);
      expect(m.body.height).toBeGreaterThanOrEqual(m.grid.height-1.5);
      if(count===100){expect(m.outer.height).toBeGreaterThan(m.viewport.height);await page.locator(selectors.footer).scrollIntoViewIfNeeded();await expect(page.locator(selectors.count)).toBeInViewport({ratio:1});}
    }
  });

  test(`${kind} explicit workspace keeps fill behavior for empty, one and long data`,async({page})=>{
    await setup(page,kind,['layout=workspace','local','empty']);
    await expect(page.locator(selectors.outer)).toHaveAttribute('data-layout','workspace');
    const empty=await capture(page,'workspace-empty');assertFrame(empty);
    near(empty.outer.height,empty.content.contentHeight,'explicit workspace fills even with no records');
    await page.evaluate(()=>window.dataTableDemo.owner.setEmpty(false));await ready(page);
    await page.evaluate(()=>window.dataTableDemo.owner.filter('search','记录 125'));await ready(page);
    await expect(rows(page)).toHaveCount(1);
    const one=await capture(page,'workspace-one');assertFrame(one);
    near(one.outer.height,one.content.contentHeight,'explicit workspace fills even with one record');
    near(one.outer.height,empty.outer.height,'workspace size remains fixed across short data');
    await page.evaluate(()=>window.dataTableDemo.owner.clear());await ready(page);
    await assertBounded(page,20,{label:'workspace-long',layout:'workspace'});await scrollBodyToEnd(page);
  });

  for(const source of ['local','server'])test(`${kind} natural ${source}: page size has one compact, controlled footer owner`,async({page})=>{
    await setup(page,kind,source==='local'?['local']:[]);
    const initial=await assertBounded(page,20,{label:'pagination-20'});
    if(source==='server'){
      await page.evaluate(()=>window.dataTableDemo.owner.planNext({delayMs:1500}));
      const requests=await page.evaluate(()=>window.dataTableDemo.owner.getRequests().length);
      await chooseSelect(page,size(page),'50');
      await expect(page.locator(selectors.outer)).toHaveAttribute('aria-busy','true');
      await expect(size(page)).toBeDisabled();await expect(size(page)).toHaveText('20');
      await expect(rows(page)).toHaveCount(20);await expect(next(page)).toBeDisabled();
      const pending=await state(page);expect(pending.pageSize).toBe(20);expect(pending.pageIndex).toBe(0);
      expect(await page.evaluate(()=>window.dataTableDemo.owner.getRequests().length)).toBe(requests+1);
      const busy=await capture(page,'pagination-pending');assertFrame(busy);sameRect(initial,busy,'frame');
      expect(busy.footer.bottom).toBeLessThanOrEqual(busy.viewport.height+1.5);
    }else{
      await size(page).click();
      await page.evaluate(()=>document.addEventListener('click',()=>{const state=window.dataTableDemo.owner.getState();window.synchronousPageSize={status:state.status,pageSize:state.pageSize,rows:state.rows.length};},{once:true}));
      await page.getByRole('option',{name:'50',exact:true}).click();
      const immediate=await page.evaluate(()=>window.synchronousPageSize);
      expect(immediate,'local model confirms data synchronously in the control callback').toEqual({status:'ready',pageSize:50,rows:50});
    }
    await ready(page);await assertBounded(page,50,{label:'pagination-50'});
    await next(page).click();await ready(page);await expect(rows(page).first().locator('td').first()).toHaveText('51');
    await chooseSelect(page,size(page),'100');await ready(page);
    expect((await state(page)).pageIndex,'the single host owner resets page size to the endpoint first page').toBe(0);
    await assertBounded(page,100,{label:'pagination-100'});await scrollBodyToEnd(page);
    await next(page).click();await ready(page);await assertBounded(page,25,{label:'pagination-last'});
    await expect(page.locator(selectors.count)).toHaveText('显示 25 条，共 125 条');await expect(next(page)).toBeDisabled();
    await page.evaluate(()=>window.dataTableDemo.owner.filter('search','记录 125'));await ready(page);
    await assertShort(page,1,{label:'pagination-one'});await expect(size(page)).toHaveText('100');
  });

  for(const mode of ['no-pagination','fixed-page-size','unknown'])test(`${kind} natural ${mode}: footer reflects only supplied page facts`,async({page})=>{
    await setup(page,kind,['local','empty','no-search','no-actions',mode]);
    const paginated=mode!=='no-pagination';
    await assertShort(page,0,{label:`${mode}-empty`,pagination:paginated});
    if(mode==='fixed-page-size'){
      await expect(size(page)).toBeDisabled();
      const before=await state(page);
      await size(page).evaluate(node=>{node.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
      await expect(size(page)).toHaveText('20');expect((await state(page)).pageSize).toBe(before.pageSize);
    }
    if(mode!=='fixed-page-size'){
      await expect(page.getByRole('navigation',{name:'记录分页',exact:true})).toHaveCount(0);
      await expect(next(page)).toHaveCount(0);
      await expect(page.locator(selectors.count)).toHaveText('已加载 0 条');
    }
    await page.evaluate(()=>window.dataTableDemo.owner.setEmpty(false));await ready(page);
    await assertBounded(page,20,{label:`${mode}-long`,pagination:paginated});await scrollBodyToEnd(page);
    await page.evaluate(()=>window.dataTableDemo.owner.filter('search','记录 125'));await ready(page);
    await assertShort(page,1,{label:`${mode}-one`,pagination:paginated});
    await expect(page.locator(selectors.count)).toHaveText(mode==='fixed-page-size'?'显示 1 条，共 1 条':'已加载 1 条');
  });
}
