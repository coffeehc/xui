import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {AuthPage} from '@coffeehc/xui-react/login';
import {Dialog} from '@coffeehc/xui-react/dialog';
import {Button} from '@coffeehc/xui-react/button';
import {PasswordChangeForm} from '@coffeehc/xui-react/password';
import {createPasswordChangeController} from '@coffeehc/xui-runtime/password';
import {XuiServices} from '@coffeehc/xui-runtime/services';
import '@coffeehc/xui-runtime/auth';
import '@coffeehc/xui-runtime/http';
import {bootstrapBrowserExample} from '../shared/bootstrap-browser';
import '@coffeehc/xui-theme/style.css';

// This named synthetic server exercises the official wire; it sends no real credentials.
const query=new URL(location.href).searchParams,requests:object[]=[],errors:unknown[]=[],issued={schema_version:2,user:{id:'42',username:'fixture',display_name:null},access_token:'bs-v1-sha256-access-'+'A'.repeat(43),token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()};
let mode=query.get('mode')??'success',valid=true,writes=0,release:(()=>void)|undefined;
const response=(payload:unknown,status=200,code=status===200?200:status*100+1)=>new Response(JSON.stringify({success:status===200,message:'',payload,request_id:'synthetic',code}),{status,headers:{'Content-Type':'application/json'}});
const fixtureFetch:typeof fetch=async(input,init={})=>{
 const path=new URL(String(input)).pathname,headers=new Headers(init.headers);requests.push({path,method:init.method,credentials:init.credentials,cache:init.cache,bearer:!!headers.get('Authorization'),fields:init.body?Object.keys(JSON.parse(String(init.body))):[]});
 if(path.endsWith('/login')){valid=true;return response(issued);}
 if(path.endsWith('/refresh'))return valid?response(issued):response(null,401);
 if(path.endsWith('/session'))return valid?response({schema_version:2,user:issued.user}):response(null,401);
 if(path.endsWith('/password')){
  writes++;if(mode==='hold'||mode==='lost'){if(mode==='lost')valid=false;await new Promise<void>(resolve=>{release=resolve;});}
  if(mode==='wrong')return response(null,400);
  if(mode==='conflict')return response(null,409);
  if(mode==='denied')return response(null,401);
  if(mode==='unavailable')return response(null,503,50301);
  if(mode==='malformed')return response({schema_version:1,changed:false,reauthenticate:true});
  valid=false;return response({schema_version:1,changed:true,reauthenticate:true});
 }
 return response(null,404);
};
bootstrapBrowserExample();
const services=new XuiServices({http:{options:{baseURL:location.origin,fetch:fixtureFetch,onError:error=>{errors.push(error.toJSON());}}},auth:{options:{timeoutMs:query.has('short-timeout')?40:15000}}});
const auth=services.getAuthService(),controller=query.has('injected')?createPasswordChangeController({auth}):undefined;
await auth.login({username:'fixture',password:'FAKE_FIXTURE_LOGIN'});
const root=createRoot(document.getElementById('root')!);
function App(){
 const [open,setOpen]=React.useState(true),form=<PasswordChangeForm {...(controller?{controller}:{auth})} active={!query.has('dialog')||open} passwordLabels={{showPassword:'显示密码',hidePassword:'隐藏密码'}}/>;
 return <AuthPage config={{productName:query.has('long')?'合成环境中的长中文账户与身份设置工作台':'合成账户设置',title:'修改密码'}}>{query.has('dialog')?<Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger render={<Button/>}>打开改密</Dialog.Trigger><Dialog.Content keepMounted><Dialog.Header><Dialog.Title>修改密码</Dialog.Title></Dialog.Header><Dialog.Body>{form}</Dialog.Body></Dialog.Content></Dialog.Root>:form}</AuthPage>;
}
root.render(<React.StrictMode><App/></React.StrictMode>);
Object.assign(window,{passwordChangeDemo:{auth,controller,calls:()=>writes,requests:()=>requests,errors:()=>errors,setMode:(next:string)=>{mode=next;},settle(next='wrong'){mode=next;release?.();release=undefined;},serverValid:()=>valid,unmountForm:()=>root.unmount(),destroy(){root.unmount();controller?.destroy();services.dispose();}}});
window.addEventListener('pagehide',event=>{if(!event.persisted){controller?.destroy();services.dispose();}});
