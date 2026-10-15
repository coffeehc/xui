import {generateDomId} from './dom-id.js';
import {getThemeController,type ThemeController} from './theme.js';
import {createHeaderLocaleSelect,isHeaderLocaleEnabled,type HeaderLocaleOptions} from './header-controls.js';
import {bindThemeModeButton,type ThemeModeLabels} from './theme-control.js';
import {bindPressFeedback,createShellController,type DialogCloseDetails} from './dom.js';
import {createNavigationMenu,indexNavigation,renderNavigationIcon,type NavigationMenuDOMOptions,type NavigationAdapter} from './navigation.js';

/** document: natural page; viewport: main scrolls; workspace: content fills the remaining viewport. */
export type ShellScrollMode='document'|'viewport'|'workspace';
/** standard keeps page spacing; edge removes shell content spacing only in workspace mode. */
export type ShellContentInset='standard'|'edge';
export interface MenuLayoutHeaderSlots {
  leading?:Node|null;brand?:Node|null;breadcrumb?:Node|null;status?:Node|null;actions?:Node|null;auxiliary?:Node|null;context?:Node|null;account?:Node|null;
}
export interface MenuLayoutOptions extends NavigationMenuDOMOptions {
  /** Workspace content spacing; defaults to standard and is retained in other scroll modes. */
  contentInset?:ShellContentInset;
  /** Replaces the default menu region with a host-composed sidebar; null restores it. */
  sidebar?:Node|null;
  theme?:ThemeController;themeLabels?:Partial<ThemeModeLabels>;locale?:HeaderLocaleOptions;scrollMode?:ShellScrollMode;title?:string;header?:Node;headerSlots?:MenuLayoutHeaderSlots;sidebarHeader?:Node|null;sidebarFooter?:Node|null;pageHeader?:Node|null;pageToolbar?:Node|null;pageFooter?:Node|null;content?:Node;skipLabel?:string;closeLabel?:string;
  sidebarOpen?:boolean;defaultSidebarOpen?:boolean;onSidebarOpenChange?:(open:boolean)=>void;
}
const owners=new WeakMap<HTMLElement,unknown>();
/** Builds the public frame once. Content and host root retain identity on navigation. */
export function createMenuLayout(root:HTMLElement,initial:MenuLayoutOptions){
  if(owners.has(root))throw new Error('This root already owns a menu layout');
  indexNavigation(initial.items);
  let options={...initial},dead=false,internalOpen=initial.defaultSidebarOpen??false;const doc=root.ownerDocument,original=Array.from(root.childNodes),oldClass=root.getAttribute('class'),oldCollapsed=root.getAttribute('data-collapsed'),oldScroll=root.getAttribute('data-scroll-mode'),oldInset=root.getAttribute('data-content-inset');
  const media=doc.defaultView!.matchMedia('(max-width: 47.999rem)');
  // Validate and render the menu before changing the host's content.
  const sidebar=doc.createElement('aside'),menuRoot=doc.createElement('div'),navigationControl=doc.createElement('div');sidebar.className='xui-shell-sidebar';sidebar.dataset.xuiSidebar='';sidebar.id=generateDomId(doc,'xui-sidebar');navigationControl.className='xui-shell-navigation-control';sidebar.append(navigationControl,menuRoot);
  const sidebarHeader=doc.createElement('div'),sidebarFooter=doc.createElement('div');sidebarHeader.className='xui-shell-sidebar-header';sidebarFooter.className='xui-shell-sidebar-footer';let footerInput:Node|null=null,headerInput:Node|null=null,sidebarHasSections=false;
  const hasSlotContent=(node:Element)=>Array.from(node.childNodes).some(child=>child.nodeType===1||child.nodeType===3&&!!child.textContent);
  const syncFooter=()=>{const top=options.sidebarHeader??null,node=options.sidebarFooter??null;
    if(top!==headerInput){sidebarHeader.replaceChildren(...(top?[top]:[]));headerInput=top;}if(top&&sidebarHeader.parentNode!==sidebar)sidebar.insertBefore(sidebarHeader,menuRoot);
    if(node!==footerInput){sidebarFooter.replaceChildren(...(node?[node]:[]));footerInput=node;}if(node&&sidebarFooter.parentNode!==sidebar)sidebar.append(sidebarFooter);
    sidebarHeader.hidden=!hasSlotContent(sidebarHeader);sidebarFooter.hidden=!hasSlotContent(sidebarFooter);sidebarHasSections=!sidebarHeader.hidden||!sidebarFooter.hidden;sidebar.classList.toggle('xui-shell-sidebar-with-footer',sidebarHasSections);menuRoot.classList.toggle('xui-shell-sidebar-menu',sidebarHasSections);
  };syncFooter();
  const header=doc.createElement('header'),brand=doc.createElement('strong'),toggle=doc.createElement('button'),skip=doc.createElement('a'),main=doc.createElement('main'),dialog=doc.createElement('dialog'),title=doc.createElement('h2'),body=doc.createElement('div'),footer=doc.createElement('div'),close=doc.createElement('button');
  header.className='xui-shell-header';toggle.type='button';toggle.className='xui-button xui-shell-toggle';toggle.dataset.variant='ghost';toggle.dataset.xuiSidebarToggle='';toggle.dataset.xuiMenuToggle='';toggle.dataset.icon='true';const toggleIcon=renderNavigationIcon(doc,{paths:['M3 4h14v12H3zM7 4v12','m13 8-2 2 2 2']});toggleIcon.lastElementChild?.classList.add('xui-shell-toggle-arrow');toggle.append(toggleIcon);
  // Reparenting may blur to body before a media listener runs. A new focus
  // target or pointer intent, rather than that transient blur, ends ownership.
  let controlHadFocus=false;const focused=()=>{controlHadFocus=true;},focusMoved=(event:FocusEvent)=>{if(event.target!==doc.body&&!navigationControl.contains(event.target as Node))controlHadFocus=false;},pointerMoved=(event:PointerEvent)=>{if(!navigationControl.contains(event.target as Node))controlHadFocus=false;};toggle.addEventListener('focus',focused);doc.addEventListener('focusin',focusMoved,true);doc.addEventListener('pointerdown',pointerMoved,true);
  const headerPart=(name:string)=>{const node=doc.createElement('div');node.className=`xui-app-header${name?'-'+name:''}`;return node;};
  const headerLayout=headerPart(''),primary=headerPart('primary'),secondary=headerPart('secondary'),navigationSlot=headerPart('navigation'),identity=headerPart('identity');
  const slots={leading:headerPart('leading'),brand:headerPart('brand'),breadcrumb:headerPart('breadcrumb'),status:headerPart('status'),actions:headerPart('actions'),legacy:headerPart('legacy'),auxiliary:headerPart('auxiliary'),context:headerPart('context'),account:headerPart('account')};
  const controls=headerPart('controls');let localeBinding:ReturnType<typeof createHeaderLocaleSelect>|undefined;
  const themeSlot=headerPart('theme'),themeButton=doc.createElement('button');themeSlot.append(themeButton);let themeInput:ThemeController|undefined,themeLabelsInput:Partial<ThemeModeLabels>|undefined,releaseTheme=()=>{};
  const slotInputs:Partial<Record<keyof typeof slots,Node|null>>={};
  navigationControl.append(toggle);identity.append(slots.leading,slots.brand);primary.append(identity,navigationSlot,slots.breadcrumb,slots.context);controls.append(slots.auxiliary,themeSlot);secondary.append(slots.status,slots.actions,slots.legacy,controls,slots.account);headerLayout.append(primary,secondary);header.append(headerLayout);
  const syncHeader=()=>{
    if(brand.textContent!==(options.title??''))brand.textContent=options.title??'';brand.title=options.title??'';
    const nodes={...options.headerSlots,brand:options.headerSlots?.brand===undefined?(options.title?brand:null):options.headerSlots.brand,legacy:options.header};
    for(const role of ['leading','brand','breadcrumb','status','actions','legacy','auxiliary','context','account'] as const){const node=nodes[role]??null,slot=slots[role];slot.hidden=!node;if(slotInputs[role]!==node){slot.replaceChildren(...(node?[node]:[]));slotInputs[role]=node;}slot.hidden=!hasSlotContent(slot);}
    identity.hidden=slots.leading.hidden&&slots.brand.hidden;
    const controller=options.theme??getThemeController(doc.defaultView!);if(themeInput!==controller||themeLabelsInput!==options.themeLabels){releaseTheme();releaseTheme=bindThemeModeButton(themeButton,controller,options.themeLabels);themeInput=controller;themeLabelsInput=options.themeLabels;}
    if(isHeaderLocaleEnabled(options.locale)){if(!localeBinding)localeBinding=createHeaderLocaleSelect(doc,options.locale);else localeBinding.update(options.locale);if(localeBinding.element.parentNode!==controls)controls.insertBefore(localeBinding.element,themeSlot);}else{if(localeBinding?.element.contains(doc.activeElement))themeButton.focus();localeBinding?.destroy();localeBinding=undefined;}
  };syncHeader();
  main.className='xui-shell-main';main.id=generateDomId(doc,'xui-main');main.tabIndex=-1;skip.className='xui-skip-link';skip.href='#'+main.id;skip.textContent=options.skipLabel??'Skip to content';
  dialog.className='xui-native-dialog xui-shell-drawer xui-layer';dialog.dataset.xuiSidebarDialog='';dialog.id=generateDomId(doc,'xui-sidebar-dialog');title.className='xui-dialog-title';title.id=generateDomId(doc,'xui-navigation');dialog.setAttribute('aria-labelledby',title.id);body.className='xui-dialog-body';body.dataset.xuiSidebarContent='';footer.className='xui-dialog-footer';close.type='button';close.className='xui-button';close.dataset.variant='outline';close.dataset.xuiClose='';footer.append(close);dialog.append(title,body,footer);
  const pageHeader=doc.createElement('div'),pageToolbar=doc.createElement('div'),pageFooter=doc.createElement('footer'),content=doc.createElement('div');pageHeader.className='xui-shell-page-header';pageToolbar.className='xui-shell-page-toolbar';pageFooter.className='xui-shell-page-footer';content.className='xui-shell-content';main.append(pageHeader,pageToolbar,content,pageFooter);
  let pageToolbarInput:Node|null=null,pageHeaderInput:Node|null=null,pageFooterInput:Node|null=null,contentInput:Node|undefined;
  const syncContent=()=>{const tools=options.pageToolbar??null,head=options.pageHeader??null,foot=options.pageFooter??null;pageToolbar.hidden=!tools;if(tools!==pageToolbarInput){pageToolbar.replaceChildren(...(tools?[tools]:[]));pageToolbarInput=tools;}pageHeader.hidden=!head;pageFooter.hidden=!foot;if(head!==pageHeaderInput){pageHeader.replaceChildren(...(head?[head]:[]));pageHeaderInput=head;}if(foot!==pageFooterInput){pageFooter.replaceChildren(...(foot?[foot]:[]));pageFooterInput=foot;}pageToolbar.hidden=!hasSlotContent(pageToolbar);pageHeader.hidden=!hasSlotContent(pageHeader);pageFooter.hidden=!hasSlotContent(pageFooter);if(options.content!==contentInput){content.replaceChildren(...(options.content?[options.content]:original));contentInput=options.content;}};
  let shell:ReturnType<typeof createShellController>|undefined;
  const syncToggle=()=>{if(dead)return;const target=media.matches?navigationSlot:sidebar,active=doc.activeElement,hadFocus=!!active&&navigationControl.contains(active)||controlHadFocus&&active===doc.body;navigationSlot.hidden=!media.matches;if(navigationControl.parentNode!==target){media.matches?target.append(navigationControl):target.prepend(navigationControl);}if(hadFocus&&!navigationControl.contains(doc.activeElement))toggle.focus();else if(!hadFocus)controlHadFocus=false;const collapsed=menu.getState().collapsed;toggle.setAttribute('aria-label',media.matches?options.label??'Navigation':collapsed?options.expandLabel??'Expand navigation':options.compactLabel??'Compact navigation');toggle.setAttribute('aria-expanded',String(media.matches?shell?.getOpen()??false:!collapsed));toggle.setAttribute('aria-controls',media.matches?dialog.id:sidebar.id);media.matches?toggle.setAttribute('aria-haspopup','dialog'):toggle.removeAttribute('aria-haspopup');toggle.dataset.collapsed=String(!media.matches&&collapsed);};
  const menuOptions=():NavigationMenuDOMOptions=>({...options,showCollapseToggle:false,location:options.location??doc.location?.href,baseURL:options.baseURL??doc.baseURI,
    onCollapsedChange:next=>{options.onCollapsedChange?.(next);root.dataset.collapsed=String(menu.getState().collapsed);syncToggle();},
    navigation:options.navigation?{canNavigate:request=>options.navigation?.canNavigate?.(request)!==false,navigate:request=>{shell?.close('navigation');options.navigation!.navigate(request);}} satisfies NavigationAdapter:undefined});
  const menu=createNavigationMenu(menuRoot,menuOptions(),{fallbackFocus:()=>shell?.getOpen()?close:toggle});
  const customSidebar=doc.createElement('div');let sidebarInput:Node|null=null;
  const navigationRegion=()=>options.sidebar?customSidebar:menu.getElement();
  const syncCustomSidebar=()=>{const node=options.sidebar??null,active=doc.activeElement,hadFocus=!!active&&menuRoot.contains(active);
    if(node!==sidebarInput){customSidebar.replaceChildren(...(node?[node]:[]));sidebarInput=node;}
    menu.getElement().hidden=!!node;if(node){if(customSidebar.parentNode!==menuRoot)menuRoot.append(customSidebar);}else customSidebar.remove();
    if(hadFocus&&!navigationRegion().contains(active)&&(doc.activeElement===active||doc.activeElement===doc.body)){
      const targets=Array.from(navigationRegion().querySelectorAll<HTMLElement>('[data-menu-control],button,a[href],input,select,textarea,[tabindex]')).filter(element=>!element.matches(':disabled,[aria-disabled="true"]')&&!element.closest('[hidden]'));
      (targets.find(element=>element.tabIndex===0)??targets[0]??(shell?.getOpen()?close:toggle)).focus();
    }
  };syncCustomSidebar();
  const toggleDesktop=(event:Event)=>{if(!media.matches&&!dead){event.stopImmediatePropagation();menu.setCollapsed(!menu.getState().collapsed);}};toggle.addEventListener('click',toggleDesktop,true);
  root.classList.add('xui','xui-shell','xui-menu-layout');root.replaceChildren(skip,header,sidebar,main,dialog);if(!options.content)content.append(...original);syncContent();
  const syncLabels=(scrollSelection=true)=>{syncFooter();syncCustomSidebar();root.dataset.scrollMode=options.scrollMode??'document';root.dataset.contentInset=options.contentInset??'standard';root.dataset.collapsed=String(menu.getState().collapsed);if(scrollSelection&&(options.scrollMode==='viewport'||options.scrollMode==='workspace'||sidebarHasSections))navigationRegion().querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'nearest'});syncToggle();title.textContent=options.label??'Navigation';close.textContent=options.closeLabel??'Close navigation';syncHeader();};syncLabels();
  const measureSidebar=()=>{sidebar.style.blockSize=sidebarHasSections&&!media.matches&&(options.scrollMode??'document')==='document'?`max(var(--nav-sidebar-min-height), calc(100dvh - ${header.getBoundingClientRect().height}px))`:'';body.classList.toggle('xui-shell-sidebar-body',!!sidebarHasSections);};
  const headerObserver=new ResizeObserver(measureSidebar);headerObserver.observe(header);measureSidebar();
  const syncSidebar=(details?:DialogCloseDetails)=>{shell?.syncOpen(media.matches&&(options.sidebarOpen??internalOpen),details);syncToggle();if((options.scrollMode==='viewport'||options.scrollMode==='workspace'||sidebarHasSections)&&(!media.matches||shell?.getOpen())){
    const active=doc.activeElement,target=active&&navigationRegion().contains(active)?active:navigationRegion().querySelector('[aria-current="page"]');
    // Opening preserves the roving target, which can differ from selection.
    // Do not immediately scroll that newly focused control out of view.
    target?.scrollIntoView({block:'nearest',inline:'nearest'});
  }};
  shell=createShellController(root,{open:false,restoreFocus:details=>details.reason!=='navigation',onOpenChange:(open,details)=>{if(options.sidebarOpen===undefined)internalOpen=open;options.onSidebarOpenChange?.(open);syncSidebar(details);}});
  let wasNarrow=media.matches,viewportFrame:number|undefined;
  const viewport=()=>{measureSidebar();if(wasNarrow&&!media.matches){if(options.sidebarOpen===undefined)internalOpen=false;options.onSidebarOpenChange?.(false);}wasNarrow=media.matches;syncSidebar();
    // The shared shell has its own media listener. Complete focus/aria after
    // that listener has moved the sidebar out of the closed dialog.
    if(viewportFrame!==undefined)doc.defaultView!.cancelAnimationFrame(viewportFrame);viewportFrame=doc.defaultView!.requestAnimationFrame(()=>{viewportFrame=undefined;if(!dead)syncToggle();});};
  media.addEventListener('change',viewport);dialog.addEventListener('close',syncToggle);syncSidebar();
  const releasePress=bindPressFeedback(root);
  const owner={getMenu:()=>menu,getMain:()=>main,getSidebarOpen:()=>shell!.getOpen(),
    update(next:Partial<MenuLayoutOptions>){if(dead)return;const candidate={...options,...next};indexNavigation(candidate.items);options=candidate;const updateNavigation=Object.keys(next).some(key=>key!=='contentInset'&&key!=='scrollMode');if(updateNavigation)menu.update(menuOptions());syncContent();syncLabels(updateNavigation);measureSidebar();if('sidebarOpen' in next)syncSidebar();},
    destroy(){if(dead)return;dead=true;if(viewportFrame!==undefined)doc.defaultView!.cancelAnimationFrame(viewportFrame);releaseTheme();localeBinding?.destroy();headerObserver.disconnect();releasePress();toggle.removeEventListener('click',toggleDesktop,true);toggle.removeEventListener('focus',focused);doc.removeEventListener('focusin',focusMoved,true);doc.removeEventListener('pointerdown',pointerMoved,true);dialog.removeEventListener('close',syncToggle);media.removeEventListener('change',viewport);shell!.destroy();menu.destroy();root.replaceChildren(...original);if(oldClass===null)root.removeAttribute('class');else root.setAttribute('class',oldClass);if(oldCollapsed===null)root.removeAttribute('data-collapsed');else root.setAttribute('data-collapsed',oldCollapsed);if(oldScroll===null)root.removeAttribute('data-scroll-mode');else root.setAttribute('data-scroll-mode',oldScroll);if(oldInset===null)root.removeAttribute('data-content-inset');else root.setAttribute('data-content-inset',oldInset);owners.delete(root);},
  };owners.set(root,owner);return owner;
}
