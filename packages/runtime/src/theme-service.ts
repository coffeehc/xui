export {setInterfaceScale,type InterfaceScale,type InterfaceScaleOptions} from './interface-scale.js';
import {isThemePreset,type ThemePreset} from './theme-preset.js';
import {reapplyInterfaceScale} from './interface-scale.js';
export type {ThemePreset} from './theme-preset.js';

export type ThemeMode = 'light' | 'dark' | 'system';
export type EffectiveTheme = Exclude<ThemeMode, 'system'>;
export interface ThemeState { mode: ThemeMode; effective: EffectiveTheme; preset:ThemePreset }
export interface ThemeController {
  getState(): Readonly<ThemeState>;
  setMode(mode: ThemeMode): void;
  /** Apply a host-owned mode without writing storage or requesting another change. */
  syncMode(mode: ThemeMode): void;
  /** Project-owned palette selection. Does not write storage or change mode. Invalid JS values use violet. */
  setPreset(preset:ThemePreset):void;
  isDestroyed(): boolean;
  subscribe(listener: (state: Readonly<ThemeState>) => void): () => void;
  destroy(): void;
}
export interface ThemeOptions {
  /** Project palette, default violet. Independent of saved brightness preference; never persisted implicitly. */
  preset?:ThemePreset;
  /** Same sessionStorage key for the pre-paint initializer and the application controller. */
  storageKey?: string;
  /** Inject a window for isolated tests/iframes. Does not touch DOM at import time. */
  window?: Window|null;
  /** Presence makes mode controlled. Storage is neither read nor written. */
  mode?: ThemeMode;
  /** Uncontrolled initial preference; a valid saved sessionStorage value takes precedence. */
  defaultMode?: ThemeMode;
  onModeChange?: (mode: ThemeMode) => void;
  /** Defaults to sessionStorage persistence. false uses memory only, e.g. a host bridge. */
  persist?: boolean;
}
export const DEFAULT_STORAGE_KEY = 'ui.theme.mode';
// The default palette starts dark; an explicit saved or controlled preference wins.
const defaultMode: ThemeMode = 'dark';
export function validThemeMode(value: unknown): value is ThemeMode { return ['light', 'dark', 'system'].includes(value as string); }

/** Construct once per document. CSS owns colors; this controller owns mode and palette identity. */
/** Internal factory; public consumers obtain the document/application owner from services.ts. */
export function buildThemeController(options: ThemeOptions = {}): ThemeController {
  const win = options.window === undefined ? (typeof window === 'undefined' ? undefined : window) : options.window;
  const document = win?.document;
  const key = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const controlled = options.mode !== undefined;
  let media: MediaQueryList | undefined;
  try { media = win?.matchMedia?.('(prefers-color-scheme: dark)'); } catch { /* Safe light fallback. */ }
  let mode: ThemeMode = validThemeMode(options.mode) ? options.mode : validThemeMode(options.defaultMode) ? options.defaultMode : defaultMode;
  let preset:ThemePreset=isThemePreset(options.preset)?options.preset:'violet';
  if (!controlled && options.persist !== false) try { const stored = win?.sessionStorage.getItem(key); if (validThemeMode(stored)) mode = stored; } catch { /* Memory choice stays usable. */ }
  let state: Readonly<ThemeState>;
  let destroyed = false;
  let observer:MutationObserver|undefined,observedRoot:Element|null|undefined;
  const listeners = new Set<(state: Readonly<ThemeState>) => void>();
  function observeRoot() {
    if(!observer||!document||observedRoot===document.documentElement)return;
    observer.disconnect();
    observer.observe(document,{childList:true});
    observedRoot=document.documentElement;
    if(observedRoot)observer.observe(observedRoot,{attributes:true,attributeFilter:['data-theme','data-theme-effective','data-theme-preset','data-interface-scale','style']});
  }
  function apply() {
    if (destroyed) return;
    const effective: EffectiveTheme = mode === 'system' ? media?.matches ? 'dark' : 'light' : mode;
    const changed = !state || state.mode !== mode || state.effective !== effective || state.preset!==preset;
    if(changed)state = Object.freeze({ mode, effective, preset });
    const root=document?.documentElement;
    if(win)reapplyInterfaceScale(win);
    if (root) {
      // CSS system media and matchMedia normally agree. When matchMedia fails,
      // force the documented light fallback rather than leaving CSS to guess.
      const projectedMode=mode === 'system' && !media ? 'light' : mode;
      if(root.dataset.theme!==projectedMode)root.dataset.theme = projectedMode;
      if(root.dataset.themeEffective!==effective)root.dataset.themeEffective = effective;
      if(root.dataset.themePreset!==preset)root.dataset.themePreset = preset;
    }
    observeRoot();
    if (changed) listeners.forEach(listener => {try{listener(state);}catch{/* A view subscriber cannot prevent other views or persistence. */}});
  }
  apply();
  let unsubscribeMedia = () => {};
  try {
    if (media?.addEventListener) { media.addEventListener('change',apply); unsubscribeMedia = () => media?.removeEventListener('change',apply); }
    else if (media?.addListener) { media.addListener(apply); unsubscribeMedia = () => media?.removeListener(apply); }
  } catch { /* Initial selection works if listener registration fails. */ }
  try {
    const Observer=(win as (Window&{MutationObserver?:typeof MutationObserver})|undefined)?.MutationObserver;
    if(Observer&&document){observer=new Observer(apply);observeRoot();}
  } catch {observer?.disconnect();observer=undefined;/* Explicit changes still target the current root. */}
  return {
    getState: () => state,
    setMode(value) {
      if (destroyed) return;
      const next = validThemeMode(value) ? value : defaultMode;
      if (controlled) { options.onModeChange?.(next); return; }
      mode = next;
      apply();
      if (options.persist !== false) try { win?.sessionStorage.setItem(key,mode); } catch { /* No logging or retry. */ }
    },
    syncMode(value) { if (!destroyed) { mode = validThemeMode(value) ? value : defaultMode; apply(); } },
    setPreset(value) {if(!destroyed){preset=isThemePreset(value)?value:'violet';apply();}},
    isDestroyed: () => destroyed,
    subscribe(listener) { if (destroyed) return () => {}; listeners.add(listener); return () => { listeners.delete(listener); }; },
    destroy() { if(destroyed)return;destroyed = true; listeners.clear(); observer?.disconnect();observer=undefined;observedRoot=undefined;try { unsubscribeMedia(); } catch { /* No retained subscriptions. */ } },
  };
}

// The bootstrap and all default header views share this document-scoped owner.
declare global {interface Window {xuiTheme?:ThemeController;xuiThemeOptions?:ThemeOptions}}
