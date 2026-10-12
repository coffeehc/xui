import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {GroupedCombobox} from '@coffeehc/xui-react/grouped-combobox';
import {Disclosure} from '@coffeehc/xui-react/navigation';
import {Button} from '@coffeehc/xui-react/button';
import {createGroupedSearchExample} from '../shared/grouped-search-model';
import '@coffeehc/xui-theme/style.css';
const owner=createGroupedSearchExample();
const longTitle='长中文展开标题用于验证窄屏换行以及装饰性箭头不会挤压文字'.repeat(3);
function App(){const state=React.useSyncExternalStore(owner.subscribe,owner.getState,owner.getState),[controlled,setControlled]=React.useState(true),[disabled,setDisabled]=React.useState(false);
 return <main className="xui-container xui-stack"><h1>可折叠分组搜索</h1><GroupedCombobox label="搜索全部结果" groups={state.groups} inputValue={state.query} onInputValueChange={owner.setQuery} value={state.selected} onValueChange={owner.select} onGroupOpenChange={owner.setOpen} onPageChange={owner.setPage} disabled={disabled}/><p role="status" aria-label="查询状态">{JSON.stringify({selected:state.selected,selections:state.selections,reads:state.reads,cancelled:state.cancelled})}</p><Button onClick={()=>setDisabled(!disabled)}>切换整体禁用</Button><Button onClick={()=>owner.setOpen('archive',false)}>外部收起归档</Button><Button onClick={()=>owner.setQuery('共同')}>外部查询共同</Button><Disclosure title={longTitle}><input className="xui-input" aria-label="长详情字段"/></Disclosure><Disclosure title="受控详情" open={controlled} onOpenChange={setControlled}><Button onClick={()=>setControlled(false)}>从内容关闭</Button></Disclosure><Disclosure title="禁用详情" disabled>不会显示</Disclosure><GroupedCombobox label="第二个搜索" groups={[{id:'normal',label:'第二组',items:[{id:'n-1',label:'第二实例甲'},{id:'n-locked',label:'禁用候选',disabled:true}]}]} inputValue=""/>
 <GroupedCombobox label="受控拒绝搜索" groups={[{id:"reject",label:"拒绝展开组",open:false,items:[{id:"reject-item",label:"不可自行展开"}]}]} inputValue="" onGroupOpenChange={()=>{}}/></main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<App/>);Object.assign(window,{groupedDemo:{owner,destroy(){root.unmount();owner.destroy();}}});
