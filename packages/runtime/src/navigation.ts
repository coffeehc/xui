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
  /** Optional name-only hover/keyboard scrolling. Defaults to wrap; touch and reduced motion retain full static names. */
  labelOverflow?:'wrap'|'marquee';
  /** Align independent branch/actions with the first text line. Defaults to center; compact rail keeps its stacked layout. */
  actionAlignment?:'center'|'start';
  showCollapseToggle?:boolean;label?:string;emptyLabel?:string;compactLabel?:string;expandLabel?:string;
  /** Accessible name of a linked item's independent expand button. Return text including the current item label; defaults to `Expand ${item.label}`. */
  expandBranchLabel?:(item:NavigationItem)=>string;
  /** Accessible name of a linked item's independent collapse button. Uses the confirmed expanded state; defaults to `Collapse ${item.label}`. */
  collapseBranchLabel?:(item:NavigationItem)=>string;
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
