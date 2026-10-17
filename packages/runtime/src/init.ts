import {DEFAULT_STORAGE_KEY,type ThemeMode} from './theme-service.js';
import {restoreInterfaceScale} from './interface-scale.js';
import defaults from './config-defaults.js';
import {isThemePreset} from './theme-preset.js';

function validMode(value:unknown):value is ThemeMode{return value==='light'||value==='dark'||value==='system';}

/** Pre-paint only: persistent preference and root attributes. bootstrap owns the controller. */
if(typeof window!=='undefined'){
  const win=window;restoreInterfaceScale(win,defaults.theme.scale as 1);
  const root=win.document.documentElement;
  const options=win.xuiThemeOptions;
  const storageKey=win.document.currentScript?.getAttribute('data-storage-key')||options?.storageKey||DEFAULT_STORAGE_KEY;
  const existing=win.xuiTheme;
  const selectedPreset=existing&&!existing.isDestroyed()?existing.getState().preset:options?.preset;
  root.dataset.themePreset=isThemePreset(selectedPreset)?selectedPreset:defaults.theme.preset;
  let mode:ThemeMode=existing&&!existing.isDestroyed()?existing.getState().mode:validMode(options?.mode)?options.mode:validMode(options?.defaultMode)?options.defaultMode:defaults.theme.mode as ThemeMode;
  if((!existing||existing.isDestroyed())&&options?.mode===undefined&&options?.persist!==false){
    try{const saved=win.sessionStorage.getItem(storageKey);if(validMode(saved))mode=saved;}catch{/* Keep pre-paint usable when storage is unavailable. */}
  }
  let effective:Exclude<ThemeMode,'system'>=mode==='system'?'light':mode,systemAvailable=false;
  if(mode==='system')try{const media=win.matchMedia?.('(prefers-color-scheme: dark)');if(media){systemAvailable=true;effective=media.matches?'dark':'light';}}catch{/* System falls back to light. */}
  root.dataset.theme=mode==='system'&&!systemAvailable?'light':mode;
  root.dataset.themeEffective=effective;
}
