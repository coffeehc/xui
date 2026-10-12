import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import postcss from 'postcss';
import {MetricCard} from '../packages/ui-react/dist/metric-card.js';
import {MetricCard as RootMetricCard} from '../packages/ui-react/dist/index.js';
import {Surface} from '../packages/ui-react/dist/feedback.js';

const render=props=>renderToStaticMarkup(React.createElement(MetricCard,props));
async function declarations(selector){const values={};postcss.parse(await readFile('packages/theme/dist/feedback.css','utf8')).walkRules(selector,rule=>rule.walkDecls(decl=>{values[decl.prop]=decl.value;}));return values;}

test('MetricCard is a public Surface composition with name/value semantics and unformatted zero',()=>{
  assert.equal(RootMetricCard,MetricCard);
  const markup=render({label:'记录数',value:0});
  assert.match(markup,/^<section class="xui-surface xui-metric-card">/);
  assert.match(markup,/<dl class="xui-metric-card-content"><dt class="xui-metric-card-header"><span class="xui-metric-card-label">记录数<\/span><\/dt><dd class="xui-metric-card-value">0<\/dd><\/dl>/);
  assert.ok(!/role=|tabindex=|aria-live=|xui-metric-card-marker/.test(markup));
  assert.match(render({label:'调用方名称',value:'1,234.50 自定单位'}),/>1,234.50 自定单位<\/dd>/);
  assert.match(render({label:'尚未提供',value:'—'}),/>—<\/dd>/);
});

test('MetricCard forwards section props/ref/events and does not own host data or actions',()=>{
  const ref=React.createRef(),onClick=()=>{},style={color:'var(--foreground)'};
  const node=MetricCard({label:'名称',value:'值',ref,onClick,style,id:'metric',className:'host-card','aria-busy':true,'aria-label':'宿主区域'});
  assert.equal(node.type,Surface);assert.equal(node.props.ref,ref);assert.equal(node.props.onClick,onClick);assert.equal(node.props.style,style);assert.equal(node.props.id,'metric');assert.equal(node.props['aria-busy'],true);assert.equal(node.props['aria-label'],'宿主区域');assert.equal(node.props.className,'xui-metric-card host-card');
});

test('optional marker preserves zero, host accessibility and interactive content',()=>{
  for(const marker of [undefined,null,false,true,''])assert.ok(!render({label:'指标',value:0,marker}).includes('xui-metric-card-marker'));
  assert.match(render({label:'指标',value:0,marker:0}),/class="xui-metric-card-marker">0<\/span>/);
  const marker=React.createElement('button',{type:'button','aria-label':'查看指标说明'},'?');
  const markup=render({label:'指标',value:0,marker});
  assert.match(markup,/<span class="xui-metric-card-marker"><button type="button" aria-label="查看指标说明">\?<\/button><\/span>/);
  assert.ok(!markup.includes('aria-hidden'));
  assert.match(render({label:'指标',value:'未知',marker:React.createElement('span',{'aria-hidden':true},'●')}),/aria-hidden="true"/);
  assert.match(render({label:'<script>bad()</script>',value:'<b>text</b>'}),/&lt;script&gt;bad\(\)&lt;\/script&gt;/);
});

test('MetricCard uses existing statistical and Surface tokens with content-driven dimensions',async()=>{
  const root=await declarations('.xui-metric-card'),content=await declarations('.xui-metric-card-content'),label=await declarations('.xui-metric-card-label'),value=await declarations('.xui-metric-card-value');
  assert.equal(root.padding,'var(--metric-padding)');assert.equal(content.gap,'var(--metric-gap)');
  assert.match(label.font,/var\(--font-size-body-xs\)/);assert.equal(label.color,'var(--muted-foreground)');
  assert.match(value.font,/var\(--font-weight-heading\) var\(--font-size-metric\)\s*\/\s*var\(--line-height-metric\) var\(--font-mono\)/);assert.equal(value['font-variant-numeric'],'tabular-nums');assert.equal(value['overflow-wrap'],'anywhere');assert.equal(label['overflow-wrap'],'anywhere');
  assert.equal(label['min-inline-size'],'min-content');assert.equal(label['max-inline-size'],'100%');
  assert.equal((await declarations('.xui-metric-card-marker:empty')).display,'none');
  const surface=await declarations('.xui-surface');assert.equal(surface.background,'var(--card-background)');assert.equal(surface['border-radius'],'var(--card-radius)');
  for(const style of [root,content,label,value])for(const key of ['height','block-size','width','inline-size'])assert.equal(style[key],undefined,`No fixed ${key}`);
});
