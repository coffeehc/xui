/** Public theme preference contracts. The document/application owner comes from services.ts. */
export {setInterfaceScale, type InterfaceScale, type InterfaceScaleOptions} from './interface-scale.js';
export {DEFAULT_STORAGE_KEY} from './theme-service.js';
export type {ThemeMode,EffectiveTheme,ThemeState,ThemeController,ThemeOptions} from './theme-service.js';
export {getThemeService} from './theme-access.js';
import type {ThemeController} from './theme-service.js';
import {getThemeService} from './theme-access.js';
/** Existing document-owner accessor, now delegated to the unified service registry. */
export function getThemeController(win:Window):ThemeController{return getThemeService(win);}
