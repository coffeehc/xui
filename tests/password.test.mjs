import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {parsePasswordPolicy,validateNewPassword,countPasswordCodePoints,loadPasswordPolicy,newPasswordLabels,getNewPasswordErrorMessage} from '../packages/runtime/dist/password.js';
import {createHttpClient} from '../packages/runtime/dist/http.js';
import {createAuthClient} from '../packages/runtime/dist/auth.js';
import {NewPasswordFields} from '../packages/ui-react/dist/password.js';

// 测试数据是后端公开策略样例，生产组件不复制范围常量。
const policy=parsePasswordPolicy({version:1,minimum_characters:6,maximum_characters:32,counting_unit:'unicode_code_points'});
test('new passwords use server Unicode codepoint boundaries without strength gates',()=>{
  for(const character of ['a','中','😀'])for(const count of [5,6,32,33]){const value=character.repeat(count);assert.equal(countPasswordCodePoints(value),count);assert.equal(validateNewPassword(policy,value,value),count>=6&&count<=32?null:'invalid_length');}
  for(const value of ['      ','a中😀a中😀','e\u0301e\u0301e\u0301'])assert.equal(validateNewPassword(policy,value,value),null);
  assert.equal(validateNewPassword(policy,'abcdef','abcdeg'),'confirmation_mismatch');
  assert.equal(validateNewPassword(policy,'e\u0301e\u0301e\u0301','ééé'),'confirmation_mismatch');
  for(const value of ['abcde\ud800','abcde\udfff'])assert.equal(validateNewPassword(policy,value,value),'invalid_unicode');
  assert.equal(validateNewPassword(null,'abcdef','abcdef'),'policy_unavailable');
});
test('password policy is parsed and consumed, without a hard-coded client range',()=>{
  for(const bad of [{...policy,version:2},{...policy,counting_unit:'utf16'},{...policy,minimum_characters:0},{...policy,maximum_characters:5},{...policy,maximum_characters:Infinity}])assert.throws(()=>parsePasswordPolicy(bad));
  const next=parsePasswordPolicy({...policy,minimum_characters:2,maximum_characters:3});assert.equal(validateNewPassword(next,'😀中','😀中'),null);assert.equal(validateNewPassword(next,'aaaa','aaaa'),'invalid_length');assert.ok(Object.isFrozen(next));
});
test('policy loader uses the public endpoint and parses the envelope',async()=>{
  let request;
  const policyResponse={success:true,code:200,message:'',request_id:'fixture',payload:policy};
  const http={async request(path,options){request={path,options};return options.adapter(policyResponse,{status:200,attempts:1});}};
  assert.deepEqual(await loadPasswordPolicy(http),policy);assert.equal(request.path,'/api/v1/auth/password-policy');assert.equal(request.options.cache,'no-store');assert.equal(request.options.unauthorized,'ignore');assert.equal(request.options.method,'GET');
  policyResponse.payload={...policy,version:2};await assert.rejects(()=>loadPasswordPolicy(http));
});
test('shared fields render confirmation, server limits and no HTML UTF16 length gate',async()=>{
  const markup=renderToStaticMarkup(React.createElement(NewPasswordFields,{policy}));
  assert.equal((markup.match(/type="password"/g)||[]).length,2);assert.match(markup,/确认密码/);assert.match(markup,/6–32/);assert.doesNotMatch(markup,/maxLength|minLength|pattern=|strength/i);
  const unavailable=renderToStaticMarkup(React.createElement(NewPasswordFields,{policy:null}));assert.equal((unavailable.match(/disabled=""/g)||[]).length,2);assert.match(unavailable,/密码规则暂不可用/);
  for(const path of ['packages/ui-react/src/password.tsx','packages/runtime/src/password-dom.ts']){const source=await readFile(path,'utf8');assert.doesNotMatch(source,/localStorage|sessionStorage|maxLength|minLength|\.trim\(|\.normalize\(|\.slice\(/);assert.match(source,/pagehide/);}
});

test('public policy works through the existing auth-bound transport without acquiring a session',async()=>{
  const requests=[];
  const http=createHttpClient({baseURL:'https://password.example',fetch:async(url,options)=>{requests.push({url,options});return new Response(JSON.stringify({success:true,code:200,message:'',request_id:'policy-fixture',payload:policy}),{headers:{'Content-Type':'application/json'}});}});
  const auth=createAuthClient({http,protectedPaths:['/api/v1/']});
  try {assert.deepEqual(await loadPasswordPolicy(http),policy);assert.equal(requests.length,1);assert.equal(new URL(requests[0].url).pathname,'/api/v1/auth/password-policy');assert.equal(requests[0].options.credentials,'omit');assert.equal(requests[0].options.headers.get('Authorization'),null);assert.equal(auth.getState().status,'unknown');
    await assert.rejects(()=>http.request('/api/v1/auth/password-policy',{method:'POST'}));await assert.rejects(()=>http.request('/api/v1/auth/login'));assert.equal(requests.length,1);
  } finally {auth.destroy();http.destroy();}
});

test('password rules explain accepted characters and length without implementation jargon',()=>{
 assert.equal(newPasswordLabels.length(6,32),'密码长度为 6–32 个字符，可使用大小写字母、数字及 _、+、# 等符号。');
 assert.equal(newPasswordLabels.count(7),'已输入7个字符');
 assert.equal(getNewPasswordErrorMessage('invalid_unicode',policy),'密码包含无法识别的字符，请重新输入。');
 assert.equal(getNewPasswordErrorMessage('invalid_length',policy,newPasswordLabels,5),'密码太短，至少需要6个字符。');
 assert.equal(getNewPasswordErrorMessage('invalid_length',policy,newPasswordLabels,33),'密码太长，最多可输入32个字符。');
 assert.match(newPasswordLabels.length(2,9),/2–9/);
 const markup=renderToStaticMarkup(React.createElement(NewPasswordFields,{policy}));assert.doesNotMatch(markup,/Unicode|码点|UTF-16/);assert.match(markup,/已输入0个字符/);
 assert.equal(countPasswordCodePoints('👨‍👩‍👧‍👦'),7);
});
