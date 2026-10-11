import test from 'node:test';
import assert from 'node:assert/strict';
import { checkDocs } from '../scripts/check-docs.mjs';

test('adoption and implementation references resolve to real repository files', async () => {
  const result = await checkDocs();
  assert.ok(result.files > 5);
  assert.ok(result.links > 30);
});
