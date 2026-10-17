import config from './config.json';
import type {XuiConfigOverrides} from '@coffeehc/xui-runtime/config';
import type {ThemeMode,ThemePreset} from '@coffeehc/xui-runtime/theme';
// Query overrides belong only to this comparison demo, not the xui routing contract.
const query=new URLSearchParams(location.search),preset=query.get('preset'),mode=query.get('mode');
const presets:ThemePreset[]=['violet','ember','forest','crimson','cobalt','precision'];
export const projectConfig:XuiConfigOverrides={theme:{
  preset:presets.includes(preset as ThemePreset)?preset as ThemePreset:config.theme.preset as ThemePreset,
  mode:mode==='light'||mode==='dark'||mode==='system'?mode:config.theme.mode as ThemeMode,
}};
