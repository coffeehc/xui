import {test,expect} from '@playwright/test';
import {build} from 'esbuild';

let fixtureSource;
test.beforeAll(async()=>{
  const result=await build({stdin:{contents:`
import * as React from 'react';import {createRoot} from 'react-dom/client';
import {ContextMenu} from '@coffeehc/xui-react/context-menu';
const host=document.createElement('div');host.className='xui';document.body.append(host);
const api={normalChanges:[],controlChanges:[],disabledChanges:[],defaultPreventChanges:[],peerPreventChanges:[],keyPreventChanges:[],nestedOuterChanges:[],nestedInnerChanges:[],setControlledOpen:null,root:null};
const item=(label='Run action')=><ContextMenu.Item>{label}</ContextMenu.Item>;
function App(){const [controlledOpen,setControlledOpen]=React.useState(false);api.setControlledOpen=setControlledOpen;return <main>
 <ContextMenu.Root onOpenChange={next=>api.normalChanges.push(next)}><ContextMenu.Trigger render={<button type="button" data-testid="button-trigger" className="host-trigger"/>}>Open menu</ContextMenu.Trigger><ContextMenu.Content>{item()}</ContextMenu.Content></ContextMenu.Root>
 <ContextMenu.Root open={controlledOpen} onOpenChange={next=>api.controlChanges.push(next)}><ContextMenu.Trigger render={<button type="button" data-testid="controlled-trigger"/>}>Controlled menu</ContextMenu.Trigger><ContextMenu.Content>{item('Controlled action')}</ContextMenu.Content></ContextMenu.Root>
 <ContextMenu.Root disabled onOpenChange={next=>api.disabledChanges.push(next)}><ContextMenu.Trigger render={<button type="button" data-testid="disabled-trigger"/>}>Disabled menu</ContextMenu.Trigger><ContextMenu.Content>{item('Disabled action')}</ContextMenu.Content></ContextMenu.Root>
 <ContextMenu.Root onOpenChange={next=>api.defaultPreventChanges.push(next)}><ContextMenu.Trigger render={<button type="button" data-testid="default-prevent-trigger"/>} onContextMenu={event=>event.preventDefault()}>Cancel contextmenu</ContextMenu.Trigger><ContextMenu.Content>{item('Cancelled action')}</ContextMenu.Content></ContextMenu.Root>
 <ContextMenu.Root onOpenChange={next=>api.peerPreventChanges.push(next)}><ContextMenu.Trigger render={<button type="button" data-testid="peer-prevent-trigger"/>} onContextMenu={event=>event.preventBaseUIHandler()}>Cancel peer handler</ContextMenu.Trigger><ContextMenu.Content>{item('Peer cancelled action')}</ContextMenu.Content></ContextMenu.Root>
 <ContextMenu.Root onOpenChange={next=>api.keyPreventChanges.push(next)}><ContextMenu.Trigger render={<button type="button" data-testid="key-prevent-trigger"/>} onKeyDown={event=>{if(event.key==='F10'&&event.shiftKey)event.preventDefault();}}>Cancel keyboard</ContextMenu.Trigger><ContextMenu.Content>{item('Keyboard cancelled action')}</ContextMenu.Content></ContextMenu.Root>
 <ContextMenu.Root onOpenChange={next=>api.nestedOuterChanges.push(next)}><ContextMenu.Trigger render={<div tabIndex={0} data-testid="outer-trigger"/>}>Outer
   <ContextMenu.Root onOpenChange={next=>api.nestedInnerChanges.push(next)}><ContextMenu.Trigger render={<button type="button" data-testid="inner-trigger"/>}>Inner</ContextMenu.Trigger><ContextMenu.Content>{item('Inner action')}</ContextMenu.Content></ContextMenu.Root>
 </ContextMenu.Trigger><ContextMenu.Content>{item('Outer action')}</ContextMenu.Content></ContextMenu.Root>
 <ContextMenu.Root onOpenChange={next=>api.normalChanges.push(next)}><ContextMenu.Trigger render={<div tabIndex={0} data-testid="input-trigger"/>}>Editor <input aria-label="Inline editor" defaultValue="draft"/></ContextMenu.Trigger><ContextMenu.Content>{item('Editor action')}</ContextMenu.Content></ContextMenu.Root>
 </main>;}
api.root=createRoot(host);api.root.render(<App/>);window.contextMenuFixture=api;
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',target:'es2022'});
  fixtureSource=result.outputFiles[0].text;
});

async function mount(page){await page.goto('/react/');await page.addScriptTag({content:fixtureSource});await expect(page.getByTestId('button-trigger')).toBeVisible();}

test('ContextMenu forwards keyboard activation once and reopens after item selection on the rendered host',async({page})=>{
  await mount(page);const trigger=page.getByTestId('button-trigger'),menu=page.getByRole('menu');
  await expect(trigger).toHaveClass(/xui-context-trigger/);await trigger.focus();await page.keyboard.press('Shift+F10');await expect(menu).toBeVisible();expect(await menu.evaluate(element=>element.contains(document.activeElement))).toBe(true);await page.keyboard.press('Home');await expect(menu.getByRole('menuitem',{name:'Run action',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');await expect(menu).toBeHidden();await expect(trigger).toBeFocused();await trigger.press('Shift+F10');await expect(menu).toBeVisible();await menu.getByRole('menuitem',{name:'Run action',exact:true}).click();await expect(menu).toBeHidden();
  await trigger.focus();await page.keyboard.down('ContextMenu');await page.keyboard.down('ContextMenu');await page.keyboard.up('ContextMenu');await expect(menu).toBeVisible();await page.waitForTimeout(30);expect(await page.evaluate(()=>window.contextMenuFixture.normalChanges)).toEqual([true,false,true,false,true]);
  await page.keyboard.press('Escape');await expect(menu).toBeHidden();expect(await page.evaluate(()=>window.contextMenuFixture.normalChanges)).toEqual([true,false,true,false,true,false]);
});

test('ContextMenu respects disabled, controlled and consumer-cancelled ownership',async({page})=>{
  await mount(page);
  const disabled=page.getByTestId('disabled-trigger');await disabled.focus();await page.keyboard.press('ContextMenu');await expect(page.getByRole('menu')).toHaveCount(0);expect(await page.evaluate(()=>window.contextMenuFixture.disabledChanges)).toEqual([]);

  const controlled=page.getByTestId('controlled-trigger'),controlledItem=page.getByRole('menuitem',{name:'Controlled action',exact:true});await controlled.focus();await page.keyboard.press('Shift+F10');await expect(controlledItem).toBeHidden();expect(await page.evaluate(()=>window.contextMenuFixture.controlChanges)).toEqual([true]);
  await page.evaluate(()=>window.contextMenuFixture.setControlledOpen(true));await expect(controlledItem).toBeVisible();await page.keyboard.press('Escape');await expect(controlledItem).toBeVisible();expect(await page.evaluate(()=>window.contextMenuFixture.controlChanges)).toEqual([true,false]);await page.evaluate(()=>window.contextMenuFixture.setControlledOpen(false));await expect(controlledItem).toBeHidden();

  const defaultPrevent=page.getByTestId('default-prevent-trigger');await defaultPrevent.click({button:'right'});expect(await page.evaluate(()=>window.contextMenuFixture.defaultPreventChanges)).toEqual([]);
  const peerPrevent=page.getByTestId('peer-prevent-trigger');await peerPrevent.click({button:'right'});expect(await page.evaluate(()=>window.contextMenuFixture.peerPreventChanges)).toEqual([]);
  const keyPrevent=page.getByTestId('key-prevent-trigger');await keyPrevent.focus();await page.keyboard.press('Shift+F10');expect(await page.evaluate(()=>window.contextMenuFixture.keyPreventChanges)).toEqual([]);
});

test('ContextMenu keys preserve inline input editing and only the nearest nested trigger opens',async({page})=>{
  await mount(page);const input=page.locator('input[aria-label="Inline editor"]'),inputMenu=page.getByRole('menu').filter({has:page.getByRole('menuitem',{name:'Editor action',exact:true})});
  await input.fill('draft text');await input.evaluate(node=>{node.focus();node.setSelectionRange(5,5);});await page.keyboard.press('ArrowLeft');await expect(input).toBeFocused();expect(await input.evaluate(node=>node.selectionStart)).toBe(4);await expect(inputMenu).toBeHidden();
  await page.keyboard.press('ContextMenu');await expect(inputMenu).toBeVisible();await expect(input).toHaveValue('draft text');expect(await inputMenu.evaluate(element=>element.contains(document.activeElement))).toBe(true);await page.keyboard.press('Home');await expect(inputMenu.getByRole('menuitem',{name:'Editor action',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(inputMenu).toBeHidden();
  await input.focus();await input.evaluate(node=>node.setSelectionRange(node.value.length,node.value.length));await input.press('!');await expect(input).toHaveValue('draft text!');

  const inner=page.getByTestId('inner-trigger'),outerMenu=page.getByRole('menu').filter({has:page.getByRole('menuitem',{name:'Outer action',exact:true})}),innerMenu=page.getByRole('menu').filter({has:page.getByRole('menuitem',{name:'Inner action',exact:true})});
  await inner.focus();await page.keyboard.press('Shift+F10');await expect(innerMenu).toBeVisible();await expect(outerMenu).toBeHidden();expect(await page.evaluate(()=>({outer:window.contextMenuFixture.nestedOuterChanges,inner:window.contextMenuFixture.nestedInnerChanges}))).toEqual({outer:[],inner:[true]});await page.keyboard.press('Escape');await expect(innerMenu).toBeHidden();await expect(inner).toBeFocused();
});
