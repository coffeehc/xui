import * as React from 'react';
import {Button,IconButton} from '@coffeehc/xui-react/button';
import {Field,Input,Textarea,Switch} from '@coffeehc/xui-react/forms';
import {Card,Typography,Separator} from '@coffeehc/xui-react/display';
import {Stack,Grid,Section,Toolbar} from '@coffeehc/xui-react/layout';
import {Badge,LoadingState,ErrorState} from '@coffeehc/xui-react/feedback';
import {Tabs} from '@coffeehc/xui-react/tabs';
import {Disclosure} from '@coffeehc/xui-react/navigation';
import {Accordion} from '@coffeehc/xui-react/accordion';
import {CardGroup,type CollectionStatus} from '@coffeehc/xui-react/card-group';
import {MetricCard} from '@coffeehc/xui-react/metric-card';
import {ToggleGroup} from '@coffeehc/xui-react/toggle-group';
import {Toast} from '@coffeehc/xui-react/toast';

const rows=[{id:'research',name:'研究工作区',count:12},{id:'operations',name:'运营工作区',count:8}];
export function Containers(){
 const [phase,setPhase]=React.useState('ready'),[tabRecovered,setTabRecovered]=React.useState(false),[cardRecovered,setCardRecovered]=React.useState(false),toast=Toast.useToastManager();
 const status:CollectionStatus=phase==='empty'?'ready':phase as CollectionStatus;
 const shown=phase==='empty'||phase==='loading'?[]:rows;
 return <Stack>
  <Section title="Tabs 组合">
   <Tabs.Root defaultValue="overview"><Tabs.List aria-label="内容切换"><Tabs.Tab value="overview">概览</Tabs.Tab><Tabs.Tab value="settings">设置</Tabs.Tab><Tabs.Tab value="loading">加载中内容</Tabs.Tab><Tabs.Tab value="error">错误内容</Tabs.Tab><Tabs.Tab value="disabled" disabled>不可用</Tabs.Tab></Tabs.List>
    <Tabs.Panel value="overview"><Card title="工作区概览" badge={{label:'运行中',tone:'info'}}><Typography.Text>本周共有 12 个任务。</Typography.Text></Card></Tabs.Panel>
    <Tabs.Panel value="settings" keepMounted><Field label="工作区名称"><Input defaultValue="研究工作区"/></Field></Tabs.Panel>
    <Tabs.Panel value="loading"><LoadingState>正在读取所选内容</LoadingState></Tabs.Panel>
    <Tabs.Panel value="error">{tabRecovered?<Typography.Text>研究工作区 · 12 个任务</Typography.Text>:<ErrorState title="内容读取失败" retryLabel="重试" onRetry={()=>setTabRecovered(true)}/>}</Tabs.Panel>
   </Tabs.Root>
   <Tabs.Root defaultValue="current"><Tabs.List variant="segmented" aria-label="分段标签"><Tabs.Tab value="current">当前</Tabs.Tab><Tabs.Tab value="archive">已归档</Tabs.Tab><Tabs.Tab value="locked" disabled>受限</Tabs.Tab></Tabs.List><Tabs.Panel value="current"><Typography.Text>当前任务列表</Typography.Text></Tabs.Panel><Tabs.Panel value="archive"><Typography.Text>归档任务列表</Typography.Text></Tabs.Panel></Tabs.Root>
  </Section>
  <Section title="Card 常用槽位与状态"><Grid>
   <Card title="常用组合" badge={{label:'运行中',tone:'info'}} actions={<IconButton variant="text" aria-label="更多工作区操作" onClick={()=>toast.add({description:'已打开示例操作',type:'info'})}>⋯</IconButton>} footerMeta="更新于 10:32" footerActions={<Button variant="text" onClick={()=>toast.add({description:'已查看示例详情',type:'info'})}>查看详情</Button>}><Stack><Typography.Text>正在处理 3 个文件。</Typography.Text><Switch label="自动同步" defaultChecked/></Stack></Card>
   <Card title="加载内容"><LoadingState>正在读取工作区</LoadingState></Card>
   <Card title="只读内容" footerMeta="只读权限"><Field label="已确认名称"><Input value="研究工作区" readOnly/></Field></Card>
   <Card title="操作不可用" footerActions={<Button variant="text" disabled>编辑工作区</Button>}><Typography.Text>工作区内容仍可阅读。</Typography.Text></Card>
   <Card title="错误内容">{cardRecovered?<Typography.Text>研究工作区 · 12 个任务</Typography.Text>:<ErrorState title="工作区读取失败" retryLabel="重试读取" onRetry={()=>setCardRecovered(true)}/>}</Card>
  </Grid></Section>
  <Section title="MetricCard 指标状态"><Grid><MetricCard label="已确认任务数" value="12" marker={<Badge tone="success">已确认</Badge>}/><MetricCard label="正在读取任务数" value={<LoadingState layout="inline">读取中</LoadingState>}/><MetricCard label="未知任务数" value="—" marker={<Badge tone="warning">待确认</Badge>}/><MetricCard label="任务统计读取失败" value={<Typography.Text tone="error">读取失败</Typography.Text>} marker={<Badge tone="error">异常</Badge>}/></Grid></Section>
  <Section title="CardGroup 集合状态"><Stack>
   <ToggleGroup.Root aria-label="卡片集合状态" value={[phase]} allowEmpty={false} onValueChange={values=>{if(values[0])setPhase(values[0]);}}>{[['ready','正常'],['loading','首次加载'],['refreshing','刷新保留卡片'],['empty','空数据'],['error','刷新失败保留卡片']].map(([value,label])=><ToggleGroup.Item key={value} value={value}>{label}</ToggleGroup.Item>)}</ToggleGroup.Root>
   <CardGroup label="工作区卡片集合" rows={shown} rowKey={row=>row.id} status={status} hasValue={phase!=='loading'} labels={{loading:'正在加载卡片',empty:'暂无工作区',error:'刷新失败，保留已有工作区',retry:'重试',count:({rowCount})=>'已显示 '+rowCount+' 项'}} onRetry={()=>setPhase('ready')} renderCard={(row,context)=>({title:row.name,badge:{label:'公共',tone:'neutral'},children:<Typography.Text>{row.count} 个任务</Typography.Text>,footerMeta:'只读任务统计',footerActions:<Button variant="text" disabled={context.disabled} onClick={()=>toast.add({description:'已查看 '+row.name,type:'info'})}>查看详情</Button>})}/>
  </Stack></Section>
  <Section title="Disclosure / Accordion"><Grid>
   <Card title="折叠与只读内容"><Disclosure title="高级设置" defaultOpen><Field label="备注"><Textarea defaultValue="保留当前草稿"/></Field></Disclosure><Disclosure title="只读详情"><Field label="记录编号"><Input value="demo-001" readOnly/></Field></Disclosure><Disclosure title="禁用的分组" disabled>不可编辑</Disclosure></Card>
   <Card title="手风琴分组"><Accordion.Root defaultValue={['connection']}><Accordion.Item value="connection"><Accordion.Header><Accordion.Trigger>连接设置</Accordion.Trigger></Accordion.Header><Accordion.Panel><Field label="服务地址"><Input defaultValue="https://example.test"/></Field></Accordion.Panel></Accordion.Item><Accordion.Item value="history"><Accordion.Header><Accordion.Trigger>只读历史</Accordion.Trigger></Accordion.Header><Accordion.Panel><Typography.Text>最近更新于 10:32</Typography.Text></Accordion.Panel></Accordion.Item><Accordion.Item value="locked" disabled><Accordion.Header><Accordion.Trigger>受限分组</Accordion.Trigger></Accordion.Header><Accordion.Panel>不可用</Accordion.Panel></Accordion.Item></Accordion.Root></Card>
  </Grid></Section>
  <Separator/><Toolbar><Badge>布局容器保持可读</Badge><Typography.Text tone="muted">加载与错误归属内容区；禁用归属具体操作。</Typography.Text></Toolbar>
 </Stack>;
}
