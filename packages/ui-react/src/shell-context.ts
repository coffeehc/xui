import type {NavigationPresentationController} from '@coffeehc/xui-runtime/interaction';
import * as React from 'react';
/** Internal bridge: the shell is the only navigation-toggle and empty-focus owner. */
export const ShellNavigationContext=React.createContext<{controller:NavigationPresentationController;owned:boolean;collapsed:boolean;onCollapsedChange:(collapsed:boolean)=>void;fallbackFocus:()=>HTMLElement|null}|null>(null);
