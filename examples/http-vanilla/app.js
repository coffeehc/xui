import {createMenuLayout} from '@coffeehc/xui-runtime/menu-layout';
import {getHttpErrorMessage} from '@coffeehc/xui-runtime/http';
import {createExampleHttpOwner,contract,initialQuery} from '../shared/http-model';
import '@coffeehc/xui-theme/critical.css';
let query=initialQuery,authCount=0;const $=id=>document.getElementById(id);
const layout=createMenuLayout($('root'),{title:'xui',label:'资料导航',items:[{id:'records',label:'记录',icon:'folder',href:location.pathname}],activeId:'records'});
const owner=createExampleHttpOwner({baseURL:new URL('/api/xui-example/',location.href).href,onUnauthorized(){authCount++;$('auth').hidden=false;document.querySelector('[data-auth-count]').textContent=String(authCount);}});
const load=next=>{query=next;return owner.load(next);};
const render=()=>{const state=owner.resource.getState();$('results').setAttribute('aria-busy',String(state.busy));$('refresh').disabled=state.busy;$('cancel').hidden=!state.busy;$('data').hidden=!state.hasValue;$('feedback').replaceChildren();
  if(state.busy||state.status==='error'){const feedback=document.createElement('div');feedback.className=state.busy?'xui-state':'xui-state xui-state-error';feedback.setAttribute('role',state.busy?'status':'alert');const text=document.createElement('strong');text.textContent=state.busy?(state.hasValue?'正在刷新，保留现有记录。':'正在读取记录。'):'读取失败';feedback.append(text);if(state.status==='error'){const detail=document.createElement('p');detail.textContent=getHttpErrorMessage(state.error);const retry=document.createElement('button');retry.type='button';retry.className='xui-button';retry.dataset.variant='outline';retry.textContent='重试读取';retry.onclick=()=>owner.resource.retry();feedback.append(detail,retry);}$('feedback').append(feedback);}
  if(state.hasValue){const value=state.value;$('rows').replaceChildren(...value.list.map(record=>{const row=document.createElement('tr');for(const text of [record.name,record.created]){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}return row;}));document.querySelector('[data-total]').textContent=`共 ${value.total??'未知'} 条`;$('empty').hidden=value.list.length>0;$('rows').closest('table').hidden=value.list.length===0;const page=query.page_index-contract.pageIndexOffset+1,pages=Math.max(1,Math.ceil((value.total??value.list.length)/query.page_size));$('page').textContent=`${page} / ${pages}`;$('previous').disabled=state.busy||page===1;$('next').disabled=state.busy||page>=pages;}
};
const off=owner.resource.subscribe(render);
$('filter').onsubmit=event=>{event.preventDefault();load({...query,page_index:contract.pageIndexOffset,filters:{name:$('http-name').value}});};
$('http-sort').onchange=()=>load({...query,page_index:contract.pageIndexOffset,sort:[{field:'name',order:$('http-sort').value}]});
$('refresh').onclick=()=>load(query);$('cancel').onclick=()=>owner.resource.cancel();$('previous').onclick=()=>load({...query,page_index:query.page_index-1});$('next').onclick=()=>load({...query,page_index:query.page_index+1});
window.httpDemo={owner,refresh:()=>owner.resource.retry(),destroy(){off();owner.destroy();layout.destroy();}};
render();void load(query);
