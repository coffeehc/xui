import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

const form=page=>page.getByRole('form',{name:'模型配置',exact:true});
const context=page=>form(page).getByRole('spinbutton',{name:'上下文 tokens',exact:true});
const output=page=>form(page).getByRole('spinbutton',{name:'最大输出 tokens',exact:true});
const reasoning=page=>form(page).getByRole('combobox',{name:'推理强度',exact:true});
const state=page=>page.evaluate(()=>window.modelProfileDemo.controller.getState());
const requests=page=>page.evaluate(()=>window.modelProfileDemo.mock.requests.length);
async function open(page,query=''){
 await page.goto('/model-profile-react/?mode=light'+query);
 await expect(context(page)).toBeVisible();await expect(form(page).getByRole('button',{name:'测试连接',exact:true})).toBeEnabled();
}
async function choose(page,label){await reasoning(page).click();await page.getByRole('option',{name:label,exact:true}).click();}

test('known config/template values render directly; missing fields never inherit a guessed effective policy',async({page})=>{
 await open(page);await expect(context(page)).toHaveValue('128000');await expect(output(page)).toHaveValue('8192');await expect(reasoning(page)).toHaveText('未指定');
 const count=await requests(page);
 await page.evaluate(()=>window.modelProfileDemo.controller.setField('default_policy',{max_completion_tokens:16384}));
 await expect(context(page)).toHaveValue('');await expect(context(page)).toHaveAttribute('placeholder','未配置，请填写');await expect(output(page)).toHaveValue('16384');await expect(reasoning(page)).toHaveText('未指定');
 expect((await state(page)).data.defaults[1].default_policy.max_context_tokens).toBe(128000);expect((await state(page)).draft.default_policy).toEqual({max_completion_tokens:16384});expect(await requests(page)).toBe(count);
 await page.evaluate(()=>window.modelProfileDemo.controller.setField('default_policy',{max_context_tokens:160000,max_completion_tokens:16384,reasoning_effort:'none'}));
 await expect(context(page)).toHaveValue('160000');await expect(reasoning(page)).toHaveText('none');expect(await requests(page)).toBe(count);
 await form(page).getByRole('button',{name:'测试连接',exact:true}).click();await expect.poll(async()=>(await state(page)).testResult?.passed).toBe(true);expect(await requests(page)).toBe(count+1);
 expect(await page.evaluate(()=>window.modelProfileDemo.mock.requests.at(-1).fields)).toContain('default_policy');
});

test('host requirements associate errors and focus without replacing the owner or issuing invalid requests',async({page})=>{
 await open(page,'&require-policy');await expect(context(page)).toHaveAttribute('required','');await expect(reasoning(page)).toHaveAttribute('aria-required','true');
 await page.evaluate(()=>{window.policyOwner=window.modelProfileDemo.controller;window.modelProfileDemo.controller.setField('default_policy',{max_completion_tokens:16384});});
 await context(page).evaluate(node=>window.policyNode=node);const count=await requests(page),action=form(page).getByRole('button',{name:'测试连接',exact:true});await action.click();await expect(context(page)).toBeFocused();await expect(context(page)).toHaveAttribute('aria-invalid','true');await expect(reasoning(page)).toHaveAttribute('aria-invalid','true');expect(await requests(page)).toBe(count);
 const description=await context(page).getAttribute('aria-describedby');expect(await page.locator('#'+description.split(' ').at(-1)).innerText()).toBe('请填写此项。');await expect(form(page).getByRole('button',{name:'高级配置',exact:true})).toHaveAttribute('aria-expanded','false');
 await context(page).fill('160000');await action.click();await expect(reasoning(page)).toBeFocused();expect(await requests(page)).toBe(count);
 await reasoning(page).focus();await page.keyboard.press('ArrowDown');await expect(page.getByRole('option',{name:'未指定',exact:true})).toBeFocused();await page.keyboard.press('ArrowDown');await expect(page.getByRole('option',{name:'none',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(reasoning(page)).toBeFocused();await action.click();await expect.poll(async()=>(await state(page)).testResult?.passed).toBe(true);expect(await requests(page)).toBe(count+1);expect((await state(page)).draft.default_policy.reasoning_effort).toBe('none');
 await choose(page,'未指定');expect(Object.hasOwn((await state(page)).draft.default_policy,'reasoning_effort')).toBe(false);await action.click();await expect(reasoning(page)).toBeFocused();expect(await requests(page)).toBe(count+1);
 const draft=JSON.stringify((await state(page)).draft);await page.evaluate(()=>window.modelProfileDemo.controller.update({requiredPolicyFields:[]}));expect(JSON.stringify((await state(page)).draft)).toBe(draft);expect(await page.evaluate(()=>window.policyOwner===window.modelProfileDemo.controller&&window.policyNode.isConnected)).toBe(true);await expect(reasoning(page)).not.toHaveAttribute('aria-invalid','true');expect(await requests(page)).toBe(count+1);
 await page.evaluate(()=>window.modelProfileDemo.setLongLabels(true));await expect(reasoning(page)).toHaveText('尚未指定推理强度');expect(await requests(page)).toBe(count+1);
});

for(const mode of ['light','dark','system'])for(const [width,scale]of [[1280,1],[390,2]])test(`unknown policy ${mode} ${width} reading${scale} stays explicit and reachable`,async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:mode==='light'?'light':'dark',reducedMotion:'reduce'});
 await page.goto(`/model-profile-react/?mode=${mode}&require-policy`);await expect(context(page)).toBeVisible();await page.evaluate(scale=>{window.modelProfileDemo.setScale(scale);window.modelProfileDemo.setLongLabels(true);window.modelProfileDemo.controller.setField('default_policy',{max_context_tokens:0,max_completion_tokens:16384});},scale);
 await expect(context(page)).toHaveValue('0');await expect(output(page)).toHaveValue('16384');await expect(reasoning(page)).toHaveText('尚未指定推理强度');const count=await requests(page);
 await form(page).getByRole('button',{name:'测试连接',exact:true}).click();await expect(context(page)).toBeFocused();await expect(context(page)).toHaveAttribute('aria-invalid','true');expect(await requests(page)).toBe(count);
 expect(await context(page).evaluate(node=>(node.getAttribute('aria-describedby')??'').split(' ').every(id=>!!document.getElementById(id)))).toBe(true);
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await expect(context(page)).toBeInViewport();
 if(mode==='system'){await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme-effective','light');await expect(context(page)).toBeFocused();expect(await requests(page)).toBe(count);}
 await mkdir('output/playwright/model-profile-policy-4.2.42',{recursive:true});const path=`output/playwright/model-profile-policy-4.2.42/${mode}-${width}-reading${scale}.png`;await page.screenshot({path});await info.attach('unknown-policy.png',{path,contentType:'image/png'});expect(errors).toEqual([]);
});
