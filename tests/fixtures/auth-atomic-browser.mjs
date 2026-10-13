import {createAuthClient} from '@coffeehc/xui-runtime/auth';
import {createHttpClient} from '@coffeehc/xui-runtime/http';
import {createIndexedDBOperationStore} from '@coffeehc/xui-runtime/operation-store';
export async function install(scope){
 const store=createIndexedDBOperationStore(),key='xui.auth.recovery.v1:'+JSON.stringify([location.origin,'/api/v1/auth/',scope]);
 const http=createHttpClient({baseURL:location.origin,fetch:async()=>{
  const outcome=await window.authDispatch();if(outcome!=='success')throw Error('synthetic unknown transport');
  return new Response(JSON.stringify({success:true,message:'',code:200,request_id:'fixture',payload:{schema_version:2,user:{id:'42',username:'fixture',display_name:null},access_token:'bs-v1-sha256-access-'+'A'.repeat(43),token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()}}),{headers:{'Content-Type':'application/json'}});
 }}),auth=createAuthClient({http,recovery:{scope},timeoutMs:10000});
 return {auth,start:()=>auth.login({username:'fixture',password:'FAKE_TRANSIENT_PASSWORD'}).then(()=>true,()=>false),read:()=>store.read(key),destroy(){auth.destroy();http.destroy();}};
}
