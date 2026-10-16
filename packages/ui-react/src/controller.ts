import * as React from 'react';

/** Internal lifecycle bridge. Factories allocate inert models; IO starts in the owner action.
 * Injected models are never constructed, configured or destroyed by this hook. */
export function useOwnedController<C extends {destroy:()=>void}>(injected:C|undefined,create:()=>C,identity?:unknown):C {
 const controller=React.useMemo(()=>injected??create(),[injected,injected?undefined:identity]);
 const releases=React.useRef(new Map<C,object>());
 React.useEffect(()=>{
  if(injected)return;
  const token={};releases.current.set(controller,token);
  return()=>queueMicrotask(()=>{
   if(releases.current.get(controller)!==token)return;
   releases.current.delete(controller);controller.destroy();
  });
 },[controller,injected]);
 return controller;
}

/** Configuration and callbacks belong to the owned default only. */
export type ControllerProps<C,O>=({controller:C}&{[K in keyof O]?:never})|({controller?:undefined}&O);

/** JS consumers receive the same ownership error as TypeScript consumers. */
export function assertControllerProps(injected:unknown,props:object,keys:readonly string[]):void {
 if(!injected)return;
 for(const key of keys)if((props as Record<string,unknown>)[key]!==undefined)throw new TypeError(`controller cannot be combined with ${key}`);
}

const viewLifetimes=new WeakMap<object,{tokens:Set<object>;revision:number}>();
/** A View releases its transient operation scope on actual exit, not effect replay.
 * pagehide is immediate; model ownership/destruction remains separate. */
export function useViewRelease<C extends object>(owner:C,release:()=>void):void {
 const latest=React.useRef(release);latest.current=release;
 React.useLayoutEffect(()=>{
  const token={},cleanup=latest.current;
  let lifetime=viewLifetimes.get(owner);if(!lifetime){lifetime={tokens:new Set(),revision:0};viewLifetimes.set(owner,lifetime);}lifetime.tokens.add(token);lifetime.revision++;
  const hide=()=>cleanup();window.addEventListener('pagehide',hide);
  return()=>{window.removeEventListener('pagehide',hide);lifetime.tokens.delete(token);const revision=++lifetime.revision;queueMicrotask(()=>{if(!lifetime.tokens.size&&lifetime.revision===revision){viewLifetimes.delete(owner);cleanup();}});};
 },[owner]);
}
