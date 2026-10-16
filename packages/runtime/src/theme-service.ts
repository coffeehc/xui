export {setInterfaceScale,type InterfaceScale,type InterfaceScaleOptions} from './interface-scale.js';

export type ThemeMode = 'light' | 'dark' | 'system';
export type EffectiveTheme = Exclude<ThemeMode, 'system'>;
export interface ThemeState { mode: ThemeMode; effective: EffectiveTheme }
export interface ThemeController {
  getState(): Readonly<ThemeState>;
  setMode(mode: ThemeMode): void;
  /** Apply a host-owned mode without writing storage or requesting another change. */
  syncMode(mode: ThemeMode): void;
  isDestroyed(): boolean;
  subscribe(listener: (state: Readonly<ThemeState>) => void): () => void;
  destroy(): void;
}
export interface ThemeOptions {
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
// Precision uses dark by default; an explicit saved or controlled preference wins.
const defaultMode: ThemeMode = 'dark';
function valid(value: unknown): value is ThemeMode { return value === 'light' || value === 'dark' || value === 'system'; }

/** Construct once per document. CSS owns colors; this controller owns only preference. */
/** Internal factory; public consumers obtain the document/application owner from services.ts. */
export function buildThemeController(options: ThemeOptions = {}): ThemeController {
  const win = options.window === undefined ? (typeof window === 'undefined' ? undefined : window) : options.window;
  const root = win?.document.documentElement;
  const key = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const controlled = options.mode !== undefined;
  let media: MediaQueryList | undefined;
  try { media = win?.matchMedia?.('(prefers-color-scheme: dark)'); } catch { /* Safe light fallback. */ }
  let mode: ThemeMode = valid(options.mode) ? options.mode : valid(options.defaultMode) ? options.defaultMode : defaultMode;
  if (!controlled && options.persist !== false) try { const stored = win?.sessionStorage.getItem(key); if (valid(stored)) mode = stored; } catch { /* Memory choice stays usable. */ }
  let state: Readonly<ThemeState>;
  let destroyed = false;
  const listeners = new Set<(state: Readonly<ThemeState>) => void>();
  function apply() {
    if (destroyed) return;
    const effective: EffectiveTheme = mode === 'system' ? media?.matches ? 'dark' : 'light' : mode;
    const changed = !state || state.mode !== mode || state.effective !== effective;
    state = Object.freeze({ mode, effective });
    if (root) {
      // CSS system media and matchMedia normally agree. When matchMedia fails,
      // force the documented light fallback rather than leaving CSS to guess.
      root.dataset.theme = mode === 'system' && !media ? 'light' : mode;
      root.dataset.themeEffective = effective;
    }
    if (changed) listeners.forEach(listener => {try{listener(state);}catch{/* A view subscriber cannot prevent other views or persistence. */}});
  }
  apply();
  let unsubscribeMedia = () => {};
  try {
    if (media?.addEventListener) { media.addEventListener('change',apply); unsubscribeMedia = () => media?.removeEventListener('change',apply); }
    else if (media?.addListener) { media.addListener(apply); unsubscribeMedia = () => media?.removeListener(apply); }
  } catch { /* Initial selection works if listener registration fails. */ }
  return {
    getState: () => state,
    setMode(value) {
      if (destroyed) return;
      const next = valid(value) ? value : defaultMode;
      if (controlled) { options.onModeChange?.(next); return; }
      mode = next;
      apply();
      if (options.persist !== false) try { win?.sessionStorage.setItem(key,mode); } catch { /* No logging or retry. */ }
    },
    syncMode(value) { if (!destroyed) { mode = valid(value) ? value : defaultMode; apply(); } },
    isDestroyed: () => destroyed,
    subscribe(listener) { if (destroyed) return () => {}; listeners.add(listener); return () => { listeners.delete(listener); }; },
    destroy() { if(destroyed)return;destroyed = true; listeners.clear(); try { unsubscribeMedia(); } catch { /* No retained subscriptions. */ } },
  };
}

// The bootstrap and all default header views share this document-scoped owner.
declare global {interface Window {xuiTheme?:ThemeController;xuiThemeOptions?:ThemeOptions}}
