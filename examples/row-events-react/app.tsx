import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {DataTable,type DataTableColumn,type DataTableRowContext} from '@coffeehc/xui-react/data-table';
import {Button} from '@coffeehc/xui-react/button';
import {Checkbox} from '@coffeehc/xui-react/forms';
import {Stack,Toolbar} from '@coffeehc/xui-react/layout';
import '@coffeehc/xui-theme/style.css';
type Row={id:string;name:string;revision:number};
const records:Row[]=Array.from({length:6},(_,i)=>({id:'row-'+(i+1),name:'共享目录 '+(i+1)+' '+ '长中文目录名称完整保留'.repeat(2),revision:1}));
function App(){
 const [data,setData]=React.useState(records),[page,setPage]=React.useState(0),[reverse,setReverse]=React.useState(false),[refresh,setRefresh]=React.useState(false),[disabled,setDisabled]=React.useState(false),[empty,setEmpty]=React.useState(false);
 const [double,setDouble]=React.useState(0),[cellCalls,setCellCalls]=React.useState(0),[clicks,setClicks]=React.useState(0),[keys,setKeys]=React.useState(0),[contextCalls,setContextCalls]=React.useState(0),[last,setLast]=React.useState('');
 const ordered=reverse?[...data].reverse():data,rows=empty?[]:ordered.slice(page*3,page*3+3);
 const open=(row:Row)=>{setCellCalls(count=>count+1);setLast(row.id+' r'+row.revision);};
 const columns:DataTableColumn<Row>[]=[
  {id:'name',header:'名称',sticky:'start',width:'8rem',cell:(row,context)=><Button variant="link" disabled={context.disabled} onClick={()=>open(row)} aria-label={'打开 '+row.id}>{row.name}</Button>},
  {id:'details',header:'路径',width:'30rem',cell:row=><span tabIndex={0} aria-label={'读取 '+row.id}>{'/共享目录/'+row.id+'/详情 '+ '可读取长中文事实，行双击仅作为快捷入口。'.repeat(3)}</span>},
  {id:'actions',header:'独立动作',width:'14rem',cell:(row,context)=><div className="xui-table-actions"><Button disabled={context.disabled} onClick={()=>open(row)} aria-label={'按钮 '+row.id}>按钮</Button><Button variant="link" render={<a href={'#'+row.id}/>} nativeButton={false} role="link" onClick={event=>event.preventDefault()} aria-label={'链接 '+row.id}>链接</Button><Checkbox label={'勾选 '+row.id} disabled={context.disabled}/></div>}
 ];
 const update=()=>setData(rows=>rows.map(row=>({...row,revision:row.revision+1})));
 const rowDouble=(row:Row,context:DataTableRowContext)=>{setDouble(count=>count+1);setLast(row.id+' r'+row.revision+' index '+context.rowIndex+' key '+context.rowKey);};
 return <Stack style={{padding:'var(--space-section-gap)'}}><h1>共享目录行事件</h1><Toolbar>
  <Button onClick={()=>setReverse(value=>!value)}>排序</Button><Button onClick={update}>更新数据</Button><Button onClick={()=>setRefresh(value=>!value)}>刷新状态</Button><Button onClick={()=>setDisabled(value=>!value)}>禁用状态</Button><Button onClick={()=>setEmpty(value=>!value)}>空数据</Button>
 </Toolbar><output aria-label="事件结果">{'double '+double+' cell '+cellCalls+' clicks '+clicks+' keys '+keys+' context '+contextCalls+' | '+last}</output>
 <div style={{blockSize:'var(--layout-table-viewport-height)',minBlockSize:0}}><DataTable label="共享目录" layout="workspace" rows={rows} columns={columns} rowKey={row=>row.id} striped status={refresh?'refreshing':'ready'} disabled={disabled}
  rowState={row=>({selected:row.id==='row-1',expanded:row.id==='row-2'})}
  rowEvents={{onDoubleClick:rowDouble,onClick:()=>setClicks(count=>count+1),onContextMenu:(row,context,event)=>{event.preventDefault();setContextCalls(count=>count+1);},onKeyDown:(row,context,event)=>{if(event.key==='Enter'){event.preventDefault();setKeys(count=>count+1);setLast(row.id+' r'+row.revision+' index '+context.rowIndex+' key '+context.rowKey);}}}}
  pagination={{mode:'cursor',pageSize:3,total:null,nextCursor:page===0?'page-2':null,hasPrevious:page>0,onNext:()=>setPage(1),onPrevious:()=>setPage(0)}}/></div>
 </Stack>;
}
createRoot(document.getElementById('root')!).render(<App/>);
