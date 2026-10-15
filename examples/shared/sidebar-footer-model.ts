import type {NavigationItem,NavigationMenuOptions} from '@coffeehc/xui-runtime/navigation';
import type {ThemeMode} from '@coffeehc/xui-runtime/theme';
import type {SidebarTogglePlacement} from '@coffeehc/xui-runtime/menu-layout';

// Shared synthetic data only. Permissions, real authorization, requests and
// version provenance remain with the adopting application's domain owner.
export const copy={
  title:'侧栏底部组合验收',
  action:'查看工作空间授权与许可证状态',
  theme:'切换主题显示模式',
  version:'版本 1.2.3（合成示例）',
  replacement:'已替换底部内容',
  plain:'无图标的完整静态状态',
  draft:'导航与底部更新后仍保留的草稿',
};
export const shortItems:readonly NavigationItem[]=[
  {id:'overview',label:'工作总览',icon:'home',href:'?page=overview'},
  {id:'library',label:'跨团队项目资料与协作记录',icon:'folder',href:'?page=library'},
  {id:'settings',label:'工作空间偏好与通知设置',icon:'settings',href:'?page=settings'},
];
export const longItems:readonly NavigationItem[]=Array.from({length:80},(_,index)=>({
  id:`record-${index}`,label:`项目资料 ${String(index+1).padStart(2,'0')}：团队协作与处理记录`,icon:'file',href:`?page=record-${index}`,
}));
export function fixtureOptions(search:string){
  const query=new URLSearchParams(search),long=query.get('list')==='long';
  return {items:long?longItems:shortItems,activeId:query.get('page')??(long?'record-79':'overview'),
    collapsed:query.get('collapsed')==='true',composition:query.get('composition')??'layout',
    scrollMode:query.get('scroll')==='document'?'document' as const:query.get('scroll')==='workspace'?'workspace' as const:'viewport' as const,
    togglePlacement:query.get('toggle')==='bottom'?'bottom' as const:'top' as const,
    footerRow:query.has('row'),longFooter:query.has('longFooter')};
}
export interface ActionState {disabled:boolean;busy:boolean;calls:number}
/** A synchronous domain gate: busy is fact, disabled is a separate host policy. */
export function createActionModel(){
  let state:ActionState={disabled:false,busy:false,calls:0};const listeners=new Set<()=>void>();
  const publish=(next:ActionState)=>{state=next;for(const listener of [...listeners])listener();};
  return {getState:()=>state,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
    setState:(next:Partial<Pick<ActionState,'disabled'|'busy'>>)=>publish({...state,...next}),
    invoke:()=>{if(state.disabled||state.busy)return false;publish({...state,busy:true,calls:state.calls+1});return true;},
    finish:()=>publish({...state,busy:false}),
  };
}
export type ActionModel=ReturnType<typeof createActionModel>;
export type FooterKind='original'|'replacement'|'plain'|'none';
export type HostFocus='trigger'|'main'|'dialog';
export interface FixtureOwner {
  update:(next:Partial<NavigationMenuOptions>)=>void;
  setList:(long:boolean)=>void;
  setFooter:(kind:FooterKind)=>void;
  repeatFooter:()=>void;
  setActionState:(next:Partial<Pick<ActionState,'disabled'|'busy'>>)=>void;
  finish:()=>void;
  snapshot:()=>ActionState;
  setMode:(mode:ThemeMode)=>void;
  setHostFocus:(target:HostFocus)=>void;
  setOpen:(open:boolean)=>void;
  setPlacement:(placement:SidebarTogglePlacement)=>void;
  getVersionNode:()=>HTMLElement|null;
}
