/** Semantic interaction models. They never own DOM focus, layout, routes, IO or permissions. */
export interface InteractionChange {
 reason?:string;event?:Event;
 /** Peer cancellation is synchronous; a canceled request never changes the model. */
 isCanceled?:boolean;cancel?:()=>void;
}
export interface ObservableController<S> {
 getState:()=>Readonly<S>;
 subscribe:(listener:()=>void)=>()=>void;
 /** Idempotent. The creator owns destruction; Views never destroy injected instances. */
 destroy:()=>void;
}
function store<S extends object>(initial:S){
 let state:Readonly<S>=Object.freeze(initial),dead=false;const listeners=new Set<()=>void>();
 return {getState:()=>state,subscribe(listener:()=>void){if(dead)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
  publish(next:S){if(dead||Object.keys(next).every(key=>Object.is(next[key as keyof S],state[key as keyof S])))return;state=Object.freeze(next);for(const listener of [...listeners])if(listeners.has(listener))listener();},
  alive:()=>!dead,destroy(){dead=true;listeners.clear();}};
}
export interface OverlayOptions {open?:boolean;defaultOpen?:boolean;onOpenChange?:(open:boolean,details?:InteractionChange)=>void}
export interface OverlayState {open:boolean}
export interface OverlayController extends ObservableController<OverlayState> {
 /** A user or programmatic request. Controlled options require explicit update confirmation. */
 setOpen:(open:boolean,details?:InteractionChange)=>boolean;
 /** External configuration/confirmation never emits change callbacks. Defaults are initial only. */
 update:(options:Partial<OverlayOptions>)=>void;
}
export function createOverlayController(initial:OverlayOptions={}):OverlayController {
 let options={...initial};const model=store({open:initial.open??initial.defaultOpen??false});
 return {getState:model.getState,subscribe:model.subscribe,destroy:model.destroy,
  setOpen(open,details){if(typeof open!=='boolean')throw new TypeError('open must be boolean');if(!model.alive()||details?.isCanceled||open===model.getState().open)return false;options.onOpenChange?.(open,details);if(details?.isCanceled||!model.alive())return false;if(options.open===undefined)model.publish({open});return true;},
  update(next){if(!model.alive())return;options={...options,...next};if(next.open!==undefined)model.publish({open:next.open});},
 };
}
export interface ValueOptions<T> {value?:T;defaultValue:T;onValueChange?:(value:T,details?:InteractionChange)=>void}
export interface ValueState<T> {value:T}
export interface ValueController<T> extends ObservableController<ValueState<T>> {
 setValue:(value:T,details?:InteractionChange)=>boolean;
 update:(options:Partial<ValueOptions<T>>)=>void;
}
/** Value selection only. Business values supplied as controlled options remain host-confirmed. */
export function createValueController<T>(initial:ValueOptions<T>):ValueController<T> {
 let options={...initial};const model=store({value:initial.value===undefined?initial.defaultValue:initial.value});
 return {getState:model.getState,subscribe:model.subscribe,destroy:model.destroy,
  setValue(value,details){if(!model.alive()||details?.isCanceled||Object.is(value,model.getState().value))return false;options.onValueChange?.(value,details);if(details?.isCanceled||!model.alive())return false;if(options.value===undefined)model.publish({value});return true;},
  update(next){if(!model.alive())return;options={...options,...next};if(next.value!==undefined)model.publish({value:next.value});},
 };
}
export interface SelectionOptions<T> extends ValueOptions<T>,OverlayOptions {
 inputValue?:string;defaultInputValue?:string;onInputValueChange?:(value:string,details?:InteractionChange)=>void;
}
export interface SelectionState<T> {value:T;open:boolean;inputValue:string;keyboardActive:boolean;highlightedValue:unknown|null}
export interface SelectionController<T> extends ObservableController<SelectionState<T>> {
 setValue:(value:T,details?:InteractionChange)=>boolean;
 setOpen:(open:boolean,details?:InteractionChange)=>boolean;
 setInputValue:(value:string,details?:InteractionChange)=>boolean;
 /** Observed peer highlight, never a second keyboard-navigation algorithm. */
 recordHighlight:(value:unknown|null,keyboard:boolean)=>void;
 setKeyboardActive:(active:boolean)=>void;
 update:(options:Partial<SelectionOptions<T>>)=>void;
}
/** Selection, popup and input form one semantic owner. Highlight is the peer's observed projection. */
export function createSelectionController<T>(initial:SelectionOptions<T>):SelectionController<T> {
 let options={...initial};const model=store<SelectionState<T>>({value:initial.value===undefined?initial.defaultValue:initial.value,open:initial.open??initial.defaultOpen??false,inputValue:initial.inputValue??initial.defaultInputValue??'',keyboardActive:false,highlightedValue:null});
 const request=<K extends 'value'|'open'|'inputValue'>(key:K,value:SelectionState<T>[K],details?:InteractionChange)=>{
  if(!model.alive()||details?.isCanceled||Object.is(model.getState()[key],value))return false;
  if(key==='value')options.onValueChange?.(value as T,details);else if(key==='open')options.onOpenChange?.(value as boolean,details);else options.onInputValueChange?.(value as string,details);
  if(details?.isCanceled||!model.alive())return false;
  if(options[key]===undefined)model.publish({...model.getState(),[key]:value,...key==='open'&&!value?{keyboardActive:false,highlightedValue:null}:{}});
  return true;
 };
 return {getState:model.getState,subscribe:model.subscribe,destroy:model.destroy,
  setValue:(value,details)=>request('value',value,details),setOpen:(value,details)=>request('open',value,details),setInputValue:(value,details)=>request('inputValue',value,details),
  recordHighlight(value,keyboard){model.publish({...model.getState(),highlightedValue:value,keyboardActive:keyboard});},setKeyboardActive(keyboardActive){model.publish({...model.getState(),keyboardActive});},
  update(next){if(!model.alive())return;options={...options,...next};const state=model.getState();model.publish({...state,value:next.value===undefined?state.value:next.value,open:next.open??state.open,inputValue:next.inputValue??state.inputValue,...next.open===false?{keyboardActive:false,highlightedValue:null}:{}});},
 };
}
export interface NavigationPresentationOptions {
 collapsed?:boolean;defaultCollapsed?:boolean;onCollapsedChange?:(collapsed:boolean)=>void;
 sidebarOpen?:boolean;defaultSidebarOpen?:boolean;onSidebarOpenChange?:(open:boolean)=>void;
 expandedIds?:readonly string[];defaultExpandedIds?:readonly string[];onExpandedChange?:(ids:readonly string[])=>void;
}
export interface NavigationPresentationState {collapsed:boolean;sidebarOpen:boolean;expandedIds:readonly string[]}
export interface NavigationPresentationController extends ObservableController<NavigationPresentationState> {
 setCollapsed:(collapsed:boolean)=>void;setSidebarOpen:(open:boolean)=>void;setExpandedIds:(ids:readonly string[])=>void;
 /** Reconcile visible active ancestors only in uncontrolled expansion mode. */
 revealAncestors:(ids:readonly string[])=>void;
 update:(options:Partial<NavigationPresentationOptions>)=>void;
}
export function createNavigationPresentationController(initial:NavigationPresentationOptions={}):NavigationPresentationController {
 let options={...initial};const ids=(value:readonly string[])=>Object.freeze([...new Set(value)]),model=store<NavigationPresentationState>({collapsed:initial.collapsed??initial.defaultCollapsed??false,sidebarOpen:initial.sidebarOpen??initial.defaultSidebarOpen??false,expandedIds:ids(initial.expandedIds??initial.defaultExpandedIds??[])});
 const same=(a:readonly string[],b:readonly string[])=>a.length===b.length&&a.every((id,index)=>id===b[index]);
 const set=<K extends keyof NavigationPresentationState>(key:K,value:NavigationPresentationState[K])=>{if(!model.alive())return;const state=model.getState();if(key==='expandedIds'?same(state.expandedIds,value as readonly string[]):state[key]===value)return;if(options[key]===undefined)model.publish({...state,[key]:value});if(key==='collapsed')options.onCollapsedChange?.(value as boolean);else if(key==='sidebarOpen')options.onSidebarOpenChange?.(value as boolean);else options.onExpandedChange?.(value as readonly string[]);};
 return {getState:model.getState,subscribe:model.subscribe,destroy:model.destroy,setCollapsed:value=>set('collapsed',value),setSidebarOpen:value=>set('sidebarOpen',value),setExpandedIds:value=>set('expandedIds',ids(value)),
  revealAncestors(value){if(options.expandedIds!==undefined||!model.alive())return;const state=model.getState(),expandedIds=ids([...state.expandedIds,...value]);if(!same(state.expandedIds,expandedIds))model.publish({...state,expandedIds});},
  update(next){if(!model.alive())return;options={...options,...next};const state=model.getState(),expanded=next.expandedIds?ids(next.expandedIds):state.expandedIds;model.publish({collapsed:next.collapsed??state.collapsed,sidebarOpen:next.sidebarOpen??state.sidebarOpen,expandedIds:same(state.expandedIds,expanded)?state.expandedIds:expanded});},
 };
}
export interface PaginationOptions {page?:number;defaultPage?:number;pageCount:number;disabled?:boolean;onPageChange?:(page:number)=>void}
export interface PaginationState {page:number;pageCount:number;disabled:boolean}
export interface PaginationController extends ObservableController<PaginationState> {setPage:(page:number)=>void;update:(options:Partial<PaginationOptions>)=>void}
export function createPaginationController(initial:PaginationOptions):PaginationController {
 let options={...initial},page=initial.page??initial.defaultPage??1;const snapshot=()=>({page:Math.min(Math.max(1,Math.floor(options.pageCount)||1),Math.max(1,Math.floor(page)||1)),pageCount:Math.max(1,Math.floor(options.pageCount)||1),disabled:!!options.disabled}),model=store(snapshot());
 return {getState:model.getState,subscribe:model.subscribe,destroy:model.destroy,setPage(next){const state=model.getState();if(!model.alive()||state.disabled||!Number.isInteger(next)||next<1||next>state.pageCount||next===state.page)return;if(options.page===undefined){page=next;model.publish(snapshot());}options.onPageChange?.(next);},update(next){if(!model.alive())return;options={...options,...next};if(next.page!==undefined)page=next.page;model.publish(snapshot());}};
}

export interface ToggleGroupOptions<T extends string=string> {value?:readonly T[];defaultValue?:readonly T[];multiple?:boolean;allowEmpty?:boolean;onValueChange?:(value:readonly T[],details?:InteractionChange)=>void}
export interface ToggleGroupState<T extends string=string> {value:readonly T[];multiple:boolean;allowEmpty:boolean}
export interface ToggleGroupController<T extends string=string> extends ObservableController<ToggleGroupState<T>> {setValue:(value:readonly T[],details?:InteractionChange)=>boolean;update:(options:Partial<ToggleGroupOptions<T>>)=>void}
/** Toggle policy and selection share one owner. Peer roving focus remains in the View. */
export function createToggleGroupController<T extends string=string>(initial:ToggleGroupOptions<T>={}):ToggleGroupController<T>{
 let options={...initial};const model=store<ToggleGroupState<T>>({value:Object.freeze([...(initial.value??initial.defaultValue??[])]),multiple:!!initial.multiple,allowEmpty:initial.allowEmpty??true});
 return {getState:model.getState,subscribe:model.subscribe,destroy:model.destroy,
  setValue(value,details){if(!model.alive()||details?.isCanceled)return false;const state=model.getState();if(!Array.isArray(value)||value.some(id=>typeof id!=='string'))throw new TypeError('Toggle values must be strings');if(!state.allowEmpty&&!value.length||!state.multiple&&value.length>1){details?.cancel?.();return false;}if(value.length===state.value.length&&value.every((id,index)=>id===state.value[index]))return false;options.onValueChange?.(value,details);if(details?.isCanceled||!model.alive())return false;if(options.value===undefined)model.publish({...state,value:Object.freeze([...new Set(value)])});return true;},
  update(next){if(!model.alive())return;options={...options,...next};const state=model.getState(),value=next.value??state.value;model.publish({value:value===state.value?state.value:Object.freeze([...value]),multiple:next.multiple??state.multiple,allowEmpty:next.allowEmpty??state.allowEmpty});},
 };
}
