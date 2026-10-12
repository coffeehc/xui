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
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
    const all=controls(),current=all.find(node=>node===root.ownerDocument.activeElement),index=current?all.indexOf(current):-1,id=current?.dataset.menuId,node=id?options.node(id):undefined;
    if(current&&(event.key==='Enter'||event.key===' '&&current.tagName==='BUTTON'))current.dataset.pressed='true';
    const rtl=getComputedStyle(root).direction==='rtl',expandKey=rtl?'ArrowLeft':'ArrowRight',collapseKey=rtl?'ArrowRight':'ArrowLeft';
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?all.length-1:index<0?0:(index+(event.key==='ArrowDown'?1:-1)+all.length)%all.length;focus(all[next]);}
    else if(node?.item.children?.length&&event.key===expandKey){event.preventDefault();if(!options.expanded(id!))options.setExpanded(id!,true);else focus(all.find(item=>options.node(item.dataset.menuId!)?.parentId===id));}
    else if(node&&event.key===collapseKey){if(node.item.children?.length&&options.expanded(id!)){event.preventDefault();options.setExpanded(id!,false);}else if(node.parentId){event.preventDefault();focus(all.find(item=>item.dataset.menuId===node.parentId));}}
  };
  const focused=(event:FocusEvent)=>{if((event.target as HTMLElement).matches('[data-menu-control]')){lastFocused=event.target as HTMLElement;refresh();}else lastFocused=null;};
  if(options.listen!==false){root.addEventListener('keydown',key);root.addEventListener('focusin',focused);root.addEventListener('keyup',released);root.addEventListener('focusout',released);}refresh();
  return {refresh,key,focused,released,destroy(){root.removeEventListener('keydown',key);root.removeEventListener('focusin',focused);root.removeEventListener('keyup',released);root.removeEventListener('focusout',released);released();}};
}

export function renderNavigationIcon(doc:Document,icon:NavigationIcon):SVGSVGElement{
  const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',icon.viewBox??'0 0 20 20');svg.setAttribute('aria-hidden','true');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.5');
  for(const d of icon.paths){const path=doc.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',d);svg.append(path);}return svg;
}
const menuOwners=new WeakMap<HTMLElement,unknown>();
/** Owns the menu structure and listeners; update never replaces the host root. */
export function createNavigationMenu(root:HTMLElement,initial:NavigationMenuOptions,behavior:{fallbackFocus?:()=>HTMLElement|null}={}){
  if(menuOwners.has(root))throw new Error('This root already owns a navigation menu');
  let options={...initial},nodes=indexNavigation(options.items),dead=false,collapsed=options.defaultCollapsed??false,expanded=new Set(options.defaultExpandedIds),activeSignature='';
  const doc=root.ownerDocument,original=Array.from(root.childNodes),nav=doc.createElement('nav'),list=doc.createElement('ul'),compact=doc.createElement('button'),empty=doc.createElement('p');
  nav.className='xui-navigation-menu xui-layer';list.className='xui-menu-list';compact.type='button';compact.className='xui-button xui-menu-compact-toggle';compact.dataset.variant='ghost';empty.className='xui-menu-empty';nav.append(compact,list,empty);root.replaceChildren(nav);
  type Entry={li:HTMLLIElement;row:HTMLDivElement;primary:HTMLElement;toggle?:HTMLButtonElement;children:HTMLUListElement;kind:string};
  const records=new Map<string,Entry>();
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
        if(!entry||entry.kind!==kind){entry?.li.remove();const li=doc.createElement('li'),row=doc.createElement('div'),primary=doc.createElement(kind==='group'?'h2':kind==='link'?'a':'button'),nested=doc.createElement('ul');li.className='xui-menu-entry';li.dataset.menuEntry=item.id;row.className='xui-menu-row';nested.className='xui-menu-children';nested.id=`xui-menu-${crypto.randomUUID()}`;row.append(primary);li.append(row,nested);entry={li,row,primary,children:nested,kind};records.set(item.id,entry);}
        const {li,primary}=entry,nested=entry.children;primary.className=kind==='group'?'xui-menu-group-title':'xui-nav-item';primary.dataset.menuId=item.id;
        if(kind!=='group'){primary.dataset.menuControl='primary';primary.setAttribute('aria-disabled',String(node.disabled));primary.setAttribute('title',item.label);primary.dataset.collapsed=String(state.collapsed);}
        primary.replaceChildren();if(item.icon||state.collapsed)primary.append(renderNavigationIcon(doc,resolveNavigationIcon(item.icon,options.resolveIcon)));const label=doc.createElement('span');label.className='xui-menu-label';label.textContent=item.label;primary.append(label);
        if(kind==='link'){const link=primary as HTMLAnchorElement;node.disabled?link.removeAttribute('href'):link.setAttribute('href',item.href!);link.toggleAttribute('aria-current',active===item.id);if(active===item.id)link.setAttribute('aria-current','page');for(const name of ['target','rel'] as const)item[name]===undefined?link.removeAttribute(name):link.setAttribute(name,item[name]!);item.download===undefined||item.download===false?link.removeAttribute('download'):link.setAttribute('download',item.download===true?'':item.download);}
        const hasChildren=!!item.children?.length,open=kind==='group'||state.expandedIds.includes(item.id);nested.hidden=!open;
        if(kind==='toggle'){(primary as HTMLButtonElement).type='button';(primary as HTMLButtonElement).disabled=node.disabled||!hasChildren;primary.setAttribute('aria-expanded',String(open));primary.setAttribute('aria-controls',nested.id);const arrow=doc.createElement('span');arrow.className='xui-menu-chevron';arrow.setAttribute('aria-hidden','true');arrow.textContent='⌄';primary.append(arrow);}
        if(kind==='link'&&hasChildren){if(!entry.toggle){entry.toggle=doc.createElement('button');entry.toggle.type='button';entry.toggle.className='xui-button xui-menu-branch-toggle';entry.toggle.dataset.variant='ghost';const arrow=doc.createElement('span');arrow.className='xui-menu-chevron';arrow.setAttribute('aria-hidden','true');arrow.textContent='⌄';entry.toggle.append(arrow);entry.row.append(entry.toggle);}entry.toggle.dataset.menuId=item.id;entry.toggle.dataset.menuControl='toggle';entry.toggle.disabled=node.disabled;entry.toggle.setAttribute('aria-expanded',String(open));entry.toggle.setAttribute('aria-controls',nested.id);entry.toggle.setAttribute('aria-label',`${open?'Collapse':'Expand'} ${item.label}`);}else{entry.toggle?.remove();entry.toggle=undefined;}
        build(item.children??[],nested);children.push(li);
      }arrange(parent,children);
    };build(options.items,list);for(const [id,entry] of records)if(!used.has(id)){entry.li.remove();records.delete(id);}
    keyboard.refresh();if(focusId&&(!focused?.isConnected||doc.activeElement!==focused)){const entry=records.get(focusId),target=focusControl==='toggle'?entry?.toggle:entry?.primary;if(target&&!target.closest('[hidden]')&&!target.matches(':disabled,[aria-disabled="true"]'))target.focus();else nav.querySelector<HTMLElement>('[data-menu-control][tabindex="0"]')?.focus();}
    if(nav.closest('[data-scroll-mode="viewport"],.xui-shell-sidebar-with-footer'))nav.querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'nearest'});
  };
  const click=(event:MouseEvent)=>{const control=(event.target as HTMLElement).closest<HTMLElement>('[data-menu-control]');if(!control)return;const node=nodes.get(control.dataset.menuId!);if(!node||node.disabled){event.preventDefault();return;}if(control.dataset.menuControl==='toggle'||!node.item.href){requestExpanded(node.item.id,!snapshot().expandedIds.includes(node.item.id));return;}navigateNavigationItem(node.item,event,{...options,location:options.location??doc.location?.href,baseURL:options.baseURL??doc.baseURI});};
  const compactClick=()=>{const next=!snapshot().collapsed;if(options.collapsed===undefined)collapsed=next;options.onCollapsedChange?.(next);render();};
  nav.addEventListener('click',click);compact.addEventListener('click',compactClick);const releasePress=bindPressFeedback(nav);render();const owner={
    getElement:()=>nav,getState:snapshot,
    update(next:Partial<NavigationMenuOptions>){if(dead)return;const candidate={...options,...next},indexed=indexNavigation(candidate.items);options=candidate;nodes=indexed;render();},
    setExpanded:requestExpanded,setCollapsed(next:boolean){if(dead)return;if(options.collapsed===undefined)collapsed=next;options.onCollapsedChange?.(next);render();},
    destroy(){if(dead)return;dead=true;keyboard.destroy();releasePress();nav.removeEventListener('click',click);compact.removeEventListener('click',compactClick);root.replaceChildren(...original);menuOwners.delete(root);},
  };menuOwners.set(root,owner);return owner;
}
