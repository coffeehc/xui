import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import {createAdminSetupController,adminSetupLabels,getAdminSetupMessage} from '../packages/runtime/dist/admin-setup.js';
import {AdminSetupPage,AdminSetupForm} from '../packages/ui-react/dist/admin-setup.js';
import {AuthPage} from '../packages/ui-react/dist/login.js';
const credentials=()=>({username:'admin',password:'sample-password'}),deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('administrator setup serializes writes and clears the provided secret without putting it in state',async()=>{
 const wait=deferred();let calls=0;const owner=createAdminSetupController({state:{status:'idle'},onSubmit:()=>{calls++;return wait.promise;}}),input=credentials();const pending=owner.submit(input);assert.equal(owner.getState().status,'submitting');assert.doesNotMatch(JSON.stringify(owner.getState()),/sample-password|admin"/);const duplicate=credentials();await owner.submit(duplicate);assert.equal(calls,1);assert.equal(duplicate.password,'');wait.resolve('complete');await pending;assert.equal(input.password,'');assert.equal(owner.getState().status,'complete');await owner.submit(credentials());assert.equal(calls,1);
});
test('unknown exceptions and invalid outcomes fail closed without retries or error disclosure',async()=>{
 for(const callback of [()=>{throw new Error('secret backend details');},()=>Promise.reject('token'),()=>undefined,()=>({status:'complete'})]){let calls=0;const owner=createAdminSetupController({state:{status:'idle'},onSubmit:()=>{calls++;return callback();}});await owner.submit(credentials());assert.deepEqual(owner.getState(),{status:'unconfirmed'});await owner.submit(credentials());assert.equal(calls,1);assert.doesNotMatch(getAdminSetupMessage(owner.getState()),/secret|token|核对|receipt|journal/);}
});
test('authoritative rejection permits another explicit submit; availability is never inferred',async()=>{
 let calls=0;const owner=createAdminSetupController({state:{status:'unavailable'},onSubmit:()=>{calls++;return 'rejected';}});await owner.submit(credentials());assert.equal(calls,0);owner.setState({status:'idle',revision:1});await owner.submit(credentials());assert.deepEqual(owner.getState(),{status:'idle',rejected:true});assert.equal(getAdminSetupMessage(owner.getState()),adminSetupLabels.rejected);await owner.submit(credentials());assert.equal(calls,2);
});
test('suspension, new authoritative facts and destruction discard late writes',async()=>{
 for(const action of ['suspend','replace','destroy']){const wait=deferred();let signal;const owner=createAdminSetupController({state:{status:'idle'},onSubmit:(_,context)=>{signal=context.signal;return wait.promise;}});let updates=0;owner.subscribe(()=>updates++);const input=credentials(),pending=owner.submit(input);if(action==='replace')owner.setState({status:'unavailable'});else owner[action]();const snapshot=owner.getState(),count=updates;assert.equal(signal.aborted,true);assert.equal(input.password,'');wait.resolve('complete');await pending;assert.equal(input.password,'');assert.equal(owner.getState(),snapshot);assert.equal(updates,count);if(action==='suspend')assert.equal(snapshot.status,'unconfirmed');}
});
test('invalid authority fails closed and no result creates authentication state',()=>{
 for(const state of [{status:'authenticated'},{status:'idle',revision:NaN},null])assert.throws(()=>createAdminSetupController({state,onSubmit:()=> 'complete'}),TypeError);
 assert.match(adminSetupLabels.complete,/请登录/);
});
test('React server render is a single stable public form with no secret or automatic work',()=>{
 for(const status of ['idle','submitting','unconfirmed','complete','unavailable']){const markup=renderToString(React.createElement(AdminSetupPage,{config:{productName:'Example',title:'创建管理员'},state:{status},onSubmit(){throw new Error('SSR submitted');}}));assert.equal((markup.match(/<form\b/g)||[]).length,1);assert.equal((markup.match(/type="password"/g)||[]).length,2);assert.equal((markup.match(/aria-label="Show password"/g)||[]).length,2);assert.equal((markup.match(/class="xui-disclosure-trigger"/g)||[]).length,0);assert.equal((markup.match(/type="submit"/g)||[]).length,1);assert.doesNotMatch(markup,/核对|readonly|journal|receipt|sample-password|password-policy/i);if(status!=='idle')assert.match(markup,/disabled=""/);}
});

test('authority change during the submitting notification prevents the callback from starting',async()=>{
 let calls=0;const controller=createAdminSetupController({state:{status:'idle'},onSubmit:()=>{calls++;return 'complete';}});controller.subscribe(()=>{if(controller.getState().status==='submitting')controller.setState({status:'unavailable'});});const credentials={username:'fixture',password:'synthetic-only'};await controller.submit(credentials);assert.equal(calls,0);assert.equal(credentials.password,'');assert.equal(controller.getState().status,'unavailable');controller.destroy();
});

test('administrator controller form aggregate owns all local errors and password visibility',()=>{
 const controller=createAdminSetupController({state:{status:'idle'},onSubmit:()=> 'complete'}),form=controller.form,updates=[];form.subscribe(()=>updates.push(form.getState()));
 form.setUsernameError(true);form.passwordFields.setError('confirmation_mismatch');form.passwordFields.setTipOpen(true);form.passwordFields.password.inputController.setVisible(true);form.passwordFields.confirmation.setVisible(true);
 assert.deepEqual(form.getState(),{usernameError:true});assert.equal(form.passwordFields.getState().error,'confirmation_mismatch');assert.equal(form.passwordFields.getState().tipOpen,true);
 assert.doesNotMatch(JSON.stringify(form.getState())+JSON.stringify(form.passwordFields.getState()),/password|synthetic/);assert.equal(updates.length,1);
 form.clear();assert.deepEqual(form.getState(),{usernameError:false});assert.deepEqual(form.passwordFields.getState(),{error:null,tipOpen:false,strength:{status:'idle'}});assert.equal(form.passwordFields.password.inputController.getState().visible,false);assert.equal(form.passwordFields.confirmation.getState().visible,false);
 controller.destroy();form.setUsernameError(true);assert.equal(form.getState().usernameError,false);
});

 test('standalone setup form and page share the same model contract without nesting page shells',()=>{
 const props={state:{status:'idle'},onSubmit(){throw new Error('SSR must not submit');}};
 const form=renderToString(React.createElement(AdminSetupForm,props));
 assert.equal((form.match(/<form\b/g)||[]).length,1);assert.equal((form.match(/type="password"/g)||[]).length,2);assert.doesNotMatch(form,/<main|<h1|xui-login-(?:page|card|brand)/);
 const shell=renderToString(React.createElement(AuthPage,{config:{productName:'Example',title:'Setup'}},React.createElement(AdminSetupForm,props)));
 assert.equal((shell.match(/<main\b/g)||[]).length,1);assert.equal((shell.match(/<form\b/g)||[]).length,1);assert.equal((shell.match(/xui-login-card/g)||[]).length,1);
 const owner=createAdminSetupController(props);assert.doesNotMatch(JSON.stringify(owner.getState()),/password/);
 assert.throws(()=>renderToString(React.createElement(AdminSetupForm,{controller:owner,...props})),/controller cannot/);owner.destroy();
 });

test('host username policy blocks writes at the controller boundary and preserves the raw value',async()=>{
 let calls=0,validated=[],received;
 const owner=createAdminSetupController({state:{status:'idle'},validateUsername:raw=>{validated.push(raw);return raw.trim().length>=3?null:'用户名至少三个字符';},onSubmit:value=>{calls++;received={...value};return 'rejected';}});
 const invalid={username:'a',password:'synthetic-only'};await owner.submit(invalid);assert.equal(calls,0);assert.equal(invalid.password,'');assert.deepEqual(owner.getState(),{status:'idle'});assert.deepEqual(owner.form.getState(),{usernameError:true,usernameIssue:{message:'用户名至少三个字符'}});
 const input={username:' Admin ',password:'synthetic-only'};await owner.submit(input);assert.equal(calls,1);assert.equal(received.username,' Admin ');assert.equal(input.password,'');assert.deepEqual(validated,['a',' Admin ']);assert.deepEqual(owner.form.getState(),{usernameError:false});assert.doesNotMatch(JSON.stringify(owner.form.getState()),/Admin|synthetic/);owner.destroy();
});
test('default username policy stays nonempty only; required precedes host validation',async()=>{
 let validations=0,calls=0;const owner=createAdminSetupController({state:{status:'idle'},validateUsername:()=>{validations++;return null;},onSubmit:()=>{calls++;return 'rejected';}});
 const blank={username:' \t ',password:'synthetic-only'};await owner.submit(blank);assert.equal(blank.password,'');assert.equal(validations,0);assert.equal(calls,0);assert.deepEqual(owner.form.getState(),{usernameError:true});
 owner.update({validateUsername:undefined});await owner.submit({username:'a',password:'synthetic-only'});assert.equal(calls,1);assert.equal(validations,0);owner.destroy();
});
test('validation feedback updates only on a changed issue and clears without changing authority',()=>{
 const owner=createAdminSetupController({state:{status:'idle',revision:4},validateUsername:()=> '请检查用户名',onSubmit:()=> 'complete'}),updates=[];owner.form.subscribe(()=>updates.push(owner.form.getState()));
 assert.equal(owner.form.validateUsername('a'),false);assert.equal(owner.form.validateUsername('a'),false);assert.equal(updates.length,1);assert.equal(Object.isFrozen(owner.form.getState().usernameIssue),true);
 owner.form.setUsernameError(false);assert.deepEqual(owner.form.getState(),{usernameError:false});owner.form.validateUsername('a');owner.form.clear();assert.deepEqual(owner.form.getState(),{usernameError:false});assert.deepEqual(owner.getState(),{status:'idle',revision:4});owner.destroy();assert.equal(owner.form.validateUsername('a'),false);assert.deepEqual(owner.form.getState(),{usernameError:false});
});
test('policy changes affect future validation without resetting authority, retrying writes or eager evaluation',async()=>{
 let validations=0,writes=0;const owner=createAdminSetupController({state:{status:'idle'},validateUsername:()=>{validations++;return '中文错误';},onSubmit:()=>{writes++;return 'unconfirmed';}});assert.equal(validations,0);
 owner.form.validateUsername('a');owner.update({validateUsername:()=>{validations++;return 'English error';}});assert.equal(validations,1);assert.equal(owner.form.getState().usernameIssue.message,'中文错误');owner.form.validateUsername('a');assert.equal(owner.form.getState().usernameIssue.message,'English error');
 owner.update({validateUsername:undefined});await owner.submit(credentials());assert.equal(validations,2);assert.equal(writes,1);owner.update({validateUsername:()=>null});await owner.submit(credentials());assert.equal(writes,1);assert.equal(owner.getState().status,'unconfirmed');owner.destroy();
 for(const validateUsername of [true,null,3,'invalid'])assert.throws(()=>createAdminSetupController({state:{status:'idle'},onSubmit:()=> 'complete',validateUsername}),TypeError);
 const another=createAdminSetupController({state:{status:'idle'},onSubmit:()=> 'complete'});assert.throws(()=>another.update({validateUsername:true}),TypeError);another.destroy();
});
test('invalid validators fail closed with safe feedback and no late asynchronous publication',async()=>{
 for(const callback of [()=>{throw new Error('private backend details');},()=>'',()=>undefined,()=>true,()=>({message:'private'}),()=>Promise.resolve(null),()=>Promise.reject(new Error('private'))]){
  let writes=0;const owner=createAdminSetupController({state:{status:'idle'},validateUsername:callback,onSubmit:()=>{writes++;return 'complete';}}),input=credentials();await owner.submit(input);assert.equal(writes,0);assert.equal(input.password,'');assert.deepEqual(owner.getState(),{status:'idle'});assert.deepEqual(owner.form.getState(),{usernameError:true,usernameIssue:'invalid'});const snapshot=owner.form.getState();await new Promise(resolve=>setImmediate(resolve));assert.equal(owner.form.getState(),snapshot);owner.destroy();
 }
});
test('validation cannot start a write after authority changes or controller destruction',async()=>{
 for(const action of ['authority','destroy']){let writes=0;const owner=createAdminSetupController({state:{status:'idle'},validateUsername:()=>{if(action==='authority')owner.setState({status:'unavailable'});else owner.destroy();return null;},onSubmit:()=>{writes++;return 'complete';}}),input=credentials();await owner.submit(input);assert.equal(writes,0);assert.equal(input.password,'');owner.destroy();}
 let calls=0;const wait=deferred(),owner=createAdminSetupController({state:{status:'idle'},validateUsername:()=>{calls++;return null;},onSubmit:()=>wait.promise}),input=credentials(),pending=owner.submit(input);await owner.submit(credentials());assert.equal(calls,1);wait.resolve('unconfirmed');await pending;await owner.submit(credentials());assert.equal(calls,1);owner.destroy();
});
test('Form and Page expose the same policy, never evaluate it during SSR, and reject duplicate owners',()=>{
 const validateUsername=()=>{throw new Error('SSR must not validate');},props={state:{status:'idle'},onSubmit:()=> 'complete',validateUsername};
 for(const component of [AdminSetupForm,AdminSetupPage])assert.match(renderToString(React.createElement(component,{...props,config:{title:'Setup',productName:'Example'}})),/name="username"/);
 const owner=createAdminSetupController(props);assert.throws(()=>renderToString(React.createElement(AdminSetupForm,{controller:owner,validateUsername})),/controller cannot/);
 owner.form.validateUsername('a');assert.match(renderToString(React.createElement(AdminSetupForm,{controller:owner,labels:{usernameInvalid:'Check username'}})),/Check username/);owner.destroy();
});
