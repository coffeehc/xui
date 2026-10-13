import {bindReadonlyChoice} from '@coffeehc/xui-runtime/widgets-dom';
import '@coffeehc/xui-theme/style.css';

window.choiceStateEvents=[];
const root=document.getElementById('root'),main=document.createElement('main'),title=document.createElement('h1'),grid=document.createElement('div'),owners=[];
main.className='xui-container xui-stack';main.setAttribute('aria-labelledby','choice-title');title.id='choice-title';title.textContent='Choice state contract';grid.className='xui-grid';
function sentinel(id,text){const button=document.createElement('button');button.id=id;button.type='button';button.className='xui-button';button.textContent=text;return button;}
main.append(title,sentinel('before-choices','Before choices'),grid);root.append(main);
for(const kind of ['checkbox','radio','switch'])for(const visual of kind==='checkbox'?['unchecked','checked','mixed','mixed-checked']:['unchecked','checked'])for(const mode of ['enabled','disabled','readonly'])for(const invalid of [false,true]){
 const id=[kind,visual,mode,invalid?'invalid':'valid'].join('-'),section=document.createElement('section'),label=document.createElement('label'),input=document.createElement('input');
 section.className='xui-stack';section.dataset.choiceCase=id;label.className='xui-choice-label';input.className='xui-choice';input.id=id;input.name=id;input.type=kind==='radio'?'radio':'checkbox';if(kind==='switch')input.setAttribute('role','switch');
 input.defaultChecked=visual==='checked'||visual==='mixed-checked';input.indeterminate=visual.startsWith('mixed');input.disabled=mode==='disabled';input.readOnly=mode==='readonly';
 input.dataset.kind=kind;input.dataset.visual=visual;input.dataset.availability=mode;
 if(invalid){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',`${id}-error`);}
 input.addEventListener('change',()=>window.choiceStateEvents.push(id));label.append(input,document.createTextNode([kind,visual,mode,invalid?'invalid':'valid'].join(' ')));section.append(label);
 if(invalid){const error=document.createElement('p');error.id=`${id}-error`;error.className='xui-error';error.textContent='Review this choice.';section.append(error);}
 grid.append(section);if(mode==='readonly')owners.push(bindReadonlyChoice(input));
}
main.append(sentinel('after-choices','After choices'));
window.addEventListener('pagehide',()=>owners.forEach(owner=>owner.destroy()),{once:true});
