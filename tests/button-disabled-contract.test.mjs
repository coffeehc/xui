import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../packages/theme/src/button.css',import.meta.url),'utf8');
test('disabled button tokens take variant-level specificity without important or new theme values',()=>{
 const selector='.xui-button:is(:disabled,[aria-disabled="true"],[data-disabled])';
 const rule=css.slice(css.indexOf(selector)).split('}')[0];
 assert.ok(css.includes(selector),'disabled states need the same specificity as a variant');
 for(const declaration of ['background: var(--button-disabled-background)','color: var(--button-disabled-foreground)','cursor: not-allowed','transform: none'])assert.ok(rule.includes(declaration));
 for(const variant of ['secondary','outline','ghost','destructive','link'])assert.ok(css.indexOf(selector)>css.indexOf(`.xui-button[data-variant="${variant}"]`));
 assert.doesNotMatch(rule,/!important|forced-color-adjust/);
 assert.doesNotMatch(css,/\.xui-button:where\(:disabled/);
});
test('hover and pressed still exclude native, aria and data disabled states',()=>{
 const stateRules=css.split('}').filter(rule=>rule.includes(':hover')||rule.includes(':active'));
 assert.ok(stateRules.length>=6);
 for(const rule of stateRules)assert.ok(rule.includes(':not(:disabled,[aria-disabled="true"],[data-disabled])'),rule);
});
test('busy remains independent, and both formal fixtures cover every public variant',()=>{
 assert.match(css,/\.xui-button\[aria-busy="true"\] \{ border-color: var\(--surface-line-strong\); \}/);
 for(const file of ['button-state-contract.tsx','button-state-contract.js']){
  const fixture=readFileSync(new URL(`./fixtures/${file}`,import.meta.url),'utf8');
  for(const variant of ['primary','secondary','outline','ghost','destructive','link'])assert.ok(fixture.includes(`'${variant}'`));
  for(const state of ['enabled','busy','disabled','disabled-busy'])assert.ok(fixture.includes(`'${state}'`));
  assert.ok(fixture.includes('disabled-selected-toggle'));
 }
});
