import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {AuthPage,type AuthPageConfig} from '@coffeehc/xui-react/login';
import {Button} from '@coffeehc/xui-react/button';
import {Field,Input} from '@coffeehc/xui-react/forms';
import {Alert} from '@coffeehc/xui-react/feedback';
import {Disclosure} from '@coffeehc/xui-react/navigation';
import '@coffeehc/xui-theme/critical.css';
const root=createRoot(document.getElementById('root')!);
const initial:AuthPageConfig={productName:'轻舟协作工作台',title:'创建管理员',description:'设置第一个管理员账户。',logo:{src:'./mark.svg',alt:'轻舟协作工作台'}};
let submissions=0;
const detailsMode=new URLSearchParams(location.search).has('feedbackDetails');
const detailsSummary='上次操作结果尚未确认，不能再次提交。';
const detailsText='服务器尚未返回权威结果。请保留当前页面，在取得明确结果后按实际可用方式处理。'.repeat(12);
function App(){
  const [config,setConfig]=React.useState(initial),[feedback,setFeedback]=React.useState(detailsMode?detailsSummary:''),[canSubmit,setCanSubmit]=React.useState(true);
  Object.assign(window,{authPageDemo:{getSubmissions:()=>submissions,disableSubmit:()=>setCanSubmit(false),update:(patch:Partial<AuthPageConfig>)=>setConfig(current=>({...current,...patch})),feedback:()=>setFeedback('配置已更新，请继续填写。'),destroy:()=>root.unmount()}});
  return <AuthPage config={config} brandVisual={<img src="./visual.svg" alt=""/>} form={{noValidate:true,onSubmit:canSubmit&&!detailsMode?event=>{submissions++;for(const node of Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('input[type=password]')))node.value='';setFeedback('已收到示例表单，未创建真实账户。');}:undefined}} actions={<Button type="submit" disabled={detailsMode}>创建管理员</Button>} feedback={feedback?<><Alert>{feedback}</Alert>{detailsMode&&<Disclosure title="查看详细信息"><p>{detailsText}</p><Button variant="ghost" onClick={()=>document.querySelector<HTMLInputElement>('input[name=administrator]')?.focus()}>返回管理员用户名</Button></Disclosure>}</>:undefined}>
    <div className="xui-stack">
      <Field label="管理员用户名" required help="用于登录和管理工作台。"><Input name="administrator" autoComplete="username"/></Field>
      <Field label="密码" required help="请按实际服务的密码要求设置。"><Input name="password" type="password" autoComplete="new-password"/></Field>
      <Field label="确认密码" required><Input name="confirmation" type="password" autoComplete="new-password"/></Field>
    </div>
  </AuthPage>;
}
root.render(<App/>);
