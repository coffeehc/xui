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
function section(markup,className,tag='div'){
  const start=markup.search(new RegExp(`<${tag}\\b[^>]*class="${className}"[^>]*>`));assert.notEqual(start,-1,`${className} is present`);
  const tags=new RegExp(`<(/?)${tag}\\b[^>]*>`,'g');tags.lastIndex=start;let depth=0,match;
  while((match=tags.exec(markup))){depth+=match[1]?-1:1;if(depth===0)return markup.slice(start,tags.lastIndex);}
  assert.fail(`${className} has a closing tag`);
}
test('public login separates configured brand from credentials without owning theme controls',()=>{
  const markup=render();
  const brand=section(markup,'xui-login-brand','header'),content=section(brand,'xui-login-brand-content');
  assert.match(content,/<div class="xui-login-identity"><strong>产品名称<\/strong><\/div><p class="xui-login-description">品牌说明<\/p>/);
  assert.ok(markup.indexOf(brand)<markup.indexOf('class="xui-login-form"'));
  assert.match(markup,/<h1[^>]*>登录产品<\/h1>/);
  assert.match(markup,/autoComplete="username"/);assert.match(markup,/autoComplete="current-password"/);
  assert.doesNotMatch(markup,/xui-login-theme|<select|Appearance|data-theme/);
});
test('login layout retains optional branding, text escaping and an unchanged form while authenticated navigation starts',()=>{
  const minimal=render(undefined,{description:undefined});assert.doesNotMatch(minimal,/xui-login-description|<img/);
  const configured=render(undefined,{productName:'<script>brand</script>',logo:{src:'/brand.svg',alt:'产品 logo'}});assert.match(configured,/&lt;script&gt;brand&lt;\/script&gt;/);assert.match(configured,/alt="产品 logo"/);
  const signedIn=render({status:'authenticated',user:{id:'demo',username:'demo',display_name:'示例用户'},busy:null,error:null});assert.doesNotMatch(signedIn,/Signed in:|>Continue<|>Sign out</);assert.match(signedIn,/type="password"[^>]*disabled=""/);assert.match(signedIn,/Opening app…/);
});
test('both public login renderers keep theme ownership external and use the same brand roles',async()=>{
  for(const file of ['packages/ui-react/src/login.tsx','packages/runtime/src/login-dom.ts']){const source=await readFile(file,'utf8');assert.match(source,/xui-login-identity/);assert.doesNotMatch(source,/xui-login-theme|theme\.(?:setMode|subscribe|getState|destroy)|localStorage|sessionStorage/);}
  const css=await readFile('packages/theme/src/auth.css','utf8');assert.doesNotMatch(css,/xui-login-theme|#[0-9a-f]{3,8}\b/i);
});

test('login defaults to a card and keeps any optional visual decorative',()=>{
  const markup=render(undefined,{}, {brandVisual:React.createElement('img',{src:'/illustration.svg',alt:''})});
  assert.match(markup,/data-layout="card"/);
  assert.match(markup,/<div class="xui-login-visual" aria-hidden="true" inert=""><img[^>]*src="\/illustration.svg"/);
  const brand=section(markup,'xui-login-brand-content');
  assert.ok(brand.indexOf('xui-login-identity')<brand.indexOf('xui-login-description'));
  assert.ok(brand.indexOf('xui-login-description')<brand.indexOf('xui-login-visual'));
  assert.match(render(undefined,{layout:'fullscreen'}),/data-layout="fullscreen"/);
  assert.doesNotMatch(render(),/xui-login-visual/);
  assert.equal((render().match(/xui-login-feedback/g)||[]).length,1);
  assert.equal((render({status:'unknown',user:null,busy:'session',error:null}).match(/xui-login-feedback/g)||[]).length,1);
});
test('login centers one credential core with its primary action before separate SSO options and feedback support',()=>{
  const markup=render(undefined,{}, {extensions:{actions:[{id:'oidc',label:'Enterprise OIDC',run(){}},{id:'saml',label:'Enterprise SAML',run(){}}]}});
  const core=section(markup,'xui-login-content'),body=section(core,'xui-login-body'),actions=section(core,'xui-login-actions','footer'),options=section(core,'xui-login-options'),support=section(markup,'xui-login-support');
  assert.ok(core.indexOf(body)<core.indexOf(actions));assert.ok(core.indexOf(actions)<core.indexOf(options));
  const primary=actions.match(/<button\b[^>]*>/)?.[0]??'';assert.match(primary,/class="[^"]*xui-login-submit[^"]*"/);assert.match(primary,/data-size="lg"/);
  assert.doesNotMatch(actions,/Enterprise OIDC|Enterprise SAML|xui-reserved-action/);
  assert.match(options,/>Enterprise OIDC<\/button>/);assert.match(options,/>Enterprise SAML<\/button>/);
  assert.doesNotMatch(core,/xui-login-feedback|xui-login-support/);assert.match(support,/class="xui-login-feedback"/);
  assert.ok(markup.indexOf(core)<markup.indexOf(support));assert.doesNotMatch(render(),/xui-login-options/);
});

test('public login removes cancelled-action UI and obsolete page labels',async()=>{
  const {loginPageDefaultLabels}=await import('../packages/runtime/dist/auth.js');
  for(const key of ['cancel','signingOut','continue','logout','theme','light','dark','system','signedIn'])assert.equal(Object.hasOwn(loginPageDefaultLabels,key),false,key);
  for(const file of ['packages/ui-react/src/login.tsx','packages/runtime/src/login-dom.ts']){const source=await readFile(file,'utf8');assert.doesNotMatch(source,/labels\.cancel\b|canCancel|restoreFocus|cancel\.onclick/);}
});
