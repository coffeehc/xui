import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeService} from '@coffeehc/xui-runtime/theme';
import {Button} from '@coffeehc/xui-react/button';
import {Container,Stack,PageHeader} from '@coffeehc/xui-react/layout';
import {DataTable} from '@coffeehc/xui-react/data-table';
import {CardGroup} from '@coffeehc/xui-react/card-group';
import {EmptyState,Spinner} from '@coffeehc/xui-react/feedback';
import type {CollectionStatus} from '@coffeehc/xui-runtime/collection-view';
import '@coffeehc/xui-theme/style.css';
ThemeService.getState();
const parameters=new URLSearchParams(location.search),root=createRoot(document.getElementById('root')!);
const bridge={ready:false,status:(_value:CollectionStatus)=>{},destroy:()=>root.unmount(),requests:0};
Object.assign(window,{continuityDemo:bridge});
const initialRows=parameters.has('empty')?[]:[{id:'record-1',name:'同一条已确认的长中文记录'}];
function CollectionExample(){
 const [status,setStatus]=React.useState<CollectionStatus>('ready'),[hasValue,setHasValue]=React.useState(true);React.useLayoutEffect(()=>{bridge.status=value=>{if(value==='loading'||value==='idle')setHasValue(false);else if(value==='ready')setHasValue(true);setStatus(value);};bridge.ready=true;},[]);
 const busy=status==='loading'||status==='refreshing',pagination={mode:'cursor' as const,pageSize:10,total:null,nextCursor:'opaque-next',hasPrevious:false,onNext:()=>{bridge.requests++;}};
 const refresh=<Button disabled={busy} aria-busy={busy} onClick={()=>setStatus('refreshing')}><Spinner style={{visibility:busy?'visible':'hidden'}}/>刷新记录</Button>;
 return <Container><Stack><PageHeader title="集合刷新连续性" actions={refresh}/><DataTable label="表格记录" id="continuity-table" layout="document" rows={initialRows} rowKey={row=>row.id} labels={{count:({rowCount})=>`本页已读取 ${rowCount} 条合成记录`}} status={status} hasValue={hasValue} columns={[{id:'name',header:'名称',cell:row=><Button variant="link">{row.name}</Button>}]} emptyState={<EmptyState title="确认没有表格记录"/>} pagination={pagination}/><CardGroup label="卡片记录" id="continuity-cards" layout="document" rows={initialRows} rowKey={row=>row.id} labels={{count:({rowCount})=>`本页已读取 ${rowCount} 条合成记录`}} status={status} hasValue={hasValue} emptyState={<EmptyState title="确认没有卡片记录"/>} pagination={pagination} renderCard={row=>({title:row.name,children:<Button variant="link">查看该记录</Button>})}/><p>集合下方的下一段内容。</p></Stack></Container>;
}
root.render(<React.StrictMode><CollectionExample/></React.StrictMode>);
