import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {validateChartData,getChartDomain,scaleChartValue,getPieArcs} from '../packages/runtime/dist/chart.js';
import {LineChart,BarChart,PieChart} from '../packages/ui-react/dist/chart.js';
const categories=[{id:'a',label:'甲'},{id:'b',label:'乙'}],series=[{id:'s',label:'值',values:[-10,20]}];
test('chart data validates identity, finite numeric values and explicit missing samples',()=>{
  validateChartData(categories,series);validateChartData(categories,[{...series[0],values:[null,0]}]);
  for(const values of [[NaN,0],[Infinity,0],[undefined,0],[1],Array(2)])assert.throws(()=>validateChartData(categories,[{...series[0],values}]),/finite number or null/);
  assert.throws(()=>validateChartData([...categories,categories[0]],series),/unique ids/);
  assert.throws(()=>validateChartData(categories,[series[0],series[0]]),/unique ids/);
  assert.throws(()=>validateChartData(categories,[{...series[0],color:9}]),/palette/);
});
test('Cartesian domains include zero, keep sign and survive finite numeric extremes',()=>{
  const domain=getChartDomain(series);assert.equal(domain.min,-10);assert.equal(domain.max,20);assert.equal(scaleChartValue(-10,domain),0);assert.equal(scaleChartValue(20,domain),1);assert.ok(scaleChartValue(0,domain)>0);
  for(const values of [[0,0],[null,null],[-Number.MAX_VALUE,Number.MAX_VALUE],[Number.MIN_VALUE,0]]){
    const domain=getChartDomain([{...series[0],values}]);assert.ok(domain.ticks.every(Number.isFinite));for(const value of values.filter(value=>value!==null))assert.ok(Number.isFinite(scaleChartValue(value,domain)));
  }
});
test('pie projection handles zero, single slice and overflow without inventing shares',()=>{
  const slices=values=>values.map((value,index)=>({id:String(index),label:String(index),value}));
  assert.deepEqual(getPieArcs(slices([0,0])).map(arc=>arc.fraction),[0,0]);
  assert.deepEqual(getPieArcs(slices([0,1])).map(arc=>arc.fraction),[0,1]);
  assert.deepEqual(getPieArcs(slices([Number.MAX_VALUE,Number.MAX_VALUE])).map(arc=>arc.fraction),[.5,.5]);
  for(const value of [-1,NaN,Infinity])assert.throws(()=>getPieArcs(slices([value])),/nonnegative/);
  assert.throws(()=>getPieArcs([{id:'a',label:'a',value:1},{id:'a',label:'b',value:2}]),/unique ids/);
});
test('SSR is DOM-free and shares the public Card, data entry and state primitives',()=>{
  for(const Component of [LineChart,BarChart]){
    const html=renderToStaticMarkup(React.createElement(Component,{title:'安全 <标题>',categories,series,status:'refreshing'}));
    assert.match(html,/xui-card/);assert.match(html,/aria-busy="true"/);assert.match(html,/View data/);assert.ok(!html.includes('<标题>'));
  }
  const zero=renderToStaticMarkup(React.createElement(PieChart,{title:'分布',slices:[{id:'z',label:'零',value:0}]}));assert.match(zero,/No chart data/);assert.ok(!zero.includes('xui-chart-slice'));
  const error=renderToStaticMarkup(React.createElement(LineChart,{title:'失败',categories:[],series:[],status:'error',onRetry:()=>{}}));assert.match(error,/role="alert"/);assert.match(error,/Retry/);
});
test('six palette roles have distinct non-color line signatures',()=>{
  const html=renderToStaticMarkup(React.createElement(LineChart,{title:'六组对比',categories,series:Array.from({length:6},(_,index)=>({id:String(index),label:`组 ${index}`,values:[1,2]}))}));
  const signatures=[...html.matchAll(/data-series-id="[^"]+" data-color="[^"]+" data-shape="([^"]+)" data-line-pattern="([^"]+)"/g)].map(match=>`${match[1]}:${match[2]}`);
  assert.equal(signatures.length,6);assert.equal(new Set(signatures).size,6);
});
