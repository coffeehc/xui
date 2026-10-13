import {bindPressFeedback,createDisclosureController} from './dom.js';

export interface SearchToolbarOptions {
  search?:Node|null;
  actions?:Node|null;
  advanced?:Node|null;
  defaultExpanded?:boolean;
  expanded?:boolean;
  onExpandedChange?:(expanded:boolean)=>void;
  advancedLabel?:string;
  label?:string;
}
export interface SearchToolbarController {
  getElement():HTMLDivElement;
  getExpanded():boolean;
  update(options:Partial<SearchToolbarOptions>):void;
  destroy():void;
}
const owners=new WeakSet<HTMLElement>();
/** Stable public slots; reuses the disclosure and press-feedback primitives. */
export function createSearchToolbar(root:HTMLElement,initial:SearchToolbarOptions={}):SearchToolbarController {
  if(owners.has(root))throw new Error('A search toolbar already owns this root');
  const doc=root.ownerDocument,original=Array.from(root.childNodes);
  const div=(className:string)=>{const node=doc.createElement('div');node.className=className;return node;};
  const element=div('xui-search-toolbar'),row=div('xui-toolbar xui-search-toolbar-row'),search=div('xui-search-toolbar-search'),actions=div('xui-search-toolbar-actions'),advanced=div('xui-search-toolbar-advanced');
  const trigger=doc.createElement('button'),label=doc.createElement('span');
  trigger.type='button';trigger.className='xui-button xui-search-toolbar-toggle';trigger.dataset.variant='outline';trigger.append(label);
  row.setAttribute('role','group');row.tabIndex=-1;row.append(search,actions);actions.append(trigger);element.append(row,advanced);
  let options={...initial},internal=initial.defaultExpanded??false,dead=false;
  const expanded=()=>options.expanded??internal;
  type SlotName='search'|'actions'|'advanced';
  type Slot={parent:HTMLElement;value:Node|null|undefined;nodes:Node[]};
  const slots:Record<SlotName,Slot>={search:{parent:search,value:undefined,nodes:[]},actions:{parent:actions,value:undefined,nodes:[]},advanced:{parent:advanced,value:undefined,nodes:[]}};
  const names=Object.keys(slots) as SlotName[],fragments=new WeakMap<Node,Node[]>(),structure=[root,element,row,search,actions,advanced,trigger,label];
  const nodes=(value:Node|null|undefined):Node[]=>!value?[]:value.nodeType===11?fragments.get(value)??Array.from(value.childNodes):[value];
  const validate=(next:SearchToolbarOptions)=>{
    const used:Node[]=[];
    for(const name of names){const value=next[name];if(value==null)continue;
      if(typeof value.nodeType!=='number'||typeof value.contains!=='function'||structure.some(node=>value===node||value.contains(node)))throw new TypeError('Invalid search toolbar slot');
      for(const node of nodes(value)){if(used.some(other=>other===node||other.contains(node)||node.contains(other)))throw new TypeError('Search toolbar slots require separate nodes');used.push(node);}
    }
  };
  const replace=(name:SlotName,value:Node|null|undefined)=>{
    const slot=slots[name];if(slot.value===value)return;
    const children=nodes(value);if(value?.nodeType===11)fragments.set(value,children);
    // Clearing one slot never detaches unchanged siblings or re-consumes a Fragment.
    for(const child of slot.nodes)if(child.parentNode===slot.parent)child.parentNode.removeChild(child);
    for(const child of children)slot.parent.insertBefore(child,name==='actions'?trigger:null);
    slot.value=value;slot.nodes=children;
  };
  validate(options);
  const disclosure=createDisclosureController(trigger,advanced,{open:expanded(),onOpenChange(next){
    if(dead)return;if(options.expanded===undefined){internal=next;render();}options.onExpandedChange?.(next);
  }});
  const present=(slot:Slot)=>slot.nodes.some(node=>node.nodeType!==8&&(node.nodeType!==3||node.textContent!==''));
  const render=()=>{
    const active=doc.activeElement,hadFocus=element.contains(active);
    for(const name of names)replace(name,options[name]);
    const hasAdvanced=present(slots.advanced);
    search.hidden=!present(slots.search);trigger.hidden=!hasAdvanced;trigger.disabled=!hasAdvanced;actions.hidden=!present(slots.actions)&&!hasAdvanced;
    label.textContent=options.advancedLabel?.trim()?options.advancedLabel:'Advanced options';
    if(options.label===undefined)row.removeAttribute('aria-label');else row.setAttribute('aria-label',options.label);
    disclosure.syncOpen(hasAdvanced&&expanded());advanced.inert=!hasAdvanced||!expanded();
    element.dataset.empty=String(search.hidden&&actions.hidden);
    if(hadFocus&&(!hasAdvanced&&active===trigger||!element.contains(active)&&doc.activeElement===doc.body)){
      const target=Array.from(row.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,[tabindex]')).find(node=>!node.matches(':disabled,[aria-disabled="true"]')&&node.getClientRects().length>0);(target??row).focus();
    }
  };
  render();root.replaceChildren(element);owners.add(root);const unpress=bindPressFeedback(element);
  return {getElement:()=>element,getExpanded:expanded,update(next){if(dead)return;const candidate={...options,...next};validate(candidate);options=candidate;render();},destroy(){if(dead)return;dead=true;unpress();disclosure.destroy();if(root.childNodes.length===1&&root.childNodes[0]===element)root.replaceChildren(...original);else element.remove();owners.delete(root);}};
}
