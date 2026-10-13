import {test,expect} from '@playwright/test';
import {existsSync} from 'node:fs';
// Security floor: no --no-sandbox fallback on restricted workers.
test.use({launchOptions:{...(process.env.CI?{channel:'chrome'}:existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),chromiumSandbox:true,args:[]}});
for(const kind of ['react','vanilla']){
 test(`${kind}: controlled selection, all universe, native radios, reset and focus`,async({page})=>{
  await page.goto(`/choice-group-${kind}/`);const check=page.getByRole('group',{name:'Permissions'}),radio=page.getByRole('group',{name:'Mode'}),read=check.getByLabel('Read',{exact:true}),write=check.getByLabel('Write',{exact:true});
  await check.getByLabel('Select available').check();await expect(read).toBeChecked();await expect(write).toBeChecked();await expect(check.getByLabel('Locked')).toBeChecked();await expect(page.getByLabel('State')).toContainText('unknown');
  await check.getByLabel('Select available').uncheck();await expect(check.getByLabel('Locked')).toBeChecked();await expect(read).not.toBeChecked();
  await expect(radio.getByLabel('Read',{exact:true})).toHaveJSProperty('required',true);expect(await page.locator('form').evaluate(form=>form.checkValidity())).toBe(false);
  await radio.getByLabel('Read',{exact:true}).check();await radio.getByLabel('Read',{exact:true}).press('ArrowRight');await expect(radio.getByLabel('Write',{exact:true})).toBeChecked();
  await read.check();await page.getByRole('button',{name:'Reset form'}).click();await expect(read).toBeChecked();await expect(radio.getByLabel('Write',{exact:true})).toBeChecked();
  const formData=await page.locator('form').evaluate(form=>[...new FormData(form)]);expect(formData).toContainEqual(['permissions','read']);expect(formData).not.toContainEqual(['permissions','locked']);expect(formData).not.toContainEqual(['permissions','unknown']);
  await page.getByRole('button',{name:'Toggle acceptance'}).click();await read.click();await expect(read).toBeChecked();
  await page.getByRole('button',{name:'Toggle readonly'}).click();await read.press('Space');await expect(read).toBeChecked();
  await page.getByRole('button',{name:'Toggle readonly'}).click();await write.focus();await page.getByRole('button',{name:'Remove write'}).evaluate(button=>button.click());await expect(read).toBeFocused();
 });
 test(`${kind}: narrow and dark theme choices remain reachable`,async({page})=>{await page.setViewportSize({width:320,height:700});await page.emulateMedia({colorScheme:'dark'});await page.goto(`/choice-group-${kind}/`);await expect(page.getByRole('group',{name:'Permissions'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);});
}
