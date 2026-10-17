import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {LinkedText,Typography} from '../packages/ui-react/dist/display.js';
import {readThemeColors,observeThemeColors} from '../packages/runtime/dist/theme-colors.js';
import {UtilService} from '../packages/runtime/dist/util-service.js';
test('LinkedText preserves primitive children, existing React elements and native Link behavior',()=>{
 const html=renderToStaticMarkup(React.createElement(LinkedText,{linkProps:{rel:'opener nofollow',target:'_self'}},['visit https://example.com。',42,React.createElement('strong',{key:'existing'},'https://untouched.example')]));
 assert.match(html,/<a[^>]*href="https:\/\/example.com\/"/);assert.match(html,/target="_self"/);assert.match(html,/rel="nofollow noopener noreferrer"/);assert.match(html,/。42<strong>https:\/\/untouched.example<\/strong>/);assert.equal((html.match(/<a /g)||[]).length,1);assert.equal(Typography.LinkedText,LinkedText);
 assert.equal(renderToStaticMarkup(React.createElement(Typography.Link,{href:'mailto:user@example.com'},'mail')),'<a href="mailto:user@example.com" class="xui-link">mail</a>');
 assert.equal(renderToStaticMarkup(React.createElement(LinkedText,{value:0},'fallback')),'<span class="xui-linked-text">0</span>');
});
test('pure URL utilities and color readback import without browser globals',()=>{
 assert.equal(UtilService.url.parseHttp('https://example.com'),'https://example.com/');assert(Object.isFrozen(UtilService.text));
 const colors=readThemeColors({accent:'--action-primary',missing:'--missing'});assert.deepEqual(colors,{accent:null,missing:null});assert(Object.isFrozen(colors));assert.throws(()=>observeThemeColors({},()=>{}),/Window is required/);
});
