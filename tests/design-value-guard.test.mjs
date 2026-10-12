import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkDesignDeclaration, auditDesignSources } from '../scripts/design-value-guard.mjs';

test('design declarations reject literals, recipes and token fallbacks', () => {
  for (const [prop, value] of [
    ['padding', '13px'], ['gap', '.25rem'], ['width', '20dvh'], ['fontSize', '13'], ['font-size', '1rem'], ['font-family', 'Arial'], ['font-weight', 'bold'], ['line-height', '1.5'], ['border', '1px solid var(--surface-line)'], ['border-radius', '50%'], ['opacity', '.5'], ['z-index', '2'], ['transition', 'opacity 150ms'], ['transform', 'rotate(180deg)'], ['padding', 'calc(var(--spacing) * 2)'], ['padding', 'calc(var(--spacing) * 1)'], ['width', 'calc(var(--control-height) * 12)'], ['background', 'color-mix(in oklab, var(--foreground) 50%, transparent)'], ['color', '#fff'], ['color', 'red'], ['font-size', 'var(--font-size-body-sm, 13px)'], ['width', 'var(--width, var(--other))'], ['--new-value', 'var(--spacing)'], ['margin', '-1px'], ['height', 'calc(100dvh - var(--spacing) * 3)'], ['strokeWidth', '1.5'], ['grid-template-columns', 'repeat(2, 12px)'],
  ]) assert.throws(() => checkDesignDeclaration(prop, value, 'negative fixture'), undefined, `${prop}: ${value}`);
  for (const prop of ['font', 'font-weight', 'line-height', 'font-size']) assert.throws(() => checkDesignDeclaration(prop, 'normal'));
  assert.throws(() => checkDesignDeclaration('border-width', 'thin'));
  assert.throws(() => checkDesignDeclaration('font-size', 'var(--base-font-size)'));
});

test('only explicit structural geometry and semantic references pass', () => {
  for (const [prop, value] of [
    ['padding', '0 var(--space-control-gap)'], ['font', 'var(--font-weight-body) var(--font-size-body-sm) / var(--line-height-body-sm) var(--font-sans)'], ['font', 'inherit'], ['border', 'var(--line-width-surface) solid var(--surface-line)'], ['opacity', '0'], ['opacity', '1'], ['transform', 'scale(1)'], ['width', 'min(100%, var(--layout-field-min))'], ['height', '100dvh'], ['width', '100vw'], ['max-height', 'calc(100dvh - var(--layout-viewport-inset) * 2)'], ['outline-offset', 'calc(-1 * var(--focus-width))'], ['transform', 'translateX(calc(var(--switch-travel) * -1))'], ['top', '50%'], ['transform', 'translate(-50%, -50%)'], ['clip-path', 'inset(50%)'], ['flex', '1 1 0'], ['grid-template-columns', 'repeat(7,minmax(0,1fr))'], ['grid-template-columns', 'minmax(0,1fr) minmax(0,2fr)'], ['grid-column', '3'], ['fill', 'none'], ['stroke', 'currentColor'], ['background', 'linear-gradient(var(--interaction-hover),var(--interaction-hover))'],
  ]) assert.doesNotThrow(() => checkDesignDeclaration(prop, value), `${prop}: ${value}`);
});

async function fixture(files, run) {
  const root = await mkdtemp(join(tmpdir(), 'xui-design-values-'));
  try {
    for (const [name, content] of Object.entries(files)) { await mkdir(join(root, name, '..'), { recursive: true }); await writeFile(join(root, name), content); }
    await run(root);
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('source audit checks CSS, JSX object aliases, inline HTML, DOM writes and docs', async () => {
  const bad = {
    'packages/theme/src/sample.css': '.x{margin:7px}',
    'packages/ui-react/src/sample.tsx': 'const style={padding:12}; export const A=()=> <div style={style}/>;',
    'packages/runtime/src/sample.ts': "el.style.borderRadius='8px';",
    'examples/sample/app.js': 'root.innerHTML=`<div style="font-size:13px"></div>`;',
    'examples/sample/index.html': '<svg width="24" stroke-width="2"></svg>',
    'docs/GUIDE.md': '```tsx\nconst A=()=> <div style={{lineHeight:1.5}}/>;\n```',
  };
  for (const [name, text] of Object.entries(bad)) await fixture({ [name]: text }, async root => assert.rejects(auditDesignSources({ root }), /Design value audit failed/));
});

test('source audit follows conditional style values and useState setters', async () => {
  await fixture({ 'examples/app.tsx': 'const [height,setHeight]=React.useState(); const A=()=> <div style={{blockSize:height,margin:ok?"var(--space-text-gap)":"8px"}}/>;setHeight(480);' }, async root => {
    await assert.rejects(auditDesignSources({ root }), error => /480/.test(error.message) && /8px/.test(error.message));
  });
});

test('source audit rejects unreviewed dynamic measurements and breakpoint drift', async () => {
  await fixture({ 'packages/runtime/src/sample.ts': 'el.style.left=`${x}px`;window.matchMedia("(max-width:49rem)");' }, async root => {
    await assert.rejects(auditDesignSources({ root }), error => /Unreviewed dynamic/.test(error.message) && /49rem/.test(error.message));
  });
});

test('source audit catches bracket writes, cssText, arithmetic and inline doc fragments', async () => {
  for (const [file, content] of [
    ['packages/runtime/src/sample.ts', 'el.style["width"]="13px";'],
    ['packages/runtime/src/sample.ts', 'el.style.cssText="padding:13px";'],
    ['examples/app.tsx', 'const A=()=> <div style={{width:100+40,height:String(24)}}/>;'],
    ['docs/GUIDE.md', 'Use `style={{blockSize:480}}` on the root.'],
  ]) await fixture({ [file]: content }, async root => assert.rejects(auditDesignSources({ root }), /Design value audit failed/));
});

test('measured position exception does not allow a new literal offset', async () => {
  await fixture({ 'packages/runtime/src/dom.ts': 'popup.style.left=`${Math.max(0,anchor.left+8)}px`;' }, async root => assert.rejects(auditDesignSources({ root }), /Unreviewed dynamic/));
  await fixture({ 'packages/runtime/src/dom.ts': 'popup.style.left=`${Math.max(0,anchor.left)}px`;' }, async root => assert.doesNotReject(auditDesignSources({ root })));
});

test('source token references must resolve; peer variables have a narrow owner and property', async () => {
  const contract = '<!-- design-default-css:start -->\n~~~css\n:root {--foreground:#fff;}\n~~~\n<!-- design-default-css:end -->';
  await fixture({ 'docs/DESIGN.md': contract, 'examples/app.tsx': 'const A=()=> <div style={{color:"var(--missing)"}}/>;' }, async root => assert.rejects(auditDesignSources({ root }), /Undefined semantic token --missing/));
  await fixture({ 'docs/DESIGN.md': contract, 'packages/theme/src/floating.css': '.a{max-block-size:var(--available-height)}' }, async root => assert.doesNotReject(auditDesignSources({ root })));
  await fixture({ 'docs/DESIGN.md': contract, 'packages/theme/src/floating.css': '.a{padding:var(--available-height)}' }, async root => assert.rejects(auditDesignSources({ root }), /Undefined semantic token/));
  await fixture({ 'docs/GUIDE.md': 'Use `<svg width="24" height="24"/>`.' }, async root => assert.rejects(auditDesignSources({ root }), /Literal 24/));
  await fixture({ 'examples/app.tsx': 'const A=()=> <div style={{color:"var(--missing)"}}/>;' }, async root => assert.rejects(auditDesignSources({ root, availableTokens: ['--foreground'] }), /Undefined semantic token/));
});

test('only the canonical contract can exempt definition blocks; public entry docs are audited', async () => {
  const disguised = '<!-- design-default-css:start -->\n~~~css\n.x{padding:13px}\n~~~\n<!-- design-default-css:end -->';
  for (const name of ['docs/GUIDE.md', 'README.md', 'AGENTS.md', '.agents/skills/adopt-xui/SKILL.md']) await fixture({ [name]: disguised }, async root => assert.rejects(auditDesignSources({ root }), /Literal 13px/));
  await fixture({ 'docs/DESIGN.md': disguised }, async root => assert.doesNotReject(auditDesignSources({ root })));
});

test('TypeScript generic arrow syntax cannot hide a following style sink', async () => {
  await fixture({ 'packages/runtime/src/sample.ts': 'const identity=<T>(x:T)=>x;el.style.width="24px";' }, async root => assert.rejects(auditDesignSources({ root }), /Literal 24px/));
});

test('source audit accepts semantic inline values, SVG coordinates and contract breakpoints', async () => {
  await fixture({
    'packages/theme/src/sample.css': '@media(max-width:47.999rem){.x{width:100%;padding:var(--space-text-gap)}}',
    'examples/app.tsx': 'const A=()=> <svg width="var(--control-icon-size)" height="var(--control-icon-size)" strokeWidth="var(--icon-stroke-width)" viewBox="0 0 24 24"><path d="M2 2h20"/></svg>;',
    'packages/runtime/src/sample.ts': 'el.style.gridColumn=String(day);window.matchMedia("(max-width: 47.999rem)");',
    'docs/GUIDE.md': '```css\n.a{margin:0;color:var(--foreground)}\n```',
  }, async root => { const result = await auditDesignSources({ root }); assert.equal(result.files, 4); assert.ok(result.declarations >= 5); });
});
