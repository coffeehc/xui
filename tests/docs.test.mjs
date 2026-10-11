import test from 'node:test';
import assert from 'node:assert/strict';
import { checkDocs } from '../scripts/check-docs.mjs';
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
