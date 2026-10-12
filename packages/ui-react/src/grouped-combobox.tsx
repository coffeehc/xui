import * as React from 'react';
import {getGroupedComboboxItems,type GroupedComboboxOptions} from '@coffeehc/xui-runtime/grouped-combobox';
import {Combobox} from './combobox.js';
import {DisclosureIndicator,Pagination} from './navigation.js';
import {cx} from './shared.js';
export type {GroupedComboboxItem,GroupedComboboxGroup,GroupedComboboxPagination} from '@coffeehc/xui-runtime/grouped-combobox';
export interface GroupedComboboxProps extends GroupedComboboxOptions {className?:string}
/** One input and one listbox. Disclosure/pagination controls are siblings of the listbox. */
export function GroupedCombobox({groups,label,inputValue,onInputValueChange,value,defaultValue=null,onValueChange,onGroupOpenChange,onPageChange,disabled,emptyLabel='没有匹配项',controlsLabel='显示分组',className}:GroupedComboboxProps){
  const [internal,setInternal]=React.useState<string|null>(defaultValue),id=React.useId(),input=React.useRef<HTMLInputElement>(null),groupIds=React.useRef(new Map<string,string>()),buttons=React.useRef(new Map<string,HTMLButtonElement>()),lastControlFocus=React.useRef<{id:string;node:HTMLElement}|null>(null);
  React.useLayoutEffect(()=>{const pending=lastControlFocus.current;if(!pending)return;if(!pending.node.isConnected&&pending.node.ownerDocument.activeElement===pending.node.ownerDocument.body){const trigger=buttons.current.get(pending.id);(trigger&&!trigger.disabled?trigger:input.current)?.focus();}if(!pending.node.isConnected||pending.node.ownerDocument.activeElement!==pending.node)lastControlFocus.current=null;});
  const {items,visible}=getGroupedComboboxItems(groups),byId=new Map(items.map(item=>[item.id,item]));
  const selected=value===undefined?internal:value;
  const groupId=(key:string)=>{let value=groupIds.current.get(key);if(!value){value=`${id}-group-${groupIds.current.size+1}`;groupIds.current.set(key,value);}return value;};
  return <div className={cx('xui-grouped-combobox',className)}>
    <Combobox.Root<string> inline open loopFocus autoHighlight={false} highlightItemOnHover={false} filter={null} items={items.map(item=>item.id)} filteredItems={visible.filter(item=>!item.disabled).map(item=>item.id)} value={selected} inputValue={inputValue} itemToStringLabel={key=>byId.get(key)?.label??key} disabled={disabled}
      onInputValueChange={(next,details)=>{if(details.reason==='input-change'||details.reason==='input-clear')onInputValueChange?.(next);else details.cancel();}}
      onValueChange={(next,details)=>{if(details.reason!=='item-press'||next===selected){details.cancel();return;}if(next!==null&&visible.some(item=>item.id===next&&!item.disabled)){if(value===undefined)setInternal(next);onValueChange?.(next);}}}>
      <Combobox.Input ref={input} aria-label={label}/>
      {groups.some(group=>group.open!==undefined)&&<div className="xui-grouped-combobox-controls" role="group" aria-label={controlsLabel}>{groups.filter(group=>group.open!==undefined).map(group=><button key={group.id} ref={node=>{if(node)buttons.current.set(group.id,node);else buttons.current.delete(group.id);}} type="button" onFocus={event=>{lastControlFocus.current={id:group.id,node:event.currentTarget};}} onBlur={event=>{if(event.currentTarget.isConnected)lastControlFocus.current=null;}} className="xui-disclosure-trigger" aria-expanded={group.open} aria-controls={groupId(group.id)} disabled={disabled||group.disabled} onClick={()=>onGroupOpenChange?.(group.id,!group.open)}><span className="xui-disclosure-label">{group.label}</span><DisclosureIndicator open={!!group.open}/></button>)}</div>}
      <Combobox.List aria-label={label}>
        {groups.map(group=><Combobox.Group key={group.id} id={groupId(group.id)} hidden={group.open===false} aria-busy={group.busy||undefined}>
          <Combobox.GroupLabel className="xui-command-group">{group.label}</Combobox.GroupLabel>
          {group.open!==false&&group.items.map((item,index)=>group.disabled||item.disabled
            // Base UI 1.7 intentionally navigates disabled Items. Keep a disabled
            // option visible, but outside the composite's selectable registry.
            ?<div key={item.id} id={`${groupId(group.id)}-disabled-${index}`} className="xui-menu-item" role="option" aria-disabled="true" aria-selected={selected===item.id}>{item.label}</div>
            :<Combobox.Item key={item.id} value={item.id}>{item.label}</Combobox.Item>)}
        </Combobox.Group>)}
      </Combobox.List>
      {visible.length===0&&!groups.some(group=>group.open!==false&&(group.busy||group.emptyLabel))&&<p className="xui-state" role="status">{emptyLabel}</p>}
    </Combobox.Root>
    <div className="xui-grouped-combobox-pages">{groups.filter(group=>group.open!==false).map(group=><React.Fragment key={group.id}>
      {group.items.length===0&&group.emptyLabel&&<p role="status">{group.label}：{group.emptyLabel}</p>}
      {group.pagination&&<Pagination onBlurCapture={event=>{if((event.target as HTMLElement).isConnected)lastControlFocus.current=null;}} onFocusCapture={event=>{lastControlFocus.current={id:group.id,node:event.target as HTMLElement};}} aria-label={`${group.label}分页`} page={group.pagination.page} pageCount={group.pagination.pageCount} previousLabel={group.pagination.previousLabel??`${group.label}上一页`} nextLabel={group.pagination.nextLabel??`${group.label}下一页`} disabled={disabled||group.disabled||group.pagination.disabled} onPageChange={page=>onPageChange?.(group.id,page)}/>}
    </React.Fragment>)}</div>
  </div>;
}
