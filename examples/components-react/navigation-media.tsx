import * as React from 'react';
import {Breadcrumbs,type BreadcrumbItem} from '@coffeehc/xui-react/navigation';
import {Carousel,type CarouselLabels,type CarouselItemContext} from '@coffeehc/xui-react/carousel';
import {createCarouselController} from '@coffeehc/xui-runtime/carousel';
import {Button} from '@coffeehc/xui-react/button';
import {Card,Typography,Image} from '@coffeehc/xui-react/display';
import {Field,Input} from '@coffeehc/xui-react/forms';
import {Section,Stack,Grid,Toolbar} from '@coffeehc/xui-react/layout';
import {Badge,LoadingState,ErrorState,EmptyState} from '@coffeehc/xui-react/feedback';
import {Toast} from '@coffeehc/xui-react/toast';

const path:readonly BreadcrumbItem[]=[{id:'home',label:'首页',href:'/pages-react/?page=containers'},{id:'team',label:'研发团队',href:'/pages-react/?page=menus'},{id:'workspace',label:'研究工作区',href:'/pages-react/?page=table'},{id:'project',label:'跨区域协作项目',href:'/pages-react/?page=charts'},{id:'folder',label:'归档与复核资料',href:'/pages-react/?page=display'},{id:'current',label:'任务详情：跨区域研发与运营团队共同整理的完整中文记录'}];
export function BreadcrumbExamples(){
 const [english,setEnglish]=React.useState(false),[recovered,setRecovered]=React.useState(false),toast=Toast.useToastManager();
 const items=english?path.map((item,index)=>({...item,label:['Home','Team','Workspace','Cross-region project','Archived documents','Task details with a complete descriptive name'][index]})):path;
 const navigate=(item:Readonly<BreadcrumbItem>,event:React.MouseEvent<HTMLAnchorElement>)=>{event.preventDefault();toast.add({description:(english?'Navigate: ':'示例导航：')+item.label,type:'info'});};
 return <Stack>
  <Section title="常用路径" actions={<Button variant="outline" onClick={()=>setEnglish(value=>!value)}>中 / EN</Button>}><Breadcrumbs aria-label={english?'Workspace location':'工作区路径'} items={[items[0],items[2],items[5]]} onNavigate={navigate}/></Section>
  <Section title="长路径与省略菜单"><Breadcrumbs aria-label={english?'Collapsed location':'折叠路径'} items={items} maxItems={3} overflowLabel={english?'Show parent locations':'显示上级路径'} onNavigate={navigate}/></Section>
  <Section title="禁用与不可导航上级"><Grid><Card title="单项禁用"><Breadcrumbs aria-label="单项禁用路径" items={[items[0],{...items[2],disabled:true},items[5]]} onNavigate={navigate}/></Card><Card title="整体禁用"><Breadcrumbs aria-label="禁用路径" items={items} maxItems={3} disabled overflowLabel="禁用的上级路径"/></Card><Card title="只读上级文字"><Breadcrumbs aria-label="只读路径" items={[{id:'scope',label:'当前租户'},items[5]]}/></Card></Grid></Section>
  <Section title="具名槽位组合"><Breadcrumbs aria-label="组合路径"><Breadcrumbs.Item><Breadcrumbs.Link href="/pages-react/?page=containers" onClick={event=>navigate(items[0],event)}>首页</Breadcrumbs.Link></Breadcrumbs.Item><Breadcrumbs.Item><Breadcrumbs.Separator>›</Breadcrumbs.Separator><Breadcrumbs.Link href="/pages-react/?page=charts" onClick={event=>navigate({id:'charts',label:'图表'},event)}>图表</Breadcrumbs.Link></Breadcrumbs.Item><Breadcrumbs.Item><Breadcrumbs.Separator>›</Breadcrumbs.Separator><Breadcrumbs.Current>当前统计视图</Breadcrumbs.Current></Breadcrumbs.Item></Breadcrumbs></Section>
  <Section title="宿主路径数据状态"><Grid><Card title="尚未取得路径"><LoadingState layout="inline">正在读取路径</LoadingState></Card><Card title="路径读取失败">{recovered?<Breadcrumbs items={[items[0],items[5]]} aria-label="恢复后的路径" onNavigate={navigate}/>:<ErrorState title="暂时无法读取路径" retryLabel="重试路径" onRetry={()=>setRecovered(true)}/>}</Card><Card title="空路径"><Breadcrumbs items={[]} aria-label="空路径"/><EmptyState title="尚无当前位置"/></Card></Grid></Section>
 </Stack>;
}

const labels:Partial<CarouselLabels>={carousel:'走马灯',slide:'内容页',slides:'内容浏览区域',indicators:'选择内容',previous:'上一个内容',next:'下一个内容',play:'开始轮播',pause:'暂停轮播',loading:'正在加载内容',refreshing:'正在刷新，保留已有内容',empty:'暂无内容',unselected:'请选择内容',idle:'尚未加载内容',error:'内容读取失败',retry:'重试内容',reducedMotion:'已开启减少动态效果，自动轮播不可用',slideLabel:(index,total)=>'第 '+(index+1)+' 项，共 '+total+' 项'};
const records=[{id:'research',title:'研究与复核',detail:'保留已确认的数据、筛选和表单草稿。'},{id:'agents',title:'Agent 任务调度',detail:'通过公开动作和稳定 ID 查看任务。长中文内容自然换行，不缩小字号或覆盖内部样式。'},{id:'reports',title:'统计与报告',detail:'使用公共折线图、柱状图和饼图。'}];
const pictures=records.map((record,index)=>({...record,src:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 260"><rect width="600" height="260" fill="'+['#ede9fe','#e0f2fe','#dcfce7'][index]+'"/><path d="M80 190 210 60l100 100 90-60 120 90" fill="none" stroke="#475569" stroke-width="8"/></svg>')}));
const key=(item:typeof records[number])=>item.id;
function PlainItem({item,context,readOnly=false,heading=true}:{item:typeof records[number];context:CarouselItemContext;readOnly?:boolean;heading?:boolean}){return <Stack>{heading&&<Typography.Heading level={3}>{item.title}</Typography.Heading>}<Typography.Text>{item.detail}</Typography.Text><Field label={item.title+'备注'}><Input defaultValue="保留当前草稿" readOnly={readOnly} disabled={context.disabled}/></Field></Stack>;}
export function Carousels(){
 const [value,setValue]=React.useState<string|null>('research'),[recovered,setRecovered]=React.useState(false),[refreshRecovered,setRefreshRecovered]=React.useState(false),toast=Toast.useToastManager();
 const [controller]=React.useState(()=>createCarouselController({ids:records.map(key),loop:true}));
 React.useEffect(()=>{Object.assign(window,{carouselDemo:{controller,setControlledValue:setValue}});return()=>controller.destroy();},[controller]);
 const simple=(item:typeof records[number],context:CarouselItemContext)=><PlainItem {...{item,context}}/>;
 return <Stack>
  <Section title="常用内容与草稿保留"><Carousel label="精选工作区" items={records} itemKey={key} labels={labels} loop renderItem={(item,context)=><Card title={item.title} badge={{label:'公共',tone:'neutral'}} footerActions={<Button variant="text" disabled={context.disabled} onClick={()=>toast.add({description:'已查看 '+item.title,type:'info'})}>查看详情</Button>}><PlainItem {...{item,context}} heading={false}/></Card>}/></Section>
  <Section title="图片与文字"><Carousel label="图片内容" items={pictures} itemKey={key} labels={labels} loop renderItem={item=><Stack><Image src={item.src} alt={item.title} aspectRatio={2}/><Typography.Text>{item.title}</Typography.Text></Stack>}/></Section>
  <Section title="受控与 Controller 注入"><Grid><Card title="受控当前项"><Stack><Badge>当前 ID：{value??'未选择'}</Badge><Carousel label="受控工作区" items={records} itemKey={key} labels={labels} value={value} onValueChange={setValue} renderItem={simple}/><Toolbar><Button variant="outline" onClick={()=>setValue('reports')}>宿主定位到报告</Button></Toolbar></Stack></Card><Card title="注入独立 Controller"><Carousel label="外部控制工作区" items={records} itemKey={key} labels={labels} controller={controller} renderItem={simple} controls={<Carousel.Controls><Carousel.PlayPause/><Carousel.Previous>上一项</Carousel.Previous><Carousel.Indicators/><Carousel.Next>下一项</Carousel.Next></Carousel.Controls>}/></Card></Grid></Section>
  <Section title="可暂停自动轮播"><Carousel label="自动精选工作区" items={records} itemKey={key} labels={labels} autoPlay loop interval={3000} renderItem={simple}/></Section>
  <Section title="状态对照"><Grid>
   <Card title="首次加载"><Carousel label="加载内容示例" items={[]} itemKey={key} labels={labels} status="loading" renderItem={simple}/></Card>
   <Card title="空数据"><Carousel label="空内容示例" items={[]} itemKey={key} labels={labels} renderItem={simple}/></Card>
   <Card title="读取失败与恢复"><Carousel label="错误恢复内容示例" items={recovered?records:[]} itemKey={key} labels={labels} status={recovered?'ready':'error'} onRetry={()=>setRecovered(true)} renderItem={simple}/></Card>
   <Card title="刷新保留内容"><Carousel label="刷新内容示例" items={records} itemKey={key} labels={labels} status="refreshing" renderItem={simple}/></Card>
   <Card title="刷新失败保留内容"><Carousel label="刷新失败内容示例" items={records} itemKey={key} labels={labels} status={refreshRecovered?'ready':'error'} onRetry={()=>setRefreshRecovered(true)} renderItem={simple}/></Card>
   <Card title="禁用切换与操作"><Carousel label="禁用内容示例" items={records} itemKey={key} labels={labels} disabled renderItem={simple}/></Card>
   <Card title="只读内容仍可浏览"><Carousel label="只读内容示例" items={records} itemKey={key} labels={labels} renderItem={(item,context)=><PlainItem {...{item,context}} readOnly/>}/></Card>
   <Card title="单项边界"><Carousel label="单项内容示例" items={records.slice(0,1)} itemKey={key} labels={labels} loop renderItem={simple}/></Card>
   <Card title="RTL 与键盘"><Carousel label="RTL 内容示例" dir="rtl" items={records} itemKey={key} labels={labels} loop renderItem={simple}/></Card>
  </Grid></Section>
 </Stack>;
}
