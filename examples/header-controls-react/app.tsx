import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {AppHeader,HeaderBrand,PageHeader,SidebarFooterContent,Stack,type HeaderLocaleOptions} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Input,NativeSelect} from '@coffeehc/xui-react/forms';
import {Avatar} from '@coffeehc/xui-react/avatar';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';
const query=new URLSearchParams(location.search),languages=[{value:'zh-CN',label:'简体中文'},{value:'en',label:'English'},{value:'de',label:'Deutsch',disabled:true}];
declare global {interface Window {headerDemo:any;themeRequests?:string[]}}
const root=createRoot(document.getElementById('root')!);
function App(){
  const [languageOptions,setOptions]=React.useState(languages),[longAccount,setAccountLong]=React.useState(query.has('long'));
  const [sidebarVisible,setSidebarVisible]=React.useState(true),[disabled,setDisabled]=React.useState(false);
  const [enabled,setEnabled]=React.useState(query.has('locale')),[value,setValue]=React.useState('zh-CN'),[show,setShow]=React.useState(query.has('slots')),[version,setVersion]=React.useState(0),[active,setActive]=React.useState('one'),[count,setCount]=React.useState(0),[labels,setLabels]=React.useState(false);
  const requests=React.useRef<string[]>([]),action=()=>setCount(n=>n+1),locale:HeaderLocaleOptions={enabled,disabled,value,options:languageOptions,label:labels?'Language':'语言',onValueChange:next=>{requests.current.push(next);if(!query.has('controlled'))setValue(next);}};
  window.headerDemo={setOptions,setAccountLong,setSidebarVisible,setDisabled,destroy:()=>root.unmount(),setEnabled,setValue,setSlots:setShow,update:()=>setVersion(n=>n+1),navigate:()=>setActive('two'),localize:()=>setLabels(true),getRequests:()=>requests.current,syncTheme:(mode:'light'|'dark'|'system')=>window.xuiTheme!.syncMode(mode)};
  const account=<Button size="sm" variant="ghost" onClick={action} aria-label="账号" data-testid="header-account"><Avatar.Root size="sm" aria-hidden="true" data-testid="header-account-avatar"><Avatar.Fallback>陈</Avatar.Fallback></Avatar.Root><span>{longAccount?'负责跨区域项目协作与知识库管理的长中文账号名称'.repeat(2):'账号'}</span></Button>;
  const headerSlots={leading:query.has('leading')?<span aria-label="平台安全区">◉</span>:undefined,brand:<HeaderBrand logo={query.has('brandImage')?<img src={'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="2048" viewBox="0 0 80 40"><path d="M0 0H80V40H0Z"/></svg>')} alt=""/>:<span>◈</span>}>{query.has('brandImage')?'跨区域项目协作与知识库管理工作台'.repeat(8):'示例工作台'}</HeaderBrand>,breadcrumb:<nav aria-label="位置"><a href="#project">项目</a></nav>,context:show?<Input aria-label="全局搜索" defaultValue="保留搜索"/>:undefined,status:<span data-testid="header-version">{query.has('compact')?'有新版本可升级 · ':''}更新 {version}</span>,actions:show?<Button onClick={action}>应用操作</Button>:undefined,auxiliary:show?<Button onClick={action}>扩展操作</Button>:undefined,account:show||query.has('compact')?account:undefined};
  const ordinary=<NativeSelect aria-label="普通表单选择" defaultValue="one"><option value="one">普通选项</option><option value="two">第二项</option></NativeSelect>;
  if(query.has('direct'))return <Stack className="xui"><AppHeader locale={locale} {...headerSlots}/>{ordinary}<p data-testid="count">{count}</p></Stack>;
  return <MenuLayout items={[{id:'one',label:'总览',href:'#one',icon:'home'},{id:'two',label:'设置',href:'#two',icon:'settings'},...Array.from({length:60},(_,i)=>({id:`row-${i}`,label:`很长的中文导航项目 ${i}`,href:`#row-${i}`,icon:'file'}))]} activeId={active} title="示例工作台" label="工作导航" compactLabel="收起导航" expandLabel="展开导航" scrollMode="viewport" locale={locale}
    themeLabels={labels?{light:'Light',dark:'Dark',system:'System',switchToLight:'Switch to light',switchToDark:'Switch to dark',switchToSystem:'Follow system'}:undefined}
    headerSlots={headerSlots}
    sidebarHeader={sidebarVisible&&show?<Button variant="ghost" onClick={action}><SidebarFooterContent icon={<span>项</span>}>当前工作区与项目</SidebarFooterContent></Button>:undefined}
    sidebarFooter={sidebarVisible?<Button variant="ghost" onClick={action}><SidebarFooterContent icon={<span>返</span>}>返回工作空间</SidebarFooterContent></Button>:undefined}
    pageHeader={show?<PageHeader title="个人设置" actions={<Button onClick={action}>页面操作</Button>}/>:undefined}
    pageToolbar={show?<Input aria-label="页面过滤" defaultValue="保留过滤"/>:undefined}
    pageFooter={show?<Button onClick={action}>页面底部操作</Button>:undefined}
    navigation={{navigate:request=>setActive(request.id)}}><Stack>{ordinary}<Input aria-label="正文草稿" defaultValue="保留正文"/><p data-testid="count">{count}</p>{Array.from({length:20},(_,i)=><p key={i}>正文记录 {i}</p>)}</Stack></MenuLayout>;
}
root.render(<App/>);
