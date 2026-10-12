import {test,expect} from '@playwright/test';
async function setup(page,config={}){await page.goto('/react/foundation-contract.html');await page.waitForFunction(()=>typeof window.renderFoundationCase==='function');const id=await page.evaluate(config=>window.renderFoundationCase(config),config);await expect(page.locator('[data-foundation-case]')).toHaveAttribute('data-foundation-case',String(id));}
async function freezeClock(page){await page.clock.install({time:0});await page.clock.pauseAt(1000);}
for(const option of ['defaultOpen','open'])test(`native generic shell ${option} moves its sidebar before resolving initial focus`,async({page})=>{
 await page.setViewportSize({width:390,height:844});await setup(page);
 await page.evaluate(option=>{
   const frame=document.createElement('div');frame.id='initial-shell';frame.className='xui-shell';
   frame.innerHTML='<header class="xui-shell-header"><button type="button" data-xui-sidebar-toggle>Open navigation</button></header><aside class="xui-shell-sidebar" data-xui-sidebar><nav aria-label="Initial navigation"><a href="#overview" data-menu-control="primary" data-menu-id="overview" tabindex="-1">Overview</a><a href="#settings" data-menu-control="primary" data-menu-id="settings" aria-current="page" tabindex="0">Settings</a></nav></aside><main tabindex="-1">Main content</main><dialog class="xui-native-dialog" data-xui-sidebar-dialog aria-labelledby="initial-shell-title"><h2 id="initial-shell-title">Initial navigation</h2><div data-xui-sidebar-content></div><button type="button" data-xui-close>Close navigation</button></dialog>';
   // The controlled case also covers ordinary public nav/link markup without
   // data-menu-control or roving tabindex, as used by foundation-vanilla.
   if(option==='open')for(const link of frame.querySelectorAll('nav a')){link.removeAttribute('data-menu-control');link.removeAttribute('tabindex');}
   document.body.append(frame);frame.querySelector('[data-xui-sidebar-toggle]').focus();window.initialShellFocus=[];
   frame.addEventListener('focusin',event=>{if(event.target.matches('nav a'))window.initialShellFocus.push(event.target.dataset.menuId);});
   window.initialShell=window.foundationTools.createShellController(frame,{[option]:true});
 },option);
 const frame=page.locator('#initial-shell'),dialog=frame.locator('dialog'),target=frame.locator('[data-menu-id="settings"]'),trigger=frame.locator('[data-xui-sidebar-toggle]');
 await expect(dialog).toBeVisible();await expect(target).toBeFocused();await expect(dialog.locator('[data-xui-sidebar]')).toHaveCount(1);expect(await page.evaluate(()=>window.initialShellFocus)).toEqual(['settings']);
 await page.evaluate(()=>window.initialShell.syncOpen(false));await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
 await page.evaluate(()=>window.initialShell.syncOpen(true));await expect(dialog).toBeVisible();await expect(target).toBeFocused();
 await page.evaluate(()=>window.initialShell.destroy());await expect(dialog).toBeHidden();await expect(frame.locator(':scope > [data-xui-sidebar]')).toHaveCount(1);
});
test('formal Button peer contract preserves ref, render, class function, busy enabled and single activation',async({page})=>{
 await setup(page);const busy=page.getByRole('button',{name:'Busy enabled',exact:true});await expect(busy).toHaveAttribute('data-forwarded-ref','true');await expect(busy).toHaveClass(/host-button/);await expect(busy).toBeEnabled();await busy.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');expect(await page.evaluate(()=>window.foundationEvents)).toEqual(['button-click','button-click']);
 await page.getByRole('link',{name:'Link action',exact:true}).focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.foundationEvents)).toEqual(['button-click','button-click','link-click']);await page.getByText('Disabled link',{exact:true}).click({force:true});expect(await page.evaluate(()=>window.foundationEvents)).not.toContain('disabled-click');
});
test('Field owns one coherent label/id and Fieldset never duplicates child ids',async({page})=>{
 await setup(page);await page.getByText('Explicit control',{exact:true}).click();await expect(page.getByLabel('Explicit control',{exact:true})).toBeFocused();await expect(page.getByLabel('Explicit control',{exact:true})).toHaveAttribute('id','explicit-control');await expect(page.getByLabel('Explicit control',{exact:true})).toHaveAttribute('aria-describedby','explicit-control-help explicit-control-error');await expect(page.getByLabel('Owner control',{exact:true})).toHaveAttribute('id','owner-control');
 expect(await page.getByRole('group',{name:'Choice group',exact:true}).locator('input').evaluateAll(nodes=>nodes.every(node=>!node.id)&&new Set(nodes.map(node=>node.labels[0]?.textContent)).size===5)).toBe(true);
});
test('Pagination Disclosure and Select support controlled and uncontrolled values with peer cancellation',async({page})=>{
 for(const controlled of [true,false])for(const cancelSelect of [true,false]){await setup(page,{controlled,cancelSelect});await expect(page.getByRole('button',{name:'Previous page',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(page.getByText('2 / 3',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Details',exact:false}).click();await expect(page.getByText('Expanded details',{exact:true})).toBeVisible();const select=page.getByLabel('Contract select',{exact:true});await select.click();await expect(select).toHaveClass(/host-open/);await expect(page.getByRole('option',{name:'Disabled',exact:true})).toHaveAttribute('aria-disabled','true');await page.getByRole('option',{name:'Two',exact:true}).click();await expect(select).toHaveText(cancelSelect?'One':'Two');expect(await page.evaluate(()=>window.foundationEvents)).toContain('select:Two');}
});
test('RenderBoundary recovers view exceptions without running resource retry',async({page})=>{
 await setup(page,{throwRender:true});await expect(page.getByRole('alert')).toContainText('Render failed');expect(await page.evaluate(()=>window.foundationEvents)).toEqual(['render-error']);await page.evaluate(()=>window.repairView());await page.getByRole('button',{name:'Reset render',exact:true}).click();await expect(page.getByText('View ready',{exact:true})).toBeVisible();expect(await page.evaluate(()=>window.foundationEvents)).toEqual(['render-error']);
});
test('native tooltip resumes keyboard after touch, disabled close remains open, toast timer resumes after focus',async({page})=>{
 await setup(page);await page.evaluate(()=>{const box=document.createElement('div');box.innerHTML='<button id="nt">Tip</button><div id="np">Native tip</div><button id="ndt">Dialog</button><dialog id="nd"><h2>Native dialog</h2><button data-xui-close aria-disabled="true" id="nclose">Disabled close</button></dialog><div id="nv"></div><button id="outside">Outside</button>';document.body.append(box);const $=id=>document.getElementById(id);window.nativeControls={tip:window.foundationTools.createPopoverController($('nt'),$('np'),{tooltip:true}),dialog:window.foundationTools.createDialogController($('nd'),$('ndt')),toast:window.foundationTools.createToastController($('nv'))};});
 const tip=page.locator('#nt');await tip.focus();await expect(page.locator('#np')).toBeVisible();await page.keyboard.press('Escape');await tip.dispatchEvent('pointerdown',{pointerType:'touch'});await tip.click();await page.locator('#outside').focus();await page.keyboard.press('Shift+Tab');await tip.focus();await expect(page.locator('#np')).toBeVisible();
 await page.locator('#ndt').click();await page.locator('#nclose').click({force:true});await expect(page.locator('#nd')).toBeVisible();
 await page.evaluate(()=>{window.dialogClosed=new Promise(resolve=>document.querySelector('#nd').addEventListener('close',resolve,{once:true}));});
 await page.keyboard.press('Escape');await page.evaluate(()=>window.dialogClosed);await expect(page.locator('#nd')).not.toBeVisible();
 // The native dialog close event restores focus in a later task. Settle that
 // lifecycle before starting a separate toast focus assertion.
 await expect(page.locator('#ndt')).toBeFocused();
 await page.mouse.move(0,0);await freezeClock(page);
 await page.evaluate(()=>{window.nativeControls.toast.add({title:'Timed toast',timeoutMs:400});document.querySelector('#nv button').focus();});
 const toast=page.locator('#nv .xui-toast'),close=toast.getByRole('button');
 await expect(close).toBeFocused();expect(await toast.evaluate(el=>el.matches(':hover'))).toBe(false);
 await page.clock.runFor(450);await expect(toast).toBeVisible();await expect(close).toBeFocused();
 await page.locator('#outside').focus();await expect(page.locator('#outside')).toBeFocused();
 expect(await toast.evaluate(el=>el.matches(':hover')||el.contains(document.activeElement))).toBe(false);
 await page.clock.runFor(399);await expect(toast).toBeVisible();await page.clock.runFor(1);await expect(toast).toHaveCount(0);
 await page.evaluate(()=>Object.values(window.nativeControls).forEach(control=>control.destroy()));
});

test('native toast preserves remaining time until both hover and focus leave',async({page})=>{
 await setup(page);await page.mouse.move(0,0);await freezeClock(page);
 await page.evaluate(()=>{
   const viewport=document.createElement('div');viewport.id='toast-contract';document.body.append(viewport);
   const outside=document.createElement('button');outside.id='toast-outside';outside.textContent='Outside';document.body.append(outside);
   window.toastContract=window.foundationTools.createToastController(viewport);
   window.toastContract.add({id:'timed',title:'Remaining time',timeoutMs:1000});
   const second=document.createElement('button');second.id='toast-second';second.textContent='Second focus target';viewport.firstElementChild.append(second);
 });
 const toast=page.locator('#toast-contract .xui-toast'),close=toast.getByRole('button',{name:'Dismiss notification'}),second=page.locator('#toast-second'),outside=page.locator('#toast-outside');
 expect(await page.evaluate(()=>document.hidden)).toBe(false);expect(await toast.evaluate(el=>el.matches(':hover'))).toBe(false);
 await page.clock.runFor(250);await toast.hover();expect(await toast.evaluate(el=>el.matches(':hover'))).toBe(true);
 await page.clock.runFor(1000);await expect(toast).toBeVisible();
 await close.focus();await expect(close).toBeFocused();await page.mouse.move(0,0);
 expect(await toast.evaluate(el=>el.matches(':hover'))).toBe(false);await page.clock.runFor(1000);await expect(toast).toBeVisible();
 await second.focus();await expect(second).toBeFocused();await page.clock.runFor(1000);await expect(toast).toBeVisible();
 await toast.hover();await outside.focus();await expect(outside).toBeFocused();
 expect(await toast.evaluate(el=>el.matches(':hover')&&!el.contains(document.activeElement))).toBe(true);
 await page.clock.runFor(1000);await expect(toast).toBeVisible();
 await page.mouse.move(0,0);expect(await toast.evaluate(el=>el.matches(':hover'))).toBe(false);
 await page.clock.runFor(749);await expect(toast).toBeVisible();await page.clock.runFor(1);await expect(toast).toHaveCount(0);
 await page.evaluate(()=>window.toastContract.destroy());
});

test('native toast timeout ownership survives replacement, focus close and destroy',async({page})=>{
 await setup(page);await page.mouse.move(0,0);await freezeClock(page);
 await page.evaluate(()=>{const viewport=document.createElement('div');viewport.id='toast-contract';document.body.append(viewport);window.toastContract=window.foundationTools.createToastController(viewport);window.toastContract.add({id:'same',title:'Old',timeoutMs:1000});});
 await page.clock.runFor(250);await page.evaluate(()=>window.toastContract.add({id:'same',title:'Replacement',timeoutMs:2000}));
 await page.clock.runFor(750);await expect(page.getByText('Replacement',{exact:true})).toBeVisible();
 const viewport=page.locator('#toast-contract'),close=viewport.getByRole('button');await close.focus();await expect(close).toBeFocused();
 await page.evaluate(()=>window.toastContract.close('same'));await expect(viewport).toBeFocused();await expect(viewport.locator('.xui-toast')).toHaveCount(0);
 await page.evaluate(()=>{window.toastContract.add({title:'Persistent'});window.toastContract.add({title:'Removed on destroy',timeoutMs:1000});window.toastContract.destroy();});
 await page.clock.runFor(10000);await expect(viewport.locator('.xui-toast')).toHaveCount(0);
 expect(await page.evaluate(()=>window.toastContract.add({title:'After destroy'}))).toBe('');
});

test('native toast remaining time is independent of system clock changes',async({page})=>{
 await setup(page);await page.mouse.move(0,0);await freezeClock(page);
 await page.evaluate(()=>{const viewport=document.createElement('div');viewport.id='toast-contract';document.body.append(viewport);const outside=document.createElement('button');outside.id='toast-outside';outside.textContent='Outside';document.body.append(outside);window.toastContract=window.foundationTools.createToastController(viewport);});
 for(const jump of [-5000,5000]) {
   await page.evaluate(()=>window.toastContract.add({title:'Clock change',timeoutMs:1000}));
   const toast=page.locator('#toast-contract .xui-toast'),close=toast.getByRole('button');
   await page.clock.runFor(250);const before=await page.evaluate(()=>({wall:Date.now(),monotonic:performance.now()}));
   await page.clock.setSystemTime(before.wall+jump);
   expect(await page.evaluate(()=>performance.now())).toBe(before.monotonic);
   await close.focus();await expect(close).toBeFocused();expect(await toast.evaluate(el=>el.matches(':hover'))).toBe(false);
   await page.clock.runFor(1000);await expect(toast).toBeVisible();
   await page.locator('#toast-outside').focus();await expect(page.locator('#toast-outside')).toBeFocused();
   await page.clock.runFor(749);await expect(toast).toBeVisible();await page.clock.runFor(1);await expect(toast).toHaveCount(0);
 }
 await page.evaluate(()=>window.toastContract.destroy());
});
