import {LineChart,BarChart,PieChart,type ChartSeries,type ChartLabels,type LineChartCurve} from '@coffeehc/xui-react/chart';
import {getPieArcs,type ChartSlice} from '@coffeehc/xui-runtime/chart';
import type {LineChartCurve as RootLineChartCurve} from '@coffeehc/xui-react';
const series:ChartSeries[]=[{id:'s',label:'系列',color:2,values:[1,null]}],categories=[{id:'a',label:'甲'},{id:'b',label:'乙'}];
const labels:Partial<ChartLabels>={viewData:'查看数据'};
export const line=<LineChart title="折线" categories={categories} series={series} labels={labels} status="refreshing" actions={<button>宿主动作</button>}/>;
export const bar=<BarChart title="柱状" categories={categories} series={series} formatValue={String} animation={false}/>;
const curve:LineChartCurve='monotone';
const rootCurve:RootLineChartCurve=curve;void rootCurve;
export const smooth=<LineChart title="单调平滑" categories={categories} series={series} curve={curve} animation/>;
export const step=<LineChart title="阶梯" categories={categories} series={series} curve="step"/>;
// @ts-expect-error curves are a closed public configuration, not arbitrary D3 names
export const unsupported=<LineChart title="错误" categories={categories} series={series} curve="basis"/>;
// @ts-expect-error bar charts have no line interpolation configuration
export const barCurve=<BarChart title="错误" categories={categories} series={series} curve="step"/>;
// @ts-expect-error consumers pass the public configuration, not a D3 curve factory
export const callbackCurve=<LineChart title="错误" categories={categories} series={series} curve={()=>null}/>;
const slices:ChartSlice[]=[{id:'a',label:'类别',value:0}];
export const pie=<PieChart title="分布" slices={slices} footerMeta="宿主真实事实" animation={false}/>;
// @ts-expect-error motion uses shared tokens, not consumer timing objects
export const customAnimation=<LineChart title="错误" categories={categories} series={series} animation={{duration:200}}/>;
void getPieArcs(slices);
// @ts-expect-error palette slots are not arbitrary CSS colors
const customColor:ChartSeries={id:'s',label:'系列',values:[],color:'red'};
// @ts-expect-error the host must provide a named chart
export const unnamed=<PieChart slices={slices}/>;
// @ts-expect-error charts do not own requests
export const query=<LineChart title="错误" categories={categories} series={series} loader={()=>[]}/>;
// @ts-expect-error an absent sample is explicit null, not undefined
const missing:ChartSeries={id:'s',label:'系列',values:[undefined]};
void customColor;void missing;
