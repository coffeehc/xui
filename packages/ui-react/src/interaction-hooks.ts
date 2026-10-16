import * as React from 'react';
import {createOverlayController,createValueController,createSelectionController,type OverlayController,type ValueController,type SelectionController,type InteractionChange} from '@coffeehc/xui-runtime/interaction';
import {useOwnedController,assertControllerProps,type ControllerProps} from './controller.js';
export {createOverlayController,createValueController,createSelectionController,createNavigationPresentationController,createPaginationController,createToggleGroupController} from '@coffeehc/xui-runtime/interaction';
export type {OverlayController,OverlayOptions,OverlayState,ValueController,ValueOptions,ValueState,SelectionController,SelectionOptions,SelectionState,NavigationPresentationController,NavigationPresentationOptions,NavigationPresentationState,PaginationController,PaginationOptions,PaginationState,ObservableController,InteractionChange,ToggleGroupController,ToggleGroupOptions,ToggleGroupState} from '@coffeehc/xui-runtime/interaction';
/** Owned initialization/callback props and external model injection are mutually exclusive. */
export type WithController<P,K extends keyof P,C>=Omit<P,K>&ControllerProps<C,Pick<P,K>>;
export function useOverlay<D extends InteractionChange>(props:{controller?:OverlayController;open?:boolean;defaultOpen?:boolean;onOpenChange?:(open:boolean,details:D)=>void}){
 assertControllerProps(props.controller,props,['open','defaultOpen','onOpenChange']);
 const controller=useOwnedController(props.controller,()=>createOverlayController({open:props.open,defaultOpen:props.defaultOpen}));
 const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState);
 React.useLayoutEffect(()=>{if(!props.controller)controller.update({open:props.open});},[controller,props.controller,props.open]);
 // Controlled props are the current render's confirmed facts. Synchronizing
 // the owned model after commit must not delay DOM visibility until a rerender.
 return {controller,open:props.controller?state.open:props.open??state.open,onOpenChange:(open:boolean,details:D)=>{if(!props.controller)props.onOpenChange?.(open,details);if(!details.isCanceled)controller.setOpen(open,details);}};
}
export function useValue<T,D extends InteractionChange>(props:{controller?:ValueController<T>;value?:T;defaultValue:T;onValueChange?:(value:T,details:D)=>void}){
 assertControllerProps(props.controller,props,['value','onValueChange']);
 const controller=useOwnedController(props.controller,()=>createValueController({value:props.value,defaultValue:props.defaultValue}));
 const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState);
 React.useLayoutEffect(()=>{if(!props.controller)controller.update({value:props.value});},[controller,props.controller,props.value]);
 return {controller,value:props.controller||props.value===undefined?state.value:props.value,onValueChange:(value:T,details:D)=>{if(!props.controller)props.onValueChange?.(value,details);if(!details.isCanceled)controller.setValue(value,details);}};
}
export function useSelection<T,D extends InteractionChange>(props:{controller?:SelectionController<T>;value?:T;defaultValue:T;open?:boolean;defaultOpen?:boolean;inputValue?:string;defaultInputValue?:string;onValueChange?:(value:T,details:D)=>void;onOpenChange?:(open:boolean,details:D)=>void;onInputValueChange?:(value:string,details:D)=>void}){
 assertControllerProps(props.controller,props,['value','open','defaultOpen','inputValue','defaultInputValue','onValueChange','onOpenChange','onInputValueChange']);
 const controller=useOwnedController(props.controller,()=>createSelectionController({value:props.value,defaultValue:props.defaultValue,open:props.open,defaultOpen:props.defaultOpen,inputValue:props.inputValue,defaultInputValue:props.defaultInputValue}));
 const state=React.useSyncExternalStore(controller.subscribe,controller.getState,controller.getState);
 React.useLayoutEffect(()=>{if(!props.controller)controller.update({value:props.value,open:props.open,inputValue:props.inputValue});},[controller,props.controller,props.value,props.open,props.inputValue]);
 const viewState=React.useMemo(()=>props.controller?state:{...state,value:props.value===undefined?state.value:props.value,open:props.open??state.open,inputValue:props.inputValue??state.inputValue,...props.open===false?{keyboardActive:false,highlightedValue:null}:{}},[state,props.controller,props.value,props.open,props.inputValue]);
 return {controller,state:viewState,onValueChange:(value:T,details:D)=>{if(!props.controller)props.onValueChange?.(value,details);if(!details.isCanceled)controller.setValue(value,details);},onOpenChange:(open:boolean,details:D)=>{if(!props.controller)props.onOpenChange?.(open,details);if(!details.isCanceled)controller.setOpen(open,details);},onInputValueChange:(value:string,details:D)=>{if(!props.controller)props.onInputValueChange?.(value,details);if(!details.isCanceled)controller.setInputValue(value,details);}};
}
