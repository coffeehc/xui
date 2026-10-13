import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
import {checkContract,expand} from '../scripts/tokens.mjs';

function declarations(file,selector){
 const matches=[];
 postcss.parse(readFileSync(new URL(file,import.meta.url),'utf8')).walkRules(rule=>{
  if(rule.selector===selector)matches.push(Object.fromEntries(rule.nodes.filter(node=>node.type==='decl').map(node=>[node.prop,node.value])));
 });
 assert.equal(matches.length,1,`one owner for ${selector}`);
 return matches[0];
}

test('both Separator orientations consume the separator width role',()=>{
 const horizontal=declarations('../packages/theme/src/base.css','.xui-separator');
 const vertical=declarations('../packages/theme/src/base.css','.xui-separator[data-orientation="vertical"]');
 assert.equal(horizontal['border-block-start'],'var(--line-width-separator) solid var(--separator-line)');
 assert.equal(vertical['border-inline-start'],'var(--line-width-separator) solid var(--separator-line)');
 assert.equal(vertical['border-block-start'],'0');
});

test('separator and Surface width roles keep equal defaults but independent overrides',()=>{
 const {light,dark}=checkContract(readFileSync(new URL('../docs/DESIGN.md',import.meta.url),'utf8'));
 const surface=declarations('../packages/theme/src/feedback.css','.xui-surface');
 assert.equal(surface.border,'var(--line-width-surface) solid var(--card-border-color)');
 for(const values of [light,dark]){
  assert.equal(expand(values['--line-width-separator'],values),'1px');
  assert.equal(expand(values['--line-width-surface'],values),'1px');
  const overridden={...values,'--line-width-separator':'3px','--line-width-surface':'1px'};
  assert.equal(expand('var(--line-width-separator)',overridden),'3px');
  assert.equal(expand('var(--line-width-surface)',overridden),'1px');
 }
});
