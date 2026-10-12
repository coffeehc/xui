import type {NavigationItem} from '@coffeehc/xui-runtime/navigation';

// Deliberately synthetic Chinese content. Both independent package consumers use
// the same inputs; all layout, typography and theme rules belong to xui.
export const copy = {
  brand:'咖啡工作台与跨团队协作管理中心',
  breadcrumb:['团队项目与知识资料','当前项目的详细配置与协作记录'],
  status:'所有更改已保存（演示）',
  updatedStatus:'已更新当前项目（演示）',
  actions:['保存草稿','导出数据','帮助中心'],
  draft:'保留这份正在编辑的草稿',
};
export const shortItems: readonly NavigationItem[] = [
  {id:'overview',label:'工作总览',icon:'home',href:'?page=overview'},
  {id:'library',label:'项目资料与团队协作记录',icon:'folder',href:'?page=library'},
  {id:'settings',label:'工作空间偏好与通知设置',icon:'settings',href:'?page=settings'},
];
export const branchItems: readonly NavigationItem[] = shortItems.map(item => item.id === 'library'
  ? {...item,children:[{id:'notes',label:'项目中的详细文档与笔记',icon:'file',href:'?page=notes'}]}
  : item);
export const longItems: readonly NavigationItem[] = Array.from({length:80},(_,index)=>({
  id:`record-${index}`,label:`项目资料 ${String(index+1).padStart(2,'0')}：团队协作与处理记录`,
  icon:'file',href:`?page=record-${index}`,
}));
export function fixtureOptions(search:string) {
  const query=new URLSearchParams(search),list=query.get('list');
  return {
    items:list==='long'?longItems:list==='branch'?branchItems:shortItems,
    activeId:query.get('page')??(list==='long'?'record-79':'overview'),
    collapsed:query.get('collapsed')==='true',
    header:query.get('header')??'full',
    composition:query.get('composition')??'layout',
    scrollMode:query.get('scroll')==='viewport'?'viewport' as const:'document' as const,
  };
}
