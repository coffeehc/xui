import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout,type NavigationItem} from '@coffeehc/xui-react/menu-layout';
import {PageHeader,Stack} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input} from '@coffeehc/xui-react/forms';
import type {NavigationAdapter,NavigationMenuOptions} from '@coffeehc/xui-runtime/navigation';
import '@coffeehc/xui-theme/critical.css';
import data from '../shared/menu-data.json';

const items:readonly NavigationItem[]=data;
const matchLocation:NonNullable<NavigationMenuOptions['matchLocation']>=(_item,current,target)=>current.searchParams.get('page')===target.searchParams.get('page');
type TestOwner={update:(next:Partial<NavigationMenuOptions>)=>void;destroy:()=>void;mount:()=>void;calls:()=>string[]};
declare global {interface Window {menuDemo:TestOwner}}
const root=createRoot(document.getElementById('root')!);
let patch:Partial<NavigationMenuOptions>={};const calls:string[]=[];
let updateView:(next:Partial<NavigationMenuOptions>)=>void=()=>{};
const navigation:NavigationAdapter={canNavigate:request=>request.id!=='browser',navigate:request=>{
  calls.push(request.id);if(!request.sameLocation)history.pushState(null,'',request.url);
  updateView({location:location.href});
}};
function App(){
  const [options,setOptions]=React.useState<NavigationMenuOptions>({items,location:location.href,matchLocation,navigation,...patch});
  const [draft,setDraft]=React.useState('保留这份输入');
  updateView=next=>{patch={...patch,...next};setOptions(current=>({...current,...next}));};
  React.useEffect(()=>{const pop=()=>updateView({location:location.href});window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[]);
  const page=new URL(options.location??location.href).searchParams.get('page')??'overview';
  return <MenuLayout {...options} title="xui" label="工作导航" compactLabel="紧凑导航" expandLabel="展开导航" emptyLabel="暂无导航" skipLabel="跳到主内容" closeLabel="关闭导航">
    <Stack><PageHeader title={page==='overview'?'工作总览':items.flatMap(item=>[item,...item.children??[]]).find(item=>item.id===page)?.label??(page==='notes'?'项目资料与团队协作记录':'偏好设置')} actions={<Button onClick={()=>setDraft('新建记录')}>新建记录</Button>}/>
      <Field label="草稿" controlId="menu-draft"><Input id="menu-draft" value={draft} onChange={event=>setDraft(event.currentTarget.value)}/></Field>
      <p role="status" data-route>{page}</p><Button variant="outline" onClick={()=>updateView({items:options.items.length?[]:items})}>切换空菜单</Button>
    </Stack>
  </MenuLayout>;
}
function mount(){root.render(<App/>);}
window.menuDemo={update:next=>updateView(next),destroy:()=>root.render(null),mount,calls:()=>[...calls]};
if(!new URL(location.href).searchParams.has('page'))history.replaceState(null,'','?page=overview');
mount();
