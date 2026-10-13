import {createAdminSetupPage} from '@coffeehc/xui-runtime/admin-setup-dom';
import '@coffeehc/xui-theme/style.css';
const config={productName:'Example',title:'创建管理员'},policy={version:1,minimum_characters:6,maximum_characters:32,counting_unit:'unicode_code_points'};
const labels=new URLSearchParams(location.search).has('long')?{rejected:'暂时无法创建管理员。请检查输入的用户名，然后再试。'.repeat(8)}:undefined;
let calls=0,settle=()=>{};
const page=createAdminSetupPage(document.getElementById('root'),{config,labels,state:{status:'idle'},policy,onSubmit(){calls++;return new Promise(resolve=>{settle=resolve;});}});
window.adminSetupDemo={getCalls:()=>calls,settle:result=>settle(result),update:state=>page.update({state}),rerender:()=>page.update({config:{...config}}),destroy:()=>page.destroy()};
