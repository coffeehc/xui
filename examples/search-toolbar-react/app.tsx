import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {SearchToolbar,QueryForm,QueryField} from '@coffeehc/xui-react/search-toolbar';
import {Button,IconButton} from '@coffeehc/xui-react/button';
import {Card} from '@coffeehc/xui-react/display';
import {Input,Field,Textarea} from '@coffeehc/xui-react/forms';
import {AppShell,HeaderBrand,Container,Grid,PageHeader,Stack,Toolbar} from '@coffeehc/xui-react/layout';
import {Surface} from '@coffeehc/xui-react/feedback';
import {ScrollArea} from '@coffeehc/xui-react/scroll-area';
import {Dialog} from '@coffeehc/xui-react/dialog';
import '@coffeehc/xui-runtime/init.js';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
bootstrapBrowserExample();
import '@coffeehc/xui-theme/style.css';

declare global {interface Window {searchToolbarExample:{update():void;setExpanded(value:boolean):void;setAdvanced(value:boolean):void;setAccept(value:boolean):void}}}
function EditGlyph(){return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)"><path d="m16 3 5 5L9 20l-6 1 1-6Z"/></svg>;}
function DeleteGlyph(){return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>;}
function App(){
  const [revision,setRevision]=React.useState(0),[expanded,setExpanded]=React.useState(false),[requests,setRequests]=React.useState(0),[actions,setActions]=React.useState(0),[accept,setAccept]=React.useState(false),[advanced,setAdvanced]=React.useState(true);
  React.useEffect(()=>{window.searchToolbarExample={update:()=>setRevision(value=>value+1),setExpanded,setAdvanced,setAccept};},[]);
  const iconActions=(prefix:string)=><><IconButton variant="outline" disabled={new URLSearchParams(location.search).has('disabled-icons')} data-testid={prefix+'-outline'} aria-label={prefix+' 编辑长中文研究任务'} onClick={()=>setActions(value=>value+1)}><EditGlyph/></IconButton><Button variant="text" tone="danger" data-icon="true" disabled={new URLSearchParams(location.search).has('disabled-icons')} data-testid={prefix+'-marked'} aria-label={prefix+' 删除任务'} onClick={()=>setActions(value=>value+1)}><DeleteGlyph/></Button></>;
  const fields=(prefix:string)=><Grid><Field label={`${prefix} owner`}><Input defaultValue="Ada"/></Field><Field label={`${prefix} notes`} help={'高级条件较长的说明'.repeat(12)}><Textarea defaultValue="Keep this draft"/></Field><Button variant="outline" onClick={()=>setActions(value=>value+1)}>{'保存这一组高级条件'.repeat(12)}</Button></Grid>;
  return <Container style={{padding:'var(--layout-content-inset)'}}><Stack>
    <PageHeader title="SearchToolbar" description="合成示例；所有查询与动作由调用方拥有。"/>
    {new URLSearchParams(location.search).has('icon-actions')&&<>
      <SearchToolbar aria-label="图标组合工具栏" data-testid="icon-toolbar" defaultExpanded advancedLabel="图标高级条件" search={<Input aria-label="图标搜索草稿" defaultValue="保留搜索草稿"/>} actions={iconActions('toolbar')} advanced={<Toolbar>{iconActions('advanced')}<Input aria-label="高级条件草稿" defaultValue="保留高级草稿"/></Toolbar>}/>
      <QueryForm label="图标查询组合" data-testid="icon-query" fields={<QueryField label="查询范围"><Input defaultValue="保留查询范围"/></QueryField>} actions={iconActions('query')} advanced={<Toolbar>{iconActions('query-advanced')}</Toolbar>} advancedLabel="查询高级条件" disclosure={{defaultExpanded:true}} onSubmit={event=>event.preventDefault()}/>
      <Card title="图标操作对照" footerActions={iconActions('card')}/>
    </>}
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
function FocusScopeDemo(){
 const [sidebarOpen,setSidebarOpen]=React.useState(false);
 Object.assign(window,{focusScopeExample:{setSidebarOpen}});
 const controls=(prefix:string)=><Toolbar><IconButton variant="outline" data-testid={prefix+'-icon'} aria-label={prefix+' 编辑'}><EditGlyph/></IconButton><Button variant="outline" data-testid={prefix+'-text'}>查看记录</Button><Input data-testid={prefix+'-input'} aria-label={prefix+' 说明'} defaultValue="保留字段草稿" aria-invalid="true"/></Toolbar>;
 return <AppShell scrollMode="workspace" contentInset="edge" sidebarRevealOnHover={false} sidebarOpen={sidebarOpen} onSidebarOpenChange={setSidebarOpen} closeLabel="关闭范围导航" headerSlots={{brand:<HeaderBrand><IconButton variant="ghost" data-testid="brand-icon" aria-label="编辑品牌"><EditGlyph/></IconButton><a href="#workspace" data-testid="brand-text">研究</a></HeaderBrand>}} sidebarHeader={controls('sidebar')} sidebar={<span>研究工作区</span>}>
  <Stack>{controls('workspace')}
   <ScrollArea.Root><ScrollArea.Viewport focusMode="inset" aria-label="内描滚动区域" data-testid="scope-viewport" style={{blockSize:'var(--data-region-min-block-size)'}}><ScrollArea.Content><Stack>{controls('scroll')}<ScrollArea.Root><ScrollArea.Viewport focusMode="gutter" aria-label="嵌套留白区域" data-testid="scope-gutter">{controls('gutter')}</ScrollArea.Viewport></ScrollArea.Root></Stack></ScrollArea.Content></ScrollArea.Viewport></ScrollArea.Root>
   <Dialog.Root><Dialog.Trigger render={<Button variant="outline"/>}>打开范围弹窗</Dialog.Trigger><Dialog.Content><Dialog.Title>范围焦点检查</Dialog.Title><Dialog.CloseButton aria-label="关闭范围弹窗"/>
    <Dialog.Body>{controls('dialog')}<ScrollArea.Root><ScrollArea.Viewport focusMode="inset" aria-label="弹窗内描区域">{controls('dialog-scroll')}</ScrollArea.Viewport></ScrollArea.Root></Dialog.Body>
    <Dialog.Footer><Dialog.Close render={<Button variant="outline"/>}>完成范围检查</Dialog.Close></Dialog.Footer>
   </Dialog.Content></Dialog.Root>
  </Stack>
 </AppShell>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode>{new URLSearchParams(location.search).has('focus-scopes')?<FocusScopeDemo/>:<App/>}</React.StrictMode>);
