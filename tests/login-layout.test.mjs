import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {ConfigurableLoginPage} from '../packages/ui-react/dist/login.js';
import {createLoginViewController} from '../packages/runtime/dist/login-view.js';

const theme=new Proxy({},{get(){throw new Error('Login must inherit root theme without reading or mutating the owner.');}});
for(const labels of [undefined,{submit:'登录',opening:'正在进入工作空间…',navigationError:'已登录，但未能打开工作空间。',retryNavigation:'重试进入'}])test(`rejected authenticated handoff is idle and locked, with safe phase state (${labels?'zh':'en'})`,async()=>{
 const state={status:'authenticated',user:{id:'42',username:'demo',display_name:'Demo'},busy:null,error:null},auth={getState:()=>state,subscribe:()=>()=>{}},phases=[];
 const controller=createLoginViewController({auth,config:{productName:'Test',labels},onAuthenticated:()=>{throw Error('FAKE_PRIVATE_HANDOFF_DETAIL');}});controller.subscribe(()=>phases.push(controller.getState().navigationPhase));const release=controller.bind({readCredentials:()=>({username:'demo',password:''}),clearPassword(){},focus(){},navigate(){}});await Promise.resolve();
 assert.deepEqual(phases,['idle','opening','failed']);assert.equal(controller.getState().navigationPhase,'failed');assert.doesNotMatch(JSON.stringify(controller.getState()),/FAKE_PRIVATE_HANDOFF_DETAIL/);
 const markup=renderToStaticMarkup(React.createElement(ConfigurableLoginPage,{controller,theme})),actions=section(markup,'xui-login-actions','footer'),primary=actions.match(/<button\b[\s\S]*?<\/button>/)?.[0];assert.ok(primary);assert.match(primary,/disabled=""/);assert.match(primary,/aria-busy="false"/);assert.ok(primary.includes(`<span>${labels?.submit??'Sign in'}</span>`));assert.doesNotMatch(markup,/role="status"/);assert.equal(auth.getState().status,'authenticated');release();controller.destroy();
});
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
  const brand=section(markup,'xui-login-brand','header'),content=brand;
  assert.match(content,/<div class="xui-login-identity"><strong>产品名称<\/strong><\/div>/);
  assert.doesNotMatch(content,/xui-login-description/);
  assert.match(section(markup,'xui-login-heading'),/<h1[^>]*>登录产品<\/h1><\/div><p class="xui-login-description">品牌说明<\/p>/);
  assert.ok(markup.indexOf(brand)<markup.indexOf('class="xui-login-card'));
  assert.doesNotMatch(section(markup,'xui-login-card xui-surface','section'),/xui-login-brand/);
  assert.match(markup,/<h1[^>]*>登录产品<\/h1>/);
  assert.match(markup,/autoComplete="username"/);assert.match(markup,/autoComplete="current-password"/);
  assert.doesNotMatch(markup,/xui-login-theme|<select|Appearance|data-theme/);
});
test('login layout retains optional branding, text escaping and an unchanged form while authenticated navigation starts',()=>{
  const minimal=render(undefined,{description:undefined});assert.doesNotMatch(minimal,/xui-login-description|<img/);
  const configured=render(undefined,{productName:'<script>brand</script>',logo:{src:'/brand.svg',alt:'产品 logo'}});assert.match(configured,/&lt;script&gt;brand&lt;\/script&gt;/);assert.match(configured,/alt="产品 logo"/);
  const signedIn=render({status:'authenticated',user:{id:'demo',username:'demo',display_name:'示例用户'},busy:null,error:null});assert.doesNotMatch(signedIn,/Signed in:|>Continue<|>Sign out</);assert.match(signedIn,/type="password"[^>]*disabled=""/);assert.match(signedIn,/Opening app…/);
});
test('public login keeps theme ownership external and uses the shared brand roles',async()=>{
  const source=await readFile('packages/ui-react/src/login.tsx','utf8');assert.match(source,/xui-login-identity/);assert.doesNotMatch(source,/xui-login-theme|theme\.(?:setMode|subscribe|getState|destroy)|localStorage|sessionStorage/);
  const css=await readFile('packages/theme/src/auth.css','utf8');assert.doesNotMatch(css,/xui-login-theme|#[0-9a-f]{3,8}\b/i);
});

test('login defaults to a card and keeps any optional visual decorative',()=>{
  const markup=render(undefined,{}, {brandVisual:React.createElement('img',{src:'/illustration.svg',alt:''})});
  assert.match(markup,/data-layout="card"/);
  assert.match(markup,/<div class="xui-login-visual" aria-hidden="true" inert=""><img[^>]*src="\/illustration.svg"/);
  const brand=section(markup,'xui-login-brand','header');
  assert.ok(brand.indexOf('xui-login-identity')<brand.indexOf('xui-login-visual'));
  assert.doesNotMatch(brand,/xui-login-description/);
  assert.match(render(undefined,{layout:'fullscreen'}),/data-layout="fullscreen"/);
  assert.doesNotMatch(render(),/xui-login-visual/);
  assert.doesNotMatch(render(),/xui-login-support|xui-login-feedback/);
  assert.match(render({status:'unknown',user:null,busy:'session',error:null}),/class="xui-login-support"[\s\S]*Checking your sign-in/);
});
test('login centers one credential core with its primary action before separate SSO options and omits empty support',()=>{
  const markup=render(undefined,{}, {extensions:{actions:[{id:'oidc',label:'Enterprise OIDC',run(){}},{id:'saml',label:'Enterprise SAML',run(){}}]}});
  const core=section(markup,'xui-login-content'),body=section(core,'xui-login-body'),actions=section(core,'xui-login-actions','footer'),options=section(core,'xui-login-options');
  assert.ok(core.indexOf(body)<core.indexOf(actions));assert.ok(core.indexOf(actions)<core.indexOf(options));
  const primary=actions.match(/<button\b[^>]*>/)?.[0]??'';assert.match(primary,/class="[^"]*xui-login-submit[^"]*"/);assert.match(primary,/data-size="lg"/);
  assert.doesNotMatch(actions,/Enterprise OIDC|Enterprise SAML|xui-reserved-action/);
  assert.match(options,/>Enterprise OIDC<\/button>/);assert.match(options,/>Enterprise SAML<\/button>/);
  assert.doesNotMatch(core,/xui-login-feedback|xui-login-support/);assert.doesNotMatch(markup,/xui-login-support|xui-login-feedback/);
  assert.doesNotMatch(render(),/xui-login-options/);
});

test('public login removes cancelled-action UI and obsolete page labels',async()=>{
  const {loginPageDefaultLabels}=await import('../packages/runtime/dist/auth.js');
  for(const key of ['cancel','signingOut','continue','logout','theme','light','dark','system','signedIn'])assert.equal(Object.hasOwn(loginPageDefaultLabels,key),false,key);
  const source=await readFile('packages/ui-react/src/login.tsx','utf8');assert.doesNotMatch(source,/labels\.cancel\b|canCancel|restoreFocus|cancel\.onclick/);
});

test('unknown login state keeps ordinary submit controls without a recovery flow',()=>{
 const markup=render({status:'unknown',user:null,busy:null,error:null});
 assert.doesNotMatch(markup,/Check previous operation|Terminate unfinished operation|Resolve write|operation_id/);
 assert.doesNotMatch(markup,/name="username"[^>]*disabled/);
});

test('submission status has one live owner outside the busy button without duplicating a visible alert',()=>{
  const busy=render({status:'anonymous',user:null,busy:'login',error:null});
  const actions=section(busy,'xui-login-actions','footer'),button=actions.match(/<button\b[\s\S]*?<\/button>/)[0];
  assert.match(button,/aria-busy="true"/);assert.doesNotMatch(button,/aria-live|role="status"/);
  assert.match(actions,/<\/button><span class="xui-login-announcement" role="status" aria-live="polite" aria-atomic="true">Signing in…<\/span>/);
  assert.doesNotMatch(busy,/class="xui-login-support"|class="xui-login-feedback"|xui-alert/);
  const checking=render({status:'unknown',user:null,busy:'session',error:null});
  assert.match(section(checking,'xui-login-feedback'),/Checking your sign-in…/);
  assert.doesNotMatch(section(checking,'xui-login-actions','footer'),/role="status"/);
});
