import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
let source;
test.beforeAll(async()=>{
 const result=await build({stdin:{contents:`
import * as React from 'react';import {createRoot} from 'react-dom/client';
import {SimpleSelect,Field} from '@coffeehc/xui-react/forms';import {bindSelectControl} from '@coffeehc/xui-runtime/dom';
const root=document.createElement('div');document.body.append(root);
window.mountSelect=kind=>{const options=[React.createElement('option',{value:'a',key:'a'},'Alpha'),React.createElement('optgroup',{label:'Visible group',key:'group'},React.createElement('option',{value:'b'},'Beta')),React.createElement('optgroup',{label:'Hidden group',hidden:true,key:'hidden'},React.createElement('option',{value:'h'},'Hidden value'))];let binding,react;
 if(kind==='react'){react=createRoot(root);react.render(React.createElement('form',null,React.createElement(Field,{label:'Choice'},React.createElement(SimpleSelect,{name:'choice',defaultValue:'a'},...options))));}
 else {root.innerHTML='<form><label for="choice">Choice</label><select id="choice" name="choice"><option value="a" selected>Alpha</option><optgroup label="Visible group"><option value="b">Beta</option></optgroup><optgroup label="Hidden group" hidden><option value="h">Hidden value</option></optgroup></select></form>';binding=bindSelectControl(root.querySelector('select'));}
 window.selectForm={reset:cancel=>{const form=root.querySelector('form');if(cancel)form.addEventListener('reset',event=>event.preventDefault(),{once:true});form.reset();},value:()=>new FormData(root.querySelector('form')).get('choice'),destroy:()=>{if(react)react.unmount();else binding.destroy();}};
};`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',target:'es2022'});source=result.outputFiles[0].text;
});
for(const kind of ['react','native'])test(`${kind} themed select honors reset cancellation, optgroups and form values`,async({page})=>{
 await page.goto('/react/');await page.addScriptTag({content:source});await page.evaluate(kind=>window.mountSelect(kind),kind);const trigger=page.getByRole('combobox',{name:'Choice',exact:true});await expect(trigger).toHaveText('Alpha');await trigger.click();await expect(page.getByRole('group',{name:'Visible group',exact:true})).toBeVisible();await expect(page.getByRole('option',{name:'Hidden value',exact:true})).toHaveCount(0);await page.getByRole('option',{name:'Beta',exact:true}).click();await expect(trigger).toHaveText('Beta');expect(await page.evaluate(()=>window.selectForm.value())).toBe('b');
 await page.evaluate(()=>window.selectForm.reset(true));await expect(trigger).toHaveText('Beta');expect(await page.evaluate(()=>window.selectForm.value())).toBe('b');
 await page.evaluate(()=>window.selectForm.reset(false));await expect(trigger).toHaveText('Alpha');expect(await page.evaluate(()=>window.selectForm.value())).toBe('a');
 const id=await trigger.getAttribute('id'),control=page.locator(`.xui-select-control:has(button[id=${JSON.stringify(id)}])`);await expect(control).toHaveCount(1);await page.evaluate(()=>{window.selectForm.reset(false);window.selectForm.destroy();});await expect(control).toHaveCount(0);
});
