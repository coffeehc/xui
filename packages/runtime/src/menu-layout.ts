import {bindPressFeedback,createShellController,type DialogCloseDetails} from './dom.js';
import {createNavigationMenu,indexNavigation,renderNavigationIcon,type NavigationMenuOptions,type NavigationAdapter} from './navigation.js';

export interface MenuLayoutHeaderSlots {
  brand?:Node|null;breadcrumb?:Node|null;status?:Node|null;actions?:Node|null;
}
export interface MenuLayoutOptions extends NavigationMenuOptions {
  scrollMode?:'document'|'viewport';title?:string;header?:Node;headerSlots?:MenuLayoutHeaderSlots;sidebarFooter?:Node|null;content?:Node;skipLabel?:string;closeLabel?:string;
  sidebarOpen?:boolean;defaultSidebarOpen?:boolean;onSidebarOpenChange?:(open:boolean)=>void;
}
const owners=new WeakMap<HTMLElement,unknown>();
/** Builds the public frame once. Content and host root retain identity on navigation. */
export function createMenuLayout(root:HTMLElement,initial:MenuLayoutOptions){
  if(owners.has(root))throw new Error('This root already owns a menu layout');
  indexNavigation(initial.items);
  let options={...initial},dead=false,internalOpen=initial.defaultSidebarOpen??false;const doc=root.ownerDocument,original=Array.from(root.childNodes),oldClass=root.getAttribute('class'),oldCollapsed=root.getAttribute('data-collapsed'),oldScroll=root.getAttribute('data-scroll-mode');
  const media=doc.defaultView!.matchMedia('(max-width: 47.999rem)');
  // Validate and render the menu before changing the host's content.
  const sidebar=doc.createElement('aside'),menuRoot=doc.createElement('div');sidebar.className='xui-shell-sidebar';sidebar.dataset.xuiSidebar='';sidebar.id=`xui-sidebar-${crypto.randomUUID()}`;sidebar.append(menuRoot);
  const sidebarFooter=doc.createElement('div');sidebarFooter.className='xui-shell-sidebar-footer';sidebarFooter.hidden=true;let footerInput:Node|null=null;
  const syncFooter=()=>{const node=options.sidebarFooter??null;sidebarFooter.hidden=!node;sidebar.classList.toggle('xui-shell-sidebar-with-footer',!!node);menuRoot.classList.toggle('xui-shell-sidebar-menu',!!node);if(node!==footerInput){sidebarFooter.replaceChildren(...(node?[node]:[]));footerInput=node;}if(node&&sidebarFooter.parentNode!==sidebar)sidebar.append(sidebarFooter);};syncFooter();
  const header=doc.createElement('header'),brand=doc.createElement('strong'),toggle=doc.createElement('button'),skip=doc.createElement('a'),main=doc.createElement('main'),dialog=doc.createElement('dialog'),title=doc.createElement('h2'),body=doc.createElement('div'),footer=doc.createElement('div'),close=doc.createElement('button');
  header.className='xui-shell-header';toggle.type='button';toggle.className='xui-button xui-shell-toggle';toggle.dataset.variant='ghost';toggle.dataset.xuiSidebarToggle='';toggle.dataset.xuiMenuToggle='';toggle.dataset.icon='true';const toggleIcon=renderNavigationIcon(doc,{paths:['M3 4h14v12H3zM7 4v12','m13 8-2 2 2 2']});toggleIcon.lastElementChild?.classList.add('xui-shell-toggle-arrow');toggle.append(toggleIcon);
  const headerPart=(name:string)=>{const node=doc.createElement('div');node.className=`xui-app-header${name?'-'+name:''}`;return node;};
  const headerLayout=headerPart(''),primary=headerPart('primary'),secondary=headerPart('secondary'),navigationSlot=headerPart('navigation');
  const slots={brand:headerPart('brand'),breadcrumb:headerPart('breadcrumb'),status:headerPart('status'),actions:headerPart('actions'),legacy:headerPart('legacy')};
  const slotInputs:Partial<Record<keyof typeof slots,Node|null>>={};
  navigationSlot.append(toggle);primary.append(navigationSlot,slots.brand,slots.breadcrumb);secondary.append(slots.status,slots.actions,slots.legacy);headerLayout.append(primary,secondary);header.append(headerLayout);
  const syncHeader=()=>{
    if(brand.textContent!==(options.title??''))brand.textContent=options.title??'';brand.title=options.title??'';
    const nodes={...options.headerSlots,brand:options.headerSlots?.brand===undefined?(options.title?brand:null):options.headerSlots.brand,legacy:options.header};
    for(const role of ['brand','breadcrumb','status','actions','legacy'] as const){const node=nodes[role]??null,slot=slots[role];slot.hidden=!node;if(slotInputs[role]!==node){slot.replaceChildren(...(node?[node]:[]));slotInputs[role]=node;}}
    secondary.hidden=!nodes.status&&!nodes.actions&&!nodes.legacy;
  };syncHeader();
  main.className='xui-shell-main';main.id=`xui-main-${crypto.randomUUID()}`;main.tabIndex=-1;skip.className='xui-skip-link';skip.href='#'+main.id;skip.textContent=options.skipLabel??'Skip to content';
  dialog.className='xui-native-dialog xui-shell-drawer xui-layer';dialog.dataset.xuiSidebarDialog='';dialog.id=`xui-sidebar-dialog-${crypto.randomUUID()}`;title.className='xui-dialog-title';title.id=`xui-navigation-${crypto.randomUUID()}`;dialog.setAttribute('aria-labelledby',title.id);body.className='xui-dialog-body';body.dataset.xuiSidebarContent='';footer.className='xui-dialog-footer';close.type='button';close.className='xui-button';close.dataset.variant='outline';close.dataset.xuiClose='';footer.append(close);dialog.append(title,body,footer);
  let shell:ReturnType<typeof createShellController>|undefined;
  const syncToggle=()=>{if(dead)return;const collapsed=menu.getState().collapsed;toggle.setAttribute('aria-label',media.matches?options.label??'Navigation':collapsed?options.expandLabel??'Expand navigation':options.compactLabel??'Compact navigation');toggle.setAttribute('aria-expanded',String(media.matches?shell?.getOpen()??false:!collapsed));toggle.setAttribute('aria-controls',media.matches?dialog.id:sidebar.id);media.matches?toggle.setAttribute('aria-haspopup','dialog'):toggle.removeAttribute('aria-haspopup');toggle.dataset.collapsed=String(!media.matches&&collapsed);};
  const menuOptions=():NavigationMenuOptions=>({...options,showCollapseToggle:false,location:options.location??doc.location?.href,baseURL:options.baseURL??doc.baseURI,
    onCollapsedChange:next=>{options.onCollapsedChange?.(next);root.dataset.collapsed=String(menu.getState().collapsed);syncToggle();},
    navigation:options.navigation?{canNavigate:request=>options.navigation?.canNavigate?.(request)!==false,navigate:request=>{shell?.close('navigation');options.navigation!.navigate(request);}} satisfies NavigationAdapter:undefined});
  const menu=createNavigationMenu(menuRoot,menuOptions(),{fallbackFocus:()=>shell?.getOpen()?close:toggle});
  const toggleDesktop=(event:Event)=>{if(!media.matches&&!dead){event.stopImmediatePropagation();menu.setCollapsed(!menu.getState().collapsed);}};toggle.addEventListener('click',toggleDesktop,true);
  root.classList.add('xui','xui-shell','xui-menu-layout');root.replaceChildren(skip,header,sidebar,main,dialog);if(options.content)main.append(options.content);else main.append(...original);
  const syncLabels=()=>{syncFooter();root.dataset.scrollMode=options.scrollMode??'document';root.dataset.collapsed=String(menu.getState().collapsed);if(options.scrollMode==='viewport'||options.sidebarFooter)menuRoot.querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'nearest'});syncToggle();title.textContent=options.label??'Navigation';close.textContent=options.closeLabel??'Close navigation';syncHeader();};syncLabels();
  const measureSidebar=()=>{sidebar.style.blockSize=options.sidebarFooter&&!media.matches&&options.scrollMode!=='viewport'?`max(calc(var(--nav-item-height) * 4), calc(100dvh - ${header.getBoundingClientRect().height}px))`:'';body.classList.toggle('xui-shell-sidebar-body',!!options.sidebarFooter);};
  const headerObserver=new ResizeObserver(measureSidebar);headerObserver.observe(header);measureSidebar();
  const syncSidebar=(details?:DialogCloseDetails)=>{shell?.syncOpen(media.matches&&(options.sidebarOpen??internalOpen),details);syncToggle();if((options.scrollMode==='viewport'||options.sidebarFooter)&&(!media.matches||shell?.getOpen())){
    const active=doc.activeElement,target=active&&menuRoot.contains(active)?active:menuRoot.querySelector('[aria-current="page"]');
    // Opening preserves the roving target, which can differ from selection.
    // Do not immediately scroll that newly focused control out of view.
    target?.scrollIntoView({block:'nearest',inline:'nearest'});
  }};
  shell=createShellController(root,{open:false,restoreFocus:details=>details.reason!=='navigation',onOpenChange:(open,details)=>{if(options.sidebarOpen===undefined)internalOpen=open;options.onSidebarOpenChange?.(open);syncSidebar(details);}});
  let wasNarrow=media.matches;
  const viewport=()=>{measureSidebar();if(wasNarrow&&!media.matches){if(options.sidebarOpen===undefined)internalOpen=false;options.onSidebarOpenChange?.(false);}wasNarrow=media.matches;syncSidebar();};
  media.addEventListener('change',viewport);dialog.addEventListener('close',syncToggle);syncSidebar();
  const releasePress=bindPressFeedback(root);
  const owner={getMenu:()=>menu,getMain:()=>main,getSidebarOpen:()=>shell!.getOpen(),
    update(next:Partial<MenuLayoutOptions>){if(dead)return;const candidate={...options,...next};indexNavigation(candidate.items);options=candidate;menu.update(menuOptions());if('content' in next)main.replaceChildren(...(options.content?[options.content]:original));syncLabels();measureSidebar();if('sidebarOpen' in next)syncSidebar();},
    destroy(){if(dead)return;dead=true;headerObserver.disconnect();releasePress();toggle.removeEventListener('click',toggleDesktop,true);dialog.removeEventListener('close',syncToggle);media.removeEventListener('change',viewport);shell!.destroy();menu.destroy();root.replaceChildren(...original);if(oldClass===null)root.removeAttribute('class');else root.setAttribute('class',oldClass);if(oldCollapsed===null)root.removeAttribute('data-collapsed');else root.setAttribute('data-collapsed',oldCollapsed);if(oldScroll===null)root.removeAttribute('data-scroll-mode');else root.setAttribute('data-scroll-mode',oldScroll);owners.delete(root);},
  };owners.set(root,owner);return owner;
}
