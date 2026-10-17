/** Public theme preference contracts. The document/application owner comes from services.ts. */
export {setInterfaceScale, type InterfaceScale, type InterfaceScaleOptions} from './interface-scale.js';
export {DEFAULT_STORAGE_KEY} from './theme-service.js';
export type {ThemeMode,EffectiveTheme,ThemeState,ThemeController,ThemeOptions,ThemePreset} from './theme-service.js';
export {getThemeService} from './theme-access.js';
import type {ThemeController} from './theme-service.js';
import {getThemeService} from './theme-access.js';
/** Existing document-owner accessor, now delegated to the unified service registry. */
export function getThemeController(win:Window):ThemeController{return getThemeService(win);}

import {serviceInstance} from './service-resolvers.js';
/** Shared document theme reference, constructed without reading DOM/storage at import. */
export const ThemeService:ThemeController=serviceInstance(getThemeService,['getState','setMode','syncMode','setPreset','isDestroyed','subscribe','destroy']);
