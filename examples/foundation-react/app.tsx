import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {AppShell,Container,PageHeader,Toolbar,Section,Grid,Stack} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input,Textarea,SimpleSelect,Fieldset,Checkbox,Radio} from '@coffeehc/xui-react/forms';
import {Nav,NavItem,Breadcrumbs,Pagination} from '@coffeehc/xui-react/navigation';
import {Table,TableContainer,TableCaption,TableHead,TableBody,TableRow,TableHeaderCell,TableCell,SortButton} from '@coffeehc/xui-react/table';
import {DataRegion,LoadingState,EmptyState,ErrorState,Skeleton,RenderBoundary,useResource} from '@coffeehc/xui-react/feedback';
import {useTheme} from '@coffeehc/xui-react/theme';
import {createResource,loadStylesheet} from '@coffeehc/xui-runtime/loading';
import type {ThemeMode} from '@coffeehc/xui-runtime/theme';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/critical.css';
import '@coffeehc/xui-theme/floating.css';

declare global{interface Window{foundationHost?:unknown;foundationStartup?:{ready:()=>void}}}
const theme=bootstrapBrowserExample().services.getThemeService();
let attempt=0,style:HTMLLinkElement|undefined,firstPanel:React.ComponentType|undefined;
const resource=createResource<React.ComponentType>({timeoutMs:5000,loader:async(_key,signal)=>{
  let owned:HTMLLinkElement|undefined;
  const css=style?.isConnected?Promise.resolve(style):loadStylesheet('./optional.css',{signal}).then(link=>{owned=link;if(signal.aborted)link.remove();return link;});
  try{
    const moduleUrl=new URL(`./heavy-panel.js?attempt=${++attempt}`,location.href);
    const [module,link]=await Promise.all([import(moduleUrl.href),css]);
    if(signal.aborted){owned?.remove();throw new DOMException('Cancelled','AbortError');}
    style=link;firstPanel??=module.Panel;return firstPanel!;
  }catch(error){owned?.remove();throw error;}
}});
window.addEventListener('pagehide',()=>{resource.destroy();style?.remove();},{once:true});
const records=[{id:'A-01',name:'资料整理',status:'进行中'},{id:'A-02',name:'界面检查',status:'待处理'},{id:'A-03',name:'长期运行记录',status:'已完成'}];
function App(){
  React.useEffect(()=>{window.foundationStartup?.ready();},[]);
  const [page,setPage]=React.useState('list'),[sidebar,setSidebar]=React.useState(false),[query,setQuery]=React.useState(''),[ascending,setAscending]=React.useState(true),[selected,setSelected]=React.useState<string[]>([]),[note,setNote]=React.useState('保留输入，再调整外观。'),[notify,setNotify]=React.useState('inbox'),[name,setName]=React.useState('新记录'),[error,setError]=React.useState(''),[saved,setSaved]=React.useState(false);
  const appearance=useTheme(theme),load=useResource(resource);const Panel=load.value;
  const filtered=records.filter(record=>record.name.includes(query)).sort((a,b)=>ascending?a.id.localeCompare(b.id):b.id.localeCompare(a.id));
  const navigate=(next:string)=>{setPage(next);setSidebar(false);};
  return <AppShell navigationLabel="打开导航" closeLabel="关闭导航" skipLabel="跳到主内容" sidebarOpen={sidebar} onSidebarOpenChange={setSidebar} header={<><strong>xui</strong><span>工作记录</span></>} sidebar={<Nav aria-label="工作导航">{[['list','列表'],['form','表单'],['details','详情']].map(([value,label])=><NavItem key={value} href={`#${value}`} selected={page===value} onClick={event=>{event.preventDefault();navigate(value);}}>{label}</NavItem>)}</Nav>}>
  <Container><Stack><PageHeader title={page==='list'?'记录列表':page==='form'?'编辑记录':'记录详情'} description={page==='list'?'当前共三条记录':page==='form'?(saved?'已保存':'草稿尚未保存'):'资料整理 · 进行中'} actions={<Button onClick={()=>page==='form'?document.getElementById('save-record')?.click():navigate('form')}>{page==='form'?'保存记录':'新建记录'}</Button>}/>
  <Toolbar aria-label="显示设置"><Field label="外观"><SimpleSelect value={appearance.mode} onChange={event=>theme.setMode(event.target.value as ThemeMode)}><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></SimpleSelect></Field></Toolbar>
  {page==='list'&&<Section title="所有记录"><Toolbar aria-label="列表筛选"><Field label="搜索记录"><Input value={query} onChange={event=>setQuery(event.target.value)}/></Field><Button variant="outline" onClick={()=>setQuery('')} disabled={!query}>清除搜索</Button></Toolbar>{filtered.length?<TableContainer aria-label="记录表格"><Table><TableCaption>记录与当前状态</TableCaption><TableHead><TableRow><TableHeaderCell>选择</TableHeaderCell><TableHeaderCell aria-sort={ascending?'ascending':'descending'}><SortButton onClick={()=>setAscending(!ascending)}>编号 {ascending?'↑':'↓'}</SortButton></TableHeaderCell><TableHeaderCell>名称</TableHeaderCell><TableHeaderCell>状态</TableHeaderCell></TableRow></TableHead><TableBody>{filtered.map(record=><TableRow key={record.id} selected={selected.includes(record.id)}><TableCell><Checkbox label={`选择 ${record.name}`} checked={selected.includes(record.id)} onChange={event=>setSelected(event.target.checked?[...selected,record.id]:selected.filter(id=>id!==record.id))}/></TableCell><TableCell>{record.id}</TableCell><TableCell><Button variant="ghost" onClick={()=>navigate('details')}>{record.name}</Button></TableCell><TableCell>{record.status}</TableCell></TableRow>)}</TableBody></Table></TableContainer>:<EmptyState title="没有匹配记录" action={<Button onClick={()=>setQuery('')}>清除条件</Button>}/>}<Pagination pageCount={1} previousLabel="上一页" nextLabel="下一页"/></Section>}
  {page==='form'&&<Section title="基本信息"><form noValidate className="xui-stack" onSubmit={event=>{event.preventDefault();const invalid=!name.trim();setError(invalid?'请填写名称，草稿未保存。':'');setSaved(!invalid);if(invalid)document.getElementById('record-name')?.focus();}}><Grid><Field controlId="record-name" label="名称" required error={error}><Input value={name} onChange={event=>{setName(event.target.value);setSaved(false);}}/></Field><Field label="备注"><Textarea value={note} onChange={event=>setNote(event.target.value)}/></Field></Grid><Fieldset legend="通知方式"><Radio name="notify" value="inbox" label="站内" checked={notify==='inbox'} onChange={()=>setNotify('inbox')}/><Radio name="notify" value="email" label="邮件" checked={notify==='email'} onChange={()=>setNotify('email')}/></Fieldset><Toolbar><Button id="save-record" type="submit">确认保存</Button><Button variant="outline" onClick={()=>navigate('list')}>取消编辑</Button></Toolbar>{saved&&<p role="status">记录已保存在示例内存中。</p>}</form></Section>}
  {page==='details'&&<Section title="基本信息"><Breadcrumbs aria-label="当前位置"><li><a href="#list" onClick={event=>{event.preventDefault();navigate('list');}}>记录</a></li><li aria-current="page">资料整理</li></Breadcrumbs><dl className="xui-details"><dt>编号</dt><dd>A-01</dd><dt>名称</dt><dd>资料整理</dd><dt>状态</dt><dd>进行中</dd></dl><Button render={<a href="#list"/>} nativeButton={false} role="link" variant="outline" onClick={event=>{event.preventDefault();navigate('list');}}>返回列表</Button></Section>}
  <Section title="附加工具" actions={<><Button variant="outline" disabled={load.busy} aria-busy={load.busy} onClick={()=>load.status==='error'?resource.retry():resource.load('tools')}>{load.hasValue?'刷新工具':'打开工具'}</Button>{load.busy&&<Button variant="ghost" onClick={()=>resource.cancel()}>取消加载</Button>}</>}><DataRegion busy={load.busy} aria-label="工具区域" feedback={<>{load.busy&&<LoadingState>{load.status==='refreshing'?'正在刷新，保留当前内容。':load.status==='retrying'?'正在重试。':'正在加载工具。'}</LoadingState>}{load.status==='error'&&<ErrorState title="工具加载失败" retryLabel="重试工具" onRetry={()=>resource.retry()}>现有记录和草稿仍可使用。</ErrorState>}</>}>
  {load.hasValue&&Panel?<RenderBoundary fallback={(_error,reset)=><ErrorState title="工具显示失败" retryLabel="重新显示" onRetry={reset}/>}><Panel/></RenderBoundary>:load.busy?<Skeleton/>:<EmptyState title="工具尚未打开"/>}</DataRegion></Section>
  </Stack></Container></AppShell>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
