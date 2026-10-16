import {useOverlay,type OverlayController} from './interaction-hooks.js';
import * as React from 'react';
import {Select as Base} from '@base-ui/react/select';
import {SelectTrigger,SelectItem,SelectList,SelectGroupLabel,SelectContent} from './select-parts.js';
const Select={Root:Base.Root,Trigger:SelectTrigger,Item:SelectItem,List:SelectList,GroupLabel:SelectGroupLabel,Content:SelectContent,Group:Base.Group,ItemText:Base.ItemText};
import {cx} from './shared.js';

type Item={value:string;label:string;disabled:boolean;hidden:boolean;group?:string;groupId?:number};
export type SimpleSelectControlProps=React.ComponentProps<'select'>&{controlSize?:'sm'|'default'|'lg';controller?:OverlayController};
/** React owns the popup; the original HTML select retains form and change semantics. */
export function SimpleSelectControl({controller:injected,ref,className,controlSize='default',id,onInvalid,...props}:SimpleSelectControlProps){
 const select=React.useRef<HTMLSelectElement>(null),trigger=React.useRef<HTMLButtonElement>(null);
 const [items,setItems]=React.useState<Item[]>([]),[selected,setSelected]=React.useState<string[]>([]),[label,setLabel]=React.useState(''),[labelId,setLabelId]=React.useState<string>();
 const [effectiveDisabled,setEffectiveDisabled]=React.useState(!!props.disabled);
 const model=useOverlay({controller:injected}),open=model.open,setOpen=(open:boolean)=>model.controller.setOpen(open);
 const [invalid,setInvalid]=React.useState(false),[enhanced,setEnhanced]=React.useState(false);
 React.useImperativeHandle(ref,()=>select.current!);
 const sync=React.useCallback(()=>{
  const node=select.current;if(!node)return;
  const groups=Array.from(node.querySelectorAll('optgroup'));
  const options=Array.from(node.options).map(option=>{const group=option.closest('optgroup');return {value:option.value,label:option.label,disabled:option.disabled||!!group?.disabled,hidden:option.hidden||!!group?.hidden,group:group?.label,groupId:group?groups.indexOf(group):undefined};});
  const values=Array.from(node.selectedOptions,option=>option.value);
  setItems(old=>JSON.stringify(old)===JSON.stringify(options)?old:options);setSelected(old=>JSON.stringify(old)===JSON.stringify(values)?old:values);
  const text=(node:Node):string=>{if(node===trigger.current||node===select.current)return '';if(node.nodeType===3)return node.textContent??'';if(node.nodeType===1){const element=node as HTMLElement;if(element.hidden||element.getAttribute('aria-hidden')==='true')return '';const style=element.ownerDocument.defaultView!.getComputedStyle(element);if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')return '';}return Array.from(node.childNodes,text).join('');};
  const labels=Array.from(trigger.current?.labels??[]),single=labels.length===1?labels[0]:undefined;
  setLabelId(single?.getAttribute('aria-labelledby')||undefined);
  setLabel(single?.getAttribute('aria-label')||labels.map(text).join(' ').replace(/\s+/g,' ').trim());
  const disabled=node.matches(':disabled');setEffectiveDisabled(disabled);if(disabled)setOpen(false);
 },[model.controller]);
 React.useLayoutEffect(()=>{sync();setEnhanced(true);const node=select.current!;const observer=new MutationObserver(sync);for(let parent=node.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='FIELDSET')observer.observe(parent,{attributes:true,attributeFilter:['disabled']});return()=>observer.disconnect();});
 // Native reset's default action runs after listeners; a task also covers trusted button activation.
 React.useEffect(()=>{const node=select.current,form=node?.form;let alive=true;const reset=(event:Event)=>setTimeout(()=>{if(alive&&!event.defaultPrevented){setInvalid(false);sync();}},0);form?.addEventListener('reset',reset);return()=>{alive=false;form?.removeEventListener('reset',reset);};},[props.form,sync]);
 const change=(next:string|string[]|null)=>{
  const node=select.current;if(!node||node.matches(':disabled')||props['aria-readonly']===true||props['aria-readonly']==='true')return;
  const values=Array.isArray(next)?next:next===null?[]:[next];for(const option of Array.from(node.options))option.selected=values.includes(option.value);
  const EventClass=node.ownerDocument.defaultView!.Event;node.dispatchEvent(new EventClass('input',{bubbles:true}));node.dispatchEvent(new EventClass('change',{bubbles:true}));
  setInvalid(false);sync();if(!props.multiple)setOpen(false);
 };
 const labelledBy=props['aria-labelledby']??(props['aria-label']?undefined:labelId);
 const name=props['aria-label']??(labelledBy?undefined:label||undefined);
 const visible=items.filter(item=>!item.hidden);
 const option=(item:Item)=><Select.Item key={item.value} value={item.value} data-value={item.value} disabled={item.disabled}><Select.ItemText>{item.label}</Select.ItemText></Select.Item>;
 return <span className="xui-select-control">
  {enhanced&&<Select.Root value={props.multiple?selected:selected[0]??null} multiple={props.multiple} onValueChange={change} open={open} onOpenChange={model.onOpenChange} disabled={props.disabled||effectiveDisabled}>
   <Select.Trigger ref={trigger} id={id} className={cx('xui-select',className)} data-control-size={controlSize} aria-label={name} aria-labelledby={labelledBy} aria-describedby={props['aria-describedby']} aria-invalid={props['aria-invalid']??(invalid||undefined)} aria-required={props.required||undefined} aria-readonly={props['aria-readonly']} title={props.title} tabIndex={props.tabIndex} autoFocus={props.autoFocus}>
    <span>{selected.map(value=>items.find(item=>item.value===value)?.label??'').join(', ')}</span><svg className="xui-select-control-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor"><path d="m1 6 9 8 9-8"/></svg>
   </Select.Trigger>
   <Select.Content className="xui-select-control-popup"><Select.List aria-label={name} aria-labelledby={labelledBy}>{visible.map((item,index)=>{
    if(item.groupId===undefined)return option(item);
    if(visible[index-1]?.groupId===item.groupId)return null;
    return <Select.Group key={'group-'+item.groupId}><Select.GroupLabel>{item.group}</Select.GroupLabel>{visible.filter(other=>other.groupId===item.groupId).map(option)}</Select.Group>;
   })}</Select.List></Select.Content>
  </Select.Root>}
  <select {...props} ref={select} id={enhanced?undefined:id} hidden={enhanced} aria-hidden={enhanced||undefined} className={cx('xui-select',className)} data-control-size={controlSize} onInvalid={event=>{onInvalid?.(event);if(enhanced){event.preventDefault();setInvalid(true);trigger.current?.focus();}}}/>
 </span>;
}
