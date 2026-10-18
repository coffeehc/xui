import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {LineChart,BarChart,PieChart,type ChartLabels,type ChartCategory,type ChartSeries,type ChartSlice} from '@coffeehc/xui-react/chart';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {PageHeader,Stack,Grid,Toolbar} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Input,Field} from '@coffeehc/xui-react/forms';
import {useResource} from '@coffeehc/xui-react/feedback';
import {createResource} from '@coffeehc/xui-runtime/loading';
import {disposeXuiServices} from '@coffeehc/xui-runtime/bootstrap';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/critical.css';
import '@coffeehc/xui-theme/chart.css';

const params=new URLSearchParams(location.search),theme=bootstrapBrowserExample().services.getThemeService();
theme.setMode(params.get('mode')==='dark'?'dark':params.get('mode')==='system'?'system':'light');
theme.setPreset((['violet','ember','forest','crimson','cobalt','precision'] as const).find(item=>item===params.get('preset'))??'violet');
if(params.get('dir')==='rtl')document.documentElement.dir='rtl';
const labels:ChartLabels={loading:'正在加载图表',refreshing:'正在刷新图表',empty:'暂无图表数据',idle:'执行查询后查看图表',error:'图表加载失败',retry:'重试',viewData:'查看数据表格',hideData:'收起数据表格',category:'日期/类别',series:'系列',value:'数值',percentage:'占比',missing:'缺少采样',keyboardHelp:'使用方向键查看数值，Home/End 跳到首末，Escape 清除；数据表格提供全部值。',chart:'图表'};
type Data={categories:ChartCategory[];series:ChartSeries[];bars:ChartSeries[];slices:ChartSlice[]};
type Fixture='normal'|'empty'|'zero'|'missing'|'single'|'error'|'reverse';
let fixture:Fixture='normal',calls=0,delay=180;
function sample(fixture:Fixture):Data{
  const long=params.has('long'),categories=Array.from({length:6},(_,index)=>({id:`day-${index}`,label:long?`跨区域研发团队完整的中文采样日期与窗口名称 ${index+1}`:`10/${12+index}`}));
  const series:ChartSeries[]=[{id:'research',label:long?'研发团队的实际采样与完整长中文系列名称':'采样任务',color:1,values:[40,60,null,80,45,95]},{id:'review',label:'复核任务',color:5,values:[20,34,30,53,28,70]}];
  const bars:ChartSeries[]=[{id:'changes',label:'任务净变化',color:4,values:[32,-12,18,-5,0,22]},{id:'reviewed',label:'已复核净变化',color:5,values:[18,-6,0,16,-8,12]}],slices:ChartSlice[]=[{id:'a',label:'研究',value:40,color:1},{id:'b',label:'复核',value:24,color:5},{id:'c',label:long?'跨区域长期观察与人工协作任务':'观察',value:18,color:2},{id:'d',label:'待分配',value:0,color:3}];
  if(fixture==='empty')return {categories:[],series:[],bars:[],slices:[]};
  if(fixture==='zero'){series.forEach(item=>item.values=item.values.map(()=>0));bars.forEach(item=>item.values=item.values.map(()=>0));slices.forEach(item=>item.value=0);}
  if(fixture==='missing'){series.forEach(item=>item.values=item.values.map(()=>null));bars.forEach(item=>item.values=item.values.map(()=>null));}
  if(fixture==='single')return {categories:categories.slice(0,1),series:series.slice(0,1).map(item=>({...item,values:[0]})),bars:bars.map(item=>({...item,values:[-10]})),slices:[{id:'a',label:'单一类别',value:1}]};
  if(fixture==='reverse'){categories.reverse();series.forEach(item=>item.values=[...item.values].reverse());series.reverse();bars.forEach(item=>item.values=[...item.values].reverse());slices.reverse();}
  return {categories,series,bars,slices};
}
const resource=createResource<Data>({timeoutMs:3000,loader:async(_key,signal)=>{calls++;const requested=fixture;await new Promise<void>((resolve,reject)=>{const timer=setTimeout(resolve,delay);signal.addEventListener('abort',()=>{clearTimeout(timer);reject(signal.reason);},{once:true});});if(requested==='error')throw new Error('Synthetic chart failure');return sample(requested);}});
function App(){
  const state=useResource(resource),[language,setLanguage]=React.useState('zh'),[names,setNames]=React.useState(false);
  const value=state.value??{categories:[],series:[],bars:[],slices:[]},status=state.status==='retrying'?'loading':state.status==='empty'?'ready':state.status;
  const common={status,labels:language==='zh'?labels:undefined,onRetry:()=>{fixture='normal';void resource.retry();}} as const;
  const items=[{id:'line',label:names?'Line Analytics':'折线图',href:'#line'},{id:'bar',label:names?'Bar Analytics':'柱状图',href:'#bar'},{id:'pie',label:names?'Pie Analytics':'饼图',href:'#pie'},{id:'emoji',label:'🧑‍💻研发团队',href:'#emoji'},{id:'disabled',label:'禁用项目',href:'#disabled',disabled:true},{id:'explicit',label:'显式图标',href:'#explicit',icon:'document'}];
  Object.assign(window,{chartDemo:{resource,get calls(){return calls;},load:(next:Fixture,key='chart-scope',milliseconds=180)=>{fixture=next;delay=milliseconds;return resource.load(key);},setLanguage,setNames,setPreset:(value:Parameters<typeof theme.setPreset>[0])=>theme.setPreset(value)}});
  return <MenuLayout title="xui 图表" label="图表导航" compactLabel="收起导航" expandLabel="展开导航" closeLabel="关闭导航" defaultCollapsed={params.has('compact')} items={items} activeId="line" scrollMode="document"><Stack>
    <PageHeader title="任务分析" actions={<Toolbar><Button variant="outline" disabled={state.busy} onClick={()=>{fixture='normal';void resource.load('chart-scope');}}>刷新</Button><Button variant="text" onClick={()=>setLanguage(value=>value==='zh'?'en':'zh')}>中 / EN</Button></Toolbar>}/>
    <Field label="观察备注"><Input defaultValue="保留输入与焦点"/></Field>
    <LineChart {...common} id="line" title="采样与复核趋势" categories={value.categories} series={value.series}/>
    <Grid><BarChart {...common} id="bar" title="任务净变化" categories={value.categories} series={value.bars}/><PieChart {...common} id="pie" title="任务分布" slices={value.slices}/></Grid>
  </Stack></MenuLayout>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
if(!params.has('idle'))void resource.load('chart-scope');
window.addEventListener('pagehide',()=>{resource.destroy();disposeXuiServices(window);},{once:true});
