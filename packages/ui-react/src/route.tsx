import * as React from 'react';
import {getRouteService,type RouteService,type RouteLocation} from '@coffeehc/xui-runtime/route';
import {NavItem,type NavItemProps} from './navigation.js';
const RouteContext=React.createContext<RouteService|null>(null);
/** The app-level service owns location; the provider never constructs or disposes a second router. */
export function RouteProvider({service,children}:{service?:RouteService;children:React.ReactNode}){return <RouteContext.Provider value={service??getRouteService()}>{children}</RouteContext.Provider>;}
export function useRouteService():RouteService{return React.useContext(RouteContext)??getRouteService();}
/** Subscribe to the same service used by NavigationMenu's public navigation adapter. */
export function useRoute():Readonly<RouteLocation>{const service=useRouteService();return React.useSyncExternalStore(service.subscribe,service.getState,service.getState);}
/** Public link composition. External/unsupported links, anchors, modifiers, targets and downloads retain browser behavior. */
export function RouteLink({onClick,...props}:NavItemProps){
 const service=useRouteService();
 return <NavItem {...props} onClick={event=>{
  onClick?.(event);
  if(event.defaultPrevented||props.disabled||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||props.target&&props.target!=='_self'||props.download!==undefined&&props.download!==false||!props.href)return;
  // In-page anchors retain native scrolling/focus rather than becoming route transitions.
  if(props.href.startsWith('#'))return;
  const uri=service.resolve(props.href);if(uri===null)return;
  const target=new URL(uri,event.currentTarget.ownerDocument.baseURI),current=service.getState();
  if(target.hash&&target.pathname===current.pathname&&target.search===current.search)return;
  event.preventDefault();service.navigate(uri);
 }}/>;
}
export type {RouteLocation,RouteService,RouteServiceOptions,RouteNavigateOptions} from '@coffeehc/xui-runtime/route';
