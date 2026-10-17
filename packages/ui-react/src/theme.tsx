import * as React from 'react';
import {getThemeController,type ThemeController,type ThemeState} from '@coffeehc/xui-runtime/theme';
/** Never creates another owner or writes storage; pass the bootstrap/host controller. */
export function useTheme(controller:ThemeController,serverState?:Readonly<ThemeState>){return React.useSyncExternalStore(controller.subscribe,controller.getState,()=>serverState??controller.getState());}

import {getThemeModePresentation,type ThemeModeLabels} from '@coffeehc/xui-runtime/theme-control';
import {Button,type IconButtonProps} from './button.js';
import {branded} from './shared.js';
const initialState:Readonly<ThemeState>=Object.freeze({mode:'dark',effective:'dark',preset:'violet'});
const noSubscription=()=>()=>{};
const initialSnapshot=()=>initialState;
export type ThemeModeButtonProps=Omit<IconButtonProps,'aria-label'|'children'|'ref'> & {theme?:ThemeController;labels?:Partial<ThemeModeLabels>};
/** A view of the shared theme owner, including host-controlled preference bridges. */
export function ThemeModeButton({theme,labels,className,disabled,onClick,...props}:ThemeModeButtonProps){
  const [fallback,setFallback]=React.useState<ThemeController>();
  const button=React.useRef<HTMLButtonElement>(null),controller=theme??fallback;
  React.useLayoutEffect(()=>{if(!theme&&button.current)setFallback(getThemeController(button.current.ownerDocument.defaultView!));},[theme]);
  const state=React.useSyncExternalStore(controller?.subscribe??noSubscription,controller?.getState??initialSnapshot,initialSnapshot),presentation=getThemeModePresentation(state.mode,labels);
  return <Button {...props} ref={button} variant="ghost" data-icon="true" className={branded('xui-theme-mode-toggle',className)} data-theme-mode={state.mode} disabled={disabled||!controller} aria-label={presentation.label} title={presentation.title} onClick={event=>{onClick?.(event);if(!event.defaultPrevented&&!event.baseUIHandlerPrevented&&controller)controller.setMode(getThemeModePresentation(controller.getState().mode).next);}}>
    <svg className="xui-theme-mode-icon" aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none" stroke="currentColor">{presentation.paths.map((d,index)=><path key={index} d={d}/>)}</svg>
  </Button>;
}
