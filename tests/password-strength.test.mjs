import test from 'node:test';
import assert from 'node:assert/strict';
import {estimatePasswordStrength} from '../packages/runtime/dist/password-strength-engine.js';
import {createPasswordStrengthOwner} from '../packages/runtime/dist/password-strength.js';
import {validateNewPassword,parsePasswordPolicy,getPasswordStrengthMessage} from '../packages/runtime/dist/password.js';
const wait=()=>new Promise(resolve=>setTimeout(resolve,180));
const ready=score=>({status:'ready',score,level:score<=1?'weak':score===2?'medium':'strong',hint:'none'});
test('trusted dictionaries identify common, sequential, repeated and keyboard passwords without a composition gate',()=>{
 for(const fixture of ['password','Password1!','12345678','abcabcabc','qwertyuiop']){const result=estimatePasswordStrength(fixture);assert.equal(result.level,'weak',fixture);assert.ok(result.score<=1);assert.deepEqual(Object.keys(result).sort(),['hint','level','score','status']);}
 assert.equal(estimatePasswordStrength('abcabcabc').hint,'repeat');
 assert.equal(estimatePasswordStrength('t7#Vz_9m+Lp2').level,'strong');
 const policy=parsePasswordPolicy({version:1,minimum_characters:6,maximum_characters:32,counting_unit:'unicode_code_points'});assert.equal(validateNewPassword(policy,'password','password'),null);
 assert.match(getPasswordStrengthMessage(ready(2)),/中/);assert.match(getPasswordStrengthMessage(ready(4)),/强.*仅供参考/);
});
test('deferred loading reads only the current input and stale results cannot replace a newer generation',async()=>{
 let value='old-fixture',release,loads=0;const evaluated=[],states=[],loading=new Promise(resolve=>release=resolve),owner=createPasswordStrengthOwner({readPassword:()=>value,onChange:s=>states.push(s)},()=>{loads++;return loading;});
 owner.refresh();await wait();assert.equal(loads,1);value='new-fixture';owner.refresh();release(input=>{evaluated.push(input);return ready(2);});await wait();assert.deepEqual(evaluated,['new-fixture']);assert.equal(owner.getState().level,'medium');assert.ok(!JSON.stringify(states).includes('fixture'));owner.clear();assert.equal(owner.getState().status,'idle');owner.destroy();
});
test('unmount, clear and offline failure never authorize writes or retain an input snapshot',async()=>{
 let release,reads=0;const owner=createPasswordStrengthOwner({readPassword:()=>{reads++;return 'fixture';},onChange:()=>{}},()=>new Promise(resolve=>release=resolve));owner.refresh();await wait();owner.destroy();const before=reads;release(()=>{assert.fail('destroyed owner must not estimate');});await Promise.resolve();assert.equal(reads,before);assert.equal(owner.getState().status,'idle');
 const failed=createPasswordStrengthOwner({readPassword:()=> 'fixture',onChange:()=>{}},async()=>{throw Error('offline');});failed.refresh();await wait();assert.equal(failed.getState().status,'unavailable');assert.match(getPasswordStrengthMessage(failed.getState()),/不影响提交/);failed.destroy();
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
