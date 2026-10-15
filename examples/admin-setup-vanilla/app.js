import {createAdminSetupPage} from '@coffeehc/xui-runtime/admin-setup-dom';
import '@coffeehc/xui-theme/style.css';
const passwordLabels={showPassword:'显示密码',hidePassword:'隐藏密码'};
const config={productName:'Example',title:'创建管理员'};
const labels=new URLSearchParams(location.search).has('long')?{rejected:'暂时无法创建管理员。请检查输入的用户名，然后再试。'.repeat(8)}:undefined;
let calls=0,checks=0,settle=()=>{},settleCheck=()=>{};
const page=createAdminSetupPage(document.getElementById('root'),{config,labels,passwordLabels,state:{status:'idle'},onCheck:new URLSearchParams(location.search).has('check')?()=>{checks++;return new Promise((resolve,reject)=>{settleCheck=result=>result==='error'?reject(new Error('Synthetic read failed')):resolve(result);});}:undefined,onSubmit(){calls++;return new Promise(resolve=>{settle=resolve;});}});
window.adminSetupDemo={getChecks:()=>checks,settleCheck:result=>settleCheck(result),getCalls:()=>calls,settle:result=>settle(result),update:state=>page.update({state}),rerender:()=>page.update({config:{...config}}),destroy:()=>page.destroy()};
