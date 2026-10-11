import {createApiKeyManagerController,type ApiKeyMetadata,type ApiKeyDraft} from '@coffeehc/xui-runtime/api-key';
import labels from './api-key-labels.json';
/** Synthetic in-memory backend only; these identifiers/values do not authorize anything. */
export function createApiKeyExample(){
  let rows:ApiKeyMetadata[]=[{id:'demo-key-1',name:'资料读取',prefix:'FAKE_demo',permissionIds:['demo.read'],createdAt:'2026-10-11T12:00:00Z',expiresAt:null,lastUsedAt:null,status:'active'},
    {id:'demo-key-unknown',name:'旧记录',prefix:null,permissionIds:[],createdAt:null,expiresAt:null,lastUsedAt:null,status:null}];
  type Operation='list'|'create'|'revoke'|'copy';type Behavior='ok'|'error'|'hold';
  const behavior:Record<Operation,Behavior>={list:'ok',create:'ok',revoke:'ok',copy:'ok'},calls:Record<Operation,number>={list:0,create:0,revoke:0,copy:0};
  const pending:Record<Operation,(()=>void)[]>={list:[],create:[],revoke:[],copy:[]};let lastDraft:Readonly<ApiKeyDraft>|null=null,counter=1;
  const execute=<T>(operation:Operation,work:()=>T|Promise<T>):Promise<T>=>{calls[operation]++;if(behavior[operation]==='error')return Promise.reject(new Error('FAKE_PRIVATE_KEY_VALUE https://private.invalid/?key=FAKE_PRIVATE_KEY_VALUE'));
    if(behavior[operation]==='hold')return new Promise((resolve,reject)=>pending[operation].push(()=>{Promise.resolve().then(work).then(resolve,reject);}));return Promise.resolve().then(work);};
  const controller=createApiKeyManagerController({labels,permissions:[{id:'demo.read',label:'读取示例资料'},{id:'demo.write',label:'更新示例资料'},{id:'demo.disabled',label:'不可选示例权限',disabled:true}],expiryOptions:[{id:'demo.30d',label:'示例：30 天'},{id:'demo.never',label:'示例：无到期时间'}],defaultExpiryId:'demo.30d',defaultPermissionIds:['demo.read'],
    adapter:{list:()=>execute('list',()=>rows),create:draft=>{lastDraft=draft;return execute('create',()=>{const id=`demo-key-${++counter}`,metadata:ApiKeyMetadata={id,name:draft.name,prefix:`FAKE_${counter}`,permissionIds:draft.permissionIds,createdAt:'2026-10-11T12:00:00Z',expiresAt:draft.expiryId==='demo.30d'?'2026-11-10T12:00:00Z':null,lastUsedAt:null,status:'active'};rows=[...rows,metadata];return {metadata,secret:`FAKE_API_KEY_ONE_TIME_VALUE_ONLY_${counter}`};});},revoke:key=>execute('revoke',()=>{rows=rows.map(row=>row.id===key.id?{...row,status:'revoked'}:row);})}});
  return {controller,writeClipboard:(value:string)=>execute('copy',()=>navigator.clipboard.writeText(value)),setBehavior:(operation:Operation,value:Behavior)=>{behavior[operation]=value;},release:(operation:Operation)=>pending[operation].shift()?.(),getCalls:()=>({...calls,lastDraft}),setRows:(value:ApiKeyMetadata[])=>{rows=value;},destroy:()=>controller.destroy()};
}
