// Bundle only public, built package exports. No source alias or fake DOM is used.
import {createDisclosureController,createPopoverController,createToastController} from '@coffeehc/xui-runtime/dom';
import {createNavigationMenu} from '@coffeehc/xui-runtime/navigation';
import {createMenuLayout} from '@coffeehc/xui-runtime/menu-layout';
import {createCommandPicker} from '@coffeehc/xui-runtime/widgets-dom';
import {createLoginPage} from '@coffeehc/xui-runtime/login-dom';
import {createApiKeyManager} from '@coffeehc/xui-runtime/api-key-dom';
import {createStructuredLogExplorer} from '@coffeehc/xui-runtime/structured-log-dom';
import {createBusinessLogExplorer} from '@coffeehc/xui-runtime/business-log-dom';
import {createThemeController} from '@coffeehc/xui-runtime/theme';
import {createLoginExample} from '../../examples/shared/login-model';
import {createApiKeyExample} from '../../examples/shared/api-key-model';
import {createStructuredLogExample} from '../../examples/shared/log-model';
import {createBusinessLogExample} from '../../examples/shared/business-log-model';

const items=[{id:'group',label:'Group',children:[{id:'child',label:'Child',href:'/child'}]}];
const commandItems=[{id:'one',label:'One'},{id:'two',label:'Two'}];

export function detachedCommand(doc=document){
  const root=doc.createElement('div');
  const controller=createCommandPicker(root,{label:'Detached command',items:commandItems});
  return {root,controller};
}

export function inspect(root){
  const doc=root.ownerDocument,failures=[],ids=[...root.querySelectorAll('[id]')].map(node=>node.id),counts={};
  for(const node of root.querySelectorAll('[id]')){
    if(!/^[a-zA-Z][\w-]*$/.test(node.id))failures.push('unsafe ID: '+node.id);
    if(doc.getElementById(node.id)!==node)failures.push('duplicate ID: '+node.id);
  }
  const reference=(node,attribute,values)=>{
    for(const id of values){
      const target=doc.getElementById(id),owner=node.closest('[data-dom-id-case]');
      if(!target||owner&&!owner.contains(target))failures.push(`${attribute}: ${id} does not reference this component`);
      counts[attribute]=(counts[attribute]??0)+1;
    }
  };
  for(const node of root.querySelectorAll('[aria-controls],[aria-labelledby],[aria-describedby],[aria-activedescendant]')){
    for(const attribute of ['aria-controls','aria-labelledby','aria-describedby','aria-activedescendant']){
      const value=node.getAttribute(attribute);
      if(value)reference(node,attribute,value.split(/\s+/));
    }
  }
  for(const label of root.querySelectorAll('label[for]')){
    reference(label,'for',[label.htmlFor]);
    if(label.control!==doc.getElementById(label.htmlFor))failures.push('label.control: '+label.htmlFor);
  }
  for(const button of root.querySelectorAll('[form]')){
    reference(button,'form',[button.getAttribute('form')]);
    if(button.form!==doc.getElementById(button.getAttribute('form')))failures.push('button.form mismatch');
  }
  for(const link of root.querySelectorAll('.xui-skip-link'))reference(link,'skip-link',[link.hash.slice(1)]);
  return {ids,counts,failures,cases:[...root.querySelectorAll('[data-dom-id-case]')].map(node=>node.dataset.domIdCase)};
}

export async function mount(root){
  const doc=root.ownerDocument,owners=[],models=[],hosts=[];
  const host=name=>{const element=doc.createElement('div');element.dataset.domIdCase=name;root.append(element);hosts.push(element);return element;};
  const pair=name=>{const container=host(name),trigger=doc.createElement('button'),panel=doc.createElement('div');trigger.textContent=name;panel.textContent=name+' body';container.append(trigger,panel);return {container,trigger,panel};};
  const theme=createThemeController({window:doc.defaultView});models.push(theme);
  const navigation=createNavigationMenu(host('navigation'),{items,label:'Tree'});owners.push(navigation);
  const layoutRoot=host('layout'),layout=createMenuLayout(layoutRoot,{items,label:'Layout navigation',theme});owners.push(layout);
  const commandRoot=host('command'),command=createCommandPicker(commandRoot,{label:'Search',items:commandItems});owners.push(command);
  const disclosure=pair('disclosure');owners.push(createDisclosureController(disclosure.trigger,disclosure.panel));
  const popup=pair('popup');owners.push(createPopoverController(popup.trigger,popup.panel));
  const tooltip=pair('tooltip');owners.push(createPopoverController(tooltip.trigger,tooltip.panel,{tooltip:true}));
  const toastRoot=host('toast'),toast=createToastController(toastRoot,{limit:5});owners.push(toast);
  const toastIds=[toast.add({title:'First'}),toast.add({title:'Second'})];
  // This fixture tests DOM ID allocation with deliberately absent crypto, not durable auth.
  const login=createLoginExample(doc.location.href,{recovery:false});models.push(login);
  owners.push(createLoginPage(host('login'),{auth:login.auth,theme,config:{...login.config,logo:undefined},onAuthenticated:login.onAuthenticated}));
  const keys=createApiKeyExample();models.push(keys);
  owners.push(createApiKeyManager(host('api-key'),{controller:keys.controller}));
  const structured=createStructuredLogExample(doc.location.href);models.push(structured);
  owners.push(createStructuredLogExplorer(host('structured-log'),{controller:structured.controller}));
  const business=createBusinessLogExample(doc.location.href);models.push(business);
  owners.push(createBusinessLogExplorer(host('business-log'),{controller:business.controller}));
  await Promise.all([keys.controller.refresh(),structured.controller.refresh(),business.controller.refresh()]);
  // Exercise all generated relationships, including form fields mounted only on opening.
  command.getInput().dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
  disclosure.trigger.click();
  const disclosureWorks=!disclosure.panel.hidden&&disclosure.trigger.getAttribute('aria-expanded')==='true';
  disclosure.trigger.click();
  keys.controller.openCreate();
  const withForm=inspect(root),formOpen=!!root.querySelector('[data-dom-id-case="api-key"] dialog[open]');
  keys.controller.close();
  const toastCountBefore=toastRoot.children.length;
  toast.close(toastIds[0]);
  const toastCountAfterClose=toastRoot.children.length;
  const explicitId=toast.add({id:'host-notification',title:'Host notification'});
  toast.add({id:'host-notification',title:'Replaced notification'});
  const toastCountAfterReplace=toastRoot.children.length;
  return {
    withForm,toastIds,explicitId,toastCountBefore,toastCountAfterClose,toastCountAfterReplace,disclosureWorks,formOpen,
    getLoginDestinations:login.getDestinations,
    snapshot:()=>inspect(root),
    layoutTarget:()=>{const trigger=layoutRoot.querySelector('[data-xui-sidebar-toggle]'),id=trigger.getAttribute('aria-controls');return {id,tag:doc.getElementById(id)?.tagName,belongs:layoutRoot.contains(doc.getElementById(id))};},
    destroy(){for(const owner of owners.reverse())owner.destroy();for(const model of models.reverse())model.destroy();for(const element of hosts)element.remove();},
  };
}

export {createToastController};
