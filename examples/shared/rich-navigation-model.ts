import type {NavigationItem,NavigationIconResolver} from '@coffeehc/xui-runtime/navigation';

export type RichNavigationGroup='projects'|'members';
export const richNavigationCopy={title:'项目与成员工作台',search:'搜索项目和成员',projects:'项目',members:'成员',longLabel:'跨区域协作与知识交付项目：保留完整中文名称、负责人及当前业务状态'};
const records:Record<RichNavigationGroup,NavigationItem[]>={
  projects:[
    {id:'project-alpha',label:richNavigationCopy.longLabel,icon:'project',href:'?page=project-alpha',children:[{id:'project-overview',label:'项目概览',icon:'document',href:'?page=project-overview'}]},
    {id:'project-folder',label:'团队项目分组',icon:'project',children:[{id:'project-board',label:'共享看板',icon:'document',href:'?page=project-board'}]},
    {id:'project-locked',label:'受限项目',icon:'project',href:'?page=project-locked',disabled:true},
    {id:'project-beta',label:'资料整理项目',icon:'project',href:'?page=project-beta'},
    {id:'project-gamma',label:'项目交付复盘',icon:'project',href:'?page=project-gamma'},
  ],
  members:[
    {id:'member-lin',label:'林同学 · 项目负责人',icon:'person',href:'?page=member-lin'},
    {id:'member-chen',label:'陈同学 · 资料协作成员',icon:'person',href:'?page=member-chen'},
    {id:'member-locked',label:'受限成员',icon:'person',href:'?page=member-locked',disabled:true},
    {id:'member-zhou',label:'周同学 · 交付协作成员',icon:'person',href:'?page=member-zhou'},
  ],
};
export const resolveRichNavigationIcon:NavigationIconResolver=name=>name==='project'?{paths:['M3 5h5l2 2h7v10H3z','m7 12 2 2 4-4']}:name==='person'?{paths:['M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6','M4 17c0-3 2-5 6-5s6 2 6 5']}:undefined;
export const navigationDetail=(item:NavigationItem)=>item.disabled?'权限受限':item.id.startsWith('member-')?'合成成员 · 可查看资料':item.children?.length?'合成项目 · 包含子导航':'合成记录 · 最近更新';
export interface RichNavigationPage {items:readonly NavigationItem[];cursor:string|null;hasMore:boolean;busy:boolean;total:undefined}
/** Synthetic host service: query/cursors/permissions and cancellation never belong to NavigationMenu. */
export function createRichNavigationExample(){
  const keys:RichNavigationGroup[]=['projects','members'];
  let query='',membersOpen=false,activeId:string|null=null,navigations=0,actions=0,lastAction:string|null=null,actionsEnabled=true,dead=false;
  const pages:Record<RichNavigationGroup,RichNavigationPage>={projects:{items:[],cursor:null,hasMore:true,busy:false,total:undefined},members:{items:[],cursor:null,hasMore:true,busy:false,total:undefined}};
  const reads={projects:0,members:0},cancelled={projects:0,members:0},discarded={projects:0,members:0},generation={projects:0,members:0};
  const pending:Partial<Record<RichNavigationGroup,AbortController>>={},busyActions=new Set<string>(),listeners=new Set<()=>void>(),timers=new Set<ReturnType<typeof setTimeout>>();
  // These opaque cursors are returned by the synthetic endpoint. No total is sent.
  const cursors=new Map<string,number>();let nextCursorId=0;
  const makeState=()=>({query,membersOpen,activeId,navigations,actions,lastAction,actionsEnabled,busyActions:[...busyActions],reads:{...reads},cancelled:{...cancelled},discarded:{...discarded},groups:{projects:{...pages.projects},members:{...pages.members}}});
  let snapshot=makeState();
  const emit=()=>{if(dead)return;snapshot=makeState();listeners.forEach(fn=>fn());};
  const cancel=(key:RichNavigationGroup)=>{generation[key]++;if(pending[key]){pending[key]!.abort();delete pending[key];cancelled[key]++;}pages[key]={...pages[key],busy:false};};
  const load=(key:RichNavigationGroup,append=false)=>{
    if(dead||key==='members'&&!membersOpen||pages[key].busy||append&&!pages[key].hasMore)return;
    const controller=new AbortController(),version=++generation[key],requestedQuery=query,offset=append?cursors.get(pages[key].cursor??'')??0:0;
    pending[key]=controller;reads[key]++;pages[key]={...pages[key],busy:true};emit();
    // Deliberately let an aborted synthetic response arrive: generation + signal
    // checks prove it cannot repopulate a closed group or a newer query.
    const timer=setTimeout(()=>{timers.delete(timer);if(dead)return;if(controller.signal.aborted||version!==generation[key]){discarded[key]++;emit();return;}
      const found=records[key].filter(item=>item.label.includes(requestedQuery)),items=found.slice(offset,offset+2),hasMore=offset+items.length<found.length;
      const cursor=hasMore?`${key}-cursor-${++nextCursorId}`:null;if(cursor)cursors.set(cursor,offset+items.length);
      delete pending[key];pages[key]={items:append?[...pages[key].items,...items]:items,cursor,hasMore,busy:false,total:undefined};emit();
    },key==='projects'?70:180);timers.add(timer);
  };
  const allItems=(items:readonly NavigationItem[]):NavigationItem[]=>items.flatMap(item=>[item,...allItems(item.children??[])]);
  const allowed=(id:string)=>allItems([...records.projects,...records.members]).some(item=>item.id===id&&!item.disabled);
  load('projects');
  return {
    getState:()=>snapshot,subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},
    setQuery(next:string){if(dead||next===query)return;query=next;for(const key of keys){cancel(key);pages[key]={items:[],cursor:null,hasMore:true,busy:false,total:undefined};}load('projects');if(membersOpen)load('members');},
    setMembersOpen(open:boolean){if(dead||open===membersOpen)return;membersOpen=open;if(open){if(pages.members.items.length===0)load('members');else emit();}else{cancel('members');emit();}},
    loadMore(key:RichNavigationGroup){load(key,true);},
    navigate(id:string){if(dead||!allowed(id))return;activeId=id;navigations++;emit();},
    configure(id:string){if(dead||!actionsEnabled||!allowed(id)||busyActions.has(id))return;busyActions.add(id);lastAction=id;actions++;emit();},
    finishActions(){if(dead)return;busyActions.clear();emit();},
    setActionsEnabled(value:boolean){if(dead)return;actionsEnabled=value;emit();},
    refresh(){if(dead)return;for(const key of keys){cancel(key);pages[key]={items:[],cursor:null,hasMore:true,busy:false,total:undefined};}load('projects');if(membersOpen)load('members');},
    destroy(){if(dead)return;dead=true;keys.forEach(cancel);timers.forEach(clearTimeout);timers.clear();listeners.clear();},
  };
}
