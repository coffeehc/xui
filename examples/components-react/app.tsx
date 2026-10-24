import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Container,Stack,Section,Toolbar,PageHeader,Grid} from '@coffeehc/xui-react/layout';
import {Button,IconButton} from '@coffeehc/xui-react/button';
import {Alert,Badge,Progress,Spinner,Skeleton,LoadingState,EmptyState,ErrorState,DataRegion,RenderBoundary} from '@coffeehc/xui-react/feedback';
import {Field} from '@coffeehc/xui-react/forms';
import {PasswordStrengthInput} from '@coffeehc/xui-react/password';
import {Card,Typography,Icon} from '@coffeehc/xui-react/display';
import {Toast} from '@coffeehc/xui-react/toast';
import {Forms} from './inputs';
import {BreadcrumbExamples,Carousels} from './navigation-media';
import {Containers} from './containers';
import {Overlays} from './overlays';
import {Menus,Media} from './menus-media';
import {Tables,Uploads} from './collections';
const ChartPanel=React.lazy(()=>import('./charts').then(module=>({default:module.Charts})));
function Charts(){return <RenderBoundary fallback={()=><ErrorState title="图表示例暂时无法加载"/>}><React.Suspense fallback={<LoadingState>正在加载图表示例</LoadingState>}><ChartPanel/></React.Suspense></RenderBoundary>;}
import {bootstrap} from '@coffeehc/xui-runtime/bootstrap';
import {bindDemoPreferences} from '../shared/demo-preferences';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/style.css';
const section=new URLSearchParams(location.search).get('section')??'buttons';
const titles:Record<string,string>={buttons:'按钮与操作',forms:'表单与选择',feedback:'状态与进度',containers:'Tabs 与容器',overlays:'弹窗与浮层',menus:'菜单与操作配置',display:'文字与媒体',table:'数据表格',charts:'图表',upload:'文件上传',breadcrumbs:'面包屑',carousel:'走马灯'};
if(section==='upload'){
 const application=bootstrap({}, {services:{http:{options:{baseURL:location.origin,fetch:async(input,init)=>{
  const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.origin);
  if(url.origin!==location.origin||url.pathname!=='/api/demo/components/upload')throw new Error('Unexpected demo request');
  const signal=init?.signal;
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  if(url.searchParams.get('state')==='loading')return new Promise<Response>((_resolve,reject)=>signal?.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError')),{once:true}));
  const fail=url.searchParams.get('state')==='error',file=(init?.body as FormData).get('file') as File;
  return new Response(JSON.stringify({success:!fail,code:fail?503:1,message:fail?'合成上传故障':'',request_id:'synthetic-component-upload',payload:fail?null:{id:'synthetic-upload',name:file.name}}),{status:fail?503:200,headers:{'Content-Type':'application/json'}});
 }}}}});bindDemoPreferences(application.services.getThemeService());
}else bootstrapBrowserExample();
function Glyph(){return <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor"><path d="M10 3v14M3 10h14"/></svg>;}
function ForwardGlyph(){return <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor"><path d="M4 10h12m-5-5 5 5-5 5"/></svg>;}
function Buttons(){const [busy,setBusy]=React.useState(false),[calls,setCalls]=React.useState(0);return <Stack><Section title="Button"><Toolbar>{(['primary','secondary','outline','ghost','text','destructive','link'] as const).map(variant=><Button key={variant} variant={variant} onClick={()=>setCalls(v=>v+1)}>{variant}</Button>)}</Toolbar></Section><Section title="图标与文字"><Toolbar aria-label="图标文字按钮"><Button onClick={()=>setCalls(v=>v+1)}><Icon color="currentColor"><Glyph/></Icon>新建任务</Button><Button variant="outline" onClick={()=>setCalls(v=>v+1)}>下一步<Icon color="currentColor"><ForwardGlyph/></Icon></Button><Button aria-busy disabled><Spinner/>正在保存</Button><Button variant="outline" disabled><Icon color="currentColor"><Glyph/></Icon>暂不可用</Button></Toolbar></Section><Section title="尺寸"><Toolbar>{(['xs','sm','default','lg'] as const).map(size=><Button key={size} size={size} variant="outline">{size}</Button>)}</Toolbar></Section><Section title="状态"><Toolbar><Button disabled>不可用</Button><Button aria-busy={busy} disabled={busy} onClick={()=>setBusy(true)}>{busy&&<Spinner/>}{busy?'处理中':'开始处理'}</Button><Button variant="text" onClick={()=>setBusy(false)}>结束等待</Button><Badge>已操作 {calls} 次</Badge></Toolbar></Section><Section title="IconButton"><Toolbar>{(['primary','outline','ghost','text'] as const).map(variant=><IconButton key={variant} variant={variant} aria-label={`${variant} 添加`} onClick={()=>setCalls(v=>v+1)}><Glyph/></IconButton>)}<IconButton disabled aria-label="不可用添加"><Glyph/></IconButton></Toolbar></Section></Stack>;}
function Feedback(){
 const [value,setValue]=React.useState(40),[retried,setRetried]=React.useState(false),toast=Toast.useToastManager();
 return <Stack>
  <Section title="Badge / Alert"><Toolbar>{(['neutral','info','success','warning','error'] as const).map(tone=><Badge key={tone} tone={tone}>{tone}</Badge>)}</Toolbar><Grid>{(['info','success','warning','error'] as const).map(tone=><Alert key={tone} tone={tone}>{({info:'任务等待处理',success:'任务已完成',warning:'需要确认输入',error:'暂时无法完成操作'})[tone]}</Alert>)}</Grid></Section>
  <Section title="Progress / Spinner"><Grid><Card title="确定进度"><Stack><Progress aria-label="任务进度" value={value} max={100}/><Toolbar><Button variant="outline" onClick={()=>setValue(v=>(v+20)%120)}>更新进度</Button><Typography.Text>{value}%</Typography.Text></Toolbar></Stack></Card><Card title="未知进度"><Stack><Progress aria-label="等待进度"/><LoadingState layout="inline">等待服务确认</LoadingState></Stack></Card><Card title="已完成"><Progress aria-label="已完成进度" value={100} max={100}/></Card><Card title="密码强度条"><Field label="密码强度"><PasswordStrengthInput autoComplete="new-password"/></Field></Card></Grid></Section>
  <Section title="区域状态"><Grid>
   <Card title="读取中"><LoadingState>正在读取</LoadingState></Card>
   <Card title="没有记录"><EmptyState title="暂无记录" action={<Button variant="outline" onClick={()=>toast.add({description:'已开始创建示例',type:'info'})}>创建第一条</Button>}/></Card>
   <Card title="读取失败与恢复">{retried?<Stack><Typography.Text>研究工作区 · 12 个任务</Typography.Text><Typography.Text tone="muted">任务数据已恢复</Typography.Text></Stack>:<ErrorState title="暂时无法读取" retryLabel="重试" onRetry={()=>setRetried(true)}/>}</Card>
   <Card title="重试不可用"><ErrorState title="暂时无法读取" retryLabel="等待后重试" retryDisabled onRetry={()=>{}}/></Card>
   <Card title="骨架占位"><Stack><Skeleton/><Skeleton/></Stack></Card>
   <Card title="已有内容刷新"><DataRegion busy><Stack><Typography.Text>研究工作区 · 12 个任务</Typography.Text><Typography.Text tone="muted">已确认内容继续保留</Typography.Text><LoadingState layout="inline">正在同步更新</LoadingState></Stack></DataRegion></Card>
  </Grid></Section>
  <Section title="Toast"><Toolbar>{(['success','error','info'] as const).map(type=><Button key={type} variant="outline" onClick={()=>toast.add({description:({success:'修改已保存',error:'操作失败，请重试',info:'数据正在更新'})[type],type})}>{type}</Button>)}<Button variant="outline" onClick={()=>toast.add({description:'需要手动关闭的示例通知',type:'info',timeout:-1})}>保持显示</Button></Toolbar></Section>
 </Stack>;
}
const views:Record<string,React.ComponentType>={buttons:Buttons,forms:Forms,feedback:Feedback,containers:Containers,overlays:Overlays,menus:Menus,display:Media,table:Tables,charts:Charts,upload:Uploads,breadcrumbs:BreadcrumbExamples,carousel:Carousels};
const fullExamples:Record<string,string>={forms:'/widgets-react/',containers:'/card-group-react/',menus:'/action-menu-react/',display:'/display-react/',table:'/data-table-react/',charts:'/charts-react/',upload:'/upload-react/?embed'};
function App(){const View=views[section]??Buttons;return <Toast.Provider><Toast.View/><Container style={{padding:'var(--layout-content-inset)'}}><Stack><PageHeader title={titles[section]??titles.buttons} actions={fullExamples[section]?<Button variant="text" render={<a href={fullExamples[section]} target="_blank" rel="noopener"/>} nativeButton={false} role="link">完整交互示例</Button>:undefined}/><View/></Stack></Container></Toast.Provider>;}
createRoot(document.getElementById('root')!).render(<App/>);
