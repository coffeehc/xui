import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import postcss from 'postcss';
import * as root from '../packages/ui-react/dist/index.js';
import {Avatar} from '../packages/ui-react/dist/avatar.js';
import {Image,Tag} from '../packages/ui-react/dist/display.js';
import {Badge} from '../packages/ui-react/dist/feedback.js';
import {checkContract} from '../scripts/tokens.mjs';
const css=postcss.parse((await Promise.all(['base','widgets','feedback'].map(name=>readFile(`packages/theme/src/${name}.css`,'utf8')))).join('\n'));
const {light}=checkContract(await readFile('docs/DESIGN.md','utf8'));
function mapping(selector,expected){const matches=[];css.walkRules(selector,node=>matches.push(node));assert.equal(matches.length,1,selector);const actual=Object.fromEntries(matches[0].nodes.filter(node=>node.type==='decl').map(node=>[node.prop,node.value]));for(const [name,value]of Object.entries(expected)){assert.equal(actual[name],value,`${selector}: ${name}`);for(const [,token]of value.matchAll(/var\((--[\w-]+)\)/g))assert.ok(token in light,token);}return actual;}
test('media foundations preserve root/subentry identity and Badge native passive semantics',()=>{
 for(const [name,value]of Object.entries({Avatar,Image,Tag,Badge}))assert.equal(root[name],value,name);
 for(const part of ['Root','Image','Fallback'])assert.equal(typeof Avatar[part],'function');
 const badge=Badge({children:'<literal>',className:'host',id:'metadata','aria-describedby':'full'});assert.equal(badge.type,'span');assert.equal(badge.props.className,'xui-badge host');assert.equal(badge.props['data-tone'],'neutral');assert.equal(badge.props.children,'<literal>');assert.equal(badge.props['aria-describedby'],'full');for(const name of ['role','tabIndex','aria-live','disabled'])assert.equal(badge.props[name],undefined);
});
test('Badge has a closed five-tone public vocabulary while neutral stays passive',()=>{
 for(const tone of ['neutral','info','success','warning','error']){const badge=Badge({tone,children:`${tone} message`});assert.equal(badge.type,'span');assert.equal(badge.props['data-tone'],tone);assert.equal(badge.props.children,`${tone} message`);for(const name of ['role','tabIndex','aria-live','disabled'])assert.equal(badge.props[name],undefined);}
 mapping('.xui-badge:is([data-tone="info"],[data-tone="success"],[data-tone="warning"],[data-tone="error"])',{'padding-inline':'var(--space-text-gap)','border-width':'var(--line-width-surface)','border-style':'solid','border-radius':'var(--radius-md)'});
 for(const tone of ['info','success','warning','error'])mapping(`.xui-badge[data-tone="${tone}"]`,{color:`var(--status-${tone}-foreground)`,background:`var(--status-${tone}-soft)`,'border-color':`var(--status-${tone}-line)`});
 const base=mapping('.xui-badge',{'font-size':'var(--font-size-body-xs)','line-height':'var(--line-height-body-xs)',gap:'var(--space-text-gap)'});assert.equal(base.background,undefined);assert.equal(base.border,undefined);
});
test('Avatar consumes existing size, shape, surface and content fitting roles',()=>{
 mapping('.xui-avatar',{'inline-size':'var(--control-height)','block-size':'var(--control-height)','border-radius':'var(--radius-full)',background:'var(--layer-support)',color:'var(--foreground)',overflow:'hidden'});
 for(const [size,token]of [['sm','control-height-sm'],['lg','avatar-size-lg']])mapping(`.xui-avatar[data-size='${size}']`,{'inline-size':`var(--${token})`,'block-size':`var(--${token})`});
 mapping('.xui-avatar-image',{'inline-size':'100%','block-size':'100%','object-fit':'cover'});mapping('.xui-avatar-fallback',{font:'var(--font-weight-control) var(--font-size-body-sm)/var(--line-height-body-sm) var(--font-sans)'});
});
test('Image frame and placeholders use content geometry and existing feedback roles',()=>{
 mapping('.xui-image',{'max-inline-size':'100%',position:'relative',overflow:'hidden'});mapping('.xui-image-content',{'object-fit':'contain'});mapping('.xui-image[data-fit="cover"]>.xui-image-content',{'object-fit':'cover'});
 mapping('.xui-image-placeholder',{padding:'var(--space-control-gap)',background:'var(--muted)',color:'var(--muted-foreground)','overflow-wrap':'anywhere',overflow:'auto'});
});
test('Tag label wraps and removal target keeps its intrinsic size',()=>{
 const badge=mapping('.xui-badge',{'font-size':'var(--font-size-body-xs)','line-height':'var(--line-height-body-xs)',gap:'var(--space-text-gap)'});assert.equal(badge.background,undefined);assert.equal(badge.border,undefined);mapping('.xui-tag-label',{'overflow-wrap':'anywhere','min-inline-size':'0'});mapping('.xui-tag>.xui-button',{flex:'none'});
 // The public label role also applies to Tag; actual inheritance is browser-tested.
});


test('Image placeholder keeps short content centered while overflowing text starts inside its scroll range',async()=>{
 mapping('.xui-image-placeholder',{'align-items':'safe center','justify-content':'safe center',overflow:'auto','overflow-wrap':'anywhere',padding:'var(--space-control-gap)'});
 const failure=JSON.parse(await readFile('tests/fixtures/evidence/image-overflow-ba934dd.json','utf8'));assert.equal(failure.cases.length,6);
 for(const {start,end}of failure.cases){assert.equal(start.scrollTop,0);assert.equal(start.first.top-start.box.top,-93);assert.ok(start.first.top<start.box.top-.5);assert.ok(end.last.bottom<=end.box.bottom+.5);}
});
