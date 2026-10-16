/** Document-wide reading size. Viewport limits and layout reflow remain active. */
export type InterfaceScale = 1 | 1.25 | 1.5 | 2;
export interface InterfaceScaleOptions {
  /** Target a same-origin document, e.g. an iframe; defaults to the current window. */
  window?: Window;
}
const storageKey = 'ui.interface.scale';
const values: readonly number[] = [1, 1.25, 1.5, 2];
function apply(scale: InterfaceScale, win: Window) {
  const root = win.document.documentElement, value = String(scale);
  if (root.style.getPropertyValue('--interface-scale') !== value) root.style.setProperty('--interface-scale', value);
  if (root.dataset.interfaceScale !== value) root.dataset.interfaceScale = value;
}
/** Set the current document's scale and remember it for this browser tab.
 * The host owns any setting UI. This does not remount views, navigate or fetch data.
 * Storage failure keeps the current document usable; imports and calls are SSR-safe.
 */
export function setInterfaceScale(scale: InterfaceScale, options: InterfaceScaleOptions = {}): void {
  if (!values.includes(scale)) throw new TypeError('Interface scale must be 1, 1.25, 1.5 or 2');
  const win = options.window ?? (typeof window === 'undefined' ? undefined : window);
  if (!win) return;
  apply(scale, win);
  try { win.sessionStorage.setItem(storageKey, String(scale)); } catch { /* Current reading size still applies. */ }
}
/** Internal pre-paint restore, shared by init.js; never writes storage. */
export function restoreInterfaceScale(win: Window, defaultScale:InterfaceScale=1): void {
  let stored: string | null;
  try { stored = win.sessionStorage.getItem(storageKey); } catch { apply(defaultScale,win);return; }
  if (!['1', '1.25', '1.5', '2'].includes(stored ?? '')) {apply(defaultScale,win);return;}
  apply(Number(stored) as InterfaceScale, win);
}
