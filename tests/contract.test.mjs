import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { checkContract, checkGraph, checkStyles, generate } from '../scripts/tokens.mjs';
const doc = await readFile('docs/DESIGN.md','utf8');
test('complete token graph, summary and generated CSS',async()=>{checkContract(doc);await generate(true);});
test('checker rejects cycles, missing vars, drifted front matter and system recipes',()=>{
  assert.throws(()=>checkGraph({'--a':'var(--b)','--b':'var(--a)'}),/cycle/);
  assert.throws(()=>checkGraph({'--a':'var(--absent)'}),/Undefined/);
  assert.throws(()=>checkContract(doc.replace('primary: "#326c62"','primary: "#123456"')),/Front matter/);
  const marker=':root:not([data-theme="light"]):not([data-theme="dark"])';
  const at=doc.indexOf(marker);assert.throws(()=>checkContract(doc.slice(0,at)+doc.slice(at).replace('--palette-primary: #88bab0','--palette-primary: #123456')),/recipes differ/);
});
test('migration is exactly the recorded clarification, with original SHA256 verifiable',async()=>{
  const metadata=JSON.parse(await readFile('docs/design-source.json','utf8'));
  const boundary=/<!-- external-protocol-boundary:start -->\n([^\n]+)\n<!-- external-protocol-boundary:end -->/.exec(doc);assert.ok(boundary);assert.equal(createHash('sha256').update(boundary[1]).digest('hex'),metadata.protocolBoundarySha256);assert.equal(metadata.contractVersion,'0.5.1');
  const reconstructed=doc.replace(/\n<!-- external-protocol-boundary:start -->[\s\S]*?<!-- external-protocol-boundary:end -->\n/,'').replace(/\n<!-- foundation-lifecycle:start -->[\s\S]*<!-- foundation-lifecycle:end -->\n$/,'').replace('规范版本：0.5.1。','规范版本：0.4.0。').replace('| action-primary / action-primary-foreground |','| action-primary / foreground |').replace('| action-danger / action-danger-foreground | 危险操作成对填充与文字；destructive 是控件变体名称，映射到这对变量，不存在同名 CSS 变量。轻量危险变体使用 status-error-soft / status-error-foreground，不机械混用填充与错误文字 |','| destructive / destructive-foreground | 危险操作成对填充与文字，不机械等同错误文字 |');
  assert.equal(createHash('sha256').update(reconstructed).digest('hex'),metadata.sourceSha256);
});
test('source guard rejects raw/named colors, palette backflow and missing refs, accepts semantic/layout CSS',()=>{
  const {light}=checkContract(doc);
  for(const sample of ['.a{color:#fff}', '.a{background:red}', '.a{color:var(--palette-primary)}', '.a{color:var(--absent)}', '.a{--action-primary:#fff}']) assert.throws(()=>checkStyles(sample,light));
  checkStyles('.a{color:var(--foreground);background:color-mix(in oklab,var(--action-primary) 9%,transparent);gap:var(--space-control-gap);width:50%}',light);
});
