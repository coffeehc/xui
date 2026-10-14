import {test,expect} from '@playwright/test';
import {build} from 'esbuild';

let source;
test.beforeAll(async()=>{
 const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Input,Textarea,InputGroup,Field} from '@coffeehc/xui-react/forms';
import {Button} from '@coffeehc/xui-react/button';
import {ToggleGroup} from '@coffeehc/xui-react/toggle-group';
import {Calendar} from '@coffeehc/xui-react/calendar';
import {ScrollArea} from '@coffeehc/xui-react/scroll-area';
import {Badge,Surface} from '@coffeehc/xui-react/feedback';
import {Typography} from '@coffeehc/xui-react/display';
import {SortButton} from '@coffeehc/xui-react/table';
import {createToggleGroup,createCalendar} from '@coffeehc/xui-runtime/widgets-dom';
import {bindPressFeedback} from '@coffeehc/xui-runtime/dom';
import {createTypographyCode} from '@coffeehc/xui-runtime/display-dom';
const long='LongIdentifier'.repeat(30);
const host=document.createElement('main');host.className='xui xui-container xui-stack';document.body.replaceChildren(host);
window.foundationCloseout={calendar:[],toggle:[],sort:0,clears:0};
function App(){return <>
<Typography.Heading level={1} visualRole="page">基础组件验收</Typography.Heading>
<Surface aria-label="Inputs" className="xui-stack">
<Field label="Plain input"><Input defaultValue="保留草稿"/></Field>
<Field label="Grouped input" error="请检查字段"><InputGroup.Root><InputGroup.Addon aria-hidden="true">@</InputGroup.Addon><InputGroup.Input defaultValue="保留草稿"/><InputGroup.Button onClick={()=>window.foundationCloseout.clears++}>清除</InputGroup.Button></InputGroup.Root></Field>
<Field label="Plain textarea"><Textarea defaultValue="第一行\\n第二行"/></Field>
<Field label="Grouped textarea"><InputGroup.Root><InputGroup.Textarea defaultValue="第一行\\n第二行"/></InputGroup.Root></Field>
</Surface>
<Surface aria-label="Choices" className="xui-stack">
<ToggleGroup.Root defaultValue={['one']} onValueChange={value=>window.foundationCloseout.toggle.push(value)} aria-label="View"><ToggleGroup.Item value="one">视图一</ToggleGroup.Item><ToggleGroup.Item value="two">视图二</ToggleGroup.Item><ToggleGroup.Item value="blocked" disabled>不可选</ToggleGroup.Item></ToggleGroup.Root>
<Calendar defaultMonth="2026-10" value="2026-10-13" isDateDisabled={date=>date==='2026-10-14'} onValueChange={value=>window.foundationCloseout.calendar.push(value)}/>
<SortButton disabled aria-label="Disabled sort" onClick={()=>window.foundationCloseout.sort++}>排序</SortButton>
</Surface>
<Surface aria-label="Reading" className="xui-stack"><Badge tone="warning">{long}</Badge><Typography.Code value="2026-10-14 12:34:56 1234567890"/></Surface>
<Surface aria-label="Scroll sample"><ScrollArea.Root style={{height:'12rem'}}><ScrollArea.Viewport aria-label="Independent scroll"><ScrollArea.Content><Button variant="outline">Scroll first</Button><div style={{height:'30rem'}} aria-hidden="true"/><InputGroup.Root><InputGroup.Input aria-label="Scroll middle" defaultValue="草稿不变"/></InputGroup.Root><div style={{height:'30rem'}} aria-hidden="true"/><Button variant="outline">Scroll last</Button></ScrollArea.Content></ScrollArea.Viewport></ScrollArea.Root></Surface>
</>;}
window.mountFoundationCloseout=(native)=>{
 if(!native){createRoot(host).render(<App/>);return;}
 host.innerHTML='<h1 class="xui-heading" data-visual-role="page">基础组件验收</h1><section class="xui-surface xui-stack" aria-label="Inputs">'+
 '<div class="xui-field"><label class="xui-label" for="plain-input">Plain input</label><input id="plain-input" class="xui-input" value="保留草稿"></div>'+
 '<div class="xui-field"><label class="xui-label" for="grouped-input">Grouped input</label><div class="xui-input-group"><span class="xui-input-addon" aria-hidden="true">@</span><input id="grouped-input" class="xui-input" value="保留草稿" aria-invalid="true" aria-describedby="group-error"><button class="xui-input-action" type="button">清除</button></div><p class="xui-error" id="group-error">请检查字段</p></div>'+
 '<div class="xui-field"><label class="xui-label" for="plain-textarea">Plain textarea</label><textarea id="plain-textarea" class="xui-textarea">第一行\\n第二行</textarea></div>'+
 '<div class="xui-field"><label class="xui-label" for="grouped-textarea">Grouped textarea</label><div class="xui-input-group"><textarea id="grouped-textarea" class="xui-textarea">第一行\\n第二行</textarea></div></div></section>'+
 '<section class="xui-surface xui-stack" aria-label="Choices"><div id="toggle" aria-label="View"><button data-value="one">视图一</button><button data-value="two">视图二</button><button data-value="blocked" disabled>不可选</button></div><div id="calendar"></div><button type="button" class="xui-sort-button" aria-label="Disabled sort" disabled>排序</button></section>'+
 '<section class="xui-surface xui-stack" aria-label="Reading"><span class="xui-badge" data-tone="warning"></span></section>'+
 '<section class="xui-surface" aria-label="Scroll sample"><div class="xui-scroll-area" style="height:12rem"><div class="xui-scroll-viewport" tabindex="0" role="region" aria-label="Independent scroll"><div class="xui-scroll-content"><button type="button" class="xui-button" data-variant="outline">Scroll first</button><div style="height:30rem" aria-hidden="true"></div><div class="xui-input-group"><input class="xui-input" aria-label="Scroll middle" value="草稿不变"></div><div style="height:30rem" aria-hidden="true"></div><button type="button" class="xui-button" data-variant="outline">Scroll last</button></div></div></div></section>';
 host.querySelector('.xui-badge').textContent=long;host.querySelector('[aria-label="Reading"]').append(createTypographyCode(document,{value:'2026-10-14 12:34:56 1234567890'}));
 createToggleGroup(host.querySelector('#toggle'),{defaultValue:['one'],onValueChange:value=>window.foundationCloseout.toggle.push(value)});
 createCalendar(host.querySelector('#calendar'),{defaultMonth:'2026-10',value:'2026-10-13',isDateDisabled:date=>date==='2026-10-14',onValueChange:value=>window.foundationCloseout.calendar.push(value)});
 host.querySelector('.xui-input-action').onclick=()=>window.foundationCloseout.clears++;
 host.querySelector('.xui-sort-button').onclick=()=>window.foundationCloseout.sort++;
 bindPressFeedback(host);
};
`},bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',target:'es2022'});
 source=bundle.outputFiles[0].text;
});
async function setup(page,kind,theme){
 await page.emulateMedia({colorScheme:theme==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.addInitScript(theme=>sessionStorage.setItem('ui.theme.mode',theme),theme);
 await page.goto('/react/foundation-contract.html');await page.addScriptTag({content:source});await page.evaluate(native=>window.mountFoundationCloseout(native),kind==='native');
 await expect(page.getByRole('heading',{name:'基础组件验收'})).toBeVisible();await page.evaluate(()=>document.fonts.ready);
}
async function color(page,name){return page.evaluate(name=>{const probe=document.createElement('span');probe.style.color=`var(--${name})`;document.body.append(probe);const value=getComputedStyle(probe).color;probe.remove();return value;},name);}
async function painted(node){return node.evaluate(node=>{const s=getComputedStyle(node);return {background:s.backgroundColor,color:s.color,transform:s.transform};});}
async function pressDisabled(page,node){
 await node.scrollIntoViewIfNeeded();await page.mouse.move(0,0);const before=await painted(node);await node.hover();expect(await painted(node)).toEqual(before);
 const box=await node.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();expect(await painted(node)).toEqual(before);await page.mouse.up();
}
async function ring(node){
 // WebKit scrolls a newly focused control on the next rendering frame. Measure
 // the painted state, retaining the same four-edge clipping assertions.
 await node.page().evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 return node.evaluate(node=>{
 const s=getComputedStyle(node),r=node.getBoundingClientRect(),extent=parseFloat(s.outlineWidth)+parseFloat(s.outlineOffset),clips=[];
 for(let p=node.parentElement;p;p=p.parentElement){const ps=getComputedStyle(p),b=p.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(ps.overflowX)&&(r.left-extent<b.left+p.clientLeft-.5||r.right+extent>b.left+p.clientLeft+p.clientWidth+.5))clips.push('horizontal');if(/auto|scroll|hidden|clip/.test(ps.overflowY)&&(r.top-extent<b.top+p.clientTop-.5||r.bottom+extent>b.top+p.clientTop+p.clientHeight+.5))clips.push('vertical');}
 return {style:s.outlineStyle,width:parseFloat(s.outlineWidth),visible:node.matches(':focus-visible'),clips};
 });}
for(const kind of ['react','native'])for(const theme of ['light','dark','system']){
 test(`${kind} ${theme}: compact toggles and one-border InputGroups honor geometry, overrides and long content`,async({page},info)=>{
  await setup(page,kind,theme);
  for(const width of [1280,390])for(const scale of [1,2]){
   await page.setViewportSize({width,height:900});await page.evaluate(scale=>document.documentElement.style.fontSize=`${scale*100}%`,scale);
   const input=page.getByRole('textbox',{name:'Plain input',exact:true}),group=page.getByRole('textbox',{name:'Grouped input',exact:true}).locator('..');
   expect((await group.boundingBox()).height).toBeCloseTo((await input.boundingBox()).height,1);
   const textarea=page.getByRole('textbox',{name:'Plain textarea',exact:true}),textGroup=page.getByRole('textbox',{name:'Grouped textarea',exact:true}).locator('..');
   expect((await textGroup.boundingBox()).height).toBeCloseTo((await textarea.boundingBox()).height,1);
   expect((await page.getByRole('button',{name:'视图一',exact:true}).boundingBox()).height).toBeCloseTo(28*scale,1);
   const badge=page.locator('.xui-badge');expect(await badge.evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);
   await expect(page.locator('.xui-code')).toHaveCSS('font-variant-numeric','tabular-nums');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await page.getByRole('region',{name:'Inputs',exact:true}).screenshot({path:info.outputPath(`${kind}-${theme}-${width}-root-${scale}.png`)});
  }
  await page.evaluate(()=>document.documentElement.style.fontSize='100%');
  await page.addStyleTag({content:'@layer product-overrides {:root {--toggle-height:3rem;--input-height:3rem;--line-width-surface:.125rem}}'});
  expect((await page.getByRole('button',{name:'视图一',exact:true}).boundingBox()).height).toBe(48);
  expect((await page.getByRole('textbox',{name:'Grouped input',exact:true}).locator('..').boundingBox()).height).toBe(48);
  expect((await page.getByRole('textbox',{name:'Plain input',exact:true}).boundingBox()).height).toBe(48);
  await page.getByRole('button',{name:'清除',exact:true}).click();expect(await page.evaluate(()=>window.foundationCloseout.clears)).toBe(1);
  await expect(page.getByRole('textbox',{name:'Grouped input',exact:true})).toHaveValue('保留草稿');
 });
 test(`${kind} ${theme}: disabled Calendar and sort controls have no active paint or action; selected remains visible`,async({page},info)=>{
  await setup(page,kind,theme);const day=page.getByRole('gridcell',{name:'2026-10-14',exact:true});await expect(day).toHaveAttribute('aria-disabled','true');await pressDisabled(page,day);await pressDisabled(page,page.getByRole('button',{name:'Disabled sort',exact:true}));
  expect(await page.evaluate(()=>({calendar:window.foundationCloseout.calendar,sort:window.foundationCloseout.sort}))).toEqual({calendar:[],sort:0});
  const selected=page.getByRole('gridcell',{name:'2026-10-13',exact:true});await selected.hover();await expect(selected).toHaveAttribute('aria-selected','true');await expect(selected).toHaveCSS('background-color',await color(page,'action-primary'));
  const one=page.getByRole('button',{name:'视图一',exact:true}),two=page.getByRole('button',{name:'视图二',exact:true});await one.focus();await page.keyboard.press('ArrowRight');await expect(two).toBeFocused();await page.keyboard.press('Space');await expect(two).toHaveAttribute('aria-pressed','true');await two.hover();await expect(two).toHaveCSS('background-color',await color(page,'interaction-selected'));
  await page.emulateMedia({forcedColors:'active'});await expect(two).toHaveCSS('text-decoration-line','underline');await expect(selected).toHaveCSS('text-decoration-line','underline');await expect(selected).toHaveCSS('border-top-color',await selected.evaluate(node=>getComputedStyle(node).color));
  await page.getByRole('region',{name:'Choices',exact:true}).screenshot({path:info.outputPath(`${kind}-${theme}-forced-selection.png`)});
 });
 test(`${kind} ${theme}: independent ScrollArea preserves first/middle/last keyboard focus and draft`,async({page,browserName},info)=>{
  await setup(page,kind,theme);await page.setViewportSize({width:390,height:720});
  // Safari's native full-control keyboard traversal uses Option+Tab. React's
  // peer buttons explicitly opt into ordinary Tab with tabindex=0.
  const forward=browserName==='webkit'&&kind==='native'?'Alt+Tab':'Tab',backward=browserName==='webkit'&&kind==='native'?'Alt+Shift+Tab':'Shift+Tab';
  for(const scale of [1,2]){
   await page.evaluate(scale=>document.documentElement.style.fontSize=`${scale*100}%`,scale);
   const region=page.getByRole('region',{name:'Independent scroll',exact:true}),first=page.getByRole('button',{name:'Scroll first',exact:true}),middle=page.getByRole('textbox',{name:'Scroll middle',exact:true}),last=page.getByRole('button',{name:'Scroll last',exact:true});
   await region.focus();await page.keyboard.press(forward);await expect(first).toBeFocused();let p=await ring(first);expect(p).toMatchObject({style:'solid',visible:true,clips:[]});expect(p.width).toBeGreaterThan(0);
   await page.keyboard.press(forward);await expect(middle).toBeFocused();const group=middle.locator('..');p=await ring(group);expect(p).toMatchObject({style:'solid',clips:[]});expect(p.width).toBeGreaterThan(0);
   await page.keyboard.press(forward);await expect(last).toBeFocused();p=await ring(last);expect(p).toMatchObject({style:'solid',visible:true,clips:[]});expect(await region.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);await expect(middle).toHaveValue('草稿不变');
   await region.screenshot({path:info.outputPath(`${kind}-${theme}-scroll-root-${scale}.png`)});
   await page.keyboard.press(backward);await expect(middle).toBeFocused();await page.keyboard.press(backward);await expect(first).toBeFocused();
  }
 });
}
