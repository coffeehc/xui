import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import postcss from 'postcss';
import { parse } from 'yaml';
import { checkDesignDeclaration, auditDesignSources } from './design-value-guard.mjs';

export function extract(document, marker) {
  const part = document.split(`<!-- ${marker}:start -->`)[1]?.split(`<!-- ${marker}:end -->`)[0];
  assert(part, `Missing ${marker}`);
  const match = part.match(/~~~(?:css|js)\n([\s\S]*?)\n~~~/);
  assert(match, `Missing fenced ${marker}`);
  return match[1] + '\n';
}
export function declarations(rule) {
  const result = {};
  rule.each(node => { if (node.type === 'decl' && node.prop.startsWith('--')) result[node.prop] = node.value; });
  return result;
}
export function checkGraph(values) {
  const complete = new Set(), pending = new Set();
  function visit(name) {
    assert(name in values, `Undefined variable ${name}`);
    assert(!pending.has(name), `Variable cycle at ${name}`);
    if (complete.has(name)) return;
    pending.add(name);
    for (const match of values[name].matchAll(/var\((--[\w-]+)/g)) visit(match[1]);
    pending.delete(name); complete.add(name);
  }
  Object.keys(values).forEach(visit);
}
export function expand(value, values) {
  return value.replace(/var\((--[\w-]+)\)/g, (_, name) => expand(values[name], values));
}
function normalize(value) { return String(value).replace(/\s+/g, '').replace(/(^|[^\d])0\./g, '$1.').toLowerCase(); }
function number(value, values) {
  const expr = expand(value, values).replace(/calc\(/g, '(').replace(/rem/g, '').trim();
  assert(/^[\d.\s*/+(),-]+$/.test(expr.replace(/\b(?:min|max|clamp)\b/g,'')), 'Invalid controlled token arithmetic');
  // Only verified arithmetic and these three CSS math functions are evaluable.
  return Function('min','max','clamp',`return (${expr})`)(Math.min,Math.max,(lo,value,hi)=>Math.max(lo,Math.min(value,hi)));
}
export function checkContract(document) {
  const css = extract(document, 'design-default-css');
  const tree = postcss.parse(css);
  const rules = [];
  tree.walkRules(rule => rules.push(rule));
  const defaults = declarations(rules.find(rule => rule.selector === ':root'));
  const lightRule = rules.find(rule => rule.selector === ':root[data-theme="light"]');
  assert(lightRule, 'Missing explicit light recipe');
  const light = { ...defaults, ...declarations(lightRule) };
  assert.equal(Object.keys(defaults).length, 384, 'Default token count');
  for (const name of ['--font-scale','--line-height-scale']) {
    const registration=tree.nodes.find(node=>node.type==='atrule'&&node.name==='property'&&node.params===name);
    assert(registration, `Missing typed ${name} registration`);
    assert.deepEqual(Object.fromEntries(registration.nodes.map(node=>[node.prop,node.value])),{syntax:'"<number>"',inherits:'true','initial-value':'1'});
  }
  assert.equal(light['--font-scale'],'1');
  assert.equal(light['--line-height-scale'],'var(--font-scale)');
  const dark = defaults;
  assert.equal(rules.find(rule => rule.selector === ':root').nodes.find(node => node.prop === 'color-scheme').value, 'dark');
  const systemRule = rules.find(rule => rule.selector === ':root[data-theme="system"]');
  assert.equal(systemRule?.parent.params, '(prefers-color-scheme: light)', 'System light media recipe');
  assert.deepEqual(declarations(systemRule), declarations(lightRule), 'Explicit/system light recipes differ');
  const productTree = postcss.parse(extract(document,'design-product-css'));
  const products = [];
  productTree.walkRules(rule => products.push(declarations(rule)));
  assert.deepEqual(products[1],products[2],'Product explicit/system light recipes differ');
  const reducedRule = rules.find(rule => rule.parent.type === 'atrule' && rule.parent.params.includes('prefers-reduced-motion'));
  const reduced = declarations(reducedRule);
  for (const mode of [light, dark]) for (const motion of [{}, reduced]) checkGraph({ ...mode, ...motion });
  for (const [mode,overrides] of [[dark,products[0]],[light,{...products[0],...products[1]}]]) checkGraph({...mode,...overrides,...reduced});
  const front = parse(document.split('---')[1]);
  const colorNames = { primary:'primary', 'on-primary':'on-primary', foreground:'foreground', 'muted-foreground':'muted-foreground', background:'background', canvas:'canvas', shell:'shell', surface:'surface', support:'support', raised:'raised', overlay:'overlay', muted:'muted', separator:'separator', 'surface-line':'surface-line', 'surface-line-strong':'surface-line-strong', 'input-line':'input-line' };
  for (const [summary, palette] of Object.entries(colorNames)) for (const [suffix, vars] of [['',light],['-dark',dark]])
    assert.equal(normalize(front.colors[summary+suffix]), normalize(expand(vars[`--palette-${palette}`],vars)), `Front matter color ${summary+suffix}`);
  for (const [suffix, vars] of [['',light],['-dark',dark]])
    assert.equal(normalize(front.colors['selected'+suffix]), normalize(expand(vars['--interaction-selected'],vars)), `Selected color ${suffix}`);
  for (const [role, data] of Object.entries(front.typography)) {
    assert.equal(number(varsOf(light, `font-size-${role}`),light), parseFloat(data.fontSize));
    assert.equal(number(varsOf(light, `line-height-${role}`),light), parseFloat(data.lineHeight));
    const weight = role === 'metric' || role.includes('title') || role === 'secondary-value' ? 'heading' : 'body';
    assert.equal(Number(expand(light[`--font-weight-${weight}`],light)),data.fontWeight);
    assert(expand(light[`--font-${role === 'metric' ? 'mono' : 'sans'}`],light).includes(data.fontFamily));
  }
  for (const [role,value] of Object.entries(front.rounded)) assert.equal(number(light[`--radius-${role}`],light),parseFloat(value));
  for (const [role,value] of Object.entries(front.spacing)) assert.equal(number(light[role === 'unit' ? '--spacing' : `--space-${role}`],light),parseFloat(value));
  const expected = {
    'button-primary': {backgroundColor:'{colors.primary}',textColor:'{colors.on-primary}',rounded:'{rounded.md}',height:'2.25rem'},
    'button-primary-dark': {backgroundColor:'{colors.primary-dark}',textColor:'{colors.on-primary-dark}',rounded:'{rounded.md}',height:'2.25rem'},
    'navigation-selected': {backgroundColor:'{colors.selected}',textColor:'{colors.primary}'},
    'navigation-selected-dark': {backgroundColor:'{colors.selected-dark}',textColor:'{colors.primary-dark}'},
    card: {backgroundColor:'{colors.raised}',textColor:'{colors.foreground}',rounded:'{rounded.lg}',padding:'0.875rem'},
    'card-dark': {backgroundColor:'{colors.raised-dark}',textColor:'{colors.foreground-dark}',rounded:'{rounded.lg}',padding:'0.875rem'},
  };
  assert.deepEqual(front.components,expected);
  assert.equal(number(light['--button-height'],light),parseFloat(front.components['button-primary'].height));
  assert.equal(number(light['--card-padding'],light),parseFloat(front.components.card.padding));
  assert(document.includes('| action-danger / action-danger-foreground |'));
  assert(!/(?:xAgent|xagent|\/frontend\/|chat特例)/.test(document),'Contract must be portable');
  return { css, light, dark };
}
function varsOf(vars,key) { return vars[`--${key}`]; }

export function checkStyles(styles, values, runtimeVariables = []) {
  postcss.parse(styles).walkDecls(decl => {
    checkDesignDeclaration(decl.prop,decl.value,{line:decl.source.start.line,selector:decl.parent.selector});
    for (const m of decl.value.matchAll(/var\((--[\w-]+)/g)) assert(m[1] in values || runtimeVariables.includes(m[1]), `Component undefined ${m[1]}`);
    assert(!/var\(--(?:palette|base)-/.test(decl.value),'Components must use semantic tokens');
    assert(!/(#[a-f\d]{3,8}\b|\b(?:rgb|hsl|oklch|oklab)\s*\()/i.test(decl.value),'Raw color outside contract');
    assert(!decl.prop.startsWith('--'),'Components cannot invent default values');
    if (decl.prop !== 'border-collapse' && decl.prop !== 'outline-offset' && /color|background|border(?!-radius)|outline|shadow|fill|stroke/.test(decl.prop)) {
      const rest = decl.value.replace(/var\(--[\w-]+\)/g,'').replace(/color-mix\(|linear-gradient\(|\bin\s+oklab\b|\b(?:transparent|currentcolor|none|solid|inherit|initial|unset|px|rem|em)\b|[-+\d.%\s(),]/gi,'');
      assert.equal(rest,'','Raw named or uncontrolled color outside contract');
    }
  });
}
export const styleParts=['base','button','forms','navigation','feedback','dialog','layout','floating','table','auth','sheet','widgets','search-toolbar'];
export async function generate(check = false, outputDirectory='packages/theme/dist') {
  const audit = await auditDesignSources();
  console.log(`Design values: ${audit.files} files, ${audit.declarations} declarations and explicit structural/runtime exceptions checked.`);
  const doc = await readFile('docs/DESIGN.md','utf8');
  const { css, light } = checkContract(doc);
  const metadata=JSON.parse(await readFile('docs/design-source.json','utf8'));
  assert.equal(Object.keys(light).length,metadata.defaultTokenCount,'Versioned token count');
  assert.equal(createHash('sha256').update(css).digest('hex'),metadata.defaultCssSha256,'Versioned default CSS fingerprint');
  assert.equal(createHash('sha256').update(await readFile(metadata.source.path)).digest('hex'),metadata.source.sha256,'Uploaded design source fingerprint');
  const source = await readFile('packages/theme/src/components.css','utf8');
  assert.equal(source,styleParts.map(name=>`@import './${name}.css';`).join('\n')+'\n','Component source must contain the declared local parts only');
  const parts={};
  for(const name of styleParts){parts[name]=await readFile(`packages/theme/src/${name}.css`,'utf8');checkStyles(parts[name],light,name==='floating'?['--available-height','--available-width','--anchor-width','--toast-swipe-movement-x','--toast-swipe-movement-y']:[]);}
  const component=styleParts.map(name=>parts[name]).join('\n');
  checkStyles(await readFile('examples/shared/layout.css','utf8'),light);
  const files = { 'tokens.css':css, 'components.css':component, 'style.css':css+'\n'+component,'critical.css':css+'\n'+styleParts.filter(name=>name!=='floating').map(name=>parts[name]).join('\n'),...Object.fromEntries(styleParts.map(name=>[`${name}.css`,parts[name]])) };
  await mkdir(outputDirectory,{recursive:true});
  for (const [name,value] of Object.entries(files)) {
    const path = `${outputDirectory}/${name}`;
    if (check) assert.equal(await readFile(path,'utf8'),value, `Generated CSS drift: ${path}`);
    else await writeFile(path,value);
  }
  console.log(`Contract: ${Object.keys(light).length} tokens, complete acyclic graphs, light/dark/system/reduced, YAML and extracted CSS agree.`);
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) await generate(process.argv.includes('--check'));
