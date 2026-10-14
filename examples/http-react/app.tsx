import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {MenuLayout} from '@coffeehc/xui-react/menu-layout';
import {PageHeader,Stack,Toolbar} from '@coffeehc/xui-react/layout';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input,SimpleSelect} from '@coffeehc/xui-react/forms';
import {useResource,DataRegion,LoadingState,ErrorState,EmptyState,Alert} from '@coffeehc/xui-react/feedback';
import {Table,TableContainer,TableCaption,TableHead,TableBody,TableRow,TableHeaderCell,TableCell} from '@coffeehc/xui-react/table';
import {Pagination} from '@coffeehc/xui-react/navigation';
import {getHttpErrorMessage} from '@coffeehc/xui-runtime/http';
import type {WebfacadeQuery} from '@coffeehc/xui-runtime/query';
import {createExampleHttpOwner,contract,initialQuery} from '../shared/http-model';
import '@coffeehc/xui-theme/critical.css';
import '@coffeehc/xui-theme/floating.css';
const listeners=new Set<()=>void>();let authCount=0;
const owner=createExampleHttpOwner({baseURL:new URL('/api/xui-example/',location.href).href,onUnauthorized(){authCount++;listeners.forEach(listener=>listener());}});
function App(){
  const state=useResource(owner.resource),[query,setQuery]=React.useState(initialQuery),[name,setName]=React.useState('');
  const count=React.useSyncExternalStore(listener=>{listeners.add(listener);return()=>{listeners.delete(listener);};},()=>authCount,()=>0);
  const change=(next:WebfacadeQuery)=>{setQuery(next);void owner.load(next);};
  React.useEffect(()=>{void owner.load(initialQuery);},[]);
  return <MenuLayout title="xui" label="资料导航" items={[{id:'records',label:'记录',icon:'folder',href:location.pathname}]} activeId="records"><Stack>
    <PageHeader title="记录查询" actions={<Button disabled={state.busy} onClick={()=>owner.load(query)}>刷新记录</Button>}/>
    <Toolbar aria-label="记录筛选"><Field label="名称" controlId="http-name"><Input id="http-name" value={name} onChange={event=>setName(event.currentTarget.value)}/></Field><Button onClick={()=>change({...query,page_index:contract.pageIndexOffset,filters:{name}})}>应用筛选</Button><Field label="排序" controlId="http-sort"><SimpleSelect id="http-sort" value={query.sort?.[0]?.order??'asc'} onChange={event=>change({...query,page_index:contract.pageIndexOffset,sort:[{field:'name',order:event.currentTarget.value as 'asc'|'desc'}]})}><option value="asc">名称升序</option><option value="desc">名称降序</option></SimpleSelect></Field><Button className="xui-reserved-action" data-inactive={!state.busy} aria-hidden={!state.busy||undefined} tabIndex={state.busy?undefined:-1} disabled={!state.busy} variant="outline" onClick={()=>owner.resource.cancel()}>取消读取</Button></Toolbar>
    {count>0&&<Alert tone="warning">需要重新认证。认证请求已交给宿主处理：<span data-auth-count>{count}</span></Alert>}
    <DataRegion aria-label="记录结果" busy={state.busy} feedback={state.busy?<LoadingState>{state.hasValue?'正在刷新，保留现有记录。':'正在读取记录。'}</LoadingState>:state.status==='error'?<ErrorState title="读取失败" onRetry={()=>owner.resource.retry()} retryLabel="重试读取">{getHttpErrorMessage(state.error)}</ErrorState>:null}>
      {state.hasValue&&<><p role="status" data-total>共 {state.value!.total??'未知'} 条</p>{state.value!.list.length?<TableContainer aria-label="参考记录表格"><Table><TableCaption>合成参考记录</TableCaption><TableHead><TableRow><TableHeaderCell scope="col">名称</TableHeaderCell><TableHeaderCell scope="col">创建时间</TableHeaderCell></TableRow></TableHead><TableBody>{state.value!.list.map(record=><TableRow key={record.id}><TableCell>{record.name}</TableCell><TableCell>{record.created}</TableCell></TableRow>)}</TableBody></Table></TableContainer>:<EmptyState title="没有匹配记录"/>}
      {state.value!.total!==null&&<Pagination page={query.page_index-contract.pageIndexOffset+1} pageCount={Math.max(1,Math.ceil(state.value!.total/query.page_size))} onPageChange={page=>change({...query,page_index:page-1+contract.pageIndexOffset})} disabled={state.busy} previousLabel="上一页" nextLabel="下一页"/>}</>}
    </DataRegion>
  </Stack></MenuLayout>;
}
const root=createRoot(document.getElementById('root')!);root.render(<App/>);
(window as Window & {httpDemo?:unknown}).httpDemo={owner,refresh:()=>owner.resource.retry(),destroy(){root.unmount();owner.destroy();}};
