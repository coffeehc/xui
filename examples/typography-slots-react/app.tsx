import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {AppHeader,PageHeader,Section,Stack,Toolbar,FormGrid,FormActions} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Fieldset,Input,Textarea,SimpleSelect,Checkbox,InputGroup} from '@coffeehc/xui-react/forms';
import {Typography,Card,Copyable,Tag,Image} from '@coffeehc/xui-react/display';
import {Badge,Alert,LoadingState,EmptyState,ErrorState} from '@coffeehc/xui-react/feedback';
import {MetricCard} from '@coffeehc/xui-react/metric-card';
import {DataTable} from '@coffeehc/xui-react/data-table';
import {NavigationMenu} from '@coffeehc/xui-react/menu-layout';
import {Disclosure,Pagination,Breadcrumbs} from '@coffeehc/xui-react/navigation';
import {Tabs} from '@coffeehc/xui-react/tabs';
import {Calendar} from '@coffeehc/xui-react/calendar';
import {Dialog} from '@coffeehc/xui-react/dialog';
import {Sheet} from '@coffeehc/xui-react/sheet';
import {Avatar} from '@coffeehc/xui-react/avatar';
import {Accordion} from '@coffeehc/xui-react/accordion';
import {Toast} from '@coffeehc/xui-react/toast';
import {Tooltip} from '@coffeehc/xui-react/tooltip';
import {Menu} from '@coffeehc/xui-react/menu';
import {ContextMenu} from '@coffeehc/xui-react/context-menu';
import {setInterfaceScale} from '@coffeehc/xui-runtime/theme';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';

/** Mark inherited text only: the example never supplies a font or private CSS. */
function Sample({id,role='body',children}:{id:string;role?:string;children:React.ReactNode}){
 return <span data-type-id={id} data-type-role={role}>{children}</span>;
}
function RecordViews(){
 const [view,setView]=React.useState('all');
 const params=new URLSearchParams(location.search),[layout,setLayout]=React.useState<'content'|'equal'>(params.get('tabs')==='equal'?'equal':'content'),[disabled,setDisabled]=React.useState(false),changes=React.useRef(0);
 Object.assign(window,{typographyTabsDemo:{setLayout,setDisabled,setView,snapshot:()=>({view,changes:changes.current})}});
 return <Tabs.Root value={view} onValueChange={value=>{changes.current++;setView(String(value));}} orientation={params.get('orientation')==='vertical'?'vertical':'horizontal'} dir={params.has('rtl')?'rtl':undefined}><Tabs.List layout={layout} activateOnFocus={params.has('activateOnFocus')} aria-label="记录视图">
  <Tabs.Tab value="all" data-type-id="tab" data-type-role="tab"><Tabs.Icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg></Tabs.Icon>运行网格（Grid）</Tabs.Tab>
  <Tabs.Tab value="logs"><Tabs.Icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)"><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="m7 8 4 4-4 4m6 0h4"/></svg></Tabs.Icon>遥测日志（Logs）</Tabs.Tab>
  <Tabs.Tab value="pipelines" disabled={disabled}><Tabs.Icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)"><path d="M3 3h6v6H3zM15 15h6v6h-6zM6 9v9h9M15 3h6v6h-6zM18 9v6"/></svg></Tabs.Icon>拓扑管道（Pipelines）</Tabs.Tab>
 </Tabs.List><Tabs.Panel value="all" keepMounted><Sample id="tab-content">当前记录内容</Sample></Tabs.Panel><Tabs.Panel value="logs" keepMounted><Field label="日志视图草稿" controlId="tab-log-draft"><Input defaultValue="切换视图后继续保留"/></Field></Tabs.Panel><Tabs.Panel value="pipelines" keepMounted>合成管道视图内容</Tabs.Panel></Tabs.Root>;
}
function OverlayParts({sheet=false}:{sheet?:boolean}){
 const Layer=sheet?Sheet:Dialog;
 return <Layer.Root><Layer.Trigger render={<Button variant="outline"/>}>{sheet?'打开抽屉':'打开对话框'}</Layer.Trigger><Layer.Content>
  <Layer.Header><Layer.Title><Sample id="overlay-title" role="section">核对长中文字段与文字角色</Sample></Layer.Title><Layer.Description><Sample id="overlay-description">说明使用正文角色，标题保持区域标题。</Sample></Layer.Description></Layer.Header>
  <Layer.Body><Stack><Sample id="overlay-body">正文区域保留独立滚动与输入草稿。</Sample><Field label="弹层草稿" controlId="overlay-draft"><Input defaultValue="不会因放大或主题变化丢失的草稿"/></Field>{Array.from({length:8},(_,i)=><Typography.Text as="p" key={i}>第 {i+1} 条完整中文说明：库维护字体，宿主只填领域事实和动作。</Typography.Text>)}</Stack></Layer.Body>
  <Layer.Footer><Sample id="overlay-footer">表单操作</Sample><Layer.Close render={<Button variant="outline"/>}>关闭面板</Layer.Close></Layer.Footer>
 </Layer.Content></Layer.Root>;
}
function Notifications(){
 const manager=Toast.useToastManager();
 return <><Button onClick={()=>manager.add({title:'操作已完成',description:'当前合成记录已保存。'})}>显示通知</Button><Toast.Viewport>{manager.toasts.map(toast=><Toast.Root key={toast.id} toast={toast}><Toast.Title data-type-id="toast-title" data-type-role="control">{toast.title}</Toast.Title><Toast.Description data-type-id="toast-description" data-type-role="meta">{toast.description}</Toast.Description><Toast.Close aria-label="关闭通知" render={<Button size="sm" variant="outline"/>}>关闭通知</Toast.Close></Toast.Root>)}</Toast.Viewport></>;
}
function App(){
 const [count,setCount]=React.useState(0);
 return <Stack>
  <AppHeader brand={<Sample id="brand" role="body-heading">文字角色样板</Sample>} breadcrumb={<Breadcrumbs><li><Sample id="breadcrumb">组件验收</Sample></li></Breadcrumbs>} context={<Sample id="context">当前工作空间</Sample>} status={<Sample id="header-status" role="meta">状态已核对</Sample>} auxiliary={<Sample id="auxiliary">辅助入口</Sample>} account={<Sample id="account">管理员</Sample>}/>
  <PageHeader title={<Sample id="page-title" role="page">组件文字由 xui 统一维护</Sample>} description={<Sample id="page-description">合成验收内容：检查公共 slot 的字体，而非宿主补丁。</Sample>} meta={<><Sample id="page-meta" role="meta">当前 1 项任务</Sample><Button size="sm" data-type-id="meta-button" data-type-role="control">元信息旁的动作</Button></>} actions={<Toolbar><Button onClick={()=>setCount(value=>value+1)}>执行合成操作</Button><OverlayParts/><OverlayParts sheet/></Toolbar>}/>
  <Section title={<Sample id="section-title" role="section">卡片与事实</Sample>}>
   <Card title="完整中文资源标题：公共卡片的标题与元信息有各自的文字角色" description="说明为次要正文，不把所有文本压成同一种字号。" badge={{label:'项目归属'}} footerMeta={<><Sample id="card-meta" role="meta">由团队维护</Sample><Typography.Link href="#source" data-type-id="meta-link" data-type-role="meta">来源</Typography.Link><LoadingState layout="inline"><Sample id="meta-loading" role="meta">同步中</Sample></LoadingState><Button size="xs" data-type-id="card-meta-button" data-type-role="control">操作</Button><Badge data-type-id="nested-badge" data-type-role="label">待审核</Badge></>} footerActions={<Button variant="outline">查看资源</Button>}><Sample id="card-body">卡片的领域正文</Sample><Field label="卡内字段" help={<Sample id="card-help" role="meta">字段帮助保留自己的字号。</Sample>} controlId="card-input"><Input defaultValue="卡片内的控件"/></Field></Card>
   <MetricCard label={<Sample id="metric-label" role="label">已完成任务</Sample>} value={<Sample id="metric-value" role="metric">12345</Sample>}/>
  </Section>
  <Section title="表单字段">
   <FormGrid><FormGrid.Item><Field required label={<Sample id="field-label" role="label">任务名称</Sample>} help={<Sample id="field-help" role="meta">用于识别当前任务</Sample>} error={<Sample id="field-error" role="meta">请核对名称与来源</Sample>} controlId="task-name"><Input defaultValue="长中文任务名称" data-type-id="input" data-type-role="control"/></Field></FormGrid.Item>
    <FormGrid.Item><Field label="所属项目" controlId="project"><SimpleSelect data-type-id="select" data-type-role="control"><option>当前项目</option></SimpleSelect></Field></FormGrid.Item>
    <FormGrid.Item span="full"><Field label="任务说明" controlId="notes"><Textarea data-type-id="textarea" data-type-role="control" defaultValue="完整中文说明与可修正草稿。"/></Field></FormGrid.Item>
    <FormGrid.Item><Field label="时长" controlId="duration"><InputGroup.Root><InputGroup.Input defaultValue="30"/><InputGroup.Addon><Sample id="addon" role="meta">分钟</Sample><InputGroup.Button data-type-id="addon-action" data-type-role="control">应用</InputGroup.Button></InputGroup.Addon></InputGroup.Root></Field></FormGrid.Item>
    <FormGrid.Item><Fieldset legend={<Sample id="legend" role="label">通知偏好</Sample>}><Checkbox label={<Sample id="choice-label" role="label">通知团队</Sample>}/></Fieldset></FormGrid.Item>
   </FormGrid><FormActions><Button data-type-id="button" data-type-role="control">保存任务</Button></FormActions>
  </Section>
  <Section title="列表与导航">
   <DataTable label="合成记录" rows={[{id:'one',name:'记录一'}]} rowKey={row=>row.id} columns={[{id:'name',header:<Sample id="table-head" role="label">记录名称</Sample>,cell:row=><Sample id="table-cell">{row.name}</Sample>},{id:'action',header:'操作',cell:()=> <Button size="sm" data-type-id="cell-button" data-type-role="control">查看</Button>}]} footer={<Sample id="table-footer" role="meta">数据来自合成样板</Sample>}/>
   <Pagination pageCount={3}/>
   <NavigationMenu label="样板导航" items={[{id:'group',label:'团队',group:true,children:[{id:'tasks',label:'研究任务与很长的中文工作空间名称',href:'#tasks'}]}]}/>
   <RecordViews/>
   <Disclosure title={<Sample id="disclosure" role="control">高级筛选与详细中文说明</Sample>} defaultOpen><Sample id="disclosure-body">折叠内容使用正文角色。</Sample></Disclosure>
   <Avatar.Root><Avatar.Fallback data-type-id="avatar" data-type-role="control">研</Avatar.Fallback></Avatar.Root>
   <Accordion.Root defaultValue={['advanced']}><Accordion.Item value="advanced"><Accordion.Header><Accordion.Trigger data-type-id="accordion-trigger" data-type-role="control">相关资料</Accordion.Trigger></Accordion.Header><Accordion.Panel><Sample id="accordion-content">相关资料正文</Sample></Accordion.Panel></Accordion.Item></Accordion.Root>
   <Calendar defaultMonth="2026-10" value="2026-10-16"/>
   <Toolbar><Menu.Root><Menu.Trigger render={<Button variant="outline"/>}>打开菜单</Menu.Trigger><Menu.Content><Menu.Group><Menu.GroupLabel><Sample id="menu-group" role="meta">记录操作</Sample></Menu.GroupLabel><Menu.Item><Sample id="menu-item" role="label">查看完整记录</Sample></Menu.Item></Menu.Group><Menu.Separator/><Menu.Group><Menu.Item tone="danger">删除</Menu.Item></Menu.Group></Menu.Content></Menu.Root>
    <ContextMenu.Root><ContextMenu.Trigger tabIndex={0}>右键记录区域</ContextMenu.Trigger><ContextMenu.Content><ContextMenu.Item><Sample id="context-item" role="label">查看记录详情</Sample></ContextMenu.Item><ContextMenu.Separator/><ContextMenu.Group><ContextMenu.Item tone="danger">删除记录</ContextMenu.Item></ContextMenu.Group></ContextMenu.Content></ContextMenu.Root></Toolbar>
  </Section>
  <Section title="反馈与技术内容">
   <Alert><Sample id="alert">当前任务需要人工复核。</Sample></Alert><LoadingState layout="inline"><Sample id="loading">局部同步中</Sample></LoadingState>
   <EmptyState title={<Sample id="empty-title" role="body-heading">尚无记录</Sample>}><Sample id="empty-body">创建后会显示在此区域。</Sample></EmptyState>
   <ErrorState title={<Sample id="error-title" role="body-heading">同步失败</Sample>}><Sample id="error-body">原有内容与筛选保留。</Sample></ErrorState>
   <Typography.Text data-type-id="text" data-type-role="body">普通正文</Typography.Text><Typography.Link href="#details" data-type-id="link" data-type-role="body">阅读详情</Typography.Link><Typography.Code value="record_2026_001" data-type-id="code" data-type-role="code"/>
   <Toast.Provider timeout={-1}><Notifications/></Toast.Provider>
   <Tooltip.Provider><Tooltip.Root><Tooltip.Trigger render={<Button variant="outline"/>}>查看简短说明</Tooltip.Trigger><Tooltip.Content><Sample id="tooltip" role="meta">简短中文说明</Sample></Tooltip.Content></Tooltip.Root></Tooltip.Provider>
   <Image src="" alt="资源缩略图" aspectRatio={2} fallback="缩略图暂不可用"/><Tag label="项目分类"/><Copyable value="record_2026_001" writeText={()=>{}} labels={{copy:'复制标识',copied:'已复制'}}/>
   <Toolbar aria-label="界面比例">{([1,1.25,1.5,2] as const).map(scale=><Button key={scale} onClick={()=>setInterfaceScale(scale)}>{scale*100}%</Button>)}</Toolbar><output aria-label="合成操作次数">{count}</output>
  </Section>
 </Stack>;
}
createRoot(document.getElementById('root')!).render(<App/>);
