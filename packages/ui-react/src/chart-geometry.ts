import {scaleBand,scaleLinear,scaleQuantize} from 'd3-scale';
import {arc,line,symbol,symbolCircle,symbolSquare,curveLinear,curveMonotoneX,curveStep} from 'd3-shape';
import {scaleChartValue,type ChartCategory,type ChartSeries,type ChartDomain,type PieArc} from '@coffeehc/xui-runtime/chart';
import type {LineChartCurve} from './chart.js';

interface PlotGeometry {width:number;height:number;marker:number;band:number;fill:number}
interface PlotPoint {index:number;x:number;y:number}
/** Pure viewport geometry only; React retains all nodes, interaction and CSS roles. */
export function getCartesianGeometry(categories:readonly ChartCategory[],series:readonly ChartSeries[],domain:ChartDomain,plot:PlotGeometry,curve:LineChartCurve='linear'){
 if(curve!=='linear'&&curve!=='monotone'&&curve!=='step')throw new TypeError('LineChart curve must be linear, monotone or step');
 const category=scaleBand(categories.map(item=>item.id),[0,plot.width]);
 const group=scaleBand(series.map(item=>item.id),[0,category.bandwidth()*plot.band]);
 const linear=scaleLinear([domain.min,domain.max],[plot.height,0]);
 // Reuse the runtime's normalized projection only when raw subtraction overflows.
 const y=Number.isFinite(domain.max-domain.min)?linear:(value:number)=>plot.height*(1-scaleChartValue(value,domain));
 const x=(index:number)=>(category(categories[index]?.id)??0)+category.bandwidth()/2;
 const path=line<PlotPoint|null>().defined(value=>value!==null).x(value=>value!.x).y(value=>value!.y).curve(curve==='monotone'?curveMonotoneX:curve==='step'?curveStep:curveLinear).digits(6);
 const points=(values:readonly (number|null)[])=>values.map((value,index)=>value===null?null:{index,x:x(index),y:value});
 const projectedLine=(values:readonly (number|null)[])=>path(points(values))??'';
 const segments=(values:readonly (number|null)[])=>{
  const groups:PlotPoint[][]=[];let current:PlotPoint[]=[];
  for(const point of points(values)){if(point===null){if(current.length)groups.push(current);current=[];}else current.push(point);}
  if(current.length)groups.push(current);
  return groups.map(points=>({points,d:path(points)??''}));
 };
 const circle=symbol(symbolCircle,Math.PI*plot.marker**2).digits(6)();
 const square=symbol(symbolSquare,4*plot.marker**2).digits(6)();
 const pick=categories.length?scaleQuantize<number>().domain([0,plot.width]).range(categories.map((_item,index)=>index)):()=>-1;
 return {x,y,line:(values:readonly (number|null)[])=>projectedLine(values.map(value=>value===null?null:y(value))),projectedLine,segments,marker:(shape:number)=>(shape%3===0?circle:square)??'',categoryAt:(position:number)=>pick(position),
  // Include complete endpoint symbols; this is measured plot geometry, not a spacing recipe.
  revealBounds:{x:-plot.marker*2,y:-plot.marker*2,width:plot.width+plot.marker*4,height:plot.height+plot.marker*4},
  bar:(categoryId:string,seriesId:string)=>({x:(category(categoryId)??0)+category.bandwidth()*(1-plot.band)/2+(group(seriesId)??0),width:group.bandwidth()*plot.fill})};
}

/** D3 arcs use radians; the public runtime projection intentionally remains 0..1. */
export function getPiePath(radius:number){
 const shape=arc<Pick<PieArc,'start'|'end'>>().innerRadius(0).outerRadius(radius).startAngle(item=>item.start*Math.PI*2).endAngle(item=>item.end*Math.PI*2).digits(6);
 return (item:Pick<PieArc,'start'|'end'>)=>shape(item)??'';
}
