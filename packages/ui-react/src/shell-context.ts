import * as React from 'react';
/** Internal bridge: the shell is the only navigation-toggle and empty-focus owner. */
export const ShellNavigationContext=React.createContext<{collapsed:boolean;onCollapsedChange:(collapsed:boolean)=>void;fallbackFocus:()=>HTMLElement|null}|null>(null);
