import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import {Typography,Separator,Tag,Copyable,Image,OverflowText,Card} from '../packages/ui-react/dist/display.js';
import {Typography as RootTypography} from '../packages/ui-react/dist/index.js';
import {createCopyController,validateImageOptions} from '../packages/runtime/dist/display.js';
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
test('Image requires alt and stable geometry; SSR preserves empty alt and escaped fallback',()=>{
 for(const options of [{src:'x',width:30,height:20},{src:'x',alt:'x'},{src:'x',alt:'x',aspectRatio:0},{src:'x',alt:'x',width:Infinity,height:2}])assert.throws(()=>validateImageOptions(options),TypeError);
 assert.match(render(Image,{src:'/a',alt:'',width:240,height:120}),/aspect-ratio:2/);assert.match(render(Image,{src:'/a',alt:'',aspectRatio:2}),/alt=""/);
 assert.match(render(Image,{src:'',alt:'山',width:240,height:120,fallback:'<script>'}),/&lt;script&gt;/);
});

test('disabled copy never writes',async()=>{
 let writes=0;const owner=createCopyController({value:'x',disabled:true,writeText:()=>{writes++;}});await owner.copy();assert.equal(writes,0);assert.equal(owner.getStatus(),'idle');owner.destroy();
});

test('OverflowText preserves safe complete SSR text and heading semantics without synthetic interaction',()=>{
 const name='完整长中文 <script> & resource';const markup=renderToString(React.createElement('h3',null,React.createElement(OverflowText,{text:name})));
 assert.match(markup,/^<h3><span class="xui-overflow-text">/);assert.match(markup,/完整长中文 &lt;script&gt; &amp; resource/);assert.doesNotMatch(markup,/tabindex|role=|<button|aria-hidden|style=/);
});

test('Card emits named semantic slots, safe title and neutral badge without empty footer tracks',()=>{
 const html=render(Card,{title:'<资源>',badge:{label:'公共'},description:'摘要',footerMeta:'时间',footerActions:React.createElement('button',null,'查看')});
 assert.match(html,/<h3[^>]*>.*&lt;资源&gt;/);assert.match(html,/data-tone="neutral" data-variant="soft">公共/);assert.ok(html.indexOf('xui-card-header')<html.indexOf('xui-card-description'));assert.ok(html.indexOf('xui-card-meta')<html.lastIndexOf('查看'));
 const empty=render(Card,{title:'资源',actions:React.createElement(React.Fragment),children:React.createElement(React.Fragment),footerMeta:null});assert.doesNotMatch(empty,/xui-card-footer|xui-card-body|xui-card-trailing/);
 assert.throws(()=>render(Card,{title:'',headingLevel:3}),/nonempty/);assert.throws(()=>render(Card,{title:'x',headingLevel:1}),/2–6/);
});
