import * as React from 'react';
import {Button} from '@coffeehc/xui-react/button';
import {Select} from '@coffeehc/xui-react/select';
import {Combobox} from '@coffeehc/xui-react/combobox';
import {Menu} from '@coffeehc/xui-react/menu';
import {Popover} from '@coffeehc/xui-react/popover';
import {Tooltip} from '@coffeehc/xui-react/tooltip';
import {Toast} from '@coffeehc/xui-react/toast';
import {Disclosure} from '@coffeehc/xui-react/navigation';
import {Checkbox,Switch} from '@coffeehc/xui-react/forms';
function Tools(){
 const toast=Toast.useToastManager();const [value,setValue]=React.useState<string|null>('普通');const tags=['界面','资料','运行'];
 return <div className="xui-stack"><div className="xui-grid"><div className="xui-field"><label id="category-label" className="xui-label">类别</label><Select.Root value={value} onValueChange={setValue}><Select.Trigger aria-labelledby="category-label"><Select.Value/></Select.Trigger><Select.Content><Select.List>{['普通','重要','归档'].map(option=><Select.Item key={option} value={option} disabled={option==='归档'}><Select.ItemText>{option}</Select.ItemText><Select.ItemIndicator>✓</Select.ItemIndicator></Select.Item>)}</Select.List></Select.Content></Select.Root></div>
 <div className="xui-field"><label htmlFor="tag-input" className="xui-label">标签</label><Combobox.Root items={tags}><Combobox.Input id="tag-input"/><Combobox.Content><Combobox.Empty>没有匹配标签</Combobox.Empty><Combobox.List>{(item:string)=><Combobox.Item key={item} value={item}>{item}<Combobox.ItemIndicator>✓</Combobox.ItemIndicator></Combobox.Item>}</Combobox.List></Combobox.Content></Combobox.Root></div></div>
 <div className="xui-toolbar"><Menu.Root><Menu.Trigger render={<Button variant="outline"/>}>更多操作</Menu.Trigger><Menu.Content><Menu.Item onClick={()=>toast.add({title:`当前类别：${value}`,timeout:0})}>显示通知</Menu.Item><Menu.Item disabled>暂不可用</Menu.Item><Menu.Item>关闭菜单</Menu.Item></Menu.Content></Menu.Root>
 <Popover.Root><Popover.Trigger render={<Button variant="ghost"/>}>帮助</Popover.Trigger><Popover.Content><Popover.Title>使用帮助</Popover.Title><Popover.Description>已确认的选择会保留，关闭帮助不会保存草稿。</Popover.Description><Popover.Close render={<Button variant="outline"/>}>关闭帮助</Popover.Close></Popover.Content></Popover.Root>
 <Tooltip.Provider delay={0}><Tooltip.Root><Tooltip.Trigger render={<Button variant="ghost" aria-label="状态提示"/>}>ⓘ</Tooltip.Trigger><Tooltip.Content>只改变当前显示偏好</Tooltip.Content></Tooltip.Root></Tooltip.Provider></div>
 <Disclosure title="更多设置"><div className="xui-toolbar"><Checkbox label="显示完成项" defaultChecked/><Switch label="简化显示"/></div></Disclosure>
 <Toast.Portal><Toast.Viewport aria-label="通知">{toast.toasts.map(item=><Toast.Root key={item.id} toast={item}><Toast.Content><Toast.Title>{item.title}</Toast.Title><Toast.Description>{item.description}</Toast.Description><Toast.Close render={<Button variant="outline"/>}>关闭通知</Toast.Close></Toast.Content></Toast.Root>)}</Toast.Viewport></Toast.Portal></div>;
}
export function Panel(){return <Toast.Provider><Tools/></Toast.Provider>;}
