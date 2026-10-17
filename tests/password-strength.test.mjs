import test from 'node:test';
import assert from 'node:assert/strict';
import {estimatePasswordStrength} from '../packages/runtime/dist/password-strength-engine.js';
import {createPasswordStrengthOwner,createPasswordStrengthController,createNewPasswordFieldsController} from '../packages/runtime/dist/password-strength.js';
import {validateNewPassword,validatePassword,getPasswordStrengthSummary} from '../packages/runtime/dist/password.js';
const wait=()=>new Promise(resolve=>setTimeout(resolve,180));
const ready=score=>({status:'ready',score,level:score<=1?'weak':score===2?'medium':'strong',hint:'none'});
test('trusted dictionaries identify common, sequential, repeated and keyboard passwords without a composition gate',()=>{
 for(const fixture of ['password','Password1!','12345678','abcabcabc','qwertyuiop']){const result=estimatePasswordStrength(fixture);assert.equal(result.level,'weak',fixture);assert.ok(result.score<=1);assert.deepEqual(Object.keys(result).sort(),['hint','level','score','status']);}
 assert.equal(estimatePasswordStrength('abcabcabc').hint,'repeat');
 assert.equal(estimatePasswordStrength('t7#Vz_9m+Lp2').level,'strong');
 assert.equal(validatePassword('password'),null);assert.equal(validateNewPassword('password','password'),null);
 assert.deepEqual(['idle','loading','unavailable'].map(status=>getPasswordStrengthSummary({status})),['等待输入','评估中','暂不可评估']);
 for(const [score,level,summary]of [[0,'weak','弱'],[1,'weak','弱'],[2,'medium','中'],[3,'strong','强'],[4,'strong','强']]){assert.equal(ready(score).level,level);assert.equal(getPasswordStrengthSummary(ready(score)),summary);}
});
test('deferred loading reads only the current input and stale results cannot replace a newer generation',async()=>{
 let value='old-fixture',release,loads=0;const evaluated=[],states=[],loading=new Promise(resolve=>release=resolve),owner=createPasswordStrengthOwner({readPassword:()=>value,onChange:s=>states.push(s)},()=>{loads++;return loading;});
 owner.refresh();await wait();assert.equal(loads,1);value='new-fixture';owner.refresh();release(input=>{evaluated.push(input);return ready(2);});await wait();assert.deepEqual(evaluated,['new-fixture']);assert.equal(owner.getState().level,'medium');assert.ok(!JSON.stringify(states).includes('fixture'));owner.clear();assert.equal(owner.getState().status,'idle');owner.destroy();
});
test('unmount, clear and offline failure never authorize writes or retain an input snapshot',async()=>{
 let release,reads=0;const owner=createPasswordStrengthOwner({readPassword:()=>{reads++;return 'fixture';},onChange:()=>{}},()=>new Promise(resolve=>release=resolve));owner.refresh();await wait();owner.destroy();const before=reads;release(()=>{assert.fail('destroyed owner must not estimate');});await Promise.resolve();assert.equal(reads,before);assert.equal(owner.getState().status,'idle');
 const failed=createPasswordStrengthOwner({readPassword:()=> 'fixture',onChange:()=>{}},async()=>{throw Error('offline');});failed.refresh();await wait();assert.equal(failed.getState().status,'unavailable');assert.equal(getPasswordStrengthSummary(failed.getState()),'暂不可评估');failed.destroy();
 let loads=0;const large=createPasswordStrengthOwner({readPassword:()=> 'a'.repeat(257),onChange:()=>{}},async()=>{loads++;return ()=>ready(4);});large.refresh();await wait();assert.equal(loads,0);assert.equal(large.getState().status,'unavailable');large.destroy();
});
test('reentrant clear or destroy during loading prevents even a late module load',async()=>{
 for(const action of ['clear','destroy']){let loads=0,owner;owner=createPasswordStrengthOwner({readPassword:()=> 'fixture',onChange:state=>{if(state.status==='loading')owner[action]();}},async()=>{loads++;return ()=>ready(4);});owner.refresh();await wait();assert.equal(loads,0);assert.equal(owner.getState().status,'idle');owner.destroy();}
});
test('the long-lived engine retains dictionaries, never a factory carrying the last password',async()=>{
 const {readFile}=await import('node:fs/promises');const source=await readFile(new URL('../packages/runtime/src/password-strength-engine.ts',import.meta.url),'utf8');assert.doesNotMatch(source.split('export function estimatePasswordStrength')[0],/new ZxcvbnFactory/);assert.match(source,/new ZxcvbnFactory\(\{dictionary,graphs:adjacencyGraphs\}\)\.check\(password\)/);
});
test('an asynchronous local result cannot outlive a newer input or a destroyed owner',async()=>{
 let value='synthetic-first',finish;const estimate=()=>new Promise(resolve=>finish=resolve);let destroyed=0;estimate.destroy=()=>destroyed++;const owner=createPasswordStrengthOwner({readPassword:()=>value,onChange:()=>{}},async()=>estimate);owner.refresh();await wait();owner.clear();finish(ready(4));await Promise.resolve();await Promise.resolve();assert.equal(owner.getState().status,'idle');owner.destroy();assert.equal(destroyed,1);
});

test('public password controllers notify with secret-free snapshots and replace the current reader',async()=>{
 let value='synthetic-secret-one',changes=0;const owner=createPasswordStrengthController({readPassword:()=>value,onChange:()=>changes++}),states=[];owner.subscribe(()=>states.push(owner.getState()));
 assert.equal(typeof Worker,'undefined','Node unit tests do not provide the browser worker runtime');owner.refresh(()=>value);assert.equal(owner.getState().status,'loading');await wait();assert.equal(owner.getState().status,'unavailable');
 value='password';owner.refresh(()=>value);owner.update({onChange:()=>changes++});assert.equal(owner.getState().status,'loading');await wait();assert.equal(owner.getState().status,'unavailable');
 assert.ok(states.length>0);assert.doesNotMatch(JSON.stringify(owner.getState()),/synthetic-secret-one|password/);assert.doesNotMatch(JSON.stringify(states),/synthetic-secret-one|password/);assert.ok(changes>0);
 owner.inputController.setVisible(true);assert.equal(owner.inputController.getState().visible,true);owner.clear();assert.equal(owner.getState().status,'idle');assert.equal(owner.inputController.getState().visible,false);owner.destroy();
});

test('PasswordStrengthInput reader bindings are leased and stale releases cannot detach the replacement',()=>{
 let originalReads=0,readerAReads=0,readerBReads=0;
 const controller=createPasswordStrengthController({readPassword:()=>{originalReads++;return '';}});
 const releaseA=controller.bindReader(()=>{readerAReads++;return 'a'.repeat(300);});
 controller.refresh();assert.equal(controller.getState().status,'unavailable');assert.equal(readerAReads,1);
 const releaseB=controller.bindReader(()=>{readerBReads++;return 'b'.repeat(300);});
 controller.refresh();assert.equal(controller.getState().status,'unavailable');assert.equal(readerBReads,1);
 releaseA();controller.refresh();
 assert.equal(controller.getState().status,'unavailable','releasing the old view lease must not clear the current reader');
 assert.equal(readerBReads,2);assert.equal(readerAReads,1);
 releaseB();controller.refresh();
 assert.equal(controller.getState().status,'idle','after the last view lease, refresh returns to the original empty reader');
 assert.equal(originalReads,1);assert.equal(readerBReads,2);
 controller.destroy();
});

test('new-password aggregate owns error, tip and both visibility states without storing secret values',()=>{
 const controller=createNewPasswordFieldsController(),states=[];controller.subscribe(()=>states.push(controller.getState()));controller.password.refresh(()=> 'synthetic-confirmation-secret');
 controller.setError('confirmation_mismatch');controller.setTipOpen(true);controller.password.inputController.setVisible(true);controller.confirmation.setVisible(true);
 const snapshot=controller.getState();assert.deepEqual(snapshot.error,'confirmation_mismatch');assert.equal(snapshot.tipOpen,true);assert.equal(controller.password.inputController.getState().visible,true);assert.equal(controller.confirmation.getState().visible,true);
 assert.doesNotMatch(JSON.stringify(snapshot)+JSON.stringify(states),/synthetic-confirmation-secret/);controller.clear();assert.deepEqual(controller.getState(),{error:null,tipOpen:false,strength:{status:'idle'}});assert.equal(controller.password.inputController.getState().visible,false);assert.equal(controller.confirmation.getState().visible,false);
 controller.destroy();controller.setTipOpen(true);assert.equal(controller.getState().tipOpen,false);
});


test('aggregate cleanup preserves error callback deduplication',()=>{
 const changes=[],controller=createNewPasswordFieldsController({onErrorChange:value=>changes.push(value)});controller.clear();controller.setError('confirmation_mismatch');controller.clear();controller.clear();assert.deepEqual(changes,['confirmation_mismatch',null]);controller.destroy();
});
