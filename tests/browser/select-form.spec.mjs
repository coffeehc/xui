import {expect,test} from '@playwright/test';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {expectOptionSpacing} from './option-spacing.mjs';

let source,themeCss;
test.beforeAll(async()=>{
 const {runDirectory}=JSON.parse(await readFile('.consumers/latest.json','utf8'));
 const cwd=resolve(runDirectory,'react');
 const require=createRequire(resolve(cwd,'package.json'));
 themeCss=await readFile(require.resolve('@coffeehc/xui-theme/style.css'),'utf8');
 const contents=`
import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {SimpleSelect,Field} from '@coffeehc/xui-react/forms';
const root=document.getElementById('select-fixture');
const options=[React.createElement('option',{value:'a',key:'a'},'Alpha'),React.createElement('optgroup',{label:'Visible group',key:'group'},React.createElement('option',{value:'b'},'Beta'),React.createElement('option',{value:'c'},'Gamma')),React.createElement('optgroup',{label:'Hidden group',hidden:true,key:'hidden'},React.createElement('option',{value:'h'},'Hidden value'))];
let react;
window.mountSelect=()=>{react=createRoot(root,{identifierPrefix:'select-fixture-'});react.render(React.createElement('form',null,React.createElement(Field,{label:'Choice',required:true},React.createElement(SimpleSelect,{id:'choice',name:'choice',defaultValue:'a'},...options))));window.selectForm={reset:cancel=>{const form=root.querySelector('form');if(cancel)form.addEventListener('reset',event=>event.preventDefault(),{once:true});form.reset();},value:()=>new FormData(root.querySelector('form')).get('choice'),destroy:()=>react.unmount()};};
window.mountSelectLabels=()=>{react=createRoot(root,{identifierPrefix:'select-label-fixture-'});react.render(React.createElement('form',null,
 React.createElement(Field,{label:'Wrapped choice'},React.createElement(SimpleSelect,{name:'wrapped',defaultValue:'a'},React.createElement('option',{value:'a'},'Alpha'),React.createElement('option',{value:'b'},'Beta'))),
 React.createElement(Field,{label:'External choice',controlId:'external'},React.createElement(SimpleSelect,{id:'external',name:'external',defaultValue:'a'},React.createElement('option',{value:'a'},'Alpha'),React.createElement('option',{value:'b'},'Beta'))),
 React.createElement(Field,{label:'Visible choice'},React.createElement(SimpleSelect,{name:'explicit',defaultValue:'a','aria-label':'Explicit name'},React.createElement('option',{value:'a'},'Alpha'),React.createElement('option',{value:'b'},'Beta'))),
 React.createElement(Field,{label:React.createElement('span',{id:'referenced-name'},'Referenced name')},React.createElement(SimpleSelect,{name:'labelledby',defaultValue:'a','aria-label':'Fallback name','aria-labelledby':'referenced-name'},React.createElement('option',{value:'a'},'Alpha'),React.createElement('option',{value:'b'},'Beta'))),
 React.createElement(Field,{label:React.createElement(React.Fragment,null,'Hidden choice',React.createElement('span',{style:{display:'none'}},' secret'),React.createElement('span',{style:{visibility:'hidden'}},' concealed'),React.createElement('span',{style:{position:'absolute',width:1,height:1,padding:0,margin:-1,overflow:'hidden',clip:'rect(0,0,0,0)',whiteSpace:'nowrap',border:0}},' assistive'))},React.createElement(SimpleSelect,{name:'hidden',defaultValue:'a'},React.createElement('option',{value:'a'},'Alpha'),React.createElement('option',{value:'b'},'Beta')))
 ));};`;
 const entry=resolve(cwd,'select-form-fixture.tsx');await writeFile(entry,contents);
 const result=await build({entryPoints:[entry],bundle:true,write:false,metafile:true,format:'iife',platform:'browser',jsx:'automatic',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 if(!Object.keys(result.metafile.inputs).every(file=>resolve(file).startsWith(cwd+'/')))throw new Error('Select fixture resolved imports outside its standalone tarball consumer');
 source=result.outputFiles[0].text;
});

test.beforeEach(async({page})=>{
 await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${themeCss}</style></head><body class="xui"><div id="select-fixture"></div></body></html>`);
 await page.addScriptTag({content:source});
});

test('React SimpleSelect names stay separate from selected values and follow ARIA precedence',async({page})=>{
 await page.evaluate(()=>window.mountSelectLabels());
 const cases=[['Wrapped choice','wrapped'],['External choice','external'],['Explicit name','explicit'],['Referenced name','labelledby'],['Hidden choice assistive','hidden']];
 for(const [name] of cases){const control=page.getByRole('combobox',{name,exact:true});await expect(control).toHaveAccessibleName(name);await control.click();const popup=page.getByRole('listbox',{name,exact:true});await expect(popup).toBeVisible();await popup.getByRole('option',{name:'Beta',exact:true}).click();await expect(control).toHaveAccessibleName(name);await expect(control).toHaveText('Beta');}
});

test('React SimpleSelect retains grouped options, cancellable reset and native form value',async({page})=>{
 await page.evaluate(()=>window.mountSelect());const trigger=page.getByRole('combobox',{name:'Choice',exact:true});await expect(trigger).toHaveAccessibleName('Choice');await expect(trigger).toHaveText('Alpha');
 await trigger.click();await expect(page.getByRole('group',{name:'Visible group',exact:true})).toBeVisible();await expectOptionSpacing(page.getByRole('group',{name:'Visible group',exact:true}).getByRole('option'));await expect(page.getByRole('option',{name:'Hidden value',exact:true})).toHaveCount(0);
 await page.getByRole('option',{name:'Beta',exact:true}).click();await expect(trigger).toHaveAccessibleName('Choice');await expect(trigger).toHaveText('Beta');expect(await page.evaluate(()=>window.selectForm.value())).toBe('b');
 await page.evaluate(()=>window.selectForm.reset(true));await expect(trigger).toHaveText('Beta');expect(await page.evaluate(()=>window.selectForm.value())).toBe('b');
 await page.evaluate(()=>window.selectForm.reset(false));await expect(trigger).toHaveText('Alpha');expect(await page.evaluate(()=>window.selectForm.value())).toBe('a');
 const wrapper=page.locator('#select-fixture .xui-select-control');await expect(wrapper).toHaveCount(1);await page.evaluate(()=>{window.selectForm.reset(false);window.selectForm.destroy();});await expect(wrapper).toHaveCount(0);
});
