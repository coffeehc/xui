import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {AuthPage} from '../packages/ui-react/dist/login.js';
import {Button} from '../packages/ui-react/dist/button.js';
const config={productName:'示例产品',title:'创建管理员',description:'首次设置'};
test('AuthPage is a request-free public composition, with optional explicit form semantics',()=>{
  const children=React.createElement('input',{name:'administrator',defaultValue:'keep'}),actions=React.createElement(Button,{type:'submit'},'Create');
  const section=renderToStaticMarkup(React.createElement(AuthPage,{config,actions},children));
  assert.match(section,/<section class="xui-login-form">/);assert.doesNotMatch(section,/<form\b/);assert.match(section,/<h1[^>]*>创建管理员<\/h1>/);assert.match(section,/name="administrator" value="keep"/);
  const form=renderToStaticMarkup(React.createElement(AuthPage,{config,actions,form:{noValidate:true,onSubmit(){throw new Error('Render must not submit');}}},children));
  assert.match(form,/<form class="xui-login-form" noValidate="">/);assert.match(form,/xui-login-actions/);assert.match(form,/xui-login-feedback/);
  assert.doesNotMatch(form,/name="password"|Appearance|xui-login-theme/);
});
test('AuthPage owns brand, actions and feedback geometry without copying host control props',async()=>{
  const html=renderToStaticMarkup(React.createElement(AuthPage,{config,actions:React.createElement(Button,null,'Create'),feedback:React.createElement('div',{role:'alert'},'Try again'),feedbackActions:React.createElement(Button,{variant:'ghost'},'Retry')}));
  assert.match(html,/xui-login-actions"><button[^>]*data-size="default"/);assert.match(html,/xui-login-support.*role="alert"/);
  const css=await readFile('packages/theme/src/auth.css','utf8');assert.match(css,/\.xui-login-actions>\.xui-button \{min-block-size:var\(--control-height-lg\);padding-inline:var\(--space-section-gap\);gap:var\(--space-control-gap\);inline-size:100%/);
  const react=await readFile('packages/ui-react/src/login.tsx','utf8'),native=await readFile('packages/runtime/src/login-dom.ts','utf8');
  assert.match(react,/return <AuthPage config=\{config\}/);assert.match(native,/createAuthPage\(root,/);
});

test('AuthPage rejects a missing title and invalid JavaScript form options',()=>{
  for(const title of [undefined,null,42])assert.throws(()=>renderToStaticMarkup(React.createElement(AuthPage,{config:{productName:'Example',title}})),TypeError);
  for(const form of [null,false,'form'])assert.throws(()=>renderToStaticMarkup(React.createElement(AuthPage,{config,form})),TypeError);
});
