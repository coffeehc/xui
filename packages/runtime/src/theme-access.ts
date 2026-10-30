import {registerService} from './service-resolvers.js';
import {buildThemeController,validThemeMode,type ThemeController,type ThemeOptions} from './theme-service.js';
import {browserState,optionsFor,sameValue,type RegistryState} from './service-state.js';
function attachTheme(win:Window,theme:ThemeController){const current=win.xuiTheme;if(current&&!current.isDestroyed()&&current!==theme)throw new Error('The document already has an xui theme owner');win.xuiTheme=theme;}
export function resolveThemeService(state:RegistryState,win:Window|undefined=state.window):ThemeController{
    const entry=state.theme;
    if(entry.value){if(entry.value.isDestroyed()){if(entry.owned)throw new Error('The owned theme service was destroyed outside XuiServices');entry.value=undefined;entry.owned=false;}else return entry.value;}
    const inputOptions=optionsFor(entry);const target=inputOptions?.window===undefined?win:inputOptions.window;
    const existing=target?.xuiTheme;
    if(existing&&!existing.isDestroyed()){
      const configured=target.xuiThemeOptions;
      if(inputOptions&&(!configured||!sameValue(inputOptions,configured)))throw new Error('The document theme differs from the configured theme service');
      entry.value=existing;entry.owned=false;entry.resolvedOptions=(configured??inputOptions) as ThemeOptions|undefined;
      return existing;
    }
    const inherited=target?.xuiThemeOptions;
    const merged={preset:state.config.theme.preset,defaultMode:state.config.theme.mode,persist:state.config.theme.persist,...(inherited??{}),...(inputOptions??{}),window:target??null};
    if(merged.defaultMode!==undefined&&!validThemeMode(merged.defaultMode))throw new TypeError('Invalid theme defaultMode');
    const theme=buildThemeController(merged);entry.value=theme;entry.owned=true;entry.resolvedOptions=inputOptions??inherited;
    if(target)attachTheme(target,theme);
    return theme;
  }
export function getThemeService(win?:Window):ThemeController{return resolveThemeService(browserState(win),win);}

registerService('theme',resolveThemeService);
