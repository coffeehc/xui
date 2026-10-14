import {test,expect} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const output=resolve('test-results/precision-theme-evidence');
const pages=[
 {name:'table',url:'/data-table-react/?widths&column-mode=sized&hide-column=source&size=12&internal&layout=workspace'},
 {name:'react',url:'/react/'}
];

for(const entry of pages)for(const theme of ['dark','light'])test(`capture final ${theme} ${entry.name} preview evidence`,async({page},info)=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
 await page.addInitScript(theme=>localStorage.setItem('ui.theme.mode',theme),theme);
 await page.goto(entry.url,{waitUntil:'domcontentloaded'});
 if(entry.name==='table'){
  await page.waitForFunction(()=>window.dataTableDemo?.owner.getState().status==='ready');
  await expect(page.getByRole('table',{name:'合成记录表格'})).toBeVisible();
 }else{
  await expect(page.getByRole('heading',{name:'工作偏好',exact:true})).toBeVisible();
  await expect(page.getByLabel('名称')).toBeVisible();
 }
 await expect(page.locator('html')).toHaveAttribute('data-theme-effective',theme);
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
 const metadata=await page.evaluate(()=>({url:location.href,theme:{mode:localStorage.getItem('ui.theme.mode'),effective:document.documentElement.dataset.themeEffective},viewport:{width:innerWidth,height:innerHeight},colors:{canvas:getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim(),primary:getComputedStyle(document.documentElement).getPropertyValue('--action-primary').trim(),inputBorder:getComputedStyle(document.querySelector('.xui-input')??document.documentElement).getPropertyValue('--input-border-color').trim()}}));
 let generation=null;try{generation=JSON.parse(await readFile('.artifacts/dev-build-result.json','utf8')).sourceSha256??null;}catch{}
 await mkdir(output,{recursive:true});
 const name=`${entry.name}-${theme}`;
 const screenshot=await page.screenshot({path:join(output,`${name}.png`),animations:'disabled'});
 const record={generation,...metadata};
 await writeFile(join(output,`${name}.json`),JSON.stringify(record,null,2));
 await info.attach(`${name}.png`,{body:screenshot,contentType:'image/png'});
 await info.attach(`${name}.json`,{body:JSON.stringify(record,null,2),contentType:'application/json'});
});
