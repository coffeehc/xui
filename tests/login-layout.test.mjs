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
const declarations=(css,selector)=>[...css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([,selectors])=>selectors.split(',').some(value=>value.trim()===selector)).map(([, ,body])=>body).join(';');
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
  const css=await readFile('packages/theme/src/auth.css','utf8');assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);assert.match(css,/@media \(max-width:47\.999rem\)/);assert.doesNotMatch(css,/xui-login-theme|#[0-9a-f]{3,8}\b/i);
});

test('fullscreen is the default with an explicit card layout and inert decorative visual slot',()=>{
  const markup=render(undefined,{}, {brandVisual:React.createElement('img',{src:'/illustration.svg',alt:''})});
  assert.match(markup,/data-layout="fullscreen"/);assert.doesNotMatch(markup,/xui-login-card xui-surface/);
  assert.match(markup,/<div class="xui-login-visual" aria-hidden="true" inert=""><img[^>]*src="\/illustration.svg"/);
  const brand=section(markup,'xui-login-brand-content');
  assert.ok(brand.indexOf('xui-login-identity')<brand.indexOf('xui-login-description'));
  assert.ok(brand.indexOf('xui-login-description')<brand.indexOf('xui-login-visual'));
  assert.match(render(undefined,{layout:'card'}),/data-layout="card"/);
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
test('login scrollports retain four-sided focus clearance without changing focus tokens',async()=>{
  const css=await readFile('packages/theme/src/auth.css','utf8');
  for(const selector of ['.xui-login-body','.xui-login-actions','.xui-login-feedback','.xui-login-options']){
    const rules=declarations(css,selector);
    assert.match(rules,/padding:calc\(var\(--focus-width\) \+ var\(--focus-offset\)\)/,selector);
    assert.match(rules,/scroll-padding:calc\(var\(--focus-width\) \+ var\(--focus-offset\)\)/,selector);
    assert.match(rules,selector==='.xui-login-feedback'?/overflow:hidden/:/overflow:auto/,selector);
  }
  const body=declarations(css,'.xui-login-body');assert.match(body,/grid-auto-rows:max-content/);assert.match(body,/align-content:start/);
  assert.match(css,/scroll-margin:calc\(var\(--focus-width\) \+ var\(--focus-offset\)\)/);
  assert.match(css,/max-height:30rem/);assert.doesNotMatch(css,/--focus-(?:width|offset)\s*:/);
});
