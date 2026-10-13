import '@coffeehc/xui-theme/style.css';
window.inputFoundationEvents=[];
const main=document.createElement('main');main.className='xui-container xui-stack';main.innerHTML='<h1>Input foundation contract</h1><section class="xui-surface"><form id="input-foundation" class="xui-stack"><button type="button" class="xui-button" id="before-inputs">Before inputs</button></form></section>';document.getElementById('root').append(main);
const form=main.querySelector('form');
for(const kind of ['input','textarea'])for(const state of ['default','readonly','disabled'])for(const invalid of [false,true]){
 const id=`${kind}-${state}-${invalid?'invalid':'valid'}`,field=document.createElement('div'),label=document.createElement('label'),control=document.createElement(kind),help=document.createElement('p');
 field.className='xui-field';label.className='xui-label';label.htmlFor=id;label.textContent=id;control.className=kind==='input'?'xui-input':'xui-textarea';control.id=id;control.name=id;control.defaultValue=kind==='input'?'Sample 中文 123':'Line 1 中文\nLine 2 123';control.readOnly=state==='readonly';control.disabled=state==='disabled';if(invalid)control.setAttribute('aria-invalid','true');control.setAttribute('aria-describedby',`${id}-help${invalid?` ${id}-error`:''}`);control.addEventListener('input',()=>window.inputFoundationEvents.push(id));help.className='xui-help';help.id=`${id}-help`;help.textContent='帮助说明可以完整阅读。';field.append(label,control,help);
 if(invalid){const error=document.createElement('p');error.id=`${id}-error`;error.className='xui-error';error.textContent='请检查当前值。';field.append(error);}form.append(field);
}
const after=document.createElement('button');after.type='button';after.className='xui-button';after.id='after-inputs';after.textContent='After inputs';form.append(after);
