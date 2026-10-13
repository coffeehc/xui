import {createHttpClient} from '@coffeehc/xui-runtime/http';
import {createAuthClient,authEndpoints,type AuthUser,type LoginPageConfig} from '@coffeehc/xui-runtime/auth';
import configData from './login-config.json';
/** Synthetic facade only: no real credentials or backend are issued; HTTP mode is reserved for synthetic browser fixtures. */
export function createLoginExample(baseURL:string){
  const user:AuthUser={id:'42',username:'demo',display_name:'示例用户'};let session:AuthUser|null=null;
  const modes:Record<string,string>={login:'ok',logout:'ok',refresh:'ok',session:'ok'},requests:{path:string;method:string;bodyKeys:string[];hasPassword:boolean;credentials:RequestCredentials|undefined}[]=[],holds=new Map<string,(()=>void)[]>(),destinations:{userId:string;path:string}[]=[];
  const fetch:typeof globalThis.fetch=async(input,init)=>{
    const path=new URL(String(input)).pathname,operation=Object.entries(authEndpoints).find(([,route])=>route===path)?.[0];if(!operation)throw new Error('Unexpected demo route');
    const body=init?.body?JSON.parse(String(init.body)):undefined;requests.push({path,method:init?.method??'GET',bodyKeys:body?Object.keys(body):[],hasPassword:typeof body?.password==='string',credentials:init?.credentials});
    const mode=modes[operation];if(mode==='hold')await new Promise<void>(resolve=>holds.set(operation,[...(holds.get(operation)??[]),resolve]));
    if(mode==='network')throw new Error('FAKE_PRIVATE_LOGIN_ERROR');
    const status=mode==='credentials'?401:mode==='forbidden'?403:mode==='rateLimited'?429:['session','refresh'].includes(operation)&&!session?401:200;
    if(status===200&&mode!=='business'&&mode!=='malformed'){if(operation==='login')session={...user,username:body.username};if(operation==='logout')session=null;}
    const payload=operation==='logout'?null:{schema_version:2,user:session??user,...(['login','refresh'].includes(operation)?{access_token:'bs-v1-sha256-access-'+'A'.repeat(43),token_type:'Bearer',expires_at:new Date(Date.now()+300000).toISOString()}:{})};
    const wire=mode==='malformed'?{success:true,message:'',payload:{access_token:'FAKE_NOT_A_SESSION'},request_id:'demo:auth',code:1}:{success:status===200&&mode!=='business',message:status===200?'':'FAKE_PRIVATE_LOGIN_ERROR',payload:status===200?payload:null,request_id:'demo:auth',code:status===200&&mode!=='business'?1:-1};
    return new Response(JSON.stringify(wire),{status,headers:{'Content-Type':'application/json','X-Request-ID':'demo:auth'}});
  };
  const parameters=new URL(baseURL).searchParams,http=createHttpClient({baseURL,fetch:parameters.get('transport')==='http'?globalThis.fetch:fetch}),auth=createAuthClient({http,timeoutMs:parameters.has('visualAcceptance')?15000:1000,protectedPaths:['/api/business/']});
  if(parameters.get('session')==='valid')session=user;
  if(parameters.get('session')==='hold')modes.refresh='hold';
  if(parameters.has('sessionReadError')||parameters.has('sessionReadTimeout')){session=user;modes.session=parameters.has('sessionReadTimeout')?'hold':'network';}
  let handoffMode=parameters.get('handoff')??'ok',handoffCalls=0;const pendingHandoffs:{resolve:()=>void;reject:()=>void}[]=[];
  const onAuthenticated=(user:Readonly<AuthUser>,path:string):void|Promise<void>=>{handoffCalls++;const complete=()=>{destinations.push({userId:user.id,path});};if(handoffMode==='throw')throw new Error('FAKE_HOST_NAVIGATION_ERROR');if(handoffMode==='reject')return Promise.reject(new Error('FAKE_HOST_NAVIGATION_ERROR'));if(handoffMode==='hold')return new Promise<void>((resolve,reject)=>pendingHandoffs.push({resolve:()=>{complete();resolve();},reject:()=>reject(new Error('FAKE_LATE_HOST_ERROR'))}));complete();};
  const pageListeners=new Set<()=>void>(),pageAuth={...auth,subscribe(listener:()=>void){pageListeners.add(listener);const off=auth.subscribe(listener);return()=>{pageListeners.delete(listener);off();};}};
  const config:LoginPageConfig={...configData,layout:parameters.get('layout')==='card'?'card':'fullscreen',productName:parameters.get('productName')??configData.productName,title:parameters.get('title')??configData.title,labels:{...configData.labels,credentialsError:parameters.has('longError')?'用户名或密码不正确，请核对当前服务地址和账户来源后再试。'.repeat(6):configData.labels.credentialsError,submit:parameters.get('submitLabel')??configData.labels.submit},returnTo:parameters.has('sameTarget')?new URL(baseURL).pathname+new URL(baseURL).search:parameters.get('returnTo')??'/workspace'};
  return {auth:pageAuth,http,config,repeatAuthNotification(){for(const listener of [...pageListeners])listener();},onAuthenticated,getHandoffCalls:()=>handoffCalls,setHandoffMode(value:string){handoffMode=value;},releaseHandoff(fail=false){pendingHandoffs.splice(0).forEach(pending=>fail?pending.reject():pending.resolve());},getDestinations:()=>destinations,getRequests:()=>requests,setMode(operation:string,mode:string){modes[operation]=mode;},setSession(value:AuthUser|null){session=value;},release(operation:string){for(const key of operation==='session'?['session','refresh']:[operation]){const pending=holds.get(key)??[];holds.delete(key);pending.forEach(resolve=>resolve());}},destroy(){auth.destroy();http.destroy();}};
}
