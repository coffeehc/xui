import test from 'node:test';
import assert from 'node:assert/strict';
import {estimatePasswordStrength} from '../packages/runtime/dist/password-strength-engine.js';
import {createPasswordStrengthController,createNewPasswordFieldsController} from '../packages/runtime/dist/password.js';
import {validateNewPassword,validatePassword,getPasswordStrengthSummary} from '../packages/runtime/dist/password.js';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function settled(controller){for(let i=0;i<100&&controller.getState().status==='loading';i++)await wait(10);assert.notEqual(controller.getState().status,'loading');return controller.getState();}
async function started(read){for(let i=0;i<100&&!read();i++)await wait(10);assert.ok(read());}

test('the default is bounded regex/length advice, not a dictionary or submission policy',()=>{
 for(const fixture of ['short','aaaaaaaaaaaa','abcabcabcabc','😀😀😀😀😀😀😀😀'])assert.equal(estimatePasswordStrength(fixture).score,0);
 for(const [value,score]of [['abcdefgh',1],['Password1!',2],['t7#Vz_9m+Lp2',3],['t7#Vz_9m+Lp2&Q8!x',4],['中文内容用于长密码建议检查',2]])assert.equal(estimatePasswordStrength(value).score,score);
 assert.equal(estimatePasswordStrength('').status,'idle');
 assert.equal(validatePassword('password'),null);assert.equal(validateNewPassword('password','password'),null);
 assert.deepEqual(['idle','loading','unavailable'].map(status=>getPasswordStrengthSummary({status})),['等待输入','评估中','暂不可评估']);
});

test('public default controller works without Worker/fetch and reads the latest input after debounce',async()=>{
 let value='first-secret',changes=0;const owner=createPasswordStrengthController({readPassword:()=>value,onChange:()=>changes++}),states=[];
 owner.subscribe(()=>states.push(owner.getState()));owner.refresh();value='t7#Vz_9m+Lp2&Q8!x';assert.equal((await settled(owner)).score,4);
 assert.ok(changes>0);assert.doesNotMatch(JSON.stringify(states),/first-secret|t7#Vz/);
 owner.inputController.setVisible(true);owner.clear();assert.equal(owner.getState().status,'idle');assert.equal(owner.inputController.getState().visible,false);owner.destroy();
});

test('empty, invalid reader and excessive input never invoke the optional API',async()=>{
 let calls=0,value='';const owner=createPasswordStrengthController({readPassword:()=>value,evaluateStrength:()=>{calls++;return {score:4};}});
 for(const next of ['',null,'a'.repeat(257)]){value=next;owner.refresh();await wait(160);assert.equal(calls,0);assert.equal(owner.getState().status,next===''?'idle':'unavailable');}owner.destroy();
});

test('reentrant clear or destroy during loading prevents the host callback',async()=>{
 for(const action of ['clear','destroy']){let calls=0,owner;owner=createPasswordStrengthController({readPassword:()=> 'fixture',onChange:state=>{if(state.status==='loading')owner[action]();},evaluateStrength:()=>{calls++;return {score:4};}});owner.refresh();await wait(170);assert.equal(calls,0);assert.equal(owner.getState().status,'idle');owner.destroy();}
});

test('a new input aborts the old host API, and a late result cannot replace the current generation',async()=>{
 let value='synthetic-old',calls=[];const owner=createPasswordStrengthController({readPassword:()=>value,evaluateStrength:(password,{signal})=>new Promise(resolve=>calls.push({password,signal,resolve}))});
 owner.refresh();await started(()=>calls[0]);value='synthetic-new';owner.refresh();assert.equal(calls[0].signal.aborted,true);await started(()=>calls[1]);
 calls[1].resolve({score:2,hint:'common'});assert.equal((await settled(owner)).score,2);calls[0].resolve({score:4});await wait(0);assert.equal(owner.getState().score,2);assert.equal(calls[1].signal.aborted,true);assert.doesNotMatch(JSON.stringify(owner.getState()),/synthetic/);owner.destroy();
});

test('clear, reader release and destroy cancel host IO and discard late results',async()=>{
 for(const action of ['clear','release','destroy']){
  let signal,finish;const owner=createPasswordStrengthController({readPassword:()=>'',evaluateStrength:(_password,context)=>{signal=context.signal;return new Promise(resolve=>finish=resolve);}});
  const release=owner.bindReader(()=> 'synthetic-secret');owner.refresh();await started(()=>signal);if(action==='release')release();else owner[action]();assert.equal(signal.aborted,true);finish({score:4});await wait(0);assert.equal(owner.getState().status,'idle');owner.destroy();
 }
});

test('timeout aborts a blocked evaluator and never falls back to a misleading successful score',async()=>{
 let signal;const owner=createPasswordStrengthController({readPassword:()=> 'synthetic-secret',evaluationTimeoutMs:20,evaluateStrength:(_password,context)=>{signal=context.signal;return new Promise(()=>{});}});
 owner.refresh();assert.equal((await settled(owner)).status,'unavailable');assert.equal(signal.aborted,true);owner.update({evaluateStrength:undefined});owner.refresh();assert.equal((await settled(owner)).status,'ready');owner.destroy();
});

test('invalid API data, getters and exceptions leave only a safe unavailable state',async()=>{
 let getterCalls=0;
 for(const result of [null,{score:9},{score:1.5},{score:0,hint:'unknown'},{score:4,password:'synthetic-secret'},{get score(){getterCalls++;return 4;}}]){
  const owner=createPasswordStrengthController({readPassword:()=> 'synthetic-secret',evaluateStrength:()=>result});owner.refresh();assert.deepEqual(await settled(owner),{status:'unavailable'});owner.destroy();
 }
 const owner=createPasswordStrengthController({readPassword:()=> 'synthetic-secret',evaluateStrength:()=>{throw Error('synthetic-secret');}});owner.refresh();assert.deepEqual(await settled(owner),{status:'unavailable'});assert.equal(getterCalls,0);owner.destroy();
});

test('changing the evaluator aborts old IO without automatically replaying the password',async()=>{
 let signal,calls=0;const owner=createPasswordStrengthController({readPassword:()=> 'synthetic-secret',evaluateStrength:(_password,context)=>{signal=context.signal;return new Promise(()=>{});}});
 owner.refresh();await started(()=>signal);owner.update({evaluateStrength:()=>{calls++;return {score:1};}});assert.equal(signal.aborted,true);await wait(170);assert.equal(calls,0);assert.equal(owner.getState().status,'idle');owner.refresh();assert.equal((await settled(owner)).score,1);owner.destroy();
});

test('reader bindings are leased and an old release cannot detach the replacement',()=>{
 let original=0,readsA=0,readsB=0;const owner=createPasswordStrengthController({readPassword:()=>{original++;return '';}});
 const releaseA=owner.bindReader(()=>{readsA++;return 'a'.repeat(300);});owner.refresh();
 const releaseB=owner.bindReader(()=>{readsB++;return 'b'.repeat(300);});owner.refresh();releaseA();owner.refresh();
 assert.equal(readsA,1);assert.equal(readsB,2);releaseB();owner.refresh();assert.equal(original,1);assert.equal(owner.getState().status,'idle');owner.destroy();
});

test('aggregate controllers share optional evaluation, preserve callbacks and clear secret-free state',async()=>{
 const changes=[],states=[],controller=createNewPasswordFieldsController({evaluateStrength:()=>({score:2}),onErrorChange:value=>changes.push(value)});
 controller.subscribe(()=>states.push(controller.getState()));controller.password.refresh(()=> 'synthetic-secret');await settled(controller.password);assert.equal(controller.getState().strength.score,2);
 controller.setError('confirmation_mismatch');controller.setTipOpen(true);controller.password.inputController.setVisible(true);controller.confirmation.setVisible(true);controller.clear();controller.clear();
 assert.deepEqual(changes,['confirmation_mismatch',null]);assert.deepEqual(controller.getState(),{error:null,tipOpen:false,strength:{status:'idle'}});assert.doesNotMatch(JSON.stringify(states),/synthetic-secret/);controller.destroy();
});

test('invalid evaluator configuration is rejected before any evaluation',()=>{
 for(const options of [{evaluateStrength:'bad'},{evaluationTimeoutMs:0},{evaluationTimeoutMs:NaN},{evaluationTimeoutMs:60001}])assert.throws(()=>createPasswordStrengthController({readPassword:()=>'',...options}),TypeError);
});
