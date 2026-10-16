import {test,expect} from '@playwright/test';
import {readFile,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';

let source,developmentSource;
test.beforeAll(async()=>{
 const {runDirectory}=JSON.parse(await readFile('.consumers/latest.json','utf8'));
 const cwd=resolve(runDirectory,'react');
 await copyFile('tests/fixtures/controller-modes.tsx',`${cwd}/controller-modes.tsx`);
 for(const [mode,assign] of [['production',value=>source=value],['development',value=>developmentSource=value]]){
  const result=await build({entryPoints:[`${cwd}/controller-modes.tsx`],bundle:true,write:false,metafile:true,format:'iife',platform:'browser',jsx:'automatic',target:'es2022',define:{'process.env.NODE_ENV':JSON.stringify(mode)}});
  expect(Object.keys(result.metafile.inputs).every(file=>resolve(file).startsWith(cwd+'/'))).toBe(true);
  assign(result.outputFiles[0].text);
 }
});

test.beforeEach(async({page})=>{
 await page.route('**/controller-modes-contract',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/react/app.css"></head><body><div id="root"></div></body></html>'}));
 await page.goto('/controller-modes-contract');
 await page.addScriptTag({content:source});
 await expect.poll(()=>page.evaluate(()=>!!window.controllerModes)).toBe(true);
});

async function controllerState(page,key){return page.evaluate(key=>window.controllerModes.controllers[key].getState(),key);}
async function controllerEvents(page,name){return page.evaluate(name=>window.controllerModes.events.filter(event=>event.name===name),name);}
async function loadDevelopmentFixture(page){
 await page.goto('/controller-modes-contract');
 await page.addScriptTag({content:developmentSource});
 await expect.poll(()=>page.evaluate(()=>!!window.controllerModes)).toBe(true);
}

test('owned and injected Dialog roots use the same peer focus lifecycle; controlled rejection waits for confirmation',async({page},info)=>{
 const ownedTrigger=page.getByRole('button',{name:'Open owned dialog',exact:true});
 await ownedTrigger.click();const owned=page.getByRole('dialog',{name:'Owned dialog',exact:true});await expect(owned).toBeVisible();
 await page.keyboard.press('Escape');await expect(owned).toHaveCount(0);await expect(ownedTrigger).toBeFocused();
 expect((await controllerEvents(page,'ownedDialog')).map(event=>event.value)).toEqual([true,false]);

 const trigger=page.getByRole('button',{name:'Open injected dialog',exact:true});await trigger.click();
 await expect(page.getByTestId('dialog-content')).toHaveCount(0);
 expect(await controllerState(page,'dialog')).toEqual({open:false});
 expect((await controllerEvents(page,'dialog')).map(event=>event.value.open)).toEqual([true]);
 await page.evaluate(()=>window.controllerModes.controllers.dialog.update({open:true}));
 const dialog=page.getByRole('dialog',{name:'Injected dialog',exact:true});await expect(dialog).toBeVisible();
 await info.attach('controller-injected-dialog.png',{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});
 await page.keyboard.press('Escape');await expect(dialog).toBeVisible();
 expect((await controllerEvents(page,'dialog')).map(event=>event.value.open)).toEqual([true,false]);
 await page.evaluate(()=>window.controllerModes.controllers.dialog.update({open:false}));await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();
});

test('Sheet, AlertDialog, Popover, Tooltip, Menu and ContextMenu accept injected overlay controllers with peer input and focus',async({page})=>{
 const sheetTrigger=page.getByRole('button',{name:'Open injected sheet',exact:true});await sheetTrigger.click();
 const sheet=page.getByRole('dialog',{name:'Sheet controller',exact:true});await expect(sheet).toBeVisible();
 await page.keyboard.press('Escape');await expect(sheet).toHaveCount(0);await expect(sheetTrigger).toBeFocused();

 const alertTrigger=page.getByRole('button',{name:'Open injected alert',exact:true});await alertTrigger.click();
 const alert=page.getByRole('alertdialog',{name:'Alert controller',exact:true});await expect(alert).toBeVisible();
 await alert.getByRole('button',{name:'Cancel alert',exact:true}).click();await expect(alert).toHaveCount(0);await expect(alertTrigger).toBeFocused();
 expect(await controllerEvents(page,'alertHostConfirmed')).toEqual([],'closing the alert does not perform a host action by itself');
 await alertTrigger.click();await expect(alert).toBeVisible();await alert.getByRole('button',{name:'Confirm alert',exact:true}).click();await expect(alert).toHaveCount(0);
 expect((await controllerEvents(page,'alertHostConfirmed')).map(event=>event.value)).toEqual([true],'the explicit host callback runs only for its own button');

 const popoverTrigger=page.getByRole('button',{name:'Open injected popover',exact:true});await popoverTrigger.click();
 const popover=page.getByTestId('popover-content');await expect(popover).toBeVisible();
 await page.keyboard.press('Escape');await expect(popover).toHaveCount(0);await expect(popoverTrigger).toBeFocused();

 const tooltipTrigger=page.getByRole('button',{name:'Hover injected tooltip',exact:true});await tooltipTrigger.hover();
 const tooltip=page.getByRole('tooltip',{name:'Tooltip controller',exact:true});await expect(tooltip).toBeVisible();
 await page.evaluate(()=>window.controllerModes.controllers.tooltip.setOpen(false));await expect(tooltip).toBeHidden();

 const menuTrigger=page.getByRole('button',{name:'Open injected menu',exact:true});await menuTrigger.click();
 const menu=page.getByRole('menu');await expect(menu).toBeVisible();await expect(menu.getByRole('menuitem',{name:'Menu action'})).toBeVisible();
 await page.keyboard.press('Escape');await expect(menu).toHaveCount(0);await expect(menuTrigger).toBeFocused();

 const contextTrigger=page.getByText('Right-click injected context',{exact:true});await contextTrigger.focus();await expect(contextTrigger).toBeFocused();await contextTrigger.click({button:'right'});
 const contextMenu=page.getByRole('menu');await expect(contextMenu).toBeVisible();await expect(contextMenu.getByRole('menuitem',{name:'Context action'})).toBeVisible();
 await page.keyboard.press('Escape');await expect(contextMenu).toHaveCount(0);await expect(contextTrigger).toBeFocused();
 for(const key of ['sheet','alert','popover','tooltip','menu','context'])expect((await controllerState(page,key)).open).toBe(false);
});

test('value controllers separate controlled acceptance from peer activation across Tabs, Accordion, ToggleGroup and menu choices',async({page})=>{
 const overview=page.getByRole('tab',{name:'Overview',exact:true}),activity=page.getByRole('tab',{name:'Activity',exact:true});
 await activity.click();await expect(overview).toHaveAttribute('aria-selected','true');
 expect((await controllerState(page,'tabs')).value).toBe('overview');
 expect((await controllerEvents(page,'tabs')).map(event=>event.value)).toEqual(['activity']);
 await page.evaluate(()=>window.controllerModes.controllers.tabs.update({value:'activity'}));
 await expect(activity).toHaveAttribute('aria-selected','true');await expect(page.getByText('Activity panel',{exact:true})).toBeVisible();
 expect((await controllerEvents(page,'tabs')).map(event=>event.value)).toEqual(['activity'],'external confirmation does not echo a callback');

 const accordionTrigger=page.getByRole('button',{name:'Open controller accordion',exact:true});await accordionTrigger.click();
 await expect(page.getByText('Accordion panel',{exact:true})).toBeVisible();expect((await controllerState(page,'accordion')).value).toEqual(['details']);
 const cards=page.getByRole('button',{name:'Cards',exact:true}),rows=page.getByRole('button',{name:'Rows',exact:true});
 await expect(cards).toHaveAttribute('aria-pressed','true');
 await cards.click();await expect(cards).toHaveAttribute('aria-pressed','true');
 expect((await controllerState(page,'toggles')).value).toEqual(['cards'],'allowEmpty=false prevents clearing the last selected value');
 await rows.click();await expect(rows).toHaveAttribute('aria-pressed','true');
 expect((await controllerState(page,'toggles')).value).toEqual(['rows']);
 await page.evaluate(()=>window.controllerModes.controllers.toggles.update({multiple:true,allowEmpty:true}));
 await cards.click();expect((await controllerState(page,'toggles')).value).toEqual(['rows','cards'],'multiple policy is owned by the injected controller');
 await rows.click();expect((await controllerState(page,'toggles')).value).toEqual(['cards']);
 await cards.click();expect((await controllerState(page,'toggles')).value).toEqual([],'allowEmpty changes take effect in the mounted peer view');

 const valueMenuTrigger=page.getByRole('button',{name:'Value menu',exact:true});await valueMenuTrigger.click();
 const checkbox=page.getByRole('menuitemcheckbox',{name:'Injected checkbox item',exact:true});await checkbox.click();
 await expect(checkbox).toHaveAttribute('aria-checked','true');expect((await controllerState(page,'checkbox')).value).toBe(true);
 const radio=page.getByRole('menuitemradio',{name:'Radio two',exact:true});await radio.click();
 expect((await controllerState(page,'radio')).value).toBe('two');
});

test('Select and Combobox selection controllers keep rejected values while input, keyboard, pointer and focus stay with Base UI',async({page})=>{
 const select=page.getByRole('combobox',{name:'Injected select',exact:true});await select.click();
 const list=page.getByRole('listbox');await expect(list).toBeVisible();
 const beta=list.getByRole('option',{name:'Beta',exact:true});await beta.click();
 await expect(select).toHaveText('Alpha');expect((await controllerState(page,'select')).value).toBe('alpha');
 expect((await controllerEvents(page,'select.value')).map(event=>event.value)).toEqual(['beta']);
 await page.evaluate(()=>window.controllerModes.controllers.select.update({value:'beta'}));await expect(select).toHaveText('Beta');
 expect((await controllerEvents(page,'select.value')).map(event=>event.value)).toEqual(['beta']);

 await select.focus();await page.keyboard.press('Enter');await expect(page.getByRole('listbox')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('listbox')).toHaveCount(0);await expect(select).toBeFocused();

 const input=page.getByRole('combobox',{name:'Injected combobox',exact:true});await input.fill('be');
 await expect(page.getByTestId('state-combobox')).toContainText('"inputValue":"be"');
 await expect(page.getByRole('option',{name:'Beta',exact:true})).toBeVisible();
 await page.getByRole('option',{name:'Beta',exact:true}).click();
 expect((await controllerState(page,'combobox')).value).toBe('alpha');
 expect((await controllerEvents(page,'combobox.value')).map(event=>event.value)).toEqual(['beta']);
 expect((await controllerEvents(page,'combobox.input')).length).toBeGreaterThan(0);
});

test('StrictMode replacement unsubscribes the old injected controller and unmount never destroys either owner',async({page})=>{
 const first=page.getByRole('button',{name:'Open injected dialog',exact:true});
 await expect.poll(()=>page.evaluate(()=>window.controllerModes.controllers.dialog.activeSubscribers)).toBeGreaterThanOrEqual(2);
 await page.getByRole('button',{name:'Replace dialog controller',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.controllerModes.controllers.dialog.activeSubscribers)).toBe(1);
 await expect.poll(()=>page.evaluate(()=>window.controllerModes.controllers.dialogReplacement.activeSubscribers)).toBe(1);
 await page.evaluate(()=>window.controllerModes.controllers.dialog.update({open:true}));
 await expect(page.getByTestId('dialog-content')).toHaveCount(0);
 await page.evaluate(()=>window.controllerModes.controllers.dialogReplacement.update({open:true}));
 const dialog=page.getByRole('dialog',{name:'Injected dialog',exact:true});await expect(dialog).toBeVisible();

 await page.evaluate(()=>window.controllerModes.controllers.dialogReplacement.update({open:false}));await expect(dialog).toHaveCount(0);
 await page.getByRole('button',{name:'Unmount injected views',exact:true}).click();
 await expect(first).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>[window.controllerModes.controllers.dialog.activeSubscribers,window.controllerModes.controllers.dialogReplacement.activeSubscribers])).toEqual([0,0]);
 await page.evaluate(()=>{window.controllerModes.controllers.dialog.update({open:true});window.controllerModes.controllers.dialogReplacement.update({open:true});});
 expect(await controllerState(page,'dialog')).toEqual({open:true});expect(await controllerState(page,'dialogReplacement')).toEqual({open:true});
 await page.evaluate(()=>{window.controllerModes.controllers.dialog.update({open:false});window.controllerModes.controllers.dialogReplacement.update({open:false});});
 await page.getByRole('button',{name:'Mount injected views',exact:true}).click();
 const remounted=page.getByRole('dialog',{name:'Injected dialog',exact:true});await expect(remounted).toHaveCount(0);
 expect(await page.evaluate(()=>window.controllerModes.controllers.dialogReplacement.activeSubscribers)).toBeGreaterThanOrEqual(1);
});

test('ApiKeyManager with an injected view controller leaves its borrowed service start and destruction to the host',async({page})=>{
 const injectedView=page.locator('section[aria-label="Injected component view"]');
 await expect(injectedView).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.controllerModes.apiKeyReads.length)).toBe(0);
 expect(await page.evaluate(()=>window.controllerModes.apiKeyDestroyCalls())).toBe(0);

 await page.getByRole('button',{name:'Unmount injected views',exact:true}).click();
 await expect(injectedView).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>window.controllerModes.apiKeyDestroyCalls())).toBe(0);
 await page.evaluate(()=>window.controllerModes.apiKeyService.refresh());
 await expect.poll(()=>page.evaluate(()=>window.controllerModes.apiKeyReads.length)).toBe(1);

 await page.getByRole('button',{name:'Mount injected views',exact:true}).click();
 await expect(injectedView).toBeVisible();
 expect(await page.evaluate(()=>window.controllerModes.apiKeyReads.length)).toBe(1,'mounting an injected view does not start a refresh');
 expect(await page.evaluate(()=>window.controllerModes.apiKeyDestroyCalls())).toBe(0,'unmounting the view never destroys its borrowed service');
});

test('controlled password clear, visibility and lifecycle events stay with the replacement controller',async({page})=>{
 const input=page.locator('input[name="controller-password"]');
 await expect(input).toHaveAttribute('type','password');
 await page.evaluate(()=>window.controllerModes.usePasswordB());
 await expect(input).toHaveAttribute('type','text');
 expect((await controllerState(page,'passwordB')).visible).toBe(true);

 await page.evaluate(()=>window.controllerModes.clearPassword());
 await expect(input).toHaveValue('');
 await expect(input).toHaveAttribute('type','password','clearing a visible controlled input hides it immediately');
 expect((await controllerState(page,'passwordB')).cleared).toBe(true);
 expect((await controllerState(page,'passwordA')).cleared).toBe(false,'clearing the replacement cannot mutate the previous controller');
 await page.evaluate(()=>window.controllerModes.controllers.passwordB.toggle());
 await page.getByRole('button',{name:'Rerender password parent',exact:true}).click();
 await expect(input).toHaveAttribute('type','text');await expect(input).toHaveValue('');
 expect((await controllerState(page,'passwordB')).visible).toBe(true);
 expect((await controllerState(page,'passwordB')).cleared).toBe(true,'visibility and parent rerenders do not restore a cleared controlled value');

 await input.fill('synthetic-after-clear');
 await expect(input).toHaveValue('synthetic-after-clear');
 await page.evaluate(()=>window.controllerModes.controllers.passwordB.setVisible(true));
 await expect(input).toHaveAttribute('type','text');
 await page.evaluate(()=>window.controllerModes.resetPasswordForm());
 await expect(input).toHaveAttribute('type','password');
 await expect(input).toHaveValue('synthetic-after-clear','a controlled form reset preserves its owner value while hiding the secret');

 await page.evaluate(()=>window.controllerModes.controllers.passwordB.setVisible(true));
 await page.evaluate(()=>window.controllerModes.pagehidePassword());
 await expect(input).toHaveValue('');await expect(input).toHaveAttribute('type','password');
 expect((await controllerState(page,'passwordB')).cleared).toBe(true);
 expect((await controllerState(page,'passwordA')).cleared).toBe(false);
 expect((await page.evaluate(()=>window.controllerModes.passwordEvents)).some(event=>event.kind==='clear'&&event.value==='pagehide')).toBe(true);
});

test('releasing a replaced password-strength reader cannot make the old controller read the new DOM input',async({page})=>{
 const input=page.locator('input[aria-label="Leased strength password"]');
 await page.evaluate(()=>window.controllerModes.useStrengthB());
 await input.fill('x'.repeat(300));
 await expect.poll(()=>controllerState(page,'strengthB').then(state=>state.status)).toBe('unavailable');
 await page.evaluate(()=>window.controllerModes.controllers.strengthA.refresh());
 expect((await controllerState(page,'strengthA')).status).toBe('idle','the old controller falls back to its original empty reader after its view lease is released');
 expect((await controllerState(page,'strengthB')).status).toBe('unavailable','the old controller must not consume or mutate the replacement input');
});

test('Tabs preserve a non-first default and notify a cancelled missing-value fallback only once across parent rerenders',async({page})=>{
 const second=page.getByRole('tab',{name:'Second tab',exact:true});
 await expect(second).toHaveAttribute('aria-selected','true');
 expect((await controllerState(page,'tabsNonFirst')).value).toBe('B');
 expect((await controllerEvents(page,'tabsNonFirst')).length).toBe(0,'mounting tabs must preserve the explicit non-first default without a fallback callback');

 await page.getByRole('button',{name:'Remove selected cancellable tab',exact:true}).click();
 const fallback=page.getByRole('tab',{name:'Fallback B',exact:true});
 await expect(fallback).toHaveAttribute('aria-selected','false');
 await expect.poll(()=>page.evaluate(()=>window.controllerModes.cancelledTabRequests)).toEqual(['B']);
 await expect(page.getByTestId('cancelled-tab-revision')).toHaveText('1','the callback updates parent state while cancelling the fallback');
 expect((await controllerState(page,'tabsCancelled')).value).toBe('A','a cancelled missing-value fallback is not privately accepted');
 expect((await controllerEvents(page,'tabsCancelled')).map(event=>event.value)).toEqual(['B']);
 await page.getByRole('button',{name:'Rerender cancellable tabs',exact:true}).click();
 await expect(fallback).toHaveAttribute('aria-selected','false');
 await expect(page.getByTestId('cancelled-tab-revision')).toHaveText('2');
 expect(await page.evaluate(()=>window.controllerModes.cancelledTabRequests)).toEqual(['B'],'recording the cancelled request rerenders the parent but does not loop');
 expect((await controllerEvents(page,'tabsCancelled')).map(event=>event.value)).toEqual(['B']);
});

test('ApiKeyManager options created inline initialize one list owner and preserve the active draft on parent rerender',async({page})=>{
 const manager=page.locator('section[aria-label="Default API manager init options"]');
 await expect.poll(()=>page.evaluate(()=>window.controllerModes.inlineApiKeyReads.length)).toBe(1);
 await manager.getByRole('button',{name:'Create key',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Create API key',exact:true});
 await expect(dialog).toBeVisible();
 const name=dialog.getByRole('textbox',{name:'Name',exact:true});await name.fill('Draft retained');
 await page.evaluate(()=>window.controllerModes.rerenderInlineApi());
 await expect(name).toHaveValue('Draft retained');
 expect(await page.evaluate(()=>window.controllerModes.inlineApiKeyReads.length)).toBe(1,'new but equivalent inline options do not recreate or restart the owner');
});

test('a keyed borrowed ApiKey view replacement cannot close the new phase from the old view cleanup',async({page})=>{
 await loadDevelopmentFixture(page);
 await page.evaluate(()=>window.controllerModes.remountBorrowedAndOpenCreate());
 await expect.poll(()=>page.evaluate(()=>window.controllerModes.apiKeyService.getState().phase)).toBe('create');
 await expect(page.getByRole('dialog',{name:'Create API key',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>window.controllerModes.apiKeyDestroyCalls())).toBe(0);
});

test('a borrowed ApiKey service closes only after its last view exits, including StrictMode effect replay',async({page})=>{
 await loadDevelopmentFixture(page);
 await page.getByRole('button',{name:'Mount second borrowed API view',exact:true}).click();
 await page.evaluate(()=>window.controllerModes.apiKeyService.openCreate());
 await expect.poll(()=>page.evaluate(()=>window.controllerModes.apiKeyService.getState().phase)).toBe('create');
 await page.evaluate(()=>window.controllerModes.setMounted(false));
 await expect.poll(()=>page.evaluate(()=>window.controllerModes.apiKeyService.getState().phase)).toBe('create');
 expect(await page.evaluate(()=>window.controllerModes.apiKeyDestroyCalls())).toBe(0,'one surviving view keeps the shared borrowed service alive');
 await page.evaluate(()=>window.controllerModes.unmountSecondApiKeyView());
 await expect.poll(()=>page.evaluate(()=>window.controllerModes.apiKeyService.getState().phase)).toBe('closed');
 expect(await page.evaluate(()=>window.controllerModes.apiKeyDestroyCalls())).toBe(0,'the view lifecycle closes phase but never destroys its borrowed service');
});

test('AdminSetup defaults can switch back from injection and acquire an onCheck callback after initial render',async({page})=>{
 await page.getByRole('button',{name:'Use default admin setup',exact:true}).click();
 await expect(page.locator('section[aria-label="Admin setup mode"]')).toBeVisible();
 await page.getByRole('button',{name:'Set default admin unavailable',exact:true}).click();
 await expect(page.getByText('暂时无法创建管理员，请稍后再试。',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'重新核对状态',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Enable default admin check',exact:true}).click();
 const check=page.getByRole('button',{name:'重新核对状态',exact:true});await expect(check).toBeVisible();
 await check.click();
 await expect.poll(()=>page.evaluate(()=>window.controllerModes.adminCheckCalls())).toBe(1);
 expect((await controllerState(page,'admin')).status).toBe('idle','the detached injected controller stays isolated from the default view owner');
});

test('a runtime NumberInput controller and conflicting initialization props are caught at the view boundary',async({page})=>{
 await page.getByRole('button',{name:'Show conflicting number props',exact:true}).click();
 await expect(page.getByTestId('controller-conflict-error')).toContainText('TypeError: controller cannot be combined with value');
});
