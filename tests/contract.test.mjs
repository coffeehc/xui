import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import postcss from 'postcss';
import { checkContract, checkTokenLayers, checkGraph, checkStyles, generate, styleParts } from '../scripts/tokens.mjs';
const doc = await readFile('docs/DESIGN.md','utf8');
test('complete token graph, summary and generated CSS',async()=>{checkContract(doc);await generate(true);});
test('aggregate styles preserve the complete ordered cascade of independently exported parts',async()=>{
 const shape=node=>node.type==='decl'?[node.prop,node.value,node.important??false]:node.type==='rule'?[node.selector,node.nodes.filter(n=>n.type!=='comment').map(shape)]:[node.name,node.params,node.nodes?.filter(n=>n.type!=='comment').map(shape)];
 for(const [file,names] of [['components',styleParts],['critical',styleParts.filter(name=>!['floating','table-resize','chart'].includes(name))]]){
  const expected=[];
  for(const name of names){const source=postcss.parse(await readFile(`packages/theme/src/${name}.css`,'utf8'));for(const layer of source.nodes)expected.push(...layer.nodes.filter(n=>n.type!=='comment').map(shape));}
  const aggregate=postcss.parse(await readFile(`packages/theme/dist/${file}.css`,'utf8')),layers=aggregate.nodes.filter(n=>n.type==='atrule'&&n.name==='layer'&&n.params==='xui-components');
  assert.equal(layers.length,1,'Only aggregate layer envelopes are deduplicated');
  assert.deepEqual(layers[0].nodes.filter(n=>n.type!=='comment').map(shape),expected,'Selector/declaration/media/scope order must remain unchanged');
 }
});
test('checker rejects cycles, missing vars, drifted front matter and system recipes',()=>{
  assert.throws(()=>checkGraph({'--a':'var(--b)','--b':'var(--a)'}),/cycle/);
  assert.throws(()=>checkGraph({'--a':'var(--absent)'}),/Undefined/);
  assert.throws(()=>checkContract(doc.replace('primary: "#6d28d9"','primary: "#123456"')),/Front matter/);
  const marker=':root[data-theme="system"]';
  const at=doc.indexOf(marker);assert.throws(()=>checkContract(doc.slice(0,at)+doc.slice(at).replace('--palette-primary: #6d28d9','--palette-primary: #123456')),/recipes differ/);
});
test('historical contract still reconstructs the original source SHA256',async()=>{
  const current=JSON.parse(await readFile('docs/design-source.json','utf8'));
  const metadata=current.previousContract;
  const doc=await readFile(metadata.snapshotPath,'utf8');
  assert.equal(createHash('sha256').update(doc).digest('hex'),metadata.snapshotSha256);
  const boundary=/<!-- external-protocol-boundary:start -->\n([^\n]+)\n<!-- external-protocol-boundary:end -->/.exec(doc);assert.ok(boundary);assert.equal(createHash('sha256').update(boundary[1]).digest('hex'),metadata.protocolBoundarySha256);assert.equal(metadata.contractVersion,'0.7.0');
  const reconstructed=[...metadata.responsiveWidthChanges,...metadata.responsiveContractClarifications].reduce((text,change)=>text.replace(change.after,change.before),doc).replace(/\/\* typography-registration:start \*\/\n[\s\S]*?\/\* typography-registration:end \*\/\n/,'').replace(/    \/\* typography-scale:start \*\/\n[\s\S]*?    \/\* typography-scale:end \*\/\n/,metadata.typographyOriginalCss).replace(/    \/\* centralized-component-tokens:start \*\/\n[\s\S]*?    \/\* centralized-component-tokens:end \*\/\n/,'').replace(/  \/\* progress-forced-colors:start \*\/\n[\s\S]*?  \/\* progress-forced-colors:end \*\/\n/,'').replace(metadata.componentScaleClarification.after,metadata.componentScaleClarification.before).replace(/    \/\* shell-role-tokens:start \*\/\n[\s\S]*?    \/\* shell-role-tokens:end \*\/\n/,'').replace(/\n<!-- external-protocol-boundary:start -->[\s\S]*?<!-- external-protocol-boundary:end -->\n/,'').replace(/\n<!-- foundation-lifecycle:start -->[\s\S]*<!-- foundation-lifecycle:end -->\n$/,'').replace('规范版本：0.7.0。','规范版本：0.4.0。').replace('| action-primary / action-primary-foreground |','| action-primary / foreground |').replace('| action-danger / action-danger-foreground | 危险操作成对填充与文字；destructive 是控件变体名称，映射到这对变量，不存在同名 CSS 变量。轻量危险变体使用 status-error-soft / status-error-foreground，不机械混用填充与错误文字 |','| destructive / destructive-foreground | 危险操作成对填充与文字，不机械等同错误文字 |');
  assert.equal(createHash('sha256').update(reconstructed).digest('hex'),metadata.sourceSha256);
});
test('source guard rejects raw/named colors, palette backflow and missing refs, accepts semantic/layout CSS',()=>{
  const {light}=checkContract(doc);
  for(const sample of ['.a{color:#fff}', '.a{background:red}', '.a{color:var(--palette-primary)}', '.a{color:var(--absent)}', '.a{--action-primary:#fff}']) assert.throws(()=>checkStyles(sample,light));
  checkStyles('.a{color:var(--foreground);background:var(--interaction-selected);gap:var(--space-control-gap);width:100%;outline-offset:calc(-1 * var(--focus-width))}',light);
  checkStyles('.a{border-end-start-radius:calc(var(--card-radius) - var(--line-width-surface));border-end-end-radius:calc(var(--card-radius) - var(--line-width-surface))}',light);
  assert.throws(()=>checkStyles('.a{border-inline-end-color:red}',light));
});

test('Violet default, uploaded source and semantic CSS fingerprint are versioned',async()=>{
  const metadata=JSON.parse(await readFile('docs/design-source.json','utf8'));
  const {css,light,dark}=checkContract(doc);
  const source=await readFile(metadata.source.path,'utf8');
  assert.equal(createHash('sha256').update(source).digest('hex'),metadata.source.sha256);
  assert.equal(createHash('sha256').update(css).digest('hex'),metadata.defaultCssSha256);
  assert.equal(metadata.contractVersion,'4.2.23');
  assert.match(doc,/规范版本：4\.2\.23。/);
  assert.equal(metadata.defaultMode,'dark');
  assert.equal(Object.keys(dark).length,metadata.defaultTokenCount);
  assert.equal(dark['--palette-canvas'],'#09070f');
  assert.equal(dark['--palette-raised'],'#1a152e');
  assert.equal(dark['--palette-overlay'],'#211b3b');
  assert.equal(dark['--palette-primary'],'#a78bfa');
  assert.equal(dark['--button-hover-background'],'color-mix(in oklab, var(--action-primary) 94%, var(--foreground))');
  assert.equal(dark['--button-pressed-background'],'color-mix(in oklab, var(--action-primary) 88%, var(--foreground))');
  assert.equal('--palette-primary-hover' in dark,false);
  assert.equal('--palette-primary-pressed' in dark,false);
  assert.equal(light['--palette-canvas'],'#f8f7fc');
  assert.equal(light['--palette-primary'],'#6d28d9');
  const boundary=/<!-- external-protocol-boundary:start -->\n([^\n]+)\n<!-- external-protocol-boundary:end -->/.exec(doc);
  assert.equal(createHash('sha256').update(boundary[1]).digest('hex'),metadata.protocolBoundarySha256);
});

test('token tiers reject reverse dependencies and direct component palette reads',()=>{
  checkTokenLayers({'--palette-primary':'red','--action-primary':'var(--palette-primary)','--button-background':'var(--action-primary)'});
  for (const values of [
    {'--action-primary':'var(--button-background)'},
    {'--palette-primary':'var(--action-primary)'},
    {'--card-background':'var(--palette-primary)'},
    {'--space-control-gap':'var(--card-padding)'},
  ]) assert.throws(()=>checkTokenLayers(values),/Token layer violation/);
});


test('runtime 1.0 contains shared TypeScript models but no native UI entry points or React peer',async()=>{
  const manifest=JSON.parse(await readFile('packages/runtime/package.json','utf8'));
  const forbidden=/(?:^|\/)(?:dom|[^/]*-dom|menu-layout|navigation-presentation|overflow-text|select-control|textarea|widgets-dom|internal)(?:\.js)?$/;
  assert.deepEqual(Object.keys(manifest.exports).filter(entry=>forbidden.test(entry)),[]);
  assert.deepEqual(Object.keys(manifest.peerDependencies??{}).filter(name=>/^(?:react|react-dom)(?:$|\/)/.test(name)),[]);
  assert.deepEqual(Object.keys(manifest.dependencies??{}).filter(name=>/^(?:react|react-dom)(?:$|\/)/.test(name)),[]);
  const artifacts=await readdir('packages/runtime/dist');
  assert.deepEqual(artifacts.filter(file=>/^(?:dom|[^/]*-dom|dialog-layout|menu-layout|navigation-presentation|overflow-text|select-control|textarea|widgets|dom-id)\.(?:js|d\.ts)$/.test(file)),[]);
  const runtime=await import('../packages/runtime/dist/index.js');
  for(const name of ['createCalendarModel','createDateTimeModel','getNavigationActiveId'])assert.equal(typeof runtime[name],'function',`${name} remains a pure runtime model/helper`);
  assert.equal('isDataTableRowEvent' in runtime,false,'DOM-backed row event filtering belongs to the React package');
  for(const name of ['Button','Card','Dialog','Field','Input','Textarea','SimpleSelect','Calendar','DateTimePicker','NavigationMenu','MenuLayout','OverflowText'])assert.equal(name in runtime,false,`${name} belongs to the React package`);
});

test('every official palette rejects a missing recipe, a broken dependency and mismatched system colors',()=>{
 for(const preset of ['violet','ember','forest','crimson','cobalt','precision']){
  const selector=`:root[data-theme-preset="${preset}"]`;
  assert.throws(()=>checkContract(doc.replace(selector+'[data-theme="light"]',selector+'[data-theme="absent"]')),/Missing .* theme recipes/);
  const start=doc.indexOf(selector+'[data-theme="system"]');
  assert.throws(()=>checkContract(doc.slice(0,start)+doc.slice(start).replace('--palette-primary:', '--absent:')),/recipes differ/);
 }
 const start=doc.indexOf(':root[data-theme-preset="forest"]');
 assert.throws(()=>checkContract(doc.slice(0,start)+doc.slice(start).replace('--palette-primary: #34d399','--palette-primary: var(--missing)')),/Undefined/);
});
