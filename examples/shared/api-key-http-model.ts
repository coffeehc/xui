import {XuiServices} from '@coffeehc/xui-runtime/services';
import {createApiKeyHttpAdapter,type ApiKeyWireMetadataV3} from '@coffeehc/xui-runtime/api-key-http';
import {createApiKeyManagerController} from '@coffeehc/xui-runtime/api-key';
import labels from './api-key-labels.json';
/** Official v3 adapter + shared Auth owner, with synthetic transport only. Never contacts a server. */
export async function createApiKeyHttpExample(){
 let rows:ApiKeyWireMetadataV3[]=['active','disabled','expired','revoked','active','active'].map((status,index)=>({id:String(index+1),version:'19',enabled:status==='active',name:['模型调用 · 可复制','已禁用 · 可管理读取','已过期 · 可管理读取','已撤销 · 可管理读取','历史哈希 · 不可恢复','读取权限已拒绝'][index],prefix:`FAKE_${index+1}`,permission_ids:['read'],created_at:'2026-10-20T02:16:38Z',expires_at:null,last_used_at:null,status:status as ApiKeyWireMetadataV3['status'],capabilities:{update:status!=='revoked',revoke:status!=='revoked',delete_record:status==='revoked'},secret_access:{authorized:index!==5,recoverable:index!==4,can_copy:index<4}}));
 const requests:{path:string;method:string;body:unknown}[]=[],pending=new Set<()=>void>();let mode='ok',serial=6;
 const response=(payload:unknown,status=200)=>new Response(JSON.stringify({success:status===200,code:status===200?1:status*100+1,payload:status===200?payload:null,message:status===200?'':'Synthetic safe failure',request_id:'fixture'}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 const user={id:'42',username:'fixture',display_name:null},session={schema_version:2,user};
 const fetch:typeof globalThis.fetch=async(input,init)=>{
  const url=new URL(String(input)),path=url.pathname,method=init?.method??'GET',body=init?.body?JSON.parse(String(init.body)):null;requests.push({path,method,body});
  if(path==='/api/v1/auth/login')return response({...session,access_token:'bs-v1-sha256-access-'+'A'.repeat(43),token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()});
  if(path==='/api/v1/auth/session')return response(session);
  if(path.endsWith('/capabilities'))return response({schema_version:3,can_create:true,permissions:[{id:'read',label:'读取资料',description:null,disabled:false,required:true}],expiry_options:[{id:'30d',label:'30 天'}],default_expiry_id:'30d',default_permission_ids:['read'],confirmation_label:null});
  if(path.endsWith('/secret')){
   const target=rows.find(row=>row.id===path.split('/').at(-2));
   if(mode==='hold')await new Promise<void>(resolve=>pending.add(resolve)); // Deliberately late mock verifies caller-side cancellation.
   if(mode==='error')return response(null,403);
   if(mode==='conflict'||target?.version!==body.expected_version)return response(null,409);
   if(!target?.secret_access.can_copy)return response(null,403);
   return response({schema_version:3,id:target.id,version:target.version,secret:`${target.prefix}_SYNTHETIC_COMPLETE_CREDENTIAL`});
  }
  if(method==='GET'){const start=Number(url.searchParams.get('page_index'))*Number(url.searchParams.get('page_size'));return response({schema_version:3,list:rows.slice(start,start+Number(url.searchParams.get('page_size'))),total:rows.length});}
  if(method==='POST'&&path==='/api/v1/api-keys'){const metadata:ApiKeyWireMetadataV3={...rows[0],id:String(++serial),name:body.name,version:'1',status:'active'};rows=[...rows,metadata];return response({schema_version:3,metadata,secret:`FAKE_CREATED_${serial}_SYNTHETIC_VALUE`});}
  const id=path.split('/').at(-1),target=rows.find(row=>row.id===id);
  if(method==='PUT'&&target){const metadata={...target,name:body.name,enabled:body.enabled,status:body.enabled?'active' as const:'disabled' as const,version:String(BigInt(target.version)+1n)};rows=rows.map(row=>row.id===id?metadata:row);return response({schema_version:3,id,operation:'update',completed:true,metadata});}
  if(path.endsWith('/revoke')||path.endsWith('/record')){const id=path.split('/').at(-2)!;if(path.endsWith('/record'))rows=rows.filter(row=>row.id!==id);else rows=rows.map(row=>row.id===id?{...row,status:'revoked',version:String(BigInt(row.version)+1n)}:row);return response({schema_version:3,id,operation:path.endsWith('/record')?'delete_record':'revoke',completed:true});}
  return response(null,404);
 };
 const services=new XuiServices({http:{options:{baseURL:location.origin,fetch}},auth:{options:{protectedPaths:['/api/v1/api-keys','/api/v1/api-keys/']}}}),http=services.getHttpService(),auth=services.getAuthService();
 await auth.login({username:'fixture',password:'FAKE_PASSWORD'});
 const adapter=createApiKeyHttpAdapter({http,schemaVersion:3}),configuration=await adapter.getConfiguration(),controller=createApiKeyManagerController({...configuration,adapter,labels:{...labels,prefix:'API Key',edit:'编辑',save:'保存修改',enabled:'允许使用',actions:'操作'}});
 return {controller,keyCopy:adapter.keyCopy,getRequests:()=>requests,setMode:(next:string)=>{mode=next;},release(){mode='ok';for(const resolve of pending)resolve();pending.clear();},setAccess(id:string,canCopy:boolean){rows=rows.map(row=>row.id===id?{...row,secret_access:{...row.secret_access,authorized:canCopy,can_copy:canCopy&&row.secret_access.recoverable}}:row);},setVersion(id:string){rows=rows.map(row=>row.id===id?{...row,version:String(BigInt(row.version)+1n)}:row);},setLong(){rows=rows.map(row=>({...row,name:row.name+'用于多租户智能体平台的超长中文密钥名称'.repeat(4)}));},expire(){auth.expire();},setBehavior(operation:string,value:string){if(operation==='list'&&value==='empty')rows=[];},setRows(next:never[]){rows=next;},destroy(){for(const resolve of pending)resolve();pending.clear();controller.destroy();services.dispose();}};
}
