import {createDateTimePicker} from '@coffeehc/xui-runtime/date-time-dom';
import '@coffeehc/xui-theme/style.css';
const root=document.getElementById('root'),long=new URLSearchParams(location.search).has('long'),label=long?'开始日期时间：'+ '完整保留长中文观察窗口字段名称'.repeat(3):'开始日期时间';
root.className='xui-stack';root.style.padding='var(--space-section-gap)';
const title=document.createElement('h1');title.textContent='观察窗口';const toolbar=document.createElement('div');toolbar.className='xui-toolbar';
const external=document.createElement('button');external.className='xui-button';external.textContent='外部更新';toolbar.append(external);
const checks={};for(const text of ['禁用','只读','必填','拒绝受控更新','宿主错误']){const label=document.createElement('label'),input=document.createElement('input');label.className='xui-choice-label';input.className='xui-choice';input.type='checkbox';label.append(input,document.createTextNode(text));toolbar.append(label);checks[text]=input;}
const form=document.createElement('form'),stack=document.createElement('div'),startHost=document.createElement('div'),endHost=document.createElement('div'),actions=document.createElement('div'),submit=document.createElement('button'),reset=document.createElement('button'),result=document.createElement('output'),submitted=document.createElement('output');stack.className='xui-stack';actions.className='xui-toolbar';submit.className=reset.className='xui-button';submit.type='submit';reset.type='reset';submit.textContent='提交';reset.textContent='重置草稿';reset.dataset.variant='outline';actions.append(submit,reset);stack.append(startHost,endHost,actions);form.append(stack);result.setAttribute('aria-label','日期时间结果');submitted.setAttribute('aria-label','表单结果');root.append(title,toolbar,form,result,submitted);
form.style.minInlineSize='0';for(const output of [result,submitted]){output.style.minInlineSize='0';output.style.overflowWrap='anywhere';}
let start='2020-02-29T23:59',end=null,calls=0;
const render=()=>{result.textContent=JSON.stringify({start,end,calls});};
const picker=createDateTimePicker(startHost,{id:'start',label,name:'start',value:start,today:'2026-10-15',locale:'zh-CN',help:'YYYY-MM-DDTHH:mm',labels:long?{title:'选择开始日期与时间：'+ '完整保留长中文标题'.repeat(3)}:undefined,onValueChange:value=>{calls++;if(!checks['拒绝受控更新'].checked){start=value;picker.update({value});}render();}});
const endPicker=createDateTimePicker(endHost,{id:'end',label:'结束日期时间',name:'end',value:end,today:'2026-10-15',onValueChange:value=>{end=value;endPicker.update({value});render();}});
external.onclick=()=>{start='2026-10-15T09:30';picker.update({value:start});render();};
for(const text of ['禁用','只读','必填','宿主错误'])checks[text].onchange=()=>{const state={disabled:checks['禁用'].checked,readOnly:checks['只读'].checked};picker.update({...state,required:checks['必填'].checked,error:checks['宿主错误'].checked?'宿主提供的观察窗口校验错误':undefined});endPicker.update(state);};
form.onsubmit=event=>{event.preventDefault();submitted.textContent=JSON.stringify(Object.fromEntries(new FormData(form)));};
window.dateTimeDemo={picker,endPicker};render();
