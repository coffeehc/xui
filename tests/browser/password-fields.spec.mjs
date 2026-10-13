import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
let source;
test.beforeAll(async()=>{
  const result=await build({stdin:{contents:`
import * as React from 'react';import {createRoot} from 'react-dom/client';
import {NewPasswordFields} from './packages/ui-react/src/password.tsx';
import {createNewPasswordFields} from './packages/runtime/src/password-dom.ts';
const policy={version:1,minimum_characters:6,maximum_characters:32,counting_unit:'unicode_code_points'};
window.mountPassword=(kind)=>{let handle=null,root=null;const host=document.createElement('div');document.body.append(host);
if(kind==='react'){root=createRoot(host);root.render(React.createElement(NewPasswordFields,{policy,ref:value=>handle=value}));}
else{handle=createNewPasswordFields({policy});host.append(handle.element);}
window.passwordFixture={read:()=>handle.readValidatedPassword(),clear:()=>handle.clear(),destroy:()=>{window.detachedPasswords=[...host.querySelectorAll('input')];if(root)root.unmount();else handle.destroy();}};};`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',target:'es2022'});source=result.outputFiles[0].text;
});
for(const kind of ['react','native'])test(`${kind} shared password fields validate Unicode, confirmation, clear and teardown`,async({page})=>{
  await page.setContent('<main></main>');await page.addScriptTag({content:source});await page.evaluate(kind=>window.mountPassword(kind),kind);
  const password=page.getByLabel('新密码',{exact:true}),confirmation=page.getByLabel('确认密码',{exact:true});
  await expect(password).toBeVisible();
  for(const [value,valid] of [['a'.repeat(5),false],['a'.repeat(6),true],['中'.repeat(32),true],['😀'.repeat(32),true],['😀'.repeat(33),false],['      ',true],['e\u0301e\u0301e\u0301',true]]){
    await password.fill(value);await confirmation.fill(value);expect(await page.evaluate(()=>window.passwordFixture.read())).toBe(valid?value:null);
    if(!valid){await expect(password).toHaveAttribute('aria-invalid','true');await expect(password).toBeFocused();}
  }
  await password.fill('abcdef');await confirmation.fill('abcdeg');expect(await page.evaluate(()=>window.passwordFixture.read())).toBeNull();await expect(confirmation).toBeFocused();await expect(page.getByText('两次输入的密码不一致。')).toBeVisible();
  await confirmation.fill('abcdef');expect(await page.evaluate(()=>window.passwordFixture.read())).toBe('abcdef');
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));await expect(password).toHaveValue('');await expect(confirmation).toHaveValue('');
  await password.fill('abcdef');await confirmation.fill('abcdef');await page.evaluate(()=>window.passwordFixture.destroy());expect(await page.evaluate(()=>window.detachedPasswords.map(field=>field.value))).toEqual(['','']);
});
