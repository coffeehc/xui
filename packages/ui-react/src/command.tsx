import * as React from 'react';
import {Combobox} from './combobox.js';
import {Button} from './button.js';
import {cx} from './shared.js';
export interface CommandItem {id:string;label:string;group?:string;keywords?:string;disabled?:boolean}
export interface CommandPickerProps {items:readonly CommandItem[];mode?:'single'|'multiple'|'action';value?:readonly string[];defaultValue?:readonly string[];onValueChange?:(value:readonly string[])=>void;onAction?:(id:string)=>void;disabled?:boolean;label:string;emptyLabel?:string;className?:string}
/** Inline searchable composition; actions have no persistent selection. Filtering never removes chosen ids. */
export function CommandPicker({items,mode='single',value,defaultValue=[],onValueChange,onAction,disabled,label,emptyLabel='没有匹配项',className}:CommandPickerProps){
 const [internal,setInternal]=React.useState<readonly string[]>(defaultValue),[query,setQuery]=React.useState('');const selected=value??internal;
 const ids=items.map(item=>item.id),byId=new Map(items.map(item=>[item.id,item]));if(new Set(ids).size!==ids.length)throw new TypeError('Command ids must be unique');
 const filtered=items.filter(item=>(item.label+' '+(item.keywords??'')).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 const change=(next:readonly string[])=>{onValueChange?.(next);if(value===undefined)setInternal(next);};
 return <div className={cx('xui-command',className)}><Combobox.Root<string,boolean> inline open multiple={mode==='multiple'} items={ids} filteredItems={filtered.map(item=>item.id)} filter={null} value={mode==='action'?null:mode==='multiple'?[...selected]:selected[0]??null} inputValue={query} onInputValueChange={setQuery} itemToStringLabel={id=>byId.get(id)?.label??id} disabled={disabled} onValueChange={next=>{if(mode==='action'){if(typeof next==='string')onAction?.(next);return;}change(next===null?[]:Array.isArray(next)?next:[next]);}}><Combobox.Input aria-label={label}/><Combobox.Empty>{emptyLabel}</Combobox.Empty><Combobox.List>{filtered.map((item,index)=><React.Fragment key={item.id}>{item.group&&item.group!==filtered[index-1]?.group&&<div className="xui-command-group" role="presentation">{item.group}</div>}<Combobox.Item value={item.id} disabled={item.disabled}>{item.label}{mode!=='action'&&<Combobox.ItemIndicator aria-hidden="true"> ✓</Combobox.ItemIndicator>}</Combobox.Item></React.Fragment>)}</Combobox.List></Combobox.Root>{mode!=='action'&&<div className="xui-command-selected" aria-label="已选择">{selected.map(id=><Button key={id} variant="outline" disabled={disabled} aria-label={`移除 ${byId.get(id)?.label??id}`} onClick={()=>change(selected.filter(value=>value!==id))}>{byId.get(id)?.label??id} ×</Button>)}</div>}</div>;
}
