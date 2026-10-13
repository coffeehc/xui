import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import {Typography,Separator,Tag,Copyable,Image} from '../packages/ui-react/dist/display.js';
import {Typography as RootTypography} from '../packages/ui-react/dist/index.js';
import {createCopyController,validateImageOptions} from '../packages/runtime/dist/display.js';
import {createTypographyHeading,createTypographyText,createTypographyCode,createTypographyLink,createSeparator,createTag,createCopyable,createImage} from '../packages/runtime/dist/display-dom.js';
import {navigationDOM,fire} from './fixtures/navigation-dom.mjs';
const render=(Component,props)=>renderToString(React.createElement(Component,props));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('Typography exposes HTML semantics, safe code and native link attributes without routing',()=>{
 assert.equal(Typography,RootTypography);
 for(let level=1;level<=6;level++)assert.match(render(Typography.Heading,{level,visualRole:'section',children:'标题'}),new RegExp(`<h${level}.*标题</h${level}>`));
 assert.match(render(Typography.Text,{as:'p',tone:'muted',children:'长中文'}),/^<p.*data-tone="muted"/);
 const link=render(Typography.Link,{href:'/document',target:'_blank',download:'notes',children:'全文'});assert.match(link,/href="\/document"/);assert.match(link,/target="_blank"/);assert.match(link,/download="notes"/);
 assert.match(render(Typography.Code,{value:'<script>alert(1)</script>',block:true}),/^<pre.*<code.*&lt;script&gt;/);
 assert.match(render(Separator,{orientation:'vertical'}),/role="separator".*aria-orientation="vertical"/);
 assert.match(render(Separator,{decorative:true}),/role="none" aria-hidden="true"/);
 assert.doesNotMatch(render(Tag,{label:'被动'}),/<button|tabindex=/);
 assert.match(render(Tag,{label:'标签',onRemove(){},removeLabel:'移除标签',disabled:true}),/disabled=""/);
 assert.throws(()=>render(Tag,{label:'标签',onRemove(){},removeLabel:''}),/removeLabel/);
 assert.match(render(Copyable,{value:'<b>literal</b>'}),/&lt;b&gt;literal&lt;\/b&gt;/);
});
test('copy writes exact explicit value once, reports rejection and missing clipboard without reading',async()=>{
 const values=[],statuses=[];let fail=false;const owner=createCopyController({value:'完整\n中文<&>',writeText:value=>{values.push(value);if(fail)throw Error('denied');},onStatusChange:value=>statuses.push(value)});
 await owner.copy();assert.deepEqual(values,['完整\n中文<&>']);assert.deepEqual(statuses,['copying','copied']);fail=true;await owner.copy();assert.equal(owner.getStatus(),'error');owner.destroy();await owner.copy();assert.equal(values.length,2);
 const missing=createCopyController({value:'a'});await missing.copy();assert.equal(missing.getStatus(),'error');missing.destroy();
});
test('copy serializes in-flight writes, fences changed values and cannot report after destroy',async()=>{
 const pending=deferred(),values=[],states=[];const writer=value=>{values.push(value);return pending.promise;};const owner=createCopyController({value:'old',writeText:writer,onStatusChange:value=>states.push(value)});
 const first=owner.copy();await owner.copy();assert.deepEqual(values,['old']);owner.update({value:'new',writeText:writer,onStatusChange:value=>states.push(value)});await owner.copy();assert.deepEqual(values,['old']);pending.resolve();await first;assert.equal(owner.getStatus(),'idle');assert.ok(!states.includes('copied'));
 await owner.copy();assert.deepEqual(values,['old','new']);assert.equal(owner.getStatus(),'copied');
 const late=deferred();owner.update({value:'late',writeText:()=>late.promise,onStatusChange:value=>states.push(value)});const work=owner.copy(),before=states.length;owner.destroy();late.reject(Error('late'));await work;assert.equal(states.length,before);
});
test('native typography uses safe textContent and preserved anchor semantics',()=>{
 const {doc}=navigationDOM();assert.equal(createTypographyHeading(doc,{level:3,text:'标题'}).tagName,'H3');assert.equal(createTypographyText(doc,{text:'<script>',tone:'muted'}).textContent,'<script>');assert.equal(createTypographyCode(doc,{value:'<b>',block:true}).children[0].textContent,'<b>');
 const link=createTypographyLink(doc,{text:'下载',href:'/file',target:'_blank',download:'f'});assert.equal(link.href,'/file');assert.equal(link.getAttribute('download'),'f');assert.equal(createSeparator(doc).getAttribute('role'),'separator');
});
test('native removable tags preserve trigger identity, disabled state and explicit focus ownership',()=>{
 const {doc,root}=navigationDOM(),input=doc.createElement('input');root.append(input);let removals=0,focus=0;
 const options={label:'相同标签',removeLabel:'移除第一项',onRemove:()=>removals++,onRemoveFocus:()=>{focus++;input.focus();}},tag=createTag(doc,options);root.append(tag.element);const button=tag.removeButton;button.click();assert.equal(removals,1);assert.equal(focus,1);assert.equal(doc.activeElement,input);
 tag.update({...options,disabled:true});button.click();assert.equal(removals,1);tag.update({...options,label:'更新'});assert.equal(tag.removeButton,button);tag.destroy();button.click();assert.equal(removals,1);tag.update(options);assert.equal(tag.element.parentNode,null);
});
test('native copyable updates feedback without replacing button or stealing focus',async()=>{
 const {doc,root}=navigationDOM(),values=[],owner=createCopyable(doc,{value:'<b>',writeText:value=>values.push(value)});root.append(owner.element);owner.button.focus();owner.button.click();await Promise.resolve();assert.deepEqual(values,['<b>']);assert.match(owner.element.textContent,/已复制/);assert.equal(doc.activeElement,owner.button);
 owner.update({value:'next',writeText:()=>Promise.reject(Error('denied'))});owner.button.click();await Promise.resolve();assert.match(owner.element.textContent,/复制失败/);const button=owner.button;owner.destroy();button.click();assert.equal(values.length,1);
});
test('Image requires alt and stable geometry; SSR preserves empty alt and escaped fallback',()=>{
 for(const options of [{src:'x',width:30,height:20},{src:'x',alt:'x'},{src:'x',alt:'x',aspectRatio:0},{src:'x',alt:'x',width:Infinity,height:2}])assert.throws(()=>validateImageOptions(options),TypeError);
 assert.match(render(Image,{src:'/a',alt:'',width:240,height:120}),/aspect-ratio:2/);assert.match(render(Image,{src:'/a',alt:'',aspectRatio:2}),/alt=""/);
 assert.match(render(Image,{src:'',alt:'山',width:240,height:120,fallback:'<script>'}),/&lt;script&gt;/);
});
test('native Image fences stale resources, preserves frame, does not retry and disconnects on destroy',()=>{
 const {doc}=navigationDOM(),states=[],base={src:'a.png',alt:'山',width:240,height:120,onStatusChange:s=>states.push(s)},owner=createImage(doc,base),frame=owner.element,old=frame.querySelector('img');
 assert.equal(frame.style.aspectRatio,'2');assert.equal(frame.dataset.status,'loading');owner.update({...base,src:'b.png'});const current=frame.querySelector('img');assert.notEqual(current,old);fire(old,'load');assert.equal(frame.dataset.status,'loading');fire(current,'error');assert.equal(frame.dataset.status,'error');assert.equal(frame.querySelector('img'),current);assert.equal(frame.style.aspectRatio,'2');
 owner.update({...base,src:'b.png',alt:''});assert.equal(frame.querySelector('img'),current);assert.equal(frame.querySelector('.xui-image-placeholder').getAttribute('aria-hidden'),'true');
 owner.update({...base,src:'b.png',retryKey:1});assert.notEqual(frame.querySelector('img'),current);const retried=frame.querySelector('img');fire(retried,'load');assert.equal(frame.dataset.status,'loaded');assert.deepEqual(states,['error','loaded']);owner.destroy();fire(retried,'error');assert.deepEqual(states,['error','loaded']);
});

test('disabled copy never writes and native default clipboard belongs to the supplied document',async()=>{
 let writes=0;const owner=createCopyController({value:'x',disabled:true,writeText:()=>{writes++;}});await owner.copy();assert.equal(writes,0);assert.equal(owner.getStatus(),'idle');owner.destroy();
 const {doc,win}=navigationDOM(),values=[];win.navigator={clipboard:{writeText:value=>{values.push(value);return Promise.resolve();},readText:()=>{throw Error('must not read');}}};const native=createCopyable(doc,{value:'frame value'});native.button.click();await Promise.resolve();assert.deepEqual(values,['frame value']);assert.match(native.element.textContent,/已复制/);native.destroy();
});
test('native Image validation rejects updates atomically and same src never triggers implicit retry',()=>{
 const {doc}=navigationDOM(),options={src:'a',alt:'',aspectRatio:2},owner=createImage(doc,options),image=owner.element.querySelector('img');fire(image,'error');assert.throws(()=>owner.update({...options,aspectRatio:-1}),TypeError);assert.equal(owner.element.style.aspectRatio,'2');assert.equal(owner.element.querySelector('img'),image);owner.update({...options,fallback:'不能显示'});assert.equal(owner.element.querySelector('img'),image);assert.equal(owner.element.dataset.status,'error');owner.destroy();
});
