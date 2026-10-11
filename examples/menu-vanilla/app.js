import {createMenuLayout} from '@coffeehc/xui-runtime/menu-layout';
import '@coffeehc/xui-theme/critical.css';
import items from '../shared/menu-data.json';

const root=document.getElementById('root'),calls=[];
let owner,patch={},visibleItems=items;
const title=document.getElementById('page-title'),draft=document.getElementById('menu-draft'),route=document.querySelector('[data-route]');
const all=items.flatMap(item=>[item,...item.children??[]]);
const show=()=>{const page=new URL(patch.location??location.href).searchParams.get('page')??'overview';route.textContent=page;title.textContent=page==='overview'?'工作总览':all.find(item=>item.id===page)?.label??(page==='notes'?'项目资料与团队协作记录':'偏好设置');};
const matchLocation=(_item,current,target)=>current.searchParams.get('page')===target.searchParams.get('page');
const navigation={canNavigate:request=>request.id!=='browser',navigate:request=>{calls.push(request.id);if(!request.sameLocation)history.pushState(null,'',request.url);update({location:location.href});}};
function update(next){owner?.update(next);patch={...patch,...next};if(next.items)visibleItems=next.items;show();}
const pop=()=>update({location:location.href});
function mount(){if(owner)return;owner=createMenuLayout(root,{items,location:location.href,matchLocation,navigation,title:'xui',label:'工作导航',compactLabel:'紧凑导航',expandLabel:'展开导航',emptyLabel:'暂无导航',skipLabel:'跳到主内容',closeLabel:'关闭导航',...patch});window.addEventListener('popstate',pop);show();}
function destroy(){owner?.destroy();owner=undefined;window.removeEventListener('popstate',pop);}
document.getElementById('new-record').addEventListener('click',()=>{draft.value='新建记录';});
document.getElementById('empty-menu').addEventListener('click',()=>update({items:visibleItems.length?[]:items}));
window.menuDemo={update,destroy,mount,calls:()=>[...calls],getOwner:()=>owner};
if(!new URL(location.href).searchParams.has('page'))history.replaceState(null,'','?page=overview');
mount();
