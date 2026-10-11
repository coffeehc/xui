import {createHttpClient} from '@coffeehc/xui-runtime/http';
import {createAuthClient,authEndpoints,type AuthUser,type LoginPageConfig} from '@coffeehc/xui-runtime/auth';
import configData from './login-config.json';
/** Synthetic facade only: no real cookies, tokens, credentials or backend are issued. */
export function createLoginExample(baseURL:string){
  const user:AuthUser={id:'demo:user',username:'demo',display_name:'示例用户'};let session:AuthUser|null=null;
  const modes:Record<string,string>={login:'ok',logout:'ok',session:'ok'},requests:{path:string;method:string;bodyKeys:string[];hasPassword:boolean;credentials:RequestCredentials|undefined}[]=[],holds=new Map<string,(()=>void)[]>(),destinations:{userId:string;path:string}[]=[];
  const fetch:typeof globalThis.fetch=async(input,init)=>{
    const path=new URL(String(input)).pathname,operation=Object.entries(authEndpoints).find(([,route])=>route===path)?.[0];if(!operation)throw new Error('Unexpected demo route');
    const body=init?.body?JSON.parse(String(init.body)):undefined;requests.push({path,method:init?.method??'GET',bodyKeys:body?Object.keys(body):[],hasPassword:typeof body?.password==='string',credentials:init?.credentials});
    const mode=modes[operation];if(mode==='hold')await new Promise<void>(resolve=>holds.set(operation,[...(holds.get(operation)??[]),resolve]));
    if(mode==='network')throw new Error('FAKE_PRIVATE_LOGIN_ERROR');
    const status=mode==='credentials'?401:mode==='forbidden'?403:mode==='rateLimited'?429:operation==='session'&&!session?401:200;
    if(status===200&&mode!=='business'&&mode!=='malformed'){if(operation==='login')session={...user,username:body.username};if(operation==='logout')session=null;}
    const payload=operation==='logout'?null:{schema_version:1,user:session??user};
    const wire=mode==='malformed'?{success:true,message:'',payload:{access_token:'FAKE_NOT_A_SESSION'},request_id:'demo:auth',code:1}:{success:status===200&&mode!=='business',message:status===200?'':'FAKE_PRIVATE_LOGIN_ERROR',payload:status===200?payload:null,request_id:'demo:auth',code:status===200&&mode!=='business'?1:-1};
    return new Response(JSON.stringify(wire),{status,headers:{'Content-Type':'application/json','X-Request-ID':'demo:auth'}});
  };
  let auth:ReturnType<typeof createAuthClient>;const http=createHttpClient({baseURL,fetch,onUnauthorized:()=>auth.expire()});auth=createAuthClient({http,timeoutMs:1000});
  const parameters=new URL(baseURL).searchParams;
  const config:LoginPageConfig={...configData,productName:parameters.get('productName')??configData.productName,labels:{...configData.labels,submit:parameters.get('submitLabel')??configData.labels.submit},returnTo:parameters.get('returnTo')??'/workspace'};
  return {auth,http,config,onAuthenticated(user:Readonly<AuthUser>,path:string){destinations.push({userId:user.id,path});},getDestinations:()=>destinations,getRequests:()=>requests,setMode(operation:string,mode:string){modes[operation]=mode;},setSession(value:AuthUser|null){session=value;},release(operation:string){const pending=holds.get(operation)??[];holds.delete(operation);pending.forEach(resolve=>resolve());},destroy(){auth.destroy();http.destroy();}};
}
