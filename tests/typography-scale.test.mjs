import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import postcss from 'postcss';
import {checkContract,extract,declarations,expand} from '../scripts/tokens.mjs';
const document=await readFile('docs/DESIGN.md','utf8');
const metadata=JSON.parse(await readFile('docs/design-source.json','utf8'));
const {light}=checkContract(document);
const math=(value,vars)=>{
  const expression=expand(value,vars).replace(/calc\(/g,'(').replace(/rem/g,'');
  assert(/^[\d.\s*/+(),-]+$/.test(expression.replace(/\b(?:min|max|clamp)\b/g,'')));
  return Function('min','max','clamp',`return (${expression})`)(Math.min,Math.max,(a,x,b)=>Math.max(a,Math.min(x,b)));
};
const roles={caption:[.75,1.125],'body-xs':[.8125,1.25],'body-sm':[.875,1.375],'section-title':[1,1.625],'secondary-value':[1.125,1.75],'page-title':[1.25,1.75],metric:[1.5,1.75]};
test('typed typography roots, default role values and metadata agree',()=>{
  assert.equal(Object.keys(light).length,metadata.defaultTokenCount);
  assert.equal(light['--font-scale'],'1');assert.equal(light['--line-height-scale'],'var(--font-scale)');
  for(const [role,[size,line]] of Object.entries(roles)){
    assert.equal(math(light[`--font-size-${role}`],light),size);
    assert.equal(math(light[`--line-height-${role}`],light),line);
  }
});
test('seven roles keep a rem floor and readable ratios under independent bounded scales',()=>{
  for(const scale of [-1,0,.5,.9,.95,1,1.25,2,8])for(const lineScale of [.5,.9,1,1.5,2]){
    const vars={...light,'--font-scale':String(scale),'--line-height-scale':String(lineScale)};
    for(const [role,[baseSize,baseLine]] of Object.entries(roles)){
      const size=math(light[`--font-size-${role}`],vars),line=math(light[`--line-height-${role}`],vars);
      assert(size>=.75,role);assert(Math.abs(size-Math.max(.75,baseSize*Math.max(.5,Math.min(scale,2))))<1e-12,role);
      assert(line+1e-12>=size*baseLine/baseSize,role);
      assert(Math.abs(line-Math.max(size*baseLine/baseSize,baseLine*lineScale))<1e-12,role);
    }
  }
});
test('Precision migration preserves the published type scales and control/focus geometry',async()=>{
  const previous=await readFile(metadata.previousContract.snapshotPath,'utf8');
  const rules=[];postcss.parse(extract(previous,'design-default-css')).walkRules(rule=>rules.push(rule));
  const prior=declarations(rules.find(rule=>rule.selector===':root'));
  for(const role of Object.keys(roles))for(const prefix of ['font-size-','line-height-']){
    const name='--'+prefix+role;assert.equal(light[name],prior[name],name);
  }
  for(const name of ['--base-spacing','--base-font-sans','--base-font-mono','--control-height','--control-height-sm','--control-height-lg','--focus-width','--focus-offset','--login-card-inline-size','--login-control-height','--layout-dialog-width','--layout-drawer-width'])
    assert.equal(expand(light[name],light),expand(prior[name],prior),name);
});
test('font scaling cannot alter geometry roots or replace host reading defaults',async()=>{
  for(const name of ['--base-spacing','--spacing','--base-radius','--control-height','--control-icon-size','--line-width-surface','--focus-width']){
    assert(!expand(light[name],light).includes('font-scale'),name);
    for(const scale of ['.9','2'])assert.equal(expand(light[name],{...light,'--font-scale':scale}),expand(light[name],light),name);
  }
  const base=await readFile('packages/theme/src/base.css','utf8');
  for(const selector of ['.xui-text','.xui-strong','.xui-detail-heading','.xui-code'])assert(base.includes(selector));
  assert(!/:where\(\.xui,\.xui-layer\)\s+(?:p|pre|strong|h3)\s*\{/.test(base),'Do not reset host Markdown/reading content');
});
