import {bindPressFeedback,createShellController} from './dom.js';
import {createNavigationMenu,indexNavigation,type NavigationMenuOptions,type NavigationAdapter} from './navigation.js';

export interface MenuLayoutOptions extends NavigationMenuOptions {
  title?:string;header?:Node;content?:Node;skipLabel?:string;closeLabel?:string;
  sidebarOpen?:boolean;defaultSidebarOpen?:boolean;onSidebarOpenChange?:(open:boolean)=>void;
}
const owners=new WeakMap<HTMLElement,unknown>();
/** Builds the public frame once. Content and host root retain identity on navigation. */
export function createMenuLayout(root:HTMLElement,initial:MenuLayoutOptions){
  if(owners.has(root))throw new Error('This root already owns a menu layout');
  let options={...initial},dead=false,internalOpen=initial.defaultSidebarOpen??false;const doc=root.ownerDocument,original=Array.from(root.childNodes),oldClass=root.getAttribute('class'),oldCollapsed=root.getAttribute('data-collapsed');
  // Validate and render the menu before changing the host's content.
  const sidebar=doc.createElement('aside'),menuRoot=doc.createElement('div');sidebar.className='xui-shell-sidebar';sidebar.dataset.xuiSidebar='';sidebar.append(menuRoot);
  const header=doc.createElement('header'),brand=doc.createElement('strong'),toggle=doc.createElement('button'),skip=doc.createElement('a'),main=doc.createElement('main'),dialog=doc.createElement('dialog'),title=doc.createElement('h2'),body=doc.createElement('div'),footer=doc.createElement('div'),close=doc.createElement('button');
  header.className='xui-shell-header';toggle.type='button';toggle.className='xui-button xui-shell-toggle';toggle.dataset.variant='ghost';toggle.dataset.xuiSidebarToggle='';toggle.textContent='☰';brand.textContent=options.title??'';header.append(toggle,brand);if(options.header)header.append(options.header);
  main.className='xui-shell-main';main.id=`xui-main-${crypto.randomUUID()}`;main.tabIndex=-1;skip.className='xui-skip-link';skip.href='#'+main.id;skip.textContent=options.skipLabel??'Skip to content';
  dialog.className='xui-native-dialog xui-shell-drawer xui-layer';dialog.dataset.xuiSidebarDialog='';title.className='xui-dialog-title';title.id=`xui-navigation-${crypto.randomUUID()}`;dialog.setAttribute('aria-labelledby',title.id);body.className='xui-dialog-body';body.dataset.xuiSidebarContent='';footer.className='xui-dialog-footer';close.type='button';close.className='xui-button';close.dataset.variant='outline';close.dataset.xuiClose='';footer.append(close);dialog.append(title,body,footer);
  let shell:ReturnType<typeof createShellController>|undefined;
  const menuOptions=():NavigationMenuOptions=>({...options,location:options.location??doc.location?.href,baseURL:options.baseURL??doc.baseURI,
    onCollapsedChange:next=>{options.onCollapsedChange?.(next);root.dataset.collapsed=String(menu.getState().collapsed);},
    navigation:options.navigation?{canNavigate:request=>options.navigation?.canNavigate?.(request)!==false,navigate:request=>{options.navigation!.navigate(request);shell?.close();}} satisfies NavigationAdapter:undefined});
  const menu=createNavigationMenu(menuRoot,menuOptions());
  root.classList.add('xui','xui-shell','xui-menu-layout');root.replaceChildren(skip,header,sidebar,main,dialog);if(options.content)main.append(options.content);else main.append(...original);
  const syncLabels=()=>{root.dataset.collapsed=String(menu.getState().collapsed);toggle.setAttribute('aria-label',options.label??'Navigation');title.textContent=options.label??'Navigation';close.textContent=options.closeLabel??'Close navigation';brand.textContent=options.title??'';};syncLabels();
  const media=doc.defaultView!.matchMedia('(max-width: 47.999rem)');
  const syncSidebar=()=>shell?.syncOpen(media.matches&&(options.sidebarOpen??internalOpen));
  shell=createShellController(root,{open:false,onOpenChange:open=>{if(options.sidebarOpen===undefined)internalOpen=open;options.onSidebarOpenChange?.(open);syncSidebar();}});
  let wasNarrow=media.matches;
  const viewport=()=>{if(wasNarrow&&!media.matches){if(options.sidebarOpen===undefined)internalOpen=false;options.onSidebarOpenChange?.(false);}wasNarrow=media.matches;syncSidebar();};
  media.addEventListener('change',viewport);syncSidebar();
  const releasePress=bindPressFeedback(root);
  const owner={getMenu:()=>menu,getMain:()=>main,getSidebarOpen:()=>shell!.getOpen(),
    update(next:Partial<MenuLayoutOptions>){if(dead)return;const candidate={...options,...next};indexNavigation(candidate.items);options=candidate;menu.update(menuOptions());if('header' in next){header.replaceChildren(toggle,brand);if(options.header)header.append(options.header);}if('content' in next)main.replaceChildren(...(options.content?[options.content]:original));syncLabels();if('sidebarOpen' in next)syncSidebar();},
    destroy(){if(dead)return;dead=true;releasePress();media.removeEventListener('change',viewport);shell!.destroy();menu.destroy();root.replaceChildren(...original);if(oldClass===null)root.removeAttribute('class');else root.setAttribute('class',oldClass);if(oldCollapsed===null)root.removeAttribute('data-collapsed');else root.setAttribute('data-collapsed',oldCollapsed);owners.delete(root);},
  };owners.set(root,owner);return owner;
}
