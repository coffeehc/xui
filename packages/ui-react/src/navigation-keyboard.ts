import type {NavigationNode} from '@coffeehc/xui-runtime/navigation';
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
