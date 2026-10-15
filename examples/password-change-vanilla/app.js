import {createAuthPage} from '@coffeehc/xui-runtime/login-dom';
import {createNewPasswordFields} from '@coffeehc/xui-runtime/password-dom';
import '@coffeehc/xui-theme/style.css';
const fields=createNewPasswordFields({labels:{showPassword:'显示密码',hidePassword:'隐藏密码'}}),submit=document.createElement('button');submit.type='submit';submit.className='xui-button';submit.textContent='保存新密码';let busy=false,calls=0;
const render=()=>{submit.disabled=busy;submit.setAttribute('aria-busy',String(busy));submit.textContent=busy?'正在保存…':'保存新密码';fields.setDisabled(busy);};
const layout=createAuthPage(document.getElementById('root'),{config:{productName:'Example',title:'修改密码'},content:fields.element,actions:submit,form:{noValidate:true,onSubmit(){if(busy)return;const value=fields.readValidatedPassword();if(value===null)return;fields.clear();calls++;busy=true;render();}}});
window.passwordChangeDemo={calls:()=>calls,settle(){busy=false;render();},destroy(){fields.destroy();layout.destroy();}};
