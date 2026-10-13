import {createToggleGroup} from '@coffeehc/xui-runtime/widgets-dom';
import '@coffeehc/xui-runtime/init.js';
import '@coffeehc/xui-theme/style.css';

const variants=['primary','secondary','outline','ghost','destructive','link'];
const states=['enabled','busy','disabled','disabled-busy'];
window.buttonStateClicks={};
const record=id=>{window.buttonStateClicks[id]=(window.buttonStateClicks[id]??0)+1;};
const node=(tag,text)=>{const element=document.createElement(tag);if(text)element.textContent=text;return element;};
const root=node('main');root.className='xui-stack';root.append(node('h1','Button state contracts'));
for(const variant of variants){
 const section=node('section');section.className='xui-surface';const actions=node('div');actions.className='xui-toolbar';
 for(const state of states){
  const id=`${variant}-${state}`,button=node('button');button.type='button';button.className='xui-button';button.dataset.variant=variant;button.dataset.testid=id;button.disabled=state.startsWith('disabled');if(state.includes('busy'))button.setAttribute('aria-busy','true');
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('fill','none');icon.setAttribute('stroke','currentColor');icon.setAttribute('stroke-width','var(--icon-stroke-width)');icon.setAttribute('aria-hidden','true');const path=document.createElementNS(icon.namespaceURI,'path');path.setAttribute('d','m5 12 4 4L19 6');icon.append(path);
  button.append(icon,document.createTextNode(id));button.addEventListener('click',()=>record(id));actions.append(button);
 }
 section.append(node('h2',variant),actions);root.append(section);
}
const group=node('div'),toggle=node('button','Selected disabled toggle');group.setAttribute('aria-label','Disabled selected group');toggle.dataset.value='selected';toggle.dataset.testid='disabled-selected-toggle';group.append(toggle);root.append(group);
document.getElementById('root').append(root);createToggleGroup(group,{defaultValue:['selected'],disabled:true});
const sizeSection=node('section');sizeSection.className='xui-surface';sizeSection.append(node('h2','Button sizes'));
for(const kind of ['text','icon']){
 const row=node('div');row.className='xui-toolbar';
 for(const size of ['xs','sm','default','lg']){
  const button=node('button');button.type='button';button.className='xui-button';button.dataset.size=size;button.dataset.testid=`size-${size}-${kind}`;button.append(root.querySelector('svg').cloneNode(true));
  if(kind==='icon'){button.dataset.icon='true';button.setAttribute('aria-label',`${size} save`);}else button.append(document.createTextNode('Save'));
  row.append(button);
 }
 sizeSection.append(row);
}
root.append(sizeSection);

const xsSection=node('section');xsSection.className='xui-surface';xsSection.append(node('h2','Extra small states'));
for(const variant of variants){const row=node('div');row.className='xui-toolbar';for(const state of states){const button=node('button');button.type='button';button.className='xui-button';button.dataset.size='xs';button.dataset.variant=variant;button.dataset.testid=`xs-${variant}-${state}`;button.disabled=state.startsWith('disabled');if(state.includes('busy'))button.setAttribute('aria-busy','true');button.append(root.querySelector('svg').cloneNode(true),document.createTextNode('保存'));row.append(button);}const long=node('button','保存完整的中文操作名称并允许它自然换行');long.type='button';long.className='xui-button';long.dataset.size='xs';long.dataset.variant=variant;long.dataset.testid=`xs-${variant}-long`;long.style.maxInlineSize='var(--layout-field-min)';row.append(long);xsSection.append(row);}root.append(xsSection);
