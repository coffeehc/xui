import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as password from '../packages/runtime/dist/password.js';
import {PasswordInput} from '../packages/ui-react/dist/text-inputs.js';
import {PasswordStrengthInput,NewPasswordFields} from '../packages/ui-react/dist/password.js';

test('new passwords use the fixed Unicode codepoint boundaries without a strength gate',()=>{
  assert.equal(password.passwordMinimumCharacters,6);
  assert.equal(password.passwordMaximumCharacters,32);
  for(const character of ['a','中','😀'])for(const count of [5,6,32,33]){
    const value=character.repeat(count);
    assert.equal(password.countPasswordCodePoints(value),count);
    assert.equal(password.validatePassword(value),count>=6&&count<=32?null:'invalid_length');
    assert.equal(password.validateNewPassword(value,value),count>=6&&count<=32?null:'invalid_length');
  }
  for(const value of ['      ','a中😀a中😀','e\u0301e\u0301e\u0301'])assert.equal(password.validateNewPassword(value,value),null);
  assert.equal(password.validateNewPassword('abcdef','abcdeg'),'confirmation_mismatch');
  assert.equal(password.validateNewPassword('e\u0301e\u0301e\u0301','ééé'),'confirmation_mismatch');
  for(const value of ['abcde\ud800','abcde\udfff']){
    assert.equal(password.countPasswordCodePoints(value),null);
    assert.equal(password.validatePassword(value),'invalid_unicode');
    assert.equal(password.validateNewPassword(value,value),'invalid_unicode');
  }
  assert.equal(password.countPasswordCodePoints('👨‍👩‍👧‍👦'),7);
});

test('length and confirmation errors use the fixed public labels',()=>{
  assert.equal(password.newPasswordLabels.length(6,32),'6–32个字符');
  assert.equal(password.getNewPasswordErrorMessage('invalid_unicode'), '密码含无效字符');
  assert.equal(password.getNewPasswordErrorMessage('invalid_length',password.newPasswordLabels,5),'至少6个字符');
  assert.equal(password.getNewPasswordErrorMessage('invalid_length',password.newPasswordLabels,33),'最多32个字符');
  assert.equal(password.getNewPasswordErrorMessage('confirmation_mismatch'), '两次密码不一致');
  assert.doesNotMatch(password.newPasswordLabels.length(6,32),/Unicode|码点|UTF-16/);
  assert.equal('loadPasswordPolicy' in password,false);
  assert.equal('parsePasswordPolicy' in password,false);
  assert.equal('passwordPolicyEndpoint' in password,false);
});

test('password inputs render one field and an accessible empty strength meter without visible rules or length gates',()=>{
  const regular=renderToStaticMarkup(React.createElement(PasswordInput,{value:'',onValueChange(){},required:true,prefix:'账号密码',suffix:'可见'}));
  assert.match(regular,/type="password"/);
  assert.match(regular,/required=""/);
  assert.doesNotMatch(regular,/maxLength|minLength|pattern=/i);
  const strength=renderToStaticMarkup(React.createElement(PasswordStrengthInput,{value:'',onValueChange(){}}));
  assert.equal((strength.match(/type="password"/g)||[]).length,1);
  assert.match(strength,/data-xui-password-strength=""/);
  assert.match(strength,/role="meter"/);
  assert.match(strength,/aria-label="密码强度"/);
  assert.match(strength,/aria-valuemin="0"/);
  assert.match(strength,/aria-valuemax="5"/);
  assert.match(strength,/aria-valuetext="等待输入"/);
  assert.doesNotMatch(strength,/aria-valuenow=|data-xui-password-count|data-xui-password-advice|改进建议|6–32|已输入0个字符/);
  assert.doesNotMatch(strength,/maxLength|minLength|pattern=/i);
  const fields=renderToStaticMarkup(React.createElement(NewPasswordFields,{}));
  assert.equal((fields.match(/type="password"/g)||[]).length,2);
  assert.match(fields,/确认密码/);
  assert.doesNotMatch(fields,/maxLength|minLength|pattern=|password-policy/i);
});

test('password source has no policy endpoint, browser persistence or client-side truncation',async()=>{
  const {readFile}=await import('node:fs/promises');
  for(const path of ['packages/runtime/src/password.ts','packages/runtime/src/password-dom.ts','packages/ui-react/src/password.tsx']){
    const source=await readFile(path,'utf8');
    assert.doesNotMatch(source,/password-policy|loadPasswordPolicy|parsePasswordPolicy|localStorage|sessionStorage|maxLength|minLength|\.trim\(|\.normalize\(|\.slice\(/);
  }
});
