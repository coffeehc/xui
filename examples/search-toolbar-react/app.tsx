import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {SearchToolbar} from '@coffeehc/xui-react/search-toolbar';
import {Button} from '@coffeehc/xui-react/button';
import {Input,Field,Textarea} from '@coffeehc/xui-react/forms';
import {Container,Grid,PageHeader,Stack,Toolbar} from '@coffeehc/xui-react/layout';
import {Surface} from '@coffeehc/xui-react/feedback';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';

declare global {interface Window {searchToolbarExample:{update():void;setExpanded(value:boolean):void;setAdvanced(value:boolean):void;setAccept(value:boolean):void}}}
function App(){
  const [revision,setRevision]=React.useState(0),[expanded,setExpanded]=React.useState(false),[requests,setRequests]=React.useState(0),[actions,setActions]=React.useState(0),[accept,setAccept]=React.useState(false),[advanced,setAdvanced]=React.useState(true);
  React.useEffect(()=>{window.searchToolbarExample={update:()=>setRevision(value=>value+1),setExpanded,setAdvanced,setAccept};},[]);
  const fields=(prefix:string)=><Grid><Field label={`${prefix} owner`}><Input defaultValue="Ada"/></Field><Field label={`${prefix} notes`} help={'高级条件较长的说明'.repeat(12)}><Textarea defaultValue="Keep this draft"/></Field><Button variant="outline" onClick={()=>setActions(value=>value+1)}>{'保存这一组高级条件'.repeat(12)}</Button></Grid>;
  return <Container style={{padding:'var(--layout-content-inset)'}}><Stack>
    <PageHeader title="SearchToolbar" description="合成示例；所有查询与动作由调用方拥有。"/>
    <Surface><SearchToolbar data-testid="default-toolbar" aria-label="记录搜索与操作" advancedLabel="高级筛选" search={<Input type="search" aria-label="Search records"/>} actions={<><Button size="xs" onClick={()=>setActions(value=>value+1)}>搜索</Button><Button size="lg" variant="outline" onClick={()=>setActions(value=>value+1)}>新增记录</Button></>} advanced={fields('Default')}/></Surface>
    <Surface><SearchToolbar data-testid="controlled-toolbar" aria-label="Controlled search" search={<Input aria-label="Controlled search"/>} actions={<Button onClick={()=>setRevision(value=>value+1)}>更新内容 {revision}</Button>} advancedLabel={`Controlled filters ${revision}`} expanded={expanded} onExpandedChange={next=>{setRequests(value=>value+1);if(accept)setExpanded(next);}} advanced={advanced?fields('Controlled'):null}/></Surface>
    <Toolbar><Button onClick={()=>setExpanded(true)}>程序展开</Button><Button onClick={()=>setExpanded(false)}>程序收起</Button><Button onClick={()=>setAccept(value=>!value)}>切换受控接受</Button><Button onClick={()=>setRevision(value=>value+1)}>更新槽内容</Button></Toolbar>
    <p className="xui-text" data-testid="counts">requests:{requests};actions:{actions};revision:{revision}</p>
    <SearchToolbar data-testid="initial-open" defaultExpanded advancedLabel="Initially expanded" advanced={<Input aria-label="Initially visible" defaultValue="Retained"/>}/>
    <SearchToolbar data-testid="search-only" search={<Input aria-label="Only search"/>}/>
    <SearchToolbar data-testid="actions-only" actions={<Button>Only action</Button>}/>
    <SearchToolbar data-testid="advanced-only" advancedLabel="Only advanced" advanced={<Input aria-label="Only advanced content"/>}/>
    <SearchToolbar data-testid="search-actions" search={<Input aria-label="Search with actions"/>} actions={<Button>Paired action</Button>}/>
    <SearchToolbar data-testid="search-advanced" search={<Input aria-label="Search with advanced"/>} advancedLabel="Paired search filters" advanced={<Input aria-label="Search paired advanced"/>}/>
    <SearchToolbar data-testid="actions-advanced" actions={<Button>Action with advanced</Button>} advancedLabel="Paired action filters" advanced={<Input aria-label="Action paired advanced"/>}/>
    <SearchToolbar data-testid="empty-toolbar" search={<></>} actions={[]} advanced={<>{false}</>}/>
  </Stack></Container>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
