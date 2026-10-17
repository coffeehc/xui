import test from 'node:test';
import assert from 'node:assert/strict';
import {linkifyText,parseHttpURL} from '../packages/runtime/dist/text-links.js';

const sourceText=parts=>parts.map(part=>part.text).join('');
const links=parts=>parts.filter(part=>part.type==='link');

test('parseHttpURL accepts absolute HTTP(S), rejects unsafe schemes and authority repair',()=>{
 assert.equal(parseHttpURL('HTTP://EXAMPLE.COM:80/a?q=1#part'),'http://example.com/a?q=1#part');
 assert.equal(parseHttpURL('https://例え.テスト/路径'),'https://xn--r8jz45g.xn--zckzah/%E8%B7%AF%E5%BE%84');
 assert.equal(parseHttpURL('https://[2001:db8::1]/a'),'https://[2001:db8::1]/a');
 for(const value of [
  'javascript:alert(1)','data:text/html,unsafe','file:///etc/passwd','ftp://example.com/file','//example.com/path',
  'https:example.com/path','https:///example.com/path','https://good.example\\@evil.example/path',
  'https://good.example%40evil.example/path','https://user:secret@example.com/path','https://example.com@evil.example/path',
  'https://example.com:invalid/path','https://０.example/path',
 ])assert.equal(parseHttpURL(value),null,value);
});

test('parseHttpURL rejects controls, whitespace, backslashes and invisible code points',()=>{
 for(const value of [
  'https://example.com/a b','https://example.com/a\tb','https://example.com/a\\b',
  'https://example.com/a\u0000b','https://example.com/a\u001fb','https://example.com/a\u007fb',
  'https://example.com/a\u0085b','https://example.com/a\u200bb','https://example.com/a\ufeffb',
 ])assert.equal(parseHttpURL(value),null,JSON.stringify(value));
});

test('linkifyText keeps source text and punctuation while accepting only safe URL spans',()=>{
 const original='中文说明：（https://Example.com/a_(b)），再看 (https://example.org/path_(part))！以及 https://例え.テスト/路径。😀 不链接 https://user:secret@example.com/x、https://example.net/a\u0007b 和 https://example.net/a\u200bb；';
 const parts=linkifyText(original);
 assert.equal(sourceText(parts),original);
 assert.deepEqual(links(parts).map(part=>part.text),[
  'https://Example.com/a_(b)',
  'https://example.org/path_(part)',
  'https://例え.テスト/路径',
 ]);
 assert.deepEqual(links(parts).map(part=>part.href),[
  'https://example.com/a_(b)',
  'https://example.org/path_(part)',
  'https://xn--r8jz45g.xn--zckzah/%E8%B7%AF%E5%BE%84',
 ]);
 assert(parts.every(part=>Object.isFrozen(part)));
 assert(Object.isFrozen(parts));
});

test('linkifyText avoids embedded schemes and trims only unmatched prose punctuation',()=>{
 const original='prefixhttps://hidden.example (https://visible.example/a_(b))。尾注 https://visible.example/end)!';
 const parts=linkifyText(original);
 assert.equal(sourceText(parts),original);
 assert.deepEqual(links(parts).map(part=>part.text),[
  'https://visible.example/a_(b)',
  'https://visible.example/end',
 ]);
});

test('linkifyText preserves a large mixed-language input exactly',()=>{
 const heading='记录🙂，'.repeat(32768);
 const addresses=Array.from({length:128},(_,index)=>` https://links.example.test/item/${index}?q=a%20b，`);
 const original=`${heading}${addresses.join('')}结束。`;
 const parts=linkifyText(original),found=links(parts);
 assert.equal(found.length,addresses.length);
 assert.equal(sourceText(parts),original);
 assert.equal(found[0].text,'https://links.example.test/item/0?q=a%20b');
 assert.equal(found.at(-1).href,'https://links.example.test/item/127?q=a%20b');
});
