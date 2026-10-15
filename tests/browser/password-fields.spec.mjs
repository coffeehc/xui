import {test,expect} from '@playwright/test';
import {build} from 'esbuild';

let source;
test.beforeAll(async()=>{
 const result=await build({stdin:{contents:`
import * as React from 'react';import {createRoot} from 'react-dom/client';
import {PasswordInput} from '@coffeehc/xui-react/text-inputs';
import {PasswordStrengthInput,NewPasswordFields} from '@coffeehc/xui-react/password';
function ReactInput({mode,controlled,onReady}){
 const [value,setValue]=React.useState(''),[required,setRequired]=React.useState(true),[readOnly,setReadOnly]=React.useState(false),[disabled,setDisabled]=React.useState(false),[revision,setRevision]=React.useState(0);
 const input=React.useRef(null),control=React.useRef(null),Component=mode==='strength'?PasswordStrengthInput:PasswordInput;
 React.useLayoutEffect(()=>{onReady({input:()=>input.current,clear:()=>control.current?.clear(),state:()=>({required,readOnly,disabled,revision}),update(patch){if('required'in patch)setRequired(patch.required);if('readOnly'in patch)setReadOnly(patch.readOnly);if('disabled'in patch)setDisabled(patch.disabled);if(patch.rerender)setRevision(n=>n+1);}});},[required,readOnly,disabled,revision,onReady]);
 const valueProps=controlled?{value,onValueChange:setValue}:{};
 return React.createElement('form',{id:'password-input-form'},React.createElement(Component,{...valueProps,ref:input,controlRef:control,'aria-label':'新密码',name:'password',form:'password-input-form',autoComplete:'new-password',required,readOnly,disabled,prefix:'前缀',suffix:'后缀'}),React.createElement('output',{'data-revision':''},String(revision)));
}
function ReactNewPasswordForm(){
 const handle=React.useRef(null);React.useLayoutEffect(()=>{window.passwordFields=handle.current;},[]);
 return React.createElement('form',{id:'password-validation-form',onSubmit:event=>{event.preventDefault();window.passwordFixture.lastResult=handle.current.readValidatedPassword()===null?null:'accepted';}},React.createElement(NewPasswordFields,{ref:handle}),React.createElement('button',{type:'submit'},'Validate password fixture'));
}
window.mountPassword=(mode='strength',controlled=true)=>{
 const host=document.createElement('div');host.className='xui';document.body.append(host);const root=createRoot(host,{identifierPrefix:'password-fixture-'});
 root.render(React.createElement(ReactInput,{mode,controlled,onReady:fixture=>{window.passwordFixture={...fixture,destroy:()=>root.unmount()};}}));
};
window.mountNewPasswordFields=()=>{const host=document.createElement('div');host.className='xui';document.body.append(host);const root=createRoot(host,{identifierPrefix:'password-validation-'});window.passwordFixture={lastResult:undefined,clear:()=>window.passwordFields?.clear(),destroy:()=>root.unmount()};root.render(React.createElement(ReactNewPasswordForm));};
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',target:'es2022'});source=result.outputFiles[0].text;
});

for(const mode of ['plain','strength'])test(`${mode} password input preserves its DOM value, selection, form and native flags`,async({page})=>{
 await page.goto('/react/');await page.addScriptTag({content:source});await page.evaluate(mode=>window.mountPassword(mode,true),mode);
 const input=page.getByLabel('新密码'),toggle=page.getByRole('button',{name:'Show password'});await page.waitForFunction(()=>typeof window.passwordFixture?.input==='function');await expect(input).toBeVisible();await expect(input).toHaveAttribute('name','password');await expect(input).toHaveAttribute('form','password-input-form');await expect(input).toHaveAttribute('required','');await expect(input).toHaveAttribute('autocomplete','new-password');
 await input.fill('sample-password');await input.evaluate(node=>node.setSelectionRange(2,8));const initial=await input.evaluate(node=>({value:node.value,selection:[node.selectionStart,node.selectionEnd],type:node.type}));
 await page.evaluate(()=>window.passwordFixture.update({rerender:true}));
 await expect(input).toHaveValue('sample-password');expect(await input.evaluate(node=>node.type)).toBe(initial.type);expect(await page.evaluate(()=>window.passwordFixture.input()===document.querySelector('input[name=password]'))).toBe(true);expect(await input.evaluate(node=>[node.selectionStart,node.selectionEnd])).toEqual(initial.selection);
 await toggle.focus();await page.keyboard.press('Enter');await expect(input).toHaveAttribute('type','text');await expect(input.evaluate(node=>[node.selectionStart,node.selectionEnd])).resolves.toEqual(initial.selection);
 await page.evaluate(()=>window.passwordFixture.update({required:false,readOnly:true,disabled:true}));await expect(input).toBeDisabled();await expect(input).toHaveAttribute('readonly','');await expect(input).not.toHaveAttribute('required');
 await page.evaluate(()=>window.passwordFixture.update({disabled:false,readOnly:false,required:true}));await expect(input).toBeEnabled();await expect(input).not.toHaveAttribute('readonly');await expect(input).toHaveAttribute('required','');
 expect(await page.evaluate(()=>new FormData(document.getElementById('password-input-form')).get('password'))).toBe('sample-password');
 await page.evaluate(()=>window.passwordFixture.clear());await expect(input).toHaveValue('');await expect(input).toHaveAttribute('type','password');await page.evaluate(()=>window.passwordFixture.destroy());
});

test('React fixed new-password form validates Unicode code points and clears without retaining a secret',async({page})=>{
 await page.goto('/react/');await page.addScriptTag({content:source});await page.evaluate(()=>window.mountNewPasswordFields());const password=page.getByLabel(/^新密码(?:\s*\*)?$/),confirmation=page.getByLabel(/^确认密码(?:\s*\*)?$/),submit=page.getByRole('button',{name:'Validate password fixture'}),tooltip=page.locator('.xui-tooltip-popup:visible');await expect(password).toBeVisible();
 for(const [value,valid] of [['a'.repeat(5),false],['a'.repeat(6),true],['中'.repeat(32),true],['😀'.repeat(32),true],['😀'.repeat(33),false],['      ',true],['e\u0301e\u0301e\u0301',true]]){
  await password.fill(value);await confirmation.fill(value);await submit.click();expect(await page.evaluate(()=>window.passwordFixture.lastResult)).toBe(valid?'accepted':null);if(!valid){await expect(password).toHaveAttribute('aria-invalid','true');await expect(password).toBeFocused();await expect(tooltip).toBeVisible();await expect(tooltip).toContainText(value.length>32?'最多32个字符':'至少6个字符');}else await expect(tooltip).toBeHidden();
 }
 await password.fill('abcdef');await confirmation.fill('abcdeg');await submit.click();expect(await page.evaluate(()=>window.passwordFixture.lastResult)).toBeNull();await expect(confirmation).toBeFocused();await expect(confirmation).toHaveAttribute('aria-invalid','true');await expect(tooltip).toBeVisible();await expect(tooltip).toHaveText('两次密码不一致');
 const association=await confirmation.evaluate(input=>{const id=input.getAttribute('aria-describedby')?.split(/\s+/).find(value=>document.getElementById(value)?.classList.contains('xui-error'));return {id,text:id?document.getElementById(id)?.textContent:null};});expect(association.id).toBeTruthy();expect(association.text).toBe('两次密码不一致');
 const geometry=await tooltip.evaluate(tip=>{const input=document.querySelector('input[autocomplete="new-password"]:focus');if(!(input instanceof HTMLInputElement))return null;const a=input.getBoundingClientRect(),b=tip.getBoundingClientRect(),dx=Math.max(0,a.left-b.right,b.left-a.right),dy=Math.max(0,a.top-b.bottom,b.top-a.bottom);return {input:{x:a.x,y:a.y,width:a.width,height:a.height},tip:{x:b.x,y:b.y,width:b.width,height:b.height},distance:Math.hypot(dx,dy)};});expect(geometry,'invalid input exposes a positioned tooltip').not.toBeNull();expect(geometry.distance,'validation tip stays adjacent to the invalid input').toBeLessThanOrEqual(40);
 await page.keyboard.press('Escape');await expect(tooltip).toBeHidden();await expect(confirmation).toHaveAttribute('aria-invalid','true');
 await submit.click();expect(await page.evaluate(()=>window.passwordFixture.lastResult)).toBeNull();await expect(tooltip).toBeVisible();await page.keyboard.press('Tab');const confirmationToggle=page.getByRole('button',{name:'Show password'}).last();await expect(confirmationToggle).toBeFocused();await expect(tooltip).toBeHidden();await expect(confirmation).toHaveAttribute('aria-invalid','true');await expect(confirmation).toHaveAttribute('aria-describedby',association.id);await expect(page.locator(`[id=${JSON.stringify(association.id)}]`)).toHaveText('两次密码不一致');
 await confirmationToggle.click();await expect(confirmation).toHaveAttribute('type','text');await expect(confirmation).toHaveAttribute('aria-invalid','true');await expect(confirmation).toHaveAttribute('aria-describedby',association.id);
 await submit.click();expect(await page.evaluate(()=>window.passwordFixture.lastResult)).toBeNull();await expect(tooltip).toBeVisible();await password.fill('abcdef');await expect(tooltip).toBeHidden();await expect(password).not.toHaveAttribute('aria-invalid','true');await expect(confirmation).not.toHaveAttribute('aria-invalid','true');
 await password.fill('abcdef');await confirmation.fill('abcdef');await submit.click();expect(await page.evaluate(()=>window.passwordFixture.lastResult)).toBe('accepted');await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));await expect(password).toHaveValue('');await expect(confirmation).toHaveValue('');
 await page.evaluate(()=>window.passwordFixture.destroy());
});
