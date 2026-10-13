import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import {createAdminSetupController,adminSetupLabels,getAdminSetupMessage} from '../packages/runtime/dist/admin-setup.js';
import {AdminSetupPage} from '../packages/ui-react/dist/admin-setup.js';
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
 const policy={version:1,minimum_characters:6,maximum_characters:32,counting_unit:'unicode_code_points'};
 for(const status of ['idle','submitting','unconfirmed','complete','unavailable']){const markup=renderToString(React.createElement(AdminSetupPage,{config:{productName:'Example',title:'创建管理员'},state:{status},policy,onSubmit(){throw new Error('SSR submitted');}}));assert.equal((markup.match(/<form\b/g)||[]).length,1);assert.equal((markup.match(/type="password"/g)||[]).length,2);assert.equal((markup.match(/<button\b/g)||[]).length,1);assert.doesNotMatch(markup,/核对|readonly|journal|receipt|sample-password/);if(status!=='idle')assert.match(markup,/disabled=""/);}
 const unavailable=renderToString(React.createElement(AdminSetupPage,{config:{productName:'Example',title:'Setup'},state:{status:'idle'},policy:null,onSubmit(){}}));assert.equal((unavailable.match(/ disabled=""/g)||[]).length,4);
});

test('authority change during the submitting notification prevents the callback from starting',async()=>{
 let calls=0;const controller=createAdminSetupController({state:{status:'idle'},onSubmit:()=>{calls++;return 'complete';}});controller.subscribe(()=>{if(controller.getState().status==='submitting')controller.setState({status:'unavailable'});});const credentials={username:'fixture',password:'synthetic-only'};await controller.submit(credentials);assert.equal(calls,0);assert.equal(credentials.password,'');assert.equal(controller.getState().status,'unavailable');controller.destroy();
});
