import test from 'node:test';
import assert from 'node:assert/strict';
import {createPasswordChangeController,getPasswordChangeMessage} from '../packages/runtime/dist/password.js';
import {HttpError} from '../packages/runtime/dist/http.js';
const credentials=()=>({current_password:'FAKE_CURRENT',new_password:'FAKE_NEXT'});
const deferred=()=>{let resolve,reject;return {promise:new Promise((a,b)=>{resolve=a;reject=b;}),resolve:value=>resolve(value),reject:error=>reject(error)};};
function fixture(change){let status='authenticated',calls=0,observed,signal;const auth={getState:()=>({status,user:status==='authenticated'?{id:'42'}:null,busy:null}),changePassword:(input,options)=>{calls++;observed={...input};signal=options.signal;return change(input,options);}};const controller=createPasswordChangeController({auth});return {controller,get calls(){return calls;},get observed(){return observed;},get signal(){return signal;},expire:()=>{status='anonymous';}};}
test('password presentation hands off once, erases caller input immediately, and only publishes safe snapshots',async()=>{
 const held=deferred(),f=fixture(()=>held.promise),input=credentials(),pending=f.controller.submit(input);assert.deepEqual(input,{current_password:'',new_password:''});assert.equal(f.calls,1);assert.equal(f.controller.getState().status,'submitting');assert(!JSON.stringify(f.controller.getState()).includes('FAKE_'));assert.deepEqual(f.observed,credentials());await f.controller.submit(credentials());assert.equal(f.calls,1);held.resolve();await pending;assert.equal(f.controller.getState().status,'changed');assert.match(getPasswordChangeMessage(f.controller.getState()),/重新登录/);f.controller.destroy();
});
test('required input and absent authentication send no mutation and do not retain rejected credentials',async()=>{
 const f=fixture(async()=>{}),input={current_password:'',new_password:'FAKE_NEXT'};await f.controller.submit(input);assert.equal(f.calls,0);assert(f.controller.getState().currentPasswordRequired);assert.equal(input.new_password,'');f.controller.clearCurrentPasswordError();f.expire();await f.controller.submit(credentials());assert.equal(f.calls,0);assert.equal(f.controller.getState().status,'reauthenticate');f.controller.destroy();
});
test('definitive rejection is editable; unknown, conflict and committed follow-up are distinct and cannot replay',async()=>{
 for(const [error,status]of [[new HttpError('http',{status:400,code:40001,attempts:1}),'idle'],[new HttpError('parse',{attempts:0}),'idle'],[new HttpError('http',{status:503,code:50302,attempts:1}),'changed'],[new HttpError('timeout'),'unknown'],[new HttpError('parse',{attempts:1}),'unknown']]){
  const f=fixture(async()=>{throw error;});await f.controller.submit(credentials());assert.equal(f.controller.getState().status,status);assert.equal(f.controller.getState().error.kind,error.kind);if(status!=='idle'){await f.controller.submit(credentials());assert.equal(f.calls,1);}f.controller.destroy();
 }
 const f=fixture(async()=>{f.expire();throw new HttpError('http',{status:409,attempts:1});});await f.controller.submit(credentials());assert.equal(f.controller.getState().status,'reauthenticate');f.controller.destroy();
});
test('suspend/destroy abort the owned wait, clear visibility, ignore late outcomes and never destroy shared auth',async()=>{
 const held=deferred(),f=fixture(()=>held.promise),pending=f.controller.submit(credentials());f.controller.currentPassword.setVisible(true);f.controller.suspend();assert(f.signal.aborted);assert.equal(f.controller.getState().status,'unknown');assert(!f.controller.currentPassword.getState().visible);held.resolve();await pending;assert.equal(f.controller.getState().status,'unknown');await f.controller.submit(credentials());assert.equal(f.calls,1);f.controller.destroy();
});
test('a reentrant destroy during publication stops the write and clears the submission object',async()=>{
 const f=fixture(async()=>{}),input=credentials();f.controller.subscribe(()=>{if(f.controller.getState().status==='submitting')f.controller.destroy();});await f.controller.submit(input);assert.equal(f.calls,0);assert.deepEqual(input,{current_password:'',new_password:''});
});

test('throwing observers cannot strand a form or retain credentials',async()=>{
 const f=fixture(async()=>{throw new HttpError('http',{status:400,code:40001,attempts:1});});f.controller.subscribe(()=>{throw new Error('observer failure');});const input=credentials();await f.controller.submit(input);assert.equal(f.calls,1);assert.equal(f.controller.getState().status,'idle');assert.deepEqual(input,{current_password:'',new_password:''});await f.controller.submit(credentials());assert.equal(f.calls,2);f.controller.destroy();
});

test('throwing aggregate and child observers cannot leave any password visibility enabled',async()=>{
 const held=deferred(),f=fixture(()=>held.promise),model=f.controller.newPassword;
 model.subscribe(()=>{throw new Error('aggregate observer');});model.password.subscribe(()=>{throw new Error('strength observer');});model.confirmation.subscribe(()=>{throw new Error('confirmation observer');});
 f.controller.currentPassword.setVisible(true);model.password.inputController.setVisible(true);assert.throws(()=>model.confirmation.setVisible(true));model.setError('fixture error');model.setTipOpen(true);
 const input=credentials(),pending=f.controller.submit(input);f.controller.suspend();
 assert.equal(f.controller.currentPassword.getState().visible,false);assert.equal(model.password.inputController.getState().visible,false);assert.equal(model.confirmation.getState().visible,false);assert.equal(model.getState().tipOpen,false);assert.equal(model.getState().error,null);assert.deepEqual(input,{current_password:'',new_password:''});held.resolve();await pending;assert.equal(f.controller.getState().status,'unknown');f.controller.destroy();
});
