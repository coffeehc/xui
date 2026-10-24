import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import postcss from 'postcss';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as feedback from '../packages/ui-react/dist/feedback.js';
import * as root from '../packages/ui-react/dist/index.js';
import {checkContract} from '../scripts/tokens.mjs';

const css=postcss.parse(await readFile('packages/theme/src/feedback.css','utf8'));
const {light}=checkContract(await readFile('docs/DESIGN.md','utf8'));
function rule(selector,media=null){let found;css.walkRules(selector,node=>{const parent=node.parent;const query=parent.type==='atrule'&&parent.name==='media'?parent.params.replace(/\s/g,''):null;if(query===media)found=node;});assert.ok(found,`${selector} in ${media??'component layer'}`);return Object.fromEntries(found.nodes.filter(node=>node.type==='decl').map(node=>[node.prop,node.value]));}
function mapping(selector,expected){const actual=rule(selector);for(const [name,value]of Object.entries(expected)){assert.equal(actual[name],value,`${selector}: ${name}`);for(const [,token]of value.matchAll(/var\((--[\w-]+)\)/g))assert.ok(token in light,`${token} is a DESIGN token`);}}

test('feedback foundations have the same root and subentry exports with native element semantics',()=>{
 for(const name of ['Alert','Skeleton','Spinner','Progress'])assert.equal(root[name],feedback[name],name);
 const progress=renderToStaticMarkup(React.createElement(root.Progress,{value:3,max:8,'aria-label':'Fraction',className:'host-marker'}));
 assert.match(progress,/^<progress /);assert.match(progress,/value="3"/);assert.match(progress,/max="8"/);assert.match(progress,/aria-label="Fraction"/);assert.match(progress,/class="xui-progress host-marker"/);assert.doesNotMatch(progress,/aria-valuenow|role=/);
 const pending=renderToStaticMarkup(React.createElement(feedback.Progress,{'aria-label':'Pending'}));assert.doesNotMatch(pending,/\svalue=|aria-valuenow/);
});

test('Alert defaults and all four tones expose readable status or error semantics without focus behavior',()=>{
 const defaults=feedback.Alert({children:'Information'});assert.equal(defaults.type,'div');assert.equal(defaults.props.role,'status');assert.equal(defaults.props['data-tone'],'info');
 for(const tone of ['info','success','warning','error']){
  const element=feedback.Alert({tone,children:`${tone} message`,className:'host-marker',id:tone,'aria-describedby':`${tone}-details`});
  assert.equal(element.props.role,tone==='error'?'alert':'status');assert.equal(element.props['data-tone'],tone);assert.equal(element.props.className,'xui-alert host-marker');assert.equal(element.props.children,`${tone} message`);assert.equal(element.props['aria-describedby'],`${tone}-details`);assert.equal(element.props.tabIndex,undefined);
 }
});

test('Skeleton and Spinner are decorative native nodes with no separate live or focus owner',()=>{
 for(const [name,tag,cssClass]of [['Skeleton','div','xui-skeleton'],['Spinner','span','xui-spinner']]){
  const element=feedback[name]({className:'host-marker',id:name});assert.equal(element.type,tag);assert.equal(element.props['aria-hidden'],'true');assert.equal(element.props.className,`${cssClass} host-marker`);assert.equal(element.props.id,name);
  for(const attribute of ['role','aria-live','aria-busy','tabIndex'])assert.equal(element.props[attribute],undefined);
 }
});

test('Alert tones map foreground, soft surface and line to the corresponding DESIGN status role',()=>{
 mapping('.xui-alert',{padding:'var(--space-content-gap)',border:'var(--line-width-surface) solid var(--status-info-line)','border-radius':'var(--radius-lg)',color:'var(--status-info-foreground)',background:'var(--status-info-soft)','overflow-wrap':'anywhere'});
 for(const tone of ['success','warning','error'])mapping(`.xui-alert[data-tone="${tone}"]`,{color:`var(--status-${tone}-foreground)`,background:`var(--status-${tone}-soft)`,'border-color':`var(--status-${tone}-line)`});
});

test('decorative geometry and animations consume the existing feedback tokens with reduced-motion shutdown',()=>{
 mapping('.xui-skeleton',{'min-block-size':'var(--control-height)','inline-size':'100%',background:'var(--muted)','border-radius':'var(--radius-md)',animation:'xui-pulse var(--motion-duration-pulse) var(--motion-easing) infinite alternate'});
 mapping('.xui-spinner',{'inline-size':'var(--control-icon-size)','block-size':'var(--control-icon-size)',border:'var(--line-width-emphasis) solid var(--action-primary)','border-inline-end-color':'transparent','border-radius':'var(--radius-full)',animation:'xui-spin var(--motion-duration-spin) linear infinite'});
 assert.equal(rule('.xui-skeleton,.xui-spinner','(prefers-reduced-motion:reduce)').animation,'none');
});

test('Progress maps real native states to the shared track/fill and preserves accessibility media fallbacks',()=>{
 mapping('.xui-progress',{'block-size':'var(--progress-height)',background:'var(--muted)',color:'var(--action-primary)','accent-color':'var(--action-primary)','border-radius':'var(--progress-radius)'});
 mapping('.xui-progress::-webkit-progress-bar',{background:'var(--muted)'});
 for(const pseudo of ['::-webkit-progress-value','::-moz-progress-bar'])mapping(`.xui-progress${pseudo}`,{background:'var(--action-primary)'});
 mapping('.xui-progress:indeterminate',{background:'var(--interaction-selected)',animation:'xui-pulse var(--motion-duration-pulse) var(--motion-easing) infinite alternate'});
 assert.equal(rule('.xui-progress:indeterminate','(prefers-reduced-motion:reduce)').animation,'none');
 const forced=rule('.xui-progress','(forced-colors:active)');assert.equal(forced.appearance,'none');assert.equal(forced.background,'var(--progress-forced-track)');assert.equal(forced.border,'var(--line-width-surface) solid var(--progress-forced-border)');assert.equal(forced['border-radius'],undefined,'Retain the uniform-thickness strip');
 assert.equal(forced['forced-color-adjust'],undefined,'Keep default auto; never opt out of the user palette');
 for(const pseudo of ['::-webkit-progress-value','::-moz-progress-bar']){assert.equal(rule(`.xui-progress${pseudo}`,'(forced-colors:active)').background,'var(--progress-forced-fill)');assert.equal(rule(`.xui-progress:indeterminate${pseudo}`,'(forced-colors:active)').background,'transparent');}
 assert.equal(rule('.xui-progress:indeterminate','(forced-colors:active)')['border-style'],'var(--progress-forced-pending-border-style)');
 assert.equal(rule('.xui-progress:is(:indeterminate,[value])::-webkit-progress-bar','(forced-colors:active)').background,'var(--progress-forced-track)');
});

test('forced-color progress roles are matching system colors enforced after product overrides',async()=>{
 const expected={'--progress-forced-track':'Canvas','--progress-forced-border':'CanvasText','--progress-forced-fill':'CanvasText','--progress-forced-pending-border-style':'dashed'};
 for(const [name,value]of Object.entries(expected))assert.equal(light[name],value);
 const document=await readFile('docs/DESIGN.md','utf8');const marked=document.split('/* progress-forced-colors:start */')[1]?.split('/* progress-forced-colors:end */')[0];assert.ok(marked);
 const declarations={};postcss.parse(marked).walkDecls(node=>declarations[node.prop]=node.value);assert.deepEqual(declarations,expected);
 assert.match(document,/@layer design-accessibility \{\s*\/\* progress-forced-colors:start/);assert.doesNotMatch(await readFile('packages/theme/src/feedback.css','utf8'),/forced-color-adjust\s*:\s*none/);
});
