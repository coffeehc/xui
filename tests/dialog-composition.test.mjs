import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('scroll paint gutter is one shared owner and uses the unchanged focus reach',()=>{
 const css=postcss.parse(source('packages/theme/src/base.css'));
 const rule=css.nodes.flatMap(node=>node.nodes??[]).find(node=>node.selector?.startsWith(':is(.xui-dialog-body,.xui-scroll-viewport)'));assert.ok(rule);
 for(const property of ['padding','scroll-padding'])assert.equal(rule.nodes.find(node=>node.prop===property).value,'calc(var(--focus-width) + var(--focus-offset))');
 for(const name of ['dialog','widgets'])assert.doesNotMatch(source(`packages/theme/src/${name}.css`),/padding:\s*(?:2px|4px)/);
 assert.ok(source('packages/theme/src/dialog.css').includes('margin:calc(calc(-1 * var(--focus-width)) - var(--focus-offset))'));
 assert.match(source('packages/theme/src/dialog.css'),/\.xui-dialog-body \{ overflow: visible; flex: none; min-block-size: var\(--dialog-body-min-block-size\)/);
});
test('close action primitive retains flow; explicit header/button owns icon positioning',()=>{
 const react=source('packages/ui-react/src/dialog.tsx');assert.match(react,/Close: BaseDialog.Close, Header, CloseButton/);assert.match(react,/showClose=true/);assert.match(react,/aria-label':label='关闭'/);
 const css=source('packages/theme/src/dialog.css');assert.match(css,/>\.xui-dialog-close \{position:absolute/);assert.doesNotMatch(css,/data-xui-close.*position:absolute/);
 assert.match(source('packages/ui-react/src/sheet.tsx'),/Header:Dialog.Header,CloseButton:Dialog.CloseButton/);
 // A plain Surface is not a clipping boundary and must not receive scroll hacks.
 const surface=postcss.parse(source('packages/theme/src/feedback.css')).nodes[0].nodes.find(node=>node.selector==='.xui-surface');assert.ok(surface);assert.ok(!surface.nodes.some(node=>node.prop.startsWith('overflow')));
});
test('dialog title consumes the section heading role and Key warnings belong to its body scroll owner',()=>{
 const css=postcss.parse(source('packages/theme/src/dialog.css'));const title=css.nodes.flatMap(node=>node.nodes??[]).find(node=>node.selector==='.xui-dialog-title');assert.equal(title.nodes.find(node=>node.prop==='font').value,'var(--font-weight-heading) var(--font-size-section-title) / var(--line-height-section-title) var(--font-sans)');
 const react=source('packages/ui-react/src/api-key.tsx'),native=source('packages/runtime/src/api-key-dom.ts');assert.ok(react.indexOf('<Dialog.Body')<react.indexOf('<Dialog.Description>'));assert.match(native,/body\.append\(description,form,result,revoke,actionFeedback\)/);assert.doesNotMatch(native,/dialog\.append\(dialogTitle,description/);
});
