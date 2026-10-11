export type ThemeMode = 'light' | 'dark' | 'system';
export type EffectiveTheme = Exclude<ThemeMode, 'system'>;
export interface ThemeState { mode: ThemeMode; effective: EffectiveTheme }
export interface ThemeController {
  getState(): Readonly<ThemeState>;
  setMode(mode: ThemeMode): void;
  subscribe(listener: (state: Readonly<ThemeState>) => void): () => void;
  destroy(): void;
}
export interface ThemeOptions {
  /** Same key for the pre-paint initializer and the application controller. */
  storageKey?: string;
  /** Inject a window for isolated tests/iframes. Does not touch DOM at import time. */
  window?: Window;
}
export const DEFAULT_STORAGE_KEY = 'ui.theme.mode';
function valid(value: unknown): value is ThemeMode { return value === 'light' || value === 'dark' || value === 'system'; }

/** Construct once per document. CSS owns colors; this controller owns only preference. */
export function createThemeController(options: ThemeOptions = {}): ThemeController {
  const win = options.window ?? (typeof window === 'undefined' ? undefined : window);
  const root = win?.document.documentElement;
  const key = options.storageKey ?? DEFAULT_STORAGE_KEY;
  let media: MediaQueryList | undefined;
  try { media = win?.matchMedia?.('(prefers-color-scheme: dark)'); } catch { /* Safe light fallback. */ }
  let mode: ThemeMode = 'system';
  try { const stored = win?.localStorage.getItem(key); if (valid(stored)) mode = stored; } catch { /* Memory choice stays usable. */ }
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
    if (changed) listeners.forEach(listener => listener(state));
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
      mode = valid(value) ? value : 'system';
      apply();
      try { win?.localStorage.setItem(key,mode); } catch { /* No logging or retry. */ }
    },
    subscribe(listener) { if (destroyed) return () => {}; listeners.add(listener); return () => { listeners.delete(listener); }; },
    destroy() { destroyed = true; listeners.clear(); try { unsubscribeMedia(); } catch { /* No retained subscriptions. */ } },
  };
}
