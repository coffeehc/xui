import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {validateChartData,getChartDomain,scaleChartValue,getPieArcs} from '../packages/runtime/dist/chart.js';
import {LineChart,BarChart,PieChart} from '../packages/ui-react/dist/chart.js';
import {getCartesianGeometry,getPiePath} from '../packages/ui-react/dist/chart-geometry.js';
import {scaleLinear} from '../packages/runtime/node_modules/d3-scale/src/index.js';
import {interpolateChartFrame} from '../packages/ui-react/dist/chart-motion.js';
import {getLineReveal} from '../packages/ui-react/dist/chart-line.js';
const categories=[{id:'a',label:'甲'},{id:'b',label:'乙'}],series=[{id:'s',label:'值',values:[-10,20]}];
test('line entry spends distance along each actual segment without crossing a missing sample',()=>{
 assert.deepEqual(getLineReveal([25,75],0),[0,0]);assert.deepEqual(getLineReveal([25,75],.5),[1,1/3]);assert.deepEqual(getLineReveal([25,75],1),[1,1]);
 assert.deepEqual(getLineReveal([0,0],.5),[1,1]);assert.deepEqual(getLineReveal([50,0,50],.25),[.5,0,0]);
 const categories=['a','b','c','d','e'].map(id=>({id,label:id})),series=[{id:'s',label:'s',values:[1,3,2,null,4]}];
 for(const curve of ['linear','monotone','step']){
  const geometry=getCartesianGeometry(categories,series,{min:0,max:4,ticks:[0,4]},{width:500,height:200,marker:3,band:.8,fill:.9},curve),values=series[0].values.map(value=>value===null?null:geometry.y(value)),segments=geometry.segments(values);
  assert.deepEqual(segments.map(segment=>segment.points.map(point=>point.index)),[[0,1,2],[4]]);
  assert.equal(segments.map(segment=>segment.d).join(''),geometry.projectedLine(values));
 }
});
test('motion projects screen coordinates without mutating raw data or bridging missing segments',()=>{
 const from=[100,0,50,100],to=[0,100,50,0],frame=interpolateChartFrame(from,to,.5);
 assert.deepEqual(frame,[50,50,50,50]);assert.deepEqual(interpolateChartFrame(frame,to,1),to);assert.deepEqual(from,[100,0,50,100]);
 const geometry=getCartesianGeometry([{id:'a',label:'a'},{id:'b',label:'b'},{id:'c',label:'c'}],[{id:'s',label:'s',values:[1,null,3]}],{min:0,max:4,ticks:[0,4]},{width:300,height:200,marker:3,band:.8,fill:.9},'monotone');
 assert.equal((geometry.projectedLine([50,null,100]).match(/M/g)||[]).length,2);
 for(const Component of [LineChart,BarChart,PieChart]){
  const props=Component===PieChart?{slices:[{id:'s',label:'s',value:2}]}:{categories,series};
  const html=renderToStaticMarkup(React.createElement(Component,{title:'动画',...props,animation:false}));assert.doesNotMatch(html,/\sanimation=/);
  assert.throws(()=>renderToStaticMarkup(React.createElement(Component,{title:'错误',...props,animation:'slow'})),/animation must be boolean/);
 }
});
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
test('D3 ticks and normalized coordinates stay finite across both signs and tiny/extreme inputs',()=>{
 for(const values of [[0,Number.MAX_VALUE],[-Number.MAX_VALUE,0],[-Number.MAX_VALUE,Number.MAX_VALUE],[0,1e-310],[-Number.MIN_VALUE,0],[1e-50,3e-50],[-.12,.45]]){
  const domain=getChartDomain([{id:'s',label:'s',values}]);assert.ok(domain.min<=Math.min(0,...values));assert.ok(domain.max>=Math.max(0,...values));
  assert.ok(domain.ticks.length>=2);assert.ok(domain.ticks.includes(0));assert.ok(domain.ticks.every(Number.isFinite));
  for(const value of values)assert.ok(scaleChartValue(value,domain)>=0&&scaleChartValue(value,domain)<=1);
 }
});
test('D3 geometry preserves equal category centers, grouped bar bounds, missing segments and hit testing',()=>{
 const categories=[{id:'a',label:'a'},{id:'b',label:'b'},{id:'c',label:'c'}],series=[{id:'s',label:'s',values:[-1,null,2]},{id:'t',label:'t',values:[1,2,3]}];
 const geometry=getCartesianGeometry(categories,series,{min:-1,max:3,ticks:[-1,0,1,2,3]},{width:300,height:200,marker:3,band:.8,fill:.9});
 assert.deepEqual(categories.map((_item,index)=>geometry.x(index)),[50,150,250]);assert.equal(geometry.y(-1),200);assert.equal(geometry.y(3),0);
 assert.equal((geometry.line(series[0].values).match(/M/g)||[]).length,2);assert.ok(!/NaN|Infinity/.test(geometry.line(series[0].values)));
 const a=geometry.bar('a','s'),b=geometry.bar('a','t');assert.ok(Math.abs(a.x-10)<1e-10);assert.equal(a.width,36);assert.ok(a.x+a.width<=b.x);assert.ok(b.x+b.width<=100);
 assert.deepEqual([-10,0,99,100,299,300].map(geometry.categoryAt),[0,0,0,1,2,2]);
 for(const shape of [0,1,2])assert.ok(geometry.marker(shape).length>0);
 const empty=getCartesianGeometry([],[],getChartDomain([]),{width:0,height:0,marker:0,band:0,fill:0});assert.equal(empty.categoryAt(0),-1);assert.equal(empty.line([]),'');
});
test('D3 pies retain host order and normalized shares, with finite viewport paths',()=>{
 const slices=[{id:'small',label:'小',value:1},{id:'large',label:'大',value:3},{id:'zero',label:'零',value:0}],arcs=getPieArcs(slices);
 assert.deepEqual(arcs.map(arc=>arc.id),['small','large','zero']);assert.deepEqual(arcs.map(arc=>arc.fraction),[.25,.75,0]);assert.equal(arcs[0].start,0);assert.equal(arcs[2].end,1);assert.deepEqual(slices.map(slice=>slice.value),[1,3,0]);
 const path=getPiePath(100);for(const arc of arcs.filter(arc=>arc.fraction>0))assert.ok(path(arc).includes('A')&&!/NaN|Infinity/.test(path(arc)));
 const huge=getCartesianGeometry(categories,[{id:'s',label:'s',values:[-Number.MAX_VALUE,Number.MAX_VALUE]}],getChartDomain([{id:'s',label:'s',values:[-Number.MAX_VALUE,Number.MAX_VALUE]}]),{width:200,height:100,marker:3,band:.8,fill:.9});
 assert.equal(huge.y(-Number.MAX_VALUE),100);assert.equal(huge.y(Number.MAX_VALUE),0);
});
test('public line curve defaults to linear, rejects unknown values and is not forwarded to Card DOM',()=>{
 const plot={width:500,height:200,marker:3,band:.8,fill:.9},domain=getChartDomain(series);
 assert.equal(getCartesianGeometry(categories,series,domain,plot).line(series[0].values),getCartesianGeometry(categories,series,domain,plot,'linear').line(series[0].values));
 for(const curve of ['linear','monotone','step']){
  const html=renderToStaticMarkup(React.createElement(LineChart,{title:'曲线',categories,series,curve}));assert.doesNotMatch(html,/\scurve=/);
 }
 for(const curve of ['basis','monotoneX',null,()=>null])assert.throws(()=>renderToStaticMarkup(React.createElement(LineChart,{title:'错误',categories,series,curve})),/curve must be/);
});
test('all public curves end at null samples and retain empty/single segment semantics',()=>{
 const categories=Array.from({length:5},(_,index)=>({id:String(index),label:String(index)})),values=[4,12,7,null,10],series=[{id:'s',label:'s',values}],plot={width:500,height:200,marker:3,band:.8,fill:.9};
 const paths=[];
 for(const curve of ['linear','monotone','step']){
  const geometry=getCartesianGeometry(categories,series,getChartDomain(series),plot,curve),path=geometry.line(values);paths.push(path);
  assert.equal((path.match(/M/g)||[]).length,2);assert.doesNotMatch(path,/NaN|Infinity/);
  assert.equal(geometry.line([null,null,null,null,null]),'');assert.equal((geometry.line([null,null,7,null,null]).match(/M/g)||[]).length,1);
 }
 assert.equal(new Set(paths).size,3);assert.match(paths[1],/C/);assert.doesNotMatch(paths[0],/C/);
});
test('monotone interpolation stays within adjacent sample values and step changes at the midpoint',()=>{
 const categories=Array.from({length:5},(_,index)=>({id:String(index),label:String(index)})),values=[0,20,5,15,10],series=[{id:'s',label:'s',values}],plot={width:500,height:200,marker:3,band:.8,fill:.9};
 const smooth=getCartesianGeometry(categories,series,getChartDomain(series),plot,'monotone').line(values);
 const commands=[...smooth.matchAll(/([MC])([^MC]+)/g)];let point;let segments=0;
 for(const [,command,body] of commands){
  const numbers=body.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
  if(command==='M'){point=numbers;continue;}
  const [x1,y1,x2,y2,x3,y3]=numbers;assert.ok(x1>=point[0]&&x2<=x3);
  for(let sample=0;sample<=20;sample++){const t=sample/20,y=(1-t)**3*point[1]+3*(1-t)**2*t*y1+3*(1-t)*t*t*y2+t**3*y3;assert.ok(y>=Math.min(point[1],y3)-1e-5&&y<=Math.max(point[1],y3)+1e-5);}
  point=[x3,y3];segments++;
 }
 assert.equal(segments,4);
 const step=getCartesianGeometry(categories.slice(0,2),[{id:'s',label:'s',values:[1,4]}],{min:0,max:4,ticks:[0,2,4]},{...plot,width:200,height:100},'step').line([1,4]);
 assert.equal(step,'M50,75L100,75L100,0L150,0');
});


test('numeric-only Cartesian projections exactly retain D3 normalization and interpolation',()=>{
 const domains=[[0,1],[-10,20],[20,-10],[7,7],[0,0],[-0,0],[1e-310,4e-310],
  [-Number.MIN_VALUE,Number.MIN_VALUE],[-Number.MAX_VALUE,Number.MAX_VALUE],
  [Number.MAX_VALUE,-Number.MAX_VALUE],[Number.MAX_VALUE/2,Number.MAX_VALUE],
  [-.12,.45],[NaN,1],[1,NaN],[Infinity,Infinity]];
 // Include JS callers outside the TypeScript boundary: runtime first divides
 // its value, while geometry's ordinary scale preserves D3's null/NaN unknown.
 const values=[-Infinity,-Number.MAX_VALUE,-10,-Number.MIN_VALUE,-0,0,Number.MIN_VALUE,.25,1,20,Number.MAX_VALUE,Infinity,NaN,null,undefined,'2','bad',false];
 for(const [min,max] of domains){
  const domain={min,max,ticks:[]},extent=Math.max(Math.abs(min),Math.abs(max));
  const normalized=scaleLinear([min/extent,max/extent],[0,1]);
  for(const value of [...values,min,max])assert.equal(scaleChartValue(value,domain),normalized(value/extent),`runtime ${min}..${max}, ${value}`);
  for(const height of [0,200,1e-310,Number.MAX_VALUE]){
   const geometry=getCartesianGeometry(categories,series,domain,{width:500,height,marker:3,band:.8,fill:.9});
   const direct=scaleLinear([min,max],[height,0]);
   for(const value of [...values,min,max]){
    const expected=Number.isFinite(max-min)?direct(value):height*(1-normalized(value/extent));
    assert.equal(geometry.y(value),expected,`geometry ${min}..${max}, height ${height}, ${value}`);
   }
  }
 }
 // A deterministic varied sample protects rounding, reversed domains and
 // extrapolation; this is an exact comparison, not a widened tolerance.
 for(let index=1;index<=200;index++){
  const min=Math.sin(index)*10**(index%25-12),max=Math.cos(index)*10**(index%25-12),value=Math.sin(index*3)*10**(index%25-12);
  const domain={min,max,ticks:[]},extent=Math.max(Math.abs(min),Math.abs(max));
  assert.equal(scaleChartValue(value,domain),scaleLinear([min/extent,max/extent],[0,1])(value/extent));
  const geometry=getCartesianGeometry(categories,series,domain,{width:500,height:237.25,marker:3,band:.8,fill:.9});
  assert.equal(geometry.y(value),scaleLinear([min,max],[237.25,0])(value));
 }
});
