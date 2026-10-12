import { createThemeController } from './theme.js';

// Build as a small synchronous classic script. Put before CSS and visible body.
// data-storage-key on the script customizes the same preference owner.
if (typeof window !== 'undefined' && (!window.xuiTheme || window.xuiTheme.isDestroyed())) {
  const storageKey = document.currentScript?.getAttribute('data-storage-key') || undefined;
  window.xuiTheme = createThemeController({ ...window.xuiThemeOptions, storageKey: storageKey ?? window.xuiThemeOptions?.storageKey });
}
