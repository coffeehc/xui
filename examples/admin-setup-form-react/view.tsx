import * as React from 'react';
import {AuthPage} from '@coffeehc/xui-react/login';
import {AdminSetupForm,type AdminSetupFormHandle,type AdminSetupController,type AdminSetupState,type AdminSetupCredentials,type AdminSetupResult,type AdminSetupCheckResult} from '@coffeehc/xui-react/admin-setup';
import {Button} from '@coffeehc/xui-react/button';
import {Alert} from '@coffeehc/xui-react/feedback';

type Phase='checking'|'error'|'setup';
let writes=0,reads=0,writeSignal:AbortSignal|undefined,received:AdminSetupCredentials|undefined;
let finishWrite:((value:AdminSetupResult)=>void)|undefined,finishRead:((value:AdminSetupCheckResult)=>void)|undefined,failRead:((error:Error)=>void)|undefined;
/** Synthetic callbacks only: this example does not initialize an account or authenticate. */
export function submit(credentials:AdminSetupCredentials,{signal}:{signal:AbortSignal}){writes++;writeSignal=signal;received=credentials;return new Promise<AdminSetupResult>(resolve=>{finishWrite=resolve;});}
export function check(){reads++;return new Promise<AdminSetupCheckResult>((resolve,reject)=>{finishRead=resolve;failRead=reject;});}
export const setupFormDemo={ready:false,phase:(_value:Phase)=>{},authority:(_value:AdminSetupState)=>{},rerender:()=>{},clear:()=>{},destroy:()=>{},owner:undefined as AdminSetupController|undefined,settle:(value:AdminSetupResult)=>finishWrite?.(value),settleCheck:(value:AdminSetupCheckResult|'error')=>value==='error'?failRead?.(new Error('Synthetic read failure')):finishRead?.(value),report:()=>({writes,reads,aborted:writeSignal?.aborted??false,credentialsCleared:received?.password===''}),labels:(_value:boolean)=>{}};
const passwordLabels={showPassword:'显示密码',hidePassword:'隐藏密码'};
/** Keep this component mounted while the host resolves initialization authority. */
export function StartupSetupExample({controller}:{controller?:AdminSetupController}){
 const [phase,setPhase]=React.useState<Phase>('checking'),[authority,setAuthority]=React.useState<AdminSetupState>({status:'idle'}),[revision,redraw]=React.useState(0),[long,setLong]=React.useState(false),form=React.useRef<AdminSetupFormHandle>(null);
 React.useLayoutEffect(()=>{setupFormDemo.ready=true;setupFormDemo.phase=setPhase;setupFormDemo.authority=value=>controller?controller.setState(value):setAuthority(value);setupFormDemo.rerender=()=>redraw(value=>value+1);setupFormDemo.clear=()=>form.current?.clear();setupFormDemo.labels=setLong;setupFormDemo.owner=controller;},[controller]);
 const config={productName:'示例工作台：研发协作与运营管理中心',title:phase==='setup'?'创建管理员':'检查初始化状态',logo:{src:'./mark.svg',alt:'示例工作台'}};
 const labels=long?{rejected:'暂时无法创建管理员，请核对用户名后重试。'.repeat(8)}:undefined;
 return <AuthPage config={config} actions={phase==='checking'?<Button size="lg" onClick={()=>setPhase('setup')}>显示初始化表单</Button>:phase==='error'?<Button size="lg" onClick={()=>setPhase('checking')}>重试检查</Button>:undefined} feedback={phase==='error'?<Alert tone="error">暂时无法检查初始化状态，请重试。</Alert>:undefined}>
  {phase==='setup'?<AdminSetupForm ref={form} labels={labels} passwordLabels={passwordLabels} {...(controller?{controller}:{state:authority,onSubmit:submit,onCheck:check})}/>:<p role="status">{phase==='checking'?'正在检查初始化状态…':'尚未确认是否需要初始化。'}</p>}
 </AuthPage>;
}
