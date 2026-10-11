import * as React from 'react';
import type {ThemeController,ThemeState} from '@coffeehc/xui-runtime/theme';
/** Never creates another owner or writes storage; pass the bootstrap/host controller. */
export function useTheme(controller:ThemeController,serverState?:Readonly<ThemeState>){return React.useSyncExternalStore(controller.subscribe,controller.getState,()=>serverState??controller.getState());}
