import {generateDomId} from './dom-id.js';
import {bindPressFeedback} from './dom.js';
/** Shared, serializable menu data. Icons are identifiers resolved once by the host. */
export interface NavigationItem {
  id:string; label:string; icon?:string; href?:string; children?:readonly NavigationItem[];
  group?:boolean; disabled?:boolean; target?:string; download?:string|boolean; rel?:string;
}
export interface NavigationIcon {viewBox?:string;paths:readonly string[]}
export type NavigationIconResolver=(name:string)=>NavigationIcon|undefined;
export interface NavigationSelection {
  activeId?:string|null;location?:string;baseURL?:string;
  matchLocation?:(item:NavigationItem,location:URL,target:URL)=>boolean;
}
export interface NavigationRequest {id:string;href:string;url:string;sameLocation:boolean;event:Event}
export interface NavigationAdapter {navigate:(request:NavigationRequest)=>void;canNavigate?:(request:NavigationRequest)=>boolean}
export interface NavigationNode {item:NavigationItem;parentId:string|null;ancestors:readonly string[];disabled:boolean}
export interface NavigationMenuState {activeId:string|null;collapsed:boolean;expandedIds:readonly string[]}
export interface NavigationMenuOptions extends NavigationSelection {
  items:readonly NavigationItem[];navigation?:NavigationAdapter;resolveIcon?:NavigationIconResolver;
  showCollapseToggle?:boolean;label?:string;emptyLabel?:string;compactLabel?:string;expandLabel?:string;
  collapsed?:boolean;defaultCollapsed?:boolean;expandedIds?:readonly string[];defaultExpandedIds?:readonly string[];
  onCollapsedChange?:(collapsed:boolean)=>void;onExpandedChange?:(ids:readonly string[])=>void;
}

/** Per-row facts supplied to native content and decorator lifecycles. */
export interface NavigationRowState {disabled:boolean;collapsed:boolean;expanded:boolean;active:boolean}
export interface NavigationDOMLifecycle {update?:(item:NavigationItem,state:NavigationRowState)=>void;destroy?:()=>void}
export interface NavigationDOMSlot<T extends Node=Node> extends NavigationDOMLifecycle {element:T}
/** DOM-only extension points; NavigationItem remains portable serializable data. */
export interface NavigationMenuDOMOptions extends NavigationMenuOptions {
  renderLabel?:(item:NavigationItem,state:NavigationRowState)=>NavigationDOMSlot|null;
  renderAction?:(item:NavigationItem,state:NavigationRowState)=>NavigationDOMSlot<HTMLButtonElement>|null;
  decorateItem?:(element:HTMLElement,item:NavigationItem,state:NavigationRowState)=>NavigationDOMLifecycle|void;
}

export function indexNavigation(items:readonly NavigationItem[]):Map<string,NavigationNode>{
  const nodes=new Map<string,NavigationNode>();
  const walk=(entries:readonly NavigationItem[],parentId:string|null,ancestors:string[],inheritedDisabled:boolean)=>{
    for(const item of entries){
      if(typeof item.id!=='string'||!item.id||typeof item.label!=='string'||!item.label||nodes.has(item.id))throw new TypeError('Navigation items need unique nonempty string ids and labels');
      if(item.group&&item.href)throw new TypeError('A navigation group cannot also be a link');
      const disabled=inheritedDisabled||!!item.disabled;nodes.set(item.id,{item,parentId,ancestors:[...ancestors],disabled});
      if(item.children)walk(item.children,item.id,[...ancestors,item.id],disabled);
    }
  };walk(items,null,[],false);return nodes;
}
const pagePath=(url:URL)=>url.pathname.replace(/\/+$/,'')||'/';
export function getNavigationActiveId(nodes:Map<string,NavigationNode>,options:NavigationSelection):string|null{
  const eligible=(node:NavigationNode|undefined)=>node&&!node.disabled&&!node.item.group&&!!node.item.href;
  if(options.activeId!==undefined)return eligible(nodes.get(options.activeId??''))?options.activeId!:null;
  if(!options.location)return null;
  let location:URL;try{location=new URL(options.location,options.baseURL??'https://xui.invalid/');}catch{return null;}
  for(const [id,node] of nodes){if(!eligible(node))continue;
    try{const target=new URL(node.item.href!,location);if(options.matchLocation?options.matchLocation(node.item,location,target):target.origin===location.origin&&pagePath(target)===pagePath(location))return id;}catch{}
  }return null;
}
const defaultIcons:Record<string,NavigationIcon>={
  menu:{paths:['M4 5h12M4 10h12M4 15h12']},home:{paths:['M3 9l7-6 7 6M5 8v9h10V8M8 17v-6h4v6']},
  folder:{paths:['M3 5h5l2 2h7v10H3z']},document:{paths:['M5 3h7l3 3v11H5zM8 9h4M8 13h4']},
  settings:{paths:['M3 5h14M3 10h14M3 15h14M7 3v4M13 8v4M8 13v4']},
};
export function resolveNavigationIcon(name:string|undefined,resolver?:NavigationIconResolver):NavigationIcon{
  return name&&resolver?.(name)||(Object.hasOwn(defaultIcons,name??'menu')?defaultIcons[name??'menu']:defaultIcons.menu);
}
type NavigationClick=Pick<MouseEvent,'button'|'ctrlKey'|'metaKey'|'shiftKey'|'altKey'|'defaultPrevented'|'preventDefault'> & {nativeEvent?:Event};
export function navigateNavigationItem(item:NavigationItem,event:NavigationClick,options:NavigationMenuOptions):boolean{
  if(!options.navigation||!item.href||item.disabled||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||item.target&&item.target!=='_self'||item.download!==undefined&&item.download!==false)return false;
  let current:URL,target:URL;try{current=new URL(options.location??options.baseURL??'https://xui.invalid/',options.baseURL??'https://xui.invalid/');target=new URL(item.href,current);}catch{return false;}
  if(!['http:','https:'].includes(target.protocol)||target.origin!==current.origin)return false;
  const request={id:item.id,href:item.href,url:target.href,sameLocation:target.href===current.href,event:event.nativeEvent??event as unknown as Event};
  if(options.navigation.canNavigate?.(request)===false)return false;
  event.preventDefault();options.navigation.navigate(request);return true;
}

export function createNavigationKeyboard(root:HTMLElement,options:{activeId:()=>string|null;node:(id:string)=>NavigationNode|undefined;expanded:(id:string)=>boolean;setExpanded:(id:string,open:boolean)=>void;listen?:boolean;fallbackFocus?:()=>HTMLElement|null}){
  let lastFocused:HTMLElement|null=null;
  const controls=()=>Array.from(root.querySelectorAll<HTMLElement>('[data-menu-control]')).filter(node=>{const hidden=node.closest('[hidden]');return (!hidden||hidden===root||!root.contains(hidden))&&!node.matches(':disabled,[aria-disabled="true"]');});
  const focus=(node:HTMLElement|undefined)=>{if(!node)return;controls().forEach(item=>{item.tabIndex=item===node?0:-1;});lastFocused=node;node.focus();};
  const refresh=()=>{const all=controls(),active=root.ownerDocument.activeElement;const lost=lastFocused&&(!lastFocused.isConnected||!all.includes(lastFocused))&&(active===root.ownerDocument.body||active===lastFocused);
    const chosen=all.find(node=>node===active)??all.find(node=>node.dataset.menuId===options.activeId()&&node.dataset.menuControl==='primary')??all[0];root.querySelectorAll<HTMLElement>('[data-menu-control]').forEach(node=>{node.tabIndex=node===chosen?0:-1;});if(lost)focus(chosen??root.querySelector<HTMLElement>('.xui-menu-compact-toggle:not([hidden])')??options.fallbackFocus?.()??undefined);};
  const released=()=>{root.querySelectorAll<HTMLElement>('[data-menu-control][data-pressed]').forEach(node=>{delete node.dataset.pressed;});};
  const key=(event:KeyboardEvent)=>{
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||!root.contains(event.target as Node))return;
    const all=controls(),current=all.find(node=>node===root.ownerDocument.activeElement),index=current?all.indexOf(current):-1,id=current?.dataset.menuId,node=id?options.node(id):undefined;
    if(!current)return;
    if(current&&(event.key==='Enter'||event.key===' '&&current.tagName==='BUTTON'))current.dataset.pressed='true';
    const rtl=getComputedStyle(root).direction==='rtl',expandKey=rtl?'ArrowLeft':'ArrowRight',collapseKey=rtl?'ArrowRight':'ArrowLeft';
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?all.length-1:index<0?0:(index+(event.key==='ArrowDown'?1:-1)+all.length)%all.length;focus(all[next]);}
    else if(current.dataset.menuControl!=='action'&&node?.item.children?.length&&event.key===expandKey){event.preventDefault();if(!options.expanded(id!))options.setExpanded(id!,true);else focus(all.find(item=>options.node(item.dataset.menuId!)?.parentId===id));}
    else if(current.dataset.menuControl!=='action'&&node&&event.key===collapseKey){if(node.item.children?.length&&options.expanded(id!)){event.preventDefault();options.setExpanded(id!,false);}else if(node.parentId){event.preventDefault();focus(all.find(item=>item.dataset.menuId===node.parentId));}}
  };
  const focused=(event:FocusEvent)=>{if((event.target as HTMLElement).matches('[data-menu-control]')){lastFocused=event.target as HTMLElement;refresh();}else lastFocused=null;};
  if(options.listen!==false){root.addEventListener('keydown',key);root.addEventListener('focusin',focused);root.addEventListener('keyup',released);root.addEventListener('focusout',released);}refresh();
  return {refresh,key,focused,released,destroy(){root.removeEventListener('keydown',key);root.removeEventListener('focusin',focused);root.removeEventListener('keyup',released);root.removeEventListener('focusout',released);released();}};
}

export function renderNavigationIcon(doc:Document,icon:NavigationIcon):SVGSVGElement{
  const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',icon.viewBox??'0 0 20 20');svg.setAttribute('aria-hidden','true');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','var(--nav-icon-stroke-width)');
  for(const d of icon.paths){const path=doc.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',d);svg.append(path);}return svg;
}
const menuOwners=new WeakMap<HTMLElement,unknown>();
/** Owns the menu structure and listeners; update never replaces the host root. */
export function createNavigationMenu(root:HTMLElement,initial:NavigationMenuDOMOptions,behavior:{fallbackFocus?:()=>HTMLElement|null}={}){
  if(menuOwners.has(root))throw new Error('This root already owns a navigation menu');
  let options={...initial},nodes=indexNavigation(options.items),dead=false,collapsed=options.defaultCollapsed??false,expanded=new Set(options.defaultExpandedIds),activeSignature='';
  const doc=root.ownerDocument,original=Array.from(root.childNodes),nav=doc.createElement('nav'),list=doc.createElement('ul'),compact=doc.createElement('button'),empty=doc.createElement('p');
  nav.className='xui-navigation-menu xui-layer';list.className='xui-menu-list';compact.type='button';compact.className='xui-button xui-menu-compact-toggle';compact.dataset.variant='ghost';empty.className='xui-menu-empty';nav.append(compact,list,empty);root.replaceChildren(nav);
  type Entry={li:HTMLLIElement;row:HTMLDivElement;primary:HTMLElement;label:HTMLSpanElement;icon?:SVGSVGElement;chevron?:HTMLSpanElement;toggle?:HTMLButtonElement;children:HTMLUListElement;kind:string;
    labelFactory?:NavigationMenuDOMOptions['renderLabel'];labelSlot?:NavigationDOMSlot|null;actionFactory?:NavigationMenuDOMOptions['renderAction'];actionSlot?:NavigationDOMSlot<HTMLButtonElement>|null;actionDisabled?:boolean;actionForced?:boolean;actionLabel?:string;actionTitle?:string;decoratorFactory?:NavigationMenuDOMOptions['decorateItem'];decoration?:NavigationDOMLifecycle|void};
  const records=new Map<string,Entry>();
  const release=(entry:Entry)=>{entry.labelSlot?.destroy?.();entry.actionSlot?.destroy?.();entry.decoration?.destroy?.();entry.li.remove();};
  const assertContent=(element:Node)=>{if(element.nodeType===1&&(element as Element).matches('a,button,input,select,textarea,[tabindex],[contenteditable="true"]')||'querySelector' in element&&(element as Element).querySelector('a,button,input,select,textarea,[tabindex],[contenteditable="true"]'))throw new TypeError('Navigation label and action content must be non-interactive');};
  const snapshot=():NavigationMenuState=>Object.freeze({activeId:getNavigationActiveId(nodes,options),collapsed:options.collapsed??collapsed,expandedIds:Object.freeze([...(options.expandedIds??expanded)])});
  const arrange=(parent:HTMLElement,children:HTMLElement[])=>{children.forEach((child,index)=>{if(parent.children[index]!==child)parent.insertBefore(child,parent.children[index]??null);});for(const child of Array.from(parent.children))if(!children.includes(child as HTMLElement))child.remove();};
  const requestExpanded=(id:string,open:boolean)=>{if(dead||nodes.get(id)?.disabled)return;const next=new Set(snapshot().expandedIds);open?next.add(id):next.delete(id);if(options.expandedIds===undefined)expanded=next;options.onExpandedChange?.([...next]);render();};
  const keyboard=createNavigationKeyboard(nav,{activeId:()=>snapshot().activeId,node:id=>nodes.get(id),expanded:id=>snapshot().expandedIds.includes(id),setExpanded:requestExpanded,fallbackFocus:behavior.fallbackFocus});
  const render=()=>{
    if(dead)return;const active=getNavigationActiveId(nodes,options),signature=JSON.stringify([active,nodes.get(active??'')?.ancestors]);
    if(signature!==activeSignature&&options.expandedIds===undefined){for(const id of nodes.get(active??'')?.ancestors??[])expanded.add(id);activeSignature=signature;}
    const state=snapshot(),focused=doc.activeElement as HTMLElement|null,focusId=focused?.dataset.menuId,focusControl=focused?.dataset.menuControl;
    compact.hidden=options.showCollapseToggle===false;nav.setAttribute('aria-label',options.label??'Navigation');nav.dataset.collapsed=String(state.collapsed);compact.setAttribute('aria-label',state.collapsed?options.expandLabel??'Expand navigation':options.compactLabel??'Compact navigation');compact.setAttribute('aria-pressed',String(state.collapsed));compact.textContent=state.collapsed?'›':'‹';empty.textContent=options.emptyLabel??'No navigation items';empty.hidden=options.items.length>0;
    const used=new Set<string>();
    const build=(items:readonly NavigationItem[],parent:HTMLElement)=>{
      const children:HTMLElement[]=[];
      for(const item of items){used.add(item.id);const node=nodes.get(item.id)!,kind=item.group?'group':item.href?'link':'toggle';let entry=records.get(item.id);
        if(!entry||entry.kind!==kind){if(entry)release(entry);const li=doc.createElement('li'),row=doc.createElement('div'),primary=doc.createElement(kind==='group'?'h2':kind==='link'?'a':'button'),nested=doc.createElement('ul'),label=doc.createElement('span');label.className='xui-menu-label';primary.append(label);li.className='xui-menu-entry';li.dataset.menuEntry=item.id;row.className='xui-menu-row';nested.className='xui-menu-children';nested.id=generateDomId(doc,'xui-menu');row.append(primary);li.append(row,nested);entry={li,row,primary,label,children:nested,kind};records.set(item.id,entry);}
        const {li,primary}=entry,nested=entry.children;primary.classList.add(kind==='group'?'xui-menu-group-title':'xui-nav-item');primary.dataset.menuId=item.id;
        if(kind!=='group'){primary.dataset.menuControl='primary';primary.setAttribute('aria-disabled',String(node.disabled));primary.setAttribute('title',item.label);primary.dataset.collapsed=String(state.collapsed);}
        entry.icon?.remove();entry.icon=undefined;if(item.icon||state.collapsed){entry.icon=renderNavigationIcon(doc,resolveNavigationIcon(item.icon,options.resolveIcon));primary.insertBefore(entry.icon,entry.label);}
        const rowState:NavigationRowState={disabled:node.disabled,collapsed:state.collapsed,expanded:kind==='group'||state.expandedIds.includes(item.id),active:active===item.id};
        if(entry.labelFactory!==options.renderLabel||!entry.labelSlot){const previous=entry.labelSlot;entry.labelSlot=undefined;previous?.destroy?.();entry.labelFactory=options.renderLabel;entry.labelSlot=options.renderLabel?.(item,rowState);if(entry.labelSlot)assertContent(entry.labelSlot.element);entry.label.replaceChildren(...(entry.labelSlot?[entry.labelSlot.element]:[]));}
        entry.labelSlot?.update?.(item,rowState);if(entry.labelSlot)assertContent(entry.labelSlot.element);if(!entry.labelSlot)entry.label.textContent=item.label;
        if(kind==='link'){const link=primary as HTMLAnchorElement;node.disabled?link.removeAttribute('href'):link.setAttribute('href',item.href!);link.toggleAttribute('aria-current',active===item.id);if(active===item.id)link.setAttribute('aria-current','page');for(const name of ['target','rel'] as const)item[name]===undefined?link.removeAttribute(name):link.setAttribute(name,item[name]!);item.download===undefined||item.download===false?link.removeAttribute('download'):link.setAttribute('download',item.download===true?'':item.download);}
        const hasChildren=!!item.children?.length,open=kind==='group'||state.expandedIds.includes(item.id);nested.hidden=!open;
        if(kind==='toggle'){(primary as HTMLButtonElement).type='button';(primary as HTMLButtonElement).disabled=node.disabled||!hasChildren;primary.setAttribute('aria-expanded',String(open));primary.setAttribute('aria-controls',nested.id);if(!entry.chevron){entry.chevron=doc.createElement('span');entry.chevron.className='xui-menu-chevron';entry.chevron.setAttribute('aria-hidden','true');entry.chevron.textContent='⌄';primary.append(entry.chevron);}}
        if(kind==='link'&&hasChildren){if(!entry.toggle){entry.toggle=doc.createElement('button');entry.toggle.type='button';entry.toggle.className='xui-button xui-menu-branch-toggle';entry.toggle.dataset.variant='ghost';const arrow=doc.createElement('span');arrow.className='xui-menu-chevron';arrow.setAttribute('aria-hidden','true');arrow.textContent='⌄';entry.toggle.append(arrow);entry.row.append(entry.toggle);}entry.toggle.dataset.menuId=item.id;entry.toggle.dataset.menuControl='toggle';entry.toggle.disabled=node.disabled;entry.toggle.setAttribute('aria-expanded',String(open));entry.toggle.setAttribute('aria-controls',nested.id);entry.toggle.setAttribute('aria-label',`${open?'Collapse':'Expand'} ${item.label}`);}else{entry.toggle?.remove();entry.toggle=undefined;}
        if(entry.actionFactory!==options.renderAction||!entry.actionSlot){const previous=entry.actionSlot;entry.actionSlot=undefined;previous?.destroy?.();previous?.element.remove();entry.actionFactory=options.renderAction;entry.actionForced=false;entry.actionDisabled=undefined;entry.actionLabel=undefined;entry.actionTitle=undefined;entry.actionSlot=options.renderAction?.(item,rowState);if(entry.actionSlot){const button=entry.actionSlot.element;if(button.tagName!=='BUTTON')throw new TypeError('A navigation action must be one button');for(const child of Array.from(button.childNodes))assertContent(child);}}
        const action=entry.actionSlot?.element;if(action){if(entry.actionForced)action.disabled=entry.actionDisabled??false;entry.actionSlot?.update?.(item,rowState);for(const child of Array.from(action.childNodes))assertContent(child);entry.actionDisabled=action.disabled;entry.actionForced=node.disabled;action.type='button';action.classList.add('xui-button','xui-menu-row-action');action.dataset.variant='ghost';action.dataset.icon='true';action.dataset.menuId=item.id;action.dataset.menuControl='action';if(node.disabled)action.disabled=true;if(!action.getAttribute('aria-label')||action.getAttribute('aria-label')===entry.actionLabel){entry.actionLabel=`Actions for ${item.label}`;action.setAttribute('aria-label',entry.actionLabel);}if(!action.title||action.title===entry.actionTitle){entry.actionTitle=action.getAttribute('aria-label')!;action.title=entry.actionTitle;}if(action.parentNode!==entry.row||entry.row.lastElementChild!==action)entry.row.append(action);}
        if(entry.decoratorFactory!==options.decorateItem){const previous=entry.decoration;entry.decoration=undefined;previous?.destroy?.();entry.decoration=kind==='group'?undefined:options.decorateItem?.(primary,item,rowState);entry.decoratorFactory=options.decorateItem;}
        entry.decoration?.update?.(item,rowState);
        build(item.children??[],nested);children.push(li);
      }arrange(parent,children);
    };build(options.items,list);for(const [id,entry] of records)if(!used.has(id)){release(entry);records.delete(id);}
    keyboard.refresh();if(focusId&&(!focused?.isConnected||doc.activeElement!==focused)&&(doc.activeElement===doc.body||doc.activeElement===focused)){const entry=records.get(focusId),target=focusControl==='toggle'?entry?.toggle:focusControl==='action'?entry?.actionSlot?.element:entry?.primary;if(target&&!target.closest('[hidden]')&&!target.matches(':disabled,[aria-disabled="true"]'))target.focus();else nav.querySelector<HTMLElement>('[data-menu-control][tabindex="0"]')?.focus();}
    if(nav.closest('[data-scroll-mode="viewport"],[data-scroll-mode="workspace"],.xui-shell-sidebar-with-footer'))nav.querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'nearest'});
  };
  const click=(event:MouseEvent)=>{const control=(event.target as HTMLElement).closest<HTMLElement>('[data-menu-control]');if(!control||!nav.contains(control)||control.dataset.menuControl==='action')return;const node=nodes.get(control.dataset.menuId!);if(!node||node.disabled){event.preventDefault();return;}if(control.dataset.menuControl==='toggle'||!node.item.href){requestExpanded(node.item.id,!snapshot().expandedIds.includes(node.item.id));return;}navigateNavigationItem(node.item,event,{...options,location:options.location??doc.location?.href,baseURL:options.baseURL??doc.baseURI});};
  const guardAction=(event:MouseEvent)=>{const control=(event.target as HTMLElement).closest<HTMLElement>('[data-menu-control="action"]');if(control&&nav.contains(control)&&(nodes.get(control.dataset.menuId!)?.disabled||control.matches(':disabled,[aria-disabled="true"]'))){event.preventDefault();event.stopImmediatePropagation();}};
  const compactClick=()=>{const next=!snapshot().collapsed;if(options.collapsed===undefined)collapsed=next;options.onCollapsedChange?.(next);render();};
  nav.addEventListener('click',guardAction,true);nav.addEventListener('click',click);compact.addEventListener('click',compactClick);const releasePress=bindPressFeedback(nav);try{render();}catch(error){keyboard.destroy();releasePress();nav.removeEventListener('click',guardAction,true);nav.removeEventListener('click',click);compact.removeEventListener('click',compactClick);for(const entry of records.values())release(entry);root.replaceChildren(...original);throw error;}const owner={
    getElement:()=>nav,getState:snapshot,
    update(next:Partial<NavigationMenuDOMOptions>){if(dead)return;const candidate={...options,...next},indexed=indexNavigation(candidate.items);options=candidate;nodes=indexed;render();},
    setExpanded:requestExpanded,setCollapsed(next:boolean){if(dead)return;if(options.collapsed===undefined)collapsed=next;options.onCollapsedChange?.(next);render();},
    destroy(){if(dead)return;dead=true;keyboard.destroy();releasePress();nav.removeEventListener('click',guardAction,true);nav.removeEventListener('click',click);compact.removeEventListener('click',compactClick);for(const entry of records.values())release(entry);records.clear();root.replaceChildren(...original);menuOwners.delete(root);},
  };menuOwners.set(root,owner);return owner;
}
