import * as React from 'react';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input} from '@coffeehc/xui-react/forms';
import {Card,Typography} from '@coffeehc/xui-react/display';
import {Stack,Grid,Section,Toolbar} from '@coffeehc/xui-react/layout';
import {Badge,Spinner} from '@coffeehc/xui-react/feedback';
import {DataTable,type DataTableColumn,type DataTableLabels} from '@coffeehc/xui-react/data-table';
import {SearchToolbar} from '@coffeehc/xui-react/search-toolbar';
import {createResource} from '@coffeehc/xui-runtime/loading';
import {SortButton} from '@coffeehc/xui-react/table';
import {Upload} from '@coffeehc/xui-react/upload';
import {createUploadController,UploadService} from '@coffeehc/xui-runtime/upload';
import {Toast} from '@coffeehc/xui-react/toast';

type Row={id:string;name:string;status:string};
const rows:readonly Row[]=[{id:'task-001',name:'整理研究资料',status:'运行中'},{id:'task-002',name:'跨区域研发与运营协作的长中文任务名称',status:'待处理'},{id:'task-003',name:'归档本周报告',status:'已完成'}];
const tableLabels:Partial<DataTableLabels>={loading:'正在读取任务',refreshing:'正在刷新任务',idle:'执行查询后查看任务',empty:'暂无任务',noMatches:'没有匹配的任务',error:'任务读取失败',retry:'重试',pageSize:'每页条数',pagination:'任务分页',previous:'上一页',next:'下一页',count:({rowCount,total})=>total===null?'已显示 '+rowCount+' 条':'本页 '+rowCount+' 条，共 '+total+' 条'};
const readonlyColumns:readonly DataTableColumn<Row>[]=[{id:'name',header:'任务名称',width:'var(--query-field-min)',cell:row=>row.name},{id:'status',header:'状态',cell:row=><Badge tone={row.status==='已完成'?'success':'info'}>{row.status}</Badge>}];

export function Tables(){
 const [reverse,setReverse]=React.useState(false),[page,setPage]=React.useState(0),[size,setSize]=React.useState(2),[retry,setRetry]=React.useState(false),[refreshRecovered,setRefreshRecovered]=React.useState(false),toast=Toast.useToastManager();
 const [resource]=React.useState(()=>createResource<readonly Row[]>({loader:async(_key,signal,context)=>{
  await new Promise<void>((resolve,reject)=>{const timer=setTimeout(resolve,650);signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));},{once:true});});
  return rows.map((row,index)=>index===0?{...row,status:context.request%2===0?'已完成':'运行中'}:row);
 }}));
 const snapshot=React.useSyncExternalStore(resource.subscribe,resource.getState,resource.getState);
 React.useEffect(()=>{void resource.load('tasks');return()=>resource.destroy();},[resource]);
 const sorted=[...(snapshot.value??[])].sort((a,b)=>(reverse?-1:1)*a.name.localeCompare(b.name,'zh-CN'));
 const status=snapshot.busy?(snapshot.hasValue?'refreshing':'loading'):snapshot.status==='error'?'error':'ready';
 const columns:readonly DataTableColumn<Row>[]=[{...readonlyColumns[0],ariaSort:reverse?'descending':'ascending',header:<SortButton onClick={()=>setReverse(value=>!value)}>任务名称 {reverse?'↓':'↑'}</SortButton>},readonlyColumns[1],{id:'actions',header:'操作',resize:false,cell:(row,context)=><Button variant="text" size="xs" disabled={context.disabled} onClick={()=>toast.add({description:'已查看 '+row.id,type:'info'})}>查看详情</Button>}];
 return <Stack>
  <Section title="常用组合"><DataTable label="任务表格常用组合" rows={sorted.slice(page*size,(page+1)*size)} columns={columns} rowKey={row=>row.id} columnSizing={{}} labels={tableLabels} rowState={row=>({selected:row.id==='task-001'})} status={status} hasValue={snapshot.hasValue} onRetry={()=>void resource.retry()} toolbar={<SearchToolbar search={<Field label="表格草稿"><Input placeholder="输入草稿不重建表格"/></Field>} actions={<Button variant="outline" disabled={snapshot.busy} aria-busy={snapshot.busy} onClick={()=>void resource.load('tasks')}>{snapshot.busy&&<Spinner/>}刷新示例</Button>}/>} pagination={{pageIndex:page,pageIndexOffset:0,pageSize:size,total:snapshot.hasValue?sorted.length:null,pageSizeOptions:[2,3],onPageChange:setPage,onPageSizeChange:value=>{setSize(value);setPage(0);}}}/></Section>
  <Section title="数据状态对照"><Grid>
   <Section title="首次加载"><DataTable label="首次加载表格" rows={[]} columns={readonlyColumns} rowKey={row=>row.id} status="loading" hasValue={false} labels={tableLabels}/></Section>
   <Section title="刷新保行"><DataTable label="刷新保行表格" rows={rows.slice(0,2)} columns={readonlyColumns} rowKey={row=>row.id} status="refreshing" hasValue labels={tableLabels}/></Section>
   <Section title="空数据"><DataTable label="空数据表格" rows={[]} columns={readonlyColumns} rowKey={row=>row.id} labels={tableLabels}/></Section>
   <Section title="无匹配结果"><DataTable label="无匹配表格" rows={[]} columns={readonlyColumns} rowKey={row=>row.id} filtered labels={tableLabels}/></Section>
   <Section title="读取失败与恢复"><DataTable label="错误恢复表格" rows={retry?rows.slice(0,2):[]} columns={readonlyColumns} rowKey={row=>row.id} status={retry?'ready':'error'} hasValue={retry} onRetry={()=>setRetry(true)} labels={tableLabels}/></Section>
   <Section title="刷新失败保行"><DataTable label="刷新失败保行表格" rows={rows.slice(0,2)} columns={readonlyColumns} rowKey={row=>row.id} status={refreshRecovered?'ready':'error'} hasValue onRetry={()=>setRefreshRecovered(true)} labels={tableLabels}/></Section>
   <Section title="操作禁用"><DataTable label="禁用操作表格" rows={rows.slice(0,2)} columns={[...readonlyColumns,columns[2]]} rowKey={row=>row.id} disabled labels={tableLabels}/></Section>
   <Section title="只读列表"><DataTable label="只读任务表格" rows={rows.slice(0,2)} columns={readonlyColumns} rowKey={row=>row.id} labels={tableLabels}/></Section>
  </Grid></Section>
 </Stack>;
}

const uploadCases=[['normal','待上传'],['loading','上传中'],['success','上传成功'],['disabled','禁用'],['readonly','只读'],['error','上传失败'],['invalid','文件校验失败']] as const;
type UploadPhase=typeof uploadCases[number][0];
function UploadCase({phase,title}:{phase:UploadPhase;title:string}){
 const [owner]=React.useState(()=>createUploadController<{id:string;name:string}>({path:'/api/demo/components/upload?state='+phase,service:UploadService,accept:'.txt',maxFileSize:1024,multiple:true,maxFiles:3}));
 React.useEffect(()=>{
  owner.add([new File(['Synthetic preview'],phase==='invalid'?'example.exe':'example.txt',{type:'text/plain'})]);
  if(phase==='loading'||phase==='success'||phase==='error')owner.start();
  if(phase==='disabled'||phase==='readonly')owner.update({disabled:phase==='disabled',readOnly:phase==='readonly'});
  return()=>owner.destroy();
 },[owner,phase]);
 return <Card title={title}><Upload controller={owner} label={title+'附件'} description="TXT，单文件不超过 1 KB" required renderResult={file=><Typography.Text tone="success">已确认：{file.response.payload.name}</Typography.Text>}/></Card>;
}
export function Uploads(){return <Stack><Section title="上传常用组合与状态"><Grid>{uploadCases.map(([phase,title])=><UploadCase key={phase} {...{phase,title}}/>)}</Grid></Section><Typography.Text tone="muted">全部上传使用合成文件和 mock HTTP。上传中不编造百分比；失败后是否重新写入由真实宿主核对。</Typography.Text></Stack>;}
