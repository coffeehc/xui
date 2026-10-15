import test from 'node:test';
import assert from 'node:assert/strict';
import { checkDocs,checkAdoptionChecklist } from '../scripts/check-docs.mjs';
import {readFile} from 'node:fs/promises';
import {checkPublicEntryIndex} from '../scripts/public-api.mjs';

test('adoption and implementation references resolve to real repository files', async () => {
  const result = await checkDocs();
  assert.ok(result.files > 5);
  assert.ok(result.links > 30);
  assert.equal(result.skills,1);
  const index=await readFile('docs/PUBLIC_API.md','utf8');
  assert.equal(await checkPublicEntryIndex(index),result.publicEntries);
  await assert.rejects(checkPublicEntryIndex(index.replace('<!-- public-entry: @coffeehc/xui-runtime -->','')));
  await assert.rejects(checkPublicEntryIndex(index+'\n<!-- public-entry: @coffeehc/xui-react/planned-control -->'));
});

test('adoption checklist rejects duplicate rows and missing public operation outcomes',async()=>{
 const source=await readFile('docs/ADOPTION_CHECKLIST.md','utf8');
 assert.ok(checkAdoptionChecklist(source)>=180);
 const row=source.split('\n').find(line=>line.startsWith('| AUTH-LOGIN-REQ |'));
 assert.throws(()=>checkAdoptionChecklist(source+'\n'+row),/Duplicate/);
 assert.throws(()=>checkAdoptionChecklist(source.replace(row,'')),/Missing.*AUTH-LOGIN-REQ/);
 const withoutSource=row.split('|');withoutSource[5]=' 未关联合同 ';
 assert.throws(()=>checkAdoptionChecklist(source.replace(row,withoutSource.join('|'))),/Incomplete/);
});
