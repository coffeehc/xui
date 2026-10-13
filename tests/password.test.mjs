import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {parsePasswordPolicy,validateNewPassword,countPasswordCodePoints,loadPasswordPolicy} from '../packages/runtime/dist/password.js';
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
