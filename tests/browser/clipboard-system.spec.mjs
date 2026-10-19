import {test,expect,chromium} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

// Explicit opt-in: this test writes synthetic text to the real macOS clipboard.
test('ordinary HTTP copies exact Unicode text through the native system clipboard',async({},info)=>{
 test.skip(process.platform!=='darwin'||process.env.XUI_SYSTEM_CLIPBOARD!=='1','Requires macOS, installed Chrome and explicit system clipboard opt-in');
 test.setTimeout(60000);
 const expected='XUI_SYSTEM_CLIPBOARD_中文回归\n第一段：完整复制，不改变原文。🧪\n\n| 名称 | 状态 |\n| --- | --- |\n| 合成任务 | 完成 |\n\n```ts\nconst value = "中文与 Markdown";\n```';
 const seed='XUI_SYSTEM_CLIPBOARD_TEST_SEED',readClipboard=()=>{const result=spawnSync('/usr/bin/pbpaste',[],{encoding:'utf8'});expect(result.status).toBe(0);return result.stdout;};
 const receipt=JSON.parse(await readFile('.artifacts/consumer-validation.json','utf8')),{runDirectory}=JSON.parse(await readFile('.consumers/latest.json','utf8')),consumerRoot=resolve(runDirectory,'react');
 const bundle=await build({stdin:{contents:`
 import * as React from 'react';import {createRoot} from 'react-dom/client';
 import {ClipboardService} from '@coffeehc/xui-runtime/clipboard';
 import {createCopyController} from '@coffeehc/xui-runtime/display';
 import {Copyable} from '@coffeehc/xui-react/display';
 const value=${JSON.stringify(expected)};
 document.addEventListener('click',event=>{window.copyActivation={trusted:event.isTrusted,active:navigator.userActivation.isActive};},true);
 window.copyOwner=createCopyController({value});
 document.querySelector('#service').onclick=()=>{window.serviceStatus='copying';ClipboardService.writeText(value).then(()=>window.serviceStatus='copied',()=>window.serviceStatus='error');};
 document.querySelector('#controller').onclick=()=>{void window.copyOwner.copy();};
 createRoot(document.querySelector('#react')).render(<Copyable value={value} labels={{copy:'React 复制'}} onStatusChange={status=>window.reactStatus=status}/>);
 `,resolveDir:consumerRoot,sourcefile:'clipboard-system-fixture.tsx',loader:'tsx'},bundle:true,write:false,metafile:true,format:'esm',platform:'browser',target:'es2022'});
 const inputs=Object.keys(bundle.metafile.inputs);expect(inputs.filter(file=>!file.endsWith('clipboard-system-fixture.tsx')).every(file=>resolve(file).startsWith(consumerRoot+'/'))).toBe(true);
 const css=await readFile(resolve(consumerRoot,'node_modules/@coffeehc/xui-theme/dist/critical.css'),'utf8');
 const browser=await chromium.launch({channel:'chrome',headless:false}),context=await browser.newContext(),page=await context.newPage(),cases=[];
 try{
  await page.route('http://xui-clipboard.test/**',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><title>[XUI TEST] Native clipboard</title><style>${css}</style><main class="xui xui-stack"><h1>系统剪贴板合成验证</h1><button id="service">Service 复制</button><button id="controller">Controller 复制</button><div id="react"></div></main><script type="module">${bundle.outputFiles[0].text}</script>`}));
  await page.goto('http://xui-clipboard.test/clipboard');await page.getByRole('button',{name:'React 复制',exact:true}).waitFor();await page.bringToFront();
  const native=await page.evaluate(()=>({secure:isSecureContext,clipboard:typeof navigator.clipboard,execCommand:Function.prototype.toString.call(Document.prototype.execCommand),focused:document.hasFocus()}));await info.attach('native-environment.json',{body:JSON.stringify({browser:browser.version(),sourceGeneration:receipt.sourceGeneration,native}),contentType:'application/json'});expect(native.secure).toBe(false);expect(native.clipboard).toBe('undefined');expect(native.execCommand).toContain('[native code]');expect(native.focused).toBe(true);
  for(const [name,button] of [['service','Service 复制'],['controller','Controller 复制'],['react','React 复制'],['react-repeat','React 复制']]){
   expect(spawnSync('/usr/bin/pbcopy',[],{input:seed,encoding:'utf8'}).status).toBe(0);expect(readClipboard()===seed).toBe(true);
   await page.getByRole('button',{name:button,exact:true}).click();
   const activation=await page.evaluate(()=>window.copyActivation);expect(activation).toEqual({trusted:true,active:true});
   await expect.poll(()=>page.evaluate(name=>name==='service'?window.serviceStatus:name==='controller'?window.copyOwner.getStatus():window.reactStatus,name)).toBe('copied');
   // Compare only a boolean so a failure cannot print unrelated clipboard text.
   const exact=readClipboard()===expected,entry={name,seeded:true,systemExact:exact,activation};cases.push(entry);await info.attach(name+'.json',{body:JSON.stringify(entry),contentType:'application/json'});expect(exact,'Actual system clipboard must exactly match the synthetic source').toBe(true);
   expect(await page.locator('textarea[aria-hidden="true"]').count()).toBe(0);
  }
  await info.attach('system-clipboard.json',{body:JSON.stringify({browser:browser.version(),sourceGeneration:receipt.sourceGeneration,packages:receipt.packages,native,expectedSha256:createHash('sha256').update(expected).digest('hex'),cases,inputs}),contentType:'application/json'});
  await info.attach('native-copyable.png',{body:await page.screenshot(),contentType:'image/png'});
 }finally{
  try{const current=readClipboard();if(current===expected||current===seed)spawnSync('/usr/bin/pbcopy',[],{input:'',encoding:'utf8'});}
  finally{await context.close();await browser.close();}
 }
});
