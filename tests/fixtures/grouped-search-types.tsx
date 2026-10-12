import {GroupedCombobox,type GroupedComboboxProps,type GroupedComboboxGroup} from '@coffeehc/xui-react/grouped-combobox';
import {Disclosure,DisclosureIndicator} from '@coffeehc/xui-react/navigation';
import {createGroupedCombobox} from '@coffeehc/xui-runtime/grouped-combobox-dom';
const groups:GroupedComboboxGroup[]=[{id:'normal',label:'普通',items:[{id:'one',label:'第一项'}],pagination:{page:1,pageCount:2}},{id:'archive',label:'归档',items:[],open:false}];
const props:GroupedComboboxProps={label:'搜索',groups,inputValue:'',onInputValueChange:query=>query.toUpperCase(),onGroupOpenChange:(id,open)=>[id,open],onPageChange:(id,page)=>[id,page]};
export const Example=()=> <><GroupedCombobox {...props}/><Disclosure title="详情"><span>内容</span></Disclosure><DisclosureIndicator open={false}/></>;
const native=createGroupedCombobox(document.createElement('div'),props);native.update({groups,inputValue:'新的查询'});native.destroy();
// @ts-expect-error A boolean, not a string, controls group visibility.
const wrong:GroupedComboboxGroup={id:'wrong',label:'错误',items:[],open:'false'};
// @ts-expect-error Host pagination needs its page count.
const missing:GroupedComboboxGroup={id:'missing',label:'缺项',items:[],pagination:{page:1}};
