import {createApiKeyManagerController,type ApiKeyMetadata} from '@coffeehc/xui-runtime/api-key';
import labels from './api-key-labels.json';
/** All credentials are synthetic. No server, persistent storage or real key is used. */
export function createApiKeyShowcase(){
 let rows:ApiKeyMetadata[]=[
  {id:'showcase-1',name:'Agent 生产调用',prefix:'bs-v1-sha256-Q7n2pX8k',permissionIds:['models.invoke','files.read'],createdAt:'2026-10-20T02:16:38.235124Z',expiresAt:'2027-01-20T02:16:38Z',lastUsedAt:'2026-10-24T00:42:12.902931Z',status:'active',enabled:true,version:'1'},
  {id:'showcase-2',name:'研究工作区',prefix:'bs-v1-sha256-R4c9mT2v',permissionIds:['models.invoke'],createdAt:'2026-10-19T07:30:12Z',expiresAt:'2026-11-19T07:30:12Z',lastUsedAt:'2026-10-23T14:03:25Z',status:'active',enabled:true,version:'1'},
  {id:'showcase-3',name:'数据导出服务',prefix:'bs-v1-sha256-L8w3aY5f',permissionIds:['files.read'],createdAt:'2026-10-17T03:20:00Z',expiresAt:null,lastUsedAt:'2026-10-22T11:28:08Z',status:'disabled',enabled:false,version:'1'},
  {id:'showcase-4',name:'持续集成 · 旧版只存哈希',prefix:'bs-v1-sha256-H6e1sZ0b',permissionIds:['files.read'],createdAt:'2026-10-15T10:10:00Z',expiresAt:null,lastUsedAt:null,status:'active',enabled:true,version:'1'},
  {id:'showcase-5',name:'短期验证环境',prefix:'bs-v1-sha256-V9t4dK7q',permissionIds:['models.invoke'],createdAt:'2026-09-10T08:00:00Z',expiresAt:'2026-10-10T08:00:00Z',lastUsedAt:'2026-10-09T02:12:46Z',status:'expired',enabled:true,version:'1'},
  {id:'showcase-6',name:'已停用的自动化任务',prefix:'bs-v1-sha256-N2j8uC5r',permissionIds:['files.read'],createdAt:'2026-09-02T06:00:00Z',expiresAt:'2026-12-02T06:00:00Z',lastUsedAt:'2026-10-01T09:15:22Z',status:'revoked',enabled:false,version:'1'},
 ];
 const secrets=new Map(rows.filter(row=>row.id!=='showcase-4').map(row=>[row.id,`${row.prefix}_FAKE_DEMO_NOT_A_REAL_KEY`]));let count=6;
 type Operation='list'|'create'|'update'|'revoke'|'deleteRecord';
 const modes:Partial<Record<Operation,'ok'|'hold'|'error'>>={},calls:Partial<Record<Operation,number>>={};
 const pending=new Map<Operation,Set<()=>void>>();
 const execute=async<T>(operation:Operation,signal:AbortSignal,work:()=>T):Promise<T>=>{
  calls[operation]=(calls[operation]??0)+1;
  if(signal.aborted)throw new DOMException('Cancelled','AbortError');
  if(modes[operation]==='error')throw Error('Synthetic unavailable');
  if(modes[operation]==='hold')await new Promise<void>((resolve,reject)=>{
   const queue=pending.get(operation)??new Set<()=>void>();pending.set(operation,queue);
   const finish=()=>{queue.delete(finish);signal.removeEventListener('abort',abort);resolve();};
   const abort=()=>{queue.delete(finish);signal.removeEventListener('abort',abort);reject(new DOMException('Cancelled','AbortError'));};
   queue.add(finish);signal.addEventListener('abort',abort,{once:true});
  });
  if(signal.aborted)throw new DOMException('Cancelled','AbortError');
  return work();
 };
 const controller=createApiKeyManagerController({labels:{...labels,prefix:'API Key',actions:'操作',disabled:'已禁用',edit:'编辑',updateTitle:'编辑 API Key',save:'保存修改',saving:'正在保存…',updateWarning:'修改权限或禁用此密钥可能影响已接入的客户端。',deleteTitle:'删除已撤销的记录',deleteWarning:'只删除这条管理记录，保留已有业务数据。',confirmDelete:'删除记录',deleting:'正在删除…',enabled:'允许使用',deleteRecord:'删除记录'},canCreate:true,canUpdate:()=>true,canRevoke:row=>row.status==='active'||row.status==='disabled',canDeleteRecord:()=>true,permissions:[{id:'models.invoke',label:'模型调用'},{id:'files.read',label:'文件读取'}],expiryOptions:[{id:'30d',label:'30 天'},{id:'90d',label:'90 天'},{id:'never',label:'长期有效'}],defaultExpiryId:'90d',defaultPermissionIds:['models.invoke'],adapter:{
  list:({signal})=>execute('list',signal,()=>rows),
  create:(draft,{signal})=>execute('create',signal,()=>{const id=`showcase-${++count}`,metadata:ApiKeyMetadata={id,name:draft.name,prefix:`DEMO_${count}_PUBLIC`,permissionIds:draft.permissionIds,createdAt:'2026-10-24T01:00:00Z',expiresAt:draft.expiryId==='never'?null:'2027-01-22T01:00:00Z',lastUsedAt:null,status:'active',enabled:true,version:'1'};const secret=`${metadata.prefix}_FAKE_DEMO_NOT_A_REAL_KEY`;secrets.set(id,secret);rows=[...rows,metadata];return {metadata,secret};}),
  update:(row,draft,{signal})=>execute('update',signal,()=>{const next={...row,name:draft.name,permissionIds:draft.permissionIds,enabled:draft.enabled,status:row.status==='expired'||row.status==='revoked'?row.status:draft.enabled?'active' as const:'disabled' as const,version:String(Number(row.version??'1')+1)};rows=rows.map(item=>item.id===row.id?next:item);return next;}),
  revoke:(row,{signal})=>execute('revoke',signal,()=>{rows=rows.map(item=>item.id===row.id?{...item,status:'revoked' as const}:item);}),
  deleteRecord:(row,{signal})=>execute('deleteRecord',signal,()=>{rows=rows.filter(item=>item.id!==row.id);secrets.delete(row.id);}),
 }});
 return {controller,readSyntheticSecret:(id:string)=>secrets.get(id),canCopy:(row:Readonly<ApiKeyMetadata>)=>secrets.has(row.id)&&row.status!=='revoked'&&row.status!=='expired',setBehavior:(operation:Operation,value:'ok'|'hold'|'error')=>{modes[operation]=value;},release:(operation:Operation='list')=>{modes[operation]='ok';for(const release of pending.get(operation)??[])release();},getCalls:()=>({...calls}),setRows:(next:ApiKeyMetadata[])=>{rows=next;},destroy(){secrets.clear();controller.destroy();}};
}
