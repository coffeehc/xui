import {test,expect} from '@playwright/test';
for(const kind of ['react','native'])for(const theme of ['light','dark','system'])test(`${kind} ${theme} input typography uses the control weight token`,async({page},info)=>{
 await page.emulateMedia({colorScheme:theme==='light'?'light':'dark'});await page.goto('/react/foundation-contract.html');await page.waitForFunction(()=>!!window.renderInputTypographyCase);await page.evaluate(({native,theme})=>{document.documentElement.dataset.theme=theme;window.renderInputTypographyCase(native);},{native:kind==='native',theme});
 const controls=[page.getByRole('textbox',{name:'Text control',exact:true}),page.getByRole('textbox',{name:'Multiline control',exact:true}),page.getByRole('combobox',{name:'Native selection',exact:true})];
 if(kind==='react')controls.push(page.getByRole('combobox',{name:'Themed selection',exact:true}),page.getByRole('combobox',{name:'Searchable selection',exact:true}));
 for(const control of controls){await expect(control).toBeVisible();await expect(control).toHaveCSS('font-weight','500');await expect(control).toHaveCSS('font-size','14px');await expect(control).toHaveCSS('line-height','22px');}
 await info.attach('default-control-type',{body:await page.screenshot(),contentType:'image/png'});
 await page.evaluate(()=>document.documentElement.style.setProperty('--font-weight-control','700'));
 for(const control of controls){await expect(control).toHaveCSS('font-weight','700');await expect(control).toHaveCSS('font-size','14px');await expect(control).toHaveCSS('line-height','22px');}
 await page.getByRole('textbox',{name:'Text control',exact:true}).fill('Still editable');await expect(page.getByRole('textbox',{name:'Text control',exact:true})).toHaveValue('Still editable');await info.attach('overridden-control-type',{body:await page.screenshot(),contentType:'image/png'});
});
