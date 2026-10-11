import { createThemeController } from './index';

declare global { interface Window { xuiTheme?: ReturnType<typeof createThemeController> } }
// Build as a small synchronous classic script. Put before CSS and visible body.
// data-storage-key on the script customizes the same preference owner.
if (typeof window !== 'undefined' && !window.xuiTheme) {
  const storageKey = document.currentScript?.getAttribute('data-storage-key') || undefined;
  window.xuiTheme = createThemeController({ storageKey });
}
