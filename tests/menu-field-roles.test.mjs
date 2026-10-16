import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import postcss from 'postcss';
import {Menu as BaseMenu} from '@base-ui/react/menu';
import {Menu} from '../packages/ui-react/dist/menu.js';
import {ContextMenu} from '../packages/ui-react/dist/context-menu.js';
import {Field,Input,Checkbox,Radio,Switch} from '../packages/ui-react/dist/forms.js';

async function declarations(file,selector){
  const css=postcss.parse(await readFile(`packages/theme/dist/${file}.css`,'utf8'));
  const values={};
  css.walkRules(selector,rule=>rule.walkDecls(declaration=>{values[declaration.prop]=declaration.value;}));
  return values;
}

test('menu item typography is explicit while the Portal layer retains its body role',async()=>{
  const item=await declarations('floating','.xui-menu-item');
  assert.match(item.font,/var\(--font-weight-control\) var\(--font-size-body-xs\)\s*\/\s*var\(--line-height-body-xs\) var\(--font-sans\)/);
  assert.equal(item.gap,'var(--menu-item-gap)');
  const layer=await declarations('base',':where(.xui,.xui-layer)');
  assert.match(layer.font,/var\(--font-weight-body\) var\(--font-size-body-sm\)\s*\/\s*var\(--line-height-body-sm\) var\(--font-sans\)/);
});

test('all menu item variants preserve Base UI props, stateful className, render and ref',()=>{
  const ref=React.createRef(),render=React.createElement('a'),onClick=()=>{};
  for(const part of ['Item','LinkItem','CheckboxItem','RadioItem','SubmenuTrigger']){
    assert.equal(ContextMenu[part],Menu[part]);
    const element=Menu[part]({ref,render,onClick,className:state=>state.disabled?'host-disabled':'host-enabled'});
    assert.equal(element.type,BaseMenu[part]);
    assert.equal(element.props.ref,ref);
    assert.equal(element.props.render,render);
    assert.equal(element.props.onClick,onClick);
    assert.equal(element.props.className({disabled:false}),'xui-menu-item host-enabled');
    assert.equal(element.props.className({disabled:true}),'xui-menu-item host-disabled');
  }
});
test('both menu separators preserve peer props and refs through one shared styled part',()=>{
 assert.equal(ContextMenu.Separator,Menu.Separator);
 const ref=React.createRef(),render=React.createElement('hr'),element=Menu.Separator({ref,render,orientation:'horizontal',className:()=> 'host-separator','data-group':'settings'});
 assert.equal(element.type,BaseMenu.Separator);assert.equal(element.props.ref,ref);assert.equal(element.props.render,render);assert.equal(element.props.orientation,'horizontal');assert.equal(element.props['data-group'],'settings');assert.equal(element.props.className({}),'xui-menu-separator host-separator');
});

test('Menu.Icon and ContextMenu.Icon expose one decorative, ref-preserving semantic slot',async()=>{
  assert.equal(ContextMenu.Icon,Menu.Icon);
  const ref=React.createRef(),child=React.createElement('svg',{width:24,height:24});
  const element=Menu.Icon({ref,children:child,className:'host-icon','data-icon':'sample'});
  assert.equal(element.type,'span');
  assert.equal(element.props.ref,ref);
  assert.equal(element.props.children,child);
  assert.equal(element.props.className,'xui-menu-icon host-icon');
  assert.equal(element.props['aria-hidden'],'true');
  assert.equal(element.props['data-icon'],'sample');
  assert.equal(Menu.Icon({'aria-hidden':false}).props['aria-hidden'],false);
  const icon=await declarations('floating','.xui-menu-icon');
  assert.equal(icon['flex-shrink'],'0');
  assert.equal(icon['inline-size'],'var(--control-icon-size)');
  assert.equal(icon['block-size'],'var(--control-icon-size)');
  const svg=await declarations('floating','.xui-menu-icon > svg');
  assert.equal(svg['inline-size'],'100%');
  assert.equal(svg['block-size'],'100%');
  const css=postcss.parse(await readFile('packages/theme/dist/floating.css','utf8'));
  const svgSelectors=[];
  css.walkRules(rule=>{if(/svg/.test(rule.selector))svgSelectors.push(rule.selector);});
  assert.deepEqual(svgSelectors,['.xui-menu-icon > svg']);
});

test('labels use their own type role, preserve the choice hit area and keep field spacing',async()=>{
  for(const selector of ['.xui-label','.xui-choice-label']){
    const label=await declarations('forms',selector);
    assert.match(label.font,/var\(--font-weight-control\) var\(--font-size-body-xs\)\s*\/\s*var\(--line-height-body-xs\) var\(--font-sans\)/);
  }
  assert.equal((await declarations('forms','.xui-choice-label'))['min-height'],'var(--control-height)');
  assert.equal((await declarations('forms','.xui-field')).gap,'var(--space-text-gap)');
  assert.equal((await declarations('forms','.xui-label'))['margin-bottom'],'var(--space-text-gap)');
});

test('Field retains label/control/help/error ordering and input accessibility associations',()=>{
  for(const help of [undefined,'Help text'])for(const error of [undefined,'Error text']){
    const markup=renderToStaticMarkup(React.createElement(Field,{label:'Name',help,error,required:true},React.createElement(Input,{id:'name','aria-describedby':'external-help'})));
    assert.match(markup,/<label class="xui-label" for="name">Name/);
    assert.match(markup,/<input[^>]*id="name"/);
    assert.match(markup,/<input[^>]*required=""/);
    const describedBy=[help&&'name-help',error&&'name-error','external-help'].filter(Boolean).join(' ');
    assert.ok(markup.includes(`aria-describedby="${describedBy}"`));
    assert.equal(markup.includes('aria-invalid="true"'),Boolean(error));
    const positions=[markup.indexOf('<label'),markup.indexOf('<input'),help&&markup.indexOf('id="name-help"'),error&&markup.indexOf('id="name-error"')].filter(value=>typeof value==='number');
    assert.deepEqual(positions,[...positions].sort((a,b)=>a-b));
  }
});

test('choice controls keep their native label wrapper and input semantics',()=>{
  for(const Choice of [Checkbox,Radio,Switch]){
    const markup=renderToStaticMarkup(React.createElement(Choice,{id:'choice',label:'Choice label',readOnly:true,checked:true}));
    assert.match(markup,/^<label class="xui-choice-label"><input/);
    assert.match(markup,/id="choice"/);
    assert.match(markup,/aria-readonly="true"/);
    assert.match(markup,/checked=""/);
    assert.match(markup,/>Choice label<\/label>$/);
  }
});
