import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';

test('legacy clipboard fallback restores focused input selection and scroll',async({page})=>{
 const {runDirectory}=JSON.parse(await readFile('.consumers/latest.json','utf8'));
 const consumerRoot=resolve(runDirectory,'react'),entry=resolve(consumerRoot,'clipboard-browser-fixture.mjs');
 await writeFile(entry,`import {XuiServices} from '@coffeehc/xui-runtime/services';\nexport async function writeWithBrowserOwner(value){const services=new XuiServices({}, {window});try{return await services.getClipboardService().writeText(value);}finally{services.dispose();}}\n`);
 const bundle=await build({entryPoints:[entry],bundle:true,write:false,metafile:true,format:'esm',platform:'browser',target:'es2022'});
 expect(Object.keys(bundle.metafile.inputs).every(file=>resolve(file).startsWith(consumerRoot+'/'))).toBe(true,'clipboard browser fixture resolves only through the independently installed consumer');
 const source=bundle.outputFiles[0].text;
 await page.addInitScript(()=>{
  window.clipboardFallbackCalls=[];
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});
  Object.defineProperty(Document.prototype,'execCommand',{configurable:true,value:function(command){const active=this.activeElement;window.clipboardFallbackCalls.push({command,value:active?.value,tag:active?.tagName,start:active?.selectionStart,end:active?.selectionEnd});return command==='copy';}});
 });
 await page.route('**/clipboard-module.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:source}));
 await page.goto('/display-react/');
 await page.setContent('<main style="height:2000px;padding:20px"><div id="scroller" style="height:120px;overflow:auto"><div style="height:400px"><input id="original" value="keep this selection"></div></div></main>');
 await page.evaluate(()=>{const area=document.querySelector('#scroller'),input=document.querySelector('#original');area.scrollTop=90;window.scrollTo(0,240);input.focus();input.setSelectionRange(5,9,'backward');});
 const before=await page.evaluate(()=>({active:document.activeElement.id,start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd,direction:document.activeElement.selectionDirection,windowY:scrollY,areaY:document.querySelector('#scroller').scrollTop}));
 await page.evaluate(async()=>{const {writeWithBrowserOwner}=await import('/clipboard-module.js');await writeWithBrowserOwner('selected copy value');});
 const after=await page.evaluate(()=>({active:document.activeElement.id,start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd,direction:document.activeElement.selectionDirection,windowY:scrollY,areaY:document.querySelector('#scroller').scrollTop,temporary:document.querySelectorAll('textarea[aria-hidden="true"]').length,calls:window.clipboardFallbackCalls}));
 expect(after.active).toBe('original');expect(after.start).toBe(before.start);expect(after.end).toBe(before.end);expect(after.direction).toBe(before.direction);expect(after.windowY).toBe(before.windowY);expect(after.areaY).toBe(before.areaY);expect(after.temporary).toBe(0);expect(after.calls).toEqual([{command:'copy',value:'selected copy value',tag:'TEXTAREA',start:0,end:19}]);
});
