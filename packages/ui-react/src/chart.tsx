import * as React from 'react';
import {validateChartData,getChartDomain,scaleChartValue,getPieArcs,type ChartCategory,type ChartSeries,type ChartSlice,type ChartStatus} from '@coffeehc/xui-runtime/chart';
import {getCartesianGeometry,getPiePath} from './chart-geometry.js';
import {useChartMotion} from './chart-motion.js';
import {ChartLine} from './chart-line.js';
import {Card,type CardProps} from './display.js';
import {DataRegion,LoadingState,EmptyState,ErrorState} from './feedback.js';
import {DataTable,type DataTableColumn,type DataTableColumnSizingProps} from './data-table.js';
import {Button} from './button.js';
import {ScrollArea} from './scroll-area.js';
import {cx} from './shared.js';
export type {ChartCategory,ChartSeries,ChartSlice,ChartColor,ChartStatus} from '@coffeehc/xui-runtime/chart';

export interface ChartLabels {
  loading:string;refreshing:string;empty:string;idle:string;error:string;retry:string;
  viewData:string;hideData:string;category:string;series:string;value:string;percentage:string;missing:string;
  keyboardHelp:string;chart:string;
}
const defaults:ChartLabels={loading:'Loading…',refreshing:'Refreshing…',empty:'No chart data',idle:'Run a query to view data',error:'Unable to load chart data',retry:'Retry',viewData:'View data',hideData:'Hide data',category:'Category',series:'Series',value:'Value',percentage:'Percentage',missing:'Missing',keyboardHelp:'Use arrow keys to inspect values; Home/End for first/last; Escape to clear. The data table provides all values.',chart:'Chart'};
export interface ChartProps extends Pick<CardProps,'title'|'headingLevel'|'description'|'actions'|'footerMeta'|'footerActions'|'className'|'id'> {
  /** Data view widths belong to DataTable; plot geometry and selection are unaffected. */
  columnSizing?:DataTableColumnSizingProps;
  /** Keep same-scope data during loading/refresh/error. Clear old data on a new scope. */
  status?:ChartStatus;
  /** Token-based motion, on by default. Reduced motion always renders immediately. */
  animation?:boolean;
  /** Host-approved text. Never pass an exception or secrets. */
  error?:string;
  onRetry?:()=>void;
  labels?:Partial<ChartLabels>;
  /** Formats display only; it does not change geometry, units or timezone. */
  formatValue?:(value:number)=>string;
}
export interface CartesianChartProps extends ChartProps {categories:readonly ChartCategory[];series:readonly ChartSeries[]}
/** Line interpolation only; missing values always end the current segment. */
export type LineChartCurve='linear'|'monotone'|'step';
export interface LineChartProps extends CartesianChartProps {
  /** Defaults to linear. monotone preserves y monotonicity; step changes at the x midpoint. */
  curve?:LineChartCurve;
}
export type BarChartProps=CartesianChartProps;
export interface PieChartProps extends ChartProps {slices:readonly ChartSlice[]}
type DataRow={id:string;category:string;series:string;value:number|null;fraction?:number};
type Inspection={categoryId:string;seriesId:string};
const number=(value:number)=>String(value);
const percent=(value:number)=>new Intl.NumberFormat(undefined,{style:'percent',maximumFractionDigits:1}).format(value);

/** Observe rendered CSS geometry, without a viewBox that would shrink rem text. */
function usePlotSize(){
  const [node,ref]=React.useState<SVGSVGElement|null>(null),[size,setSize]=React.useState({width:0,height:0,marker:0,band:0,fill:0});
  React.useLayoutEffect(()=>{
    if(!node)return;
    const measure=()=>{const {width,height}=node.getBoundingClientRect(),style=getComputedStyle(node);const next={width,height,marker:parseFloat(style.fontSize)/4,band:Number(style.getPropertyValue('--chart-bar-band-ratio')),fill:Number(style.getPropertyValue('--chart-bar-fill-ratio'))};setSize(previous=>Object.keys(next).every(key=>previous[key as keyof typeof next]===next[key as keyof typeof next])?previous:next);};
    measure();const observer=new ResizeObserver(measure);observer.observe(node);return()=>observer.disconnect();
  },[node]);
  return {ref,node,...size};
}
/** Keyboard inspection reveals its horizontal position without moving document scroll. */
function revealPlotX(node:SVGSVGElement|null,x:number){
  const viewport=node?.closest<HTMLElement>('.xui-scroll-viewport');if(!node||!viewport)return;
  const box=viewport.getBoundingClientRect(),position=node.getBoundingClientRect().left+x,padding=parseFloat(getComputedStyle(viewport).paddingLeft);
  if(position<box.left+padding)viewport.scrollBy({left:position-box.left-padding});
  else if(position>box.right-padding)viewport.scrollBy({left:position-box.right+padding});
}
function ChartFrame({hasData,rows,children,inspection,pie=false,props}:{hasData:boolean;rows:readonly DataRow[];children:React.ReactNode;inspection:string|null;pie?:boolean;props:ChartProps}){
  const {title,status='ready',animation,labels:overrides,error,onRetry,formatValue=number,className,actions,columnSizing={},...card}=props,labels={...defaults,...overrides};
  if(animation!==undefined&&typeof animation!=='boolean')throw new TypeError('Chart animation must be boolean');
  if(!['idle','loading','ready','refreshing','error'].includes(status))throw new TypeError('Invalid chart status');
  const [tableOpen,setTableOpen]=React.useState(false),tableId=React.useId();
  const busy=status==='loading'||status==='refreshing',failure=<ErrorState title={error||labels.error} onRetry={onRetry} retryLabel={labels.retry} retryDisabled={busy}/>;
  const columns:DataTableColumn<DataRow>[]=[{id:'category',header:labels.category,cell:row=>row.category},{id:'series',header:labels.series,cell:row=>row.series},{id:'value',header:labels.value,cell:row=>row.value===null?labels.missing:formatValue(row.value)},...(pie?[{id:'percentage',header:labels.percentage,cell:(row:DataRow)=>percent(row.fraction??0)}]:[])];
  return <Card {...card} title={title} className={cx('xui-chart',className)} actions={<>{actions}<Button variant="text" aria-expanded={tableOpen} aria-controls={tableId} onClick={()=>setTableOpen(value=>!value)}>{tableOpen?labels.hideData:labels.viewData}</Button></>}>
    <DataRegion busy={busy} className="xui-chart-region" feedback={<><div className="xui-chart-inspection" role="status" aria-live="polite" aria-atomic="true">{hasData?inspection:null}</div>{hasData&&(status==='error'?failure:busy?<LoadingState layout="inline">{labels.refreshing}</LoadingState>:null)}</>}>
      <div className="xui-chart-content" data-has-data={hasData}>
        {hasData?children:<div className="xui-chart-placeholder">{busy?<LoadingState>{labels.loading}</LoadingState>:status==='error'?failure:<EmptyState title={status==='idle'?labels.idle:labels.empty} align="center"/>}</div>}
      </div>
    </DataRegion>
    <div id={tableId} hidden={!tableOpen} className="xui-chart-data">{tableOpen&&<DataTable columnSizing={columnSizing} label={`${title} — ${labels.viewData}`} rows={rows} rowKey={row=>row.id} columns={columns} status={status} emptyState={<EmptyState title={labels.empty} align="center"/>} errorState={failure} layout="natural"/>}</div>
  </Card>;
}
function CartesianChart({categories,series,kind,curve='linear',...props}:CartesianChartProps&{kind:'line'|'bar';curve?:LineChartCurve}){
  validateChartData(categories,series);
  const labels={...defaults,...props.labels},format=props.formatValue??number,domain=getChartDomain(series),plot=usePlotSize(),[active,setActive]=React.useState<Inspection|null>(null);
  const geometry=getCartesianGeometry(categories,series,domain,plot,curve);
  const selectedCategory=categories.findIndex(item=>item.id===active?.categoryId),selectedSeries=series.findIndex(item=>item.id===active?.seriesId);
  const selected=selectedCategory>=0&&selectedSeries>=0?{category:categories[selectedCategory],series:series[selectedSeries],value:series[selectedSeries].values[selectedCategory]}:null;
  const rows=categories.flatMap((category,c)=>series.map(item=>({id:JSON.stringify([category.id,item.id]),category:category.label,series:item.label,value:item.values[c]}))),hasData=rows.some(row=>row.value!==null);
  const {x,y}=geometry,zero=y(0);
  const coordinates=series.flatMap(item=>item.values.map(value=>value===null?zero:y(value)));
  const boundary=JSON.stringify([kind,curve,plot.width,plot.height,plot.marker,plot.band,plot.fill,domain.min,domain.max,categories.map(item=>item.id),series.map(item=>[item.id,item.values.map(value=>value===null)])]);
  const motion=useChartMotion(plot.node,props.animation!==false,{boundary,values:coordinates,initial:kind==='bar'?coordinates.map(()=>zero):coordinates,ready:plot.width>0&&plot.height>0,hasData});
  const inspect=(categoryIndex:number,seriesIndex:number)=>{motion.finish();const category=categories[categoryIndex],item=series[seriesIndex];if(category&&item)setActive(previous=>previous?.categoryId===category.id&&previous.seriesId===item.id?previous:{categoryId:category.id,seriesId:item.id});};
  const keyboard=(event:React.KeyboardEvent<SVGSVGElement>)=>{
    if(event.key==='Escape'){event.preventDefault();setActive(null);return;}
    let c=Math.max(0,selectedCategory),s=Math.max(0,selectedSeries);
    switch(event.key){case 'ArrowRight':c=Math.min(categories.length-1,c+1);break;case 'ArrowLeft':c=Math.max(0,c-1);break;case 'ArrowDown':s=Math.min(series.length-1,s+1);break;case 'ArrowUp':s=Math.max(0,s-1);break;case 'Home':c=0;break;case 'End':c=categories.length-1;break;default:return;}
    event.preventDefault();inspect(c,s);revealPlotX(plot.node,x(c));
  };
  const pointer=(event:React.PointerEvent<SVGSVGElement>|React.MouseEvent<SVGSVGElement>)=>{const rect=event.currentTarget.getBoundingClientRect(),c=geometry.categoryAt(event.clientX-rect.left);let nearest=0,distance=Infinity;series.forEach((item,index)=>{const value=item.values[c];if(value!==null&&Math.abs(y(value)-(event.clientY-rect.top))<distance){nearest=index;distance=Math.abs(y(value)-(event.clientY-rect.top));}});inspect(c,nearest);};
  const inspection=selected?`${selected.category.label} · ${selected.series.label}: ${selected.value===null?labels.missing:format(selected.value)}`:null;
  return <ChartFrame props={props} hasData={hasData} rows={rows} inspection={inspection}>
    <ul className="xui-chart-legend" aria-label={labels.series}>{series.map((item,index)=>{const color=item.color??index%6+1,shape=(color-1)%3,pattern=(Math.floor((color-1)/3)+shape)%3;return <li key={item.id}><span aria-hidden="true" className="xui-chart-swatch" data-color={color} data-shape={shape}>{kind==='line'?['─','┄','⋯'][pattern]:''}{shape===1?'■':shape===2?'◆':'●'}</span><span>{kind==='bar'?`${index+1}. `:''}{item.label}</span></li>;})}</ul>
    <ScrollArea.Viewport className="xui-chart-viewport" aria-label={props.title}>
      <div className="xui-chart-cartesian" dir="ltr" style={{minInlineSize:`max(var(--chart-min-inline-size), calc(var(--chart-category-min-inline-size) * ${categories.length}))`}}>
        <div className="xui-chart-y-axis" aria-hidden="true"><span className="xui-chart-axis-measure">{domain.ticks.map(format).reduce((a,b)=>a.length>b.length?a:b,'')}</span>{domain.ticks.map((tick,index)=><span key={index} className="xui-chart-tick" style={{insetBlockStart:`${(1-scaleChartValue(tick,domain))*100}%`}}>{format(tick)}</span>)}</div>
        <svg ref={plot.ref} className="xui-chart-plot" data-motion={motion.frame.phase} role="group" aria-roledescription={labels.chart} aria-label={`${props.title}. ${labels.keyboardHelp}`} tabIndex={0} onKeyDown={keyboard} onPointerMove={pointer} onClick={pointer} onFocus={()=>{motion.finish();if(!selected)inspect(0,0);}}>
          <g aria-hidden="true">{domain.ticks.map((tick,index)=><line key={index} className="xui-chart-grid" x1={0} x2={plot.width} y1={y(tick)} y2={y(tick)} data-zero={tick===0}/>)}{!domain.ticks.includes(0)&&<line className="xui-chart-grid" data-zero="true" x1={0} x2={plot.width} y1={zero} y2={zero}/>}</g>
          {series.map((item,s)=>{
            const color=item.color??s%6+1,shape=(color-1)%3,pattern=(Math.floor((color-1)/3)+shape)%3;
            return <g key={item.id} data-series-id={item.id} data-color={color} data-shape={shape} data-line-pattern={pattern} className="xui-chart-series" aria-hidden="true">
              {kind==='line'?<ChartLine geometry={geometry} values={item.values.map((value,c)=>value===null?null:motion.frame.values[s*categories.length+c])} categories={categories} shape={shape} activeId={active?.seriesId===item.id?active.categoryId:undefined} entering={motion.frame.phase==='enter'} progress={motion.frame.progress} inspect={c=>inspect(c,s)}/>:categories.map((category,c)=>{const value=item.values[c];if(value===null)return null;const pointY=motion.frame.values[s*categories.length+c];
                return <rect key={category.id} data-category-id={category.id} data-active={active?.categoryId===category.id&&active?.seriesId===item.id} className="xui-chart-bar" {...geometry.bar(category.id,item.id)} y={Math.min(zero,pointY)} height={Math.abs(zero-pointY)} onPointerEnter={()=>inspect(c,s)} onClick={()=>inspect(c,s)}/>;
              })}
            </g>;
          })}
        </svg>
        <div aria-hidden="true"/>
        <div className="xui-chart-x-axis" aria-hidden="true" style={{gridTemplateColumns:`repeat(${Math.max(1,categories.length)}, minmax(0, 1fr))`}}>{categories.map(item=><span key={item.id}>{item.label}</span>)}</div>
      </div>
    </ScrollArea.Viewport>
  </ChartFrame>;
}
export function LineChart(props:LineChartProps){return <CartesianChart {...props} kind="line"/>;}
export function BarChart(props:BarChartProps){return <CartesianChart {...props} kind="bar"/>;}

/** Nonnegative categorical shares, rendered as a true pie, without invented totals or units. */
export function PieChart({slices,...props}:PieChartProps){
  const arcs=getPieArcs(slices),labels={...defaults,...props.labels},format=props.formatValue??number,plot=usePlotSize(),[activeId,setActiveId]=React.useState<string|null>(null);
  const selected=slices.findIndex(item=>item.id===activeId),hasData=arcs.some(arc=>arc.fraction>0),cx=plot.width/2,cy=plot.height/2,r=Math.max(0,Math.min(cx,cy)-plot.marker*2);
  const path=getPiePath(r);
  const coordinates=arcs.flatMap(arc=>[arc.start,arc.end]);
  const motion=useChartMotion(plot.node,props.animation!==false,{boundary:JSON.stringify([plot.width,plot.height,r,arcs.map(arc=>[arc.id,arc.fraction>0,arc.fraction>=1])]),values:coordinates,initial:coordinates.map(()=>0),ready:plot.width>0&&plot.height>0,hasData});
  const keyboard=(event:React.KeyboardEvent<SVGSVGElement>)=>{motion.finish();let next=Math.max(0,selected);switch(event.key){case 'ArrowRight':case 'ArrowDown':next=(next+1)%slices.length;break;case 'ArrowLeft':case 'ArrowUp':next=(next-1+slices.length)%slices.length;break;case 'Home':next=0;break;case 'End':next=slices.length-1;break;case 'Escape':event.preventDefault();setActiveId(null);return;default:return;}event.preventDefault();setActiveId(slices[next]?.id??null);};
  const rows=slices.map((slice,index)=>({id:slice.id,category:slice.label,series:props.title,value:slice.value,fraction:arcs[index].fraction})),inspection=selected>=0?`${slices[selected].label}: ${format(slices[selected].value)} · ${percent(arcs[selected].fraction)}`:null;
  return <ChartFrame props={props} hasData={hasData} rows={rows} inspection={inspection} pie>
    <div className="xui-chart-pie-layout"><ScrollArea.Viewport className="xui-chart-pie-viewport" aria-label={props.title}><svg ref={plot.ref} className="xui-chart-plot xui-chart-pie" data-motion={motion.frame.phase} role="group" aria-roledescription={labels.chart} aria-label={`${props.title}. ${labels.keyboardHelp}`} tabIndex={0} onKeyDown={keyboard} onFocus={()=>{motion.finish();if(selected<0)setActiveId(slices[0]?.id??null);}}>
      {arcs.map((arc,index)=>{if(!arc.fraction)return null;const inspect=()=>{motion.finish();setActiveId(arc.id);},common={'data-slice-id':arc.id,'data-color':slices[index].color??index%6+1,'data-active':activeId===arc.id,className:'xui-chart-slice','aria-hidden':true as const,onPointerEnter:inspect,onClick:inspect};
        return arc.fraction>=1?<circle key={arc.id} {...common} cx={cx} cy={cy} r={r*motion.frame.progress}/>:<path key={arc.id} {...common} transform={`translate(${cx},${cy})`} d={path({start:motion.frame.values[index*2],end:motion.frame.values[index*2+1]})}/>;
      })}
    </svg></ScrollArea.Viewport><ul className="xui-chart-pie-legend" aria-label={labels.series}>{slices.map((slice,index)=><li key={slice.id}><span className="xui-chart-swatch" data-color={slice.color??index%6+1} aria-hidden="true">■</span><span>{index+1}. {slice.label}</span><span className="xui-chart-number">{format(slice.value)} · {percent(arcs[index].fraction)}</span></li>)}</ul></div>
  </ChartFrame>;
}
