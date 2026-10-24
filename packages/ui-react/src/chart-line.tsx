import * as React from 'react';
import type {ChartCategory} from '@coffeehc/xui-runtime/chart';
import type {getCartesianGeometry} from './chart-geometry.js';

/** Spend one series' reveal distance in input order, without drawing across null gaps. */
export function getLineReveal(lengths:readonly number[],progress:number){
 const total=lengths.reduce((sum,length)=>sum+length,0),distance=total*progress;let start=0;
 return lengths.map(length=>{const amount=length?Math.max(0,Math.min(1,(distance-start)/length)):distance>=start?1:0;start+=length;return amount;});
}
interface Props {
 geometry:ReturnType<typeof getCartesianGeometry>;values:readonly (number|null)[];categories:readonly ChartCategory[];
 shape:number;activeId?:string;entering:boolean;progress:number;inspect:(index:number)=>void;
}
interface Measurement {signature:string;lengths:number[];points:Map<number,number>}
/** Read actual SVG arc lengths only at entry. React still owns every path and marker. */
export function ChartLine({geometry,values,categories,shape,activeId,entering,progress,inspect}:Props){
 const maskId=React.useId(),nodes=React.useRef(new Map<number,SVGPathElement>());
 const d=geometry.projectedLine(values),segments=entering?geometry.segments(values):[],signature=JSON.stringify(segments.map(segment=>segment.d));
 const [measurement,setMeasurement]=React.useState<Measurement>({signature:'',lengths:[],points:new Map()});
 React.useLayoutEffect(()=>{
  if(!entering)return;
  const lengths=segments.map((_segment,index)=>nodes.current.get(index)?.getTotalLength()??0),total=lengths.reduce((sum,length)=>sum+length,0),points=new Map<number,number>();let start=0;
  segments.forEach((segment,index)=>{
   const node=nodes.current.get(index),length=lengths[index];
   segment.points.forEach((point,position)=>{
    let distance=0;
    if(position===segment.points.length-1)distance=length;
    else if(position>0&&node){
     // All public curves are monotonic in x. Binary search follows their real
     // arc length, including the vertical parts of a step, without sampling values.
     let low=0,high=length;
     for(let iteration=0;iteration<20;iteration++){const middle=(low+high)/2;if(node.getPointAtLength(middle).x<point.x)low=middle;else high=middle;}
     distance=(low+high)/2;
    }
    points.set(point.index,total?(start+distance)/total:0);
   });
   start+=length;
  });
  setMeasurement({signature,lengths,points});
 },[signature,entering]);
 const measured=measurement.signature===signature,amounts=measured?getLineReveal(measurement.lengths,progress):[];
 return <>
  {entering&&<defs><mask id={maskId} {...geometry.revealBounds} maskUnits="userSpaceOnUse" style={{maskType:'alpha'}}>
   {segments.map((segment,index)=><path key={index} ref={node=>{if(node)nodes.current.set(index,node);else nodes.current.delete(index);}} data-line-reveal-segment={index} d={segment.d} fill="none" stroke="currentColor" strokeWidth="max(var(--chart-line-width), var(--chart-line-width-emphasis))" strokeLinecap="butt" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1-(amounts[index]??0)}/>)}
  </mask></defs>}
  <path className="xui-chart-line" d={d} mask={entering?`url(#${maskId})`:undefined}/>
  {categories.map((category,index)=>values[index]===null?null:<path key={category.id} data-category-id={category.id} data-active={activeId===category.id} className="xui-chart-point" visibility={entering&&(!measured||progress<(measurement.points.get(index)??1))?'hidden':undefined} transform={`translate(${geometry.x(index)},${values[index]})${shape===2?' rotate(45)':''}`} d={geometry.marker(shape)} onPointerEnter={()=>inspect(index)} onClick={()=>inspect(index)}/>)}
 </>;
}
