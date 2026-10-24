import {extent,nice,ticks,sum} from 'd3-array';
import {scaleLinear} from 'd3-scale';
import {pie} from 'd3-shape';

/** Categorical chart data. Values are already projected by the host; no date or unit conversion. */
export interface ChartCategory {id:string;label:string}
/** Explicit palette slots keep colors stable when the host reorders series. */
export type ChartColor=1|2|3|4|5|6;
export interface ChartSeries {id:string;label:string;values:readonly (number|null)[];color?:ChartColor}
export interface ChartSlice {id:string;label:string;value:number;color?:ChartColor}
export type ChartStatus='idle'|'loading'|'ready'|'refreshing'|'error';
export interface ChartDomain {min:number;max:number;ticks:readonly number[]}
export interface PieArc {id:string;fraction:number;start:number;end:number}

function identities(items:readonly {id:string;label:string;color?:ChartColor}[]){
  const ids=new Set<string>();
  for(const item of items){
    if(typeof item.id!=='string'||!item.id.trim()||ids.has(item.id)||typeof item.label!=='string'||!item.label.trim()||item.color!==undefined&&![1,2,3,4,5,6].includes(item.color))throw new TypeError('Charts require unique ids, nonempty labels and palette slots 1–6');
    ids.add(item.id);
  }
}
/** Reject ambiguity at the public boundary; null alone denotes a missing sample. */
export function validateChartData(categories:readonly ChartCategory[],series:readonly ChartSeries[]):void{
  identities(categories);identities(series);
  for(const item of series)if(item.values.length!==categories.length||Array.from(item.values).some(value=>value!==null&&(typeof value!=='number'||!Number.isFinite(value))))throw new TypeError('Chart series require one finite number or null per category');
}
/** Both Cartesian charts include zero; an all-zero domain is 0..1 rather than a fabricated value. */
export function getChartDomain(series:readonly ChartSeries[]):ChartDomain{
  const values=function*(){yield 0;for(const item of series)for(const value of item.values)if(value!==null)yield value;};
  let [min=0,max=0]=extent(values());
  if(min===max)max=1;
  // D3's raw tick step can overflow or underflow for otherwise finite samples.
  // Preserve the public finite-domain guarantee before calling that algorithm.
  const span=max-min;
  if(Number.isFinite(span)&&span/4>0){
    const [start,end]=nice(min,max,4);
    if(Number.isFinite(start)&&Number.isFinite(end)&&start<end){
      const values=ticks(start,end,4);
      if(values.length>=2&&values.every(Number.isFinite))return {min:start,max:end,ticks:values};
    }
  }
  const magnitude=Math.max(Math.abs(min),Math.abs(max));
  const finiteTicks=[...new Set([min,0,...ticks(min/magnitude,max/magnitude,4).map(value=>value*magnitude),max])].filter(value=>Number.isFinite(value)&&value>=min&&value<=max).sort((a,b)=>a-b);
  return {min,max,ticks:finiteTicks};
}
/** Normalize before subtracting so opposite finite extremes do not overflow. */
export function scaleChartValue(value:number,domain:ChartDomain):number{
  const extent=Math.max(Math.abs(domain.min),Math.abs(domain.max));
  return scaleLinear([domain.min/extent,domain.max/extent],[0,1])(value/extent);
}
/** Zero slices remain data but have no arc. Normalize before summing to avoid overflow. */
export function getPieArcs(slices:readonly ChartSlice[]):readonly PieArc[]{
  identities(slices);
  let maximum=0;
  for(const slice of slices){if(typeof slice.value!=='number'||!Number.isFinite(slice.value)||slice.value<0)throw new TypeError('Pie values must be finite and nonnegative');maximum=Math.max(maximum,slice.value);}
  const weights=slices.map(slice=>maximum?slice.value/maximum:0),total=sum(weights);
  // The public projection uses turns (0..1), and the host's order is authoritative.
  const arcs=pie<number>().sort(null).endAngle(1)(weights);
  return arcs.map((arc,index)=>({id:slices[index].id,fraction:total?weights[index]/total:0,start:arc.startAngle,end:arc.endAngle}));
}
