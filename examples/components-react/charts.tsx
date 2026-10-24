import * as React from 'react';
import {LineChart,BarChart,PieChart,type ChartLabels,type ChartStatus,type LineChartCurve} from '@coffeehc/xui-react/chart';
import {Stack,Grid,Section,Toolbar} from '@coffeehc/xui-react/layout';
import {Typography} from '@coffeehc/xui-react/display';
import {Switch} from '@coffeehc/xui-react/forms';
import {Button} from '@coffeehc/xui-react/button';
import {Tabs} from '@coffeehc/xui-react/tabs';

const chartLabels:ChartLabels={loading:'正在加载图表',refreshing:'正在刷新图表',empty:'暂无图表数据',idle:'执行查询后查看图表',error:'图表读取失败',retry:'重试',viewData:'查看数据表格',hideData:'收起数据表格',category:'日期',series:'系列',value:'数值',percentage:'占比',missing:'缺少采样',keyboardHelp:'方向键查看数据，Home/End 跳转首末，Escape 清除。',chart:'图表'};
const categories=[{id:'mon',label:'周一'},{id:'tue',label:'周二'},{id:'wed',label:'周三'},{id:'thu',label:'周四'}];
const series=[{id:'done',label:'完成任务',values:[6,12,8,15],color:1 as const},{id:'queued',label:'新增任务',values:[10,8,14,9],color:2 as const}];
const slices=[{id:'done',label:'已完成',value:15,color:1 as const},{id:'active',label:'运行中',value:9,color:2 as const},{id:'queued',label:'待处理',value:6,color:3 as const}];
const comparisonCategories=[...categories,{id:'fri',label:'周五'}];
const comparisonSeries=[{id:'sample',label:'采样值',values:[4,12,7,null,10],color:1 as const}];
const curveChoices:readonly {curve:LineChartCurve;title:string}[]=[{curve:'linear',title:'直线'},{curve:'monotone',title:'单调平滑'},{curve:'step',title:'阶梯'}];
const motionCategories=[...categories,{id:'fri',label:'周五'}];
function ChartMotionDemo({animation,onAnimationChange}:{animation:boolean;onAnimationChange:(enabled:boolean)=>void}){
 const [updated,setUpdated]=React.useState(false),[replay,setReplay]=React.useState(0);
 const line=[{id:'sample',label:'采样值',values:updated?[12,7,10,null,15]:[6,12,8,null,15]}];
 const bars=[{id:'change',label:'净变化',values:updated?[-5,10,0,-10]:[10,-10,0,5]}];
 const shares=slices.map((slice,index)=>({...slice,value:(updated?[6,15,9]:[15,9,6])[index]}));
 return <Section title="图表动效 · 默认 900ms"><Stack><Toolbar><Switch label="开启动效" checked={animation} onChange={event=>onAnimationChange(event.currentTarget.checked)}/><Button variant="outline" onClick={()=>setUpdated(value=>!value)}>更新同一组数据</Button><Button variant="text" onClick={()=>setReplay(value=>value+1)}>重播首次绘制</Button></Toolbar>
  <Tabs.Root defaultValue="line"><Tabs.List aria-label="图表类型"><Tabs.Tab value="line">折线图</Tabs.Tab><Tabs.Tab value="curve">曲线图</Tabs.Tab><Tabs.Tab value="bar">柱状图</Tabs.Tab><Tabs.Tab value="pie">饼图</Tabs.Tab></Tabs.List>
   {(['line','curve'] as const).map(kind=><Tabs.Panel key={kind} value={kind}><LineChart key={replay} id={`motion-${kind}`} title={kind==='curve'?'曲线趋势':'折线趋势'} curve={kind==='curve'?'monotone':'linear'} animation={animation} categories={motionCategories} series={line} labels={chartLabels}/></Tabs.Panel>)}
   <Tabs.Panel value="bar"><BarChart key={replay} id="motion-bar" title="净变化" animation={animation} categories={categories} series={bars} labels={chartLabels}/></Tabs.Panel>
   <Tabs.Panel value="pie"><PieChart key={replay} id="motion-pie" title="任务分布" animation={animation} slices={shares} labels={chartLabels}/></Tabs.Panel>
  </Tabs.Root></Stack></Section>;
}
type ChartPhase='loading'|'refreshing'|'empty'|'error'|'stale-error'|'idle';
function ChartCase({phase,animation}:{phase:ChartPhase;animation:boolean}){
 const [restored,setRestored]=React.useState(false),failed=phase==='error'||phase==='stale-error';
 const hasData=phase==='refreshing'||phase==='stale-error'||failed&&restored,status:ChartStatus=phase==='empty'||failed&&restored?'ready':phase==='stale-error'?'error':phase as ChartStatus;
 return <LineChart title={{loading:'首次加载',refreshing:'刷新保留图形',empty:'空数据',error:'读取失败与恢复','stale-error':'刷新失败保留图形',idle:'尚未查询'}[phase]} categories={hasData?categories:[]} series={hasData?series:[]} animation={animation} status={status} labels={chartLabels} onRetry={()=>setRestored(true)}/>;
}
export function Charts(){
 const [animation,setAnimation]=React.useState(true);
 return <Stack>
  <ChartMotionDemo animation={animation} onAnimationChange={setAnimation}/>
  <Section title="同一组数据 · 三种折线算法"><Grid>{curveChoices.map(({curve,title})=><LineChart key={curve} id={'curve-'+curve} title={title} curve={curve} animation={animation} categories={comparisonCategories} series={comparisonSeries} labels={chartLabels}/>)}</Grid></Section>
  <Section title="折线 / 曲线 / 柱状 / 饼图"><Grid><LineChart title="任务完成折线趋势" {...{categories,series}} animation={animation} labels={chartLabels}/><LineChart title="任务完成曲线趋势" curve="monotone" {...{categories,series}} animation={animation} labels={chartLabels}/></Grid><Grid><BarChart title="任务数量对比" {...{categories,series}} animation={animation} labels={chartLabels}/><PieChart title="任务状态分布" slices={slices} animation={animation} labels={chartLabels}/></Grid></Section>
  <Section title="缺采样、正负值与占比边界"><Grid>
   <LineChart title="缺采样保持断线" categories={categories} series={[{id:'samples',label:'实际采样',values:[12,null,-3,8]}]} animation={animation} labels={chartLabels}/>
   <BarChart title="净变化与零基线" categories={categories} series={[{id:'delta',label:'净变化',values:[8,-4,0,3]}]} animation={animation} labels={chartLabels}/>
   <PieChart title="单项占比与零项" slices={[{id:'empty',label:'待处理',value:0},{id:'complete',label:'已完成',value:12}]} animation={animation} labels={chartLabels}/>
  </Grid></Section>
  <Section title="图表状态对照"><Grid style={{gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,var(--chart-min-inline-size)),1fr))'}}>{(['loading','refreshing','empty','error','stale-error','idle'] as const).map(phase=><ChartCase key={phase} phase={phase} animation={animation}/>)}</Grid></Section>
  <Typography.Text tone="muted">图表本身呈现只读数据；禁用应施加在刷新、筛选等具体操作上。</Typography.Text>
 </Stack>;
}
