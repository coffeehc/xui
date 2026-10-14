import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDateTimeModel,parseDateTimeValue} from '../packages/runtime/dist/date-time.js';
test('strict Gregorian minute wall time rejects lossy instant or date coercions',()=>{
 assert.deepEqual(parseDateTimeValue('2020-02-29T23:59'),{date:'2020-02-29',hour:23,minute:59});assert.equal(parseDateTimeValue(null),null);
 for(const value of ['2021-02-29T00:00','2020-02-29T24:00','2020-02-29T00:60','2020-02-29T09:30:00','2020-02-29T09:30Z','2020-02-29T09:30+08:00',' 2020-02-29T09:30','2020-02-29','0000-01-01T00:00',0,new Date()])assert.throws(()=>parseDateTimeValue(value));
 for(const value of ['0001-01-01T00:00','9999-12-31T23:59'])assert.ok(parseDateTimeValue(value));
});
test('controlled requests do not change confirmed values or loop on external confirmation',()=>{
 const changes=[],model=createDateTimeModel({value:'2020-02-29T23:59',onValueChange:value=>changes.push(value)});
 model.edit('2026-10-15T09:30');assert.equal(model.getState().value,'2020-02-29T23:59');assert.equal(model.getState().draft,'2020-02-29T23:59');assert.deepEqual(changes,['2026-10-15T09:30']);
 model.update({value:'2026-10-15T09:30'});model.commit();assert.equal(changes.length,1);model.update({value:null});assert.equal(changes.length,1);assert.equal(model.getState().draft,'');
});
test('default value is initial-only and complete edits notify exactly once',()=>{
 const changes=[],model=createDateTimeModel({defaultValue:'2020-02-29T23:59',onValueChange:v=>changes.push(v)});model.update({defaultValue:'2026-10-15T09:30'});assert.equal(model.getState().value,'2020-02-29T23:59');
 model.edit('2026-10-15T09:30');model.commit();assert.deepEqual(changes,['2026-10-15T09:30']);model.clear();model.clear();assert.deepEqual(changes,['2026-10-15T09:30',null]);
});
test('picker date and time are independent drafts and apply one atomic change',()=>{
 const changes=[],model=createDateTimeModel({value:'2020-02-29T23:59',today:'2026-10-15',onValueChange:value=>{changes.push(value);model.update({value});}});
 model.open();model.setMonth('2026-10');model.setDate('2026-10-15');model.setTime('hour',9);model.setTime('minute',30);assert.equal(model.getState().value,'2020-02-29T23:59');assert.deepEqual(changes,[]);
 model.apply();assert.deepEqual(changes,['2026-10-15T09:30']);assert.equal(model.getState().open,false);assert.equal(model.getState().value,'2026-10-15T09:30');model.open();model.setTime('hour',10);model.close();assert.equal(changes.length,1);model.open();assert.equal(model.getState().hour,9);
});
test('empty picker does not invent a value and required clear remains null',()=>{
 const changes=[],model=createDateTimeModel({today:'2026-10-15',required:true,onValueChange:v=>changes.push(v)});model.open();assert.equal(model.apply(),false);assert.equal(model.getState().month,'2026-10');assert.equal(model.getState().value,null);assert.equal(model.getState().error,null);model.commit();assert.equal(model.getState().error,'required');
 model.edit('2020-02-29T00:00');model.edit('');assert.equal(model.getState().value,null);assert.deepEqual(changes,['2020-02-29T00:00',null]);
});
test('invalid manual drafts are retained without callbacks, reset keeps confirmed value',()=>{
 const changes=[],model=createDateTimeModel({value:'2020-02-29T23:59',onValueChange:v=>changes.push(v)});model.edit('2020-02-29T09:30Z');assert.equal(model.getState().invalid,'format');assert.equal(model.getState().error,null);model.commit();assert.equal(model.getState().error,'format');model.open();model.close();assert.equal(model.getState().draft,'2020-02-29T09:30Z');model.resetDraft();assert.equal(model.getState().draft,'2020-02-29T23:59');assert.equal(model.getState().error,null);assert.deepEqual(changes,[]);
});
for(const state of ['disabled','readOnly'])test(state+' blocks input and picker requests while retaining confirmed value',()=>{
 const changes=[],model=createDateTimeModel({defaultValue:'2020-02-29T23:59',onValueChange:v=>changes.push(v)});model.open();model.setTime('hour',9);model.update({[state]:true});assert.equal(model.getState().open,false);model.edit('2026-10-15T09:30');model.clear();model.open();model.apply();assert.equal(model.getState().value,'2020-02-29T23:59');assert.deepEqual(changes,[]);model.update({[state]:false});model.open();assert.equal(model.getState().hour,23);
});
test('invalid updates are atomic; locale does not rewrite values; destroy suppresses callbacks',()=>{
 const changes=[],model=createDateTimeModel({defaultValue:'2020-02-29T23:59',onValueChange:v=>changes.push(v)});const previous=model.getState();for(const next of [{value:'2021-02-29T00:00'},{today:'2021-02-29'},{weekStartsOn:7}]){assert.throws(()=>model.update(next));assert.equal(model.getState(),previous);}model.update({locale:'en-US',weekStartsOn:0});assert.equal(model.getState().value,'2020-02-29T23:59');model.destroy();model.edit('2026-10-15T09:30');model.open();assert.deepEqual(changes,[]);
});
test('subscriber reentrancy suppresses stale requests and every wall time round-trips literally',()=>{
 const changes=[],model=createDateTimeModel({onValueChange:v=>changes.push(v)});model.subscribe(()=>{if(model.getState().value==='2020-02-29T23:59')model.update({value:'2026-10-15T09:30'});});model.edit('2020-02-29T23:59');assert.deepEqual(changes,[]);assert.equal(model.getState().value,'2026-10-15T09:30');
 const old=process.env.TZ;try{for(const tz of ['UTC','Asia/Shanghai','America/New_York']){process.env.TZ=tz;assert.deepEqual(parseDateTimeValue('2026-03-08T02:30'),{date:'2026-03-08',hour:2,minute:30});}}finally{if(old===undefined)delete process.env.TZ;else process.env.TZ=old;}
});
