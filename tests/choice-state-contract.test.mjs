import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';

test('choice invalid border wins the equal-specificity disabled rule',()=>{
 const rules=[];
 postcss.parse(readFileSync(new URL('../packages/theme/src/forms.css',import.meta.url),'utf8')).walkRules(rule=>rules.push(rule));
 const invalid=rules.findIndex(rule=>rule.selector==='.xui-choice[aria-invalid="true"]');
 const disabled=rules.findIndex(rule=>rule.selector==='.xui-choice:disabled');
 assert(invalid>=0&&disabled>=0);
 // Both selectors have (0,2,0). Invalid must win without changing disabled fill.
 assert(invalid>disabled,'the shared invalid border must follow disabled');
 const values=rule=>Object.fromEntries(rule.nodes.filter(node=>node.type==='decl').map(node=>[node.prop,node.value]));
 assert.deepEqual(values(rules[invalid]),{'border-color':'var(--status-error-foreground)'});
 assert.equal(values(rules[disabled]).background,'var(--muted)');
 assert.equal(values(rules[disabled]).color,'var(--muted-foreground)');
 assert.equal(values(rules[disabled]).cursor,'not-allowed');
});

test('public choices retain distinct invalid disabled and readonly semantics',async()=>{
 const React=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');
 const {Checkbox,Radio,Switch}=await import('@coffeehc/xui-react/forms');
 for(const Component of [Checkbox,Radio,Switch])for(const checked of [false,true]){
  const disabled=renderToStaticMarkup(React.createElement(Component,{label:'Choice',defaultChecked:checked,disabled:true,'aria-invalid':true,'aria-describedby':'choice-error','aria-busy':true}));
  assert.match(disabled,/disabled=""/);assert.match(disabled,/aria-invalid="true"/);assert.match(disabled,/aria-describedby="choice-error"/);assert.match(disabled,/aria-busy="true"/);
  assert.equal(disabled.includes('checked=""'),checked);
  const readonly=renderToStaticMarkup(React.createElement(Component,{label:'Choice',defaultChecked:checked,readOnly:true,'aria-invalid':true}));
  assert.match(readonly,/aria-readonly="true"/);assert.match(readonly,/aria-invalid="true"/);assert.doesNotMatch(readonly,/disabled=/);
 }
});
