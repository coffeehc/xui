import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {AppShell,HeaderBrand,Toolbar,Stack,Container,PageHeader,SidebarFooterContent} from '@coffeehc/xui-react/layout';
import {NavigationMenu} from '@coffeehc/xui-react/menu-layout';
import {Button} from '@coffeehc/xui-react/button';
import {Input,Field,SimpleSelect} from '@coffeehc/xui-react/forms';
import {SearchToolbar} from '@coffeehc/xui-react/search-toolbar';
import {Tabs} from '@coffeehc/xui-react/tabs';
import {ToggleGroup} from '@coffeehc/xui-react/toggle-group';
import {Badge} from '@coffeehc/xui-react/feedback';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/style.css';
const theme=bootstrapBrowserExample().services.getThemeService();
function Icon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" aria-hidden="true"><path d="M5 5h14v14H5zM9 9h6M9 13h6"/></svg>;}
function Tools({nested}:{nested:boolean}){
 const [value,setValue]=React.useState(''),[view,setView]=React.useState(['list']);
 const tools=<><Field label="筛选消息"><SimpleSelect aria-label="筛选消息"><option>全部消息与团队交流</option><option>已归档</option></SimpleSelect></Field><ToggleGroup.Root aria-label="显示方式" value={view} onValueChange={setView}><ToggleGroup.Item value="grid">卡片</ToggleGroup.Item><ToggleGroup.Item value="list">列表</ToggleGroup.Item></ToggleGroup.Root><Button variant="outline">刷新</Button></>;
 return <SearchToolbar data-testid={nested?'nested-toolbar':'direct-toolbar'} search={<Input aria-label={nested?'嵌套搜索':'直接搜索'} placeholder="搜索标题、摘要或来源" value={value} onChange={event=>setValue(event.target.value)}/>} actions={nested?<Toolbar style={{inlineSize:"var(--layout-field-min)",maxInlineSize:"100%"}}>{tools}</Toolbar>:tools} advancedLabel="更多筛选" advanced={<Field label="长中文条件"><Input aria-label={nested?'嵌套高级条件':'直接高级条件'} defaultValue="保留筛选草稿"/></Field>}/>;
}
function App(){
 const [range,setRange]=React.useState('active'),[selected,setSelected]=React.useState('member'),[calls,setCalls]=React.useState(0);
 const label='研发团队的长中文会话名称';
 const nav=<NavigationMenu label="会话列表" activeId={selected} defaultExpandedIds={['team']} showCollapseToggle={false} labelOverflow="marquee" actionAlignment="start" resolveIcon={()=>({viewBox:'0 0 24 24',paths:['M5 5h14v14H5zM9 9h6M9 13h6']})}
  expandBranchLabel={item=>`展开 ${item.label}`} collapseBranchLabel={item=>`收起 ${item.label}`}
  navigation={{navigate:request=>{setSelected(request.id);return true;}}}
  items={[{id:'team',label,href:'?session=team',icon:'team',children:[{id:'member',label:'团队经理',href:'?session=member',icon:'user'},{id:'research',label:'分析成员的长中文名称',href:'?session=research',icon:'user'}]},...Array.from({length:12},(_,index)=>({id:`session-${index}`,label:`研究会话 ${index+1}`,href:`?session=${index}`,icon:'session'}))]}
  renderAction={item=>item.id==='team'?<Button variant="ghost" data-icon="true" aria-label="配置团队" onClick={()=>setCalls(value=>value+1)}><Icon/></Button>:null}
  renderLabel={item=><Toolbar><NavigationMenu.Label>{item.label}</NavigationMenu.Label>{item.id==='team'?<Badge>就绪</Badge>:null}</Toolbar>}/>;
 if(new URLSearchParams(location.search).has('toolbar'))return <Container><Stack><PageHeader title="工具栏组合"/><Tools nested/><Tools nested={false}/></Stack></Container>;
 return <Tabs.Root value={range} onValueChange={value=>setRange(String(value))}><AppShell theme={theme} scrollMode="workspace" navigationLabel="搜索会话" closeLabel="关闭导航" headerSlots={{brand:<HeaderBrand>轻舟工作台</HeaderBrand>}} sidebarHeader={<Stack><Toolbar><Button variant="ghost">新会话</Button><Button variant="ghost">新团队</Button><Button variant="ghost" data-icon="true" aria-label="刷新会话"><Icon/></Button></Toolbar><Button variant="ghost">主Agent</Button><Input aria-label="搜索会话名称" placeholder="搜索会话名称、目标或类型"/></Stack>}
 sidebarTabs={<Tabs.List aria-label="会话范围" variant="line">{[['active','当前'],['plugin','插件会话'],['team','团队'],['archived','已归档']].map(([value,label])=><Tabs.Tab key={value} value={value}>{label}</Tabs.Tab>)}</Tabs.List>}
 sidebar={<Tabs.Panel value={range}>{nav}</Tabs.Panel>}
 sidebarFooter={<Button variant="ghost" onClick={()=>setCalls(value=>value+1)}><SidebarFooterContent icon={<Icon/>}>codex_setup_ed132da37ae8_长中文账户名称</SidebarFooterContent></Button>}>
 <PageHeader title="工作区"/><Field label="正文草稿"><Input aria-label="正文草稿" defaultValue="切换断点保留草稿"/></Field><output aria-label="操作次数">{calls}</output>
 </AppShell></Tabs.Root>;
}
createRoot(document.getElementById('root')!).render(<App/>);
