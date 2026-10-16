/** Serializable presentation data only. Permissions and business actions belong to the host. */
export type MenuItemTone='default'|'danger';
interface MenuNodeBase {id:string;hidden?:boolean}
export interface MenuActionItem extends MenuNodeBase {kind:'item';label:string;actionId:string;icon?:string;disabled?:boolean;tone?:MenuItemTone}
export interface MenuHeading extends MenuNodeBase {kind:'heading';label:string}
export interface MenuSeparator extends MenuNodeBase {kind:'separator'}
export interface MenuGroup extends MenuNodeBase {kind:'group';label?:string;items:readonly MenuEntry[]}
export type MenuEntry=MenuActionItem|MenuHeading|MenuSeparator;
export type MenuNode=MenuEntry|MenuGroup;
export interface MenuConfig {items:readonly MenuNode[];disabled?:boolean;loopFocus?:boolean}
export interface MenuFocusRequest {itemId:string;sequence:number}
export interface MenuControllerState {config:Readonly<MenuConfig>;open:boolean;activeId:string|null;focusRequest:Readonly<MenuFocusRequest>|null;destroyed:boolean}
/** preventDefault cancels this activation's automatic close. It must run synchronously.
 * Async navigation, confirmations and writes remain host-owned and are never awaited or retried. */
export interface MenuActionEvent {readonly item:Readonly<MenuActionItem>;readonly actionId:string;readonly source:'pointer'|'keyboard'|'programmatic';readonly originalEvent?:Event;readonly defaultPrevented:boolean;preventDefault:()=>void}
export interface MenuControllerOptions {config:MenuConfig;defaultOpen?:boolean;onAction?:(event:MenuActionEvent)=>void}
/** A replaceable model contract. Menu.View connects the same instance to Base UI;
 * the peer executes physical keyboard/focus behavior, with no second menu state owner. */
export interface MenuController {
 getState:()=>Readonly<MenuControllerState>;
 subscribe:(listener:()=>void)=>()=>void;
 setConfig:(config:MenuConfig)=>void;
 setOpen:(open:boolean)=>void;
 /** Request focus for a visible, enabled item while open. The View executes the request. */
 focusItem:(id:string)=>boolean;
 /** Record the peer's observed roving focus; this does not request another focus move. */
 recordFocus:(id:string|null)=>void;
 /** Returns false for closed, disabled, missing or reentrant activation. */
 activate:(id:string,context?:{source?:MenuActionEvent['source'];originalEvent?:Event})=>boolean;
 /** Idempotent; owned Views release their default instance, injected instances remain host-owned. */
 destroy:()=>void;
}
function parseConfig(input:MenuConfig):Readonly<MenuConfig>{
 const ids=new Set<string>();
 const object=(value:unknown,allowed:readonly string[])=>{
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new TypeError('Menu configuration must be plain serializable data');
  for(const key of Reflect.ownKeys(value))if(typeof key!=='string'||!allowed.includes(key)||!('value' in Object.getOwnPropertyDescriptor(value,key)!))throw new TypeError('Unknown or non-data menu configuration field');
  return value as Record<string,unknown>;
 };
 const text=(value:unknown)=>{if(typeof value!=='string'||!value.trim())throw new TypeError('Menu ids, labels and action ids must be nonempty strings');return value;};
 const flag=(value:unknown)=>{if(value!==undefined&&typeof value!=='boolean')throw new TypeError('Menu flags must be booleans');return value as boolean|undefined;};
 const nodes=(values:unknown,groups:boolean):readonly MenuNode[]=>{
  if(!Array.isArray(values)||Object.keys(values).length!==values.length)throw new TypeError('Menu items must be a dense serializable array');
  return Object.freeze(values.map(value=>{
   const raw=object(value,['id','kind','hidden','label','actionId','icon','disabled','tone','items']),id=text(raw.id),kind=raw.kind;
   if(ids.has(id))throw new TypeError('Menu node ids must be unique');ids.add(id);
   const common={id,...raw.hidden===undefined?{}:{hidden:flag(raw.hidden)}};
   if(kind==='separator'){object(value,['id','kind','hidden']);return Object.freeze({...common,kind});}
   if(kind==='heading'){object(value,['id','kind','hidden','label']);return Object.freeze({...common,kind,label:text(raw.label)});}
   if(kind==='group'&&groups){object(value,['id','kind','hidden','label','items']);return Object.freeze({...common,kind,...raw.label===undefined?{}:{label:text(raw.label)},items:nodes(raw.items,false) as readonly MenuEntry[]});}
   if(kind!=='item')throw new TypeError('Unsupported menu node kind');
   object(value,['id','kind','hidden','label','actionId','icon','disabled','tone']);
   if(raw.tone!==undefined&&!['default','danger'].includes(raw.tone as string))throw new TypeError('Invalid menu tone');
   return Object.freeze({...common,kind,label:text(raw.label),actionId:text(raw.actionId),...raw.icon===undefined?{}:{icon:text(raw.icon)},...raw.disabled===undefined?{}:{disabled:flag(raw.disabled)},...raw.tone===undefined?{}:{tone:raw.tone as MenuItemTone}});
  }));
 };
 const config=object(input,['items','disabled','loopFocus']);
 return Object.freeze({items:nodes(config.items,true),disabled:flag(config.disabled)??false,loopFocus:flag(config.loopFocus)??true});
}
function visibleItems(config:Readonly<MenuConfig>):readonly Readonly<MenuActionItem>[]{
 return config.items.flatMap(node=>node.hidden?[]:node.kind==='group'?node.items.filter((entry):entry is MenuActionItem=>entry.kind==='item'&&!entry.hidden):node.kind==='item'?[node]:[]);
}
function enabledItems(config:Readonly<MenuConfig>){return visibleItems(config).filter(item=>!item.disabled);}
export function createMenuController({config:input,defaultOpen=false,onAction}:MenuControllerOptions):MenuController{
 let state:Readonly<MenuControllerState>=Object.freeze({config:parseConfig(input),open:!!defaultOpen,activeId:null,focusRequest:null,destroyed:false}),dispatching=false,epoch=0,focusSequence=0,handler=onAction;
 if(state.config.disabled)state=Object.freeze({...state,open:false});
 if(typeof defaultOpen!=='boolean'||onAction!==undefined&&typeof onAction!=='function')throw new TypeError('Invalid menu controller options');
 const listeners=new Set<()=>void>();
 const emit=(patch:Partial<MenuControllerState>)=>{state=Object.freeze({...state,...patch});for(const listener of [...listeners])if(listeners.has(listener))try{listener();}catch{}};
 const setOpen=(open:boolean)=>{if(state.destroyed)return;if(typeof open!=='boolean')throw new TypeError('Menu open must be boolean');if(open&&state.config.disabled||open===state.open)return;epoch++;emit({open,...open?{}:{activeId:null,focusRequest:null}});};
 return {
  getState:()=>state,subscribe(listener){if(state.destroyed)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},setOpen,
  setConfig(config){if(state.destroyed)return;const parsed=parseConfig(config),previous=enabledItems(state.config),items=enabledItems(parsed),active=visibleItems(parsed).find(item=>item.id===state.activeId),fallback=state.activeId&&!active?items[Math.max(0,Math.min(previous.findIndex(item=>item.id===state.activeId),items.length-1))]:undefined;
   if(parsed.disabled&&state.open)epoch++;
   emit({config:parsed,open:state.open&&!parsed.disabled,activeId:parsed.disabled?null:active?.id??fallback?.id??null,focusRequest:parsed.disabled?null:fallback&&state.open?Object.freeze({itemId:fallback.id,sequence:++focusSequence}):state.focusRequest&&items.some(item=>item.id===state.focusRequest!.itemId)?state.focusRequest:null});
  },
  focusItem(id){if(state.destroyed||!state.open||state.config.disabled||!enabledItems(state.config).some(item=>item.id===id))return false;emit({focusRequest:Object.freeze({itemId:id,sequence:++focusSequence})});return true;},
  recordFocus(id){if(state.destroyed||!state.open||id===state.activeId)return;if(id!==null&&!visibleItems(state.config).some(item=>item.id===id))return;emit({activeId:id});},
  activate(id,context={}){
   if(state.destroyed||!state.open||state.config.disabled||dispatching)return false;
   const item=enabledItems(state.config).find(item=>item.id===id);if(!item)return false;
   let prevented=false;const current=epoch,event:MenuActionEvent=Object.freeze({item,actionId:item.actionId,source:context.source??'programmatic',originalEvent:context.originalEvent,get defaultPrevented(){return prevented;},preventDefault(){prevented=true;}});
   dispatching=true;try{handler?.(event);if(!prevented&&!state.destroyed&&epoch===current)setOpen(false);return true;}finally{dispatching=false;}
  },
  destroy(){if(state.destroyed)return;epoch++;handler=undefined;emit({open:false,activeId:null,focusRequest:null,destroyed:true,config:Object.freeze({items:Object.freeze([]),disabled:true,loopFocus:true})});listeners.clear();},
 };
}
