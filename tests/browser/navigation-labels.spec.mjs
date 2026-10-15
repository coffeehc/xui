import {test,expect} from '@playwright/test';

const longLabel='跨区域协作与知识交付项目：保留完整中文名称、负责人及当前业务状态';
const branchId='project-alpha';
const branchToggle=page=>page.locator(`[data-menu-id="${branchId}"][data-menu-control="toggle"]`);
const primary=(page,id)=>page.locator(`[data-menu-id="${id}"][data-menu-control="primary"]`);
const action=(page,id)=>page.locator(`[data-menu-id="${id}"][data-menu-control="action"]`);
const ready=async(page,kind)=>{await page.goto(`/rich-navigation-${kind}/`);await expect(primary(page,branchId)).toHaveCount(1);};

for(const kind of ['react','vanilla']){
  test(`${kind} branch labels update in place and controlled keyboard requests notify once`,async({page})=>{
    await ready(page,kind);
    const toggle=branchToggle(page);
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAccessibleName(`Expand ${longLabel}`);
    await toggle.focus();
    const controls=await toggle.getAttribute('aria-controls');
    await toggle.evaluate(node=>{window.savedNavigationBranchToggle=node;});
    await page.evaluate(()=>window.navigationLabelsDemo.update({
      expandBranchLabel:item=>`展开 ${item.label}`,
      collapseBranchLabel:item=>`收起 ${item.label}`,
    }));
    await expect(toggle).toHaveAccessibleName(`展开 ${longLabel}`);
    await expect(toggle).toBeFocused();
    expect(await page.evaluate(()=>window.savedNavigationBranchToggle===document.querySelector('[data-menu-id="project-alpha"][data-menu-control="toggle"]'))).toBe(true);
    expect(await toggle.getAttribute('aria-controls')).toBe(controls);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded','true');
    await expect(toggle).toHaveAccessibleName(`收起 ${longLabel}`);
    await page.evaluate(()=>window.navigationLabelsDemo.update({
      expandBranchLabel:item=>`Expand ${item.label}`,
      collapseBranchLabel:item=>`Collapse ${item.label}`,
    }));
    await expect(toggle).toHaveAccessibleName(`Collapse ${longLabel}`);
    await expect(toggle).toBeFocused();
    await page.evaluate(()=>window.navigationLabelsDemo.update({expandBranchLabel:undefined,collapseBranchLabel:undefined}));
    await expect(toggle).toHaveAccessibleName(`Collapse ${longLabel}`);
    await expect(toggle).toBeFocused();
    expect(await toggle.getAttribute('aria-controls')).toBe(controls);

    await page.evaluate(()=>{
      window.navigationLabelRequests=[];
      window.navigationLabelsDemo.update({
        expandBranchLabel:item=>`展开 ${item.label}`,
        collapseBranchLabel:item=>`收起 ${item.label}`,
        expandedIds:[],
        onExpandedChange:ids=>window.navigationLabelRequests.push([...ids]),
      });
    });
    await expect(toggle).toHaveAttribute('aria-expanded','false');
    await expect(toggle).toHaveAccessibleName(`展开 ${longLabel}`);
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect.poll(()=>page.evaluate(()=>window.navigationLabelRequests.length)).toBe(1);
    expect(await page.evaluate(()=>window.navigationLabelRequests)).toEqual([[branchId]]);
    await expect(toggle).toHaveAttribute('aria-expanded','false');
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Space');
    await expect.poll(()=>page.evaluate(()=>window.navigationLabelRequests.length)).toBe(2);
    expect(await page.evaluate(()=>window.navigationLabelRequests)).toEqual([['project-alpha'],['project-alpha']]);
    await expect(toggle).toHaveAttribute('aria-expanded','false');
    await page.evaluate(()=>window.navigationLabelsDemo.update({expandedIds:['project-alpha']}));
    await expect(toggle).toHaveAttribute('aria-expanded','true');
    await expect(toggle).toHaveAccessibleName(`收起 ${longLabel}`);
    expect(await page.evaluate(()=>window.navigationLabelRequests)).toEqual([['project-alpha'],['project-alpha']]);
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect.poll(()=>page.evaluate(()=>window.navigationLabelRequests.length)).toBe(3);
    expect(await page.evaluate(()=>window.navigationLabelRequests)).toEqual([['project-alpha'],['project-alpha'],[]]);
    await expect(toggle).toHaveAttribute('aria-expanded','true');
    await expect(toggle).toBeFocused();
  });

  test(`${kind} inherited disabled branch suppresses its actions and is skipped by roving focus`,async({page})=>{
    await ready(page,kind);
    await page.evaluate(()=>{
      const items=window.richNavigationDemo.owner.getState().groups.projects.items.map(item=>item.id==='project-alpha'?{...item,disabled:true}:item);
      window.navigationLabelRequests=[];
      window.navigationLabelsDemo.update({
        projectItems:items,
        expandedIds:['project-alpha'],
        onExpandedChange:ids=>window.navigationLabelRequests.push([...ids]),
      });
    });
    const toggle=branchToggle(page);
    await expect(toggle).toBeDisabled();
    await expect(toggle).toHaveAttribute('aria-expanded','true');
    await expect(primary(page,branchId)).toHaveAttribute('aria-disabled','true');
    await expect(primary(page,branchId)).not.toHaveAttribute('href',/.+/);
    await expect(primary(page,'project-overview')).toBeVisible();
    await expect(primary(page,'project-overview')).toHaveAttribute('aria-disabled','true');
    await expect(primary(page,'project-overview')).not.toHaveAttribute('href',/.+/);
    await expect(action(page,branchId)).toBeDisabled();
    await expect(action(page,'project-overview')).toBeDisabled();

    const before=await page.evaluate(()=>window.richNavigationDemo.owner.getState().navigations);
    await toggle.evaluate(node=>node.click());
    await primary(page,'project-overview').click();
    expect(await page.evaluate(()=>window.navigationLabelRequests)).toEqual([]);
    expect(await page.evaluate(()=>window.richNavigationDemo.owner.getState().navigations)).toBe(before);

    await primary(page,'project-folder').focus();
    await page.keyboard.press('Home');
    expect(await page.evaluate(()=>document.activeElement?.dataset.menuId)).not.toBe(branchId);
    expect(await page.evaluate(()=>document.activeElement?.matches(':disabled,[aria-disabled="true"]'))).toBe(false);
  });

  for(const mode of ['light','dark','system'])for(const width of [1280,390])for(const rootSize of ['100','200']){
    test(`${kind} navigation focus and pointer geometry ${mode} ${width}px root ${rootSize}%`,async({page},info)=>{
      await page.setViewportSize({width,height:800});
      await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
      await ready(page,kind);
      await page.evaluate(({mode,rootSize})=>{window.xuiTheme.setMode(mode);document.documentElement.style.fontSize=`${rootSize}%`;},{mode,rootSize});
      await expect(page.locator('html')).toHaveAttribute('data-theme',mode);
      await expect(page.locator('html')).toHaveAttribute('data-theme-effective',mode==='light'?'light':'dark');
      if(width===390){
        await page.getByRole('button',{name:'工作导航',exact:true}).click();
        await expect(page.getByRole('dialog')).toBeVisible();
      }
      const toggle=branchToggle(page);
      await expect(toggle).toBeVisible();
      await toggle.focus();
      await page.keyboard.press('ArrowRight');
      await expect(toggle).toHaveAttribute('aria-expanded','true');
      await expect(primary(page,'project-overview')).toBeVisible();
      await expect(toggle).toBeFocused();
      const metrics=await toggle.evaluate(node=>{
        const rect=node.getBoundingClientRect(),style=getComputedStyle(node),root=document.documentElement;
        return {rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height,right:rect.right,bottom:rect.bottom},outline:{style:style.outlineStyle,width:parseFloat(style.outlineWidth),offset:parseFloat(style.outlineOffset),color:style.outlineColor},viewport:{width:innerWidth,height:innerHeight,scrollWidth:root.scrollWidth,rootFont:getComputedStyle(root).fontSize},active:document.activeElement===node};
      });
      expect(metrics.rect.width).toBeGreaterThan(0);expect(metrics.rect.height).toBeGreaterThan(0);
      expect(metrics.rect.x-metrics.outline.offset).toBeGreaterThanOrEqual(-1);
      expect(metrics.rect.right+metrics.outline.offset).toBeLessThanOrEqual(width+1);
      expect(metrics.rect.y-metrics.outline.offset).toBeGreaterThanOrEqual(-1);
      expect(metrics.rect.bottom+metrics.outline.offset).toBeLessThanOrEqual(metrics.viewport.height+1);
      expect(metrics.outline.style).toBe('solid');expect(metrics.outline.width).toBeGreaterThan(0);
      expect(metrics.outline.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(metrics.active).toBe(true);expect(metrics.viewport.scrollWidth).toBeLessThanOrEqual(metrics.viewport.width+1);
      expect(metrics.viewport.rootFont).toBe(rootSize==='200'?'32px':'16px');
      await info.attach(`navigation-${kind}-${mode}-${width}-root-${rootSize}-focus.json`,{body:JSON.stringify(metrics),contentType:'application/json'});
      await info.attach(`navigation-${kind}-${mode}-${width}-root-${rootSize}-focus.png`,{body:await page.screenshot(),contentType:'image/png'});
      await page.mouse.click(metrics.rect.x+metrics.rect.width/2,metrics.rect.y+metrics.rect.height/2);
      await expect(toggle).toHaveAttribute('aria-expanded','false');
      await expect(primary(page,'project-overview')).toBeHidden();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    });
  }
}
