import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeService,type ThemeMode,type ThemePreset} from '@coffeehc/xui-runtime/theme';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {Container,Grid,PageHeader,Stack,Toolbar,FormGrid,FormActions} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Card,Typography,Icon} from '@coffeehc/xui-react/display';
import {Badge,Progress,Spinner} from '@coffeehc/xui-react/feedback';
import {DataTable,type DataTableColumn} from '@coffeehc/xui-react/data-table';
import {SearchToolbar} from '@coffeehc/xui-react/search-toolbar';
import {Field,Input,Textarea,SimpleSelect,Switch} from '@coffeehc/xui-react/forms';
import {Tabs} from '@coffeehc/xui-react/tabs';
import {Menu} from '@coffeehc/xui-react/menu';
import {Sheet} from '@coffeehc/xui-react/sheet';
import {Toast} from '@coffeehc/xui-react/toast';
import '@coffeehc/xui-theme/style.css';
import './layout.css';
import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import {projectConfig} from './project-config';
bootstrap(projectConfig);

const params=new URLSearchParams(location.search);
const palettes:Record<ThemePreset,string>={violet:'电光紫 · 默认',ember:'熔岩橙',forest:'森林绿',crimson:'绯红',cobalt:'钴蓝',precision:'Precision 青色'};
function Glyph({kind='agent'}:{kind?:'agent'|'run'|'spark'}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" aria-hidden="true">{kind==='agent'?<><path d="M7 6h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z"/><path d="M12 2v4M8 11h1m6 0h1M8 16h8M1 10h3m16 0h3"/></>:kind==='run'?<><path d="m8 5 11 7-11 7V5Z"/></>:<><path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/></>}</svg>;}
type Row={id:string;name:string;agent:string;status:'info'|'success'|'warning'|'error';label:string;time:string};
const rows:Row[]=[
 {id:'T-1042',name:'整理公开模型的多模态能力与许可差异',agent:'研究员',status:'info',label:'正在分析',time:'14:32'},
 {id:'T-1041',name:'为知识库检索补充来源与引用',agent:'知识助手',status:'success',label:'已完成',time:'14:28'},
 {id:'T-1040',name:'审核工具调用所需的文件访问范围',agent:'执行助手',status:'warning',label:'等待确认',time:'14:24'},
 {id:'T-1039',name:'生成前端组件的交互回归用例',agent:'代码助手',status:'info',label:'正在执行',time:'14:18'},
 {id:'T-1038',name:'连接演示工作区的数据源',agent:'执行助手',status:'error',label:'连接失败',time:'14:12'},
 {id:'T-1037',name:'对比两个版本的接口兼容性',agent:'研究员',status:'success',label:'已完成',time:'14:05'},
];
function Notifications(){const manager=Toast.useToastManager();return <Toast.Portal><Toast.Viewport aria-label="通知">{manager.toasts.map(item=><Toast.Root key={item.id} toast={item}><Toast.Content><Toast.Title/><Toast.Description/><Toast.Actions><Toast.Close aria-label="关闭通知" render={<Button variant="ghost" size="sm"/>}>关闭</Toast.Close></Toast.Actions></Toast.Content></Toast.Root>)}</Toast.Viewport></Toast.Portal>;}
function Workspace(){
 const theme=React.useSyncExternalStore(ThemeService.subscribe,ThemeService.getState,ThemeService.getState),[tab,setTab]=React.useState<string|number|null>(params.get('view')==='chat'?'chat':'tasks'),[query,setQuery]=React.useState(''),[filter,setFilter]=React.useState('all'),[refreshing,setRefreshing]=React.useState(false),[detail,setDetail]=React.useState<Row|null>(null),[open,setOpen]=React.useState(false),[draft,setDraft]=React.useState('对比开源模型的推理能力与部署条件'),[automatic,setAutomatic]=React.useState(true);
 const toast=Toast.useToastManager(),returnFocus=React.useRef<HTMLButtonElement|null>(null);
 const choosePalette=(value:ThemePreset)=>ThemeService.setPreset(value);
 const chooseMode=(mode:ThemeMode)=>{ThemeService.setMode(mode);const url=new URL(location.href);url.searchParams.set('mode',mode);history.replaceState(null,'',url);};
 const show=(row:Row,trigger:HTMLButtonElement)=>{returnFocus.current=trigger;setDetail(row);setOpen(true);};
 const columns:DataTableColumn<Row>[]=[
  {id:'name',header:'任务',width:'22rem',cell:row=><Button variant="link" onClick={event=>show(row,event.currentTarget)}>{row.name}</Button>},
  {id:'agent',header:'智能体',width:'7rem',cell:row=>row.agent},
  {id:'status',header:'状态',width:'8rem',cell:row=><Badge tone={row.status}>{row.label}</Badge>},
  {id:'time',header:'更新',width:'5rem',cell:row=><Typography.Text tone="muted">{row.time}</Typography.Text>},
  {id:'actions',header:'操作',width:'5rem',cell:row=><Menu.Root><Menu.Trigger aria-label={`操作 ${row.id}`} render={<Button variant="ghost" size="sm"/>}>···</Menu.Trigger><Menu.Content><Menu.Item onClick={()=>toast.add({title:'任务编号',description:row.id})}>复制编号</Menu.Item><Menu.Item disabled={row.status==='info'} onClick={()=>toast.add({title:'归档操作预览',description:'此预览不修改真实记录。'})}>归档任务</Menu.Item><Menu.Separator/><Menu.Item tone="danger" onClick={()=>toast.add({title:'演示危险操作入口',description:'此预览不执行删除。'})}>删除任务</Menu.Item></Menu.Content></Menu.Root>},
 ];
 const filtered=rows.filter(row=>(!query||row.name.includes(query)||row.id.includes(query))&&(filter==='all'||row.status===filter));
 const actions=<><Button variant="outline" disabled={refreshing} onClick={()=>{setRefreshing(true);setTimeout(()=>setRefreshing(false),650);}}>{refreshing&&<Spinner/>}刷新</Button><Button onClick={()=>document.getElementById('task-name')?.focus()}><Icon><Glyph kind="spark"/></Icon>新建任务</Button></>;
 return <><MenuLayout title="AGENT / STUDIO" theme={ThemeService} label="工作导航" compactLabel="收起导航" expandLabel="展开导航" closeLabel="关闭导航" scrollMode="document" activeId={tab==='chat'?'chat':'tasks'} items={[{id:'workspace',label:'工作空间',group:true,children:[{id:'tasks',label:'智能体任务',href:'?view=tasks',icon:'folder'},{id:'chat',label:'会话',href:'?view=chat',icon:'message'},{id:'team',label:'团队与智能体',href:'?view=team',icon:'users'},{id:'knowledge',label:'知识与来源',href:'?view=knowledge',icon:'folder'}]},{id:'settings-group',label:'管理',group:true,children:[{id:'tools',label:'工具与连接',href:'?view=tools',icon:'settings'},{id:'settings',label:'工作区设置',href:'?view=settings',icon:'settings'}]}]} navigation={{navigate:request=>{if(request.id==='chat'||request.id==='tasks')setTab(request.id);else toast.add({title:'导航入口预览',description:'本次对比包含任务、会话、表单和弹层。'});}}}
  headerSlots={{brand:<Toolbar><Icon color="var(--action-secondary)"><Glyph/></Icon><strong>AGENT / STUDIO</strong></Toolbar>,breadcrumb:<Typography.Text tone="muted">工作空间 / 主题对照</Typography.Text>,actions:<Toolbar><span className="comparison-preset"><SimpleSelect aria-label="主题方案" value={theme.preset} onChange={event=>choosePalette(event.target.value as ThemePreset)}>{Object.entries(palettes).map(([value,label])=><option key={value} value={value}>{label}</option>)}</SimpleSelect></span><SimpleSelect aria-label="显示模式" value={theme.mode} onChange={event=>chooseMode(event.target.value as ThemeMode)}><option value="light">浅色</option><option value="dark">深色</option><option value="system">跟随系统</option></SimpleSelect></Toolbar>}}
  sidebarFooter={<Toolbar><Icon color="var(--action-secondary)"><Glyph kind="spark"/></Icon><Typography.Text>设计预览</Typography.Text></Toolbar>}
  pageHeader={<PageHeader title="智能体工作台" meta={<Badge variant="plain">合成演示数据</Badge>} actions={actions}/>}>
   <Stack><Tabs.Root value={tab} onValueChange={setTab}><Tabs.List aria-label="工作区视图"><Tabs.Tab value="tasks">任务与协作</Tabs.Tab><Tabs.Tab value="chat">会话阅读</Tabs.Tab><Tabs.Tab value="activity" disabled>运行历史</Tabs.Tab></Tabs.List>
   <Tabs.Panel value="tasks"><div className="comparison-columns"><Stack><div className="comparison-agents"><Card title="研究员" icon={<Glyph/>} badge={{label:'Research Agent',tone:'neutral',color:'var(--action-secondary)'}} description="拆解问题、交叉检索与核对来源。" footerMeta="工作区成员" footerActions={<Button variant="ghost" size="sm" onClick={()=>setTab('chat')}>发起会话 →</Button>}/><Card title="代码助手" icon={<Glyph kind="spark"/>} iconColor="var(--action-secondary)" badge={{label:'Code Agent',tone:'neutral',color:'var(--action-secondary)'}} description="编写代码、解释差异与补充测试。" footerMeta="工作区成员" footerActions={<Button variant="ghost" size="sm" onClick={()=>setTab('chat')}>发起会话 →</Button>}/></div>
   <DataTable label="智能体任务" rows={filtered} columns={columns} rowKey={row=>row.id} rowState={row=>({selected:detail?.id===row.id})} status={refreshing?'refreshing':'ready'} toolbar={<SearchToolbar search={<Input type="search" aria-label="搜索任务" placeholder="搜索任务名称或编号" value={query} onChange={event=>setQuery(event.target.value)}/>} actions={<SimpleSelect aria-label="任务状态" value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">全部状态</option><option value="info">执行中</option><option value="warning">等待确认</option><option value="success">已完成</option><option value="error">失败</option></SimpleSelect>}/>} pagination={{pageIndex:0,pageIndexOffset:0,pageSize:10,total:filtered.length,onPageChange:()=>{},onPageSizeChange:()=>{}}}/>
   </Stack><Card title="创建任务" icon={<Glyph kind="run"/>}><form onSubmit={event=>{event.preventDefault();toast.add({title:'演示任务已保存',description:'主题切换保留了表单内容。',type:'success'});}}><Stack><Field label="任务名称" required><Input id="task-name" required value={draft} onChange={event=>setDraft(event.target.value)}/></Field><Field label="执行智能体"><SimpleSelect defaultValue="research"><option value="research">研究员</option><option value="code">代码助手</option></SimpleSelect></Field><Field label="任务说明"><Textarea placeholder="目标、上下文与交付要求" defaultValue="保留完整来源，并列出需要人工判断的分歧。"/></Field><Switch label="完成后通知我" checked={automatic} onChange={event=>setAutomatic(event.target.checked)}/><FormActions><Button type="submit">创建任务</Button></FormActions></Stack></form></Card></div></Tabs.Panel>
   <Tabs.Panel value="chat"><div className="comparison-chat"><Card title="研究员" icon={<Glyph/>} badge={{label:'Research Agent',color:'var(--action-secondary)'}}><Stack><Typography.Text as="p">请对比两个开源模型的推理能力、部署条件与许可约束，并保留原始来源。</Typography.Text><Typography.Text as="p" tone="muted">已拆分为能力、部署与许可三个维度。接下来逐项核对资料，无法确认的内容会明确列出。</Typography.Text><Toolbar><Badge tone="info">正在核对来源</Badge><Progress aria-label="演示进度" value={2} max={3}/></Toolbar></Stack></Card><Field label="消息"><Textarea placeholder="输入消息…" defaultValue="请优先比较本地部署条件。"/></Field><FormActions><Button onClick={()=>toast.add({title:'消息已保留',description:'此页面仅用于主题与组件对照。'})}>发送消息</Button></FormActions></div></Tabs.Panel></Tabs.Root></Stack>
 </MenuLayout><Sheet.Root open={open} onOpenChange={setOpen}><Sheet.Content aria-label="任务详情" finalFocus={()=>returnFocus.current??false}><Sheet.Header><Sheet.Title>{detail?.name??'任务详情'}</Sheet.Title></Sheet.Header><Sheet.Body><Stack><Badge tone={detail?.status??'info'}>{detail?.label}</Badge><FormGrid><FormGrid.Item><Field label="任务编号"><Input readOnly value={detail?.id??''}/></Field></FormGrid.Item><FormGrid.Item><Field label="执行智能体"><Input readOnly value={detail?.agent??''}/></Field></FormGrid.Item><FormGrid.Item span="full"><Field label="复核说明"><Textarea defaultValue="这是相同数据、布局与公共组件的主题预览。"/></Field></FormGrid.Item></FormGrid></Stack></Sheet.Body><Sheet.Footer><FormActions secondary={<Sheet.Close render={<Button variant="outline"/>}>关闭详情</Sheet.Close>}><Button onClick={()=>{setOpen(false);toast.add({title:'演示更改已保存',type:'success'});}}>保存更改</Button></FormActions></Sheet.Footer></Sheet.Content></Sheet.Root><Notifications/></>;
}
createRoot(document.getElementById('root')!).render(<Toast.Provider><Workspace/></Toast.Provider>);
