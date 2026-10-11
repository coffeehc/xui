import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Nav,NavItem,type NavItemProps} from '@coffeehc/xui-react/navigation';
import {mergeProps} from '@base-ui/react/merge-props';
import '@coffeehc/xui-theme/tokens.css';
import '@coffeehc/xui-theme/base.css';
import '@coffeehc/xui-theme/navigation.css';

type Config=Pick<NavItemProps,'selected'|'aria-current'|'disabled'|'collapsed'|'tabIndex'|'target'|'download'|'href'> & {composition?:'element'|'callback';cancelRender?:boolean;allowNative?:boolean};
declare global {interface Window {renderNavCase:(config:Config)=>number;navEvents:string[];navRef:HTMLAnchorElement|null;navRenderRef:HTMLAnchorElement|null;navIdentity:object}}
window.navIdentity={};
const root=createRoot(document.getElementById('root')!);let revision=0;
// A router-style host adapter, not a dependency on a routing framework.
function RouterLink({to,onClick,...props}:React.ComponentPropsWithRef<'a'> & {to:string}){
  return <a {...props} href={props['aria-disabled']?undefined:to} onClick={event=>{
    onClick?.(event);
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||props.target&&props.target!=='_self'||props.download!==undefined)return;
    event.preventDefault();history.pushState(null,'',to);window.navEvents.push('route');
  }}/>;
}
function Case({config,revision}:{config:Config;revision:number}){
  const ref=React.useCallback((node:HTMLAnchorElement|null)=>{window.navRef=node;},[]);
  const renderRef=React.useCallback((node:HTMLAnchorElement|null)=>{window.navRenderRef=node;},[]);
  const {composition,cancelRender,allowNative,...itemProps}=config;
  const renderClick=(event:React.MouseEvent<HTMLAnchorElement>)=>{window.navEvents.push('render-click');if(cancelRender)event.preventDefault();};
  const render:NavItemProps['render']=composition==='element'?<RouterLink to="/react/nav-destination.html" className="host-router" ref={renderRef} onClick={renderClick}/>:
    composition==='callback'?(props,state)=><RouterLink {...mergeProps<'a'>(props,{className:'host-router',onClick:renderClick})} to="/react/nav-destination.html" data-render-selected={String(state.selected)}/>:undefined;
  return <Nav aria-label="Contract navigation" data-nav-case={revision}>
    <NavItem {...itemProps} ref={ref} render={render} href={itemProps.href??'#destination'} className="host-nav-item"
      onClickCapture={()=>window.navEvents.push('capture')}
      onClick={event=>{if(!composition&&!allowNative)event.preventDefault();window.navEvents.push('click');}}
      onFocus={()=>window.navEvents.push('focus')}>
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor"><path d="M2 2h16v16H2z"/></svg>菜单
    </NavItem>
  </Nav>;
}
window.renderNavCase=config=>{revision++;window.navEvents=[];root.render(<Case key={revision} config={config} revision={revision}/>);return revision;};
// This initial consumer supplies only the standard current-page state.
window.renderNavCase({'aria-current':'page'});
