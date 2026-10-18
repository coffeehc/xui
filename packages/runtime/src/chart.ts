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
  let min=0,max=0;
  for(const item of series)for(const value of item.values)if(value!==null){min=Math.min(min,value);max=Math.max(max,value);}
  if(min===max)max=1;
  const rough=max/4-min/4,magnitude=10**Math.floor(Math.log10(rough)),step=[1,2,2.5,5,10].map(factor=>factor*magnitude).find(value=>value>=rough);
  if(step&&Number.isFinite(step)){
    const start=Math.floor(min/step)*step,end=Math.ceil(max/step)*step;
    if(Number.isFinite(start)&&Number.isFinite(end)&&start<end){
      min=start;max=end;
      const count=Math.round(max/step-min/step),ticks=Array.from({length:count+1},(_,index)=>index===count?max:Math.max(min,Math.min(max,min+step*index)));
      return {min,max,ticks:[...new Set(ticks.map(value=>Object.is(value,-0)?0:value))]};
    }
  }
  const ticks=[...new Set([0,...Array.from({length:5},(_,index)=>min*(1-index/4)+max*(index/4))])].sort((a,b)=>a-b);
  return {min,max,ticks};
}
/** Normalize before subtracting so opposite finite extremes do not overflow. */
export function scaleChartValue(value:number,domain:ChartDomain):number{
  const extent=Math.max(Math.abs(domain.min),Math.abs(domain.max));
  return (value/extent-domain.min/extent)/(domain.max/extent-domain.min/extent);
}
/** Zero slices remain data but have no arc. Normalize before summing to avoid overflow. */
export function getPieArcs(slices:readonly ChartSlice[]):readonly PieArc[]{
  identities(slices);
  let maximum=0;
  for(const slice of slices){if(typeof slice.value!=='number'||!Number.isFinite(slice.value)||slice.value<0)throw new TypeError('Pie values must be finite and nonnegative');maximum=Math.max(maximum,slice.value);}
  const weights=slices.map(slice=>maximum?slice.value/maximum:0),sum=weights.reduce((a,b)=>a+b,0);
  let position=0;
  return slices.map((slice,index)=>{const fraction=sum?weights[index]/sum:0,start=position;position+=fraction;return {id:slice.id,fraction,start,end:position};});
}
