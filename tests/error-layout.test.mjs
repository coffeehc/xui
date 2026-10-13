import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {DataTable} from '../packages/ui-react/dist/data-table.js';
import {DataRegion} from '../packages/ui-react/dist/feedback.js';
import {ConfigurableLoginPage} from '../packages/ui-react/dist/login.js';
import {HttpError} from '../packages/runtime/dist/http.js';
const read=path=>readFile(path,'utf8');
const loginLabels={checkSession:'Retry connection'};
function renderLogin(state={}){
  const snapshot={status:'anonymous',user:null,busy:null,error:null,reauthenticationRequired:false,...state};
  return renderToStaticMarkup(React.createElement(ConfigurableLoginPage,{auth:{subscribe:()=>()=>{},getState:()=>snapshot},theme:{},config:{productName:'Demo',title:'Login',labels:loginLabels}}));
}
function loginFeedback(markup){
  const start=markup.indexOf('<div class="xui-login-feedback">');assert.notEqual(start,-1);
  const tags=/<(\/?)div\b[^>]*>/g;tags.lastIndex=start;let depth=0,match;
  while((match=tags.exec(markup))){depth+=match[1]?-1:1;if(depth===0)return markup.slice(start,tags.lastIndex);}
  assert.fail('Login feedback has a closing tag');
}
const authError=(kind,endpointId,status)=>new HttpError(kind,{attempts:1,endpointId,...(status===undefined?{}:{status})});
const noRetry=markup=>assert.doesNotMatch(markup,/>Retry connection<\/button>/);
const declarations=(css,selector)=>[...css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([,selectors])=>selectors.split(',').some(value=>value.trim()===selector)).map(([, ,body])=>body).join(';');

test('DataTable retains a footer feedback owner without a reserved row above its table',()=>{
  for(const rows of [[],[{id:'a'}]])for(const status of ['idle','ready','loading','refreshing','error']){
    const html=renderToStaticMarkup(React.createElement(DataTable,{label:'Records',rows,status,rowKey:row=>row.id,columns:[{id:'name',header:'Name',cell:row=>row.id}],onRetry(){}}));
    assert.equal((html.match(/class="xui-data-table-feedback"/g)||[]).length,1);
    assert.match(html,/<thead>/);assert.match(html,/<footer class="xui-data-table-footer">/);assert.ok(html.indexOf('class="xui-data-table-feedback"')>html.indexOf('<footer '));
    if(!rows.length)assert.equal((html.match(/class="xui-data-table-placeholder"/g)||[]).length,1);
  }
});
test('DataRegion feedback prop opts into a persistent local slot, including idle null',()=>{
  for(const feedback of [null,React.createElement('div',{role:'alert'},'Failure')]){
    const html=renderToStaticMarkup(React.createElement(DataRegion,{feedback},React.createElement('input',{defaultValue:'keep'})));
    assert.match(html,/xui-feedback-slot/);assert.match(html,/value="keep"/);
  }
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(DataRegion,null,'Content')),/xui-feedback-slot/);
});
test('idle login keeps an empty feedback track without hidden auxiliary controls',()=>{
  const html=renderLogin();
  assert.equal(loginFeedback(html),'<div class="xui-login-feedback"></div>');
  assert.doesNotMatch(html,/xui-reserved-action|data-inactive=|>Cancel request<\/button>/);noRetry(html);
  assert.equal((html.match(/<button\b/g)||[]).length,1);
  assert.match(html,/data-idle-label=/);assert.match(html,/data-busy-label=/);
});
test('credential rejections never offer session retry, including an unknown prior identity',()=>{
  for(const status of [401,403,429])for(const identity of ['anonymous','unknown']){
    const html=renderLogin({status:identity,error:authError('http','auth.login',status)});
    assert.match(loginFeedback(html),/role="alert"/);noRetry(html);
    assert.doesNotMatch(html,/>Cancel request<\/button>|xui-reserved-action|data-inactive=/);
  }
});
test('only retryable session reads expose a local retry beside, not inside, their live feedback',()=>{
  for(const [kind,status] of [['network'],['timeout'],['http',500],['http',502],['http',503],['http',599]]){
    const html=renderLogin({status:'unknown',error:authError(kind,'auth.session',status)}),feedback=loginFeedback(html);
    assert.equal((html.match(/>Retry connection<\/button>/g)||[]).length,1);
    assert.match(feedback,/<div\b[^>]*role="alert"[^>]*>[^<]+<\/div>\s*<button\b[^>]*>Retry connection<\/button>/);
    noRetry(html.replace(feedback,''));assert.doesNotMatch(feedback,/>Cancel request<\/button>/);
  }
  for(const [kind,status] of [['http',401],['http',403],['http',409],['http',429],['http'],['cancel'],['parse'],['business']])noRetry(renderLogin({status:'unknown',error:authError(kind,'auth.session',status)}));
  noRetry(renderLogin({status:'unknown'}));noRetry(renderLogin({status:'unknown',error:authError('network',undefined)}));
  noRetry(renderLogin({status:'authenticated',user:{id:'42',username:'demo',display_name:null},error:authError('network','auth.session')}));
});
test('unconfirmed writes and reauthentication-required states never offer session retry',()=>{
  for(const endpointId of ['auth.login','auth.refresh','auth.logout'])for(const [kind,status] of [['network'],['timeout'],['http',503]])for(const reauthenticationRequired of [false,true]){
    noRetry(renderLogin({status:'unknown',reauthenticationRequired,error:authError(kind,endpointId,status)}));
  }
  for(const [kind,status] of [['network'],['timeout'],['http',500],['http',503]]){
    const html=renderLogin({status:'unknown',reauthenticationRequired:true,error:authError(kind,'auth.session',status)});
    noRetry(html);assert.match(loginFeedback(html),/The previous session operation is unconfirmed\. Another submission is temporarily blocked\./);
  }
});
test('login, session and application logout do not expose page cancellation actions',()=>{
  for(const busy of ['login','session','refresh','logout']){
    const html=renderLogin({status:'unknown',busy});assert.doesNotMatch(html,/>Cancel request<\/button>/);noRetry(html);
  }
  noRetry(renderLogin({status:'unknown',busy:'session',error:authError('network','auth.session')}));
});

test('feedback is token-scaled and auth text is never constrained to a clipped local slot',async()=>{
  const css=await read('packages/theme/src/feedback.css'),auth=await read('packages/theme/src/auth.css');
  for(const selector of ['.xui-feedback-slot']){
    const rules=declarations(css,selector);assert.match(rules,/(?:^|;)\s*block-size:var\(--feedback-slot-block-size\)/);assert.match(rules,/overflow:auto/);
  }
  assert.doesNotMatch(css,/\.xui-login-feedback\b/);
  const feedback=declarations(auth,'.xui-login-feedback');
  assert.match(feedback,/min-block-size:var\(--login-feedback-block-size\)/);assert.doesNotMatch(feedback,/(?:^|;)block-size:|overflow:(?:hidden|auto|clip)/);assert.doesNotMatch(declarations(auth,'.xui-login-feedback>.xui-alert'),/max-block-size:|overflow:(?:auto|hidden|clip)/);
  for(const part of ['base','button','forms','navigation','feedback','dialog','layout','floating','table','auth','sheet','widgets'])assert.doesNotMatch(await read(`packages/theme/src/${part}.css`),/@font-face|@import\s+['"]https?:|url\(\s*['"]?https?:/i);
});
test('native list views only move keyed rows when their actual order changes',async()=>{
  for(const name of ['api-key','business-log','structured-log']){
    const source=await read(`packages/runtime/src/${name}-dom.ts`);
    assert.doesNotMatch(source,/tbody\.append\(entry\.row\)/);
    assert.match(source,/tbody\.children\[rowIndex\]!==entry\.row/);
  }
});

test('DataTable feedback and placeholder do not clip complete host content into a fixed-height status row',async()=>{
  const css=await read('packages/theme/src/table.css');
  for(const selector of ['.xui-data-table-feedback','.xui-data-table-placeholder'])assert.doesNotMatch(declarations(css,selector),/(?:^|;)\s*(?:block-size|max-block-size):|overflow:(?:auto|hidden|clip)/);
  assert.match(declarations(css,'.xui-data-table-feedback:empty'),/display:none/);
});
