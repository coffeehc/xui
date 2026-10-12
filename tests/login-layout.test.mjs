import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {ConfigurableLoginPage} from '../packages/ui-react/dist/login.js';

const theme=new Proxy({},{get(){throw new Error('Login must inherit root theme without reading or mutating the owner.');}});
function render(state={status:'anonymous',user:null,busy:null,error:null},config={},props={}){
  const auth={getState:()=>state,subscribe:()=>()=>{}};
  return renderToStaticMarkup(React.createElement(ConfigurableLoginPage,{auth,theme,config:{productName:'产品名称',title:'登录产品',description:'品牌说明',...config},...props}));
}
test('public login separates configured brand from credentials without owning theme controls',()=>{
  const markup=render();
  assert.match(markup,/<header class="xui-login-brand"><div class="xui-login-identity"><strong>产品名称<\/strong><\/div><p class="xui-login-description">品牌说明<\/p><\/header><form class="xui-login-form"/);
  assert.match(markup,/<h1[^>]*>登录产品<\/h1>/);
  assert.match(markup,/autoComplete="username"/);assert.match(markup,/autoComplete="current-password"/);
  assert.doesNotMatch(markup,/xui-login-theme|<select|Appearance|data-theme/);
});
test('login layout retains optional branding, text escaping and authenticated actions',()=>{
  const minimal=render(undefined,{description:undefined});assert.doesNotMatch(minimal,/xui-login-description|<img/);
  const configured=render(undefined,{productName:'<script>brand</script>',logo:{src:'/brand.svg',alt:'产品 logo'}});assert.match(configured,/&lt;script&gt;brand&lt;\/script&gt;/);assert.match(configured,/alt="产品 logo"/);
  const signedIn=render({status:'authenticated',user:{id:'demo',username:'demo',display_name:'示例用户'},busy:null,error:null});assert.match(signedIn,/Signed in: 示例用户/);assert.match(signedIn,/>Continue<\/button>/);assert.match(signedIn,/>Sign out<\/button>/);assert.doesNotMatch(signedIn,/type="password"/);
});
test('both public login renderers keep theme ownership external and use the same brand roles',async()=>{
  for(const file of ['packages/ui-react/src/login.tsx','packages/runtime/src/login-dom.ts']){const source=await readFile(file,'utf8');assert.match(source,/xui-login-identity/);assert.doesNotMatch(source,/xui-login-theme|theme\.(?:setMode|subscribe|getState|destroy)|localStorage|sessionStorage/);}
  const css=await readFile('packages/theme/src/auth.css','utf8');assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);assert.match(css,/@media \(max-width:47\.999rem\)/);assert.doesNotMatch(css,/xui-login-theme|#[0-9a-f]{3,8}\b/i);
});

test('fullscreen is the default with an explicit card layout and inert decorative visual slot',()=>{
  const markup=render(undefined,{}, {brandVisual:React.createElement('img',{src:'/illustration.svg',alt:''})});
  assert.match(markup,/data-layout="fullscreen"/);assert.doesNotMatch(markup,/xui-login-card xui-surface/);
  assert.match(markup,/<div class="xui-login-visual" aria-hidden="true" inert=""><img[^>]*src="\/illustration.svg"/);
  assert.match(render(undefined,{layout:'card'}),/data-layout="card"/);
  assert.doesNotMatch(render(),/xui-login-visual/);
  assert.equal((render().match(/xui-login-feedback/g)||[]).length,1);
  assert.equal((render({status:'unknown',user:null,busy:'session',error:null}).match(/xui-login-feedback/g)||[]).length,1);
});
test('login scrollports retain four-sided focus clearance without changing focus tokens',async()=>{
  const css=await readFile('packages/theme/src/auth.css','utf8');
  assert.match(css,/\.xui-login-body,\.xui-login-actions[^}]*padding:calc\(var\(--focus-width\) \+ var\(--focus-offset\)\)/);
  assert.match(css,/\.xui-login-body \{overflow:auto/);
  assert.match(css,/scroll-margin:calc\(var\(--focus-width\) \+ var\(--focus-offset\)\)/);
  assert.match(css,/max-height:30rem/);assert.doesNotMatch(css,/--focus-(?:width|offset)\s*:/);
});
