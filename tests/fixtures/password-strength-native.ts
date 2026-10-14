import {createPasswordStrengthInput} from '@coffeehc/xui-runtime/password-dom';
import {validatePassword} from '@coffeehc/xui-runtime/password';
import '@coffeehc/xui-theme/style.css';

const host=document.getElementById('app')!,password=createPasswordStrengthInput(host,{label:'新密码',name:'password',autoComplete:'new-password',required:true}),button=document.createElement('button'),result=document.createElement('output');
button.type='button';button.className='xui-button';button.textContent='Submit fixture';result.dataset.submitResult='';button.onclick=()=>result.textContent=validatePassword(password.input.value)===null?'accepted':'rejected';
Object.assign(window,{passwordStrengthFixture:{clear:()=>password.clear(),destroy:()=>password.destroy(),getInput:()=>password.input,state:()=>({result:result.textContent})}});
host.append(button,result);
